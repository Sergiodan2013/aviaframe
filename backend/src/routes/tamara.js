'use strict';

const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { config } = require('../config');
const { resolveAuthContext } = require('../middleware/auth');
const tamaraClient = require('../services/tamara/client');
const { buildCheckoutPayload } = require('../services/tamara/mapper');
const { validateWebhookToken, persistWebhookEvent, markEventProcessed, logOperation } = require('../services/tamara/webhook');
const { processApprovedOrder, updateOrderProviderStatus } = require('../services/tamara/orderFlow');

const TAMARA_ENABLED = process.env.TAMARA_ENABLED === 'true';
const TAMARA_PUBLIC_KEY = process.env.TAMARA_PUBLIC_KEY || '';

// ─── POST /api/payments/tamara/checkout-session ───────────────────────────────
// Creates a Tamara checkout session for an existing AviaFrame order.
router.post('/tamara/checkout-session', async (req, res) => {
  if (!TAMARA_ENABLED) {
    return res.status(503).json({ error: { code: 'TAMARA_DISABLED', message: 'Tamara is not enabled' } });
  }

  const { order_id: orderId, language = 'en' } = req.body || {};
  if (!orderId) {
    return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'order_id is required' } });
  }

  // Load order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    return res.status(404).json({ error: { code: 'ORDER_NOT_FOUND', message: 'Order not found' } });
  }

  // KSA + SAR only
  if ((order.currency || 'SAR') !== 'SAR') {
    return res.status(400).json({ error: { code: 'CURRENCY_NOT_SUPPORTED', message: 'Tamara only supports SAR' } });
  }

  // Guard: only pending orders
  if (!['pending', 'pending_payment'].includes(order.status)) {
    return res.status(400).json({ error: { code: 'ORDER_NOT_PENDING', message: 'Order is not in pending state' } });
  }

  // Load first passenger for consumer name
  const { data: passenger } = await supabase
    .from('passengers')
    .select('first_name,last_name')
    .eq('order_id', orderId)
    .limit(1)
    .maybeSingle();

  if (!passenger) {
    return res.status(400).json({ error: { code: 'NO_PASSENGERS', message: 'Order has no passengers — cannot build Tamara checkout' } });
  }
  if (!order.total_price || Number(order.total_price) <= 0) {
    return res.status(400).json({ error: { code: 'INVALID_TOTAL', message: 'Order total_price must be > 0' } });
  }
  if (!order.contact_email) {
    return res.status(400).json({ error: { code: 'MISSING_EMAIL', message: 'Order contact_email is required' } });
  }

  try {
    let checkoutPayload;
    try {
      checkoutPayload = buildCheckoutPayload(order, passenger, { language });
    } catch (mapErr) {
      return res.status(400).json({ error: { code: mapErr.code || 'PAYLOAD_BUILD_FAILED', message: mapErr.message } });
    }
    console.log('[tamara] checkout payload compact=' + JSON.stringify(checkoutPayload));
    console.log(`[tamara] order=${orderId} total=${order.total_price} ${order.currency} consumer="${passenger.first_name} ${passenger.last_name}" phone=${checkoutPayload.consumer.phone_number}`);

    const session = await tamaraClient.createCheckoutSession(checkoutPayload);

    // Update order with Tamara session info
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({
        payment_provider: 'tamara',
        payment_provider_order_id: session.order_id || null,
        payment_provider_status: 'tamara_checkout_created',
        status: 'pending_payment',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select('id,payment_provider,payment_provider_order_id,payment_provider_status,status')
      .single();

    if (updateError || !updatedOrder) {
      console.error('[tamara] order update failed after checkout-session:', updateError?.message || 'no row updated');
      return res.status(500).json({
        error: {
          code: 'TAMARA_ORDER_UPDATE_FAILED',
          message: updateError?.message || 'Failed to link order to Tamara session'
        }
      });
    }

    console.log(`[tamara] Checkout session created for order ${orderId}: ${session.checkout_id}`);
    console.log('[tamara] order linked to session=' + JSON.stringify(updatedOrder));

    return res.json({
      checkout_id: session.checkout_id,
      checkout_url: session.checkout_url,
      tamara_order_id: session.order_id
    });
  } catch (err) {
    console.error('[tamara] checkout-session error status=' + (err.response?.status || 'no-status') + ' body=' + JSON.stringify(err.response?.data || err.message));
    return res.status(502).json({
      error: {
        code: 'TAMARA_CHECKOUT_FAILED',
        message: err.response?.data?.message || err.message
      }
    });
  }
});

// ─── POST /api/payments/tamara/webhook ────────────────────────────────────────
// Receives Tamara webhook events. Public endpoint, validated via tamaraToken.
router.post('/tamara/webhook', express.json(), async (req, res) => {
  const tamaraToken = req.query.tamaraToken || req.headers['x-notification-token'] || req.headers['x-tamara-token'];

  // Validate token
  const { valid, error: tokenError } = validateWebhookToken(tamaraToken);
  if (!valid) {
    console.warn('[tamara] Webhook token invalid:', tokenError);
    return res.status(401).json({ error: 'Invalid webhook token' });
  }

  const body = req.body || {};
  const tamaraOrderId = body.order_id || body.id;
  const eventType = body.event_type || 'webhook';
  const eventStatus = body.order_status || body.status;

  if (!tamaraOrderId) {
    return res.status(400).json({ error: 'Missing order_id in webhook body' });
  }

  console.log(`[tamara] Webhook received: order=${tamaraOrderId} status=${eventStatus}`);

  // Persist for idempotency
  let eventRecord;
  try {
    eventRecord = await persistWebhookEvent({
      provider: 'tamara',
      providerOrderId: tamaraOrderId,
      eventType,
      eventStatus,
      payload: body
    });
  } catch (err) {
    console.error('[tamara] Failed to persist webhook event:', err.message);
    return res.status(500).json({ error: 'Internal error persisting event' });
  }

  // Acknowledge immediately — process async
  res.status(200).json({ received: true });

  if (eventRecord.existing) {
    console.log('[tamara] Webhook already processed, skipping:', tamaraOrderId);
    return;
  }

  // Process asynchronously
  setImmediate(async () => {
    try {
      // Find AviaFrame order by Tamara order ID
      const { data: order } = await supabase
        .from('orders')
        .select('id,status,payment_provider_status')
        .eq('payment_provider_order_id', tamaraOrderId)
        .eq('payment_provider', 'tamara')
        .maybeSingle();

      if (!order) {
        console.error('[tamara] No AviaFrame order found for Tamara order:', tamaraOrderId);
        return;
      }

      const status = String(eventStatus || '').toLowerCase();

      if (status === 'approved') {
        await updateOrderProviderStatus(order.id, 'tamara_approved');
        const result = await processApprovedOrder(order.id, tamaraOrderId);
        console.log('[tamara] processApprovedOrder result:', result);
      } else if (status === 'declined' || status === 'failed') {
        await updateOrderProviderStatus(order.id, 'tamara_failed', { status: 'cancelled' });
      } else if (status === 'expired') {
        await updateOrderProviderStatus(order.id, 'tamara_expired', { status: 'cancelled' });
      } else {
        console.log('[tamara] Unhandled webhook status:', eventStatus);
      }

      await markEventProcessed(eventRecord.id);
    } catch (err) {
      console.error('[tamara] Async webhook processing error:', err.message);
    }
  });
});

// ─── GET /api/payments/tamara/status/:orderId ─────────────────────────────────
// Frontend polls this to get the current Tamara payment status.
router.get('/tamara/status/:orderId', async (req, res) => {
  const { orderId } = req.params;

  const { data: order, error } = await supabase
    .from('orders')
    .select('id,status,payment_provider,payment_provider_status,payment_provider_order_id,order_number,total_price,currency,contact_email')
    .eq('id', orderId)
    .single();

  if (error || !order) {
    return res.status(404).json({ error: { code: 'ORDER_NOT_FOUND' } });
  }

  return res.json({
    order_id: order.id,
    order_number: order.order_number,
    status: order.status,
    payment_provider: order.payment_provider,
    payment_provider_status: order.payment_provider_status,
    total_price: order.total_price,
    currency: order.currency
  });
});

// ─── GET /api/payments/tamara/config ─────────────────────────────────────────
// Returns public Tamara config for frontend (public key only, never secret).
router.get('/tamara/config', (req, res) => {
  return res.json({
    enabled: TAMARA_ENABLED,
    public_key: TAMARA_PUBLIC_KEY,
    environment: process.env.TAMARA_ENV || 'sandbox'
  });
});

// ─── POST /api/payments/tamara/:orderId/cancel ────────────────────────────────
router.post('/tamara/:orderId/cancel', async (req, res) => {
  const auth = await resolveAuthContext(req);
  if (auth.error) return res.status(401).json({ error: { code: 'UNAUTHORIZED' } });

  const { orderId } = req.params;
  const { data: order } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (!order || order.payment_provider !== 'tamara') {
    return res.status(404).json({ error: { code: 'ORDER_NOT_FOUND' } });
  }

  try {
    const result = await tamaraClient.cancelOrder(order.payment_provider_order_id);
    await logOperation({
      orderId: order.id, provider: 'tamara', operationType: 'cancel',
      requestJson: { tamara_order_id: order.payment_provider_order_id },
      responseJson: result, success: true
    });
    await updateOrderProviderStatus(order.id, 'tamara_cancelled', {
      payment_cancelled_at: new Date().toISOString(),
      status: 'cancelled'
    });
    return res.json({ success: true });
  } catch (err) {
    return res.status(502).json({ error: { code: 'TAMARA_CANCEL_FAILED', message: err.message } });
  }
});

// ─── POST /api/payments/tamara/:orderId/refund ────────────────────────────────
router.post('/tamara/:orderId/refund', async (req, res) => {
  const auth = await resolveAuthContext(req);
  if (auth.error) return res.status(401).json({ error: { code: 'UNAUTHORIZED' } });

  const { orderId } = req.params;
  const { comment = '' } = req.body || {};
  const { data: order } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (!order || order.payment_provider !== 'tamara') {
    return res.status(404).json({ error: { code: 'ORDER_NOT_FOUND' } });
  }

  try {
    const result = await tamaraClient.refundOrder(order.payment_provider_order_id, {
      totalAmount: order.total_price,
      currency: order.currency || 'SAR',
      comment
    });
    await logOperation({
      orderId: order.id, provider: 'tamara', operationType: 'refund',
      requestJson: { tamara_order_id: order.payment_provider_order_id },
      responseJson: result, success: true
    });
    await updateOrderProviderStatus(order.id, 'tamara_refunded', {
      payment_refunded_at: new Date().toISOString(),
      status: 'refunded'
    });
    return res.json({ success: true });
  } catch (err) {
    return res.status(502).json({ error: { code: 'TAMARA_REFUND_FAILED', message: err.message } });
  }
});

module.exports = router;
