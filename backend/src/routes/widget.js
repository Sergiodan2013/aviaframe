'use strict';

const express = require('express');
const crypto = require('crypto');
const supabase = require('../lib/supabase');
const { normalizeHost, getRequestOriginHost, isWidgetOriginAllowed, generateOrderNumber } = require('../lib/utils');
const { issueWidgetToken, parseWidgetToken } = require('../lib/widgetToken');
const { buildItineraryPdf } = require('../services/pdfService');
const { sendBookingConfirmation } = require('../services/emailService');

const router = express.Router();

const ORDERS_LIST_COLUMNS = [
  'id',
  'order_number',
  'user_id',
  'agency_id',
  'drct_order_id',
  'origin',
  'destination',
  'departure_time',
  'arrival_time',
  'airline_code',
  'airline_name',
  'flight_number',
  'total_price',
  'currency',
  'status',
  'payment_method',
  'payment_status',
  'contact_email',
  'contact_phone',
  'created_at',
  'updated_at',
  'confirmed_at',
  'cancelled_at'
].join(',');

// POST /api/widget/session
router.post('/session', async (req, res) => {
  const {
    agency_key: agencyKey,
    agency_domain: agencyDomain,
    origin_host: originHostFromBody
  } = req.body || {};

  if (!agencyKey && !agencyDomain) {
    return res.status(400).json({
      error: {
        code: 'INVALID_INPUT',
        message: 'agency_key or agency_domain is required'
      }
    });
  }

  const widgetTokenSecret = req.app.get('widgetTokenSecret');
  const widgetTokenTtlSec = req.app.get('widgetTokenTtlSec');
  const nodeEnv = req.app.get('nodeEnv');

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
    if (!isWidgetOriginAllowed(agency, requestHost, nodeEnv)) {
      return res.status(403).json({
        error: {
          code: 'WIDGET_ORIGIN_NOT_ALLOWED',
          message: `Origin host ${requestHost || 'unknown'} is not allowed for this agency`
        }
      });
    }

    const nowSec = Math.floor(Date.now() / 1000);
    const expiresIn = Math.max(300, widgetTokenTtlSec);
    const token = issueWidgetToken({
      typ: 'widget_session',
      agency_id: agency.id,
      origin_host: requestHost,
      iat: nowSec,
      exp: nowSec + expiresIn
    }, widgetTokenSecret);

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
          bank_details: agency?.settings?.bank_details || null
        }
      }
    });
  } catch (err) {
    console.error('Widget session error:', err);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: nodeEnv === 'development' ? err.message : 'Internal server error'
      }
    });
  }
});

// GET /api/widget/session (alias)
router.get('/session', async (req, res) => {
  return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Use POST /api/widget/session' } });
});

// POST /api/widget/orders
router.post('/orders', async (req, res) => {
  const widgetTokenSecret = req.app.get('widgetTokenSecret');
  const nodeEnv = req.app.get('nodeEnv');

  const authHeader = req.headers.authorization || '';
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  const token = bearerToken || req.body?.widget_token;
  const parsed = parseWidgetToken(token, widgetTokenSecret);
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
    user_id: userIdFromBody = null,
    payment_method: paymentMethodFromBody = null
  } = req.body || {};

  const VALID_PAYMENT_METHODS = ['cash', 'bank_transfer', 'online'];
  const paymentMethod = VALID_PAYMENT_METHODS.includes(paymentMethodFromBody)
    ? paymentMethodFromBody
    : 'bank_transfer';

  const contactEmail = String(contacts.email || '').trim().toLowerCase();
  const contactPhone = String(contacts.phone || '').trim();
  const origin = String(offer.origin || '').trim();
  const destination = String(offer.destination || '').trim();
  const currency = String(pricing.currency || offer.currency || 'USD').trim().toUpperCase();

  const basePrice = Number(pricing.base_price ?? offer.base_price ?? offer.price ?? 0);
  const taxes = Number(pricing.taxes ?? offer.taxes ?? 0);
  const baggagePrice = Number(pricing.baggage_price ?? 0);
  const totalPrice = Number(pricing.total_price ?? (basePrice + taxes + baggagePrice));

  if (!contactEmail || !contactPhone || !origin || !destination || !Number.isFinite(totalPrice) || totalPrice <= 0) {
    return res.status(400).json({
      error: {
        code: 'INVALID_INPUT',
        message: 'contacts.email, contacts.phone, offer.origin, offer.destination and pricing.total_price are required'
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
    if (!isWidgetOriginAllowed(agency, payload.origin_host || clientOriginHost, nodeEnv)) {
      return res.status(403).json({
        error: {
          code: 'WIDGET_ORIGIN_NOT_ALLOWED',
          message: 'Origin is not allowed for agency widget'
        }
      });
    }

    const orderInsert = {
      order_number: generateOrderNumber(),
      user_id: userIdFromBody || null,
      agency_id: payload.agency_id,
      origin,
      destination,
      departure_time: offer.departure_time || null,
      arrival_time: offer.arrival_time || null,
      airline_code: offer.airline_code || null,
      airline_name: offer.airline_name || null,
      flight_number: offer.flight_number || null,
      base_price: Number.isFinite(basePrice) ? basePrice : 0,
      taxes: Number.isFinite(taxes) ? taxes : 0,
      baggage_price: Number.isFinite(baggagePrice) ? baggagePrice : 0,
      total_price: totalPrice,
      currency,
      status: 'pending',
      payment_method: paymentMethod,
      payment_status: 'pending',
      claim_token: crypto.randomUUID(),
      claim_token_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      contact_email: contactEmail,
      contact_phone: contactPhone,
      raw_offer_data: {
        offer,
        pricing,
        metadata: {
          ...metadata,
          source: 'widget',
          origin_host: payload.origin_host || clientOriginHost
        }
      },
      notes: metadata?.notes || null
    };

    const { data: createdOrder, error: createOrderError } = await supabase
      .from('orders')
      .insert(orderInsert)
      .select(ORDERS_LIST_COLUMNS + ',claim_token')
      .single();

    if (createOrderError || !createdOrder) {
      return res.status(500).json({
        error: {
          code: 'WIDGET_ORDER_CREATE_FAILED',
          message: createOrderError?.message || 'Failed to create widget order'
        }
      });
    }

    if (Array.isArray(passengers) && passengers.length > 0) {
      const passengerRows = passengers.map((p) => ({
        order_id: createdOrder.id,
        gender: p.gender || null,
        first_name: p.first_name || p.firstName || 'N/A',
        last_name: p.last_name || p.lastName || 'N/A',
        date_of_birth: p.date_of_birth || p.dateOfBirth || null,
        passport_number: p.passport_number || p.passportNumber || 'N/A',
        passport_expiry: p.passport_expiry || p.passportExpiry || null,
        passport_issuing_country: p.passport_issuing_country || p.issuing_country || 'SA',
        nationality: p.nationality || 'SA',
        passenger_type: p.passenger_type || p.type || 'ADT',
        baggage_allowance: p.baggage_allowance || null
      }));
      const { error: passengerError } = await supabase
        .from('passengers')
        .insert(passengerRows);
      if (passengerError) {
        console.warn('Widget passengers insert failed:', passengerError.message);
      }
    }

    // Send booking confirmation email (non-blocking — don't fail order if email fails)
    const passengerList = (Array.isArray(passengers) && passengers.length > 0)
      ? passengers.map((p) => ({
          first_name: p.first_name || p.firstName || 'N/A',
          last_name: p.last_name || p.lastName || 'N/A',
          passenger_type: p.passenger_type || p.type || 'ADT',
          passport_number: p.passport_number || p.passportNumber || 'N/A',
        }))
      : [];

    buildItineraryPdf({ order: createdOrder, passengers: passengerList, agency })
      .then((pdfBuffer) =>
        sendBookingConfirmation({ order: createdOrder, passengers: passengerList, agency, pdfBuffer, claimToken: createdOrder.claim_token })
      )
      .then((result) => {
        if (!result.sent) console.warn('[order] booking confirmation email not sent:', result.error);
        else console.log('[order] booking confirmation email sent:', result.messageId);
      })
      .catch((err) => console.error('[order] booking confirmation email error:', err.message));

    return res.status(201).json({
      order: { ...createdOrder, claim_token: undefined },
      claim_token: createdOrder.claim_token,
      agency: {
        id: agency.id,
        name: agency.name,
        domain: agency.domain
      }
    });
  } catch (err) {
    console.error('Widget order create error:', err);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: nodeEnv === 'development' ? err.message : 'Internal server error'
      }
    });
  }
});

module.exports = router;
