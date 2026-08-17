const express = require('express');
const request = require('supertest');

function emptyRouter() {
  return express.Router();
}

describe('n8n proxy DRCT fallback', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      N8N_WEBHOOK_URL: 'https://n8n.example.com/webhook',
    };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  function mockBaseDependencies() {
    jest.doMock('../../src/config', () => ({
      config: {
        corsOrigins: [],
      },
    }));

    jest.doMock('../../src/lib/logger', () => ({
      child: jest.fn(function child() { return this; }),
      warn: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
    }));

    jest.doMock('../../src/lib/metrics', () => ({
      client: { register: { contentType: 'text/plain', metrics: jest.fn(async () => '') } },
      httpDuration: { observe: jest.fn() },
      drctLegacyProxyRequests: { inc: jest.fn() },
    }));

    jest.doMock('../../src/middleware/auth', () => ({
      requireInternalToken: jest.fn(() => true),
    }));

    jest.doMock('pino-http', () => jest.fn(() => (req, res, next) => next()));

    jest.doMock('../../src/routes/health', () => emptyRouter());
    jest.doMock('../../src/routes/widget', () => emptyRouter());
    jest.doMock('../../src/routes/orders', () => emptyRouter());
    jest.doMock('../../src/routes/admin', () => emptyRouter());
    jest.doMock('../../src/routes/internalQa', () => emptyRouter());
    jest.doMock('../../src/routes/agency', () => emptyRouter());
    jest.doMock('../../src/routes/notifications', () => emptyRouter());
    jest.doMock('../../src/routes/webhooks', () => emptyRouter());
    jest.doMock('../../src/routes/support', () => emptyRouter());
    jest.doMock('../../src/routes/public', () => emptyRouter());
    jest.doMock('../../src/routes/documents', () => emptyRouter());
    jest.doMock('../../src/routes/payments', () => emptyRouter());
    jest.doMock('../../src/routes/tamara', () => emptyRouter());
  }

  test('falls back to direct DRCT create when n8n returns 201 without order_id', async () => {
    mockBaseDependencies();

    const axiosMock = jest.fn().mockResolvedValue({
      status: 201,
      data: {
        status: 'CREATED',
        price: { total: 0, currency: 'USD' },
      },
    });
    const directCreate = jest.fn().mockResolvedValue({
      order_id: 'DRCT-ORDER-55',
      status: 'NEW',
      price: { total: 1234, currency: 'SAR' },
    });

    jest.doMock('axios', () => axiosMock);
    jest.doMock('../../src/services/drctDirectClient', () => ({
      createOrder: directCreate,
      issueOrder: jest.fn(),
    }));

    const app = require('../../src/app');
    const res = await request(app)
      .post('/webhook/drct/order/create')
      .set('Idempotency-Key', 'idem-123')
      .send({
        offer_id: 'offer-1',
        passengers: [
          {
            first_name: 'SERGII',
            last_name: 'DANYLIUK',
            date_of_birth: '1990-01-01',
            document: { type: 'passport', number: 'AA123456' },
          },
        ],
        contacts: {
          email: 'sergiodan2013@gmail.com',
          phone: '+380676918012',
        },
      });

    expect(res.statusCode).toBe(201);
    expect(res.headers.deprecation).toBe('true');
    expect(res.headers['x-aviaframe-legacy-proxy']).toBe('compat');
    expect(directCreate).toHaveBeenCalledWith(expect.objectContaining({
      offer_id: 'offer-1',
    }), {
      idempotencyKey: 'idem-123',
    });
    expect(res.body).toEqual(expect.objectContaining({
      order_id: 'DRCT-ORDER-55',
      status: 'NEW',
    }));
  });

  test('blocks public DRCT mutating proxy when compatibility flag is disabled', async () => {
    mockBaseDependencies();

    jest.doMock('../../src/config', () => ({
      config: {
        corsOrigins: [],
        allowPublicDrctMutatingProxy: false,
        internalApiToken: 'secret-token',
      },
    }));

    const axiosMock = jest.fn();
    jest.doMock('axios', () => axiosMock);
    jest.doMock('../../src/services/drctDirectClient', () => ({
      createOrder: jest.fn(),
      issueOrder: jest.fn(),
    }));

    const app = require('../../src/app');
    const res = await request(app)
      .post('/webhook/drct/order/create')
      .send({ offer_id: 'offer-1' });

    expect(res.statusCode).toBe(403);
    expect(res.body.error.code).toBe('DRCT_PROXY_MUTATION_DISABLED');
    expect(axiosMock).not.toHaveBeenCalled();
  });

  test('allows internal token to bypass DRCT mutating proxy block', async () => {
    mockBaseDependencies();

    jest.doMock('../../src/config', () => ({
      config: {
        corsOrigins: [],
        allowPublicDrctMutatingProxy: false,
        internalApiToken: 'secret-token',
      },
    }));

    const axiosMock = jest.fn().mockResolvedValue({
      status: 201,
      data: {
        status: 'CREATED',
      },
    });
    const directCreate = jest.fn().mockResolvedValue({
      order_id: 'DRCT-ORDER-99',
      status: 'NEW',
    });

    jest.doMock('axios', () => axiosMock);
    jest.doMock('../../src/services/drctDirectClient', () => ({
      createOrder: directCreate,
      issueOrder: jest.fn(),
    }));

    const app = require('../../src/app');
    const res = await request(app)
      .post('/webhook/drct/order/create')
      .set('x-internal-token', 'secret-token')
      .send({ offer_id: 'offer-2' });

    expect(res.statusCode).toBe(201);
    expect(directCreate).toHaveBeenCalled();
  });
});
