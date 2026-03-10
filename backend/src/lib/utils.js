'use strict';

const crypto = require('crypto');

function toIsoDateStart(v) {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function toIsoDateEnd(v) {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

function normalizeRole(role) {
  const normalized = String(role || 'user').trim().toLowerCase().replace(/-/g, '_');
  if (normalized === 'superadmin') return 'super_admin';
  if (normalized === 'agency_admin' || normalized === 'agency') return 'agent';
  if (normalized === 'administrator') return 'admin';
  if (['admin', 'super_admin', 'agent', 'user'].includes(normalized)) return normalized;
  return 'user';
}

function isAdminRole(role) {
  return ['admin', 'super_admin'].includes(normalizeRole(role));
}

function isStaffRole(role) {
  return ['admin', 'super_admin', 'agent'].includes(normalizeRole(role));
}

function isAgentRole(role) {
  return normalizeRole(role) === 'agent';
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

function getRequestOriginHost(req) {
  const origin = req.headers.origin;
  if (origin) return normalizeHost(origin);
  const referer = req.headers.referer;
  if (referer) return normalizeHost(referer);
  return '';
}

function hostMatchesAllowed(host, allowedHost) {
  if (!host || !allowedHost) return false;
  if (host === allowedHost) return true;
  return host.endsWith(`.${allowedHost}`);
}

function isWidgetOriginAllowed(agency, requestHost, nodeEnv) {
  const host = normalizeHost(requestHost);
  if (!host) return false;
  if (nodeEnv !== 'production' && (host === 'localhost' || host === '127.0.0.1')) {
    return true;
  }

  const settings = agency?.settings || {};
  const allowed = [];
  if (agency?.domain) allowed.push(normalizeHost(agency.domain));
  const settingsAllowed = Array.isArray(settings?.widget_allowed_domains)
    ? settings.widget_allowed_domains
    : [];
  settingsAllowed.forEach((d) => allowed.push(normalizeHost(d)));

  const uniq = [...new Set(allowed.filter(Boolean))];
  if (!uniq.length) return false;
  return uniq.some((d) => hostMatchesAllowed(host, d));
}

function generateOrderNumber() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

function generateInvoiceNumber() {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  const rnd = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `INV-${y}${m}${d}-${rnd}`;
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function mapProviderEventToOutboxStatus(eventName) {
  const e = String(eventName || '').trim().toLowerCase();
  if (!e) return null;
  if (['sent', 'processed', 'queued', 'accepted'].includes(e)) return 'sent';
  if (['delivered', 'delivery'].includes(e)) return 'delivered';
  if (['open', 'opened'].includes(e)) return 'opened';
  if (['click', 'clicked'].includes(e)) return 'clicked';
  if (['bounce', 'bounced', 'hard_bounce', 'soft_bounce', 'dropped', 'reject', 'rejected'].includes(e)) return 'bounced';
  if (['complaint', 'complained', 'spamreport', 'spam_report'].includes(e)) return 'complained';
  if (['failed', 'error'].includes(e)) return 'failed';
  return null;
}

module.exports = {
  toIsoDateStart,
  toIsoDateEnd,
  normalizeRole,
  isAdminRole,
  isStaffRole,
  isAgentRole,
  normalizeHost,
  getRequestOriginHost,
  hostMatchesAllowed,
  isWidgetOriginAllowed,
  generateOrderNumber,
  generateInvoiceNumber,
  normalizeEmail,
  mapProviderEventToOutboxStatus,
};
