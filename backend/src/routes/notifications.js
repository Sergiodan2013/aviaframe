'use strict';

const express = require('express');
const crypto = require('crypto');
const supabase = require('../lib/supabase');
const { isAgentRole, normalizeEmail, mapProviderEventToOutboxStatus } = require('../lib/utils');
const { resolveAuthContext, requireInternalToken } = require('../middleware/auth');
const { ensureStaff } = require('../middleware/requireRole');

const router = express.Router();

// POST /api/notifications/events  →  mounted at /api/notifications
router.post('/events', async (req, res) => {
  const auth = await resolveAuthContext(req);
  if (auth.error) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: auth.error } });
  }
  if (!ensureStaff(auth, res)) return;

  const nodeEnv = req.app.get('nodeEnv');
  const {
    event_type: eventType,
    entity_type: entityType = null,
    entity_id: entityId = null,
    agency_id: agencyIdFromBody = null,
    recipient_email: recipientEmailRaw = null,
    recipient_role: recipientRole = null,
    template_key: templateKey = null,
    payload = {},
    idempotency_key: idempotencyKeyRaw = null,
    occurred_at: occurredAtRaw = null
  } = req.body || {};

  const normalizedEventType = String(eventType || '').trim();
  if (!normalizedEventType) {
    return res.status(400).json({
      error: { code: 'INVALID_EVENT_TYPE', message: 'event_type is required' }
    });
  }
  if (payload !== null && typeof payload !== 'object') {
    return res.status(400).json({
      error: { code: 'INVALID_PAYLOAD', message: 'payload must be a JSON object' }
    });
  }

  const normalizedRecipientEmail = normalizeEmail(recipientEmailRaw);
  const idempotencyKey = String(idempotencyKeyRaw || '').trim()
    || crypto.createHash('sha256').update(`${normalizedEventType}:${Date.now()}:${Math.random()}`).digest('hex');

  let agencyId = agencyIdFromBody || auth.profile.agency_id || null;
  if (isAgentRole(auth.profile.role)) {
    agencyId = auth.profile.agency_id || null;
  }

  const occurredAt = occurredAtRaw ? new Date(occurredAtRaw) : new Date();
  if (Number.isNaN(occurredAt.getTime())) {
    return res.status(400).json({
      error: { code: 'INVALID_OCCURRED_AT', message: 'occurred_at must be valid datetime' }
    });
  }

  try {
    const { data, error } = await supabase
      .from('notification_events')
      .insert({
        event_type: normalizedEventType,
        entity_type: entityType,
        entity_id: entityId,
        agency_id: agencyId,
        recipient_email: normalizedRecipientEmail || null,
        recipient_role: recipientRole || null,
        template_key: templateKey || null,
        payload: payload || {},
        idempotency_key: idempotencyKey,
        status: 'pending',
        occurred_at: occurredAt.toISOString(),
        created_by: auth.profile.id
      })
      .select('*')
      .single();

    if (error) {
      const msg = String(error.message || '');
      if (msg.toLowerCase().includes('duplicate') || msg.toLowerCase().includes('unique')) {
        return res.status(409).json({
          error: { code: 'DUPLICATE_EVENT', message: 'Duplicate idempotency_key for event_type' }
        });
      }
      return res.status(500).json({
        error: { code: 'EVENT_INSERT_FAILED', message: error.message || 'Failed to create notification event' }
      });
    }
    return res.status(201).json({ event: data });
  } catch (err) {
    console.error('Notification event insert error:', err);
    return res.status(500).json({
      error: {
        code: 'EVENT_INSERT_FAILED',
        message: nodeEnv === 'development' ? err.message : 'Internal server error'
      }
    });
  }
});

// POST /api/internal/notifications/dequeue  →  also exported as dequeueRouter
router.post('/dequeue', async (req, res) => {
  const internalApiToken = process.env.INTERNAL_API_TOKEN || '';
  if (!requireInternalToken(req, res, internalApiToken)) return;

  const nodeEnv = req.app.get('nodeEnv');
  const limit = Math.min(Math.max(Number(req.body?.limit || 20), 1), 200);
  try {
    const { data, error } = await supabase
      .from('notification_events')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(limit);
    if (error) {
      return res.status(500).json({
        error: { code: 'DEQUEUE_FAILED', message: error.message || 'Failed to fetch events' }
      });
    }
    const ids = (data || []).map((row) => row.id).filter(Boolean);
    if (ids.length) {
      await supabase
        .from('notification_events')
        .update({ status: 'processing' })
        .in('id', ids);
    }
    return res.json({ events: data || [] });
  } catch (err) {
    console.error('Notification dequeue error:', err);
    return res.status(500).json({
      error: { code: 'DEQUEUE_FAILED', message: nodeEnv === 'development' ? err.message : 'Internal server error' }
    });
  }
});

// POST /api/internal/notifications/outbox  →  also exported as outboxRouter
router.post('/outbox', async (req, res) => {
  const internalApiToken = process.env.INTERNAL_API_TOKEN || '';
  if (!requireInternalToken(req, res, internalApiToken)) return;

  const nodeEnv = req.app.get('nodeEnv');
  const {
    event_id: eventId = null,
    to_email: toEmailRaw = null,
    template_key: templateKey = null,
    subject = null,
    provider = null,
    provider_message_id: providerMessageId = null,
    status = 'queued',
    payload = {},
    last_error: lastError = null
  } = req.body || {};

  const toEmail = normalizeEmail(toEmailRaw);
  if (!toEmail) {
    return res.status(400).json({
      error: { code: 'INVALID_RECIPIENT', message: 'to_email is required' }
    });
  }

  try {
    const patch = {
      event_id: eventId,
      to_email: toEmail,
      template_key: templateKey,
      subject,
      provider,
      provider_message_id: providerMessageId,
      status,
      payload: payload || {},
      last_error: lastError,
      attempt_count: 1
    };
    if (status === 'sent') patch.sent_at = new Date().toISOString();
    if (status === 'failed') patch.failed_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('email_outbox')
      .insert(patch)
      .select('*')
      .single();

    if (error) {
      return res.status(500).json({
        error: { code: 'OUTBOX_INSERT_FAILED', message: error.message || 'Failed to create outbox row' }
      });
    }

    if (eventId) {
      const nextStatus = status === 'failed' ? 'failed' : 'processed';
      await supabase
        .from('notification_events')
        .update({ status: nextStatus, processed_at: new Date().toISOString(), error: lastError || null })
        .eq('id', eventId);
    }

    return res.status(201).json({ outbox: data });
  } catch (err) {
    console.error('Outbox insert error:', err);
    return res.status(500).json({
      error: { code: 'OUTBOX_INSERT_FAILED', message: nodeEnv === 'development' ? err.message : 'Internal server error' }
    });
  }
});

// POST /api/webhooks/email-provider  →  mounted at /api/webhooks
router.post('/email-provider', async (req, res) => {
  const emailWebhookSecret = process.env.EMAIL_WEBHOOK_SECRET || '';
  const token = String(req.headers['x-email-webhook-secret'] || '').trim();
  if (!emailWebhookSecret || token !== emailWebhookSecret) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid webhook secret' } });
  }

  const nodeEnv = req.app.get('nodeEnv');
  const incoming = Array.isArray(req.body) ? req.body : [req.body];
  const nowIso = new Date().toISOString();
  let processed = 0;

  try {
    for (const item of incoming) {
      if (!item || typeof item !== 'object') continue;

      const provider = String(item.provider || item.source || 'unknown').trim().toLowerCase();
      const providerEvent = String(item.type || item.event || item.event_type || 'unknown').trim().toLowerCase();
      const providerMessageId = String(item.message_id || item.email_id || item.id || '').trim() || null;
      const recipient = normalizeEmail(item.email || item.to || item.recipient);
      const mappedStatus = mapProviderEventToOutboxStatus(providerEvent);

      let outboxRow = null;
      if (providerMessageId) {
        const { data } = await supabase
          .from('email_outbox')
          .select('*')
          .eq('provider_message_id', providerMessageId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        outboxRow = data || null;
      }
      if (!outboxRow && recipient) {
        const { data } = await supabase
          .from('email_outbox')
          .select('*')
          .eq('to_email', recipient)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        outboxRow = data || null;
      }

      if (outboxRow?.id) {
        await supabase
          .from('email_events')
          .insert({
            outbox_id: outboxRow.id,
            provider,
            provider_event: providerEvent || 'unknown',
            provider_message_id: providerMessageId,
            raw_payload: item
          });

        const patch = {
          updated_at: nowIso
        };
        if (mappedStatus) patch.status = mappedStatus;
        if (mappedStatus === 'delivered') patch.delivered_at = nowIso;
        if (mappedStatus === 'failed' || mappedStatus === 'bounced' || mappedStatus === 'complained') {
          patch.failed_at = nowIso;
          patch.last_error = JSON.stringify(item);
        }
        await supabase
          .from('email_outbox')
          .update(patch)
          .eq('id', outboxRow.id);
      }
      processed += 1;
    }
    return res.json({ ok: true, processed });
  } catch (err) {
    console.error('Email webhook processing error:', err);
    return res.status(500).json({
      error: { code: 'WEBHOOK_PROCESSING_FAILED', message: nodeEnv === 'development' ? err.message : 'Internal server error' }
    });
  }
});

module.exports = router;
