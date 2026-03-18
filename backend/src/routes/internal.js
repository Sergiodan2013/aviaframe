'use strict';

const express = require('express');
const supabase = require('../lib/supabase');
const { sendBookingCancelled, sendBookingConfirmed } = require('../services/emailService');

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

// POST /api/internal/send-email — called by n8n for queued email events
// Secured by Authorization: Bearer INTERNAL_API_TOKEN
router.post('/send-email', async (req, res) => {
  const token = (req.headers['authorization'] || '').replace('Bearer ', '').trim();
  if (!token || token !== process.env.INTERNAL_API_TOKEN) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid internal token' } });
  }

  const { event_type, order_id, agency_id } = req.body;
  if (!event_type) {
    return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'event_type is required' } });
  }

  try {
    if (event_type === 'booking_cancelled' && order_id) {
      const [{ data: order }, { data: agency }] = await Promise.all([
        supabase.from('orders').select(ORDERS_LIST_COLUMNS).eq('id', order_id).single(),
        supabase.from('agencies').select('id,name,settings').eq('id', agency_id).single()
      ]);
      const result = await sendBookingCancelled({ order, agency: agency || null });
      return res.json(result);
    }

    if (event_type === 'booking_confirmed' && order_id) {
      const [{ data: order }, { data: agency }] = await Promise.all([
        supabase.from('orders').select(ORDERS_LIST_COLUMNS).eq('id', order_id).single(),
        supabase.from('agencies').select('id,name,settings').eq('id', agency_id).single()
      ]);
      const result = await sendBookingConfirmed({ order, agency: agency || null });
      return res.json(result);
    }

    return res.status(400).json({ error: { code: 'UNKNOWN_EVENT', message: `Unsupported event_type: ${event_type}` } });
  } catch (err) {
    console.error('[internal/send-email] error:', err.message);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

module.exports = router;
