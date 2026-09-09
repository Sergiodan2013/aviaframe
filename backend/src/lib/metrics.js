const client = require('prom-client');

// Enable default Node.js metrics (memory, cpu, event loop)
client.collectDefaultMetrics({ prefix: 'aviaframe_' });

// HTTP request duration
const httpDuration = new client.Histogram({
  name: 'aviaframe_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
});

// DRCT API request duration
const drctDuration = new client.Histogram({
  name: 'aviaframe_drct_request_duration_seconds',
  help: 'DRCT API request duration in seconds',
  labelNames: ['operation'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
});

// DRCT errors counter
const drctErrors = new client.Counter({
  name: 'aviaframe_drct_errors_total',
  help: 'Total DRCT API errors',
  labelNames: ['operation', 'status_code'],
});

// Legacy DRCT mutating proxy request counter
const drctLegacyProxyRequests = new client.Counter({
  name: 'aviaframe_drct_legacy_proxy_requests_total',
  help: 'Total legacy DRCT mutating proxy requests seen by the compatibility guard',
  labelNames: ['target_path', 'mode', 'consumer'],
});

// Queue size gauge
const drctQueueSize = new client.Gauge({
  name: 'aviaframe_drct_queue_size',
  help: 'Current DRCT request queue size',
});

module.exports = {
  client,
  httpDuration,
  drctDuration,
  drctErrors,
  drctLegacyProxyRequests,
  drctQueueSize
};
