'use strict';

const { config } = require('../config');
const logger = require('../lib/logger');
const { drctLegacyProxyRequests } = require('../lib/metrics');

const rateLimitStore = new Map();
const DRCT_MUTATING_PROXY_PATHS = new Set([
  '/drct/order/create',
  '/drct/order/issue',
  '/drct/order/cancel',
]);

function toPositiveNumber(value, fallback) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : fallback;
}

function normalizeClientIp(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)[0];
  return forwarded || req.ip || req.socket?.remoteAddress || 'unknown';
}

function normalizeHostLike(value) {
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

function detectLegacyProxyConsumer(req) {
  const originHost = normalizeHostLike(req.headers.origin || '');
  const refererHost = normalizeHostLike(req.headers.referer || '');
  const host = originHost || refererHost || '';

  if (!host) return 'unknown';
  if (host.includes('admin.aviaframe.com')) return 'portal-admin';
  if (host.includes('testenvavia.netlify.app')) return 'portal-preview';
  if (host.includes('netlify.app')) return 'netlify-preview';
  if (host.includes('localhost') || host.includes('127.0.0.1')) return 'local-dev';
  if (host.includes('aviaframe.com')) return 'aviaframe-site';
  return 'external-or-unknown';
}

function hasValidInternalToken(req) {
  const token = String(req.headers['x-internal-token'] || '').trim();
  return Boolean(config.internalApiToken) && token === config.internalApiToken;
}

function cleanupExpiredEntries(now) {
  for (const [key, entry] of rateLimitStore.entries()) {
    if (!entry || entry.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }
}

function createMemoryRateLimiter({
  bucket,
  max,
  windowMs,
  skip,
}) {
  const resolvedMax = toPositiveNumber(max, 60);
  const resolvedWindowMs = toPositiveNumber(windowMs, 60 * 1000);

  return function memoryRateLimiter(req, res, next) {
    if (typeof skip === 'function' && skip(req)) {
      return next();
    }

    const now = Date.now();
    cleanupExpiredEntries(now);

    const key = `${bucket}:${normalizeClientIp(req)}`;
    const existing = rateLimitStore.get(key);
    const entry = (!existing || existing.resetAt <= now)
      ? { count: 0, resetAt: now + resolvedWindowMs }
      : existing;

    entry.count += 1;
    rateLimitStore.set(key, entry);

    const retryAfterSec = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
    res.setHeader('Retry-After', String(retryAfterSec));
    res.setHeader('X-RateLimit-Limit', String(resolvedMax));
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, resolvedMax - entry.count)));

    if (entry.count > resolvedMax) {
      logger.warn({
        bucket,
        ip: normalizeClientIp(req),
        method: req.method,
        path: req.originalUrl || req.path,
      }, 'request rate limit exceeded');

      return res.status(429).json({
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many requests, please retry later',
        }
      });
    }

    return next();
  };
}

function guardDrctMutatingProxy(req, res, next) {
  const targetPath = req.path.replace(/^\/webhook/, '');
  if (!DRCT_MUTATING_PROXY_PATHS.has(targetPath)) {
    return next();
  }

  if (hasValidInternalToken(req)) {
    return next();
  }

  if (config.allowPublicDrctMutatingProxy !== false) {
    const consumer = detectLegacyProxyConsumer(req);
    drctLegacyProxyRequests.inc({
      target_path: targetPath,
      mode: 'compat',
      consumer,
    });
    res.setHeader('Deprecation', 'true');
    res.setHeader('X-Aviaframe-Legacy-Proxy', 'compat');
    logger.warn({
      targetPath,
      ip: normalizeClientIp(req),
      method: req.method,
      origin: req.headers.origin || null,
      referer: req.headers.referer || null,
      userAgent: req.headers['user-agent'] || null,
      consumer,
      mode: 'compat',
    }, 'public DRCT mutating proxy remains enabled');
    return next();
  }

  drctLegacyProxyRequests.inc({
    target_path: targetPath,
    mode: 'blocked',
    consumer: hasValidInternalToken(req) ? 'internal' : detectLegacyProxyConsumer(req),
  });
  logger.warn({
    targetPath,
    ip: normalizeClientIp(req),
    origin: req.headers.origin || null,
    referer: req.headers.referer || null,
    userAgent: req.headers['user-agent'] || null,
    consumer: detectLegacyProxyConsumer(req),
    mode: 'blocked',
  }, 'blocked public DRCT mutating proxy request');

  return res.status(403).json({
    error: {
      code: 'DRCT_PROXY_MUTATION_DISABLED',
      message: 'Public DRCT mutating proxy is disabled',
    }
  });
}

function resetRequestGuardState() {
  rateLimitStore.clear();
}

module.exports = {
  createMemoryRateLimiter,
  detectLegacyProxyConsumer,
  guardDrctMutatingProxy,
  hasValidInternalToken,
  normalizeClientIp,
  resetRequestGuardState,
};
