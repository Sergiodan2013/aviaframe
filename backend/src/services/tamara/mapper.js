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
 * Normalise phone to Tamara format: local Saudi number without country code.
 * Tamara expects "544337866" not "+966544337866"
 */
function normalisePhone(phone) {
  if (!phone) return '500000000';
  const digits = String(phone).replace(/\D/g, '');
  // Strip leading 966 or +966
  if (digits.startsWith('966')) return digits.slice(3);
  // Strip leading 0
  if (digits.startsWith('0')) return digits.slice(1);
  return digits;
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

  const addr = {
    first_name: order.contact_first_name || 'Customer',
    last_name: order.contact_last_name || 'Customer',
    line1: 'Saudi Arabia',
    line2: '',
    region: 'Riyadh',
    postal_code: '12345',
    city: 'Riyadh',
    country_code: 'SA',
    phone_number: phone
  };

  const payload = {
    order_reference_id: String(order.id),
    order_number: String(order.order_number || order.id),
    total_amount: { amount: total, currency },
    description: `Flight booking ${order.order_number || order.id}`,
    country_code: 'SA',
    payment_type: 'PAY_BY_INSTALMENTS',
    instalments: null,
    locale: language === 'ar' ? 'ar_SA' : 'en_US',
    items,
    consumer: {
      first_name: order.contact_first_name || 'Customer',
      last_name: order.contact_last_name || 'Customer',
      phone_number: phone,
      email: order.contact_email || ''
    },
    billing_address: addr,
    shipping_address: addr,
    merchant_url: {
      success: `${SUCCESS_URL}?order_id=${order.id}`,
      failure: `${FAILURE_URL}?order_id=${order.id}`,
      cancel: `${CANCEL_URL}?order_id=${order.id}`,
      notification: `${process.env.BACKEND_URL || 'https://peaceful-amazement-production-629f.up.railway.app'}/api/payments/tamara/webhook`
    },
    is_mobile: false,
    risk_assessment: {}
  };

  return payload;
}

module.exports = { buildCheckoutPayload };
