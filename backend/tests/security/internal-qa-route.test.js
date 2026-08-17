const express = require('express');
const request = require('supertest');

function jsonApp(router) {
  const app = express();
  app.use(express.json());
  app.use(router);
  return app;
}

describe('internal QA route protection', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test('requires internal token before issuing a QA ticket', async () => {
    jest.doMock('../../src/config', () => ({
      config: {
        internalQaEnabled: true
      }
    }));
    jest.doMock('../../src/middleware/auth', () => ({
      requireInternalToken: (req, res) => {
        if (req.headers['x-internal-token'] === 'secret-token') return true;
        res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid internal token' } });
        return false;
      },
      resolveAuthContext: jest.fn(),
      ensureAdmin: jest.fn()
    }));
    jest.doMock('../../src/services/internalQaTicketingService', () => ({
      resolveInternalQaRequestHost: jest.fn(() => 'admin.aviaframe.com'),
      isInternalQaHostAllowed: jest.fn(() => true),
      resolveRequestIp: jest.fn(() => '127.0.0.1'),
      issueOrderWithoutPayment: jest.fn(),
      cancelIssuedOrder: jest.fn(),
      listActiveIssuedTickets: jest.fn()
    }));

    const router = require('../../src/routes/internalQa');
    const app = jsonApp(router);
    const res = await request(app).post('/orders/order-1/issue-without-payment').send({});

    expect(res.statusCode).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  test('blocks non-allowlisted hosts even for admins', async () => {
    jest.doMock('../../src/config', () => ({
      config: {
        internalQaEnabled: true
      }
    }));
    jest.doMock('../../src/middleware/auth', () => ({
      requireInternalToken: jest.fn(() => true),
      resolveAuthContext: jest.fn().mockResolvedValue({
        user: { email: 'ops@aviaframe.com' },
        profile: { id: '11111111-1111-1111-1111-111111111111', role: 'admin' }
      }),
      ensureAdmin: jest.fn(() => true)
    }));
    jest.doMock('../../src/services/internalQaTicketingService', () => ({
      resolveInternalQaRequestHost: jest.fn(() => 'public.aviaframe.com'),
      isInternalQaHostAllowed: jest.fn(() => false),
      resolveRequestIp: jest.fn(() => '127.0.0.1'),
      issueOrderWithoutPayment: jest.fn(),
      cancelIssuedOrder: jest.fn(),
      listActiveIssuedTickets: jest.fn()
    }));

    const router = require('../../src/routes/internalQa');
    const app = jsonApp(router);
    const res = await request(app)
      .get('/active-tickets')
      .set('x-internal-token', 'secret-token')
      .set('authorization', 'Bearer test-auth');

    expect(res.statusCode).toBe(403);
    expect(res.body.error.code).toBe('INTERNAL_QA_HOST_NOT_ALLOWED');
  });

  test('allows issue endpoint for admin + token + allowlisted host', async () => {
    const issueOrderWithoutPayment = jest.fn().mockResolvedValue({
      order_id: 'order-3',
      order_number: 'AVF-3003',
      run: { id: 'run-3', status: 'issued' }
    });

    jest.doMock('../../src/config', () => ({
      config: {
        internalQaEnabled: true
      }
    }));
    jest.doMock('../../src/middleware/auth', () => ({
      requireInternalToken: jest.fn(() => true),
      resolveAuthContext: jest.fn().mockResolvedValue({
        user: { email: 'ops@aviaframe.com' },
        profile: { id: '11111111-1111-1111-1111-111111111111', role: 'admin' }
      }),
      ensureAdmin: jest.fn(() => true)
    }));
    jest.doMock('../../src/services/internalQaTicketingService', () => ({
      resolveInternalQaRequestHost: jest.fn(() => 'admin.aviaframe.com'),
      isInternalQaHostAllowed: jest.fn(() => true),
      resolveRequestIp: jest.fn(() => '127.0.0.1'),
      issueOrderWithoutPayment,
      cancelIssuedOrder: jest.fn(),
      listActiveIssuedTickets: jest.fn()
    }));

    const router = require('../../src/routes/internalQa');
    const app = jsonApp(router);
    const res = await request(app)
      .post('/orders/order-3/issue-without-payment')
      .set('x-internal-token', 'secret-token')
      .set('authorization', 'Bearer test-auth')
      .send({ reason: 'QA smoke' });

    expect(res.statusCode).toBe(200);
    expect(res.body.order_id).toBe('order-3');
    expect(issueOrderWithoutPayment).toHaveBeenCalledWith(expect.objectContaining({
      orderId: 'order-3',
      reason: 'QA smoke'
    }));
  });
});
