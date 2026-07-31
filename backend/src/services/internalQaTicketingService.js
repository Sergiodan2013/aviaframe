'use strict';

const supabase = require('../lib/supabase');
const { config } = require('../config');
const { normalizeHost, getRequestOriginHost, hostMatchesAllowed, isValidUuid } = require('../utils/helpers');
const { issueDrctTicket } = require('./orderService');
const drctService = require('./drctService');

const INTERNAL_QA_STATUSES = {
  REQUESTED: 'requested',
  ISSUED: 'issued',
  CANCELLED: 'cancelled',
  FAILED: 'failed'
};

function buildServiceError(code, message, statusCode = 400, extra = {}) {
  return Object.assign(new Error(message), { code, statusCode, ...extra });
}

function ensureInternalQaConfigured() {
  if (!config.internalQaEnabled) {
    throw buildServiceError('INTERNAL_QA_DISABLED', 'Internal QA ticketing is disabled', 404);
  }
  if (!config.internalQaAgencyId) {
    throw buildServiceError('INTERNAL_QA_CONFIG_MISSING', 'INTERNAL_QA_AGENCY_ID is not configured', 500);
  }
}

function resolveInternalQaRequestHost(req) {
  const originHost = getRequestOriginHost(req);
  if (originHost) return originHost;

  const forwardedHost = normalizeHost(req.headers['x-forwarded-host']);
  if (forwardedHost) return forwardedHost;

  return normalizeHost(req.headers.host);
}

function isInternalQaHostAllowed(host) {
  const normalizedHost = normalizeHost(host);
  const allowedHosts = (config.internalQaAllowedHosts || []).map((value) => normalizeHost(value)).filter(Boolean);

  if (!normalizedHost || !allowedHosts.length) return false;

  return allowedHosts.some((allowedHost) => hostMatchesAllowed(normalizedHost, allowedHost));
}

function resolveRequestIp(req) {
  const forwardedFor = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return forwardedFor || req.ip || req.socket?.remoteAddress || '';
}

function computeVoidDeadline(hours = config.internalQaVoidWindowHours) {
  const safeHours = Number.isFinite(Number(hours)) && Number(hours) > 0 ? Number(hours) : 20;
  return new Date(Date.now() + safeHours * 60 * 60 * 1000).toISOString();
}

function appendInternalQaNote(existingNotes, addition) {
  const base = String(existingNotes || '').trim();
  const next = String(addition || '').trim();
  if (!next) return base || null;
  return base ? `${base}\n${next}` : next;
}

async function getOrderForInternalQa(orderId) {
  const { data: order, error } = await supabase
    .from('orders')
    .select('id,order_number,agency_id,drct_order_id,status,payment_status,payment_method,confirmed_at,cancelled_at,notes,origin,destination,total_price,currency,contact_email,contact_phone,raw_offer_data')
    .eq('id', orderId)
    .maybeSingle();

  if (error) {
    throw buildServiceError('INTERNAL_QA_ORDER_LOOKUP_FAILED', error.message, 500);
  }
  if (!order) {
    throw buildServiceError('ORDER_NOT_FOUND', 'Order not found', 404);
  }
  return order;
}

async function getActiveRunForOrder(orderId) {
  const { data, error } = await supabase
    .from('internal_qa_ticket_runs')
    .select('id,order_id,status,void_deadline_at,issued_at,cancelled_at')
    .eq('order_id', orderId)
    .in('status', [INTERNAL_QA_STATUSES.REQUESTED, INTERNAL_QA_STATUSES.ISSUED])
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    throw buildServiceError('INTERNAL_QA_RUN_LOOKUP_FAILED', error.message, 500);
  }
  return Array.isArray(data) && data.length ? data[0] : null;
}

async function countActiveIssuedRuns() {
  const { data, error } = await supabase
    .from('internal_qa_ticket_runs')
    .select('id')
    .eq('agency_id', config.internalQaAgencyId)
    .in('status', [INTERNAL_QA_STATUSES.REQUESTED, INTERNAL_QA_STATUSES.ISSUED]);

  if (error) {
    throw buildServiceError('INTERNAL_QA_LIMIT_CHECK_FAILED', error.message, 500);
  }

  return Array.isArray(data) ? data.length : 0;
}

async function insertRequestedRun({
  order,
  auth,
  requestHost,
  requestIp,
  reason,
  metadata = {}
}) {
  const payload = {
    order_id: order.id,
    agency_id: order.agency_id,
    drct_order_id: order.drct_order_id || null,
    status: INTERNAL_QA_STATUSES.REQUESTED,
    requested_by: isValidUuid(auth?.profile?.id) ? auth.profile.id : null,
    requested_by_email: auth?.user?.email || auth?.profile?.email || null,
    request_origin_host: requestHost || null,
    request_ip: requestIp || null,
    reason: reason || null,
    metadata
  };

  const { data, error } = await supabase
    .from('internal_qa_ticket_runs')
    .insert(payload)
    .select('*')
    .single();

  if (error || !data) {
    throw buildServiceError('INTERNAL_QA_RUN_CREATE_FAILED', error?.message || 'Failed to create QA run', 500);
  }

  return data;
}

async function markRunFailed(runId, err) {
  if (!runId) return;
  await supabase
    .from('internal_qa_ticket_runs')
    .update({
      status: INTERNAL_QA_STATUSES.FAILED,
      issue_result: {
        code: err.code || 'INTERNAL_QA_ISSUE_FAILED',
        message: err.message || 'Issue failed'
      },
      updated_at: new Date().toISOString()
    })
    .eq('id', runId);
}

async function issueOrderWithoutPayment({
  orderId,
  auth,
  requestHost,
  requestIp,
  reason = ''
}) {
  ensureInternalQaConfigured();

  const order = await getOrderForInternalQa(orderId);
  if (order.agency_id !== config.internalQaAgencyId) {
    throw buildServiceError('INTERNAL_QA_WRONG_AGENCY', 'Order does not belong to the internal QA agency', 403);
  }
  if (!order.drct_order_id) {
    throw buildServiceError('INTERNAL_QA_DRCT_ORDER_REQUIRED', 'Order has no DRCT order id and cannot be issued in production', 409);
  }
  if (String(order.status || '').toLowerCase() === 'ticketed') {
    throw buildServiceError('INTERNAL_QA_ALREADY_TICKETED', 'Order is already ticketed', 409);
  }
  if (String(order.status || '').toLowerCase() === 'cancelled') {
    throw buildServiceError('INTERNAL_QA_CANCELLED_ORDER', 'Cancelled orders cannot be issued', 409);
  }

  const existingRun = await getActiveRunForOrder(order.id);
  if (existingRun) {
    throw buildServiceError('INTERNAL_QA_ALREADY_ACTIVE', 'This order already has an active internal QA ticket run', 409, {
      runId: existingRun.id
    });
  }

  const activeRuns = await countActiveIssuedRuns();
  const limit = Number.isFinite(config.internalQaMaxActiveTickets) && config.internalQaMaxActiveTickets > 0
    ? config.internalQaMaxActiveTickets
    : 5;
  if (activeRuns >= limit) {
    throw buildServiceError('INTERNAL_QA_ACTIVE_LIMIT_REACHED', `Internal QA active ticket limit (${limit}) reached`, 409);
  }

  const nowIso = new Date().toISOString();
  const note = `[internal_qa] issue requested by ${auth?.user?.email || auth?.profile?.id || 'unknown'} at ${nowIso}${reason ? ` — ${reason}` : ''}`;
  const issueMetadata = {
    control: 'internal_qa',
    requested_by_email: auth?.user?.email || auth?.profile?.email || null,
    request_origin_host: requestHost || null
  };

  const run = await insertRequestedRun({
    order,
    auth,
    requestHost,
    requestIp,
    reason,
    metadata: issueMetadata
  });

  try {
    await supabase
      .from('orders')
      .update({
        status: 'confirmed',
        payment_method: 'internal_qa',
        confirmed_at: order.confirmed_at || nowIso,
        notes: appendInternalQaNote(order.notes, note),
        updated_at: nowIso
      })
      .eq('id', order.id);

    const issueResult = await issueDrctTicket({
      order: {
        ...order,
        status: 'confirmed',
        payment_method: 'internal_qa',
        confirmed_at: order.confirmed_at || nowIso,
        notes: appendInternalQaNote(order.notes, note)
      },
      createdBy: auth?.profile?.id || 'internal_qa'
    });

    const voidDeadlineAt = computeVoidDeadline();
    const { data: updatedRun, error: updateError } = await supabase
      .from('internal_qa_ticket_runs')
      .update({
        status: INTERNAL_QA_STATUSES.ISSUED,
        pnr: issueResult.pnr || issueResult.issuance?.pnr || null,
        ticket_number: issueResult.ticketNumber || issueResult.issuance?.ticket_number || null,
        issued_at: nowIso,
        void_deadline_at: voidDeadlineAt,
        issue_result: {
          pnr: issueResult.pnr || issueResult.issuance?.pnr || null,
          ticket_number: issueResult.ticketNumber || issueResult.issuance?.ticket_number || null,
          document_id: issueResult.doc?.id || null,
          issuance_id: issueResult.issuance?.id || null
        },
        updated_at: nowIso
      })
      .eq('id', run.id)
      .select('*')
      .single();

    if (updateError || !updatedRun) {
      throw buildServiceError('INTERNAL_QA_RUN_UPDATE_FAILED', updateError?.message || 'Failed to update QA run', 500);
    }

    return {
      order_id: order.id,
      order_number: order.order_number,
      run: updatedRun,
      issuance: issueResult.issuance,
      document: issueResult.doc,
      signed_url: issueResult.url || null
    };
  } catch (err) {
    await markRunFailed(run.id, err);
    throw err;
  }
}

async function cancelIssuedOrder({
  orderId,
  auth,
  requestHost,
  requestIp,
  reason = ''
}) {
  ensureInternalQaConfigured();

  const order = await getOrderForInternalQa(orderId);
  if (order.agency_id !== config.internalQaAgencyId) {
    throw buildServiceError('INTERNAL_QA_WRONG_AGENCY', 'Order does not belong to the internal QA agency', 403);
  }
  if (!order.drct_order_id) {
    throw buildServiceError('INTERNAL_QA_DRCT_ORDER_REQUIRED', 'Order has no DRCT order id and cannot be cancelled via DRCT', 409);
  }

  const activeRun = await getActiveRunForOrder(order.id);
  if (!activeRun || activeRun.status !== INTERNAL_QA_STATUSES.ISSUED) {
    throw buildServiceError('INTERNAL_QA_NO_ISSUED_RUN', 'No active issued internal QA ticket run found for this order', 404);
  }

  const cancelResult = await drctService.cancelOrder(
    { order_id: order.drct_order_id },
    order.agency_id,
    order.id
  );

  if (!cancelResult?.success) {
    throw buildServiceError(
      cancelResult?.error?.code || 'INTERNAL_QA_CANCEL_FAILED',
      cancelResult?.error?.message || 'Failed to cancel internal QA ticket',
      cancelResult?.error?.statusCode || 502
    );
  }

  const nowIso = new Date().toISOString();
  const note = `[internal_qa] ticket cancelled by ${auth?.user?.email || auth?.profile?.id || 'unknown'} at ${nowIso}${reason ? ` — ${reason}` : ''}`;

  await supabase
    .from('orders')
    .update({
      status: 'cancelled',
      cancelled_at: nowIso,
      notes: appendInternalQaNote(order.notes, note),
      updated_at: nowIso
    })
    .eq('id', order.id);

  const { data: updatedRun, error: updateError } = await supabase
    .from('internal_qa_ticket_runs')
    .update({
      status: INTERNAL_QA_STATUSES.CANCELLED,
      cancelled_at: nowIso,
      cancelled_by: isValidUuid(auth?.profile?.id) ? auth.profile.id : null,
      cancel_reason: reason || null,
      cancel_result: {
        request_origin_host: requestHost || null,
        request_ip: requestIp || null,
        response: cancelResult.data || null
      },
      updated_at: nowIso
    })
    .eq('id', activeRun.id)
    .select('*')
    .single();

  if (updateError || !updatedRun) {
    throw buildServiceError('INTERNAL_QA_RUN_CANCEL_UPDATE_FAILED', updateError?.message || 'Failed to update QA run cancel status', 500);
  }

  return {
    order_id: order.id,
    order_number: order.order_number,
    run: updatedRun,
    cancel_result: cancelResult.data || null
  };
}

async function listActiveIssuedTickets() {
  ensureInternalQaConfigured();

  const { data, error } = await supabase
    .from('internal_qa_ticket_runs')
    .select('id,order_id,agency_id,drct_order_id,status,requested_by,requested_by_email,request_origin_host,request_ip,reason,pnr,ticket_number,issued_at,void_deadline_at,created_at,updated_at')
    .eq('agency_id', config.internalQaAgencyId)
    .in('status', [INTERNAL_QA_STATUSES.REQUESTED, INTERNAL_QA_STATUSES.ISSUED])
    .order('void_deadline_at', { ascending: true });

  if (error) {
    throw buildServiceError('INTERNAL_QA_ACTIVE_LIST_FAILED', error.message, 500);
  }

  return data || [];
}

module.exports = {
  INTERNAL_QA_STATUSES,
  resolveInternalQaRequestHost,
  isInternalQaHostAllowed,
  resolveRequestIp,
  issueOrderWithoutPayment,
  cancelIssuedOrder,
  listActiveIssuedTickets
};
