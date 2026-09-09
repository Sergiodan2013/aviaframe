'use strict';

const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { config } = require('../config');
const { createMemoryRateLimiter } = require('../middleware/requestGuards');
const { sendAgencyLeadEmail } = require('../services/emailService');

const MAX_FIELD_LENGTH = 2000;
const REQUIRED_FIELDS = [
  'Agency Name (EN)', 'Admin Email', 'Contact Phone', 'Subdomain', 'Country',
  'Commission Rate %', 'Site Language', 'Logo URL', 'Primary Color', 'Accent Color',
  'Hero Headline', 'Hero Subtext', 'Hero Image URL', 'About (EN)', 'Address',
  'Working Hours (EN)', 'Google Maps URL', 'WhatsApp', 'Top Destinations',
  'License Number', 'Founded Year', 'Supervisor Name',
  'Consent: Subagency Agreement & Paid Service', 'Consent: Personal Data Processing'
];

const leadRateLimiter = createMemoryRateLimiter({
  bucket: 'agency-leads',
  max: config.agencyLeadRateLimitMax,
  windowMs: config.agencyLeadRateLimitWindowMs,
});

function clean(value, max = MAX_FIELD_LENGTH) {
  return String(value ?? '').trim().slice(0, max);
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function buildLead(rawForm) {
  const form = rawForm && typeof rawForm === 'object' && !Array.isArray(rawForm) ? rawForm : {};
  const values = Object.fromEntries(Object.entries(form).map(([key, value]) => [clean(key, 100), clean(value)]));
  const missing = REQUIRED_FIELDS.filter((field) => !values[field]);
  const services = Object.entries(values)
    .filter(([key, value]) => key.startsWith('Service:') && value)
    .map(([, value]) => value)
    .slice(0, 12);

  if (missing.length || !services.length) {
    const fields = [...missing, ...(services.length ? [] : ['Services offered'])];
    const error = new Error('Please complete all required fields.');
    error.code = 'INVALID_APPLICATION';
    error.fields = fields;
    throw error;
  }
  if (!isEmail(values['Admin Email'])) {
    const error = new Error('Enter a valid admin email address.');
    error.code = 'INVALID_EMAIL';
    throw error;
  }
  if (!/^[a-z0-9-]+$/.test(values.Subdomain)) {
    const error = new Error('Subdomain may contain lowercase letters, numbers, and hyphens only.');
    error.code = 'INVALID_SUBDOMAIN';
    throw error;
  }

  return {
    agency_name: values['Agency Name (EN)'],
    supervisor_name: values['Supervisor Name'],
    contact_email: values['Admin Email'].toLowerCase(),
    contact_phone: values['Contact Phone'],
    country: values.Country,
    subdomain: values.Subdomain,
    services,
    form_data: values,
  };
}

// POST /api/agency-leads - public website application endpoint.
router.post('/agency-leads', leadRateLimiter, async (req, res) => {
  let lead;
  try {
    lead = buildLead(req.body?.form);
  } catch (err) {
    return res.status(400).json({
      error: {
        code: err.code || 'INVALID_APPLICATION',
        message: err.message || 'Invalid application.',
        fields: err.fields || undefined,
      }
    });
  }

  try {
    const { data: savedLead, error: saveError } = await supabase
      .from('agency_leads')
      .insert(lead)
      .select('*')
      .single();
    if (saveError || !savedLead) {
      console.error('Agency lead save failed:', saveError?.message || 'no row returned');
      return res.status(503).json({ error: { code: 'LEAD_SAVE_FAILED', message: 'Temporary connection error. Please try again.' } });
    }

    let notificationStatus = 'sent';
    let notificationError = null;
    try {
      const result = await sendAgencyLeadEmail({ to: config.agencyLeadRecipients, lead: savedLead });
      if (!result.sent) {
        notificationStatus = 'failed';
        notificationError = result.error || 'Notification provider is not configured';
      }
    } catch (err) {
      notificationStatus = 'failed';
      notificationError = err.message || 'Notification failed';
      console.error('Agency lead notification failed:', notificationError);
    }

    await supabase
      .from('agency_leads')
      .update({
        notification_status: notificationStatus,
        notification_error: notificationError,
        notified_at: notificationStatus === 'sent' ? new Date().toISOString() : null,
      })
      .eq('id', savedLead.id);

    return res.status(201).json({
      lead_id: savedLead.id,
      notification_sent: notificationStatus === 'sent',
    });
  } catch (err) {
    console.error('Agency lead processing failed:', err);
    return res.status(500).json({ error: { code: 'LEAD_PROCESSING_FAILED', message: 'Temporary connection error. Please try again.' } });
  }
});

module.exports = router;
