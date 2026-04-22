'use strict';

const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { config, ORDERS_LIST_COLUMNS } = require('../config');
const { isAdminRole, isAgentRole, isStaffRole } = require('../utils/helpers');
const { resolveAuthContext, forbidden, ensureStaff, canAccessOrder } = require('../middleware/auth');
const { ensureTicketPdfForOrder, createSignedDocumentUrl } = require('../services/orderService');
const { sendTicketEmail } = require('../services/emailService');

router.get('/api/profile/me', async (req, res) => {
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
router.get('/api/orders', async (req, res) => {
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

router.patch('/api/orders/:orderId/status', async (req, res) => {
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

// Mark a cash/invoice order as paid by admin → triggers PDF generation + email
router.post('/api/orders/:orderId/mark-paid', async (req, res) => {
  const auth = await resolveAuthContext(req);
  if (auth.error) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: auth.error } });
  }
  if (!isAdminRole(auth.profile.role) && auth.profile.role !== 'agent') {
    return forbidden(res, 'Admin or agent role required to mark orders as paid');
  }

  const { orderId } = req.params;
  try {
    let orderQuery = supabase
      .from('orders')
      .select('id,order_number,agency_id,drct_order_id,payment_status,payment_method,status,contact_email,origin,destination,total_price,currency')
      .eq('id', orderId);

    // Agents can only mark orders for their own agency
    if (auth.profile.role === 'agent' && auth.profile.agency_id) {
      orderQuery = orderQuery.eq('agency_id', auth.profile.agency_id);
    }

    const { data: order, error: orderErr } = await orderQuery.maybeSingle();

    if (orderErr || !order) {
      return res.status(404).json({ error: { code: 'ORDER_NOT_FOUND', message: 'Order not found' } });
    }
    if (order.payment_status === 'paid') {
      return res.status(400).json({ error: { code: 'ALREADY_PAID', message: 'Order is already marked as paid' } });
    }

    const nowIso = new Date().toISOString();
    await supabase.from('orders').update({
      payment_status: 'paid',
      status: 'confirmed',
      confirmed_at: nowIso,
      updated_at: nowIso
    }).eq('id', order.id);

    // Trigger async ticket issuance + PDF + email (same flow as online card payment)
    const paymentsModule = require('./payments');
    setImmediate(() => paymentsModule.handlePaymentPaidAsync(order, `manual_${auth.profile.id}`));

    return res.json({ ok: true, order_number: order.order_number, message: 'Order marked as paid. Ticket will be issued and emailed shortly.' });
  } catch (err) {
    console.error('mark-paid error:', err);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: config.nodeEnv === 'development' ? err.message : 'Internal server error' } });
  }
});

router.get('/api/orders/:orderId/ticket-document', async (req, res) => {
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

router.get('/api/orders/:orderId/payment-instructions', async (req, res) => {
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

router.post('/api/orders/:orderId/ticket/finalize', async (req, res) => {
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
      const { data: emailPassengers } = await supabase
        .from('passengers')
        .select('first_name,last_name,passenger_type')
        .eq('order_id', order.id);
      emailState = await sendTicketEmail({
        to: order.contact_email,
        order,
        passengers: emailPassengers || [],
        issuance: issuance || {},
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

module.exports = router;
