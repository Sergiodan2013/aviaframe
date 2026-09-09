'use strict';

const LEGACY_LIVE_PAYMENT_SUBDOMAINS = new Set(
  String(process.env.LIVE_PAYMENT_AGENCY_SUBDOMAINS || 'almalektravel')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
);

function getAgencySubdomain(agency = {}) {
  const domain = String(agency.domain || '').trim().toLowerCase();
  const match = domain.match(/^([a-z0-9-]+)\.aviaframe\.com$/);
  return match ? match[1] : '';
}

function resolveAgencyPaymentMode(agency = {}) {
  const explicitMode = String(
    agency?.settings?.payment_mode || agency?.settings?.payments?.mode || ''
  ).trim().toLowerCase();

  if (explicitMode === 'live') return 'live';
  if (explicitMode === 'demo') return 'demo';

  // Preserve the explicitly approved live tenant while agencies are migrated to
  // the persisted payment_mode setting. All other tenants fail safe to demo.
  return LEGACY_LIVE_PAYMENT_SUBDOMAINS.has(getAgencySubdomain(agency)) ? 'live' : 'demo';
}

function isAgencyDemoPaymentMode(agency = {}) {
  return resolveAgencyPaymentMode(agency) !== 'live';
}

module.exports = {
  resolveAgencyPaymentMode,
  isAgencyDemoPaymentMode
};
