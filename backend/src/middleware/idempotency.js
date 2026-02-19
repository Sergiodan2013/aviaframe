const { v4: uuidv4 } = require('uuid');
const supabase = require('../services/supabaseClient');

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
    const agencyId = req.user?.agencyId;
    if (!agencyId) return res.status(401).json({ error: 'UNAUTHORIZED' });

    const { data: existingKey } = await supabase
      .from('idempotency_keys')
      .select('*')
      .eq('agency_id', agencyId)
      .eq('idempotency_key', idempotencyKey)
      .single();

    if (existingKey) {
      return res.status(existingKey.response_http_status).json(JSON.parse(existingKey.response_body));
    }

    const idempotencyId = uuidv4();
    await supabase.from('idempotency_keys').insert({
      id: idempotencyId,
      agency_id: agencyId,
      idempotency_key: idempotencyKey,
      operation: `${req.method} ${req.path}`,
      status: 'pending',
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });

    req.idempotency = { id: idempotencyId, key: idempotencyKey, agencyId };

    const originalJson = res.json.bind(res);
    res.json = function(data) {
      supabase.from('idempotency_keys').update({
        status: 'completed',
        response_http_status: res.statusCode,
        response_body: JSON.stringify(data),
      }).eq('agency_id', agencyId).eq('idempotency_key', idempotencyKey).catch(e => {});
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

module.exports = { idempotencyMiddleware, isCriticalOperation };
