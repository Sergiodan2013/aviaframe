'use strict';

const express = require('express');
const supabase = require('../lib/supabase');
const { canAccessOrder, forbidden } = require('../lib/authorization');
const { resolveAuthContext } = require('../middleware/auth');
const { sendSupportEmail, sendSupportReceived } = require('../services/emailService');

const router = express.Router();

// POST /api/support/requests
router.post('/requests', async (req, res) => {
  const auth = await resolveAuthContext(req);
  if (auth.error) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: auth.error } });
  }

  const nodeEnv = req.app.get('nodeEnv');
  const supportInbox = req.app.get('supportInbox');

  const {
    order_id: orderId = null,
    subject = 'Support request',
    message = '',
    attachment = null
  } = req.body || {};

  if (!message || String(message).trim().length < 3) {
    return res.status(400).json({
      error: {
        code: 'INVALID_INPUT',
        message: 'message is required'
      }
    });
  }

  let order = null;
  if (orderId) {
    const { data } = await supabase
      .from('orders')
      .select('id,order_number,user_id,agency_id,total_price,currency,status,contact_email')
      .eq('id', orderId)
      .single();
    order = data || null;
    if (order && !(await canAccessOrder(auth, order))) {
      return forbidden(res);
    }
  }

  let parsedAttachment = null;
  if (attachment?.dataBase64) {
    try {
      const fileBuffer = Buffer.from(String(attachment.dataBase64), 'base64');
      const maxBytes = 8 * 1024 * 1024;
      if (fileBuffer.length > maxBytes) {
        return res.status(400).json({
          error: {
            code: 'ATTACHMENT_TOO_LARGE',
            message: 'Attachment size exceeds 8MB'
          }
        });
      }
      parsedAttachment = {
        fileName: attachment.name || 'support-attachment.bin',
        contentType: attachment.type || 'application/octet-stream',
        buffer: fileBuffer
      };
    } catch (err) {
      return res.status(400).json({
        error: {
          code: 'INVALID_ATTACHMENT',
          message: `Attachment decode failed: ${err.message}`
        }
      });
    }
  }

  try {
    const supportSubject = `[Aviaframe Support] ${subject}`;
    const text = [
      `From user: ${auth.profile.email}`,
      `User ID: ${auth.profile.id}`,
      `Role: ${auth.profile.role}`,
      order ? `Order: ${order.order_number} (${order.id})` : 'Order: not specified',
      '',
      'Message:',
      String(message)
    ].join('\n');

    const emailResult = await sendSupportEmail({
      to: supportInbox,
      from: auth.profile.email,
      subject: supportSubject,
      text,
      attachment: parsedAttachment
    });

    // Send confirmation to the user who submitted the request (non-blocking)
    sendSupportReceived({
      userEmail: auth.profile.email,
      subject,
      requestMessage: String(message),
      order: order || null,
    })
      .then((r) => { if (!r.sent) console.warn('[support] confirmation email not sent:', r.error); })
      .catch((e) => console.error('[support] confirmation email error:', e.message));

    return res.status(201).json({
      support_request: {
        sent: !!emailResult.sent,
        support_inbox: supportInbox
      },
      email: emailResult
    });
  } catch (err) {
    console.error('Support request error:', err);
    return res.status(500).json({
      error: {
        code: 'SUPPORT_REQUEST_FAILED',
        message: nodeEnv === 'development' ? err.message : 'Internal server error'
      }
    });
  }
});

module.exports = router;
