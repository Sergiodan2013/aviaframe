describe('widget token signature verification', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.doMock('../../src/config', () => ({
      config: { widgetTokenSecret: 'unit-test-widget-secret' }
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('accepts a valid token and rejects changed or truncated signatures', () => {
    const { issueWidgetToken, parseWidgetToken } = require('../../src/utils/helpers');
    const token = issueWidgetToken({ agencyId: 'agency-1', exp: Math.floor(Date.now() / 1000) + 60 });
    const [payload, signature] = token.split('.');

    expect(parseWidgetToken(token).payload.agencyId).toBe('agency-1');
    expect(parseWidgetToken(`${payload}.${signature.slice(0, -1)}x`).error).toBe('INVALID_WIDGET_SIGNATURE');
    expect(parseWidgetToken(`${payload}.${signature.slice(0, -1)}`).error).toBe('INVALID_WIDGET_SIGNATURE');
  });
});

