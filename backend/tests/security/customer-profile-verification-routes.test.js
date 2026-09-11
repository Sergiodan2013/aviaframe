'use strict';

// Route-level (HTTP) tests for the A05 fix's two new endpoints:
//   POST /public/customer-profile/request-code
//   POST /public/customer-profile/verify-code
// plus their interaction with the (already-covered-elsewhere) GET
// /public/customer-profile endpoint. Unit tests for the underlying OTP
// store itself live in tests/services/customer-profile-verification.test.js.
//
// Uses the REAL utils/helpers (widget-token signing) and the REAL
// customerProfileVerification service (in-memory store) — only supabase,
// logger, config and the outbound email call are mocked — so these tests
// exercise the actual production wiring end to end.

const express = require('express');
const request = require('supertest');

function jsonApp(router) {
  const app = express();
  app.use(express.json());
  app.use(router);
  return app;
}

function mockCommonDeps({ lookupCustomerProfile, sendCustomerProfileVerificationCode } = {}) {
  jest.doMock('../../src/config', () => ({
    config: {
      nodeEnv: 'test',
      airportAutocompleteUrl: 'https://autocomplete.travelpayouts.com/places2',
      airportAutocompleteTimeoutMs: 1000,
      publicSearchDrctEnabled: false,
      publicAutocompleteRateLimitMax: 20,
      publicSearchRateLimitMax: 20,
      publicRateLimitWindowMs: 60_000,
      widgetTokenSecret: 'test-widget-token-secret',
    }
  }));
  jest.doMock('../../src/lib/logger', () => ({
    warn: jest.fn(), error: jest.fn(), info: jest.fn(),
  }));
  jest.doMock('../../src/lib/supabase', () => ({ from: jest.fn() }));
  jest.doMock('../../src/services/drctService', () => ({ searchOffers: jest.fn() }));
  jest.doMock('../../src/services/customerProfile', () => ({
    lookupCustomerProfile: lookupCustomerProfile || jest.fn().mockResolvedValue(null)
  }));
  jest.doMock('../../src/services/emailService', () => ({
    sendCustomerProfileVerificationCode: sendCustomerProfileVerificationCode
      || jest.fn().mockResolvedValue({ sent: true, error: null })
  }));
}

function buildValidWidgetToken(issueWidgetToken, overrides = {}) {
  return issueWidgetToken({
    typ: 'widget_session',
    agency_id: 'agency-1',
    origin_host: 'agency.example.com',
    exp: Math.floor(Date.now() / 1000) + 300,
    ...overrides
  });
}

describe('POST /public/customer-profile/request-code', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test('rejects with no widget token at all', async () => {
    mockCommonDeps();
    const router = require('../../src/routes/public');
    const app = jsonApp(router);

    const res = await request(app)
      .post('/customer-profile/request-code')
      .send({ email: 'traveler@example.com' });

    expect(res.statusCode).toBe(401);
    expect(res.body.error.code).toBe('WIDGET_TOKEN_REQUIRED');
  });

  test('rejects an invalid email', async () => {
    mockCommonDeps();
    const { issueWidgetToken } = require('../../src/utils/helpers');
    const router = require('../../src/routes/public');
    const app = jsonApp(router);
    const widgetToken = buildValidWidgetToken(issueWidgetToken);

    const res = await request(app)
      .post('/customer-profile/request-code')
      .set('Authorization', `Bearer ${widgetToken}`)
      .send({ email: 'not-an-email' });

    expect(res.statusCode).toBe(400);
    expect(res.body.error.code).toBe('INVALID_EMAIL');
  });

  test('sends a 6-digit code by email and responds generically with { sent: true }', async () => {
    const sendFn = jest.fn().mockResolvedValue({ sent: true, error: null });
    mockCommonDeps({ sendCustomerProfileVerificationCode: sendFn });
    const { issueWidgetToken } = require('../../src/utils/helpers');
    const router = require('../../src/routes/public');
    const app = jsonApp(router);
    const widgetToken = buildValidWidgetToken(issueWidgetToken);

    const res = await request(app)
      .post('/customer-profile/request-code')
      .set('Authorization', `Bearer ${widgetToken}`)
      .send({ email: 'Traveler@Example.com' });

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ sent: true });
    expect(sendFn).toHaveBeenCalledTimes(1);
    const call = sendFn.mock.calls[0][0];
    expect(call.to).toBe('traveler@example.com'); // normalized/lowercased
    expect(call.code).toMatch(/^\d{6}$/);
  });

  test('responds generically even when no profile exists for that email — no existence oracle', async () => {
    const sendFn = jest.fn().mockResolvedValue({ sent: true, error: null });
    mockCommonDeps({
      lookupCustomerProfile: jest.fn().mockResolvedValue(null),
      sendCustomerProfileVerificationCode: sendFn
    });
    const { issueWidgetToken } = require('../../src/utils/helpers');
    const router = require('../../src/routes/public');
    const app = jsonApp(router);
    const widgetToken = buildValidWidgetToken(issueWidgetToken);

    const res = await request(app)
      .post('/customer-profile/request-code')
      .set('Authorization', `Bearer ${widgetToken}`)
      .send({ email: 'nobody-has-ever-booked@example.com' });

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ sent: true });
  });

  test('returns 503 when the email fails to send', async () => {
    mockCommonDeps({
      sendCustomerProfileVerificationCode: jest.fn().mockResolvedValue({ sent: false, error: 'EMAIL_NOT_CONFIGURED' })
    });
    const { issueWidgetToken } = require('../../src/utils/helpers');
    const router = require('../../src/routes/public');
    const app = jsonApp(router);
    const widgetToken = buildValidWidgetToken(issueWidgetToken);

    const res = await request(app)
      .post('/customer-profile/request-code')
      .set('Authorization', `Bearer ${widgetToken}`)
      .send({ email: 'traveler@example.com' });

    expect(res.statusCode).toBe(503);
    expect(res.body.error.code).toBe('EMAIL_DELIVERY_FAILED');
  });

  test('rate-limits repeated code requests for the same email — protects a victim from mail-bombing', async () => {
    const sendFn = jest.fn().mockResolvedValue({ sent: true, error: null });
    mockCommonDeps({ sendCustomerProfileVerificationCode: sendFn });
    const { issueWidgetToken } = require('../../src/utils/helpers');
    const { MAX_SENDS_PER_WINDOW } = require('../../src/services/customerProfileVerification');
    const router = require('../../src/routes/public');
    const app = jsonApp(router);
    const widgetToken = buildValidWidgetToken(issueWidgetToken);

    for (let i = 0; i < MAX_SENDS_PER_WINDOW; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      const ok = await request(app)
        .post('/customer-profile/request-code')
        .set('Authorization', `Bearer ${widgetToken}`)
        .send({ email: 'victim@example.com' });
      expect(ok.statusCode).toBe(200);
    }

    const blocked = await request(app)
      .post('/customer-profile/request-code')
      .set('Authorization', `Bearer ${widgetToken}`)
      .send({ email: 'victim@example.com' });

    expect(blocked.statusCode).toBe(429);
    expect(blocked.body.error.code).toBe('TOO_MANY_REQUESTS');
  });
});

describe('POST /public/customer-profile/verify-code', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test('rejects with no widget token at all', async () => {
    mockCommonDeps();
    const router = require('../../src/routes/public');
    const app = jsonApp(router);

    const res = await request(app)
      .post('/customer-profile/verify-code')
      .send({ email: 'traveler@example.com', code: '123456' });

    expect(res.statusCode).toBe(401);
    expect(res.body.error.code).toBe('WIDGET_TOKEN_REQUIRED');
  });

  test('rejects a wrong code', async () => {
    const sendFn = jest.fn().mockResolvedValue({ sent: true, error: null });
    mockCommonDeps({ sendCustomerProfileVerificationCode: sendFn });
    const { issueWidgetToken } = require('../../src/utils/helpers');
    const router = require('../../src/routes/public');
    const app = jsonApp(router);
    const widgetToken = buildValidWidgetToken(issueWidgetToken);

    await request(app)
      .post('/customer-profile/request-code')
      .set('Authorization', `Bearer ${widgetToken}`)
      .send({ email: 'traveler@example.com' });
    const realCode = sendFn.mock.calls[0][0].code;
    const wrongCode = realCode === '000000' ? '111111' : '000000';

    const res = await request(app)
      .post('/customer-profile/verify-code')
      .set('Authorization', `Bearer ${widgetToken}`)
      .send({ email: 'traveler@example.com', code: wrongCode });

    expect(res.statusCode).toBe(401);
    expect(res.body.error.code).toBe('VERIFICATION_INCORRECT_CODE');
  });

  test('rejects a code that was never requested', async () => {
    mockCommonDeps();
    const { issueWidgetToken } = require('../../src/utils/helpers');
    const router = require('../../src/routes/public');
    const app = jsonApp(router);
    const widgetToken = buildValidWidgetToken(issueWidgetToken);

    const res = await request(app)
      .post('/customer-profile/verify-code')
      .set('Authorization', `Bearer ${widgetToken}`)
      .send({ email: 'never-requested@example.com', code: '123456' });

    expect(res.statusCode).toBe(401);
    expect(res.body.error.code).toBe('VERIFICATION_NOT_REQUESTED');
  });

  test('a correct code returns the profile plus a verified_token, and that token then unlocks GET /customer-profile', async () => {
    const sendFn = jest.fn().mockResolvedValue({ sent: true, error: null });
    mockCommonDeps({
      lookupCustomerProfile: jest.fn().mockResolvedValue({
        first_name: 'Jane', last_name: 'Doe', phone: '+966500000000',
        gender: 'F', date_of_birth: '1990-01-01', passport_number: 'SECRET',
      }),
      sendCustomerProfileVerificationCode: sendFn
    });
    const { issueWidgetToken } = require('../../src/utils/helpers');
    const router = require('../../src/routes/public');
    const app = jsonApp(router);
    const widgetToken = buildValidWidgetToken(issueWidgetToken);

    await request(app)
      .post('/customer-profile/request-code')
      .set('Authorization', `Bearer ${widgetToken}`)
      .send({ email: 'traveler@example.com' });
    const realCode = sendFn.mock.calls[0][0].code;

    const verifyRes = await request(app)
      .post('/customer-profile/verify-code')
      .set('Authorization', `Bearer ${widgetToken}`)
      .send({ email: 'traveler@example.com', code: realCode });

    expect(verifyRes.statusCode).toBe(200);
    expect(verifyRes.body.found).toBe(true);
    expect(verifyRes.body.profile).toEqual({
      first_name: 'Jane', last_name: 'Doe', phone: '+966500000000',
      gender: 'F', date_of_birth: '1990-01-01',
    });
    expect(verifyRes.body.profile.passport_number).toBeUndefined();
    expect(typeof verifyRes.body.verified_token).toBe('string');
    expect(verifyRes.body.verified_token.length).toBeGreaterThan(0);

    // The returned verified_token must actually work on the GET endpoint —
    // this is the whole point of issuing it.
    const getRes = await request(app)
      .get('/customer-profile')
      .set('Authorization', `Bearer ${widgetToken}`)
      .query({ email: 'traveler@example.com', verified_token: verifyRes.body.verified_token });

    expect(getRes.statusCode).toBe(200);
    expect(getRes.body.found).toBe(true);
    expect(getRes.body.profile.first_name).toBe('Jane');
  });

  test('a code is single-use — verifying twice with the same code fails the second time', async () => {
    const sendFn = jest.fn().mockResolvedValue({ sent: true, error: null });
    mockCommonDeps({ sendCustomerProfileVerificationCode: sendFn });
    const { issueWidgetToken } = require('../../src/utils/helpers');
    const router = require('../../src/routes/public');
    const app = jsonApp(router);
    const widgetToken = buildValidWidgetToken(issueWidgetToken);

    await request(app)
      .post('/customer-profile/request-code')
      .set('Authorization', `Bearer ${widgetToken}`)
      .send({ email: 'traveler@example.com' });
    const realCode = sendFn.mock.calls[0][0].code;

    const first = await request(app)
      .post('/customer-profile/verify-code')
      .set('Authorization', `Bearer ${widgetToken}`)
      .send({ email: 'traveler@example.com', code: realCode });
    expect(first.statusCode).toBe(200);

    const second = await request(app)
      .post('/customer-profile/verify-code')
      .set('Authorization', `Bearer ${widgetToken}`)
      .send({ email: 'traveler@example.com', code: realCode });
    expect(second.statusCode).toBe(401);
    expect(second.body.error.code).toBe('VERIFICATION_NOT_REQUESTED');
  });

  test('verifying for an email with no saved profile still returns a usable verified_token, with found: false', async () => {
    const sendFn = jest.fn().mockResolvedValue({ sent: true, error: null });
    mockCommonDeps({
      lookupCustomerProfile: jest.fn().mockResolvedValue(null),
      sendCustomerProfileVerificationCode: sendFn
    });
    const { issueWidgetToken } = require('../../src/utils/helpers');
    const router = require('../../src/routes/public');
    const app = jsonApp(router);
    const widgetToken = buildValidWidgetToken(issueWidgetToken);

    await request(app)
      .post('/customer-profile/request-code')
      .set('Authorization', `Bearer ${widgetToken}`)
      .send({ email: 'first-time-customer@example.com' });
    const realCode = sendFn.mock.calls[0][0].code;

    const res = await request(app)
      .post('/customer-profile/verify-code')
      .set('Authorization', `Bearer ${widgetToken}`)
      .send({ email: 'first-time-customer@example.com', code: realCode });

    expect(res.statusCode).toBe(200);
    expect(res.body.found).toBe(false);
    expect(typeof res.body.verified_token).toBe('string');
  });
});
