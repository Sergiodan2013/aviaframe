describe('drctDirectClient', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      DRCT_PROD_TOKEN: 'prod-token-123',
    };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  function loadClient() {
    const axiosMock = jest.fn();
    const loggerWarn = jest.fn();

    jest.doMock('axios', () => axiosMock);
    jest.doMock('../../src/lib/logger', () => ({
      warn: loggerWarn,
      info: jest.fn(),
      error: jest.fn(),
    }));

    const client = require('../../src/services/drctDirectClient');
    return { client, axiosMock, loggerWarn };
  }

  test('normalizeCancelResponse maps deleted provider status to CANCELLED payload', () => {
    const { client } = loadClient();

    const normalized = client.normalizeCancelResponse({
      id: 'ORD-1',
      status: 'deleted',
      deleted_at: '2026-06-23T14:21:25Z',
      locator: 'PNR123',
      channel: 'Lufthansa Group',
      tickets: [
        { number: '220-000000001', status: 'deleted', passenger: 'SERGII/QA' },
      ],
    });

    expect(normalized).toEqual(expect.objectContaining({
      order_id: 'ORD-1',
      status: 'CANCELLED',
      cancelled_at: '2026-06-23T14:21:25Z',
      locator: 'PNR123',
      metadata: expect.objectContaining({
        workflow_id: 'drct_order_cancel_direct',
        channel: 'Lufthansa Group',
      }),
      tickets: [
        expect.objectContaining({
          ticket_number: '220-000000001',
          status: 'DELETED',
          passenger: 'SERGII/QA',
        }),
      ],
    }));
  });

  test('normalizeCreateResponse unwraps nested provider envelope and keeps order identifiers', () => {
    const { client } = loadClient();

    const normalized = client.normalizeCreateResponse({
      body: {
        id: 'DRCT-ORDER-1',
        status: 'new',
        locator: 'PNR123',
        price: {
          amount: 2450,
          currency: 'SAR',
        },
        price_details: [
          {
            type: 'ADT',
            count: 1,
            fare: { amount: 2000 },
            taxes: { amount: 450 },
            price: { amount: 2450, currency: 'SAR' },
          },
        ],
        flights: [
          {
            segments: [
              {
                id: 'SEG-1',
                departure_airport: { code: 'RUH', name: 'Riyadh' },
                arrival_airport: { code: 'JED', name: 'Jeddah' },
                departure_date: '2026-07-10',
                departure_time: '08:00',
                arrival_date: '2026-07-10',
                arrival_time: '10:00',
                carrier: { airline_code: 'SV', airline_name: 'Saudia' },
                flight_number: 'SV101',
                duration: 120,
              },
            ],
          },
        ],
      },
    }, 'offer-123');

    expect(normalized).toEqual(expect.objectContaining({
      order_id: 'DRCT-ORDER-1',
      offer_id: 'offer-123',
      status: 'NEW',
      locator: 'PNR123',
      pnr: 'PNR123',
      price: expect.objectContaining({
        total: 2450,
        currency: 'SAR',
        per_passenger: [
          expect.objectContaining({
            type: 'ADT',
            total: 2450,
          }),
        ],
      }),
      segments: [
        expect.objectContaining({
          id: 'SEG-1',
          origin: 'RUH',
          destination: 'JED',
          airline_name: 'Saudia',
        }),
      ],
    }));
  });

  test('normalizeIssueResponse unwraps nested provider envelope and returns ticket details', () => {
    const { client } = loadClient();

    const normalized = client.normalizeIssueResponse({
      data: {
        id: 'DRCT-ORDER-9',
        status: 'issued',
        locator: 'ABC123',
        tickets: [
          {
            number: '6071234567890',
            passenger: 'DANYLIUK/SERGII',
          },
        ],
      },
    }, 'DRCT-ORDER-9');

    expect(normalized).toEqual(expect.objectContaining({
      order_id: 'DRCT-ORDER-9',
      status: 'ISSUED',
      pnr: 'ABC123',
      booking_reference: 'ABC123',
      tickets: [
        expect.objectContaining({
          ticket_number: '6071234567890',
          passenger: 'DANYLIUK/SERGII',
        }),
      ],
    }));
  });

  test('cancelOrder validates required order_id', async () => {
    const { client, axiosMock } = loadClient();

    await expect(client.cancelOrder({})).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      statusCode: 400,
      message: 'Missing required field: order_id',
    });
    expect(axiosMock).not.toHaveBeenCalled();
  });

  test('cancelOrder sends DELETE request and normalizes successful response', async () => {
    const { client, axiosMock } = loadClient();

    axiosMock.mockResolvedValue({
      status: 200,
      data: {
        order_id: 'ORD-2',
        status: 'deleted',
        deleted_at: '2026-06-23T14:21:25Z',
        refund: {
          status: 'pending',
          amount: 0,
          currency: 'SAR',
        },
      },
    });

    const result = await client.cancelOrder({
      order_id: ' ORD-2 ',
      reason: 'USER_REQUEST',
      refund_requested: true,
    });

    expect(axiosMock).toHaveBeenCalledWith(expect.objectContaining({
      method: 'DELETE',
      url: 'https://api.drct.aero/orders/ORD-2',
      timeout: 30000,
      headers: expect.objectContaining({
        Authorization: 'Bearer prod-token-123',
        'DRCT-Version': '2021-06-01',
      }),
      data: {
        reason: 'USER_REQUEST',
        refund_requested: true,
      },
    }));

    expect(result).toEqual(expect.objectContaining({
      order_id: 'ORD-2',
      status: 'CANCELLED',
      refund: expect.objectContaining({
        currency: 'SAR',
      }),
    }));
  });

  test('cancelOrder throws provider error payload as structured exception', async () => {
    const { client, axiosMock, loggerWarn } = loadClient();

    axiosMock.mockResolvedValue({
      status: 404,
      data: {
        error: {
          code: 'not_found',
          message: 'Order not found',
          status_code: 404,
        },
      },
    });

    await expect(client.cancelOrder({ order_id: 'ORD-404' })).rejects.toMatchObject({
      code: 'not_found',
      statusCode: 404,
      message: 'Order not found',
    });

    expect(loggerWarn).toHaveBeenCalled();
  });

  test('createOrder retries once after timeout and reuses the same idempotency key', async () => {
    const { client, axiosMock, loggerWarn } = loadClient();

    const timeoutErr = new Error('timeout of 120000ms exceeded');
    timeoutErr.code = 'ECONNABORTED';

    axiosMock
      .mockRejectedValueOnce(timeoutErr)
      .mockResolvedValueOnce({
        status: 201,
        data: {
          order_id: 'ORD-RETRY-1',
          offer_id: 'offer-123',
          status: 'new',
          locator: 'PNR999',
          price: {
            amount: 185,
            currency: 'SAR'
          }
        }
      });

    const result = await client.createOrder({
      offer_id: 'offer-123',
      passengers: [{
        id: 'PAX1',
        type: 'ADT',
        individual: {
          first_name: 'Oleksandr',
          last_name: 'Kalniy',
          date_of_birth: '2000-02-02',
          gender: 'M'
        },
        email: 'sergiodan2013@gmail.com',
        phone: '+380676918012',
        document: {
          type: 'REGULAR_PASSPORT',
          number: 'BUH7890',
          issuing_country: 'SA',
          citizenship: 'SA',
          country_of_issue: 'SA',
          expiration_date: '2029-02-02'
        }
      }]
    }, {
      idempotencyKey: 'order-create-order-1'
    });

    expect(axiosMock).toHaveBeenCalledTimes(2);
    expect(axiosMock.mock.calls[0][0]).toEqual(expect.objectContaining({
      method: 'POST',
      url: 'https://api.drct.aero/orders',
      timeout: 120000,
      headers: expect.objectContaining({
        'Idempotency-Key': 'order-create-order-1'
      })
    }));
    expect(axiosMock.mock.calls[1][0]).toEqual(expect.objectContaining({
      headers: expect.objectContaining({
        'Idempotency-Key': 'order-create-order-1'
      })
    }));
    expect(loggerWarn).toHaveBeenCalledWith(expect.objectContaining({
      attempt: 1,
      nextAttempt: 2,
      maxAttempts: 2,
        timeoutMs: 120000,
      code: 'ECONNABORTED'
    }), 'drctDirectClient create transient failure — retrying');
    expect(result).toEqual(expect.objectContaining({
      order_id: 'ORD-RETRY-1',
      offer_id: 'offer-123',
      pnr: 'PNR999'
    }));
  });
});
