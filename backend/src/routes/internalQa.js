'use strict';

const express = require('express');
const router = express.Router();
const { requireInternalToken, resolveAuthContext, ensureAdmin } = require('../middleware/auth');
const { config } = require('../config');
const {
  resolveInternalQaRequestHost,
  isInternalQaHostAllowed,
  resolveRequestIp,
  issueOrderWithoutPayment,
  cancelIssuedOrder,
  listActiveIssuedTickets
} = require('../services/internalQaTicketingService');

function respondServiceError(res, err) {
  return res.status(err.statusCode || 500).json({
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'Internal server error'
    }
  });
}

async function requireInternalQaAccess(req, res) {
  if (!config.internalQaEnabled) {
    res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: 'Route not found'
      }
    });
    return null;
  }

  if (!requireInternalToken(req, res)) return null;

  const auth = await resolveAuthContext(req);
  if (auth.error) {
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: auth.error } });
    return null;
  }

  if (!ensureAdmin(auth, res)) return null;

  const requestHost = resolveInternalQaRequestHost(req);
  if (!isInternalQaHostAllowed(requestHost)) {
    res.status(403).json({
      error: {
        code: 'INTERNAL_QA_HOST_NOT_ALLOWED',
        message: `Host ${requestHost || 'unknown'} is not allowed for internal QA`
      }
    });
    return null;
  }

  return {
    auth,
    requestHost,
    requestIp: resolveRequestIp(req)
  };
}

router.get('/active-tickets', async (req, res) => {
  const access = await requireInternalQaAccess(req, res);
  if (!access) return;

  try {
    const tickets = await listActiveIssuedTickets();
    return res.json({ tickets });
  } catch (err) {
    return respondServiceError(res, err);
  }
});

router.post('/orders/:orderId/issue-without-payment', async (req, res) => {
  const access = await requireInternalQaAccess(req, res);
  if (!access) return;

  try {
    const result = await issueOrderWithoutPayment({
      orderId: req.params.orderId,
      auth: access.auth,
      requestHost: access.requestHost,
      requestIp: access.requestIp,
      reason: String(req.body?.reason || '').trim()
    });
    return res.status(200).json(result);
  } catch (err) {
    return respondServiceError(res, err);
  }
});

router.post('/orders/:orderId/cancel-issued-ticket', async (req, res) => {
  const access = await requireInternalQaAccess(req, res);
  if (!access) return;

  try {
    const result = await cancelIssuedOrder({
      orderId: req.params.orderId,
      auth: access.auth,
      requestHost: access.requestHost,
      requestIp: access.requestIp,
      reason: String(req.body?.reason || '').trim()
    });
    return res.status(200).json(result);
  } catch (err) {
    return respondServiceError(res, err);
  }
});

module.exports = router;
