const request = require('supertest');
const express = require('express');

describe('Priority 1 - Idempotency & Multi-tenant', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  function makeApp({ reqUserAgencyId = 'agency-1', singleResult = null } = {}) {
    jest.doMock('uuid', () => ({ v4: () => 'uuid-fixed-priority-1' }));

    const insert = jest.fn().mockResolvedValue({});
    const updateCatch = jest.fn();
    const eqUpdateKey = jest.fn(() => ({ catch: updateCatch }));
    const eqUpdateAgency = jest.fn(() => ({ eq: eqUpdateKey }));
    const update = jest.fn(() => ({ eq: eqUpdateAgency }));

    const single = jest.fn().mockResolvedValue({ data: singleResult });
    const eqKey = jest.fn(() => ({ single }));
    const eqAgency = jest.fn(() => ({ eq: eqKey }));
    const select = jest.fn(() => ({ eq: eqAgency }));

    const from = jest.fn(() => ({ select, insert, update }));
    jest.doMock('../../src/services/supabaseClient', () => ({ from }), { virtual: true });

    const { idempotencyMiddleware } = require('../../src/middleware/idempotency');

    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      req.user = { agencyId: reqUserAgencyId };
      next();
    });
    app.post('/api/orders/:orderId/issue', idempotencyMiddleware, (_req, res) => {
      res.status(200).json({ ok: true });
    });
    app.post('/api/orders/:orderId/cancel', idempotencyMiddleware, (_req, res) => {
      res.status(200).json({ ok: true, cancelled: true });
    });

    return { app, from, insert };
  }

  it('should require Idempotency-Key header', async () => {
    const { app } = makeApp();

    const res = await request(app)
      .post('/api/orders/test-order/issue')
      .send({ notes: 'test' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('MISSING_IDEMPOTENCY_KEY');
  });

  it('should reject invalid Idempotency-Key format', async () => {
    const { app } = makeApp();

    const res = await request(app)
      .post('/api/orders/test-order/issue')
      .set('Idempotency-Key', 'abc')
      .send({ notes: 'test' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('INVALID_IDEMPOTENCY_KEY');
  });

  it('should scope idempotency records to the current agency', async () => {
    const { app, from, insert } = makeApp({ reqUserAgencyId: 'agency-1', singleResult: null });

    const res = await request(app)
      .post('/api/orders/test-order/cancel')
      .set('Idempotency-Key', 'valid-key-1234')
      .send({ notes: 'test' });

    expect(res.status).toBe(200);
    expect(from).toHaveBeenCalledWith('idempotency_keys');
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({
      agency_id: 'agency-1',
      idempotency_key: 'valid-key-1234',
      operation: 'POST /api/orders/test-order/cancel'
    }));
  });
});
