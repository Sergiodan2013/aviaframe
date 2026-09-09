import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPartnerSearchPayload,
  buildSandboxOrderPayload,
  buildSearchPassengers,
} from './partnerApiTester.js';

test('builds a round-trip request with ADT, CHD and INF passengers', () => {
  const payload = buildPartnerSearchPayload({
    trip_type: 'round_trip',
    origin: 'lon',
    destination: 'mil',
    departure_date: '2026-10-08',
    return_date: '2026-10-15',
    adults: 2,
    children: 1,
    infants: 1,
    cabin_class: 'business',
  });

  assert.deepEqual(payload.slices, [
    { origin: 'LON', destination: 'MIL', departure_date: '2026-10-08' },
    { origin: 'MIL', destination: 'LON', departure_date: '2026-10-15' },
  ]);
  assert.deepEqual(payload.passengers.map(({ type }) => type), ['ADT', 'ADT', 'CHD', 'INF']);
  assert.equal(payload.cabin_class, 'business');
});

test('rejects invalid passenger combinations and return dates', () => {
  assert.throws(() => buildSearchPassengers({ adults: 1, children: 8, infants: 1 }), /maximum of 9/i);
  assert.throws(() => buildSearchPassengers({ adults: 1, infants: 2 }), /Infants cannot exceed/i);
  assert.throws(() => buildPartnerSearchPayload({
    trip_type: 'round_trip', origin: 'LON', destination: 'MIL',
    departure_date: '2026-10-08', return_date: '2026-10-07', adults: 1,
    children: 0, infants: 0, cabin_class: 'economy',
  }), /Return date/i);
});

test('creates a sandbox order payload matching the confirmed quote and passenger mix', () => {
  const payload = buildSandboxOrderPayload({
    pricedOffer: { price_quote_id: 'quote_test_123', price: { total: '760.22', currency: 'SAR' } },
    search: { departure_date: '2026-10-08', adults: 1, children: 1, infants: 0 },
    contact: { email: 'sandbox@example.com', phone: '+966500000000' },
    uniqueSuffix: 'case-123',
  });

  assert.equal(payload.price_quote_id, 'quote_test_123');
  assert.deepEqual(payload.expected_total, { total: '760.22', currency: 'SAR' });
  assert.deepEqual(payload.passengers.map(({ type }) => type), ['ADT', 'CHD']);
  assert.match(payload.client_order_ref, /^ADMIN-SANDBOX-/);
});

