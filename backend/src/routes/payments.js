'use strict';

const express = require('express');
const axios = require('axios');
const supabase = require('../lib/supabase');
const drctService = require('../services/drctService');
const emailService = require('../services/emailService');
const { ensureTicketPdfForOrder } = require('../services/orderService');
const { config } = require('../config');

const router = express.Router();

const MOYASAR_API = 'https://api.moyasar.com/v1';
const MOYASAR_SECRET = () => process.env.MOYASAR_SECRET_KEY || '';
const BACKEND_URL = process.env.BACKEND_URL || 'https://peaceful-amazement-production-629f.up.railway.app';
const APP_URL = process.env.APP_URL || 'https://admin.aviaframe.com';

function moyasarAuth() {
  return { username: MOYASAR_SECRET(), password: '' };
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payments/initiate
// Body: { order_id, card: { name, number, month, year, cvc } }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/api/payments/initiate', express.json(), async (req, res) => {
  const { order_id, card } = req.body || {};

  if (!order_id) {
    return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'order_id is required' } });
  }
  if (!card?.name || !card?.number || !card?.month || !card?.year || !card?.cvc) {
    return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'card.name, number, month, year, cvc are required' } });
  }
  if (!MOYASAR_SECRET()) {
    return res.status(500).json({ error: { code: 'CONFIG_ERROR', message: 'Payment gateway not configured' } });
  }

  // Load order from Supabase
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .select('id, order_number, total_price, currency, drct_order_id, payment_status, metadata')
    .eq('id', order_id)
    .maybeSingle();

  if (orderErr || !order) {
    return res.status(404).json({ error: { code: 'ORDER_NOT_FOUND', message: 'Order not found' } });
  }
  if (order.payment_status === 'paid') {
    return res.status(400).json({ error: { code: 'ALREADY_PAID', message: 'Order is already paid' } });
  }

  // Amount in smallest currency unit (halalas for SAR, cents for USD, etc.)
  const amount = Math.round((order.total_price || 0) * 100);
  if (amount < 1) {
    return res.status(400).json({ error: { code: 'INVALID_AMOUNT', message: 'Order amount is too small' } });
  }
  const currency = (order.currency || 'SAR').toUpperCase();
  const callback_url = `${BACKEND_URL}/api/payments/callback`;

  // Call Moyasar
  let moyasarPayment;
  try {
    const { data } = await axios.post(
      `${MOYASAR_API}/payments`,
      {
        amount,
        currency,
        description: `Flight booking ${order.order_number}`,
        callback_url,
        source: {
          type: 'creditcard',
          name: card.name,
          number: String(card.number).replace(/\s/g, ''),
          month: String(card.month).padStart(2, '0'),
          year: String(card.year).length === 2 ? `20${card.year}` : String(card.year),
          cvc: String(card.cvc),
        },
      },
      { auth: moyasarAuth() }
    );
    moyasarPayment = data;
  } catch (err) {
    const moyasarMsg = err.response?.data?.message || err.response?.data?.errors?.join(', ') || err.message;
    console.error('[payments/initiate] Moyasar error:', moyasarMsg, JSON.stringify(err.response?.data || {}));
    return res.status(502).json({ error: { code: 'PAYMENT_GATEWAY_ERROR', message: moyasarMsg } });
  }

  // Save moyasar_payment_id to order metadata
  await supabase
    .from('orders')
    .update({
      metadata: { ...(order.metadata || {}), moyasar_payment_id: moyasarPayment.id },
      payment_method: 'online',
    })
    .eq('id', order_id);

  // Payment paid immediately (no 3DS required)
  if (moyasarPayment.status === 'paid') {
    // Mark as paid synchronously so client gets instant response
    await supabase
      .from('orders')
      .update({ payment_status: 'paid', status: 'confirmed', confirmed_at: new Date().toISOString() })
      .eq('id', order_id);
    // Fire-and-forget DRCT issuance + email (do not block the response)
    setImmediate(() => handlePaymentPaidAsync(order, moyasarPayment.id));
    return res.json({ payment_id: moyasarPayment.id, status: 'paid' });
  }

  // Payment requires 3DS or pending
  const transactionUrl = moyasarPayment.source?.transaction_url || null;
  console.log(`[payments/initiate] order ${order.order_number} → moyasar ${moyasarPayment.id} status=${moyasarPayment.status}`);
  return res.json({
    payment_id: moyasarPayment.id,
    status: moyasarPayment.status,
    transaction_url: transactionUrl,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/payments/callback
// Browser redirect from Moyasar after 3DS: ?id=PAY_ID&status=paid|failed
// Verifies with Moyasar API, updates order, redirects to portal
// ─────────────────────────────────────────────────────────────────────────────
router.get('/api/payments/callback', async (req, res) => {
  const { id: paymentId } = req.query;

  if (!paymentId) {
    return res.redirect(`${APP_URL}?payment_result=failed`);
  }

  // Verify payment status with Moyasar (never trust query params)
  let payment;
  try {
    const { data } = await axios.get(`${MOYASAR_API}/payments/${paymentId}`, { auth: moyasarAuth() });
    payment = data;
  } catch (err) {
    console.error('[payments/callback] Moyasar verify error:', err.message);
    return res.redirect(`${APP_URL}?payment_result=failed`);
  }

  // Find order by moyasar_payment_id stored in metadata
  const { data: orders } = await supabase
    .from('orders')
    .select('id, order_number, drct_order_id, payment_status, contact_email, origin, destination, departure_time, currency, total_price')
    .filter('metadata->>moyasar_payment_id', 'eq', paymentId)
    .limit(1);

  const order = orders?.[0];
  if (!order) {
    console.error('[payments/callback] order not found for payment', paymentId);
    return res.redirect(`${APP_URL}?payment_result=failed`);
  }

  if (payment.status === 'paid') {
    if (order.payment_status !== 'paid') {
      // Mark as paid synchronously, then redirect immediately; DRCT + email run async
      await supabase
        .from('orders')
        .update({ payment_status: 'paid', status: 'confirmed', confirmed_at: new Date().toISOString() })
        .eq('id', order.id);
      setImmediate(() => handlePaymentPaidAsync(order, paymentId));
    }
    return res.redirect(`${APP_URL}?payment_result=success&order_id=${order.id}`);
  }

  // Payment failed or cancelled
  await supabase
    .from('orders')
    .update({ payment_status: 'failed' })
    .eq('id', order.id);

  console.log(`[payments/callback] payment ${paymentId} failed for order ${order.order_number}`);
  return res.redirect(`${APP_URL}?payment_result=failed&order_id=${order.id}`);
});

// ─────────────────────────────────────────────────────────────────────────────
// Internal: issue DRCT ticket + generate PDF + send HTML email with attachment
// ─────────────────────────────────────────────────────────────────────────────
async function handlePaymentPaidAsync(order, paymentId) {
  console.log(`[payments] handlePaymentPaidAsync start: order=${order.order_number} payment=${paymentId}`);

  // 1. Issue DRCT ticket
  let pnr = null;
  let ticketNumber = null;
  if (order.drct_order_id) {
    try {
      const issued = await drctService.issueOrder(order.drct_order_id, {
        orderId: order.id,
        agencyId: order.agency_id
      });
      pnr = issued.pnr;
      ticketNumber = issued.ticket_number;
      await supabase.from('orders').update({ status: 'ticketed' }).eq('id', order.id);
      console.log(`[payments] DRCT issued: order=${order.order_number} pnr=${pnr}`);
    } catch (err) {
      console.error(`[payments] DRCT issue failed for ${order.order_number}:`, err.message);
      // Continue — payment done, ticket can be issued manually
    }
  }

  // 2. Generate PDF + send ticket email
  try {
    // Fetch full order data (need all fields for PDF)
    const { data: fullOrder } = await supabase
      .from('orders')
      .select('id,order_number,user_id,agency_id,drct_order_id,origin,destination,departure_time,arrival_time,airline_code,airline_name,flight_number,total_price,currency,status,contact_email,contact_phone,raw_offer_data')
      .eq('id', order.id)
      .single();

    if (!fullOrder) throw new Error('Could not re-fetch order for PDF generation');

    const { doc, issuance: savedIssuance } = await ensureTicketPdfForOrder({
      order: fullOrder,
      createdBy: 'payment_webhook',
      pnr,
      ticketNumber
    });

    if (fullOrder.contact_email && doc) {
      const { data: blob } = await supabase.storage
        .from(config.documentsBucket)
        .download(doc.storage_path);

      if (blob) {
        const buffer = Buffer.from(await blob.arrayBuffer());

        const { data: passengers } = await supabase
          .from('passengers')
          .select('first_name,last_name,passenger_type')
          .eq('order_id', fullOrder.id);

        const emailResult = await emailService.sendTicketEmail({
          to: fullOrder.contact_email,
          order: fullOrder,
          passengers: passengers || [],
          issuance: savedIssuance || {},
          attachment: {
            fileName: `ticket-${fullOrder.order_number}.pdf`,
            buffer
          }
        });

        if (emailResult.sent && savedIssuance?.id) {
          await supabase.from('ticket_issuances')
            .update({ email_status: 'sent', email_sent_at: new Date().toISOString() })
            .eq('id', savedIssuance.id);
        }
        console.log(`[payments] ticket email sent to ${fullOrder.contact_email} for ${fullOrder.order_number}`);
      }
    }
  } catch (err) {
    console.error(`[payments] PDF/email failed for ${order.order_number}:`, err.message);
  }
}

module.exports = router;
module.exports.handlePaymentPaidAsync = handlePaymentPaidAsync;
