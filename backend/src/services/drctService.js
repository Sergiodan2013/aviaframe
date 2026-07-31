// DRCT Service — reliability layer wrapping n8nClient
// All DRCT operations: rate limiter (drctQueue) → circuit breaker → n8nClient → n8n → DRCT API

const n8nClient = require('./n8nClient');
const drctQueue = require('./drctQueue');
const { createDrctCircuitBreaker } = require('./drctCircuitBreaker');
const { withRetry } = require('../utils/retry');
const drctDirectClient = require('./drctDirectClient');
const logger = require('../lib/logger');

const SANDBOX_WIDGET_HOSTS = new Set(['sandbox.aviaframe.com']);

function hasSandboxConfig() {
  return Boolean(
    process.env.DRCT_SANDBOX_TOKEN
    || process.env.DRCT_TEST_TOKEN
    || process.env.DRCT_SANDBOX_BEARER_TOKEN
    || (
      String(process.env.DRCT_API_BASE_URL || '').includes('sandbox-api.drct.aero')
      && process.env.DRCT_BEARER_TOKEN
    )
  );
}

function normalizeHost(value) {
  if (!value) return '';
  const raw = String(value).trim().toLowerCase();
  try {
    if (raw.startsWith('http://') || raw.startsWith('https://')) {
      return new URL(raw).hostname.toLowerCase();
    }
    return raw.split('/')[0].split(':')[0].trim().toLowerCase();
  } catch {
    return raw.split('/')[0].split(':')[0].trim().toLowerCase();
  }
}

function shouldUseSandboxForHost(host) {
  return hasSandboxConfig() && SANDBOX_WIDGET_HOSTS.has(normalizeHost(host || ''));
}

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

async function issueOrder(drctOrderId, { orderId, agencyId, originHost = null } = {}) {
  if (shouldUseSandboxForHost(originHost)) {
    const data = await drctDirectClient.issueOrder(
      { order_id: drctOrderId },
      {
        idempotencyKey: `issue-${orderId || drctOrderId}`,
        sandbox: true,
      }
    );
    return {
      pnr: data.pnr || data.booking_reference || drctOrderId,
      ticket_number: data.ticket_number || (Array.isArray(data.tickets) && data.tickets[0]?.number) || null,
      status: data.status || 'issued',
      raw: data,
    };
  }

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

// Read a live order straight from DRCT (bypasses n8n) to get the real airline locator
// and e-ticket numbers for the ticket PDF/email. Read-only.
async function getOrderDetails(drctOrderId, { originHost = null } = {}) {
  return drctDirectClient.getOrder(drctOrderId, { sandbox: shouldUseSandboxForHost(originHost) });
}

async function cancelOrder(cancelParams, tenantId, bookingId) {
  const n8nResult = await drctCall(
    breakers.cancel,
    { params: cancelParams, tenantId, bookingId },
    'drct-cancel'
  );

  if (hasMeaningfulCancelPayload(n8nResult)) {
    return n8nResult;
  }

  logger.warn({
    tenantId,
    bookingId,
    order_id: cancelParams?.order_id || null,
    n8n_success: n8nResult?.success === true,
    n8n_payload_type: typeof n8nResult?.data,
  }, 'drct-cancel falling back to direct DRCT production request');

  try {
    const data = await drctDirectClient.cancelOrder(cancelParams);
    return {
      success: true,
      data,
      correlationId: n8nResult?.correlationId || null,
      fallback: 'direct-drct',
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: error.code || 'DRCT_CANCEL_FAILED',
        message: error.message || 'Failed to cancel order',
        statusCode: error.statusCode || error.response?.status || 500,
        correlationId: n8nResult?.correlationId || null,
      }
    };
  }
}

function hasMeaningfulCancelPayload(result) {
  if (!result?.success) return false;
  const payload = result.data;
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return false;
  if (Object.keys(payload).length === 0) return false;
  if (typeof payload.status !== 'string' && typeof payload.order_id !== 'string') return false;
  return true;
}

// Expose breaker states for /healthz/deep
function getBreakerStates() {
  return Object.fromEntries(
    Object.entries(breakers).map(([name, b]) => [name, b.opened ? 'open' : 'closed'])
  );
}

module.exports = { searchOffers, priceOffer, createOrder, issueOrder, getOrderDetails, cancelOrder, getBreakerStates };
