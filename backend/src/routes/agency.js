'use strict';

const express = require('express');
const router = express.Router();
const multer = require('multer');
const crypto = require('crypto');
const supabase = require('../lib/supabase');
const { config } = require('../config');
const { resolveAuthContext, forbidden, ensureStaff, ensureAdmin } = require('../middleware/auth');

// Self-service image uploads (logo, hero background): 5MB cap, image
// mimetypes only. Rejecting anything else here (rather than trusting the
// client) closes the gap where a mislabeled non-image file could slip
// through.
const ALLOWED_IMAGE_MIMETYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_IMAGE_MIMETYPES.has(file.mimetype)) {
      return cb(new Error('Only PNG, JPG, WebP or SVG images are allowed'));
    }
    cb(null, true);
  }
});

// Runs multer directly (bypassing the app-wide error handler, which hides
// error.message outside development) so a rejected file gets a specific,
// safe-to-show reason back to the agent instead of a generic 500.
function uploadSingleImage(req, res, next) {
  upload.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: { code: 'INVALID_FILE', message: err.message } });
    }
    next();
  });
}
const {
  generateAgencySiteFiles,
  buildAgencyDeployFiles,
  deployToNetlify,
  addGodaddyCname,
  ALL_SERVICES
} = require('../services/agencyProvision');
const {
  buildAgencyOnboardingState,
  buildAgencyDeployState,
  applyAgencyOnboardingState,
  assertAgencyDeployAllowed,
  markAgencyDeployStarted,
  markAgencyDeployFinished
} = require('../services/agencyOnboardingService');

const AGENCY_SELECT = 'id,name,domain,api_key,contact_email,contact_phone,country,address,is_active,commission_rate,settings,created_at,updated_at';

function getActorLabel(auth) {
  return auth?.profile?.email || auth?.user?.email || 'system';
}

function withAgencyLifecycle(agency) {
  if (!agency) return agency;
  const snapshot = {
    ...agency,
    settings: agency.settings || {}
  };
  return {
    ...snapshot,
    onboarding_state: buildAgencyOnboardingState(snapshot),
    deploy_state: buildAgencyDeployState(snapshot)
  };
}

function publicRouteErrorMessage(err, statusCode) {
  if (!err) return 'Internal server error';
  if (statusCode < 500) return err.message || 'Request failed';
  return config.nodeEnv === 'development' ? err.message : 'Internal server error';
}

async function loadAgencyForStaff(auth) {
  const normalizedAgencyId = String(auth?.profile?.agency_id || '').trim();
  const normalizedUserEmail = String(auth?.user?.email || auth?.profile?.email || '').trim().toLowerCase();
  if (!normalizedAgencyId && !normalizedUserEmail) {
    return { agency: null, error: null, fallbackUsed: false };
  }

  if (normalizedAgencyId) {
    const { data: exactAgency, error: exactError } = await supabase
      .from('agencies')
      .select(AGENCY_SELECT)
      .eq('id', normalizedAgencyId)
      .maybeSingle();

    if (exactError) {
      return { agency: null, error: exactError, fallbackUsed: false };
    }
    if (exactAgency) {
      return { agency: exactAgency, error: null, fallbackUsed: false };
    }
  }

  const { data: allAgencies, error: fallbackError } = await supabase
    .from('agencies')
    .select(AGENCY_SELECT)
    .order('updated_at', { ascending: false })
    .limit(500);

  if (fallbackError) {
    return { agency: null, error: fallbackError, fallbackUsed: false };
  }

  const agencies = Array.isArray(allAgencies) ? allAgencies : [];
  const fallbackAgency = agencies.find((candidate) => {
    const candidateId = String(candidate?.id || '').trim();
    const candidateEmail = String(candidate?.contact_email || '').trim().toLowerCase();
    return (
      (normalizedAgencyId && candidateId === normalizedAgencyId) ||
      (normalizedUserEmail && candidateEmail && candidateEmail === normalizedUserEmail)
    );
  }) || null;

  return {
    agency: fallbackAgency,
    error: null,
    fallbackUsed: Boolean(fallbackAgency)
  };
}

function buildGeneratedAgencySite({ agency, cleanSubdomain }) {
  const siteSettings = agency.settings?.site || {};
  return generateAgencySiteFiles({
    agencyName: agency.name,
    agencyNameAr: siteSettings.name_ar || '',
    subdomain: cleanSubdomain,
    apiKey: agency.api_key,
    contactEmail: agency.contact_email || '',
    contactPhone: agency.contact_phone || '',
    contactPhone2: siteSettings.contact_phone2 || '',
    whatsappPhone: siteSettings.whatsapp_phone || '',
    brandColor: siteSettings.brand_color || '#1a3c8e',
    accentColor: siteSettings.accent_color || '#2468c4',
    supervisorName: siteSettings.supervisor_name || '',
    supervisorEmail: siteSettings.supervisor_email || '',
    language: agency.settings?.language || 'en',
    logoUrl: siteSettings.logo_url || '',
    aboutEn: siteSettings.about_en || '',
    aboutAr: siteSettings.about_ar || '',
    address: agency.address || '',
    workingHours: siteSettings.working_hours || '',
    workingHoursAr: siteSettings.working_hours_ar || '',
    licenseNumber: siteSettings.license_number || '',
    iataNumber: siteSettings.iata_number || '',
    foundedYear: siteSettings.founded_year || '',
    googleMapsUrl: siteSettings.google_maps_url || '',
    instagram: siteSettings.instagram || '',
    twitter: siteSettings.twitter || '',
    snapchat: siteSettings.snapchat || '',
    facebook: siteSettings.facebook || '',
    services: Array.isArray(siteSettings.services) ? siteSettings.services : [],
    heroTagline: siteSettings.hero_tagline || '',
    heroDescription: siteSettings.hero_description || '',
    destinations: Array.isArray(siteSettings.destinations) ? siteSettings.destinations : [],
    reviews: Array.isArray(siteSettings.reviews) ? siteSettings.reviews : [],
    featuredAirlines: Array.isArray(siteSettings.featured_airlines) ? siteSettings.featured_airlines : [],
    heroImageUrl: siteSettings.hero_image_url || '',
    headerBg: siteSettings.header_bg || '',
    footerBg: siteSettings.footer_bg || ''
  });
}

async function persistAgencySettings(agencyId, settings) {
  return supabase
    .from('agencies')
    .update({
      settings,
      updated_at: new Date().toISOString()
    })
    .eq('id', agencyId)
    .select(AGENCY_SELECT)
    .single();
}

async function runAgencySiteDeploy({ agency, auth, enforceReady = false }) {
  if (enforceReady) {
    const onboarding = buildAgencyOnboardingState(agency);
    if (!onboarding.publish_ready) {
      const err = new Error('Complete the onboarding checklist before publishing the agency site.');
      err.code = 'AGENCY_ONBOARDING_INCOMPLETE';
      throw err;
    }
  }

  assertAgencyDeployAllowed(agency);

  const actor = getActorLabel(auth);
  const startedSettings = markAgencyDeployStarted({
    agency,
    settings: agency.settings || {},
    actor
  });
  const { data: startedAgency, error: startedError } = await persistAgencySettings(agency.id, startedSettings);
  if (startedError || !startedAgency) {
    const err = new Error(startedError?.message || 'Failed to lock agency deploy state');
    err.code = 'AGENCY_DEPLOY_LOCK_FAILED';
    throw err;
  }

  let rawDomain = String(startedAgency.domain || '').trim().toLowerCase()
    .replace(/^https?:\/\//i, '')
    .replace(/\/.*$/, '');
  // Auto-correct bare subdomain stored without .aviaframe.com suffix
  if (rawDomain && !rawDomain.includes('.')) {
    rawDomain = `${rawDomain}.aviaframe.com`;
  }
  const domain = rawDomain;
  const subdomainMatch = domain.match(/^([a-z0-9-]+)\.aviaframe\.com$/i);
  if (!subdomainMatch) {
    const failedSettings = markAgencyDeployFinished({
      agency: startedAgency,
      settings: startedAgency.settings || {},
      actor,
      success: false,
      errorMessage: 'Only *.aviaframe.com agency sites can be deployed automatically right now'
    });
    await persistAgencySettings(startedAgency.id, failedSettings);
    const err = new Error('Only *.aviaframe.com agency sites can be deployed automatically right now');
    err.code = 'UNSUPPORTED_DOMAIN';
    throw err;
  }

  const cleanSubdomain = subdomainMatch[1];

  // Always rebuild the landing from the latest agency settings so logo,
  // colors, contact blocks and other customization changes actually land.
  const generatedSite = buildGeneratedAgencySite({ agency: startedAgency, cleanSubdomain });
  const landingHtml = generatedSite.html;
  const landingCss = generatedSite.css;

  try {
    const deployResult = await deployToNetlify({
      subdomain: cleanSubdomain,
      files: buildAgencyDeployFiles({
        subdomain: cleanSubdomain,
        apiKey: startedAgency.api_key,
        landingHtml,
        landingCss
      })
    });

    // Self-service publish must also keep the agency DNS alias in sync.
    try {
      await addGodaddyCname({
        subdomain: cleanSubdomain,
        netlifyAppName: `aviaframe-${cleanSubdomain}`
      });
    } catch (dnsErr) {
      console.warn(`[agency deploy] CNAME upsert failed for ${cleanSubdomain}:`, dnsErr.message);
    }

    const finishedSettings = markAgencyDeployFinished({
      agency: startedAgency,
      settings: startedAgency.settings || {},
      actor,
      success: true
    });
    if (!finishedSettings.deploy) finishedSettings.deploy = {};
    finishedSettings.deploy.site_url = deployResult.siteUrl || `https://${domain}`;

    const { data: finishedAgency, error: finishedError } = await persistAgencySettings(startedAgency.id, finishedSettings);
    if (finishedError || !finishedAgency) {
      const err = new Error(finishedError?.message || 'Failed to persist successful deploy state');
      err.code = 'AGENCY_DEPLOY_STATE_FAILED';
      throw err;
    }

    return {
      agency: finishedAgency,
      site_url: deployResult.siteUrl,
      deploy_id: deployResult.deployId,
      refreshed: true
    };
  } catch (deployErr) {
    const failedSettings = markAgencyDeployFinished({
      agency: startedAgency,
      settings: startedAgency.settings || {},
      actor,
      success: false,
      errorMessage: deployErr.message
    });
    await persistAgencySettings(startedAgency.id, failedSettings);
    throw deployErr;
  }
}

// GET /me (mounted at /api/agency)
router.get('/me', async (req, res) => {
  const auth = await resolveAuthContext(req);
  if (auth.error) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: auth.error } });
  }
  if (!ensureStaff(auth, res)) return;
  if (!auth.profile.agency_id) {
    return res.status(404).json({ error: { code: 'AGENCY_NOT_ASSIGNED', message: 'Profile has no agency_id' } });
  }

  const { data, error } = await supabase
    .from('agencies')
    .select(AGENCY_SELECT)
    .eq('id', auth.profile.agency_id)
    .single();

  if (error || !data) {
    return res.status(404).json({ error: { code: 'AGENCY_NOT_FOUND', message: 'Agency not found' } });
  }
  return res.json({ agency: withAgencyLifecycle(data) });
});

// PATCH /me
// Commission/markup is platform-controlled, not agency-self-service — the UI for
// this now lives only in the super admin's "Manage agencies" panel. Kept staff-role
// resolution (not just isAdminRole) so a plain agent gets a clear 403 instead of the
// stricter admin-role branch of ensureStaff-based routes silently no-op'ing.
router.patch('/me', async (req, res) => {
  const auth = await resolveAuthContext(req);
  if (auth.error) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: auth.error } });
  }
  if (!ensureStaff(auth, res)) return;
  if (!ensureAdmin(auth, res)) return;
  if (!auth.profile.agency_id) {
    return res.status(404).json({ error: { code: 'AGENCY_NOT_ASSIGNED', message: 'Profile has no agency_id' } });
  }

  const {
    commission_rate: commissionRate,
    commission_model: commissionModel,
    commission_fixed_amount: commissionFixedAmount,
    carrier_commissions: carrierCommissions,
    currency
  } = req.body || {};

  try {
    const { agency: current, error: currentError } = await loadAgencyForStaff(auth);
    if (currentError) {
      return res.status(500).json({ error: { code: 'AGENCY_LOOKUP_FAILED', message: currentError.message } });
    }
    if (!current) {
      return res.status(404).json({ error: { code: 'AGENCY_NOT_FOUND', message: 'Agency not found' } });
    }

    let settings = { ...(current.settings || {}) };
    settings.commission = {
      ...(settings.commission || {}),
      ...(commissionModel !== undefined ? { model: commissionModel } : {}),
      ...(commissionFixedAmount !== undefined ? { fixed_amount: Number(commissionFixedAmount) || 0 } : {}),
      ...(currency !== undefined ? { currency: String(currency).toUpperCase() } : {})
    };
    if (carrierCommissions !== undefined) {
      // Store as object { "SV": { type: 'fixed'|'percent', value: 50 } } — only positive
      // values, remove zeroes. Accepts legacy plain-number entries (always meant "fixed").
      const cleaned = {};
      if (carrierCommissions && typeof carrierCommissions === 'object') {
        for (const [code, entry] of Object.entries(carrierCommissions)) {
          const upperCode = String(code || '').toUpperCase();
          if (!upperCode) continue;
          let type = 'fixed';
          let val;
          if (entry && typeof entry === 'object') {
            type = entry.type === 'percent' ? 'percent' : 'fixed';
            val = Number(entry.value);
          } else {
            val = Number(entry);
          }
          if (val > 0) cleaned[upperCode] = { type, value: val };
        }
      }
      settings.carrier_commissions = cleaned;
    }

    const patch = {
      updated_at: new Date().toISOString()
    };
    if (commissionRate !== undefined) {
      patch.commission_rate = Number(commissionRate) || 0;
    }

    settings = applyAgencyOnboardingState({
      agency: {
        ...current,
        settings
      },
      settings,
      patch: {
        last_saved_at: new Date().toISOString(),
        last_saved_by: getActorLabel(auth)
      }
    });
    patch.settings = settings;

    const { data, error } = await supabase
      .from('agencies')
      .update(patch)
      .eq('id', current.id)
      .select(AGENCY_SELECT)
      .single();

    if (error) {
      return res.status(500).json({ error: { code: 'AGENCY_UPDATE_FAILED', message: error.message } });
    }

    return res.json({ agency: withAgencyLifecycle(data) });
  } catch (err) {
    console.error('Agency self update error:', err);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: config.nodeEnv === 'development' ? err.message : 'Internal server error'
      }
    });
  }
});

// PATCH /me/content
// Agency self-service content editor — scoped ONLY to fields that are (a)
// purely presentational/informational (colors, logo, text, images, links,
// analytics ids, notification inbox) and (b) already served
// through the runtime content-hydrate endpoint (GET /public/agencies/:subdomain
// /content — see routes/public.js), so a save here takes effect on the next
// page load with NO Netlify redeploy and NO money movement. Pricing,
// commission, payout bank details, and the platform identity fields
// (contact_email/contact_phone/commission_rate) are deliberately excluded —
// those stay on PATCH /me (admin-only) and the super admin panel.
router.patch('/me/content', async (req, res) => {
  const auth = await resolveAuthContext(req);
  if (auth.error) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: auth.error } });
  }
  if (!ensureStaff(auth, res)) return;

  const body = req.body || {};
  const errors = [];
  const HEX_COLOR_RE = /^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/;
  const URL_RE = /^https?:\/\/\S+$/i;
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const PHONE_RE = /^[0-9+\-\s()]{4,30}$/;
  const GA_ID_RE = /^(G-[A-Z0-9]{6,12}|UA-\d{4,10}-\d{1,4})$/;
  const PIXEL_ID_RE = /^\d{10,20}$/;
  const DISPLAY_CURRENCIES = ['SAR', 'USD', 'EUR'];

  // An admin/super_admin previewing an agency's own dashboard (the
  // portal's "Agency admin" preview toggle) has no agency_id of their
  // own — self-scoping to auth.profile.agency_id would 404, or worse,
  // silently write to whatever agency their real profile happens to be
  // tied to. Let ONLY an admin-role caller name the target explicitly;
  // a plain agent always stays hard-scoped to their own agency_id.
  const callerRole = String(auth.profile?.role || '').trim().toLowerCase();
  const isAdminCaller = ['admin', 'super_admin'].includes(callerRole);
  const requestedAgencyId = isAdminCaller ? String(body.agency_id || '').trim() : '';
  if (!requestedAgencyId && !auth.profile.agency_id) {
    return res.status(404).json({ error: { code: 'AGENCY_NOT_ASSIGNED', message: 'Profile has no agency_id' } });
  }

  function str(field, maxLen) {
    if (body[field] === undefined) return undefined;
    const v = body[field] === null ? '' : String(body[field]).trim();
    if (v.length > maxLen) { errors.push(`${field} exceeds ${maxLen} characters`); return undefined; }
    return v;
  }
  function hexColor(field) {
    if (body[field] === undefined) return undefined;
    const v = body[field] === null ? '' : String(body[field]).trim();
    if (v && !HEX_COLOR_RE.test(v)) { errors.push(`${field} must be a hex color like #1a3c8e`); return undefined; }
    return v;
  }
  function urlField(field, maxLen) {
    if (body[field] === undefined) return undefined;
    const v = body[field] === null ? '' : String(body[field]).trim();
    if (v && (v.length > maxLen || !URL_RE.test(v))) { errors.push(`${field} must be a valid http(s) URL`); return undefined; }
    return v;
  }
  function emailField(field) {
    if (body[field] === undefined) return undefined;
    const v = body[field] === null ? '' : String(body[field]).trim().toLowerCase();
    if (v && !EMAIL_RE.test(v)) { errors.push(`${field} must be a valid email address`); return undefined; }
    return v;
  }
  function phoneField(field) {
    if (body[field] === undefined) return undefined;
    const v = body[field] === null ? '' : String(body[field]).trim();
    if (v && !PHONE_RE.test(v)) { errors.push(`${field} must be a valid phone number`); return undefined; }
    return v;
  }

  const nameAr = str('name_ar', 150);
  const contactPhone2 = phoneField('contact_phone2');
  const whatsappPhone = phoneField('whatsapp_phone');
  const brandColor = hexColor('brand_color');
  const accentColor = hexColor('accent_color');
  const headerBg = hexColor('header_bg');
  const footerBg = hexColor('footer_bg');
  const logoUrl = urlField('logo_url', 2000);
  const heroTagline = str('hero_tagline', 150);
  const heroDescription = str('hero_description', 300);
  const heroImageUrl = urlField('hero_image_url', 2000);
  const aboutEn = str('about_en', 3000);
  const aboutAr = str('about_ar', 3000);
  const supervisorName = str('supervisor_name', 150);
  const supervisorEmail = emailField('supervisor_email');
  const instagram = str('instagram', 300);
  const twitter = str('twitter', 300);
  const snapchat = str('snapchat', 300);
  const facebook = str('facebook', 300);
  const workingHours = str('working_hours', 150);
  const workingHoursAr = str('working_hours_ar', 150);
  const address = str('address', 500);
  const notificationEmail = emailField('notification_email');

  let defaultLanguage;
  if (body.default_language !== undefined) {
    const v = String(body.default_language || '').toLowerCase();
    if (!['en', 'ar'].includes(v)) errors.push('default_language must be en or ar');
    else defaultLanguage = v;
  }

  let defaultDisplayCurrency;
  if (body.default_display_currency !== undefined) {
    const v = String(body.default_display_currency || '').toUpperCase();
    if (!DISPLAY_CURRENCIES.includes(v)) errors.push(`default_display_currency must be one of ${DISPLAY_CURRENCIES.join(', ')}`);
    else defaultDisplayCurrency = v;
  }

  let gaMeasurementId;
  if (body.ga_measurement_id !== undefined) {
    const v = String(body.ga_measurement_id || '').trim();
    if (v && !GA_ID_RE.test(v)) errors.push('ga_measurement_id looks invalid (expected G-XXXXXXX or UA-XXXXXXX-X)');
    else gaMeasurementId = v;
  }

  let metaPixelId;
  if (body.meta_pixel_id !== undefined) {
    const v = String(body.meta_pixel_id || '').trim();
    if (v && !PIXEL_ID_RE.test(v)) errors.push('meta_pixel_id looks invalid (expected a numeric Pixel ID)');
    else metaPixelId = v;
  }

  let services;
  if (body.services !== undefined) {
    const requested = Array.isArray(body.services) ? body.services : [];
    const validKeys = new Set(ALL_SERVICES.map((s) => s.key));
    services = requested.map((k) => String(k)).filter((k) => validKeys.has(k));
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: { code: 'INVALID_INPUT', message: errors.join('; ') } });
  }

  try {
    let current, currentError;
    if (requestedAgencyId) {
      const lookup = await supabase.from('agencies').select(AGENCY_SELECT).eq('id', requestedAgencyId).maybeSingle();
      current = lookup.data;
      currentError = lookup.error;
    } else {
      const lookup = await loadAgencyForStaff(auth);
      current = lookup.agency;
      currentError = lookup.error;
    }
    if (currentError) {
      return res.status(500).json({ error: { code: 'AGENCY_LOOKUP_FAILED', message: currentError.message } });
    }
    if (!current) {
      return res.status(404).json({ error: { code: 'AGENCY_NOT_FOUND', message: 'Agency not found' } });
    }

    let settings = { ...(current.settings || {}) };
    const site = { ...(settings.site || {}) };

    const assign = (key, value) => { if (value !== undefined) site[key] = value; };
    assign('name_ar', nameAr);
    assign('contact_phone2', contactPhone2);
    assign('whatsapp_phone', whatsappPhone);
    assign('brand_color', brandColor);
    assign('accent_color', accentColor);
    assign('header_bg', headerBg);
    assign('footer_bg', footerBg);
    assign('logo_url', logoUrl);
    assign('hero_tagline', heroTagline);
    assign('hero_description', heroDescription);
    assign('hero_image_url', heroImageUrl);
    assign('about_en', aboutEn);
    assign('about_ar', aboutAr);
    assign('supervisor_name', supervisorName);
    assign('supervisor_email', supervisorEmail);
    assign('instagram', instagram);
    assign('twitter', twitter);
    assign('snapchat', snapchat);
    assign('facebook', facebook);
    assign('working_hours', workingHours);
    assign('working_hours_ar', workingHoursAr);
    assign('default_display_currency', defaultDisplayCurrency);
    assign('ga_measurement_id', gaMeasurementId);
    assign('meta_pixel_id', metaPixelId);
    assign('notification_email', notificationEmail);
    if (services !== undefined) site.services = services;

    settings.site = site;
    if (defaultLanguage !== undefined) settings.language = defaultLanguage;

    const patch = { updated_at: new Date().toISOString() };
    if (address !== undefined) patch.address = address || null;

    settings = applyAgencyOnboardingState({
      agency: { ...current, settings },
      settings,
      patch: {
        last_saved_at: new Date().toISOString(),
        last_saved_by: getActorLabel(auth)
      }
    });
    patch.settings = settings;

    const { data, error } = await supabase
      .from('agencies')
      .update(patch)
      .eq('id', current.id)
      .select(AGENCY_SELECT)
      .single();

    if (error) {
      return res.status(500).json({ error: { code: 'AGENCY_UPDATE_FAILED', message: error.message } });
    }

    // Best-effort: purge the runtime content-hydrate cache so this save is
    // visible on the live site within seconds instead of waiting out the
    // cache TTL. Never let a cache-invalidation failure fail the save itself.
    try {
      const rawDomain = String(data.domain || '').trim().toLowerCase();
      const subdomainMatch = rawDomain.match(/^([a-z0-9-]+)\.aviaframe\.com$/i) || rawDomain.match(/^([a-z0-9-]+)$/i);
      if (subdomainMatch) {
        require('./public').invalidateAgencyContentCache(subdomainMatch[1]);
      }
    } catch (cacheErr) {
      console.warn('[agency /me/content] cache invalidation skipped:', cacheErr.message);
    }

    return res.json({ agency: withAgencyLifecycle(data) });
  } catch (err) {
    console.error('Agency self-service content update error:', err);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: config.nodeEnv === 'development' ? err.message : 'Internal server error'
      }
    });
  }
});

// POST /me/publish-site
router.post('/me/publish-site', async (req, res) => {
  const auth = await resolveAuthContext(req);
  if (auth.error) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: auth.error } });
  }
  if (!ensureStaff(auth, res)) return;
  return forbidden(res, 'Self-service publishing is disabled. Contact a super admin to publish the agency site.');
});

// POST /me/redeploy-site
router.post('/me/redeploy-site', async (req, res) => {
  const auth = await resolveAuthContext(req);
  if (auth.error) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: auth.error } });
  }
  if (!ensureStaff(auth, res)) return;
  return forbidden(res, 'Self-service publishing is disabled. Contact a super admin to publish agency site updates.');
});

// POST /me/upload/media — agency self-service image upload for non-logo
// images (currently: hero background). Same restrictions/pattern as
// /me/upload/logo (image mimetypes only, 5MB cap via the shared `upload`
// multer instance), just a different storage folder so hero images don't
// collide with logos.
router.post('/me/upload/media', uploadSingleImage, async (req, res) => {
  const auth = await resolveAuthContext(req);
  if (auth.error) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: auth.error } });

  const role = String(auth.profile?.role || '').trim().toLowerCase();
  const isAllowed = ['admin', 'super_admin', 'agent'].includes(role) || Boolean(auth.profile?.agency_id);
  if (!isAllowed) return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Agency account required' } });

  const file = req.file;
  if (!file) return res.status(400).json({ error: { code: 'NO_FILE', message: 'No file uploaded' } });

  const ext = file.mimetype.split('/')[1]?.replace('jpeg', 'jpg').replace('svg+xml', 'svg') || 'jpg';
  const agencyId = auth.profile?.agency_id || 'shared';
  const filename = `media/${agencyId}/${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${ext}`;

  try {
    const { error } = await supabase.storage
      .from('agency-assets')
      .upload(filename, file.buffer, { contentType: file.mimetype, upsert: false });

    if (error) return res.status(500).json({ error: { code: 'UPLOAD_FAILED', message: error.message } });

    const { data: urlData } = supabase.storage.from('agency-assets').getPublicUrl(filename);
    return res.json({ url: urlData.publicUrl });
  } catch (err) {
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// POST /me/upload/logo — agency manager logo upload (accessible to staff + agency managers)
router.post('/me/upload/logo', uploadSingleImage, async (req, res) => {
  const auth = await resolveAuthContext(req);
  if (auth.error) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: auth.error } });

  const role = String(auth.profile?.role || '').trim().toLowerCase();
  const isAllowed = ['admin', 'super_admin', 'agent'].includes(role) || Boolean(auth.profile?.agency_id);
  if (!isAllowed) return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Agency account required' } });

  const file = req.file;
  if (!file) return res.status(400).json({ error: { code: 'NO_FILE', message: 'No file uploaded' } });

  const ext = file.mimetype.split('/')[1]?.replace('svg+xml', 'svg') || 'png';
  const filename = `logos/${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${ext}`;

  try {
    const { error } = await supabase.storage
      .from('agency-assets')
      .upload(filename, file.buffer, { contentType: file.mimetype, upsert: false });

    if (error) return res.status(500).json({ error: { code: 'UPLOAD_FAILED', message: error.message } });

    const { data: urlData } = supabase.storage.from('agency-assets').getPublicUrl(filename);
    return res.json({ url: urlData.publicUrl });
  } catch (err) {
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

module.exports = router;
