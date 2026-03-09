'use strict';

const DRCT_BASE = (process.env.DRCT_API_BASE_URL || 'https://sandbox-api.drct.aero').replace(/\/$/, '');
const DRCT_TOKEN = process.env.DRCT_BEARER_TOKEN || '';

const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504]);

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function drctRequestWithRetry(method, path, body, { maxRetries = 3 } = {}) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await drctRequest(method, path, body);
    } catch (err) {
      const retryable = !err.status || RETRYABLE_STATUS.has(err.status);
      if (!retryable || attempt === maxRetries) throw err;
      const delay = Math.min(1000 * 2 ** attempt + Math.random() * 300, 8000);
      console.warn(`[drct] ${method} ${path} attempt ${attempt + 1} failed (${err.status || 'network'}), retry in ${Math.round(delay)}ms`);
      await sleep(delay);
    }
  }
}

async function drctRequest(method, path, body) {
  const resp = await fetch(`${DRCT_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${DRCT_TOKEN}`,
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

function _transformSearchResponse(payload) {
  const segments = Array.isArray(payload.segments) ? payload.segments : [];
  const fares = Array.isArray(payload.fares) ? payload.fares : [];
  const flightOptions = Array.isArray(payload.flights_options) ? payload.flights_options : [];
  const directOffers = Array.isArray(payload.offers) ? payload.offers : [];

  const segById = Object.fromEntries(segments.filter(s => s?.id).map(s => [s.id, s]));
  const fareById = Object.fromEntries(fares.filter(f => f?.id).map(f => [f.id, f]));

  const toSegVm = (s) => ({
    id: s?.id || null,
    origin: s?.departure_city?.name || s?.departure_airport?.name || s?.departure_airport?.code || null,
    origin_code: s?.departure_airport?.code || null,
    destination: s?.arrival_city?.name || s?.arrival_airport?.name || s?.arrival_airport?.code || null,
    destination_code: s?.arrival_airport?.code || null,
    departure: [s?.departure_date, s?.departure_time].filter(Boolean).join(' ') || null,
    arrival: [s?.arrival_date, s?.arrival_time].filter(Boolean).join(' ') || null,
    carrier: { airline_code: s?.carrier?.airline_code || null, airline_name: s?.carrier?.airline_name || null },
    flight_number: s?.flight_number || null,
  });

  function buildOffer(offer, outboundSegs, returnSegs, idx) {
    const allSegs = [...outboundSegs, ...returnSegs];
    const outFirst = outboundSegs[0] || allSegs[0] || null;
    const outLast = outboundSegs[outboundSegs.length - 1] || allSegs[allSegs.length - 1] || null;
    const inFirst = returnSegs[0] || null;
    const inLast = returnSegs[returnSegs.length - 1] || null;
    const airlineCode = outFirst?.carrier?.airline_code || 'XX';
    const airlineName = outFirst?.carrier?.airline_name || airlineCode;
    const offerFareRefs = Array.isArray(offer?.fares) ? offer.fares : [];
    const resolvedFare = offerFareRefs
      .map(f => (f?.id ? (fareById[f.id] || f) : f))
      .find(f => Array.isArray(f?.baggage));
    return {
      offer_id: offer?.id || `offer_${idx}`,
      id: offer?.id || `offer_${idx}`,
      price: {
        total: Number(offer?.price?.amount || 0),
        amount: Number(offer?.price?.amount || 0),
        currency: offer?.price?.currency || 'USD',
      },
      airline_code: airlineCode,
      airline_name: airlineName,
      airline: airlineCode,
      logo_url: airlineCode !== 'XX' ? `https://pics.avs.io/200/80/${airlineCode}.png` : null,
      origin: outFirst?.departure_airport?.code || null,
      origin_city: outFirst?.departure_city?.name || null,
      destination: outLast?.arrival_airport?.code || null,
      destination_city: outLast?.arrival_city?.name || null,
      departure_time: [outFirst?.departure_date, outFirst?.departure_time].filter(Boolean).join(' ') || null,
      arrival_time: [outLast?.arrival_date, outLast?.arrival_time].filter(Boolean).join(' ') || null,
      return_origin: inFirst?.departure_airport?.code || null,
      return_origin_city: inFirst?.departure_city?.name || null,
      return_destination: inLast?.arrival_airport?.code || null,
      return_destination_city: inLast?.arrival_city?.name || null,
      return_departure_time: [inFirst?.departure_date, inFirst?.departure_time].filter(Boolean).join(' ') || null,
      return_arrival_time: [inLast?.arrival_date, inLast?.arrival_time].filter(Boolean).join(' ') || null,
      stops: Math.max(0, outboundSegs.length ? outboundSegs.length - 1 : allSegs.length - 1),
      baggage: Array.isArray(resolvedFare?.baggage) ? resolvedFare.baggage : [],
      segments: allSegs.map(toSegVm),
      passengers: Array.isArray(payload.passengers) ? payload.passengers : [],
    };
  }

  const transformedOffers = [];
  flightOptions.forEach((opt, oi) => {
    const optFlights = Array.isArray(opt?.flights) ? opt.flights : [];
    const outIds = Array.isArray(optFlights[0]?.segments) ? optFlights[0].segments : [];
    const inIds = Array.isArray(optFlights[1]?.segments) ? optFlights[1].segments : [];
    const outboundSegs = outIds.map(id => segById[id]).filter(Boolean);
    const returnSegs = inIds.map(id => segById[id]).filter(Boolean);
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

/**
 * Search offers. Accepts portal format, calls DRCT, returns normalized offers[].
 * @param {{ origin, destination, depart_date, return_date?, adults?, children?, infants?, cabin_class? }} params
 */
async function search(params) {
  const flights = [{
    departure_airport_code: (params.origin || '').toUpperCase(),
    arrival_airport_code: (params.destination || '').toUpperCase(),
    departure_date: params.depart_date,
  }];
  if (params.return_date) {
    flights.push({
      departure_airport_code: (params.destination || '').toUpperCase(),
      arrival_airport_code: (params.origin || '').toUpperCase(),
      departure_date: params.return_date,
    });
  }
  const passengers = [];
  for (let i = 0; i < (params.adults || 1); i++) passengers.push({ type: 'ADT' });
  for (let i = 0; i < (params.children || 0); i++) passengers.push({ type: 'CHD' });
  for (let i = 0; i < (params.infants || 0); i++) passengers.push({ type: 'INF' });

  const drctBody = { flights, passengers };
  if (params.cabin_class) drctBody.filters = { cabin_class: params.cabin_class.toLowerCase() };

  const raw = await drctRequestWithRetry('POST', '/offers_search', drctBody);
  return _transformSearchResponse(raw);
}

/**
 * Get updated price for an offer before booking.
 * @param {string} offerId
 * @param {{ type: string }[]} passengers
 */
function priceOffer(offerId, passengers) {
  return drctRequestWithRetry('PATCH', `/offers/${offerId}/price`, { passengers });
}

/**
 * Create a DRCT order. No retry — not safe to duplicate.
 * @param {{ offer_id: string, passengers: object[] }} payload
 */
function createOrder(payload) {
  return drctRequest('POST', '/orders', payload);
}

/**
 * Issue tickets for a DRCT order. No retry — not safe to duplicate.
 * @param {string} orderId
 */
function issueOrder(orderId) {
  return drctRequest('POST', `/orders/${orderId}/issue`);
}

module.exports = { search, priceOffer, createOrder, issueOrder };
