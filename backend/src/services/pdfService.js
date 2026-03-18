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

async function buildTicketPdf({ order, passengers = [], issuance = {} }) {
  return createPdfBuffer((doc) => {
    doc.fontSize(20).text('E-TICKET / ITINERARY RECEIPT', { align: 'left' });
    doc.moveDown(0.5);
    doc.fontSize(11);
    doc.text(`Order #: ${safe(order.order_number)}`);
    doc.text(`Ticket #: ${safe(issuance.ticket_number || issuance.id)}`);
    doc.text(`PNR: ${safe(issuance.pnr || order.drct_order_id)}`);
    doc.text(`Issued at: ${formatDateTime(issuance.issued_at || new Date().toISOString())}`);

    doc.moveDown(1);
    doc.fontSize(14).text('Passenger & Contact');
    doc.fontSize(11);
    doc.text(`Email: ${safe(order.contact_email)}`);
    doc.text(`Phone: ${safe(order.contact_phone)}`);

    if (passengers.length > 0) {
      passengers.slice(0, 10).forEach((p, idx) => {
        doc.text(`${idx + 1}. ${safe(p.first_name)} ${safe(p.last_name)} (${safe(p.passenger_type, 'ADT')})`);
      });
    } else {
      doc.text('Passenger list not provided.');
    }

    doc.moveDown(1);
    doc.fontSize(14).text('Flight');
    doc.fontSize(11);
    doc.text(`Route: ${safe(order.origin)} -> ${safe(order.destination)}`);
    doc.text(`Airline: ${safe(order.airline_name, order.airline_code)}`);
    doc.text(`Flight #: ${safe(order.flight_number)}`);
    doc.text(`Departure: ${safe(order.departure_time)}`);
    doc.text(`Arrival: ${safe(order.arrival_time)}`);

    doc.moveDown(1);
    doc.fontSize(14).text('Fare');
    doc.fontSize(11);
    doc.text(`Total: ${toMoney(order.total_price, order.currency)}`);
    doc.text('This document is generated automatically by Aviaframe Portal.');
  });
}

async function buildItineraryPdf({ order, passengers = [], agency, outbound, returnFlight }) {
  const agencyName = agency?.name || 'Travel Agency';
  const bankDetails = agency?.settings?.bank_details || {};
  const paymentMethod = order.payment_method || 'bank_transfer';

  // Colors
  const NAVY = '#1a1a2e';
  const BLUE = '#2563eb';
  const BLUE_LIGHT = '#dbeafe';
  const BLUE_MID = '#93c5fd';
  const AMBER = '#d97706';
  const AMBER_LIGHT = '#fffbeb';
  const AMBER_DARK = '#92400e';
  const GRAY = '#64748b';
  const SLATE = '#f1f5f9';
  const WHITE = '#ffffff';
  const GREEN = '#16a34a';

  return createPdfBuffer((doc) => {
    const W = doc.page.width;   // 595
    const M = 36;               // margin
    const UW = W - M * 2;      // usable width 523
    const ROW = 19;             // table row height

    // ── HEADER ────────────────────────────────────────────────────────────
    doc.rect(0, 0, W, 56).fill(NAVY);
    doc.rect(0, 52, W, 4).fill(BLUE);

    doc.fillColor(WHITE).fontSize(15).font('Helvetica-Bold')
      .text(agencyName, M, 14, { lineBreak: false });
    doc.fillColor(BLUE_MID).fontSize(8).font('Helvetica')
      .text('Powered by Aviaframe', M, 33, { lineBreak: false });

    // Order badge top-right
    doc.fillColor(BLUE_MID).fontSize(7).font('Helvetica')
      .text('BOOKING CONFIRMATION', W - M - 130, 14, { width: 130, align: 'right', lineBreak: false });
    doc.fillColor(WHITE).fontSize(11).font('Helvetica-Bold')
      .text(`#${safe(order.order_number)}`, W - M - 130, 26, { width: 130, align: 'right', lineBreak: false });

    let y = 66;

    // ── STATUS BADGE ──────────────────────────────────────────────────────
    doc.rect(M, y, UW, 24).fill(BLUE_LIGHT);
    doc.rect(M, y, 4, 24).fill(BLUE);
    doc.fillColor(BLUE).fontSize(8).font('Helvetica-Bold')
      .text('PAYMENT PENDING — Ticket will be issued after payment is received', M + 10, y + 8, { width: UW - 20, lineBreak: false });
    y += 30;

    // ── FLIGHT BLOCK HELPER ───────────────────────────────────────────────
    const drawFlightBlock = (fl, label) => {
      if (!fl) return;

      // Section label
      doc.fillColor(BLUE).fontSize(7.5).font('Helvetica-Bold')
        .text(label, M, y, { lineBreak: false });
      doc.moveTo(M + (label.length * 4.5), y + 4).lineTo(W - M, y + 4)
        .strokeColor(BLUE_LIGHT).lineWidth(1).stroke();
      y += 13;

      // Route card
      const cardH = 54;
      doc.rect(M, y, UW, cardH).fill(SLATE);
      doc.rect(M, y, 3, cardH).fill(BLUE);

      // FROM
      doc.fillColor(GRAY).fontSize(6.5).font('Helvetica')
        .text('FROM', M + 10, y + 6, { lineBreak: false });
      doc.fillColor(NAVY).fontSize(20).font('Helvetica-Bold')
        .text(fl.origin_code || '---', M + 10, y + 15, { lineBreak: false });
      const originCity = (fl.origin_name || '').replace(' Airport', '').replace(' International', '').slice(0, 22);
      doc.fillColor(GRAY).fontSize(6.5).font('Helvetica')
        .text(originCity, M + 10, y + 39, { width: 160, lineBreak: false });

      // Arrow + date
      const midX = M + UW / 2 - 30;
      doc.fillColor(BLUE).fontSize(16).font('Helvetica-Bold')
        .text('→', midX, y + 18, { width: 60, align: 'center', lineBreak: false });
      const depDateStr = fl.departure ? String(fl.departure).slice(0, 10) : '';
      doc.fillColor(GRAY).fontSize(6.5).font('Helvetica')
        .text(depDateStr, midX - 10, y + 38, { width: 80, align: 'center', lineBreak: false });

      // TO
      const toX = M + UW / 2 + 40;
      doc.fillColor(GRAY).fontSize(6.5).font('Helvetica')
        .text('TO', toX, y + 6, { lineBreak: false });
      doc.fillColor(NAVY).fontSize(20).font('Helvetica-Bold')
        .text(fl.destination_code || '---', toX, y + 15, { lineBreak: false });
      const destCity = (fl.destination_name || '').replace(' Airport', '').replace(' International', '').slice(0, 22);
      doc.fillColor(GRAY).fontSize(6.5).font('Helvetica')
        .text(destCity, toX, y + 39, { width: 160, lineBreak: false });

      y += cardH + 3;

      // Flight details table
      const tableRows = [
        ['Airline', `${safe(fl.airline_name)} (${safe(fl.airline_code)})`],
        ['Flight No.', safe(fl.flight_number)],
        ['Departure', fl.departure ? String(fl.departure).slice(0, 16) : 'N/A'],
        ['Arrival', fl.arrival ? String(fl.arrival).slice(0, 16) : 'N/A'],
        ['Route', fl.stops === 0 ? 'Non-stop' : `${fl.stops} stop(s)`],
      ];
      tableRows.forEach(([lbl, val], i) => {
        doc.rect(M, y, UW, ROW).fill(i % 2 === 0 ? SLATE : WHITE);
        doc.fillColor(GRAY).fontSize(7.5).font('Helvetica')
          .text(lbl, M + 8, y + 6, { width: 90, lineBreak: false });
        doc.fillColor(NAVY).fontSize(7.5).font('Helvetica-Bold')
          .text(val, M + 105, y + 6, { width: UW - 115, lineBreak: false });
        y += ROW;
      });
      y += 8;
    };

    // Draw flights
    drawFlightBlock(outbound || {
      origin_code: order.origin, origin_name: '', destination_code: order.destination, destination_name: '',
      departure: order.departure_time, arrival: order.arrival_time,
      airline_name: order.airline_name, airline_code: order.airline_code,
      flight_number: order.flight_number, stops: 0,
    }, 'OUTBOUND FLIGHT');

    if (returnFlight) {
      drawFlightBlock(returnFlight, 'RETURN FLIGHT');
    }

    // ── PASSENGERS ────────────────────────────────────────────────────────
    doc.fillColor(BLUE).fontSize(7.5).font('Helvetica-Bold')
      .text('PASSENGERS', M, y, { lineBreak: false });
    doc.moveTo(M + 62, y + 4).lineTo(W - M, y + 4).strokeColor(BLUE_LIGHT).lineWidth(1).stroke();
    y += 13;

    // Table header
    doc.rect(M, y, UW, ROW).fill(NAVY);
    doc.fillColor(WHITE).fontSize(7.5).font('Helvetica-Bold')
      .text('NAME', M + 8, y + 6, { lineBreak: false })
      .text('TYPE', M + 200, y + 6, { lineBreak: false })
      .text('PASSPORT', M + 265, y + 6, { lineBreak: false })
      .text('DOB', M + 385, y + 6, { lineBreak: false });
    y += ROW;

    const paxList = passengers.length > 0 ? passengers : [];
    if (paxList.length === 0) {
      doc.rect(M, y, UW, ROW).fill(SLATE);
      doc.fillColor(GRAY).fontSize(7.5).font('Helvetica')
        .text('—', M + 8, y + 6, { lineBreak: false });
      y += ROW;
    } else {
      paxList.forEach((p, i) => {
        doc.rect(M, y, UW, ROW).fill(i % 2 === 0 ? SLATE : WHITE);
        const name = `${safe(p.first_name)} ${safe(p.last_name)}`.trim();
        doc.fillColor(NAVY).fontSize(7.5).font('Helvetica')
          .text(name, M + 8, y + 6, { width: 185, lineBreak: false });
        doc.fillColor(GRAY).fontSize(7.5)
          .text(safe(p.passenger_type, 'ADT'), M + 200, y + 6, { width: 58, lineBreak: false });
        doc.fillColor(NAVY).fontSize(7.5)
          .text(safe(p.passport_number, '—'), M + 265, y + 6, { width: 110, lineBreak: false });
        doc.fillColor(GRAY).fontSize(7.5)
          .text(safe(p.date_of_birth, '—'), M + 385, y + 6, { width: 100, lineBreak: false });
        y += ROW;
      });
    }
    y += 10;

    // ── PAYMENT ───────────────────────────────────────────────────────────
    doc.fillColor(BLUE).fontSize(7.5).font('Helvetica-Bold')
      .text('PAYMENT', M, y, { lineBreak: false });
    doc.moveTo(M + 46, y + 4).lineTo(W - M, y + 4).strokeColor(BLUE_LIGHT).lineWidth(1).stroke();
    y += 13;

    const payRows = [];
    payRows.push(['Total Amount', toMoney(order.total_price, order.currency)]);
    payRows.push(['Reference', safe(order.order_number)]);
    if (paymentMethod === 'cash') {
      payRows.push(['Method', 'Cash at office']);
    } else if (bankDetails.bank_name || bankDetails.iban) {
      if (bankDetails.bank_name) payRows.push(['Bank', bankDetails.bank_name]);
      if (bankDetails.iban) payRows.push(['IBAN', bankDetails.iban]);
      if (bankDetails.swift_bic || bankDetails.swift) payRows.push(['SWIFT/BIC', bankDetails.swift_bic || bankDetails.swift]);
      if (bankDetails.bank_account) payRows.push(['Account', bankDetails.bank_account]);
      payRows.push(['Method', 'Bank Transfer']);
    } else {
      payRows.push(['Method', 'Agent will provide instructions']);
    }

    payRows.forEach(([lbl, val], i) => {
      const isTotal = lbl === 'Total Amount';
      doc.rect(M, y, UW, ROW).fill(isTotal ? NAVY : (i % 2 === 0 ? SLATE : WHITE));
      doc.fillColor(isTotal ? BLUE_MID : GRAY).fontSize(7.5).font('Helvetica-Bold')
        .text(lbl, M + 8, y + 6, { width: 90, lineBreak: false });
      doc.fillColor(isTotal ? WHITE : NAVY).fontSize(isTotal ? 9 : 7.5).font(isTotal ? 'Helvetica-Bold' : 'Helvetica')
        .text(val, M + 105, y + (isTotal ? 5 : 6), { width: UW - 115, lineBreak: false });
      y += ROW;
    });
    y += 10;

    // ── CONTACT ───────────────────────────────────────────────────────────
    if (order.contact_email || order.contact_phone) {
      [['Contact Email', safe(order.contact_email)], ['Phone', safe(order.contact_phone)]].forEach(([lbl, val], i) => {
        if (val === 'N/A') return;
        doc.rect(M, y, UW, ROW).fill(i % 2 === 0 ? SLATE : WHITE);
        doc.fillColor(GRAY).fontSize(7.5).font('Helvetica')
          .text(lbl, M + 8, y + 6, { width: 90, lineBreak: false });
        doc.fillColor(NAVY).fontSize(7.5).font('Helvetica-Bold')
          .text(val, M + 105, y + 6, { width: UW - 115, lineBreak: false });
        y += ROW;
      });
      y += 8;
    }

    // ── FOOTER ────────────────────────────────────────────────────────────
    doc.rect(M, y, UW, 1).fill(BLUE_LIGHT);
    y += 7;
    doc.fillColor(GRAY).fontSize(6.5).font('Helvetica')
      .text('This document is a booking confirmation, not a ticket. Your e-ticket will be issued after full payment is received and confirmed.', M, y, { width: UW, align: 'center', lineBreak: false });
    y += 11;
    doc.fillColor('#94a3b8').fontSize(6).font('Helvetica')
      .text(`Generated by Aviaframe · ${new Date().toISOString().slice(0, 10)} · aviaframe.com`, M, y, { width: UW, align: 'center', lineBreak: false });
  });
}

module.exports = {
  buildInvoicePdf,
  buildTicketPdf,
  buildItineraryPdf,
};
