'use strict';

const axios = require('axios');

const BASE_URL = process.env.TAMARA_BASE_URL || 'https://api-sandbox.tamara.co';
const API_TOKEN = process.env.TAMARA_API_TOKEN || '';
const MERCHANT_ID = process.env.TAMARA_MERCHANT_ID || '';

function tamaraHttp() {
  const token = API_TOKEN.trim(); // strip any accidental whitespace/newlines from env var
  return axios.create({
    baseURL: BASE_URL,
    timeout: 30000,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    validateStatus: null // handle all statuses manually for better error messages
  });
}

/**
 * Create Tamara checkout session.
 * Returns { checkout_id, checkout_url, order_id }
 */
async function createCheckoutSession(payload) {
  const http = tamaraHttp();
  const resp = await http.post('/checkout', payload);
  if (resp.status >= 400) {
    console.error(`[tamara-client] createCheckoutSession failed ${resp.status}:`, JSON.stringify(resp.data));
    const err = new Error(resp.data?.message || `Tamara API error ${resp.status}`);
    err.response = resp;
    throw err;
  }
  return resp.data;
}

/**
 * Authorise a Tamara order (must be called after approved webhook).
 */
async function authoriseOrder(tamaraOrderId) {
  const http = tamaraHttp();
  const resp = await http.post(`/orders/${tamaraOrderId}/authorise`);
  return resp.data;
}

/**
 * Capture full amount for a Tamara order.
 */
async function captureOrder(tamaraOrderId, { totalAmount, currency, orderId }) {
  const http = tamaraHttp();
  const resp = await http.post(`/payments/capture`, {
    order_id: tamaraOrderId,
    total_amount: { amount: String(totalAmount), currency },
    seller_id: MERCHANT_ID,
    items: []
  });
  return resp.data;
}

/**
 * Cancel a Tamara order (full cancel only for MVP).
 */
async function cancelOrder(tamaraOrderId) {
  const http = tamaraHttp();
  const resp = await http.post(`/orders/${tamaraOrderId}/cancel`, {
    cancel_reason: 'Ticket issuance failed'
  });
  return resp.data;
}

/**
 * Refund a Tamara order (full refund only for MVP).
 */
async function refundOrder(tamaraOrderId, { totalAmount, currency, comment = '' }) {
  const http = tamaraHttp();
  const resp = await http.post(`/payments/simplified-refund/${tamaraOrderId}`, {
    total_amount: { amount: String(totalAmount), currency },
    comment
  });
  return resp.data;
}

/**
 * Get Tamara order status.
 */
async function getOrderStatus(tamaraOrderId) {
  const http = tamaraHttp();
  const resp = await http.get(`/orders/${tamaraOrderId}`);
  return resp.data;
}

module.exports = {
  createCheckoutSession,
  authoriseOrder,
  captureOrder,
  cancelOrder,
  refundOrder,
  getOrderStatus
};
