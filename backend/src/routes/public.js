'use strict';

const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { config } = require('../config');
const logger = require('../lib/logger');
const drctService = require('../services/drctService');
const { getAirportAutocomplete } = require('../services/airportAutocompleteService');
const { getDisplayFxSnapshot } = require('../services/displayFxService');
const { createMemoryRateLimiter, hasValidInternalToken } = require('../middleware/requestGuards');
const { lookupCustomerProfile } = require('../services/customerProfile');
const { parseWidgetToken, issueWidgetToken, getRequestOriginHost, normalizeHost, normalizeEmail } = require('../utils/helpers');
const { hexToRgb, darkenHex, getContrastColor, ALL_SERVICES } = require('../services/agencyProvision');
const customerProfileVerification = require('../services/customerProfileVerification');
const { sendCustomerProfileVerificationCode } = require('../services/emailService');
const { OAuth2Client } = require('google-auth-library');

// Verifies Google ID tokens presented by the centralized Google Sign-In
// relay page (aviaframe-site/auth/google.html). A single shared client
// works for every agency/domain — see config.googleClientId for why.
const googleAuthClient = new OAuth2Client();

const PUBLIC_SEARCH_CACHE_TTL_MS = Number(process.env.PUBLIC_SEARCH_CACHE_TTL_MS || 90 * 1000);
const PUBLIC_SEARCH_MAX_PAIRS = Number(process.env.PUBLIC_SEARCH_MAX_PAIRS || 25);
const PUBLIC_SEARCH_CONCURRENCY = Number(process.env.PUBLIC_SEARCH_CONCURRENCY || 5);
const searchCache = new Map();
const AGENCY_CONTENT_CACHE_TTL_MS = Number(process.env.PUBLIC_AGENCY_CONTENT_CACHE_TTL_MS || 30 * 1000);
const agencyContentCache = new Map();
const publicAgencyContentRateLimiter = createMemoryRateLimiter({
  bucket: 'public-agency-content',
  max: config.publicAutocompleteRateLimitMax,
  windowMs: config.publicRateLimitWindowMs,
  skip: hasValidInternalToken,
});
const publicAutocompleteRateLimiter = createMemoryRateLimiter({
  bucket: 'public-autocomplete',
  max: config.publicAutocompleteRateLimitMax,
  windowMs: config.publicRateLimitWindowMs,
  skip: hasValidInternalToken,
});
const publicSearchRateLimiter = createMemoryRateLimiter({
  bucket: 'public-search',
  max: config.publicSearchRateLimitMax,
  windowMs: config.publicRateLimitWindowMs,
  skip: hasValidInternalToken,
});

function normalizeCodeList(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean);
}

function buildSearchCacheKey(params) {
  return JSON.stringify(params);
}

function getCachedSearch(key) {
  const entry = searchCache.get(key);
  if (!entry) return null;
  if ((Date.now() - entry.createdAt) > PUBLIC_SEARCH_CACHE_TTL_MS) {
    searchCache.delete(key);
    return null;
  }
  return entry.payload;
}

function setCachedSearch(key, payload) {
  searchCache.set(key, {
    createdAt: Date.now(),
    payload,
  });
}

router.get('/fx-rates', async (_req, res) => {
  try {
    return res.json(await getDisplayFxSnapshot());
  } catch (error) {
    logger.error({ err: error.message }, 'public-fx-rates failed');
    return res.status(500).json({
      error: {
        code: 'FX_RATES_UNAVAILABLE',
        message: config.nodeEnv === 'development' ? error.message : 'Display FX rates are temporarily unavailable',
      }
    });
  }
});

function dedupeOffers(offers) {
  const seen = new Map();
  for (const offer of offers) {
    const key = offer.offer_id || [
      offer.origin,
      offer.destination,
      offer.departure_time,
      offer.arrival_time,
      offer.airline_code,
      offer.flight_number,
      offer.price?.total,
    ].join('|');

    if (!seen.has(key)) {
      seen.set(key, offer);
    }
  }
  return Array.from(seen.values()).sort((a, b) => Number(a?.price?.total || 0) - Number(b?.price?.total || 0));
}

async function runWithConcurrency(items, limit, worker) {
  const results = [];
  for (let index = 0; index < items.length; index += limit) {
    const chunk = items.slice(index, index + limit);
    const chunkResults = await Promise.all(chunk.map(worker));
    results.push(...chunkResults);
  }
  return results;
}

async function saveSearchRecord({
  tenantId,
  origin,
  destination,
  departDate,
  returnDate,
  adults,
  children,
  infants,
  cabinClass,
  offersCount,
  searchDuration,
  metadata = {}
}) {
  try {
    const { data } = await supabase
      .from('searches')
      .insert([
        {
          tenant_id: tenantId,
          origin,
          destination,
          depart_date: departDate,
          return_date: returnDate,
          adults,
          children,
          infants,
          cabin_class: cabinClass,
          offers_count: offersCount,
          search_duration_ms: searchDuration,
          source: 'api',
          metadata,
        }
      ])
      .select()
      .single();
    return data || null;
  } catch (error) {
    logger.warn({ err: error.message }, 'public-search failed to save search record');
    return null;
  }
}

router.get('/airports/autocomplete', publicAutocompleteRateLimiter, async (req, res) => {
  const query = String(req.query.q || '').trim();
  const locale = String(req.query.locale || 'en').trim().toLowerCase();
  const limit = Number(req.query.limit || 12);

  if (!query) {
    return res.status(400).json({
      error: {
        code: 'INVALID_INPUT',
        message: 'q is required',
      }
    });
  }

  try {
    const payload = await getAirportAutocomplete({ query, locale, limit });
    return res.json(payload);
  } catch (error) {
    logger.error({ err: error.message, query }, 'airport-autocomplete failed');
    return res.status(502).json({
      error: {
        code: 'AUTOCOMPLETE_FAILED',
        message: config.nodeEnv === 'development' ? error.message : 'Autocomplete is temporarily unavailable'
      }
    });
  }
});

// POST /search (mounted at /public)
router.post('/search', publicSearchRateLimiter, async (req, res) => {
  const startTime = Date.now();

  // Extract search parameters
  const {
    origin,
    destination,
    depart_date,
    return_date,
    adults = 1,
    children = 0,
    infants = 0,
    cabin_class = 'economy',
    origin_city = null,
    destination_city = null,
    tenant_id // For demo, we'll use a default tenant if not provided
  } = req.body || {};

  // Validation
  if (!origin || !destination) {
    return res.status(400).json({
      error: {
        code: 'INVALID_INPUT',
        message: 'origin and destination are required',
        details: { missing: !origin ? 'origin' : 'destination' }
      }
    });
  }

  try {
    // Use demo tenant ID if not provided (from .env)
    const searchTenantId = tenant_id || process.env.DEMO_TENANT_ID;
    const originCodes = normalizeCodeList(origin);
    const destinationCodes = normalizeCodeList(destination);

    if (!originCodes.length || !destinationCodes.length) {
      return res.status(400).json({
        error: {
          code: 'INVALID_INPUT',
          message: 'origin and destination must contain at least one valid airport code'
        }
      });
    }

    if (!config.publicSearchDrctEnabled) {
      const mockOffers = [];
      const searchDuration = Date.now() - startTime;
      const searchRecord = await saveSearchRecord({
        tenantId: searchTenantId,
        origin: originCodes[0],
        destination: destinationCodes[0],
        departDate: depart_date,
        returnDate: return_date,
        adults,
        children,
        infants,
        cabinClass: cabin_class,
        offersCount: mockOffers.length,
        searchDuration,
        metadata: {
          user_agent: req.headers['user-agent'],
          ip: req.ip,
          origin_city,
          destination_city,
          fanout_disabled: true,
          origin_airports: originCodes,
          destination_airports: destinationCodes,
        }
      });

      return res.json({
        search_id: searchRecord?.id || `search-${Date.now()}`,
        origin: originCodes[0],
        destination: destinationCodes[0],
        origin_city,
        destination_city,
        origin_airports: originCodes,
        destination_airports: destinationCodes,
        depart_date,
        return_date,
        adults,
        children,
        infants,
        cabin_class,
        offers: mockOffers,
        offers_count: mockOffers.length,
        message: 'DRCT public search is disabled. Placeholder response preserved until feature flag is enabled.',
        partial: false,
        saved_to_db: Boolean(searchRecord)
      });
    }

    const pairs = [];
    for (const originCode of originCodes) {
      for (const destinationCode of destinationCodes) {
        pairs.push({ origin: originCode, destination: destinationCode });
      }
    }

    if (pairs.length > PUBLIC_SEARCH_MAX_PAIRS) {
      return res.status(400).json({
        error: {
          code: 'FANOUT_LIMIT_EXCEEDED',
          message: `Too many airport pairs requested: ${pairs.length}. Maximum is ${PUBLIC_SEARCH_MAX_PAIRS}.`
        }
      });
    }

    const cacheKey = buildSearchCacheKey({
      originCodes,
      destinationCodes,
      depart_date,
      return_date,
      adults,
      children,
      infants,
      cabin_class,
    });
    const cached = getCachedSearch(cacheKey);
    if (cached) {
      return res.json({ ...cached, cached: true });
    }

    const pairResults = await runWithConcurrency(pairs, PUBLIC_SEARCH_CONCURRENCY, async (pair) => {
      const result = await drctService.searchOffers({
        origin: pair.origin,
        destination: pair.destination,
        depart_date,
        return_date,
        adults,
        children,
        infants,
        cabin_class,
      }, searchTenantId);

      if (!result?.success) {
        return {
          pair,
          success: false,
          error: result?.error?.message || 'Search failed',
          offers: [],
        };
      }

      const rawOffers = Array.isArray(result.data?.offers) ? result.data.offers : [];
      return {
        pair,
        success: true,
        offers: rawOffers.map((offer) => {
          const bags = Array.isArray(offer.baggage) ? offer.baggage : [];
          // drctDirectClient already sets with_baggage correctly; compute as fallback
          const withBaggage = typeof offer.with_baggage === 'boolean'
            ? offer.with_baggage
            : bags.some((b) => b?.type === 'checked' && Number(b?.quantity || 0) > 0);
          const checkedBag = bags.find((b) => b?.type === 'checked') || bags[0];
          const baggageText = offer.baggage_text || (withBaggage
            ? (checkedBag?.quantity ? `${checkedBag.quantity} PC` : 'Included')
            : null);
          return {
            ...offer,
            with_baggage: withBaggage,
            baggage_text: baggageText,
            _searchOrigin: pair.origin,
            _searchDestination: pair.destination,
            _searchReturnDate: return_date || null,
          };
        }),
      };
    });

    const successes = pairResults.filter((entry) => entry.success);
    const failures = pairResults.filter((entry) => !entry.success);
    const mergedOffers = dedupeOffers(successes.flatMap((entry) => entry.offers));
    const partial = failures.length > 0;
    const searchDuration = Date.now() - startTime;

    if (!successes.length) {
      logger.error({ failures }, 'public-search all fanout calls failed');
      return res.status(503).json({
        error: {
          code: 'PUBLIC_SEARCH_FAILED',
          message: 'All provider search calls failed',
          details: { pair_failures: failures }
        }
      });
    }

    const searchRecord = await saveSearchRecord({
      tenantId: searchTenantId,
      origin: originCodes[0],
      destination: destinationCodes[0],
      departDate: depart_date,
      returnDate: return_date,
      adults,
      children,
      infants,
      cabinClass: cabin_class,
      offersCount: mergedOffers.length,
      searchDuration,
      metadata: {
        user_agent: req.headers['user-agent'],
        ip: req.ip,
        origin_city,
        destination_city,
        origin_airports: originCodes,
        destination_airports: destinationCodes,
        pair_count: pairs.length,
        partial,
        pair_failures: failures,
      }
    });

    const payload = {
      search_id: searchRecord?.id || `search-${Date.now()}`,
      origin: originCodes[0],
      destination: destinationCodes[0],
      origin_city,
      destination_city,
      origin_airports: originCodes,
      destination_airports: destinationCodes,
      depart_date,
      return_date,
      adults,
      children,
      infants,
      cabin_class,
      offers: mergedOffers,
      offers_count: mergedOffers.length,
      partial,
      pair_count: pairs.length,
      pair_failures: failures,
      saved_to_db: Boolean(searchRecord)
    };

    setCachedSearch(cacheKey, payload);

    res.json({
      ...payload,
      cached: false,
    });

  } catch (err) {
    logger.error({ err: err.message }, 'public-search endpoint error');
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: config.nodeEnv === 'development' ? err.message : 'Internal server error'
      }
    });
  }
});

const profileLookupLimiter = createMemoryRateLimiter({
  bucket: 'public-profile-lookup',
  max: 3,
  windowMs: 60_000,
});

function extractWidgetToken(req) {
  const authHeader = String(req.headers.authorization || '').trim();
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  return String(req.query.widget_token || req.body?.widget_token || '').trim();
}

// Shared widget-session validation used by all three customer-profile
// endpoints below. Returns { agencyId } on success, or writes the
// appropriate 401/403 response and returns null.
function requireValidWidgetSession(req, res) {
  const widgetToken = extractWidgetToken(req);
  if (!widgetToken) {
    res.status(401).json({
      error: { code: 'WIDGET_TOKEN_REQUIRED', message: 'A valid widget session token is required' }
    });
    return null;
  }

  const parsed = parseWidgetToken(widgetToken);
  if (parsed.error || parsed.payload?.typ !== 'widget_session' || !parsed.payload?.agency_id) {
    res.status(401).json({
      error: { code: 'INVALID_WIDGET_TOKEN', message: 'Invalid or expired widget session token' }
    });
    return null;
  }

  const requestHost = getRequestOriginHost(req);
  const tokenHost = normalizeHost(parsed.payload.origin_host || '');
  if (requestHost && tokenHost && requestHost !== tokenHost) {
    res.status(403).json({
      error: { code: 'WIDGET_ORIGIN_MISMATCH', message: 'Widget token origin does not match request origin' }
    });
    return null;
  }

  return { agencyId: parsed.payload.agency_id };
}

const CUSTOMER_PROFILE_VERIFIED_TYP = 'customer_profile_verified';
const CUSTOMER_PROFILE_VERIFIED_TOKEN_TTL_SEC = 30 * 24 * 60 * 60; // 30 days

function issueCustomerProfileVerifiedToken({ agencyId, email }) {
  return issueWidgetToken({
    typ: CUSTOMER_PROFILE_VERIFIED_TYP,
    agency_id: agencyId,
    email,
    exp: Math.floor(Date.now() / 1000) + CUSTOMER_PROFILE_VERIFIED_TOKEN_TTL_SEC
  });
}

function extractVerifiedProfileToken(req) {
  return String(req.query.verified_token || req.body?.verified_token || '').trim();
}

async function fetchProfileForVerifiedEmail(agencyId, email) {
  const profile = await lookupCustomerProfile({ agencyId, email });
  if (!profile) return { found: false };
  return {
    found: true,
    profile: {
      first_name: profile.first_name,
      last_name: profile.last_name,
      phone: profile.phone,
      gender: profile.gender,
      date_of_birth: profile.date_of_birth,
      passport_number: profile.passport_number,
      passport_expiry: profile.passport_expiry,
      nationality: profile.nationality,
    },
  };
}

const requestCodeLimiter = createMemoryRateLimiter({
  bucket: 'public-profile-request-code',
  max: 5,
  windowMs: 60_000,
});

// POST /public/customer-profile/request-code
// Body: { email, widget_token }
// Sends a one-time 6-digit code to the given email. Always responds
// generically (does not reveal whether a profile exists for that email) to
// avoid turning this into an email-existence oracle.
router.post('/customer-profile/request-code', requestCodeLimiter, async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');

  const session = requireValidWidgetSession(req, res);
  if (!session) return;

  const email = normalizeEmail(req.body?.email || req.query.email);
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: { code: 'INVALID_EMAIL', message: 'A valid email is required' } });
  }

  if (!customerProfileVerification.canSendCode(session.agencyId, email)) {
    return res.status(429).json({
      error: { code: 'TOO_MANY_REQUESTS', message: 'Too many verification codes requested for this email. Please try again later.' }
    });
  }

  try {
    const code = customerProfileVerification.issueVerificationCode(session.agencyId, email);
    const emailResult = await sendCustomerProfileVerificationCode({ to: email, code });
    if (!emailResult.sent) {
      logger.error({ reason: emailResult.error }, 'customer-profile verification email failed to send');
      return res.status(503).json({
        error: { code: 'EMAIL_DELIVERY_FAILED', message: 'Could not send the verification email right now. Please try again shortly.' }
      });
    }
    return res.json({ sent: true });
  } catch (err) {
    logger.error({ err: err.message }, 'customer-profile request-code failed');
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
  }
});

// POST /public/customer-profile/verify-code
// Body: { email, widget_token, code }
// Verifies the one-time code. On success, returns the saved profile (if any)
// plus a signed verified_token the client can reuse on later visits to skip
// the code step again for this email/device.
router.post('/customer-profile/verify-code', profileLookupLimiter, async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');

  const session = requireValidWidgetSession(req, res);
  if (!session) return;

  const email = normalizeEmail(req.body?.email || req.query.email);
  const code = String(req.body?.code || '').trim();
  if (!email || !email.includes('@') || !code) {
    return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'email and code are required' } });
  }

  const result = customerProfileVerification.verifyCode(session.agencyId, email, code);
  if (!result.valid) {
    const statusByReason = { TOO_MANY_ATTEMPTS: 429 };
    return res.status(statusByReason[result.reason] || 401).json({
      error: { code: `VERIFICATION_${result.reason}`, message: 'The verification code is invalid or has expired.' }
    });
  }

  try {
    const profileResult = await fetchProfileForVerifiedEmail(session.agencyId, email);
    const verifiedToken = issueCustomerProfileVerifiedToken({ agencyId: session.agencyId, email });
    return res.json({ ...profileResult, verified_token: verifiedToken });
  } catch (err) {
    logger.error({ err: err.message }, 'customer-profile verify-code lookup failed');
    return res.json({ found: false, verified_token: issueCustomerProfileVerifiedToken({ agencyId: session.agencyId, email }) });
  }
});

const verifyGoogleLimiter = createMemoryRateLimiter({
  bucket: 'public-profile-verify-google',
  max: 10,
  windowMs: 60_000,
});

// POST /public/customer-profile/verify-google
// Body: { credential, widget_token }
// `credential` is the Google ID token obtained by the centralized Google
// Sign-In relay page (aviaframe-site/auth/google.html) and handed back to
// the widget's own page via postMessage — see that file for the flow. This
// request is always made from the WIDGET's own origin (same as
// request-code/verify-code above), never from the relay page itself, so
// the existing requireValidWidgetSession tenant/origin checks apply
// unchanged. Verifying the token proves the visitor owns the Google
// account for that email; from there this behaves exactly like a
// successful verify-code — same profile shape, same verified_token.
router.post('/customer-profile/verify-google', verifyGoogleLimiter, async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');

  const session = requireValidWidgetSession(req, res);
  if (!session) return;

  if (!config.googleClientId) {
    logger.error('customer-profile verify-google called but GOOGLE_CLIENT_ID is not configured');
    return res.status(503).json({
      error: { code: 'GOOGLE_SIGNIN_NOT_CONFIGURED', message: 'Google sign-in is not available right now' }
    });
  }

  const credential = String(req.body?.credential || '').trim();
  if (!credential) {
    return res.status(400).json({ error: { code: 'INVALID_CREDENTIAL', message: 'A Google credential is required' } });
  }

  let payload;
  try {
    const ticket = await googleAuthClient.verifyIdToken({ idToken: credential, audience: config.googleClientId });
    payload = ticket.getPayload();
  } catch (err) {
    logger.warn({ err: err.message }, 'customer-profile verify-google: token verification failed');
    return res.status(401).json({ error: { code: 'INVALID_CREDENTIAL', message: 'Could not verify this Google sign-in' } });
  }

  if (!payload || !payload.email || payload.email_verified !== true) {
    return res.status(401).json({ error: { code: 'INVALID_CREDENTIAL', message: 'Could not verify this Google sign-in' } });
  }

  const email = normalizeEmail(payload.email);

  try {
    const profileResult = await fetchProfileForVerifiedEmail(session.agencyId, email);
    const verifiedToken = issueCustomerProfileVerifiedToken({ agencyId: session.agencyId, email });
    return res.json({ ...profileResult, email, verified_token: verifiedToken });
  } catch (err) {
    logger.error({ err: err.message }, 'customer-profile verify-google lookup failed');
    return res.json({ found: false, email, verified_token: issueCustomerProfileVerifiedToken({ agencyId: session.agencyId, email }) });
  }
});

// GET /public/customer-profile?email=X&widget_token=Y&verified_token=Z
// Used by the widget to autofill the passenger form for a RETURNING customer
// who has already completed the request-code/verify-code handshake on this
// device (verified_token proves that). A widget session token alone is not
// proof of email ownership, so it is no longer sufficient on its own — see
// requireValidWidgetSession above and the two endpoints before this one.
router.get('/customer-profile', profileLookupLimiter, async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');

  const session = requireValidWidgetSession(req, res);
  if (!session) return;

  const email = normalizeEmail(req.query.email);
  if (!email) {
    return res.status(400).json({ error: { code: 'INVALID_EMAIL', message: 'A valid email is required' } });
  }

  const verifiedToken = extractVerifiedProfileToken(req);
  if (!verifiedToken) {
    return res.status(401).json({
      error: { code: 'VERIFICATION_REQUIRED', message: 'Email verification is required before this profile can be returned' }
    });
  }

  const parsedVerified = parseWidgetToken(verifiedToken);
  if (
    parsedVerified.error
    || parsedVerified.payload?.typ !== CUSTOMER_PROFILE_VERIFIED_TYP
    || parsedVerified.payload?.agency_id !== session.agencyId
    || normalizeEmail(parsedVerified.payload?.email) !== email
  ) {
    return res.status(401).json({
      error: { code: 'VERIFICATION_REQUIRED', message: 'Email verification is required before this profile can be returned' }
    });
  }

  try {
    const profileResult = await fetchProfileForVerifiedEmail(session.agencyId, email);
    return res.json(profileResult);
  } catch (err) {
    logger.error({ err: err.message }, 'customer-profile lookup failed');
    return res.json({ found: false });
  }
});

// ── Agency public content (for content-hydrate.js — see agencyProvision.js) ────
// Returns the same derived text/theme/services values the static site
// generator bakes into HTML at deploy time, computed live from the agency's
// current settings. This lets a deployed agency site pick up content edits
// (colors/logo/phone/about/etc.) on next page load WITHOUT a Netlify
// redeploy — only domain changes / template upgrades still need one.
function normalizeSocialUrl(value, baseUrl) {
  if (!value) return '';
  const v = String(value).trim().replace(/^@/, '');
  if (!v) return '';
  if (/^https?:\/\//i.test(v)) return v;
  if (v.includes('/')) return `https://${v}`;
  return `${baseUrl}/${v}`;
}

function getAgencyContentCacheKey(subdomain) {
  return `agency-content:${subdomain}`;
}

router.get('/agencies/:subdomain/content', publicAgencyContentRateLimiter, async (req, res) => {
  const subdomain = normalizeHost(req.params.subdomain || '').split('.')[0];
  if (!subdomain) {
    return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'subdomain is required' } });
  }

  const cacheKey = getAgencyContentCacheKey(subdomain);
  const cached = agencyContentCache.get(cacheKey);
  if (cached && (Date.now() - cached.createdAt) < AGENCY_CONTENT_CACHE_TTL_MS) {
    return res.json(cached.payload);
  }

  try {
    const domain = `${subdomain}.aviaframe.com`;
    const { data: agency, error } = await supabase
      .from('agencies')
      .select('id,name,address,contact_email,contact_phone,is_active,settings')
      .eq('domain', domain)
      .limit(1)
      .maybeSingle();

    if (error) {
      return res.status(500).json({ error: { code: 'QUERY_FAILED', message: error.message } });
    }
    if (!agency || !agency.is_active) {
      return res.status(404).json({ error: { code: 'AGENCY_NOT_FOUND', message: 'Agency not found' } });
    }

    const site = agency.settings?.site || {};
    const brandColor = site.brand_color || '#1a3c8e';
    const accentColor = site.accent_color || '#2468c4';
    const headerBg = site.header_bg || '';
    const footerBg = site.footer_bg || '';
    const effectiveHeaderBg = headerBg || 'rgba(255,255,255,0.97)';
    const effectiveFooterBg = footerBg || brandColor;
    const headerLogoColor = (headerBg && getContrastColor(headerBg) === '#ffffff') ? '#ffffff' : brandColor;

    const defaultServices = ['flights_domestic', 'flights_intl', 'hotels', 'visa', 'insurance', 'umrah', 'tours', 'corporate'];
    const activeServiceKeys = Array.isArray(site.services) && site.services.length > 0 ? site.services : defaultServices;
    const services = ALL_SERVICES.filter((s) => activeServiceKeys.includes(s.key));

    const agencyName = agency.name || '';
    const agencyNameAr = site.name_ar || '';

    const payload = {
      agency_name: agencyName,
      agency_name_ar: agencyNameAr,
      logo_url: site.logo_url || '',
      logo_initial: (agencyName || 'A').charAt(0).toUpperCase(),
      contact_phone: agency.contact_phone || '',
      contact_phone2: site.contact_phone2 || '',
      whatsapp_phone: site.whatsapp_phone || '',
      contact_email: agency.contact_email || '',
      address: agency.address || '',
      working_hours: site.working_hours || '',
      working_hours_ar: site.working_hours_ar || '',
      social: {
        instagram: normalizeSocialUrl(site.instagram, 'https://www.instagram.com'),
        twitter: normalizeSocialUrl(site.twitter, 'https://x.com'),
        snapchat: normalizeSocialUrl(site.snapchat, 'https://www.snapchat.com/add'),
        facebook: normalizeSocialUrl(site.facebook, 'https://www.facebook.com')
      },
      hero_tagline: site.hero_tagline || 'Book Flights Worldwide at the Best Prices',
      hero_description: site.hero_description || 'Compare hundreds of airlines. Secure booking. Real travel agents available 24/7.',
      hero_image_url: site.hero_image_url || '',
      about_en: site.about_en || `${agencyName} is your trusted travel partner. Our professional team offers flight bookings, hotel reservations, visa assistance, and full travel packages for individuals, families, and corporate clients — with personal service you can count on.`,
      about_ar: site.about_ar || `${agencyNameAr || agencyName} هي شريككم الموثوق في السفر.`,
      services: services.map((s) => ({ key: s.key, en: s.en, ar: s.ar })),
      supervisor_name: site.supervisor_name || '',
      supervisor_email: site.supervisor_email || '',
      default_language: agency.settings?.language === 'ar' ? 'ar' : 'en',
      default_display_currency: ['SAR', 'USD', 'EUR'].includes(String(site.default_display_currency || '').toUpperCase())
        ? String(site.default_display_currency).toUpperCase()
        : 'SAR',
      ga_measurement_id: site.ga_measurement_id || '',
      meta_pixel_id: site.meta_pixel_id || '',
      theme: {
        brand_color: brandColor,
        accent_color: accentColor,
        brand_dark: darkenHex(brandColor, 45),
        brand_rgb: hexToRgb(brandColor),
        accent_rgb: hexToRgb(accentColor),
        header_bg: effectiveHeaderBg,
        header_text: getContrastColor(headerBg || '#ffffff'),
        header_logo: headerLogoColor,
        footer_bg: effectiveFooterBg
      }
    };

    agencyContentCache.set(cacheKey, { createdAt: Date.now(), payload });
    res.set('Cache-Control', 'public, max-age=15');
    return res.json(payload);
  } catch (err) {
    logger.error({ err: err.message }, 'agency content-hydrate lookup failed');
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
  }
});

module.exports = router;

// Exposed so PATCH /api/agency/me/content (routes/agency.js) can purge a
// subdomain's cached payload immediately after a self-service content save,
// instead of making the agency wait out AGENCY_CONTENT_CACHE_TTL_MS.
module.exports.invalidateAgencyContentCache = function invalidateAgencyContentCache(subdomain) {
  agencyContentCache.delete(getAgencyContentCacheKey(subdomain));
};
