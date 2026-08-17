const express = require('express');
const request = require('supertest');

function buildApp() {
  const { guardDrctMutatingProxy } = require('../../src/middleware/requestGuards');
  const app = express();
  app.use(express.json());
  app.post('/webhook/drct/order/create', guardDrctMutatingProxy, (req, res) => {
    res.status(200).json({ ok: true });
  });
  return app;
}

describe('DRCT legacy proxy telemetry', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test('records compat metric with consumer label when public proxy is still enabled', async () => {
    const inc = jest.fn();
    const warn = jest.fn();

    jest.doMock('../../src/config', () => ({
      config: {
        allowPublicDrctMutatingProxy: true,
        internalApiToken: 'secret-token',
      }
    }));
    jest.doMock('../../src/lib/logger', () => ({
      warn,
      info: jest.fn(),
      error: jest.fn(),
    }));
    jest.doMock('../../src/lib/metrics', () => ({
      drctLegacyProxyRequests: { inc }
    }));

    const app = buildApp();
    const res = await request(app)
      .post('/webhook/drct/order/create')
      .set('Origin', 'https://admin.aviaframe.com')
      .send({ offer_id: 'offer-1' });

    expect(res.statusCode).toBe(200);
    expect(res.headers.deprecation).toBe('true');
    expect(res.headers['x-aviaframe-legacy-proxy']).toBe('compat');
    expect(inc).toHaveBeenCalledWith({
      target_path: '/drct/order/create',
      mode: 'compat',
      consumer: 'portal-admin',
    });
    expect(warn).toHaveBeenCalledWith(expect.objectContaining({
      targetPath: '/drct/order/create',
      consumer: 'portal-admin',
      mode: 'compat',
    }), 'public DRCT mutating proxy remains enabled');
  });

  test('records blocked metric with consumer label when public proxy is disabled', async () => {
    const inc = jest.fn();
    const warn = jest.fn();

    jest.doMock('../../src/config', () => ({
      config: {
        allowPublicDrctMutatingProxy: false,
        internalApiToken: 'secret-token',
      }
    }));
    jest.doMock('../../src/lib/logger', () => ({
      warn,
      info: jest.fn(),
      error: jest.fn(),
    }));
    jest.doMock('../../src/lib/metrics', () => ({
      drctLegacyProxyRequests: { inc }
    }));

    const app = buildApp();
    const res = await request(app)
      .post('/webhook/drct/order/create')
      .set('Origin', 'https://admin.aviaframe.com')
      .send({ offer_id: 'offer-1' });

    expect(res.statusCode).toBe(403);
    expect(res.body.error.code).toBe('DRCT_PROXY_MUTATION_DISABLED');
    expect(inc).toHaveBeenCalledWith({
      target_path: '/drct/order/create',
      mode: 'blocked',
      consumer: 'portal-admin',
    });
    expect(warn).toHaveBeenCalledWith(expect.objectContaining({
      targetPath: '/drct/order/create',
      consumer: 'portal-admin',
      mode: 'blocked',
    }), 'blocked public DRCT mutating proxy request');
  });

  test('internal token bypass does not increment compat or blocked metric', async () => {
    const inc = jest.fn();

    jest.doMock('../../src/config', () => ({
      config: {
        allowPublicDrctMutatingProxy: false,
        internalApiToken: 'secret-token',
      }
    }));
    jest.doMock('../../src/lib/logger', () => ({
      warn: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
    }));
    jest.doMock('../../src/lib/metrics', () => ({
      drctLegacyProxyRequests: { inc }
    }));

    const app = buildApp();
    const res = await request(app)
      .post('/webhook/drct/order/create')
      .set('x-internal-token', 'secret-token')
      .send({ offer_id: 'offer-1' });

    expect(res.statusCode).toBe(200);
    expect(inc).not.toHaveBeenCalled();
  });
});
