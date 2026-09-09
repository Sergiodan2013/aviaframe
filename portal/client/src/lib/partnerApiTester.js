const PASSENGER_LIMIT = 9;

const toCount = (value) => Math.max(0, Math.trunc(Number(value) || 0));

function shiftYear(isoDate, years) {
  const [year, month, day] = String(isoDate).split('-').map(Number);
  const safeYear = year + years;
  const safeDay = month === 2 && day === 29 ? 28 : day;
  return `${safeYear}-${String(month).padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`;
}

export function buildSearchPassengers(search) {
  const adults = toCount(search.adults);
  const children = toCount(search.children);
  const infants = toCount(search.infants);
  const total = adults + children + infants;

  if (adults < 1) throw new Error('At least one adult is required.');
  if (total > PASSENGER_LIMIT) throw new Error('A maximum of 9 passengers is allowed.');
  if (infants > adults) throw new Error('Infants cannot exceed the number of adults.');

  return [
    ...Array.from({ length: adults }, () => ({ type: 'ADT' })),
    ...Array.from({ length: children }, () => ({ type: 'CHD' })),
    ...Array.from({ length: infants }, () => ({ type: 'INF' })),
  ];
}

export function buildPartnerSearchPayload(search) {
  const origin = String(search.origin || '').trim().toUpperCase();
  const destination = String(search.destination || '').trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(origin) || !/^[A-Z]{3}$/.test(destination)) {
    throw new Error('From and To must be 3-letter IATA codes.');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(search.departure_date || ''))) {
    throw new Error('Select a departure date.');
  }

  const slices = [{ origin, destination, departure_date: search.departure_date }];
  if (search.trip_type === 'round_trip') {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(search.return_date || ''))) {
      throw new Error('Select a return date.');
    }
    if (search.return_date < search.departure_date) {
      throw new Error('Return date must be on or after the departure date.');
    }
    slices.push({ origin: destination, destination: origin, departure_date: search.return_date });
  }

  return {
    slices,
    passengers: buildSearchPassengers(search),
    cabin_class: search.cabin_class,
  };
}

export function buildSandboxOrderPassengers(search, uniqueSuffix = 'TEST') {
  const departureDate = search.departure_date;
  const types = buildSearchPassengers(search).map(({ type }) => type);
  const firstNames = ['Alex', 'Sam', 'Taylor', 'Jordan', 'Robin', 'Morgan', 'Casey', 'Jamie', 'Avery'];

  return types.map((type, index) => ({
    type,
    title: type === 'ADT' ? 'Mr' : 'Mstr',
    gender: 'M',
    first_name: firstNames[index],
    last_name: 'Sandbox',
    date_of_birth: shiftYear(departureDate, type === 'ADT' ? -30 : type === 'CHD' ? -7 : -1),
    document: {
      type: 'REGULAR_PASSPORT',
      number: `AF${String(uniqueSuffix).replace(/[^A-Za-z0-9]/g, '').slice(-12)}${index + 1}`,
      issuing_country: 'SA',
      citizenship: 'SA',
      country_of_issue: 'SA',
      expiration_date: shiftYear(departureDate, 5),
    },
  }));
}

export function buildSandboxOrderPayload({ pricedOffer, search, contact, uniqueSuffix }) {
  if (!pricedOffer?.price_quote_id || !pricedOffer?.price?.total || !pricedOffer?.price?.currency) {
    throw new Error('Confirm the current price before creating an order.');
  }
  const suffix = String(uniqueSuffix || Date.now());
  return {
    price_quote_id: pricedOffer.price_quote_id,
    client_order_ref: `ADMIN-SANDBOX-${suffix.replace(/[^A-Za-z0-9-]/g, '').slice(-32)}`,
    expected_total: {
      total: String(pricedOffer.price.total),
      currency: String(pricedOffer.price.currency).toUpperCase(),
    },
    contact: {
      email: String(contact.email || '').trim(),
      phone: String(contact.phone || '').trim(),
    },
    passengers: buildSandboxOrderPassengers(search, suffix),
  };
}

