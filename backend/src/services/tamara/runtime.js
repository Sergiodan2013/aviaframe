'use strict';

const jwt = require('jsonwebtoken');

const SANDBOX_TAMARA_HOSTS = new Set([
  'sandbox.aviaframe.com',
  'aviaframe.com',
  'www.aviaframe.com',
  'testenvavia.netlify.app',
  'localhost',
  '127.0.0.1'
]);

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

function resolveRequestOriginHost(req = {}) {
  return normalizeHost(
    req.query?.origin_host ||
    req.body?.origin_host ||
    req.body?.metadata?.origin_host ||
    req.headers?.['x-origin-host'] ||
    req.headers?.origin ||
    req.headers?.referer ||
    ''
  );
}

function resolveOrderOriginHost(order = {}) {
  return normalizeHost(order?.raw_offer_data?.metadata?.origin_host || order?.metadata?.origin_host || '');
}

function shouldUseSandboxForHost(host) {
  return SANDBOX_TAMARA_HOSTS.has(normalizeHost(host || ''));
}

function buildConfig({
  environment,
  baseUrl,
  apiToken,
  merchantId,
  publicKey,
  notificationToken
}) {
  const normalizedApiToken = String(apiToken || '').trim();
  const normalizedMerchantId = String(merchantId || '').trim();
  const normalizedPublicKey = String(publicKey || '').trim();
  const normalizedNotificationToken = String(notificationToken || '').trim();

  return {
    environment,
    baseUrl: String(baseUrl || '').trim(),
    apiToken: normalizedApiToken,
    merchantId: normalizedMerchantId,
    publicKey: normalizedPublicKey,
    notificationToken: normalizedNotificationToken,
    enabled:
      process.env.TAMARA_ENABLED === 'true'
      && Boolean(normalizedApiToken)
      && Boolean(normalizedMerchantId)
      && Boolean(normalizedPublicKey)
      && Boolean(normalizedNotificationToken)
  };
}

function getSandboxConfig() {
  return buildConfig({
    environment: 'sandbox',
    baseUrl: process.env.TAMARA_SANDBOX_BASE_URL || 'https://api-sandbox.tamara.co',
    apiToken: process.env.TAMARA_SANDBOX_API_TOKEN || '',
    merchantId: process.env.TAMARA_SANDBOX_MERCHANT_ID || process.env.TAMARA_MERCHANT_ID || '',
    publicKey: process.env.TAMARA_SANDBOX_PUBLIC_KEY || '',
    notificationToken: process.env.TAMARA_SANDBOX_NOTIFICATION_TOKEN || ''
  });
}

function getLiveConfig() {
  return buildConfig({
    environment: process.env.TAMARA_ENV || 'production',
    baseUrl: process.env.TAMARA_BASE_URL || 'https://api.tamara.co',
    apiToken: process.env.TAMARA_API_TOKEN || '',
    merchantId: process.env.TAMARA_MERCHANT_ID || '',
    publicKey: process.env.TAMARA_PUBLIC_KEY || '',
    notificationToken: process.env.TAMARA_NOTIFICATION_TOKEN || ''
  });
}

function getTamaraConfigForHost(host) {
  if (shouldUseSandboxForHost(host)) return getSandboxConfig();
  return getLiveConfig();
}

function getTamaraConfigForOrder(order = {}) {
  return getTamaraConfigForHost(resolveOrderOriginHost(order));
}

function validateNotificationToken(token) {
  const rawToken = String(token || '').trim();
  if (!rawToken) return { valid: false, error: 'Missing tamaraToken' };

  const configs = [getLiveConfig(), getSandboxConfig()]
    .filter((cfg, index, arr) => cfg.notificationToken && arr.findIndex((x) => x.notificationToken === cfg.notificationToken) === index);

  if (!configs.length) {
    return { valid: false, error: 'No Tamara notification tokens configured' };
  }

  for (const cfg of configs) {
    if (rawToken === cfg.notificationToken) {
      return { valid: true, environment: cfg.environment };
    }
    try {
      const decoded = jwt.verify(rawToken, cfg.notificationToken, { algorithms: ['HS256'] });
      return { valid: true, environment: cfg.environment, decoded };
    } catch (_) {
      // Try next configured token.
    }
  }

  return { valid: false, error: 'Invalid webhook token' };
}

module.exports = {
  getTamaraConfigForHost,
  getTamaraConfigForOrder,
  normalizeHost,
  resolveOrderOriginHost,
  resolveRequestOriginHost,
  shouldUseSandboxForHost,
  validateNotificationToken
};
