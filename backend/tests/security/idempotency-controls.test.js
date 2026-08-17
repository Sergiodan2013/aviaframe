const makeRes = () => {
  const res = {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
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
        response_http_status: 202,
        response_body: JSON.stringify({ received: true, replayed: true })
      }
    });
    const eqKey = jest.fn(() => ({ single }));
    const eqAgency = jest.fn(() => ({ eq: eqKey }));
    const select = jest.fn(() => ({ eq: eqAgency }));
    const from = jest.fn(() => ({ select }));

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
    expect(next).not.toHaveBeenCalled();
  });

  it('persists a new key and stores response payload on first execution', async () => {
    jest.doMock('uuid', () => ({ v4: () => 'uuid-fixed-3' }));
    const updateCatch = jest.fn();
    const eqUpdateKey = jest.fn(() => ({ catch: updateCatch }));
    const eqUpdateAgency = jest.fn(() => ({ eq: eqUpdateKey }));
    const update = jest.fn(() => ({ eq: eqUpdateAgency }));

    const insert = jest.fn().mockResolvedValue({});
    const single = jest.fn().mockResolvedValue({ data: null });
    const eqSingleKey = jest.fn(() => ({ single }));
    const eqSingleAgency = jest.fn(() => ({ eq: eqSingleKey }));
    const select = jest.fn(() => ({ eq: eqSingleAgency }));

    const from = jest.fn((table) => {
      if (table !== 'idempotency_keys') throw new Error(`Unexpected table: ${table}`);
      return { select, insert, update };
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
        status: 'pending'
      })
    );
    expect(next).toHaveBeenCalled();
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'completed',
        response_http_status: 201,
        response_body: JSON.stringify({ ok: true, cancelled: true })
      })
    );
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
