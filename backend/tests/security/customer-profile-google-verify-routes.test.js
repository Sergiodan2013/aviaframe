'use strict';

// Route-level (HTTP) tests for POST /public/customer-profile/verify-google —
// the Google Sign-In alternative to the 6-digit email code (A05 follow-up).
// This endpoint is always called from the WIDGET's own origin (the relay
// page at aviaframe-site/auth/google.html never talks to the backend
// itself — it only hands the raw Google ID token back to the widget via
// postMessage), so requireValidWidgetSession's tenant/origin checks apply
// exactly as they do for request-code/verify-code, and are re-verified here
// rather than assumed.
//
// google-auth-library is mocked so these tests don't depend on real Google
// credentials or network access; the widget-token signing and
// customerProfile lookup are real, same pattern as
// customer-profile-verification-routes.test.js.

const express = require('express');
const request = require('supertest');

function jsonApp(router) {
  const app = express();
  app.use(express.json());
  app.use(router);
  return app;
}

function mockCommonDeps({ lookupCustomerProfile, verifyIdToken, googleClientId } = {}) {
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
      googleClientId: googleClientId === undefined ? 'test-google-client-id.apps.googleusercontent.com' : googleClientId,
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
    sendCustomerProfileVerificationCode: jest.fn().mockResolvedValue({ sent: true, error: null })
  }));
  jest.doMock('google-auth-library', () => ({
    OAuth2Client: jest.fn().mockImplementation(() => ({
      verifyIdToken: verifyIdToken || jest.fn().mockRejectedValue(new Error('not stubbed')),
    })),
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

function ticketFor(payload) {
  return { getPayload: () => payload };
}

describe('POST /public/customer-profile/verify-google', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test('rejects with no widget token at all', async () => {
    mockCommonDeps();
    const router = require('../../src/routes/public');
    const app = jsonApp(router);

    const res = await request(app)
      .post('/customer-profile/verify-google')
      .send({ credential: 'whatever' });

    expect(res.statusCode).toBe(401);
    expect(res.body.error.code).toBe('WIDGET_TOKEN_REQUIRED');
  });

  test('rejects a widget token whose origin does not match the request origin', async () => {
    mockCommonDeps();
    const { issueWidgetToken } = require('../../src/utils/helpers');
    const router = require('../../src/routes/public');
    const app = jsonApp(router);
    const widgetToken = buildValidWidgetToken(issueWidgetToken, { origin_host: 'other-agency.example.com' });

    const res = await request(app)
      .post('/customer-profile/verify-google')
      .set('Authorization', `Bearer ${widgetToken}`)
      .set('Origin', 'https://agency.example.com')
      .send({ credential: 'whatever' });

    expect(res.statusCode).toBe(403);
    expect(res.body.error.code).toBe('WIDGET_ORIGIN_MISMATCH');
  });

  test('returns 503 when GOOGLE_CLIENT_ID is not configured — Google sign-in disabled, OTP path unaffected', async () => {
    mockCommonDeps({ googleClientId: '' });
    const { issueWidgetToken } = require('../../src/utils/helpers');
    const router = require('../../src/routes/public');
    const app = jsonApp(router);
    const widgetToken = buildValidWidgetToken(issueWidgetToken);

    const res = await request(app)
      .post('/customer-profile/verify-google')
      .set('Authorization', `Bearer ${widgetToken}`)
      .send({ credential: 'whatever' });

    expect(res.statusCode).toBe(503);
    expect(res.body.error.code).toBe('GOOGLE_SIGNIN_NOT_CONFIGURED');
  });

  test('rejects a missing credential', async () => {
    mockCommonDeps();
    const { issueWidgetToken } = require('../../src/utils/helpers');
    const router = require('../../src/routes/public');
    const app = jsonApp(router);
    const widgetToken = buildValidWidgetToken(issueWidgetToken);

    const res = await request(app)
      .post('/customer-profile/verify-google')
      .set('Authorization', `Bearer ${widgetToken}`)
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body.error.code).toBe('INVALID_CREDENTIAL');
  });

  test('rejects a credential that fails Google signature/audience verification', async () => {
    mockCommonDeps({
      verifyIdToken: jest.fn().mockRejectedValue(new Error('Wrong number of segments')),
    });
    const { issueWidgetToken } = require('../../src/utils/helpers');
    const router = require('../../src/routes/public');
    const app = jsonApp(router);
    const widgetToken = buildValidWidgetToken(issueWidgetToken);

    const res = await request(app)
      .post('/customer-profile/verify-google')
      .set('Authorization', `Bearer ${widgetToken}`)
      .send({ credential: 'not-a-real-jwt' });

    expect(res.statusCode).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIAL');
  });

  test('rejects a token whose email is not marked verified by Google', async () => {
    mockCommonDeps({
      verifyIdToken: jest.fn().mockResolvedValue(ticketFor({
        email: 'traveler@example.com', email_verified: false,
      })),
    });
    const { issueWidgetToken } = require('../../src/utils/helpers');
    const router = require('../../src/routes/public');
    const app = jsonApp(router);
    const widgetToken = buildValidWidgetToken(issueWidgetToken);

    const res = await request(app)
      .post('/customer-profile/verify-google')
      .set('Authorization', `Bearer ${widgetToken}`)
      .send({ credential: 'some-jwt' });

    expect(res.statusCode).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIAL');
  });

  test('a valid, email-verified Google credential returns the full profile (incl. passport) plus a verified_token that also unlocks GET /customer-profile', async () => {
    mockCommonDeps({
      lookupCustomerProfile: jest.fn().mockResolvedValue({
        first_name: 'Jane', last_name: 'Doe', phone: '+966500000000',
        gender: 'F', date_of_birth: '1990-01-01',
        passport_number: 'AB1234567', passport_expiry: '2030-05-12', nationality: 'SA',
      }),
      verifyIdToken: jest.fn().mockResolvedValue(ticketFor({
        email: 'Traveler@Example.com', email_verified: true,
      })),
    });
    const { issueWidgetToken } = require('../../src/utils/helpers');
    const router = require('../../src/routes/public');
    const app = jsonApp(router);
    const widgetToken = buildValidWidgetToken(issueWidgetToken);

    const res = await request(app)
      .post('/customer-profile/verify-google')
      .set('Authorization', `Bearer ${widgetToken}`)
      .send({ credential: 'a-valid-looking-jwt' });

    expect(res.statusCode).toBe(200);
    expect(res.body.found).toBe(true);
    expect(res.body.email).toBe('traveler@example.com'); // normalized/lowercased
    expect(res.body.profile).toEqual({
      first_name: 'Jane', last_name: 'Doe', phone: '+966500000000',
      gender: 'F', date_of_birth: '1990-01-01',
      passport_number: 'AB1234567', passport_expiry: '2030-05-12', nationality: 'SA',
    });
    expect(typeof res.body.verified_token).toBe('string');

    const getRes = await request(app)
      .get('/customer-profile')
      .set('Authorization', `Bearer ${widgetToken}`)
      .query({ email: 'traveler@example.com', verified_token: res.body.verified_token });

    expect(getRes.statusCode).toBe(200);
    expect(getRes.body.found).toBe(true);
    expect(getRes.body.profile.passport_number).toBe('AB1234567');
  });

  test('a verified_token issued via Google for one email cannot unlock a different email\'s profile', async () => {
    mockCommonDeps({
      lookupCustomerProfile: jest.fn().mockResolvedValue({ first_name: 'Jane' }),
      verifyIdToken: jest.fn().mockResolvedValue(ticketFor({
        email: 'traveler@example.com', email_verified: true,
      })),
    });
    const { issueWidgetToken } = require('../../src/utils/helpers');
    const router = require('../../src/routes/public');
    const app = jsonApp(router);
    const widgetToken = buildValidWidgetToken(issueWidgetToken);

    const verifyRes = await request(app)
      .post('/customer-profile/verify-google')
      .set('Authorization', `Bearer ${widgetToken}`)
      .send({ credential: 'a-valid-looking-jwt' });

    const getRes = await request(app)
      .get('/customer-profile')
      .set('Authorization', `Bearer ${widgetToken}`)
      .query({ email: 'someone-else@example.com', verified_token: verifyRes.body.verified_token });

    expect(getRes.statusCode).toBe(401);
    expect(getRes.body.error.code).toBe('VERIFICATION_REQUIRED');
  });

  test('Google verifyIdToken is always called with the configured audience — prevents token-substitution from another Google app', async () => {
    const verifyIdToken = jest.fn().mockResolvedValue(ticketFor({
      email: 'traveler@example.com', email_verified: true,
    }));
    mockCommonDeps({ verifyIdToken, googleClientId: 'aviaframe-prod-client.apps.googleusercontent.com' });
    const { issueWidgetToken } = require('../../src/utils/helpers');
    const router = require('../../src/routes/public');
    const app = jsonApp(router);
    const widgetToken = buildValidWidgetToken(issueWidgetToken);

    await request(app)
      .post('/customer-profile/verify-google')
      .set('Authorization', `Bearer ${widgetToken}`)
      .send({ credential: 'a-valid-looking-jwt' });

    expect(verifyIdToken).toHaveBeenCalledWith(expect.objectContaining({
      idToken: 'a-valid-looking-jwt',
      audience: 'aviaframe-prod-client.apps.googleusercontent.com',
    }));
  });

  test('rate-limits repeated verify-google attempts from the same IP', async () => {
    mockCommonDeps({
      verifyIdToken: jest.fn().mockRejectedValue(new Error('bad token')),
    });
    const { issueWidgetToken } = require('../../src/utils/helpers');
    const router = require('../../src/routes/public');
    const app = jsonApp(router);
    const widgetToken = buildValidWidgetToken(issueWidgetToken);

    for (let i = 0; i < 10; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      const ok = await request(app)
        .post('/customer-profile/verify-google')
        .set('Authorization', `Bearer ${widgetToken}`)
        .send({ credential: 'bad' });
      expect(ok.statusCode).toBe(401);
    }

    const blocked = await request(app)
      .post('/customer-profile/verify-google')
      .set('Authorization', `Bearer ${widgetToken}`)
      .send({ credential: 'bad' });

    expect(blocked.statusCode).toBe(429);
  });
});
