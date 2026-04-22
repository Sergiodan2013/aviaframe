'use strict';

const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { config, VALID_PAYMENT_METHODS, ORDERS_LIST_COLUMNS } = require('../config');
const {
  normalizeHost,
  getRequestOriginHost,
  isWidgetOriginAllowed,
  issueWidgetToken,
  parseWidgetToken,
  generateOrderNumber
} = require('../utils/helpers');

router.post('/api/widget/session', async (req, res) => {
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
    if (!isWidgetOriginAllowed(agency, requestHost)) {
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
    const paymentMethod = VALID_PAYMENT_METHODS.includes(paymentMethodFromBody) && allowedMethods.includes(paymentMethodFromBody)
      ? paymentMethodFromBody
      : allowedMethods[0];

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
      .select(ORDERS_LIST_COLUMNS)
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
