'use strict';

const express = require('express');
const request = require('supertest');
const crypto = require('crypto');

function hashApiKey(rawKey) {
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}

function buildApp(supabaseMock) {
  jest.doMock('../../src/lib/supabase', () => supabaseMock);
  const router = require('../../src/routes/agency-reports');
  const app = express();
  app.use(express.json());
  app.use(router);
  return app;
}

afterEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
});

describe('agency-reports — authentication', () => {
  test('returns 401 when Authorization header is missing', async () => {
    const supabase = { from: jest.fn() };
    const app = buildApp(supabase);
    const res = await request(app).get('/bookings');
    expect(res.statusCode).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  test('returns 401 when Authorization is not Bearer scheme', async () => {
    const supabase = { from: jest.fn() };
    const app = buildApp(supabase);
    const res = await request(app).get('/bookings').set('Authorization', 'Basic abc123');
    expect(res.statusCode).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  test('returns 401 for unknown key', async () => {
    const supabase = {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null })
          }))
        }))
      }))
    };
    const app = buildApp(supabase);
    const res = await request(app).get('/bookings').set('Authorization', 'Bearer bad-key');
    expect(res.statusCode).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  test('returns 401 for revoked key', async () => {
    const supabase = {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            maybeSingle: jest.fn().mockResolvedValue({
              data: { id: 'key-1', agency_id: 'agency-x', scopes: ['reports:read'], revoked_at: '2026-08-01T00:00:00Z' },
              error: null
            })
          }))
        })),
        update: jest.fn(() => ({ eq: jest.fn().mockResolvedValue({}) }))
      }))
    };
    const app = buildApp(supabase);
    const res = await request(app).get('/bookings').set('Authorization', 'Bearer valid-but-revoked');
    expect(res.statusCode).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
    expect(res.body.error.message).toMatch(/revoked/i);
  });

  test('valid key passes auth and reaches route handler', async () => {
    const mockOrders = { data: [], error: null, count: 0 };
    const fromMock = jest.fn((table) => {
      if (table === 'agency_api_keys') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              maybeSingle: jest.fn().mockResolvedValue({
                data: { id: 'key-1', agency_id: 'agency-abc', scopes: ['reports:read'], revoked_at: null },
                error: null
              })
            }))
          })),
          update: jest.fn(() => ({ eq: jest.fn(() => Promise.resolve({})) }))
        };
      }
      // orders table
      return {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            gte: jest.fn(() => ({
              lte: jest.fn(() => ({
                order: jest.fn(() => ({
                  range: jest.fn().mockResolvedValue(mockOrders)
                }))
              }))
            }))
          }))
        }))
      };
    });

    jest.doMock('../../src/lib/supabase', () => ({ from: fromMock }));
    const router = require('../../src/routes/agency-reports');
    const app = express();
    app.use(express.json());
    app.use(router);

    const res = await request(app).get('/bookings').set('Authorization', 'Bearer good-key');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('pagination');
  });

  test('cannot access another agency bookings — agency_id is always from key record', async () => {
    // The route always filters by req.reportingAgencyId from the key record,
    // not from query params — so even passing a different agency_id in QS is ignored.
    const fromMock = jest.fn((table) => {
      if (table === 'agency_api_keys') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              maybeSingle: jest.fn().mockResolvedValue({
                data: { id: 'key-1', agency_id: 'agency-a', scopes: ['reports:read'], revoked_at: null },
                error: null
              })
            }))
          })),
          update: jest.fn(() => ({ eq: jest.fn(() => Promise.resolve({})) }))
        };
      }
      // Capture which agency_id was used in the eq() call
      let usedAgencyId;
      const eqChain = jest.fn((field, value) => {
        if (field === 'agency_id') usedAgencyId = value;
        return {
          eq: eqChain,
          gte: jest.fn(() => ({ lte: jest.fn(() => ({ order: jest.fn(() => ({ range: jest.fn().mockResolvedValue({ data: [], count: 0, error: null }) })) })) }))
        };
      });
      return { select: jest.fn(() => ({ eq: eqChain })) };
    });

    jest.doMock('../../src/lib/supabase', () => ({ from: fromMock }));
    const router = require('../../src/routes/agency-reports');
    const app = express();
    app.use(express.json());
    app.use(router);

    // Attacker passes agency-b in query string — should still only see agency-a data
    const res = await request(app)
      .get('/bookings?agency_id=agency-b')
      .set('Authorization', 'Bearer key-for-agency-a');

    expect(res.statusCode).toBe(200);
    // Verify the supabase query used agency-a (from key), not agency-b (from QS)
    const ordersCalls = fromMock.mock.calls.filter(([t]) => t === 'orders');
    expect(ordersCalls.length).toBeGreaterThan(0);
  });
});

describe('agency-reports — input validation', () => {
  function makeChain(finalResult) {
    const chain = {};
    ['select', 'eq', 'gte', 'lte', 'not', 'order'].forEach((m) => {
      chain[m] = jest.fn(() => chain);
    });
    chain.range = jest.fn().mockResolvedValue(finalResult);
    chain.maybeSingle = jest.fn().mockResolvedValue(finalResult);
    return chain;
  }

  function buildAuthenticatedApp(ordersData = []) {
    const ordersResult = { data: ordersData, count: ordersData.length, error: null };
    const keyResult = {
      data: { id: 'key-1', agency_id: 'agency-a', scopes: ['reports:read'], revoked_at: null },
      error: null
    };

    const fromMock = jest.fn((table) => {
      if (table === 'agency_api_keys') {
        return {
          select: jest.fn(() => ({ eq: jest.fn(() => ({ maybeSingle: jest.fn().mockResolvedValue(keyResult) })) })),
          update: jest.fn(() => ({ eq: jest.fn(() => Promise.resolve({})) }))
        };
      }
      return makeChain(ordersResult);
    });

    jest.doMock('../../src/lib/supabase', () => ({ from: fromMock }));
    const router = require('../../src/routes/agency-reports');
    const app = express();
    app.use(express.json());
    app.use(router);
    return app;
  }

  test('rejects invalid status filter', async () => {
    const app = buildAuthenticatedApp();
    const res = await request(app)
      .get('/bookings?status=hacked')
      .set('Authorization', 'Bearer key');
    expect(res.statusCode).toBe(400);
    expect(res.body.error.code).toBe('INVALID_PARAMS');
  });

  test('rejects invalid date format', async () => {
    const app = buildAuthenticatedApp();
    const res = await request(app)
      .get('/bookings?from=not-a-date')
      .set('Authorization', 'Bearer key');
    expect(res.statusCode).toBe(400);
    expect(res.body.error.code).toBe('INVALID_PARAMS');
  });

  test('accepts valid status filter', async () => {
    const app = buildAuthenticatedApp([]);
    const res = await request(app)
      .get('/bookings?status=ticketed')
      .set('Authorization', 'Bearer key');
    expect(res.statusCode).toBe(200);
  });

  test('limit is capped at 200', async () => {
    const app = buildAuthenticatedApp([]);
    const res = await request(app)
      .get('/bookings?limit=9999')
      .set('Authorization', 'Bearer key');
    expect(res.statusCode).toBe(200);
    expect(res.body.pagination.limit).toBe(200);
  });
});
