'use strict';

const crypto = require('crypto');
const supabase = require('../lib/supabase');
const { config } = require('../config');
const { buildInvoicePdf, buildTicketPdf } = require('./pdfService');
const { isValidUuid, toSha256 } = require('../utils/helpers');

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
    created_by: isValidUuid(createdBy) ? createdBy : null,
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
  const { isAdminRole, isAgentRole } = require('../utils/helpers');
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
    created_by: isValidUuid(issuance?.created_by) ? issuance.created_by : isValidUuid(createdBy) ? createdBy : null
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

async function findAuthUserByEmail(email) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail) return null;

  const perPage = 100;
  const maxPages = 20;
  for (let page = 1; page <= maxPages; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) {
      throw new Error(`AUTH_USERS_LIST_FAILED: ${error.message}`);
    }
    const users = Array.isArray(data?.users) ? data.users : [];
    const matched = users.find((u) => String(u?.email || '').trim().toLowerCase() === normalizedEmail);
    if (matched) return matched;
    if (users.length < perPage) break;
  }
  return null;
}

async function ensureAuthUserByEmail(email) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail) {
    throw new Error('INVALID_EMAIL');
  }

  const existing = await findAuthUserByEmail(normalizedEmail);
  if (existing?.id) {
    return { user: existing, created: false, invited: false };
  }

  try {
    const { data: invitedData, error: invitedError } = await supabase.auth.admin.inviteUserByEmail(normalizedEmail);
    if (!invitedError && invitedData?.user?.id) {
      return { user: invitedData.user, created: true, invited: true };
    }
    if (invitedError) {
      console.warn('inviteUserByEmail failed, fallback to createUser:', invitedError.message);
    }
  } catch (err) {
    console.warn('inviteUserByEmail exception, fallback to createUser:', err?.message);
  }

  const temporaryPassword = `Tmp!${crypto.randomBytes(10).toString('hex')}Aa1`;
  const { data: createdData, error: createdError } = await supabase.auth.admin.createUser({
    email: normalizedEmail,
    password: temporaryPassword,
    email_confirm: false,
    user_metadata: {
      provisioned_by: 'admin_panel'
    }
  });
  if (createdError || !createdData?.user?.id) {
    throw new Error(`AUTH_USER_PROVISION_FAILED: ${createdError?.message || 'unknown'}`);
  }
  return { user: createdData.user, created: true, invited: false };
}

module.exports = {
  uploadPdfToStorage,
  saveDocumentMetadata,
  createSignedDocumentUrl,
  canAccessDocument,
  ensureTicketPdfForOrder,
  generateInvoicePdfForInvoice,
  linkAgencyAdminProfileByEmail,
  findAuthUserByEmail,
  ensureAuthUserByEmail
};
