'use strict';

const { sendApiError } = require('./http');

const buckets = new Map();
const DEFAULT_LIMITS = {
  search: 20,
  price: 30,
  mutations: 10,
};

function createPartnerRateLimiter(operation, { windowMs = 60 * 1000 } = {}) {
  return function partnerRateLimit(req, res, next) {
    const client = req.partnerContext?.client;
    if (!client?.id) return sendApiError(res, 401, 'UNAUTHORIZED', 'API client context is missing');

    const configured = Number(client.rate_limits?.[`${operation}_per_minute`]);
    const maximum = Number.isFinite(configured) && configured > 0
      ? configured
      : DEFAULT_LIMITS[operation] || DEFAULT_LIMITS.mutations;
    const now = Date.now();
    const key = `${client.id}:${operation}`;
    const current = buckets.get(key);
    const entry = !current || current.resetAt <= now
      ? { count: 0, resetAt: now + windowMs }
      : current;
    entry.count += 1;
    buckets.set(key, entry);

    const retryAfter = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
    res.setHeader('X-RateLimit-Limit', String(maximum));
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, maximum - entry.count)));
    if (entry.count > maximum) {
      res.setHeader('Retry-After', String(retryAfter));
      return sendApiError(res, 429, 'RATE_LIMITED', 'Too many requests');
    }
    return next();
  };
}

function resetPartnerRateLimits() {
  buckets.clear();
}

module.exports = { createPartnerRateLimiter, resetPartnerRateLimits };
