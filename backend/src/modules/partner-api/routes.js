'use strict';

const crypto = require('crypto');
const express = require('express');
const { classifyDistributionChannel, normalizeCarrier } = require('./channelClassifier');
const { PricingError, calculateSellPrice } = require('./pricingEngine');
const { attachCorrelationId, buildApiError, sendApiError } = require('./http');
const { requirePartnerScope } = require('./auth');
const { createPartnerRateLimiter } = require('./rateLimit');
const {
  buildDrctPassengers,
  expectedTotalMatches,
  isUncertainUpstreamError,
  publicOrderResponse,
  quoteMatchesPassengers,
  requestHash,
  validateCreateOrderRequest,
} = require('./orders');

const IATA_CODE = /^[A-Z]{3}$/;
const PASSENGER_TYPES = new Set(['ADT', 'CHD', 'INF']);

function externalId(prefix, environment) {
  const mode = environment === 'production' ? 'live' : 'test';
  return `${prefix}_${mode}_${crypto.randomBytes(16).toString('base64url')}`;
}

function isIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().startsWith(value);
}

function validateSearchRequest(body = {}) {
  const details = [];
  const slices = Array.isArray(body.slices) ? body.slices : [];
  const passengers = Array.isArray(body.passengers) ? body.passengers : [];

  if (slices.length < 1 || slices.length > 2) {
    details.push({ field: 'slices', issue: 'Must contain one or two journey slices' });
  }
  slices.forEach((slice, index) => {
    const origin = String(slice?.origin || '').toUpperCase();
    const destination = String(slice?.destination || '').toUpperCase();
    if (!IATA_CODE.test(origin)) details.push({ field: `slices[${index}].origin`, issue: 'Must be a 3-letter IATA code' });
    if (!IATA_CODE.test(destination)) details.push({ field: `slices[${index}].destination`, issue: 'Must be a 3-letter IATA code' });
    if (!isIsoDate(slice?.departure_date)) details.push({ field: `slices[${index}].departure_date`, issue: 'Must be an ISO date' });
  });
  if (slices.length === 2) {
    const outboundOrigin = String(slices[0]?.origin || '').toUpperCase();
    const outboundDestination = String(slices[0]?.destination || '').toUpperCase();
    const returnOrigin = String(slices[1]?.origin || '').toUpperCase();
    const returnDestination = String(slices[1]?.destination || '').toUpperCase();
    if (returnOrigin !== outboundDestination || returnDestination !== outboundOrigin) {
      details.push({ field: 'slices[1]', issue: 'The second slice must be the return of the first slice' });
    }
  }

  if (passengers.length < 1 || passengers.length > 9) {
    details.push({ field: 'passengers', issue: 'Must contain between 1 and 9 passengers' });
  }
  passengers.forEach((passenger, index) => {
    if (!PASSENGER_TYPES.has(String(passenger?.type || '').toUpperCase())) {
      details.push({ field: `passengers[${index}].type`, issue: 'Must be ADT, CHD or INF' });
    }
  });
  const adultCount = passengers.filter((passenger) => String(passenger?.type || '').toUpperCase() === 'ADT').length;
  const infantCount = passengers.filter((passenger) => String(passenger?.type || '').toUpperCase() === 'INF').length;
  if (passengers.length && adultCount === 0) {
    details.push({ field: 'passengers', issue: 'At least one adult passenger is required' });
  }
  if (infantCount > adultCount) {
    details.push({ field: 'passengers', issue: 'Infant count cannot exceed adult count' });
  }

  return details;
}

function toDrctSearchParams(body) {
  const slices = body.slices.map((slice) => ({
    origin: String(slice.origin).toUpperCase(),
    destination: String(slice.destination).toUpperCase(),
    departure_date: slice.departure_date,
  }));
  const counts = body.passengers.reduce((accumulator, passenger) => {
    const type = String(passenger.type).toUpperCase();
    accumulator[type] = (accumulator[type] || 0) + 1;
    return accumulator;
  }, {});

  return {
    origin: slices[0].origin,
    destination: slices[0].destination,
    depart_date: slices[0].departure_date,
    return_date: slices[1]?.departure_date || null,
    adults: counts.ADT || 0,
    children: counts.CHD || 0,
    infants: counts.INF || 0,
    cabin_class: body.cabin_class || null,
  };
}

function buildDrctPricePassengers(passengers) {
  return passengers.map((passenger, index) => ({
    id: `T${index + 1}`,
    type: String(passenger.type).toUpperCase(),
  }));
}

function sanitizeOffer(offer, { externalOfferId, externalQuoteId, channel, pricing, expiresAt }) {
  return {
    offer_id: externalOfferId,
    price_quote_id: externalQuoteId,
    distribution_channel: channel,
    validating_carrier: normalizeCarrier(offer.validating_carrier || offer.airline_code || offer.airline),
    airline_name: offer.airline_name || null,
    origin: offer.origin || null,
    destination: offer.destination || null,
    departure_time: offer.departure_time || null,
    arrival_time: offer.arrival_time || null,
    return_departure_time: offer.return_departure_time || null,
    return_arrival_time: offer.return_arrival_time || null,
    stops: Number(offer.stops || 0),
    baggage: Array.isArray(offer.baggage) ? offer.baggage : [],
    segments: Array.isArray(offer.segments) ? offer.segments : [],
    price: {
      total: pricing.sell_total,
      currency: pricing.currency,
    },
    valid_until: expiresAt,
  };
}

function expirationFor(value, fallbackMinutes = 15) {
  const parsed = new Date(value || '');
  if (Number.isFinite(parsed.getTime()) && parsed.getTime() > Date.now()) return parsed.toISOString();
  return new Date(Date.now() + fallbackMinutes * 60 * 1000).toISOString();
}

function isEntitled(entitlements, operation, channel, carrierCode) {
  if (!entitlements) return false;
  const operations = Array.isArray(entitlements.allowed_operations) ? entitlements.allowed_operations : [];
  if (!operations.includes(operation)) return false;

  const channels = Array.isArray(entitlements.allowed_channels) ? entitlements.allowed_channels : [];
  if (channel === 'UNKNOWN' && !entitlements.allow_unknown_channel) return false;
  if (channels.length && !channels.includes(channel)) return false;

  const allowedCarriers = Array.isArray(entitlements.allowed_carriers) ? entitlements.allowed_carriers : [];
  const deniedCarriers = Array.isArray(entitlements.denied_carriers) ? entitlements.denied_carriers : [];
  if (deniedCarriers.includes(carrierCode)) return false;
  if (allowedCarriers.length && !allowedCarriers.includes(carrierCode)) return false;
  return true;
}

function quoteRow({ context, pricingContext, offer, normalizedOffer, channel, carrierCode, externalOfferId, externalQuoteId, pricing, expiresAt, searchId, passengers }) {
  return {
    api_client_id: context.client.id,
    counterparty_id: context.counterparty.id,
    environment: context.client.environment,
    external_offer_id: externalOfferId,
    external_quote_id: externalQuoteId,
    upstream_offer_id: offer.offer_id || offer.id,
    upstream_search_id: searchId || null,
    normalized_offer: normalizedOffer,
    distribution_channel: channel,
    carrier_code: carrierCode,
    pricing_plan_version_id: pricingContext.version.id,
    supplier_total: pricing.supplier_total,
    markup_total: pricing.markup_total,
    sell_total: pricing.sell_total,
    currency: pricing.currency,
    pricing_rule_trace: {
      matched_rule_id: pricing.matched_rule_id,
      applied_rule_ids: pricing.applied_rule_ids,
      percentage_markup: pricing.percentage_markup,
      fixed_markup: pricing.fixed_markup,
      percent_bps: pricing.percent_bps,
      passenger_count: Array.isArray(passengers) ? passengers.length : null,
      passenger_types: Array.isArray(passengers)
        ? passengers.map((passenger) => String(passenger.type).toUpperCase())
        : [],
    },
    expires_at: expiresAt,
  };
}

function validIdempotencyKey(value) {
  return typeof value === 'string'
    && value.length >= 8
    && value.length <= 255
    && /^[A-Za-z0-9._:-]+$/.test(value);
}

async function persistIdempotentResponse(repository, recordId, status, body, logger, correlationId) {
  try {
    await repository.completeIdempotencyRecord({
      id: recordId,
      responseStatus: status,
      responseBody: body,
    });
  } catch (error) {
    logger.error({ err: error.message, correlation_id: correlationId }, 'Unable to persist Partner API idempotent response');
  }
}

function initialOrderRecord(quote, body) {
  const offer = quote.normalized_offer || {};
  return {
    order_number: `PA-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
    origin: offer.origin || 'UNKNOWN',
    destination: offer.destination || 'UNKNOWN',
    departure_time: offer.departure_time || null,
    arrival_time: offer.arrival_time || null,
    airline_code: quote.carrier_code || null,
    airline_name: offer.airline_name || null,
    contact_email: String(body.contact.email).trim().toLowerCase(),
    contact_phone: String(body.contact.phone).trim(),
    raw_offer_data: {
      partner_api: {
        external_offer_id: quote.external_offer_id,
        external_quote_id: quote.external_quote_id,
        client_order_ref: body.client_order_ref,
        passengers: body.passengers,
        contact: body.contact,
      },
    },
  };
}

function mapUnexpectedError(error, req, res, logger) {
  logger.error({
    err: error.message,
    code: error.code || null,
    correlation_id: req.correlationId,
    provider_trace_id: error.traceId || null,
  }, 'Partner API request failed');

  if (error instanceof PricingError) {
    const status = error.code === 'OFFER_NOT_ALLOWED' ? 403 : 422;
    return sendApiError(res, status, error.code, error.message, error.details);
  }
  if (error.code === 'PARTNER_DATABASE_ERROR') {
    return sendApiError(res, 503, 'SERVICE_CONFIGURATION_ERROR', 'Partner API configuration is temporarily unavailable');
  }
  if ([404, 409, 410, 422].includes(Number(error.statusCode))) {
    return sendApiError(res, 409, 'OFFER_CHANGED', 'The offer is no longer available at the quoted price');
  }
  return sendApiError(res, 502, 'UPSTREAM_UNAVAILABLE', 'Flight supplier is temporarily unavailable');
}

function createPartnerApiRouter({ authenticate, repository, drctClient, logger }) {
  const router = express.Router();
  router.use(attachCorrelationId);
  router.use(authenticate);

  router.post(
    '/offers/search',
    requirePartnerScope('offers:read'),
    createPartnerRateLimiter('search'),
    async (req, res) => {
    const validationDetails = validateSearchRequest(req.body);
    if (validationDetails.length) {
      return sendApiError(res, 400, 'VALIDATION_ERROR', 'Search request is invalid', validationDetails);
    }

    const context = req.partnerContext;
    try {
      const [pricingContext, entitlements, mappings] = await Promise.all([
        repository.loadActivePricingContext({
          counterpartyId: context.counterparty.id,
          environment: context.client.environment,
        }),
        repository.loadEntitlements(context.client.id),
        repository.listChannelMappings(),
      ]);
      if (!pricingContext) {
        return sendApiError(res, 503, 'PRICING_NOT_CONFIGURED', 'No published pricing plan is assigned to this API client');
      }
      if (!entitlements) {
        return sendApiError(res, 403, 'ACCESS_POLICY_NOT_CONFIGURED', 'API product access is not configured');
      }

      const providerResult = await drctClient.searchOffers(toDrctSearchParams(req.body), {
        sandbox: context.client.environment !== 'production',
      });
      const passengerCount = req.body.passengers.length;
      const rows = [];
      const responseOffers = [];
      const providerOffers = Array.isArray(providerResult.offers) ? providerResult.offers : [];

      for (const offer of providerOffers) {
        const channel = classifyDistributionChannel(offer, mappings);
        const carrierCode = normalizeCarrier(offer.validating_carrier || offer.airline_code || offer.airline);
        if (!isEntitled(entitlements, 'search', channel, carrierCode)) continue;

        try {
          const pricing = calculateSellPrice({
            supplierAmount: offer.price?.total ?? offer.price?.amount,
            currency: offer.price?.currency,
            channel,
            carrierCode,
            passengerCount,
            rules: pricingContext.rules,
          });
          const externalOfferId = externalId('off', context.client.environment);
          const externalQuoteId = externalId('quote', context.client.environment);
          const expiresAt = expirationFor(offer.expire_at || offer.valid_until);
          const normalizedOffer = sanitizeOffer(offer, {
            externalOfferId,
            externalQuoteId,
            channel,
            pricing,
            expiresAt,
          });
          rows.push(quoteRow({
            context,
            pricingContext,
            offer,
            normalizedOffer,
            channel,
            carrierCode,
            externalOfferId,
            externalQuoteId,
            pricing,
            expiresAt,
            searchId: providerResult.search_id,
            passengers: req.body.passengers,
          }));
          responseOffers.push(normalizedOffer);
        } catch (error) {
          if (error instanceof PricingError && error.code === 'OFFER_NOT_ALLOWED') continue;
          throw error;
        }
      }

      if (rows.length) await repository.insertOfferQuotes(rows);
      return res.status(200).json({
        search_id: externalId('srch', context.client.environment),
        offers: responseOffers,
        meta: {
          offer_count: responseOffers.length,
          provider_offer_count: providerOffers.length,
          excluded_offer_count: providerOffers.length - responseOffers.length,
        },
      });
    } catch (error) {
      return mapUnexpectedError(error, req, res, logger);
    }
    },
  );

  router.post(
    '/offers/:offerId/price',
    requirePartnerScope('offers:read'),
    createPartnerRateLimiter('price'),
    async (req, res) => {
    const passengers = Array.isArray(req.body?.passengers) ? req.body.passengers : [];
    const validationDetails = [];
    if (passengers.length < 1 || passengers.length > 9) {
      validationDetails.push({ field: 'passengers', issue: 'Must contain between 1 and 9 passengers' });
    }
    passengers.forEach((passenger, index) => {
      if (!PASSENGER_TYPES.has(String(passenger?.type || '').toUpperCase())) {
        validationDetails.push({ field: `passengers[${index}].type`, issue: 'Must be ADT, CHD or INF' });
      }
    });
    if (validationDetails.length) {
      return sendApiError(res, 400, 'VALIDATION_ERROR', 'Price request is invalid', validationDetails);
    }

    const context = req.partnerContext;
    try {
      const previousQuote = await repository.findLatestOfferQuote({
        apiClientId: context.client.id,
        externalOfferId: req.params.offerId,
      });
      if (!previousQuote) return sendApiError(res, 404, 'OFFER_NOT_FOUND', 'Offer does not exist');
      if (new Date(previousQuote.expires_at).getTime() <= Date.now()) {
        return sendApiError(res, 410, 'OFFER_EXPIRED', 'Offer has expired; run a new search');
      }

      const [pricingContext, entitlements] = await Promise.all([
        repository.loadActivePricingContext({
          counterpartyId: context.counterparty.id,
          environment: context.client.environment,
        }),
        repository.loadEntitlements(context.client.id),
      ]);
      if (!pricingContext) {
        return sendApiError(res, 503, 'PRICING_NOT_CONFIGURED', 'No published pricing plan is assigned to this API client');
      }
      if (!isEntitled(entitlements, 'price', previousQuote.distribution_channel, previousQuote.carrier_code)) {
        return sendApiError(res, 403, 'OFFER_NOT_ALLOWED', 'Pricing this offer is not allowed');
      }

      const priced = await drctClient.priceOffer({
        offer_id: previousQuote.upstream_offer_id,
        passengers: buildDrctPricePassengers(passengers),
      }, {
        idempotencyKey: req.headers['idempotency-key'] || crypto.randomUUID(),
        sandbox: context.client.environment !== 'production',
      });
      const pricing = calculateSellPrice({
        supplierAmount: priced.price?.total,
        currency: priced.price?.currency,
        channel: previousQuote.distribution_channel,
        carrierCode: previousQuote.carrier_code,
        passengerCount: passengers.length,
        rules: pricingContext.rules,
      });
      const externalQuoteId = externalId('quote', context.client.environment);
      const expiresAt = expirationFor(priced.expiration, 10);
      const normalizedOffer = {
        ...previousQuote.normalized_offer,
        price_quote_id: externalQuoteId,
        price: { total: pricing.sell_total, currency: pricing.currency },
        valid_until: expiresAt,
      };
      await repository.insertOfferQuotes([quoteRow({
        context,
        pricingContext,
        offer: { offer_id: priced.offer_id || previousQuote.upstream_offer_id },
        normalizedOffer,
        channel: previousQuote.distribution_channel,
        carrierCode: previousQuote.carrier_code,
        externalOfferId: previousQuote.external_offer_id,
        externalQuoteId,
        pricing,
        expiresAt,
        searchId: previousQuote.upstream_search_id,
        passengers,
      })]);

      return res.status(200).json(normalizedOffer);
    } catch (error) {
      return mapUnexpectedError(error, req, res, logger);
    }
    },
  );

  router.post(
    '/orders',
    requirePartnerScope('orders:create'),
    createPartnerRateLimiter('mutations'),
    async (req, res) => {
      const idempotencyKey = String(req.headers['idempotency-key'] || '').trim();
      if (!validIdempotencyKey(idempotencyKey)) {
        return sendApiError(
          res,
          400,
          idempotencyKey ? 'INVALID_IDEMPOTENCY_KEY' : 'MISSING_IDEMPOTENCY_KEY',
          idempotencyKey
            ? 'Idempotency-Key must contain 8-255 safe characters'
            : 'Idempotency-Key is required for order creation',
        );
      }

      const validationDetails = validateCreateOrderRequest(req.body);
      if (validationDetails.length) {
        return sendApiError(res, 400, 'VALIDATION_ERROR', 'Order request is invalid', validationDetails);
      }

      const context = req.partnerContext;
      let idempotencyRecord = null;
      let draft = null;
      let quote = null;
      let externalOrderId = null;
      try {
        const bodyHash = requestHash(req.body);
        const claim = await repository.claimIdempotencyRecord({
          apiClientId: context.client.id,
          operation: 'POST /orders',
          idempotencyKey,
          requestHash: bodyHash,
        });
        idempotencyRecord = claim.record;
        if (!claim.created) {
          if (!idempotencyRecord || idempotencyRecord.request_hash !== bodyHash) {
            return sendApiError(res, 409, 'IDEMPOTENCY_CONFLICT', 'Idempotency-Key was already used with a different request');
          }
          if (idempotencyRecord.completed_at && idempotencyRecord.response_body) {
            res.setHeader('Idempotency-Replayed', 'true');
            return res.status(idempotencyRecord.response_status).json(idempotencyRecord.response_body);
          }
          return sendApiError(res, 409, 'IDEMPOTENCY_IN_PROGRESS', 'An order request with this key is still being processed');
        }

        const mutationError = async (status, code, message, details = []) => {
          const body = buildApiError(req.correlationId, code, message, details);
          await persistIdempotentResponse(repository, idempotencyRecord.id, status, body, logger, req.correlationId);
          return res.status(status).json(body);
        };

        const [loadedQuote, entitlements] = await Promise.all([
          repository.findOfferQuoteByExternalId({
            apiClientId: context.client.id,
            externalQuoteId: req.body.price_quote_id,
          }),
          repository.loadEntitlements(context.client.id),
        ]);
        quote = loadedQuote;
        if (!quote) return mutationError(404, 'QUOTE_NOT_FOUND', 'Price quote does not exist');
        if (new Date(quote.expires_at).getTime() <= Date.now()) {
          return mutationError(410, 'QUOTE_EXPIRED', 'Price quote has expired; confirm the offer price again');
        }
        if (!isEntitled(entitlements, 'create_order', quote.distribution_channel, quote.carrier_code)) {
          return mutationError(403, 'OFFER_NOT_ALLOWED', 'Creating an order for this offer is not allowed');
        }
        if (!expectedTotalMatches(quote, req.body.expected_total)) {
          return mutationError(409, 'PRICE_MISMATCH', 'expected_total does not match the confirmed AviaFrame quote');
        }
        if (!quoteMatchesPassengers(quote, req.body.passengers)) {
          return mutationError(409, 'PASSENGER_MISMATCH', 'Passenger types do not match the confirmed price quote');
        }

        externalOrderId = externalId('ord', context.client.environment);
        const pricingSnapshot = {
          external_quote_id: quote.external_quote_id,
          pricing_plan_version_id: quote.pricing_plan_version_id,
          supplier_total: quote.supplier_total,
          markup_total: quote.markup_total,
          sell_total: quote.sell_total,
          currency: quote.currency,
          pricing_rule_trace: quote.pricing_rule_trace,
        };
        try {
          draft = await repository.createPartnerOrderDraft({
            apiClientId: context.client.id,
            counterpartyId: context.counterparty.id,
            quoteId: quote.id,
            externalOrderId,
            clientOrderRef: req.body.client_order_ref,
            idempotencyKey,
            order: initialOrderRecord(quote, req.body),
            pricingSnapshot,
          });
        } catch (error) {
          if (error.code !== 'QUOTE_ALREADY_CONSUMED') throw error;
          const body = buildApiError(req.correlationId, 'QUOTE_ALREADY_CONSUMED', 'Price quote has already been used for another order');
          await persistIdempotentResponse(repository, idempotencyRecord.id, 409, body, logger, req.correlationId);
          return res.status(409).json(body);
        }

        const upstreamIdempotencyKey = `af-${crypto.createHash('sha256')
          .update(`${context.client.id}:${idempotencyKey}`)
          .digest('hex')}`;
        try {
          const drctResponse = await drctClient.createOrder({
            offer_id: quote.upstream_offer_id,
            passengers: buildDrctPassengers(req.body.passengers, req.body.contact),
          }, {
            idempotencyKey: upstreamIdempotencyKey,
            sandbox: context.client.environment !== 'production',
          });
          if (!drctResponse?.order_id) {
            const invalidResponse = new Error('Supplier did not return an order identifier');
            invalidResponse.code = 'DRCT_INVALID_RESPONSE';
            throw invalidResponse;
          }

          const responseBody = publicOrderResponse({
            externalOrderId,
            clientOrderRef: req.body.client_order_ref,
            quote,
            status: 'CREATED',
            drctResponse,
          });
          await repository.updatePartnerOrderState({
            orderId: draft.order_id,
            status: 'CREATED',
            supplierStatus: drctResponse.status || 'CREATED',
            reconcileRequired: false,
            upstreamOrderId: drctResponse.order_id,
            upstreamResponse: drctResponse,
            partnerResponse: responseBody,
          });
          await persistIdempotentResponse(repository, idempotencyRecord.id, 201, responseBody, logger, req.correlationId);
          return res.status(201).json(responseBody);
        } catch (error) {
          const uncertain = isUncertainUpstreamError(error);
          const status = uncertain ? 202 : 409;
          const responseBody = uncertain
            ? publicOrderResponse({
              externalOrderId,
              clientOrderRef: req.body.client_order_ref,
              quote,
              status: 'PENDING_RECONCILE',
            })
            : buildApiError(req.correlationId, 'ORDER_REJECTED', 'The supplier rejected the order request');
          const upstreamError = {
            code: error.code || null,
            status: error.response?.status || error.statusCode || null,
            message: error.message,
            trace_id: error.traceId || null,
          };

          try {
            await repository.updatePartnerOrderState({
              orderId: draft.order_id,
              status: uncertain ? 'PENDING_RECONCILE' : 'FAILED',
              supplierStatus: uncertain ? 'UNKNOWN' : 'REJECTED',
              reconcileRequired: uncertain,
              partnerResponse: responseBody,
              upstreamError,
            });
          } catch (stateError) {
            logger.error({
              err: stateError.message,
              external_order_id: externalOrderId,
              correlation_id: req.correlationId,
            }, 'Unable to persist Partner API order failure state');
          }
          await persistIdempotentResponse(repository, idempotencyRecord.id, status, responseBody, logger, req.correlationId);
          return res.status(status).json(responseBody);
        }
      } catch (error) {
        if (idempotencyRecord?.id && !draft && repository.releaseIdempotencyRecord) {
          try {
            await repository.releaseIdempotencyRecord(idempotencyRecord.id);
          } catch (releaseError) {
            logger.error({ err: releaseError.message, correlation_id: req.correlationId }, 'Unable to release Partner API idempotency claim');
          }
        }
        return mapUnexpectedError(error, req, res, logger);
      }
    },
  );

  router.get(
    '/orders/:orderId',
    requirePartnerScope('orders:read'),
    createPartnerRateLimiter('price'),
    async (req, res) => {
      try {
        const order = await repository.findPartnerOrder({
          apiClientId: req.partnerContext.client.id,
          externalOrderId: req.params.orderId,
        });
        if (!order) return sendApiError(res, 404, 'ORDER_NOT_FOUND', 'Order does not exist');
        if (order.partner_response && Object.keys(order.partner_response).length) {
          return res.status(200).json(order.partner_response);
        }
        return res.status(200).json({
          order_id: order.external_order_id,
          client_order_ref: order.client_order_ref,
          status: order.status,
          price_quote_id: order.pricing_snapshot?.external_quote_id,
          price: {
            total: String(order.pricing_snapshot?.sell_total),
            currency: order.pricing_snapshot?.currency,
          },
          booking_reference: null,
          payment_deadline: null,
          created_at: order.created_at,
        });
      } catch (error) {
        return mapUnexpectedError(error, req, res, logger);
      }
    },
  );

  return router;
}

module.exports = {
  createPartnerApiRouter,
  isEntitled,
  sanitizeOffer,
  toDrctSearchParams,
  validIdempotencyKey,
  validateSearchRequest,
};
