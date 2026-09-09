'use strict';

const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { agencyApiKeyAuth } = require('../middleware/agencyApiKeyAuth');

router.use(agencyApiKeyAuth);

const VALID_STATUSES = new Set(['pending', 'confirmed', 'ticketed', 'cancelled', 'refunded', 'failed']);
const ORDER_SELECT = `
  id, order_number, status, origin, destination,
  departure_time, arrival_time, airline_code, airline_name, flight_number,
  base_price, taxes, baggage_price, total_price, currency,
  contact_email, created_at, confirmed_at, cancelled_at, booked_at,
  passengers (passenger_type),
  ticket_issuances (ticket_number, pnr, issued_at)
`;

function parseDateRange(from, to) {
  const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const toDate = to ? new Date(to) : new Date();
  if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) return null;
  // Clamp to end of day for `to` if only a date string (no time) was given
  if (to && !to.includes('T')) toDate.setHours(23, 59, 59, 999);
  return { from: fromDate.toISOString(), to: toDate.toISOString() };
}

function formatOrder(order) {
  const passengers = (order.passengers || []).reduce((acc, p) => {
    const t = p.passenger_type || 'ADT';
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});
  const issuance = (order.ticket_issuances || [])[0] || null;
  return {
    order_id: order.id,
    order_number: order.order_number,
    status: order.status,
    origin: order.origin,
    destination: order.destination,
    departure_time: order.departure_time || null,
    arrival_time: order.arrival_time || null,
    airline_code: order.airline_code || null,
    airline_name: order.airline_name || null,
    flight_number: order.flight_number || null,
    passengers,
    base_price: order.base_price,
    taxes: order.taxes,
    baggage_price: order.baggage_price,
    total_price: order.total_price,
    currency: order.currency,
    contact_email: order.contact_email,
    ticket_number: issuance?.ticket_number || null,
    pnr: issuance?.pnr || null,
    issued_at: issuance?.issued_at || null,
    created_at: order.created_at,
    confirmed_at: order.confirmed_at || null,
    cancelled_at: order.cancelled_at || null,
  };
}

function appendRevenue(revenueByCurrency, currency, amount) {
  const normalizedCurrency = String(currency || 'USD').trim().toUpperCase();
  const normalizedAmount = Math.round((Number(amount) || 0) * 100) / 100;
  revenueByCurrency[normalizedCurrency] = Math.round(((revenueByCurrency[normalizedCurrency] || 0) + normalizedAmount) * 100) / 100;
}

function finalizeCurrencySummary(revenueByCurrency = {}) {
  const entries = Object.entries(revenueByCurrency).filter(([, amount]) => Number(amount) > 0);
  if (entries.length === 1) {
    return {
      currency: entries[0][0],
      total_revenue: entries[0][1],
      revenue_by_currency: { [entries[0][0]]: entries[0][1] }
    };
  }
  return {
    currency: entries.length > 1 ? 'MIXED' : null,
    total_revenue: entries.length === 0 ? 0 : null,
    revenue_by_currency: Object.fromEntries(entries)
  };
}

// GET /api/agency/reports/bookings
router.get('/bookings', async (req, res) => {
  const agencyId = req.reportingAgencyId;
  const { from, to, status, limit: lStr, page: pStr } = req.query;

  const limit = Math.min(Math.max(parseInt(lStr) || 50, 1), 200);
  const page = Math.max(parseInt(pStr) || 1, 1);
  const offset = (page - 1) * limit;

  const range = parseDateRange(from, to);
  if (!range) {
    return res.status(400).json({ error: { code: 'INVALID_PARAMS', message: 'Invalid date format. Use YYYY-MM-DD or ISO 8601.' } });
  }

  if (status && !VALID_STATUSES.has(status)) {
    return res.status(400).json({ error: { code: 'INVALID_PARAMS', message: `Invalid status. Must be one of: ${[...VALID_STATUSES].join(', ')}` } });
  }

  let query = supabase
    .from('orders')
    .select(ORDER_SELECT, { count: 'exact' })
    .eq('agency_id', agencyId)
    .gte('created_at', range.from)
    .lte('created_at', range.to);

  if (status) query = query.eq('status', status);

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) {
    return res.status(500).json({ error: { code: 'DB_ERROR', message: 'Failed to fetch bookings' } });
  }

  return res.json({
    data: (data || []).map(formatOrder),
    pagination: { total: count || 0, page, limit, pages: Math.ceil((count || 0) / limit) }
  });
});

// GET /api/agency/reports/bookings/:orderId
router.get('/bookings/:orderId', async (req, res) => {
  const agencyId = req.reportingAgencyId;
  const { orderId } = req.params;

  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      id, order_number, status, origin, destination,
      departure_time, arrival_time, airline_code, airline_name, flight_number,
      base_price, taxes, baggage_price, total_price, currency,
      contact_email, contact_phone, created_at, confirmed_at, cancelled_at, booked_at,
      passengers (id, passenger_type, first_name, last_name, date_of_birth, baggage_allowance),
      ticket_issuances (ticket_number, pnr, issued_at, status, email_status)
    `)
    .eq('id', orderId)
    .eq('agency_id', agencyId)
    .maybeSingle();

  if (error) {
    return res.status(500).json({ error: { code: 'DB_ERROR', message: 'Failed to fetch order' } });
  }
  if (!order) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Order not found' } });
  }

  return res.json({
    data: {
      ...formatOrder(order),
      contact_phone: order.contact_phone || null,
      booked_at: order.booked_at || null,
      passengers: Array.isArray(order.passengers)
        ? order.passengers.map((passenger) => ({
            id: passenger.id,
            passenger_type: passenger.passenger_type || null,
            first_name: passenger.first_name || null,
            last_name: passenger.last_name || null,
            date_of_birth: passenger.date_of_birth || null,
            baggage_allowance: passenger.baggage_allowance || null
          }))
        : [],
      ticket_issuances: Array.isArray(order.ticket_issuances)
        ? order.ticket_issuances.map((issuance) => ({
            ticket_number: issuance.ticket_number || null,
            pnr: issuance.pnr || null,
            issued_at: issuance.issued_at || null,
            status: issuance.status || null,
            email_status: issuance.email_status || null
          }))
        : []
    }
  });
});

// GET /api/agency/reports/revenue
router.get('/revenue', async (req, res) => {
  const agencyId = req.reportingAgencyId;
  const { from, to, group_by } = req.query;

  const range = parseDateRange(from, to);
  if (!range) {
    return res.status(400).json({ error: { code: 'INVALID_PARAMS', message: 'Invalid date format' } });
  }

  const { data, error } = await supabase
    .from('orders')
    .select('status, total_price, currency, created_at')
    .eq('agency_id', agencyId)
    .gte('created_at', range.from)
    .lte('created_at', range.to)
    .not('status', 'eq', 'failed');

  if (error) {
    return res.status(500).json({ error: { code: 'DB_ERROR', message: 'Failed to fetch revenue data' } });
  }

  const byDay = group_by === 'day';
  const grouped = {};

  for (const o of data || []) {
    const d = new Date(o.created_at);
    const key = byDay ? d.toISOString().slice(0, 10) : d.toISOString().slice(0, 7);

    if (!grouped[key]) {
      grouped[key] = { period: key, bookings_count: 0, cancelled_count: 0, revenue_by_currency: {} };
    }
    grouped[key].bookings_count += 1;
    if (o.status === 'cancelled' || o.status === 'refunded') {
      grouped[key].cancelled_count += 1;
    } else {
      appendRevenue(grouped[key].revenue_by_currency, o.currency, o.total_price);
    }
  }

  return res.json({
    data: Object.values(grouped)
      .sort((a, b) => a.period.localeCompare(b.period))
      .map((entry) => ({
        ...entry,
        ...finalizeCurrencySummary(entry.revenue_by_currency)
      })),
    group_by: byDay ? 'day' : 'month'
  });
});

// GET /api/agency/reports/summary
router.get('/summary', async (req, res) => {
  const agencyId = req.reportingAgencyId;
  const { from, to } = req.query;

  const range = parseDateRange(from, to);
  if (!range) {
    return res.status(400).json({ error: { code: 'INVALID_PARAMS', message: 'Invalid date format' } });
  }

  const { data, error } = await supabase
    .from('orders')
    .select('status, total_price, origin, destination, currency')
    .eq('agency_id', agencyId)
    .gte('created_at', range.from)
    .lte('created_at', range.to);

  if (error) {
    return res.status(500).json({ error: { code: 'DB_ERROR', message: 'Failed to fetch summary' } });
  }

  const orders = data || [];
  const routeMap = {};
  const totalRevenueByCurrency = {};
  let total_bookings = 0;
  let ticketed_count = 0;
  let cancelled_count = 0;

  for (const o of orders) {
    total_bookings += 1;
    if (o.status === 'ticketed') {
      ticketed_count += 1;
      appendRevenue(totalRevenueByCurrency, o.currency, o.total_price);
    }
    if (o.status === 'confirmed') {
      appendRevenue(totalRevenueByCurrency, o.currency, o.total_price);
    }
    if (o.status === 'cancelled' || o.status === 'refunded') cancelled_count += 1;
    if (o.origin && o.destination) {
      const k = `${o.origin}-${o.destination}`;
      routeMap[k] = (routeMap[k] || 0) + 1;
    }
  }

  const top_routes = Object.entries(routeMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([route, count]) => {
      const [origin, destination] = route.split('-');
      return { origin, destination, count };
    });

  const currencySummary = finalizeCurrencySummary(totalRevenueByCurrency);

  return res.json({
    data: {
      period: { from: range.from, to: range.to },
      total_bookings,
      ticketed_count,
      cancelled_count,
      total_revenue: currencySummary.total_revenue,
      currency: currencySummary.currency,
      revenue_by_currency: currencySummary.revenue_by_currency,
      top_routes
    }
  });
});

// GET /api/agency/reports/export?format=csv&from=...&to=...
router.get('/export', async (req, res) => {
  const agencyId = req.reportingAgencyId;
  const { from, to, status } = req.query;

  const range = parseDateRange(from, to);
  if (!range) {
    return res.status(400).json({ error: { code: 'INVALID_PARAMS', message: 'Invalid date format' } });
  }

  if (status && !VALID_STATUSES.has(status)) {
    return res.status(400).json({ error: { code: 'INVALID_PARAMS', message: `Invalid status` } });
  }

  let query = supabase
    .from('orders')
    .select(ORDER_SELECT)
    .eq('agency_id', agencyId)
    .gte('created_at', range.from)
    .lte('created_at', range.to)
    .order('created_at', { ascending: false })
    .limit(10000);

  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) {
    return res.status(500).json({ error: { code: 'DB_ERROR', message: 'Failed to export data' } });
  }

  const rows = (data || []).map(formatOrder);
  const headers = [
    'order_number', 'status', 'origin', 'destination', 'departure_time',
    'airline_name', 'flight_number', 'pax_ADT', 'pax_CHD', 'pax_INF',
    'base_price', 'taxes', 'baggage_price', 'total_price', 'currency',
    'ticket_number', 'pnr', 'issued_at', 'created_at'
  ];

  const escape = (v) => (v == null ? '' : String(v).includes(',') || String(v).includes('"') ? `"${String(v).replace(/"/g, '""')}"` : String(v));

  const csvLines = [headers.join(',')];
  for (const r of rows) {
    csvLines.push([
      escape(r.order_number), escape(r.status),
      escape(r.origin), escape(r.destination),
      escape(r.departure_time), escape(r.airline_name), escape(r.flight_number),
      r.passengers?.ADT || 0, r.passengers?.CHD || 0, r.passengers?.INF || 0,
      r.base_price, r.taxes, r.baggage_price, r.total_price, escape(r.currency),
      escape(r.ticket_number), escape(r.pnr), escape(r.issued_at), escape(r.created_at)
    ].join(','));
  }

  const filename = `aviaframe-bookings-${range.from.slice(0, 10)}-to-${range.to.slice(0, 10)}.csv`;
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  return res.send('﻿' + csvLines.join('\n'));
});

module.exports = router;
