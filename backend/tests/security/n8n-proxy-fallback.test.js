'use strict';

const express = require('express');
const request = require('supertest');

function emptyRouter() {
  return express.Router();
}

describe('legacy DRCT order proxy — decommissioned', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env = { ...originalEnv, N8N_WEBHOOK_URL: 'https://n8n.example.com/webhook' };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  function mockBaseDependencies() {
    jest.doMock('../../src/config', () => ({
      config: { corsOrigins: [], searchProxyRateLimitMax: 100, publicRateLimitWindowMs: 60000 },
    }));
    jest.doMock('../../src/lib/logger', () => ({
      child: jest.fn(function child() { return this; }),
      warn: jest.fn(), info: jest.fn(), error: jest.fn(),
    }));
    jest.doMock('../../src/lib/metrics', () => ({
      client: { register: { contentType: 'text/plain', metrics: jest.fn(async () => '') } },
      httpDuration: { observe: jest.fn() },
    }));
    jest.doMock('../../src/middleware/auth', () => ({ requireInternalToken: jest.fn(() => true) }));
    jest.doMock('../../src/middleware/requestGuards', () => ({
      createMemoryRateLimiter: jest.fn(() => (req, res, next) => next()),
      hasValidInternalToken: jest.fn(() => false),
    }));
    jest.doMock('pino-http', () => jest.fn(() => (req, res, next) => next()));
    jest.doMock('../../src/services/drctDirectClient', () => ({
      searchOffers: jest.fn().mockResolvedValue({ offers: [] }),
      createOrder: jest.fn(),
      issueOrder: jest.fn(),
    }));
    jest.doMock('../../src/utils/offerFilters', () => ({ filterBookableOffers: jest.fn((o) => ({ kept: o, dropped: 0 })) }));

    for (const route of ['health', 'widget', 'orders', 'admin', 'internalQa', 'agency-reports', 'agency', 'agencyLeads', 'notifications', 'webhooks', 'support', 'public', 'documents', 'payments', 'tamara']) {
      jest.doMock(`../../src/routes/${route}`, () => emptyRouter());
    }
  }

  test('POST /webhook/drct/order/create returns 404 — route is decommissioned', async () => {
    mockBaseDependencies();
    const app = require('../../src/app');
    const res = await request(app)
      .post('/webhook/drct/order/create')
      .send({ offer_id: 'offer-1' });
    expect(res.statusCode).toBe(404);
  });

  test('POST /webhook/drct/order/issue returns 404 — route is decommissioned', async () => {
    mockBaseDependencies();
    const app = require('../../src/app');
    const res = await request(app)
      .post('/webhook/drct/order/issue')
      .send({ order_id: 'ord-1' });
    expect(res.statusCode).toBe(404);
  });

  test('POST /webhook/drct/order/cancel returns 404 — route is decommissioned', async () => {
    mockBaseDependencies();
    const app = require('../../src/app');
    const res = await request(app)
      .post('/webhook/drct/order/cancel')
      .send({ order_id: 'ord-1' });
    expect(res.statusCode).toBe(404);
  });
});
