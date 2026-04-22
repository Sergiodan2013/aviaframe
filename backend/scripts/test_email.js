#!/usr/bin/env node
process.env.RESEND_API_KEY = process.env.RESEND_API_KEY || 're_G9RtqS1d_PjAxraZCFHDc4MnLX8jcTTZq';
process.env.EMAIL_FROM = process.env.EMAIL_FROM || 'onboarding@resend.dev';

const { buildTicketPdf } = require('../src/services/pdfService');
const { sendTicketEmail } = require('../src/services/emailService');

async function main() {
  // Round-trip order with full airport names (as stored in real DB)
  const order = {
    id: 'test-order-001',
    order_number: 'O8BHPZ',
    origin: 'Amsterdam Airport Schiphol',
    destination: 'Franz Josef Strauss Airport',
    departure_time: '2026-03-28T07:05:00Z',
    arrival_time: '2026-03-28T09:15:00Z',
    airline_name: 'Austrian Airlines',
    airline_code: 'OS',
    flight_number: 'OS317',
    cabin_class: 'Economy',
    total_price: 13965,
    currency: 'UAH',
    contact_email: 'sergiodan2013@gmail.com',
    contact_phone: '+380676918012',
    payment_status: 'paid',
    status: 'confirmed',
    drct_order_id: null,
    agency_id: null,
    // Round-trip segments stored in raw_offer_data
    raw_offer_data: {
      offer: {
        segments: [
          {
            origin: 'Amsterdam Airport Schiphol',
            destination: 'Franz Josef Strauss Airport',
            departure: '2026-03-28T07:05:00Z',
            arrival:   '2026-03-28T09:15:00Z',
            airline_name: 'Austrian Airlines',
            flight_number: 'OS317',
            cabin_class: 'Economy',
          },
          {
            origin: 'Franz Josef Strauss Airport',
            destination: 'Amsterdam Airport Schiphol',
            departure: '2026-03-29T12:25:00Z',
            arrival:   '2026-03-29T14:10:00Z',
            airline_name: 'Austrian Airlines',
            flight_number: 'OS318',
            cabin_class: 'Economy',
          }
        ]
      }
    }
  };

  const passengers = [
    { first_name: 'SERGII', last_name: 'DANYLIUK', passenger_type: 'ADT' }
  ];

  const issuance = {
    ticket_number: 'ETK-O8BHPZ',
    pnr: 'P2C3TK',
    issued_at: new Date().toISOString(),
  };

  console.log('Generating PDF (round-trip)...');
  const pdfBuffer = await buildTicketPdf({ order, passengers, issuance });
  console.log(`PDF generated: ${pdfBuffer.length} bytes`);

  // Save PDF locally for preview
  require('fs').writeFileSync('/tmp/test-ticket.pdf', pdfBuffer);
  console.log('PDF saved to /tmp/test-ticket.pdf');

  console.log('Sending email to sergiodan2013@gmail.com...');
  const result = await sendTicketEmail({
    to: 'sergiodan2013@gmail.com',
    order,
    passengers,
    issuance,
    attachment: { fileName: 'ticket-O8BHPZ.pdf', buffer: pdfBuffer }
  });

  if (result.sent) {
    console.log('Email sent successfully!');
  } else {
    console.error('Email failed:', result.error);
    process.exit(1);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
