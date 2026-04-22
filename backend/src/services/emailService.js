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

// ─── Helpers ────────────────────────────────────────────────────────────────

function safe(v, fallback = '') {
  if (v === null || v === undefined || v === '') return fallback;
  return String(v);
}

function formatDateTime(v) {
  if (!v) return '';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }) +
    '  ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatTimeOnly(v) {
  if (!v) return '--:--';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v).slice(0, 5);
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatDateShort(v) {
  if (!v) return '';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function flightDuration(dep, arr) {
  if (!dep || !arr) return null;
  const d1 = new Date(dep);
  const d2 = new Date(arr);
  if (Number.isNaN(d1.getTime()) || Number.isNaN(d2.getTime())) return null;
  const mins = Math.round((d2 - d1) / 60000);
  if (mins <= 0) return null;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

// ─── HTML Email Template ─────────────────────────────────────────────────────

function buildTicketHtml({ order, passengers = [], issuance = {} }) {
  const passengerName = passengers.length > 0
    ? `${safe(passengers[0].first_name)} ${safe(passengers[0].last_name)}`.trim().toUpperCase()
    : safe(order.contact_email);

  const depTime = formatTimeOnly(order.departure_time);
  const depDate = formatDateShort(order.departure_time);
  const arrTime = formatTimeOnly(order.arrival_time);
  const arrDate = formatDateShort(order.arrival_time);
  const duration = flightDuration(order.departure_time, order.arrival_time);
  const orig = safe(order.origin, 'N/A');
  const dest = safe(order.destination, 'N/A');
  const airline = safe(order.airline_name || order.airline_code, 'N/A');
  const flightNo = safe(order.flight_number, 'N/A');
  const cabin = safe(order.cabin_class || order.fare_class, 'Economy');
  const orderNum = safe(order.order_number, safe(order.id));
  const pnr = safe(issuance.pnr || order.drct_order_id, null);
  const total = `${Number(order.total_price || 0).toFixed(2)} ${safe(order.currency, 'UAH')}`;

  const passengersHtml = passengers.length > 0
    ? passengers.map(p => {
        const name = `${safe(p.last_name)} ${safe(p.first_name)}`.trim().toUpperCase();
        return `
        <tr>
          <td style="padding:10px 16px; font-size:14px; color:#1E293B; font-weight:600;">${name}</td>
          <td style="padding:10px 16px; font-size:13px; color:#64748B; text-align:right;">${safe(p.passenger_type, 'ADT')}</td>
        </tr>`;
      }).join('')
    : `<tr><td colspan="2" style="padding:10px 16px; font-size:13px; color:#64748B;">${safe(order.contact_email)}</td></tr>`;

  const pnrHtml = pnr ? `
    <tr>
      <td colspan="2" style="padding:6px 16px 12px 16px; font-size:12px; color:#64748B;">
        Carrier reservation number (PNR):&nbsp;
        <strong style="color:#1E293B; letter-spacing:1px;">${pnr}</strong>
      </td>
    </tr>` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Confirmed — ${orderNum}</title>
</head>
<body style="margin:0; padding:0; background:#F1F5F9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F1F5F9; padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#FFFFFF; border-radius:8px; overflow:hidden; box-shadow:0 1px 4px rgba(0,0,0,0.08);">

          <!-- Top accent bar -->
          <tr><td style="background:#0EA5E9; height:5px; font-size:0;">&nbsp;</td></tr>

          <!-- Header -->
          <tr>
            <td style="padding:28px 32px 24px 32px; border-bottom:1px solid #E2E8F0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="font-size:22px; font-weight:800; color:#1E3A5F;">Avia</span><span style="font-size:22px; font-weight:800; color:#0EA5E9;">Frame</span>
                    <div style="font-size:10px; color:#94A3B8; margin-top:2px; letter-spacing:1px;">FLIGHT BOOKING PLATFORM</div>
                  </td>
                  <td align="right">
                    <div style="display:inline-block; border:1.5px solid #E2E8F0; border-radius:6px; padding:8px 16px; text-align:center;">
                      <div style="font-size:10px; color:#94A3B8; letter-spacing:1px; margin-bottom:4px;">BOOKING NUMBER</div>
                      <div style="font-size:18px; font-weight:800; color:#1E3A5F; letter-spacing:3px;">${orderNum}</div>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Headline -->
          <tr>
            <td style="padding:28px 32px 20px 32px;">
              <div style="font-size:11px; color:#64748B; margin-bottom:6px;">${orig} &rarr; ${dest}</div>
              <div style="font-size:24px; font-weight:800; color:#1E293B; line-height:1.2;">
                Your booking is confirmed
              </div>
              <div style="margin-top:16px;">
                <table cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding-right:16px;">
                      <span style="font-size:11px; color:#64748B; display:block; margin-bottom:4px;">BOOKING STATUS</span>
                      <span style="display:inline-block; background:#16A34A; color:#fff; font-size:12px; font-weight:700; border-radius:20px; padding:4px 14px;">
                        &#10003; Confirmed
                      </span>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- Divider -->
          <tr><td style="border-top:1px solid #E2E8F0; font-size:0;">&nbsp;</td></tr>

          <!-- Flight section header -->
          <tr>
            <td style="padding:20px 32px 10px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:13px; font-weight:700; color:#1E293B;">OUTBOUND</td>
                  ${duration ? `<td align="right" style="font-size:12px; color:#64748B;">Total duration: ${duration}</td>` : ''}
                </tr>
              </table>
            </td>
          </tr>

          <!-- Flight card -->
          <tr>
            <td style="padding:0 32px 16px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1.5px solid #E2E8F0; border-radius:8px; overflow:hidden;">
                <tr>
                  <!-- Left border accent -->
                  <td width="4" style="background:#0EA5E9;">&nbsp;</td>
                  <td style="padding:16px 16px 16px 14px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <!-- Times + dots + airports column -->
                        <td style="width:65%;">
                          <table cellpadding="0" cellspacing="0">
                            <!-- Departure row -->
                            <tr>
                              <td style="text-align:right; padding-right:12px; vertical-align:top; width:52px;">
                                <div style="font-size:20px; font-weight:800; color:#1E293B; line-height:1;">${depTime}</div>
                                <div style="font-size:10px; color:#94A3B8; margin-top:3px;">${depDate}</div>
                              </td>
                              <td style="vertical-align:top; padding-right:12px; width:16px; text-align:center;">
                                <div style="width:10px; height:10px; border-radius:50%; background:#0EA5E9; display:inline-block; margin-top:5px;"></div>
                                <div style="width:2px; height:28px; background:#0EA5E9; margin:2px auto 2px auto; opacity:0.6;"></div>
                              </td>
                              <td style="vertical-align:top;">
                                <div style="font-size:15px; font-weight:800; color:#1E293B;">${orig}</div>
                              </td>
                            </tr>
                            <!-- Arrival row -->
                            <tr>
                              <td style="text-align:right; padding-right:12px; vertical-align:top; width:52px;">
                                <div style="font-size:20px; font-weight:800; color:#1E293B; line-height:1;">${arrTime}</div>
                                <div style="font-size:10px; color:#94A3B8; margin-top:3px;">${arrDate}</div>
                              </td>
                              <td style="vertical-align:top; padding-right:12px; width:16px; text-align:center;">
                                <div style="width:10px; height:10px; border-radius:50%; background:#0EA5E9; display:inline-block; margin-top:5px;"></div>
                              </td>
                              <td style="vertical-align:top;">
                                <div style="font-size:15px; font-weight:800; color:#1E293B;">${dest}</div>
                              </td>
                            </tr>
                          </table>
                        </td>
                        <!-- Carrier info column -->
                        <td style="text-align:right; vertical-align:top; padding-top:4px;">
                          <div style="font-size:11px; color:#94A3B8;">Carrier:</div>
                          <div style="font-size:13px; font-weight:700; color:#1E293B; margin-bottom:6px;">${airline}</div>
                          <div style="font-size:11px; color:#94A3B8;">Flight no:</div>
                          <div style="font-size:13px; font-weight:700; color:#1E293B; margin-bottom:6px;">${flightNo} &nbsp;·&nbsp; ${cabin}</div>
                          ${duration ? `<div style="font-size:11px; color:#94A3B8;">Duration:</div><div style="font-size:13px; font-weight:700; color:#1E293B;">${duration}</div>` : ''}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr><td style="border-top:1px solid #E2E8F0; font-size:0;">&nbsp;</td></tr>

          <!-- Passengers -->
          <tr>
            <td style="padding:20px 32px 0 32px;">
              <div style="font-size:13px; font-weight:700; color:#1E293B; margin-bottom:10px;">Passengers</div>
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1.5px solid #E2E8F0; border-radius:8px; overflow:hidden;">
                ${passengersHtml}
                ${pnrHtml}
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr><td style="padding:20px 0 0 0; border-top:0; font-size:0;">&nbsp;</td></tr>
          <tr><td style="border-top:1px solid #E2E8F0; font-size:0;">&nbsp;</td></tr>

          <!-- Total + Contact dark bar -->
          <tr>
            <td style="background:#1E3A5F; padding:20px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="font-size:10px; color:#93C5FD; margin-bottom:4px; letter-spacing:1px;">TOTAL FARE</div>
                    <div style="font-size:22px; font-weight:800; color:#FFFFFF;">${total}</div>
                  </td>
                  <td align="right">
                    <span style="display:inline-block; background:#0EA5E9; color:#fff; font-size:11px; font-weight:700; border-radius:6px; padding:6px 18px;">CONFIRMED</span>
                  </td>
                </tr>
                <tr>
                  <td colspan="2" style="padding-top:14px; border-top:1px solid rgba(255,255,255,0.15); margin-top:12px;">
                    <div style="font-size:10px; color:#93C5FD; margin-bottom:4px; letter-spacing:1px;">CONTACT</div>
                    <div style="font-size:13px; font-weight:600; color:#FFFFFF;">
                      ${safe(order.contact_email)}${order.contact_phone ? `&nbsp;&nbsp;·&nbsp;&nbsp;${safe(order.contact_phone)}` : ''}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer note -->
          <tr>
            <td style="padding:16px 32px 24px 32px; text-align:center;">
              <p style="font-size:11px; color:#94A3B8; margin:0; line-height:1.6;">
                Your e-ticket is attached to this email as a PDF.<br>
                Please present it along with a valid photo ID at check-in.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Resend API ──────────────────────────────────────────────────────────────

async function sendViaResend({ from, to, subject, html, text, attachments = [] }) {
  const payload = {
    from,
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
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

// ─── Public API ──────────────────────────────────────────────────────────────

async function sendTicketEmail({ to, order, attachment, passengers = [], issuance = {} }) {
  const from = process.env.EMAIL_FROM || process.env.SMTP_FROM || 'noreply@aviaframe.com';
  const orderNum = safe(order.order_number || order.id);
  const subject = `Booking ${orderNum} confirmed — your e-ticket`;

  const html = buildTicketHtml({ order, passengers, issuance });

  const textLines = [
    `Your booking is confirmed.`,
    ``,
    `Booking number: ${orderNum}`,
    `Route: ${safe(order.origin)} → ${safe(order.destination)}`,
    `Departure: ${order.departure_time || 'N/A'}`,
    `Airline: ${safe(order.airline_name || order.airline_code)}`,
    `Flight: ${safe(order.flight_number)}`,
    ``,
    `Passengers: ${passengers.map(p => `${p.last_name} ${p.first_name}`).join(', ') || safe(order.contact_email)}`,
    ``,
    `Total: ${Number(order.total_price || 0).toFixed(2)} ${safe(order.currency, 'UAH')}`,
    ``,
    `Your e-ticket PDF is attached. Please present it with a valid ID at check-in.`,
    ``,
    `AviaFrame`
  ].join('\n');

  const attachments = [{ filename: attachment.fileName, content: attachment.buffer }];

  if (isResendConfigured()) {
    await sendViaResend({ from, to, subject, html, text: textLines, attachments });
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
      from, to, subject, html, text: textLines,
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
    await sendViaResend({ from: sender, to, subject, html: null, text, attachments });
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
      attachments: attachments.map(a => ({ ...a, contentType: a.contentType || 'application/octet-stream' }))
    });
    return { sent: true, error: null };
  }

  return { sent: false, error: 'EMAIL_NOT_CONFIGURED' };
}

module.exports = { isConfigured, sendTicketEmail, sendSupportEmail };
