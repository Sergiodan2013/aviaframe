'use strict';

// Unit tests for enforceOrderOwnershipIfAuthenticated (backend/src/middleware/auth.js).
//
// Context (A06 from the security audit): payment routes such as
// POST /api/payments/initiate and POST /api/payments/tamara/checkout-session
// only ever received an order_id — no proof that the caller is the customer
// (or agency staff) that order belongs to. Guest checkout (the widget) never
// logs in at all, so we cannot require auth on these routes without breaking
// that flow. This helper closes the gap for the case that CAN be checked
// safely: when the caller does present a Bearer token, verify it actually
// owns/can access the order before letting the request proceed. When no
// token is presented at all, existing guest-checkout behavior is preserved.

function fakeRes() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };
}

describe('enforceOrderOwnershipIfAuthenticated', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test('anonymous request (no Authorization header) is let through untouched — guest checkout must keep working', async () => {
    jest.doMock('../../src/lib/supabase', () => ({
      auth: { getUser: jest.fn() },
      from: jest.fn(() => { throw new Error('must not query the DB for a guest request'); })
    }));
    jest.doMock('../../src/config', () => ({ config: { enableContactEmailAutoLink: false } }));

    const { enforceOrderOwnershipIfAuthenticated } = require('../../src/middleware/auth');
    const res = fakeRes();
    const order = { id: 'order-1', user_id: 'someone-else', agency_id: 'agency-x' };

    const result = await enforceOrderOwnershipIfAuthenticated({ headers: {} }, res, order);

    expect(result.ok).toBe(true);
    expect(result.auth).toBeNull();
    expect(res.statusCode).toBeNull();
  });

  test('an invalid/expired Bearer token is rejected with 401 rather than silently falling back to guest mode', async () => {
    const getUser = jest.fn().mockResolvedValue({ data: { user: null }, error: { message: 'bad token' } });
    jest.doMock('../../src/lib/supabase', () => ({ auth: { getUser }, from: jest.fn() }));
    jest.doMock('../../src/config', () => ({ config: { enableContactEmailAutoLink: false } }));

    const { enforceOrderOwnershipIfAuthenticated } = require('../../src/middleware/auth');
    const res = fakeRes();
    const order = { id: 'order-1', user_id: 'user-1', agency_id: null };

    const result = await enforceOrderOwnershipIfAuthenticated(
      { headers: { authorization: 'Bearer garbage' } },
      res,
      order
    );

    expect(result.ok).toBe(false);
    expect(res.statusCode).toBe(401);
  });

  test('an authenticated customer who does NOT own the order is rejected with 403', async () => {
    const getUser = jest.fn().mockResolvedValue({
      data: { user: { id: 'attacker-1', email: 'attacker@example.com' } },
      error: null
    });
    const profileMaybeSingle = jest.fn().mockResolvedValue({
      data: { id: 'attacker-1', email: 'attacker@example.com', role: 'user', agency_id: null },
      error: null
    });
    const from = jest.fn((table) => {
      if (table === 'profiles') {
        return { select: jest.fn(() => ({ eq: jest.fn(() => ({ maybeSingle: profileMaybeSingle })) })) };
      }
      throw new Error(`Unexpected table ${table}`);
    });
    jest.doMock('../../src/lib/supabase', () => ({ auth: { getUser }, from }));
    jest.doMock('../../src/config', () => ({ config: { enableContactEmailAutoLink: false } }));

    const { enforceOrderOwnershipIfAuthenticated } = require('../../src/middleware/auth');
    const res = fakeRes();
    // Order belongs to a completely different customer.
    const order = { id: 'order-1', user_id: 'real-owner', agency_id: null };

    const result = await enforceOrderOwnershipIfAuthenticated(
      { headers: { authorization: 'Bearer attacker-token' } },
      res,
      order
    );

    expect(result.ok).toBe(false);
    expect(res.statusCode).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  test('an authenticated customer who OWNS the order is let through', async () => {
    const getUser = jest.fn().mockResolvedValue({
      data: { user: { id: 'owner-1', email: 'owner@example.com' } },
      error: null
    });
    const profileMaybeSingle = jest.fn().mockResolvedValue({
      data: { id: 'owner-1', email: 'owner@example.com', role: 'user', agency_id: null },
      error: null
    });
    const from = jest.fn((table) => {
      if (table === 'profiles') {
        return { select: jest.fn(() => ({ eq: jest.fn(() => ({ maybeSingle: profileMaybeSingle })) })) };
      }
      throw new Error(`Unexpected table ${table}`);
    });
    jest.doMock('../../src/lib/supabase', () => ({ auth: { getUser }, from }));
    jest.doMock('../../src/config', () => ({ config: { enableContactEmailAutoLink: false } }));

    const { enforceOrderOwnershipIfAuthenticated } = require('../../src/middleware/auth');
    const res = fakeRes();
    const order = { id: 'order-1', user_id: 'owner-1', agency_id: null };

    const result = await enforceOrderOwnershipIfAuthenticated(
      { headers: { authorization: 'Bearer owner-token' } },
      res,
      order
    );

    expect(result.ok).toBe(true);
    expect(result.auth.profile.id).toBe('owner-1');
    expect(res.statusCode).toBeNull();
  });

  test('an agent authenticated for a DIFFERENT agency cannot access another agency\'s order', async () => {
    const getUser = jest.fn().mockResolvedValue({
      data: { user: { id: 'agent-2', email: 'agent2@other-agency.test' } },
      error: null
    });
    const profileMaybeSingle = jest.fn().mockResolvedValue({
      data: { id: 'agent-2', email: 'agent2@other-agency.test', role: 'agent', agency_id: 'agency-2' },
      error: null
    });
    const from = jest.fn((table) => {
      if (table === 'profiles') {
        return { select: jest.fn(() => ({ eq: jest.fn(() => ({ maybeSingle: profileMaybeSingle })) })) };
      }
      throw new Error(`Unexpected table ${table}`);
    });
    jest.doMock('../../src/lib/supabase', () => ({ auth: { getUser }, from }));
    jest.doMock('../../src/config', () => ({ config: { enableContactEmailAutoLink: false } }));

    const { enforceOrderOwnershipIfAuthenticated } = require('../../src/middleware/auth');
    const res = fakeRes();
    const order = { id: 'order-1', user_id: null, agency_id: 'agency-1' };

    const result = await enforceOrderOwnershipIfAuthenticated(
      { headers: { authorization: 'Bearer agent-2-token' } },
      res,
      order
    );

    expect(result.ok).toBe(false);
    expect(res.statusCode).toBe(403);
  });

  test('an agent authenticated for the SAME agency can access the order', async () => {
    const getUser = jest.fn().mockResolvedValue({
      data: { user: { id: 'agent-1', email: 'agent1@agency-1.test' } },
      error: null
    });
    const profileMaybeSingle = jest.fn().mockResolvedValue({
      data: { id: 'agent-1', email: 'agent1@agency-1.test', role: 'agent', agency_id: 'agency-1' },
      error: null
    });
    const from = jest.fn((table) => {
      if (table === 'profiles') {
        return { select: jest.fn(() => ({ eq: jest.fn(() => ({ maybeSingle: profileMaybeSingle })) })) };
      }
      throw new Error(`Unexpected table ${table}`);
    });
    jest.doMock('../../src/lib/supabase', () => ({ auth: { getUser }, from }));
    jest.doMock('../../src/config', () => ({ config: { enableContactEmailAutoLink: false } }));

    const { enforceOrderOwnershipIfAuthenticated } = require('../../src/middleware/auth');
    const res = fakeRes();
    const order = { id: 'order-1', user_id: null, agency_id: 'agency-1' };

    const result = await enforceOrderOwnershipIfAuthenticated(
      { headers: { authorization: 'Bearer agent-1-token' } },
      res,
      order
    );

    expect(result.ok).toBe(true);
    expect(res.statusCode).toBeNull();
  });

  test('an admin authenticated user can access any order', async () => {
    const getUser = jest.fn().mockResolvedValue({
      data: { user: { id: 'admin-1', email: 'admin@aviaframe.com' } },
      error: null
    });
    const profileMaybeSingle = jest.fn().mockResolvedValue({
      data: { id: 'admin-1', email: 'admin@aviaframe.com', role: 'admin', agency_id: null },
      error: null
    });
    const from = jest.fn((table) => {
      if (table === 'profiles') {
        return { select: jest.fn(() => ({ eq: jest.fn(() => ({ maybeSingle: profileMaybeSingle })) })) };
      }
      throw new Error(`Unexpected table ${table}`);
    });
    jest.doMock('../../src/lib/supabase', () => ({ auth: { getUser }, from }));
    jest.doMock('../../src/config', () => ({ config: { enableContactEmailAutoLink: false } }));

    const { enforceOrderOwnershipIfAuthenticated } = require('../../src/middleware/auth');
    const res = fakeRes();
    const order = { id: 'order-1', user_id: 'anyone', agency_id: 'any-agency' };

    const result = await enforceOrderOwnershipIfAuthenticated(
      { headers: { authorization: 'Bearer admin-token' } },
      res,
      order
    );

    expect(result.ok).toBe(true);
    expect(res.statusCode).toBeNull();
  });
});
