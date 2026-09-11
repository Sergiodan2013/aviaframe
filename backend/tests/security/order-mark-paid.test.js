'use strict';

const express = require('express');
const request = require('supertest');

function buildApp() {
  const router = require('../../src/routes/orders');
  const app = express();
  app.use(express.json());
  app.use(router);
  return app;
}

function mockCommon({ profile, order, handlePaymentPaidAsync }) {
  const orderMaybeSingle = jest.fn().mockResolvedValue({ data: order, error: null });
  const orderEqCalls = [];
  function buildQuery() {
    const query = {
      eq: jest.fn((field, value) => {
        orderEqCalls.push([field, value]);
        return query;
      }),
      maybeSingle: orderMaybeSingle
    };
    return query;
  }
  const orderSelect = jest.fn(() => buildQuery());

  const updateEq = jest.fn().mockResolvedValue({});
  const update = jest.fn(() => ({ eq: updateEq }));

  const from = jest.fn((table) => {
    if (table === 'orders') {
      return { select: orderSelect, update };
    }
    throw new Error(`Unexpected table ${table}`);
  });

  jest.doMock('../../src/lib/supabase', () => ({ from }));
  jest.doMock('../../src/config', () => ({
    config: { nodeEnv: 'test' },
    ORDERS_LIST_COLUMNS: 'id,order_number,status'
  }));
  jest.doMock('../../src/utils/helpers', () => ({
    isAdminRole: (role) => ['admin', 'super_admin'].includes(role),
    isAgentRole: (role) => role === 'agent',
    isStaffRole: (role) => ['admin', 'super_admin', 'agent'].includes(role),
    generateOrderNumber: () => 'ORDER1'
  }));
  jest.doMock('../../src/middleware/auth', () => ({
    resolveAuthContext: jest.fn(async () => ({ user: { id: profile.id }, profile })),
    forbidden: (res, message = 'Access denied') => res.status(403).json({ error: { code: 'FORBIDDEN', message } }),
    ensureStaff: jest.fn(() => true),
    canAccessOrder: jest.fn(async () => true)
  }));
  jest.doMock('../../src/middleware/idempotency', () => ({
    idempotencyMiddleware: (req, res, next) => next()
  }));
  jest.doMock('../../src/services/orderService', () => ({
    ensureTicketPdfForOrder: jest.fn(),
    createSignedDocumentUrl: jest.fn(),
    issueDrctTicket: jest.fn()
  }));
  jest.doMock('../../src/services/emailService', () => ({ sendTicketEmail: jest.fn() }));
  jest.doMock('../../src/services/drctService', () => ({ cancelOrder: jest.fn() }));
  jest.doMock('../../src/services/drctDirectClient', () => ({ createOrder: jest.fn() }));
  jest.doMock('../../src/services/customerProfile', () => ({ saveCustomerProfile: jest.fn() }));
  jest.doMock('../../src/routes/payments', () => ({
    handlePaymentPaidAsync: handlePaymentPaidAsync || jest.fn()
  }));

  return { from, orderSelect, orderMaybeSingle, update, orderEqCalls };
}

describe('POST /api/orders/:orderId/mark-paid — tenant isolation', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test('agent with NO agency_id is rejected outright, never falls through to an unfiltered query', async () => {
    const profile = { id: 'agent-broken', role: 'agent', agency_id: null };
    // Order belongs to a completely different agency than the requester.
    const order = {
      id: 'order-1', order_number: 'ORD1', agency_id: 'someone-elses-agency',
      payment_status: 'unpaid', status: 'pending', total_price: 500, currency: 'SAR'
    };
    const { update, orderMaybeSingle } = mockCommon({ profile, order });

    const app = buildApp();
    const res = await request(app).post('/api/orders/order-1/mark-paid').send({});

    expect(res.status).toBe(403);
    // The query must never even reach the DB once we know the agent has no agency.
    expect(orderMaybeSingle).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  test('agent scoped to their own agency can mark their own agency order paid', async () => {
    const profile = { id: 'agent-1', role: 'agent', agency_id: 'agency-1' };
    const order = {
      id: 'order-1', order_number: 'ORD1', agency_id: 'agency-1',
      payment_status: 'unpaid', status: 'pending', total_price: 500, currency: 'SAR'
    };
    const handlePaymentPaidAsync = jest.fn();
    const { update, orderEqCalls } = mockCommon({ profile, order, handlePaymentPaidAsync });

    const app = buildApp();
    const res = await request(app).post('/api/orders/order-1/mark-paid').send({});

    expect(res.status).toBe(200);
    expect(orderEqCalls).toContainEqual(['agency_id', 'agency-1']);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ payment_status: 'paid', status: 'confirmed' })
    );
  });

  test('agent from a different agency cannot mark another agency order paid', async () => {
    const profile = { id: 'agent-2', role: 'agent', agency_id: 'agency-2' };
    // maybeSingle resolves null because the agency_id filter (agency-2) would not
    // match this agency-1 order in a real DB — simulate that "not found" result.
    const { orderMaybeSingle } = mockCommon({
      profile,
      order: null
    });
    orderMaybeSingle.mockResolvedValueOnce({ data: null, error: null });

    const app = buildApp();
    const res = await request(app).post('/api/orders/order-1/mark-paid').send({});

    expect(res.status).toBe(404);
  });

  test('admin (no agency_id at all) can mark any order paid', async () => {
    const profile = { id: 'admin-1', role: 'admin', agency_id: null };
    const order = {
      id: 'order-1', order_number: 'ORD1', agency_id: 'agency-1',
      payment_status: 'unpaid', status: 'pending', total_price: 500, currency: 'SAR'
    };
    const { update, orderEqCalls } = mockCommon({ profile, order });

    const app = buildApp();
    const res = await request(app).post('/api/orders/order-1/mark-paid').send({});

    expect(res.status).toBe(200);
    // Admin path must not add an agency_id filter — id filter only.
    expect(orderEqCalls).not.toContainEqual(['agency_id', expect.anything()]);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ payment_status: 'paid' })
    );
  });

  test('a plain client/user role is rejected before any DB query', async () => {
    const profile = { id: 'user-1', role: 'user', agency_id: null };
    const { orderMaybeSingle } = mockCommon({ profile, order: null });

    const app = buildApp();
    const res = await request(app).post('/api/orders/order-1/mark-paid').send({});

    expect(res.status).toBe(403);
    expect(orderMaybeSingle).not.toHaveBeenCalled();
  });
});
