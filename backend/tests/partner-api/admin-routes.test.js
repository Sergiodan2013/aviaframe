'use strict';

const express = require('express');
const request = require('supertest');
const {
  createPartnerApiAdminRouter,
  generateApiKey,
  validatePricingRules,
} = require('../../src/routes/admin/partner-api');

function appFor({ supabase, role = 'super_admin' }) {
  const app = express();
  app.use(express.json());
  app.use('/api/admin/partner-api', createPartnerApiAdminRouter({
    supabase,
    resolveAuth: jest.fn().mockResolvedValue({
      user: { id: 'user-1' },
      profile: { id: 'user-1', role },
    }),
    authorizeSuperAdmin: (auth, res) => {
      if (auth.profile.role === 'super_admin') return true;
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Super admin role required' } });
      return false;
    },
  }));
  return app;
}

describe('Partner API super-admin routes', () => {
  test('generates environment-specific AviaFrame keys', () => {
    expect(generateApiKey('sandbox')).toMatch(/^af_test_[A-Za-z0-9_-]{40,}$/);
    expect(generateApiKey('production')).toMatch(/^af_live_[A-Za-z0-9_-]{40,}$/);
  });

  test('pricing publication requires a default inheritance rule', () => {
    expect(validatePricingRules([{ channel: 'NDC', carrier_code: 'EK', percent_bps: 300 }]))
      .toContainEqual(expect.objectContaining({ field: 'rules' }));
  });

  test('provisions a sandbox counterparty and returns the raw key only in the response', async () => {
    const rpc = jest.fn().mockResolvedValue({
      data: { counterparty_id: 'counterparty-1', client_id: 'client-1' },
      error: null,
    });
    const response = await request(appFor({ supabase: { rpc } }))
      .post('/api/admin/partner-api/counterparties')
      .send({
        legal_name: 'Gulf Travel LLC',
        trading_name: 'Gulf Travel',
        country_code: 'SA',
        settlement_currency: 'SAR',
        default_percent: 4.5,
        default_fixed_amount: 8,
        allowed_channels: ['GDS', 'NDC', 'LCC'],
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.api_key).toMatch(/^af_test_/);
    expect(response.body.api_key_display_once).toBe(true);
    expect(rpc).toHaveBeenCalledWith('provision_partner_api_counterparty', expect.objectContaining({
      p_key_hash: expect.stringMatching(/^[a-f0-9]{64}$/),
      p_key_prefix: expect.stringMatching(/^af_test_/),
      p_scopes: ['offers:read', 'orders:create', 'orders:read'],
      p_payload: expect.objectContaining({ default_percent_bps: 450 }),
    }));
    expect(JSON.stringify(rpc.mock.calls[0])).not.toContain(response.body.api_key);
  });

  test('rejects ordinary admins before any database access', async () => {
    const supabase = { from: jest.fn() };
    const response = await request(appFor({ supabase, role: 'admin' }))
      .get('/api/admin/partner-api/counterparties');

    expect(response.statusCode).toBe(403);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  test('returns a super-admin price audit without supplier identifiers', async () => {
    const maybeSingle = jest.fn().mockResolvedValue({
      data: {
        external_offer_id: 'off_test_123',
        external_quote_id: 'quote_test_123',
        environment: 'sandbox',
        distribution_channel: 'NDC',
        carrier_code: 'LH',
        pricing_plan_version_id: 'version-1',
        supplier_total: 700,
        markup_total: 60.22,
        sell_total: 760.22,
        currency: 'SAR',
        pricing_rule_trace: { percentage_markup: '35.00', fixed_markup: '25.22' },
        expires_at: '2026-10-08T07:00:00Z',
        consumed_at: null,
        created_at: '2026-10-08T06:30:00Z',
      },
      error: null,
    });
    const secondEq = jest.fn().mockReturnValue({ maybeSingle });
    const firstEq = jest.fn().mockReturnValue({ eq: secondEq });
    const select = jest.fn().mockReturnValue({ eq: firstEq });
    const supabase = { from: jest.fn().mockReturnValue({ select }) };

    const response = await request(appFor({ supabase }))
      .get('/api/admin/partner-api/quotes/quote_test_123/audit?counterparty_id=counterparty-1');

    expect(response.statusCode).toBe(200);
    expect(response.body.quote).toEqual(expect.objectContaining({
      supplier_total: '700',
      markup_total: '60.22',
      sell_total: '760.22',
    }));
    expect(JSON.stringify(response.body)).not.toContain('upstream_');
  });
});
