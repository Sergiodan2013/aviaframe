'use strict';

const express = require('express');
const crypto = require('crypto');
const multer = require('multer');
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const supabase = require('../lib/supabase');
const { config, VALID_PAYMENT_METHODS } = require('../config');
const { isAdminRole, normalizeHost, toIsoDateStart, toIsoDateEnd, generateInvoiceNumber } = require('../utils/helpers');
const { resolveAuthContext, forbidden, ensureAdmin, ensureStaff } = require('../middleware/auth');
const {
  linkAgencyAdminProfileByEmail,
  ensureAuthUserByEmail,
  generateInvoicePdfForInvoice
} = require('../services/orderService');
const { sendAgencyOnboardingEmail } = require('../services/emailService');
const {
  generateAgencySiteFiles,
  buildAgencyDeployFiles,
  deployToNetlify,
  addGodaddyCname,
  deleteNetlifySite,
  deleteGodaddyCname
} = require('../services/agencyProvision');
const {
  inferSiteUrl,
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

async function loadAgencyById(agencyId) {
  const normalizedAgencyId = String(agencyId || '').trim();
  if (!normalizedAgencyId) {
    return { agency: null, error: null, fallbackUsed: false };
  }

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

  // Fallback: the admin agencies list is known to return the row reliably in production.
  // When the direct UUID lookup is inconsistent, recover by matching in memory.
  const { data: allAgencies, error: fallbackError } = await supabase
    .from('agencies')
    .select(AGENCY_SELECT)
    .order('updated_at', { ascending: false })
    .limit(500);

  if (fallbackError) {
    return { agency: null, error: fallbackError, fallbackUsed: false };
  }

  const fallbackAgency = Array.isArray(allAgencies)
    ? allAgencies.find((candidate) => String(candidate?.id || '').trim() === normalizedAgencyId) || null
    : null;

  return {
    agency: fallbackAgency,
    error: null,
    fallbackUsed: Boolean(fallbackAgency)
  };
}

async function sendAgencySetupEmailFlow({ agency, auth }) {
  const actor = getActorLabel(auth);
  const authResult = await ensureAuthUserByEmail(agency.contact_email);
  const { linkedProfile, conflict, message, error: linkError } = await linkAgencyAdminProfileByEmail({
    email: agency.contact_email,
    agencyId: agency.id
  });
  if (conflict) {
    const err = new Error(message || 'Agency manager email is already linked to another agency');
    err.code = 'PROFILE_ALREADY_LINKED_TO_AGENCY';
    throw err;
  }
  if (linkError) {
    console.warn('Agency setup email flow profile linking warning:', linkError.message);
  }

  const emailResult = await sendAgencyOnboardingEmail({
    to: agency.contact_email,
    agency,
    inviterName: auth?.profile?.full_name || actor,
    setupUrl: `${process.env.APP_URL || 'https://admin.aviaframe.com'}/`,
    siteUrl: agency.settings?.deploy?.site_url || inferSiteUrl(agency),
    publicWidgetKey: agency.api_key
  });

  if (!emailResult?.sent) {
    const err = new Error(emailResult?.error || 'Failed to send onboarding email');
    err.code = 'AGENCY_SETUP_EMAIL_FAILED';
    throw err;
  }

  const nextSettings = applyAgencyOnboardingState({
    agency,
    settings: agency.settings || {},
    patch: {
      status: 'invited',
      invite_sent_at: new Date().toISOString(),
      invite_sent_by: actor
    }
  });
  const { data: updatedAgency, error: updateError } = await persistAgencySettings(agency.id, nextSettings);
  if (updateError || !updatedAgency) {
    const err = new Error(updateError?.message || 'Failed to persist onboarding invite state');
    err.code = 'AGENCY_ONBOARDING_STATE_FAILED';
    throw err;
  }

  return {
    agency: updatedAgency,
    email: emailResult,
    auth_user: {
      created: Boolean(authResult?.created),
      invited: Boolean(authResult?.invited)
    },
    linked_profile: linkedProfile || null
  };
}

async function runAgencySiteDeploy({ agency, auth, enforceReady = false }) {
  if (!agency?.id) {
    const err = new Error('Agency not found');
    err.code = 'AGENCY_NOT_FOUND';
    throw err;
  }

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

  // Always rebuild the public agency landing from current agency settings.
  // This guarantees that logo/color/content updates are reflected on publish/republish
  // instead of silently preserving stale live HTML from a previous deploy.
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

    // Ensure DNS CNAME exists after every successful deploy (idempotent — skips if already there)
    try {
      await addGodaddyCname({
        subdomain: cleanSubdomain,
        netlifyAppName: `aviaframe-${cleanSubdomain}`
      });
    } catch (dnsErr) {
      console.warn(`[deploy] CNAME upsert failed for ${cleanSubdomain}:`, dnsErr.message);
    }

    const finishedSettings = markAgencyDeployFinished({
      agency: startedAgency,
      settings: startedAgency.settings || {},
      actor,
      success: true
    });
    if (!finishedSettings.deploy) finishedSettings.deploy = {};
    finishedSettings.deploy.site_url = deployResult.siteUrl || inferSiteUrl(startedAgency);

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

// GET /super-admins (mounted at /api/admin)
router.get('/super-admins', async (req, res) => {
  const auth = await resolveAuthContext(req);
  if (auth.error) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: auth.error } });
  }
  if (!ensureAdmin(auth, res)) return;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id,email,full_name,phone,role,agency_id,created_at,updated_at')
      .in('role', ['admin', 'super_admin'])
      .order('updated_at', { ascending: false });

    if (error) {
      return res.status(500).json({
        error: { code: 'SUPER_ADMINS_LIST_FAILED', message: error.message }
      });
    }

    return res.json({ super_admins: data || [] });
  } catch (err) {
    console.error('Super admins list error:', err);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: config.nodeEnv === 'development' ? err.message : 'Internal server error'
      }
    });
  }
});

// POST /super-admins
router.post('/super-admins', async (req, res) => {
  const auth = await resolveAuthContext(req);
  if (auth.error) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: auth.error } });
  }
  if (!ensureAdmin(auth, res)) return;

  const {
    email,
    full_name: fullName = null,
    phone = null
  } = req.body || {};

  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return res.status(400).json({
      error: { code: 'INVALID_INPUT', message: 'Valid email is required' }
    });
  }

  try {
    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id,email,full_name,phone,role,agency_id,created_at,updated_at')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (profileError) {
      return res.status(500).json({
        error: { code: 'PROFILE_LOOKUP_FAILED', message: profileError.message }
      });
    }

    let created = false;
    if (!profile) {
      const { user: authUser, created: authCreated, invited: authInvited } = await ensureAuthUserByEmail(normalizedEmail);
      if (!authUser?.id) {
        return res.status(404).json({
          error: {
            code: 'AUTH_USER_NOT_FOUND',
            message: 'User with this email not found and could not be provisioned.'
          }
        });
      }

      const { data: inserted, error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: authUser.id,
          email: normalizedEmail,
          full_name: fullName || null,
          phone: phone || null,
          role: 'admin',
          agency_id: null,
          updated_at: new Date().toISOString()
        })
        .select('id,email,full_name,phone,role,agency_id,created_at,updated_at')
        .single();

      if (insertError || !inserted) {
        return res.status(500).json({
          error: { code: 'SUPER_ADMIN_CREATE_FAILED', message: insertError?.message || 'Failed to create profile' }
        });
      }
      profile = inserted;
      created = true;
      if (authCreated) {
        console.log(`Provisioned auth user for ${normalizedEmail}; invited=${authInvited}`);
      }
    } else {
      const patch = {
        role: 'admin',
        agency_id: null,
        updated_at: new Date().toISOString()
      };
      if (fullName !== null) patch.full_name = fullName || null;
      if (phone !== null) patch.phone = phone || null;

      const { data: updated, error: updateError } = await supabase
        .from('profiles')
        .update(patch)
        .eq('id', profile.id)
        .select('id,email,full_name,phone,role,agency_id,created_at,updated_at')
        .single();

      if (updateError || !updated) {
        return res.status(500).json({
          error: { code: 'SUPER_ADMIN_UPDATE_FAILED', message: updateError?.message || 'Failed to update profile' }
        });
      }
      profile = updated;
    }

    return res.status(created ? 201 : 200).json({
      super_admin: profile,
      created
    });
  } catch (err) {
    console.error('Super admin create error:', err);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: config.nodeEnv === 'development' ? err.message : 'Internal server error'
      }
    });
  }
});

// GET /agencies
router.get('/agencies', async (req, res) => {
  const auth = await resolveAuthContext(req);
  if (auth.error) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: auth.error
      }
    });
  }
  if (!ensureAdmin(auth, res)) return;

  const rawLimit = Number(req.query.limit || 200);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 1000) : 200;
  const { q = '', is_active: isActiveFilter, country } = req.query;

  try {
    let query = supabase
      .from('agencies')
      .select(AGENCY_SELECT)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (String(isActiveFilter).toLowerCase() === 'true') query = query.eq('is_active', true);
    if (String(isActiveFilter).toLowerCase() === 'false') query = query.eq('is_active', false);
    if (country) query = query.eq('country', String(country).toUpperCase());
    if (q) {
      const escaped = String(q).replace(/,/g, '');
      query = query.or(`name.ilike.%${escaped}%,domain.ilike.%${escaped}%,contact_email.ilike.%${escaped}%`);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({
        error: {
          code: 'AGENCIES_LIST_FAILED',
          message: error.message
        }
      });
    }

    return res.json({ agencies: (data || []).map(withAgencyLifecycle) });
  } catch (err) {
    console.error('Agencies list error:', err);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: config.nodeEnv === 'development' ? err.message : 'Internal server error'
      }
    });
  }
});

// POST /agencies
router.post('/agencies', async (req, res) => {
  const auth = await resolveAuthContext(req);
  if (auth.error) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: auth.error
      }
    });
  }
  if (!isAdminRole(auth.profile.role)) {
    return forbidden(res, 'Admin role required');
  }

  const {
    name,
    domain,
    contact_email: contactEmail,
    contact_phone: contactPhone = null,
    contact_person_name: contactPersonName = null,
    country = 'SA',
    address = null,
    commission_rate: commissionRate = 0,
    bank_details: bankDetails = {},
    language = 'en',
    widget_allowed_domains: widgetAllowedDomains = [],
    payment_methods: paymentMethodsRaw = ['online'],
    send_setup_email: sendSetupEmail = false
  } = req.body || {};

  if (!name || !contactEmail) {
    return res.status(400).json({
      error: {
        code: 'INVALID_INPUT',
        message: 'name and contact_email are required'
      }
    });
  }

  const allowedPaymentMethods = Array.isArray(paymentMethodsRaw)
    ? paymentMethodsRaw.filter(m => VALID_PAYMENT_METHODS.includes(m))
    : ['online'];
  const finalPaymentMethods = allowedPaymentMethods.length ? allowedPaymentMethods : ['online'];

  // Bank details required only if invoice method is enabled
  if (finalPaymentMethods.includes('invoice')) {
    const bd = bankDetails || {};
    if (!bd.bank_name || !bd.iban) {
      return res.status(400).json({
        error: {
          code: 'INVALID_INPUT',
          message: 'bank_details.bank_name and bank_details.iban are required when invoice payment method is enabled'
        }
      });
    }
  }

  const apiKey = `ag_${crypto.randomBytes(20).toString('hex')}`;
  const safeDomain = domain ? String(domain).trim().toLowerCase() : null;
  let settings = {
    language,
    bank_details: bankDetails || {},
    payment_methods: finalPaymentMethods,
    widget_allowed_domains: Array.isArray(widgetAllowedDomains)
      ? widgetAllowedDomains
          .map((d) => normalizeHost(d))
          .filter(Boolean)
      : [],
    contact_person: {
      full_name: contactPersonName
    }
  };
  settings = applyAgencyOnboardingState({
    agency: {
      name: String(name).trim(),
      domain: safeDomain,
      contact_email: String(contactEmail).trim().toLowerCase(),
      contact_phone: contactPhone,
      settings
    },
    settings
  });

  try {
    const { data, error } = await supabase
      .from('agencies')
      .insert({
        name: String(name).trim(),
        domain: safeDomain,
        api_key: apiKey,
        contact_email: String(contactEmail).trim().toLowerCase(),
        contact_phone: contactPhone,
        country,
        address,
        commission_rate: Number(commissionRate) || 0,
        settings
      })
      .select(AGENCY_SELECT)
      .single();

    if (error) {
      return res.status(500).json({
        error: {
          code: 'AGENCY_CREATE_FAILED',
          message: error.message
        }
      });
    }

    const { linkedProfile, conflict, message, error: linkError } = await linkAgencyAdminProfileByEmail({
      email: contactEmail,
      agencyId: data.id
    });
    if (conflict) {
      await supabase.from('agencies').delete().eq('id', data.id);
      return res.status(409).json({
        error: {
          code: 'PROFILE_ALREADY_LINKED_TO_AGENCY',
          message
        }
      });
    }
    if (linkError) {
      console.warn('Agency created, but profile linking failed:', linkError.message);
    }

    let responseAgency = data;
    let setupEmail = null;
    if (sendSetupEmail) {
      try {
        const setupResult = await sendAgencySetupEmailFlow({ agency: data, auth });
        responseAgency = setupResult.agency;
        setupEmail = {
          sent: true,
          invited: setupResult.auth_user?.invited || false,
          created: setupResult.auth_user?.created || false
        };
      } catch (setupErr) {
        console.error('Agency created but setup email flow failed:', setupErr);
        return res.status(502).json({
          error: {
            code: setupErr.code || 'AGENCY_SETUP_EMAIL_FAILED',
            message: setupErr.message || 'Agency created, but setup email could not be sent.'
          },
          agency: withAgencyLifecycle(responseAgency),
          linked_profile: linkedProfile || null
        });
      }
    }

    return res.status(201).json({
      agency: withAgencyLifecycle(responseAgency),
      linked_profile: linkedProfile || null,
      setup_email: setupEmail
    });
  } catch (err) {
    console.error('Agency create error:', err);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: config.nodeEnv === 'development' ? err.message : 'Internal server error'
      }
    });
  }
});

// PATCH /agencies/:agencyId
router.patch('/agencies/:agencyId', async (req, res) => {
  const auth = await resolveAuthContext(req);
  if (auth.error) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: auth.error } });
  }
  if (!ensureAdmin(auth, res)) return;

  const { agencyId } = req.params;
  const {
    name,
    domain,
    contact_email: contactEmail,
    contact_phone: contactPhone,
    contact_person_name: contactPersonName,
    country,
    address,
    commission_rate: commissionRate,
    commission_model: commissionModel,
    commission_fixed_amount: commissionFixedAmount,
    carrier_commissions: carrierCommissions,
    currency,
    is_active: isActive,
    language,
    bank_details: bankDetails,
    widget_allowed_domains: widgetAllowedDomains,
    payment_methods: paymentMethods,
    name_ar: nameAr,
    contact_phone2: contactPhone2,
    whatsapp_phone: whatsappPhone,
    brand_color: brandColor,
    accent_color: accentColor,
    supervisor_name: supervisorName,
    supervisor_email: supervisorEmail,
    logo_url: logoUrl,
    about_en: aboutEn,
    about_ar: aboutAr,
    working_hours: workingHours,
    working_hours_ar: workingHoursAr,
    license_number: licenseNumber,
    iata_number: iataNumber,
    founded_year: foundedYear,
    google_maps_url: googleMapsUrl,
    instagram,
    twitter,
    snapchat,
    facebook,
    services,
    hero_tagline: heroTagline,
    hero_description: heroDescription,
    destinations,
    reviews,
    featured_airlines: featuredAirlines,
    hero_image_url: heroImageUrl,
    header_bg: headerBg,
    footer_bg: footerBg
  } = req.body || {};

  try {
    const { agency: current, error: currentError, fallbackUsed } = await loadAgencyById(agencyId);

    if (currentError || !current) {
      return res.status(404).json({
        error: { code: 'AGENCY_NOT_FOUND', message: 'Agency not found' }
      });
    }
    if (fallbackUsed) {
      console.warn(`[admin/agencies/${agencyId}] fallback lookup used during agency update`);
    }

    let settings = {
      ...(current.settings || {})
    };
    settings.site = {
      ...(settings.site || {})
    };
    if (commissionModel !== undefined || commissionFixedAmount !== undefined || currency !== undefined) {
      settings.commission = {
        ...(settings.commission || {}),
        ...(commissionModel !== undefined ? { model: commissionModel } : {}),
        ...(commissionFixedAmount !== undefined ? { fixed_amount: Number(commissionFixedAmount) || 0 } : {}),
        ...(currency !== undefined ? { currency: String(currency).toUpperCase() } : {})
      };
    }
    if (language !== undefined) settings.language = language;
    if (bankDetails !== undefined) settings.bank_details = bankDetails || {};
    if (widgetAllowedDomains !== undefined) {
      settings.widget_allowed_domains = Array.isArray(widgetAllowedDomains)
        ? widgetAllowedDomains
            .map((d) => normalizeHost(d))
            .filter(Boolean)
        : [];
    }
    if (contactPersonName !== undefined) {
      settings.contact_person = {
        ...(settings.contact_person || {}),
        full_name: contactPersonName || null
      };
    }
    if (paymentMethods !== undefined) {
      const filtered = Array.isArray(paymentMethods)
        ? paymentMethods.filter(m => VALID_PAYMENT_METHODS.includes(m))
        : ['online'];
      settings.payment_methods = filtered.length ? filtered : ['online'];
    }
    if (carrierCommissions !== undefined) {
      const cleaned = {};
      if (carrierCommissions && typeof carrierCommissions === 'object') {
        for (const [code, amount] of Object.entries(carrierCommissions)) {
          const val = Number(amount);
          if (val > 0) cleaned[code.toUpperCase()] = val;
        }
      }
      settings.carrier_commissions = cleaned;
    }
    if (nameAr !== undefined) settings.site.name_ar = nameAr || '';
    if (contactPhone2 !== undefined) settings.site.contact_phone2 = contactPhone2 || '';
    if (whatsappPhone !== undefined) settings.site.whatsapp_phone = whatsappPhone || '';
    if (brandColor !== undefined) settings.site.brand_color = brandColor || '#1a3c8e';
    if (accentColor !== undefined) settings.site.accent_color = accentColor || '#2468c4';
    if (supervisorName !== undefined) settings.site.supervisor_name = supervisorName || '';
    if (supervisorEmail !== undefined) settings.site.supervisor_email = supervisorEmail || '';
    if (logoUrl !== undefined) settings.site.logo_url = logoUrl || '';
    if (aboutEn !== undefined) settings.site.about_en = aboutEn || '';
    if (aboutAr !== undefined) settings.site.about_ar = aboutAr || '';
    if (workingHours !== undefined) settings.site.working_hours = workingHours || '';
    if (workingHoursAr !== undefined) settings.site.working_hours_ar = workingHoursAr || '';
    if (licenseNumber !== undefined) settings.site.license_number = licenseNumber || '';
    if (iataNumber !== undefined) settings.site.iata_number = iataNumber || '';
    if (foundedYear !== undefined) settings.site.founded_year = foundedYear || '';
    if (googleMapsUrl !== undefined) settings.site.google_maps_url = googleMapsUrl || '';
    if (instagram !== undefined) settings.site.instagram = instagram || '';
    if (twitter !== undefined) settings.site.twitter = twitter || '';
    if (snapchat !== undefined) settings.site.snapchat = snapchat || '';
    if (facebook !== undefined) settings.site.facebook = facebook || '';
    if (services !== undefined) {
      settings.site.services = Array.isArray(services) ? services : [];
    }
    if (heroTagline !== undefined) settings.site.hero_tagline = heroTagline || '';
    if (heroDescription !== undefined) settings.site.hero_description = heroDescription || '';
    if (destinations !== undefined) settings.site.destinations = Array.isArray(destinations) ? destinations : [];
    if (reviews !== undefined) settings.site.reviews = Array.isArray(reviews) ? reviews : [];
    if (featuredAirlines !== undefined) settings.site.featured_airlines = Array.isArray(featuredAirlines) ? featuredAirlines : [];
    if (heroImageUrl !== undefined) settings.site.hero_image_url = heroImageUrl || '';
    if (headerBg !== undefined) settings.site.header_bg = headerBg || '';
    if (footerBg !== undefined) settings.site.footer_bg = footerBg || '';

    const patch = {
      updated_at: new Date().toISOString()
    };
    if (name !== undefined) patch.name = String(name).trim();
    if (domain !== undefined) patch.domain = domain ? String(domain).trim().toLowerCase() : null;
    if (contactEmail !== undefined) patch.contact_email = contactEmail ? String(contactEmail).trim().toLowerCase() : null;
    if (contactPhone !== undefined) patch.contact_phone = contactPhone || null;
    if (country !== undefined) patch.country = country ? String(country).toUpperCase() : null;
    if (address !== undefined) patch.address = address || null;
    if (commissionRate !== undefined) patch.commission_rate = Number(commissionRate) || 0;
    if (isActive !== undefined) patch.is_active = !!isActive;

    settings = applyAgencyOnboardingState({
      agency: {
        ...current,
        name: patch.name !== undefined ? patch.name : current.name,
        domain: patch.domain !== undefined ? patch.domain : current.domain,
        contact_email: patch.contact_email !== undefined ? patch.contact_email : current.contact_email,
        contact_phone: patch.contact_phone !== undefined ? patch.contact_phone : current.contact_phone,
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
      .eq('id', agencyId)
      .select(AGENCY_SELECT)
      .single();

    if (error) {
      return res.status(500).json({
        error: { code: 'AGENCY_UPDATE_FAILED', message: error.message }
      });
    }

    if (contactEmail !== undefined && patch.contact_email) {
      const { conflict, message, error: linkError } = await linkAgencyAdminProfileByEmail({
        email: patch.contact_email,
        agencyId: data.id
      });
      if (conflict) {
        return res.status(409).json({
          error: {
            code: 'PROFILE_ALREADY_LINKED_TO_AGENCY',
            message
          }
        });
      }
      if (linkError) {
        console.warn('Agency updated, but profile linking failed:', linkError.message);
      }
    }

    return res.json({ agency: withAgencyLifecycle(data) });
  } catch (err) {
    console.error('Agency update error:', err);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: config.nodeEnv === 'development' ? err.message : 'Internal server error'
      }
    });
  }
});

// DELETE /agencies/:agencyId
router.delete('/agencies/:agencyId', async (req, res) => {
  const auth = await resolveAuthContext(req);
  if (auth.error) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: auth.error } });
  }
  if (!ensureAdmin(auth, res)) return;

  const { agencyId } = req.params;
  try {
    const { data: agencyBeforeDelete, error: agencyLoadError } = await supabase
      .from('agencies')
      .select(AGENCY_SELECT)
      .eq('id', agencyId)
      .single();

    if (agencyLoadError || !agencyBeforeDelete) {
      return res.status(404).json({
        error: { code: 'AGENCY_NOT_FOUND', message: 'Agency not found' }
      });
    }

    const cleanSubdomain = String(agencyBeforeDelete.domain || '')
      .replace(/\.aviaframe\.com$/i, '')
      .trim()
      .toLowerCase();

    let netlifyCleanup = null;
    let dnsCleanup = null;
    let cleanupWarnings = [];

    if (cleanSubdomain) {
      try {
        netlifyCleanup = await deleteNetlifySite({ subdomain: cleanSubdomain });
      } catch (err) {
        cleanupWarnings.push(`Netlify cleanup failed: ${err.message}`);
      }

      try {
        dnsCleanup = await deleteGodaddyCname({ subdomain: cleanSubdomain });
      } catch (err) {
        cleanupWarnings.push(`DNS cleanup failed: ${err.message}`);
      }
    }

    const { data, error } = await supabase
      .from('agencies')
      .delete()
      .eq('id', agencyId)
      .select('id,name,domain')
      .single();

    if (error) {
      return res.status(500).json({
        error: { code: 'AGENCY_DELETE_FAILED', message: error.message }
      });
    }
    return res.json({
      agency: data,
      cleanup: {
        netlify: netlifyCleanup,
        dns: dnsCleanup,
        warnings: cleanupWarnings
      }
    });
  } catch (err) {
    console.error('Agency delete error:', err);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: config.nodeEnv === 'development' ? err.message : 'Internal server error'
      }
    });
  }
});

// GET /reports/orders
router.get('/reports/orders', async (req, res) => {
  const auth = await resolveAuthContext(req);
  if (auth.error) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: auth.error } });
  }
  if (!ensureAdmin(auth, res)) return;

  const rawLimit = Number(req.query.limit || 1000);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 5000) : 1000;
  const { agency_id: agencyId, status, date_from: dateFrom, date_to: dateTo } = req.query;
  const fromIso = toIsoDateStart(dateFrom);
  const toIso = toIsoDateEnd(dateTo);

  try {
    let query = supabase
      .from('orders')
      .select('id,order_number,user_id,agency_id,origin,destination,airline_name,airline_code,total_price,currency,status,created_at,confirmed_at,cancelled_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (agencyId) query = query.eq('agency_id', agencyId);
    if (status) query = query.eq('status', status);
    if (fromIso) query = query.gte('created_at', fromIso);
    if (toIso) query = query.lte('created_at', toIso);

    const { data: orders, error } = await query;
    if (error) {
      return res.status(500).json({ error: { code: 'REPORT_ORDERS_FAILED', message: error.message } });
    }

    const agencyIds = [...new Set((orders || []).map((o) => o.agency_id).filter(Boolean))];
    const userIds = [...new Set((orders || []).map((o) => o.user_id).filter(Boolean))];

    const agenciesMap = {};
    if (agencyIds.length > 0) {
      const { data: agencies } = await supabase
        .from('agencies')
        .select('id,name,domain,contact_email')
        .in('id', agencyIds);
      (agencies || []).forEach((a) => {
        agenciesMap[a.id] = a;
      });
    }

    const usersMap = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id,email,full_name')
        .in('id', userIds);
      (profiles || []).forEach((p) => {
        usersMap[p.id] = p;
      });
    }

    const rows = (orders || []).map((o) => ({
      ...o,
      agency: o.agency_id ? (agenciesMap[o.agency_id] || null) : null,
      user: o.user_id ? (usersMap[o.user_id] || null) : null
    }));

    return res.json({
      rows,
      filters: {
        agency_id: agencyId || null,
        status: status || null,
        date_from: fromIso,
        date_to: toIso
      }
    });
  } catch (err) {
    console.error('Admin orders report error:', err);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: config.nodeEnv === 'development' ? err.message : 'Internal server error'
      }
    });
  }
});

// GET /reports/orders-summary
router.get('/reports/orders-summary', async (req, res) => {
  const auth = await resolveAuthContext(req);
  if (auth.error) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: auth.error } });
  }
  if (!ensureAdmin(auth, res)) return;

  const { agency_id: agencyId, date_from: dateFrom, date_to: dateTo } = req.query;
  const fromIso = toIsoDateStart(dateFrom);
  const toIso = toIsoDateEnd(dateTo);

  try {
    let query = supabase
      .from('orders')
      .select('id,status,total_price,currency,agency_id,created_at');
    if (agencyId) query = query.eq('agency_id', agencyId);
    if (fromIso) query = query.gte('created_at', fromIso);
    if (toIso) query = query.lte('created_at', toIso);

    const { data: orders, error } = await query;
    if (error) {
      return res.status(500).json({ error: { code: 'REPORT_SUMMARY_FAILED', message: error.message } });
    }

    const summary = {
      total_orders: (orders || []).length,
      pending: 0,
      confirmed: 0,
      ticketed: 0,
      cancelled: 0,
      refunded: 0,
      failed: 0,
      gross_total: 0,
      currencies: {}
    };

    (orders || []).forEach((o) => {
      const s = String(o.status || 'pending').toLowerCase();
      if (Object.prototype.hasOwnProperty.call(summary, s)) summary[s] += 1;
      const amount = Number(o.total_price || 0);
      summary.gross_total += amount;
      const c = o.currency || 'N/A';
      summary.currencies[c] = (summary.currencies[c] || 0) + amount;
    });

    return res.json({
      summary,
      filters: {
        agency_id: agencyId || null,
        date_from: fromIso,
        date_to: toIso
      }
    });
  } catch (err) {
    console.error('Admin orders summary error:', err);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: config.nodeEnv === 'development' ? err.message : 'Internal server error'
      }
    });
  }
});

// GET /invoices
router.get('/invoices', async (req, res) => {
  const auth = await resolveAuthContext(req);
  if (auth.error) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: auth.error } });
  }
  if (!ensureAdmin(auth, res)) return;

  const rawLimit = Number(req.query.limit || 200);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 1000) : 200;
  const { agency_id: agencyId, status, currency, date_from: dateFrom, date_to: dateTo } = req.query;
  const fromIso = toIsoDateStart(dateFrom);
  const toIso = toIsoDateEnd(dateTo);

  try {
    let query = supabase
      .from('invoices')
      .select('id,invoice_number,agency_id,period_from,period_to,currency,subtotal,markup_total,total,status,bank_details,notes,created_by,created_at,updated_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (agencyId) query = query.eq('agency_id', agencyId);
    if (status) query = query.eq('status', status);
    if (currency) query = query.eq('currency', String(currency).toUpperCase());
    if (fromIso) query = query.gte('created_at', fromIso);
    if (toIso) query = query.lte('created_at', toIso);

    const { data, error } = await query;
    if (error) {
      return res.status(500).json({ error: { code: 'INVOICES_LIST_FAILED', message: error.message } });
    }

    return res.json({ invoices: data || [] });
  } catch (err) {
    console.error('Invoices list error:', err);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: config.nodeEnv === 'development' ? err.message : 'Internal server error'
      }
    });
  }
});

// POST /invoices
router.post('/invoices', async (req, res) => {
  const auth = await resolveAuthContext(req);
  if (auth.error) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: auth.error } });
  }
  if (!ensureAdmin(auth, res)) return;

  const {
    agency_id: agencyId,
    period_from: periodFrom,
    period_to: periodTo,
    currency = 'USD',
    statuses = ['confirmed', 'ticketed'],
    manual_total: manualTotalRaw = null,
    notes = null,
    bank_details: bankDetails = {}
  } = req.body || {};

  if (!agencyId || !periodFrom || !periodTo) {
    return res.status(400).json({
      error: {
        code: 'INVALID_INPUT',
        message: 'agency_id, period_from, period_to are required'
      }
    });
  }

  const fromIso = toIsoDateStart(periodFrom);
  const toIso = toIsoDateEnd(periodTo);
  if (!fromIso || !toIso) {
    return res.status(400).json({
      error: {
        code: 'INVALID_PERIOD',
        message: 'Invalid period range'
      }
    });
  }

  try {
    const { data: agency, error: agencyError } = await supabase
      .from('agencies')
      .select('id,name,commission_rate,settings')
      .eq('id', agencyId)
      .single();

    if (agencyError || !agency) {
      return res.status(404).json({
        error: {
          code: 'AGENCY_NOT_FOUND',
          message: 'Agency not found'
        }
      });
    }

    const manualTotal = (
      manualTotalRaw !== null &&
      manualTotalRaw !== undefined &&
      String(manualTotalRaw).trim() !== ''
    ) ? Number(manualTotalRaw) : null;

    let scoped = [];
    let subtotal = 0;
    let markupTotal = 0;
    let total = 0;

    if (Number.isFinite(manualTotal) && manualTotal >= 0) {
      subtotal = Number(manualTotal.toFixed(2));
      markupTotal = 0;
      total = subtotal;
    } else {
      const ordersQuery = supabase
        .from('orders')
        .select('id,total_price,currency,status')
        .eq('agency_id', agencyId)
        .gte('created_at', fromIso)
        .lte('created_at', toIso)
        .in('status', statuses.map((s) => String(s).toLowerCase()));

      const { data: orders, error: ordersError } = await ordersQuery;
      if (ordersError) {
        return res.status(500).json({
          error: {
            code: 'INVOICE_ORDERS_FETCH_FAILED',
            message: ordersError.message
          }
        });
      }

      scoped = (orders || []).filter((o) => (o.currency || '').toUpperCase() === String(currency).toUpperCase());
      subtotal = scoped.reduce((sum, o) => sum + Number(o.total_price || 0), 0);
      const commissionRate = Number(agency.commission_rate || 0);
      markupTotal = Number((subtotal * commissionRate / 100).toFixed(2));
      total = Number((subtotal + markupTotal).toFixed(2));
    }

    const invoice = {
      invoice_number: generateInvoiceNumber(),
      agency_id: agencyId,
      period_from: periodFrom,
      period_to: periodTo,
      currency: String(currency).toUpperCase(),
      subtotal,
      markup_total: markupTotal,
      total,
      status: 'draft',
      notes,
      bank_details: bankDetails,
      metadata: {
        source_order_ids: scoped.map((o) => o.id),
        statuses,
        manual_total: Number.isFinite(manualTotal) ? Number(manualTotal.toFixed(2)) : null
      },
      created_by: auth.profile.id
    };

    const { data: created, error: createError } = await supabase
      .from('invoices')
      .insert(invoice)
      .select('id,invoice_number,agency_id,period_from,period_to,currency,subtotal,markup_total,total,status,bank_details,notes,created_by,created_at,updated_at')
      .single();

    if (createError) {
      return res.status(500).json({
        error: {
          code: 'INVOICE_CREATE_FAILED',
          message: createError.message
        }
      });
    }

    return res.status(201).json({ invoice: created });
  } catch (err) {
    console.error('Invoice create error:', err);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: config.nodeEnv === 'development' ? err.message : 'Internal server error'
      }
    });
  }
});

// POST /invoices/:invoiceId/generate-pdf
router.post('/invoices/:invoiceId/generate-pdf', async (req, res) => {
  const auth = await resolveAuthContext(req);
  if (auth.error) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: auth.error } });
  }
  if (!ensureAdmin(auth, res)) return;

  const { invoiceId } = req.params;
  try {
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();
    if (invoiceError || !invoice) {
      return res.status(404).json({ error: { code: 'INVOICE_NOT_FOUND', message: 'Invoice not found' } });
    }
    const { doc, signedUrl } = await generateInvoicePdfForInvoice({
      invoice,
      createdBy: auth.profile.id
    });
    return res.json({
      document: doc,
      download_url: signedUrl
    });
  } catch (err) {
    console.error('Invoice PDF generation error:', err);
    return res.status(500).json({
      error: {
        code: 'INVOICE_PDF_FAILED',
        message: config.nodeEnv === 'development' ? err.message : 'Internal server error'
      }
    });
  }
});

// PATCH /invoices/:invoiceId
router.patch('/invoices/:invoiceId', async (req, res) => {
  const auth = await resolveAuthContext(req);
  if (auth.error) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: auth.error } });
  }
  if (!ensureAdmin(auth, res)) return;

  const { invoiceId } = req.params;
  const { status, notes, bank_details: bankDetails } = req.body || {};
  const allowedStatuses = new Set(['draft', 'issued', 'paid', 'cancelled']);

  if (status && !allowedStatuses.has(String(status).toLowerCase())) {
    return res.status(400).json({
      error: { code: 'INVALID_STATUS', message: 'Unsupported invoice status' }
    });
  }

  try {
    const patch = { updated_at: new Date().toISOString() };
    if (status !== undefined) patch.status = String(status).toLowerCase();
    if (notes !== undefined) patch.notes = notes;
    if (bankDetails !== undefined) patch.bank_details = bankDetails || {};

    const { data: updated, error: updateError } = await supabase
      .from('invoices')
      .update(patch)
      .eq('id', invoiceId)
      .select('*')
      .single();

    if (updateError || !updated) {
      return res.status(500).json({
        error: { code: 'INVOICE_UPDATE_FAILED', message: updateError?.message || 'Invoice update failed' }
      });
    }

    let generated = null;
    if (patch.status === 'issued') {
      generated = await generateInvoicePdfForInvoice({
        invoice: updated,
        createdBy: auth.profile.id
      });
    }

    return res.json({
      invoice: updated,
      document: generated?.doc || null,
      download_url: generated?.signedUrl || null
    });
  } catch (err) {
    console.error('Invoice update error:', err);
    return res.status(500).json({
      error: {
        code: 'INVOICE_UPDATE_FAILED',
        message: config.nodeEnv === 'development' ? err.message : 'Internal server error'
      }
    });
  }
});

// GET /tickets
router.get('/tickets', async (req, res) => {
  const auth = await resolveAuthContext(req);
  if (auth.error) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: auth.error } });
  }
  if (!ensureAdmin(auth, res)) return;

  const rawLimit = Number(req.query.limit || 200);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 1000) : 200;
  const {
    agency_id: agencyId,
    order_status: orderStatus,
    status,
    email_status: emailStatus,
    date_from: dateFrom,
    date_to: dateTo,
    q
  } = req.query;
  const fromIso = toIsoDateStart(dateFrom);
  const toIso = toIsoDateEnd(dateTo);

  try {
    let query = supabase
      .from('ticket_issuances')
      .select('id,order_id,agency_id,drct_order_id,ticket_number,pnr,issued_at,status,email_status,email_sent_at,document_id,created_at,updated_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (agencyId) query = query.eq('agency_id', agencyId);
    if (status) query = query.eq('status', status);
    if (emailStatus) query = query.eq('email_status', emailStatus);
    if (fromIso) query = query.gte('created_at', fromIso);
    if (toIso) query = query.lte('created_at', toIso);

    const { data: rows, error } = await query;
    if (error) {
      return res.status(500).json({ error: { code: 'TICKETS_LIST_FAILED', message: error.message } });
    }

    const orderIds = [...new Set((rows || []).map((r) => r.order_id).filter(Boolean))];
    const agencyIds = [...new Set((rows || []).map((r) => r.agency_id).filter(Boolean))];

    const ordersMap = {};
    if (orderIds.length > 0) {
      const { data: orders } = await supabase
        .from('orders')
        .select('id,order_number,origin,destination,total_price,currency,contact_email,status')
        .in('id', orderIds);
      (orders || []).forEach((o) => {
        ordersMap[o.id] = o;
      });
    }

    const agenciesMap = {};
    if (agencyIds.length > 0) {
      const { data: agencies } = await supabase
        .from('agencies')
        .select('id,name,domain')
        .in('id', agencyIds);
      (agencies || []).forEach((a) => {
        agenciesMap[a.id] = a;
      });
    }

    let tickets = (rows || []).map((r) => ({
      ...r,
      order: ordersMap[r.order_id] || null,
      agency: agenciesMap[r.agency_id] || null
    }));

    if (q) {
      const needle = String(q).toLowerCase();
      tickets = tickets.filter((t) =>
        String(t.ticket_number || '').toLowerCase().includes(needle) ||
        String(t.pnr || '').toLowerCase().includes(needle) ||
        String(t.order?.order_number || '').toLowerCase().includes(needle) ||
        String(t.order?.contact_email || '').toLowerCase().includes(needle)
      );
    }

    if (orderStatus) {
      const normalized = String(orderStatus).toLowerCase();
      tickets = tickets.filter((t) => String(t.order?.status || '').toLowerCase() === normalized);
    }

    tickets.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

    return res.json({ tickets });
  } catch (err) {
    console.error('Admin tickets list error:', err);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: config.nodeEnv === 'development' ? err.message : 'Internal server error'
      }
    });
  }
});

// POST /api/admin/upload/logo — upload agency logo to Supabase Storage
router.post('/upload/logo', upload.single('file'), async (req, res) => {
  const auth = await resolveAuthContext(req);
  if (auth.error) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: auth.error } });
  if (!ensureAdmin(auth, res)) return;

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

// POST /api/admin/upload/media — upload destination/hero images to Supabase Storage
router.post('/upload/media', upload.single('file'), async (req, res) => {
  const auth = await resolveAuthContext(req);
  if (auth.error) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: auth.error } });
  if (!ensureAdmin(auth, res)) return;

  const file = req.file;
  if (!file) return res.status(400).json({ error: { code: 'NO_FILE', message: 'No file uploaded' } });

  const { agency_id: agencyId } = req.body || {};
  const ext = file.mimetype.split('/')[1]?.replace('jpeg', 'jpg').replace('svg+xml', 'svg') || 'jpg';
  const folder = agencyId ? `media/${agencyId}` : 'media/shared';
  const filename = `${folder}/${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${ext}`;

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

// GET /api/admin/upload/library — list shared destination images
router.get('/upload/library', async (req, res) => {
  const auth = await resolveAuthContext(req);
  if (auth.error) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: auth.error } });
  if (!ensureAdmin(auth, res)) return;

  try {
    const { data: files, error } = await supabase.storage
      .from('agency-assets')
      .list('media/shared', { limit: 200, sortBy: { column: 'created_at', order: 'desc' } });

    if (error) return res.status(500).json({ error: { code: 'LIST_FAILED', message: error.message } });

    const urls = (files || [])
      .filter(f => f.name && !f.name.startsWith('.'))
      .map(f => ({
        name: f.name,
        url: supabase.storage.from('agency-assets').getPublicUrl(`media/shared/${f.name}`).data.publicUrl,
        created_at: f.created_at,
      }));

    return res.json({ images: urls });
  } catch (err) {
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// POST /api/admin/agencies/provision — create agency record + deploy Netlify site
router.post('/agencies/provision', async (req, res) => {
  const auth = await resolveAuthContext(req);
  if (auth.error) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: auth.error } });
  if (!ensureAdmin(auth, res)) return;

  const {
    name,
    name_ar: nameAr = '',
    subdomain,
    contact_email: contactEmail,
    contact_phone: contactPhone = '',
    contact_phone2: contactPhone2 = '',
    whatsapp_phone: whatsappPhone = '',
    country = 'SA',
    address = '',
    brand_color: brandColor = '#1a3c8e',
    accent_color: accentColor = '#2468c4',
    supervisor_name: supervisorName = '',
    supervisor_email: supervisorEmail = '',
    language = 'en',
    commission_model: commissionModel = 'fixed',
    commission_fixed_amount: commissionFixedAmount = 0,
    commission_rate: commissionRate = 0,
    payment_methods: paymentMethods = ['online'],
    logo_url: logoUrl = '',
    about_en: aboutEn = '',
    about_ar: aboutAr = '',
    working_hours: workingHours = '',
    working_hours_ar: workingHoursAr = '',
    license_number: licenseNumber = '',
    iata_number: iataNumber = '',
    founded_year: foundedYear = '',
    google_maps_url: googleMapsUrl = '',
    instagram = '',
    twitter = '',
    snapchat = '',
    facebook = '',
    services = [],
    hero_tagline: heroTagline = '',
    hero_description: heroDescription = '',
    destinations: provisionDestinations = [],
    reviews: provisionReviews = [],
    featured_airlines: provisionFeaturedAirlines = [],
    hero_image_url: provisionHeroImageUrl = '',
    header_bg: provisionHeaderBg = '',
    footer_bg: provisionFooterBg = '',
    deploy_site: deploySite = true,
    send_setup_email: sendSetupEmail = false
  } = req.body || {};

  if (!name || !subdomain || !contactEmail) {
    return res.status(400).json({
      error: { code: 'INVALID_INPUT', message: 'name, subdomain, contact_email are required' }
    });
  }

  const cleanSubdomain = String(subdomain).trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
  if (!cleanSubdomain) {
    return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Invalid subdomain' } });
  }

  // Check subdomain not taken
  const { data: existing } = await supabase
    .from('agencies')
    .select('id')
    .eq('domain', `${cleanSubdomain}.aviaframe.com`)
    .maybeSingle();
  if (existing) {
    return res.status(409).json({ error: { code: 'SUBDOMAIN_TAKEN', message: `Subdomain ${cleanSubdomain}.aviaframe.com already exists` } });
  }

  // Generate api_key
  const apiKey = 'ag_' + crypto.randomBytes(20).toString('hex');

  // Build settings
  let settings = {
    language,
    commission: {
      model: commissionModel,
      fixed_amount: Number(commissionFixedAmount) || 0,
      currency: 'SAR'
    },
    payment_methods: Array.isArray(paymentMethods) && paymentMethods.length ? paymentMethods : ['online'],
    widget_allowed_domains: [`${cleanSubdomain}.aviaframe.com`],
    site: {
      name_ar: nameAr,
      contact_phone2: contactPhone2,
      whatsapp_phone: whatsappPhone,
      brand_color: brandColor,
      accent_color: accentColor,
      supervisor_name: supervisorName,
      supervisor_email: supervisorEmail,
      logo_url: logoUrl,
      about_en: aboutEn,
      about_ar: aboutAr,
      working_hours: workingHours,
      working_hours_ar: workingHoursAr,
      license_number: licenseNumber,
      iata_number: iataNumber,
      founded_year: foundedYear,
      google_maps_url: googleMapsUrl,
      instagram,
      twitter,
      snapchat,
      facebook,
      services: Array.isArray(services) ? services : [],
      hero_tagline: heroTagline || '',
      hero_description: heroDescription || '',
      destinations: Array.isArray(provisionDestinations) ? provisionDestinations : [],
      reviews: Array.isArray(provisionReviews) ? provisionReviews : [],
      featured_airlines: Array.isArray(provisionFeaturedAirlines) ? provisionFeaturedAirlines : [],
      hero_image_url: provisionHeroImageUrl || '',
      header_bg: provisionHeaderBg || '',
      footer_bg: provisionFooterBg || ''
    }
  };
  settings = applyAgencyOnboardingState({
    agency: {
      name: String(name).trim(),
      domain: `${cleanSubdomain}.aviaframe.com`,
      contact_email: String(contactEmail).trim().toLowerCase(),
      contact_phone: contactPhone || null,
      settings
    },
    settings
  });

  try {
    const { data: agency, error: createError } = await supabase
      .from('agencies')
      .insert({
        name: String(name).trim(),
        domain: `${cleanSubdomain}.aviaframe.com`,
        api_key: apiKey,
        contact_email: String(contactEmail).trim().toLowerCase(),
        contact_phone: contactPhone || null,
        country: country || 'SA',
        address: address || null,
        commission_rate: Number(commissionRate) || 0,
        is_active: true,
        settings
      })
      .select(AGENCY_SELECT)
      .single();

    if (createError || !agency) {
      return res.status(500).json({ error: { code: 'AGENCY_CREATE_FAILED', message: createError?.message || 'Failed to create agency' } });
    }

    let responseAgency = agency;
    let setupEmail = null;
    if (sendSetupEmail) {
      try {
        const setupResult = await sendAgencySetupEmailFlow({ agency: responseAgency, auth });
        responseAgency = setupResult.agency;
        setupEmail = {
          sent: true,
          invited: setupResult.auth_user?.invited || false,
          created: setupResult.auth_user?.created || false
        };
      } catch (setupErr) {
        console.error('Agency provisioned but setup email flow failed:', setupErr);
        return res.status(502).json({
          error: {
            code: setupErr.code || 'AGENCY_SETUP_EMAIL_FAILED',
            message: setupErr.message || 'Agency created, but setup email could not be sent.'
          },
          agency: withAgencyLifecycle(responseAgency)
        });
      }
    }

    let deployResult = null;
    let deployError = null;
    let dnsResult = null;
    let dnsError = null;

    if (deploySite) {
      try {
        deployResult = await runAgencySiteDeploy({ agency: responseAgency, auth, enforceReady: false });
        responseAgency = deployResult.agency;
      } catch (e) {
        deployError = e.message;
        console.error('[provision] Netlify deploy failed:', e.message);
      }

      if (deployResult?.site_url) {
        const netlifyAppName = `aviaframe-${cleanSubdomain}`;
        try {
          dnsResult = await addGodaddyCname({ subdomain: cleanSubdomain, netlifyAppName });
        } catch (e) {
          dnsError = e.message;
          console.error('[provision] GoDaddy CNAME failed:', e.message);
        }
      }
    }

    return res.status(201).json({
      agency: withAgencyLifecycle(responseAgency),
      site_url: deployResult?.site_url || inferSiteUrl(responseAgency) || `https://${cleanSubdomain}.aviaframe.com`,
      deploy_id: deployResult?.deploy_id || null,
      deploy_error: deployError || null,
      dns: dnsResult,
      dns_error: dnsError || null,
      setup_email: setupEmail
    });
  } catch (err) {
    console.error('Agency provision error:', err);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: config.nodeEnv === 'development' ? err.message : 'Internal server error' }
    });
  }
});

// POST /api/admin/agencies/:id/send-setup-email — invite manager and send onboarding instructions
router.post('/agencies/:id/send-setup-email', async (req, res) => {
  const auth = await resolveAuthContext(req);
  if (auth.error) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: auth.error } });
  if (!ensureAdmin(auth, res)) return;

  const agencyId = String(req.params.id || '').trim();
  if (!agencyId) {
    return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Agency id is required' } });
  }

  try {
    const { agency, error, fallbackUsed } = await loadAgencyById(agencyId);

    if (error) {
      return res.status(500).json({ error: { code: 'AGENCY_LOOKUP_FAILED', message: error.message } });
    }
    if (!agency) {
      return res.status(404).json({ error: { code: 'AGENCY_NOT_FOUND', message: 'Agency not found' } });
    }
    if (fallbackUsed) {
      console.warn(`[admin/agencies/${agencyId}] fallback lookup used during setup email resend`);
    }

    const result = await sendAgencySetupEmailFlow({ agency, auth });
    return res.json({
      agency: withAgencyLifecycle(result.agency),
      setup_email: {
        sent: true,
        invited: result.auth_user?.invited || false,
        created: result.auth_user?.created || false
      },
      linked_profile: result.linked_profile || null
    });
  } catch (err) {
    console.error('Agency setup email error:', err);
    const statusCode = err.code === 'PROFILE_ALREADY_LINKED_TO_AGENCY' ? 409 : 502;
    return res.status(statusCode).json({
      error: {
        code: err.code || 'AGENCY_SETUP_EMAIL_FAILED',
        message: err.message || 'Failed to send setup email'
      }
    });
  }
});

// POST /api/admin/agencies/:id/publish-site — publish or update agency site after onboarding
router.post('/agencies/:id/publish-site', async (req, res) => {
  const auth = await resolveAuthContext(req);
  if (auth.error) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: auth.error } });
  if (!ensureAdmin(auth, res)) return;

  const agencyId = String(req.params.id || '').trim();
  if (!agencyId) {
    return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Agency id is required' } });
  }

  try {
    const { agency, error, fallbackUsed } = await loadAgencyById(agencyId);

    if (error) {
      return res.status(500).json({ error: { code: 'AGENCY_LOOKUP_FAILED', message: error.message } });
    }
    if (!agency) {
      return res.status(404).json({ error: { code: 'AGENCY_NOT_FOUND', message: 'Agency not found' } });
    }
    if (fallbackUsed) {
      console.warn(`[admin/agencies/${agencyId}] fallback lookup used during publish`);
    }

    const deployResult = await runAgencySiteDeploy({ agency, auth, enforceReady: true });
    return res.json({
      agency: withAgencyLifecycle(deployResult.agency),
      site_url: deployResult.site_url,
      deploy_id: deployResult.deploy_id,
      refreshed: true
    });
  } catch (err) {
    console.error('Agency publish site error:', err);
    const statusCode =
      err.code === 'AGENCY_ONBOARDING_INCOMPLETE' ? 409 :
      err.code === 'DEPLOY_IN_PROGRESS' || err.code === 'DEPLOY_COOLDOWN' ? 429 :
      err.code === 'UNSUPPORTED_DOMAIN' ? 400 :
      500;
    return res.status(statusCode).json({
      error: {
        code: err.code || 'INTERNAL_ERROR',
        message: publicRouteErrorMessage(err, statusCode)
      }
    });
  }
});

// POST /api/admin/agencies/:id/redeploy-site — refresh existing agency site with latest widget + booking assets
router.post('/agencies/:id/redeploy-site', async (req, res) => {
  const auth = await resolveAuthContext(req);
  if (auth.error) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: auth.error } });
  if (!ensureAdmin(auth, res)) return;

  const agencyId = String(req.params.id || '').trim();
  if (!agencyId) {
    return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Agency id is required' } });
  }

  try {
    const { agency, error, fallbackUsed } = await loadAgencyById(agencyId);

    if (error) {
      return res.status(500).json({ error: { code: 'AGENCY_LOOKUP_FAILED', message: error.message } });
    }
    if (!agency) {
      return res.status(404).json({ error: { code: 'AGENCY_NOT_FOUND', message: 'Agency not found' } });
    }
    if (fallbackUsed) {
      console.warn(`[admin/agencies/${agencyId}] fallback lookup used during redeploy`);
    }

    const deployResult = await runAgencySiteDeploy({ agency, auth, enforceReady: false });

    return res.json({
      agency: withAgencyLifecycle(deployResult.agency),
      site_url: deployResult.site_url,
      deploy_id: deployResult.deploy_id,
      refreshed: true
    });
  } catch (err) {
    console.error('Agency redeploy error:', err);
    const statusCode =
      err.code === 'DEPLOY_IN_PROGRESS' || err.code === 'DEPLOY_COOLDOWN' ? 429 :
      err.code === 'UNSUPPORTED_DOMAIN' ? 400 :
      500;
    return res.status(statusCode).json({
      error: {
        code: err.code || 'INTERNAL_ERROR',
        message: publicRouteErrorMessage(err, statusCode)
      }
    });
  }
});

// GET /api/admin/reports/sales?date_from=&date_to=&agency_id=&status=&format=csv|json|xlsx|txt
router.get('/reports/sales', async (req, res) => {
  const auth = await resolveAuthContext(req);
  if (auth.error) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: auth.error } });
  if (!ensureAdmin(auth, res)) return;

  const { date_from, date_to, agency_id, status, format = 'json' } = req.query;
  const fmt = String(format).toLowerCase();

  try {
    let query = supabase
      .from('orders')
      .select([
        'id', 'order_number', 'agency_id', 'user_id', 'drct_order_id', 'offer_id',
        'origin', 'destination', 'departure_time', 'arrival_time',
        'airline_code', 'airline_name', 'flight_number',
        'base_price', 'taxes', 'baggage_price', 'markup_amount', 'total_price', 'currency',
        'status', 'payment_status', 'payment_method', 'payment_transaction_id',
        'contact_email', 'contact_phone',
        'notes', 'metadata',
        'booked_at', 'confirmed_at', 'cancelled_at', 'created_at', 'updated_at',
        'agencies(name,domain,contact_email)'
      ].join(','))
      .order('created_at', { ascending: false })
      .limit(50000);

    if (date_from) query = query.gte('created_at', toIsoDateStart(date_from));
    if (date_to) query = query.lte('created_at', toIsoDateEnd(date_to));
    if (agency_id) query = query.eq('agency_id', agency_id);
    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: { code: 'QUERY_FAILED', message: error.message } });

    const rows = (data || []).map((o) => ({
      id: o.id,
      order_number: o.order_number,
      agency_id: o.agency_id,
      agency_name: o.agencies?.name || '',
      agency_domain: o.agencies?.domain || '',
      agency_email: o.agencies?.contact_email || '',
      user_id: o.user_id,
      drct_order_id: o.drct_order_id || '',
      offer_id: o.offer_id || '',
      origin: o.origin || '',
      destination: o.destination || '',
      departure_time: o.departure_time || '',
      arrival_time: o.arrival_time || '',
      airline_code: o.airline_code || '',
      airline_name: o.airline_name || '',
      flight_number: o.flight_number || '',
      base_price: o.base_price ?? '',
      taxes: o.taxes ?? '',
      baggage_price: o.baggage_price ?? '',
      markup_amount: o.markup_amount ?? '',
      total_price: o.total_price ?? '',
      currency: o.currency || '',
      status: o.status || '',
      payment_status: o.payment_status || '',
      payment_method: o.payment_method || '',
      payment_transaction_id: o.payment_transaction_id || '',
      contact_email: o.contact_email || '',
      contact_phone: o.contact_phone || '',
      notes: o.notes || '',
      metadata: o.metadata ? JSON.stringify(o.metadata) : '',
      booked_at: o.booked_at || '',
      confirmed_at: o.confirmed_at || '',
      cancelled_at: o.cancelled_at || '',
      created_at: o.created_at || '',
      updated_at: o.updated_at || ''
    }));

    if (fmt === 'json') {
      return res.json({ total: rows.length, rows });
    }

    const COLUMNS = Object.keys(rows[0] || {});

    if (fmt === 'csv') {
      const escape = (v) => {
        const s = String(v ?? '').replace(/"/g, '""');
        return /[,"\n\r]/.test(s) ? `"${s}"` : s;
      };
      const lines = [
        COLUMNS.join(','),
        ...rows.map((r) => COLUMNS.map((c) => escape(r[c])).join(','))
      ];
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="sales_report_${date_from || 'all'}_${date_to || 'all'}.csv"`);
      return res.send('\uFEFF' + lines.join('\r\n'));
    }

    if (fmt === 'txt') {
      const lines = [
        COLUMNS.join('\t'),
        ...rows.map((r) => COLUMNS.map((c) => String(r[c] ?? '').replace(/\t/g, ' ')).join('\t'))
      ];
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="sales_report_${date_from || 'all'}_${date_to || 'all'}.txt"`);
      return res.send(lines.join('\n'));
    }

    if (fmt === 'xlsx') {
      // Build XLSX manually (minimal implementation, no external deps)
      // Use CSV with xlsx content-type as fallback if no xlsx lib available
      try {
        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Sales');
        sheet.addRow(COLUMNS);
        sheet.getRow(1).font = { bold: true };
        rows.forEach((r) => sheet.addRow(COLUMNS.map((c) => r[c] ?? '')));
        COLUMNS.forEach((_, i) => { sheet.getColumn(i + 1).width = 18; });
        const buffer = await workbook.xlsx.writeBuffer();
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="sales_report_${date_from || 'all'}_${date_to || 'all'}.xlsx"`);
        return res.send(buffer);
      } catch (e) {
        // exceljs not installed — fallback to CSV
        const escape = (v) => {
          const s = String(v ?? '').replace(/"/g, '""');
          return /[,"\n\r]/.test(s) ? `"${s}"` : s;
        };
        const lines = [COLUMNS.join(','), ...rows.map((r) => COLUMNS.map((c) => escape(r[c])).join(','))];
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="sales_report_${date_from || 'all'}_${date_to || 'all'}.csv"`);
        return res.send('\uFEFF' + lines.join('\r\n'));
      }
    }

    return res.status(400).json({ error: { code: 'INVALID_FORMAT', message: 'format must be one of: json, csv, xlsx, txt' } });
  } catch (err) {
    console.error('Sales report error:', err);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: config.nodeEnv === 'development' ? err.message : 'Internal server error' } });
  }
});

module.exports = router;
