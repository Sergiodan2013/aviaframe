const makeRes = () => {
  const res = {
    statusCode: 200,
    body: undefined,
    headers: {},
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
    setHeader(name, value) {
      this.headers[name] = value;
    }
  };
  return res;
};

describe('idempotency middleware controls', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('requires Idempotency-Key for critical order issue route', async () => {
    jest.doMock('uuid', () => ({ v4: () => 'uuid-fixed-1' }));
    jest.doMock('../../src/services/supabaseClient', () => ({}), { virtual: true });
    const { idempotencyMiddleware } = require('../../src/middleware/idempotency');

    const req = {
      method: 'POST',
      path: '/api/orders/order-1/issue',
      headers: {},
      user: { agencyId: 'agency-1' }
    };
    const res = makeRes();
    const next = jest.fn();

    await idempotencyMiddleware(req, res, next);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: 'MISSING_IDEMPOTENCY_KEY', message: 'Required' });
    expect(next).not.toHaveBeenCalled();
  });

  it('replays stored response for duplicate key within the same agency', async () => {
    jest.doMock('uuid', () => ({ v4: () => 'uuid-fixed-2' }));
    const single = jest.fn().mockResolvedValue({
      data: {
        status: 'completed',
        response_http_status: 202,
        response_body: JSON.stringify({ received: true, replayed: true })
      }
    });
    const eqKey = jest.fn(() => ({ single }));
    const eqOperation = jest.fn(() => ({ eq: eqKey }));
    const eqAgency = jest.fn(() => ({ eq: eqOperation }));
    const select = jest.fn(() => ({ eq: eqAgency }));
    const insert = jest.fn().mockResolvedValue({ error: { code: '23505' } });
    const from = jest.fn(() => ({ insert, select }));

    jest.doMock('../../src/services/supabaseClient', () => ({ from }), { virtual: true });
    const { idempotencyMiddleware } = require('../../src/middleware/idempotency');

    const req = {
      method: 'POST',
      path: '/api/orders/order-1/issue',
      headers: { 'idempotency-key': 'valid-key-1234' },
      user: { agencyId: 'agency-1' }
    };
    const res = makeRes();
    const next = jest.fn();

    await idempotencyMiddleware(req, res, next);

    expect(from).toHaveBeenCalledWith('idempotency_keys');
    expect(res.statusCode).toBe(202);
    expect(res.body).toEqual({ received: true, replayed: true });
    expect(res.headers?.['Idempotency-Replayed'] || res.headers?.['idempotency-replayed']).toBe('true');
    expect(next).not.toHaveBeenCalled();
  });

  it('persists a new key and stores response payload on first execution', async () => {
    jest.doMock('uuid', () => ({ v4: () => 'uuid-fixed-3' }));
    const updateCatch = jest.fn();
    const eqUpdate = jest.fn(() => ({ catch: updateCatch }));
    const update = jest.fn(() => ({ eq: eqUpdate }));

    const insert = jest.fn().mockResolvedValue({ error: null });

    const from = jest.fn((table) => {
      if (table !== 'idempotency_keys') throw new Error(`Unexpected table: ${table}`);
      return { insert, update };
    });

    jest.doMock('../../src/services/supabaseClient', () => ({ from }), { virtual: true });
    const { idempotencyMiddleware } = require('../../src/middleware/idempotency');

    const req = {
      method: 'POST',
      path: '/api/orders/order-1/cancel',
      headers: { 'idempotency-key': 'cancel-key-1234' },
      user: { agencyId: 'agency-7' }
    };
    const res = makeRes();
    const next = jest.fn(() => {
      res.status(201).json({ ok: true, cancelled: true });
    });

    await idempotencyMiddleware(req, res, next);

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        agency_id: 'agency-7',
        idempotency_key: 'cancel-key-1234',
        operation: 'POST /api/orders/order-1/cancel',
        request_hash: expect.stringMatching(/^[a-f0-9]{64}$/),
        status: 'pending'
      })
    );
    expect(next).toHaveBeenCalled();
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'completed',
        response_http_status: 201,
        response_body: { ok: true, cancelled: true }
      })
    );
  });

  it('does not execute a second mutation while the first claim is pending', async () => {
    const single = jest.fn().mockResolvedValue({
      data: {
        status: 'pending',
        request_hash: null,
      },
      error: null,
    });
    const eqKey = jest.fn(() => ({ single }));
    const eqOperation = jest.fn(() => ({ eq: eqKey }));
    const eqAgency = jest.fn(() => ({ eq: eqOperation }));
    const select = jest.fn(() => ({ eq: eqAgency }));
    const insert = jest.fn().mockResolvedValue({ error: { code: '23505' } });
    const from = jest.fn(() => ({ insert, select }));

    jest.doMock('../../src/services/supabaseClient', () => ({ from }), { virtual: true });
    const { idempotencyMiddleware } = require('../../src/middleware/idempotency');
    const req = {
      method: 'POST',
      path: '/api/orders/order-1/issue',
      headers: { 'idempotency-key': 'pending-key-1234' },
      body: {},
      user: { agencyId: 'agency-1' }
    };
    const res = makeRes();
    res.setHeader = jest.fn();
    const next = jest.fn();

    await idempotencyMiddleware(req, res, next);

    expect(res.statusCode).toBe(409);
    expect(res.body.error).toBe('IDEMPOTENCY_IN_PROGRESS');
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects reuse of a key with a different request body', async () => {
    const single = jest.fn().mockResolvedValue({
      data: {
        status: 'completed',
        request_hash: 'different-request-hash',
        response_http_status: 200,
        response_body: { ok: true },
      },
      error: null,
    });
    const eqKey = jest.fn(() => ({ single }));
    const eqOperation = jest.fn(() => ({ eq: eqKey }));
    const eqAgency = jest.fn(() => ({ eq: eqOperation }));
    const select = jest.fn(() => ({ eq: eqAgency }));
    const insert = jest.fn().mockResolvedValue({ error: { code: '23505' } });
    const from = jest.fn(() => ({ insert, select }));

    jest.doMock('../../src/services/supabaseClient', () => ({ from }), { virtual: true });
    const { idempotencyMiddleware } = require('../../src/middleware/idempotency');
    const req = {
      method: 'POST',
      path: '/api/orders/order-1/issue',
      headers: { 'idempotency-key': 'reused-key-1234' },
      body: { payment_id: 'payment-2' },
      user: { agencyId: 'agency-1' }
    };
    const res = makeRes();
    const next = jest.fn();

    await idempotencyMiddleware(req, res, next);

    expect(res.statusCode).toBe(409);
    expect(res.body.error).toBe('IDEMPOTENCY_CONFLICT');
    expect(next).not.toHaveBeenCalled();
  });
});

describe('Tamara webhook event idempotency', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('returns existing event instead of inserting duplicate provider event', async () => {
    const maybeSingle = jest.fn().mockResolvedValue({
      data: { id: 'evt-existing', processed_at: '2026-06-02T10:00:00.000Z' }
    });
    const eqStatus = jest.fn(() => ({ maybeSingle }));
    const eqType = jest.fn(() => ({ eq: eqStatus }));
    const eqOrder = jest.fn(() => ({ eq: eqType }));
    const eqProvider = jest.fn(() => ({ eq: eqOrder }));
    const select = jest.fn(() => ({ eq: eqProvider }));
    const insert = jest.fn();
    const from = jest.fn(() => ({ select, insert }));

    jest.doMock('../../src/lib/supabase', () => ({ from }));
    const { persistWebhookEvent } = require('../../src/services/tamara/webhook');

    const result = await persistWebhookEvent({
      provider: 'tamara',
      providerOrderId: 'tmr-order-1',
      eventType: 'order.updated',
      eventStatus: 'approved',
      payload: { order_id: 'tmr-order-1' }
    });

    expect(result).toEqual({ inserted: false, existing: true, id: 'evt-existing' });
    expect(insert).not.toHaveBeenCalled();
  });
});
