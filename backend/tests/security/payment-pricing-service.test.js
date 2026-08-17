const {
  buildPaymentFeeQuote
} = require('../../src/services/paymentPricingService');

describe('payment pricing service', () => {
  const baseOrder = {
    total_price: 100,
    currency: 'SAR',
    raw_offer_data: {
      pricing: {
        total_price: 100,
        currency: 'SAR'
      }
    },
    metadata: {}
  };

  test('calculates mada fee quote', () => {
    const quote = buildPaymentFeeQuote({
      order: baseOrder,
      issuer: { company: 'mada', issuer_country: 'SA' }
    });

    expect(quote.supported).toBe(true);
    expect(quote.pricing_tier).toBe('mada_local');
    expect(quote.variable_fee).toBe(1);
    expect(quote.fixed_fee).toBe(1);
    expect(quote.vat_amount).toBe(0.3);
    expect(quote.processing_fee_total).toBe(2.3);
    expect(quote.final_payable_amount).toBe(102.3);
  });

  test('calculates local visa/mastercard quote', () => {
    const quote = buildPaymentFeeQuote({
      order: baseOrder,
      issuer: { company: 'master', issuer_country: 'SA' }
    });

    expect(quote.supported).toBe(true);
    expect(quote.scheme).toBe('mastercard');
    expect(quote.pricing_tier).toBe('local_credit_card');
    expect(quote.variable_fee).toBe(2.75);
    expect(quote.fixed_fee).toBe(1);
    expect(quote.vat_amount).toBe(0.56);
    expect(quote.processing_fee_total).toBe(4.31);
    expect(quote.final_payable_amount).toBe(104.31);
  });

  test('calculates international quote', () => {
    const quote = buildPaymentFeeQuote({
      order: baseOrder,
      issuer: { company: 'visa', issuer_country: 'GB' }
    });

    expect(quote.supported).toBe(true);
    expect(quote.pricing_tier).toBe('international_card');
    expect(quote.variable_fee).toBe(3.75);
    expect(quote.fixed_fee).toBe(1);
    expect(quote.vat_amount).toBe(0.71);
    expect(quote.processing_fee_total).toBe(5.46);
    expect(quote.final_payable_amount).toBe(105.46);
  });

  test('rejects unsupported schemes', () => {
    const quote = buildPaymentFeeQuote({
      order: baseOrder,
      issuer: { company: 'amex', issuer_country: 'SA' }
    });

    expect(quote.supported).toBe(false);
    expect(quote.reason).toBe('unsupported_card');
  });

  test('builds sandbox estimate for non-SAR bookings using issuer-verified tier rules', () => {
    const quote = buildPaymentFeeQuote({
      order: {
        ...baseOrder,
        currency: 'UAH',
        raw_offer_data: {
          pricing: {
            total_price: 100,
            currency: 'UAH'
          }
        }
      },
      issuer: { company: 'visa', issuer_country: 'PL' },
      options: { allowSandboxEstimateForNonSar: true }
    });

    expect(quote.supported).toBe(true);
    expect(quote.pricing_tier).toBe('sandbox_estimated_non_sar');
    expect(quote.estimate_only).toBe(true);
    expect(quote.processing_fee_total).toBe(5.46);
    expect(quote.final_payable_amount).toBe(105.46);
  });
});
