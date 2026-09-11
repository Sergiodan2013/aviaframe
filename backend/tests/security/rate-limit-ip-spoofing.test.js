'use strict';

// A14: createMemoryRateLimiter buckets requests by "client IP", and that IP
// used to come from normalizeClientIp() hand-parsing X-Forwarded-For and
// trusting whichever value the CLIENT put first in the header — so one
// attacker, one TCP connection, could present a different "IP" on every
// request just by changing that header, defeating any IP-keyed limit
// entirely. The fix relies on Express's own `trust proxy` resolution
// (config.trustProxyHops, wired in app.js) instead of hand-parsing the
// header, so this test builds a real Express app with that exact setting
// to prove the fix holds end-to-end, not just in isolation.

const express = require('express');
const request = require('supertest');

function buildApp({ trustProxyHops, limiterMax = 1 }) {
  jest.resetModules();
  const { createMemoryRateLimiter, resetRequestGuardState } = require('../../src/middleware/requestGuards');
  resetRequestGuardState();

  const app = express();
  if (trustProxyHops !== undefined) {
    app.set('trust proxy', trustProxyHops);
  }
  const limiter = createMemoryRateLimiter({ bucket: 'test-bucket', max: limiterMax, windowMs: 60_000 });
  app.get('/', limiter, (req, res) => res.json({ ip: req.ip }));
  return app;
}

describe('rate limiter IP resolution (A14)', () => {
  afterEach(() => {
    jest.resetModules();
  });

  test('with trust proxy correctly set to the real hop count, a spoofed leading XFF entry cannot open a fresh bucket', async () => {
    // Simulates the audit's reproduction: same trusted-proxy hop, attacker
    // varies the *client-controlled* leading part of X-Forwarded-For on
    // every request. supertest talks to the app directly (as if it were
    // the one trusted proxy hop), so with trust proxy=1 the resolved
    // req.ip is the LAST entry — supertest can't forge that away, it can
    // only forge entries before it, which is exactly what a real attacker
    // controls in production behind one real trusted reverse proxy.
    const app = buildApp({ trustProxyHops: 1, limiterMax: 1 });

    const first = await request(app).get('/').set('X-Forwarded-For', '203.0.113.10, 9.9.9.9');
    const second = await request(app).get('/').set('X-Forwarded-For', '198.51.100.20, 9.9.9.9');
    const third = await request(app).get('/').set('X-Forwarded-For', '10.10.10.10, 9.9.9.9');

    expect(first.status).toBe(200);
    // Same trailing (proxy-appended) hop on every request => same bucket
    // => the second and third requests hit the limit of 1.
    expect(second.status).toBe(429);
    expect(third.status).toBe(429);
  });

  test('a genuinely different real client (different trailing/proxy-appended hop) gets its own bucket', async () => {
    const app = buildApp({ trustProxyHops: 1, limiterMax: 1 });

    const clientA = await request(app).get('/').set('X-Forwarded-For', 'anything, 1.1.1.1');
    const clientB = await request(app).get('/').set('X-Forwarded-For', 'anything-else, 2.2.2.2');

    expect(clientA.status).toBe(200);
    expect(clientB.status).toBe(200);
  });

  test('without a trust proxy setting, X-Forwarded-For is ignored entirely (falls back to the raw socket peer)', async () => {
    const app = buildApp({ limiterMax: 1 }); // trustProxyHops left unset => Express default (false)

    const first = await request(app).get('/').set('X-Forwarded-For', '1.1.1.1');
    const second = await request(app).get('/').set('X-Forwarded-For', '2.2.2.2');

    // Both requests come from the same test-harness socket peer regardless
    // of the (untrusted) header, so they land in the same bucket — proving
    // the header is not being trusted when trust proxy isn't configured.
    expect(first.status).toBe(200);
    expect(second.status).toBe(429);
  });
});
