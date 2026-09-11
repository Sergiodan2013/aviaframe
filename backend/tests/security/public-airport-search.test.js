const express = require('express');
const request = require('supertest');

function jsonApp(router) {
  const app = express();
  app.use(express.json());
  app.use(router);
  return app;
}

function buildSearchInsertMock(id = 'search-1') {
  const single = jest.fn().mockResolvedValue({
    data: { id },
    error: null
  });
  const select = jest.fn(() => ({ single }));
  const insert = jest.fn(() => ({ select }));
  return { insert, select, single };
}

describe('public airport autocomplete and search', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    global.fetch = originalFetch;
    delete process.env.PUBLIC_SEARCH_MAX_PAIRS;
  });

  test('autocomplete returns grouped city and airport suggestions from upstream provider', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ([
        {
          type: 'city',
          code: 'LON',
          name: 'London',
          city_code: 'LON',
          city_name: 'London',
          country_code: 'GB',
          country_name: 'United Kingdom',
        },
        {
          type: 'airport',
          code: 'LHR',
          name: 'Heathrow',
          city_code: 'LON',
          city_name: 'London',
          country_code: 'GB',
          country_name: 'United Kingdom',
        },
        {
          type: 'airport',
          code: 'LGW',
          name: 'Gatwick',
          city_code: 'LON',
          city_name: 'London',
          country_code: 'GB',
          country_name: 'United Kingdom',
        }
      ])
    });
    global.fetch = fetchMock;

    jest.doMock('../../src/config', () => ({
      config: {
        nodeEnv: 'test',
        airportAutocompleteUrl: 'https://autocomplete.travelpayouts.com/places2',
        airportAutocompleteTimeoutMs: 1000,
        publicSearchDrctEnabled: false,
      }
    }));
    jest.doMock('../../src/lib/logger', () => ({
      warn: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
    }));
    jest.doMock('../../src/lib/supabase', () => ({
      from: jest.fn()
    }));
    jest.doMock('../../src/services/drctService', () => ({
      searchOffers: jest.fn()
    }));

    const router = require('../../src/routes/public');
    const app = jsonApp(router);

    const res = await request(app)
      .get('/airports/autocomplete')
      .query({ q: 'lon', locale: 'en' });

    expect(res.statusCode).toBe(200);
    expect(res.body.source).toBe('travelpayouts');
    expect(res.body.groups).toHaveLength(1);
    expect(res.body.groups[0].country_code).toBe('GB');
    expect(res.body.groups[0].items[0]).toMatchObject({
      type: 'city',
      code: 'LON',
      airport_count: 2,
    });
    expect(res.body.groups[0].items[0].airports.map((item) => item.code)).toEqual(['LGW', 'LHR']);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test('customer-profile lookup requires a widget token', async () => {
    jest.doMock('../../src/config', () => ({
      config: {
        nodeEnv: 'test',
        airportAutocompleteUrl: 'https://autocomplete.travelpayouts.com/places2',
        airportAutocompleteTimeoutMs: 1000,
        publicSearchDrctEnabled: false,
        publicAutocompleteRateLimitMax: 20,
        publicSearchRateLimitMax: 20,
        publicRateLimitWindowMs: 60_000,
      }
    }));
    jest.doMock('../../src/lib/logger', () => ({
      warn: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
    }));
    jest.doMock('../../src/lib/supabase', () => ({
      from: jest.fn()
    }));
    jest.doMock('../../src/services/drctService', () => ({
      searchOffers: jest.fn()
    }));

    const router = require('../../src/routes/public');
    const app = jsonApp(router);

    const res = await request(app)
      .get('/customer-profile')
      .query({ email: 'traveler@example.com' });

    expect(res.statusCode).toBe(401);
    expect(res.body.error.code).toBe('WIDGET_TOKEN_REQUIRED');
  });

  // A05 fix: a widget session token alone used to be enough to read a
  // stranger's PII by guessing their email. Now the caller must also present
  // a verified_token proving they completed the request-code/verify-code
  // email-ownership handshake for that exact email — this is exercised with
  // the REAL utils/helpers signing/parsing (not mocked) so the test proves
  // the actual production token contract, not a stubbed shortcut.
  function mockCustomerProfileCommonDeps({ lookupCustomerProfile } = {}) {
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
      warn: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
    }));
    jest.doMock('../../src/lib/supabase', () => ({
      from: jest.fn()
    }));
    jest.doMock('../../src/services/drctService', () => ({
      searchOffers: jest.fn()
    }));
    jest.doMock('../../src/services/customerProfile', () => ({
      lookupCustomerProfile: lookupCustomerProfile || jest.fn().mockResolvedValue(null)
    }));
  }

  test('a valid widget token WITHOUT a verified_token is rejected — closes the A05 PII leak', async () => {
    mockCustomerProfileCommonDeps({
      lookupCustomerProfile: jest.fn().mockResolvedValue({
        first_name: 'Jane', last_name: 'Doe', phone: '+966500000000',
        gender: 'F', date_of_birth: '1990-01-01', passport_number: 'AB123456',
      })
    });

    const { issueWidgetToken } = require('../../src/utils/helpers');
    const router = require('../../src/routes/public');
    const app = jsonApp(router);

    const widgetToken = issueWidgetToken({
      typ: 'widget_session', agency_id: 'agency-1', origin_host: 'agency.example.com',
      exp: Math.floor(Date.now() / 1000) + 300
    });

    const res = await request(app)
      .get('/customer-profile')
      .set('Authorization', `Bearer ${widgetToken}`)
      .query({ email: 'traveler@example.com' });

    expect(res.statusCode).toBe(401);
    expect(res.body.error.code).toBe('VERIFICATION_REQUIRED');
  });

  test('customer-profile lookup returns limited profile fields once a matching verified_token is presented', async () => {
    mockCustomerProfileCommonDeps({
      lookupCustomerProfile: jest.fn().mockResolvedValue({
        first_name: 'Jane',
        last_name: 'Doe',
        phone: '+966500000000',
        gender: 'F',
        date_of_birth: '1990-01-01',
        passport_number: 'AB123456',
      })
    });

    const { issueWidgetToken } = require('../../src/utils/helpers');
    const router = require('../../src/routes/public');
    const app = jsonApp(router);

    const widgetToken = issueWidgetToken({
      typ: 'widget_session', agency_id: 'agency-1', origin_host: 'agency.example.com',
      exp: Math.floor(Date.now() / 1000) + 300
    });
    const verifiedToken = issueWidgetToken({
      typ: 'customer_profile_verified', agency_id: 'agency-1', email: 'traveler@example.com',
      exp: Math.floor(Date.now() / 1000) + 300
    });

    const res = await request(app)
      .get('/customer-profile')
      .set('Authorization', `Bearer ${widgetToken}`)
      .query({ email: 'traveler@example.com', verified_token: verifiedToken });

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      found: true,
      profile: {
        first_name: 'Jane',
        last_name: 'Doe',
        phone: '+966500000000',
        gender: 'F',
        date_of_birth: '1990-01-01',
      }
    });
    expect(res.body.profile.passport_number).toBeUndefined();
  });

  test('a verified_token issued for a DIFFERENT email cannot be reused to read someone else\'s profile', async () => {
    mockCustomerProfileCommonDeps({
      lookupCustomerProfile: jest.fn().mockResolvedValue({
        first_name: 'Real', last_name: 'Owner', phone: '+966500000001',
        gender: 'M', date_of_birth: '1985-05-05',
      })
    });

    const { issueWidgetToken } = require('../../src/utils/helpers');
    const router = require('../../src/routes/public');
    const app = jsonApp(router);

    const widgetToken = issueWidgetToken({
      typ: 'widget_session', agency_id: 'agency-1', origin_host: 'agency.example.com',
      exp: Math.floor(Date.now() / 1000) + 300
    });
    // Attacker verified their OWN email, then tries to reuse that token to
    // read a victim's profile by just changing the email query param.
    const verifiedTokenForAttackerEmail = issueWidgetToken({
      typ: 'customer_profile_verified', agency_id: 'agency-1', email: 'attacker@example.com',
      exp: Math.floor(Date.now() / 1000) + 300
    });

    const res = await request(app)
      .get('/customer-profile')
      .set('Authorization', `Bearer ${widgetToken}`)
      .query({ email: 'victim@example.com', verified_token: verifiedTokenForAttackerEmail });

    expect(res.statusCode).toBe(401);
    expect(res.body.error.code).toBe('VERIFICATION_REQUIRED');
  });

  test('autocomplete falls back to local dataset when upstream fails', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network down'));

    jest.doMock('../../src/config', () => ({
      config: {
        nodeEnv: 'test',
        airportAutocompleteUrl: 'https://autocomplete.travelpayouts.com/places2',
        airportAutocompleteTimeoutMs: 1000,
        publicSearchDrctEnabled: false,
      }
    }));
    jest.doMock('../../src/lib/logger', () => ({
      warn: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
    }));
    jest.doMock('../../src/lib/supabase', () => ({
      from: jest.fn()
    }));
    jest.doMock('../../src/services/drctService', () => ({
      searchOffers: jest.fn()
    }));

    const router = require('../../src/routes/public');
    const app = jsonApp(router);

    const res = await request(app)
      .get('/airports/autocomplete')
      .query({ q: 'mil', locale: 'en' });

    expect(res.statusCode).toBe(200);
    expect(res.body.source).toBe('fallback');
    expect(res.body.groups.some((group) => group.country_code === 'IT')).toBe(true);
  });

  test('fx rates endpoint returns public display-currency snapshot', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => `<?xml version="1.0" encoding="UTF-8"?>
<gesmes:Envelope xmlns:gesmes="http://www.gesmes.org/xml/2002-08-01" xmlns="http://www.ecb.int/vocabulary/2002-08-01/eurofxref">
  <Cube>
    <Cube time="2026-08-14">
      <Cube currency="USD" rate="1.1712"/>
    </Cube>
  </Cube>
</gesmes:Envelope>`
    });

    jest.doMock('../../src/config', () => ({
      config: {
        nodeEnv: 'test',
        airportAutocompleteUrl: 'https://autocomplete.travelpayouts.com/places2',
        airportAutocompleteTimeoutMs: 1000,
        publicSearchDrctEnabled: false,
      }
    }));
    jest.doMock('../../src/lib/logger', () => ({
      warn: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
    }));
    jest.doMock('../../src/lib/supabase', () => ({
      from: jest.fn()
    }));
    jest.doMock('../../src/services/drctService', () => ({
      searchOffers: jest.fn()
    }));

    const router = require('../../src/routes/public');
    const app = jsonApp(router);

    const res = await request(app).get('/fx-rates');

    expect(res.statusCode).toBe(200);
    expect(res.body.base_currency).toBe('SAR');
    expect(res.body.supported_currencies).toEqual(['EUR', 'SAR', 'UAH', 'USD']);
    expect(res.body.source).toBe('ecb_reference_rates');
    expect(res.body.rates.USD.sar_per_unit).toBeCloseTo(3.75, 6);
  });

  test('autocomplete returns lisbon and riyadh for city-only upstream responses', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ([
          {
            type: 'city',
            code: 'LIS',
            name: 'Lisbon',
            city_code: 'LIS',
            city_name: 'Lisbon',
            country_code: 'PT',
            country_name: 'Portugal',
          }
        ])
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ([
          {
            type: 'city',
            code: 'RUH',
            name: 'Riyadh',
            city_code: 'RUH',
            city_name: 'Riyadh',
            country_code: 'SA',
            country_name: 'Saudi Arabia',
          }
        ])
      });
    global.fetch = fetchMock;

    jest.doMock('../../src/config', () => ({
      config: {
        nodeEnv: 'test',
        airportAutocompleteUrl: 'https://autocomplete.travelpayouts.com/places2',
        airportAutocompleteTimeoutMs: 1000,
        publicSearchDrctEnabled: false,
      }
    }));
    jest.doMock('../../src/lib/logger', () => ({
      warn: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
    }));
    jest.doMock('../../src/lib/supabase', () => ({
      from: jest.fn()
    }));
    jest.doMock('../../src/services/drctService', () => ({
      searchOffers: jest.fn()
    }));

    const router = require('../../src/routes/public');
    const app = jsonApp(router);

    const lisbon = await request(app)
      .get('/airports/autocomplete')
      .query({ q: 'lisbon', locale: 'en' });
    expect(lisbon.statusCode).toBe(200);
    expect(lisbon.body.groups[0].country_code).toBe('PT');
    expect(lisbon.body.groups[0].items[0]).toMatchObject({
      type: 'airport',
      code: 'LIS',
      city_name: 'Lisbon',
    });

    const riyadh = await request(app)
      .get('/airports/autocomplete')
      .query({ q: 'riyadh', locale: 'en' });
    expect(riyadh.statusCode).toBe(200);
    expect(riyadh.body.groups[0].country_code).toBe('SA');
    expect(riyadh.body.groups[0].items[0]).toMatchObject({
      type: 'airport',
      code: 'RUH',
      city_name: 'Riyadh',
    });
  });

  test('autocomplete preserves upstream ranking for londo and vie style queries', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ([
          {
            type: 'city',
            code: 'LON',
            name: 'London',
            city_code: 'LON',
            city_name: 'London',
            country_code: 'GB',
            country_name: 'United Kingdom',
          },
          {
            type: 'city',
            code: 'YXU',
            name: 'London',
            city_code: 'YXU',
            city_name: 'London',
            country_code: 'CA',
            country_name: 'Canada',
          }
        ])
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ([
          {
            type: 'city',
            code: 'VIE',
            name: 'Vienna',
            city_code: 'VIE',
            city_name: 'Vienna',
            country_code: 'AT',
            country_name: 'Austria',
          },
          {
            type: 'city',
            code: 'NHA',
            name: 'Nha Trang',
            city_code: 'NHA',
            city_name: 'Nha Trang',
            country_code: 'VN',
            country_name: 'Vietnam',
          }
        ])
      });
    global.fetch = fetchMock;

    jest.doMock('../../src/config', () => ({
      config: {
        nodeEnv: 'test',
        airportAutocompleteUrl: 'https://autocomplete.travelpayouts.com/places2',
        airportAutocompleteTimeoutMs: 1000,
        publicSearchDrctEnabled: false,
      }
    }));
    jest.doMock('../../src/lib/logger', () => ({
      warn: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
    }));
    jest.doMock('../../src/lib/supabase', () => ({
      from: jest.fn()
    }));
    jest.doMock('../../src/services/drctService', () => ({
      searchOffers: jest.fn()
    }));

    const router = require('../../src/routes/public');
    const app = jsonApp(router);

    const londo = await request(app)
      .get('/airports/autocomplete')
      .query({ q: 'londo', locale: 'en' });
    expect(londo.statusCode).toBe(200);
    expect(londo.body.groups[0].country_name).toBe('United Kingdom');
    expect(londo.body.groups[0].items[0]).toMatchObject({
      code: 'LON',
      city_name: 'London',
    });

    const vie = await request(app)
      .get('/airports/autocomplete')
      .query({ q: 'vie', locale: 'en' });
    expect(vie.statusCode).toBe(200);
    expect(vie.body.groups[0].country_name).toBe('Austria');
    expect(vie.body.groups[0].items[0]).toMatchObject({
      code: 'VIE',
      city_name: 'Vienna',
    });
  });

  test('autocomplete rate limits repeated bursts from one client IP', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ([
        {
          type: 'city',
          code: 'LON',
          name: 'London',
          city_code: 'LON',
          city_name: 'London',
          country_code: 'GB',
          country_name: 'United Kingdom',
        }
      ])
    });
    global.fetch = fetchMock;

    jest.doMock('../../src/config', () => ({
      config: {
        nodeEnv: 'test',
        airportAutocompleteUrl: 'https://autocomplete.travelpayouts.com/places2',
        airportAutocompleteTimeoutMs: 1000,
        publicSearchDrctEnabled: false,
        publicRateLimitWindowMs: 60 * 1000,
        publicAutocompleteRateLimitMax: 1,
        internalApiToken: '',
      }
    }));
    jest.doMock('../../src/lib/logger', () => ({
      warn: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
    }));
    jest.doMock('../../src/lib/supabase', () => ({
      from: jest.fn()
    }));
    jest.doMock('../../src/services/drctService', () => ({
      searchOffers: jest.fn()
    }));

    const router = require('../../src/routes/public');
    const app = jsonApp(router);

    const first = await request(app)
      .get('/airports/autocomplete')
      .set('x-forwarded-for', '203.0.113.10')
      .query({ q: 'lon', locale: 'en' });
    const second = await request(app)
      .get('/airports/autocomplete')
      .set('x-forwarded-for', '203.0.113.10')
      .query({ q: 'lon', locale: 'en' });

    expect(first.statusCode).toBe(200);
    expect(second.statusCode).toBe(429);
    expect(second.body.error.code).toBe('RATE_LIMITED');
  });

  test('public search preserves placeholder behavior while feature flag is disabled', async () => {
    const insertChain = buildSearchInsertMock('search-placeholder-1');
    const from = jest.fn((table) => {
      if (table !== 'searches') throw new Error(`Unexpected table ${table}`);
      return { insert: insertChain.insert };
    });
    const searchOffers = jest.fn();

    jest.doMock('../../src/config', () => ({
      config: {
        nodeEnv: 'test',
        airportAutocompleteUrl: 'https://autocomplete.travelpayouts.com/places2',
        airportAutocompleteTimeoutMs: 1000,
        publicSearchDrctEnabled: false,
      }
    }));
    jest.doMock('../../src/lib/logger', () => ({
      warn: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
    }));
    jest.doMock('../../src/lib/supabase', () => ({ from }));
    jest.doMock('../../src/services/drctService', () => ({ searchOffers }));

    const router = require('../../src/routes/public');
    const app = jsonApp(router);

    const res = await request(app)
      .post('/search')
      .send({
        origin: 'LON,LHR',
        destination: 'JFK',
        origin_city: 'LON',
        destination_city: 'NYC',
        depart_date: '2026-07-01',
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.offers).toEqual([]);
    expect(res.body.origin_airports).toEqual(['LON', 'LHR']);
    expect(res.body.destination_airports).toEqual(['JFK']);
    expect(res.body.message).toMatch(/placeholder response preserved/i);
    expect(searchOffers).not.toHaveBeenCalled();
    expect(from).toHaveBeenCalledWith('searches');
  });

  test('public search fans out across airport pairs and marks partial failures', async () => {
    const insertChain = buildSearchInsertMock('search-fanout-1');
    const from = jest.fn((table) => {
      if (table !== 'searches') throw new Error(`Unexpected table ${table}`);
      return { insert: insertChain.insert };
    });
    const searchOffers = jest.fn(async (params) => {
      if (params.origin === 'LGW') {
        return {
          success: false,
          error: { message: 'provider timeout' }
        };
      }
      return {
        success: true,
        data: {
          offers: [
            {
              offer_id: `${params.origin}-${params.destination}-1`,
              origin: params.origin,
              destination: params.destination,
              airline_code: 'BA',
              flight_number: '117',
              departure_time: '2026-07-01T08:00:00Z',
              arrival_time: '2026-07-01T13:00:00Z',
              price: { total: 500 }
            }
          ]
        }
      };
    });

    jest.doMock('../../src/config', () => ({
      config: {
        nodeEnv: 'test',
        airportAutocompleteUrl: 'https://autocomplete.travelpayouts.com/places2',
        airportAutocompleteTimeoutMs: 1000,
        publicSearchDrctEnabled: true,
      }
    }));
    jest.doMock('../../src/lib/logger', () => ({
      warn: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
    }));
    jest.doMock('../../src/lib/supabase', () => ({ from }));
    jest.doMock('../../src/services/drctService', () => ({ searchOffers }));

    const router = require('../../src/routes/public');
    const app = jsonApp(router);

    const res = await request(app)
      .post('/search')
      .send({
        origin: 'LHR,LGW',
        destination: 'JFK',
        origin_city: 'LON',
        destination_city: 'NYC',
        depart_date: '2026-07-01',
        adults: 1
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.partial).toBe(true);
    expect(res.body.pair_count).toBe(2);
    expect(res.body.offers_count).toBe(1);
    expect(res.body.offers[0]).toMatchObject({
      offer_id: 'LHR-JFK-1',
      _searchOrigin: 'LHR',
      _searchDestination: 'JFK',
    });
    expect(res.body.pair_failures).toHaveLength(1);
    expect(searchOffers).toHaveBeenCalledTimes(2);
  });

  test('public search rejects excessive airport fanout', async () => {
    process.env.PUBLIC_SEARCH_MAX_PAIRS = '2';

    jest.doMock('../../src/config', () => ({
      config: {
        nodeEnv: 'test',
        airportAutocompleteUrl: 'https://autocomplete.travelpayouts.com/places2',
        airportAutocompleteTimeoutMs: 1000,
        publicSearchDrctEnabled: true,
      }
    }));
    jest.doMock('../../src/lib/logger', () => ({
      warn: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
    }));
    jest.doMock('../../src/lib/supabase', () => ({
      from: jest.fn()
    }));
    jest.doMock('../../src/services/drctService', () => ({
      searchOffers: jest.fn()
    }));

    const router = require('../../src/routes/public');
    const app = jsonApp(router);

    const res = await request(app)
      .post('/search')
      .send({
        origin: 'LHR,LGW',
        destination: 'JFK,EWR',
        depart_date: '2026-07-01',
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.error.code).toBe('FANOUT_LIMIT_EXCEEDED');
  });
});
