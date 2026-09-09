'use strict';

const crypto = require('crypto');
const { toMinorUnits } = require('./pricingEngine');

const PASSENGER_TYPES = new Set(['ADT', 'CHD', 'INF']);
const GENDERS = new Set(['M', 'F']);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const COUNTRY_CODE = /^[A-Z]{2}$/;

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.keys(value).sort().reduce((result, key) => {
      result[key] = canonicalize(value[key]);
      return result;
    }, {});
  }
  return value;
}

function requestHash(body) {
  return crypto.createHash('sha256').update(JSON.stringify(canonicalize(body))).digest('hex');
}

function isIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().startsWith(value);
}

function validateCreateOrderRequest(body = {}) {
  const details = [];
  if (!/^quote_(test|live)_[A-Za-z0-9_-]+$/.test(String(body.price_quote_id || ''))) {
    details.push({ field: 'price_quote_id', issue: 'Must be an AviaFrame price quote identifier' });
  }
  if (!/^[A-Za-z0-9._:/-]{1,100}$/.test(String(body.client_order_ref || ''))) {
    details.push({ field: 'client_order_ref', issue: 'Must contain 1-100 safe reference characters' });
  }

  const total = body.expected_total || {};
  if (!/^\d+(?:\.\d{1,3})?$/.test(String(total.total || '')) || Number(total.total) <= 0) {
    details.push({ field: 'expected_total.total', issue: 'Must be a positive decimal string' });
  }
  if (!/^[A-Z]{3}$/.test(String(total.currency || ''))) {
    details.push({ field: 'expected_total.currency', issue: 'Must be an uppercase ISO 4217 currency code' });
  }

  const contact = body.contact || {};
  if (!EMAIL.test(String(contact.email || '').trim())) {
    details.push({ field: 'contact.email', issue: 'Must be a valid email address' });
  }
  if (String(contact.phone || '').trim().length < 6 || String(contact.phone || '').trim().length > 32) {
    details.push({ field: 'contact.phone', issue: 'Must contain 6-32 characters' });
  }

  const passengers = Array.isArray(body.passengers) ? body.passengers : [];
  if (passengers.length < 1 || passengers.length > 9) {
    details.push({ field: 'passengers', issue: 'Must contain between 1 and 9 passengers' });
  }
  passengers.forEach((passenger, index) => {
    const prefix = `passengers[${index}]`;
    const type = String(passenger?.type || '').toUpperCase();
    const gender = String(passenger?.gender || '').toUpperCase();
    if (!PASSENGER_TYPES.has(type)) details.push({ field: `${prefix}.type`, issue: 'Must be ADT, CHD or INF' });
    if (!GENDERS.has(gender)) details.push({ field: `${prefix}.gender`, issue: 'Must be M or F' });
    if (!/^[\p{L}][\p{L} .'-]{0,69}$/u.test(String(passenger?.first_name || '').trim())) {
      details.push({ field: `${prefix}.first_name`, issue: 'Must contain 1-70 name characters' });
    }
    if (!/^[\p{L}][\p{L} .'-]{0,69}$/u.test(String(passenger?.last_name || '').trim())) {
      details.push({ field: `${prefix}.last_name`, issue: 'Must contain 1-70 name characters' });
    }
    if (!isIsoDate(passenger?.date_of_birth)) {
      details.push({ field: `${prefix}.date_of_birth`, issue: 'Must be an ISO date' });
    }
    const document = passenger?.document || {};
    if (String(document.number || '').trim().length < 3 || String(document.number || '').trim().length > 30) {
      details.push({ field: `${prefix}.document.number`, issue: 'Must contain 3-30 characters' });
    }
    if (!COUNTRY_CODE.test(String(document.issuing_country || ''))) {
      details.push({ field: `${prefix}.document.issuing_country`, issue: 'Must be an uppercase ISO country code' });
    }
    if (!COUNTRY_CODE.test(String(document.citizenship || ''))) {
      details.push({ field: `${prefix}.document.citizenship`, issue: 'Must be an uppercase ISO country code' });
    }
    if (!isIsoDate(document.expiration_date)) {
      details.push({ field: `${prefix}.document.expiration_date`, issue: 'Must be an ISO date' });
    }
  });

  const adultCount = passengers.filter((passenger) => String(passenger?.type || '').toUpperCase() === 'ADT').length;
  const infantCount = passengers.filter((passenger) => String(passenger?.type || '').toUpperCase() === 'INF').length;
  if (passengers.length && adultCount === 0) details.push({ field: 'passengers', issue: 'At least one adult passenger is required' });
  if (infantCount > adultCount) details.push({ field: 'passengers', issue: 'Infant count cannot exceed adult count' });
  return details;
}

function normalizeTitle(passenger) {
  const explicit = String(passenger.title || '').replace(/\./g, '').toLowerCase();
  const known = { mr: 'Mr', mrs: 'Mrs', ms: 'Ms', miss: 'Miss', mstr: 'Mstr', master: 'Mstr' };
  if (known[explicit]) return known[explicit];
  if (String(passenger.type).toUpperCase() !== 'ADT') return String(passenger.gender).toUpperCase() === 'F' ? 'Miss' : 'Mstr';
  return String(passenger.gender).toUpperCase() === 'F' ? 'Ms' : 'Mr';
}

function buildDrctPassengers(passengers, contact) {
  return passengers.map((passenger, index) => ({
    id: `T${index + 1}`,
    type: String(passenger.type).toUpperCase(),
    individual: {
      first_name: String(passenger.first_name).trim(),
      last_name: String(passenger.last_name).trim(),
      title: normalizeTitle(passenger),
      date_of_birth: passenger.date_of_birth,
      gender: String(passenger.gender).toUpperCase(),
    },
    email: String(passenger.email || contact.email).trim().toLowerCase(),
    phone: String(passenger.phone || contact.phone).trim(),
    document: {
      type: String(passenger.document.type || 'REGULAR_PASSPORT').toUpperCase(),
      number: String(passenger.document.number).trim(),
      gender: String(passenger.gender).toUpperCase(),
      issuing_country: passenger.document.issuing_country,
      citizenship: passenger.document.citizenship,
      country_of_issue: passenger.document.country_of_issue || passenger.document.issuing_country,
      expiration_date: passenger.document.expiration_date,
    },
  }));
}

function expectedTotalMatches(quote, expectedTotal) {
  const expectedCurrency = String(expectedTotal?.currency || '').toUpperCase();
  const quoteCurrency = String(quote?.currency || '').toUpperCase();
  if (expectedCurrency !== quoteCurrency) return false;
  try {
    return toMinorUnits(expectedTotal.total, quoteCurrency) === toMinorUnits(quote.sell_total, quoteCurrency);
  } catch (_) {
    return false;
  }
}

function quoteMatchesPassengers(quote, passengers) {
  const quotedTypes = quote?.pricing_rule_trace?.passenger_types;
  if (!Array.isArray(quotedTypes) || !quotedTypes.length) return true;
  const suppliedTypes = passengers.map((passenger) => String(passenger.type).toUpperCase()).sort();
  return [...quotedTypes].map((type) => String(type).toUpperCase()).sort().join(',') === suppliedTypes.join(',');
}

function isUncertainUpstreamError(error) {
  const status = Number(error?.response?.status || error?.statusCode || 0);
  const code = String(error?.code || '').toUpperCase();
  if ([400, 404, 409, 410, 422].includes(status)) return false;
  if (['VALIDATION_ERROR', 'OFFER_NOT_FOUND', 'OFFER_EXPIRED'].includes(code)) return false;
  return !status || status === 408 || status === 425 || status === 429 || status >= 500
    || ['ECONNABORTED', 'ECONNRESET', 'ETIMEDOUT', 'EAI_AGAIN', 'ENOTFOUND', 'EPIPE', 'DRCT_INVALID_RESPONSE'].includes(code);
}

function publicOrderResponse({ externalOrderId, clientOrderRef, quote, status, drctResponse = null, createdAt = null }) {
  return {
    order_id: externalOrderId,
    client_order_ref: clientOrderRef,
    status,
    price_quote_id: quote.external_quote_id,
    price: { total: String(quote.sell_total), currency: quote.currency },
    booking_reference: drctResponse?.pnr || drctResponse?.locator || null,
    payment_deadline: drctResponse?.payment?.deadline || drctResponse?.expires_at || null,
    created_at: createdAt || new Date().toISOString(),
  };
}

module.exports = {
  buildDrctPassengers,
  expectedTotalMatches,
  isUncertainUpstreamError,
  publicOrderResponse,
  quoteMatchesPassengers,
  requestHash,
  validateCreateOrderRequest,
};
