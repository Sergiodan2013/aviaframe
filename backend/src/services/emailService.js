const { Resend } = require('resend');
const Handlebars = require('handlebars');
const { createClient } = require('@supabase/supabase-js');

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM || 'no-reply@aviaframe.com';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ─── UTILS ────────────────────────────────────────────────────────────────────

function fmt(v, fallback = 'N/A') {
  return v != null && v !== '' ? String(v) : fallback;
}

function fmtMoney(amount, currency) {
  if (!amount) return 'N/A';
  return `${Number(amount).toLocaleString('en-US')} ${fmt(currency, 'USD')}`;
}

function fmtDateTime(v) {
  if (!v) return 'N/A';
  const d = new Date(v);
  if (isNaN(d.getTime())) return String(v);
  return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
}

// ─── TEMPLATE LOADING ─────────────────────────────────────────────────────────

/**
 * Load email template: agency override → global DB → null (hardcoded fallback)
 */
async function loadTemplate(eventType, agencyId = null) {
  try {
    // 1. Agency override
    if (agencyId) {
      const { data } = await supabase
        .from('agency_email_templates')
        .select('subject, blocks')
        .eq('agency_id', agencyId)
        .eq('event_type', eventType)
        .eq('is_active', true)
        .maybeSingle();
      if (data?.blocks && Object.keys(data.blocks).length > 0) {
        return { subject: data.subject, blocks: data.blocks, source: 'agency' };
      }
    }
    // 2. Global template
    const { data } = await supabase
      .from('email_templates')
      .select('subject, blocks')
      .eq('event_type', eventType)
      .eq('is_active', true)
      .maybeSingle();
    if (data?.blocks && Object.keys(data.blocks).length > 0) {
      return { subject: data.subject, blocks: data.blocks, source: 'global' };
    }
  } catch (err) {
    console.warn('[emailService] loadTemplate error, using hardcoded fallback:', err.message);
  }
  return null; // hardcoded fallback
}

/**
 * Render a Handlebars template string with vars. Returns '' on error.
 */
function renderBlock(template, vars) {
  if (!template) return '';
  try {
    return Handlebars.compile(String(template))(vars || {});
  } catch {
    return String(template);
  }
}

// ─── HTML LAYOUT ──────────────────────────────────────────────────────────────

function baseLayout({ agencyName, title, body }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;color:#1a1a2e;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:32px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);">

      <!-- Header -->
      <tr>
        <td style="background:#1a1a2e;padding:28px 40px;">
          <p style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:.5px;">${agencyName}</p>
          <p style="margin:4px 0 0;color:#a0aec0;font-size:13px;">Powered by Aviaframe</p>
        </td>
      </tr>

      <!-- Body -->
      <tr><td style="padding:36px 40px;">${body}</td></tr>

      <!-- Footer -->
      <tr>
        <td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;">
          <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">
            This email was sent by ${agencyName} via Aviaframe.<br/>
            Please do not reply directly to this email.
          </p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

function flightBlock(fl, label) {
  if (!fl) return '';
  const dep = fl.departure ? String(fl.departure).slice(0, 16).replace('T', ' ') : 'N/A';
  const arr = fl.arrival ? String(fl.arrival).slice(0, 16).replace('T', ' ') : 'N/A';
  const originCity = (fl.origin_name || '').replace(' International Airport', '').replace(' Airport', '') || fl.origin_code || '---';
  const destCity = (fl.destination_name || '').replace(' International Airport', '').replace(' Airport', '') || fl.destination_code || '---';
  return `
    <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#2563eb;text-transform:uppercase;letter-spacing:.5px;">${label}</p>
    <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:8px;">
      <tr>
        <td style="width:42%;vertical-align:top;padding:12px 14px;background:#f1f5f9;border-radius:8px 0 0 8px;">
          <p style="margin:0 0 2px;font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;">From</p>
          <p style="margin:0;font-size:22px;font-weight:800;color:#1a1a2e;line-height:1;">${fmt(fl.origin_code, '---')}</p>
          <p style="margin:3px 0 0;font-size:11px;color:#64748b;">${originCity}</p>
          <p style="margin:4px 0 0;font-size:12px;color:#374151;font-weight:600;">${dep}</p>
        </td>
        <td style="width:16%;text-align:center;vertical-align:middle;background:#dbeafe;padding:8px 4px;">
          <p style="margin:0;font-size:20px;color:#2563eb;">✈</p>
          <p style="margin:2px 0 0;font-size:9px;color:#3b82f6;">${fl.stops === 0 ? 'non-stop' : `${fl.stops} stop`}</p>
        </td>
        <td style="width:42%;vertical-align:top;padding:12px 14px;background:#f1f5f9;border-radius:0 8px 8px 0;">
          <p style="margin:0 0 2px;font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;">To</p>
          <p style="margin:0;font-size:22px;font-weight:800;color:#1a1a2e;line-height:1;">${fmt(fl.destination_code, '---')}</p>
          <p style="margin:3px 0 0;font-size:11px;color:#64748b;">${destCity}</p>
          <p style="margin:4px 0 0;font-size:12px;color:#374151;font-weight:600;">${arr}</p>
        </td>
      </tr>
    </table>
    <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:20px;border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;">
      <tr style="background:#f8fafc;"><td style="padding:7px 14px;font-size:12px;color:#64748b;width:110px;">Airline</td><td style="padding:7px 14px;font-size:12px;font-weight:600;color:#1a1a2e;">${fmt(fl.airline_name)} ${fl.airline_code ? `(${fl.airline_code})` : ''}</td></tr>
      <tr><td style="padding:7px 14px;font-size:12px;color:#64748b;">Flight No.</td><td style="padding:7px 14px;font-size:12px;font-weight:600;color:#1a1a2e;">${fmt(fl.flight_number)}</td></tr>
    </table>`;
}

// ─── BOOKING CONFIRMATION ─────────────────────────────────────────────────────

function bookingConfirmationHtml({ order, passengers = [], agency, claimToken, outbound, returnFlight, blocks = null }) {
  const agencyName = fmt(agency?.name, 'Travel Agency');
  const bankDetails = agency?.settings?.bank_details || {};
  const firstName = fmt(passengers[0]?.first_name) !== 'N/A' ? fmt(passengers[0]?.first_name) : '';
  const lastName = fmt(passengers[0]?.last_name) !== 'N/A' ? fmt(passengers[0]?.last_name) : '';
  const passengerName = [firstName, lastName].filter(Boolean).join(' ') || 'Traveller';

  const vars = {
    passenger_name: passengerName,
    order_number: fmt(order.order_number),
    agency_name: agencyName,
    flight_from: outbound?.origin_code || order.origin || '',
    flight_to: outbound?.destination_code || order.destination || '',
    departure: outbound?.departure || order.departure_time || '',
    total_price: fmtMoney(order.total_price, order.currency),
  };

  // Blocks: from DB or hardcoded defaults
  const greeting   = renderBlock(blocks?.greeting   || 'Hello, {{passenger_name}}!', vars);
  const intro      = renderBlock(blocks?.intro      || 'Thank you for booking with {{agency_name}}. Your itinerary is attached as a PDF. Please complete payment to receive your ticket.', vars);
  const payNote    = renderBlock(blocks?.payment_note || 'Please use your order number as the payment reference. Your ticket will be issued once payment is received.', vars);
  const closing    = renderBlock(blocks?.closing    || 'If you have any questions, please contact {{agency_name}} directly.', vars);

  const paxTypeLabel = (t) => ({ ADT: 'Adult', CHD: 'Child', INF: 'Infant' }[String(t || 'ADT').toUpperCase()] || 'Adult');
  const passengerRows = passengers.length > 0
    ? passengers.map((p, i) => `
        <tr style="${i % 2 === 0 ? 'background:#f8fafc;' : ''}">
          <td style="padding:8px 12px;">${fmt(p.first_name)} ${fmt(p.last_name)}</td>
          <td style="padding:8px 12px;color:#64748b;">${paxTypeLabel(p.passenger_type)}</td>
          <td style="padding:8px 12px;color:#64748b;font-family:monospace;">${p.passport_number || p.document_number || '—'}</td>
        </tr>`).join('')
    : `<tr><td colspan="3" style="padding:12px;color:#94a3b8;">—</td></tr>`;

  const paymentMethod = fmt(order.payment_method, 'bank_transfer');

  let paymentSection;
  if (paymentMethod === 'cash') {
    paymentSection = `<div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:20px 24px;margin:24px 0;">
        <p style="margin:0 0 12px;font-size:15px;font-weight:700;color:#92400e;">💵 Payment Method: Cash at Office</p>
        <p style="margin:0 0 8px;font-size:13px;color:#78350f;">Please visit the <strong>${agencyName}</strong> office to pay in cash before your departure.</p>
        <table cellpadding="0" cellspacing="0" style="width:100%;">
          <tr><td style="padding:8px 0 4px;font-size:13px;color:#78350f;font-weight:600;width:120px;">Amount due:</td><td style="font-size:15px;font-weight:700;color:#1a1a2e;">${fmtMoney(order.total_price, order.currency)}</td></tr>
          <tr><td style="padding:4px 0;font-size:13px;color:#78350f;font-weight:600;">Order ref:</td><td style="font-size:13px;color:#1a1a2e;font-family:monospace;">${fmt(order.order_number)}</td></tr>
        </table>
        <p style="margin:12px 0 0;font-size:12px;color:#92400e;">Please bring this email and your passport. Your ticket will be issued after payment.</p>
      </div>`;
  } else if ((bankDetails.bank_name || bankDetails.iban) && paymentMethod !== 'online') {
    paymentSection = `<div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:20px 24px;margin:24px 0;">
        <p style="margin:0 0 12px;font-size:15px;font-weight:700;color:#92400e;">⚠️ Payment Instructions — Bank Transfer</p>
        <p style="margin:0 0 8px;font-size:13px;color:#78350f;">To confirm your booking, please transfer the amount below to:</p>
        <table cellpadding="0" cellspacing="0" style="width:100%;">
          ${bankDetails.bank_name ? `<tr><td style="padding:4px 0;font-size:13px;color:#78350f;width:120px;font-weight:600;">Bank:</td><td style="font-size:13px;color:#1a1a2e;">${bankDetails.bank_name}</td></tr>` : ''}
          ${bankDetails.iban ? `<tr><td style="padding:4px 0;font-size:13px;color:#78350f;font-weight:600;">IBAN:</td><td style="font-size:13px;color:#1a1a2e;font-family:monospace;">${bankDetails.iban}</td></tr>` : ''}
          ${(bankDetails.swift_bic || bankDetails.swift) ? `<tr><td style="padding:4px 0;font-size:13px;color:#78350f;font-weight:600;">SWIFT/BIC:</td><td style="font-size:13px;color:#1a1a2e;">${bankDetails.swift_bic || bankDetails.swift}</td></tr>` : ''}
          <tr><td style="padding:8px 0 4px;font-size:13px;color:#78350f;font-weight:600;">Amount:</td><td style="font-size:15px;font-weight:700;color:#1a1a2e;">${fmtMoney(order.total_price, order.currency)}</td></tr>
          <tr><td style="padding:4px 0;font-size:13px;color:#78350f;font-weight:600;">Reference:</td><td style="font-size:13px;color:#1a1a2e;font-family:monospace;">${fmt(order.order_number)}</td></tr>
        </table>
        <p style="margin:12px 0 0;font-size:12px;color:#92400e;">${payNote}</p>
      </div>`;
  } else {
    paymentSection = `<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px 24px;margin:24px 0;">
        <p style="margin:0;font-size:14px;color:#1e40af;">Our agent will contact you shortly with payment instructions.</p>
      </div>`;
  }

  const ob = outbound || {
    origin_code: order.origin, origin_name: '', destination_code: order.destination, destination_name: '',
    departure: order.departure_time, arrival: order.arrival_time,
    airline_name: order.airline_name, airline_code: order.airline_code, flight_number: order.flight_number, stops: 0,
  };

  const body = `
    <p style="margin:0 0 4px;font-size:14px;color:#64748b;">Booking Confirmation</p>
    <h1 style="margin:0 0 24px;font-size:24px;font-weight:700;color:#1a1a2e;">Your booking is confirmed ✈️</h1>

    <p style="font-size:15px;color:#374151;">${greeting}</p>
    <p style="font-size:15px;color:#374151;margin-bottom:24px;">${intro}</p>

    <div style="background:#f1f5f9;border-radius:8px;padding:14px 18px;margin-bottom:24px;">
      <span style="font-size:13px;color:#64748b;">Order: </span>
      <span style="font-size:16px;font-weight:700;color:#1a1a2e;margin-left:6px;font-family:monospace;">${fmt(order.order_number)}</span>
    </div>

    <p style="margin:0 0 14px;font-size:16px;font-weight:700;color:#1a1a2e;border-bottom:2px solid #dbeafe;padding-bottom:8px;">✈ Flight Details</p>
    ${flightBlock(ob, returnFlight ? 'Outbound Flight' : 'Flight')}
    ${returnFlight ? flightBlock(returnFlight, 'Return Flight') : ''}

    <p style="margin:0 0 12px;font-size:16px;font-weight:700;color:#1a1a2e;border-bottom:2px solid #dbeafe;padding-bottom:8px;">👤 Passengers</p>
    <table cellpadding="0" cellspacing="0" style="width:100%;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:24px;">
      <tr style="background:#1a1a2e;">
        <th style="padding:10px 12px;text-align:left;font-size:12px;color:#ffffff;font-weight:600;">Name</th>
        <th style="padding:10px 12px;text-align:left;font-size:12px;color:#ffffff;font-weight:600;">Type</th>
        <th style="padding:10px 12px;text-align:left;font-size:12px;color:#ffffff;font-weight:600;">Passport</th>
      </tr>
      ${passengerRows}
    </table>

    ${paymentSection}

    ${claimToken ? `
    <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:20px 24px;margin:24px 0;text-align:center;">
      <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#166534;">Track your booking online</p>
      <p style="margin:0 0 16px;font-size:13px;color:#15803d;">Create a free account to track your booking status, receive updates, and message the agency.</p>
      <a href="${process.env.APP_URL || 'https://admin.aviaframe.com'}/claim?token=${claimToken}"
         style="display:inline-block;background:#2563eb;color:#ffffff;font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;text-decoration:none;">
        Create account &amp; track booking →
      </a>
      <p style="margin:12px 0 0;font-size:11px;color:#93c5fd;">Link expires in 7 days</p>
    </div>` : ''}

    <p style="margin:24px 0 0;font-size:14px;color:#64748b;">${closing}</p>
  `;

  return baseLayout({ agencyName, title: `Booking Confirmation — ${fmt(order.order_number)}`, body });
}

// ─── BOOKING CANCELLED ────────────────────────────────────────────────────────

function bookingCancelledHtml({ order, agency, blocks = null }) {
  const agencyName = fmt(agency?.name, 'Travel Agency');
  const vars = {
    passenger_name: fmt(order.contact_name || ''),
    order_number: fmt(order.order_number),
    agency_name: agencyName,
    flight_from: fmt(order.origin),
    flight_to: fmt(order.destination),
  };

  const greeting = renderBlock(blocks?.greeting || 'We\'re sorry to inform you that your booking has been cancelled.', vars);
  const message  = renderBlock(blocks?.message  || 'If you have any questions or would like to make a new booking, please contact {{agency_name}} directly.', vars);
  const closing  = renderBlock(blocks?.closing  || 'We apologise for any inconvenience caused.', vars);

  const body = `
    <p style="margin:0 0 4px;font-size:14px;color:#64748b;">Booking Update</p>
    <h1 style="margin:0 0 24px;font-size:24px;font-weight:700;color:#dc2626;">Your booking has been cancelled</h1>

    <p style="font-size:15px;color:#374151;margin-bottom:24px;">${greeting}</p>

    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:20px 24px;margin-bottom:24px;">
      <p style="margin:0 0 12px;font-size:15px;font-weight:700;color:#991b1b;">Cancelled Booking Details</p>
      <table cellpadding="0" cellspacing="0" style="width:100%;">
        <tr><td style="padding:4px 0;font-size:13px;color:#6b7280;width:140px;">Order Number</td><td style="font-size:13px;font-weight:700;color:#1a1a2e;font-family:monospace;">${fmt(order.order_number)}</td></tr>
        <tr><td style="padding:4px 0;font-size:13px;color:#6b7280;">Route</td><td style="font-size:13px;color:#1a1a2e;">${fmt(order.origin)} → ${fmt(order.destination)}</td></tr>
        <tr><td style="padding:4px 0;font-size:13px;color:#6b7280;">Departure</td><td style="font-size:13px;color:#1a1a2e;">${fmtDateTime(order.departure_time)}</td></tr>
        <tr><td style="padding:4px 0;font-size:13px;color:#6b7280;">Airline</td><td style="font-size:13px;color:#1a1a2e;">${fmt(order.airline_name)}</td></tr>
      </table>
    </div>

    <p style="font-size:14px;color:#374151;margin-bottom:16px;">${message}</p>
    <p style="font-size:14px;color:#64748b;margin:0;">${closing}</p>
  `;
  return baseLayout({ agencyName, title: `Booking Cancelled — ${fmt(order.order_number)}`, body });
}

async function sendBookingCancelled({ order, agency }) {
  const to = fmt(order.contact_email);
  if (!to || to === 'N/A') return { sent: false, error: 'NO_RECIPIENT' };
  const agencyName = fmt(agency?.name, 'Travel Agency');
  const tmpl = await loadTemplate('booking_cancelled', order.agency_id || null);

  const { data, error } = await resend.emails.send({
    from: FROM,
    to,
    subject: tmpl?.subject
      ? renderBlock(tmpl.subject, { order_number: fmt(order.order_number), agency_name: agencyName })
      : `Booking Cancelled — ${agencyName} — Order ${fmt(order.order_number)}`,
    html: bookingCancelledHtml({ order, agency, blocks: tmpl?.blocks || null }),
  });
  if (error) {
    console.error('[emailService] sendBookingCancelled error:', error);
    return { sent: false, error: error.message };
  }
  console.log('[emailService] cancellation email sent, id:', data?.id);
  return { sent: true, messageId: data?.id };
}

// ─── BOOKING CONFIRMED (payment received) ─────────────────────────────────────

function bookingConfirmedHtml({ order, agency, outbound, returnFlight, blocks = null }) {
  const agencyName = fmt(agency?.name, 'Travel Agency');
  const vars = {
    order_number: fmt(order.order_number),
    agency_name: agencyName,
    flight_from: outbound?.origin_code || order.origin || '',
    flight_to: outbound?.destination_code || order.destination || '',
    total_price: `${fmt(order.total_price)} ${fmt(order.currency)}`,
  };

  const greeting = renderBlock(blocks?.greeting || 'Great news — your payment has been received!', vars);
  const intro    = renderBlock(blocks?.intro    || 'We have received your payment for booking {{order_number}}. Your ticket is now being processed and will be sent to you shortly.', vars);
  const closing  = renderBlock(blocks?.closing  || 'If you have any questions, please contact {{agency_name}} directly.', vars);

  const ob = outbound || {
    origin_code: order.origin, origin_name: '', destination_code: order.destination, destination_name: '',
    departure: order.departure_time, arrival: order.arrival_time,
    airline_name: order.airline_name, airline_code: order.airline_code, flight_number: order.flight_number, stops: 0,
  };

  const body = `
    <p style="margin:0 0 4px;font-size:14px;color:#64748b;">Payment Confirmed</p>
    <h1 style="margin:0 0 24px;font-size:24px;font-weight:700;color:#16a34a;">Payment received ✓</h1>

    <p style="font-size:15px;color:#374151;margin-bottom:8px;">${greeting}</p>
    <p style="font-size:15px;color:#374151;margin-bottom:24px;">${intro}</p>

    <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:14px 18px;margin-bottom:24px;">
      <span style="font-size:13px;color:#15803d;">Order: </span>
      <span style="font-size:16px;font-weight:700;color:#1a1a2e;margin-left:6px;font-family:monospace;">${fmt(order.order_number)}</span>
      <span style="font-size:13px;color:#15803d;margin-left:16px;">Amount paid: </span>
      <span style="font-size:15px;font-weight:700;color:#166534;">${vars.total_price}</span>
    </div>

    <p style="margin:0 0 14px;font-size:16px;font-weight:700;color:#1a1a2e;border-bottom:2px solid #dbeafe;padding-bottom:8px;">✈ Your Flight</p>
    ${flightBlock(ob, returnFlight ? 'Outbound Flight' : 'Flight')}
    ${returnFlight ? flightBlock(returnFlight, 'Return Flight') : ''}

    <p style="margin:24px 0 0;font-size:14px;color:#64748b;">${closing}</p>
  `;
  return baseLayout({ agencyName, title: `Payment Confirmed — ${fmt(order.order_number)}`, body });
}

async function sendBookingConfirmed({ order, agency, outbound, returnFlight }) {
  const to = fmt(order.contact_email);
  if (!to || to === 'N/A') return { sent: false, error: 'NO_RECIPIENT' };
  const agencyName = fmt(agency?.name, 'Travel Agency');
  const tmpl = await loadTemplate('booking_confirmed', order.agency_id || null);

  const subjectVars = { order_number: fmt(order.order_number), agency_name: agencyName };
  const { data, error } = await resend.emails.send({
    from: FROM,
    to,
    subject: tmpl?.subject
      ? renderBlock(tmpl.subject, subjectVars)
      : `Booking ${fmt(order.order_number)}: Payment confirmed — ${agencyName}`,
    html: bookingConfirmedHtml({ order, agency, outbound, returnFlight, blocks: tmpl?.blocks || null }),
  });
  if (error) {
    console.error('[emailService] sendBookingConfirmed error:', error);
    return { sent: false, error: error.message };
  }
  console.log('[emailService] booking confirmed email sent, id:', data?.id);
  return { sent: true, messageId: data?.id };
}

// ─── BOOKING CREATED (confirmation) ──────────────────────────────────────────

async function sendBookingConfirmation({ order, passengers = [], agency, pdfBuffer, claimToken, outbound, returnFlight }) {
  const agencyName = fmt(agency?.name, 'Travel Agency');
  const to = fmt(order.contact_email);
  if (!to || to === 'N/A') return { sent: false, error: 'NO_RECIPIENT' };

  const firstName = passengers[0]?.first_name && passengers[0].first_name !== 'N/A' ? passengers[0].first_name : '';
  const lastName = passengers[0]?.last_name && passengers[0].last_name !== 'N/A' ? passengers[0].last_name : '';
  const passengerName = [firstName, lastName].filter(Boolean).join(' ') || 'Traveller';

  const tmpl = await loadTemplate('booking_created', order.agency_id || null);

  const attachments = pdfBuffer
    ? [{ filename: `itinerary-${order.order_number || order.id}.pdf`, content: pdfBuffer.toString('base64') }]
    : [];

  const subjectVars = {
    passenger_name: passengerName,
    order_number: fmt(order.order_number),
    agency_name: agencyName,
  };

  const { data, error } = await resend.emails.send({
    from: FROM,
    to,
    subject: tmpl?.subject
      ? renderBlock(tmpl.subject, subjectVars)
      : `Booking ${fmt(order.order_number)}: Your booking is confirmed, ${passengerName}`,
    html: bookingConfirmationHtml({ order, passengers, agency, claimToken, outbound, returnFlight, blocks: tmpl?.blocks || null }),
    attachments,
  });

  if (error) {
    console.error('[emailService] sendBookingConfirmation error:', error);
    return { sent: false, error: error.message };
  }
  console.log('[emailService] booking confirmation sent, id:', data?.id);
  return { sent: true, messageId: data?.id };
}

// ─── AGENCY WELCOME ───────────────────────────────────────────────────────────

function agencyWelcomeHtml({ agency, portalUrl, blocks = null }) {
  const agencyName = fmt(agency.name, 'Your Agency');
  const bankDetails = agency.settings?.bank_details || {};
  const vars = {
    agency_name: agencyName,
    contact_email: fmt(agency.contact_email),
    portal_url: portalUrl,
  };

  const intro   = renderBlock(blocks?.intro   || 'Hello! Your agency {{agency_name}} has been set up on Aviaframe. You can now log in to your portal and start managing bookings.', vars);
  const steps   = renderBlock(blocks?.steps   || '1. Log in using the email above.\n2. Embed the widget on your website (Settings → Widget).\n3. Start receiving bookings from your clients.', vars);
  const closing = renderBlock(blocks?.closing || 'Need help? Reply to this email or contact support@aviaframe.com', vars);

  const stepsHtml = steps.split('\n').map((s, i) => `
    <tr>
      <td style="padding:8px 0;vertical-align:top;width:28px;font-size:14px;">${['1️⃣','2️⃣','3️⃣'][i] || '▪️'}</td>
      <td style="padding:8px 0;font-size:14px;color:#374151;">${s.replace(/^\d+\.\s*/, '')}</td>
    </tr>`).join('');

  const body = `
    <p style="margin:0 0 4px;font-size:14px;color:#64748b;">Welcome to Aviaframe</p>
    <h1 style="margin:0 0 24px;font-size:24px;font-weight:700;color:#1a1a2e;">Your agency account is ready 🎉</h1>

    <p style="font-size:15px;color:#374151;margin-bottom:24px;">${intro}</p>

    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:20px 24px;margin-bottom:24px;">
      <p style="margin:0 0 12px;font-size:15px;font-weight:700;color:#166534;">Account Details</p>
      <table cellpadding="0" cellspacing="0" style="width:100%;">
        <tr><td style="padding:4px 0;font-size:13px;color:#6b7280;width:140px;">Agency Name</td><td style="font-size:13px;font-weight:600;color:#1a1a2e;">${agencyName}</td></tr>
        <tr><td style="padding:4px 0;font-size:13px;color:#6b7280;">Login Email</td><td style="font-size:13px;color:#1a1a2e;">${fmt(agency.contact_email)}</td></tr>
        ${agency.domain ? `<tr><td style="padding:4px 0;font-size:13px;color:#6b7280;">Domain</td><td style="font-size:13px;color:#1a1a2e;">${agency.domain}</td></tr>` : ''}
        ${bankDetails.bank_name ? `<tr><td style="padding:4px 0;font-size:13px;color:#6b7280;">Bank</td><td style="font-size:13px;color:#1a1a2e;">${bankDetails.bank_name}</td></tr>` : ''}
      </table>
    </div>

    <p style="margin:0 0 20px;font-size:15px;font-weight:700;color:#1a1a2e;">Next steps:</p>
    <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:24px;">${stepsHtml}</table>

    <div style="text-align:center;margin:28px 0;">
      <a href="${portalUrl}" style="background:#1a1a2e;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:700;display:inline-block;">
        Open Your Portal →
      </a>
    </div>

    <p style="font-size:13px;color:#94a3b8;text-align:center;margin:0;">${closing}</p>
  `;
  return baseLayout({ agencyName: 'Aviaframe', title: `Welcome to Aviaframe — ${agencyName}`, body });
}

async function sendAgencyWelcome({ agency }) {
  const to = fmt(agency.contact_email);
  if (!to || to === 'N/A') return { sent: false, error: 'NO_RECIPIENT' };
  const portalUrl = process.env.APP_URL || 'https://admin.aviaframe.com';
  const tmpl = await loadTemplate('agency_welcome', null);
  const agencyName = fmt(agency.name, 'Your Agency');

  const { data, error } = await resend.emails.send({
    from: FROM,
    to,
    subject: tmpl?.subject
      ? renderBlock(tmpl.subject, { agency_name: agencyName })
      : `Welcome to Aviaframe — ${agencyName} is ready to go!`,
    html: agencyWelcomeHtml({ agency, portalUrl, blocks: tmpl?.blocks || null }),
  });
  if (error) {
    console.error('[emailService] sendAgencyWelcome error:', error);
    return { sent: false, error: error.message };
  }
  console.log('[emailService] agency welcome email sent, id:', data?.id);
  return { sent: true, messageId: data?.id };
}

// ─── SUPPORT ──────────────────────────────────────────────────────────────────

function supportReceivedHtml({ userEmail, subject, requestMessage, order }) {
  const body = `
    <p style="margin:0 0 4px;font-size:14px;color:#64748b;">Support</p>
    <h1 style="margin:0 0 24px;font-size:24px;font-weight:700;color:#1a1a2e;">We received your request ✓</h1>
    <p style="font-size:15px;color:#374151;margin-bottom:24px;">
      Thank you for reaching out. Our team will review your request and get back to you at <strong>${userEmail}</strong> as soon as possible.
    </p>
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px 24px;margin-bottom:24px;">
      <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;">Your message</p>
      <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#1a1a2e;">${fmt(subject)}</p>
      <p style="margin:0;font-size:14px;color:#374151;white-space:pre-line;">${fmt(requestMessage)}</p>
      ${order ? `<p style="margin:12px 0 0;font-size:12px;color:#94a3b8;">Related order: <strong style="color:#1a1a2e;">${fmt(order.order_number)}</strong></p>` : ''}
    </div>
    <p style="font-size:13px;color:#94a3b8;margin:0;">Typical response time is within 24 hours on business days.</p>
  `;
  return baseLayout({ agencyName: 'Aviaframe Support', title: 'Support Request Received', body });
}

async function sendSupportReceived({ userEmail, subject, requestMessage, order = null }) {
  if (!userEmail) return { sent: false, error: 'NO_RECIPIENT' };
  const { data, error } = await resend.emails.send({
    from: FROM,
    to: userEmail,
    subject: `We received your request — ${fmt(subject)}`,
    html: supportReceivedHtml({ userEmail, subject, requestMessage, order }),
  });
  if (error) {
    console.error('[emailService] sendSupportReceived error:', error);
    return { sent: false, error: error.message };
  }
  console.log('[emailService] support received email sent, id:', data?.id);
  return { sent: true, messageId: data?.id };
}

async function sendSupportEmail({ to, from, subject, text, attachment = null }) {
  const attachments = [];
  if (attachment?.buffer) {
    attachments.push({
      filename: attachment.fileName || 'attachment.bin',
      content: Buffer.isBuffer(attachment.buffer) ? attachment.buffer.toString('base64') : attachment.buffer,
    });
  }
  const { data, error } = await resend.emails.send({
    from: FROM, to, replyTo: from || undefined, subject, text, attachments,
  });
  if (error) {
    console.error('[emailService] sendSupportEmail error:', error);
    return { sent: false, error: error.message };
  }
  return { sent: true, messageId: data?.id };
}

// ─── TEMPLATE RENDER PREVIEW ──────────────────────────────────────────────────

/**
 * Render a preview of an email template with sample data.
 * Returns {html, subject}
 */
async function previewTemplate(eventType, { agencyId = null, sampleVars = {} } = {}) {
  const tmpl = await loadTemplate(eventType, agencyId);

  const SAMPLE = {
    passenger_name: 'John Smith',
    order_number: '2MUKNY',
    agency_name: 'Aviaframe Demo Agency',
    flight_from: 'DXB',
    flight_to: 'LHR',
    departure: '2026-04-15 08:30',
    total_price: '850 EUR',
    contact_email: 'john.smith@example.com',
    portal_url: 'https://admin.aviaframe.com',
    ...sampleVars,
  };

  const blocks = tmpl?.blocks || null;
  const subjectTmpl = tmpl?.subject || eventType;
  const subject = renderBlock(subjectTmpl, SAMPLE);

  // Build sample order + agency for HTML rendering
  const sampleOrder = {
    order_number: SAMPLE.order_number,
    contact_email: SAMPLE.contact_email,
    origin: SAMPLE.flight_from,
    destination: SAMPLE.flight_to,
    departure_time: SAMPLE.departure,
    arrival_time: '2026-04-15 14:45',
    total_price: 850,
    currency: 'EUR',
    airline_name: 'Emirates',
    airline_code: 'EK',
    flight_number: 'EK001',
    payment_method: 'bank_transfer',
  };
  const sampleAgency = {
    name: SAMPLE.agency_name,
    contact_email: 'agency@example.com',
    domain: 'demo.example.com',
    settings: {
      bank_details: { bank_name: 'Example Bank', iban: 'SA0380000000608010167519', swift_bic: 'BNKSARIX' }
    },
  };
  const sampleOutbound = {
    origin_code: 'DXB', origin_name: 'Dubai International Airport',
    destination_code: 'LHR', destination_name: 'London Heathrow Airport',
    departure: '2026-04-15 08:30', arrival: '2026-04-15 14:45',
    airline_name: 'Emirates', airline_code: 'EK', flight_number: 'EK001', stops: 0,
  };

  let html = '';
  if (eventType === 'booking_created') {
    html = bookingConfirmationHtml({ order: sampleOrder, passengers: [{ first_name: 'John', last_name: 'Smith', passenger_type: 'ADT', passport_number: 'AB123456' }], agency: sampleAgency, outbound: sampleOutbound, blocks });
  } else if (eventType === 'booking_cancelled') {
    html = bookingCancelledHtml({ order: sampleOrder, agency: sampleAgency, blocks });
  } else if (eventType === 'booking_confirmed') {
    html = bookingConfirmedHtml({ order: sampleOrder, agency: sampleAgency, outbound: sampleOutbound, blocks });
  } else if (eventType === 'agency_welcome') {
    html = agencyWelcomeHtml({ agency: sampleAgency, portalUrl: 'https://admin.aviaframe.com', blocks });
  }

  return { html, subject };
}

// ─── BACKWARD COMPAT ──────────────────────────────────────────────────────────

async function sendTicketEmail({ to, order, attachment }) {
  return sendBookingConfirmation({ order, agency: null, pdfBuffer: attachment?.buffer });
}

module.exports = {
  sendBookingConfirmation,
  sendBookingCancelled,
  sendBookingConfirmed,
  sendAgencyWelcome,
  sendSupportReceived,
  sendSupportEmail,
  sendTicketEmail,
  loadTemplate,
  renderBlock,
  previewTemplate,
};
