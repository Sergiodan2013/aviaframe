'use strict';

const crypto = require('crypto');
const { sendApiError } = require('./http');

function hashApiKey(rawKey) {
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}

function createPartnerApiAuth(supabase) {
  return async function partnerApiAuth(req, res, next) {
    const header = String(req.headers.authorization || '').trim();
    if (!header.startsWith('Bearer ')) {
      return sendApiError(res, 401, 'UNAUTHORIZED', 'Use Authorization: Bearer <api_key>');
    }

    const rawKey = header.slice(7).trim();
    if (!/^af_(test|live)_[A-Za-z0-9_-]{16,}$/.test(rawKey)) {
      return sendApiError(res, 401, 'UNAUTHORIZED', 'Invalid API key');
    }

    try {
      const { data: credential, error: credentialError } = await supabase
        .from('api_credentials')
        .select('id,api_client_id,scopes,expires_at,revoked_at')
        .eq('key_hash', hashApiKey(rawKey))
        .maybeSingle();

      if (credentialError || !credential || credential.revoked_at) {
        return sendApiError(res, 401, 'UNAUTHORIZED', 'Invalid or revoked API key');
      }
      if (credential.expires_at && new Date(credential.expires_at).getTime() <= Date.now()) {
        return sendApiError(res, 401, 'API_KEY_EXPIRED', 'API key has expired');
      }

      const { data: client, error: clientError } = await supabase
        .from('api_clients')
        .select('id,counterparty_id,name,environment,status,rate_limits,price_visibility')
        .eq('id', credential.api_client_id)
        .maybeSingle();
      if (clientError || !client || client.status !== 'ACTIVE') {
        return sendApiError(res, 403, 'API_CLIENT_DISABLED', 'API client is not active');
      }
      const expectedMode = client.environment === 'production' ? 'live' : 'test';
      if (!rawKey.startsWith(`af_${expectedMode}_`)) {
        return sendApiError(res, 401, 'API_KEY_ENVIRONMENT_MISMATCH', 'API key does not match the client environment');
      }

      const { data: counterparty, error: counterpartyError } = await supabase
        .from('api_counterparties')
        .select('id,status,settlement_currency')
        .eq('id', client.counterparty_id)
        .maybeSingle();
      const counterpartyAllowed = counterparty
        && (counterparty.status === 'ACTIVE'
          || (client.environment === 'sandbox' && counterparty.status === 'SANDBOX'));
      if (counterpartyError || !counterpartyAllowed) {
        return sendApiError(res, 403, 'COUNTERPARTY_DISABLED', 'Counterparty is not active');
      }

      req.partnerContext = {
        credential: { ...credential, scopes: Array.isArray(credential.scopes) ? credential.scopes : [] },
        client,
        counterparty,
      };

      supabase
        .from('api_credentials')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', credential.id)
        .then(() => {})
        .catch(() => {});

      return next();
    } catch (_) {
      return sendApiError(res, 503, 'AUTH_SERVICE_UNAVAILABLE', 'API authentication is temporarily unavailable');
    }
  };
}

function requirePartnerScope(scope) {
  return function partnerScope(req, res, next) {
    if (!req.partnerContext?.credential?.scopes?.includes(scope)) {
      return sendApiError(res, 403, 'INSUFFICIENT_SCOPE', `Required scope: ${scope}`);
    }
    return next();
  };
}

module.exports = { createPartnerApiAuth, hashApiKey, requirePartnerScope };
