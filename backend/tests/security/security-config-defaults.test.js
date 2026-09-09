describe('security-sensitive configuration defaults', () => {
  const originalValue = process.env.ALLOW_PUBLIC_DRCT_MUTATING_PROXY;

  afterEach(() => {
    if (originalValue === undefined) delete process.env.ALLOW_PUBLIC_DRCT_MUTATING_PROXY;
    else process.env.ALLOW_PUBLIC_DRCT_MUTATING_PROXY = originalValue;
    jest.resetModules();
  });

  test('legacy public DRCT mutation proxy is disabled unless explicitly enabled', () => {
    delete process.env.ALLOW_PUBLIC_DRCT_MUTATING_PROXY;
    let loaded = require('../../src/config');
    expect(loaded.config.allowPublicDrctMutatingProxy).toBe(false);

    jest.resetModules();
    process.env.ALLOW_PUBLIC_DRCT_MUTATING_PROXY = 'true';
    loaded = require('../../src/config');
    expect(loaded.config.allowPublicDrctMutatingProxy).toBe(true);
  });
});
