'use strict';

// Read-only diagnostic: search + price a round-trip offer directly against DRCT
// (bypassing the Partner API HTTP layer) and print DRCT's raw price-response
// passenger objects verbatim, so we can see the exact traveler id format DRCT
// expects at order-create time. Does NOT create an order - safe to run anytime.
//
// Run with: railway run node backend/scripts/debug-drct-price-passengers.js

const drctClient = require('../src/services/drctDirectClient');

const departureDate = process.env.TEST_DEPARTURE_DATE || '2026-10-25';
const returnDate = process.env.TEST_RETURN_DATE || '2026-11-02';

async function main() {
  const search = await drctClient.searchOffers({
    origin: 'LON',
    destination: 'MIL',
    depart_date: departureDate,
    return_date: returnDate,
    adults: 1,
    children: 1,
    infants: 1,
    cabin_class: 'economy',
  }, { sandbox: true });

  const offers = search.offers || [];
  if (!offers.length) throw new Error('No offers returned from search');
  const offer = offers[0];
  console.log('=== search: first offer_id ===');
  console.log(offer.offer_id);

  const priced = await drctClient.priceOffer({
    offer_id: offer.offer_id,
    passengers: [
      { id: 'T1', type: 'ADT' },
      { id: 'T2', type: 'CHD' },
      { id: 'T3', type: 'INF' },
    ],
  }, { sandbox: true });

  console.log('=== price response: raw.passengers (DRCT-assigned traveler objects) ===');
  console.log(JSON.stringify(priced.raw?.passengers ?? priced.passengers ?? 'NONE RETURNED', null, 2));

  console.log('=== price response: full raw payload keys (for context) ===');
  console.log(Object.keys(priced.raw || {}));
}

main().catch((error) => {
  console.error('FAILED:', error.message);
  process.exitCode = 1;
});
