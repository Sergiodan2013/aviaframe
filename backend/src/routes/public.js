'use strict';

const express = require('express');
const rateLimit = require('express-rate-limit');
const supabase = require('../lib/supabase');
const drctService = require('../services/drctService');

const router = express.Router();

const searchLimiter = rateLimit({
  windowMs: 60_000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many search requests. Please wait a minute.' } },
});

// POST /public/search
router.post('/search', searchLimiter, async (req, res) => {
  const startTime = Date.now();
  const nodeEnv = req.app.get('nodeEnv');

  // Extract search parameters
  const {
    origin,
    destination,
    depart_date,
    return_date,
    adults = 1,
    children = 0,
    infants = 0,
    cabin_class = 'economy',
    tenant_id // For demo, we'll use a default tenant if not provided
  } = req.body || {};

  // Validation
  if (!origin || !destination) {
    return res.status(400).json({
      error: {
        code: 'INVALID_INPUT',
        message: 'origin and destination are required',
        details: { missing: !origin ? 'origin' : 'destination' }
      }
    });
  }

  try {
    // Use demo tenant ID if not provided (from .env)
    const searchTenantId = tenant_id || process.env.DEMO_TENANT_ID;

    // Call DRCT directly (no n8n dependency)
    const searchResult = await drctService.search({ origin, destination, depart_date, return_date, adults, children, infants, cabin_class });
    const searchDuration = Date.now() - startTime;

    // Save search stats to DB asynchronously (fire and forget)
    const offers = Array.isArray(searchResult?.offers) ? searchResult.offers : [];
    supabase.from('searches').insert([{
      tenant_id: searchTenantId,
      origin: origin.toUpperCase(),
      destination: destination.toUpperCase(),
      depart_date,
      return_date,
      adults,
      children,
      infants,
      cabin_class,
      offers_count: offers.length,
      search_duration_ms: searchDuration,
      source: 'widget',
      metadata: { user_agent: req.headers['user-agent'], ip: req.ip }
    }]).then(({ error: dbError }) => {
      if (dbError) console.error('Search DB save error:', dbError);
    });

    return res.json(searchResult);

  } catch (err) {
    console.error('Search endpoint error:', err);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: nodeEnv === 'development' ? err.message : 'Internal server error'
      }
    });
  }
});

module.exports = router;
