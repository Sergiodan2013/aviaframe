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

module.exports = {
  buildInvoicePdf,
  buildTicketPdf
};
