const express = require('express');
const request = require('supertest');

function buildApp() {
  const router = require('../../src/routes/orders');
  const app = express();
  app.use(express.json());
  app.use(router);
  return app;
}

describe('customer bookings scope', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test('customer bookings endpoint filters strictly by authenticated email even for agent profiles', async () => {
    const eq = jest.fn();
    const order = jest.fn();
    const limit = jest.fn();
    const or = jest.fn();

    const queryResult = Promise.resolve({
      data: [
        {
          id: 'order-1',
          order_number: 'AV-1001',
          contact_email: 'agent@agency.test'
        }
      ],
      error: null
    });

    const queryBuilder = {
      eq: jest.fn((field, value) => {
        eq(field, value);
        return queryBuilder;
      }),
      order: jest.fn(() => {
        order();
        return queryBuilder;
      }),
      limit: jest.fn(() => {
        limit();
        return queryResult;
      }),
      or: jest.fn(() => {
        or();
        return queryBuilder;
      })
    };

    jest.doMock('../../src/middleware/auth', () => ({
      resolveAuthContext: jest.fn().mockResolvedValue({
        user: { id: 'user-1', email: 'agent@agency.test' },
        profile: { id: 'user-1', email: 'agent@agency.test', role: 'agent', agency_id: 'agency-a' }
      }),
      forbidden: (res, message = 'Access denied') =>
        res.status(403).json({ error: { code: 'FORBIDDEN', message } }),
      ensureStaff: jest.fn(() => true),
      canAccessOrder: jest.fn(async () => true)
    }));

    jest.doMock('../../src/lib/supabase', () => ({
      from: jest.fn(() => ({
        select: jest.fn(() => queryBuilder)
      }))
    }));

    jest.doMock('../../src/config', () => ({
      config: { nodeEnv: 'test' },
      ORDERS_LIST_COLUMNS: 'id,order_number,contact_email'
    }));

    jest.doMock('../../src/utils/helpers', () => ({
      isAdminRole: (role) => ['admin', 'super_admin'].includes(role),
      isAgentRole: (role) => role === 'agent',
      isStaffRole: (role) => ['admin', 'super_admin', 'agent'].includes(role),
      generateOrderNumber: () => 'AV-TEST-1'
    }));

    jest.doMock('../../src/services/orderService', () => ({
      ensureTicketPdfForOrder: jest.fn(),
      createSignedDocumentUrl: jest.fn(),
      issueDrctTicket: jest.fn()
    }));
    jest.doMock('../../src/services/emailService', () => ({
      sendTicketEmail: jest.fn()
    }));
    jest.doMock('../../src/services/drctService', () => ({
      cancelOrder: jest.fn()
    }));
    jest.doMock('../../src/services/drctDirectClient', () => ({}));
    jest.doMock('../../src/services/customerProfile', () => ({
      saveCustomerProfile: jest.fn()
    }));

    const app = buildApp();
    const res = await request(app).get('/api/customer/orders?limit=100');

    expect(res.statusCode).toBe(200);
    expect(res.body.orders).toHaveLength(1);
    expect(eq).toHaveBeenCalledWith('contact_email', 'agent@agency.test');
    expect(eq).not.toHaveBeenCalledWith('user_id', 'user-1');
    expect(or).not.toHaveBeenCalled();
  });
});
