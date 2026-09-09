describe('internalQaTicketingService', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test('issues a DRCT ticket only for the configured QA agency and records an audit run', async () => {
    const from = jest.fn((table) => {
      if (table === 'orders') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              maybeSingle: jest.fn().mockResolvedValue({
                data: {
                  id: 'order-1',
                  order_number: 'AVF-1001',
                  agency_id: 'agency-qa',
                  drct_order_id: 'drct-1',
                  status: 'pending',
                  payment_status: 'pending',
                  payment_method: 'online',
                  confirmed_at: null,
                  cancelled_at: null,
                  notes: null,
                  origin: 'RUH',
                  destination: 'JED',
                  total_price: 100,
                  currency: 'SAR',
                  contact_email: 'qa@example.com',
                  contact_phone: '+9665000000',
                  raw_offer_data: {}
                },
                error: null
              })
            }))
          })),
          update: jest.fn(() => ({
            eq: jest.fn().mockResolvedValue({ error: null })
          }))
        };
      }

      if (table === 'internal_qa_ticket_runs') {
        return {
          select: jest.fn((columns) => {
            if (columns === 'id,order_id,status,void_deadline_at,issued_at,cancelled_at') {
              return {
                eq: jest.fn(() => ({
                  in: jest.fn(() => ({
                    order: jest.fn(() => ({
                      limit: jest.fn().mockResolvedValue({ data: [], error: null })
                    }))
                  }))
                }))
              };
            }

            if (columns === 'id') {
              return {
                eq: jest.fn(() => ({
                  in: jest.fn().mockResolvedValue({ data: [], error: null })
                }))
              };
            }

            throw new Error(`Unexpected internal_qa select columns: ${columns}`);
          }),
          insert: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({
                data: { id: 'run-1', status: 'requested' },
                error: null
              })
            }))
          })),
          update: jest.fn(() => ({
            eq: jest.fn(() => ({
              select: jest.fn(() => ({
                single: jest.fn().mockResolvedValue({
                  data: {
                    id: 'run-1',
                    status: 'issued',
                    pnr: 'PNR123',
                    ticket_number: 'ETK123',
                    void_deadline_at: '2026-06-25T20:00:00.000Z'
                  },
                  error: null
                })
              }))
            }))
          }))
        };
      }

      throw new Error(`Unexpected table ${table}`);
    });

    jest.doMock('../../src/lib/supabase', () => ({ from }));
    jest.doMock('../../src/config', () => ({
      config: {
        internalQaEnabled: true,
        internalQaAgencyId: 'agency-qa',
        internalQaAllowedHosts: ['admin.aviaframe.com'],
        internalQaMaxActiveTickets: 5,
        internalQaVoidWindowHours: 20
      }
    }));
    jest.doMock('../../src/services/orderService', () => ({
      issueDrctTicket: jest.fn().mockResolvedValue({
        issuance: { id: 'issuance-1', pnr: 'PNR123', ticket_number: 'ETK123' },
        doc: { id: 'doc-1' },
        url: 'https://files.example.com/ticket.pdf',
        pnr: 'PNR123',
        ticketNumber: 'ETK123'
      })
    }));
    jest.doMock('../../src/services/drctService', () => ({
      cancelOrder: jest.fn()
    }));

    const service = require('../../src/services/internalQaTicketingService');
    const result = await service.issueOrderWithoutPayment({
      orderId: 'order-1',
      auth: {
        user: { email: 'ops@aviaframe.com' },
        profile: { id: '11111111-1111-1111-1111-111111111111', email: 'ops@aviaframe.com', role: 'admin' }
      },
      requestHost: 'admin.aviaframe.com',
      requestIp: '127.0.0.1',
      reason: 'QA issue test'
    });

    expect(result.order_id).toBe('order-1');
    expect(result.order_number).toBe('AVF-1001');
    expect(result.run.status).toBe('issued');
    expect(result.run.pnr).toBe('PNR123');
    expect(result.document.id).toBe('doc-1');
    expect(result.signed_url).toContain('ticket.pdf');
  });

  test('rejects orders outside the dedicated QA agency', async () => {
    const from = jest.fn((table) => {
      if (table !== 'orders') throw new Error(`Unexpected table ${table}`);

      return {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            maybeSingle: jest.fn().mockResolvedValue({
              data: {
                id: 'order-2',
                order_number: 'AVF-2002',
                agency_id: 'agency-live',
                drct_order_id: 'drct-2',
                status: 'pending',
                notes: null
              },
              error: null
            })
          }))
        }))
      };
    });

    jest.doMock('../../src/lib/supabase', () => ({ from }));
    jest.doMock('../../src/config', () => ({
      config: {
        internalQaEnabled: true,
        internalQaAgencyId: 'agency-qa',
        internalQaAllowedHosts: ['admin.aviaframe.com'],
        internalQaMaxActiveTickets: 5,
        internalQaVoidWindowHours: 20
      }
    }));
    jest.doMock('../../src/services/orderService', () => ({
      issueDrctTicket: jest.fn()
    }));
    jest.doMock('../../src/services/drctService', () => ({
      cancelOrder: jest.fn()
    }));

    const service = require('../../src/services/internalQaTicketingService');

    await expect(service.issueOrderWithoutPayment({
      orderId: 'order-2',
      auth: {
        user: { email: 'ops@aviaframe.com' },
        profile: { id: '11111111-1111-1111-1111-111111111111', email: 'ops@aviaframe.com', role: 'admin' }
      },
      requestHost: 'admin.aviaframe.com',
      requestIp: '127.0.0.1'
    })).rejects.toMatchObject({
      code: 'INTERNAL_QA_WRONG_AGENCY',
      statusCode: 403
    });
  });
});
