// Load environment variables from .env file (local dev only; Railway injects vars directly)
try { require('dotenv').config(); } catch (_) { /* not installed in production */ }

const express = require('express');
const app = express();

// ── Configuration ──────────────────────────────────────────────────────────────
const config = {
  port: process.env.PORT || 3000,
  host: process.env.HOST || 'localhost',
  nodeEnv: process.env.NODE_ENV || 'development',
  appName: process.env.APP_NAME || 'Aviaframe Backend',
  appVersion: process.env.APP_VERSION || '0.1.0',
  logLevel: process.env.LOG_LEVEL || 'info',
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  documentsBucket: process.env.DOCUMENTS_BUCKET || 'documents',
  supportInbox: process.env.SUPPORT_INBOX || 'sergiodan2013@gmail.com',
  widgetTokenSecret: process.env.WIDGET_TOKEN_SECRET || process.env.SUPABASE_ANON_KEY || 'aviaframe-widget-dev-secret',
  widgetTokenTtlSec: Number(process.env.WIDGET_TOKEN_TTL_SEC || 1800),
  internalApiToken: process.env.INTERNAL_API_TOKEN || '',
  emailWebhookSecret: process.env.EMAIL_WEBHOOK_SECRET || ''
};

// Expose config values to route handlers via app.set
app.set('nodeEnv', config.nodeEnv);
app.set('widgetTokenSecret', config.widgetTokenSecret);
app.set('widgetTokenTtlSec', config.widgetTokenTtlSec);
app.set('supportInbox', config.supportInbox);
app.set('documentsBucket', config.documentsBucket);

// ── Middleware imports ──────────────────────────────────────────────────────────
const { buildCorsMiddleware } = require('./middleware/cors');

// ── Route imports ───────────────────────────────────────────────────────────────
const drctRouter = require('./routes/drct');
const widgetRouter = require('./routes/widget');
const authRouter = require('./routes/auth');
const ordersRouter = require('./routes/orders');
const adminRouter = require('./routes/admin');
const agencyRouter = require('./routes/agency');
const notificationsRouter = require('./routes/notifications');
const documentsRouter = require('./routes/documents');
const supportRouter = require('./routes/support');
const publicRouter = require('./routes/public');
const internalRouter = require('./routes/internal');

// ── CORS must run BEFORE drctRouter and n8n proxy so OPTIONS preflights are handled ──
app.use(buildCorsMiddleware(config.corsOrigins));

// ── DRCT routes (before n8n proxy — intercept /webhook/drct/*) ─────────────────
app.use('/', drctRouter);

// ── N8N WEBHOOK PROXY ─────────────────────────────────────────────────────────
// Forward /webhook* and /webhook-test* to n8n (Railway or local)
const N8N_BASE_URL = process.env.N8N_BASE_URL || 'http://localhost:5678';
async function proxyToN8n(req, res) {
  try {
    const targetUrl = N8N_BASE_URL + req.originalUrl;
    const headers = { ...req.headers };
    // Fix host header for the target
    const n8nHost = new URL(N8N_BASE_URL).host;
    headers['host'] = n8nHost;
    // Collect raw body
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    await new Promise(resolve => req.on('end', resolve));
    const body = chunks.length ? Buffer.concat(chunks) : undefined;
    const proxyRes = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : body,
      signal: AbortSignal.timeout(60000),
    });
    res.status(proxyRes.status);
    proxyRes.headers.forEach((v, k) => {
      if (!['transfer-encoding', 'connection'].includes(k.toLowerCase())) res.setHeader(k, v);
    });
    const buf = await proxyRes.arrayBuffer();
    res.end(Buffer.from(buf));
  } catch (err) {
    console.error('[n8n proxy] error:', err.message);
    res.status(502).json({ error: 'n8n unavailable' });
  }
}
// Raw body needed for n8n webhooks — bypass express.json for these paths
app.use('/webhook', proxyToN8n);
app.use('/webhook-test', proxyToN8n);
// ──────────────────────────────────────────────────────────────────────────────

// ── Core middleware ─────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// ── Health / Info ───────────────────────────────────────────────────────────────
app.get('/healthz', (req, res) => {
  res.json({
    status: 'ok',
    service: config.appName,
    version: config.appVersion,
    environment: config.nodeEnv,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/info', (req, res) => {
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

app.get('/api/hello', (req, res) => {
  res.json({
    message: 'Hello from Aviaframe Backend!',
    timestamp: new Date().toISOString()
  });
});

// ── Route mounting ──────────────────────────────────────────────────────────────
app.use('/api/widget', widgetRouter);
app.use('/api', authRouter);
app.use('/api', ordersRouter);
app.use('/api/admin', adminRouter);
app.use('/api/agency', agencyRouter);
// Notifications router handles 3 different base paths:
// /api/notifications/events
// /api/internal/notifications/dequeue + /outbox
// /api/webhooks/email-provider
app.use('/api/notifications', notificationsRouter);
app.use('/api/internal/notifications', notificationsRouter);
app.use('/api/webhooks', notificationsRouter);
app.use('/api', documentsRouter);
app.use('/api/support', supportRouter);
app.use('/public', publicRouter);
app.use('/api/internal', internalRouter);

// n8n webhook proxy (legacy — kept for backwards compat; active proxy is above)
app.all('/webhook/*', proxyToN8n);

// ── Error handlers ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`
    }
  });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: config.nodeEnv === 'development' ? err.message : 'Internal server error'
    }
  });
});

// ── Server start ────────────────────────────────────────────────────────────────
const server = app.listen(config.port, config.host, () => {
  console.log('');
  console.log('========================================');
  console.log(`  ${config.appName} v${config.appVersion}`);
  console.log('========================================');
  console.log(`  Environment: ${config.nodeEnv}`);
  console.log(`  Server:      http://${config.host}:${config.port}`);
  console.log(`  Health:      http://${config.host}:${config.port}/healthz`);
  console.log(`  Info:        http://${config.host}:${config.port}/api/info`);
  console.log('========================================');
  console.log('');
});

// Graceful shutdown
const shutdown = (signal) => {
  console.log(`\nReceived ${signal}, closing server gracefully...`);
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
