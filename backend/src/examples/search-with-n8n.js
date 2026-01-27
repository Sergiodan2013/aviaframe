// Example: Using n8n client for flight search
// This shows how to integrate n8nClient into your Express routes

const express = require('express');
const n8nClient = require('../services/n8nClient');
const supabase = require('../lib/supabase');

const router = express.Router();

/**
 * POST /api/search-with-n8n
 * Flight search using n8n workflow
 */
router.post('/api/search-with-n8n', async (req, res) => {
  const startTime = Date.now();

  // Extract search parameters
  const {
    origin,
    destination,
    depart_date,
    return_date,
    adults = 1,
    children = 0,
    infants = 0,
    cabin_class = 'economy',
    tenant_id
  } = req.body || {};

  // Validation
  if (!origin || !destination || !depart_date) {
    return res.status(400).json({
      error: {
        code: 'INVALID_INPUT',
        message: 'origin, destination, and depart_date are required'
      }
    });
  }

  try {
    // Use demo tenant ID if not provided
    const searchTenantId = tenant_id || process.env.DEMO_TENANT_ID;

    // Send search request to n8n workflow
    const result = await n8nClient.drctSearch({
      origin: origin.toUpperCase(),
      destination: destination.toUpperCase(),
      depart_date,
      return_date,
      adults,
      children,
      infants,
      cabin_class
    }, searchTenantId);

    // Handle n8n errors
    if (!result.success) {
      console.error('[Search] n8n request failed:', result.error);

      // Return appropriate error response
      return res.status(result.error.statusCode || 500).json({
        error: {
          code: result.error.code,
          message: result.error.message,
          correlationId: result.error.correlationId
        }
      });
    }

    // Extract offers from n8n response
    const offers = result.data.offers || [];
    const searchDuration = Date.now() - startTime;

    // Save search to database for analytics
    const { data: searchRecord, error: dbError } = await supabase
      .from('searches')
      .insert([
        {
          tenant_id: searchTenantId,
          origin: origin.toUpperCase(),
          destination: destination.toUpperCase(),
          depart_date,
          return_date,
          adults,
          children,
          infants,
          cabin_class,
          offers_count: offers.length,
          search_duration_ms: searchDuration,
          source: 'api',
          metadata: {
            user_agent: req.headers['user-agent'],
            ip: req.ip,
            correlation_id: result.correlationId
          }
        }
      ])
      .select()
      .single();

    if (dbError) {
      console.error('[Search] Failed to save to database:', dbError);
      // Continue even if DB save fails
    }

    // Return successful search results
    return res.json({
      success: true,
      search_id: searchRecord?.id || `search-${Date.now()}`,
      correlation_id: result.correlationId,
      origin: origin.toUpperCase(),
      destination: destination.toUpperCase(),
      depart_date,
      return_date,
      adults,
      children,
      infants,
      cabin_class,
      offers,
      offers_count: offers.length,
      search_duration_ms: searchDuration,
      latency_ms: result.latencyMs
    });

  } catch (err) {
    console.error('[Search] Unexpected error:', err);

    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: process.env.NODE_ENV === 'development'
          ? err.message
          : 'An error occurred while processing your search'
      }
    });
  }
});

/**
 * GET /api/n8n/health
 * Check n8n service health
 */
router.get('/api/n8n/health', async (req, res) => {
  try {
    const health = await n8nClient.healthCheck();

    return res.json({
      service: 'n8n',
      ...health,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return res.status(500).json({
      service: 'n8n',
      status: 'error',
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Example: Creating a booking with n8n
 */
async function createBookingExample(req, res) {
  const {
    offer_id,
    passengers,
    contact,
    tenant_id
  } = req.body;

  // Validation
  if (!offer_id || !passengers || !contact) {
    return res.status(400).json({
      error: {
        code: 'INVALID_INPUT',
        message: 'offer_id, passengers, and contact are required'
      }
    });
  }

  try {
    const searchTenantId = tenant_id || process.env.DEMO_TENANT_ID;

    // Create booking record in database first
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert([
        {
          tenant_id: searchTenantId,
          af_offer_id: offer_id,
          status: 'PENDING',
          passenger_data: passengers, // Should be encrypted in production
          contact_email: contact.email,
          contact_phone: contact.phone,
          idempotency_key: `idem-${Date.now()}-${Math.random()}`,
          amount_total: 0, // Will be updated after order creation
          currency: 'USD'
        }
      ])
      .select()
      .single();

    if (bookingError) {
      throw new Error(`Failed to create booking: ${bookingError.message}`);
    }

    // Create order via n8n
    const result = await n8nClient.drctCreateOrder({
      offer_id,
      passengers,
      contact
    }, searchTenantId, booking.id);

    if (!result.success) {
      // Update booking status to FAILED
      await supabase
        .from('bookings')
        .update({ status: 'FAILED' })
        .eq('id', booking.id);

      return res.status(500).json({
        error: {
          code: result.error.code,
          message: result.error.message,
          booking_id: booking.id,
          correlationId: result.error.correlationId
        }
      });
    }

    // Update booking with DRCT order ID
    const { data: updatedBooking } = await supabase
      .from('bookings')
      .update({
        drct_order_id: result.data.order_id,
        status: 'BOOKED',
        amount_total: result.data.total_amount,
        currency: result.data.currency,
        fare_breakdown: result.data.fare_breakdown
      })
      .eq('id', booking.id)
      .select()
      .single();

    return res.json({
      success: true,
      booking: updatedBooking,
      correlation_id: result.correlationId
    });

  } catch (err) {
    console.error('[Booking] Error:', err);

    return res.status(500).json({
      error: {
        code: 'BOOKING_FAILED',
        message: err.message
      }
    });
  }
}

module.exports = router;
