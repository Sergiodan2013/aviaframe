'use strict';

const MERCHANT_ID = process.env.TAMARA_MERCHANT_ID || '';
const SUCCESS_URL = process.env.TAMARA_SUCCESS_RETURN_URL || 'https://admin.aviaframe.com/payments/tamara/success';
const CANCEL_URL = process.env.TAMARA_CANCEL_RETURN_URL || 'https://admin.aviaframe.com/payments/tamara/cancel';
const FAILURE_URL = process.env.TAMARA_FAILURE_RETURN_URL || 'https://admin.aviaframe.com/payments/tamara/failure';

/**
 * Format a numeric amount as Tamara-compatible string with 2 decimal places.
 */
function fmtAmt(value) {
  return Number(value || 0).toFixed(2);
}

/**
 * Normalise phone to E.164 format for Saudi numbers.
 * Accepts: 05XXXXXXXX, 5XXXXXXXX, +9665XXXXXXXX, 9665XXXXXXXX
 */
function normalisePhone(phone) {
  if (!phone) return '+966500000000'; // fallback for missing phone
  const digits = String(phone).replace(/\D/g, '');
  if (digits.startsWith('966')) return `+${digits}`;
  if (digits.startsWith('05') || digits.startsWith('5')) {
    const local = digits.replace(/^0/, '');
    return `+966${local}`;
  }
  // Already has country code or unknown format — prefix + if missing
  return phone.startsWith('+') ? phone : `+${digits}`;
}

/**
 * Map AviaFrame order to Tamara checkout session payload.
 */
function buildCheckoutPayload(order, { language = 'en' } = {}) {
  const currency = order.currency || 'SAR';
  const total = Number(order.total_price || 0);
  const phone = normalisePhone(order.contact_phone);

  // Line items — at minimum one item required by Tamara
  const items = [
    {
      reference_id: String(order.id),
      type: 'Digital',
      name: `Flight ${order.origin || ''} - ${order.destination || ''}`,
      sku: String(order.order_number || order.id),
      quantity: 1,
      unit_price: { amount: fmtAmt(total), currency },
      discount_amount: { amount: '0.00', currency },
      tax_amount: { amount: '0.00', currency },
      total_amount: { amount: fmtAmt(total), currency }
    }
  ];

  const payload = {
    order_reference_id: String(order.id),
    total_amount: { amount: fmtAmt(total), currency },
    description: `Flight booking ${order.order_number || order.id}`,
    country_code: 'SA',
    payment_type: 'PAY_BY_INSTALMENTS',
    instalments: 3,
    locale: language === 'ar' ? 'ar_SA' : 'en_US',
    items,
    consumer: {
      first_name: order.contact_first_name || 'Customer',
      last_name: order.contact_last_name || 'Customer',
      phone_number: phone,
      email: order.contact_email || ''
    },
    billing_address: {
      first_name: order.contact_first_name || 'Customer',
      last_name: order.contact_last_name || 'Customer',
      phone_number: phone,
      address_line1: 'Saudi Arabia',
      city: 'Riyadh',
      country_code: 'SA'
    },
    shipping_address: {
      first_name: order.contact_first_name || 'Customer',
      last_name: order.contact_last_name || 'Customer',
      phone_number: phone,
      address_line1: 'Saudi Arabia',
      city: 'Riyadh',
      country_code: 'SA'
    },
    merchant: {
      merchant_url: SUCCESS_URL,
      success_url: `${SUCCESS_URL}?order_id=${order.id}`,
      failure_url: `${FAILURE_URL}?order_id=${order.id}`,
      cancel_url: `${CANCEL_URL}?order_id=${order.id}`,
      notification_url: `${process.env.BACKEND_URL || 'https://peaceful-amazement-production-629f.up.railway.app'}/api/payments/tamara/webhook`
    },
    risk_assessment: {}
  };

  return payload;
}

module.exports = { buildCheckoutPayload };
