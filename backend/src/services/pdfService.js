const PDFDocument = require('pdfkit');

function toMoney(value, currency = 'USD') {
  const amount = Number(value || 0);
  return `${amount.toFixed(2)} ${currency}`;
}

function safe(v, fallback = 'N/A') {
  if (v === null || v === undefined || v === '') return fallback;
  return String(v);
}

function formatDateTime(v) {
  if (!v) return 'N/A';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toISOString().replace('T', ' ').slice(0, 16);
}

function createPdfBuffer(drawFn) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    drawFn(doc);
    doc.end();
  });
}

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

function formatDateShort(v) {
  if (!v) return 'N/A';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTimeOnly(v) {
  if (!v) return '--:--';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v).slice(0, 5);
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function flightDuration(dep, arr) {
  if (!dep || !arr) return '';
  const d1 = new Date(dep);
  const d2 = new Date(arr);
  if (Number.isNaN(d1.getTime()) || Number.isNaN(d2.getTime())) return '';
  const mins = Math.round((d2 - d1) / 60000);
  if (mins <= 0) return '';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}

// Colors
const C = {
  navy:      '#1E3A5F',
  blue:      '#2563EB',
  lightBlue: '#DBEAFE',
  gray:      '#F1F5F9',
  border:    '#CBD5E1',
  text:      '#1E293B',
  muted:     '#64748B',
  white:     '#FFFFFF',
  accent:    '#0EA5E9',
};

const PAGE_W = 595.28; // A4 width in points
const MARGIN = 40;
const CONTENT_W = PAGE_W - MARGIN * 2;

function drawHeader(doc) {
  // Dark navy header bar
  doc.rect(0, 0, PAGE_W, 80).fill(C.navy);

  // Plane icon (simple triangle + tail)
  const px = MARGIN + 8;
  const py = 28;
  doc.save();
  doc.fillColor(C.white).opacity(0.9);
  doc.moveTo(px, py + 12).lineTo(px + 28, py + 4).lineTo(px + 28, py + 20).closePath().fill();
  doc.moveTo(px + 10, py + 20).lineTo(px + 18, py + 28).lineTo(px + 22, py + 24).lineTo(px + 16, py + 20).closePath().fill();
  doc.restore();

  // "AviaFrame" wordmark
  doc.fillColor(C.white).opacity(1).fontSize(22).font('Helvetica-Bold')
    .text('Avia', px + 36, 24, { continued: true })
    .fillColor(C.accent).text('Frame');
  doc.fillColor(C.white).opacity(0.7).fontSize(9).font('Helvetica')
    .text('WHITE-LABEL FLIGHT BOOKING', px + 36, 51);

  // "ELECTRONIC TICKET" badge on right
  doc.roundedRect(PAGE_W - MARGIN - 150, 22, 150, 36, 4).fill(C.blue);
  doc.fillColor(C.white).opacity(1).fontSize(11).font('Helvetica-Bold')
    .text('ELECTRONIC TICKET', PAGE_W - MARGIN - 144, 29, { width: 138, align: 'center' });
  doc.fillColor(C.white).opacity(0.7).fontSize(8).font('Helvetica')
    .text('ITINERARY RECEIPT', PAGE_W - MARGIN - 144, 44, { width: 138, align: 'center' });
}

function drawBookingRef(doc, order, issuance) {
  const y = 96;
  // Light gray background strip
  doc.rect(MARGIN, y, CONTENT_W, 44).fillAndStroke(C.gray, C.border);

  const pnr = safe(issuance.pnr || order.drct_order_id);
  const ticketNum = safe(issuance.ticket_number || issuance.id);
  const orderNum = safe(order.order_number);
  const issuedAt = formatDateShort(issuance.issued_at || new Date().toISOString());

  // Four columns
  const colW = CONTENT_W / 4;
  const labels = ['BOOKING REF', 'TICKET NUMBER', 'ORDER NUMBER', 'ISSUED DATE'];
  const values = [pnr, ticketNum, orderNum, issuedAt];

  labels.forEach((lbl, i) => {
    const x = MARGIN + colW * i + 12;
    doc.fillColor(C.muted).fontSize(7).font('Helvetica').text(lbl, x, y + 7, { width: colW - 16 });
    doc.fillColor(C.text).fontSize(11).font('Helvetica-Bold').text(values[i], x, y + 18, { width: colW - 16 });
    if (i < 3) {
      doc.moveTo(MARGIN + colW * (i + 1), y + 8).lineTo(MARGIN + colW * (i + 1), y + 36).strokeColor(C.border).lineWidth(1).stroke();
    }
  });
}

function drawFlightSegment(doc, order, yStart) {
  const segH = 130;
  // Card with left blue accent bar
  doc.rect(MARGIN, yStart, CONTENT_W, segH).fillAndStroke(C.white, C.border);
  doc.rect(MARGIN, yStart, 4, segH).fill(C.blue);

  // Section label
  doc.fillColor(C.blue).fontSize(8).font('Helvetica-Bold')
    .text('FLIGHT DETAILS', MARGIN + 16, yStart + 10);

  const orig = (safe(order.origin) !== 'N/A' ? safe(order.origin) : '???').toUpperCase();
  const dest = (safe(order.destination) !== 'N/A' ? safe(order.destination) : '???').toUpperCase();
  const depTime = formatTimeOnly(order.departure_time);
  const arrTime = formatTimeOnly(order.arrival_time);
  const depDate = formatDateShort(order.departure_time);
  const arrDate = formatDateShort(order.arrival_time);
  const duration = flightDuration(order.departure_time, order.arrival_time);
  const airline = safe(order.airline_name || order.airline_code);
  const flightNo = safe(order.flight_number);
  const cabin = safe(order.cabin_class || order.fare_class, 'Economy');

  // Departure airport code (large)
  doc.fillColor(C.navy).fontSize(38).font('Helvetica-Bold').text(orig, MARGIN + 16, yStart + 28, { width: 100 });
  doc.fillColor(C.muted).fontSize(9).font('Helvetica').text(depDate, MARGIN + 16, yStart + 70, { width: 100 });
  doc.fillColor(C.text).fontSize(18).font('Helvetica-Bold').text(depTime, MARGIN + 16, yStart + 84, { width: 100 });

  // Arrow / flight path in center
  const cx = MARGIN + CONTENT_W / 2;
  const arrowY = yStart + 54;
  const lineLen = 120;
  doc.moveTo(cx - lineLen / 2, arrowY).lineTo(cx + lineLen / 2, arrowY).strokeColor(C.border).lineWidth(1.5).stroke();
  // Arrow head
  doc.moveTo(cx + lineLen / 2 - 8, arrowY - 5).lineTo(cx + lineLen / 2, arrowY).lineTo(cx + lineLen / 2 - 8, arrowY + 5).strokeColor(C.muted).lineWidth(1.5).stroke();
  // Plane dot
  doc.circle(cx, arrowY, 4).fillAndStroke(C.blue, C.blue);

  // Duration below arrow
  if (duration) {
    doc.fillColor(C.muted).fontSize(8).font('Helvetica').text(duration, cx - 20, arrowY + 8, { width: 40, align: 'center' });
  }

  // Airline + flight number above arrow
  doc.fillColor(C.muted).fontSize(8).font('Helvetica')
    .text(`${airline}  ·  ${flightNo}  ·  ${cabin}`, cx - 90, yStart + 30, { width: 180, align: 'center' });

  // Arrival airport code (large)
  const rightX = MARGIN + CONTENT_W - 116;
  doc.fillColor(C.navy).fontSize(38).font('Helvetica-Bold').text(dest, rightX, yStart + 28, { width: 100, align: 'right' });
  doc.fillColor(C.muted).fontSize(9).font('Helvetica').text(arrDate, rightX, yStart + 70, { width: 100, align: 'right' });
  doc.fillColor(C.text).fontSize(18).font('Helvetica-Bold').text(arrTime, rightX, yStart + 84, { width: 100, align: 'right' });

  // Dashed tear line at bottom of card
  doc.save();
  doc.dash(4, { space: 4 });
  doc.moveTo(MARGIN, yStart + segH - 1).lineTo(MARGIN + CONTENT_W, yStart + segH - 1).strokeColor(C.border).lineWidth(1).stroke();
  doc.restore();

  return yStart + segH;
}

function drawPassengers(doc, passengers, order, yStart) {
  const rowH = 22;
  const headerH = 28;
  const tableH = headerH + Math.max(passengers.length, 1) * rowH + 8;

  doc.rect(MARGIN, yStart, CONTENT_W, tableH).fillAndStroke(C.white, C.border);
  doc.rect(MARGIN, yStart, 4, tableH).fill(C.accent);

  // Table header
  doc.rect(MARGIN + 4, yStart, CONTENT_W - 4, headerH).fill(C.gray);
  doc.fillColor(C.blue).fontSize(8).font('Helvetica-Bold').text('PASSENGERS', MARGIN + 16, yStart + 10);
  doc.fillColor(C.muted).fontSize(7).font('Helvetica')
    .text('NAME', MARGIN + 16, yStart + 19, { width: 200 })
    .text('TYPE', MARGIN + 240, yStart + 19, { width: 80 })
    .text('DOCUMENT', MARGIN + 340, yStart + 19, { width: 140 });

  if (passengers.length === 0) {
    doc.fillColor(C.text).fontSize(10).font('Helvetica')
      .text(`${safe(order.contact_email)}`, MARGIN + 16, yStart + headerH + 6, { width: CONTENT_W - 32 });
  } else {
    passengers.slice(0, 8).forEach((p, i) => {
      const ry = yStart + headerH + i * rowH + 4;
      if (i % 2 === 0) doc.rect(MARGIN + 4, ry - 2, CONTENT_W - 4, rowH).fill('#F8FAFC');
      const name = `${safe(p.last_name, '')} ${safe(p.first_name, '')}`.trim() || 'N/A';
      const docNum = safe(p.document_number || p.passport_number, '—');
      doc.fillColor(C.text).fontSize(10).font('Helvetica-Bold').text(name.toUpperCase(), MARGIN + 16, ry + 2, { width: 200 });
      doc.fillColor(C.muted).fontSize(9).font('Helvetica')
        .text(safe(p.passenger_type, 'ADT'), MARGIN + 240, ry + 2, { width: 80 })
        .text(docNum, MARGIN + 340, ry + 2, { width: 140 });
    });
  }

  return yStart + tableH;
}

function drawFare(doc, order, yStart) {
  const h = 64;
  doc.rect(MARGIN, yStart, CONTENT_W, h).fillAndStroke(C.gray, C.border);

  // Total amount prominently
  doc.fillColor(C.muted).fontSize(8).font('Helvetica').text('TOTAL FARE', MARGIN + 16, yStart + 10);
  doc.fillColor(C.navy).fontSize(26).font('Helvetica-Bold')
    .text(toMoney(order.total_price, order.currency || 'USD'), MARGIN + 16, yStart + 22);

  // Right side: payment status
  const statusText = String(order.payment_status || order.status || 'paid').toUpperCase();
  doc.roundedRect(PAGE_W - MARGIN - 120, yStart + 16, 120, 30, 4).fill(C.blue);
  doc.fillColor(C.white).fontSize(10).font('Helvetica-Bold')
    .text(statusText, PAGE_W - MARGIN - 114, yStart + 24, { width: 108, align: 'center' });

  return yStart + h;
}

function drawContactBar(doc, order, yStart) {
  const h = 36;
  doc.rect(MARGIN, yStart, CONTENT_W, h).fillAndStroke(C.navy, C.navy);
  doc.fillColor(C.white).opacity(0.7).fontSize(8).font('Helvetica').text('CONTACT', MARGIN + 16, yStart + 8);
  doc.fillColor(C.white).opacity(1).fontSize(9).font('Helvetica-Bold')
    .text(safe(order.contact_email), MARGIN + 16, yStart + 19, { continued: true })
    .font('Helvetica').fillColor(C.white).opacity(0.7)
    .text(`   ·   ${safe(order.contact_phone)}`, { continued: false });
  return yStart + h;
}

function drawFooter(doc, yStart) {
  const y = Math.max(yStart + 20, 760);
  doc.moveTo(MARGIN, y).lineTo(MARGIN + CONTENT_W, y).strokeColor(C.border).lineWidth(0.5).stroke();
  doc.fillColor(C.muted).fontSize(7).font('Helvetica')
    .text(
      'This is an electronic ticket. Please present this document along with a valid photo ID at check-in. ' +
      'This document is generated automatically by AviaFrame Portal.',
      MARGIN, y + 6, { width: CONTENT_W, align: 'center' }
    );
}

async function buildTicketPdf({ order, passengers = [], issuance = {} }) {
  return createPdfBuffer((doc) => {
    drawHeader(doc);
    drawBookingRef(doc, order, issuance);

    let y = 158;

    // Flight segment card
    y = drawFlightSegment(doc, order, y) + 12;

    // Passengers table
    y = drawPassengers(doc, passengers, order, y) + 12;

    // Fare row
    y = drawFare(doc, order, y) + 12;

    // Contact bar
    y = drawContactBar(doc, order, y);

    // Footer
    drawFooter(doc, y);
  });
}

module.exports = {
  buildInvoicePdf,
  buildTicketPdf
};
