const nodemailer = require('nodemailer');
const https = require('https');

function isSmtpConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function isResendConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

function isConfigured() {
  return isSmtpConfigured() || isResendConfigured();
}

// Send via Resend API using built-in https (no extra dependency)
async function sendViaResend({ from, to, subject, text, attachments = [] }) {
  const payload = {
    from,
    to: Array.isArray(to) ? to : [to],
    subject,
    text,
    attachments: attachments.map(a => ({
      filename: a.filename,
      content: Buffer.isBuffer(a.content) ? a.content.toString('base64') : a.content
    }))
  };

  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const req = https.request({
      hostname: 'api.resend.com',
      path: '/emails',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`Resend API error ${res.statusCode}: ${data}`));
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function sendTicketEmail({ to, order, attachment }) {
  const from = process.env.EMAIL_FROM || process.env.SMTP_FROM || 'noreply@aviaframe.com';
  const subject = `Your e-ticket for order ${order.order_number || order.id}`;
  const text = [
    'Hello,',
    '',
    'Your ticket has been issued successfully.',
    `Order: ${order.order_number || order.id}`,
    `Route: ${order.origin || 'N/A'} → ${order.destination || 'N/A'}`,
    `Departure: ${order.departure_time || 'N/A'}`,
    '',
    'Please find your e-ticket attached.',
    '',
    'AviaFrame'
  ].join('\n');

  if (isResendConfigured()) {
    await sendViaResend({
      from,
      to,
      subject,
      text,
      attachments: [{ filename: attachment.fileName, content: attachment.buffer }]
    });
    return { sent: true, error: null };
  }

  if (isSmtpConfigured()) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });
    await transporter.sendMail({
      from, to, subject, text,
      attachments: [{ filename: attachment.fileName, content: attachment.buffer, contentType: 'application/pdf' }]
    });
    return { sent: true, error: null };
  }

  return { sent: false, error: 'EMAIL_NOT_CONFIGURED' };
}

async function sendSupportEmail({ to, from, subject, text, attachment = null }) {
  const sender = process.env.EMAIL_FROM || process.env.SMTP_FROM || 'noreply@aviaframe.com';
  const attachments = [];
  if (attachment?.buffer) {
    attachments.push({ filename: attachment.fileName || 'attachment.bin', content: attachment.buffer });
  }

  if (isResendConfigured()) {
    await sendViaResend({ from: sender, to, subject, text, attachments });
    return { sent: true, error: null };
  }

  if (isSmtpConfigured()) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });
    await transporter.sendMail({
      from: sender, to, replyTo: from || undefined, subject, text,
      attachments: attachments.map(a => ({ ...a, contentType: attachment?.contentType || 'application/octet-stream' }))
    });
    return { sent: true, error: null };
  }

  return { sent: false, error: 'EMAIL_NOT_CONFIGURED' };
}

module.exports = { isConfigured, sendTicketEmail, sendSupportEmail };
