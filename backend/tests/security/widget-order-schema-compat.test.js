const express = require('express');
const request = require('supertest');

describe('widget order schema compatibility', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test('retries widget order creation without markup_amount when staging schema lags', async () => {
    const agency = {
      id: 'agency-1',
      name: 'AviaFrame Demo',
      domain: null,
      contact_email: 'demo@example.com',
      contact_phone: '+966500000000',
      is_active: true,
      settings: {
        payment_methods: ['online'],
        payment_mode: 'live',
        widget_allowed_domains: ['aviaframe.com']
      }
    };

    const createdOrder = {
      id: 'order-1',
      order_number: 'AV-1001',
      agency_id: 'agency-1',
      status: 'pending'
    };

    const agencySingle = jest.fn().mockResolvedValue({ data: agency, error: null });
    const agencyEq = jest.fn(() => ({ single: agencySingle }));
    const agencySelect = jest.fn(() => ({ eq: agencyEq }));

    const createdOrderSingle = jest.fn()
      .mockResolvedValueOnce({
        data: null,
        error: { message: "Could not find the 'markup_amount' column of 'orders' in the schema cache" }
      })
      .mockResolvedValueOnce({
        data: createdOrder,
        error: null
      });

    const insertPayloads = [];
    const ordersInsert = jest.fn((payload) => {
      insertPayloads.push(payload);
      return {
        select: jest.fn(() => ({
          single: createdOrderSingle
        }))
      };
    });
    const ordersFrom = { insert: ordersInsert };

    const passengersInsert = jest.fn().mockResolvedValue({ error: null });

    const ordersDeleteEq = jest.fn().mockResolvedValue({ error: null });
    const ordersDelete = jest.fn(() => ({ eq: ordersDeleteEq }));

    const from = jest.fn((table) => {
      if (table === 'agencies') return { select: agencySelect };
      if (table === 'orders') return { ...ordersFrom, delete: ordersDelete };
      if (table === 'passengers') return { insert: passengersInsert };
      throw new Error(`Unexpected table ${table}`);
    });

    jest.doMock('../../src/lib/supabase', () => ({ from }));
    jest.doMock('../../src/utils/helpers', () => ({
      normalizeHost: (value) => String(value || '').trim().toLowerCase(),
      getRequestOriginHost: () => 'aviaframe.com',
      isWidgetOriginAllowed: () => true,
      issueWidgetToken: () => 'widget-token',
      parseWidgetToken: () => ({
        payload: {
          agency_id: 'agency-1',
          origin_host: 'aviaframe.com'
        }
      }),
      generateOrderNumber: () => 'AV-1001'
    }));
    jest.doMock('../../src/config', () => ({
      config: { nodeEnv: 'test' },
      VALID_PAYMENT_METHODS: ['online', 'cash', 'invoice', 'tamara'],
      ORDERS_LIST_COLUMNS: 'id,order_number,agency_id,status'
    }));
    jest.doMock('../../src/services/emailService', () => ({
      sendOrderConfirmation: jest.fn()
    }));

    const router = require('../../src/routes/widget');
    const app = express();
    app.use(express.json());
    app.use(router);

    const res = await request(app)
      .post('/api/widget/orders')
      .set('Authorization', 'Bearer widget-token')
      .send({
        payment_method: 'online',
        contacts: { email: 'traveler@example.com', phone: '+966500000001' },
        offer: {
          origin: 'RUH',
          destination: 'JED',
          departure_time: '2026-07-10T10:00:00.000Z',
          arrival_time: '2026-07-10T12:00:00.000Z',
          airline_code: 'SV',
          airline_name: 'Saudia',
          flight_number: 'SV101',
          currency: 'SAR'
        },
        pricing: {
          base_price: 120,
          taxes: 30,
          baggage_price: 0,
          markup_amount: 15,
          total_price: 150,
          currency: 'SAR'
        },
        passengers: [{
          type: 'ADT',
          first_name: 'Omar',
          last_name: 'Saleh',
          date_of_birth: '1990-01-01',
          gender: 'male',
          document: {
            type: 'passport',
            number: 'P1234567',
            expiry_date: '2030-01-01',
            issuing_country: 'SA'
          }
        }],
        metadata: { origin_host: 'aviaframe.com' }
      });

    expect(res.statusCode).toBe(201);
    expect(insertPayloads).toHaveLength(2);
    expect(insertPayloads[0]).toHaveProperty('markup_amount', 15);
    expect(insertPayloads[1]).not.toHaveProperty('markup_amount');
  });

  test('uses DRCT passenger ids returned by OfferPrice when creating sandbox order', async () => {
    const agency = {
      id: 'agency-1',
      name: 'Sandbox Demo',
      domain: null,
      contact_email: 'demo@example.com',
      contact_phone: '+966500000000',
      is_active: true,
      settings: {
        payment_methods: ['online'],
        payment_mode: 'live',
        widget_allowed_domains: ['sandbox.aviaframe.com']
      }
    };

    const createdOrder = {
      id: 'order-1',
      order_number: 'AV-1002',
      agency_id: 'agency-1',
      status: 'pending'
    };

    const updatedOrder = {
      ...createdOrder,
      drct_order_id: 'drct-order-1'
    };

    const agencySingle = jest.fn().mockResolvedValue({ data: agency, error: null });
    const agencyEq = jest.fn(() => ({ single: agencySingle }));
    const agencySelect = jest.fn(() => ({ eq: agencyEq }));

    const createdOrderSingle = jest.fn().mockResolvedValue({
      data: createdOrder,
      error: null
    });
    const updatedOrderSingle = jest.fn().mockResolvedValue({
      data: updatedOrder,
      error: null
    });

    const ordersInsert = jest.fn(() => ({
      select: jest.fn(() => ({
        single: createdOrderSingle
      }))
    }));
    const ordersUpdateEq = jest.fn(() => ({
      select: jest.fn(() => ({
        single: updatedOrderSingle
      }))
    }));
    const ordersUpdate = jest.fn(() => ({
      eq: ordersUpdateEq
    }));
    const ordersDeleteEq = jest.fn().mockResolvedValue({ error: null });
    const ordersDelete = jest.fn(() => ({ eq: ordersDeleteEq }));

    const passengersInsert = jest.fn().mockResolvedValue({ error: null });
    const passengersDeleteEq = jest.fn().mockResolvedValue({ error: null });
    const passengersDelete = jest.fn(() => ({ eq: passengersDeleteEq }));

    const from = jest.fn((table) => {
      if (table === 'agencies') return { select: agencySelect };
      if (table === 'orders') return { insert: ordersInsert, update: ordersUpdate, delete: ordersDelete };
      if (table === 'passengers') return { insert: passengersInsert, delete: passengersDelete };
      throw new Error(`Unexpected table ${table}`);
    });

    const priceOffer = jest.fn().mockResolvedValue({
      offer_id: 'LO_PRICED_1',
      price: {
        total: 875,
        currency: 'SAR',
        breakdown: {
          taxes: 75
        }
      },
      passengers: [
        { id: 'PAX-ADT-1', type: 'ADT' }
      ],
      flights: [],
      timestamp: '2026-07-23T10:00:00.000Z'
    });
    const createOrder = jest.fn().mockResolvedValue({
      order_id: 'drct-order-1'
    });

    jest.doMock('../../src/lib/supabase', () => ({ from }));
    jest.doMock('../../src/lib/logger', () => ({
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    }));
    jest.doMock('../../src/services/drctDirectClient', () => ({
      priceOffer,
      createOrder
    }));
    jest.doMock('../../src/utils/helpers', () => ({
      normalizeHost: (value) => String(value || '').trim().toLowerCase(),
      getRequestOriginHost: () => 'sandbox.aviaframe.com',
      isWidgetOriginAllowed: () => true,
      issueWidgetToken: () => 'widget-token',
      parseWidgetToken: () => ({
        payload: {
          agency_id: 'agency-1',
          origin_host: 'sandbox.aviaframe.com'
        }
      }),
      generateOrderNumber: () => 'AV-1002'
    }));
    jest.doMock('../../src/config', () => ({
      config: { nodeEnv: 'test' },
      VALID_PAYMENT_METHODS: ['online', 'cash', 'invoice', 'tamara'],
      ORDERS_LIST_COLUMNS: 'id,order_number,agency_id,status,drct_order_id'
    }));
    jest.doMock('../../src/services/emailService', () => ({
      sendOrderConfirmation: jest.fn()
    }));

    const router = require('../../src/routes/widget');
    const app = express();
    app.use(express.json());
    app.use(router);

    const res = await request(app)
      .post('/api/widget/orders')
      .set('Authorization', 'Bearer widget-token')
      .send({
        payment_method: 'online',
        contacts: { email: 'traveler@example.com', phone: '+966500000001' },
        offer: {
          offer_id: 'LO_123',
          origin: 'WAW',
          destination: 'MXP',
          departure_time: '2026-07-30T16:40:00.000Z',
          arrival_time: '2026-07-30T18:55:00.000Z',
          airline_code: 'LO',
          airline_name: 'LOT',
          flight_number: 'LO321',
          currency: 'SAR',
          price: {
            total: 850,
            currency: 'SAR'
          }
        },
        pricing: {
          base_price: 775,
          taxes: 75,
          baggage_price: 0,
          total_price: 850,
          currency: 'SAR'
        },
        passengers: [{
          type: 'ADT',
          first_name: 'Sergii',
          last_name: 'Danyliuk',
          date_of_birth: '1990-01-01',
          gender: 'male',
          nationality: 'UA',
          document: {
            type: 'passport',
            number: 'ER123456',
            expiry_date: '2030-01-01',
            issuing_country: 'UA'
          }
        }],
        metadata: { origin_host: 'sandbox.aviaframe.com' }
      });

    expect(res.statusCode).toBe(201);
    expect(priceOffer).toHaveBeenCalledWith(expect.objectContaining({
      offer_id: 'LO_123',
      passengers: [
        expect.objectContaining({
          id: 'T1',
          type: 'ADT',
          individual: expect.objectContaining({
            first_name: 'Sergii',
            last_name: 'Danyliuk',
            title: 'Mr',
            gender: 'M',
            date_of_birth: '1990-01-01'
          })
        })
      ]
    }), expect.any(Object));
    expect(createOrder).toHaveBeenCalledWith(expect.objectContaining({
      offer_id: 'LO_PRICED_1',
      passengers: [
        expect.objectContaining({
          id: 'PAX-ADT-1',
          type: 'ADT',
          individual: expect.objectContaining({
            title: 'Mr',
            gender: 'M'
          }),
          email: 'traveler@example.com',
          phone: '+966500000001'
        })
      ]
    }), expect.any(Object));
    expect(res.body.order).toEqual(expect.objectContaining({
      id: 'order-1',
      drct_order_id: 'drct-order-1'
    }));
  });

  test('ignores client dry_run_issue for non-demo hosts and still creates a live DRCT order', async () => {
    const agency = {
      id: 'agency-1',
      name: 'Agency Live',
      domain: null,
      contact_email: 'demo@example.com',
      contact_phone: '+966500000000',
      is_active: true,
      settings: {
        payment_methods: ['online'],
        payment_mode: 'live',
        widget_allowed_domains: ['agency.example.com']
      }
    };

    const createdOrder = {
      id: 'order-1',
      order_number: 'AV-1003',
      agency_id: 'agency-1',
      status: 'pending'
    };

    const updatedOrder = {
      ...createdOrder,
      drct_order_id: 'drct-order-live-1'
    };

    const agencySingle = jest.fn().mockResolvedValue({ data: agency, error: null });
    const agencyEq = jest.fn(() => ({ single: agencySingle }));
    const agencySelect = jest.fn(() => ({ eq: agencyEq }));

    const createdOrderSingle = jest.fn().mockResolvedValue({
      data: createdOrder,
      error: null
    });
    const updatedOrderSingle = jest.fn().mockResolvedValue({
      data: updatedOrder,
      error: null
    });

    const insertPayloads = [];
    const ordersInsert = jest.fn((payload) => {
      insertPayloads.push(payload);
      return {
        select: jest.fn(() => ({
          single: createdOrderSingle
        }))
      };
    });
    const ordersUpdateEq = jest.fn(() => ({
      select: jest.fn(() => ({
        single: updatedOrderSingle
      }))
    }));
    const ordersUpdate = jest.fn(() => ({
      eq: ordersUpdateEq
    }));
    const ordersDeleteEq = jest.fn().mockResolvedValue({ error: null });
    const ordersDelete = jest.fn(() => ({ eq: ordersDeleteEq }));

    const passengersInsert = jest.fn().mockResolvedValue({ error: null });
    const passengersDeleteEq = jest.fn().mockResolvedValue({ error: null });
    const passengersDelete = jest.fn(() => ({ eq: passengersDeleteEq }));

    const from = jest.fn((table) => {
      if (table === 'agencies') return { select: agencySelect };
      if (table === 'orders') return { insert: ordersInsert, update: ordersUpdate, delete: ordersDelete };
      if (table === 'passengers') return { insert: passengersInsert, delete: passengersDelete };
      throw new Error(`Unexpected table ${table}`);
    });

    const createOrder = jest.fn().mockResolvedValue({
      order_id: 'drct-order-live-1'
    });

    jest.doMock('../../src/lib/supabase', () => ({ from }));
    jest.doMock('../../src/lib/logger', () => ({
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    }));
    jest.doMock('../../src/services/drctDirectClient', () => ({
      priceOffer: jest.fn(),
      createOrder
    }));
    jest.doMock('../../src/utils/helpers', () => ({
      normalizeHost: (value) => String(value || '').trim().toLowerCase(),
      getRequestOriginHost: () => 'agency.example.com',
      isWidgetOriginAllowed: () => true,
      issueWidgetToken: () => 'widget-token',
      parseWidgetToken: () => ({
        payload: {
          agency_id: 'agency-1',
          origin_host: 'agency.example.com'
        }
      }),
      generateOrderNumber: () => 'AV-1003'
    }));
    jest.doMock('../../src/config', () => ({
      config: { nodeEnv: 'test' },
      VALID_PAYMENT_METHODS: ['online', 'cash', 'invoice', 'tamara'],
      ORDERS_LIST_COLUMNS: 'id,order_number,agency_id,status,drct_order_id'
    }));
    jest.doMock('../../src/services/emailService', () => ({
      sendOrderConfirmation: jest.fn()
    }));

    const router = require('../../src/routes/widget');
    const app = express();
    app.use(express.json());
    app.use(router);

    const res = await request(app)
      .post('/api/widget/orders')
      .set('Authorization', 'Bearer widget-token')
      .send({
        payment_method: 'online',
        contacts: { email: 'traveler@example.com', phone: '+966500000001' },
        offer: {
          offer_id: 'SV_123',
          origin: 'RUH',
          destination: 'JED',
          departure_time: '2026-08-10T10:00:00.000Z',
          arrival_time: '2026-08-10T12:00:00.000Z',
          airline_code: 'SV',
          airline_name: 'Saudia',
          flight_number: 'SV101',
          currency: 'SAR',
          passengers: [
            { id: 'PAX-ADT-1', type: 'ADT' }
          ]
        },
        pricing: {
          base_price: 90,
          taxes: 10,
          baggage_price: 0,
          total_price: 100,
          currency: 'SAR'
        },
        passengers: [{
          type: 'ADT',
          first_name: 'Live',
          last_name: 'Traveler',
          date_of_birth: '1990-01-01',
          gender: 'male',
          nationality: 'SA',
          document: {
            type: 'passport',
            number: 'P1234567',
            expiry_date: '2030-01-01',
            issuing_country: 'SA'
          }
        }],
        metadata: {
          origin_host: 'agency.example.com',
          dry_run_issue: true,
          dry_run_reason: 'client-override'
        }
      });

    expect(res.statusCode).toBe(201);
    expect(createOrder).toHaveBeenCalledWith(expect.objectContaining({
      offer_id: 'SV_123',
      passengers: [
        expect.objectContaining({
          individual: expect.objectContaining({
            title: 'Mr',
            gender: 'M'
          })
        })
      ]
    }), expect.any(Object));
    expect(insertPayloads[0].raw_offer_data.metadata.dry_run_issue).toBeUndefined();
    expect(insertPayloads[0].raw_offer_data.metadata.dry_run_reason).toBeUndefined();
  });

  test('links widget order to authenticated customer session only when customer token is valid', async () => {
    const agency = {
      id: 'agency-1',
      name: 'Agency Live',
      domain: null,
      contact_email: 'demo@example.com',
      contact_phone: '+966500000000',
      is_active: true,
      settings: {
        payment_methods: ['online'],
        payment_mode: 'live',
        widget_allowed_domains: ['aviaframe.com']
      }
    };

    const createdOrder = {
      id: 'order-4',
      order_number: 'AV-1004',
      agency_id: 'agency-1',
      status: 'pending',
      user_id: 'user-profile-1'
    };

    const agencySingle = jest.fn().mockResolvedValue({ data: agency, error: null });
    const agencyEq = jest.fn(() => ({ single: agencySingle }));
    const agencySelect = jest.fn(() => ({ eq: agencyEq }));

    const createdOrderSingle = jest.fn().mockResolvedValue({
      data: createdOrder,
      error: null
    });

    const insertPayloads = [];
    const ordersInsert = jest.fn((payload) => {
      insertPayloads.push(payload);
      return {
        select: jest.fn(() => ({
          single: createdOrderSingle
        }))
      };
    });
    const passengersInsert = jest.fn().mockResolvedValue({ error: null });

    const from = jest.fn((table) => {
      if (table === 'agencies') return { select: agencySelect };
      if (table === 'orders') return { insert: ordersInsert };
      if (table === 'passengers') return { insert: passengersInsert };
      throw new Error(`Unexpected table ${table}`);
    });

    jest.doMock('../../src/lib/supabase', () => ({ from }));
    jest.doMock('../../src/middleware/auth', () => ({
      resolveAuthContextFromToken: jest.fn().mockResolvedValue({
        user: { id: 'user-auth-1', email: 'traveler@example.com' },
        profile: { id: 'user-profile-1', role: 'user', agency_id: null }
      })
    }));
    jest.doMock('../../src/utils/helpers', () => ({
      normalizeHost: (value) => String(value || '').trim().toLowerCase(),
      getRequestOriginHost: () => 'aviaframe.com',
      isWidgetOriginAllowed: () => true,
      issueWidgetToken: () => 'widget-token',
      parseWidgetToken: () => ({
        payload: {
          agency_id: 'agency-1',
          origin_host: 'aviaframe.com'
        }
      }),
      generateOrderNumber: () => 'AV-1004'
    }));
    jest.doMock('../../src/config', () => ({
      config: { nodeEnv: 'test' },
      VALID_PAYMENT_METHODS: ['online', 'cash', 'invoice', 'tamara'],
      ORDERS_LIST_COLUMNS: 'id,order_number,agency_id,status,user_id'
    }));
    jest.doMock('../../src/services/emailService', () => ({
      sendOrderConfirmation: jest.fn()
    }));

    const router = require('../../src/routes/widget');
    const app = express();
    app.use(express.json());
    app.use(router);

    const res = await request(app)
      .post('/api/widget/orders')
      .set('Authorization', 'Bearer widget-token')
      .set('X-Customer-Access-Token', 'customer-token-1')
      .send({
        user_id: 'user-profile-1',
        payment_method: 'online',
        contacts: { email: 'traveler@example.com', phone: '+966500000001' },
        offer: {
          origin: 'RUH',
          destination: 'JED',
          departure_time: '2026-07-10T10:00:00.000Z',
          arrival_time: '2026-07-10T12:00:00.000Z',
          airline_code: 'SV',
          airline_name: 'Saudia',
          flight_number: 'SV101',
          currency: 'SAR'
        },
        pricing: {
          base_price: 120,
          taxes: 30,
          baggage_price: 0,
          total_price: 150,
          currency: 'SAR'
        },
        passengers: [{
          type: 'ADT',
          first_name: 'Omar',
          last_name: 'Saleh',
          date_of_birth: '1990-01-01',
          gender: 'male',
          document: {
            type: 'passport',
            number: 'P1234567',
            expiry_date: '2030-01-01',
            issuing_country: 'SA'
          }
        }],
        metadata: { origin_host: 'aviaframe.com' }
      });

    expect(res.statusCode).toBe(201);
    expect(insertPayloads[0].user_id).toBe('user-profile-1');
  });
});
