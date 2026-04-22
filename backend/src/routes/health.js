'use strict';

const express = require('express');
const router = express.Router();
const { config } = require('../config');
const supabase = require('../lib/supabase');
const { getBreakerStates } = require('../services/drctService');

router.get('/healthz', (req, res) => {
  res.json({
    status: 'ok',
    service: config.appName,
    version: config.appVersion,
    environment: config.nodeEnv,
    timestamp: new Date().toISOString()
  });
});

router.get('/api/info', (req, res) => {
  res.json({
    name: config.appName,
    version: config.appVersion,
    environment: config.nodeEnv,
    features: {
      caching: process.env.FEATURE_CACHING_ENABLED === 'true',
      webhooks: process.env.FEATURE_WEBHOOKS_ENABLED === 'true'
    }
  });
});

router.get('/api/hello', (req, res) => {
  res.json({
    message: 'Hello from Aviaframe Backend!',
    timestamp: new Date().toISOString()
  });
});

router.get('/healthz/deep', async (req, res) => {
  const checks = {};
  let ok = true;

  // Check Supabase
  try {
    const { error } = await supabase.from('orders').select('id').limit(1);
    checks.supabase = error ? { status: 'error', message: error.message } : { status: 'ok' };
    if (error) ok = false;
  } catch (e) {
    checks.supabase = { status: 'error', message: e.message };
    ok = false;
  }

  // Circuit breaker states (never blocks health response)
  try {
    checks.circuit_breakers = getBreakerStates();
  } catch (_) {
    checks.circuit_breakers = 'unavailable';
  }

  res.status(ok ? 200 : 503).json({
    status: ok ? 'ok' : 'degraded',
    checks,
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
