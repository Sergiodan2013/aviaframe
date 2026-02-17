import axios from 'axios';
import { logDRCTRequest } from './supabase';

// Local dev must hit n8n test webhooks unless explicitly overridden.
const N8N_BASE_URL = import.meta.env.VITE_N8N_BASE_URL || '/api/n8n/webhook-test';
console.log('[DRCTApi] N8N_BASE_URL =', N8N_BASE_URL);

// ====================================================
// DRCT API CLIENT
// All requests go through n8n webhooks
// ====================================================

class DRCTApiClient {
  constructor() {
    this.baseURL = N8N_BASE_URL;
    this.timeout = 30000; // 30 seconds
  }

  /**
   * Log API request/response to Supabase
   */
  async logRequest(endpoint, method, requestBody, responseBody, statusCode, durationMs, error = null) {
    // Skip logging if Supabase is not configured
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey || supabaseKey.length < 100) {
      console.warn('⚠️ Supabase logging skipped (credentials not configured)');
      return;
    }

    try {
      await logDRCTRequest({
        endpoint,
        method,
        request_body: requestBody,
        response_body: responseBody,
        status_code: statusCode,
        duration_ms: durationMs,
        error_message: error?.message || null,
        error_code: error?.code || null
      });
    } catch (logError) {
      console.error('Failed to log DRCT request:', logError);
      // Don't throw - logging failure shouldn't break the main flow
    }
  }

  /**
   * Make API request to n8n webhook
   */
  async request(endpoint, method = 'POST', data = null, config = {}) {
    const startTime = Date.now();
    const url = `${this.baseURL}/${endpoint}`;

    try {
      const response = await axios({
        url,
        method,
        data,
        timeout: this.timeout,
        headers: {
          'Content-Type': 'application/json',
          ...config.headers
        },
        ...config
      });

      const duration = Date.now() - startTime;

      // Log successful request
      await this.logRequest(
        endpoint,
        method,
        data,
        response.data,
        response.status,
        duration
      );

      return { data: response.data, error: null };
    } catch (error) {
      // Common local-dev case: workflow is active under /webhook, not /webhook-test.
      const canFallbackToProdWebhook =
        error?.response?.status === 404 &&
        typeof this.baseURL === 'string' &&
        this.baseURL.includes('/webhook-test');

      if (canFallbackToProdWebhook) {
        try {
          const fallbackBase = this.baseURL.replace('/webhook-test', '/webhook');
          const fallbackUrl = `${fallbackBase}/${endpoint}`;
          console.warn('[DRCTApi] 404 on webhook-test, retrying with webhook:', fallbackUrl);

          const fallbackResponse = await axios({
            url: fallbackUrl,
            method,
            data,
            timeout: this.timeout,
            headers: {
              'Content-Type': 'application/json',
              ...config.headers
            },
            ...config
          });

          const fallbackDuration = Date.now() - startTime;
          await this.logRequest(
            endpoint,
            method,
            data,
            fallbackResponse.data,
            fallbackResponse.status,
            fallbackDuration
          );

          return { data: fallbackResponse.data, error: null };
        } catch (fallbackError) {
          error = fallbackError;
        }
      }

      const duration = Date.now() - startTime;

      // Log failed request
      await this.logRequest(
        endpoint,
        method,
        data,
        error.response?.data || null,
        error.response?.status || 0,
        duration,
        error
      );

      return {
        data: null,
        error: {
          message: error.response?.data?.error?.message || error.message,
          code: error.response?.data?.error?.code || 'UNKNOWN_ERROR',
          details: error.response?.data?.error?.details || null
        }
      };
    }
  }

  // ====================================================
  // 1. SEARCH OFFERS
  // POST /offers_search
  // ====================================================
  async searchOffers(searchParams) {
    const {
      origin,
      destination,
      depart_date,
      return_date,
      adults = 1,
      children = 0,
      infants = 0,
      cabin_class = 'economy'
    } = searchParams;

    return await this.request('drct/search', 'POST', {
      origin,
      destination,
      depart_date,
      return_date,
      adults,
      children,
      infants,
      cabin_class
    });
  }

  // ====================================================
  // 2. PRICE OFFER (Get updated price before booking)
  // POST /drct/price (changed from PATCH to avoid CORS preflight)
  // ====================================================
  async priceOffer(offerId, passengers) {
    return await this.request('drct/price', 'POST', {
      offer_id: offerId,
      passengers
    });
  }

  // ====================================================
  // 3. GET FARE RULES
  // GET /offers/{offerId}/fare_rules
  // ====================================================
  async getFareRules(offerId) {
    return await this.request('drct/fare-rules', 'POST', {
      offer_id: offerId
    });
  }

  // ====================================================
  // 4. CREATE ORDER
  // POST /orders
  // ====================================================
  async createOrder(orderData) {
    // Validate required fields
    if (!orderData.offer_id) {
      throw new Error('offer_id is required');
    }
    if (!orderData.passengers || !Array.isArray(orderData.passengers)) {
      throw new Error('passengers array is required');
    }
    if (!orderData.contacts || !orderData.contacts.email) {
      throw new Error('contacts with email is required');
    }

    // Generate Idempotency-Key for order creation
    const idempotencyKey = generateIdempotencyKey();

    // Send complete orderData to n8n
    // n8n will extract what it needs for DRCT API and use the rest for Supabase
    return await this.request('drct/order/create', 'POST', orderData, {
      headers: {
        'Idempotency-Key': idempotencyKey
      }
    });
  }

  // ====================================================
  // 5. GET ORDER
  // GET /orders/{orderId}
  // ====================================================
  async getOrder(orderId) {
    return await this.request('drct/order/get', 'POST', {
      order_id: orderId
    });
  }

  // ====================================================
  // 6. LIST ORDERS
  // GET /orders
  // ====================================================
  async listOrders(filters = {}) {
    return await this.request('drct/orders/list', 'POST', filters);
  }

  // ====================================================
  // 7. CANCEL ORDER
  // DELETE /orders/{orderId}
  // ====================================================
  async cancelOrder(orderId) {
    return await this.request('drct/order/cancel', 'POST', {
      order_id: orderId
    });
  }

  // ====================================================
  // 8. ISSUE TICKETS (if separate from create_order)
  // POST /orders/{orderId}/issue
  // ====================================================
  async issueTickets(orderId) {
    const idempotencyKey = generateIdempotencyKey();
    return await this.request('drct/order/issue', 'POST', {
      order_id: orderId
    }, {
      headers: {
        'Idempotency-Key': idempotencyKey
      }
    });
  }
}

// Export singleton instance
export const drctApi = new DRCTApiClient();

// ====================================================
// HELPER FUNCTIONS
// ====================================================

/**
 * Transform passenger form data to DRCT API format
 */
export function transformPassengerDataForDRCT(passengerFormData) {
  return {
    type: 'ADT', // Adult (can be CHD for child, INF for infant)
    first_name: passengerFormData.firstName,
    last_name: passengerFormData.lastName,
    date_of_birth: passengerFormData.dateOfBirth,
    gender: passengerFormData.gender === 'male' ? 'M' : 'F',
    document: {
      type: 'passport',
      number: passengerFormData.passportNumber,
      expiry_date: passengerFormData.passportExpiry,
      issuing_country: passengerFormData.nationality || 'SA'
    }
  };
}

/**
 * Check if offer price needs confirmation
 * (Call priceOffer if last price check was > 5 minutes ago)
 */
export function needsPriceConfirmation(offer) {
  if (!offer.selected_at) return true;

  const selectedTime = new Date(offer.selected_at).getTime();
  const now = Date.now();
  const minutesSinceSelection = (now - selectedTime) / 1000 / 60;

  // Refresh price if > 5 minutes old
  return minutesSinceSelection > 5;
}

/**
 * Format DRCT error for user display
 */
export function formatDRCTError(error) {
  if (!error) return 'An unknown error occurred';

  const errorMessages = {
    'OFFER_UNAVAILABLE': 'This offer is no longer available. Please search again.',
    'OFFER_PRICE_CHANGED': 'The price has changed. Please review the new price.',
    'INVALID_PASSENGER_DATA': 'Please check passenger information and try again.',
    'PAYMENT_FAILED': 'Payment processing failed. Please try again.',
    'ORDER_ALREADY_CANCELLED': 'This order has already been cancelled.',
    'INSUFFICIENT_AVAILABILITY': 'Not enough seats available for this flight.'
  };

  return errorMessages[error.code] || error.message || 'An error occurred';
}

/**
 * Calculate baggage price
 */
export function calculateBaggagePrice(baggageOption, currency = 'UAH') {
  const prices = {
    'none': 0,
    '20kg': 500,
    '30kg': 750
  };

  return {
    amount: prices[baggageOption] || 0,
    currency
  };
}

/**
 * Generate idempotency key for order creation
 */
export function generateIdempotencyKey() {
  return `idem-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}
