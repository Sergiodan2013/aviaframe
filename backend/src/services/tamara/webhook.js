'use strict';

const jwt = require('jsonwebtoken');
const supabase = require('../../lib/supabase');

const NOTIFICATION_TOKEN = process.env.TAMARA_NOTIFICATION_TOKEN || '';

/**
 * Validate Tamara webhook token (HS256 JWT in tamaraToken query param).
 */
function validateWebhookToken(tamaraToken) {
  if (!NOTIFICATION_TOKEN) return { valid: false, error: 'NOTIFICATION_TOKEN not configured' };
  if (!tamaraToken) return { valid: false, error: 'Missing tamaraToken' };
  try {
    const decoded = jwt.verify(tamaraToken, NOTIFICATION_TOKEN, { algorithms: ['HS256'] });
    return { valid: true, decoded };
  } catch (err) {
    return { valid: false, error: err.message };
  }
}

/**
 * Persist webhook event for idempotency + audit.
 * Returns { inserted, existing }
 */
async function persistWebhookEvent({ provider, providerOrderId, eventType, eventStatus, payload }) {
  // Check if already processed (idempotency)
  const { data: existing } = await supabase
    .from('payment_provider_events')
    .select('id,processed_at')
    .eq('provider', provider)
    .eq('provider_order_id', providerOrderId)
    .eq('event_type', eventType)
    .eq('event_status', eventStatus)
    .maybeSingle();

  if (existing) return { inserted: false, existing: true, id: existing.id };

  const { data: inserted, error } = await supabase
    .from('payment_provider_events')
    .insert({
      provider,
      provider_order_id: providerOrderId,
      event_type: eventType,
      event_status: eventStatus,
      payload_json: payload,
      processed_at: null
    })
    .select('id')
    .single();

  if (error) throw new Error(`Failed to persist webhook event: ${error.message}`);
  return { inserted: true, existing: false, id: inserted.id };
}

/**
 * Mark webhook event as processed.
 */
async function markEventProcessed(eventId) {
  await supabase
    .from('payment_provider_events')
    .update({ processed_at: new Date().toISOString() })
    .eq('id', eventId);
}

/**
 * Log a provider API operation.
 */
async function logOperation({ orderId, provider, operationType, requestJson, responseJson, providerReference, success }) {
  await supabase
    .from('payment_provider_operations')
    .insert({
      order_id: orderId || null,
      provider,
      operation_type: operationType,
      request_json: requestJson || null,
      response_json: responseJson || null,
      provider_reference: providerReference || null,
      success: !!success
    });
}

module.exports = { validateWebhookToken, persistWebhookEvent, markEventProcessed, logOperation };
