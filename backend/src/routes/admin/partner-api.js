'use strict';

const crypto = require('crypto');
const express = require('express');

const COUNTERPARTY_STATUSES = new Set(['DRAFT', 'SANDBOX', 'ACTIVE', 'SUSPENDED', 'TERMINATED']);
const CHANNELS = new Set(['ANY', 'GDS', 'NDC', 'LCC', 'UNKNOWN']);
const ACTIONS = new Set(['ALLOW', 'DENY']);

function defaultResolveAuth(req) {
  return require('../../middleware/auth').resolveAuthContext(req);
}

function defaultAuthorizeSuperAdmin(auth, res) {
  return require('../../middleware/auth').ensureSuperAdmin(auth, res);
}

function errorResponse(res, status, code, message, details = []) {
  return res.status(status).json({ error: { code, message, details } });
}

function validateCounterparty(body = {}) {
  const details = [];
  if (String(body.legal_name || '').trim().length < 2) details.push({ field: 'legal_name', issue: 'Legal name is required' });
  if (!/^[A-Z]{2}$/.test(String(body.country_code || 'SA'))) details.push({ field: 'country_code', issue: 'Use an ISO country code' });
  if (!/^[A-Z]{3}$/.test(String(body.settlement_currency || 'SAR'))) details.push({ field: 'settlement_currency', issue: 'Use an ISO currency code' });
  const percent = Number(body.default_percent ?? 0);
  const fixed = Number(body.default_fixed_amount ?? 0);
  if (!Number.isFinite(percent) || percent < 0 || percent > 1000) details.push({ field: 'default_percent', issue: 'Must be between 0 and 1000' });
  if (!Number.isFinite(fixed) || fixed < 0) details.push({ field: 'default_fixed_amount', issue: 'Must be zero or greater' });
  const channels = Array.isArray(body.allowed_channels) ? body.allowed_channels : [];
  if (!channels.length || channels.some((channel) => !['GDS', 'NDC', 'LCC'].includes(channel))) {
    details.push({ field: 'allowed_channels', issue: 'Select at least one of GDS, NDC, or LCC' });
  }
  return details;
}

function validatePricingRules(rules = []) {
  const details = [];
  if (!Array.isArray(rules) || !rules.length) return [{ field: 'rules', issue: 'At least one pricing rule is required' }];
  if (!rules.some((rule) => (rule.channel || 'ANY') === 'ANY' && (rule.carrier_code || 'ANY') === 'ANY')) {
    details.push({ field: 'rules', issue: 'A default ANY/ANY rule is required' });
  }
  rules.forEach((rule, index) => {
    const channel = String(rule.channel || 'ANY').toUpperCase();
    const carrier = String(rule.carrier_code || 'ANY').toUpperCase();
    const action = String(rule.action || 'ALLOW').toUpperCase();
    const bps = Number(rule.percent_bps || 0);
    const fixed = Number(rule.fixed_amount || 0);
    if (!CHANNELS.has(channel)) details.push({ field: `rules[${index}].channel`, issue: 'Invalid channel' });
    if (carrier !== 'ANY' && !/^[A-Z0-9]{2,3}$/.test(carrier)) details.push({ field: `rules[${index}].carrier_code`, issue: 'Use ANY or a 2-3 character carrier code' });
    if (!ACTIONS.has(action)) details.push({ field: `rules[${index}].action`, issue: 'Use ALLOW or DENY' });
    if (!Number.isInteger(bps) || bps < 0 || bps > 100000) details.push({ field: `rules[${index}].percent_bps`, issue: 'Must be 0-100000 basis points' });
    if (!Number.isFinite(fixed) || fixed < 0) details.push({ field: `rules[${index}].fixed_amount`, issue: 'Must be zero or greater' });
    if (fixed > 0 && !/^[A-Z]{3}$/.test(String(rule.fixed_currency || ''))) {
      details.push({ field: `rules[${index}].fixed_currency`, issue: 'Currency is required for a fixed markup' });
    }
  });
  return details;
}

function generateApiKey(environment) {
  const mode = environment === 'production' ? 'live' : 'test';
  return `af_${mode}_${crypto.randomBytes(32).toString('base64url')}`;
}

function createPartnerApiAdminRouter({
  supabase,
  resolveAuth = defaultResolveAuth,
  authorizeSuperAdmin = defaultAuthorizeSuperAdmin,
}) {
  const router = express.Router();

  router.use(async (req, res, next) => {
    const auth = await resolveAuth(req);
    if (auth.error) return errorResponse(res, 401, 'UNAUTHORIZED', auth.error);
    if (!authorizeSuperAdmin(auth, res)) return undefined;
    req.adminAuth = auth;
    return next();
  });

  router.get('/counterparties', async (_req, res) => {
    const { data: counterparties, error } = await supabase
      .from('api_counterparties')
      .select('id,legal_name,trading_name,country_code,settlement_currency,settlement_mode,credit_limit,billing_terms_days,status,commercial_contact,technical_contact,created_at,updated_at')
      .order('created_at', { ascending: false });
    if (error) return errorResponse(res, 500, 'DB_ERROR', 'Failed to load API counterparties');

    const ids = (counterparties || []).map((item) => item.id);
    let clients = [];
    if (ids.length) {
      const clientResult = await supabase
        .from('api_clients')
        .select('id,counterparty_id,name,environment,status,rate_limits,price_visibility,created_at')
        .in('counterparty_id', ids)
        .order('created_at', { ascending: true });
      if (clientResult.error) return errorResponse(res, 500, 'DB_ERROR', 'Failed to load API clients');
      clients = clientResult.data || [];
    }

    return res.json({
      counterparties: (counterparties || []).map((counterparty) => ({
        ...counterparty,
        clients: clients.filter((client) => client.counterparty_id === counterparty.id),
      })),
    });
  });

  router.get('/counterparties/:counterpartyId', async (req, res) => {
    const { counterpartyId } = req.params;
    const { data: counterparty, error } = await supabase
      .from('api_counterparties')
      .select('*')
      .eq('id', counterpartyId)
      .maybeSingle();
    if (error) return errorResponse(res, 500, 'DB_ERROR', 'Failed to load API counterparty');
    if (!counterparty) return errorResponse(res, 404, 'NOT_FOUND', 'API counterparty not found');

    const [{ data: clients, error: clientsError }, { data: plans, error: plansError }] = await Promise.all([
      supabase.from('api_clients').select('*').eq('counterparty_id', counterpartyId).order('created_at'),
      supabase.from('pricing_plans').select('*').eq('counterparty_id', counterpartyId).order('created_at'),
    ]);
    if (clientsError || plansError) return errorResponse(res, 500, 'DB_ERROR', 'Failed to load API configuration');

    const clientIds = (clients || []).map((client) => client.id);
    const versionIds = (plans || []).map((plan) => plan.active_version_id).filter(Boolean);
    const entitlementResult = clientIds.length
      ? await supabase.from('api_entitlements').select('*').in('api_client_id', clientIds)
      : { data: [], error: null };
    const credentialResult = clientIds.length
      ? await supabase.from('api_credentials').select('id,api_client_id,name,key_prefix,scopes,expires_at,last_used_at,revoked_at,created_at').in('api_client_id', clientIds).order('created_at', { ascending: false })
      : { data: [], error: null };
    const versionResult = versionIds.length
      ? await supabase.from('pricing_plan_versions').select('*').in('id', versionIds)
      : { data: [], error: null };
    const ruleResult = versionIds.length
      ? await supabase.from('pricing_rules').select('*').in('pricing_plan_version_id', versionIds).order('priority')
      : { data: [], error: null };
    if (entitlementResult.error || credentialResult.error || versionResult.error || ruleResult.error) {
      return errorResponse(res, 500, 'DB_ERROR', 'Failed to load API configuration details');
    }

    return res.json({
      counterparty,
      clients: (clients || []).map((client) => ({
        ...client,
        entitlements: (entitlementResult.data || []).find((item) => item.api_client_id === client.id) || null,
        credentials: (credentialResult.data || []).filter((item) => item.api_client_id === client.id),
      })),
      pricing_plans: (plans || []).map((plan) => ({
        ...plan,
        active_version: (versionResult.data || []).find((version) => version.id === plan.active_version_id) || null,
        rules: (ruleResult.data || []).filter((rule) => rule.pricing_plan_version_id === plan.active_version_id),
      })),
    });
  });

  router.get('/quotes/:quoteId/audit', async (req, res) => {
    const counterpartyId = String(req.query?.counterparty_id || '').trim();
    if (!counterpartyId) {
      return errorResponse(res, 400, 'VALIDATION_ERROR', 'counterparty_id is required', [
        { field: 'counterparty_id', issue: 'Select the counterparty that owns this quote' },
      ]);
    }

    const { data: quote, error } = await supabase
      .from('offer_quotes')
      .select('external_offer_id,external_quote_id,environment,distribution_channel,carrier_code,pricing_plan_version_id,supplier_total,markup_total,sell_total,currency,pricing_rule_trace,expires_at,consumed_at,created_at')
      .eq('external_quote_id', req.params.quoteId)
      .eq('counterparty_id', counterpartyId)
      .maybeSingle();
    if (error) return errorResponse(res, 500, 'DB_ERROR', 'Failed to load quote price audit');
    if (!quote) return errorResponse(res, 404, 'QUOTE_NOT_FOUND', 'Quote does not exist for this counterparty');

    return res.json({
      quote: {
        ...quote,
        supplier_total: String(quote.supplier_total),
        markup_total: String(quote.markup_total),
        sell_total: String(quote.sell_total),
      },
    });
  });

  router.post('/counterparties', async (req, res) => {
    const details = validateCounterparty(req.body);
    if (details.length) return errorResponse(res, 400, 'VALIDATION_ERROR', 'Counterparty configuration is invalid', details);

    const rawKey = generateApiKey('sandbox');
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const payload = {
      ...req.body,
      legal_name: String(req.body.legal_name).trim(),
      country_code: String(req.body.country_code || 'SA').toUpperCase(),
      settlement_currency: String(req.body.settlement_currency || 'SAR').toUpperCase(),
      default_percent_bps: Math.round(Number(req.body.default_percent || 0) * 100),
      default_fixed_amount: String(req.body.default_fixed_amount || 0),
      default_fixed_currency: String(req.body.settlement_currency || 'SAR').toUpperCase(),
    };
    const { data, error } = await supabase.rpc('provision_partner_api_counterparty', {
      p_payload: payload,
      p_created_by: req.adminAuth.profile.id,
      p_key_hash: keyHash,
      p_key_prefix: rawKey.slice(0, 20),
      p_scopes: ['offers:read', 'orders:create', 'orders:read'],
    });
    if (error) return errorResponse(res, 500, 'PROVISION_FAILED', 'Failed to provision API counterparty');
    return res.status(201).json({ provisioning: data, api_key: rawKey, api_key_display_once: true });
  });

  router.post('/counterparties/:counterpartyId/clients', async (req, res) => {
    const { counterpartyId } = req.params;
    const environment = String(req.body?.environment || '').trim().toLowerCase();
    if (!['sandbox', 'production'].includes(environment)) {
      return errorResponse(res, 400, 'VALIDATION_ERROR', 'Client environment is invalid', [
        { field: 'environment', issue: 'Use sandbox or production' },
      ]);
    }
    const { data: counterparty, error: counterpartyError } = await supabase
      .from('api_counterparties')
      .select('id,settlement_currency')
      .eq('id', counterpartyId)
      .maybeSingle();
    if (counterpartyError) return errorResponse(res, 500, 'DB_ERROR', 'Failed to load API counterparty');
    if (!counterparty) return errorResponse(res, 404, 'NOT_FOUND', 'API counterparty not found');

    const rawKey = generateApiKey(environment);
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const payload = {
      name: req.body?.name || undefined,
      allowed_channels: Array.isArray(req.body?.allowed_channels) && req.body.allowed_channels.length
        ? req.body.allowed_channels
        : ['GDS', 'NDC', 'LCC'],
      default_percent_bps: Math.round(Number(req.body?.default_percent || 0) * 100),
      default_fixed_amount: String(req.body?.default_fixed_amount || 0),
      default_fixed_currency: String(req.body?.settlement_currency || counterparty.settlement_currency || 'SAR').toUpperCase(),
      rate_limits: req.body?.rate_limits || undefined,
    };
    const { data, error } = await supabase.rpc('provision_partner_api_client', {
      p_counterparty_id: counterpartyId,
      p_environment: environment,
      p_payload: payload,
      p_created_by: req.adminAuth.profile.id,
      p_key_hash: keyHash,
      p_key_prefix: rawKey.slice(0, 20),
      p_scopes: ['offers:read', 'orders:create', 'orders:read'],
    });
    if (error) return errorResponse(res, 500, 'PROVISION_FAILED', 'Failed to provision API client');
    return res.status(201).json({ provisioning: data, api_key: rawKey, api_key_display_once: true });
  });

  router.patch('/counterparties/:counterpartyId', async (req, res) => {
    const allowed = {};
    for (const field of ['legal_name', 'trading_name', 'tax_number', 'contract_number', 'contract_starts_on', 'contract_ends_on', 'credit_limit', 'billing_terms_days', 'commercial_contact', 'technical_contact', 'finance_contact']) {
      if (Object.prototype.hasOwnProperty.call(req.body || {}, field)) allowed[field] = req.body[field];
    }
    if (Object.prototype.hasOwnProperty.call(req.body || {}, 'status')) {
      const status = String(req.body.status).toUpperCase();
      if (!COUNTERPARTY_STATUSES.has(status)) return errorResponse(res, 400, 'INVALID_STATUS', 'Invalid counterparty status');
      allowed.status = status;
    }
    allowed.updated_at = new Date().toISOString();
    const { data, error } = await supabase
      .from('api_counterparties')
      .update(allowed)
      .eq('id', req.params.counterpartyId)
      .select('*')
      .maybeSingle();
    if (error) return errorResponse(res, 500, 'DB_ERROR', 'Failed to update API counterparty');
    if (!data) return errorResponse(res, 404, 'NOT_FOUND', 'API counterparty not found');
    return res.json({ counterparty: data });
  });

  router.post('/clients/:clientId/credentials', async (req, res) => {
    const { data: client, error: clientError } = await supabase
      .from('api_clients')
      .select('id,environment')
      .eq('id', req.params.clientId)
      .maybeSingle();
    if (clientError) return errorResponse(res, 500, 'DB_ERROR', 'Failed to load API client');
    if (!client) return errorResponse(res, 404, 'NOT_FOUND', 'API client not found');

    const rawKey = generateApiKey(client.environment);
    const scopes = Array.isArray(req.body?.scopes) && req.body.scopes.length
      ? req.body.scopes
      : ['offers:read', 'orders:create', 'orders:read'];
    const { data, error } = await supabase
      .from('api_credentials')
      .insert({
        api_client_id: client.id,
        name: String(req.body?.name || 'API key').slice(0, 100),
        key_hash: crypto.createHash('sha256').update(rawKey).digest('hex'),
        key_prefix: rawKey.slice(0, 20),
        scopes,
        expires_at: req.body?.expires_at || null,
        created_by: req.adminAuth.profile.id,
      })
      .select('id,api_client_id,name,key_prefix,scopes,expires_at,created_at')
      .single();
    if (error) return errorResponse(res, 500, 'DB_ERROR', 'Failed to create API credential');
    return res.status(201).json({ credential: data, api_key: rawKey, api_key_display_once: true });
  });

  router.delete('/clients/:clientId/credentials/:credentialId', async (req, res) => {
    const { data, error } = await supabase
      .from('api_credentials')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', req.params.credentialId)
      .eq('api_client_id', req.params.clientId)
      .select('id')
      .maybeSingle();
    if (error) return errorResponse(res, 500, 'DB_ERROR', 'Failed to revoke API credential');
    if (!data) return errorResponse(res, 404, 'NOT_FOUND', 'API credential not found');
    return res.json({ revoked: true });
  });

  router.post('/counterparties/:counterpartyId/pricing-versions', async (req, res) => {
    const rules = Array.isArray(req.body?.rules) ? req.body.rules.map((rule) => ({
      ...rule,
      channel: String(rule.channel || 'ANY').toUpperCase(),
      carrier_code: String(rule.carrier_code || 'ANY').toUpperCase(),
      action: String(rule.action || 'ALLOW').toUpperCase(),
    })) : [];
    const details = validatePricingRules(rules);
    if (details.length) return errorResponse(res, 400, 'VALIDATION_ERROR', 'Pricing rules are invalid', details);
    const environment = String(req.body?.environment || 'sandbox').toLowerCase();
    if (!['sandbox', 'production'].includes(environment)) return errorResponse(res, 400, 'INVALID_ENVIRONMENT', 'Use sandbox or production');

    const { data, error } = await supabase.rpc('publish_partner_pricing_version', {
      p_counterparty_id: req.params.counterpartyId,
      p_environment: environment,
      p_rules: rules,
      p_change_note: String(req.body?.change_note || '').slice(0, 500),
      p_actor_id: req.adminAuth.profile.id,
    });
    if (error) return errorResponse(res, 500, 'PUBLISH_FAILED', 'Failed to publish pricing version');
    return res.status(201).json({ publication: data });
  });

  return router;
}

module.exports = { createPartnerApiAdminRouter, generateApiKey, validateCounterparty, validatePricingRules };
