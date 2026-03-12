'use strict';

// ─── Dual-environment config ──────────────────────────────────────────────────
// DRCT_ENV=sandbox (default) | prod
// Switching to prod = change one env var in Railway. Nothing else changes.
const ENVS = {
  sandbox: {
    base: (process.env.DRCT_SANDBOX_BASE_URL || process.env.DRCT_API_BASE_URL || 'https://sandbox-api.drct.aero').replace(/\/$/, ''),
    token: process.env.DRCT_SANDBOX_TOKEN || process.env.DRCT_BEARER_TOKEN || '',
  },
  prod: {
    base: (process.env.DRCT_PROD_BASE_URL || 'https://api.drct.aero').replace(/\/$/, ''),
    token: process.env.DRCT_PROD_TOKEN || '',
  },
};

function getEnv(envName) {
  return ENVS[envName] || ENVS.sandbox;
}

// Current active env (default: sandbox for all existing routes)
function activeEnv() {
  return getEnv(process.env.DRCT_ENV || 'sandbox');
}

const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504]);

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function drctRequestWithRetry(method, path, body, { maxRetries = 3, env } = {}) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await drctRequest(method, path, body, env);
    } catch (err) {
      const retryable = !err.status || RETRYABLE_STATUS.has(err.status);
      if (!retryable || attempt === maxRetries) throw err;
      const delay = Math.min(1000 * 2 ** attempt + Math.random() * 300, 8000);
      console.warn(`[drct] ${method} ${path} attempt ${attempt + 1} failed (${err.status || 'network'}), retry in ${Math.round(delay)}ms`);
      await sleep(delay);
    }
  }
}

async function drctRequest(method, path, body, env) {
  const { base, token } = env || activeEnv();
  const resp = await fetch(`${base}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'DRCT-Version': '2021-06-01',
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(35000),
  });

  const text = await resp.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }

  if (!resp.ok) {
    const errMsg = typeof data?.error?.message === 'string'
      ? data.error.message
      : (typeof data?.message === 'string' ? data.message : JSON.stringify(data));
    const err = new Error(errMsg || `DRCT ${resp.status}`);
    err.status = resp.status;
    err.data = data;
    throw err;
  }
  return data;
}

// ─── Transform ────────────────────────────────────────────────────────────────

function _formatDuration(seconds) {
  if (!seconds || typeof seconds !== 'number') return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function _detectContentType(fareBasisCode) {
  if (!fareBasisCode) return null;
  if (/\/NDC\d*/i.test(fareBasisCode)) return 'NDC';
  return 'Direct';
}

function _transformSearchResponse(payload) {
  const segments     = Array.isArray(payload.segments)       ? payload.segments       : [];
  const fares        = Array.isArray(payload.fares)          ? payload.fares          : [];
  const flightOptions= Array.isArray(payload.flights_options) ? payload.flights_options : [];
  const directOffers = Array.isArray(payload.offers)         ? payload.offers         : [];

  const segById  = Object.fromEntries(segments.filter(s => s?.id).map(s => [s.id, s]));
  const fareById = Object.fromEntries(fares.filter(f => f?.id).map(f => [f.id, f]));

  const toSegVm = (s) => ({
    id:               s?.id || null,
    origin:           s?.departure_city?.name || s?.departure_airport?.name || s?.departure_airport?.code || null,
    origin_code:      s?.departure_airport?.code || null,
    destination:      s?.arrival_city?.name || s?.arrival_airport?.name || s?.arrival_airport?.code || null,
    destination_code: s?.arrival_airport?.code || null,
    departure:        [s?.departure_date, s?.departure_time].filter(Boolean).join(' ') || null,
    arrival:          [s?.arrival_date,   s?.arrival_time].filter(Boolean).join(' ')   || null,
    carrier: {
      airline_code: s?.carrier?.airline_code || null,
      airline_name: s?.carrier?.airline_name || null,
    },
    flight_number: s?.flight_number || null,
    // ── New fields ──
    duration_seconds: s?.duration || null,
    duration_label:   _formatDuration(s?.duration),   // "2h 50m"
    aircraft:         s?.aircraft || null,
    next_day:         s?.next_day || false,
  });

  function buildOffer(offer, outboundSegs, returnSegs, idx) {
    const allSegs  = [...outboundSegs, ...returnSegs];
    const outFirst = outboundSegs[0] || allSegs[0] || null;
    const outLast  = outboundSegs[outboundSegs.length - 1] || allSegs[allSegs.length - 1] || null;
    const inFirst  = returnSegs[0] || null;
    const inLast   = returnSegs[returnSegs.length - 1] || null;
    const airlineCode = outFirst?.carrier?.airline_code || 'XX';
    const airlineName = outFirst?.carrier?.airline_name || airlineCode;

    // Resolve fare (with full metadata)
    const offerFareRefs = Array.isArray(offer?.fares) ? offer.fares : [];
    const resolvedFares = offerFareRefs.map(f => (f?.id ? (fareById[f.id] || f) : f));
    const resolvedFare  = resolvedFares.find(f => Array.isArray(f?.baggage)) || resolvedFares[0] || null;

    // Baggage — now includes weight
    const baggage = Array.isArray(resolvedFare?.baggage)
      ? resolvedFare.baggage.map(b => ({
          type:       b.type,
          quantity:   b.quantity || 1,
          max_weight: b.max_weight || null,   // {value, unit} e.g. {value:30, unit:"KG"}
          label: (() => {
            if (b.type === 'carry-on') return 'Carry-on';
            const kg = b.max_weight?.value;
            const unit = (b.max_weight?.unit || 'KG').toUpperCase();
            return kg ? `${b.quantity || 1}×${kg}${unit} checked` : `${b.quantity || 1} checked bag`;
          })(),
        }))
      : [];

    // Total outbound duration (sum of segments)
    const outDurationSeconds = outboundSegs.reduce((s, seg) => s + (seg?.duration || 0), 0);
    const inDurationSeconds  = returnSegs.reduce((s, seg) => s + (seg?.duration || 0), 0);

    return {
      offer_id: offer?.id || `offer_${idx}`,
      id:       offer?.id || `offer_${idx}`,
      price: {
        total:    Number(offer?.price?.amount || 0),
        amount:   Number(offer?.price?.amount || 0),
        currency: offer?.price?.currency || 'USD',
      },
      airline_code: airlineCode,
      airline_name: airlineName,
      airline:      airlineCode,
      logo_url: airlineCode !== 'XX' ? `https://pics.avs.io/200/80/${airlineCode}.png` : null,
      origin:            outFirst?.departure_airport?.code || null,
      origin_city:       outFirst?.departure_city?.name   || null,
      destination:       outLast?.arrival_airport?.code   || null,
      destination_city:  outLast?.arrival_city?.name      || null,
      departure_time: [outFirst?.departure_date, outFirst?.departure_time].filter(Boolean).join(' ') || null,
      arrival_time:   [outLast?.arrival_date,    outLast?.arrival_time].filter(Boolean).join(' ')   || null,
      return_origin:            inFirst?.departure_airport?.code || null,
      return_origin_city:       inFirst?.departure_city?.name   || null,
      return_destination:       inLast?.arrival_airport?.code   || null,
      return_destination_city:  inLast?.arrival_city?.name      || null,
      return_departure_time: [inFirst?.departure_date, inFirst?.departure_time].filter(Boolean).join(' ') || null,
      return_arrival_time:   [inLast?.arrival_date,    inLast?.arrival_time].filter(Boolean).join(' ')   || null,
      stops: Math.max(0, outboundSegs.length ? outboundSegs.length - 1 : allSegs.length - 1),
      baggage,
      segments: allSegs.map(toSegVm),
      passengers: Array.isArray(payload.passengers) ? payload.passengers : [],

      // ── New enriched fields ──────────────────────────────────────────────────
      expire_at:         offer?.expire_at || null,
      channel:           offer?.channel   || null,   // "Emirates", "Turkish", "Cashback"
      price_details:     offer?.price_details || null,  // [{type,count,price,fare,taxes}]

      // Fare metadata
      fare_basis_code:   resolvedFare?.fare_basis_code   || null,  // "KLSOSSA1/NDC2"
      price_class_name:  resolvedFare?.price_class_name  || null,  // "Economy Flex"
      cabin_class:       resolvedFare?.cabin_class        || null,  // "Economy" | "Business" | "Premium Economy"
      class_of_service:  resolvedFare?.class_of_service  || null,  // "K"
      content_type:      _detectContentType(resolvedFare?.fare_basis_code), // "NDC" | "Direct"

      // Conditions (refund / change)
      conditions: {
        changeable:        resolvedFare?.changes?.changeable        ?? null,
        change_fee:        resolvedFare?.changes?.fee_applies       ?? null,
        cancelable:        resolvedFare?.cancellation?.cancelable   ?? null,
        cancel_fee:        resolvedFare?.cancellation?.fee_applies  ?? null,
      },

      // Duration labels
      outbound_duration_seconds: outDurationSeconds || null,
      outbound_duration:         _formatDuration(outDurationSeconds),  // "2h 50m"
      inbound_duration_seconds:  inDurationSeconds || null,
      inbound_duration:          _formatDuration(inDurationSeconds),

      // Aircraft (from first outbound segment)
      aircraft: outFirst?.aircraft || null,
    };
  }

  const transformedOffers = [];
  flightOptions.forEach((opt, oi) => {
    const optFlights = Array.isArray(opt?.flights) ? opt.flights : [];
    const outIds = Array.isArray(optFlights[0]?.segments) ? optFlights[0].segments : [];
    const inIds  = Array.isArray(optFlights[1]?.segments) ? optFlights[1].segments : [];
    const outboundSegs = outIds.map(id => segById[id]).filter(Boolean);
    const returnSegs   = inIds.map(id  => segById[id]).filter(Boolean);
    (Array.isArray(opt?.offers) ? opt.offers : []).forEach((offer, oi2) => {
      transformedOffers.push(buildOffer(offer, outboundSegs, returnSegs, `${oi}_${oi2}`));
    });
  });
  if (!transformedOffers.length && directOffers.length) {
    directOffers.forEach((offer, i) => {
      const segIds = (Array.isArray(offer?.fares) ? offer.fares : []).flatMap(f => Array.isArray(f?.segments) ? f.segments : []);
      const allSegs = segIds.map(id => segById[id]).filter(Boolean);
      transformedOffers.push(buildOffer(offer, allSegs, [], i));
    });
  }

  return {
    search_id: payload.search_id || payload.id || `search_${Date.now()}`,
    offers: transformedOffers,
    metadata: { total_offers: transformedOffers.length, timestamp: new Date().toISOString() },
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Search offers. Uses sandbox by default (DRCT_ENV=sandbox).
 * Pass envName='prod' to explicitly use prod (for v2 route).
 */
async function search(params, envName) {
  const env = envName ? getEnv(envName) : activeEnv();
  const flights = [{
    departure_airport_code: (params.origin || '').toUpperCase(),
    arrival_airport_code:   (params.destination || '').toUpperCase(),
    departure_date: params.depart_date,
  }];
  if (params.return_date) {
    flights.push({
      departure_airport_code: (params.destination || '').toUpperCase(),
      arrival_airport_code:   (params.origin || '').toUpperCase(),
      departure_date: params.return_date,
    });
  }
  const passengers = [];
  for (let i = 0; i < (params.adults || 1); i++) passengers.push({ type: 'ADT' });
  for (let i = 0; i < (params.children || 0); i++) passengers.push({ type: 'CHD' });
  for (let i = 0; i < (params.infants || 0); i++) passengers.push({ type: 'INF' });

  const drctBody = { flights, passengers };
  if (params.cabin_class) drctBody.filters = { cabin_class: params.cabin_class.toLowerCase() };

  const raw = await drctRequestWithRetry('POST', '/offers_search', drctBody, { env });
  return _transformSearchResponse(raw);
}

/**
 * Get updated price for an offer before booking.
 */
function priceOffer(offerId, passengers, envName) {
  const env = envName ? getEnv(envName) : activeEnv();
  return drctRequestWithRetry('PATCH', `/offers/${offerId}/price`, { passengers }, { env });
}

/**
 * Create a DRCT order. No retry — not safe to duplicate.
 */
function createOrder(payload, envName) {
  const env = envName ? getEnv(envName) : activeEnv();
  return drctRequest('POST', '/orders', payload, env);
}

/**
 * Issue tickets for a DRCT order. No retry — not safe to duplicate.
 */
function issueOrder(orderId, envName) {
  const env = envName ? getEnv(envName) : activeEnv();
  return drctRequest('POST', `/orders/${orderId}/issue`, undefined, env);
}

/**
 * Cancel a DRCT order. Only valid for refundable fares. No retry — not safe to duplicate.
 */
function cancelOrder(orderId, envName) {
  const env = envName ? getEnv(envName) : activeEnv();
  return drctRequest('DELETE', `/orders/${orderId}`, undefined, env);
}

module.exports = { search, priceOffer, createOrder, issueOrder, cancelOrder, getEnv, activeEnv };
