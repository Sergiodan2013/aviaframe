const express = require('express');
const request = require('supertest');

describe('payment card scheme check', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    delete process.env.MOYASAR_SECRET_KEY;
    delete process.env.MOYASAR_TEST_SECRET_KEY;
  });

  function buildOrdersTable(order) {
    const maybeSingle = jest.fn().mockResolvedValue({ data: order, error: null });
    const eq = jest.fn(() => ({ maybeSingle }));
    const select = jest.fn(() => ({ eq }));
    return { select };
  }

  test('returns verified pricing quote for Saudi-issued Visa cards', async () => {
    process.env.MOYASAR_SECRET_KEY = 'sk_live_main';

    const order = {
      id: 'order-1',
      order_number: 'AV-1001',
      total_price: 100,
      currency: 'SAR',
      payment_status: 'pending',
      metadata: {},
      raw_offer_data: {
        metadata: {
          origin_host: 'testenvavia.netlify.app'
        }
      }
    };

    const axiosPost = jest.fn().mockResolvedValue({
      data: {
        company: 'visa',
        issuer_country: 'SA',
        issuer_name: 'Saudi Bank',
        issuer_card_type: 'credit',
        issuer_card_category: 'classic',
        first_digits: '411111',
        last_digits: '1111'
      }
    });

    jest.doMock('axios', () => ({ post: axiosPost }));
    jest.doMock('../../src/lib/supabase', () => ({
      from: jest.fn((table) => {
        if (table === 'orders') return buildOrdersTable(order);
        throw new Error(`Unexpected table ${table}`);
      })
    }));

    const router = require('../../src/routes/payments');
    const app = express();
    app.use(router);

    const res = await request(app)
      .post('/api/payments/card-scheme-check')
      .send({
        order_id: 'order-1',
        card_number: '4111 1111 1111 1111'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.supported).toBe(true);
    expect(res.body.payment_pricing).toMatchObject({
      pricing_tier: 'local_credit_card',
      scheme: 'visa',
      issuer_country: 'SA',
      final_payable_amount: 104.31
    });
    expect(res.body.issuer).toMatchObject({
      company: 'visa',
      issuer_country: 'SA',
      issuer_name: 'Saudi Bank'
    });
    expect(axiosPost).toHaveBeenCalledWith(
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
  });

  test('rejects unsupported card schemes before payment initiation', async () => {
    process.env.MOYASAR_SECRET_KEY = 'sk_live_main';

    const order = {
      id: 'order-1',
      order_number: 'AV-1001',
      total_price: 100,
      currency: 'SAR',
      payment_status: 'pending',
      metadata: {},
      raw_offer_data: {
        metadata: {
          origin_host: 'testenvavia.netlify.app'
        }
      }
    };

    const axiosPost = jest.fn().mockResolvedValue({
      data: {
        company: 'amex',
        issuer_country: 'US',
        issuer_name: 'Amex'
      }
    });

    jest.doMock('axios', () => ({ post: axiosPost }));
    jest.doMock('../../src/lib/supabase', () => ({
      from: jest.fn((table) => {
        if (table === 'orders') return buildOrdersTable(order);
        throw new Error(`Unexpected table ${table}`);
      })
    }));

    const router = require('../../src/routes/payments');
    const app = express();
    app.use(router);

    const res = await request(app)
      .post('/api/payments/card-scheme-check')
      .send({
        order_id: 'order-1',
        card_number: '6011 1111 1111 1117'
      });

    expect(res.statusCode).toBe(409);
    expect(res.body.error).toMatchObject({
      code: 'card_not_supported'
    });
  });

  test('pins demo mada card to contract pricing during dry-run checkout', async () => {
    process.env.MOYASAR_SECRET_KEY = 'sk_live_main';

    const order = {
      id: 'order-2',
      order_number: 'AV-1002',
      total_price: 2719.28,
      currency: 'SAR',
      payment_status: 'pending',
      metadata: {},
      raw_offer_data: {
        metadata: {
          origin_host: 'aviaframe.com',
          dry_run_issue: true
        },
        pricing: {
          total_price: 2719.28,
          currency: 'SAR'
        }
      }
    };

    const axiosPost = jest.fn().mockResolvedValue({
      data: {
        company: 'visa',
        issuer_country: 'GB'
      }
    });

    jest.doMock('axios', () => ({ post: axiosPost }));
    jest.doMock('../../src/lib/supabase', () => ({
      from: jest.fn((table) => {
        if (table === 'orders') return buildOrdersTable(order);
        throw new Error(`Unexpected table ${table}`);
      })
    }));

    const router = require('../../src/routes/payments');
    const app = express();
    app.use(router);

    const res = await request(app)
      .post('/api/payments/card-scheme-check')
      .send({
        order_id: 'order-2',
        card_number: '4464 0000 0000 0007'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.supported).toBe(true);
    expect(res.body.payment_pricing).toMatchObject({
      pricing_tier: 'mada_local',
      scheme: 'mada',
      issuer_country: 'SA'
    });
    expect(res.body.issuer).toMatchObject({
      company: 'mada',
      issuer_country: 'SA',
      issuer_name: 'Demo mada Bank'
    });
    expect(axiosPost).not.toHaveBeenCalled();
  });
});
