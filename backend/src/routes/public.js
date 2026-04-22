'use strict';

const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { config } = require('../config');

// POST /search (mounted at /public)
router.post('/search', async (req, res) => {
  const startTime = Date.now();

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

    // Mock search results (DRCT adapter not yet implemented)
    const mockOffers = [];
    const searchDuration = Date.now() - startTime;

    // Save search to database
    const { data: searchRecord, error: dbError } = await supabase
      .from('searches')
      .insert([
        {
          tenant_id: searchTenantId,
          origin: origin.toUpperCase(),
          destination: destination.toUpperCase(),
          depart_date,
          return_date,
          adults,
          children,
          infants,
          cabin_class,
          offers_count: mockOffers.length,
          search_duration_ms: searchDuration,
          source: 'api',
          metadata: {
            user_agent: req.headers['user-agent'],
            ip: req.ip
          }
        }
      ])
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      // Continue even if database save fails (don't break user experience)
    }

    // Return search results
    res.json({
      search_id: searchRecord?.id || `search-${Date.now()}`,
      origin: origin.toUpperCase(),
      destination: destination.toUpperCase(),
      depart_date,
      return_date,
      adults,
      children,
      infants,
      cabin_class,
      offers: mockOffers,
      offers_count: mockOffers.length,
      message: 'DRCT adapter not yet implemented. This is a placeholder response.',
      saved_to_db: !dbError
    });

  } catch (err) {
    console.error('Search endpoint error:', err);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: config.nodeEnv === 'development' ? err.message : 'Internal server error'
      }
    });
  }
});

module.exports = router;
