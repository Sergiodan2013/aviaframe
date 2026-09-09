'use strict';

const {
  PricingError,
  calculateSellPrice,
  formatMinorUnits,
  toMinorUnits,
} = require('../../src/modules/partner-api/pricingEngine');

describe('Partner API pricing engine', () => {
  test('combines percentage and fixed markup using the most specific inherited rule', () => {
    const result = calculateSellPrice({
      supplierAmount: '400.00',
      currency: 'USD',
      channel: 'NDC',
      carrierCode: 'EK',
      passengerCount: 1,
      rules: [
        { id: 'default', channel: 'ANY', carrier_code: 'ANY', percent_bps: 150, fixed_amount: '0', enabled: true },
        { id: 'ndc', channel: 'NDC', carrier_code: 'ANY', percent_bps: 200, fixed_amount: '3', fixed_currency: 'USD', enabled: true },
        { id: 'ek-ndc', channel: 'NDC', carrier_code: 'EK', percent_bps: 250, fixed_amount: '5', fixed_currency: 'USD', enabled: true },
      ],
    });

    expect(result).toEqual(expect.objectContaining({
      supplier_total: '400.00',
      percentage_markup: '10.00',
      fixed_markup: '5.00',
      markup_total: '15.00',
      sell_total: '415.00',
      matched_rule_id: 'ek-ndc',
      applied_rule_ids: ['default', 'ndc', 'ek-ndc'],
    }));
  });

  test('applies fixed markup per passenger without floating point arithmetic', () => {
    const result = calculateSellPrice({
      supplierAmount: '99.99',
      currency: 'USD',
      channel: 'GDS',
      carrierCode: 'LH',
      passengerCount: 3,
      rules: [{
        id: 'rule',
        channel: 'ANY',
        carrier_code: 'ANY',
        percent_bps: 125,
        fixed_amount: '2.10',
        fixed_currency: 'USD',
        fixed_unit: 'PASSENGER',
      }],
    });

    expect(result.percentage_markup).toBe('1.25');
    expect(result.fixed_markup).toBe('6.30');
    expect(result.sell_total).toBe('107.54');
  });

  test('uses stable default, channel, carrier, then channel+carrier precedence', () => {
    const result = calculateSellPrice({
      supplierAmount: '100', currency: 'USD', channel: 'NDC', carrierCode: 'EK',
      rules: [
        { id: 'default', channel: 'ANY', carrier_code: 'ANY', percent_bps: 100 },
        { id: 'carrier', channel: 'ANY', carrier_code: 'EK', percent_bps: 300 },
        { id: 'channel', channel: 'NDC', carrier_code: 'ANY', percent_bps: 200 },
      ],
    });

    expect(result.matched_rule_id).toBe('carrier');
    expect(result.sell_total).toBe('103.00');
  });

  test('enforces min and max markup', () => {
    const minimum = calculateSellPrice({
      supplierAmount: '10.00', currency: 'USD', channel: 'GDS', carrierCode: 'LH',
      rules: [{ percent_bps: 100, min_markup: '2.00' }],
    });
    const maximum = calculateSellPrice({
      supplierAmount: '1000.00', currency: 'USD', channel: 'GDS', carrierCode: 'LH',
      rules: [{ percent_bps: 1000, max_markup: '25.00' }],
    });

    expect(minimum.markup_total).toBe('2.00');
    expect(maximum.markup_total).toBe('25.00');
  });

  test('fails closed for denied inventory and fixed currency mismatch', () => {
    expect(() => calculateSellPrice({
      supplierAmount: '100', currency: 'USD', channel: 'LCC', carrierCode: 'W6',
      rules: [{ id: 'deny', channel: 'LCC', carrier_code: 'W6', action: 'DENY' }],
    })).toThrow(expect.objectContaining({ code: 'OFFER_NOT_ALLOWED' }));

    expect(() => calculateSellPrice({
      supplierAmount: '100', currency: 'USD', channel: 'NDC', carrierCode: 'EK',
      rules: [{ fixed_amount: '5', fixed_currency: 'EUR' }],
    })).toThrow(expect.objectContaining({ code: 'FIXED_CURRENCY_MISMATCH' }));
  });

  test('uses ISO currency exponent for zero-decimal currencies', () => {
    expect(toMinorUnits('101.6', 'JPY')).toBe(102n);
    expect(formatMinorUnits(102n, 'JPY')).toBe('102');
    expect(PricingError).toBeDefined();
  });
});
