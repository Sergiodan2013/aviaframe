import { isValidPhoneNumber } from 'react-phone-number-input';

export const PASSENGER_TYPE_META = {
  ADT: {
    code: 'ADT',
    label: 'Adult',
    description: '12+ years at departure',
  },
  CHD: {
    code: 'CHD',
    label: 'Child',
    description: '2-11 years at departure',
  },
  INF: {
    code: 'INF',
    label: 'Infant',
    description: 'Under 2 years at departure',
  },
};

export function normalizePassengerCounts(counts = {}) {
  const toInt = (value, fallback) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
  };

  const adults = Math.max(1, toInt(counts.adults, 1));
  const children = Math.max(0, toInt(counts.children, 0));
  const infants = Math.max(0, toInt(counts.infants, 0));

  return { adults, children, infants };
}

export function buildPassengerDescriptors(counts = {}) {
  const normalized = normalizePassengerCounts(counts);
  const descriptors = [];

  const pushType = (type, count) => {
    for (let index = 1; index <= count; index += 1) {
      descriptors.push({
        id: `${type}-${index}`,
        type,
        index,
        label: `${PASSENGER_TYPE_META[type].label} ${index}`,
        description: PASSENGER_TYPE_META[type].description,
      });
    }
  };

  pushType('ADT', normalized.adults);
  pushType('CHD', normalized.children);
  pushType('INF', normalized.infants);

  return descriptors;
}

export function buildInitialPassengerFormData(counts = {}, userEmail = '') {
  const descriptors = buildPassengerDescriptors(counts);

  return {
    contacts: {
      email: userEmail || '',
      phone: '+966',
    },
    baggage: 'none',
    passengers: descriptors.map((descriptor) => ({
      id: descriptor.id,
      type: descriptor.type,
      label: descriptor.label,
      description: descriptor.description,
      gender: 'male',
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      passportNumber: '',
      passportExpiry: '',
      nationality: 'SA',
    })),
  };
}

function parseDateParts(value) {
  if (!value || typeof value !== 'string') return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;

  const year = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10);
  const day = Number.parseInt(match[3], 10);

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  return { year, month, day };
}

export function resolveReferenceDate(referenceDate) {
  if (!referenceDate) {
    const now = new Date();
    return {
      year: now.getUTCFullYear(),
      month: now.getUTCMonth() + 1,
      day: now.getUTCDate(),
    };
  }

  if (typeof referenceDate === 'string') {
    const parsed = parseDateParts(referenceDate);
    if (parsed) return parsed;

    const fromDate = new Date(referenceDate);
    if (!Number.isNaN(fromDate.getTime())) {
      return {
        year: fromDate.getUTCFullYear(),
        month: fromDate.getUTCMonth() + 1,
        day: fromDate.getUTCDate(),
      };
    }
  }

  if (referenceDate instanceof Date && !Number.isNaN(referenceDate.getTime())) {
    return {
      year: referenceDate.getUTCFullYear(),
      month: referenceDate.getUTCMonth() + 1,
      day: referenceDate.getUTCDate(),
    };
  }

  return null;
}

export function getPassengerAgeOnDate(dateOfBirth, referenceDate) {
  const dob = parseDateParts(dateOfBirth);
  const ref = resolveReferenceDate(referenceDate);

  if (!dob || !ref) return null;

  let age = ref.year - dob.year;
  if (ref.month < dob.month || (ref.month === dob.month && ref.day < dob.day)) {
    age -= 1;
  }
  return age;
}

export function validatePassengerAgeForType(type, dateOfBirth, referenceDate) {
  const age = getPassengerAgeOnDate(dateOfBirth, referenceDate);
  if (age === null) {
    return { valid: false, message: 'Please enter a valid date of birth' };
  }

  if (age < 0 || age > 120) {
    return { valid: false, message: 'Please enter a valid date of birth' };
  }

  if (type === 'ADT' && age < 12) {
    return { valid: false, message: 'Adult passenger must be at least 12 years old at departure' };
  }

  if (type === 'CHD' && (age < 2 || age >= 12)) {
    return { valid: false, message: 'Child passenger must be 2-11 years old at departure' };
  }

  if (type === 'INF' && age >= 2) {
    return { valid: false, message: 'Infant passenger must be under 2 years old at departure' };
  }

  return { valid: true, message: null };
}

export function countPassengersByType(passengers = []) {
  return passengers.reduce((acc, passenger) => {
    const type = passenger?.type || 'ADT';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, { ADT: 0, CHD: 0, INF: 0 });
}

export function buildPassengerSummary(passengers = []) {
  const counts = countPassengersByType(passengers);
  const summary = [];

  if (counts.ADT) summary.push(`${counts.ADT} adult${counts.ADT > 1 ? 's' : ''}`);
  if (counts.CHD) summary.push(`${counts.CHD} child${counts.CHD > 1 ? 'ren' : ''}`);
  if (counts.INF) summary.push(`${counts.INF} infant${counts.INF > 1 ? 's' : ''}`);

  return summary.join(' • ');
}

export function transformPassengersForDRCT(passengers = []) {
  return passengers.map((passenger) => ({
    type: passenger.type,
    first_name: passenger.firstName,
    last_name: passenger.lastName,
    date_of_birth: passenger.dateOfBirth,
    gender: passenger.gender === 'male' ? 'M' : 'F',
    document: {
      type: 'passport',
      number: passenger.passportNumber,
      expiry_date: passenger.passportExpiry,
      issuing_country: passenger.nationality || 'SA',
    },
  }));
}

export function buildOrderPayloadForDRCT({ selectedOffer, passengerFormData, user, baggagePrice }) {
  const priceAmount = Number(selectedOffer?.price?.total || 0);
  const taxesAmount = Number(selectedOffer?.price?.taxes || 0);
  const baggageAmount = Number(baggagePrice?.amount || 0);

  return {
    offer_id: selectedOffer.offer_id,
    passengers: transformPassengersForDRCT(passengerFormData.passengers),
    contacts: {
      email: passengerFormData.contacts.email,
      phone: passengerFormData.contacts.phone,
    },
    user_id: user?.id,
    user_email: user?.email,
    offer: {
      origin: selectedOffer.origin,
      destination: selectedOffer.destination,
      departure_time: selectedOffer.departure_time,
      arrival_time: selectedOffer.arrival_time,
      airline_code: selectedOffer.airline_code,
      airline_name: selectedOffer.airline_name,
      flight_number: selectedOffer.flight_number,
      base_price: priceAmount,
      taxes: taxesAmount,
      currency: selectedOffer?.price?.currency || 'UAH',
    },
    passenger_details: {
      baggage_allowance: passengerFormData.baggage,
      passengers: passengerFormData.passengers.map((passenger) => ({
        type: passenger.type,
        first_name: passenger.firstName,
        last_name: passenger.lastName,
        date_of_birth: passenger.dateOfBirth,
        nationality: passenger.nationality,
        passport_number: passenger.passportNumber,
        passport_expiry: passenger.passportExpiry,
      })),
    },
    pricing: {
      base_price: priceAmount,
      taxes: taxesAmount,
      baggage_price: baggageAmount,
      total_price: priceAmount + baggageAmount,
      currency: selectedOffer?.price?.currency || 'UAH',
    },
    raw_offer_data: selectedOffer,
  };
}

export function buildPendingBookingData({ n8nResponse, selectedOffer, passengerFormData, baggagePrice }) {
  const baggageAmount = Number(baggagePrice?.amount || 0);
  const totalPrice = Number(selectedOffer?.price?.total || 0) + baggageAmount;

  return {
    orderNumber: n8nResponse.order_number || n8nResponse.metadata?.order_number || null,
    bookingReference: n8nResponse.booking_reference || n8nResponse.drct_order_id || n8nResponse.metadata?.drct_order_id || null,
    status: 'pending_payment',
    offer: selectedOffer,
    passengerParty: passengerFormData,
    totalPrice,
    currency: selectedOffer?.price?.currency || 'UAH',
  };
}

export function buildCachedOrderRecord({ n8nResponse, selectedOffer, passengerFormData, user, baggagePrice, createdAt = new Date().toISOString() }) {
  const baggageAmount = Number(baggagePrice?.amount || 0);
  const resolvedOrderId = n8nResponse?.order_id
    || (n8nResponse?.entity_type === 'order' ? n8nResponse?.entity_id : null)
    || n8nResponse?.entity_id
    || null;

  return {
    id: resolvedOrderId || `local_${Date.now()}`,
    order_number: n8nResponse.order_number || n8nResponse.booking_reference || `ORD-${Date.now()}`,
    drct_order_id: n8nResponse.drct_order_id || n8nResponse.booking_reference || null,
    user_id: user?.id || null,
    contact_email: passengerFormData.contacts.email,
    contact_phone: passengerFormData.contacts.phone,
    passenger_count: Array.isArray(passengerFormData.passengers) ? passengerFormData.passengers.length : 0,
    origin: selectedOffer.origin,
    destination: selectedOffer.destination,
    departure_time: selectedOffer.departure_time,
    arrival_time: selectedOffer.arrival_time,
    airline_code: selectedOffer.airline_code || selectedOffer.airline,
    airline_name: selectedOffer.airline_name,
    flight_number: selectedOffer.flight_number || null,
    total_price: Number(selectedOffer?.price?.total || 0) + baggageAmount,
    currency: selectedOffer?.price?.currency || 'UAH',
    status: 'pending',
    created_at: createdAt,
    updated_at: createdAt,
    raw_offer_data: selectedOffer,
  };
}

function startOfDay(date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

export function validatePassengerFormData(formData = {}, { departureDate, now = new Date() } = {}) {
  const nextErrors = { contacts: {}, passengers: {}, global: {} };
  const contacts = formData.contacts || {};
  const passengers = Array.isArray(formData.passengers) ? formData.passengers : [];

  if (!String(contacts.email || '').trim()) {
    nextErrors.contacts.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(contacts.email || ''))) {
    nextErrors.contacts.email = 'Please enter a valid email';
  }

  if (!contacts.phone || String(contacts.phone).length < 4) {
    nextErrors.contacts.phone = 'Please enter a valid phone number';
  } else if (!isValidPhoneNumber(String(contacts.phone || ''))) {
    nextErrors.contacts.phone = 'Please enter a valid phone number';
  }

  const counts = countPassengersByType(passengers);
  if ((counts.INF || 0) > (counts.ADT || 0)) {
    nextErrors.global.passengers = 'Each infant must be accompanied by an adult';
  }

  const today = startOfDay(now);
  const sixMonthsFromNow = startOfDay(now);
  sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

  passengers.forEach((passenger) => {
    const passengerErrors = {};

    if (!String(passenger?.firstName || '').trim()) {
      passengerErrors.firstName = 'First name is required';
    }

    if (!String(passenger?.lastName || '').trim()) {
      passengerErrors.lastName = 'Last name is required';
    }

    if (!passenger?.dateOfBirth) {
      passengerErrors.dateOfBirth = 'Date of birth is required';
    } else {
      const ageValidation = validatePassengerAgeForType(passenger.type, passenger.dateOfBirth, departureDate);
      if (!ageValidation.valid) {
        passengerErrors.dateOfBirth = ageValidation.message;
      }
    }

    if (!String(passenger?.passportNumber || '').trim()) {
      passengerErrors.passportNumber = 'Passport number is required';
    } else if (String(passenger.passportNumber).trim().length < 6) {
      passengerErrors.passportNumber = 'Passport number must be at least 6 characters';
    }

    if (!passenger?.passportExpiry) {
      passengerErrors.passportExpiry = 'Passport expiry date is required';
    } else {
      const expiry = startOfDay(passenger.passportExpiry);

      if (Number.isNaN(expiry.getTime())) {
        passengerErrors.passportExpiry = 'Please enter a valid expiry date';
      } else if (expiry < today) {
        passengerErrors.passportExpiry = 'Passport has expired';
      } else if (expiry < sixMonthsFromNow) {
        passengerErrors.passportExpiry = 'Passport must be valid for at least 6 months';
      }
    }

    if (!passenger?.nationality) {
      passengerErrors.nationality = 'Nationality is required';
    }

    if (Object.keys(passengerErrors).length > 0) {
      nextErrors.passengers[passenger.id] = passengerErrors;
    }
  });

  return nextErrors;
}
