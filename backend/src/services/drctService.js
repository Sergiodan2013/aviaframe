// DRCT Service — reliability layer wrapping n8nClient
// All DRCT operations: rate limiter (drctQueue) → circuit breaker → n8nClient → n8n → DRCT API

const n8nClient = require('./n8nClient');
const drctQueue = require('./drctQueue');
const { createDrctCircuitBreaker } = require('./drctCircuitBreaker');
const { withRetry } = require('../utils/retry');

// One circuit breaker per operation so failures are tracked independently
const breakers = {
  search:      createDrctCircuitBreaker((p) => n8nClient.drctSearch(p.params, p.tenantId), 'drct-search'),
  price:       createDrctCircuitBreaker((p) => n8nClient.drctPrice(p.params, p.tenantId), 'drct-price'),
  orderCreate: createDrctCircuitBreaker((p) => n8nClient.drctCreateOrder(p.params, p.tenantId, p.bookingId), 'drct-order-create'),
  issue:       createDrctCircuitBreaker((p) => n8nClient.drctIssue(p.params, p.tenantId, p.bookingId), 'drct-issue'),
  cancel:      createDrctCircuitBreaker((p) => n8nClient.drctCancel(p.params, p.tenantId, p.bookingId), 'drct-cancel'),
};

// Rate-limited + retried circuit breaker call
function drctCall(breaker, payload, label) {
  return drctQueue.schedule(() =>
    withRetry(() => breaker.fire(payload), { label, maxAttempts: 3 })
  );
}

async function searchOffers(searchParams, tenantId) {
  return drctCall(breakers.search, { params: searchParams, tenantId }, 'drct-search');
}

async function priceOffer(priceParams, tenantId) {
  return drctCall(breakers.price, { params: priceParams, tenantId }, 'drct-price');
}

async function createOrder(orderParams, tenantId, bookingId) {
  return drctCall(breakers.orderCreate, { params: orderParams, tenantId, bookingId }, 'drct-order-create');
}

async function issueOrder(drctOrderId, { orderId, agencyId } = {}) {
  const result = await drctCall(
    breakers.issue,
    { params: { order_id: drctOrderId }, tenantId: agencyId || null, bookingId: orderId || null },
    'drct-issue'
  );

  if (!result.success) {
    throw new Error(result.error?.message || 'DRCT issue failed');
  }

  const data = result.data || {};
  return {
    pnr: data.pnr || data.booking_reference || drctOrderId,
    ticket_number: data.ticket_number || (Array.isArray(data.tickets) && data.tickets[0]?.number) || null,
    status: data.status || 'issued',
    raw: data
  };
}

async function cancelOrder(cancelParams, tenantId, bookingId) {
  return drctCall(breakers.cancel, { params: cancelParams, tenantId, bookingId }, 'drct-cancel');
}

// Expose breaker states for /healthz/deep
function getBreakerStates() {
  return Object.fromEntries(
    Object.entries(breakers).map(([name, b]) => [name, b.opened ? 'open' : 'closed'])
  );
}

module.exports = { searchOffers, priceOffer, createOrder, issueOrder, cancelOrder, getBreakerStates };
