'use strict';

const express = require('express');
const supabase = require('../lib/supabase');
const { isAdminRole, normalizeHost, toIsoDateStart, toIsoDateEnd, generateInvoiceNumber } = require('../lib/utils');
const { forbidden } = require('../lib/authorization');
const { linkAgencyAdminProfileByEmail, ensureAuthUserByEmail } = require('../lib/authProvisioning');
const { uploadPdfToStorage, saveDocumentMetadata, createSignedDocumentUrl, toSha256 } = require('../lib/documentStorage');
const { resolveAuthContext } = require('../middleware/auth');
const { ensureAdmin } = require('../middleware/requireRole');
const { buildInvoicePdf } = require('../services/pdfService');
const { sendAgencyWelcome, previewTemplate } = require('../services/emailService');
const drctService = require('../services/drctService');

const router = express.Router();

const ORDERS_LIST_COLUMNS = [
  'id',
  'order_number',
  'user_id',
  'agency_id',
  'drct_order_id',
  'origin',
  'destination',
  'departure_time',
  'arrival_time',
  'airline_code',
  'airline_name',
  'flight_number',
  'total_price',
  'currency',
  'status',
  'payment_method',
  'payment_status',
  'contact_email',
  'contact_phone',
  'created_at',
  'updated_at',
  'confirmed_at',
  'cancelled_at'
].join(',');

async function generateInvoicePdfForInvoice({ invoice, createdBy }) {
  const documentsBucket = process.env.DOCUMENTS_BUCKET || 'documents';

  const { data: agency } = await supabase
    .from('agencies')
    .select('id,name,domain,contact_email,contact_phone,settings')
    .eq('id', invoice.agency_id)
    .single();

  const orderIds = Array.isArray(invoice?.metadata?.source_order_ids)
    ? invoice.metadata.source_order_ids
    : [];
  let orders = [];
  if (orderIds.length > 0) {
    const { data } = await supabase
      .from('orders')
      .select('id,order_number,origin,destination,total_price,currency,status')
      .in('id', orderIds);
    orders = data || [];
  }

  const pdfBuffer = await buildInvoicePdf({ invoice, agency, orders });
  const fileName = `${invoice.invoice_number || invoice.id}.pdf`;
  const folder = `invoices/${invoice.id}`;
  const timestamp = Date.now();
  const safeName = String(fileName).replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `${documentsBucket}/${folder}/${timestamp}-${safeName}`;

  await uploadPdfToStorage(supabase, pdfBuffer, storagePath);

  const doc = await saveDocumentMetadata(supabase, {
    docType: 'invoice_pdf',
    entityType: 'invoice',
    entityId: invoice.id,
    agencyId: invoice.agency_id,
    invoiceId: invoice.id,
    fileName,
    storagePath: storagePath.slice(documentsBucket.length + 1),
    storageBucket: documentsBucket,
    sizeBytes: pdfBuffer.length,
    checksum: toSha256(pdfBuffer),
    createdBy,
    metadata: {
      invoice_number: invoice.invoice_number,
      agency_name: agency?.name || null
    }
  });

  const signedUrl = await createSignedDocumentUrl(supabase, storagePath, 3600);
  return { doc, signedUrl };
}

// GET /api/admin/super-admins
router.get('/super-admins', async (req, res) => {
  const auth = await resolveAuthContext(req);
  if (auth.error) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: auth.error } });
  }
  if (!ensureAdmin(auth, res)) return;

  const nodeEnv = req.app.get('nodeEnv');
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
        message: nodeEnv === 'development' ? err.message : 'Internal server error'
      }
    });
  }
});

// POST /api/admin/super-admins
router.post('/super-admins', async (req, res) => {
  const auth = await resolveAuthContext(req);
  if (auth.error) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: auth.error } });
  }
  if (!ensureAdmin(auth, res)) return;

  const nodeEnv = req.app.get('nodeEnv');
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
        message: nodeEnv === 'development' ? err.message : 'Internal server error'
      }
    });
  }
});

// GET /api/admin/agencies
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

  const nodeEnv = req.app.get('nodeEnv');
  const rawLimit = Number(req.query.limit || 200);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 1000) : 200;
  const { q = '', is_active: isActiveFilter, country } = req.query;

  try {
    let query = supabase
      .from('agencies')
      .select('id,name,domain,api_key,contact_email,contact_phone,country,address,is_active,commission_rate,settings,created_at,updated_at')
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

    return res.json({ agencies: data || [] });
  } catch (err) {
    console.error('Agencies list error:', err);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: nodeEnv === 'development' ? err.message : 'Internal server error'
      }
    });
  }
});

// POST /api/admin/agencies
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

  const nodeEnv = req.app.get('nodeEnv');
  const crypto = require('crypto');

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
    widget_allowed_domains: widgetAllowedDomains = []
  } = req.body || {};

  if (!name || !contactEmail) {
    return res.status(400).json({
      error: {
        code: 'INVALID_INPUT',
        message: 'name and contact_email are required'
      }
    });
  }

  const bd = bankDetails || {};
  if (!bd.bank_name || !bd.iban) {
    return res.status(400).json({
      error: {
        code: 'INVALID_INPUT',
        message: 'bank_details.bank_name and bank_details.iban are required — they are displayed to clients in payment instructions'
      }
    });
  }

  const apiKey = `ag_${crypto.randomBytes(20).toString('hex')}`;
  const safeDomain = domain ? String(domain).trim().toLowerCase() : null;
  const settings = {
    language,
    bank_details: bankDetails,
    widget_allowed_domains: Array.isArray(widgetAllowedDomains)
      ? widgetAllowedDomains
          .map((d) => normalizeHost(d))
          .filter(Boolean)
      : [],
    contact_person: {
      full_name: contactPersonName
    }
  };

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
      .select('id,name,domain,api_key,contact_email,contact_phone,country,address,is_active,commission_rate,settings,created_at,updated_at')
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

    // Send welcome email to the new agency admin (non-blocking)
    sendAgencyWelcome({ agency: data })
      .then((r) => { if (!r.sent) console.warn('[agency] welcome email not sent:', r.error); })
      .catch((e) => console.error('[agency] welcome email error:', e.message));

    return res.status(201).json({ agency: data, linked_profile: linkedProfile || null });
  } catch (err) {
    console.error('Agency create error:', err);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: nodeEnv === 'development' ? err.message : 'Internal server error'
      }
    });
  }
});

// PATCH /api/admin/agencies/:agencyId
router.patch('/agencies/:agencyId', async (req, res) => {
  const auth = await resolveAuthContext(req);
  if (auth.error) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: auth.error } });
  }
  if (!ensureAdmin(auth, res)) return;

  const nodeEnv = req.app.get('nodeEnv');
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
    is_active: isActive,
    language,
    bank_details: bankDetails,
    widget_allowed_domains: widgetAllowedDomains,
    markup_type: markupType,
    markup_value: markupValue,
    commission_model: commissionModel,
    commission_fixed_amount: commissionFixedAmount,
  } = req.body || {};

  try {
    const { data: current, error: currentError } = await supabase
      .from('agencies')
      .select('id,settings')
      .eq('id', agencyId)
      .single();

    if (currentError || !current) {
      return res.status(404).json({
        error: { code: 'AGENCY_NOT_FOUND', message: 'Agency not found' }
      });
    }

    const settings = {
      ...(current.settings || {})
    };
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
    if (markupType !== undefined) {
      settings.markup_type = markupType;
      settings.markup_value = Number(markupValue || 0);
    }
    if (commissionModel !== undefined) {
      settings.commission = {
        ...(settings.commission || {}),
        model: commissionModel,
        fixed_amount: Number(commissionFixedAmount || 0),
      };
    }

    const patch = {
      updated_at: new Date().toISOString(),
      settings
    };
    if (name !== undefined) patch.name = String(name).trim();
    if (domain !== undefined) patch.domain = domain ? String(domain).trim().toLowerCase() : null;
    if (contactEmail !== undefined) patch.contact_email = contactEmail ? String(contactEmail).trim().toLowerCase() : null;
    if (contactPhone !== undefined) patch.contact_phone = contactPhone || null;
    if (country !== undefined) patch.country = country ? String(country).toUpperCase() : null;
    if (address !== undefined) patch.address = address || null;
    if (commissionRate !== undefined) patch.commission_rate = Number(commissionRate) || 0;
    if (isActive !== undefined) patch.is_active = !!isActive;

    const { data, error } = await supabase
      .from('agencies')
      .update(patch)
      .eq('id', agencyId)
      .select('id,name,domain,api_key,contact_email,contact_phone,country,address,is_active,commission_rate,settings,created_at,updated_at')
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

    return res.json({ agency: data });
  } catch (err) {
    console.error('Agency update error:', err);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: nodeEnv === 'development' ? err.message : 'Internal server error'
      }
    });
  }
});

// DELETE /api/admin/agencies/:agencyId
router.delete('/agencies/:agencyId', async (req, res) => {
  const auth = await resolveAuthContext(req);
  if (auth.error) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: auth.error } });
  }
  if (!ensureAdmin(auth, res)) return;

  const nodeEnv = req.app.get('nodeEnv');
  const { agencyId } = req.params;
  try {
    // Downgrade agent profiles before deleting (schema sets agency_id=null but not role)
    await supabase
      .from('profiles')
      .update({ role: 'user' })
      .eq('agency_id', agencyId)
      .eq('role', 'agent');

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
    return res.json({ agency: data });
  } catch (err) {
    console.error('Agency delete error:', err);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: nodeEnv === 'development' ? err.message : 'Internal server error'
      }
    });
  }
});

// GET /api/admin/reports/orders
router.get('/reports/orders', async (req, res) => {
  const auth = await resolveAuthContext(req);
  if (auth.error) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: auth.error } });
  }
  if (!ensureAdmin(auth, res)) return;

  const nodeEnv = req.app.get('nodeEnv');
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
        message: nodeEnv === 'development' ? err.message : 'Internal server error'
      }
    });
  }
});

// GET /api/admin/reports/orders-summary
router.get('/reports/orders-summary', async (req, res) => {
  const auth = await resolveAuthContext(req);
  if (auth.error) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: auth.error } });
  }
  if (!ensureAdmin(auth, res)) return;

  const nodeEnv = req.app.get('nodeEnv');
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
        message: nodeEnv === 'development' ? err.message : 'Internal server error'
      }
    });
  }
});

// GET /api/admin/invoices
router.get('/invoices', async (req, res) => {
  const auth = await resolveAuthContext(req);
  if (auth.error) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: auth.error } });
  }
  if (!ensureAdmin(auth, res)) return;

  const nodeEnv = req.app.get('nodeEnv');
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
        message: nodeEnv === 'development' ? err.message : 'Internal server error'
      }
    });
  }
});

// POST /api/admin/invoices
router.post('/invoices', async (req, res) => {
  const auth = await resolveAuthContext(req);
  if (auth.error) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: auth.error } });
  }
  if (!ensureAdmin(auth, res)) return;

  const nodeEnv = req.app.get('nodeEnv');
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
        message: nodeEnv === 'development' ? err.message : 'Internal server error'
      }
    });
  }
});

// POST /api/admin/invoices/:invoiceId/generate-pdf
router.post('/invoices/:invoiceId/generate-pdf', async (req, res) => {
  const auth = await resolveAuthContext(req);
  if (auth.error) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: auth.error } });
  }
  if (!ensureAdmin(auth, res)) return;

  const nodeEnv = req.app.get('nodeEnv');
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
        message: nodeEnv === 'development' ? err.message : 'Internal server error'
      }
    });
  }
});

// PATCH /api/admin/invoices/:invoiceId
router.patch('/invoices/:invoiceId', async (req, res) => {
  const auth = await resolveAuthContext(req);
  if (auth.error) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: auth.error } });
  }
  if (!ensureAdmin(auth, res)) return;

  const nodeEnv = req.app.get('nodeEnv');
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
        message: nodeEnv === 'development' ? err.message : 'Internal server error'
      }
    });
  }
});

// GET /api/admin/tickets
router.get('/tickets', async (req, res) => {
  const auth = await resolveAuthContext(req);
  if (auth.error) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: auth.error } });
  }
  if (!ensureAdmin(auth, res)) return;

  const nodeEnv = req.app.get('nodeEnv');
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
        .select('id,name,domain,sama_code')
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
        message: nodeEnv === 'development' ? err.message : 'Internal server error'
      }
    });
  }
});

// GET /api/admin/email-templates
router.get('/email-templates', async (req, res) => {
  const auth = await resolveAuthContext(req);
  if (auth.error) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: auth.error } });
  if (!ensureAdmin(auth, res)) return;

  const { data, error } = await supabase
    .from('email_templates')
    .select('event_type,subject,blocks,variables,is_active,updated_at')
    .order('event_type');

  if (error) return res.status(500).json({ error: { code: 'DB_ERROR', message: error.message } });
  return res.json({ templates: data || [] });
});

// PATCH /api/admin/email-templates/:eventType
router.patch('/email-templates/:eventType', async (req, res) => {
  const auth = await resolveAuthContext(req);
  if (auth.error) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: auth.error } });
  if (!ensureAdmin(auth, res)) return;

  const { eventType } = req.params;
  const { subject, blocks, is_active } = req.body;

  const updateData = { updated_at: new Date().toISOString(), updated_by: auth.user.id };
  if (subject !== undefined) updateData.subject = subject;
  if (blocks !== undefined) updateData.blocks = blocks;
  if (is_active !== undefined) updateData.is_active = is_active;

  const { data, error } = await supabase
    .from('email_templates')
    .update(updateData)
    .eq('event_type', eventType)
    .select('event_type,subject,blocks,variables,is_active,updated_at')
    .single();

  if (error) return res.status(500).json({ error: { code: 'DB_ERROR', message: error.message } });
  return res.json({ template: data });
});

// POST /api/admin/email-templates/:eventType/preview
router.post('/email-templates/:eventType/preview', async (req, res) => {
  const auth = await resolveAuthContext(req);
  if (auth.error) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: auth.error } });
  if (!ensureAdmin(auth, res)) return;

  const { eventType } = req.params;
  const { agency_id } = req.body;

  try {
    const result = await previewTemplate(eventType, { agencyId: agency_id || null });
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: { code: 'PREVIEW_ERROR', message: err.message } });
  }
});

// GET /api/admin/agencies/:agencyId/email-templates/:eventType
router.get('/agencies/:agencyId/email-templates/:eventType', async (req, res) => {
  const auth = await resolveAuthContext(req);
  if (auth.error) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: auth.error } });
  if (!ensureAdmin(auth, res)) return;

  const { agencyId, eventType } = req.params;
  const { data, error } = await supabase
    .from('agency_email_templates')
    .select('id,agency_id,event_type,subject,blocks,is_active,updated_at')
    .eq('agency_id', agencyId)
    .eq('event_type', eventType)
    .maybeSingle();

  if (error) return res.status(500).json({ error: { code: 'DB_ERROR', message: error.message } });
  return res.json({ template: data || null });
});

// PATCH /api/admin/agencies/:agencyId/email-templates/:eventType
router.patch('/agencies/:agencyId/email-templates/:eventType', async (req, res) => {
  const auth = await resolveAuthContext(req);
  if (auth.error) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: auth.error } });
  if (!ensureAdmin(auth, res)) return;

  const { agencyId, eventType } = req.params;
  const { subject, blocks, is_active } = req.body;

  const upsertData = {
    agency_id: agencyId,
    event_type: eventType,
    updated_at: new Date().toISOString(),
    updated_by: auth.user.id
  };
  if (subject !== undefined) upsertData.subject = subject;
  if (blocks !== undefined) upsertData.blocks = blocks;
  if (is_active !== undefined) upsertData.is_active = is_active;

  const { data, error } = await supabase
    .from('agency_email_templates')
    .upsert(upsertData, { onConflict: 'agency_id,event_type' })
    .select('id,agency_id,event_type,subject,blocks,is_active,updated_at')
    .single();

  if (error) return res.status(500).json({ error: { code: 'DB_ERROR', message: error.message } });
  return res.json({ template: data });
});

// DELETE /api/admin/agencies/:agencyId/email-templates/:eventType
router.delete('/agencies/:agencyId/email-templates/:eventType', async (req, res) => {
  const auth = await resolveAuthContext(req);
  if (auth.error) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: auth.error } });
  if (!ensureAdmin(auth, res)) return;

  const { agencyId, eventType } = req.params;
  const { error } = await supabase
    .from('agency_email_templates')
    .delete()
    .eq('agency_id', agencyId)
    .eq('event_type', eventType);

  if (error) return res.status(500).json({ error: { code: 'DB_ERROR', message: error.message } });
  return res.json({ deleted: true });
});

// POST /api/admin/orders/:id/cancel — cancel a refundable order via DRCT API
router.post('/orders/:id/cancel', async (req, res) => {
  const auth = await resolveAuthContext(req);
  if (auth.error) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: auth.error } });
  if (!ensureAdmin(auth, res)) return;

  const nodeEnv = req.app.get('nodeEnv');
  const { id } = req.params;

  try {
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('id,order_number,drct_order_id,status,metadata,agency_id')
      .eq('id', id)
      .single();

    if (orderErr || !order) {
      return res.status(404).json({ error: { code: 'ORDER_NOT_FOUND', message: 'Order not found' } });
    }

    if (order.status === 'cancelled') {
      return res.status(422).json({ error: { code: 'ALREADY_CANCELLED', message: 'Order is already cancelled.' } });
    }

    if (!order.drct_order_id) {
      return res.status(422).json({ error: { code: 'NO_DRCT_ORDER', message: 'No DRCT order ID — cannot cancel via API.' } });
    }

    const envName = order.metadata?.drct_env || null;

    try {
      await drctService.cancelOrder(order.drct_order_id, envName);
      console.log(`[admin/orders/cancel] DRCT order ${order.drct_order_id} cancelled by admin ${auth.profile.id}`);
    } catch (err) {
      // Best-effort: log DRCT failure but still cancel in Supabase
      console.error('[admin/orders/cancel] DRCT cancel failed (continuing):', err.message, JSON.stringify(err.data || {}));
    }

    const nowIso = new Date().toISOString();
    const { data: updated, error: updateErr } = await supabase
      .from('orders')
      .update({ status: 'cancelled', cancelled_at: nowIso, updated_at: nowIso })
      .eq('id', id)
      .select('id,order_number,status,cancelled_at')
      .single();

    if (updateErr) {
      console.error('CRITICAL: DRCT order cancelled but DB update failed. order.id=', id, updateErr.message);
    }

    return res.json({ order: updated || { id, status: 'cancelled', cancelled_at: nowIso } });
  } catch (err) {
    console.error('[admin/orders/cancel] unexpected error:', err.message);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: nodeEnv === 'development' ? err.message : 'Internal server error' }
    });
  }
});

module.exports = router;
