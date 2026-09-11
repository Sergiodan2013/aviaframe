const pino = require('pino');
const { config } = require('../config');

// pino-pretty is an optional dev dependency; skip pretty transport if not installed
let transport;
if (config.nodeEnv !== 'production') {
  try {
    require.resolve('pino-pretty');
    transport = {
      target: 'pino-pretty',
      options: { colorize: true, translateTime: 'SYS:standard', ignore: 'pid,hostname' }
    };
  } catch (_) {
    // pino-pretty not installed — use plain JSON output
  }
}

const logger = pino({
  level: config.logLevel || 'info',
  // pino-http's default req/res serializers include the full request
  // headers object and any error `config`/`request` blobs attached by axios.
  // Without redaction, Authorization bearer tokens, cookies, the internal
  // service token and the widget/customer access tokens would be written
  // to every log line verbatim. `censor` replaces the value in the log
  // output only — it operates on the object pino's own serializers already
  // built for logging, not on the live req/res objects the app continues
  // to use, so this cannot affect request handling.
  redact: {
    // fast-redact (which pino uses) matches each path literally: a bare
    // name only matches that key at the object's own top level, and `*`
    // matches exactly one level of nesting — there is no recursive/`**`
    // wildcard. So every sensitive field name is listed twice: once bare,
    // for a logger call that puts it at the top level (e.g.
    // `logger.info({ token })`), and once behind `*.`, for the common case
    // of one level of nesting (e.g. `logger.info({ body: { token } })`).
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.headers["x-internal-token"]',
      'req.headers["x-customer-access-token"]',
      'req.headers["x-api-key"]',
      'res.headers["set-cookie"]',
      ...[
        'password', 'token', 'access_token', 'customer_access_token',
        'widget_token', 'internal_token', 'card_number', 'cvc', 'cvv',
        'authorization', 'verified_token', 'code'
      ].flatMap((field) => [field, `*.${field}`]),
      // axios error objects (`err.config`/`err.request`) commonly get
      // logged whole on upstream call failures; they carry the outgoing
      // Authorization header for that call.
      '*.config.headers.Authorization',
      '*.config.headers.authorization'
    ],
    censor: '[REDACTED]'
  },
  ...(transport && { transport }),
});

module.exports = logger;
