'use strict';

function buildCorsMiddleware(allowedOrigins) {
  return (req, res, next) => {
    const origin = req.headers.origin;
    const isAviaframeSubdomain = origin && /^https:\/\/([a-z0-9-]+\.)?aviaframe\.com$/.test(origin);
    const isAviaframeNetlify = origin && /^https:\/\/[a-z0-9-]+-aviaframe(-demo-\d+)?\.netlify\.app$/.test(origin);
    if (isAviaframeSubdomain || isAviaframeNetlify || allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Idempotency-Key');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  };
}

module.exports = { buildCorsMiddleware };
