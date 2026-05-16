'use strict';

const supabase = require('../../lib/supabase');
const tamaraClient = require('./client');
const { logOperation } = require('./webhook');

/**
 * Full orchestration: authorise → DRCT issue → capture (or cancel on failure).
 * Called after receiving approved webhook.
 */
async function processApprovedOrder(aviaframeOrderId, tamaraOrderId) {
  console.log(`[tamara] processApprovedOrder: aviaframe=${aviaframeOrderId} tamara=${tamaraOrderId}`);

  // 1. Load order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', aviaframeOrderId)
    .single();

  if (orderError || !order) {
    console.error('[tamara] Order not found:', aviaframeOrderId);
    return { success: false, error: 'Order not found' };
  }

  // Guard: skip if already authorised or beyond
  if (['tamara_authorised', 'tamara_captured', 'tamara_cancelled'].includes(order.payment_provider_status)) {
    console.log('[tamara] Already processed, skipping:', order.payment_provider_status);
    return { success: true, skipped: true };
  }

  // 2. Call Tamara Authorisation API
  let authResponse;
  try {
    authResponse = await tamaraClient.authoriseOrder(tamaraOrderId);
    await logOperation({
      orderId: order.id,
      provider: 'tamara',
      operationType: 'authorise',
      requestJson: { tamara_order_id: tamaraOrderId },
      responseJson: authResponse,
      providerReference: authResponse?.authorisation_id || tamaraOrderId,
      success: true
    });
    console.log('[tamara] Authorisation success:', authResponse?.status);
  } catch (err) {
    await logOperation({
      orderId: order.id,
      provider: 'tamara',
      operationType: 'authorise',
      requestJson: { tamara_order_id: tamaraOrderId },
      responseJson: { error: err.message },
      success: false
    });
    console.error('[tamara] Authorisation failed:', err.message);
    await updateOrderProviderStatus(order.id, 'tamara_failed', { payment_provider_order_id: tamaraOrderId });
    return { success: false, error: 'Tamara authorisation failed' };
  }

  // Update status to authorised
  await updateOrderProviderStatus(order.id, 'tamara_authorised', {
    payment_authorised_at: new Date().toISOString(),
    status: 'payment_authorised'
  });

  // 3. Call DRCT issue
  let drctSuccess = false;
  try {
    const { issueDrctTicket } = require('../orderService');
    const issueResult = await issueDrctTicket(order);
    drctSuccess = !!issueResult?.success;
    console.log('[tamara] DRCT issue result:', drctSuccess);
  } catch (err) {
    console.error('[tamara] DRCT issue error:', err.message);
    drctSuccess = false;
  }

  if (drctSuccess) {
    // 4a. Capture Tamara
    try {
      const captureResp = await tamaraClient.captureOrder(tamaraOrderId, {
        totalAmount: order.total_price,
        currency: order.currency || 'SAR',
        orderId: order.id
      });
      await logOperation({
        orderId: order.id,
        provider: 'tamara',
        operationType: 'capture',
        requestJson: { tamara_order_id: tamaraOrderId },
        responseJson: captureResp,
        success: true
      });
      await updateOrderProviderStatus(order.id, 'tamara_captured', {
        payment_captured_at: new Date().toISOString(),
        status: 'issued'
      });
      console.log('[tamara] Capture success');
      return { success: true, status: 'issued' };
    } catch (err) {
      console.error('[tamara] Capture failed:', err.message);
      await logOperation({
        orderId: order.id,
        provider: 'tamara',
        operationType: 'capture',
        requestJson: { tamara_order_id: tamaraOrderId },
        responseJson: { error: err.message },
        success: false
      });
      // Capture failed — order is issued but capture pending, log for manual review
      await updateOrderProviderStatus(order.id, 'tamara_capture_pending', { status: 'issued' });
      return { success: true, status: 'issued', captureError: err.message };
    }
  } else {
    // 4b. Cancel Tamara — DRCT failed
    try {
      const cancelResp = await tamaraClient.cancelOrder(tamaraOrderId);
      await logOperation({
        orderId: order.id,
        provider: 'tamara',
        operationType: 'cancel',
        requestJson: { tamara_order_id: tamaraOrderId },
        responseJson: cancelResp,
        success: true
      });
      await updateOrderProviderStatus(order.id, 'tamara_cancelled', {
        payment_cancelled_at: new Date().toISOString(),
        status: 'issue_failed'
      });
      console.log('[tamara] Order cancelled after DRCT failure');
    } catch (cancelErr) {
      console.error('[tamara] Cancel also failed:', cancelErr.message);
      await logOperation({
        orderId: order.id,
        provider: 'tamara',
        operationType: 'cancel',
        requestJson: { tamara_order_id: tamaraOrderId },
        responseJson: { error: cancelErr.message },
        success: false
      });
      await updateOrderProviderStatus(order.id, 'tamara_failed', { status: 'issue_failed' });
    }
    return { success: false, status: 'issue_failed', error: 'DRCT issue failed, Tamara order cancelled' };
  }
}

async function updateOrderProviderStatus(orderId, providerStatus, extra = {}) {
  const patch = {
    payment_provider_status: providerStatus,
    updated_at: new Date().toISOString(),
    ...extra
  };
  const { error } = await supabase
    .from('orders')
    .update(patch)
    .eq('id', orderId);
  if (error) console.error('[tamara] updateOrderProviderStatus error:', error.message);
}

module.exports = { processApprovedOrder, updateOrderProviderStatus };
