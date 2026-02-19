const crypto = require('crypto');
const jwt = require('jsonwebtoken');

function generateWidgetToken(agencyId, allowedOrigins = []) {
  const secret = process.env.WIDGET_TOKEN_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('WIDGET_TOKEN_SECRET must be set and at least 32 characters');
  }

  const ttlSeconds = parseInt(process.env.WIDGET_TOKEN_TTL_SEC || '1800');
  const now = Math.floor(Date.now() / 1000);

  const claims = {
    iss: 'aviaframe-backend',
    aud: 'aviaframe-widget',
    iat: now,
    exp: now + ttlSeconds,
    agency_id: agencyId,
    allowed_origins: allowedOrigins || [],
    nonce: crypto.randomBytes(16).toString('hex'),
    version: 1,
  };

  const token = jwt.sign(claims, secret, {
    algorithm: 'HS256',
    header: { typ: 'JWT', kid: 'widget-v1' },
  });

  return {
    token,
    expiresIn: ttlSeconds,
    expiresAt: new Date(now * 1000 + ttlSeconds * 1000).toISOString(),
  };
}

function verifyWidgetToken(token) {
  try {
    const secret = process.env.WIDGET_TOKEN_SECRET;
    if (!secret) return null;

    const claims = jwt.verify(token, secret, {
      algorithms: ['HS256'],
      audience: 'aviaframe-widget',
      issuer: 'aviaframe-backend',
    });

    if (!claims.agency_id || !Array.isArray(claims.allowed_origins)) {
      return null;
    }

    return claims;
  } catch (error) {
    return null;
  }
}

function validateWidgetOrigin(origin, claims) {
  if (!origin || !claims || !Array.isArray(claims.allowed_origins)) return false;
  
  if (claims.allowed_origins.includes(origin)) return true;
  
  if (claims.allowed_origins.includes('*')) {
    const isDev = process.env.NODE_ENV === 'development';
    const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');
    if (isDev && isLocalhost) return true;
  }

  return false;
}

function widgetTokenMiddleware(req, res, next) {
  const token = req.headers['x-widget-token'] || req.query.widget_token;
  
  if (!token) {
    return res.status(401).json({
      error: 'MISSING_WIDGET_TOKEN',
      message: 'Widget-Token header required',
    });
  }

  const claims = verifyWidgetToken(token);
  if (!claims) {
    return res.status(401).json({
      error: 'INVALID_WIDGET_TOKEN',
      message: 'Token is invalid or expired',
    });
  }

  const origin = req.headers.origin || req.headers.referer;
  if (origin && !validateWidgetOrigin(origin, claims)) {
    return res.status(403).json({
      error: 'ORIGIN_NOT_ALLOWED',
      message: 'Request origin is not in allowed list',
    });
  }

  req.widget = {
    token,
    claims,
    agencyId: claims.agency_id,
  };

  next();
}

function buildWidgetEmbedUrl(widgetBaseUrl, token, options = {}) {
  const url = new URL(widgetBaseUrl);
  url.searchParams.set('token', token);
  if (options.locale) url.searchParams.set('locale', options.locale);
  if (options.theme) url.searchParams.set('theme', options.theme);
  return url.toString();
}

module.exports = {
  generateWidgetToken,
  verifyWidgetToken,
  validateWidgetOrigin,
  widgetTokenMiddleware,
  buildWidgetEmbedUrl,
};
