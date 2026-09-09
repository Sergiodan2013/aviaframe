'use strict';

const crypto = require('crypto');

function attachCorrelationId(req, res, next) {
  const supplied = String(req.headers['x-correlation-id'] || '').trim();
  req.correlationId = supplied.slice(0, 128) || crypto.randomUUID();
  res.setHeader('X-Correlation-ID', req.correlationId);
  next();
}

function buildApiError(correlationId, code, message, details = []) {
  return {
    code,
    message,
    details: Array.isArray(details) ? details : [details],
    correlation_id: correlationId || null,
  };
}

function sendApiError(res, status, code, message, details = []) {
  return res.status(status).json(buildApiError(res.req?.correlationId, code, message, details));
}

module.exports = { attachCorrelationId, buildApiError, sendApiError };
