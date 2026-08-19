'use strict';

const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { config, ORDERS_LIST_COLUMNS } = require('../config');
const { isAdminRole, isAgentRole, isStaffRole, generateOrderNumber } = require('../utils/helpers');
const { resolveAuthContext, forbidden, ensureStaff, canAccessOrder } = require('../middleware/auth');
const { idempotencyMiddleware } = require('../middleware/idempotency');
const { ensureTicketPdfForOrder, createSignedDocumentUrl, issueDrctTicket } = require('../services/orderService');
const { sendTicketEmail } = require('../services/emailService');
const drctService = require('../services/drctService');
const drctDirectClient = require('../services/drctDirectClient');
const { saveCustomerProfile } = require('../services/customerProfile');

const ORDER_MUTATION_SELECT = [
  'id',
  'order_number',
  'user_id',
  'agency_id',
  'drct_order_id',
  'origin',
  'destination',
  'departure_time',
  'arrival_time',
  'airline_code',
  'airline_name',
  'flight_number',
  'total_price',
  'currency',
  'status',
  'payment_status',
  'payment_method',
  'contact_email',
  'contact_phone',
  'confirmed_at',
  'cancelled_at',
  'created_at',
  'updated_at'
].join(',');

async function resolveOrderMutationContext(req, res, next) {
  const auth = await resolveAuthContext(req);
  if (auth.error) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: auth.error } });
  }
  if (!ensureStaff(auth, res)) return;

  const { orderId } = req.params;

  try {
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(ORDER_MUTATION_SELECT)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return res.status(404).json({
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Order not found'
        }
      });
    }

    const canAccess = await canAccessOrder(auth, order);
    if (!canAccess) {
      return forbidden(res);
    }

    const scopedAgencyId = order.agency_id || auth.profile.agency_id || null;
    if (!scopedAgencyId) {
      return res.status(422).json({
        error: {
          code: 'ORDER_AGENCY_NOT_LINKED',
          message: 'Order must be linked to an agency before critical mutations are allowed'
        }
      });
    }

    req.auth = auth;
    req.order = order;
    req.user = {
      ...(req.user || {}),
      agencyId: scopedAgencyId
    };

    return next();
  } catch (err) {
    console.error('Order mutation context error:', err);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: config.nodeEnv === 'development' ? err.message : 'Internal server error'
      }
    });
  }
}

function normalizePassengerGender(gender) {
  const value = String(gender || '').toLowerCase().trim();
  if (value === 'male' || value === 'm') return 'M';
  if (value === 'female' || value === 'f') return 'F';
  return 'M';
}

function normalizePassengerTitle(title, gender, type = 'ADT') {
  const normalizedType = normalizePassengerType(type);
  const normalizedGender = normalizePassengerGender(gender);
  const value = String(title || '').trim().toLowerCase().replace(/\.+$/g, '');

  const explicitMap = {
    mr: 'Mr',
    mister: 'Mr',
    mrs: 'Mrs',
    miss: 'Miss',
    ms: 'Ms',
    mx: 'Mx',
    mstr: 'Mstr',
    master: 'Mstr'
  };

  if (explicitMap[value]) return explicitMap[value];

  if (normalizedType === 'CHD' || normalizedType === 'INF') {
    return normalizedGender === 'F' ? 'Miss' : 'Mstr';
  }

  return normalizedGender === 'F' ? 'Ms' : 'Mr';
}

function normalizePassengerRowGender(gender) {
  const value = String(gender || '').toLowerCase().trim();
  if (value === 'male' || value === 'm') return 'male';
  if (value === 'female' || value === 'f') return 'female';
  return null;
}

function normalizePassengerType(type) {
  const value = String(type || 'ADT').toUpperCase().trim();
  return ['ADT', 'CHD', 'INF'].includes(value) ? value : 'ADT';
}

function getPassengerDocument(passenger = {}) {
  return passenger.document || {};
}

function buildPassengerRefsByType(passengerRefs = []) {
  const refsByType = new Map();
  for (const ref of Array.isArray(passengerRefs) ? passengerRefs : []) {
    const type = normalizePassengerType(ref?.type);
    if (!refsByType.has(type)) refsByType.set(type, []);
    refsByType.get(type).push(ref);
  }
  return refsByType;
}

function validatePortalPassengers(passengers = []) {
  if (!Array.isArray(passengers) || passengers.length === 0) {
    return 'At least one passenger is required';
  }

  for (let index = 0; index < passengers.length; index += 1) {
    const passenger = passengers[index] || {};
    const document = getPassengerDocument(passenger);
    const firstName = String(passenger.first_name || passenger.firstName || '').trim();
    const lastName = String(passenger.last_name || passenger.lastName || '').trim();
    const dateOfBirth = String(passenger.date_of_birth || passenger.dateOfBirth || '').trim();
    const passportNumber = String(
      passenger.passport_number || passenger.passportNumber || document.number || document.passport_number || ''
    ).trim();
    const passportExpiry = String(
      passenger.passport_expiry || passenger.passportExpiry || document.expiry_date || document.expiration_date || ''
    ).trim();
    const nationality = String(
      passenger.nationality || document.citizenship || document.issuing_country || ''
    ).trim();

    if (!firstName) return `Passenger ${index + 1}: first_name is required`;
    if (!lastName) return `Passenger ${index + 1}: last_name is required`;
    if (!dateOfBirth) return `Passenger ${index + 1}: date_of_birth is required`;
    if (!passportNumber) return `Passenger ${index + 1}: passport number is required`;
    if (!passportExpiry) return `Passenger ${index + 1}: passport expiry is required`;
    if (!nationality) return `Passenger ${index + 1}: nationality is required`;
  }

  return null;
}

function buildPortalPassengerRows(passengers = [], passengerDetails = [], orderId) {
  return passengers.map((passenger, index) => {
    const document = getPassengerDocument(passenger);
    const detail = Array.isArray(passengerDetails) ? (passengerDetails[index] || {}) : {};

    return {
      order_id: orderId,
      gender: normalizePassengerRowGender(passenger.gender || detail.gender),
      first_name: String(passenger.first_name || detail.first_name || detail.firstName || '').trim(),
      last_name: String(passenger.last_name || detail.last_name || detail.lastName || '').trim(),
      date_of_birth: passenger.date_of_birth || detail.date_of_birth || detail.dateOfBirth || null,
      passport_number: String(
        detail.passport_number || detail.passportNumber || passenger.passport_number || document.number || ''
      ).trim(),
      passport_expiry: detail.passport_expiry || detail.passportExpiry || passenger.passport_expiry || document.expiry_date || document.expiration_date || null,
      passport_issuing_country: detail.passport_issuing_country || detail.issuing_country || document.issuing_country || document.country_of_issue || detail.nationality || 'SA',
      nationality: detail.nationality || passenger.nationality || document.citizenship || document.issuing_country || 'SA',
      passenger_type: detail.type || passenger.passenger_type || passenger.type || 'ADT',
      baggage_allowance: detail.baggage_allowance || null
    };
  });
}

function buildPortalDrctPassengers(passengers = [], contacts = {}, passengerRefs = []) {
  const refsByType = buildPassengerRefsByType(passengerRefs);
  const usedRefsByType = new Map();

  return passengers.map((passenger, index) => {
    const document = getPassengerDocument(passenger);
    const type = normalizePassengerType(passenger.passenger_type || passenger.type);
    const typeRefs = refsByType.get(type) || [];
    const usedRefs = usedRefsByType.get(type) || 0;
    const matchedRef = typeRefs[usedRefs] || null;
    usedRefsByType.set(type, usedRefs + 1);

    const drctPassenger = {
      id: matchedRef?.id || `T${index + 1}`,
      type,
      individual: {
        first_name: String(passenger.first_name || passenger.firstName || '').trim(),
        last_name: String(passenger.last_name || passenger.lastName || '').trim(),
        title: normalizePassengerTitle(passenger.title, passenger.gender, type),
        date_of_birth: passenger.date_of_birth || passenger.dateOfBirth || null,
        gender: normalizePassengerGender(passenger.gender)
      },
      email: String(passenger.email || contacts.email || '').trim().toLowerCase(),
      phone: String(passenger.phone || contacts.phone || '').trim(),
      document: {
        type: 'REGULAR_PASSPORT',
        number: String(passenger.passport_number || passenger.passportNumber || document.number || '').trim(),
        gender: normalizePassengerGender(passenger.gender),
        issuing_country: passenger.passport_issuing_country || passenger.issuing_country || document.issuing_country || document.country_of_issue || 'SA',
        citizenship: passenger.nationality || document.citizenship || document.issuing_country || 'SA',
        country_of_issue: passenger.passport_issuing_country || passenger.issuing_country || document.country_of_issue || document.issuing_country || 'SA',
        expiration_date: passenger.passport_expiry || passenger.passportExpiry || document.expiry_date || document.expiration_date || null
      }
    };

    if (matchedRef?.infant_ref && type === 'INF') {
      drctPassenger.infant_ref = matchedRef.infant_ref;
    }

    return drctPassenger;
  });
}

router.post('/api/orders', async (req, res) => {
  const auth = await resolveAuthContext(req);
  if (auth.error) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: auth.error
      }
    });
  }

  const {
    offer_id: offerIdFromBody = null,
    contacts = {},
    offer = {},
    pricing = {},
    passengers = [],
    passenger_details: passengerDetails = {},
    raw_offer_data: rawOfferData = null
  } = req.body || {};

  const contactEmail = String(contacts.email || auth.user?.email || '').trim().toLowerCase();
  const contactPhone = String(contacts.phone || '').trim();
  const origin = String(offer.origin || rawOfferData?.origin || '').trim();
  const destination = String(offer.destination || rawOfferData?.destination || '').trim();
  const offerId = String(offerIdFromBody || rawOfferData?.offer_id || rawOfferData?.id || '').trim();
  const currency = String(pricing.currency || offer.currency || rawOfferData?.price?.currency || 'USD').trim().toUpperCase();
  const basePrice = Number(pricing.base_price ?? offer.base_price ?? offer.price ?? rawOfferData?.price?.total ?? 0);
  const taxes = Number(pricing.taxes ?? offer.taxes ?? rawOfferData?.price?.taxes ?? 0);
  const baggagePrice = Number(pricing.baggage_price ?? 0);
  const totalPrice = Number(pricing.total_price ?? (basePrice + baggagePrice));
  const passengerValidationError = validatePortalPassengers(passengers);

  if (!offerId || !contactEmail || !contactPhone || !origin || !destination || !Number.isFinite(totalPrice) || totalPrice <= 0) {
    return res.status(400).json({
      error: {
        code: 'INVALID_INPUT',
        message: 'offer_id, contacts.email, contacts.phone, offer.origin, offer.destination and pricing.total_price are required'
      }
    });
  }

  if (passengerValidationError) {
    return res.status(400).json({
      error: {
        code: 'INVALID_PASSENGER_DATA',
        message: passengerValidationError
      }
    });
  }

  const orderInsert = {
    order_number: generateOrderNumber(),
    user_id: auth.profile?.id || auth.user?.id || null,
    agency_id: auth.profile?.agency_id || null,
    origin,
    destination,
    departure_time: offer.departure_time || rawOfferData?.departure_time || null,
    arrival_time: offer.arrival_time || rawOfferData?.arrival_time || null,
    airline_code: offer.airline_code || rawOfferData?.airline_code || rawOfferData?.airline || null,
    airline_name: offer.airline_name || rawOfferData?.airline_name || null,
    flight_number: offer.flight_number || rawOfferData?.flight_number || null,
    base_price: basePrice,
    taxes,
    baggage_price: baggagePrice,
    total_price: totalPrice,
    currency,
    status: 'pending',
    payment_method: 'online',
    contact_email: contactEmail,
    contact_phone: contactPhone,
    raw_offer_data: rawOfferData || {
      offer,
      pricing,
      passengers,
      passenger_details: passengerDetails
    }
  };

  try {
    let { data: createdOrder, error: createOrderError } = await supabase
      .from('orders')
      .insert(orderInsert)
      .select(ORDERS_LIST_COLUMNS)
      .single();

    if (createOrderError || !createdOrder) {
      return res.status(500).json({
        error: {
          code: 'ORDER_CREATE_FAILED',
          message: createOrderError?.message || 'Failed to create order'
        }
      });
    }

    const passengerRows = buildPortalPassengerRows(
      passengers,
      Array.isArray(passengerDetails?.passengers) ? passengerDetails.passengers : [],
      createdOrder.id
    );
    if (passengerRows.length > 0) {
      const { error: passengerError } = await supabase
        .from('passengers')
        .insert(passengerRows);

      if (passengerError) {
        await supabase.from('orders').delete().eq('id', createdOrder.id);
        return res.status(400).json({
          error: {
            code: 'PASSENGER_INSERT_FAILED',
            message: `Passenger data invalid: ${passengerError.message}`
          }
        });
      }
    }

    const offerPassengerRefs = Array.isArray(rawOfferData?.passengers) ? rawOfferData.passengers : [];
    const drctCreatePassengers = buildPortalDrctPassengers(passengers, {
      email: contactEmail,
      phone: contactPhone
    }, offerPassengerRefs);

    let drctResponse;
    try {
      drctResponse = await drctDirectClient.createOrder({
        offer_id: offerId,
        passengers: drctCreatePassengers
      }, {
        idempotencyKey: `portal-order-create-${createdOrder.id}`
      });
    } catch (drctError) {
      console.error('Portal order create DRCT failure:', {
        message: drctError.message,
        code: drctError.code || null,
        statusCode: drctError.statusCode || null,
        orderId: createdOrder.id,
        offerId
      });
      try { await supabase.from('passengers').delete().eq('order_id', createdOrder.id); } catch (_) {}
      try { await supabase.from('orders').delete().eq('id', createdOrder.id); } catch (_) {}
      return res.status(502).json({
        error: {
          code: 'DRCT_CREATE_FAILED',
          message: 'Unable to reserve seat with airline provider. Please try again.',
          details: drctError.code || null
        }
      });
    }

    const drctOrderId = drctResponse?.order_id || null;
    if (!drctOrderId) {
      try { await supabase.from('passengers').delete().eq('order_id', createdOrder.id); } catch (_) {}
      try { await supabase.from('orders').delete().eq('id', createdOrder.id); } catch (_) {}
      return res.status(502).json({
        error: {
          code: 'DRCT_INVALID_RESPONSE',
          message: 'Airline provider did not return an order reference. Please try again.'
        }
      });
    }

    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({
        drct_order_id: drctOrderId,
        updated_at: new Date().toISOString()
      })
      .eq('id', createdOrder.id)
      .select(ORDERS_LIST_COLUMNS)
      .single();

    if (updateError || !updatedOrder) {
      return res.status(500).json({
        error: {
          code: 'ORDER_UPDATE_FAILED',
          message: updateError?.message || 'Reservation created but not persisted. Support will reconcile.',
          drct_order_id: drctOrderId
        }
      });
    }

    // Save customer profile asynchronously — non-blocking, does not affect booking result
    const portalAgencyId = auth.profile?.agency_id || null;
    if (portalAgencyId && contactEmail) {
      setImmediate(() => {
        const pax0 = Array.isArray(drctCreatePassengers) && drctCreatePassengers.length > 0
          ? drctCreatePassengers[0]
          : null;
        saveCustomerProfile({
          agencyId: portalAgencyId,
          contactEmail,
          contactPhone,
          passenger: pax0,
        }).catch(e => console.error('[customerProfile] portal save failed:', e.message));
      });
    }

    return res.status(201).json({
      success: true,
      order_id: updatedOrder.id,
      order_number: updatedOrder.order_number,
      drct_order_id: updatedOrder.drct_order_id || drctOrderId,
      booking_reference: updatedOrder.drct_order_id || drctOrderId,
      status: updatedOrder.status || 'pending',
      order: updatedOrder
    });
  } catch (err) {
    console.error('Portal order create error:', err);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: config.nodeEnv === 'development' ? err.message : 'Internal server error'
      }
    });
  }
});

router.get('/api/profile/me', async (req, res) => {
  const auth = await resolveAuthContext(req);
  if (auth.error) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: auth.error
      }
    });
  }

  return res.json({
    profile: auth.profile,
    user: {
      id: auth.user.id,
      email: auth.user.email || null
    }
  });
});

// Stage 0 non-breaking endpoint for orders list compatibility.
router.get('/api/orders', async (req, res) => {
  const auth = await resolveAuthContext(req);
  if (auth.error) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: auth.error
      }
    });
  }

  const requesterId = auth.profile.id;
  const requesterRole = auth.profile.role;
  const requesterAgencyId = auth.profile.agency_id;

  const rawLimit = Number(req.query.limit || 200);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 500) : 200;
  const { user_id: userId, agency_id: agencyId, status } = req.query;

  try {
    let query = supabase
      .from('orders')
      .select(ORDERS_LIST_COLUMNS)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Role-based scope
    if (isAdminRole(requesterRole)) {
      if (userId) query = query.eq('user_id', userId);
      if (agencyId) query = query.eq('agency_id', agencyId);
    } else if (isAgentRole(requesterRole)) {
      // Agent can see own agency orders and their own direct orders.
      if (agencyId && agencyId !== requesterAgencyId) {
        return forbidden(res, 'Agent can only access own agency');
      }
      if (userId && userId !== requesterId) {
        return forbidden(res, 'Agent cannot filter by another user_id');
      }

      if (requesterAgencyId) {
        query = query.or(`agency_id.eq.${requesterAgencyId},user_id.eq.${requesterId}`);
      } else {
        query = query.eq('user_id', requesterId);
      }
    } else {
      // Client/user can only see own orders.
      if (agencyId) {
        return forbidden(res, 'User cannot filter by agency_id');
      }
      if (userId && userId !== requesterId) {
        return forbidden(res, 'User cannot filter by another user_id');
      }
      query = query.eq('user_id', requesterId);
    }

    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) {
      return res.status(500).json({
        error: {
          code: 'ORDERS_LIST_FAILED',
          message: error.message
        }
      });
    }

    return res.json({ orders: data || [] });
  } catch (err) {
    console.error('Orders endpoint error:', err);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: config.nodeEnv === 'development' ? err.message : 'Internal server error'
      }
    });
  }
});

router.patch('/api/orders/:orderId/status', async (req, res) => {
  const auth = await resolveAuthContext(req);
  if (auth.error) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: auth.error
      }
    });
  }

  const requesterId = auth.profile.id;
  const requesterRole = auth.profile.role;
  const requesterAgencyId = auth.profile.agency_id;
  const { orderId } = req.params;
  const { status: nextStatus, additionalData = {} } = req.body || {};
  const allowedStatuses = new Set(['pending', 'confirmed', 'ticketed', 'cancelled', 'refunded', 'failed']);

  if (!nextStatus || !allowedStatuses.has(String(nextStatus).toLowerCase())) {
    return res.status(400).json({
      error: {
        code: 'INVALID_STATUS',
        message: 'Unsupported status value'
      }
    });
  }

  try {
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id,user_id,agency_id,status')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return res.status(404).json({
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Order not found'
        }
      });
    }

    const canAdmin = isAdminRole(requesterRole);
    const canAgent = isAgentRole(requesterRole) && (
      (requesterAgencyId && requesterAgencyId === order.agency_id) || order.user_id === requesterId
    );
    const canClient = (requesterRole === 'client' || requesterRole === 'user') && order.user_id === requesterId;

    if (!(canAdmin || canAgent || canClient)) {
      return forbidden(res);
    }

    const normalizedStatus = String(nextStatus).toLowerCase();
    if (normalizedStatus === 'ticketed' && String(order.status || '').toLowerCase() !== 'confirmed') {
      return res.status(422).json({
        error: {
          code: 'INVALID_TRANSITION',
          message: 'Ticket issue allowed only from confirmed status'
        }
      });
    }

    const nowIso = new Date().toISOString();
    const updateData = {
      status: normalizedStatus,
      updated_at: nowIso,
      ...additionalData
    };

    if (normalizedStatus === 'confirmed' && !updateData.confirmed_at) {
      updateData.confirmed_at = nowIso;
      if (!Object.prototype.hasOwnProperty.call(additionalData, 'cancelled_at')) {
        updateData.cancelled_at = null;
      }
    }
    if (normalizedStatus === 'cancelled' && !updateData.cancelled_at) {
      updateData.cancelled_at = nowIso;
      if (!Object.prototype.hasOwnProperty.call(additionalData, 'confirmed_at')) {
        updateData.confirmed_at = null;
      }
    }

    const { data: updated, error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select(ORDERS_LIST_COLUMNS)
      .single();

    if (updateError) {
      return res.status(500).json({
        error: {
          code: 'ORDER_UPDATE_FAILED',
          message: updateError.message
        }
      });
    }

    return res.json({ order: updated });
  } catch (err) {
    console.error('Order status update error:', err);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: config.nodeEnv === 'development' ? err.message : 'Internal server error'
      }
    });
  }
});

// Mark a cash/invoice order as paid by admin → triggers PDF generation + email
router.post('/api/orders/:orderId/mark-paid', async (req, res) => {
  const auth = await resolveAuthContext(req);
  if (auth.error) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: auth.error } });
  }
  if (!isAdminRole(auth.profile.role) && auth.profile.role !== 'agent') {
    return forbidden(res, 'Admin or agent role required to mark orders as paid');
  }

  const { orderId } = req.params;
  try {
    let orderQuery = supabase
      .from('orders')
      .select('id,order_number,agency_id,drct_order_id,payment_status,payment_method,status,contact_email,origin,destination,total_price,currency')
      .eq('id', orderId);

    // Agents can only mark orders for their own agency
    if (auth.profile.role === 'agent' && auth.profile.agency_id) {
      orderQuery = orderQuery.eq('agency_id', auth.profile.agency_id);
    }

    const { data: order, error: orderErr } = await orderQuery.maybeSingle();

    if (orderErr || !order) {
      return res.status(404).json({ error: { code: 'ORDER_NOT_FOUND', message: 'Order not found' } });
    }
    if (order.payment_status === 'paid') {
      return res.status(400).json({ error: { code: 'ALREADY_PAID', message: 'Order is already marked as paid' } });
    }

    const nowIso = new Date().toISOString();
    await supabase.from('orders').update({
      payment_status: 'paid',
      status: 'confirmed',
      confirmed_at: nowIso,
      updated_at: nowIso
    }).eq('id', order.id);

    // Trigger async ticket issuance + PDF + email (same flow as online card payment)
    const paymentsModule = require('./payments');
    setImmediate(() => paymentsModule.handlePaymentPaidAsync(order, `manual_${auth.profile.id}`));

    return res.json({ ok: true, order_number: order.order_number, message: 'Order marked as paid. Ticket will be issued and emailed shortly.' });
  } catch (err) {
    console.error('mark-paid error:', err);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: config.nodeEnv === 'development' ? err.message : 'Internal server error' } });
  }
});

router.post('/api/orders/:orderId/issue', resolveOrderMutationContext, idempotencyMiddleware, async (req, res) => {
  const auth = req.auth;
  const order = req.order;

  try {
    const normalizedStatus = String(order.status || '').toLowerCase();
    if (normalizedStatus === 'cancelled') {
      return res.status(409).json({
        error: {
          code: 'ORDER_ALREADY_CANCELLED',
          message: 'Cancelled orders cannot be issued'
        }
      });
    }

    if (!['confirmed', 'ticketed', 'issued', 'ticket_issued'].includes(normalizedStatus)) {
      return res.status(422).json({
        error: {
          code: 'INVALID_ORDER_STATUS',
          message: 'Ticket issue allowed only for confirmed orders'
        }
      });
    }

    const issueResult = await issueDrctTicket({
      order,
      createdBy: auth.profile.id
    });

    const { data: updatedOrder } = await supabase
      .from('orders')
      .select(ORDER_MUTATION_SELECT)
      .eq('id', order.id)
      .single();

    return res.json({
      ok: true,
      order: updatedOrder || {
        ...order,
        status: 'ticketed',
        updated_at: new Date().toISOString()
      },
      issuance: issueResult.issuance || null,
      document: issueResult.doc || null,
      download_url: issueResult.url || null,
      pnr: issueResult.pnr || null,
      ticket_number: issueResult.ticketNumber || null
    });
  } catch (err) {
    console.error('Order issue error:', err);
    const message = String(err?.message || 'Issue ticket failed');
    const statusCode =
      message === 'PDF_ONLY_TICKET_ISSUANCE_DISABLED' ? 409 :
      String(message).includes('DRCT') ? 502 :
      500;

    return res.status(statusCode).json({
      error: {
        code: statusCode === 409 ? 'PDF_ONLY_TICKET_ISSUANCE_DISABLED' : 'ORDER_ISSUE_FAILED',
        message: config.nodeEnv === 'development' ? message : (
          statusCode === 502 ? 'Failed to issue ticket with provider' : 'Failed to issue ticket'
        )
      }
    });
  }
});

router.post('/api/orders/:orderId/cancel', resolveOrderMutationContext, idempotencyMiddleware, async (req, res) => {
  const order = req.order;
  const { reason = 'USER_REQUEST', refund_requested: refundRequested = true } = req.body || {};

  try {
    const normalizedStatus = String(order.status || '').toLowerCase();
    if (normalizedStatus === 'cancelled') {
      return res.status(409).json({
        error: {
          code: 'ORDER_ALREADY_CANCELLED',
          message: 'Order has already been cancelled'
        }
      });
    }

    if (!order.drct_order_id) {
      return res.status(409).json({
        error: {
          code: 'DRCT_ORDER_ID_REQUIRED',
          message: 'Order has no DRCT order id and cannot be cancelled via provider flow'
        }
      });
    }

    const cancelResult = await drctService.cancelOrder(
      {
        order_id: order.drct_order_id,
        reason,
        refund_requested: refundRequested !== false
      },
      order.agency_id,
      order.id
    );

    if (!cancelResult?.success) {
      return res.status(Number(cancelResult?.error?.statusCode || 502)).json({
        error: {
          code: cancelResult?.error?.code || 'ORDER_CANCEL_FAILED',
          message: cancelResult?.error?.message || 'Failed to cancel order'
        }
      });
    }

    const nowIso = new Date().toISOString();
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'cancelled',
        cancelled_at: nowIso,
        updated_at: nowIso
      })
      .eq('id', order.id)
      .select(ORDER_MUTATION_SELECT)
      .single();

    if (updateError) {
      return res.status(500).json({
        error: {
          code: 'ORDER_CANCEL_UPDATE_FAILED',
          message: updateError.message
        }
      });
    }

    return res.json({
      ok: true,
      order: updatedOrder,
      provider_result: cancelResult.data || null
    });
  } catch (err) {
    console.error('Order cancel error:', err);
    return res.status(500).json({
      error: {
        code: 'ORDER_CANCEL_FAILED',
        message: config.nodeEnv === 'development' ? err.message : 'Failed to cancel order'
      }
    });
  }
});

router.get('/api/orders/:orderId/ticket-document', async (req, res) => {
  const auth = await resolveAuthContext(req);
  if (auth.error) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: auth.error } });
  }

  const { orderId } = req.params;
  try {
    const { data: order } = await supabase
      .from('orders')
      .select('id,order_number,user_id,agency_id,drct_order_id,origin,destination,departure_time,arrival_time,airline_code,airline_name,flight_number,total_price,currency,status,contact_email,contact_phone')
      .eq('id', orderId)
      .single();
    if (!order) {
      return res.status(404).json({ error: { code: 'ORDER_NOT_FOUND', message: 'Order not found' } });
    }

    const canAccess = await canAccessOrder(auth, order);
    if (!canAccess) return forbidden(res);

    if (!['confirmed', 'ticketed'].includes(String(order.status || '').toLowerCase())) {
      return res.status(422).json({
        error: {
          code: 'INVALID_ORDER_STATUS',
          message: 'Ticket PDF can be generated only for confirmed or ticketed orders'
        }
      });
    }

    const ensured = await ensureTicketPdfForOrder({
      order,
      createdBy: auth.profile.id,
      pnr: order.drct_order_id || null
    });
    return res.json({
      ticket: ensured.issuance,
      document: ensured.doc,
      url: ensured.url,
      generated: ensured.generated
    });
  } catch (err) {
    console.error('Ticket document endpoint error:', err);
    return res.status(500).json({
      error: {
        code: 'TICKET_DOCUMENT_FAILED',
        message: config.nodeEnv === 'development' ? err.message : 'Internal server error'
      }
    });
  }
});

router.get('/api/orders/:orderId/payment-instructions', async (req, res) => {
  const auth = await resolveAuthContext(req);
  if (auth.error) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: auth.error } });
  }

  const { orderId } = req.params;
  try {
    const { data: order } = await supabase
      .from('orders')
      .select('id,order_number,user_id,agency_id,total_price,currency,status,contact_email,created_at')
      .eq('id', orderId)
      .single();
    if (!order) {
      return res.status(404).json({ error: { code: 'ORDER_NOT_FOUND', message: 'Order not found' } });
    }

    const canAccess = await canAccessOrder(auth, order);
    if (!canAccess) return forbidden(res);

    let resolvedAgencyId = order.agency_id || null;
    let agency = null;

    // Resolve missing agency link for old orders.
    if (!resolvedAgencyId && order.user_id) {
      const { data: orderProfile } = await supabase
        .from('profiles')
        .select('agency_id')
        .eq('id', order.user_id)
        .maybeSingle();
      if (orderProfile?.agency_id) {
        resolvedAgencyId = orderProfile.agency_id;
      }
    }

    if (!resolvedAgencyId && order.contact_email) {
      const normalizedEmail = String(order.contact_email).trim().toLowerCase();
      const { data: agenciesByEmail } = await supabase
        .from('agencies')
        .select('id')
        .eq('contact_email', normalizedEmail)
        .limit(2);
      const linked = Array.isArray(agenciesByEmail) ? agenciesByEmail : [];
      if (linked.length === 1) {
        resolvedAgencyId = linked[0].id;
      }
    }

    if (resolvedAgencyId && !order.agency_id) {
      const { error: patchOrderError } = await supabase
        .from('orders')
        .update({
          agency_id: resolvedAgencyId,
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id);
      if (patchOrderError) {
        console.warn('Failed to backfill order agency_id:', patchOrderError.message);
      }
    }

    if (resolvedAgencyId) {
      const { data } = await supabase
        .from('agencies')
        .select('id,name,domain,contact_email,contact_phone,settings')
        .eq('id', resolvedAgencyId)
        .single();
      agency = data || null;
    }

    if (!agency) {
      return res.status(422).json({
        error: {
          code: 'ORDER_AGENCY_NOT_LINKED',
          message: 'Order is not linked to an agency yet'
        }
      });
    }

    const bank = agency?.settings?.bank_details || {};
    const hasBankDetails = !!(
      bank.bank_name ||
      bank.bank_account ||
      bank.iban ||
      bank.swift_bic ||
      bank.sama_code
    );
    if (!hasBankDetails) {
      return res.status(422).json({
        error: {
          code: 'AGENCY_BANK_DETAILS_MISSING',
          message: 'Agency bank details are not configured'
        }
      });
    }

    const paymentInstruction = {
      order_id: order.id,
      order_number: order.order_number,
      amount: Number(order.total_price || 0),
      currency: order.currency || 'USD',
      status: order.status || 'pending',
      agency: agency ? {
        id: agency.id,
        name: agency.name,
        domain: agency.domain,
        contact_email: agency.contact_email,
        contact_phone: agency.contact_phone
      } : null,
      bank_details: {
        bank_name: bank.bank_name || null,
        account_number: bank.bank_account || null,
        iban: bank.iban || null,
        swift_bic: bank.swift_bic || null,
        sama_code: bank.sama_code || null
      },
      notes: [
        'Переведите сумму по реквизитам агентства.',
        `В комментарии укажите номер заказа: ${order.order_number}`,
        'После поступления оплаты статус будет подтвержден и билет выписан.'
      ]
    };

    return res.json({ payment_instruction: paymentInstruction });
  } catch (err) {
    console.error('Payment instructions error:', err);
    return res.status(500).json({
      error: {
        code: 'PAYMENT_INSTRUCTIONS_FAILED',
        message: config.nodeEnv === 'development' ? err.message : 'Internal server error'
      }
    });
  }
});

router.post('/api/orders/:orderId/ticket/finalize', async (req, res) => {
  const auth = await resolveAuthContext(req);
  if (auth.error) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: auth.error } });
  }
  if (!ensureStaff(auth, res)) return;

  const { orderId } = req.params;
  const { send_email: sendEmail = true, ticket_number: ticketNumber, pnr } = req.body || {};

  try {
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id,order_number,user_id,agency_id,drct_order_id,origin,destination,departure_time,arrival_time,airline_code,airline_name,flight_number,total_price,currency,status,contact_email,contact_phone')
      .eq('id', orderId)
      .single();
    if (orderError || !order) {
      return res.status(404).json({ error: { code: 'ORDER_NOT_FOUND', message: 'Order not found' } });
    }

    const canAccess = await canAccessOrder(auth, order);
    if (!canAccess) {
      return forbidden(res);
    }

    if (!['confirmed', 'ticketed'].includes(String(order.status || '').toLowerCase())) {
      return res.status(422).json({
        error: {
          code: 'INVALID_ORDER_STATUS',
          message: 'Ticket PDF can be generated only for confirmed or ticketed orders'
        }
      });
    }

    const ensureResult = await ensureTicketPdfForOrder({
      order,
      createdBy: auth.profile.id,
      pnr,
      ticketNumber
    });
    const issuance = ensureResult.issuance;
    const doc = ensureResult.doc;
    const downloadUrl = ensureResult.url;

    let emailState = { sent: false, error: 'EMAIL_SKIPPED' };
    if (sendEmail && order.contact_email) {
      const { data: pdfData, error: pdfError } = await supabase.storage
        .from(doc.storage_bucket)
        .download(doc.storage_path);
      if (pdfError || !pdfData) {
        throw new Error(pdfError?.message || 'Failed to read generated ticket PDF');
      }
      const pdfArrayBuffer = await pdfData.arrayBuffer();
      const pdfBuffer = Buffer.from(pdfArrayBuffer);
      const { data: emailPassengers } = await supabase
        .from('passengers')
        .select('first_name,last_name,passenger_type,baggage_allowance')
        .eq('order_id', order.id);
      emailState = await sendTicketEmail({
        to: order.contact_email,
        order,
        passengers: emailPassengers || [],
        issuance: issuance || {},
        agency: ensureResult.agency || null,
        attachment: { fileName: doc.file_name, buffer: pdfBuffer }
      });
    }

    const { data: updatedIssuance } = await supabase
      .from('ticket_issuances')
      .update({
        document_id: doc.id,
        email_status: emailState.sent ? 'sent' : (sendEmail ? 'failed' : 'pending'),
        email_sent_at: emailState.sent ? new Date().toISOString() : null
      })
      .eq('id', issuance.id)
      .select('*')
      .single();

    return res.json({
      ticket_issuance: updatedIssuance || issuance,
      document: doc,
      download_url: downloadUrl,
      email: emailState
    });
  } catch (err) {
    console.error('Ticket finalize error:', err);
    return res.status(500).json({
      error: {
        code: 'TICKET_FINALIZE_FAILED',
        message: config.nodeEnv === 'development' ? err.message : 'Internal server error'
      }
    });
  }
});

module.exports = router;
