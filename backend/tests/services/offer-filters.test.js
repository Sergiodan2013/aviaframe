'use strict';

const { filterBookableOffers, isBookableChannel } = require('../../src/utils/offerFilters');

describe('offerFilters', () => {
  test('rejects Lufthansa-family LWC offers by prefix when channel is missing', () => {
    expect(isBookableChannel({ offer_id: 'LWC_6a628640775d99002b800761' })).toBe(false);
  });

  test('rejects AFN offers by prefix when DRCT createOrder is known to 404', () => {
    expect(isBookableChannel({ offer_id: 'AFN_6a66f492b26de600257a5645' })).toBe(false);
  });

  test('keeps confirmed Cashback offers', () => {
    expect(isBookableChannel({ offer_id: 'GL_123', channel: 'Cashback' })).toBe(true);
  });

  test('filters mixed offer lists and reports dropped prefixes', () => {
    const result = filterBookableOffers([
      { offer_id: 'GL_123', channel: 'Cashback' },
      { offer_id: 'XY_456', channel: 'Flynas' },
      { offer_id: 'LWC_789' },
      { offer_id: 'AFN_555' },
      { offer_id: 'TK_321' },
    ]);

    expect(result.kept.map((offer) => offer.offer_id)).toEqual(['GL_123', 'XY_456']);
    expect(result.dropped).toBe(3);
    expect(result.rejectedPrefixes.sort()).toEqual(['AFN', 'LWC', 'TK']);
  });
});
