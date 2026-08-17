describe('legacy proxy consumer detection', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  function detect(headers) {
    const { detectLegacyProxyConsumer } = require('../../src/middleware/requestGuards');
    return detectLegacyProxyConsumer({ headers });
  }

  test('classifies known AviaFrame admin origin as portal-admin', () => {
    expect(detect({ origin: 'https://admin.aviaframe.com' })).toBe('portal-admin');
  });

  test('classifies known portal preview origin as portal-preview', () => {
    expect(detect({ origin: 'https://testenvavia.netlify.app' })).toBe('portal-preview');
  });

  test('classifies other netlify previews as netlify-preview', () => {
    expect(detect({ origin: 'https://feature-branch-preview.netlify.app' })).toBe('netlify-preview');
  });

  test('classifies localhost origin as local-dev', () => {
    expect(detect({ origin: 'http://localhost:3000' })).toBe('local-dev');
  });

  test('classifies aviaframe site origin as aviaframe-site', () => {
    expect(detect({ origin: 'https://www.aviaframe.com' })).toBe('aviaframe-site');
  });

  test('falls back to referer when origin is absent', () => {
    expect(detect({ referer: 'https://admin.aviaframe.com/orders/123' })).toBe('portal-admin');
  });

  test('returns external-or-unknown for untrusted origins', () => {
    expect(detect({ origin: 'https://partner.example.com' })).toBe('external-or-unknown');
  });

  test('returns unknown when neither origin nor referer exists', () => {
    expect(detect({})).toBe('unknown');
  });
});
