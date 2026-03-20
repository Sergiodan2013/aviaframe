// DRCT Service
// Thin wrapper around n8nClient for DRCT ticket operations

const n8nClient = require('./n8nClient');

/**
 * Issue tickets for a DRCT order via n8n webhook.
 * Returns { pnr, ticket_number, status, raw }.
 */
async function issueOrder(drctOrderId, { orderId, agencyId } = {}) {
  const result = await n8nClient.drctIssue(
    { order_id: drctOrderId },
    agencyId || null,
    orderId || null
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

module.exports = { issueOrder };
