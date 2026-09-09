const express = require('express');
const request = require('supertest');

describe('payment initiate dry-run demo flow', () => {
  let setImmediateSpy;

  beforeEach(() => {
    setImmediateSpy = jest.spyOn(global, 'setImmediate').mockImplementation(() => 0);
  });

  afterEach(() => {
    setImmediateSpy.mockRestore();
    jest.resetModules();
    jest.clearAllMocks();
    delete process.env.MOYASAR_SECRET_KEY;
  });

  test('bypasses Moyasar for dry_run_issue orders and marks order paid immediately', async () => {
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
          dry_run_issue: true,
          origin_host: 'aviaframe.com'
        }
      }
    };

    const maybeSingle = jest.fn().mockResolvedValue({ data: order, error: null });
    const eqSelect = jest.fn(() => ({ maybeSingle }));
    const select = jest.fn(() => ({ eq: eqSelect }));
    const updateEq = jest.fn().mockResolvedValue({ data: null, error: null });
    const update = jest.fn(() => ({ eq: updateEq }));
    const from = jest.fn((table) => {
      if (table !== 'orders') throw new Error(`Unexpected table ${table}`);
      return { select, update };
    });

    const axiosPost = jest.fn();

    jest.doMock('axios', () => ({
      post: axiosPost
    }));
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

    const payments = require('../../src/routes/payments');
    const app = express();
    app.use(payments);

    const res = await request(app)
      .post('/api/payments/initiate')
      .set('Origin', 'https://aviaframe.com')
      .send({
        order_id: 'order-1',
        return_url: 'https://aviaframe.com/booking.html?dry_run=1',
        card: {
          name: 'Demo User',
          number: '4111111111111111',
          month: '12',
          year: '26',
          cvc: '123'
        }
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('paid');
    expect(res.body.dry_run_issue).toBe(true);
    expect(res.body.payment_mode).toBe('demo');
    expect(axiosPost).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledWith(expect.objectContaining({
      payment_status: 'paid',
      status: 'confirmed',
      payment_method: 'online',
      metadata: expect.objectContaining({
        payment_return_url: 'https://aviaframe.com/booking.html?dry_run=1',
        payment_gateway: 'demo'
      })
    }));
    expect(setImmediateSpy).toHaveBeenCalled();
  });

  test('does not bypass Moyasar for dry_run_issue orders from non-demo hosts', async () => {
    process.env.MOYASAR_SECRET_KEY = 'live-secret';

    const order = {
      id: 'order-2',
      order_number: 'AV-1002',
      total_price: 100,
      currency: 'SAR',
      drct_order_id: 'drct-2',
      payment_status: 'pending',
      metadata: {},
      raw_offer_data: {
        metadata: {
          dry_run_issue: true,
          origin_host: 'agency.example.com'
        }
      }
    };

    const maybeSingle = jest.fn().mockResolvedValue({ data: order, error: null });
    const eqSelect = jest.fn(() => ({ maybeSingle }));
    const select = jest.fn(() => ({ eq: eqSelect }));
    const updateEq = jest.fn().mockResolvedValue({ data: null, error: null });
    const update = jest.fn(() => ({ eq: updateEq }));
    const from = jest.fn((table) => {
      if (table !== 'orders') throw new Error(`Unexpected table ${table}`);
      return { select, update };
    });

    const axiosPost = jest.fn()
      .mockResolvedValueOnce({
        data: {
          company: 'visa',
          issuer_country: 'SA',
          issuer_name: 'Live Visa Bank',
          issuer_card_type: 'credit',
          issuer_card_category: 'classic',
          first_digits: '411111',
          last_digits: '1111'
        }
      })
      .mockResolvedValueOnce({
        data: {
          id: 'pay_live_1',
          status: 'initiated',
          source: { transaction_url: 'https://moyasar.test/tx/pay_live_1' }
        }
      });

    jest.doMock('axios', () => ({
      post: axiosPost
    }));
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

    const payments = require('../../src/routes/payments');
    const app = express();
    app.use(payments);

    const res = await request(app)
      .post('/api/payments/initiate')
      .set('Origin', 'https://agency.example.com')
      .send({
        order_id: 'order-2',
        return_url: 'https://agency.example.com/booking.html?dry_run=1',
        card: {
          name: 'Real User',
          number: '4111111111111111',
          month: '12',
          year: '26',
          cvc: '123'
        }
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('initiated');
    expect(res.body.dry_run_issue).toBeUndefined();
    expect(res.body.transaction_url).toBe('https://moyasar.test/tx/pay_live_1');
    expect(axiosPost).toHaveBeenCalledTimes(2);
    expect(update).toHaveBeenCalledWith(expect.objectContaining({
      payment_method: 'online'
    }));
    expect(setImmediateSpy).not.toHaveBeenCalled();
  });

  test('honors a server-authorized demo order from an agency host', async () => {
    const order = {
      id: 'order-3',
      order_number: 'AV-1003',
      total_price: 100,
      currency: 'SAR',
      drct_order_id: 'drct-3',
      payment_status: 'pending',
      metadata: {},
      raw_offer_data: {
        metadata: {
          dry_run_issue: true,
          dry_run_authorized: true,
          origin_host: 'new-agency.aviaframe.com'
        }
      }
    };

    const maybeSingle = jest.fn().mockResolvedValue({ data: order, error: null });
    const select = jest.fn(() => ({ eq: jest.fn(() => ({ maybeSingle })) }));
    const update = jest.fn(() => ({ eq: jest.fn().mockResolvedValue({ data: null, error: null }) }));
    const from = jest.fn(() => ({ select, update }));
    const axiosPost = jest.fn();

    jest.doMock('axios', () => ({ post: axiosPost }));
    jest.doMock('../../src/lib/supabase', () => ({ from }));
    jest.doMock('../../src/services/drctService', () => ({ issueOrder: jest.fn() }));
    jest.doMock('../../src/services/emailService', () => ({ sendTicketEmail: jest.fn() }));
    jest.doMock('../../src/services/orderService', () => ({ ensureTicketPdfForOrder: jest.fn() }));
    jest.doMock('../../src/config', () => ({ config: { documentsBucket: 'documents' } }));

    const payments = require('../../src/routes/payments');
    const app = express();
    app.use(payments);

    const res = await request(app)
      .post('/api/payments/initiate')
      .set('Origin', 'https://new-agency.aviaframe.com')
      .send({
        order_id: 'order-3',
        card: { name: 'Demo User', number: '4111111111111111', month: '12', year: '26', cvc: '123' }
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.payment_mode).toBe('demo');
    expect(axiosPost).not.toHaveBeenCalled();
  });
});
