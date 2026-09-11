'use strict';

// A13 (partial): POST /api/widget/session used to grant an unauthenticated
// caller a valid widget session for ANY agency — bypassing that agency's
// real domain allowlist entirely — just by sending `preview_mode: true`
// with an `origin_host`/Origin header equal to 'admin.aviaframe.com'. Both
// of those are client-supplied values; no real admin session was ever
// checked. Since an agency's public `agency_key` is visible in its own
// site's HTML (see agencyProvision.js), anyone could lift it and get a
// session for an agency whose real domain they don't control. The fix
// requires an actual admin/super_admin bearer token before honoring the
// preview flag.

const express = require('express');
const request = require('supertest');

function mockCommon({ agency, adminAuthResult }) {
  const maybeSingle = jest.fn().mockResolvedValue({ data: agency, error: null });
  const from = jest.fn((table) => {
    if (table === 'agencies') {
      return {
        select: () => ({
          or: () => ({ limit: () => ({ maybeSingle }) }),
          eq: () => ({ limit: () => ({ maybeSingle }) })
        })
      };
    }
    throw new Error(`Unexpected table ${table}`);
  });

  jest.doMock('../../src/lib/supabase', () => ({ from }));
  jest.doMock('../../src/lib/logger', () => ({
    warn: jest.fn(), error: jest.fn(), info: jest.fn()
  }));
  jest.doMock('../../src/config', () => ({
    config: {
      nodeEnv: 'test',
      widgetSessionRateLimitMax: 1000,
      publicRateLimitWindowMs: 60_000,
      widgetTokenSecret: 'unit-test-widget-secret',
      widgetTokenTtlSec: 900,
      internalApiToken: ''
    },
    VALID_PAYMENT_METHODS: ['online', 'manual'],
    ORDERS_LIST_COLUMNS: 'id'
  }));
  jest.doMock('../../src/middleware/auth', () => ({
    resolveAuthContextFromToken: jest.fn(async (token) => {
      if (token === 'valid-admin-token') {
        return adminAuthResult || { user: { id: 'admin-1' }, profile: { id: 'admin-1', role: 'admin' } };
      }
      return { error: 'INVALID_TOKEN' };
    })
  }));
  jest.doMock('../../src/services/customerProfile', () => ({ saveCustomerProfile: jest.fn() }));
  jest.doMock('../../src/services/agencyPaymentMode', () => ({
    isAgencyDemoPaymentMode: jest.fn(() => true),
    resolveAgencyPaymentMode: jest.fn(() => 'demo')
  }));
  jest.doMock('../../src/services/drctDirectClient', () => ({}));

  return { from, maybeSingle };
}

function buildApp() {
  const router = require('../../src/routes/widget');
  const app = express();
  app.use(express.json());
  app.use(router);
  return app;
}

const AGENCY = {
  id: 'agency-1',
  name: 'Real Agency',
  domain: 'realagency.com',
  contact_email: 'a@realagency.com',
  contact_phone: '',
  is_active: true,
  settings: {}
};

describe('POST /api/widget/session — admin preview requires a verified admin session (A13)', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test('preview_mode + spoofed admin.aviaframe.com origin, no bearer token => rejected, not granted a session', async () => {
    mockCommon({ agency: AGENCY });
    const app = buildApp();

    const res = await request(app)
      .post('/api/widget/session')
      .send({ agency_key: 'realagency', preview_mode: true, origin_host: 'admin.aviaframe.com' });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('WIDGET_ORIGIN_NOT_ALLOWED');
    expect(res.body.widget_token).toBeUndefined();
  });

  test('preview_mode + spoofed origin + a non-admin bearer token => still rejected', async () => {
    mockCommon({ agency: AGENCY, adminAuthResult: { user: { id: 'u1' }, profile: { id: 'u1', role: 'agent' } } });
    const app = buildApp();

    const res = await request(app)
      .post('/api/widget/session')
      .set('Authorization', 'Bearer valid-admin-token')
      .send({ agency_key: 'realagency', preview_mode: true, origin_host: 'admin.aviaframe.com' });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('WIDGET_ORIGIN_NOT_ALLOWED');
  });

  test('preview_mode + admin.aviaframe.com origin + a real admin bearer token => granted', async () => {
    mockCommon({ agency: AGENCY });
    const app = buildApp();

    const res = await request(app)
      .post('/api/widget/session')
      .set('Authorization', 'Bearer valid-admin-token')
      .send({ agency_key: 'realagency', preview_mode: true, origin_host: 'admin.aviaframe.com' });

    expect(res.status).toBe(200);
    expect(res.body.widget_token).toBeTruthy();
  });

  test('regression: a normal session request from the agency\'s own real domain still works with no auth at all', async () => {
    mockCommon({ agency: AGENCY });
    const app = buildApp();

    const res = await request(app)
      .post('/api/widget/session')
      .send({ agency_key: 'realagency', origin_host: 'realagency.com' });

    expect(res.status).toBe(200);
    expect(res.body.widget_token).toBeTruthy();
  });
});
