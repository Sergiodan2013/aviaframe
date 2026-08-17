const express = require('express');
const request = require('supertest');

describe('Moyasar mode routing for testenv sandbox bookings', () => {
  function buildOrdersTable(order) {
    const maybeSingle = jest.fn().mockResolvedValue({ data: order, error: null });
    const single = jest.fn().mockResolvedValue({ data: order, error: null });
    const eq = jest.fn(() => ({ maybeSingle, single }));
    const limit = jest.fn().mockResolvedValue({ data: [order], error: null });
    const filter = jest.fn(() => ({ limit }));
    const select = jest.fn(() => ({ eq, filter }));
    const updateEq = jest.fn().mockResolvedValue({ data: null, error: null });
    const update = jest.fn(() => ({ eq: updateEq }));
    return { select, update };
  }

  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    delete process.env.MOYASAR_SECRET_KEY;
    delete process.env.MOYASAR_TEST_SECRET_KEY;
    delete process.env.APP_URL;
  });

  test('initiate uses Moyasar live credentials for testenv orders', async () => {
    process.env.MOYASAR_SECRET_KEY = 'sk_live_main';
    process.env.MOYASAR_TEST_SECRET_KEY = 'sk_test_sandbox';

    const order = {
      id: 'order-1',
      order_number: 'AV-1001',
      total_price: 100,
      currency: 'SAR',
      drct_order_id: 'drct-1',
      payment_status: 'pending',
      metadata: {},
      raw_offer_data: {
        metadata: {
          origin_host: 'testenvavia.netlify.app'
        }
      }
    };

    const from = jest.fn((table) => {
      if (table === 'orders') return buildOrdersTable(order);
      throw new Error(`Unexpected table ${table}`);
    });

    const axiosPost = jest.fn().mockResolvedValue({
      data: {}
    });
    axiosPost
      .mockResolvedValueOnce({
        data: {
          company: 'visa',
          issuer_country: 'SA',
          issuer_name: 'Saudi Bank',
          issuer_card_type: 'credit',
          first_digits: '411111',
          last_digits: '1111'
        }
      })
      .mockResolvedValueOnce({
        data: {
          id: 'pay_test_1',
          status: 'initiated',
          source: { transaction_url: 'https://moyasar.test/tx/pay_test_1', company: 'visa', issuer_country: 'SA' }
        }
      });

    jest.doMock('axios', () => ({
      post: axiosPost
    }));
    jest.doMock('../../src/lib/supabase', () => ({ from }));
    jest.doMock('../../src/services/drctService', () => ({
      issueOrder: jest.fn().mockResolvedValue({
        pnr: 'PNR123',
        ticket_number: '1761234567890'
      }),
      getOrderDetails: jest.fn().mockResolvedValue({
        locator: 'PNR123',
        airline_locators: [{ locator: 'AIR123' }],
        tickets: [{ number: '1761234567890' }]
      })
    }));
    jest.doMock('../../src/services/emailService', () => ({
      sendTicketEmail: jest.fn().mockResolvedValue({ sent: false })
    }));
    jest.doMock('../../src/services/orderService', () => ({
      ensureTicketPdfForOrder: jest.fn().mockResolvedValue({ doc: null, issuance: null })
    }));
    jest.doMock('../../src/config', () => ({
      config: { documentsBucket: 'documents' }
    }));

    const router = require('../../src/routes/payments');
    const app = express();
    app.use(router);

    const res = await request(app)
      .post('/api/payments/initiate')
      .set('Origin', 'https://testenvavia.netlify.app')
      .send({
        order_id: 'order-1',
        return_url: 'https://testenvavia.netlify.app/booking.html',
        card: {
          name: 'Sandbox User',
          number: '4111111111111111',
          month: '12',
          year: '30',
          cvc: '123'
        }
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.payment_id).toBe('pay_test_1');
    expect(axiosPost).toHaveBeenNthCalledWith(
      1,
      'https://api.moyasar.com/v1/source/issuer',
      {
        source: {
          type: 'creditcard',
          number: '4111111111111111'
        }
      },
      expect.objectContaining({
        auth: { username: 'sk_live_main', password: '' }
      })
    );
    expect(axiosPost).toHaveBeenCalledWith(
      'https://api.moyasar.com/v1/payments',
      expect.objectContaining({
        amount: 10431
      }),
      expect.objectContaining({
        auth: { username: 'sk_live_main', password: '' }
      })
    );
  });

  test('callback verifies testenv payments with Moyasar live credentials', async () => {
    process.env.APP_URL = 'https://admin.aviaframe.com';
    process.env.MOYASAR_SECRET_KEY = 'sk_live_main';
    process.env.MOYASAR_TEST_SECRET_KEY = 'sk_test_sandbox';

    const axiosGet = jest.fn().mockResolvedValue({
      data: { id: 'pay_test_1', status: 'paid' }
    });

    const order = {
      id: 'order-1',
      order_number: 'AV-1001',
      drct_order_id: 'drct-1',
      payment_status: 'pending',
      contact_email: 'ops@example.com',
      origin: 'RUH',
      destination: 'JED',
      departure_time: '2026-08-10T10:00:00.000Z',
      currency: 'SAR',
      total_price: 100,
      metadata: {
        payment_return_url: 'https://testenvavia.netlify.app/booking.html'
      },
      raw_offer_data: {
        metadata: {
          origin_host: 'testenvavia.netlify.app'
        }
      }
    };
    const from = jest.fn((table) => {
      if (table === 'orders') return buildOrdersTable(order);
      throw new Error(`Unexpected table ${table}`);
    });

    jest.doMock('axios', () => ({
      get: axiosGet
    }));
    jest.doMock('../../src/lib/supabase', () => ({ from }));
    jest.doMock('../../src/services/drctService', () => ({
      issueOrder: jest.fn().mockResolvedValue({
        pnr: 'PNR123',
        ticket_number: '1761234567890'
      }),
      getOrderDetails: jest.fn().mockResolvedValue({
        locator: 'PNR123',
        airline_locators: [{ locator: 'AIR123' }],
        tickets: [{ number: '1761234567890' }]
      })
    }));
    jest.doMock('../../src/services/emailService', () => ({
      sendTicketEmail: jest.fn().mockResolvedValue({ sent: false })
    }));
    jest.doMock('../../src/services/orderService', () => ({
      ensureTicketPdfForOrder: jest.fn().mockResolvedValue({ doc: null, issuance: null })
    }));
    jest.doMock('../../src/config', () => ({
      config: { documentsBucket: 'documents' }
    }));

    const router = require('../../src/routes/payments');
    const app = express();
    app.use(router);

    const res = await request(app).get('/api/payments/callback?id=pay_test_1');

    expect(res.statusCode).toBe(302);
    expect(axiosGet).toHaveBeenCalledWith(
      'https://api.moyasar.com/v1/payments/pay_test_1',
      expect.objectContaining({
        auth: { username: 'sk_live_main', password: '' }
      })
    );
    expect(res.headers.location).toBe(
      'https://testenvavia.netlify.app/booking.html?payment_result=success&order_id=order-1'
    );
  });
});
