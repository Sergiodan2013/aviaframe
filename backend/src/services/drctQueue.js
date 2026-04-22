// Rate limiter: max 1 request/sec to DRCT API (their limit)
const Bottleneck = require('bottleneck');

const drctQueue = new Bottleneck({
  minTime: 1000,          // min 1s between requests
  maxConcurrent: 1,       // only 1 concurrent request
  reservoir: 10,          // burst buffer
  reservoirRefreshAmount: 10,
  reservoirRefreshInterval: 10 * 1000,
});

drctQueue.on('error', (err) => {
  console.error('[drctQueue] Bottleneck error:', err.message);
});

module.exports = drctQueue;
