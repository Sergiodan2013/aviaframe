'use strict';

const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const logger = require('../lib/logger');
const drctDirectClient = require('../services/drctDirectClient');
const { config, VALID_PAYMENT_METHODS, ORDERS_LIST_COLUMNS } = require('../config');
const {
  normalizeHost,
  getRequestOriginHost,
  isWidgetOriginAllowed,
  issueWidgetToken,
  parseWidgetToken,
  generateOrderNumber
} = require('../utils/helpers');

function isMissingColumnError(error, columnName) {
  const message = String(error?.message || '').toLowerCase();
  return message.includes(`'${String(columnName).toLowerCase()}'`) && message.includes('schema cache');
}

const SANDBOX_WIDGET_HOSTS = new Set(['sandbox.aviaframe.com']);

function hasDrctSandboxConfig() {
  return Boolean(
    process.env.DRCT_SANDBOX_TOKEN
    || process.env.DRCT_TEST_TOKEN
    || process.env.DRCT_SANDBOX_BEARER_TOKEN
    || (
      String(process.env.DRCT_API_BASE_URL || '').includes('sandbox-api.drct.aero')
      && process.env.DRCT_BEARER_TOKEN
    )
  );
}

function normalizePassengerGender(gender) {
  const value = String(gender || '').toLowerCase().trim();
  if (value === 'male' || value === 'm') return 'M';
  if (value === 'female' || value === 'f') return 'F';
  return 'M';
}

function normalizePassengerType(type) {
  const value = String(type || 'ADT').toUpperCase().trim();
  return ['ADT', 'CHD', 'INF'].includes(value) ? value : 'ADT';
}

function shouldUseOfferPriceForHost(host) {
  return SANDBOX_WIDGET_HOSTS.has(normalizeHost(host || ''));
}

function shouldUseDrctSandboxForHost(host) {
  return SANDBOX_WIDGET_HOSTS.has(normalizeHost(host || '')) && hasDrctSandboxConfig();
}

function isPlaceholderPassengerValue(value) {
  const normalized = String(value || '').trim().toLowerCase();
  return !normalized || [
    'n/a',
    'na',
    'test',
    'ndc',
    'demo',
    'guest',
    'passenger',
    'unknown'
  ].includes(normalized);
}

function getPassengerDocument(passenger = {}) {
  return passenger.document || {};
}

function buildPassengerRefsByType(passengerRefs = []) {
  const refsByType = new Map();
  for (const ref of Array.isArray(passengerRefs) ? passengerRefs : []) {
    const type = normalizePassengerType(ref?.type);
    if (!refsByType.has(type)) refsByType.set(type, []);
    refsByType.get(type).push(ref);
  }
  return refsByType;
}

function validateWidgetPassengers(passengers = []) {
  if (!Array.isArray(passengers) || passengers.length === 0) {
    return 'At least one passenger is required';
  }

  for (let index = 0; index < passengers.length; index += 1) {
    const passenger = passengers[index] || {};
    const doc = getPassengerDocument(passenger);
    const firstName = passenger.first_name || passenger.firstName || '';
    const lastName = passenger.last_name || passenger.lastName || '';
    const dateOfBirth = passenger.date_of_birth || passenger.dateOfBirth || '';
    const passportNumber = passenger.passport_number || passenger.passportNumber || doc.number || doc.passport_number || '';
    const passportExpiry = passenger.passport_expiry || passenger.passportExpiry || doc.expiry_date || doc.expiration_date || '';
    const nationality = passenger.nationality || doc.citizenship || doc.issuing_country || '';

    if (isPlaceholderPassengerValue(firstName)) {
      return `Passenger ${index + 1}: first_name must be a real passenger name`;
    }
    if (isPlaceholderPassengerValue(lastName)) {
      return `Passenger ${index + 1}: last_name must be a real passenger name`;
    }
    if (!String(dateOfBirth).trim()) {
      return `Passenger ${index + 1}: date_of_birth is required`;
    }
    if (isPlaceholderPassengerValue(passportNumber)) {
      return `Passenger ${index + 1}: passport number is required`;
    }
    if (!String(passportExpiry).trim()) {
      return `Passenger ${index + 1}: passport expiry is required`;
    }
    if (!String(nationality).trim()) {
      return `Passenger ${index + 1}: nationality is required`;
    }
  }

  return null;
}

// Build DRCT-compatible passenger objects from widget input OR DB rows.
// Widget sends passport nested in `p.document { number, expiry_date, issuing_country }`,
// while our Supabase rows have flat `passport_number`, `passport_expiry`, etc.
// Read from both shapes so this helper works regardless of caller.
function buildDrctPassengers(passengers, contacts = {}, passengerRefs = []) {
  const refsByType = buildPassengerRefsByType(passengerRefs);
  const usedRefsByType = new Map();

  return passengers.map((p, index) => {
    const doc = getPassengerDocument(p);
    const email = String(p.email || p.contact_email || contacts.email || '').trim().toLowerCase();
    const phone = String(p.phone || p.contact_phone || contacts.phone || '').trim();
    const type = normalizePassengerType(p.passenger_type || p.type);
    const typeRefs = refsByType.get(type) || [];
    const usedRefs = usedRefsByType.get(type) || 0;
    const matchedRef = typeRefs[usedRefs] || null;
    usedRefsByType.set(type, usedRefs + 1);

    const drctPassenger = {
      id: matchedRef?.id || `T${index + 1}`,
      type,
      individual: {
        first_name: String(p.first_name || p.firstName || '').trim(),
        last_name: String(p.last_name || p.lastName || '').trim(),
        date_of_birth: p.date_of_birth || p.dateOfBirth || null,
        gender: normalizePassengerGender(p.gender)
      },
      email,
      phone,
      document: {
        type: 'REGULAR_PASSPORT',
        number: String(p.passport_number || p.passportNumber || doc.number || doc.passport_number || '').trim(),
        gender: normalizePassengerGender(p.gender),
        issuing_country: p.passport_issuing_country || p.issuing_country || doc.issuing_country || doc.country_of_issue || 'SA',
        citizenship: p.nationality || doc.citizenship || doc.issuing_country || 'SA',
        country_of_issue: p.passport_issuing_country || p.issuing_country || doc.country_of_issue || doc.issuing_country || 'SA',
        expiration_date: p.passport_expiry || p.passportExpiry || doc.expiry_date || doc.expiration_date || null
      }
    };

    if (matchedRef?.infant_ref && type === 'INF') {
      drctPassenger.infant_ref = matchedRef.infant_ref;
    }

    return drctPassenger;
  });
}

function buildDrctPricePassengers(passengers) {
  return passengers.map((p, index) => {
    const passenger = {
      id: `T${index + 1}`,
      type: normalizePassengerType(p.passenger_type || p.type)
    };
    const dateOfBirth = p.date_of_birth || p.dateOfBirth || null;
    if (dateOfBirth) passenger.date_of_birth = dateOfBirth;
    return passenger;
  });
}

function mergeOfferPriceIntoOffer(searchOffer = {}, pricedOffer = {}) {
  const existingPrice = searchOffer?.price || {};
  const pricedPrice = pricedOffer?.price || {};
  return {
    ...searchOffer,
    offer_id: pricedOffer.offer_id || searchOffer.offer_id || searchOffer.id || null,
    id: pricedOffer.offer_id || searchOffer.id || searchOffer.offer_id || null,
    price: {
      ...existingPrice,
      total: Number(pricedPrice.total || existingPrice.total || searchOffer.total_price || 0),
      amount: Number(pricedPrice.total || existingPrice.amount || existingPrice.total || searchOffer.total_price || 0),
      currency: pricedPrice.currency || existingPrice.currency || searchOffer.currency || 'SAR',
      base: Number(pricedPrice.breakdown?.base_fare || existingPrice.base || 0),
      taxes: Number(pricedPrice.breakdown?.taxes || existingPrice.taxes || 0),
      fees: Number(pricedPrice.breakdown?.fees || existingPrice.fees || 0),
      surcharges: Number(pricedPrice.breakdown?.surcharges || existingPrice.surcharges || 0),
      per_passenger: pricedPrice.per_passenger || existingPrice.per_passenger || []
    },
    fare_details: pricedOffer.fare_details || searchOffer.fare_details || null,
    flights: pricedOffer.flights || searchOffer.flights || null,
    passengers: Array.isArray(pricedOffer.passengers) && pricedOffer.passengers.length
      ? pricedOffer.passengers
      : (Array.isArray(searchOffer.passengers) ? searchOffer.passengers : []),
    price_confirmation: {
      offer_id: pricedOffer.offer_id || null,
      expiration: pricedOffer.expiration || null,
      timestamp: pricedOffer.timestamp || new Date().toISOString()
    }
  };
}

async function requestOfferPrice({ offer, passengers, originHost, idempotencyKey = null }) {
  const offerId = String(offer?.offer_id || offer?.id || '').trim();
  if (!offerId) {
    const err = new Error('offer.offer_id is required');
    err.code = 'INVALID_INPUT';
    err.statusCode = 400;
    throw err;
  }
  if (!Array.isArray(passengers) || passengers.length === 0) {
    const err = new Error('passengers are required to confirm final fare');
    err.code = 'INVALID_INPUT';
    err.statusCode = 400;
    throw err;
  }

  const priced = await drctDirectClient.priceOffer(
    {
      offer_id: offerId,
      passengers: buildDrctPricePassengers(passengers)
    },
    {
      idempotencyKey: idempotencyKey || `widget-price-${normalizeHost(originHost) || 'unknown'}-${offerId}`,
      sandbox: shouldUseDrctSandboxForHost(originHost)
    }
  );

  const mergedOffer = mergeOfferPriceIntoOffer(offer, priced);
  const originalTicketTotal = Number(offer?.price?.total || offer?.total_price || 0);
  const repricedTicketTotal = Number(priced?.price?.total || originalTicketTotal || 0);

  return {
    original_offer_id: offerId,
    priced_offer: mergedOffer,
    drct_price: priced,
    price_changed: Math.abs(repricedTicketTotal - originalTicketTotal) > 0.009,
    pricing: {
      base_price: repricedTicketTotal,
      taxes: Number(priced?.price?.breakdown?.taxes || offer?.price?.taxes || 0),
      baggage_price: 0,
      markup_amount: Number(offer?.price?.markup_amount || 0),
      total_price: repricedTicketTotal,
      currency: priced?.price?.currency || offer?.price?.currency || offer?.currency || 'SAR'
    }
  };
}

router.post('/api/widget/session', async (req, res) => {
  const {
    agency_key: agencyKey,
    agency_domain: agencyDomain,
    origin_host: originHostFromBody,
    preview_mode: previewMode
  } = req.body || {};

  if (!agencyKey && !agencyDomain) {
    return res.status(400).json({
      error: {
        code: 'INVALID_INPUT',
        message: 'agency_key or agency_domain is required'
      }
    });
  }

  try {
    let agency = null;
    if (agencyKey) {
      const normalizedKey = String(agencyKey).trim().toLowerCase();
      const { data } = await supabase
        .from('agencies')
        .select('id,name,domain,contact_email,contact_phone,is_active,settings')
        .or(`api_key.eq.${normalizedKey},domain.eq.${normalizedKey}`)
        .limit(1)
        .maybeSingle();
      agency = data || null;
    }
    if (!agency && agencyDomain) {
      const normalizedDomain = normalizeHost(agencyDomain);
      const { data } = await supabase
        .from('agencies')
        .select('id,name,domain,contact_email,contact_phone,is_active,settings')
        .eq('domain', normalizedDomain)
        .limit(1)
        .maybeSingle();
      agency = data || null;
    }

    if (!agency) {
      return res.status(404).json({
        error: {
          code: 'AGENCY_NOT_FOUND',
          message: 'Agency not found for widget session'
        }
      });
    }
    if (!agency.is_active) {
      return res.status(403).json({
        error: {
          code: 'AGENCY_DISABLED',
          message: 'Agency is not active'
        }
      });
    }

    const requestHost = normalizeHost(originHostFromBody) || getRequestOriginHost(req);
    const allowAdminPreview = Boolean(previewMode) && requestHost === 'admin.aviaframe.com';
    if (!allowAdminPreview && !isWidgetOriginAllowed(agency, requestHost)) {
      return res.status(403).json({
        error: {
          code: 'WIDGET_ORIGIN_NOT_ALLOWED',
          message: `Origin host ${requestHost || 'unknown'} is not allowed for this agency`
        }
      });
    }

    const nowSec = Math.floor(Date.now() / 1000);
    const expiresIn = Math.max(300, config.widgetTokenTtlSec);
    const token = issueWidgetToken({
      typ: 'widget_session',
      agency_id: agency.id,
      origin_host: requestHost,
      iat: nowSec,
      exp: nowSec + expiresIn
    });

    return res.json({
      widget_token: token,
      expires_in: expiresIn,
      agency: {
        id: agency.id,
        name: agency.name,
        domain: agency.domain,
        contact_email: agency.contact_email,
        contact_phone: agency.contact_phone,
        settings: {
          language: agency?.settings?.language || 'en',
          commission: agency?.settings?.commission || null,
          bank_details: agency?.settings?.bank_details || null,
          payment_methods: agency?.settings?.payment_methods || ['online']
        }
      }
    });
  } catch (err) {
    console.error('Widget session error:', err);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: config.nodeEnv === 'development' ? err.message : 'Internal server error'
      }
    });
  }
});

router.post('/api/widget/price-offer', async (req, res) => {
  const authHeader = req.headers.authorization || '';
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  const token = bearerToken || req.body?.widget_token;
  const parsed = parseWidgetToken(token);
  if (parsed.error) {
    return res.status(401).json({
      error: {
        code: parsed.error,
        message: 'Widget token is invalid'
      }
    });
  }

  const payload = parsed.payload;
  const clientOriginHost = normalizeHost(req.body?.origin_host || req.body?.metadata?.origin_host || '');
  if (payload.origin_host && clientOriginHost && payload.origin_host !== clientOriginHost) {
    return res.status(403).json({
      error: {
        code: 'WIDGET_ORIGIN_MISMATCH',
        message: 'Widget token origin does not match request origin'
      }
    });
  }

  const { offer = {}, passengers = [], metadata = {} } = req.body || {};

  try {
    const { data: agency, error: agencyError } = await supabase
      .from('agencies')
      .select('id,name,domain,is_active,settings')
      .eq('id', payload.agency_id)
      .single();
    if (agencyError || !agency) {
      return res.status(404).json({
        error: {
          code: 'AGENCY_NOT_FOUND',
          message: 'Agency from widget token does not exist'
        }
      });
    }
    if (!agency.is_active) {
      return res.status(403).json({
        error: {
          code: 'AGENCY_DISABLED',
          message: 'Agency is not active'
        }
      });
    }

    const effectiveOriginHost = payload.origin_host || clientOriginHost || normalizeHost(metadata?.origin_host || '');
    if (!isWidgetOriginAllowed(agency, effectiveOriginHost)) {
      return res.status(403).json({
        error: {
          code: 'WIDGET_ORIGIN_NOT_ALLOWED',
          message: 'Origin is not allowed for agency widget'
        }
      });
    }

    const priced = await requestOfferPrice({
      offer,
      passengers,
      originHost: effectiveOriginHost,
      idempotencyKey: req.headers['idempotency-key'] || null
    });

    return res.json({
      success: true,
      use_offer_price_flow: shouldUseOfferPriceForHost(effectiveOriginHost),
      ...priced
    });
  } catch (err) {
    logger.error({
      err: err.message,
      code: err.code || null,
      statusCode: err.statusCode || null,
      responseBody: err.responseBody || null,
      offer_id: offer?.offer_id || offer?.id || null
    }, '[widget/price-offer] failed');

    const status = Number(err.statusCode || 502);
    return res.status(status >= 400 && status < 600 ? status : 502).json({
      error: {
        code: err.code || 'OFFER_PRICE_FAILED',
        message: err.message || 'Failed to confirm final fare'
      }
    });
  }
});

router.post('/api/widget/orders', async (req, res) => {
  const authHeader = req.headers.authorization || '';
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  const token = bearerToken || req.body?.widget_token;
  const parsed = parseWidgetToken(token);
  if (parsed.error) {
    return res.status(401).json({
      error: {
        code: parsed.error,
        message: 'Widget token is invalid'
      }
    });
  }

  const payload = parsed.payload;
  const clientOriginHost = normalizeHost(req.body?.origin_host || req.body?.metadata?.origin_host || '');
  if (payload.origin_host && clientOriginHost && payload.origin_host !== clientOriginHost) {
    return res.status(403).json({
      error: {
        code: 'WIDGET_ORIGIN_MISMATCH',
        message: 'Widget token origin does not match request origin'
      }
    });
  }

  const {
    contacts = {},
    offer = {},
    pricing = {},
    passengers = [],
    metadata = {},
    priced_offer: pricedOfferInput = null,
    offer_price_data: offerPriceDataInput = null,
    user_id: userIdFromBody = null,
    payment_method: paymentMethodFromBody = null
  } = req.body || {};

  const contactEmail = String(contacts.email || '').trim().toLowerCase();
  const contactPhone = String(contacts.phone || '').trim();
  const origin = String(offer.origin || '').trim();
  const destination = String(offer.destination || '').trim();
  const currency = String(pricing.currency || offer.currency || 'USD').trim().toUpperCase();

  const basePrice = Number(pricing.base_price ?? offer.base_price ?? offer.price ?? 0);
  const taxes = Number(pricing.taxes ?? offer.taxes ?? 0);
  const baggagePrice = Number(pricing.baggage_price ?? 0);
  const markupAmount = Number(pricing.markup_amount ?? offer.price?.markup_amount ?? 0);
  const totalPrice = Number(pricing.total_price ?? (basePrice + taxes + baggagePrice));

  if (!contactEmail || !contactPhone || !origin || !destination || !Number.isFinite(totalPrice) || totalPrice <= 0) {
    return res.status(400).json({
      error: {
        code: 'INVALID_INPUT',
        message: 'contacts.email, contacts.phone, offer.origin, offer.destination and pricing.total_price are required'
      }
    });
  }

  const passengerValidationError = validateWidgetPassengers(passengers);
  if (passengerValidationError) {
    return res.status(400).json({
      error: {
        code: 'INVALID_PASSENGER_DATA',
        message: passengerValidationError
      }
    });
  }

  try {
    const { data: agency, error: agencyError } = await supabase
      .from('agencies')
      .select('id,name,domain,is_active,settings')
      .eq('id', payload.agency_id)
      .single();
    if (agencyError || !agency) {
      return res.status(404).json({
        error: {
          code: 'AGENCY_NOT_FOUND',
          message: 'Agency from widget token does not exist'
        }
      });
    }
    if (!agency.is_active) {
      return res.status(403).json({
        error: {
          code: 'AGENCY_DISABLED',
          message: 'Agency is not active'
        }
      });
    }
    if (!isWidgetOriginAllowed(agency, payload.origin_host || clientOriginHost)) {
      return res.status(403).json({
        error: {
          code: 'WIDGET_ORIGIN_NOT_ALLOWED',
          message: 'Origin is not allowed for agency widget'
        }
      });
    }

    // Validate payment_method against agency's allowed methods
    const allowedMethods = Array.isArray(agency?.settings?.payment_methods) && agency.settings.payment_methods.length
      ? agency.settings.payment_methods
      : ['online'];
    const requestedMethod = String(paymentMethodFromBody || '').trim().toLowerCase();
    const tamaraAllowed = requestedMethod === 'tamara'
      && VALID_PAYMENT_METHODS.includes('tamara')
      && (allowedMethods.includes('tamara') || allowedMethods.includes('online'));
    const paymentMethod = VALID_PAYMENT_METHODS.includes(requestedMethod)
      && (allowedMethods.includes(requestedMethod) || tamaraAllowed)
      ? requestedMethod
      : allowedMethods[0];

    const effectiveOriginHost = payload.origin_host || clientOriginHost || normalizeHost(metadata?.origin_host || '');
    const offerPriceFlowEnabled = shouldUseOfferPriceForHost(effectiveOriginHost);
    const dryRunIssue = Boolean(metadata?.dry_run_issue);
    const onlinePayment = paymentMethod === 'online' || paymentMethod === 'tamara';
    let effectiveOffer = offer;
    let effectiveBasePrice = Number.isFinite(basePrice) ? basePrice : 0;
    let effectiveTaxes = Number.isFinite(taxes) ? taxes : 0;
    let effectiveBaggagePrice = Number.isFinite(baggagePrice) ? baggagePrice : 0;
    let effectiveMarkupAmount = Number.isFinite(markupAmount) && markupAmount > 0 ? markupAmount : 0;
    let effectiveTotalPrice = totalPrice;
    let effectiveCurrency = currency;
    let priceConfirmationMeta = null;

    if (!dryRunIssue && onlinePayment && offerPriceFlowEnabled) {
      try {
        const pricedResult = (
          pricedOfferInput && typeof pricedOfferInput === 'object' && !Array.isArray(pricedOfferInput)
            ? {
                original_offer_id: offer.offer_id || offer.id || null,
                priced_offer: mergeOfferPriceIntoOffer(offer, pricedOfferInput),
                drct_price: offerPriceDataInput?.drct_price || null,
                price_changed: Boolean(offerPriceDataInput?.price_changed),
                pricing: {
                  base_price: Number(pricedOfferInput?.price?.total || basePrice || 0),
                  taxes: Number(pricedOfferInput?.price?.taxes || pricedOfferInput?.price?.breakdown?.taxes || taxes || 0),
                  baggage_price: effectiveBaggagePrice,
                  markup_amount: effectiveMarkupAmount,
                  total_price: Number(pricedOfferInput?.price?.total || basePrice || 0),
                  currency: pricedOfferInput?.price?.currency || currency
                }
              }
            : await requestOfferPrice({
                offer,
                passengers,
                originHost: effectiveOriginHost,
                idempotencyKey: req.headers['idempotency-key'] || null
              })
        );

        effectiveOffer = pricedResult.priced_offer || effectiveOffer;
        effectiveBasePrice = Number(pricedResult.pricing?.base_price || effectiveBasePrice || 0);
        effectiveTaxes = Number(pricedResult.pricing?.taxes || effectiveTaxes || 0);
        effectiveCurrency = String(pricedResult.pricing?.currency || effectiveCurrency || 'SAR').toUpperCase();
        effectiveTotalPrice = Number(pricedResult.pricing?.total_price || effectiveBasePrice || 0) + effectiveBaggagePrice;
        priceConfirmationMeta = {
          original_offer_id: pricedResult.original_offer_id || offer.offer_id || offer.id || null,
          priced_offer_id: effectiveOffer.offer_id || effectiveOffer.id || null,
          price_changed: Boolean(pricedResult.price_changed),
          priced_at: pricedResult.drct_price?.timestamp || new Date().toISOString(),
          expiration: pricedResult.drct_price?.expiration || effectiveOffer?.price_confirmation?.expiration || null,
          pricing: pricedResult.pricing || null,
          drct_price: pricedResult.drct_price || null
        };
      } catch (priceErr) {
        logger.error({
          err: priceErr.message,
          code: priceErr.code || null,
          statusCode: priceErr.statusCode || null,
          responseBody: priceErr.responseBody || null,
          offer_id: offer.offer_id || offer.id || null
        }, '[widget/orders] OfferPrice failed before createOrder');
        return res.status(409).json({
          error: {
            code: priceErr.code || 'OFFER_PRICE_FAILED',
            message: 'Unable to confirm final fare. Please retry or choose another offer.'
          }
        });
      }
    }

    const orderInsert = {
      order_number: generateOrderNumber(),
      user_id: userIdFromBody || null,
      agency_id: payload.agency_id,
      origin,
      destination,
      departure_time: effectiveOffer.departure_time || offer.departure_time || null,
      arrival_time: effectiveOffer.arrival_time || offer.arrival_time || null,
      airline_code: effectiveOffer.airline_code || offer.airline_code || null,
      airline_name: effectiveOffer.airline_name || offer.airline_name || null,
      flight_number: effectiveOffer.flight_number || offer.flight_number || null,
      base_price: effectiveBasePrice,
      taxes: effectiveTaxes,
      baggage_price: effectiveBaggagePrice,
      total_price: effectiveTotalPrice,
      markup_amount: effectiveMarkupAmount,
      currency: effectiveCurrency,
      status: 'pending',
      payment_method: paymentMethod === 'tamara' ? 'online' : paymentMethod,
      payment_provider: paymentMethod === 'tamara' ? 'tamara' : paymentMethod === 'online' ? 'moyasar' : null,
      contact_email: contactEmail,
      contact_phone: contactPhone,
      raw_offer_data: {
        offer: effectiveOffer,
        pricing: {
          ...pricing,
          base_price: effectiveBasePrice,
          taxes: effectiveTaxes,
          baggage_price: effectiveBaggagePrice,
          markup_amount: effectiveMarkupAmount,
          total_price: effectiveTotalPrice,
          currency: effectiveCurrency
        },
        metadata: {
          ...metadata,
          source: 'widget',
          origin_host: effectiveOriginHost,
          offer_price_confirmed: Boolean(priceConfirmationMeta),
          offer_price_data: priceConfirmationMeta
        }
      },
      notes: metadata?.notes || null
    };

    let { data: createdOrder, error: createOrderError } = await supabase
      .from('orders')
      .insert(orderInsert)
      .select(ORDERS_LIST_COLUMNS)
      .single();

    // Some staging databases still lag behind and do not have markup_amount yet.
    // Retry without that field so demo/test contours keep working while schema drift is resolved.
    if (createOrderError && isMissingColumnError(createOrderError, 'markup_amount')) {
      const { markup_amount, ...compatOrderInsert } = orderInsert;
      ({ data: createdOrder, error: createOrderError } = await supabase
        .from('orders')
        .insert(compatOrderInsert)
        .select(ORDERS_LIST_COLUMNS)
        .single());
    }

    if (createOrderError || !createdOrder) {
      return res.status(500).json({
        error: {
          code: 'WIDGET_ORDER_CREATE_FAILED',
          message: createOrderError?.message || 'Failed to create widget order'
        }
      });
    }

    if (Array.isArray(passengers) && passengers.length > 0) {
      const normalizeGender = (g) => {
        const v = String(g || '').toLowerCase().trim();
        if (v === 'male' || v === 'm') return 'male';
        if (v === 'female' || v === 'f') return 'female';
        return null;
      };
      // Widget sends passport nested in p.document { number, expiry_date, issuing_country }.
      // Backfill flat columns for backward compat and downstream DRCT create.
      const passengerRows = passengers.map((p) => {
        const doc = getPassengerDocument(p);
        return {
          order_id: createdOrder.id,
          gender: normalizeGender(p.gender),
          first_name: String(p.first_name || p.firstName || '').trim(),
          last_name: String(p.last_name || p.lastName || '').trim(),
          date_of_birth: p.date_of_birth || p.dateOfBirth || null,
          passport_number: String(p.passport_number || p.passportNumber || doc.number || '').trim(),
          passport_expiry: p.passport_expiry || p.passportExpiry || doc.expiry_date || doc.expiration_date || null,
          passport_issuing_country: p.passport_issuing_country || p.issuing_country || doc.issuing_country || doc.country_of_issue || 'SA',
          nationality: p.nationality || doc.citizenship || doc.issuing_country || 'SA',
          passenger_type: p.passenger_type || p.type || 'ADT',
          baggage_allowance: p.baggage_allowance || null
        };
      });
      const { error: passengerError } = await supabase
        .from('passengers')
        .insert(passengerRows);
      if (passengerError) {
        console.error('Widget passengers insert failed:', passengerError.message);
        // Roll back the order so the client gets a clear error instead of a broken order
        await supabase.from('orders').delete().eq('id', createdOrder.id);
        return res.status(400).json({
          error: {
            code: 'PASSENGER_INSERT_FAILED',
            message: `Passenger data invalid: ${passengerError.message}`
          }
        });
      }
    }

    // Reserve the seat with DRCT BEFORE returning. If this fails the whole booking
    // rolls back so the client never proceeds to payment for an unreserved seat.
    // Root cause of the 2026-07-07 Q8BBVQ incident: this step was previously absent,
    // payment succeeded but no ticket could ever be issued. Do not remove.
    //
    // Skip DRCT create for demo / dry-run bookings: reserving a real seat when the
    // downstream flow will only emit a fake PDF is pointless and would leave a
    // dangling reservation the ops team has to void by hand.
    const offerIdForDrct = effectiveOffer.offer_id || effectiveOffer.id || offer.offer_id || offer.id || null;
    if (dryRunIssue) {
      logger.info({
        order_id: createdOrder.id,
        order_number: createdOrder.order_number
      }, '[widget/orders] dry-run booking — skipping DRCT create');
    }
    if (!dryRunIssue && offerIdForDrct && onlinePayment && Array.isArray(passengers) && passengers.length > 0) {
      let drctResp = null;
      const useSandbox = shouldUseDrctSandboxForHost(effectiveOriginHost);
      const drctPassengerRefs = Array.isArray(effectiveOffer?.passengers)
        ? effectiveOffer.passengers
        : [];
      const drctCreatePassengers = buildDrctPassengers(passengers, { email: contactEmail, phone: contactPhone }, drctPassengerRefs);
      try {
        drctResp = await drctDirectClient.createOrder({
          offer_id: offerIdForDrct,
          passengers: drctCreatePassengers,
          payment_method: 'CARD'
        }, {
          idempotencyKey: `order-create-${createdOrder.id}`,
          sandbox: useSandbox
        });
      } catch (drctErr) {
        logger.error({
          err: drctErr.message,
          code: drctErr.code || null,
          statusCode: drctErr.statusCode || null,
          responseBody: drctErr.responseBody || null,
          order_id: createdOrder.id,
          order_number: createdOrder.order_number,
          offer_id: offerIdForDrct,
          // TEMP debug: dump exact payload we sent to DRCT so we can diagnose 404s
          _debug_drct_payload: {
            offer_id: offerIdForDrct,
            passengers: drctCreatePassengers,
            payment_method: 'CARD'
          },
          _debug_widget_input_passengers: passengers
        }, '[widget/orders] DRCT createOrder FAILED — rolling back order + passengers');
        // Rollback: delete passengers first (FK), then order
        try { await supabase.from('passengers').delete().eq('order_id', createdOrder.id); } catch (_) {}
        try { await supabase.from('orders').delete().eq('id', createdOrder.id); } catch (_) {}
        return res.status(502).json({
          error: {
            code: 'DRCT_CREATE_FAILED',
            message: 'Unable to reserve seat with airline provider. Please try again.',
            details: drctErr.code || null
          }
        });
      }
      const drctOrderId = drctResp?.order_id || null;
      if (!drctOrderId) {
        logger.error({
          order_id: createdOrder.id,
          drct_response: drctResp
        }, '[widget/orders] DRCT createOrder returned no order_id — rolling back');
        try { await supabase.from('passengers').delete().eq('order_id', createdOrder.id); } catch (_) {}
        try { await supabase.from('orders').delete().eq('id', createdOrder.id); } catch (_) {}
        return res.status(502).json({
          error: {
            code: 'DRCT_INVALID_RESPONSE',
            message: 'Airline provider did not return an order reference. Please try again.'
          }
        });
      }
      const { data: updatedOrder, error: updateErr } = await supabase
        .from('orders')
        .update({ drct_order_id: drctOrderId })
        .eq('id', createdOrder.id)
        .select(ORDERS_LIST_COLUMNS)
        .single();
      if (updateErr) {
        logger.error({
          err: updateErr.message,
          order_id: createdOrder.id,
          drct_order_id: drctOrderId
        }, '[widget/orders] failed to persist drct_order_id (DRCT create succeeded, DB update failed)');
        // Do NOT rollback — DRCT reservation exists; return error so client retries idempotently
        return res.status(500).json({
          error: {
            code: 'ORDER_UPDATE_FAILED',
            message: 'Reservation created but not persisted. Support will reconcile.',
            drct_order_id: drctOrderId
          }
        });
      }
      createdOrder = updatedOrder;
      logger.info({
        order_id: createdOrder.id,
        order_number: createdOrder.order_number,
        drct_order_id: drctOrderId
      }, '[widget/orders] DRCT order created and linked');
    }

    // For cash orders: send booking confirmation email asynchronously
    if (paymentMethod === 'cash' && createdOrder.contact_email) {
      setImmediate(async () => {
        try {
          const { sendSupportEmail } = require('../services/emailService');
          const agencyName = agency.name || 'AviaFrame';
          const agencyPhone = agency.contact_phone || '';
          const agencyEmail = agency.contact_email || '';
          const lines = [
            `Hello,`,
            ``,
            `Your flight booking has been created successfully.`,
            ``,
            `Order number: ${createdOrder.order_number}`,
            `Route: ${origin} → ${destination}`,
            `Amount: ${totalPrice} ${currency}`,
            ``,
            `Payment method: Cash at office`,
            `Please visit our office to complete payment.`,
            agencyPhone ? `Phone: ${agencyPhone}` : null,
            agencyEmail ? `Email: ${agencyEmail}` : null,
            ``,
            `Your e-ticket will be issued and sent to you after cash payment is received.`,
            ``,
            `${agencyName}`
          ].filter(l => l !== null).join('\n');
          await sendSupportEmail({
            to: createdOrder.contact_email,
            subject: `Booking Confirmation ${createdOrder.order_number} — Pay at Office`,
            text: lines
          });
          console.log('[widget/orders] cash confirmation email sent to', createdOrder.contact_email);
        } catch (e) {
          console.error('[widget/orders] cash confirmation email failed:', e.message);
        }
      });
    }

    // For invoice orders: send bank details email asynchronously
    if (paymentMethod === 'invoice' && createdOrder.contact_email) {
      const bank = agency?.settings?.bank_details || {};
      if (bank.bank_name || bank.iban) {
        setImmediate(async () => {
          try {
            const { sendSupportEmail } = require('../services/emailService');
            const lines = [
              `Hello,`,
              ``,
              `Your flight booking has been created successfully.`,
              `Order number: ${createdOrder.order_number}`,
              `Route: ${origin} → ${destination}`,
              `Amount due: ${totalPrice} ${currency}`,
              ``,
              `Please transfer the amount to:`,
              bank.bank_name ? `Bank: ${bank.bank_name}` : null,
              bank.iban ? `IBAN: ${bank.iban}` : null,
              bank.swift_bic ? `SWIFT/BIC: ${bank.swift_bic}` : null,
              bank.bank_account ? `Account: ${bank.bank_account}` : null,
              ``,
              `Please include your order number ${createdOrder.order_number} in the payment reference.`,
              `Your ticket will be issued after payment confirmation.`,
              ``,
              `${agency.name || 'AviaFrame'}`
            ].filter(l => l !== null).join('\n');
            await sendSupportEmail({
              to: createdOrder.contact_email,
              subject: `Invoice — Payment Instructions for booking ${createdOrder.order_number}`,
              text: lines
            });
            console.log('[widget/orders] invoice email sent to', createdOrder.contact_email);
          } catch (e) {
            console.error('[widget/orders] invoice email failed:', e.message);
          }
        });
      }
    }

    return res.status(201).json({
      order: createdOrder,
      payment_method: paymentMethod,
      agency: {
        id: agency.id,
        name: agency.name,
        domain: agency.domain,
        bank_details: paymentMethod === 'invoice' ? (agency?.settings?.bank_details || null) : null
      }
    });
  } catch (err) {
    console.error('Widget order create error:', err);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: config.nodeEnv === 'development' ? err.message : 'Internal server error'
      }
    });
  }
});

module.exports = router;
