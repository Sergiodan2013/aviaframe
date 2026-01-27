// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const supabase = require('./lib/supabase');
const app = express();

// Configuration from environment variables
const config = {
  port: process.env.PORT || 3000,
  host: process.env.HOST || 'localhost',
  nodeEnv: process.env.NODE_ENV || 'development',
  appName: process.env.APP_NAME || 'Aviaframe Backend',
  appVersion: process.env.APP_VERSION || '0.1.0',
  logLevel: process.env.LOG_LEVEL || 'info',
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000']
};

// Middleware
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

// Health check endpoint
app.get('/healthz', (req, res) => {
  res.json({
    status: 'ok',
    service: config.appName,
    version: config.appVersion,
    environment: config.nodeEnv,
    timestamp: new Date().toISOString()
  });
});

// Info endpoint
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

// Hello endpoint (test)
app.get('/api/hello', (req, res) => {
  res.json({
    message: 'Hello from Aviaframe Backend!',
    timestamp: new Date().toISOString()
  });
});

// Public search endpoint (with database integration)
app.post('/public/search', async (req, res) => {
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

// Start server
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