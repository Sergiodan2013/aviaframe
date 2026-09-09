const express = require('express');
const request = require('supertest');

function buildApp() {
  const router = require('../../src/routes/orders');
  const app = express();
  app.use(express.json());
  app.use(router);
  return app;
}

describe('portal protected order actions', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test('creates portal order through protected backend route before payment', async () => {
    const ordersInsertSingle = jest.fn().mockResolvedValue({
      data: {
        id: 'order-portal-1',
        order_number: 'PORTAL1',
        user_id: 'user-portal-1',
        agency_id: null,
        drct_order_id: null,
        origin: 'KBP',
        destination: 'DXB',
        total_price: 1250,
        currency: 'UAH',
        status: 'pending',
        contact_email: 'traveler@example.com',
        contact_phone: '+380501112233'
      }
    });
    const ordersInsert = jest.fn(() => ({
      select: jest.fn(() => ({ single: ordersInsertSingle }))
    }));
    const ordersUpdateSingle = jest.fn().mockResolvedValue({
      data: {
        id: 'order-portal-1',
        order_number: 'PORTAL1',
        user_id: 'user-portal-1',
        agency_id: null,
        drct_order_id: 'DRCT-PORTAL-1',
        origin: 'KBP',
        destination: 'DXB',
        total_price: 1250,
        currency: 'UAH',
        status: 'pending',
        contact_email: 'traveler@example.com',
        contact_phone: '+380501112233'
      }
    });
    const ordersUpdateEq = jest.fn(() => ({
      select: jest.fn(() => ({ single: ordersUpdateSingle }))
    }));
    const ordersUpdate = jest.fn(() => ({ eq: ordersUpdateEq }));
    const passengersInsert = jest.fn().mockResolvedValue({});
    const drctCreateOrder = jest.fn().mockResolvedValue({
      order_id: 'DRCT-PORTAL-1',
      status: 'CREATED'
    });

    const from = jest.fn((table) => {
      if (table === 'orders') {
        return {
          insert: ordersInsert,
          update: ordersUpdate,
          delete: jest.fn(() => ({ eq: jest.fn().mockResolvedValue({}) }))
        };
      }
      if (table === 'passengers') {
        return {
          insert: passengersInsert,
          delete: jest.fn(() => ({ eq: jest.fn().mockResolvedValue({}) }))
        };
      }
      throw new Error(`Unexpected table ${table}`);
    });

    jest.doMock('../../src/lib/supabase', () => ({ from }));
    jest.doMock('../../src/config', () => ({
      config: { nodeEnv: 'test' },
      ORDERS_LIST_COLUMNS: 'id,order_number,user_id,agency_id,drct_order_id,origin,destination,total_price,currency,status,contact_email,contact_phone',
    }));
    jest.doMock('../../src/utils/helpers', () => ({
      isAdminRole: (role) => ['admin', 'super_admin'].includes(role),
      isAgentRole: (role) => role === 'agent',
      isStaffRole: (role) => ['admin', 'super_admin', 'agent'].includes(role),
      generateOrderNumber: () => 'PORTAL1',
    }));
    jest.doMock('../../src/middleware/auth', () => ({
      resolveAuthContext: jest.fn(async () => ({
        user: { id: 'user-portal-1', email: 'traveler@example.com' },
        profile: { id: 'user-portal-1', email: 'traveler@example.com', role: 'user', agency_id: null }
      })),
      forbidden: (res, message = 'Access denied') => res.status(403).json({ error: { code: 'FORBIDDEN', message } }),
      ensureStaff: jest.fn(() => true),
      canAccessOrder: jest.fn(async () => true),
    }));
    jest.doMock('../../src/services/orderService', () => ({
      ensureTicketPdfForOrder: jest.fn(),
      createSignedDocumentUrl: jest.fn(),
      issueDrctTicket: jest.fn(),
    }));
    jest.doMock('../../src/services/emailService', () => ({
      sendTicketEmail: jest.fn(),
    }));
    jest.doMock('../../src/services/drctService', () => ({
      cancelOrder: jest.fn(),
    }));
    jest.doMock('../../src/services/drctDirectClient', () => ({
      createOrder: drctCreateOrder,
    }));
    jest.doMock('uuid', () => ({ v4: () => 'idem-create-row-1' }));
    jest.doMock('../../src/services/supabaseClient', () => ({
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({ single: jest.fn().mockResolvedValue({ data: null }) }))
          }))
        })),
        insert: jest.fn().mockResolvedValue({}),
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({ catch: jest.fn() }))
          }))
        })),
      }))
    }), { virtual: true });

    const app = buildApp();
    const res = await request(app)
      .post('/api/orders')
      .send({
        offer_id: 'offer-123',
        contacts: {
          email: 'traveler@example.com',
          phone: '+380501112233'
        },
        offer: {
          origin: 'KBP',
          destination: 'DXB',
          departure_time: '2026-09-10T10:00:00Z',
          arrival_time: '2026-09-10T16:00:00Z',
          airline_code: 'PS',
          airline_name: 'UIA',
          flight_number: 'PS373'
        },
        pricing: {
          base_price: 1100,
          taxes: 100,
          baggage_price: 50,
          total_price: 1250,
          currency: 'UAH'
        },
        passengers: [
          {
            type: 'ADT',
            first_name: 'Ivan',
            last_name: 'Petrenko',
            date_of_birth: '1990-01-01',
            gender: 'M',
            document: {
              number: 'ER123456',
              expiry_date: '2030-01-01',
              issuing_country: 'UA'
            }
          }
        ],
        passenger_details: {
          passengers: [
            {
              type: 'ADT',
              first_name: 'Ivan',
              last_name: 'Petrenko',
              date_of_birth: '1990-01-01',
              nationality: 'UA',
              passport_number: 'ER123456',
              passport_expiry: '2030-01-01'
            }
          ]
        },
        raw_offer_data: {
          offer_id: 'offer-123',
          origin: 'KBP',
          destination: 'DXB',
          price: {
            total: 1200,
            taxes: 100,
            currency: 'UAH'
          }
        }
      });

    expect(res.statusCode).toBe(201);
    expect(drctCreateOrder).toHaveBeenCalledWith(expect.objectContaining({
      offer_id: 'offer-123',
      passengers: [
        expect.objectContaining({
          individual: expect.objectContaining({
            title: 'Mr',
            gender: 'M'
          }),
          email: 'traveler@example.com',
          phone: '+380501112233'
        })
      ]
    }), expect.objectContaining({
      idempotencyKey: 'portal-order-create-order-portal-1'
    }));
    expect(res.body.order_id).toBe('order-portal-1');
    expect(res.body.drct_order_id).toBe('DRCT-PORTAL-1');
  });

  test('issues ticket through protected backend route and scopes idempotency to order agency', async () => {
    const issueDrctTicket = jest.fn().mockResolvedValue({
      issuance: { id: 'iss-1' },
      doc: { id: 'doc-1' },
      url: 'https://files.example.com/ticket.pdf',
      pnr: 'PNR-123',
      ticketNumber: '176-0001',
    });

    const eqSingle = jest.fn()
      .mockResolvedValueOnce({
        data: {
          id: 'order-1',
          order_number: 'AV-1001',
          user_id: 'user-1',
          agency_id: 'agency-1',
          drct_order_id: 'DRCT-1',
          status: 'confirmed',
          contact_email: 'client@example.com',
          contact_phone: '+966500000000',
          total_price: 1000,
          currency: 'SAR'
        }
      })
      .mockResolvedValueOnce({
        data: null
      })
      .mockResolvedValueOnce({
        data: {
          id: 'order-1',
          order_number: 'AV-1001',
          user_id: 'user-1',
          agency_id: 'agency-1',
          drct_order_id: 'DRCT-1',
          status: 'ticketed',
          contact_email: 'client@example.com',
          contact_phone: '+966500000000',
          total_price: 1000,
          currency: 'SAR'
        }
      });
    const eq = jest.fn(() => ({ single: eqSingle }));
    const select = jest.fn(() => ({ eq }));
    const from = jest.fn((table) => {
      if (table === 'orders') return { select };
      if (table === 'idempotency_keys') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({ single: jest.fn().mockResolvedValue({ data: null }) }))
            }))
          })),
          insert: jest.fn().mockResolvedValue({}),
          update: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({ catch: jest.fn() }))
            }))
          })),
        };
      }
      throw new Error(`Unexpected table ${table}`);
    });

    jest.doMock('../../src/lib/supabase', () => ({ from }));
    jest.doMock('../../src/config', () => ({
      config: { nodeEnv: 'test', allowPdfOnlyTicketIssuance: true },
      ORDERS_LIST_COLUMNS: 'id,order_number,status',
    }));
    jest.doMock('../../src/utils/helpers', () => ({
      isAdminRole: (role) => ['admin', 'super_admin'].includes(role),
      isAgentRole: (role) => role === 'agent',
      isStaffRole: (role) => ['admin', 'super_admin', 'agent'].includes(role),
    }));
    jest.doMock('../../src/middleware/auth', () => ({
      resolveAuthContext: jest.fn(async () => ({
        user: { id: 'user-1', email: 'ops@aviaframe.com' },
        profile: { id: 'profile-1', email: 'ops@aviaframe.com', role: 'admin', agency_id: null }
      })),
      forbidden: (res, message = 'Access denied') => res.status(403).json({ error: { code: 'FORBIDDEN', message } }),
      ensureStaff: jest.fn(() => true),
      canAccessOrder: jest.fn(async () => true),
    }));
    jest.doMock('../../src/services/orderService', () => ({
      ensureTicketPdfForOrder: jest.fn(),
      createSignedDocumentUrl: jest.fn(),
      issueDrctTicket,
    }));
    jest.doMock('../../src/services/emailService', () => ({
      sendTicketEmail: jest.fn(),
    }));
    jest.doMock('../../src/services/drctService', () => ({
      cancelOrder: jest.fn(),
    }));
    jest.doMock('uuid', () => ({ v4: () => 'idem-row-1' }));
    jest.doMock('../../src/services/supabaseClient', () => ({
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({ single: jest.fn().mockResolvedValue({ data: null }) }))
          }))
        })),
        insert: jest.fn().mockResolvedValue({}),
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({ catch: jest.fn() }))
          }))
        })),
      }))
    }), { virtual: true });

    const app = buildApp();
    const res = await request(app)
      .post('/api/orders/order-1/issue')
      .set('Idempotency-Key', 'issue-key-1234')
      .send({});

    expect(res.statusCode).toBe(200);
    expect(issueDrctTicket).toHaveBeenCalledWith(expect.objectContaining({
      order: expect.objectContaining({ id: 'order-1', agency_id: 'agency-1' }),
      createdBy: 'profile-1'
    }));
    expect(res.body.order.status).toBe('ticketed');
    expect(res.body.pnr).toBe('PNR-123');
  });

  test('cancels order through protected backend route', async () => {
    const updateSingle = jest.fn().mockResolvedValue({
      data: {
        id: 'order-2',
        order_number: 'AV-1002',
        user_id: 'user-2',
        agency_id: 'agency-2',
        drct_order_id: 'DRCT-2',
        status: 'cancelled',
        contact_email: 'client2@example.com',
        contact_phone: '+966511111111',
        total_price: 1500,
        currency: 'SAR'
      }
    });
    const updateEq = jest.fn(() => ({ select: jest.fn(() => ({ single: updateSingle })) }));
    const update = jest.fn(() => ({ eq: updateEq }));
    const selectSingle = jest.fn().mockResolvedValue({
      data: {
        id: 'order-2',
        order_number: 'AV-1002',
        user_id: 'user-2',
        agency_id: 'agency-2',
        drct_order_id: 'DRCT-2',
        status: 'confirmed',
        contact_email: 'client2@example.com',
        contact_phone: '+966511111111',
        total_price: 1500,
        currency: 'SAR'
      }
    });
    const selectEq = jest.fn(() => ({ single: selectSingle }));
    const select = jest.fn(() => ({ eq: selectEq }));
    const cancelOrder = jest.fn().mockResolvedValue({
      success: true,
      data: { order_id: 'DRCT-2', status: 'CANCELLED' }
    });

    const from = jest.fn((table) => {
      if (table === 'orders') return { select, update };
      if (table === 'idempotency_keys') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({ single: jest.fn().mockResolvedValue({ data: null }) }))
            }))
          })),
          insert: jest.fn().mockResolvedValue({}),
          update: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({ catch: jest.fn() }))
            }))
          })),
        };
      }
      throw new Error(`Unexpected table ${table}`);
    });

    jest.doMock('../../src/lib/supabase', () => ({ from }));
    jest.doMock('../../src/config', () => ({
      config: { nodeEnv: 'test' },
      ORDERS_LIST_COLUMNS: 'id,order_number,status',
    }));
    jest.doMock('../../src/utils/helpers', () => ({
      isAdminRole: (role) => ['admin', 'super_admin'].includes(role),
      isAgentRole: (role) => role === 'agent',
      isStaffRole: (role) => ['admin', 'super_admin', 'agent'].includes(role),
    }));
    jest.doMock('../../src/middleware/auth', () => ({
      resolveAuthContext: jest.fn(async () => ({
        user: { id: 'user-2', email: 'ops@aviaframe.com' },
        profile: { id: 'profile-2', email: 'ops@aviaframe.com', role: 'admin', agency_id: null }
      })),
      forbidden: (res, message = 'Access denied') => res.status(403).json({ error: { code: 'FORBIDDEN', message } }),
      ensureStaff: jest.fn(() => true),
      canAccessOrder: jest.fn(async () => true),
    }));
    jest.doMock('../../src/services/orderService', () => ({
      ensureTicketPdfForOrder: jest.fn(),
      createSignedDocumentUrl: jest.fn(),
      issueDrctTicket: jest.fn(),
    }));
    jest.doMock('../../src/services/emailService', () => ({
      sendTicketEmail: jest.fn(),
    }));
    jest.doMock('../../src/services/drctService', () => ({
      cancelOrder,
    }));
    jest.doMock('uuid', () => ({ v4: () => 'idem-row-2' }));
    jest.doMock('../../src/services/supabaseClient', () => ({
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({ single: jest.fn().mockResolvedValue({ data: null }) }))
          }))
        })),
        insert: jest.fn().mockResolvedValue({}),
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({ catch: jest.fn() }))
          }))
        })),
      }))
    }), { virtual: true });

    const app = buildApp();
    const res = await request(app)
      .post('/api/orders/order-2/cancel')
      .set('Idempotency-Key', 'cancel-key-1234')
      .send({ reason: 'USER_REQUEST' });

    expect(res.statusCode).toBe(200);
    expect(cancelOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        order_id: 'DRCT-2',
        reason: 'USER_REQUEST',
        refund_requested: true
      }),
      'agency-2',
      'order-2'
    );
    expect(res.body.order.status).toBe('cancelled');
  });
});
