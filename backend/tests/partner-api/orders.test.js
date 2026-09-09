'use strict';

const { buildDrctPassengers } = require('../../src/modules/partner-api/orders');

function samplePassenger(type, overrides = {}) {
  return {
    type,
    gender: 'M',
    first_name: 'Alex',
    last_name: 'Sandbox',
    date_of_birth: '1996-01-01',
    document: {
      type: 'REGULAR_PASSPORT',
      number: 'AF12345678',
      issuing_country: 'SA',
      citizenship: 'SA',
      expiration_date: '2031-01-01',
    },
    ...overrides,
  };
}

const contact = { email: 'contact@example.com', phone: '+15550001111' };

describe('buildDrctPassengers upstream traveler id reuse', () => {
  test('reuses the traveler id DRCT assigned at price time, matched by type', () => {
    const passengers = [samplePassenger('ADT'), samplePassenger('CHD'), samplePassenger('INF')];
    // DRCT's own price-step response, as stored on quote.pricing_rule_trace.upstream_passengers
    const upstreamPassengers = [
      { id: 'PAX-adult-9f3', type: 'ADT' },
      { id: 'PAX-child-2b1', type: 'CHD' },
      { id: 'PAX-infant-7c4', type: 'INF' },
    ];

    const result = buildDrctPassengers(passengers, contact, upstreamPassengers);

    expect(result.map((p) => p.id)).toEqual(['PAX-adult-9f3', 'PAX-child-2b1', 'PAX-infant-7c4']);
  });

  test('matches multiple travelers of the same type in the order DRCT returned them', () => {
    const passengers = [samplePassenger('ADT'), samplePassenger('ADT')];
    const upstreamPassengers = [
      { id: 'PAX-1', type: 'ADT' },
      { id: 'PAX-2', type: 'ADT' },
    ];

    const result = buildDrctPassengers(passengers, contact, upstreamPassengers);

    expect(result.map((p) => p.id)).toEqual(['PAX-1', 'PAX-2']);
  });

  test('falls back to a locally generated id when no upstream data is available', () => {
    const passengers = [samplePassenger('ADT'), samplePassenger('CHD')];

    const result = buildDrctPassengers(passengers, contact, undefined);

    expect(result.map((p) => p.id)).toEqual(['T1', 'T2']);
  });

  test('falls back per-passenger when upstream data is missing or exhausted for a type', () => {
    const passengers = [samplePassenger('ADT'), samplePassenger('ADT')];
    const upstreamPassengers = [{ id: 'PAX-1', type: 'ADT' }]; // only one traveler id returned for two adults

    const result = buildDrctPassengers(passengers, contact, upstreamPassengers);

    expect(result[0].id).toBe('PAX-1');
    expect(result[1].id).toBe('T2');
  });

  test('still builds the full passenger record (name, document, contact) alongside the id', () => {
    const passengers = [samplePassenger('ADT')];
    const result = buildDrctPassengers(passengers, contact, [{ id: 'PAX-1', type: 'ADT' }]);

    expect(result[0]).toMatchObject({
      id: 'PAX-1',
      type: 'ADT',
      individual: { first_name: 'Alex', last_name: 'Sandbox', title: 'Mr' },
      email: 'contact@example.com',
      document: { number: 'AF12345678', issuing_country: 'SA' },
    });
  });
});
