'use strict';

const { classifyDistributionChannel } = require('../../src/modules/partner-api/channelClassifier');

describe('Partner API distribution channel classifier', () => {
  test.each([
    [{ channel: 'Lufthansa Group', offer_id: 'LH_offer_1' }, 'NDC'],
    [{ channel: 'Cashback', offer_id: 'GL_offer_1' }, 'GDS'],
    [{ channel: 'Flynas', offer_id: 'XY_offer_1' }, 'LCC'],
  ])('classifies known DRCT source labels', (offer, expected) => {
    expect(classifyDistributionChannel(offer, [])).toBe(expected);
  });

  test('uses the offer prefix when DRCT omits the source label', () => {
    expect(classifyDistributionChannel({ offer_id: 'LH_offer_1' }, [])).toBe('NDC');
  });

  test('database mappings override built-in source aliases', () => {
    expect(classifyDistributionChannel(
      { channel: 'Lufthansa Group', offer_id: 'LH_offer_1', airline_code: 'LH' },
      [{ upstream_channel: 'Lufthansa Group', distribution_channel: 'GDS', priority: 100, is_active: true }],
    )).toBe('GDS');
  });
});
