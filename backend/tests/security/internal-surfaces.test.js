const express = require('express');
const request = require('supertest');

jest.mock('../../src/config', () => ({
  config: {
    appName: 'Aviaframe Backend',
    appVersion: 'test',
    nodeEnv: 'test',
    internalApiToken: 'secret-token',
    corsOrigins: []
  }
}));

jest.mock('../../src/lib/supabase', () => ({
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      limit: jest.fn(() => ({ error: null }))
    }))
  }))
}));

jest.mock('../../src/services/drctService', () => ({
  getBreakerStates: jest.fn(() => ({ drct: 'closed' }))
}));

describe('internal surfaces', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test('healthz/deep requires internal token', async () => {
    const router = require('../../src/routes/health');
    const app = express();
    app.use(router);

    const unauthorized = await request(app).get('/healthz/deep');
    expect(unauthorized.statusCode).toBe(401);

    const authorized = await request(app)
      .get('/healthz/deep')
      .set('x-internal-token', 'secret-token');

    expect(authorized.statusCode).toBe(200);
    expect(authorized.body.status).toBe('ok');
    expect(authorized.body.checks.supabase.status).toBe('ok');
  });

  test('metrics requires internal token', async () => {
    jest.doMock('../../src/lib/metrics', () => ({
      client: {
        register: {
          contentType: 'text/plain',
          metrics: jest.fn().mockResolvedValue('sample_metric 1')
        }
      },
      httpDuration: {
        observe: jest.fn()
      },
      drctLegacyProxyRequests: {
        inc: jest.fn()
      }
    }));

    jest.doMock('../../src/lib/logger', () => ({
      warn: jest.fn(),
      error: jest.fn(),
      info: jest.fn()
    }));

    jest.doMock('pino-http', () => () => (req, res, next) => next());

    jest.doMock('../../src/middleware/auth', () => ({
      requireInternalToken: (req, res) => {
        if (req.headers['x-internal-token'] === 'secret-token') {
          return true;
        }
        res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid internal token' } });
        return false;
      }
    }));

    jest.doMock('../../src/routes/health', () => express.Router());
    jest.doMock('../../src/routes/widget', () => express.Router());
    jest.doMock('../../src/routes/orders', () => express.Router());
    jest.doMock('../../src/routes/admin', () => express.Router());
    jest.doMock('../../src/routes/internalQa', () => express.Router());
    jest.doMock('../../src/routes/agency', () => express.Router());
    jest.doMock('../../src/routes/notifications', () => express.Router());
    jest.doMock('../../src/routes/webhooks', () => express.Router());
    jest.doMock('../../src/routes/support', () => express.Router());
    jest.doMock('../../src/routes/public', () => express.Router());
    jest.doMock('../../src/routes/documents', () => express.Router());
    jest.doMock('../../src/routes/payments', () => express.Router());
    jest.doMock('../../src/routes/tamara', () => express.Router());

    const app = require('../../src/app');

    const unauthorized = await request(app).get('/metrics');
    expect(unauthorized.statusCode).toBe(401);

    const authorized = await request(app)
      .get('/metrics')
      .set('x-internal-token', 'secret-token');

    expect(authorized.statusCode).toBe(200);
    expect(authorized.text).toContain('sample_metric 1');
  });

  test('allows root aviaframe.com as a CORS origin', async () => {
    jest.doMock('../../src/lib/metrics', () => ({
      client: {
        register: {
          contentType: 'text/plain',
          metrics: jest.fn().mockResolvedValue('sample_metric 1')
        }
      },
      httpDuration: {
        observe: jest.fn()
      },
      drctLegacyProxyRequests: {
        inc: jest.fn()
      }
    }));

    jest.doMock('../../src/lib/logger', () => ({
      warn: jest.fn(),
      error: jest.fn(),
      info: jest.fn()
    }));

    jest.doMock('pino-http', () => () => (req, res, next) => next());
    jest.doMock('../../src/middleware/auth', () => ({
      requireInternalToken: jest.fn(() => true)
    }));

    const okRouter = express.Router();
    okRouter.get('/ok', (req, res) => res.json({ ok: true }));

    jest.doMock('../../src/routes/health', () => express.Router());
    jest.doMock('../../src/routes/widget', () => okRouter);
    jest.doMock('../../src/routes/orders', () => express.Router());
    jest.doMock('../../src/routes/admin', () => express.Router());
    jest.doMock('../../src/routes/agency', () => express.Router());
    jest.doMock('../../src/routes/notifications', () => express.Router());
    jest.doMock('../../src/routes/webhooks', () => express.Router());
    jest.doMock('../../src/routes/support', () => express.Router());
    jest.doMock('../../src/routes/public', () => express.Router());
    jest.doMock('../../src/routes/documents', () => express.Router());
    jest.doMock('../../src/routes/payments', () => express.Router());
    jest.doMock('../../src/routes/tamara', () => express.Router());

    const app = require('../../src/app');
    const res = await request(app)
      .get('/ok')
      .set('Origin', 'https://aviaframe.com');

    expect(res.statusCode).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe('https://aviaframe.com');
    expect(res.headers['access-control-allow-headers']).toContain('X-Customer-Access-Token');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
  });

  test('rejects arbitrary netlify preview origin', async () => {
    jest.doMock('../../src/lib/metrics', () => ({
      client: {
        register: {
          contentType: 'text/plain',
          metrics: jest.fn().mockResolvedValue('sample_metric 1')
        }
      },
      httpDuration: {
        observe: jest.fn()
      },
      drctLegacyProxyRequests: {
        inc: jest.fn()
      }
    }));

    jest.doMock('../../src/lib/logger', () => ({
      warn: jest.fn(),
      error: jest.fn(),
      info: jest.fn()
    }));

    jest.doMock('pino-http', () => () => (req, res, next) => next());
    jest.doMock('../../src/middleware/auth', () => ({
      requireInternalToken: jest.fn(() => true)
    }));

    const okRouter = express.Router();
    okRouter.get('/ok', (req, res) => res.json({ ok: true }));

    jest.doMock('../../src/routes/health', () => express.Router());
    jest.doMock('../../src/routes/widget', () => okRouter);
    jest.doMock('../../src/routes/orders', () => express.Router());
    jest.doMock('../../src/routes/admin', () => express.Router());
    jest.doMock('../../src/routes/agency', () => express.Router());
    jest.doMock('../../src/routes/notifications', () => express.Router());
    jest.doMock('../../src/routes/webhooks', () => express.Router());
    jest.doMock('../../src/routes/support', () => express.Router());
    jest.doMock('../../src/routes/public', () => express.Router());
    jest.doMock('../../src/routes/documents', () => express.Router());
    jest.doMock('../../src/routes/payments', () => express.Router());
    jest.doMock('../../src/routes/tamara', () => express.Router());

    const app = require('../../src/app');
    const res = await request(app)
      .get('/ok')
      .set('Origin', 'https://random-preview.netlify.app');

    expect(res.statusCode).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });
});
