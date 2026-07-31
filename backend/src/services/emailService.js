const nodemailer = require('nodemailer');
const https = require('https');
const { resolveAirportDisplayName } = require('./airportAutocompleteService');
const {
  toMoney,
  isEnhancedTicketArtifactEnabled,
  buildTicketPricingBreakdown,
  collectBaggageHighlights,
  collectFareHighlights,
  getAgencyBrandingContext
} = require('./ticketArtifactService');

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

function escapeHtml(value) {
  return safe(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Internal DRCT order ids are UUIDs — never present them to travellers as a "PNR".
function isUuidLike(v) {
  return typeof v === 'string'
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
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

function formatAirportDisplay(name, code) {
  return resolveAirportDisplayName(name, code);
}

function buildEmailSegments(order = {}) {
  const rawSegments = order?.raw_offer_data?.offer?.segments;
  if (Array.isArray(rawSegments) && rawSegments.length > 0) {
    return rawSegments.map((segment) => ({
      originCode: safe(
        segment.origin_code || segment.departure_airport?.code || segment.origin || segment.from,
        '',
      ).trim().toUpperCase(),
      originName: safe(
        segment.origin_name || segment.departure_airport?.name || segment.origin || segment.departure_city?.name,
        '',
      ).trim(),
      destinationCode: safe(
        segment.destination_code || segment.arrival_airport?.code || segment.destination || segment.to,
        '',
      ).trim().toUpperCase(),
      destinationName: safe(
        segment.destination_name || segment.arrival_airport?.name || segment.destination || segment.arrival_city?.name,
        '',
      ).trim(),
      departure: segment.departure || segment.departure_time || order.departure_time || null,
      arrival: segment.arrival || segment.arrival_time || order.arrival_time || null,
    }));
  }

  return [{
    originCode: safe(order.origin, '').trim().toUpperCase(),
    originName: safe(order.origin_name || order.origin, '').trim(),
    destinationCode: safe(order.destination, '').trim().toUpperCase(),
    destinationName: safe(order.destination_name || order.destination, '').trim(),
    departure: order.departure_time || null,
    arrival: order.arrival_time || null,
  }];
}

// ─── HTML Email Template ─────────────────────────────────────────────────────

function buildLegacyTicketHtml({ order, passengers = [], issuance = {}, demoMode = false }) {
  const segments = buildEmailSegments(order);
  const firstSegment = segments[0] || {};
  const lastSegment = segments[segments.length - 1] || {};
  const passengerName = passengers.length > 0
    ? `${safe(passengers[0].first_name)} ${safe(passengers[0].last_name)}`.trim().toUpperCase()
    : safe(order.contact_email);

  const depTime = formatTimeOnly(firstSegment.departure || order.departure_time);
  const depDate = formatDateShort(firstSegment.departure || order.departure_time);
  const arrTime = formatTimeOnly(lastSegment.arrival || order.arrival_time);
  const arrDate = formatDateShort(lastSegment.arrival || order.arrival_time);
  const duration = flightDuration(firstSegment.departure || order.departure_time, lastSegment.arrival || order.arrival_time);
  const orig = formatAirportDisplay(firstSegment.originName || order.origin_name || order.origin, firstSegment.originCode || order.origin);
  const dest = formatAirportDisplay(lastSegment.destinationName || order.destination_name || order.destination, lastSegment.destinationCode || order.destination);
  const airline = safe(order.airline_name || order.airline_code, 'N/A');
  const flightNo = safe(order.flight_number, 'N/A');
  const cabin = safe(order.cabin_class || order.fare_class, 'Economy');
  const orderNum = safe(order.order_number, safe(order.id));
  const rawPnr = issuance.pnr || order.drct_order_id || null;
  const pnr = rawPnr && !isUuidLike(rawPnr) ? String(rawPnr) : null;
  const airlinePnr = issuance.airline_pnr && !isUuidLike(issuance.airline_pnr)
    ? String(issuance.airline_pnr) : null;
  const drctTickets = Array.isArray(issuance.tickets) ? issuance.tickets : [];
  const eticketFor = (idx) => {
    const m = drctTickets.find(t => String(t.passenger) === String(idx + 1))
      || (drctTickets.length === 1 ? drctTickets[0] : null);
    const n = m?.number || issuance.ticket_number || null;
    return n && !isUuidLike(n) ? String(n) : null;
  };
  const total = `${Number(order.total_price || 0).toFixed(2)} ${safe(order.currency, 'UAH')}`;

  const passengersHtml = passengers.length > 0
    ? passengers.map((p, idx) => {
        const name = `${safe(p.last_name)} ${safe(p.first_name)}`.trim().toUpperCase();
        const eticket = eticketFor(idx);
        const eticketLine = eticket
          ? `<div style="font-size:11px; color:#64748B; margin-top:2px;">E-ticket:&nbsp;<strong style="color:#1E293B; letter-spacing:0.5px;">${eticket}</strong></div>`
          : '';
        return `
        <tr>
          <td style="padding:10px 16px; font-size:14px; color:#1E293B; font-weight:600;">${name}${eticketLine}</td>
          <td style="padding:10px 16px; font-size:13px; color:#64748B; text-align:right; vertical-align:top;">${safe(p.passenger_type, 'ADT')}</td>
        </tr>`;
      }).join('')
    : `<tr><td colspan="2" style="padding:10px 16px; font-size:13px; color:#64748B;">${safe(order.contact_email)}</td></tr>`;

  const pnrParts = [];
  if (pnr) pnrParts.push(`Booking ref (PNR):&nbsp;<strong style="color:#1E293B; letter-spacing:1px;">${pnr}</strong>`);
  if (airlinePnr && airlinePnr !== pnr) pnrParts.push(`Airline PNR:&nbsp;<strong style="color:#1E293B; letter-spacing:1px;">${airlinePnr}</strong>`);
  const pnrHtml = pnrParts.length > 0 ? `
    <tr>
      <td colspan="2" style="padding:6px 16px 12px 16px; font-size:12px; color:#64748B;">
        ${pnrParts.join('&nbsp;&nbsp;&nbsp;&nbsp;')}
      </td>
    </tr>` : '';

  const title = demoMode ? 'Your test ticket is issued' : 'Your ticket is issued';
  const statusLabel = demoMode ? 'TEST TICKET ISSUED' : 'TICKET ISSUED';
  const footerNote = demoMode
    ? 'This is a demo e-ticket generated for platform testing only.<br>Do not use this document for airport check-in or travel.'
    : 'Your e-ticket is attached to this email as a PDF.<br>Please present it along with a valid photo ID at check-in.';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ticket Issued — ${orderNum}</title>
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
                ${title}
              </div>
              <div style="margin-top:16px;">
                <table cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding-right:16px;">
                      <span style="font-size:11px; color:#64748B; display:block; margin-bottom:4px;">BOOKING STATUS</span>
                      <span style="display:inline-block; background:#16A34A; color:#fff; font-size:12px; font-weight:700; border-radius:20px; padding:4px 14px;">
                        &#10003; ${statusLabel}
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
                    <span style="display:inline-block; background:#0EA5E9; color:#fff; font-size:11px; font-weight:700; border-radius:6px; padding:6px 18px;">${statusLabel}</span>
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
                ${footerNote}
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

function renderBreakdownRows(rows = []) {
  return rows
    .filter((row) => row && row.label && row.value !== null && row.value !== undefined && row.value !== '')
    .map((row) => `
      <tr>
        <td style="padding:10px 16px; font-size:13px; color:#64748B;">${row.label}</td>
        <td style="padding:10px 16px; font-size:13px; color:#1E293B; font-weight:700; text-align:right;">${row.value}</td>
      </tr>`)
    .join('');
}

function renderBulletItems(items = []) {
  return items
    .filter(Boolean)
    .map((item) => `
      <tr>
        <td style="padding:0 0 10px 0; font-size:13px; color:#1E293B; line-height:1.5;">
          <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#0EA5E9; margin-right:10px;"></span>${item}
        </td>
      </tr>`)
    .join('');
}

function buildEnhancedTicketHtml({ order, passengers = [], issuance = {}, demoMode = false, agency = null }) {
  const segments = buildEmailSegments(order);
  const firstSegment = segments[0] || {};
  const lastSegment = segments[segments.length - 1] || {};
  const depTime = formatTimeOnly(firstSegment.departure || order.departure_time);
  const depDate = formatDateShort(firstSegment.departure || order.departure_time);
  const arrTime = formatTimeOnly(lastSegment.arrival || order.arrival_time);
  const arrDate = formatDateShort(lastSegment.arrival || order.arrival_time);
  const duration = flightDuration(firstSegment.departure || order.departure_time, lastSegment.arrival || order.arrival_time);
  const orig = formatAirportDisplay(firstSegment.originName || order.origin_name || order.origin, firstSegment.originCode || order.origin);
  const dest = formatAirportDisplay(lastSegment.destinationName || order.destination_name || order.destination, lastSegment.destinationCode || order.destination);
  const airline = safe(order.airline_name || order.airline_code, 'N/A');
  const flightNo = safe(order.flight_number, 'N/A');
  const cabin = safe(order.cabin_class || order.fare_class, 'Economy');
  const orderNum = safe(order.order_number, safe(order.id));
  const rawPnr = issuance.pnr || order.drct_order_id || null;
  const pnr = rawPnr && !isUuidLike(rawPnr) ? String(rawPnr) : null;
  const airlinePnr = issuance.airline_pnr && !isUuidLike(issuance.airline_pnr)
    ? String(issuance.airline_pnr) : null;
  const drctTickets = Array.isArray(issuance.tickets) ? issuance.tickets : [];
  const pricing = buildTicketPricingBreakdown(order, { demoMode });
  const baggageHighlights = collectBaggageHighlights(order, passengers);
  const fareHighlights = collectFareHighlights(order);
  const brand = getAgencyBrandingContext(agency);

  const eticketFor = (idx) => {
    const match = drctTickets.find((ticket) => String(ticket.passenger) === String(idx + 1))
      || (drctTickets.length === 1 ? drctTickets[0] : null);
    const ticketNumber = match?.number || issuance.ticket_number || null;
    return ticketNumber && !isUuidLike(ticketNumber) ? String(ticketNumber) : null;
  };

  const passengerRows = (passengers.length > 0 ? passengers : [{ first_name: order.contact_email || 'Passenger', last_name: '', passenger_type: 'ADT' }])
    .map((passenger, index) => {
      const baggage = passenger?.baggage_allowance ? collectBaggageHighlights(order, [passenger])[0] : null;
      const extras = [
        safe(passenger.passenger_type, 'ADT'),
        eticketFor(index) ? `E-ticket ${eticketFor(index)}` : null,
        baggage ? baggage.split(': ').slice(1).join(': ') : null
      ].filter(Boolean).join(' · ');

      return `
        <tr>
          <td style="padding:10px 16px; font-size:14px; color:#1E293B; font-weight:700;">${`${safe(passenger.last_name)} ${safe(passenger.first_name)}`.trim().toUpperCase()}</td>
          <td style="padding:10px 16px; font-size:12px; color:#64748B; text-align:right;">${extras || 'Traveller'}</td>
        </tr>`;
    })
    .join('');

  const pricingRows = [
    { label: 'Ticket price (without payment fee)', value: toMoney(pricing.cleanSubtotal, pricing.currency) },
    ...pricing.components.map((item) => ({ label: item.label, value: toMoney(item.amount, pricing.currency) })),
    pricing.hasPaymentFee ? { label: 'Card / gateway processing fee', value: toMoney(pricing.processingFee, pricing.currency) } : null,
    ...pricing.feeComponents.map((item) => ({ label: `&nbsp;&nbsp;${item.label}`, value: toMoney(item.amount, pricing.currency) })),
    { label: pricing.hasPaymentFee ? 'Total paid' : 'Total fare', value: toMoney(pricing.hasPaymentFee ? pricing.totalPaid : pricing.cleanSubtotal, pricing.currency) }
  ].filter(Boolean);

  const supportRows = [
    { label: 'Agency / issuer', value: brand.agencyName || 'AviaFrame' },
    brand.supportEmail ? { label: 'Support email', value: brand.supportEmail } : null,
    brand.supportPhone ? { label: 'Support phone', value: brand.supportPhone } : null,
    brand.supportPhone2 ? { label: 'Additional phone', value: brand.supportPhone2 } : null,
    brand.whatsappPhone ? { label: 'WhatsApp', value: brand.whatsappPhone } : null,
    brand.supervisorName ? { label: 'Supervisor', value: brand.supervisorEmail ? `${brand.supervisorName} (${brand.supervisorEmail})` : brand.supervisorName } : null
  ].filter(Boolean);

  const title = demoMode ? 'Your test ticket is issued' : 'Your ticket is issued';
  const footerNote = pricing.hasPaymentFee
    ? 'This receipt shows the airline ticket price separately from payment-system charges. Payment processing fees are non-airline charges and may be non-refundable.'
    : 'This receipt shows the airline ticket value without mixing in payment-system charges.';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ticket Issued — ${orderNum}</title>
</head>
<body style="margin:0; padding:0; background:#F1F5F9; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F1F5F9; padding:32px 0;">
    <tr>
      <td align="center">
        <table width="680" cellpadding="0" cellspacing="0" style="background:#FFFFFF; border-radius:10px; overflow:hidden; box-shadow:0 1px 6px rgba(0,0,0,0.08);">
          <tr><td style="background:${brand.accentColor || '#0EA5E9'}; height:5px; font-size:0;">&nbsp;</td></tr>
          <tr>
            <td style="padding:28px 32px 20px 32px; border-bottom:1px solid #E2E8F0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="font-size:22px; font-weight:800; color:${brand.brandColor || '#1E3A5F'};">Avia</span><span style="font-size:22px; font-weight:800; color:${brand.accentColor || '#0EA5E9'};">Frame</span>
                    <div style="font-size:10px; color:#94A3B8; margin-top:2px; letter-spacing:1px;">E-TICKET ITINERARY RECEIPT</div>
                    ${brand.agencyName && brand.agencyName !== 'AviaFrame' ? `<div style="font-size:12px; color:#1E293B; margin-top:8px; font-weight:700;">Issued for ${brand.agencyName}</div>` : ''}
                  </td>
                  <td align="right">
                    <div style="display:inline-block; border:1.5px solid #E2E8F0; border-radius:8px; padding:10px 18px; text-align:center; min-width:190px;">
                      <div style="font-size:10px; color:#94A3B8; margin-bottom:4px; letter-spacing:1px;">BOOKING NUMBER</div>
                      <div style="font-size:18px; font-weight:800; color:${brand.brandColor || '#1E3A5F'}; letter-spacing:2px;">${orderNum}</div>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:24px 32px 8px 32px;">
              <div style="font-size:24px; font-weight:800; color:#1E293B;">${title}</div>
              <div style="font-size:13px; color:${brand.brandColor || '#1E3A5F'}; font-weight:700; margin-top:8px;">${orig} &rarr; ${dest}</div>
            </td>
          </tr>

          <tr>
            <td style="padding:0 32px 16px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1.5px solid #E2E8F0; border-radius:8px; overflow:hidden;">
                ${renderBreakdownRows([
                  { label: 'Booking reference (PNR)', value: pnr || 'Issued booking reference will appear here' },
                  airlinePnr && airlinePnr !== pnr ? { label: 'Airline PNR', value: airlinePnr } : null,
                  { label: 'Status', value: 'Ticket issued' },
                  { label: 'Travel currency', value: pricing.currency },
                  { label: 'Clean ticket price', value: toMoney(pricing.cleanSubtotal, pricing.currency) },
                  pricing.hasPaymentFee ? { label: 'Total paid', value: toMoney(pricing.totalPaid, pricing.currency) } : null
                ])}
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:0 32px 18px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1.5px solid #E2E8F0; border-radius:8px; overflow:hidden;">
                <tr>
                  <td style="padding:16px 18px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:60%;">
                          <div style="font-size:11px; color:#94A3B8;">Departure</div>
                          <div style="font-size:22px; font-weight:800; color:#1E293B;">${depTime}</div>
                          <div style="font-size:12px; color:#64748B;">${depDate}</div>
                          <div style="font-size:15px; font-weight:800; color:#1E293B; margin-top:8px;">${orig}</div>
                        </td>
                        <td style="text-align:center; vertical-align:middle; width:10%;">
                          <div style="font-size:18px; color:#94A3B8;">&#9992;</div>
                          ${duration ? `<div style="font-size:11px; color:#64748B; margin-top:6px;">${duration}</div>` : ''}
                        </td>
                        <td style="width:30%; text-align:right;">
                          <div style="font-size:11px; color:#94A3B8;">Arrival</div>
                          <div style="font-size:22px; font-weight:800; color:#1E293B;">${arrTime}</div>
                          <div style="font-size:12px; color:#64748B;">${arrDate}</div>
                          <div style="font-size:15px; font-weight:800; color:#1E293B; margin-top:8px;">${dest}</div>
                        </td>
                      </tr>
                      <tr>
                        <td colspan="3" style="padding-top:16px; border-top:1px solid #E2E8F0;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="font-size:12px; color:#94A3B8;">Carrier</td>
                              <td style="font-size:12px; color:#94A3B8;">Flight</td>
                              <td style="font-size:12px; color:#94A3B8;">Cabin</td>
                            </tr>
                            <tr>
                              <td style="font-size:13px; color:#1E293B; font-weight:700; padding-top:4px;">${airline}</td>
                              <td style="font-size:13px; color:#1E293B; font-weight:700; padding-top:4px;">${flightNo}</td>
                              <td style="font-size:13px; color:#1E293B; font-weight:700; padding-top:4px;">${cabin}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:0 32px 16px 32px;">
              <div style="font-size:13px; font-weight:700; color:#1E293B; margin-bottom:10px;">Passengers</div>
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1.5px solid #E2E8F0; border-radius:8px; overflow:hidden;">
                ${passengerRows}
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:0 32px 16px 32px;">
              <div style="font-size:13px; font-weight:700; color:#1E293B; margin-bottom:10px;">Fare & payment breakdown</div>
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1.5px solid #E2E8F0; border-radius:8px; overflow:hidden;">
                ${renderBreakdownRows(pricingRows)}
              </table>
            </td>
          </tr>

          ${baggageHighlights.length > 0 ? `
          <tr>
            <td style="padding:0 32px 16px 32px;">
              <div style="font-size:13px; font-weight:700; color:#1E293B; margin-bottom:10px;">Baggage highlights</div>
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1.5px solid #E2E8F0; border-radius:8px; overflow:hidden;">
                <tr><td style="padding:14px 16px 6px 16px;">${renderBulletItems(baggageHighlights)}</td></tr>
              </table>
            </td>
          </tr>` : ''}

          ${fareHighlights.length > 0 ? `
          <tr>
            <td style="padding:0 32px 16px 32px;">
              <div style="font-size:13px; font-weight:700; color:#1E293B; margin-bottom:10px;">Fare conditions & attributes</div>
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1.5px solid #E2E8F0; border-radius:8px; overflow:hidden;">
                <tr><td style="padding:14px 16px 6px 16px;">${renderBulletItems(fareHighlights)}</td></tr>
              </table>
            </td>
          </tr>` : ''}

          <tr>
            <td style="padding:0 32px 20px 32px;">
              <div style="font-size:13px; font-weight:700; color:#1E293B; margin-bottom:10px;">Support & servicing</div>
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1.5px solid #E2E8F0; border-radius:8px; overflow:hidden;">
                ${renderBreakdownRows(supportRows)}
              </table>
            </td>
          </tr>

          <tr>
            <td style="background:#1E3A5F; padding:18px 32px; text-align:center;">
              <div style="font-size:11px; color:#C7D2FE; line-height:1.6;">${footerNote}</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildTicketHtml({ order, passengers = [], issuance = {}, demoMode = false, agency = null }) {
  if (!isEnhancedTicketArtifactEnabled(order)) {
    return buildLegacyTicketHtml({ order, passengers, issuance, demoMode, agency });
  }
  return buildEnhancedTicketHtml({ order, passengers, issuance, demoMode, agency });
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

async function sendTicketEmail({ to, order, attachment, passengers = [], issuance = {}, demoMode = false, agency = null }) {
  const from = process.env.EMAIL_FROM || process.env.SMTP_FROM || 'noreply@aviaframe.com';
  const orderNum = safe(order.order_number || order.id);
  const segments = buildEmailSegments(order);
  const firstSegment = segments[0] || {};
  const lastSegment = segments[segments.length - 1] || {};
  const routeLabel = `${formatAirportDisplay(firstSegment.originName || order.origin_name || order.origin, firstSegment.originCode || order.origin)} → ${formatAirportDisplay(lastSegment.destinationName || order.destination_name || order.destination, lastSegment.destinationCode || order.destination)}`;
  const subject = demoMode
    ? `Test ticket ${orderNum} issued — your demo e-ticket`
    : `Ticket ${orderNum} issued — your e-ticket`;

  const html = buildTicketHtml({ order, passengers, issuance, demoMode, agency });
  const pricing = buildTicketPricingBreakdown(order, { demoMode });
  const baggageHighlights = collectBaggageHighlights(order, passengers);
  const fareHighlights = collectFareHighlights(order);
  const brand = getAgencyBrandingContext(agency);

  const textLines = [
    demoMode ? `Your test ticket is issued.` : `Your ticket is issued.`,
    ``,
    `Booking number: ${orderNum}`,
    `Route: ${routeLabel}`,
    `Departure: ${firstSegment.departure || order.departure_time || 'N/A'}`,
    `Airline: ${safe(order.airline_name || order.airline_code)}`,
    `Flight: ${safe(order.flight_number)}`,
    ``,
    `Passengers: ${passengers.map(p => `${p.last_name} ${p.first_name}`).join(', ') || safe(order.contact_email)}`,
    ``,
    `Ticket price (without payment fee): ${toMoney(pricing.cleanSubtotal, pricing.currency)}`,
    pricing.hasPaymentFee ? `Payment processing fee: ${toMoney(pricing.processingFee, pricing.currency)}` : null,
    `${pricing.hasPaymentFee ? 'Total paid' : 'Total fare'}: ${toMoney(pricing.hasPaymentFee ? pricing.totalPaid : pricing.cleanSubtotal, pricing.currency)}`,
    ``,
    pricing.components.length ? `Fare breakdown: ${pricing.components.map((item) => `${item.label} ${toMoney(item.amount, pricing.currency)}`).join(' | ')}` : null,
    baggageHighlights.length ? `Baggage: ${baggageHighlights.join(' | ')}` : null,
    fareHighlights.length ? `Fare conditions: ${fareHighlights.join(' | ')}` : null,
    ``,
    demoMode
      ? `Your demo e-ticket PDF is attached. This document is for testing only and is not valid for travel.`
      : `Your e-ticket PDF is attached. Please present it with a valid ID at check-in.`,
    brand.supportEmail || brand.supportPhone
      ? `Support: ${[brand.supportEmail, brand.supportPhone, brand.supportPhone2].filter(Boolean).join(' | ')}`
      : null,
    ``,
    `AviaFrame`
  ].filter(Boolean).join('\n');

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

async function sendAgencyOnboardingEmail({
  to,
  agency,
  inviterName = 'AviaFrame team',
  setupUrl = 'https://admin.aviaframe.com/',
  guideUrl = process.env.AGENCY_SETUP_GUIDE_URL || 'https://aviaframe.com/agency-setup-guide.html',
  siteUrl = '',
  publicWidgetKey = ''
}) {
  const from = process.env.EMAIL_FROM || process.env.SMTP_FROM || 'noreply@aviaframe.com';
  const agencyName = safe(agency?.name, 'your agency');
  const agencyDomain = safe(agency?.domain);
  const managerEmail = safe(agency?.contact_email, to);
  const widgetKey = safe(publicWidgetKey || agency?.api_key);
  const subject = `Welcome to AviaFrame — ${agencyName} setup guide`;
  const siteLabel = siteUrl || (agencyDomain ? `https://${agencyDomain}` : '');

  const html = `
    <div style="font-family:Arial,sans-serif;background:#f8fbff;padding:24px;color:#0f172a">
      <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #dbe7ff;border-radius:18px;overflow:hidden">
        <div style="padding:28px 32px;background:linear-gradient(135deg,#1d4ed8 0%,#2563eb 100%);color:#ffffff">
          <div style="font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;opacity:.92">Welcome to AviaFrame</div>
          <h1 style="margin:12px 0 8px;font-size:28px;line-height:1.2">${escapeHtml(agencyName)}</h1>
          <p style="margin:0;font-size:15px;line-height:1.6;opacity:.95">Your agency workspace is ready. Complete the setup, publish your branded site, and start selling with AviaFrame.</p>
        </div>
        <div style="padding:28px 32px">
          <p style="margin:0 0 18px;font-size:15px;line-height:1.7">Hello,</p>
          <p style="margin:0 0 18px;font-size:15px;line-height:1.7">Welcome to <strong>AviaFrame</strong>. Your agency workspace for <strong>${escapeHtml(agencyName)}</strong> is now ready and linked to <strong>${escapeHtml(managerEmail)}</strong>.</p>
          <p style="margin:0 0 18px;font-size:15px;line-height:1.7">You can now complete your branding, configure payment and commercial settings, publish your agency site, and run a full booking test before going live.</p>

          <div style="display:flex;flex-wrap:wrap;gap:12px;margin:0 0 24px">
            <a href="${escapeHtml(setupUrl)}" style="display:inline-block;padding:13px 20px;border-radius:12px;background:#2563eb;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700">Open admin portal</a>
            <a href="${escapeHtml(guideUrl)}" style="display:inline-block;padding:13px 20px;border-radius:12px;background:#eff6ff;border:1px solid #bfdbfe;color:#1d4ed8;text-decoration:none;font-size:14px;font-weight:700">Open setup guide</a>
            <a href="${escapeHtml(guideUrl)}" style="display:inline-block;padding:13px 20px;border-radius:12px;background:#ffffff;border:1px solid #dbe7ff;color:#0f172a;text-decoration:none;font-size:14px;font-weight:700">Print / save guide as PDF</a>
          </div>

          <div style="border:1px solid #dbe7ff;border-radius:14px;padding:18px 20px;background:#f8fbff;margin:0 0 24px">
            <div style="font-size:13px;color:#475569;text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px;font-weight:700">Quick access</div>
            <div style="margin-bottom:8px"><strong>Admin portal:</strong> <a href="${escapeHtml(setupUrl)}">${escapeHtml(setupUrl)}</a></div>
            <div style="margin-bottom:8px"><strong>Setup guide:</strong> <a href="${escapeHtml(guideUrl)}">${escapeHtml(guideUrl)}</a></div>
            ${siteLabel ? `<div style="margin-bottom:8px"><strong>Agency site:</strong> <a href="${escapeHtml(siteLabel)}">${escapeHtml(siteLabel)}</a></div>` : ''}
            ${agencyDomain ? `<div style="margin-bottom:8px"><strong>Agency domain:</strong> ${escapeHtml(agencyDomain)}</div>` : ''}
            ${widgetKey ? `<div><strong>Public widget key:</strong> <code style="font-family:ui-monospace,Menlo,Consolas,monospace;background:#e2e8f0;padding:2px 6px;border-radius:6px">${escapeHtml(widgetKey)}</code></div>` : ''}
          </div>

          <div style="margin:0 0 24px">
            <div style="font-size:18px;font-weight:700;margin-bottom:12px">What to do next</div>
            <ol style="padding-left:20px;margin:0;color:#334155;line-height:1.8">
              <li>Sign in to the admin portal with this email address.</li>
              <li>Open the setup guide and follow the steps in order.</li>
              <li>Open <strong>Agency admin</strong> and complete branding, contact, payment, and domain settings.</li>
              <li>Review the onboarding checklist and make sure all required items are complete.</li>
              <li>Use <strong>Publish site</strong> to deploy or refresh your agency website.</li>
              <li>Copy the public widget key or embed snippet if you want to place the search widget on another domain.</li>
            </ol>
          </div>

          <div style="border-left:4px solid #2563eb;background:#eff6ff;padding:14px 16px;border-radius:10px;margin:0 0 24px">
            <div style="font-size:14px;font-weight:700;margin-bottom:6px">Recommended launch path</div>
            <div style="font-size:14px;line-height:1.7;color:#334155">Start with branding and contacts, then configure payment methods, add allowed widget domains if needed, publish the site, and finish with a quick end-to-end booking test.</div>
          </div>

          <p style="margin:0;font-size:14px;line-height:1.7;color:#475569">If you need help at any stage, reply to this email and the AviaFrame team will help you get live quickly.</p>
        </div>
      </div>
    </div>
  `;

  const text = [
    `Welcome to AviaFrame — ${agencyName} setup guide`,
    '',
    `Welcome to AviaFrame.`,
    `Your agency workspace for ${agencyName} is now ready and linked to ${managerEmail}.`,
    'You can now complete your branding, configure payments, publish your site, and test the full booking flow.',
    `Manager email: ${managerEmail}`,
    setupUrl ? `Admin portal: ${setupUrl}` : null,
    guideUrl ? `Setup guide: ${guideUrl}` : null,
    siteLabel ? `Agency site: ${siteLabel}` : null,
    agencyDomain ? `Agency domain: ${agencyDomain}` : null,
    widgetKey ? `Public widget key: ${widgetKey}` : null,
    '',
    'Next steps:',
    '1. Sign in to the admin portal with this email address.',
    '2. Open the setup guide and follow the steps in order.',
    '3. Open Agency admin and complete branding, contact, payment, and domain settings.',
    '4. Review the onboarding checklist and complete all required items.',
    '5. Use Publish site to deploy or refresh the agency website.',
    '6. Copy the public widget key or embed snippet for external domains if needed.',
    '',
    'Recommended order: branding and contacts, payment methods, allowed widget domains, publish site, end-to-end booking check.'
  ].filter(Boolean).join('\n');

  if (isResendConfigured()) {
    await sendViaResend({ from, to, subject, html, text });
    return { sent: true, error: null };
  }

  if (isSmtpConfigured()) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });
    await transporter.sendMail({ from, to, subject, html, text });
    return { sent: true, error: null };
  }

  return { sent: false, error: 'EMAIL_NOT_CONFIGURED' };
}

module.exports = { isConfigured, sendTicketEmail, sendSupportEmail, sendAgencyOnboardingEmail };
