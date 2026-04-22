'use strict';

const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { config } = require('../config');
const { normalizeEmail, mapProviderEventToOutboxStatus } = require('../utils/helpers');

// POST /api/webhooks/email-provider (mounted at /api)
router.post('/webhooks/email-provider', async (req, res) => {
  const token = String(req.headers['x-email-webhook-secret'] || '').trim();
  if (!config.emailWebhookSecret || token !== config.emailWebhookSecret) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid webhook secret' } });
  }

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
      error: { code: 'WEBHOOK_PROCESSING_FAILED', message: config.nodeEnv === 'development' ? err.message : 'Internal server error' }
    });
  }
});

module.exports = router;
