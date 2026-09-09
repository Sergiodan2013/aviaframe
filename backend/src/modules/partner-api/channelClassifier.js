'use strict';

const KNOWN_CHANNELS = new Set(['GDS', 'NDC', 'LCC']);

// DRCT's normalized search response exposes commercial source names in
// `channel`, not always the commercial distribution family AviaFrame prices
// against. Keep these provider-known aliases as a safe fallback; database
// mappings are evaluated first so operations can override them without a
// deployment when DRCT changes a source label.
const DEFAULT_UPSTREAM_CHANNELS = new Map([
  ['CASHBACK', 'GDS'],
  ['LUFTHANSA GROUP', 'NDC'],
  ['FLYNAS', 'LCC'],
]);

const DEFAULT_OFFER_PREFIX_CHANNELS = new Map([
  ['GL', 'GDS'],
  ['LH', 'NDC'],
  ['XY', 'LCC'],
]);

function normalizeCarrier(value) {
  const carrier = String(value || '').trim().toUpperCase();
  return /^[A-Z0-9]{2,3}$/.test(carrier) ? carrier : 'UNKNOWN';
}

function classifyDistributionChannel(offer = {}, mappings = []) {
  const raw = String(offer.distribution_channel || offer.channel || '').trim();
  const normalizedRaw = raw.toUpperCase();
  if (KNOWN_CHANNELS.has(normalizedRaw)) return normalizedRaw;

  const offerId = String(offer.offer_id || offer.id || '').trim().toUpperCase();
  const carrier = normalizeCarrier(
    offer.validating_carrier || offer.airline_code || offer.airline || offer.carrier_code,
  );

  const candidates = (Array.isArray(mappings) ? mappings : [])
    .filter((mapping) => mapping?.is_active !== false)
    .sort((left, right) => Number(right.priority || 0) - Number(left.priority || 0));

  for (const mapping of candidates) {
    const channelMatches = !mapping.upstream_channel
      || String(mapping.upstream_channel).trim().toUpperCase() === normalizedRaw;
    const prefixMatches = !mapping.offer_id_prefix
      || offerId.startsWith(String(mapping.offer_id_prefix).trim().toUpperCase());
    const carrierMatches = !mapping.carrier_code
      || carrier === normalizeCarrier(mapping.carrier_code);
    if (channelMatches && prefixMatches && carrierMatches) {
      const result = String(mapping.distribution_channel || '').toUpperCase();
      if (KNOWN_CHANNELS.has(result)) return result;
    }
  }

  const defaultChannel = DEFAULT_UPSTREAM_CHANNELS.get(normalizedRaw);
  if (defaultChannel) return defaultChannel;

  const offerPrefix = offerId.split('_')[0];
  const prefixChannel = DEFAULT_OFFER_PREFIX_CHANNELS.get(offerPrefix);
  if (prefixChannel) return prefixChannel;

  if (/\bNDC\b/.test(normalizedRaw)) return 'NDC';
  if (/\b(GDS|GALILEO|AMADEUS|SABRE|WORLDSPAN)\b/.test(normalizedRaw)) return 'GDS';
  if (/\b(LCC|LOW\s*COST)\b/.test(normalizedRaw)) return 'LCC';
  return 'UNKNOWN';
}

module.exports = { classifyDistributionChannel, normalizeCarrier };
