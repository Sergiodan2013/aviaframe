// Retry with exponential backoff for transient errors
const RETRYABLE_STATUS = new Set([429, 502, 503, 504]);

async function withRetry(fn, { maxAttempts = 3, baseDelayMs = 500, label = 'op' } = {}) {
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const status = err.response?.status || err.statusCode;
      if (!RETRYABLE_STATUS.has(status) && !err.code?.includes('ECONNRESET') && !err.code?.includes('ETIMEDOUT')) {
        throw err; // not retryable
      }
      if (attempt === maxAttempts) break;

      // Respect Retry-After header if present
      const retryAfter = err.response?.headers?.['retry-after'];
      const delay = retryAfter
        ? Number(retryAfter) * 1000
        : baseDelayMs * Math.pow(2, attempt - 1);

      console.warn(`[retry:${label}] attempt ${attempt} failed (${status || err.code}), retrying in ${delay}ms`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw lastError;
}

module.exports = { withRetry };
