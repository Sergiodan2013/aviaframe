const crypto = require('crypto');
const express = require('express');
const request = require('supertest');

describe('Moyasar webhook controls', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    delete process.env.MOYASAR_WEBHOOK_SECRET;
    delete process.env.MOYASAR_TEST_WEBHOOK_SECRET;
  });

  test('rejects webhook when verification secret is not configured', async () => {
    const supabaseFrom = jest.fn();
    jest.doMock('../../src/lib/supabase', () => ({
      from: supabaseFrom
    }));
    jest.doMock('../../src/services/drctService', () => ({
      issueOrder: jest.fn()
    }));
    jest.doMock('../../src/services/emailService', () => ({
      sendTicketEmail: jest.fn()
    }));
    jest.doMock('../../src/services/orderService', () => ({
      ensureTicketPdfForOrder: jest.fn()
    }));
    jest.doMock('../../src/config', () => ({
      config: { nodeEnv: 'test' }
    }));

    const router = require('../../src/routes/payments');
    const app = express();
    app.use(express.json());
    app.use(router);

    const res = await request(app)
      .post('/api/webhooks/moyasar')
      .send({ id: 'pay_1', status: 'paid' });

    expect(res.statusCode).toBe(503);
    expect(res.body.error.code).toBe('WEBHOOK_NOT_CONFIGURED');
    expect(supabaseFrom).not.toHaveBeenCalled();
  });

  test('rejects invalid webhook signature when secret is configured', async () => {
    process.env.MOYASAR_WEBHOOK_SECRET = 'test-secret';

    const supabaseFrom = jest.fn();
    jest.doMock('../../src/lib/supabase', () => ({
      from: supabaseFrom
    }));
    jest.doMock('../../src/services/drctService', () => ({
      issueOrder: jest.fn()
    }));
    jest.doMock('../../src/services/emailService', () => ({
      sendTicketEmail: jest.fn()
    }));
    jest.doMock('../../src/services/orderService', () => ({
      ensureTicketPdfForOrder: jest.fn()
    }));
    jest.doMock('../../src/config', () => ({
      config: { nodeEnv: 'test' }
    }));

    const router = require('../../src/routes/payments');
    const app = express();
    app.use(express.json());
    app.use(router);

    const res = await request(app)
      .post('/api/webhooks/moyasar')
      .set('x-moyasar-signature', 'deadbeef')
      .send({ id: 'pay_1', status: 'paid' });

    expect(res.statusCode).toBe(401);
    expect(res.body.error.code).toBe('INVALID_SIGNATURE');
    expect(supabaseFrom).not.toHaveBeenCalled();
  });

  test('accepts webhook when x-event-secret matches configured secret', async () => {
    process.env.MOYASAR_WEBHOOK_SECRET = 'test-secret';

    const updateEq = jest.fn();
    const update = jest.fn(() => ({ eq: updateEq }));
    const limit = jest.fn().mockResolvedValue({
      data: [{
        id: 'order-1',
        order_number: 'AV-1001',
        payment_status: 'paid',
        drct_order_id: 'drct-1',
        contact_email: 'ops@example.com',
        origin: 'RUH',
        destination: 'JED',
        departure_time: '2026-06-10T10:00:00.000Z',
        currency: 'SAR',
        total_price: 100,
        agency_id: 'agency-1'
      }]
    });
    const filter = jest.fn(() => ({ limit }));
    const select = jest.fn(() => ({ filter }));
    const from = jest.fn((table) => {
      if (table !== 'orders') throw new Error(`Unexpected table ${table}`);
      return { select, update };
    });

    jest.doMock('../../src/lib/supabase', () => ({
      from
    }));
    jest.doMock('../../src/services/drctService', () => ({
      issueOrder: jest.fn()
    }));
    jest.doMock('../../src/services/emailService', () => ({
      sendTicketEmail: jest.fn()
    }));
    jest.doMock('../../src/services/orderService', () => ({
      ensureTicketPdfForOrder: jest.fn()
    }));
    jest.doMock('../../src/config', () => ({
      config: { nodeEnv: 'test' }
    }));

    const router = require('../../src/routes/payments');
    const app = express();
    app.use(express.json());
    app.use(router);

    const res = await request(app)
      .post('/api/webhooks/moyasar')
      .set('x-event-secret', 'test-secret')
      .send({ id: 'pay_1', status: 'paid' });

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ received: true, skipped: true });
    expect(from).toHaveBeenCalledWith('orders');
    expect(update).not.toHaveBeenCalled();
    expect(updateEq).not.toHaveBeenCalled();
  });

  test('accepts webhook when x-event-secret matches configured test secret', async () => {
    process.env.MOYASAR_WEBHOOK_SECRET = 'live-secret';
    process.env.MOYASAR_TEST_WEBHOOK_SECRET = 'test-secret';

    const updateEq = jest.fn();
    const update = jest.fn(() => ({ eq: updateEq }));
    const limit = jest.fn().mockResolvedValue({
      data: [{
        id: 'order-1',
        order_number: 'AV-1001',
        payment_status: 'paid',
        drct_order_id: 'drct-1',
        contact_email: 'ops@example.com',
        origin: 'RUH',
        destination: 'JED',
        departure_time: '2026-08-10T10:00:00.000Z',
        currency: 'SAR',
        total_price: 100,
        agency_id: 'agency-1'
      }]
    });
    const filter = jest.fn(() => ({ limit }));
    const select = jest.fn(() => ({ filter }));
    const from = jest.fn((table) => {
      if (table !== 'orders') throw new Error(`Unexpected table ${table}`);
      return { select, update };
    });

    jest.doMock('../../src/lib/supabase', () => ({
      from
    }));
    jest.doMock('../../src/services/drctService', () => ({
      issueOrder: jest.fn()
    }));
    jest.doMock('../../src/services/emailService', () => ({
      sendTicketEmail: jest.fn()
    }));
    jest.doMock('../../src/services/orderService', () => ({
      ensureTicketPdfForOrder: jest.fn()
    }));
    jest.doMock('../../src/config', () => ({
      config: { nodeEnv: 'test' }
    }));

    const router = require('../../src/routes/payments');
    const app = express();
    app.use(express.json());
    app.use(router);

    const res = await request(app)
      .post('/api/webhooks/moyasar')
      .set('x-event-secret', 'test-secret')
      .send({ id: 'pay_test_1', status: 'paid' });

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ received: true, skipped: true });
    expect(from).toHaveBeenCalledWith('orders');
    expect(update).not.toHaveBeenCalled();
    expect(updateEq).not.toHaveBeenCalled();
  });

  test('skips duplicate paid webhook for already-paid order', async () => {
    process.env.MOYASAR_WEBHOOK_SECRET = 'test-secret';

    const updateEq = jest.fn();
    const update = jest.fn(() => ({ eq: updateEq }));
    const limit = jest.fn().mockResolvedValue({
      data: [{
        id: 'order-1',
        order_number: 'AV-1001',
        payment_status: 'paid',
        drct_order_id: 'drct-1',
        contact_email: 'ops@example.com',
        origin: 'RUH',
        destination: 'JED',
        departure_time: '2026-06-10T10:00:00.000Z',
        currency: 'SAR',
        total_price: 100,
        agency_id: 'agency-1'
      }]
    });
    const filter = jest.fn(() => ({ limit }));
    const select = jest.fn(() => ({ filter }));
    const from = jest.fn((table) => {
      if (table !== 'orders') throw new Error(`Unexpected table ${table}`);
      return { select, update };
    });

    jest.doMock('../../src/lib/supabase', () => ({
      from
    }));
    jest.doMock('../../src/services/drctService', () => ({
      issueOrder: jest.fn()
    }));
    jest.doMock('../../src/services/emailService', () => ({
      sendTicketEmail: jest.fn()
    }));
    jest.doMock('../../src/services/orderService', () => ({
      ensureTicketPdfForOrder: jest.fn()
    }));
    jest.doMock('../../src/config', () => ({
      config: { nodeEnv: 'test' }
    }));

    const router = require('../../src/routes/payments');
    const app = express();
    app.use(express.json());
    app.use(router);

    const payload = { id: 'pay_1', status: 'paid' };
    const signature = crypto
      .createHmac('sha256', 'test-secret')
      .update(Buffer.from(JSON.stringify(payload)))
      .digest('hex');

    const res = await request(app)
      .post('/api/webhooks/moyasar')
      .set('x-moyasar-signature', signature)
      .send(payload);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ received: true, skipped: true });
    expect(from).toHaveBeenCalledWith('orders');
    expect(update).not.toHaveBeenCalled();
    expect(updateEq).not.toHaveBeenCalled();
  });
});
