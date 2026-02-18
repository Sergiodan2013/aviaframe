// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const crypto = require('crypto');
const supabase = require('./lib/supabase');
const { buildInvoicePdf, buildTicketPdf } = require('./services/pdfService');
const { sendTicketEmail, sendSupportEmail } = require('./services/emailService');
const app = express();
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
  'contact_email',
  'contact_phone',
  'created_at',
  'updated_at',
  'confirmed_at',
  'cancelled_at'
].join(',');

// Configuration from environment variables
const config = {
  port: process.env.PORT || 3000,
  host: process.env.HOST || 'localhost',
  nodeEnv: process.env.NODE_ENV || 'development',
  appName: process.env.APP_NAME || 'Aviaframe Backend',
  appVersion: process.env.APP_VERSION || '0.1.0',
  logLevel: process.env.LOG_LEVEL || 'info',
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  documentsBucket: process.env.DOCUMENTS_BUCKET || 'documents',
  supportInbox: process.env.SUPPORT_INBOX || 'sergiodan2013@gmail.com',
  widgetTokenSecret: process.env.WIDGET_TOKEN_SECRET || process.env.SUPABASE_ANON_KEY || 'aviaframe-widget-dev-secret',
  widgetTokenTtlSec: Number(process.env.WIDGET_TOKEN_TTL_SEC || 1800)
};

function toIsoDateStart(v) {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function toIsoDateEnd(v) {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

function normalizeRole(role) {
  const normalized = String(role || 'user').trim().toLowerCase().replace(/-/g, '_');
  if (normalized === 'superadmin') return 'super_admin';
  if (normalized === 'agency_admin' || normalized === 'agency') return 'agent';
  if (normalized === 'administrator') return 'admin';
  if (['admin', 'super_admin', 'agent', 'user'].includes(normalized)) return normalized;
  return 'user';
}

function isAdminRole(role) {
  return ['admin', 'super_admin'].includes(normalizeRole(role));
}

function isStaffRole(role) {
  return ['admin', 'super_admin', 'agent'].includes(normalizeRole(role));
}

function isAgentRole(role) {
  return normalizeRole(role) === 'agent';
}

function ensureAdmin(auth, res) {
  if (!isAdminRole(auth.profile.role)) {
    forbidden(res, 'Admin role required');
    return false;
  }
  return true;
}

function ensureStaff(auth, res) {
  if (!isStaffRole(auth.profile.role)) {
    forbidden(res, 'Staff role required');
    return false;
  }
  return true;
}

function normalizeHost(value) {
  if (!value) return '';
  const raw = String(value).trim().toLowerCase();
  try {
    if (raw.startsWith('http://') || raw.startsWith('https://')) {
      return new URL(raw).hostname.toLowerCase();
    }
    return raw.split('/')[0].split(':')[0].trim().toLowerCase();
  } catch {
    return raw.split('/')[0].split(':')[0].trim().toLowerCase();
  }
}

function getRequestOriginHost(req) {
  const origin = req.headers.origin;
  if (origin) return normalizeHost(origin);
  const referer = req.headers.referer;
  if (referer) return normalizeHost(referer);
  return '';
}

function hostMatchesAllowed(host, allowedHost) {
  if (!host || !allowedHost) return false;
  if (host === allowedHost) return true;
  return host.endsWith(`.${allowedHost}`);
}

function isWidgetOriginAllowed(agency, requestHost) {
  const host = normalizeHost(requestHost);
  if (!host) return false;
  if (config.nodeEnv !== 'production' && (host === 'localhost' || host === '127.0.0.1')) {
    return true;
  }

  const settings = agency?.settings || {};
  const allowed = [];
  if (agency?.domain) allowed.push(normalizeHost(agency.domain));
  const settingsAllowed = Array.isArray(settings?.widget_allowed_domains)
    ? settings.widget_allowed_domains
    : [];
  settingsAllowed.forEach((d) => allowed.push(normalizeHost(d)));

  const uniq = [...new Set(allowed.filter(Boolean))];
  if (!uniq.length) return false;
  return uniq.some((d) => hostMatchesAllowed(host, d));
}

function toBase64Url(value) {
  return Buffer.from(value).toString('base64url');
}

function signWidgetPayload(payloadBase64) {
  return crypto
    .createHmac('sha256', String(config.widgetTokenSecret))
    .update(payloadBase64)
    .digest('base64url');
}

function issueWidgetToken(payloadObj) {
  const payload = toBase64Url(JSON.stringify(payloadObj));
  const signature = signWidgetPayload(payload);
  return `${payload}.${signature}`;
}

function parseWidgetToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) {
    return { error: 'INVALID_WIDGET_TOKEN' };
  }
  const [payloadPart, signaturePart] = token.split('.');
  const expected = signWidgetPayload(payloadPart);
  if (signaturePart !== expected) {
    return { error: 'INVALID_WIDGET_SIGNATURE' };
  }
  try {
    const payload = JSON.parse(Buffer.from(payloadPart, 'base64url').toString('utf8'));
    const nowSec = Math.floor(Date.now() / 1000);
    if (!payload?.exp || payload.exp < nowSec) {
      return { error: 'WIDGET_TOKEN_EXPIRED' };
    }
    return { payload };
  } catch {
    return { error: 'INVALID_WIDGET_TOKEN_PAYLOAD' };
  }
}

function generateOrderNumber() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

function generateInvoiceNumber() {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  const rnd = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `INV-${y}${m}${d}-${rnd}`;
}

async function canAccessOrder(auth, order) {
  if (!order) return false;
  if (isAdminRole(auth.profile.role)) return true;
  if (isAgentRole(auth.profile.role)) {
    return (
      (auth.profile.agency_id && order.agency_id && auth.profile.agency_id === order.agency_id) ||
      order.user_id === auth.profile.id
    );
  }
  return order.user_id === auth.profile.id;
}

async function linkAgencyAdminProfileByEmail({ email, agencyId }) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail) return { linkedProfile: null };

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id,email,role,agency_id')
    .eq('email', normalizedEmail)
    .maybeSingle();

  if (profileError) {
    return { linkedProfile: null, error: profileError };
  }
  if (!profile) {
    return { linkedProfile: null };
  }

  if (profile.agency_id && profile.agency_id !== agencyId) {
    return {
      conflict: true,
      linkedProfile: profile,
      message: `User ${normalizedEmail} is already linked to another agency`
    };
  }

  const { data: updated, error: updateError } = await supabase
    .from('profiles')
    .update({
      agency_id: agencyId,
      role: 'agent',
      updated_at: new Date().toISOString()
    })
    .eq('id', profile.id)
    .select('id,email,role,agency_id')
    .single();

  if (updateError) {
    return { linkedProfile: null, error: updateError };
  }

  return { linkedProfile: updated };
}

async function generateInvoicePdfForInvoice({ invoice, createdBy }) {
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
  const storagePath = await uploadPdfToStorage({
    buffer: pdfBuffer,
    fileName,
    folder: `invoices/${invoice.id}`
  });

  const doc = await saveDocumentMetadata({
    docType: 'invoice_pdf',
    entityType: 'invoice',
    entityId: invoice.id,
    agencyId: invoice.agency_id,
    invoiceId: invoice.id,
    fileName,
    storagePath,
    sizeBytes: pdfBuffer.length,
    checksum: toSha256(pdfBuffer),
    createdBy,
    metadata: {
      invoice_number: invoice.invoice_number,
      agency_name: agency?.name || null
    }
  });

  const signedUrl = await createSignedDocumentUrl(doc.storage_bucket, doc.storage_path, 3600);
  return { doc, signedUrl };
}

async function ensureTicketPdfForOrder({ order, createdBy, pnr = null, ticketNumber = null }) {
  let issuance = null;
  const { data: existingIssuance } = await supabase
    .from('ticket_issuances')
    .select('*')
    .eq('order_id', order.id)
    .single();
  issuance = existingIssuance || null;

  if (issuance?.document_id) {
    const { data: existingDoc } = await supabase
      .from('document_files')
      .select('*')
      .eq('id', issuance.document_id)
      .single();
    if (existingDoc) {
      const url = await createSignedDocumentUrl(existingDoc.storage_bucket, existingDoc.storage_path, 3600);
      return { issuance, doc: existingDoc, url, generated: false };
    }
  }

  const nowIso = new Date().toISOString();
  const issuancePayload = {
    order_id: order.id,
    agency_id: order.agency_id,
    drct_order_id: order.drct_order_id,
    ticket_number: issuance?.ticket_number || ticketNumber || `ETK-${String(order.order_number || order.id).slice(-8)}`,
    pnr: issuance?.pnr || pnr || order.drct_order_id || null,
    issued_at: issuance?.issued_at || nowIso,
    status: 'issued',
    raw_provider_response: issuance?.raw_provider_response || {},
    created_by: issuance?.created_by || createdBy
  };

  const { data: savedIssuance, error: issuanceError } = await supabase
    .from('ticket_issuances')
    .upsert(issuancePayload, { onConflict: 'order_id' })
    .select('*')
    .single();
  if (issuanceError || !savedIssuance) {
    throw new Error(issuanceError?.message || 'Failed to save ticket issuance');
  }

  const { data: passengers } = await supabase
    .from('passengers')
    .select('first_name,last_name,passenger_type')
    .eq('order_id', order.id);

  const pdfBuffer = await buildTicketPdf({
    order,
    passengers: passengers || [],
    issuance: savedIssuance
  });

  const fileName = `ticket-${order.order_number || order.id}.pdf`;
  const storagePath = await uploadPdfToStorage({
    buffer: pdfBuffer,
    fileName,
    folder: `tickets/${order.id}`
  });

  const doc = await saveDocumentMetadata({
    docType: 'ticket_pdf',
    entityType: 'order',
    entityId: order.id,
    agencyId: order.agency_id,
    orderId: order.id,
    fileName,
    storagePath,
    sizeBytes: pdfBuffer.length,
    checksum: toSha256(pdfBuffer),
    createdBy,
    metadata: {
      ticket_number: savedIssuance.ticket_number,
      pnr: savedIssuance.pnr
    }
  });

  const { data: finalizedIssuance } = await supabase
    .from('ticket_issuances')
    .update({
      document_id: doc.id,
      updated_at: new Date().toISOString()
    })
    .eq('id', savedIssuance.id)
    .select('*')
    .single();

  const url = await createSignedDocumentUrl(doc.storage_bucket, doc.storage_path, 3600);
  return {
    issuance: finalizedIssuance || savedIssuance,
    doc,
    url,
    generated: true
  };
}

async function uploadPdfToStorage({ buffer, fileName, folder }) {
  const timestamp = Date.now();
  const safeName = String(fileName || 'document.pdf').replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `${folder}/${timestamp}-${safeName}`;
  const { error } = await supabase.storage
    .from(config.documentsBucket)
    .upload(storagePath, buffer, {
      contentType: 'application/pdf',
      upsert: true
    });
  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }
  return storagePath;
}

async function saveDocumentMetadata({
  docType,
  entityType,
  entityId,
  agencyId = null,
  orderId = null,
  invoiceId = null,
  fileName,
  storagePath,
  sizeBytes,
  checksum,
  createdBy,
  metadata = {}
}) {
  const payload = {
    doc_type: docType,
    entity_type: entityType,
    entity_id: entityId,
    agency_id: agencyId,
    order_id: orderId,
    invoice_id: invoiceId,
    file_name: fileName,
    storage_bucket: config.documentsBucket,
    storage_path: storagePath,
    content_type: 'application/pdf',
    size_bytes: sizeBytes,
    checksum_sha256: checksum,
    created_by: createdBy,
    metadata
  };

  const { data, error } = await supabase
    .from('document_files')
    .insert(payload)
    .select('*')
    .single();

  if (error) {
    throw new Error(`Document metadata save failed: ${error.message}`);
  }
  return data;
}

function toSha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

async function createSignedDocumentUrl(bucket, path, expiresInSec = 3600) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresInSec);
  if (error || !data?.signedUrl) {
    throw new Error(error?.message || 'Failed to create signed URL');
  }
  return data.signedUrl;
}

async function canAccessDocument(auth, doc) {
  if (!doc) return false;
  if (isAdminRole(auth.profile.role)) return true;

  if (isAgentRole(auth.profile.role)) {
    if (auth.profile.agency_id && doc.agency_id && auth.profile.agency_id === doc.agency_id) {
      return true;
    }
  }

  if (doc.order_id) {
    const { data: order } = await supabase
      .from('orders')
      .select('id,user_id')
      .eq('id', doc.order_id)
      .single();
    if (order && order.user_id === auth.profile.id) return true;
  }

  return false;
}

async function resolveAuthContext(req) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
    if (!token) return { error: 'MISSING_TOKEN' };

    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user?.id) {
      return { error: 'INVALID_TOKEN' };
    }

    const userId = userData.user.id;
    const userEmail = String(userData.user.email || '').trim().toLowerCase();
    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id,email,role,agency_id')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) {
      return { error: 'PROFILE_LOAD_FAILED' };
    }

    if (!profile) {
      let role = 'user';
      let agencyId = null;

      if (userEmail) {
        const { data: agenciesByEmail } = await supabase
          .from('agencies')
          .select('id')
          .eq('contact_email', userEmail)
          .limit(2);
        const linked = Array.isArray(agenciesByEmail) ? agenciesByEmail : [];
        if (linked.length === 1) {
          role = 'agent';
          agencyId = linked[0].id;
        }
      }

      const { data: created, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: userEmail || null,
          role,
          agency_id: agencyId
        })
        .select('id,email,role,agency_id')
        .single();

      if (createError || !created) {
        return { error: 'PROFILE_NOT_FOUND' };
      }
      profile = created;
    } else if (userEmail && (!profile.agency_id || normalizeRole(profile.role) === 'user')) {
      const { data: agenciesByEmail } = await supabase
        .from('agencies')
        .select('id')
        .eq('contact_email', userEmail)
        .limit(2);
      const linked = Array.isArray(agenciesByEmail) ? agenciesByEmail : [];
      if (linked.length === 1) {
        const targetAgencyId = linked[0].id;
        if (profile.agency_id !== targetAgencyId || normalizeRole(profile.role) !== 'agent') {
          const { data: patched } = await supabase
            .from('profiles')
            .update({
              role: 'agent',
              agency_id: targetAgencyId,
              updated_at: new Date().toISOString()
            })
            .eq('id', userId)
            .select('id,email,role,agency_id')
            .single();
          if (patched) {
            profile = patched;
          }
        }
      }
    }

    profile = {
      ...profile,
      role: normalizeRole(profile?.role)
    };

    return {
      user: userData.user,
      profile
    };
  } catch (err) {
    console.error('Auth context error:', err);
    return { error: 'AUTH_CONTEXT_FAILED' };
  }
}

function forbidden(res, message = 'Access denied') {
  return res.status(403).json({
    error: {
      code: 'FORBIDDEN',
      message
    }
  });
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// CORS (simple implementation for development)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (config.corsOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Idempotency-Key');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Health check endpoint
app.get('/healthz', (req, res) => {
  res.json({
    status: 'ok',
    service: config.appName,
    version: config.appVersion,
    environment: config.nodeEnv,
    timestamp: new Date().toISOString()
  });
});

// Info endpoint
app.get('/api/info', (req, res) => {
  res.json({
    name: config.appName,
    version: config.appVersion,
    environment: config.nodeEnv,
    features: {
      caching: process.env.FEATURE_CACHING_ENABLED === 'true',
      webhooks: process.env.FEATURE_WEBHOOKS_ENABLED === 'true'
    }
  });
});

// Hello endpoint (test)
app.get('/api/hello', (req, res) => {
  res.json({
    message: 'Hello from Aviaframe Backend!',
    timestamp: new Date().toISOString()
  });
});

app.post('/api/widget/session', async (req, res) => {
  const {
    agency_key: agencyKey,
    agency_domain: agencyDomain,
    origin_host: originHostFromBody
  } = req.body || {};

  if (!agencyKey && !agencyDomain) {
    return res.status(400).json({
      error: {
        code: 'INVALID_INPUT',
        message: 'agency_key or agency_domain is required'
      }
    });
  }

  try {
    let agency = null;
    if (agencyKey) {
      const normalizedKey = String(agencyKey).trim().toLowerCase();
      const { data } = await supabase
        .from('agencies')
        .select('id,name,domain,contact_email,contact_phone,is_active,settings')
        .or(`api_key.eq.${normalizedKey},domain.eq.${normalizedKey}`)
        .limit(1)
        .maybeSingle();
      agency = data || null;
    }
    if (!agency && agencyDomain) {
      const normalizedDomain = normalizeHost(agencyDomain);
      const { data } = await supabase
        .from('agencies')
        .select('id,name,domain,contact_email,contact_phone,is_active,settings')
        .eq('domain', normalizedDomain)
        .limit(1)
        .maybeSingle();
      agency = data || null;
    }

    if (!agency) {
      return res.status(404).json({
        error: {
          code: 'AGENCY_NOT_FOUND',
          message: 'Agency not found for widget session'
        }
      });
    }
    if (!agency.is_active) {
      return res.status(403).json({
        error: {
          code: 'AGENCY_DISABLED',
          message: 'Agency is not active'
        }
      });
    }

    const requestHost = normalizeHost(originHostFromBody) || getRequestOriginHost(req);
    if (!isWidgetOriginAllowed(agency, requestHost)) {
      return res.status(403).json({
        error: {
          code: 'WIDGET_ORIGIN_NOT_ALLOWED',
          message: `Origin host ${requestHost || 'unknown'} is not allowed for this agency`
        }
      });
    }

    const nowSec = Math.floor(Date.now() / 1000);
    const expiresIn = Math.max(300, config.widgetTokenTtlSec);
    const token = issueWidgetToken({
      typ: 'widget_session',
      agency_id: agency.id,
      origin_host: requestHost,
      iat: nowSec,
      exp: nowSec + expiresIn
    });

    return res.json({
      widget_token: token,
      expires_in: expiresIn,
      agency: {
        id: agency.id,
        name: agency.name,
        domain: agency.domain,
        contact_email: agency.contact_email,
        contact_phone: agency.contact_phone,
        settings: {
          language: agency?.settings?.language || 'en',
          commission: agency?.settings?.commission || null,
          bank_details: agency?.settings?.bank_details || null
        }
      }
    });
  } catch (err) {
    console.error('Widget session error:', err);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: config.nodeEnv === 'development' ? err.message : 'Internal server error'
      }
    });
  }
});

app.post('/api/widget/orders', async (req, res) => {
  const authHeader = req.headers.authorization || '';
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  const token = bearerToken || req.body?.widget_token;
  const parsed = parseWidgetToken(token);
  if (parsed.error) {
    return res.status(401).json({
      error: {
        code: parsed.error,
        message: 'Widget token is invalid'
      }
    });
  }

  const payload = parsed.payload;
  const clientOriginHost = normalizeHost(req.body?.origin_host || req.body?.metadata?.origin_host || '');
  if (payload.origin_host && clientOriginHost && payload.origin_host !== clientOriginHost) {
    return res.status(403).json({
      error: {
        code: 'WIDGET_ORIGIN_MISMATCH',
        message: 'Widget token origin does not match request origin'
      }
    });
  }

  const {
    contacts = {},
    offer = {},
    pricing = {},
    passengers = [],
    metadata = {},
    user_id: userIdFromBody = null
  } = req.body || {};

  const contactEmail = String(contacts.email || '').trim().toLowerCase();
  const contactPhone = String(contacts.phone || '').trim();
  const origin = String(offer.origin || '').trim();
  const destination = String(offer.destination || '').trim();
  const currency = String(pricing.currency || offer.currency || 'USD').trim().toUpperCase();

  const basePrice = Number(pricing.base_price ?? offer.base_price ?? offer.price ?? 0);
  const taxes = Number(pricing.taxes ?? offer.taxes ?? 0);
  const baggagePrice = Number(pricing.baggage_price ?? 0);
  const totalPrice = Number(pricing.total_price ?? (basePrice + taxes + baggagePrice));

  if (!contactEmail || !contactPhone || !origin || !destination || !Number.isFinite(totalPrice) || totalPrice <= 0) {
    return res.status(400).json({
      error: {
        code: 'INVALID_INPUT',
        message: 'contacts.email, contacts.phone, offer.origin, offer.destination and pricing.total_price are required'
      }
    });
  }

  try {
    const { data: agency, error: agencyError } = await supabase
      .from('agencies')
      .select('id,name,domain,is_active,settings')
      .eq('id', payload.agency_id)
      .single();
    if (agencyError || !agency) {
      return res.status(404).json({
        error: {
          code: 'AGENCY_NOT_FOUND',
          message: 'Agency from widget token does not exist'
        }
      });
    }
    if (!agency.is_active) {
      return res.status(403).json({
        error: {
          code: 'AGENCY_DISABLED',
          message: 'Agency is not active'
        }
      });
    }
    if (!isWidgetOriginAllowed(agency, payload.origin_host || clientOriginHost)) {
      return res.status(403).json({
        error: {
          code: 'WIDGET_ORIGIN_NOT_ALLOWED',
          message: 'Origin is not allowed for agency widget'
        }
      });
    }

    const orderInsert = {
      order_number: generateOrderNumber(),
      user_id: userIdFromBody || null,
      agency_id: payload.agency_id,
      origin,
      destination,
      departure_time: offer.departure_time || null,
      arrival_time: offer.arrival_time || null,
      airline_code: offer.airline_code || null,
      airline_name: offer.airline_name || null,
      flight_number: offer.flight_number || null,
      base_price: Number.isFinite(basePrice) ? basePrice : 0,
      taxes: Number.isFinite(taxes) ? taxes : 0,
      baggage_price: Number.isFinite(baggagePrice) ? baggagePrice : 0,
      total_price: totalPrice,
      currency,
      status: 'pending',
      contact_email: contactEmail,
      contact_phone: contactPhone,
      raw_offer_data: {
        offer,
        pricing,
        metadata: {
          ...metadata,
          source: 'widget',
          origin_host: payload.origin_host || clientOriginHost
        }
      },
      notes: metadata?.notes || null
    };

    const { data: createdOrder, error: createOrderError } = await supabase
      .from('orders')
      .insert(orderInsert)
      .select(ORDERS_LIST_COLUMNS)
      .single();

    if (createOrderError || !createdOrder) {
      return res.status(500).json({
        error: {
          code: 'WIDGET_ORDER_CREATE_FAILED',
          message: createOrderError?.message || 'Failed to create widget order'
        }
      });
    }

    if (Array.isArray(passengers) && passengers.length > 0) {
      const passengerRows = passengers.map((p) => ({
        order_id: createdOrder.id,
        gender: p.gender || null,
        first_name: p.first_name || p.firstName || 'N/A',
        last_name: p.last_name || p.lastName || 'N/A',
        date_of_birth: p.date_of_birth || p.dateOfBirth || null,
        passport_number: p.passport_number || p.passportNumber || 'N/A',
        passport_expiry: p.passport_expiry || p.passportExpiry || null,
        passport_issuing_country: p.passport_issuing_country || p.issuing_country || 'SA',
        nationality: p.nationality || 'SA',
        passenger_type: p.passenger_type || p.type || 'ADT',
        baggage_allowance: p.baggage_allowance || null
      }));
      const { error: passengerError } = await supabase
        .from('passengers')
        .insert(passengerRows);
      if (passengerError) {
        console.warn('Widget passengers insert failed:', passengerError.message);
      }
    }

    return res.status(201).json({
      order: createdOrder,
      agency: {
        id: agency.id,
        name: agency.name,
        domain: agency.domain
      }
    });
  } catch (err) {
    console.error('Widget order create error:', err);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: config.nodeEnv === 'development' ? err.message : 'Internal server error'
      }
    });
  }
});

app.get('/api/profile/me', async (req, res) => {
  const auth = await resolveAuthContext(req);
  if (auth.error) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: auth.error
      }
    });
  }

  return res.json({
    profile: auth.profile,
    user: {
      id: auth.user.id,
      email: auth.user.email || null
    }
  });
});

// Stage 0 non-breaking endpoint for orders list compatibility.
app.get('/api/orders', async (req, res) => {
  const auth = await resolveAuthContext(req);
  if (auth.error) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: auth.error
      }
    });
  }

  const requesterId = auth.profile.id;
  const requesterRole = auth.profile.role;
  const requesterAgencyId = auth.profile.agency_id;

  const rawLimit = Number(req.query.limit || 200);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 500) : 200;
  const { user_id: userId, agency_id: agencyId, status } = req.query;

  try {
    let query = supabase
      .from('orders')
      .select(ORDERS_LIST_COLUMNS)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Role-based scope
    if (isAdminRole(requesterRole)) {
      if (userId) query = query.eq('user_id', userId);
      if (agencyId) query = query.eq('agency_id', agencyId);
    } else if (isAgentRole(requesterRole)) {
      // Agent can see own agency orders and their own direct orders.
      if (agencyId && agencyId !== requesterAgencyId) {
        return forbidden(res, 'Agent can only access own agency');
      }
      if (userId && userId !== requesterId) {
        return forbidden(res, 'Agent cannot filter by another user_id');
      }

      if (requesterAgencyId) {
        query = query.or(`agency_id.eq.${requesterAgencyId},user_id.eq.${requesterId}`);
      } else {
        query = query.eq('user_id', requesterId);
      }
    } else {
      // Client/user can only see own orders.
      if (agencyId) {
        return forbidden(res, 'User cannot filter by agency_id');
      }
      if (userId && userId !== requesterId) {
        return forbidden(res, 'User cannot filter by another user_id');
      }
      query = query.eq('user_id', requesterId);
    }

    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) {
      return res.status(500).json({
        error: {
          code: 'ORDERS_LIST_FAILED',
          message: error.message
        }
      });
    }

    return res.json({ orders: data || [] });
  } catch (err) {
    console.error('Orders endpoint error:', err);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: config.nodeEnv === 'development' ? err.message : 'Internal server error'
      }
    });
  }
});

app.patch('/api/orders/:orderId/status', async (req, res) => {
  const auth = await resolveAuthContext(req);
  if (auth.error) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: auth.error
      }
    });
  }

  const requesterId = auth.profile.id;
  const requesterRole = auth.profile.role;
  const requesterAgencyId = auth.profile.agency_id;
  const { orderId } = req.params;
  const { status: nextStatus, additionalData = {} } = req.body || {};
  const allowedStatuses = new Set(['pending', 'confirmed', 'ticketed', 'cancelled', 'refunded', 'failed']);

  if (!nextStatus || !allowedStatuses.has(String(nextStatus).toLowerCase())) {
    return res.status(400).json({
      error: {
        code: 'INVALID_STATUS',
        message: 'Unsupported status value'
      }
    });
  }

  try {
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id,user_id,agency_id,status')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return res.status(404).json({
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Order not found'
        }
      });
    }

    const canAdmin = isAdminRole(requesterRole);
    const canAgent = isAgentRole(requesterRole) && (
      (requesterAgencyId && requesterAgencyId === order.agency_id) || order.user_id === requesterId
    );
    const canClient = (requesterRole === 'client' || requesterRole === 'user') && order.user_id === requesterId;

    if (!(canAdmin || canAgent || canClient)) {
      return forbidden(res);
    }

    const normalizedStatus = String(nextStatus).toLowerCase();
    if (normalizedStatus === 'ticketed' && String(order.status || '').toLowerCase() !== 'confirmed') {
      return res.status(422).json({
        error: {
          code: 'INVALID_TRANSITION',
          message: 'Ticket issue allowed only from confirmed status'
        }
      });
    }

    const nowIso = new Date().toISOString();
    const updateData = {
      status: normalizedStatus,
      updated_at: nowIso,
      ...additionalData
    };

    if (normalizedStatus === 'confirmed' && !updateData.confirmed_at) {
      updateData.confirmed_at = nowIso;
      if (!Object.prototype.hasOwnProperty.call(additionalData, 'cancelled_at')) {
        updateData.cancelled_at = null;
      }
    }
    if (normalizedStatus === 'cancelled' && !updateData.cancelled_at) {
      updateData.cancelled_at = nowIso;
      if (!Object.prototype.hasOwnProperty.call(additionalData, 'confirmed_at')) {
        updateData.confirmed_at = null;
      }
    }

    const { data: updated, error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select(ORDERS_LIST_COLUMNS)
      .single();

    if (updateError) {
      return res.status(500).json({
        error: {
          code: 'ORDER_UPDATE_FAILED',
          message: updateError.message
        }
      });
    }

    return res.json({ order: updated });
  } catch (err) {
    console.error('Order status update error:', err);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: config.nodeEnv === 'development' ? err.message : 'Internal server error'
      }
    });
  }
});

app.get('/api/admin/agencies', async (req, res) => {
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
        message: config.nodeEnv === 'development' ? err.message : 'Internal server error'
      }
    });
  }
});

app.patch('/api/admin/agencies/:agencyId', async (req, res) => {
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
    is_active: isActive,
    language,
    bank_details: bankDetails,
    widget_allowed_domains: widgetAllowedDomains
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
        message: config.nodeEnv === 'development' ? err.message : 'Internal server error'
      }
    });
  }
});

app.delete('/api/admin/agencies/:agencyId', async (req, res) => {
  const auth = await resolveAuthContext(req);
  if (auth.error) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: auth.error } });
  }
  if (!ensureAdmin(auth, res)) return;

  const { agencyId } = req.params;
  try {
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
        message: config.nodeEnv === 'development' ? err.message : 'Internal server error'
      }
    });
  }
});

app.post('/api/admin/agencies', async (req, res) => {
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

    return res.status(201).json({ agency: data, linked_profile: linkedProfile || null });
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

app.get('/api/admin/reports/orders', async (req, res) => {
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

app.get('/api/admin/reports/orders-summary', async (req, res) => {
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

app.get('/api/admin/invoices', async (req, res) => {
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

app.get('/api/admin/tickets', async (req, res) => {
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

app.post('/api/admin/invoices', async (req, res) => {
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

app.get('/api/agency/me', async (req, res) => {
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

app.patch('/api/agency/me', async (req, res) => {
  const auth = await resolveAuthContext(req);
  if (auth.error) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: auth.error } });
  }
  if (!ensureStaff(auth, res)) return;
  if (!auth.profile.agency_id) {
    return res.status(404).json({ error: { code: 'AGENCY_NOT_ASSIGNED', message: 'Profile has no agency_id' } });
  }

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
        message: config.nodeEnv === 'development' ? err.message : 'Internal server error'
      }
    });
  }
});

app.post('/api/admin/invoices/:invoiceId/generate-pdf', async (req, res) => {
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

app.patch('/api/admin/invoices/:invoiceId', async (req, res) => {
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

app.get('/api/documents/:documentId/download', async (req, res) => {
  const auth = await resolveAuthContext(req);
  if (auth.error) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: auth.error } });
  }

  const { documentId } = req.params;
  try {
    const { data: doc, error } = await supabase
      .from('document_files')
      .select('*')
      .eq('id', documentId)
      .single();

    if (error || !doc) {
      return res.status(404).json({
        error: { code: 'DOCUMENT_NOT_FOUND', message: 'Document not found' }
      });
    }

    const canAccess = await canAccessDocument(auth, doc);
    if (!canAccess) {
      return forbidden(res);
    }

    const signedUrl = await createSignedDocumentUrl(doc.storage_bucket, doc.storage_path, 3600);
    return res.json({ url: signedUrl });
  } catch (err) {
    console.error('Document download error:', err);
    return res.status(500).json({
      error: {
        code: 'DOCUMENT_DOWNLOAD_FAILED',
        message: config.nodeEnv === 'development' ? err.message : 'Internal server error'
      }
    });
  }
});

app.get('/api/orders/:orderId/ticket-document', async (req, res) => {
  const auth = await resolveAuthContext(req);
  if (auth.error) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: auth.error } });
  }

  const { orderId } = req.params;
  try {
    const { data: order } = await supabase
      .from('orders')
      .select('id,order_number,user_id,agency_id,drct_order_id,origin,destination,departure_time,arrival_time,airline_code,airline_name,flight_number,total_price,currency,status,contact_email,contact_phone')
      .eq('id', orderId)
      .single();
    if (!order) {
      return res.status(404).json({ error: { code: 'ORDER_NOT_FOUND', message: 'Order not found' } });
    }

    const canAccess = await canAccessOrder(auth, order);
    if (!canAccess) return forbidden(res);

    if (!['confirmed', 'ticketed'].includes(String(order.status || '').toLowerCase())) {
      return res.status(422).json({
        error: {
          code: 'INVALID_ORDER_STATUS',
          message: 'Ticket PDF can be generated only for confirmed or ticketed orders'
        }
      });
    }

    const ensured = await ensureTicketPdfForOrder({
      order,
      createdBy: auth.profile.id,
      pnr: order.drct_order_id || null
    });
    return res.json({
      ticket: ensured.issuance,
      document: ensured.doc,
      url: ensured.url,
      generated: ensured.generated
    });
  } catch (err) {
    console.error('Ticket document endpoint error:', err);
    return res.status(500).json({
      error: {
        code: 'TICKET_DOCUMENT_FAILED',
        message: config.nodeEnv === 'development' ? err.message : 'Internal server error'
      }
    });
  }
});

app.get('/api/orders/:orderId/payment-instructions', async (req, res) => {
  const auth = await resolveAuthContext(req);
  if (auth.error) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: auth.error } });
  }

  const { orderId } = req.params;
  try {
    const { data: order } = await supabase
      .from('orders')
      .select('id,order_number,user_id,agency_id,total_price,currency,status,contact_email,created_at')
      .eq('id', orderId)
      .single();
    if (!order) {
      return res.status(404).json({ error: { code: 'ORDER_NOT_FOUND', message: 'Order not found' } });
    }

    const canAccess = await canAccessOrder(auth, order);
    if (!canAccess) return forbidden(res);

    let agency = null;
    if (order.agency_id) {
      const { data } = await supabase
        .from('agencies')
        .select('id,name,domain,contact_email,contact_phone,settings')
        .eq('id', order.agency_id)
        .single();
      agency = data || null;
    }

    const bank = agency?.settings?.bank_details || {};
    const paymentInstruction = {
      order_id: order.id,
      order_number: order.order_number,
      amount: Number(order.total_price || 0),
      currency: order.currency || 'USD',
      status: order.status || 'pending',
      agency: agency ? {
        id: agency.id,
        name: agency.name,
        domain: agency.domain,
        contact_email: agency.contact_email,
        contact_phone: agency.contact_phone
      } : null,
      bank_details: {
        bank_name: bank.bank_name || null,
        account_number: bank.bank_account || null,
        iban: bank.iban || null,
        swift_bic: bank.swift_bic || null,
        sama_code: bank.sama_code || null
      },
      notes: [
        'Переведите сумму по реквизитам агентства.',
        `В комментарии укажите номер заказа: ${order.order_number}`,
        'После поступления оплаты статус будет подтвержден и билет выписан.'
      ]
    };

    return res.json({ payment_instruction: paymentInstruction });
  } catch (err) {
    console.error('Payment instructions error:', err);
    return res.status(500).json({
      error: {
        code: 'PAYMENT_INSTRUCTIONS_FAILED',
        message: config.nodeEnv === 'development' ? err.message : 'Internal server error'
      }
    });
  }
});

app.post('/api/support/requests', async (req, res) => {
  const auth = await resolveAuthContext(req);
  if (auth.error) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: auth.error } });
  }

  const {
    order_id: orderId = null,
    subject = 'Support request',
    message = '',
    attachment = null
  } = req.body || {};

  if (!message || String(message).trim().length < 3) {
    return res.status(400).json({
      error: {
        code: 'INVALID_INPUT',
        message: 'message is required'
      }
    });
  }

  let order = null;
  if (orderId) {
    const { data } = await supabase
      .from('orders')
      .select('id,order_number,user_id,agency_id,total_price,currency,status,contact_email')
      .eq('id', orderId)
      .single();
    order = data || null;
    if (order && !(await canAccessOrder(auth, order))) {
      return forbidden(res);
    }
  }

  let parsedAttachment = null;
  if (attachment?.dataBase64) {
    try {
      const fileBuffer = Buffer.from(String(attachment.dataBase64), 'base64');
      const maxBytes = 8 * 1024 * 1024;
      if (fileBuffer.length > maxBytes) {
        return res.status(400).json({
          error: {
            code: 'ATTACHMENT_TOO_LARGE',
            message: 'Attachment size exceeds 8MB'
          }
        });
      }
      parsedAttachment = {
        fileName: attachment.name || 'support-attachment.bin',
        contentType: attachment.type || 'application/octet-stream',
        buffer: fileBuffer
      };
    } catch (err) {
      return res.status(400).json({
        error: {
          code: 'INVALID_ATTACHMENT',
          message: `Attachment decode failed: ${err.message}`
        }
      });
    }
  }

  try {
    const supportSubject = `[Aviaframe Support] ${subject}`;
    const text = [
      `From user: ${auth.profile.email}`,
      `User ID: ${auth.profile.id}`,
      `Role: ${auth.profile.role}`,
      order ? `Order: ${order.order_number} (${order.id})` : 'Order: not specified',
      '',
      'Message:',
      String(message)
    ].join('\n');

    const emailResult = await sendSupportEmail({
      to: config.supportInbox,
      from: auth.profile.email,
      subject: supportSubject,
      text,
      attachment: parsedAttachment
    });

    return res.status(201).json({
      support_request: {
        sent: !!emailResult.sent,
        support_inbox: config.supportInbox
      },
      email: emailResult
    });
  } catch (err) {
    console.error('Support request error:', err);
    return res.status(500).json({
      error: {
        code: 'SUPPORT_REQUEST_FAILED',
        message: config.nodeEnv === 'development' ? err.message : 'Internal server error'
      }
    });
  }
});

app.post('/api/orders/:orderId/ticket/finalize', async (req, res) => {
  const auth = await resolveAuthContext(req);
  if (auth.error) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: auth.error } });
  }
  if (!ensureStaff(auth, res)) return;

  const { orderId } = req.params;
  const { send_email: sendEmail = true, ticket_number: ticketNumber, pnr } = req.body || {};

  try {
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id,order_number,user_id,agency_id,drct_order_id,origin,destination,departure_time,arrival_time,airline_code,airline_name,flight_number,total_price,currency,status,contact_email,contact_phone')
      .eq('id', orderId)
      .single();
    if (orderError || !order) {
      return res.status(404).json({ error: { code: 'ORDER_NOT_FOUND', message: 'Order not found' } });
    }

    const canAccess = await canAccessOrder(auth, order);
    if (!canAccess) {
      return forbidden(res);
    }

    if (!['confirmed', 'ticketed'].includes(String(order.status || '').toLowerCase())) {
      return res.status(422).json({
        error: {
          code: 'INVALID_ORDER_STATUS',
          message: 'Ticket PDF can be generated only for confirmed or ticketed orders'
        }
      });
    }

    const ensureResult = await ensureTicketPdfForOrder({
      order,
      createdBy: auth.profile.id,
      pnr,
      ticketNumber
    });
    const issuance = ensureResult.issuance;
    const doc = ensureResult.doc;
    const downloadUrl = ensureResult.url;

    let emailState = { sent: false, error: 'EMAIL_SKIPPED' };
    if (sendEmail && order.contact_email) {
      const { data: pdfData, error: pdfError } = await supabase.storage
        .from(doc.storage_bucket)
        .download(doc.storage_path);
      if (pdfError || !pdfData) {
        throw new Error(pdfError?.message || 'Failed to read generated ticket PDF');
      }
      const pdfArrayBuffer = await pdfData.arrayBuffer();
      const pdfBuffer = Buffer.from(pdfArrayBuffer);
      emailState = await sendTicketEmail({
        to: order.contact_email,
        order,
        attachment: { fileName: doc.file_name, buffer: pdfBuffer }
      });
    }

    const { data: updatedIssuance } = await supabase
      .from('ticket_issuances')
      .update({
        document_id: doc.id,
        email_status: emailState.sent ? 'sent' : (sendEmail ? 'failed' : 'pending'),
        email_sent_at: emailState.sent ? new Date().toISOString() : null
      })
      .eq('id', issuance.id)
      .select('*')
      .single();

    return res.json({
      ticket_issuance: updatedIssuance || issuance,
      document: doc,
      download_url: downloadUrl,
      email: emailState
    });
  } catch (err) {
    console.error('Ticket finalize error:', err);
    return res.status(500).json({
      error: {
        code: 'TICKET_FINALIZE_FAILED',
        message: config.nodeEnv === 'development' ? err.message : 'Internal server error'
      }
    });
  }
});

// Public search endpoint (with database integration)
app.post('/public/search', async (req, res) => {
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

    // Mock search results (DRCT adapter not yet implemented)
    const mockOffers = [];
    const searchDuration = Date.now() - startTime;

    // Save search to database
    const { data: searchRecord, error: dbError } = await supabase
      .from('searches')
      .insert([
        {
          tenant_id: searchTenantId,
          origin: origin.toUpperCase(),
          destination: destination.toUpperCase(),
          depart_date,
          return_date,
          adults,
          children,
          infants,
          cabin_class,
          offers_count: mockOffers.length,
          search_duration_ms: searchDuration,
          source: 'api',
          metadata: {
            user_agent: req.headers['user-agent'],
            ip: req.ip
          }
        }
      ])
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      // Continue even if database save fails (don't break user experience)
    }

    // Return search results
    res.json({
      search_id: searchRecord?.id || `search-${Date.now()}`,
      origin: origin.toUpperCase(),
      destination: destination.toUpperCase(),
      depart_date,
      return_date,
      adults,
      children,
      infants,
      cabin_class,
      offers: mockOffers,
      offers_count: mockOffers.length,
      message: 'DRCT adapter not yet implemented. This is a placeholder response.',
      saved_to_db: !dbError
    });

  } catch (err) {
    console.error('Search endpoint error:', err);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: config.nodeEnv === 'development' ? err.message : 'Internal server error'
      }
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`
    }
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: config.nodeEnv === 'development' ? err.message : 'Internal server error'
    }
  });
});

// Start server
const server = app.listen(config.port, config.host, () => {
  console.log('');
  console.log('========================================');
  console.log(`  ${config.appName} v${config.appVersion}`);
  console.log('========================================');
  console.log(`  Environment: ${config.nodeEnv}`);
  console.log(`  Server:      http://${config.host}:${config.port}`);
  console.log(`  Health:      http://${config.host}:${config.port}/healthz`);
  console.log(`  Info:        http://${config.host}:${config.port}/api/info`);
  console.log('========================================');
  console.log('');
});

// Graceful shutdown
const shutdown = (signal) => {
  console.log(`\nReceived ${signal}, closing server gracefully...`);
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
