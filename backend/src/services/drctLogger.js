// DRCT Request Logger Service
// Logs all DRCT API interactions to drct_request_logs table

const supabase = require('../lib/supabase');

/**
 * Log DRCT request/response to database
 * @param {Object} params - Log parameters
 * @param {string} params.tenantId - Tenant UUID
 * @param {string} params.requestType - Type: offers_search, price, order_create, issue, cancel
 * @param {string} params.correlationId - Trace/correlation ID
 * @param {number} params.requestTime - Request timestamp (Date.now())
 * @param {number} params.responseTime - Response timestamp (Date.now())
 * @param {Object} params.requestPayload - Request payload (will be sanitized)
 * @param {Object} params.responsePayload - Response payload (will be sanitized)
 * @param {number} params.statusCode - HTTP status code
 * @param {string} params.drctExternalId - External DRCT ID if available
 * @param {string} params.bookingId - Booking UUID if applicable
 * @param {string} params.errorMessage - Error message if request failed
 * @returns {Promise<Object>} - Log record
 */
async function logDRCTRequest({
  tenantId = null,
  requestType,
  correlationId = null,
  requestTime,
  responseTime = null,
  requestPayload = {},
  responsePayload = {},
  statusCode = null,
  drctExternalId = null,
  bookingId = null,
  errorMessage = null
}) {
  try {
    // Calculate latency if both timestamps provided
    const latencyMs = requestTime && responseTime
      ? responseTime - requestTime
      : null;

    // Sanitize payloads (remove PII)
    const sanitizedRequest = sanitizePayload(requestPayload);
    const sanitizedResponse = sanitizePayload(responsePayload);

    // Insert log record
    const { data, error } = await supabase
      .from('drct_request_logs')
      .insert([
        {
          tenant_id: tenantId,
          request_type: requestType,
          correlation_id: correlationId,
          request_time: new Date(requestTime).toISOString(),
          response_time: responseTime ? new Date(responseTime).toISOString() : null,
          latency_ms: latencyMs,
          request_payload_sanitized: sanitizedRequest,
          response_payload_sanitized: sanitizedResponse,
          status_code: statusCode,
          drct_external_id: drctExternalId,
          booking_id: bookingId,
          error_message: errorMessage
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Failed to log DRCT request:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Error in logDRCTRequest:', err);
    return null;
  }
}

/**
 * Sanitize payload by removing/masking PII fields
 * @param {Object} payload - Original payload
 * @returns {Object} - Sanitized payload
 */
function sanitizePayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return payload;
  }

  // Create a deep copy
  const sanitized = JSON.parse(JSON.stringify(payload));

  // List of PII fields to redact
  const piiFields = [
    'password',
    'password_hash',
    'token',
    'bearer_token',
    'api_key',
    'secret',
    'passport',
    'passport_number',
    'national_id',
    'ssn',
    'credit_card',
    'card_number',
    'cvv',
    'document_number',
    'email',
    'phone',
    'phone_number',
    'first_name',
    'last_name',
    'full_name',
    'date_of_birth',
    'dob',
    'address'
  ];

  // Recursive function to sanitize nested objects
  function sanitizeObject(obj) {
    if (Array.isArray(obj)) {
      return obj.map(item => sanitizeObject(item));
    }

    if (obj && typeof obj === 'object') {
      const result = {};
      for (const [key, value] of Object.entries(obj)) {
        const lowerKey = key.toLowerCase();

        // Check if key contains PII field name
        const isPII = piiFields.some(field => lowerKey.includes(field));

        if (isPII) {
          result[key] = '[REDACTED]';
        } else if (typeof value === 'object') {
          result[key] = sanitizeObject(value);
        } else {
          result[key] = value;
        }
      }
      return result;
    }

    return obj;
  }

  return sanitizeObject(sanitized);
}

/**
 * Generate correlation ID for request tracing
 * @returns {string} - Correlation ID (e.g., "trace-1706282400000-abc123")
 */
function generateCorrelationId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `trace-${timestamp}-${random}`;
}

module.exports = {
  logDRCTRequest,
  sanitizePayload,
  generateCorrelationId
};
