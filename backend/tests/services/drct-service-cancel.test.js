describe('drctService cancel fallback', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  function loadService({ n8nResponse, directResponse, directError } = {}) {
    const mockDirectCancel = jest.fn();
    if (directError) {
      mockDirectCancel.mockRejectedValue(directError);
    } else {
      mockDirectCancel.mockResolvedValue(directResponse || {
        order_id: 'ORD-1',
        status: 'CANCELLED',
      });
    }

    jest.doMock('../../src/services/n8nClient', () => ({
      drctSearch: jest.fn(),
      drctPrice: jest.fn(),
      drctCreateOrder: jest.fn(),
      drctIssue: jest.fn(),
      drctCancel: jest.fn(),
    }));

    jest.doMock('../../src/services/drctQueue', () => ({
      schedule: (fn) => fn(),
    }));

    jest.doMock('../../src/services/drctCircuitBreaker', () => ({
      createDrctCircuitBreaker: jest.fn((fn) => ({
        fire: jest.fn(async (payload) => {
          if (payload?.params?.order_id) {
            return n8nResponse;
          }
          return fn(payload);
        }),
        opened: false,
      })),
    }));

    jest.doMock('../../src/utils/retry', () => ({
      withRetry: (fn) => fn(),
    }));

    jest.doMock('../../src/services/drctDirectClient', () => ({
      cancelOrder: mockDirectCancel,
    }));

    jest.doMock('../../src/lib/logger', () => ({
      warn: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
    }));

    return {
      service: require('../../src/services/drctService'),
      mockDirectCancel,
    };
  }

  test('falls back to direct DRCT when n8n cancel returns empty string payload', async () => {
    const { service, mockDirectCancel } = loadService({
      n8nResponse: {
        success: true,
        data: '',
        correlationId: 'corr-1',
      },
      directResponse: {
        order_id: 'ORD-1',
        status: 'CANCELLED',
      },
    });

    const result = await service.cancelOrder({ order_id: 'ORD-1' }, 'tenant-1', 'booking-1');

    expect(mockDirectCancel).toHaveBeenCalledWith({ order_id: 'ORD-1' });
    expect(result).toEqual(expect.objectContaining({
      success: true,
      fallback: 'direct-drct',
      correlationId: 'corr-1',
      data: expect.objectContaining({
        order_id: 'ORD-1',
        status: 'CANCELLED',
      }),
    }));
  });

  test('returns n8n payload when it is already meaningful', async () => {
    const { service, mockDirectCancel } = loadService({
      n8nResponse: {
        success: true,
        data: {
          order_id: 'ORD-2',
          status: 'CANCELLED',
        },
        correlationId: 'corr-2',
      },
    });

    const result = await service.cancelOrder({ order_id: 'ORD-2' }, 'tenant-2', 'booking-2');

    expect(mockDirectCancel).not.toHaveBeenCalled();
    expect(result).toEqual({
      success: true,
      data: {
        order_id: 'ORD-2',
        status: 'CANCELLED',
      },
      correlationId: 'corr-2',
    });
  });

  test('returns structured failure when direct fallback also fails', async () => {
    const directError = Object.assign(new Error('Order not found'), {
      code: 'DRCT_API_ERROR',
      statusCode: 404,
    });

    const { service } = loadService({
      n8nResponse: {
        success: true,
        data: '',
        correlationId: 'corr-3',
      },
      directError,
    });

    const result = await service.cancelOrder({ order_id: 'ORD-3' }, 'tenant-3', 'booking-3');

    expect(result).toEqual({
      success: false,
      error: {
        code: 'DRCT_API_ERROR',
        message: 'Order not found',
        statusCode: 404,
        correlationId: 'corr-3',
      }
    });
  });
});
