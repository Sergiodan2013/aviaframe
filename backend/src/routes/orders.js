'use strict';

const express = require('express');
const supabase = require('../lib/supabase');
const { isAdminRole, isAgentRole } = require('../lib/utils');
const { canAccessOrder, forbidden } = require('../lib/authorization');
const { resolveAuthContext } = require('../middleware/auth');
const { ensureStaff } = require('../middleware/requireRole');
const { buildTicketPdf } = require('../services/pdfService');
const { sendTicketEmail, sendBookingCancelled, sendBookingConfirmed } = require('../services/emailService');
const { uploadPdfToStorage, saveDocumentMetadata, createSignedDocumentUrl, toSha256 } = require('../lib/documentStorage');

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
  'cancelled_at',
  'metadata'
].join(',');

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

// GET /api/me/orders
// Returns all orders claimed by the authenticated user.
router.get('/me/orders', async (req, res) => {
  const auth = await resolveAuthContext(req);
  if (auth.error) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: auth.error } });
  }

  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select(ORDERS_LIST_COLUMNS)
    .eq('user_id', auth.user.id)
    .order('created_at', { ascending: false });

  if (ordersError) {
    return res.status(500).json({ error: { code: 'FETCH_FAILED', message: ordersError.message } });
  }

  return res.json({ orders: orders || [] });
});

// GET /api/orders — list orders (role-scoped)
router.get('/orders', async (req, res) => {
  const auth = await resolveAuthContext(req);
  if (auth.error) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: auth.error
      }
    });
  }

  const nodeEnv = req.app.get('nodeEnv');
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
        message: nodeEnv === 'development' ? err.message : 'Internal server error'
      }
    });
  }
});

// PATCH /api/orders/:orderId/status
router.patch('/orders/:orderId/status', async (req, res) => {
  const auth = await resolveAuthContext(req);
  if (auth.error) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: auth.error
      }
    });
  }

  const nodeEnv = req.app.get('nodeEnv');
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

    // Send cancellation email (non-blocking)
    if (normalizedStatus === 'cancelled' && updated?.contact_email) {
      supabase.from('agencies').select('id,name,settings').eq('id', updated.agency_id).single()
        .then(({ data: ag }) =>
          sendBookingCancelled({ order: updated, agency: ag || null })
        )
        .then((r) => { if (!r.sent) console.warn('[order] cancellation email not sent:', r.error); })
        .catch((e) => console.error('[order] cancellation email error:', e.message));
    }

    // Send payment-confirmed email (non-blocking)
    if (normalizedStatus === 'confirmed' && updated?.contact_email) {
      supabase.from('agencies').select('id,name,settings').eq('id', updated.agency_id).single()
        .then(({ data: ag }) =>
          sendBookingConfirmed({ order: updated, agency: ag || null })
        )
        .then((r) => { if (!r.sent) console.warn('[order] confirmed email not sent:', r.error); })
        .catch((e) => console.error('[order] confirmed email error:', e.message));
    }

    return res.json({ order: updated });
  } catch (err) {
    console.error('Order status update error:', err);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: nodeEnv === 'development' ? err.message : 'Internal server error'
      }
    });
  }
});

// POST /api/orders/:orderId/ticket/finalize
router.post('/orders/:orderId/ticket/finalize', async (req, res) => {
  const auth = await resolveAuthContext(req);
  if (auth.error) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: auth.error } });
  }
  if (!ensureStaff(auth, res)) return;

  const nodeEnv = req.app.get('nodeEnv');
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
        message: nodeEnv === 'development' ? err.message : 'Internal server error'
      }
    });
  }
});

module.exports = router;
