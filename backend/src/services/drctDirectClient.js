'use strict';

const axios = require('axios');
const crypto = require('crypto');
const logger = require('../lib/logger');

const DRCT_CREATE_TIMEOUT_MS = Math.max(60000, Number(process.env.DRCT_CREATE_TIMEOUT_MS || 120000));
const DRCT_CREATE_MAX_ATTEMPTS = Math.max(1, Number(process.env.DRCT_CREATE_MAX_ATTEMPTS || 2));
const DRCT_CREATE_RETRYABLE_STATUS = new Set([408, 409, 425, 429, 500, 502, 503, 504]);
const DRCT_CREATE_RETRYABLE_CODES = new Set([
  'ECONNABORTED',
  'ECONNRESET',
  'ETIMEDOUT',
  'EAI_AGAIN',
  'ENOTFOUND',
  'EPIPE'
]);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableDrctCreateError(error) {
  const status = Number(error?.response?.status || error?.statusCode || error?.responseBody?.error?.status_code || 0);
  const code = String(error?.code || '').trim().toUpperCase();
  return DRCT_CREATE_RETRYABLE_CODES.has(code) || DRCT_CREATE_RETRYABLE_STATUS.has(status);
}

function getDrctConfig({ sandbox = false } = {}) {
  if (sandbox) {
    const legacySandboxBaseUrl = process.env.DRCT_API_BASE_URL || '';
    const legacySandboxToken = legacySandboxBaseUrl.includes('sandbox-api.drct.aero')
      ? (process.env.DRCT_BEARER_TOKEN || '')
      : '';
    const token = process.env.DRCT_SANDBOX_TOKEN
      || process.env.DRCT_TEST_TOKEN
      || process.env.DRCT_SANDBOX_BEARER_TOKEN
      || legacySandboxToken
      || '';
    return {
      baseUrl: process.env.DRCT_SANDBOX_BASE_URL || legacySandboxBaseUrl || 'https://sandbox-api.drct.aero',
      token,
      version: process.env.DRCT_SANDBOX_VERSION || '2021-06-01',
      label: 'sandbox',
    };
  }

  const token = process.env.DRCT_PROD_TOKEN || process.env.DRCT_BEARER_TOKEN || '';
  return {
    baseUrl: process.env.DRCT_PROD_BASE_URL || 'https://api.drct.aero',
    token,
    version: process.env.DRCT_PROD_VERSION || '2021-06-01',
    label: 'production',
  };
}

function buildHeaders({ sandbox = false } = {}) {
  const { token, version, label } = getDrctConfig({ sandbox });
  if (!token) {
    const err = new Error(`DRCT ${label} token is not configured`);
    err.code = sandbox ? 'DRCT_SANDBOX_NOT_CONFIGURED' : 'DRCT_PROD_NOT_CONFIGURED';
    throw err;
  }

  return {
    Authorization: `Bearer ${token}`,
    'DRCT-Version': version,
    'Content-Type': 'application/json',
  };
}

function unwrapProviderEnvelope(payload = {}) {
  let current = payload;
  let guard = 0;

  while (current && typeof current === 'object' && !Array.isArray(current) && guard < 5) {
    if (current.body && typeof current.body === 'object' && !Array.isArray(current.body)) {
      current = current.body;
      guard += 1;
      continue;
    }
    if (current.data && typeof current.data === 'object' && !Array.isArray(current.data)) {
      current = current.data;
      guard += 1;
      continue;
    }
    break;
  }

  if (Array.isArray(current) && current.length === 1 && current[0] && typeof current[0] === 'object') {
    return current[0];
  }

  return current && typeof current === 'object' ? current : {};
}

function mapSegments(flights = []) {
  return Array.isArray(flights)
    ? flights.flatMap((flight) =>
        Array.isArray(flight.segments)
          ? flight.segments.map((segment) => ({
              id: segment.id || null,
              origin: segment.departure_airport?.code || segment.departure_city?.code || null,
              origin_name: segment.departure_airport?.name || segment.departure_city?.name || null,
              destination: segment.arrival_airport?.code || segment.arrival_city?.code || null,
              destination_name: segment.arrival_airport?.name || segment.arrival_city?.name || null,
              departure: segment.departure_date && segment.departure_time
                ? `${segment.departure_date} ${segment.departure_time}`
                : null,
              arrival: segment.arrival_date && segment.arrival_time
                ? `${segment.arrival_date} ${segment.arrival_time}`
                : null,
              carrier: segment.carrier?.airline_code || null,
              airline_name: segment.carrier?.airline_name || null,
              flight_number: segment.flight_number || null,
              aircraft: segment.aircraft || null,
              duration: Number(segment.duration || 0),
              status: segment.status || null,
            }))
          : []
      )
    : [];
}

function mapPerPassengerPrice(priceDetails = [], currency = 'USD') {
  return Array.isArray(priceDetails)
    ? priceDetails.map((item) => ({
        type: item.type || null,
        count: Number(item.count || 0),
        total: Number(item.price?.amount || item.price?.total || 0),
        currency: item.price?.currency || currency,
        fare: Number(item.fare?.amount || item.fare?.total || 0),
        taxes: Number(item.taxes?.amount || item.taxes?.total || 0),
      }))
    : [];
}

function mapSearchSegmentsForWidget(segment = {}) {
  return {
    id: segment?.id || null,
    origin: segment?.departure_city?.name || segment?.departure_airport?.name || segment?.departure_airport?.code || null,
    origin_code: segment?.departure_airport?.code || null,
    destination: segment?.arrival_city?.name || segment?.arrival_airport?.name || segment?.arrival_airport?.code || null,
    destination_code: segment?.arrival_airport?.code || null,
    departure: [segment?.departure_date, segment?.departure_time].filter(Boolean).join(' ') || null,
    arrival: [segment?.arrival_date, segment?.arrival_time].filter(Boolean).join(' ') || null,
    carrier: {
      airline_code: segment?.carrier?.airline_code || null,
      airline_name: segment?.carrier?.airline_name || null,
    },
    flight_number: segment?.flight_number || null,
  };
}

function normalizeSearchResponse(response = {}) {
  const payload = unwrapProviderEnvelope(response);
  const segments = Array.isArray(payload.segments) ? payload.segments : [];
  const fares = Array.isArray(payload.fares) ? payload.fares : [];
  const flightOptions = Array.isArray(payload.flights_options) ? payload.flights_options : [];
  const directOffers = Array.isArray(payload.offers) ? payload.offers : [];

  const segById = Object.fromEntries(segments.filter((s) => s?.id).map((s) => [s.id, s]));
  const fareById = Object.fromEntries(fares.filter((f) => f?.id).map((f) => [f.id, f]));

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
      .map((f) => (f?.id ? (fareById[f.id] || f) : f))
      .find((f) => Array.isArray(f?.baggage));

    return {
      offer_id: offer?.id || `offer_${idx}`,
      id: offer?.id || `offer_${idx}`,
      channel: offer?.channel || payload.channel || airlineName || null,
      price: {
        total: Number(offer?.price?.amount || 0),
        amount: Number(offer?.price?.amount || 0),
        currency: offer?.price?.currency || 'SAR',
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
      with_baggage: Array.isArray(resolvedFare?.baggage)
        ? resolvedFare.baggage.some((b) => b?.type === 'checked' && Number(b?.quantity || 0) > 0)
        : false,
      segments: allSegs.map(mapSearchSegmentsForWidget),
    };
  }

  const transformedOffers = [];

  flightOptions.forEach((opt, optIndex) => {
    const optFlights = Array.isArray(opt?.flights) ? opt.flights : [];
    const outIds = Array.isArray(optFlights[0]?.segments) ? optFlights[0].segments : [];
    const inIds = Array.isArray(optFlights[1]?.segments) ? optFlights[1].segments : [];

    const outboundSegs = outIds.map((id) => segById[id]).filter(Boolean);
    const returnSegs = inIds.map((id) => segById[id]).filter(Boolean);
    const optOffers = Array.isArray(opt?.offers) ? opt.offers : [];

    optOffers.forEach((offer, offerIndex) => {
      transformedOffers.push(buildOffer(offer, outboundSegs, returnSegs, `${optIndex}_${offerIndex}`));
    });
  });

  if (!transformedOffers.length && directOffers.length) {
    directOffers.forEach((offer, i) => {
      const fareRefs = Array.isArray(offer?.fares) ? offer.fares : [];
      const segIds = fareRefs.flatMap((f) => Array.isArray(f?.segments) ? f.segments : []);
      const allSegs = segIds.map((id) => segById[id]).filter(Boolean);
      transformedOffers.push(buildOffer(offer, allSegs, [], i));
    });
  }

  return {
    search_id: payload.search_id || payload.id || `search_${Date.now()}`,
    offers: transformedOffers,
    metadata: {
      total_offers: transformedOffers.length,
      timestamp: new Date().toISOString(),
      raw: payload,
    },
  };
}

async function searchOffers(searchParams = {}, { sandbox = false } = {}) {
  const origin = String(searchParams.origin || '').trim().toUpperCase();
  const destination = String(searchParams.destination || '').trim().toUpperCase();
  const departDate = String(searchParams.depart_date || '').trim();
  if (!origin || !destination || !departDate) {
    const err = new Error('origin, destination and depart_date are required');
    err.code = 'VALIDATION_ERROR';
    err.statusCode = 400;
    throw err;
  }

  const passengers = [];
  const adults = Math.max(1, Number(searchParams.adults || 1));
  const children = Math.max(0, Number(searchParams.children || 0));
  const infants = Math.max(0, Number(searchParams.infants || 0));

  for (let i = 0; i < adults; i += 1) passengers.push({ type: 'ADT' });
  for (let i = 0; i < children; i += 1) passengers.push({ type: 'CHD' });
  for (let i = 0; i < infants; i += 1) passengers.push({ type: 'INF' });

  const requestBody = {
    flights: [
      {
        departure_airport_code: origin,
        arrival_airport_code: destination,
        departure_date: departDate,
      },
    ],
    passengers,
  };

  if (searchParams.return_date) {
    requestBody.flights.push({
      departure_airport_code: destination,
      arrival_airport_code: origin,
      departure_date: String(searchParams.return_date).trim(),
    });
  }

  if (searchParams.cabin_class) {
    requestBody.filters = { cabin_class: String(searchParams.cabin_class).trim().toLowerCase() };
  }

  const { baseUrl } = getDrctConfig({ sandbox });

  try {
    const { data, status } = await axios({
      method: 'POST',
      url: `${baseUrl}/offers_search`,
      headers: buildHeaders({ sandbox }),
      data: requestBody,
      timeout: 60000,
      validateStatus: () => true,
    });

    const payload = unwrapProviderEnvelope(data);
    if (Array.isArray(payload) && payload.length === 0) {
      return { search_id: `search_empty_${Date.now()}`, offers: [], metadata: { total_offers: 0 } };
    }
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      const err = new Error('DRCT search returned an invalid response');
      err.code = 'DRCT_INVALID_RESPONSE';
      err.statusCode = 502;
      err.responseBody = data;
      throw err;
    }
    if (payload.error) {
      const err = new Error(payload.error?.message || 'Failed to search offers');
      err.code = payload.error?.code || 'DRCT_API_ERROR';
      err.statusCode = payload.error?.status_code || status || 502;
      err.responseBody = payload;
      throw err;
    }

    return normalizeSearchResponse(payload);
  } catch (error) {
    logger.warn({
      err: error.message,
      origin,
      destination,
      sandbox,
      status: error.response?.status || error.statusCode || null,
    }, 'drctDirectClient search failed');
    throw error;
  }
}

function normalizeCreateResponse(response = {}, fallbackOfferId = null) {
  const payload = unwrapProviderEnvelope(response);
  const currency = payload.price?.currency || 'USD';

  return {
    order_id: payload.order_id || payload.id || null,
    offer_id: payload.offer_id || fallbackOfferId || null,
    status: String(payload.status || 'CREATED').toUpperCase(),
    pnr: payload.pnr || payload.locator || payload.airline_locators?.[0]?.locator || null,
    locator: payload.locator || null,
    airline_locators: payload.airline_locators || [],
    price: {
      total: Number(payload.price?.amount || payload.price?.total || 0),
      currency,
      breakdown: {
        base_fare: Number(payload.price_details?.[0]?.fare?.amount || payload.price?.base_fare || payload.price?.base || 0),
        taxes: Number(payload.price_details?.[0]?.taxes?.amount || payload.price?.taxes || 0),
        fees: Number(payload.price?.fees || 0),
        surcharges: Number(payload.price?.surcharges || 0),
      },
      per_passenger: mapPerPassengerPrice(payload.price_details, currency),
    },
    passengers: payload.passengers || [],
    segments: mapSegments(payload.flights),
    fares: payload.fares || [],
    tickets: payload.tickets || [],
    payment: {
      method: payload.payment?.method || 'CARD',
      status: payload.payment?.status || 'PENDING',
      deadline: payload.payment?.deadline || payload.cancel_before || null,
    },
    created_at: payload.created_at || new Date().toISOString(),
    expires_at: payload.expires_at || payload.cancel_before || null,
    metadata: {
      processed_at: new Date().toISOString(),
      workflow_id: 'drct_order_create_direct',
      channel: payload.channel || null,
    },
  };
}

function normalizePriceResponse(response = {}, fallbackOfferId = null) {
  const payload = unwrapProviderEnvelope(response);
  const currency = payload.price?.currency || 'USD';

  return {
    offer_id: payload.offer_id || payload.id || fallbackOfferId || null,
    price: {
      total: Number(payload.price?.amount || payload.price?.total || 0),
      currency,
      breakdown: {
        base_fare: Number(payload.price_details?.[0]?.fare?.amount || payload.price?.base_fare || payload.price?.base || 0),
        taxes: Number(payload.price_details?.[0]?.taxes?.amount || payload.price?.taxes || 0),
        fees: Number(payload.price?.fees || 0),
        surcharges: Number(payload.price?.surcharges || 0),
      },
      per_passenger: mapPerPassengerPrice(payload.price_details, currency),
    },
    expiration: payload.expire_at || payload.expiration || payload.expires_at || null,
    rules: payload.rules || payload.fares?.[0] || {},
    fare_details: payload.fare_details || payload.fares || [],
    passengers: payload.passengers || [],
    flights: payload.flights || [],
    timestamp: new Date().toISOString(),
    raw: payload,
  };
}

function normalizeIssueResponse(response = {}, fallbackOrderId = null) {
  const payload = unwrapProviderEnvelope(response);

  return {
    order_id: payload.order_id || payload.id || fallbackOrderId,
    status: String(payload.status || 'ISSUED').toUpperCase(),
    pnr: payload.pnr || payload.booking_reference || payload.locator || payload.airline_locators?.[0]?.locator || null,
    tickets: Array.isArray(payload.tickets)
      ? payload.tickets.map((ticket) => ({
          ticket_number: ticket.ticket_number || ticket.number || null,
          passenger: ticket.passenger || null,
          status: String(ticket.status || 'ISSUED').toUpperCase(),
          issued_at: ticket.issued_at || payload.issued_at || new Date().toISOString(),
        }))
      : [],
    etickets: payload.etickets || [],
    booking_reference: payload.booking_reference || payload.pnr || payload.locator || null,
    issued_at: payload.issued_at || new Date().toISOString(),
    metadata: {
      processed_at: new Date().toISOString(),
      workflow_id: 'drct_order_issue_direct',
      channel: payload.channel || null,
    },
  };
}

function normalizeCancelResponse(response = {}, fallbackOrderId = null) {
  const payload = unwrapProviderEnvelope(response);
  const rawStatus = String(payload.status || '').trim().toLowerCase();
  const normalizedStatus = rawStatus === 'deleted' ? 'CANCELLED' : String(payload.status || 'CANCELLED').toUpperCase();

  return {
    order_id: payload.order_id || payload.id || fallbackOrderId,
    status: normalizedStatus,
    cancelled_at: payload.cancelled_at || payload.deleted_at || new Date().toISOString(),
    locator: payload.locator || null,
    airline_locators: payload.airline_locators || [],
    refund: {
      status: payload.refund?.status || 'PENDING',
      amount: Number(payload.refund?.amount || 0),
      currency: payload.refund?.currency || payload.currency || 'USD',
      estimated_date: payload.refund?.estimated_date || null,
      penalties: Number(payload.refund?.penalties || 0),
    },
    tickets: Array.isArray(payload.tickets)
      ? payload.tickets.map((ticket) => ({
          ticket_number: ticket.ticket_number || ticket.number || null,
          status: String(ticket.status || 'CANCELLED').toUpperCase(),
          passenger: ticket.passenger || null,
        }))
      : [],
    reason: payload.reason || 'USER_REQUEST',
    metadata: {
      processed_at: new Date().toISOString(),
      workflow_id: 'drct_order_cancel_direct',
      channel: payload.channel || null,
    },
  };
}

async function createOrder(orderParams = {}, { idempotencyKey = null, sandbox = false } = {}) {
  if (!orderParams.offer_id) {
    const err = new Error('Missing required field: offer_id');
    err.code = 'VALIDATION_ERROR';
    err.statusCode = 400;
    throw err;
  }
  if (!Array.isArray(orderParams.passengers) || orderParams.passengers.length === 0) {
    const err = new Error('Missing required field: passengers');
    err.code = 'VALIDATION_ERROR';
    err.statusCode = 400;
    throw err;
  }
  const missingPassengerContacts = orderParams.passengers.some((passenger) => {
    const email = String(passenger?.email || '').trim();
    const phone = String(passenger?.phone || '').trim();
    return !email || !phone;
  });
  if (missingPassengerContacts) {
    const err = new Error('Each passenger must include email and phone');
    err.code = 'VALIDATION_ERROR';
    err.statusCode = 400;
    throw err;
  }

  const { baseUrl } = getDrctConfig({ sandbox });
  const safeIdempotencyKey = idempotencyKey || crypto.randomUUID();
  let lastError = null;

  for (let attempt = 1; attempt <= DRCT_CREATE_MAX_ATTEMPTS; attempt += 1) {
    try {
      const { data, status } = await axios({
        method: 'POST',
        url: `${baseUrl}/orders`,
        headers: {
          ...buildHeaders({ sandbox }),
          'Idempotency-Key': safeIdempotencyKey,
        },
        data: {
          offer_id: orderParams.offer_id,
          passengers: orderParams.passengers,
          payment_method: orderParams.payment_method || 'CARD',
        },
        timeout: DRCT_CREATE_TIMEOUT_MS,
        validateStatus: () => true,
      });

      const payload = unwrapProviderEnvelope(data);
      if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        const err = new Error('DRCT create order returned an invalid response');
        err.code = 'DRCT_INVALID_RESPONSE';
        err.statusCode = 502;
        err.responseBody = data;
        throw err;
      }
      if (payload.error) {
        const err = new Error(payload.error?.message || 'Failed to create order');
        err.code = payload.error?.code || 'DRCT_API_ERROR';
        err.statusCode = payload.error?.status_code || status || 502;
        err.responseBody = payload;
        throw err;
      }

      if (attempt > 1) {
        logger.info({
          offer_id: orderParams.offer_id,
          attempt,
          maxAttempts: DRCT_CREATE_MAX_ATTEMPTS,
          timeoutMs: DRCT_CREATE_TIMEOUT_MS
        }, 'drctDirectClient create recovered after retry');
      }

      return normalizeCreateResponse(payload, orderParams.offer_id);
    } catch (error) {
      lastError = error;
      const retryable = attempt < DRCT_CREATE_MAX_ATTEMPTS && isRetryableDrctCreateError(error);

      if (retryable) {
        logger.warn({
          err: error.message,
          offer_id: orderParams.offer_id,
          attempt,
          nextAttempt: attempt + 1,
          maxAttempts: DRCT_CREATE_MAX_ATTEMPTS,
          timeoutMs: DRCT_CREATE_TIMEOUT_MS,
          code: error.code || null,
          status: error.response?.status || error.statusCode || null
        }, 'drctDirectClient create transient failure — retrying');
        await sleep(1200 * attempt);
        continue;
      }

      if (error.response?.data) {
        logger.warn({
          err: error.message,
          offer_id: orderParams.offer_id,
          status: error.response.status,
          response: error.response.data,
          attempt,
          maxAttempts: DRCT_CREATE_MAX_ATTEMPTS,
          timeoutMs: DRCT_CREATE_TIMEOUT_MS
        }, 'drctDirectClient create failed');
      } else {
        logger.warn({
          err: error.message,
          offer_id: orderParams.offer_id,
          code: error.code || null,
          attempt,
          maxAttempts: DRCT_CREATE_MAX_ATTEMPTS,
          timeoutMs: DRCT_CREATE_TIMEOUT_MS
        }, 'drctDirectClient create failed');
      }
      throw error;
    }
  }

  throw lastError;
}

async function priceOffer(priceParams = {}, { idempotencyKey = null, sandbox = false } = {}) {
  const offerId = typeof priceParams.offer_id === 'string' ? priceParams.offer_id.trim() : '';
  if (!offerId) {
    const err = new Error('Missing required field: offer_id');
    err.code = 'VALIDATION_ERROR';
    err.statusCode = 400;
    throw err;
  }
  if (!Array.isArray(priceParams.passengers) || priceParams.passengers.length === 0) {
    const err = new Error('Missing required field: passengers');
    err.code = 'VALIDATION_ERROR';
    err.statusCode = 400;
    throw err;
  }

  const { baseUrl } = getDrctConfig({ sandbox });
  const safeIdempotencyKey = idempotencyKey || crypto.randomUUID();

  try {
    const { data, status } = await axios({
      method: 'PATCH',
      url: `${baseUrl}/offers/${encodeURIComponent(offerId)}/price`,
      headers: {
        ...buildHeaders({ sandbox }),
        'Idempotency-Key': safeIdempotencyKey,
      },
      data: {
        passengers: priceParams.passengers,
      },
      timeout: 60000,
      validateStatus: () => true,
    });

    const payload = unwrapProviderEnvelope(data);
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      const err = new Error('DRCT price offer returned an invalid response');
      err.code = 'DRCT_INVALID_RESPONSE';
      err.statusCode = 502;
      err.responseBody = data;
      throw err;
    }
    if (payload.error) {
      const err = new Error(payload.error?.message || 'Failed to price offer');
      err.code = payload.error?.code || 'DRCT_API_ERROR';
      err.statusCode = payload.error?.status_code || status || 502;
      err.responseBody = payload;
      throw err;
    }

    return normalizePriceResponse(payload, offerId);
  } catch (error) {
    if (error.response?.data) {
      logger.warn({
        err: error.message,
        offer_id: offerId,
        status: error.response.status,
        response: error.response.data,
      }, 'drctDirectClient price failed');
    } else {
      logger.warn({
        err: error.message,
        offer_id: offerId,
        code: error.code || null,
      }, 'drctDirectClient price failed');
    }
    throw error;
  }
}

async function issueOrder(issueParams = {}, { idempotencyKey = null, sandbox = false } = {}) {
  const orderId = typeof issueParams.order_id === 'string' ? issueParams.order_id.trim() : '';
  if (!orderId) {
    const err = new Error('Missing required field: order_id');
    err.code = 'VALIDATION_ERROR';
    err.statusCode = 400;
    throw err;
  }

  const requestBody = {};
  if (issueParams.payment_confirmation) requestBody.payment_confirmation = issueParams.payment_confirmation;
  if (issueParams.reshop !== undefined) requestBody.reshop = issueParams.reshop;
  if (issueParams.form_of_payment) requestBody.form_of_payment = issueParams.form_of_payment;

  const { baseUrl } = getDrctConfig({ sandbox });
  const safeIdempotencyKey = idempotencyKey || crypto.randomUUID();

  try {
    const { data, status } = await axios({
      method: 'POST',
      url: `${baseUrl}/orders/${encodeURIComponent(orderId)}/issue`,
      headers: {
        ...buildHeaders({ sandbox }),
        'Idempotency-Key': safeIdempotencyKey,
      },
      data: requestBody,
      timeout: 60000,
      validateStatus: () => true,
    });

    const payload = unwrapProviderEnvelope(data);
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      const err = new Error('DRCT issue order returned an invalid response');
      err.code = 'DRCT_INVALID_RESPONSE';
      err.statusCode = 502;
      err.responseBody = data;
      throw err;
    }
    if (payload.error) {
      const err = new Error(payload.error?.message || 'Failed to issue order');
      err.code = payload.error?.code || 'DRCT_API_ERROR';
      err.statusCode = payload.error?.status_code || status || 502;
      err.responseBody = payload;
      throw err;
    }

    return normalizeIssueResponse(payload, orderId);
  } catch (error) {
    if (error.response?.data) {
      logger.warn({
        err: error.message,
        order_id: orderId,
        status: error.response.status,
        response: error.response.data,
      }, 'drctDirectClient issue failed');
    } else {
      logger.warn({
        err: error.message,
        order_id: orderId,
        code: error.code || null,
      }, 'drctDirectClient issue failed');
    }
    throw error;
  }
}

async function cancelOrder(cancelParams = {}) {
  const orderId = typeof cancelParams.order_id === 'string' ? cancelParams.order_id.trim() : '';
  if (!orderId) {
    const err = new Error('Missing required field: order_id');
    err.code = 'VALIDATION_ERROR';
    err.statusCode = 400;
    throw err;
  }

  const requestBody = {
    reason: cancelParams.reason || 'USER_REQUEST',
    refund_requested: cancelParams.refund_requested !== false,
  };

  const { baseUrl } = getDrctConfig();

  try {
    const { data, status } = await axios({
      method: 'DELETE',
      url: `${baseUrl}/orders/${encodeURIComponent(orderId)}`,
      headers: buildHeaders(),
      data: requestBody,
      timeout: 30000,
      validateStatus: () => true,
    });

    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      const err = new Error('DRCT cancel returned an invalid response');
      err.code = 'DRCT_INVALID_RESPONSE';
      err.statusCode = 502;
      err.responseBody = data;
      throw err;
    }

    if (data.error) {
      const err = new Error(data.error?.message || 'Failed to cancel order');
      err.code = data.error?.code || 'DRCT_API_ERROR';
      err.statusCode = data.error?.status_code || status || 502;
      err.responseBody = data;
      throw err;
    }

    return normalizeCancelResponse(data, orderId);
  } catch (error) {
    if (error.response?.data) {
      logger.warn({
        err: error.message,
        order_id: orderId,
        status: error.response.status,
        response: error.response.data,
      }, 'drctDirectClient cancel failed');
    } else {
      logger.warn({
        err: error.message,
        order_id: orderId,
        code: error.code || null,
      }, 'drctDirectClient cancel failed');
    }
    throw error;
  }
}

// Fetch a live order from DRCT to read the real airline locator + e-ticket numbers.
// The n8n issue path does not reliably return these, so after issuance we call this
// directly to enrich the ticket PDF/email. GET /orders/{id} requires the DRCT-Version
// header (without it DRCT returns 404 "Unrecognized request URL").
async function getOrder(orderId, { sandbox = false } = {}) {
  const id = typeof orderId === 'string' ? orderId.trim() : '';
  if (!id) {
    const err = new Error('Missing required field: order_id');
    err.code = 'VALIDATION_ERROR';
    err.statusCode = 400;
    throw err;
  }

  const { baseUrl } = getDrctConfig({ sandbox });

  try {
    const { data, status } = await axios({
      method: 'GET',
      url: `${baseUrl}/orders/${encodeURIComponent(id)}`,
      headers: buildHeaders({ sandbox }),
      timeout: 30000,
      validateStatus: () => true,
    });

    const payload = unwrapProviderEnvelope(data);
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      const err = new Error('DRCT get order returned an invalid response');
      err.code = 'DRCT_INVALID_RESPONSE';
      err.statusCode = 502;
      err.responseBody = data;
      throw err;
    }
    if (status >= 400 || payload.error) {
      const err = new Error(payload.error?.message || `Failed to get order (${status})`);
      err.code = payload.error?.code || 'DRCT_GET_ORDER_FAILED';
      err.statusCode = payload.error?.status_code || status || 502;
      err.responseBody = payload;
      throw err;
    }

    return {
      order_id: payload.id || id,
      status: String(payload.status || '').toUpperCase(),
      channel: payload.channel || null,
      locator: payload.locator || null,
      airline_locators: Array.isArray(payload.airline_locators) ? payload.airline_locators : [],
      tickets: Array.isArray(payload.tickets)
        ? payload.tickets.map((t) => ({
            number: t.number || t.ticket_number || null,
            status: String(t.status || '').toUpperCase(),
            passenger: t.passenger != null ? String(t.passenger) : null,
          }))
        : [],
      raw: payload,
    };
  } catch (error) {
    logger.warn({
      err: error.message,
      order_id: id,
      status: error.response?.status || error.statusCode || null,
      code: error.code || null,
    }, 'drctDirectClient getOrder failed');
    throw error;
  }
}

module.exports = {
  searchOffers,
  priceOffer,
  createOrder,
  issueOrder,
  cancelOrder,
  getOrder,
  normalizePriceResponse,
  normalizeCreateResponse,
  normalizeIssueResponse,
  normalizeCancelResponse,
};
