'use strict';

require('dotenv').config();
const app = require('./app');
const { config } = require('./config');

const server = app.listen(config.port, config.host, () => {
  console.log('');
  console.log('========================================');
  console.log(`  ${config.appName} v${config.appVersion}`);
  console.log('========================================');
  console.log(`  Environment: ${config.nodeEnv}`);
  console.log(`  Server:      http://${config.host}:${config.port}`);
  console.log(`  Health:      http://${config.host}:${config.port}/healthz`);
  console.log(`  Info:        http://${config.host}:${config.port}/api/info`);
  console.log('========================================');
  console.log('');
});

// Graceful shutdown
const shutdown = (signal) => {
  console.log(`\nReceived ${signal}, closing server gracefully...`);
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
