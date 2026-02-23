const nodemailer = require('nodemailer');

function isConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

async function sendTicketEmail({ to, order, attachment }) {
  if (!isConfigured()) {
    return {
      sent: false,
      error: 'EMAIL_NOT_CONFIGURED'
    };
  }

  const transporter = createTransport();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const subject = `Your e-ticket for order ${order.order_number || order.id}`;
  const text = [
    'Hello,',
    '',
    'Your ticket has been issued successfully.',
    `Order: ${order.order_number || order.id}`,
    `Route: ${order.origin || 'N/A'} -> ${order.destination || 'N/A'}`,
    `Departure: ${order.departure_time || 'N/A'}`,
    '',
    'Please find your e-ticket attached.',
    '',
    'Aviaframe Portal'
  ].join('\n');

  await transporter.sendMail({
    from,
    to,
    subject,
    text,
    attachments: [
      {
        filename: attachment.fileName,
        content: attachment.buffer,
        contentType: 'application/pdf'
      }
    ]
  });

  return { sent: true, error: null };
}

async function sendSupportEmail({ to, from, subject, text, attachment = null }) {
  if (!isConfigured()) {
    return {
      sent: false,
      error: 'EMAIL_NOT_CONFIGURED'
    };
  }

  const transporter = createTransport();
  const sender = process.env.SMTP_FROM || process.env.SMTP_USER;
  const attachments = [];
  if (attachment?.buffer) {
    attachments.push({
      filename: attachment.fileName || 'attachment.bin',
      content: attachment.buffer,
      contentType: attachment.contentType || 'application/octet-stream'
    });
  }

  await transporter.sendMail({
    from: sender,
    to,
    replyTo: from || undefined,
    subject,
    text,
    attachments
  });

  return { sent: true, error: null };
}

module.exports = {
  isConfigured,
  sendTicketEmail,
  sendSupportEmail
};
