describe('n8nClient', () => {
  const originalEnv = { ...process.env };
  const originalFetch = global.fetch;
  const originalAbortSignal = global.AbortSignal;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    global.fetch = originalFetch;
    global.AbortSignal = originalAbortSignal;
  });

  function loadClient() {
    const logDRCTRequest = jest.fn().mockResolvedValue(null);

    jest.doMock('../../src/services/drctLogger', () => ({
      logDRCTRequest,
      generateCorrelationId: () => 'trace-test-123',
    }));

    const client = require('../../src/services/n8nClient');
    return { client, logDRCTRequest };
  }

  test('exports only search and price (order mutations removed)', () => {
    const { client } = loadClient();
    expect(typeof client.drctSearch).toBe('function');
    expect(typeof client.drctPrice).toBe('function');
    expect(client.drctCreateOrder).toBeUndefined();
    expect(client.drctIssue).toBeUndefined();
    expect(client.drctCancel).toBeUndefined();
  });

  test('retries timeout-like failures on search and returns structured error', async () => {
    process.env.N8N_RETRY_ATTEMPTS = '1';

    const timeoutSpy = jest.fn((ms) => ({ timeoutMs: ms }));
    global.AbortSignal = { timeout: timeoutSpy };

    const timeoutError = Object.assign(new Error('Request timeout while waiting for n8n'), {
      name: 'TimeoutError',
      code: 'ETIMEDOUT',
    });
    global.fetch = jest.fn().mockRejectedValue(timeoutError);

    const { client, logDRCTRequest } = loadClient();
    const result = await client.drctSearch({ origin: 'RUH', destination: 'DXB' }, 'tenant-1');

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(logDRCTRequest).toHaveBeenCalledTimes(2);
    expect(result).toEqual({
      success: false,
      error: {
        code: 'N8N_REQUEST_FAILED',
        message: 'Request timeout while waiting for n8n',
        statusCode: 500,
        correlationId: 'trace-test-123',
      }
    });
  });

  test('successful search request returns data with correlationId', async () => {
    const timeoutSpy = jest.fn((ms) => ({ timeoutMs: ms }));
    global.AbortSignal = { timeout: timeoutSpy };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({ search_id: 'S-1', offers: [] }),
    });

    const { client } = loadClient();
    const result = await client.drctSearch({ origin: 'RUH', destination: 'DXB' }, 'tenant-1');

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ search_id: 'S-1', offers: [] });
    expect(result.correlationId).toBe('trace-test-123');
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:5678/webhook/drct/search',
      expect.objectContaining({ method: 'POST' })
    );
  });
});
