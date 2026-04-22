'use strict';

const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const supabase = require('../lib/supabase');
const { config } = require('../config');
const { normalizeEmail, isAgentRole } = require('../utils/helpers');
const { resolveAuthContext, ensureStaff, requireInternalToken } = require('../middleware/auth');

// POST /api/notifications/events (mounted at /api)
router.post('/notifications/events', async (req, res) => {
  const auth = await resolveAuthContext(req);
  if (auth.error) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: auth.error } });
  }
  if (!ensureStaff(auth, res)) return;

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
        message: config.nodeEnv === 'development' ? err.message : 'Internal server error'
      }
    });
  }
});

// POST /api/internal/notifications/dequeue
router.post('/internal/notifications/dequeue', async (req, res) => {
  if (!requireInternalToken(req, res)) return;
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
      error: { code: 'DEQUEUE_FAILED', message: config.nodeEnv === 'development' ? err.message : 'Internal server error' }
    });
  }
});

// POST /api/internal/notifications/outbox
router.post('/internal/notifications/outbox', async (req, res) => {
  if (!requireInternalToken(req, res)) return;
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
      error: { code: 'OUTBOX_INSERT_FAILED', message: config.nodeEnv === 'development' ? err.message : 'Internal server error' }
    });
  }
});

module.exports = router;
