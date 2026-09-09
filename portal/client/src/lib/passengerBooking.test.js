import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildCachedOrderRecord,
  buildInitialPassengerFormData,
  buildOrderPayloadForDRCT,
  buildPassengerDescriptors,
  buildPassengerSummary,
  buildPendingBookingData,
  normalizePassengerCounts,
  transformPassengersForDRCT,
  validatePassengerAgeForType,
  validatePassengerFormData,
} from './passengerBooking.js';

test('normalizePassengerCounts keeps at least one adult and parses values', () => {
  assert.deepEqual(
    normalizePassengerCounts({ adults: '0', children: '2', infants: '1' }),
    { adults: 1, children: 2, infants: 1 }
  );
});

test('buildPassengerDescriptors expands adult, child, infant mix correctly', () => {
  const descriptors = buildPassengerDescriptors({ adults: 2, children: 1, infants: 1 });

  assert.equal(descriptors.length, 4);
  assert.deepEqual(
    descriptors.map((item) => item.id),
    ['ADT-1', 'ADT-2', 'CHD-1', 'INF-1']
  );
});

test('buildInitialPassengerFormData creates one contact block and all passengers', () => {
  const formData = buildInitialPassengerFormData({ adults: 1, children: 1, infants: 0 }, 'test@example.com');

  assert.equal(formData.contacts.email, 'test@example.com');
  assert.equal(formData.contacts.phone, '+966');
  assert.equal(formData.passengers.length, 2);
  assert.equal(formData.passengers[0].type, 'ADT');
  assert.equal(formData.passengers[1].type, 'CHD');
});

test('validatePassengerAgeForType enforces age at departure for adult, child, infant', () => {
  assert.equal(validatePassengerAgeForType('ADT', '1990-01-15', '2026-07-01').valid, true);
  assert.equal(validatePassengerAgeForType('CHD', '2018-08-01', '2026-07-01').valid, true);
  assert.equal(validatePassengerAgeForType('INF', '2025-09-01', '2026-07-01').valid, true);

  assert.equal(validatePassengerAgeForType('ADT', '2018-08-01', '2026-07-01').valid, false);
  assert.equal(validatePassengerAgeForType('CHD', '2025-09-01', '2026-07-01').valid, false);
  assert.equal(validatePassengerAgeForType('INF', '2020-01-01', '2026-07-01').valid, false);
});

test('transformPassengersForDRCT maps UI passenger model to DRCT payload', () => {
  const result = transformPassengersForDRCT([
    {
      type: 'ADT',
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: '1990-01-01',
      gender: 'male',
      passportNumber: 'AB123456',
      passportExpiry: '2035-01-01',
      nationality: 'US',
    },
    {
      type: 'CHD',
      firstName: 'Anna',
      lastName: 'Doe',
      dateOfBirth: '2018-04-02',
      gender: 'female',
      passportNumber: 'CD789012',
      passportExpiry: '2034-06-01',
      nationality: 'GB',
    },
  ]);

  assert.deepEqual(result, [
    {
      type: 'ADT',
      first_name: 'John',
      last_name: 'Doe',
      date_of_birth: '1990-01-01',
      gender: 'M',
      document: {
        type: 'passport',
        number: 'AB123456',
        expiry_date: '2035-01-01',
        issuing_country: 'US',
      },
    },
    {
      type: 'CHD',
      first_name: 'Anna',
      last_name: 'Doe',
      date_of_birth: '2018-04-02',
      gender: 'F',
      document: {
        type: 'passport',
        number: 'CD789012',
        expiry_date: '2034-06-01',
        issuing_country: 'GB',
      },
    },
  ]);
});

test('buildPassengerSummary returns compact traveler summary', () => {
  assert.equal(
    buildPassengerSummary([
      { type: 'ADT' },
      { type: 'ADT' },
      { type: 'CHD' },
      { type: 'INF' },
    ]),
    '2 adults • 1 child • 1 infant'
  );
});

test('validatePassengerFormData accepts valid multi-passenger booking data', () => {
  const formData = {
    contacts: {
      email: 'traveler@example.com',
      phone: '+14155552671',
    },
    baggage: '20kg',
    passengers: [
      {
        id: 'ADT-1',
        type: 'ADT',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1990-01-01',
        passportNumber: 'AB123456',
        passportExpiry: '2030-12-31',
        nationality: 'US',
      },
      {
        id: 'CHD-1',
        type: 'CHD',
        firstName: 'Anna',
        lastName: 'Doe',
        dateOfBirth: '2018-04-02',
        passportNumber: 'CD789012',
        passportExpiry: '2031-06-01',
        nationality: 'GB',
      },
      {
        id: 'INF-1',
        type: 'INF',
        firstName: 'Baby',
        lastName: 'Doe',
        dateOfBirth: '2025-01-10',
        passportNumber: 'EF345678',
        passportExpiry: '2031-06-01',
        nationality: 'GB',
      },
    ],
  };

  assert.deepEqual(
    validatePassengerFormData(formData, {
      departureDate: '2026-07-01',
      now: new Date('2026-01-01T10:00:00Z'),
    }),
    { contacts: {}, passengers: {}, global: {} }
  );
});

test('validatePassengerFormData blocks infants without enough adults', () => {
  const formData = {
    contacts: {
      email: 'traveler@example.com',
      phone: '+14155552671',
    },
    passengers: [
      {
        id: 'ADT-1',
        type: 'ADT',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1990-01-01',
        passportNumber: 'AB123456',
        passportExpiry: '2030-12-31',
        nationality: 'US',
      },
      {
        id: 'INF-1',
        type: 'INF',
        firstName: 'Baby',
        lastName: 'Doe',
        dateOfBirth: '2025-01-10',
        passportNumber: 'EF345678',
        passportExpiry: '2031-06-01',
        nationality: 'GB',
      },
      {
        id: 'INF-2',
        type: 'INF',
        firstName: 'Baby2',
        lastName: 'Doe',
        dateOfBirth: '2025-03-10',
        passportNumber: 'GH345678',
        passportExpiry: '2031-06-01',
        nationality: 'GB',
      },
    ],
  };

  const result = validatePassengerFormData(formData, {
    departureDate: '2026-07-01',
    now: new Date('2026-01-01T10:00:00Z'),
  });

  assert.equal(result.global.passengers, 'Each infant must be accompanied by an adult');
});

test('validatePassengerFormData flags invalid child age and short passport validity', () => {
  const formData = {
    contacts: {
      email: 'traveler@example.com',
      phone: '+14155552671',
    },
    passengers: [
      {
        id: 'CHD-1',
        type: 'CHD',
        firstName: 'TooYoung',
        lastName: 'Kid',
        dateOfBirth: '2025-09-01',
        passportNumber: 'AB1234',
        passportExpiry: '2026-05-30',
        nationality: 'US',
      },
    ],
  };

  const result = validatePassengerFormData(formData, {
    departureDate: '2026-07-01',
    now: new Date('2026-01-01T10:00:00Z'),
  });

  assert.equal(result.passengers['CHD-1'].dateOfBirth, 'Child passenger must be 2-11 years old at departure');
  assert.equal(result.passengers['CHD-1'].passportExpiry, 'Passport must be valid for at least 6 months');
});

test('buildOrderPayloadForDRCT preserves multi-passenger contacts, pricing, and DRCT mapping', () => {
  const selectedOffer = {
    offer_id: 'offer-123',
    origin: 'LIS',
    destination: 'FRA',
    departure_time: '2026-08-10 09:00',
    arrival_time: '2026-08-10 13:00',
    airline_code: 'TP',
    airline_name: 'TAP Air Portugal',
    flight_number: 'TP670',
    price: {
      total: 956,
      taxes: 120,
      currency: 'SAR',
    },
  };
  const passengerFormData = {
    contacts: {
      email: 'traveler@example.com',
      phone: '+14155552671',
    },
    baggage: '20kg',
    passengers: [
      {
        id: 'ADT-1',
        type: 'ADT',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1990-01-01',
        gender: 'male',
        passportNumber: 'AB123456',
        passportExpiry: '2030-12-31',
        nationality: 'US',
      },
      {
        id: 'CHD-1',
        type: 'CHD',
        firstName: 'Anna',
        lastName: 'Doe',
        dateOfBirth: '2018-04-02',
        gender: 'female',
        passportNumber: 'CD789012',
        passportExpiry: '2031-06-01',
        nationality: 'GB',
      },
    ],
  };
  const result = buildOrderPayloadForDRCT({
    selectedOffer,
    passengerFormData,
    user: {
      id: 'user-1',
      email: 'owner@example.com',
    },
    baggagePrice: { amount: 500 },
  });

  assert.equal(result.offer_id, 'offer-123');
  assert.equal(result.contacts.email, 'traveler@example.com');
  assert.equal(result.contacts.phone, '+14155552671');
  assert.equal(result.user_id, 'user-1');
  assert.equal(result.user_email, 'owner@example.com');
  assert.equal(result.passengers.length, 2);
  assert.equal(result.passengers[0].type, 'ADT');
  assert.equal(result.passengers[1].type, 'CHD');
  assert.equal(result.pricing.total_price, 1456);
  assert.equal(result.passenger_details.passengers[1].passport_number, 'CD789012');
});

test('buildPendingBookingData and buildCachedOrderRecord keep traveler party and passenger count', () => {
  const selectedOffer = {
    origin: 'LIS',
    destination: 'FRA',
    departure_time: '2026-08-10 09:00',
    arrival_time: '2026-08-10 13:00',
    airline_code: 'TP',
    airline_name: 'TAP Air Portugal',
    flight_number: 'TP670',
    price: {
      total: 956,
      currency: 'SAR',
    },
  };
  const passengerFormData = {
    contacts: {
      email: 'traveler@example.com',
      phone: '+14155552671',
    },
    baggage: 'none',
    passengers: [
      { id: 'ADT-1', type: 'ADT' },
      { id: 'ADT-2', type: 'ADT' },
      { id: 'INF-1', type: 'INF' },
    ],
  };
  const n8nResponse = {
    order_id: 'ord-1',
    order_number: 'AVF-1001',
    drct_order_id: 'DRCT-500',
  };

  const pending = buildPendingBookingData({
    n8nResponse,
    selectedOffer,
    passengerFormData,
    baggagePrice: { amount: 0 },
  });
  const cache = buildCachedOrderRecord({
    n8nResponse,
    selectedOffer,
    passengerFormData,
    user: { id: 'user-1' },
    baggagePrice: { amount: 0 },
    createdAt: '2026-07-01T08:00:00.000Z',
  });

  assert.equal(pending.orderNumber, 'AVF-1001');
  assert.equal(pending.bookingReference, 'DRCT-500');
  assert.equal(pending.passengerParty.passengers.length, 3);
  assert.equal(cache.id, 'ord-1');
  assert.equal(cache.passenger_count, 3);
  assert.equal(cache.contact_email, 'traveler@example.com');
  assert.equal(cache.created_at, '2026-07-01T08:00:00.000Z');
});
