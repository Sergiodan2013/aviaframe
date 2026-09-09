'use strict';

const express = require('express');
const request = require('supertest');
const { createPartnerApiRouter } = require('../../src/modules/partner-api/routes');

function buildContext() {
  return {
    credential: { id: 'credential-1', scopes: ['offers:read', 'orders:create', 'orders:read'] },
    client: { id: 'client-1', environment: 'sandbox', status: 'ACTIVE' },
    counterparty: { id: 'counterparty-1', status: 'ACTIVE' },
  };
}

function buildQuote(overrides = {}) {
  return {
    id: 'quote-db-1',
    api_client_id: 'client-1',
    counterparty_id: 'counterparty-1',
    external_offer_id: 'off_test_existing',
    external_quote_id: 'quote_test_existing123456',
    upstream_offer_id: 'DRCT-OFFER-SECRET',
    distribution_channel: 'NDC',
    carrier_code: 'EK',
    pricing_plan_version_id: 'version-1',
    supplier_total: '100.00',
    markup_total: '5.00',
    sell_total: '105.00',
    currency: 'USD',
    expires_at: '2099-10-10T00:00:00Z',
    pricing_rule_trace: { passenger_types: ['ADT'] },
    normalized_offer: {
      origin: 'RUH',
      destination: 'DXB',
      departure_time: '2026-10-10 09:00',
      arrival_time: '2026-10-10 11:00',
      airline_name: 'Emirates',
    },
    ...overrides,
  };
}

function buildOrderRequest(overrides = {}) {
  return {
    price_quote_id: 'quote_test_existing123456',
    client_order_ref: 'WEB-1001',
    expected_total: { total: '105.00', currency: 'USD' },
    contact: { email: 'traveler@example.com', phone: '+966500000000' },
    passengers: [{
      type: 'ADT',
      title: 'Mr',
      gender: 'M',
      first_name: 'Omar',
      last_name: 'Saleh',
      date_of_birth: '1990-04-12',
      document: {
        number: 'P1234567',
        issuing_country: 'SA',
        citizenship: 'SA',
        expiration_date: '2030-04-11',
      },
    }],
    ...overrides,
  };
}

function buildPricingContext() {
  return {
    plan: { id: 'plan-1', name: 'Sandbox plan' },
    version: { id: 'version-1', version: 1 },
    rules: [{
      id: 'default-rule',
      channel: 'ANY',
      carrier_code: 'ANY',
      percent_bps: 500,
      fixed_amount: '0',
      action: 'ALLOW',
      enabled: true,
    }],
  };
}

function buildApp({ repository, drctClient }) {
  const authenticate = (req, res, next) => {
    req.partnerContext = buildContext();
    next();
  };
  const app = express();
  app.use(express.json());
  app.use('/partner/v1', createPartnerApiRouter({
    authenticate,
    repository,
    drctClient,
    logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn() },
  }));
  return app;
}

describe('Partner API routes', () => {
  test('search returns opaque AviaFrame identifiers and sell price only', async () => {
    const insertedRows = [];
    const repository = {
      loadActivePricingContext: jest.fn().mockResolvedValue(buildPricingContext()),
      loadEntitlements: jest.fn().mockResolvedValue({
        allowed_operations: ['search', 'price'],
        allowed_channels: ['NDC'],
        allowed_carriers: [],
        denied_carriers: [],
        allow_unknown_channel: false,
      }),
      listChannelMappings: jest.fn().mockResolvedValue([]),
      insertOfferQuotes: jest.fn(async (rows) => insertedRows.push(...rows)),
    };
    const drctClient = {
      searchOffers: jest.fn().mockResolvedValue({
        search_id: 'drct-search-secret',
        offers: [{
          offer_id: 'DRCT-OFFER-SECRET',
          channel: 'NDC',
          price: { total: 100, currency: 'USD' },
          airline_code: 'EK',
          airline_name: 'Emirates',
          origin: 'RUH',
          destination: 'DXB',
          departure_time: '2026-10-10 09:00',
          arrival_time: '2026-10-10 11:00',
          segments: [],
        }],
      }),
    };

    const response = await request(buildApp({ repository, drctClient }))
      .post('/partner/v1/offers/search')
      .set('X-Correlation-ID', 'corr-123')
      .send({
        slices: [{ origin: 'RUH', destination: 'DXB', departure_date: '2026-10-10' }],
        passengers: [{ type: 'ADT' }],
      });

    expect(response.statusCode).toBe(200);
    expect(response.headers['x-correlation-id']).toBe('corr-123');
    expect(response.body.search_id).toMatch(/^srch_test_/);
    expect(response.body.meta).toEqual({
      offer_count: 1,
      provider_offer_count: 1,
      excluded_offer_count: 0,
    });
    expect(response.body.offers[0]).toEqual(expect.objectContaining({
      offer_id: expect.stringMatching(/^off_test_/),
      price_quote_id: expect.stringMatching(/^quote_test_/),
      distribution_channel: 'NDC',
      price: { total: '105.00', currency: 'USD' },
    }));
    expect(JSON.stringify(response.body)).not.toContain('DRCT-OFFER-SECRET');
    expect(JSON.stringify(response.body)).not.toContain('supplier_total');
    expect(insertedRows[0]).toEqual(expect.objectContaining({
      upstream_offer_id: 'DRCT-OFFER-SECRET',
      supplier_total: '100.00',
      markup_total: '5.00',
      sell_total: '105.00',
    }));
  });

  test('search prices DRCT Lufthansa Group offers as NDC content', async () => {
    const repository = {
      loadActivePricingContext: jest.fn().mockResolvedValue(buildPricingContext()),
      loadEntitlements: jest.fn().mockResolvedValue({
        allowed_operations: ['search', 'price'],
        allowed_channels: ['NDC'],
        allowed_carriers: [],
        denied_carriers: [],
        allow_unknown_channel: false,
      }),
      listChannelMappings: jest.fn().mockResolvedValue([]),
      insertOfferQuotes: jest.fn().mockResolvedValue(undefined),
    };
    const drctClient = {
      searchOffers: jest.fn().mockResolvedValue({
        search_id: 'drct-search-lh',
        offers: [{
          offer_id: 'LH_provider_offer',
          channel: 'Lufthansa Group',
          price: { total: 100, currency: 'USD' },
          airline_code: 'LH',
          airline_name: 'Lufthansa',
          origin: 'LON',
          destination: 'MIL',
          segments: [],
        }],
      }),
    };

    const response = await request(buildApp({ repository, drctClient }))
      .post('/partner/v1/offers/search')
      .send({
        slices: [{ origin: 'LON', destination: 'MIL', departure_date: '2026-10-25' }],
        passengers: [{ type: 'ADT' }],
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.offers).toHaveLength(1);
    expect(response.body.offers[0]).toEqual(expect.objectContaining({
      distribution_channel: 'NDC',
      validating_carrier: 'LH',
      price: { total: '105.00', currency: 'USD' },
    }));
  });

  test('price creates a new immutable quote for an offer owned by the API client', async () => {
    const insertOfferQuotes = jest.fn().mockResolvedValue(undefined);
    const repository = {
      findLatestOfferQuote: jest.fn().mockResolvedValue({
        api_client_id: 'client-1',
        external_offer_id: 'off_test_existing',
        external_quote_id: 'quote_test_old',
        upstream_offer_id: 'DRCT-OFFER-1',
        upstream_search_id: 'DRCT-SEARCH-1',
        distribution_channel: 'NDC',
        carrier_code: 'EK',
        expires_at: '2099-10-10T00:00:00Z',
        normalized_offer: {
          offer_id: 'off_test_existing',
          price_quote_id: 'quote_test_old',
          distribution_channel: 'NDC',
          validating_carrier: 'EK',
          price: { total: '105.00', currency: 'USD' },
          valid_until: '2099-10-10T00:00:00Z',
        },
      }),
      loadActivePricingContext: jest.fn().mockResolvedValue(buildPricingContext()),
      loadEntitlements: jest.fn().mockResolvedValue({
        allowed_operations: ['search', 'price'],
        allowed_channels: ['NDC'],
        allowed_carriers: [],
        denied_carriers: [],
        allow_unknown_channel: false,
      }),
      insertOfferQuotes,
    };
    const drctClient = {
      priceOffer: jest.fn().mockResolvedValue({
        offer_id: 'DRCT-OFFER-1-REPRICED',
        price: { total: 102, currency: 'USD' },
        expiration: '2099-10-10T00:00:00Z',
      }),
    };

    const response = await request(buildApp({ repository, drctClient }))
      .post('/partner/v1/offers/off_test_existing/price')
      .send({ passengers: [{ type: 'ADT' }] });

    expect(response.statusCode).toBe(200);
    expect(response.body.offer_id).toBe('off_test_existing');
    expect(response.body.price_quote_id).toMatch(/^quote_test_/);
    expect(response.body.price).toEqual({ total: '107.10', currency: 'USD' });
    expect(insertOfferQuotes).toHaveBeenCalledWith([
      expect.objectContaining({
        external_offer_id: 'off_test_existing',
        upstream_offer_id: 'DRCT-OFFER-1-REPRICED',
        supplier_total: '102.00',
        sell_total: '107.10',
      }),
    ]);
  });

  test('validation errors use the Partner API error envelope', async () => {
    const app = buildApp({ repository: {}, drctClient: {} });
    const response = await request(app)
      .post('/partner/v1/offers/search')
      .send({ slices: [], passengers: [] });

    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual(expect.objectContaining({
      code: 'VALIDATION_ERROR',
      message: 'Search request is invalid',
      details: expect.any(Array),
      correlation_id: expect.any(String),
    }));
    expect(response.body).not.toHaveProperty('error');
  });

  test('rejects unsupported multi-city input instead of silently converting it to a return trip', async () => {
    const app = buildApp({ repository: {}, drctClient: {} });
    const response = await request(app)
      .post('/partner/v1/offers/search')
      .send({
        slices: [
          { origin: 'RUH', destination: 'DXB', departure_date: '2026-10-10' },
          { origin: 'DXB', destination: 'LHR', departure_date: '2026-10-18' },
        ],
        passengers: [{ type: 'ADT' }],
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.details).toContainEqual(expect.objectContaining({ field: 'slices[1]' }));
  });

  test('creates an order from the owned quote without exposing supplier identifiers or cost', async () => {
    const repository = {
      findOfferQuoteByExternalId: jest.fn().mockResolvedValue(buildQuote()),
      loadEntitlements: jest.fn().mockResolvedValue({
        allowed_operations: ['create_order'],
        allowed_channels: ['NDC'],
        allowed_carriers: [],
        denied_carriers: [],
      }),
      claimIdempotencyRecord: jest.fn().mockResolvedValue({ created: true, record: { id: 'idem-1' } }),
      createPartnerOrderDraft: jest.fn().mockResolvedValue({ order_id: 'local-order-1', context_id: 'context-1' }),
      updatePartnerOrderState: jest.fn().mockResolvedValue({ order_id: 'local-order-1' }),
      completeIdempotencyRecord: jest.fn().mockResolvedValue(undefined),
    };
    const drctClient = {
      createOrder: jest.fn().mockResolvedValue({
        order_id: 'DRCT-ORDER-SECRET',
        status: 'CREATED',
        pnr: 'ABC123',
        payment: { deadline: '2099-10-10T01:00:00Z' },
      }),
    };

    const response = await request(buildApp({ repository, drctClient }))
      .post('/partner/v1/orders')
      .set('Idempotency-Key', 'order-key-1001')
      .send(buildOrderRequest());

    expect(response.statusCode).toBe(201);
    expect(response.body).toEqual(expect.objectContaining({
      order_id: expect.stringMatching(/^ord_test_/),
      client_order_ref: 'WEB-1001',
      status: 'CREATED',
      price: { total: '105.00', currency: 'USD' },
      booking_reference: 'ABC123',
    }));
    expect(JSON.stringify(response.body)).not.toContain('DRCT-ORDER-SECRET');
    expect(JSON.stringify(response.body)).not.toContain('supplier_total');
    expect(drctClient.createOrder).toHaveBeenCalledWith(
      expect.objectContaining({ offer_id: 'DRCT-OFFER-SECRET' }),
      expect.objectContaining({ sandbox: true, idempotencyKey: expect.stringMatching(/^af-/) }),
    );
  });

  test('returns the original response for an idempotent replay', async () => {
    const storedResponse = {
      order_id: 'ord_test_stored123456',
      client_order_ref: 'WEB-1001',
      status: 'CREATED',
      price_quote_id: 'quote_test_existing123456',
      price: { total: '105.00', currency: 'USD' },
      booking_reference: 'ABC123',
      payment_deadline: null,
      created_at: '2026-09-05T15:04:00Z',
    };
    const body = buildOrderRequest();
    const { requestHash } = require('../../src/modules/partner-api/orders');
    const repository = {
      findOfferQuoteByExternalId: jest.fn().mockResolvedValue(buildQuote()),
      loadEntitlements: jest.fn().mockResolvedValue({
        allowed_operations: ['create_order'], allowed_channels: ['NDC'], allowed_carriers: [], denied_carriers: [],
      }),
      claimIdempotencyRecord: jest.fn().mockResolvedValue({
        created: false,
        record: {
          request_hash: requestHash(body),
          completed_at: '2026-09-05T15:04:01Z',
          response_status: 201,
          response_body: storedResponse,
        },
      }),
    };

    const response = await request(buildApp({ repository, drctClient: {} }))
      .post('/partner/v1/orders')
      .set('Idempotency-Key', 'order-key-1001')
      .send(body);

    expect(response.statusCode).toBe(201);
    expect(response.headers['idempotency-replayed']).toBe('true');
    expect(response.body).toEqual(storedResponse);
  });

  test('rejects a client total that does not match the immutable quote', async () => {
    const repository = {
      findOfferQuoteByExternalId: jest.fn().mockResolvedValue(buildQuote()),
      loadEntitlements: jest.fn().mockResolvedValue({
        allowed_operations: ['create_order'], allowed_channels: ['NDC'], allowed_carriers: [], denied_carriers: [],
      }),
      claimIdempotencyRecord: jest.fn().mockResolvedValue({ created: true, record: { id: 'idem-1' } }),
      completeIdempotencyRecord: jest.fn().mockResolvedValue(undefined),
    };
    const response = await request(buildApp({ repository, drctClient: {} }))
      .post('/partner/v1/orders')
      .set('Idempotency-Key', 'order-key-1001')
      .send(buildOrderRequest({ expected_total: { total: '100.00', currency: 'USD' } }));

    expect(response.statusCode).toBe(409);
    expect(response.body.code).toBe('PRICE_MISMATCH');
  });

  test('returns a stable order id and 202 when supplier outcome is uncertain', async () => {
    const timeout = Object.assign(new Error('timeout'), { code: 'ETIMEDOUT' });
    const repository = {
      findOfferQuoteByExternalId: jest.fn().mockResolvedValue(buildQuote()),
      loadEntitlements: jest.fn().mockResolvedValue({
        allowed_operations: ['create_order'], allowed_channels: ['NDC'], allowed_carriers: [], denied_carriers: [],
      }),
      claimIdempotencyRecord: jest.fn().mockResolvedValue({ created: true, record: { id: 'idem-1' } }),
      createPartnerOrderDraft: jest.fn().mockResolvedValue({ order_id: 'local-order-1' }),
      updatePartnerOrderState: jest.fn().mockResolvedValue({ order_id: 'local-order-1' }),
      completeIdempotencyRecord: jest.fn().mockResolvedValue(undefined),
    };
    const drctClient = { createOrder: jest.fn().mockRejectedValue(timeout) };
    const response = await request(buildApp({ repository, drctClient }))
      .post('/partner/v1/orders')
      .set('Idempotency-Key', 'order-key-1001')
      .send(buildOrderRequest());

    expect(response.statusCode).toBe(202);
    expect(response.body.status).toBe('PENDING_RECONCILE');
    expect(response.body.order_id).toMatch(/^ord_test_/);
    expect(repository.updatePartnerOrderState).toHaveBeenCalledWith(expect.objectContaining({
      status: 'PENDING_RECONCILE',
      reconcileRequired: true,
    }));
  });

  test('retrieves only the API-client scoped order representation', async () => {
    const order = {
      partner_response: {
        order_id: 'ord_test_existing123456',
        client_order_ref: 'WEB-1001',
        status: 'CREATED',
        price_quote_id: 'quote_test_existing123456',
        price: { total: '105.00', currency: 'USD' },
        booking_reference: 'ABC123',
        payment_deadline: null,
        created_at: '2026-09-05T15:04:00Z',
      },
    };
    const repository = { findPartnerOrder: jest.fn().mockResolvedValue(order) };
    const response = await request(buildApp({ repository, drctClient: {} }))
      .get('/partner/v1/orders/ord_test_existing123456');

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual(order.partner_response);
    expect(repository.findPartnerOrder).toHaveBeenCalledWith({
      apiClientId: 'client-1',
      externalOrderId: 'ord_test_existing123456',
    });
  });
});
