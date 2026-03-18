'use strict';

const express = require('express');
const supabase = require('../lib/supabase');
const { canAccessOrder, canAccessDocument, forbidden } = require('../lib/authorization');
const { uploadPdfToStorage, saveDocumentMetadata, createSignedDocumentUrl, toSha256 } = require('../lib/documentStorage');
const { resolveAuthContext } = require('../middleware/auth');
const { buildTicketPdf } = require('../services/pdfService');

const router = express.Router();

async function ensureTicketPdfForOrder({ order, createdBy, pnr = null, ticketNumber = null }) {
  const documentsBucket = process.env.DOCUMENTS_BUCKET || 'documents';
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
      const storagePath = `${existingDoc.storage_bucket}/${existingDoc.storage_path}`;
      const url = await createSignedDocumentUrl(supabase, storagePath, 3600);
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
  const folder = `tickets/${order.id}`;
  const timestamp = Date.now();
  const safeName = String(fileName).replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `${documentsBucket}/${folder}/${timestamp}-${safeName}`;

  await uploadPdfToStorage(supabase, pdfBuffer, storagePath);

  const doc = await saveDocumentMetadata(supabase, {
    docType: 'ticket_pdf',
    entityType: 'order',
    entityId: order.id,
    agencyId: order.agency_id,
    orderId: order.id,
    fileName,
    storagePath: storagePath.slice(documentsBucket.length + 1),
    storageBucket: documentsBucket,
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

  const signedUrl = await createSignedDocumentUrl(supabase, storagePath, 3600);
  return {
    issuance: finalizedIssuance || savedIssuance,
    doc,
    url: signedUrl,
    generated: true
  };
}

// GET /api/documents/:documentId/download
router.get('/documents/:documentId/download', async (req, res) => {
  const auth = await resolveAuthContext(req);
  if (auth.error) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: auth.error } });
  }

  const nodeEnv = req.app.get('nodeEnv');
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

    const storagePath = `${doc.storage_bucket}/${doc.storage_path}`;
    const signedUrl = await createSignedDocumentUrl(supabase, storagePath, 3600);
    return res.json({ url: signedUrl });
  } catch (err) {
    console.error('Document download error:', err);
    return res.status(500).json({
      error: {
        code: 'DOCUMENT_DOWNLOAD_FAILED',
        message: nodeEnv === 'development' ? err.message : 'Internal server error'
      }
    });
  }
});

// GET /api/orders/:orderId/ticket-document
router.get('/orders/:orderId/ticket-document', async (req, res) => {
  const auth = await resolveAuthContext(req);
  if (auth.error) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: auth.error } });
  }

  const nodeEnv = req.app.get('nodeEnv');
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
        message: nodeEnv === 'development' ? err.message : 'Internal server error'
      }
    });
  }
});

// GET /api/orders/:orderId/payment-instructions
router.get('/orders/:orderId/payment-instructions', async (req, res) => {
  const auth = await resolveAuthContext(req);
  if (auth.error) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: auth.error } });
  }

  const nodeEnv = req.app.get('nodeEnv');
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

    let resolvedAgencyId = order.agency_id || null;
    let agency = null;

    // Resolve missing agency link for old orders.
    if (!resolvedAgencyId && order.user_id) {
      const { data: orderProfile } = await supabase
        .from('profiles')
        .select('agency_id')
        .eq('id', order.user_id)
        .maybeSingle();
      if (orderProfile?.agency_id) {
        resolvedAgencyId = orderProfile.agency_id;
      }
    }

    if (!resolvedAgencyId && order.contact_email) {
      const normalizedEmail = String(order.contact_email).trim().toLowerCase();
      const { data: agenciesByEmail } = await supabase
        .from('agencies')
        .select('id')
        .eq('contact_email', normalizedEmail)
        .limit(2);
      const linked = Array.isArray(agenciesByEmail) ? agenciesByEmail : [];
      if (linked.length === 1) {
        resolvedAgencyId = linked[0].id;
      }
    }

    if (resolvedAgencyId && !order.agency_id) {
      const { error: patchOrderError } = await supabase
        .from('orders')
        .update({
          agency_id: resolvedAgencyId,
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id);
      if (patchOrderError) {
        console.warn('Failed to backfill order agency_id:', patchOrderError.message);
      }
    }

    if (resolvedAgencyId) {
      const { data } = await supabase
        .from('agencies')
        .select('id,name,domain,contact_email,contact_phone,settings')
        .eq('id', resolvedAgencyId)
        .single();
      agency = data || null;
    }

    if (!agency) {
      return res.status(422).json({
        error: {
          code: 'ORDER_AGENCY_NOT_LINKED',
          message: 'Order is not linked to an agency yet'
        }
      });
    }

    const bank = agency?.settings?.bank_details || {};
    const hasBankDetails = !!(
      bank.bank_name ||
      bank.bank_account ||
      bank.iban ||
      bank.swift_bic ||
      bank.sama_code
    );
    if (!hasBankDetails) {
      return res.status(422).json({
        error: {
          code: 'AGENCY_BANK_DETAILS_MISSING',
          message: 'Agency bank details are not configured'
        }
      });
    }

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
        'Transfer the amount to the agency bank details.',
        `In the payment reference, include the order number: ${order.order_number}`,
        'Once payment is received, the booking will be confirmed and the ticket issued.'
      ]
    };

    return res.json({ payment_instruction: paymentInstruction });
  } catch (err) {
    console.error('Payment instructions error:', err);
    return res.status(500).json({
      error: {
        code: 'PAYMENT_INSTRUCTIONS_FAILED',
        message: nodeEnv === 'development' ? err.message : 'Internal server error'
      }
    });
  }
});

module.exports = router;
