'use strict';

const DEFAULT_VAT_RATE = Number(process.env.KSA_VAT_RATE || 0.15);
const DEFAULT_FIXED_FEE_SAR = Number(process.env.MOYASAR_CARD_FIXED_FEE_SAR || 1);
const DEFAULT_MADA_RATE = Number(process.env.MOYASAR_MADA_FEE_RATE || 0.01);
const DEFAULT_LOCAL_CARD_RATE = Number(process.env.MOYASAR_LOCAL_CARD_FEE_RATE || 0.0275);
const DEFAULT_INTERNATIONAL_RATE = Number(process.env.MOYASAR_INTL_CARD_FEE_RATE || 0.0375);

function roundMoney(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function sanitizeCardNumber(value) {
  return String(value || '').replace(/\D/g, '');
}

function normalizeCompany(value) {
  const company = String(value || '').trim().toLowerCase();
  if (company === 'master') return 'mastercard';
  return company;
}

function normalizeIssuerCountry(value) {
  return String(value || '').trim().toUpperCase();
}

function isSaudiIssuer(country) {
  const normalized = normalizeIssuerCountry(country);
  return normalized === 'SA' || normalized === 'SAU' || normalized === 'KSA';
}

function isSupportedCardCompany(company) {
  return ['mada', 'visa', 'mastercard'].includes(normalizeCompany(company));
}

function computeFeeTotals({ orderSubtotal, currency, pricingClass, issuer = {}, overrides = {} } = {}) {
  const variableFee = roundMoney(orderSubtotal * pricingClass.rate);
  const fixedFee = roundMoney(
    Number.isFinite(Number(overrides.fixedFee))
      ? Number(overrides.fixedFee)
      : DEFAULT_FIXED_FEE_SAR
  );
  const vatRate = Number.isFinite(Number(overrides.vatRate))
    ? Number(overrides.vatRate)
    : DEFAULT_VAT_RATE;
  const feeBeforeVat = roundMoney(variableFee + fixedFee);
  const vatAmount = roundMoney(feeBeforeVat * vatRate);
  const processingFeeTotal = roundMoney(feeBeforeVat + vatAmount);
  const finalPayableAmount = roundMoney(orderSubtotal + processingFeeTotal);

  return {
    supported: true,
    currency,
    scheme: pricingClass.scheme,
    pricing_tier: pricingClass.tier,
    issuer_company: normalizeCompany(issuer.company),
    issuer_country: normalizeIssuerCountry(issuer.issuer_country),
    issuer_name: issuer.issuer_name || null,
    issuer_card_type: issuer.issuer_card_type || null,
    issuer_card_category: issuer.issuer_card_category || null,
    first_digits: issuer.first_digits || null,
    last_digits: issuer.last_digits || null,
    rate: pricingClass.rate,
    vat_rate: vatRate,
    fixed_fee: fixedFee,
    variable_fee: variableFee,
    fee_before_vat: feeBeforeVat,
    vat_amount: vatAmount,
    processing_fee_total: processingFeeTotal,
    order_subtotal: orderSubtotal,
    final_payable_amount: finalPayableAmount,
    display_label: pricingClass.label
  };
}

function getOrderSubtotal(order = {}) {
  const metadataSubtotal = Number(order?.metadata?.payment_pricing?.order_subtotal);
  if (Number.isFinite(metadataSubtotal) && metadataSubtotal > 0) {
    return roundMoney(metadataSubtotal);
  }

  const rawSubtotal = Number(order?.raw_offer_data?.pricing?.total_price);
  if (Number.isFinite(rawSubtotal) && rawSubtotal > 0) {
    return roundMoney(rawSubtotal);
  }

  return roundMoney(order?.total_price || 0);
}

function classifyIssuerForPricing({ company, issuerCountry } = {}) {
  const normalizedCompany = normalizeCompany(company);
  const country = normalizeIssuerCountry(issuerCountry);

  if (normalizedCompany === 'mada' && isSaudiIssuer(country)) {
    return {
      supported: true,
      scheme: 'mada',
      tier: 'mada_local',
      label: 'Saudi-issued mada',
      rate: DEFAULT_MADA_RATE
    };
  }

  if ((normalizedCompany === 'visa' || normalizedCompany === 'mastercard') && isSaudiIssuer(country)) {
    return {
      supported: true,
      scheme: normalizedCompany,
      tier: 'local_credit_card',
      label: `Saudi-issued ${normalizedCompany === 'visa' ? 'Visa' : 'Mastercard'}`,
      rate: DEFAULT_LOCAL_CARD_RATE
    };
  }

  if (normalizedCompany === 'visa' || normalizedCompany === 'mastercard') {
    return {
      supported: true,
      scheme: normalizedCompany,
      tier: 'international_card',
      label: `International ${normalizedCompany === 'visa' ? 'Visa' : 'Mastercard'}`,
      rate: DEFAULT_INTERNATIONAL_RATE
    };
  }

  return {
    supported: false,
    scheme: normalizedCompany || 'unknown',
    tier: 'unsupported_card',
    label: 'Unsupported card',
    rate: 0
  };
}

function buildPaymentFeeQuote({ order = {}, issuer = {}, options = {} } = {}) {
  const currency = String(order?.currency || order?.raw_offer_data?.pricing?.currency || 'SAR').trim().toUpperCase();
  const orderSubtotal = getOrderSubtotal(order);
  const allowSandboxEstimateForNonSar = Boolean(options?.allowSandboxEstimateForNonSar);
  const pricingClass = classifyIssuerForPricing({
    company: issuer.company,
    issuerCountry: issuer.issuer_country
  });

  if (!Number.isFinite(orderSubtotal) || orderSubtotal <= 0) {
    return {
      supported: false,
      reason: 'invalid_subtotal',
      currency,
      order_subtotal: 0
    };
  }

  if (currency !== 'SAR') {
    if (allowSandboxEstimateForNonSar && pricingClass.supported) {
      return {
        ...computeFeeTotals({
          orderSubtotal,
          currency,
          pricingClass: {
            ...pricingClass,
            tier: 'sandbox_estimated_non_sar'
          },
          issuer
        }),
        estimate_only: true,
        estimate_context: 'sandbox_non_sar_demo',
        display_label: `${pricingClass.label} demo estimate`,
      };
    }

    return {
      supported: false,
      reason: 'unsupported_currency',
      currency,
      order_subtotal: orderSubtotal,
      scheme: pricingClass.scheme,
      pricing_tier: pricingClass.tier
    };
  }

  if (!pricingClass.supported) {
    return {
      supported: false,
      reason: 'unsupported_card',
      currency,
      order_subtotal: orderSubtotal,
      scheme: pricingClass.scheme,
      pricing_tier: pricingClass.tier
    };
  }

  return computeFeeTotals({
    orderSubtotal,
    currency,
    pricingClass,
    issuer
  });
}

module.exports = {
  roundMoney,
  sanitizeCardNumber,
  normalizeCompany,
  normalizeIssuerCountry,
  isSaudiIssuer,
  isSupportedCardCompany,
  getOrderSubtotal,
  classifyIssuerForPricing,
  buildPaymentFeeQuote
};
