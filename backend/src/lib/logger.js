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
  ...(transport && { transport }),
});

module.exports = logger;
