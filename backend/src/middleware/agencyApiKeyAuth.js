'use strict';

const crypto = require('crypto');
const supabase = require('../lib/supabase');

function hashApiKey(rawKey) {
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}

async function agencyApiKeyAuth(req, res, next) {
  const authHeader = String(req.headers['authorization'] || '').trim();

  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'API key required. Use Authorization: Bearer <key>'
      }
    });
  }

  const rawKey = authHeader.slice(7).trim();
  if (!rawKey) {
    return res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'API key is empty' }
    });
  }

  const keyHash = hashApiKey(rawKey);

  const { data: keyRecord, error } = await supabase
    .from('agency_api_keys')
    .select('id, agency_id, scopes, revoked_at')
    .eq('key_hash', keyHash)
    .maybeSingle();

  if (error || !keyRecord) {
    return res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Invalid API key' }
    });
  }

  if (keyRecord.revoked_at) {
    return res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'API key has been revoked' }
    });
  }

  // Update last_used_at without blocking the request
  supabase
    .from('agency_api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', keyRecord.id)
    .then(() => {})
    .catch(() => {});

  req.reportingAgencyId = keyRecord.agency_id;
  req.reportingScopes = Array.isArray(keyRecord.scopes) ? keyRecord.scopes : [];
  next();
}

module.exports = { agencyApiKeyAuth, hashApiKey };
