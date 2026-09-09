const crypto = require('crypto');

function createIdempotencyId() {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return crypto.randomBytes(16).toString('hex');
}

function getSupabaseClient() {
  return require('../services/supabaseClient');
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function hashRequestBody(body) {
  return crypto.createHash('sha256').update(canonicalJson(body || {})).digest('hex');
}

function decodeStoredResponse(value) {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch (_) {
    return value;
  }
}

async function idempotencyMiddleware(req, res, next) {
  if (!isCriticalOperation(req.method, req.path)) return next();
  
  const idempotencyKey = req.headers['idempotency-key'];
  if (!idempotencyKey) {
    return res.status(400).json({ error: 'MISSING_IDEMPOTENCY_KEY', message: 'Required' });
  }
  
  if (!isValidIdempotencyKey(idempotencyKey)) {
    return res.status(400).json({ error: 'INVALID_IDEMPOTENCY_KEY', message: 'Invalid format' });
  }

  try {
    const supabase = getSupabaseClient();
    const agencyId = req.user?.agencyId;
    if (!agencyId) return res.status(401).json({ error: 'UNAUTHORIZED' });
    const operation = `${req.method} ${req.path}`;
    const requestHash = hashRequestBody(req.body);
    const idempotencyId = createIdempotencyId();
    const { error: claimError } = await supabase.from('idempotency_keys').insert({
      id: idempotencyId,
      agency_id: agencyId,
      idempotency_key: idempotencyKey,
      operation,
      request_hash: requestHash,
      status: 'pending',
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });

    if (claimError) {
      if (String(claimError.code) !== '23505') throw claimError;

      const { data: existingKey, error: existingError } = await supabase
        .from('idempotency_keys')
        .select('*')
        .eq('agency_id', agencyId)
        .eq('operation', operation)
        .eq('idempotency_key', idempotencyKey)
        .single();

      if (existingError || !existingKey) throw existingError || claimError;
      if (existingKey.request_hash && existingKey.request_hash !== requestHash) {
        return res.status(409).json({
          error: 'IDEMPOTENCY_CONFLICT',
          message: 'Idempotency-Key was already used with a different request'
        });
      }
      if (existingKey.status === 'completed' && existingKey.response_http_status) {
        res.setHeader('Idempotency-Replayed', 'true');
        return res
          .status(existingKey.response_http_status)
          .json(decodeStoredResponse(existingKey.response_body));
      }
      return res.status(409).json({
        error: 'IDEMPOTENCY_IN_PROGRESS',
        message: 'A request with this Idempotency-Key is already being processed'
      });
    }

    req.idempotency = { id: idempotencyId, key: idempotencyKey, agencyId, operation, requestHash };

    const originalJson = res.json.bind(res);
    res.json = function(data) {
      const completionUpdate = supabase.from('idempotency_keys').update({
        status: 'completed',
        response_http_status: res.statusCode,
        response_body: data,
        updated_at: new Date().toISOString(),
      })
        .eq('id', idempotencyId);
      void Promise.resolve(completionUpdate).catch(() => {});
      return originalJson(data);
    };

    return next();
  } catch (error) {
    return res.status(500).json({ error: 'IDEMPOTENCY_CHECK_FAILED' });
  }
}

function isCriticalOperation(method, path) {
  return /^POST \/api\/orders\/[^/]+\/(issue|cancel)$/.test(`${method} ${path}`);
}

function isValidIdempotencyKey(key) {
  return key && typeof key === 'string' && key.length <= 255 && /^[a-zA-Z0-9\-_]{8,}$/.test(key);
}

module.exports = {
  canonicalJson,
  hashRequestBody,
  idempotencyMiddleware,
  isCriticalOperation,
};
