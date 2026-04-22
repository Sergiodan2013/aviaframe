const PDFDocument = require('pdfkit');

// ─── Helpers ────────────────────────────────────────────────────────────────

function toMoney(value, currency = 'USD') {
  const amount = Number(value || 0);
  return `${amount.toFixed(2)} ${currency}`;
}

function safe(v, fallback = 'N/A') {
  if (v === null || v === undefined || v === '') return fallback;
  return String(v);
}

function formatDateShort(v) {
  if (!v) return 'N/A';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTimeOnly(v) {
  if (!v) return '--:--';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v).slice(0, 5);
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
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

function formatDateTime(v) {
  if (!v) return 'N/A';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toISOString().replace('T', ' ').slice(0, 16);
}

// Parse ISO or "YYYY-MM-DD HH:MM" string into Date
function parseDateTime(v) {
  if (!v) return null;
  const d = new Date(v);
  if (!Number.isNaN(d.getTime())) return d;
  // try "YYYY-MM-DD HH:MM:SS"
  const d2 = new Date(String(v).replace(' ', 'T'));
  return Number.isNaN(d2.getTime()) ? null : d2;
}

function fmtTime(v) {
  const d = parseDateTime(v);
  if (!d) return '--:--';
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function fmtDate(v) {
  const d = parseDateTime(v);
  if (!d) return '';
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
}

function calcDuration(dep, arr) {
  const d1 = parseDateTime(dep);
  const d2 = parseDateTime(arr);
  if (!d1 || !d2) return null;
  const mins = Math.round((d2 - d1) / 60000);
  if (mins <= 0) return null;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

/**
 * Build segments array from order.
 * Tries raw_offer_data.offer.segments first, then falls back to order fields.
 */
function buildSegments(order) {
  const raw = order.raw_offer_data?.offer?.segments;
  if (Array.isArray(raw) && raw.length > 0) {
    return raw.map(seg => ({
      origin: safe(seg.origin || seg.departure_airport?.code || seg.from, ''),
      destination: safe(seg.destination || seg.arrival_airport?.code || seg.to, ''),
      departure: seg.departure || seg.departure_time || `${seg.departure_date || ''} ${seg.departure_time_str || ''}`.trim(),
      arrival: seg.arrival || seg.arrival_time || `${seg.arrival_date || ''} ${seg.arrival_time || seg.arrival_time_str || ''}`.trim(),
      airline: safe(seg.carrier?.airline_name || seg.airline_name || seg.carrier?.airline_code || order.airline_name, 'N/A'),
      flightNo: safe(seg.flight_number || order.flight_number, 'N/A'),
      cabin: safe(seg.cabin_class || order.cabin_class || order.fare_class, 'Economy'),
    }));
  }
  // fallback: single segment from order fields
  return [{
    origin: safe(order.origin, ''),
    destination: safe(order.destination, ''),
    departure: order.departure_time,
    arrival: order.arrival_time,
    airline: safe(order.airline_name || order.airline_code, 'N/A'),
    flightNo: safe(order.flight_number, 'N/A'),
    cabin: safe(order.cabin_class || order.fare_class, 'Economy'),
  }];
}

function createPdfBuffer(drawFn) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    drawFn(doc);
    doc.end();
  });
}

// ─── Colors & Layout ────────────────────────────────────────────────────────

const C = {
  navy:   '#1E3A5F',
  blue:   '#2563EB',
  accent: '#0EA5E9',
  text:   '#1E293B',
  muted:  '#64748B',
  border: '#E2E8F0',
  light:  '#F8FAFC',
  white:  '#FFFFFF',
};

const PAGE_W = 595.28;
const MARGIN = 40;
const CONTENT_W = PAGE_W - MARGIN * 2;

// ─── Drawing Primitives ──────────────────────────────────────────────────────

function hline(doc, y, color = C.border) {
  doc.moveTo(MARGIN, y).lineTo(MARGIN + CONTENT_W, y)
    .strokeColor(color).lineWidth(0.5).stroke();
}

// Draw arrow using lines only (no Unicode)
function drawArrow(doc, x, y, width) {
  const arrowLen = width;
  const headSize = 5;
  doc.moveTo(x, y).lineTo(x + arrowLen - headSize, y)
    .strokeColor(C.muted).lineWidth(1).stroke();
  doc.moveTo(x + arrowLen - headSize, y - headSize / 2)
    .lineTo(x + arrowLen, y)
    .lineTo(x + arrowLen - headSize, y + headSize / 2)
    .strokeColor(C.muted).lineWidth(1).stroke();
}

// ─── Header ─────────────────────────────────────────────────────────────────

function drawTicketHeader(doc, orderNumber, issuedAt) {
  // Top accent bar
  doc.rect(0, 0, PAGE_W, 4).fill(C.accent);

  // Logo
  doc.fontSize(20).font('Helvetica-Bold').fillColor(C.navy)
    .text('Avia', MARGIN, 14, { continued: true });
  doc.fillColor(C.accent).text('Frame');
  doc.fontSize(7.5).font('Helvetica').fillColor(C.muted)
    .text('FLIGHT BOOKING PLATFORM', MARGIN, 37);

  // Booking number box (right)
  const bw = 168, bh = 36, bx = PAGE_W - MARGIN - bw, by = 12;
  doc.roundedRect(bx, by, bw, bh, 4).stroke(C.border);
  doc.fontSize(7).font('Helvetica').fillColor(C.muted)
    .text('BOOKING NUMBER', bx, by + 7, { width: bw, align: 'center' });
  doc.fontSize(13).font('Helvetica-Bold').fillColor(C.navy)
    .text(safe(orderNumber, '--'), bx, by + 18, { width: bw, align: 'center', characterSpacing: 1.5 });

  return 56; // y after header
}

// ─── Flight Segment Card ─────────────────────────────────────────────────────

/**
 * Draws one flight segment in Kiwi style.
 * Timeline: time (right-aligned) | dot-line-dot | airport name | carrier (right)
 * Returns new y.
 */
function drawSegmentCard(doc, seg, yStart) {
  const depTime = fmtTime(seg.departure);
  const depDate = fmtDate(seg.departure);
  const arrTime = fmtTime(seg.arrival);
  const arrDate = fmtDate(seg.arrival);
  const duration = calcDuration(seg.departure, seg.arrival);

  const cardH = 108;
  const pad = 12;

  // Card border + left accent
  doc.rect(MARGIN, yStart, CONTENT_W, cardH).fillAndStroke(C.white, C.border);
  doc.rect(MARGIN, yStart, 3, cardH).fill(C.accent);

  // Column x positions
  const timeX   = MARGIN + 6;
  const timeW   = 54;
  const dotX    = MARGIN + 68;
  const airportX = dotX + 12;
  const carrierX = MARGIN + CONTENT_W - 138;
  const carrierW = 133;

  const depRowY = yStart + pad;
  const arrRowY = yStart + cardH - 36;

  // ── Departure time
  doc.fontSize(18).font('Helvetica-Bold').fillColor(C.text)
    .text(depTime, timeX, depRowY, { width: timeW, align: 'right' });
  doc.fontSize(7).font('Helvetica').fillColor(C.muted)
    .text(depDate, timeX, depRowY + 21, { width: timeW, align: 'right' });

  // Dot dep
  doc.circle(dotX, depRowY + 9, 4).fillAndStroke(C.accent, C.accent);

  // Vertical line dep -> arr
  doc.moveTo(dotX, depRowY + 13).lineTo(dotX, arrRowY + 5)
    .strokeColor(C.accent).lineWidth(1.5).stroke();

  // Origin airport name
  const origIsShort = seg.origin.length <= 4;
  doc.fontSize(origIsShort ? 14 : 9).font('Helvetica-Bold').fillColor(C.text)
    .text(seg.origin.toUpperCase(), airportX, depRowY + (origIsShort ? 1 : 3),
      { width: carrierX - airportX - 6 });

  // ── Arrival time
  doc.fontSize(18).font('Helvetica-Bold').fillColor(C.text)
    .text(arrTime, timeX, arrRowY, { width: timeW, align: 'right' });
  doc.fontSize(7).font('Helvetica').fillColor(C.muted)
    .text(arrDate, timeX, arrRowY + 21, { width: timeW, align: 'right' });

  // Dot arr
  doc.circle(dotX, arrRowY + 9, 4).fillAndStroke(C.accent, C.accent);

  // Destination airport name
  const destIsShort = seg.destination.length <= 4;
  doc.fontSize(destIsShort ? 14 : 9).font('Helvetica-Bold').fillColor(C.text)
    .text(seg.destination.toUpperCase(), airportX, arrRowY + (destIsShort ? 1 : 3),
      { width: carrierX - airportX - 6 });

  // ── Carrier info (right column)
  const lh = 13;
  doc.fontSize(7).font('Helvetica').fillColor(C.muted)
    .text('Carrier:', carrierX, depRowY + 2, { width: carrierW, align: 'right' });
  doc.fontSize(8.5).font('Helvetica-Bold').fillColor(C.text)
    .text(seg.airline, carrierX, depRowY + lh, { width: carrierW, align: 'right' });
  doc.fontSize(7).font('Helvetica').fillColor(C.muted)
    .text('Flight no:', carrierX, depRowY + lh * 2 + 2, { width: carrierW, align: 'right' });
  doc.fontSize(8.5).font('Helvetica-Bold').fillColor(C.text)
    .text(`${seg.flightNo}  -  ${seg.cabin}`, carrierX, depRowY + lh * 3, { width: carrierW, align: 'right' });
  if (duration) {
    doc.fontSize(7).font('Helvetica').fillColor(C.muted)
      .text('Duration:', carrierX, depRowY + lh * 4 + 2, { width: carrierW, align: 'right' });
    doc.fontSize(8.5).font('Helvetica-Bold').fillColor(C.text)
      .text(duration, carrierX, depRowY + lh * 5, { width: carrierW, align: 'right' });
  }

  return yStart + cardH;
}

// ─── Main Ticket Builder ─────────────────────────────────────────────────────

async function buildTicketPdf({ order, passengers = [], issuance = {} }) {
  return createPdfBuffer((doc) => {
    const segments = buildSegments(order);
    const firstSeg = segments[0] || {};
    const lastSeg  = segments[segments.length - 1] || {};

    const origLabel = safe(firstSeg.origin, safe(order.origin));
    const destLabel = safe(lastSeg.destination, safe(order.destination));
    const isRoundTrip = segments.length > 1;

    const issuedAt = issuance?.issued_at
      ? formatDateShort(issuance.issued_at)
      : formatDateShort(new Date().toISOString());

    // ── 1. Header
    let y = drawTicketHeader(doc, order.order_number, issuedAt) + 10;

    // ── 2. Route title  (no Unicode arrows — drawn vector)
    const routeLabel = isRoundTrip
      ? `${origLabel}  -  ${destLabel}  (return)`
      : `${origLabel}  -  ${destLabel}`;
    doc.fontSize(16).font('Helvetica-Bold').fillColor(C.text)
      .text(routeLabel, MARGIN, y, { width: CONTENT_W });
    y += 26;

    hline(doc, y);
    y += 10;

    // ── 3. Flight segments
    segments.forEach((seg, idx) => {
      // Section label
      let sectionLabel = isRoundTrip
        ? (idx === 0 ? 'OUTBOUND' : 'RETURN')
        : 'OUTBOUND';
      const dur = calcDuration(seg.departure, seg.arrival);

      doc.fontSize(9).font('Helvetica-Bold').fillColor(C.text)
        .text(sectionLabel, MARGIN, y);
      if (dur) {
        doc.fontSize(8).font('Helvetica').fillColor(C.muted)
          .text(`Total duration: ${dur}`, MARGIN, y, { width: CONTENT_W, align: 'right' });
      }
      y += 16;

      y = drawSegmentCard(doc, seg, y) + 8;
    });

    // ── 4. Timing note (compact)
    doc.rect(MARGIN, y, CONTENT_W, 22).fill(C.light);
    hline(doc, y);
    hline(doc, y + 22);
    doc.fontSize(7).font('Helvetica').fillColor(C.muted)
      .text(
        'All times are local. Arrive at airport at least 2h before departure (domestic) or 3h (international).',
        MARGIN + 8, y + 7, { width: CONTENT_W - 16 }
      );
    y += 30;

    hline(doc, y);
    y += 10;

    // ── 5. Passengers
    doc.fontSize(11).font('Helvetica-Bold').fillColor(C.text)
      .text('Passengers', MARGIN, y);
    y += 18;

    if (passengers.length === 0) {
      doc.rect(MARGIN, y, CONTENT_W, 28).fillAndStroke(C.white, C.border);
      doc.fontSize(9).font('Helvetica').fillColor(C.muted)
        .text(safe(order.contact_email), MARGIN + 10, y + 9, { width: CONTENT_W - 20 });
      y += 36;
    } else {
      passengers.slice(0, 8).forEach(p => {
        const name = `${safe(p.last_name, '')} ${safe(p.first_name, '')}`.trim().toUpperCase() || 'PASSENGER';
        const type = safe(p.passenger_type, 'ADT');
        const h = 30;
        doc.rect(MARGIN, y, CONTENT_W, h).fillAndStroke(C.white, C.border);

        // person icon (circles)
        doc.circle(MARGIN + 14, y + 11, 4).fill(C.muted);
        doc.roundedRect(MARGIN + 10, y + 17, 8, 7, 2).fill(C.muted);

        doc.fontSize(9.5).font('Helvetica-Bold').fillColor(C.text)
          .text(name, MARGIN + 28, y + 9, { width: CONTENT_W - 100 });
        doc.fontSize(8).font('Helvetica').fillColor(C.muted)
          .text(type, MARGIN + CONTENT_W - 50, y + 11, { width: 44, align: 'right' });

        // PNR if available
        const pnr = safe(issuance.pnr || order.drct_order_id, null);
        if (pnr && pnr !== 'N/A') {
          doc.fontSize(7.5).font('Helvetica').fillColor(C.muted)
            .text('PNR:', MARGIN + 28, y + 20, { continued: true })
            .font('Helvetica-Bold').fillColor(C.text)
            .text(` ${pnr}`, { characterSpacing: 0.5 });
        }

        y += h + 4;
      });
    }

    y += 4;
    hline(doc, y);
    y += 10;

    // ── 6. Fare
    doc.rect(MARGIN, y, CONTENT_W, 46).fillAndStroke(C.light, C.border);
    doc.fontSize(7).font('Helvetica').fillColor(C.muted)
      .text('TOTAL FARE', MARGIN + 12, y + 9);
    doc.fontSize(18).font('Helvetica-Bold').fillColor(C.navy)
      .text(toMoney(order.total_price, order.currency || 'UAH'), MARGIN + 12, y + 20);

    const status = String(order.payment_status || order.status || 'CONFIRMED').toUpperCase();
    const bw = 90, bx = MARGIN + CONTENT_W - bw - 10;
    doc.roundedRect(bx, y + 12, bw, 22, 4).fill(C.accent);
    doc.fontSize(8.5).font('Helvetica-Bold').fillColor(C.white)
      .text(status, bx, y + 18, { width: bw, align: 'center' });
    y += 46;

    // ── 7. Contact bar
    doc.rect(MARGIN, y, CONTENT_W, 28).fillAndStroke(C.navy, C.navy);
    doc.fontSize(7).font('Helvetica').fillColor('#93C5FD')
      .text('CONTACT', MARGIN + 12, y + 7);
    const parts = [safe(order.contact_email, null), safe(order.contact_phone, null)].filter(Boolean);
    doc.fontSize(8.5).font('Helvetica-Bold').fillColor(C.white)
      .text(parts.join('   |   '), MARGIN + 12, y + 17, { width: CONTENT_W - 24 });
    y += 28;

    y += 12;

    // ── 8. Footer
    hline(doc, y);
    doc.fontSize(6.5).font('Helvetica').fillColor(C.muted)
      .text(
        'This is an electronic ticket. Please present this document along with a valid photo ID at check-in.',
        MARGIN, y + 5, { width: CONTENT_W - 130 }
      );
    doc.fontSize(6.5).font('Helvetica').fillColor(C.muted)
      .text(`Page 1/1  -  last updated on ${issuedAt}`, MARGIN, y + 5,
        { width: CONTENT_W, align: 'right' });
  });
}

// ─── Invoice PDF ─────────────────────────────────────────────────────────────

async function buildInvoicePdf({ invoice, agency, orders = [] }) {
  return createPdfBuffer((doc) => {
    doc.fontSize(20).text('INVOICE', { align: 'left' });
    doc.moveDown(0.5);
    doc.fontSize(11);
    doc.text(`Invoice #: ${safe(invoice.invoice_number)}`);
    doc.text(`Status: ${safe(invoice.status)}`);
    doc.text(`Period: ${safe(invoice.period_from)} -> ${safe(invoice.period_to)}`);
    doc.text(`Created: ${formatDateTime(invoice.created_at)}`);

    doc.moveDown(1);
    doc.fontSize(14).text('Agency');
    doc.fontSize(11);
    doc.text(`Name: ${safe(agency?.name)}`);
    doc.text(`Email: ${safe(agency?.contact_email)}`);
    doc.text(`Phone: ${safe(agency?.contact_phone)}`);
    doc.text(`Domain: ${safe(agency?.domain)}`);

    const bank = invoice.bank_details || agency?.settings?.bank_details || {};
    doc.moveDown(1);
    doc.fontSize(14).text('Bank Details');
    doc.fontSize(11);
    doc.text(`Bank: ${safe(bank.bank_name)}`);
    doc.text(`Account: ${safe(bank.bank_account)}`);

    doc.moveDown(1);
    doc.fontSize(14).text('Totals');
    doc.fontSize(11);
    doc.text(`Subtotal: ${toMoney(invoice.subtotal, invoice.currency)}`);
    doc.text(`Markup: ${toMoney(invoice.markup_total, invoice.currency)}`);
    doc.text(`Total: ${toMoney(invoice.total, invoice.currency)}`);

    doc.moveDown(1);
    doc.fontSize(14).text(`Orders (${orders.length})`);
    doc.fontSize(10);

    if (orders.length === 0) {
      doc.text('No linked orders in this invoice.');
      return;
    }

    orders.slice(0, 120).forEach((order, idx) => {
      doc.text(
        `${idx + 1}. ${safe(order.order_number, order.id)} | ${safe(order.origin)} -> ${safe(order.destination)} | ${toMoney(order.total_price, order.currency)} | ${safe(order.status)}`
      );
    });
  });
}

module.exports = { buildInvoicePdf, buildTicketPdf };
