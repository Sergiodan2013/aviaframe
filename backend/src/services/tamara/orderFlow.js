'use strict';

const supabase = require('../../lib/supabase');
const tamaraClient = require('./client');
const { logOperation } = require('./webhook');
const { config } = require('../../config');

// Statuses that mean the order has already been fully processed (or failed) —
// a repeated approved webhook must not re-issue or re-capture.
const TERMINAL_STATUSES = [
  'tamara_authorised',
  'tamara_captured',
  'tamara_capture_pending',
  'tamara_cancelled',
  'tamara_failed',
  'issue_failed'
];

/**
 * Full orchestration after Tamara approved webhook:
 *   authorise → issueDrctTicket (DRCT + PDF) → capture → email
 *
 * Failure paths:
 *   authorise fail  → tamara_failed, stop
 *   issue fail      → cancel Tamara, issue_failed, internal alert, stop
 *   capture fail    → tamara_capture_pending (order stays issued, manual review)
 *   email fail      → non-fatal, order stays issued
 */
async function processApprovedOrder(aviaframeOrderId, tamaraOrderId) {
  console.log(`[tamara/flow] START aviaframe=${aviaframeOrderId} tamara=${tamaraOrderId}`);

  // ── 1. Load order ──────────────────────────────────────────────────────────
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id,order_number,user_id,agency_id,drct_order_id,origin,destination,departure_time,arrival_time,airline_code,airline_name,flight_number,total_price,currency,status,contact_email,contact_phone,raw_offer_data,payment_provider_status')
    .eq('id', aviaframeOrderId)
    .single();

  if (orderError || !order) {
    console.error('[tamara/flow] Order not found:', aviaframeOrderId);
    return { success: false, error: 'Order not found' };
  }

  // ── Idempotency guard ──────────────────────────────────────────────────────
  if (TERMINAL_STATUSES.includes(order.payment_provider_status)) {
    console.log('[tamara/flow] Already in terminal status, skipping:', order.payment_provider_status);
    return { success: true, skipped: true };
  }

  // ── 2. Authorise ───────────────────────────────────────────────────────────
  console.log(`[tamara/flow] Authorise started: tamara_order=${tamaraOrderId}`);
  let authResponse;
  try {
    authResponse = await tamaraClient.authoriseOrder(tamaraOrderId);
    await logOperation({
      orderId: order.id, provider: 'tamara', operationType: 'authorise',
      requestJson: { tamara_order_id: tamaraOrderId },
      responseJson: authResponse,
      providerReference: authResponse?.authorisation_id || tamaraOrderId,
      success: true
    });
    console.log(`[tamara/flow] Authorise success: status=${authResponse?.status} ref=${authResponse?.authorisation_id}`);
  } catch (err) {
    await logOperation({
      orderId: order.id, provider: 'tamara', operationType: 'authorise',
      requestJson: { tamara_order_id: tamaraOrderId },
      responseJson: { error: err.message }, success: false
    });
    console.error('[tamara/flow] Authorise failed:', err.message);
    await updateOrderProviderStatus(order.id, 'tamara_failed', { payment_provider_order_id: tamaraOrderId });
    return { success: false, error: 'Tamara authorisation failed' };
  }

  await updateOrderProviderStatus(order.id, 'tamara_authorised', {
    payment_authorised_at: new Date().toISOString(),
    status: 'confirmed'
  });

  // ── 3. Issue DRCT ticket + generate PDF ────────────────────────────────────
  console.log(`[tamara/flow] Issue started: order=${order.order_number} drct_order_id=${order.drct_order_id || 'none'}`);
  await updateOrderProviderStatus(order.id, 'tamara_authorised', { status: 'confirmed' });

  let pdfDoc = null;
  let savedIssuance = null;
  try {
    const { issueDrctTicket } = require('../orderService');
    const result = await issueDrctTicket({ order, createdBy: 'tamara_webhook' });
    pdfDoc = result.doc;
    savedIssuance = result.issuance;
    console.log(`[tamara/flow] Issue success: doc=${pdfDoc?.id} issuance=${savedIssuance?.id} pnr=${result.pnr}`);
  } catch (err) {
    console.error('[tamara/flow] Issue failed:', err.message);

    // Cancel Tamara — authorised but not yet captured, so cancel is valid
    try {
      const cancelResp = await tamaraClient.cancelOrder(tamaraOrderId);
      await logOperation({
        orderId: order.id, provider: 'tamara', operationType: 'cancel',
        requestJson: { tamara_order_id: tamaraOrderId, reason: 'issue_failed' },
        responseJson: cancelResp, success: true
      });
      console.log(`[tamara/flow] Tamara order cancelled after issue failure: ${tamaraOrderId}`);
    } catch (cancelErr) {
      await logOperation({
        orderId: order.id, provider: 'tamara', operationType: 'cancel',
        requestJson: { tamara_order_id: tamaraOrderId, reason: 'issue_failed' },
        responseJson: { error: cancelErr.message }, success: false
      });
      console.error('[tamara/flow] Cancel also failed after issue failure:', cancelErr.message);
    }

    await updateOrderProviderStatus(order.id, 'issue_failed', {
      status: 'failed',
      payment_cancelled_at: new Date().toISOString()
    });

    // Internal alert
    await sendInternalAlert({
      subject: `[Tamara] Ticket issue FAILED — order ${order.order_number}`,
      text: `issueDrctTicket failed for order ${order.order_number} (${order.id}).\nTamara order: ${tamaraOrderId}\nError: ${err.message}\n\nTamara order has been cancelled. Manual review required.`
    });

    return { success: false, error: 'Ticket issuance failed', details: err.message };
  }

  // ── 4. Capture Tamara ──────────────────────────────────────────────────────
  console.log(`[tamara/flow] Capture started: tamara_order=${tamaraOrderId} amount=${order.total_price} ${order.currency}`);
  try {
    const captureResp = await tamaraClient.captureOrder(tamaraOrderId, {
      totalAmount: order.total_price,
      currency: order.currency || 'SAR',
      orderId: order.id
    });
    await logOperation({
      orderId: order.id, provider: 'tamara', operationType: 'capture',
      requestJson: { tamara_order_id: tamaraOrderId },
      responseJson: captureResp, success: true
    });
    await updateOrderProviderStatus(order.id, 'tamara_captured', {
      payment_captured_at: new Date().toISOString(),
      status: 'ticketed'
    });
    console.log(`[tamara/flow] Capture success. Order issued: ${order.order_number}`);
  } catch (err) {
    console.error('[tamara/flow] Capture failed:', err.message);
    await logOperation({
      orderId: order.id, provider: 'tamara', operationType: 'capture',
      requestJson: { tamara_order_id: tamaraOrderId },
      responseJson: { error: err.message }, success: false
    });
    // Ticket already issued — do not roll back. Mark for manual capture.
    await updateOrderProviderStatus(order.id, 'tamara_capture_pending', { status: 'ticketed' });
    console.warn(`[tamara/flow] Capture pending manual review: order=${order.order_number}`);

    await sendInternalAlert({
      subject: `[Tamara] Capture FAILED — order ${order.order_number} (ticket already issued)`,
      text: `Tamara capture failed for order ${order.order_number} (${order.id}).\nTamara order: ${tamaraOrderId}\nError: ${err.message}\n\nTicket is already issued. Manual capture required.`
    });

    // Still send email — ticket was issued
    await sendTicketEmailStep({ order, pdfDoc, savedIssuance });
    return { success: true, status: 'issued', captureError: err.message };
  }

  // ── 5. Send ticket email ───────────────────────────────────────────────────
  await sendTicketEmailStep({ order, pdfDoc, savedIssuance });

  return { success: true, status: 'issued' };
}

// ─── Email helper ──────────────────────────────────────────────────────────────
async function sendTicketEmailStep({ order, pdfDoc, savedIssuance }) {
  if (!pdfDoc || !order.contact_email) return;
  console.log(`[tamara/flow] Email started: to=${order.contact_email}`);
  try {
    const emailService = require('../emailService');
    const { data: blob } = await supabase.storage
      .from(config.documentsBucket)
      .download(pdfDoc.storage_path);

    if (!blob) {
      console.warn('[tamara/flow] Email skipped: PDF blob not found in storage');
      return;
    }

    const buffer = Buffer.from(await blob.arrayBuffer());
    const { data: passengers } = await supabase
      .from('passengers')
      .select('first_name,last_name,passenger_type')
      .eq('order_id', order.id);

    const emailResult = await emailService.sendTicketEmail({
      to: order.contact_email,
      order,
      passengers: passengers || [],
      issuance: savedIssuance || {},
      attachment: {
        fileName: `ticket-${order.order_number}.pdf`,
        buffer
      }
    });

    if (emailResult.sent && savedIssuance?.id) {
      await supabase.from('ticket_issuances')
        .update({ email_status: 'sent', email_sent_at: new Date().toISOString() })
        .eq('id', savedIssuance.id);
    }
    console.log(`[tamara/flow] Email ${emailResult.sent ? 'sent' : 'failed'} to ${order.contact_email}`);
  } catch (err) {
    console.error('[tamara/flow] Email failed (non-fatal):', err.message);
  }
}

// ─── Internal alert helper ─────────────────────────────────────────────────────
async function sendInternalAlert({ subject, text }) {
  try {
    const { sendSupportEmail } = require('../emailService');
    const adminEmail = process.env.ADMIN_ALERT_EMAIL || process.env.SUPPORT_EMAIL;
    if (!adminEmail) return;
    await sendSupportEmail({ to: adminEmail, subject, text });
    console.log(`[tamara/flow] Internal alert sent to ${adminEmail}: ${subject}`);
  } catch (err) {
    console.error('[tamara/flow] Internal alert failed:', err.message);
  }
}

/**
 * Called when Tamara sends declined/failed/expired webhook.
 */
async function handleFailedOrder(aviaframeOrderId, tamaraOrderId, reason = 'declined') {
  console.log(`[tamara/flow] handleFailed aviaframe=${aviaframeOrderId} reason=${reason}`);

  const { data: order } = await supabase
    .from('orders')
    .select('id,order_number,contact_email,payment_provider_status')
    .eq('id', aviaframeOrderId)
    .single();

  if (!order) return;
  if (TERMINAL_STATUSES.includes(order.payment_provider_status)) {
    console.log('[tamara/flow] Already in terminal status, skipping:', order.payment_provider_status);
    return;
  }

  if (tamaraOrderId) {
    try {
      const cancelResp = await tamaraClient.cancelOrder(tamaraOrderId);
      await logOperation({
        orderId: order.id, provider: 'tamara', operationType: 'cancel',
        requestJson: { tamara_order_id: tamaraOrderId, reason },
        responseJson: cancelResp, success: true
      });
      console.log(`[tamara/flow] Tamara order cancelled: ${tamaraOrderId}`);
    } catch (err) {
      await logOperation({
        orderId: order.id, provider: 'tamara', operationType: 'cancel',
        requestJson: { tamara_order_id: tamaraOrderId, reason },
        responseJson: { error: err.message }, success: false
      });
      console.error('[tamara/flow] Cancel failed:', err.message);
    }
  }

  await updateOrderProviderStatus(order.id, 'tamara_failed', {
    payment_cancelled_at: new Date().toISOString(),
    status: 'cancelled'
  });
  console.log(`[tamara/flow] Order marked cancelled: ${order.order_number}`);

  await sendInternalAlert({
    subject: `[Tamara] Payment ${reason} — order ${order.order_number}`,
    text: `Tamara payment ${reason} for order ${order.order_number} (${aviaframeOrderId}).\nTamara order: ${tamaraOrderId}`
  });
}

async function updateOrderProviderStatus(orderId, providerStatus, extra = {}) {
  const { error } = await supabase
    .from('orders')
    .update({ payment_provider_status: providerStatus, updated_at: new Date().toISOString(), ...extra })
    .eq('id', orderId);
  if (error) console.error('[tamara/flow] updateStatus error:', error.message);
}

module.exports = { processApprovedOrder, handleFailedOrder, updateOrderProviderStatus };
