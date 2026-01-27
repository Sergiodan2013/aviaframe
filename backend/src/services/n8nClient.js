// n8n Client Service
// Universal client for sending requests to n8n workflows via webhooks

const { logDRCTRequest, generateCorrelationId } = require('./drctLogger');

/**
 * n8n Client Configuration
 */
const config = {
  baseUrl: process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook',
  timeout: parseInt(process.env.N8N_TIMEOUT_MS || '30000', 10),
  retryAttempts: parseInt(process.env.N8N_RETRY_ATTEMPTS || '2', 10),
  retryDelay: parseInt(process.env.N8N_RETRY_DELAY_MS || '1000', 10)
};

/**
 * Send request to n8n webhook
 * @param {Object} params - Request parameters
 * @param {string} params.workflowPath - n8n webhook path (e.g., '/drct/search')
 * @param {Object} params.payload - Request payload
 * @param {string} params.requestType - DRCT request type for logging
 * @param {string} params.tenantId - Tenant UUID for logging
 * @param {string} params.bookingId - Booking UUID for logging (optional)
 * @param {Object} params.options - Additional options (timeout, headers, etc.)
 * @returns {Promise<Object>} - Response from n8n workflow
 */
async function sendRequest({
  workflowPath,
  payload,
  requestType,
  tenantId = null,
  bookingId = null,
  options = {}
}) {
  const correlationId = generateCorrelationId();
  const requestTime = Date.now();

  // Construct full webhook URL
  const webhookUrl = `${config.baseUrl}${workflowPath}`;

  // Request configuration
  const requestConfig = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Correlation-ID': correlationId,
      'X-Tenant-ID': tenantId || 'unknown',
      ...options.headers
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(options.timeout || config.timeout)
  };

  console.log(`[n8n] Sending ${requestType} request to ${webhookUrl}`);
  console.log(`[n8n] Correlation ID: ${correlationId}`);

  let attempt = 0;
  let lastError = null;

  // Retry logic
  while (attempt <= config.retryAttempts) {
    try {
      // Send request to n8n
      const response = await fetch(webhookUrl, requestConfig);
      const responseTime = Date.now();

      // Parse response
      let responseData;
      const contentType = response.headers.get('content-type');

      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = { text: await response.text() };
      }

      // Log to database (async, don't await)
      logDRCTRequest({
        tenantId,
        requestType,
        correlationId,
        requestTime,
        responseTime,
        requestPayload: payload,
        responsePayload: responseData,
        statusCode: response.status,
        drctExternalId: responseData?.order_id || responseData?.search_id || null,
        bookingId,
        errorMessage: response.ok ? null : responseData?.error?.message || 'Request failed'
      }).catch(err => console.error('Failed to log DRCT request:', err));

      // Check if response is successful
      if (!response.ok) {
        throw new N8nError(
          `n8n workflow returned ${response.status}`,
          response.status,
          responseData
        );
      }

      console.log(`[n8n] Success: ${requestType} (${responseTime - requestTime}ms)`);
      return {
        success: true,
        data: responseData,
        correlationId,
        latencyMs: responseTime - requestTime
      };

    } catch (error) {
      const responseTime = Date.now();
      lastError = error;

      console.error(`[n8n] Attempt ${attempt + 1}/${config.retryAttempts + 1} failed:`, error.message);

      // Log error to database
      logDRCTRequest({
        tenantId,
        requestType,
        correlationId,
        requestTime,
        responseTime,
        requestPayload: payload,
        responsePayload: {},
        statusCode: error.statusCode || null,
        drctExternalId: null,
        bookingId,
        errorMessage: error.message
      }).catch(err => console.error('Failed to log DRCT error:', err));

      // Check if we should retry
      const isRetryable = isRetryableError(error);

      if (!isRetryable || attempt >= config.retryAttempts) {
        break;
      }

      // Wait before retrying
      attempt++;
      await sleep(config.retryDelay * attempt);
    }
  }

  // All attempts failed
  console.error(`[n8n] All ${config.retryAttempts + 1} attempts failed for ${requestType}`);

  return {
    success: false,
    error: {
      code: 'N8N_REQUEST_FAILED',
      message: lastError.message,
      statusCode: lastError.statusCode || 500,
      correlationId
    }
  };
}

/**
 * Send DRCT search request via n8n
 * @param {Object} searchParams - Search parameters
 * @param {string} tenantId - Tenant UUID
 * @returns {Promise<Object>} - Search results
 */
async function drctSearch(searchParams, tenantId) {
  return sendRequest({
    workflowPath: '/drct/search',
    payload: searchParams,
    requestType: 'offers_search',
    tenantId
  });
}

/**
 * Send DRCT price request via n8n
 * @param {Object} priceParams - Price parameters
 * @param {string} tenantId - Tenant UUID
 * @returns {Promise<Object>} - Price results
 */
async function drctPrice(priceParams, tenantId) {
  return sendRequest({
    workflowPath: '/drct/price',
    payload: priceParams,
    requestType: 'price',
    tenantId
  });
}

/**
 * Send DRCT order creation request via n8n
 * @param {Object} orderParams - Order parameters
 * @param {string} tenantId - Tenant UUID
 * @param {string} bookingId - Booking UUID
 * @returns {Promise<Object>} - Order results
 */
async function drctCreateOrder(orderParams, tenantId, bookingId) {
  return sendRequest({
    workflowPath: '/drct/order/create',
    payload: orderParams,
    requestType: 'order_create',
    tenantId,
    bookingId
  });
}

/**
 * Send DRCT ticket issue request via n8n
 * @param {Object} issueParams - Issue parameters
 * @param {string} tenantId - Tenant UUID
 * @param {string} bookingId - Booking UUID
 * @returns {Promise<Object>} - Issue results
 */
async function drctIssue(issueParams, tenantId, bookingId) {
  return sendRequest({
    workflowPath: '/drct/order/issue',
    payload: issueParams,
    requestType: 'issue',
    tenantId,
    bookingId
  });
}

/**
 * Send DRCT cancel request via n8n
 * @param {Object} cancelParams - Cancel parameters
 * @param {string} tenantId - Tenant UUID
 * @param {string} bookingId - Booking UUID
 * @returns {Promise<Object>} - Cancel results
 */
async function drctCancel(cancelParams, tenantId, bookingId) {
  return sendRequest({
    workflowPath: '/drct/order/cancel',
    payload: cancelParams,
    requestType: 'cancel',
    tenantId,
    bookingId
  });
}

/**
 * Check if error is retryable
 * @param {Error} error - Error object
 * @returns {boolean} - True if retryable
 */
function isRetryableError(error) {
  // Network errors are retryable
  if (error.name === 'TypeError' || error.name === 'FetchError') {
    return true;
  }

  // Timeout errors are retryable
  if (error.name === 'AbortError' || error.message.includes('timeout')) {
    return true;
  }

  // 5xx server errors are retryable
  if (error.statusCode >= 500 && error.statusCode < 600) {
    return true;
  }

  // 429 Too Many Requests is retryable
  if (error.statusCode === 429) {
    return true;
  }

  // All other errors are not retryable (4xx client errors, etc.)
  return false;
}

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Custom error class for n8n requests
 */
class N8nError extends Error {
  constructor(message, statusCode, responseData) {
    super(message);
    this.name = 'N8nError';
    this.statusCode = statusCode;
    this.responseData = responseData;
  }
}

/**
 * Health check for n8n service
 * @returns {Promise<Object>} - Health status
 */
async function healthCheck() {
  try {
    const response = await fetch(`${config.baseUrl}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });

    return {
      status: response.ok ? 'healthy' : 'unhealthy',
      statusCode: response.status,
      baseUrl: config.baseUrl
    };
  } catch (error) {
    return {
      status: 'unavailable',
      error: error.message,
      baseUrl: config.baseUrl
    };
  }
}

module.exports = {
  sendRequest,
  drctSearch,
  drctPrice,
  drctCreateOrder,
  drctIssue,
  drctCancel,
  healthCheck,
  config
};
