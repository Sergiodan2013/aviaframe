'use strict';

const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { config } = require('../config');
const { resolveAuthContext, forbidden, canAccessOrder } = require('../middleware/auth');
const { sendSupportEmail } = require('../services/emailService');

// POST /requests (mounted at /api/support)
router.post('/requests', async (req, res) => {
  const auth = await resolveAuthContext(req);
  if (auth.error) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: auth.error } });
  }

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
      to: config.supportInbox,
      from: auth.profile.email,
      subject: supportSubject,
      text,
      attachment: parsedAttachment
    });

    return res.status(201).json({
      support_request: {
        sent: !!emailResult.sent,
        support_inbox: config.supportInbox
      },
      email: emailResult
    });
  } catch (err) {
    console.error('Support request error:', err);
    return res.status(500).json({
      error: {
        code: 'SUPPORT_REQUEST_FAILED',
        message: config.nodeEnv === 'development' ? err.message : 'Internal server error'
      }
    });
  }
});

module.exports = router;
