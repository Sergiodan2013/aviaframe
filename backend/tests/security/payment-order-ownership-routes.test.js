'use strict';

// Route-level wiring tests for the A06 ownership fix: verifies that the
// payment routes (payments.js, tamara.js) actually call
// enforceOrderOwnershipIfAuthenticated with the loaded order and respect its
// result — halting the request (no gateway/provider call, no DB mutation) when
// it rejects, and proceeding normally when it allows the request through.
//
// The real enforceOrderOwnershipIfAuthenticated logic itself (guest bypass,
// 401 on bad token, 403 on cross-tenant/cross-user access, allow for the
// owner/staff-with-access) is covered independently in
// tests/security/auth-order-ownership.test.js.

const express = require('express');
const request = require('supertest');

function mockAuthModule(ownershipImpl) {
  jest.doMock('../../src/middleware/auth', () => ({
    resolveAuthContext: jest.fn(async () => ({ error: 'UNAUTHORIZED' })),
    canAccessOrder: jest.fn(async () => true),
    forbidden: (res, message = 'Access denied') =>
      res.status(403).json({ error: { code: 'FORBIDDEN', message } }),
    enforceOrderOwnershipIfAuthenticated: jest.fn(ownershipImpl)
  }));
}

const allow = async () => ({ ok: true, auth: null });
function reject403() {
  return async (req, res) => {
    res.status(403).json({ error: { code: 'FORBIDDEN', message: 'You do not have access to this order' } });
    return { ok: false };
  };
}

describe('POST /api/payments/card-scheme-check — ownership gate wiring', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    delete process.env.MOYASAR_SECRET_KEY;
  });

  function buildOrdersTable(order) {
    const maybeSingle = jest.fn().mockResolvedValue({ data: order, error: null });
    const eq = jest.fn(() => ({ maybeSingle }));
    const select = jest.fn(() => ({ eq }));
    return { select };
  }

  test('rejects before calling the Moyasar issuer lookup when ownership check fails', async () => {
    process.env.MOYASAR_SECRET_KEY = 'sk_live_main';
    const order = { id: 'order-1', order_number: 'AV-1001', total_price: 100, currency: 'SAR', payment_status: 'pending', metadata: {}, raw_offer_data: {} };
    const axiosPost = jest.fn();

    jest.doMock('axios', () => ({ post: axiosPost }));
    jest.doMock('../../src/lib/supabase', () => ({
      from: jest.fn((table) => {
        if (table === 'orders') return buildOrdersTable(order);
        throw new Error(`Unexpected table ${table}`);
      })
    }));
    mockAuthModule(reject403());

    const router = require('../../src/routes/payments');
    const app = express();
    app.use(router);

    const res = await request(app)
      .post('/api/payments/card-scheme-check')
      .set('Authorization', 'Bearer attacker-token')
      .send({ order_id: 'order-1', card_number: '4111111111111111' });

    expect(res.statusCode).toBe(403);
    expect(axiosPost).not.toHaveBeenCalled();
  });

  test('proceeds to the issuer lookup when the ownership check allows the request', async () => {
    process.env.MOYASAR_SECRET_KEY = 'sk_live_main';
    const order = { id: 'order-1', order_number: 'AV-1001', total_price: 100, currency: 'SAR', payment_status: 'pending', metadata: {}, raw_offer_data: {} };
    const axiosPost = jest.fn().mockResolvedValue({ data: { company: 'visa', issuer_country: 'SA' } });

    jest.doMock('axios', () => ({ post: axiosPost }));
    jest.doMock('../../src/lib/supabase', () => ({
      from: jest.fn((table) => {
        if (table === 'orders') return buildOrdersTable(order);
        throw new Error(`Unexpected table ${table}`);
      })
    }));
    mockAuthModule(allow);

    const router = require('../../src/routes/payments');
    const app = express();
    app.use(router);

    const res = await request(app)
      .post('/api/payments/card-scheme-check')
      .send({ order_id: 'order-1', card_number: '4111111111111111' });

    expect(res.statusCode).toBe(200);
    expect(axiosPost).toHaveBeenCalled();
  });
});

describe('POST /api/payments/initiate — ownership gate wiring', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    delete process.env.MOYASAR_SECRET_KEY;
  });

  function buildOrdersTable(order) {
    const maybeSingle = jest.fn().mockResolvedValue({ data: order, error: null });
    const eq = jest.fn(() => ({ maybeSingle }));
    const select = jest.fn(() => ({ eq }));
    const updateEq = jest.fn().mockResolvedValue({ data: null, error: null });
    const update = jest.fn(() => ({ eq: updateEq }));
    return { select, update };
  }

  test('rejects before ever calling Moyasar to create a payment when ownership check fails', async () => {
    process.env.MOYASAR_SECRET_KEY = 'sk_live_main';
    const order = {
      id: 'order-1', order_number: 'AV-1001', total_price: 100, currency: 'SAR',
      payment_status: 'pending', metadata: {}, raw_offer_data: {}
    };
    const axiosPost = jest.fn();

    jest.doMock('axios', () => ({ post: axiosPost }));
    const ordersTable = buildOrdersTable(order);
    jest.doMock('../../src/lib/supabase', () => ({
      from: jest.fn((table) => {
        if (table === 'orders') return ordersTable;
        throw new Error(`Unexpected table ${table}`);
      })
    }));
    mockAuthModule(reject403());

    const router = require('../../src/routes/payments');
    const app = express();
    app.use(router);

    const res = await request(app)
      .post('/api/payments/initiate')
      .set('Authorization', 'Bearer attacker-token')
      .send({ order_id: 'order-1', card: { name: 'A', number: '4111111111111111', month: '01', year: '30', cvc: '123' } });

    expect(res.statusCode).toBe(403);
    expect(axiosPost).not.toHaveBeenCalled();
    expect(ordersTable.update).not.toHaveBeenCalled();
  });

  test('guest checkout (no Authorization header) is completely unaffected — the real helper allows it through', async () => {
    // Uses the REAL middleware/auth module (not mocked) to prove the actual
    // production wiring, not just a stubbed allow(), preserves guest checkout.
    // jest.doMock registrations from earlier tests in this file persist across
    // resetModules(), so explicitly un-mock it here to guarantee the real
    // module is loaded regardless of test order.
    jest.dontMock('../../src/middleware/auth');
    const order = {
      id: 'order-1', order_number: 'AV-1001', total_price: 100, currency: 'SAR',
      drct_order_id: 'drct-1', payment_status: 'pending', metadata: {},
      raw_offer_data: { metadata: { dry_run_issue: true, origin_host: 'aviaframe.com' } }
    };
    const ordersTable = buildOrdersTable(order);
    jest.doMock('../../src/lib/supabase', () => ({
      from: jest.fn((table) => {
        if (table === 'orders') return ordersTable;
        throw new Error(`Unexpected table ${table}`);
      })
    }));
    const setImmediateSpy = jest.spyOn(global, 'setImmediate').mockImplementation(() => 0);

    const router = require('../../src/routes/payments');
    const app = express();
    app.use(router);

    const res = await request(app)
      .post('/api/payments/initiate')
      .send({ order_id: 'order-1', card: { name: 'A', number: '4111111111111111', month: '01', year: '30', cvc: '123' } });

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('paid');
    setImmediateSpy.mockRestore();
  });
});

describe('POST /api/payments/tamara/checkout-session — ownership gate wiring', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  function buildOrdersTable(order) {
    const single = jest.fn().mockResolvedValue({ data: order, error: null });
    const eq = jest.fn(() => ({ single }));
    const select = jest.fn(() => ({ eq }));
    return { select };
  }

  function buildApp() {
    const router = require('../../src/routes/tamara');
    const app = express();
    app.use(express.json());
    app.use('/api/payments', router);
    return app;
  }

  test('rejects before creating a Tamara checkout session when ownership check fails', async () => {
    const order = { id: 'order-1', currency: 'SAR', status: 'pending_payment', total_price: 100, contact_email: 'x@y.com' };
    jest.doMock('../../src/lib/supabase', () => ({
      from: jest.fn((table) => {
        if (table === 'orders') return buildOrdersTable(order);
        throw new Error(`Unexpected table ${table}`);
      })
    }));
    mockAuthModule(reject403());
    const createCheckoutSession = jest.fn();
    jest.doMock('../../src/services/tamara/client', () => ({ createCheckoutSession, cancelOrder: jest.fn(), refundOrder: jest.fn() }));
    jest.doMock('../../src/services/tamara/mapper', () => ({ buildCheckoutPayload: jest.fn() }));
    jest.doMock('../../src/services/tamara/webhook', () => ({ validateWebhookToken: jest.fn(), persistWebhookEvent: jest.fn(), markEventProcessed: jest.fn(), logOperation: jest.fn() }));
    jest.doMock('../../src/services/tamara/orderFlow', () => ({ processApprovedOrder: jest.fn(), updateOrderProviderStatus: jest.fn() }));
    jest.doMock('../../src/services/tamara/runtime', () => ({
      getTamaraConfigForHost: jest.fn(() => ({ enabled: true })),
      getTamaraConfigForOrder: jest.fn(() => ({ enabled: true })),
      resolveRequestOriginHost: jest.fn(() => 'aviaframe.com')
    }));

    const app = buildApp();
    const res = await request(app)
      .post('/api/payments/tamara/checkout-session')
      .set('Authorization', 'Bearer attacker-token')
      .send({ order_id: 'order-1' });

    expect(res.statusCode).toBe(403);
    expect(createCheckoutSession).not.toHaveBeenCalled();
  });
});

describe('GET /api/payments/tamara/status/:orderId — ownership gate wiring', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test('rejects a status lookup for an order the caller cannot access', async () => {
    const order = { id: 'order-1', user_id: 'real-owner', agency_id: null, status: 'confirmed', order_number: 'AV-1', total_price: 100, currency: 'SAR' };
    const single = jest.fn().mockResolvedValue({ data: order, error: null });
    const eq = jest.fn(() => ({ single }));
    const select = jest.fn(() => ({ eq }));
    jest.doMock('../../src/lib/supabase', () => ({
      from: jest.fn((table) => {
        if (table === 'orders') return { select };
        throw new Error(`Unexpected table ${table}`);
      })
    }));
    mockAuthModule(reject403());
    jest.doMock('../../src/services/tamara/client', () => ({}));
    jest.doMock('../../src/services/tamara/mapper', () => ({ buildCheckoutPayload: jest.fn() }));
    jest.doMock('../../src/services/tamara/webhook', () => ({ validateWebhookToken: jest.fn(), persistWebhookEvent: jest.fn(), markEventProcessed: jest.fn(), logOperation: jest.fn() }));
    jest.doMock('../../src/services/tamara/orderFlow', () => ({ processApprovedOrder: jest.fn(), updateOrderProviderStatus: jest.fn() }));
    jest.doMock('../../src/services/tamara/runtime', () => ({
      getTamaraConfigForHost: jest.fn(), getTamaraConfigForOrder: jest.fn(), resolveRequestOriginHost: jest.fn()
    }));

    const router = require('../../src/routes/tamara');
    const app = express();
    app.use('/api/payments', router);

    const res = await request(app).get('/api/payments/tamara/status/order-1').set('Authorization', 'Bearer attacker-token');

    expect(res.statusCode).toBe(403);
  });
});

describe('POST /api/payments/tamara/:orderId/cancel and /refund — cross-tenant ownership', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  function buildApp() {
    const router = require('../../src/routes/tamara');
    const app = express();
    app.use(express.json());
    app.use('/api/payments', router);
    return app;
  }

  test('an authenticated agent from a different agency cannot cancel another agency\'s Tamara order', async () => {
    const order = { id: 'order-1', user_id: null, agency_id: 'agency-1', payment_provider: 'tamara', payment_provider_order_id: 'tamara-order-1', total_price: 100, currency: 'SAR' };
    const single = jest.fn().mockResolvedValue({ data: order, error: null });
    const eq = jest.fn(() => ({ single }));
    const select = jest.fn(() => ({ eq }));
    jest.doMock('../../src/lib/supabase', () => ({
      from: jest.fn((table) => {
        if (table === 'orders') return { select };
        throw new Error(`Unexpected table ${table}`);
      })
    }));
    jest.doMock('../../src/middleware/auth', () => ({
      resolveAuthContext: jest.fn(async () => ({
        user: { id: 'agent-2' },
        profile: { id: 'agent-2', role: 'agent', agency_id: 'agency-2' }
      })),
      canAccessOrder: jest.fn(async (auth, ord) => {
        if (auth.profile.role === 'admin') return true;
        if (auth.profile.role === 'agent') return auth.profile.agency_id === ord.agency_id;
        return ord.user_id === auth.profile.id;
      }),
      forbidden: (res, message = 'Access denied') => res.status(403).json({ error: { code: 'FORBIDDEN', message } }),
      enforceOrderOwnershipIfAuthenticated: jest.fn(async () => ({ ok: true, auth: null }))
    }));
    const cancelOrder = jest.fn();
    jest.doMock('../../src/services/tamara/client', () => ({ cancelOrder, refundOrder: jest.fn() }));
    jest.doMock('../../src/services/tamara/mapper', () => ({ buildCheckoutPayload: jest.fn() }));
    jest.doMock('../../src/services/tamara/webhook', () => ({ validateWebhookToken: jest.fn(), persistWebhookEvent: jest.fn(), markEventProcessed: jest.fn(), logOperation: jest.fn() }));
    jest.doMock('../../src/services/tamara/orderFlow', () => ({ processApprovedOrder: jest.fn(), updateOrderProviderStatus: jest.fn() }));
    jest.doMock('../../src/services/tamara/runtime', () => ({
      getTamaraConfigForHost: jest.fn(), getTamaraConfigForOrder: jest.fn(() => ({ enabled: true })), resolveRequestOriginHost: jest.fn()
    }));

    const app = buildApp();
    const res = await request(app)
      .post('/api/payments/tamara/order-1/cancel')
      .set('Authorization', 'Bearer agent-2-token')
      .send({});

    expect(res.statusCode).toBe(403);
    expect(cancelOrder).not.toHaveBeenCalled();
  });

  test('an authenticated agent from the SAME agency can cancel their own agency\'s Tamara order', async () => {
    const order = { id: 'order-1', user_id: null, agency_id: 'agency-1', payment_provider: 'tamara', payment_provider_order_id: 'tamara-order-1', total_price: 100, currency: 'SAR' };
    const single = jest.fn().mockResolvedValue({ data: order, error: null });
    const eq = jest.fn(() => ({ single }));
    const select = jest.fn(() => ({ eq }));
    jest.doMock('../../src/lib/supabase', () => ({
      from: jest.fn((table) => {
        if (table === 'orders') return { select };
        throw new Error(`Unexpected table ${table}`);
      })
    }));
    jest.doMock('../../src/middleware/auth', () => ({
      resolveAuthContext: jest.fn(async () => ({
        user: { id: 'agent-1' },
        profile: { id: 'agent-1', role: 'agent', agency_id: 'agency-1' }
      })),
      canAccessOrder: jest.fn(async (auth, ord) => {
        if (auth.profile.role === 'admin') return true;
        if (auth.profile.role === 'agent') return auth.profile.agency_id === ord.agency_id;
        return ord.user_id === auth.profile.id;
      }),
      forbidden: (res, message = 'Access denied') => res.status(403).json({ error: { code: 'FORBIDDEN', message } }),
      enforceOrderOwnershipIfAuthenticated: jest.fn(async () => ({ ok: true, auth: null }))
    }));
    const cancelOrder = jest.fn().mockResolvedValue({ status: 'canceled' });
    jest.doMock('../../src/services/tamara/client', () => ({ cancelOrder, refundOrder: jest.fn() }));
    jest.doMock('../../src/services/tamara/mapper', () => ({ buildCheckoutPayload: jest.fn() }));
    jest.doMock('../../src/services/tamara/webhook', () => ({ validateWebhookToken: jest.fn(), persistWebhookEvent: jest.fn(), markEventProcessed: jest.fn(), logOperation: jest.fn() }));
    jest.doMock('../../src/services/tamara/orderFlow', () => ({ processApprovedOrder: jest.fn(), updateOrderProviderStatus: jest.fn().mockResolvedValue({}) }));
    jest.doMock('../../src/services/tamara/runtime', () => ({
      getTamaraConfigForHost: jest.fn(), getTamaraConfigForOrder: jest.fn(() => ({ enabled: true })), resolveRequestOriginHost: jest.fn()
    }));

    const app = buildApp();
    const res = await request(app)
      .post('/api/payments/tamara/order-1/cancel')
      .set('Authorization', 'Bearer agent-1-token')
      .send({});

    expect(res.statusCode).toBe(200);
    expect(cancelOrder).toHaveBeenCalledWith('tamara-order-1', expect.objectContaining({ enabled: true }));
  });
});
