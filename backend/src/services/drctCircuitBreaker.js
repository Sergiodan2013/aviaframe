const CircuitBreaker = require('opossum');

// Wrap any async function with circuit breaker
function createDrctCircuitBreaker(fn, name = 'drct') {
  const breaker = new CircuitBreaker(fn, {
    timeout: 10000,                // 10s per request
    errorThresholdPercentage: 50,  // open when 50% fail
    resetTimeout: 30000,           // try again after 30s
    name,
  });

  breaker.on('open',     () => console.warn(`[circuit:${name}] OPEN - requests blocked`));
  breaker.on('halfOpen', () => console.info(`[circuit:${name}] HALF-OPEN - testing...`));
  breaker.on('close',    () => console.info(`[circuit:${name}] CLOSED - normal operation`));
  breaker.on('fallback', (result) => console.warn(`[circuit:${name}] fallback triggered`));

  return breaker;
}

module.exports = { createDrctCircuitBreaker };
