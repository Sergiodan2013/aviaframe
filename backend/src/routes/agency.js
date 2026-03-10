'use strict';

const express = require('express');
const supabase = require('../lib/supabase');
const { normalizeHost } = require('../lib/utils');
const { resolveAuthContext } = require('../middleware/auth');
const { ensureStaff } = require('../middleware/requireRole');

const router = express.Router();

// GET /api/agency/me
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
    .select('id,name,domain,api_key,contact_email,contact_phone,country,address,is_active,commission_rate,settings,created_at,updated_at')
    .eq('id', auth.profile.agency_id)
    .single();

  if (error || !data) {
    return res.status(404).json({ error: { code: 'AGENCY_NOT_FOUND', message: 'Agency not found' } });
  }
  return res.json({ agency: data });
});

// PATCH /api/agency/me
router.patch('/me', async (req, res) => {
  const auth = await resolveAuthContext(req);
  if (auth.error) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: auth.error } });
  }
  if (!ensureStaff(auth, res)) return;
  if (!auth.profile.agency_id) {
    return res.status(404).json({ error: { code: 'AGENCY_NOT_ASSIGNED', message: 'Profile has no agency_id' } });
  }

  const nodeEnv = req.app.get('nodeEnv');
  const {
    commission_rate: commissionRate,
    commission_model: commissionModel,
    commission_fixed_amount: commissionFixedAmount,
    currency,
    language,
    bank_details: bankDetails,
    contact_person_name: contactPersonName,
    widget_allowed_domains: widgetAllowedDomains
  } = req.body || {};

  try {
    const { data: current, error: currentError } = await supabase
      .from('agencies')
      .select('id,settings,commission_rate')
      .eq('id', auth.profile.agency_id)
      .single();

    if (currentError || !current) {
      return res.status(404).json({ error: { code: 'AGENCY_NOT_FOUND', message: 'Agency not found' } });
    }

    const settings = { ...(current.settings || {}) };
    settings.commission = {
      ...(settings.commission || {}),
      ...(commissionModel !== undefined ? { model: commissionModel } : {}),
      ...(commissionFixedAmount !== undefined ? { fixed_amount: Number(commissionFixedAmount) || 0 } : {}),
      ...(currency !== undefined ? { currency: String(currency).toUpperCase() } : {})
    };
    if (language !== undefined) settings.language = language;
    if (bankDetails !== undefined) settings.bank_details = bankDetails || {};
    if (widgetAllowedDomains !== undefined) {
      settings.widget_allowed_domains = Array.isArray(widgetAllowedDomains)
        ? widgetAllowedDomains.map((d) => normalizeHost(d)).filter(Boolean)
        : [];
    }
    if (contactPersonName !== undefined) {
      settings.contact_person = {
        ...(settings.contact_person || {}),
        full_name: contactPersonName || null
      };
    }

    const patch = {
      settings,
      updated_at: new Date().toISOString()
    };
    if (commissionRate !== undefined) {
      patch.commission_rate = Number(commissionRate) || 0;
    }

    const { data, error } = await supabase
      .from('agencies')
      .update(patch)
      .eq('id', auth.profile.agency_id)
      .select('id,name,domain,api_key,contact_email,contact_phone,country,address,is_active,commission_rate,settings,created_at,updated_at')
      .single();

    if (error) {
      return res.status(500).json({ error: { code: 'AGENCY_UPDATE_FAILED', message: error.message } });
    }

    return res.json({ agency: data });
  } catch (err) {
    console.error('Agency self update error:', err);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: nodeEnv === 'development' ? err.message : 'Internal server error'
      }
    });
  }
});

module.exports = router;
