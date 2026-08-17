const express = require('express');
const request = require('supertest');

describe('payment callback return URL routing', () => {
  let setImmediateSpy;

  beforeEach(() => {
    setImmediateSpy = jest.spyOn(global, 'setImmediate').mockImplementation(() => 0);
  });

  afterEach(() => {
    setImmediateSpy.mockRestore();
    jest.resetModules();
    jest.clearAllMocks();
    delete process.env.APP_URL;
  });

  test('redirects paid callback to stored booking return URL', async () => {
    process.env.APP_URL = 'https://admin.aviaframe.com';

    const axiosGet = jest.fn().mockResolvedValue({
      data: { id: 'pay_123', status: 'paid' }
    });
    jest.doMock('axios', () => ({
      get: axiosGet
    }));

    const updateEq = jest.fn();
    const update = jest.fn(() => ({ eq: updateEq }));
    const limit = jest.fn().mockResolvedValue({
      data: [{
        id: 'order-1',
        order_number: 'AV-1001',
        drct_order_id: 'drct-1',
        payment_status: 'pending',
        contact_email: 'ops@example.com',
        origin: 'RUH',
        destination: 'JED',
        departure_time: '2026-06-10T10:00:00.000Z',
        currency: 'SAR',
        total_price: 100,
        metadata: {
          payment_return_url: 'https://testenvavia.netlify.app/booking.html?dry_run=1'
        }
      }]
    });
    const filter = jest.fn(() => ({ limit }));
    const select = jest.fn(() => ({ filter }));
    const from = jest.fn((table) => {
      if (table !== 'orders') throw new Error(`Unexpected table ${table}`);
      return { select, update };
    });

    jest.doMock('../../src/lib/supabase', () => ({ from }));
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
      config: { documentsBucket: 'documents' }
    }));

    const router = require('../../src/routes/payments');
    const app = express();
    app.use(router);

    const res = await request(app).get('/api/payments/callback?id=pay_123');

    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe(
      'https://testenvavia.netlify.app/booking.html?dry_run=1&payment_result=success&order_id=order-1'
    );
    expect(axiosGet).toHaveBeenCalled();
    expect(update).toHaveBeenCalledWith(expect.objectContaining({
      payment_status: 'paid',
      status: 'confirmed'
    }));
  });

  test('falls back to APP_URL when stored return URL points to untrusted netlify host', async () => {
    process.env.APP_URL = 'https://admin.aviaframe.com';

    const axiosGet = jest.fn().mockResolvedValue({
      data: { id: 'pay_999', status: 'paid' }
    });
    jest.doMock('axios', () => ({
      get: axiosGet
    }));

    const updateEq = jest.fn();
    const update = jest.fn(() => ({ eq: updateEq }));
    const limit = jest.fn().mockResolvedValue({
      data: [{
        id: 'order-9',
        order_number: 'AV-1999',
        drct_order_id: 'drct-9',
        payment_status: 'pending',
        contact_email: 'ops@example.com',
        origin: 'RUH',
        destination: 'JED',
        departure_time: '2026-06-10T10:00:00.000Z',
        currency: 'SAR',
        total_price: 100,
        metadata: {
          payment_return_url: 'https://random-preview.netlify.app/booking.html'
        }
      }]
    });
    const filter = jest.fn(() => ({ limit }));
    const select = jest.fn(() => ({ filter }));
    const from = jest.fn((table) => {
      if (table !== 'orders') throw new Error(`Unexpected table ${table}`);
      return { select, update };
    });

    jest.doMock('../../src/lib/supabase', () => ({ from }));
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
      config: { documentsBucket: 'documents' }
    }));

    const router = require('../../src/routes/payments');
    const app = express();
    app.use(router);

    const res = await request(app).get('/api/payments/callback?id=pay_999');

    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe(
      'https://admin.aviaframe.com/?payment_result=success&order_id=order-9'
    );
    expect(axiosGet).toHaveBeenCalled();
  });
});
