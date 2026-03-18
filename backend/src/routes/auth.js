'use strict';

const express = require('express');
const crypto = require('crypto');
const supabase = require('../lib/supabase');
const { resolveAuthContext } = require('../middleware/auth');
const { buildItineraryPdf } = require('../services/pdfService');
const { sendBookingConfirmation } = require('../services/emailService');

const router = express.Router();

// Helper: extract rich flight/passenger data from raw DRCT order response
function extractDrctFlightData(raw) {
  const buildFlight = (flight) => {
    if (!flight || !Array.isArray(flight.segments) || !flight.segments.length) return null;
    const segs = flight.segments;
    const first = segs[0];
    const last = segs[segs.length - 1];
    const depDate = first.departure_date || '';
    const depTime = first.departure_time || '';
    const arrDate = last.arrival_date || '';
    const arrTime = last.arrival_time || '';
    return {
      origin_code: first.departure_airport?.code || first.origin || '',
      origin_name: first.departure_airport?.name || '',
      destination_code: last.arrival_airport?.code || last.destination || '',
      destination_name: last.arrival_airport?.name || '',
      departure: depDate && depTime ? `${depDate} ${depTime}` : depDate || depTime || '',
      arrival: arrDate && arrTime ? `${arrDate} ${arrTime}` : arrDate || arrTime || '',
      airline_name: first.carrier?.airline_name || '',
      airline_code: first.carrier?.airline_code || '',
      flight_number: segs.map(s => s.flight_number).filter(Boolean).join(', '),
      stops: segs.length - 1,
    };
  };

  const passengers = (raw?.passengers || []).map(p => ({
    first_name: p.individual?.first_name || p.first_name || '',
    last_name: p.individual?.last_name || p.last_name || '',
    passenger_type: p.type || 'ADT',
    passport_number: p.document?.number || '',
  }));

  const outbound = buildFlight(raw?.flights?.[0]);
  const returnFlight = raw?.flights?.[1] ? buildFlight(raw.flights[1]) : null;

  return { passengers, outbound, returnFlight };
}

// GET /api/profile/me
router.get('/profile/me', async (req, res) => {
  const auth = await resolveAuthContext(req);
  if (auth.error) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: auth.error
      }
    });
  }

  return res.json({
    profile: auth.profile,
    user: {
      id: auth.user.id,
      email: auth.user.email || null
    }
  });
});

// POST /api/orders/prepare-claim
// Called by frontend after n8n creates an order.
// Generates claim_token (if not set), sends booking confirmation email with claim link.
// Secured by contact_email match — no JWT required.
router.post('/orders/prepare-claim', async (req, res) => {
  const { order_number, contact_email } = req.body || {};
  if (!order_number || !contact_email) {
    return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'order_number and contact_email are required' } });
  }

  const normalizedEmail = String(contact_email).trim().toLowerCase();

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id,order_number,contact_email,claim_token,claim_token_expires_at,user_id,agency_id,origin,destination,departure_time,arrival_time,airline_name,airline_code,flight_number,total_price,currency,payment_method,status')
    .eq('order_number', order_number)
    .maybeSingle();

  if (orderError || !order) {
    return res.status(404).json({ error: { code: 'ORDER_NOT_FOUND', message: 'Order not found' } });
  }
  if (order.contact_email !== normalizedEmail) {
    return res.status(403).json({ error: { code: 'EMAIL_MISMATCH', message: 'Email does not match order' } });
  }
  if (order.user_id) {
    return res.json({ already_claimed: true, order_number });
  }

  let claimToken = order.claim_token;
  if (!claimToken) {
    claimToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await supabase.from('orders').update({ claim_token: claimToken, claim_token_expires_at: expiresAt }).eq('id', order.id);
  }

  // Fetch agency for email branding
  const { data: agency } = await supabase.from('agencies').select('id,name,settings').eq('id', order.agency_id).maybeSingle();

  // Fetch passengers for email
  const { data: passengerRows } = await supabase.from('passengers').select('first_name,last_name,passenger_type,passport_number').eq('order_id', order.id);
  const passengers = Array.isArray(passengerRows) ? passengerRows : [];

  // Send confirmation email with claim link (non-blocking)
  buildItineraryPdf({ order, passengers, agency })
    .then((pdfBuffer) => sendBookingConfirmation({ order, passengers, agency, pdfBuffer, claimToken }))
    .then((result) => {
      if (!result.sent) console.warn('[prepare-claim] email not sent:', result.error);
      else console.log('[prepare-claim] confirmation email sent:', result.messageId);
    })
    .catch((err) => console.error('[prepare-claim] email error:', err.message));

  return res.json({ claim_token: claimToken, order_number });
});

// POST /api/internal/send-booking-email
// Called by n8n after order creation. Generates PDF itinerary and sends full booking confirmation.
// Secured by Authorization: Bearer INTERNAL_API_TOKEN header.
router.post('/internal/send-booking-email', async (req, res) => {
  const token = (req.headers['authorization'] || '').replace('Bearer ', '').trim();
  if (!token || token !== process.env.INTERNAL_API_TOKEN) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const { order_id } = req.body || {};
  if (!order_id) {
    return res.status(400).json({ error: 'order_id required' });
  }

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id,order_number,contact_email,contact_phone,claim_token,claim_token_expires_at,user_id,agency_id,origin,destination,departure_time,arrival_time,airline_name,airline_code,flight_number,total_price,currency,payment_method,status,raw_drct_response')
    .eq('id', order_id)
    .maybeSingle();

  if (orderError || !order) {
    return res.status(404).json({ error: 'order not found', detail: orderError?.message });
  }

  // Ensure claim token exists for anonymous bookers
  let claimToken = order.claim_token;
  if (!claimToken && !order.user_id) {
    claimToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await supabase.from('orders').update({ claim_token: claimToken, claim_token_expires_at: expiresAt }).eq('id', order.id);
  }

  const { data: agency } = await supabase
    .from('agencies')
    .select('id,name,settings')
    .eq('id', order.agency_id)
    .maybeSingle();

  // Extract rich data from raw DRCT response
  const { passengers: drctPassengers, outbound, returnFlight } = extractDrctFlightData(order.raw_drct_response || {});

  // Try passengers table first, fall back to DRCT response
  const { data: passengerRows } = await supabase
    .from('passengers')
    .select('first_name,last_name,passenger_type,passport_number')
    .eq('order_id', order.id);
  const passengers = (Array.isArray(passengerRows) && passengerRows.length > 0)
    ? passengerRows
    : drctPassengers;

  // Enrich order object with correct flight data from DRCT
  const enrichedOrder = {
    ...order,
    origin: outbound?.origin_code || order.origin,
    destination: outbound?.destination_code || order.destination,
    departure_time: outbound?.departure || order.departure_time,
    arrival_time: outbound?.arrival || order.arrival_time,
    airline_name: outbound?.airline_name || order.airline_name,
    airline_code: outbound?.airline_code || order.airline_code,
    flight_number: outbound?.flight_number || order.flight_number,
  };

  try {
    const { buildItineraryPdf: buildPdf } = require('../services/pdfService');
    const pdfBuffer = await buildPdf({ order: enrichedOrder, passengers, agency, outbound, returnFlight });
    const result = await sendBookingConfirmation({ order: enrichedOrder, passengers, agency, pdfBuffer, claimToken, outbound, returnFlight });
    if (!result.sent) {
      console.warn('[internal/send-booking-email] not sent:', result.error);
      return res.status(500).json({ sent: false, error: result.error });
    }
    console.log('[internal/send-booking-email] sent:', result.messageId);
    return res.json({ sent: true, messageId: result.messageId });
  } catch (err) {
    console.error('[internal/send-booking-email] error:', err.message);
    return res.status(500).json({ sent: false, error: err.message });
  }
});

// POST /api/auth/claim-order
// Links an order to the authenticated user via claim_token.
router.post('/auth/claim-order', async (req, res) => {
  const auth = await resolveAuthContext(req);
  if (auth.error) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: auth.error } });
  }

  const { claim_token } = req.body || {};
  if (!claim_token) {
    return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'claim_token is required' } });
  }

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id,user_id,claim_token_expires_at,order_number')
    .eq('claim_token', claim_token)
    .maybeSingle();

  if (orderError || !order) {
    return res.status(404).json({ error: { code: 'INVALID_TOKEN', message: 'Invalid or expired claim token' } });
  }
  if (order.user_id) {
    return res.json({ success: true, already_claimed: true, order_number: order.order_number });
  }
  if (order.claim_token_expires_at && new Date(order.claim_token_expires_at) < new Date()) {
    return res.status(410).json({ error: { code: 'TOKEN_EXPIRED', message: 'Claim token has expired' } });
  }

  const { error: updateError } = await supabase
    .from('orders')
    .update({ user_id: auth.user.id, claimed_at: new Date().toISOString(), claim_token: null, claim_token_expires_at: null })
    .eq('id', order.id);

  if (updateError) {
    return res.status(500).json({ error: { code: 'CLAIM_FAILED', message: updateError.message } });
  }

  return res.json({ success: true, order_number: order.order_number });
});

module.exports = router;
