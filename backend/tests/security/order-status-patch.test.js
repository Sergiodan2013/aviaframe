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

function mockCommon({ profile, order, updateResult }) {
  const orderSelectSingle = jest.fn().mockResolvedValue({ data: order, error: null });
  const orderSelect = jest.fn(() => ({ eq: jest.fn(() => ({ single: orderSelectSingle })) }));

  const updateSingle = jest.fn().mockResolvedValue({
    data: updateResult || { ...order, status: 'updated' },
    error: null
  });
  const updateSelect = jest.fn(() => ({ single: updateSingle }));
  const updateEq = jest.fn(() => ({ select: updateSelect }));
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

  return { from, update, updateEq, orderSelectSingle };
}

describe('PATCH /api/orders/:orderId/status — authorization and mass-assignment guard', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test('client (order owner) cannot self-mark their own pending order confirmed', async () => {
    const profile = { id: 'user-1', role: 'user', agency_id: null };
    const order = { id: 'order-1', user_id: 'user-1', agency_id: null, status: 'pending' };
    mockCommon({ profile, order });

    const app = buildApp();
    const res = await request(app)
      .patch('/api/orders/order-1/status')
      .send({ status: 'confirmed' });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  test('client (order owner) cannot self-mark their own confirmed order ticketed', async () => {
    const profile = { id: 'user-1', role: 'user', agency_id: null };
    const order = { id: 'order-1', user_id: 'user-1', agency_id: null, status: 'confirmed' };
    mockCommon({ profile, order });

    const app = buildApp();
    const res = await request(app)
      .patch('/api/orders/order-1/status')
      .send({ status: 'ticketed' });

    expect(res.status).toBe(403);
  });

  test('client (order owner) can still cancel their own order', async () => {
    const profile = { id: 'user-1', role: 'user', agency_id: null };
    const order = { id: 'order-1', user_id: 'user-1', agency_id: null, status: 'pending' };
    const { update } = mockCommon({ profile, order });

    const app = buildApp();
    const res = await request(app)
      .patch('/api/orders/order-1/status')
      .send({ status: 'cancelled' });

    expect(res.status).toBe(200);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'cancelled' })
    );
  });

  test('client cannot smuggle price/payment/tenant fields via additionalData, even on an allowed status', async () => {
    const profile = { id: 'user-1', role: 'user', agency_id: null };
    const order = { id: 'order-1', user_id: 'user-1', agency_id: null, status: 'pending' };
    const { update } = mockCommon({ profile, order });

    const app = buildApp();
    const res = await request(app)
      .patch('/api/orders/order-1/status')
      .send({
        status: 'cancelled',
        additionalData: { total_price: 1, payment_status: 'paid', agency_id: 'someone-elses-agency', drct_order_id: 'FORGED' }
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('ADDITIONAL_DATA_NOT_SUPPORTED');
    expect(update).not.toHaveBeenCalled();
  });

  test('admin can confirm a pending order', async () => {
    const profile = { id: 'admin-1', role: 'admin', agency_id: null };
    const order = { id: 'order-1', user_id: 'user-1', agency_id: 'agency-1', status: 'pending' };
    const { update } = mockCommon({ profile, order });

    const app = buildApp();
    const res = await request(app)
      .patch('/api/orders/order-1/status')
      .send({ status: 'confirmed' });

    expect(res.status).toBe(200);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'confirmed' })
    );
  });

  test('agent of the owning agency can confirm then ticket the order (only from confirmed)', async () => {
    const profile = { id: 'agent-1', role: 'agent', agency_id: 'agency-1' };
    const order = { id: 'order-1', user_id: 'user-1', agency_id: 'agency-1', status: 'confirmed' };
    const { update } = mockCommon({ profile, order });

    const app = buildApp();
    const res = await request(app)
      .patch('/api/orders/order-1/status')
      .send({ status: 'ticketed' });

    expect(res.status).toBe(200);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'ticketed' })
    );
  });

  test('ticketed transition is still rejected from a non-confirmed status for staff too', async () => {
    const profile = { id: 'admin-1', role: 'admin', agency_id: null };
    const order = { id: 'order-1', user_id: 'user-1', agency_id: 'agency-1', status: 'pending' };
    mockCommon({ profile, order });

    const app = buildApp();
    const res = await request(app)
      .patch('/api/orders/order-1/status')
      .send({ status: 'ticketed' });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('INVALID_TRANSITION');
  });

  test('agent from a different agency cannot touch an order that is not theirs and not their own', async () => {
    const profile = { id: 'agent-2', role: 'agent', agency_id: 'agency-2' };
    const order = { id: 'order-1', user_id: 'user-1', agency_id: 'agency-1', status: 'pending' };
    mockCommon({ profile, order });

    const app = buildApp();
    const res = await request(app)
      .patch('/api/orders/order-1/status')
      .send({ status: 'confirmed' });

    expect(res.status).toBe(403);
  });
});
