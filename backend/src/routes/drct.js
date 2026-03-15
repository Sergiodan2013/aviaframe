'use strict';

const express = require('express');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const supabase = require('../lib/supabase');
const drctService = require('../services/drctService');
const { applyPricingToOffers, calculatePricing } = require('../services/pricingService');

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
  'cancelled_at',
  'metadata'
].join(',');

const searchLimiter = rateLimit({
  windowMs: 60_000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many search requests. Please wait a minute.' } },
});

const orderLimiter = rateLimit({
  windowMs: 60_000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many order requests. Please wait a minute.' } },
});

function generateOrderNumber() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

// POST /webhook/drct/search
router.post('/webhook/drct/search', searchLimiter, express.json({ limit: '2mb' }), async (req, res) => {
  try {
    const body = req.body || {};
    const result = await drctService.search(body);

    // Apply agency pricing if agency_id provided
    if (body.agency_id && Array.isArray(result.offers)) {
      const { data: agency } = await supabase
        .from('agencies')
        .select('id,commission_rate,settings')
        .eq('id', body.agency_id)
        .maybeSingle();
      result.offers = applyPricingToOffers(result.offers, agency);
    }

    return res.json(result);
  } catch (err) {
    console.error('[drct/search]', err.message);
    return res.status(err.status || 502).json({ error: { code: 'DRCT_ERROR', message: err.message } });
  }
});

// POST /webhook/drct/price
router.post('/webhook/drct/price', express.json({ limit: '2mb' }), async (req, res) => {
  const { offer_id, passengers } = req.body || {};
  if (!offer_id) return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'offer_id is required' } });
  try {
    const result = await drctService.priceOffer(offer_id, passengers || []);
    return res.json(result);
  } catch (err) {
    console.error('[drct/price]', err.message);
    return res.status(err.status || 502).json({ error: { code: 'DRCT_ERROR', message: err.message } });
  }
});

// POST /webhook/drct-v2/search — prod API, enriched response (search only, no booking)
router.post('/webhook/drct-v2/search', searchLimiter, express.json({ limit: '2mb' }), async (req, res) => {
  try {
    const result = await drctService.search(req.body || {}, 'prod');
    return res.json(result);
  } catch (err) {
    console.error('[drct-v2/search]', err.message);
    return res.status(err.status || 502).json({ error: { code: 'DRCT_ERROR', message: err.message } });
  }
});

// ─── Shared order-create handler (sandbox by default, pass envName='prod' for prod) ─
async function orderCreateHandler(req, res, envName) {
  try {
    const body = req.body || {};

    // ─── 1. Normalize input (three formats: portal, widget-new, widget-legacy) ─
    let normalized;
    if (body.offer && Array.isArray(body.passengers) && body.passengers.length) {
      // Widget new format: {offer, passengers[], contacts}
      const offerId = (body.offer.offer_id || body.offer.id || body.offer_id || '').trim();
      if (!offerId) return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'offer.offer_id is required' } });
      if (!body.contacts?.email || !body.contacts?.phone) return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'contacts.email and contacts.phone are required' } });
      normalized = {
        offer_id: offerId,
        passengers: body.passengers.map((p, i) => {
          const g = String(p.gender || 'male').toLowerCase();
          return {
            type: p.type || 'ADT',
            first_name: p.first_name || p.firstName || 'Guest',
            last_name: p.last_name || p.lastName || `Passenger${i + 1}`,
            date_of_birth: p.date_of_birth || p.dateOfBirth || '1990-01-01',
            gender: (g === 'female' || g === 'f') ? 'F' : 'M',
            email: p.email || body.contacts.email,
            phone: p.phone || body.contacts.phone,
            document: {
              type: p.document?.type || 'REGULAR_PASSPORT',
              number: p.document?.number || p.passportNumber || '',
              expiry_date: p.document?.expiry_date || p.passportExpiry || '2035-12-31',
              issuing_country: p.document?.issuing_country || p.nationality || 'AE',
              citizenship: p.document?.citizenship || p.document?.issuing_country || p.nationality || 'AE',
              country_of_issue: p.document?.country_of_issue || p.document?.issuing_country || p.nationality || 'AE',
            },
            payment_method: p.payment_method || 'bank_transfer',
          };
        }),
        contacts: body.contacts,
        user_id: body.user_id || null,
        agency_id: body.agency_id || null,
      };
    } else if (body.offer && body.passenger) {
      // Widget legacy format: {offer, passenger}
      const p = body.passenger;
      const offerId = (body.offer.offer_id || body.offer.id || body.offer_id || '').trim();
      if (!offerId || !p.email || !p.phone) return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'offer.offer_id, passenger.email and passenger.phone are required' } });
      normalized = {
        offer_id: offerId,
        passengers: [{
          type: 'ADT',
          first_name: p.firstName || p.first_name || 'Guest',
          last_name: p.lastName || p.last_name || 'Passenger',
          date_of_birth: p.dateOfBirth || p.date_of_birth || '1990-01-01',
          gender: String(p.gender || 'male').toLowerCase() === 'female' ? 'F' : 'M',
          email: p.email,
          phone: p.phone,
          document: {
            type: 'REGULAR_PASSPORT',
            number: p.passportNumber || p.passport_number || '',
            expiry_date: p.passportExpiry || p.passport_expiry || '2035-12-31',
            issuing_country: p.nationality || 'AE',
            citizenship: p.nationality || 'AE',
            country_of_issue: p.nationality || 'AE',
          },
          payment_method: p.paymentMethod || p.payment_method || 'bank_transfer',
        }],
        contacts: { email: p.email, phone: p.phone },
        user_id: body.user_id || null,
        agency_id: body.agency_id || null,
      };
    } else {
      // Portal format: {offer_id, passengers[], contacts}
      const missing = ['offer_id', 'passengers', 'contacts'].filter(f => !body[f]);
      if (missing.length) return res.status(400).json({ error: { code: 'INVALID_INPUT', message: `Missing required fields: ${missing.join(', ')}` } });
      if (!Array.isArray(body.passengers) || !body.passengers.length) return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'passengers must be a non-empty array' } });
      if (!body.contacts.email || !body.contacts.phone) return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'contacts.email and contacts.phone are required' } });
      normalized = {
        offer_id: body.offer_id,
        passengers: body.passengers.map((p, i) => {
          const g = String(p.gender || '').toUpperCase();
          return {
            type: p.type || 'ADT',
            first_name: p.first_name || p.firstName || 'Guest',
            last_name: p.last_name || p.lastName || `Passenger${i + 1}`,
            date_of_birth: p.date_of_birth || p.dateOfBirth || '1990-01-01',
            gender: (g === 'M' || g === 'MALE') ? 'M' : 'F',
            email: p.email || body.contacts.email,
            phone: p.phone || body.contacts.phone,
            document: {
              type: p.document?.type || 'REGULAR_PASSPORT',
              number: p.document?.number || '',
              expiry_date: p.document?.expiry_date || '2035-12-31',
              issuing_country: p.document?.issuing_country || 'AE',
              citizenship: p.document?.citizenship || p.document?.issuing_country || 'AE',
              country_of_issue: p.document?.country_of_issue || p.document?.issuing_country || 'AE',
            },
            payment_method: p.payment_method || 'bank_transfer',
          };
        }),
        contacts: body.contacts,
        user_id: body.user_id || null,
        agency_id: body.agency_id || null,
      };
    }

    // ─── 2. Deduplication: reject if same offer+email booked in last 2 minutes ─
    const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id,order_number,drct_order_id,status')
      .eq('offer_id', normalized.offer_id)
      .eq('contact_email', normalized.contacts.email)
      .gte('created_at', twoMinAgo)
      .neq('status', 'failed')
      .maybeSingle();
    if (existingOrder) {
      console.log(`[drct/order/create] duplicate suppressed: ${existingOrder.order_number}`);
      return res.json({
        id: existingOrder.id,
        order_id: existingOrder.id,
        order_number: existingOrder.order_number,
        drct_order_id: existingOrder.drct_order_id,
        booking_reference: existingOrder.order_number,
        status: existingOrder.status,
        duplicate: true,
      });
    }

    // ─── 3. DRCT Price ────────────────────────────────────────────────────────
    let pricedOffer;
    try {
      pricedOffer = await drctService.priceOffer(
        normalized.offer_id,
        normalized.passengers.map(p => ({ type: p.type || 'ADT' })),
        envName
      );
    } catch (err) {
      console.error('[drct/order/create] price failed:', err.message);
      return res.status(err.status || 502).json({ error: { code: 'DRCT_PRICE_FAILED', message: err.message } });
    }

    // ─── 3. Build DRCT passenger list from priced offer slots ─────────────────
    const priced = pricedOffer.passengers || [];
    const contacts = normalized.contacts;
    const today = new Date();
    const used = {};

    const drctPassengers = priced.map((pp, idx) => {
      const t = String(pp.type || 'ADT').toUpperCase();
      if (!used[t]) used[t] = 0;
      const src = normalized.passengers.filter(p => String(p.type || 'ADT').toUpperCase() === t)[used[t]]
        || normalized.passengers[idx]
        || normalized.passengers[0]
        || {};
      used[t]++;
      const doc = src.document || {};
      const country = doc.issuing_country || doc.country_of_issue || 'AE';
      let dob = src.date_of_birth;
      if (!dob || String(src.type || 'ADT').toUpperCase() !== t) {
        if (t === 'INF') { const d = new Date(today); d.setMonth(d.getMonth() - 10); dob = d.toISOString().slice(0, 10); }
        else if (t === 'CHD') { const d = new Date(today); d.setFullYear(d.getFullYear() - 5); dob = d.toISOString().slice(0, 10); }
        else { dob = dob || '1990-01-01'; }
      }
      const g = String(src.gender || '').toUpperCase();
      const gender = (g === 'M' || g === 'MALE') ? 'M' : 'F';
      return {
        id: pp.id,
        type: t,
        individual: { title: gender === 'F' ? 'Ms' : 'Mr', first_name: src.first_name || 'Test', last_name: src.last_name || `Passenger${idx + 1}`, gender, date_of_birth: dob },
        phone: contacts.phone || src.phone || '',
        email: contacts.email || src.email || '',
        document: {
          type: 'REGULAR_PASSPORT',
          number: doc.number || `P${Date.now()}${idx}`.slice(0, 12),
          gender,
          expiration_date: doc.expiry_date || '2035-12-31',
          issuing_country: country,
          citizenship: country,
          country_of_issue: country,
        },
      };
    });

    // ─── 4. DRCT Create Order ─────────────────────────────────────────────────
    let drctOrder;
    try {
      const orderPayload = { offer_id: pricedOffer.id, passengers: drctPassengers };
      console.log('[drct/order/create] payload:', JSON.stringify(orderPayload));
      drctOrder = await drctService.createOrder(orderPayload, envName);
    } catch (err) {
      console.error('[drct/order/create] create failed:', err.message, JSON.stringify(err.data || {}));
      return res.status(err.status || 502).json({ error: { code: 'DRCT_ORDER_FAILED', message: err.message } });
    }

    // ─── 5. Save order to Supabase ────────────────────────────────────────────
    const flight0 = drctOrder.flights?.[0] || {};
    const segs = flight0.segments || [];
    const firstSeg = segs[0] || {};
    const lastSeg = segs[segs.length - 1] || firstSeg;
    const paymentMethod = normalized.passengers[0]?.payment_method || 'bank_transfer';
    const claimToken = crypto.randomUUID();
    const orderNumber = drctOrder.locator || generateOrderNumber();
    const totalPrice = Number(drctOrder.price?.amount || drctOrder.price?.total || 0);
    const currency = drctOrder.price?.currency || 'USD';

    // Extract cancelable from offer conditions (sent by portal/widget) or priced fare
    const offerCond = (body.offer || body).conditions || {};
    const pricedFare0 = (pricedOffer?.fares || [])[0] || {};
    const cancelable = offerCond.cancelable ?? pricedFare0?.cancellation?.cancelable ?? null;

    // ─── Pricing breakdown ────────────────────────────────────────────────────
    let agency = null;
    if (normalized.agency_id) {
      const { data } = await supabase
        .from('agencies').select('id,commission_rate,settings').eq('id', normalized.agency_id).maybeSingle();
      agency = data;
    }
    const pricing = calculatePricing(totalPrice, agency);

    const orderInsert = {
      drct_order_id: drctOrder.id,
      order_number: orderNumber,
      offer_id: normalized.offer_id,
      user_id: normalized.user_id || null,
      agency_id: normalized.agency_id || null,
      origin: firstSeg.departure_airport?.name || firstSeg.departure_airport?.code || body.offer?.origin || '',
      destination: lastSeg.arrival_airport?.name || lastSeg.arrival_airport?.code || body.offer?.destination || '',
      departure_time: firstSeg.departure_date ? `${firstSeg.departure_date}T${firstSeg.departure_time || '00:00'}:00` : (body.offer?.departure_time || null),
      arrival_time: lastSeg.arrival_time || body.offer?.arrival_time || null,
      airline_name: firstSeg.carrier?.airline_name || body.offer?.airline_name || '',
      airline_code: firstSeg.carrier?.airline_code || body.offer?.airline_code || '',
      flight_number: firstSeg.flight_number || body.offer?.flight_number || '',
      base_price: totalPrice,
      taxes: Number(drctOrder.price_details?.[0]?.taxes?.amount || 0),
      total_price: totalPrice,
      currency,
      contact_email: contacts.email,
      contact_phone: contacts.phone,
      status: 'pending',
      payment_method: paymentMethod,
      payment_status: 'pending',
      claim_token: claimToken,
      claim_token_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      raw_drct_response: drctOrder,
      metadata: {
        cancelable,
        cancel_fee: offerCond.cancel_fee ?? pricedFare0?.cancellation?.fee_applies ?? null,
        drct_env: envName || null,
        fare_basis_code: offerCond.fare_basis_code || pricedFare0?.fare_basis_code || null,
        price_class_name: offerCond.price_class_name || pricedFare0?.price_class_name || null,
        pricing: {
          drct_amount:     pricing.drct_amount,
          agency_markup:   pricing.agency_markup,
          acquiring_fee:   pricing.acquiring_fee,
          displayed_price: pricing.displayed_price,
          acquiring_rate:  pricing.acquiring_rate,
        },
      },
    };

    const { data: savedOrder, error: orderErr } = await supabase
      .from('orders').insert(orderInsert).select(ORDERS_LIST_COLUMNS).single();

    if (orderErr) {
      console.error('[drct/order/create] supabase insert failed:', orderErr.message);
      return res.status(500).json({ error: { code: 'ORDER_SAVE_FAILED', message: orderErr.message } });
    }

    // ─── 6. Save passengers to Supabase ──────────────────────────────────────
    const passengerRows = normalized.passengers.map(p => ({
      order_id: savedOrder.id,
      first_name: p.first_name,
      last_name: p.last_name,
      date_of_birth: p.date_of_birth || null,
      passport_number: p.document?.number || 'UNKNOWN',
      passport_expiry: p.document?.expiry_date || '2035-12-31',
      passport_issuing_country: p.document?.issuing_country || 'AE',
      nationality: p.document?.citizenship || p.document?.issuing_country || 'AE',
      gender: (p.gender === 'F' || p.gender === 'female') ? 'female' : 'male',
      passenger_type: p.type || 'ADT',
    }));
    if (passengerRows.length) {
      const { error: paxErr } = await supabase.from('passengers').insert(passengerRows);
      if (paxErr) console.warn('[drct/order/create] passengers save failed:', paxErr.message);
    }

    // ─── 6b. Write booking analytics (non-blocking, fire-and-forget) ─────────
    setImmediate(async () => {
      try {
        const offer = body.offer || {};
        const pd    = (drctOrder.price_details || pricedOffer?.price_details || [])[0] || {};
        const fare  = (drctOrder.fares         || pricedOffer?.fares         || [])[0] || {};
        const cond  = offer.conditions || {};
        const analyticsRow = {
          order_id:          savedOrder.id,
          agency_id:         savedOrder.agency_id || null,
          drct_env:          envName || process.env.DRCT_ENV || 'sandbox',
          // Flight
          origin:            savedOrder.origin || null,
          destination:       savedOrder.destination || null,
          departure_date:    savedOrder.departure_time ? savedOrder.departure_time.slice(0, 10) : null,
          airline_code:      savedOrder.airline_code || null,
          airline_name:      savedOrder.airline_name || null,
          flight_number:     savedOrder.flight_number || null,
          aircraft:          offer.aircraft || null,
          cabin_class:       offer.cabin_class || null,
          // Fare
          drct_offer_id:     savedOrder.offer_id || null,
          fare_basis_code:   offer.fare_basis_code || fare.fare_basis_code || null,
          price_class_name:  offer.price_class_name || fare.price_class_name || null,
          class_of_service:  offer.class_of_service || fare.class_of_service || null,
          channel:           offer.channel || null,
          content_type:      offer.content_type || null,
          // Pricing
          total_amount:      savedOrder.total_price || 0,
          currency:          savedOrder.currency || null,
          fare_amount:       pd.fare?.amount   ?? Number(drctOrder.price_details?.[0]?.fare?.amount   || 0),
          taxes_amount:      pd.taxes?.amount  ?? Number(drctOrder.price_details?.[0]?.taxes?.amount  || 0),
          tax_breakdown:     pd.taxes?.breakdown || drctOrder.price_details?.[0]?.taxes?.breakdown || null,
          price_details:     drctOrder.price_details || pricedOffer?.price_details || null,
          // Conditions
          changeable:        cond.changeable ?? null,
          change_fee_applies: cond.change_fee ?? null,
          cancelable:        cond.cancelable ?? null,
          cancel_fee_applies: cond.cancel_fee ?? null,
          // Baggage
          baggage:           offer.baggage || null,
          // Passengers
          pax_adt: normalized.passengers.filter(p => p.type === 'ADT').length,
          pax_chd: normalized.passengers.filter(p => p.type === 'CHD').length,
          pax_inf: normalized.passengers.filter(p => p.type === 'INF').length,
          // Offer metadata
          offer_expire_at:   offer.expire_at || null,
        };
        const { error: analyticsErr } = await supabase.from('booking_analytics').insert(analyticsRow);
        if (analyticsErr) console.warn('[analytics] insert failed:', analyticsErr.message);
        else console.log(`[analytics] recorded for order ${savedOrder.id}`);
      } catch (e) {
        console.warn('[analytics] error:', e.message);
      }
    });

    // ─── 7. Send booking email (non-blocking) ─────────────────────────────────
    const { sendBookingConfirmation } = require('../services/emailService');
    supabase.from('agencies').select('id,name,settings').eq('id', savedOrder.agency_id).maybeSingle()
      .then(({ data: agency }) =>
        sendBookingConfirmation({ order: savedOrder, passengers: passengerRows, agency: agency || null, claimToken })
      )
      .then(r => { if (!r?.sent) console.warn('[drct/order/create] email not sent:', r?.error); })
      .catch(e => console.error('[drct/order/create] email error:', e.message));

    // ─── 8. Return response ───────────────────────────────────────────────────
    const env = envName || 'sandbox';
    console.log(`[drct/order/create] success: order ${orderNumber} (${savedOrder.id}) env=${env}`);
    return res.json({
      id: savedOrder.id,
      order_id: savedOrder.id,
      order_number: orderNumber,
      drct_order_id: drctOrder.id,
      booking_reference: drctOrder.locator || orderNumber,
      status: 'pending',
    });
  } catch (err) {
    console.error('[drct/order/create] unexpected error:', err.message);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
}

// POST /webhook/drct/order/create — sandbox
router.post('/webhook/drct/order/create', orderLimiter, express.json({ limit: '2mb' }), (req, res) => orderCreateHandler(req, res, null));

// POST /webhook/drct-v2/order/create — prod API
router.post('/webhook/drct-v2/order/create', orderLimiter, express.json({ limit: '2mb' }), (req, res) => orderCreateHandler(req, res, 'prod'));

// POST /webhook/drct/order/issue
router.post('/webhook/drct/order/issue', express.json({ limit: '1mb' }), async (req, res) => {
  const { order_id } = req.body || {};
  if (!order_id) return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'order_id is required' } });
  try {
    const result = await drctService.issueOrder(order_id);
    return res.json(result);
  } catch (err) {
    console.error('[drct/order/issue]', err.message);
    return res.status(err.status || 502).json({ error: { code: 'DRCT_ERROR', message: err.message } });
  }
});

module.exports = router;
module.exports.searchLimiter = searchLimiter;
