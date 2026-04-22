'use strict';

require('dotenv').config();
const express = require('express');
const axios = require('axios');
const { config } = require('./config');
const logger = require('./lib/logger');
const pinoHttp = require('pino-http');
const { client, httpDuration } = require('./lib/metrics');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Structured request logging via pino-http
app.use(pinoHttp({ logger }));

// HTTP request duration metrics
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const route = req.route?.path || req.path;
    httpDuration.observe(
      { method: req.method, route, status_code: res.statusCode },
      (Date.now() - start) / 1000
    );
  });
  next();
});

// Simple request logging (kept alongside pino-http)
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.contentType);
  res.end(await client.metrics());
});

// CORS (simple implementation for development)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (config.corsOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Idempotency-Key');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Routes
app.use('/', require('./routes/health'));
app.use('/', require('./routes/widget'));
app.use('/', require('./routes/orders'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/agency', require('./routes/agency'));
app.use('/api', require('./routes/notifications'));
app.use('/api', require('./routes/webhooks'));
app.use('/api/support', require('./routes/support'));
app.use('/public', require('./routes/public'));
app.use('/api', require('./routes/documents'));
app.use('/', require('./routes/payments'));

// n8n webhook proxy — MUST be before 404 handler
const N8N_BASE_URL = (process.env.N8N_WEBHOOK_URL || '').replace(/\/+$/, '');

app.all('/webhook/*', express.json({ limit: '10mb' }), async (req, res) => {
  if (!N8N_BASE_URL) {
    return res.status(503).json({ error: { code: 'N8N_NOT_CONFIGURED', message: 'N8N_WEBHOOK_URL is not configured on the server' } });
  }
  const targetPath = req.path.replace(/^\/webhook/, '');
  const targetUrl = `${N8N_BASE_URL}${targetPath}`;
  try {
    const response = await axios({
      method: req.method,
      url: targetUrl,
      headers: {
        'Content-Type': 'application/json',
        ...Object.fromEntries(
          Object.entries(req.headers).filter(([k]) =>
            ['idempotency-key', 'x-correlation-id', 'x-tenant-id'].includes(k.toLowerCase())
          )
        )
      },
      data: req.body,
      timeout: 55000,
      validateStatus: () => true
    });
    res.status(response.status).json(response.data);
  } catch (err) {
    console.error('[n8n-proxy] Error proxying to n8n:', err.message);
    res.status(502).json({ error: { code: 'N8N_PROXY_ERROR', message: err.message } });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`
    }
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: config.nodeEnv === 'development' ? err.message : 'Internal server error'
    }
  });
});

module.exports = app;
