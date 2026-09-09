'use strict';

const DEFAULT_EXPONENT = 2;
const CURRENCY_EXPONENTS = new Map([
  ['BHD', 3], ['IQD', 3], ['JOD', 3], ['KWD', 3], ['LYD', 3], ['OMR', 3], ['TND', 3],
  ['CLP', 0], ['DJF', 0], ['GNF', 0], ['ISK', 0], ['JPY', 0], ['KRW', 0], ['PYG', 0],
  ['RWF', 0], ['UGX', 0], ['UYI', 0], ['VND', 0], ['VUV', 0], ['XAF', 0], ['XOF', 0], ['XPF', 0],
]);

class PricingError extends Error {
  constructor(code, message, details = []) {
    super(message);
    this.name = 'PricingError';
    this.code = code;
    this.details = details;
  }
}

function currencyExponent(currency) {
  return CURRENCY_EXPONENTS.get(String(currency || '').toUpperCase()) ?? DEFAULT_EXPONENT;
}

function toPlainDecimal(value) {
  if (typeof value === 'bigint') return value.toString();
  const text = String(value ?? '').trim();
  if (!/[eE]/.test(text)) return text;
  const numeric = Number(text);
  if (!Number.isFinite(numeric)) return text;
  return numeric.toFixed(12).replace(/0+$/, '').replace(/\.$/, '');
}

function toMinorUnits(value, currency) {
  const exponent = currencyExponent(currency);
  const text = toPlainDecimal(value);
  const match = text.match(/^([+-]?)(\d+)(?:\.(\d+))?$/);
  if (!match) {
    throw new PricingError('INVALID_MONEY', `Invalid monetary amount: ${text}`);
  }

  const negative = match[1] === '-';
  const whole = match[2];
  const fraction = match[3] || '';
  const padded = `${fraction}${'0'.repeat(exponent + 1)}`;
  const kept = exponent ? padded.slice(0, exponent) : '';
  const roundingDigit = Number(padded[exponent] || 0);
  const factor = 10n ** BigInt(exponent);
  let minor = BigInt(whole) * factor + BigInt(kept || '0');
  if (roundingDigit >= 5) minor += 1n;
  return negative ? -minor : minor;
}

function formatMinorUnits(value, currency) {
  const exponent = currencyExponent(currency);
  const minor = BigInt(value);
  const negative = minor < 0n;
  const absolute = negative ? -minor : minor;
  if (exponent === 0) return `${negative ? '-' : ''}${absolute}`;
  const factor = 10n ** BigInt(exponent);
  const whole = absolute / factor;
  const fraction = String(absolute % factor).padStart(exponent, '0');
  return `${negative ? '-' : ''}${whole}.${fraction}`;
}

function divideRoundedHalfUp(numerator, denominator) {
  if (denominator <= 0n) throw new PricingError('INVALID_DIVISOR', 'Pricing divisor must be positive');
  const negative = numerator < 0n;
  const absolute = negative ? -numerator : numerator;
  const rounded = (absolute + (denominator / 2n)) / denominator;
  return negative ? -rounded : rounded;
}

function normalizeScope(value) {
  const normalized = String(value || 'ANY').trim().toUpperCase();
  return normalized || 'ANY';
}

function matchesRule(rule, channel, carrierCode) {
  const ruleChannel = normalizeScope(rule.channel);
  const ruleCarrier = normalizeScope(rule.carrier_code);
  return (ruleChannel === 'ANY' || ruleChannel === channel)
    && (ruleCarrier === 'ANY' || ruleCarrier === carrierCode);
}

function ruleSpecificity(rule) {
  // Carrier overrides channel at the same nesting depth. This gives a stable
  // inheritance order: default -> channel -> carrier -> channel+carrier.
  return Number(normalizeScope(rule.channel) !== 'ANY')
    + (2 * Number(normalizeScope(rule.carrier_code) !== 'ANY'));
}

const INHERITED_FIELDS = [
  'action',
  'percent_bps',
  'fixed_amount',
  'fixed_currency',
  'fixed_unit',
  'percent_basis',
  'min_markup',
  'max_markup',
];

function resolvePricingRule(rules, { channel, carrierCode }) {
  const normalizedChannel = normalizeScope(channel);
  const normalizedCarrier = normalizeScope(carrierCode);
  const matching = (Array.isArray(rules) ? rules : [])
    .filter((rule) => rule?.enabled !== false && matchesRule(rule, normalizedChannel, normalizedCarrier))
    .sort((left, right) => {
      const specificityDelta = ruleSpecificity(left) - ruleSpecificity(right);
      if (specificityDelta) return specificityDelta;
      return Number(left.priority || 0) - Number(right.priority || 0);
    });

  if (!matching.length) {
    throw new PricingError('PRICING_NOT_CONFIGURED', 'No pricing rule matches this offer');
  }

  const effective = {};
  for (const rule of matching) {
    for (const field of INHERITED_FIELDS) {
      if (rule[field] !== null && rule[field] !== undefined && rule[field] !== '') {
        effective[field] = rule[field];
      }
    }
  }

  return {
    ...effective,
    applied_rule_ids: matching.map((rule) => rule.id).filter(Boolean),
    matched_rule_id: matching[matching.length - 1]?.id || null,
  };
}

function calculateSellPrice({
  supplierAmount,
  currency,
  channel,
  carrierCode,
  passengerCount = 1,
  rules,
}) {
  const normalizedCurrency = String(currency || '').trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(normalizedCurrency)) {
    throw new PricingError('INVALID_CURRENCY', 'Currency must be an ISO 4217 code');
  }

  const supplierMinor = toMinorUnits(supplierAmount, normalizedCurrency);
  if (supplierMinor <= 0n) {
    throw new PricingError('INVALID_SUPPLIER_PRICE', 'Supplier price must be greater than zero');
  }

  const rule = resolvePricingRule(rules, { channel, carrierCode });
  if (String(rule.action || 'ALLOW').toUpperCase() === 'DENY') {
    throw new PricingError('OFFER_NOT_ALLOWED', 'This offer is disabled by the pricing policy', [
      { rule_id: rule.matched_rule_id },
    ]);
  }

  const basis = String(rule.percent_basis || 'SUPPLIER_TOTAL').toUpperCase();
  if (basis !== 'SUPPLIER_TOTAL') {
    throw new PricingError('PRICING_BASIS_NOT_SUPPORTED', `Unsupported pricing basis: ${basis}`);
  }

  const percentBps = BigInt(Math.max(0, Number(rule.percent_bps || 0)));
  const percentMinor = divideRoundedHalfUp(supplierMinor * percentBps, 10000n);

  const fixedAmount = rule.fixed_amount ?? 0;
  const fixedCurrency = String(rule.fixed_currency || normalizedCurrency).toUpperCase();
  let fixedMinor = 0n;
  if (Number(fixedAmount) > 0) {
    if (fixedCurrency !== normalizedCurrency) {
      throw new PricingError(
        'FIXED_CURRENCY_MISMATCH',
        `Fixed markup currency ${fixedCurrency} does not match offer currency ${normalizedCurrency}`,
      );
    }
    const unit = String(rule.fixed_unit || 'ORDER').toUpperCase();
    const units = unit === 'PASSENGER' || unit === 'TICKET'
      ? Math.max(1, Number(passengerCount || 1))
      : 1;
    fixedMinor = toMinorUnits(fixedAmount, normalizedCurrency) * BigInt(units);
  }

  let markupMinor = percentMinor + fixedMinor;
  if (rule.min_markup !== null && rule.min_markup !== undefined) {
    const minimum = toMinorUnits(rule.min_markup, normalizedCurrency);
    if (markupMinor < minimum) markupMinor = minimum;
  }
  if (rule.max_markup !== null && rule.max_markup !== undefined) {
    const maximum = toMinorUnits(rule.max_markup, normalizedCurrency);
    if (markupMinor > maximum) markupMinor = maximum;
  }

  const sellMinor = supplierMinor + markupMinor;
  return {
    currency: normalizedCurrency,
    supplier_total: formatMinorUnits(supplierMinor, normalizedCurrency),
    percentage_markup: formatMinorUnits(percentMinor, normalizedCurrency),
    fixed_markup: formatMinorUnits(fixedMinor, normalizedCurrency),
    markup_total: formatMinorUnits(markupMinor, normalizedCurrency),
    sell_total: formatMinorUnits(sellMinor, normalizedCurrency),
    percent_bps: Number(percentBps),
    matched_rule_id: rule.matched_rule_id,
    applied_rule_ids: rule.applied_rule_ids,
  };
}

module.exports = {
  PricingError,
  calculateSellPrice,
  currencyExponent,
  formatMinorUnits,
  resolvePricingRule,
  toMinorUnits,
};
