'use strict';

const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'BACKEND_URL'];
for (const name of required) {
  if (!process.env[name]) throw new Error(`${name} is required`);
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const baseUrl = process.env.BACKEND_URL.replace(/\/+$/, '');
const departureDate = process.env.TEST_DEPARTURE_DATE || '2026-10-25';
const returnDate = process.env.TEST_RETURN_DATE || '2026-11-02';
const rawKey = `af_test_${crypto.randomBytes(32).toString('base64url')}`;
const passengers = [{ type: 'ADT' }, { type: 'CHD' }, { type: 'INF' }];
let credentialId = null;

async function api(path, body) {
  const correlationId = crypto.randomUUID();
  const response = await fetch(`${baseUrl}/partner/v1${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${rawKey}`,
      'Content-Type': 'application/json',
      'X-Correlation-ID': correlationId,
      'Idempotency-Key': crypto.randomUUID(),
    },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`${path} failed (${response.status}): ${JSON.stringify(payload)}`);
  return { payload, correlationId: response.headers.get('x-correlation-id') || correlationId };
}

async function main() {
  const { data: clients, error: clientsError } = await supabase
    .from('api_clients')
    .select('id,counterparty_id,environment,status')
    .eq('environment', 'sandbox')
    .eq('status', 'ACTIVE')
    .limit(20);
  if (clientsError) throw clientsError;

  let selectedClient = null;
  for (const client of clients || []) {
    const { data: counterparty } = await supabase
      .from('api_counterparties')
      .select('id,status')
      .eq('id', client.counterparty_id)
      .in('status', ['SANDBOX', 'ACTIVE'])
      .maybeSingle();
    if (counterparty) {
      selectedClient = client;
      break;
    }
  }
  if (!selectedClient) throw new Error('No active sandbox API client is available');

  const { data: credential, error: credentialError } = await supabase
    .from('api_credentials')
    .insert({
      api_client_id: selectedClient.id,
      name: 'Automated round-trip smoke test',
      key_hash: crypto.createHash('sha256').update(rawKey).digest('hex'),
      key_prefix: rawKey.slice(0, 20),
      scopes: ['offers:read', 'orders:create', 'orders:read'],
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    })
    .select('id')
    .single();
  if (credentialError) throw credentialError;
  credentialId = credential.id;

  const search = await api('/offers/search', {
    slices: [
      { origin: 'LON', destination: 'MIL', departure_date: departureDate },
      { origin: 'MIL', destination: 'LON', departure_date: returnDate },
    ],
    passengers,
    cabin_class: 'economy',
  });
  if (!search.payload.offers?.length) {
    throw new Error(`Round-trip search returned zero offers (provider=${search.payload.meta?.provider_offer_count || 0})`);
  }

  const first = search.payload.offers[0];
  const price = await api(`/offers/${encodeURIComponent(first.offer_id)}/price`, {
    passengers,
  });
  const { data: audit, error: auditError } = await supabase
    .from('offer_quotes')
    .select('supplier_total,markup_total,sell_total,currency,distribution_channel,carrier_code,pricing_rule_trace')
    .eq('external_quote_id', price.payload.price_quote_id)
    .single();
  if (auditError) throw auditError;

  const arithmeticDelta = Math.abs((Number(audit.supplier_total) + Number(audit.markup_total)) - Number(audit.sell_total));
  if (arithmeticDelta > 0.001) throw new Error(`Price audit arithmetic mismatch: ${arithmeticDelta}`);

  let orderSummary = null;
  if (String(process.env.CREATE_SANDBOX_ORDER || '').toLowerCase() === 'true') {
    const suffix = Date.now().toString();
    const passengerDetails = [
      { type: 'ADT', title: 'Mr', first_name: 'Alex', date_of_birth: '1996-10-25' },
      { type: 'CHD', title: 'Mstr', first_name: 'Sam', date_of_birth: '2019-10-25' },
      { type: 'INF', title: 'Mstr', first_name: 'Taylor', date_of_birth: '2025-10-25' },
    ].map((passenger, index) => ({
      ...passenger,
      gender: 'M',
      last_name: 'Sandbox',
      document: {
        type: 'REGULAR_PASSPORT',
        number: `AF${suffix.slice(-8)}${index + 1}`,
        issuing_country: 'SA',
        citizenship: 'SA',
        country_of_issue: 'SA',
        expiration_date: '2031-10-25',
      },
    }));
    const order = await api('/orders', {
      price_quote_id: price.payload.price_quote_id,
      client_order_ref: `SMOKE-${suffix}`,
      expected_total: price.payload.price,
      contact: { email: 'sandbox@example.com', phone: '+966500000000' },
      passengers: passengerDetails,
    });
    orderSummary = {
      order_id: order.payload.order_id,
      status: order.payload.status,
      booking_reference: order.payload.booking_reference,
      correlation_id: order.correlationId,
    };
  }

  console.log(JSON.stringify({
    result: 'PASS',
    trip_type: 'round_trip',
    passenger_types: passengers.map(({ type }) => type),
    route: `LON-MIL-${departureDate} / MIL-LON-${returnDate}`,
    offers: search.payload.meta,
    first_offer: {
      carrier: first.validating_carrier,
      channel: first.distribution_channel,
      outbound: first.departure_time,
      return: first.return_departure_time,
      search_sell_price: first.price,
      repriced_sell_price: price.payload.price,
    },
    audit: {
      supplier_total: String(audit.supplier_total),
      percentage_markup: audit.pricing_rule_trace?.percentage_markup,
      fixed_markup: audit.pricing_rule_trace?.fixed_markup,
      markup_total: String(audit.markup_total),
      sell_total: String(audit.sell_total),
      currency: audit.currency,
    },
    sandbox_order: orderSummary,
    correlation_ids: [search.correlationId, price.correlationId],
  }, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
}).finally(async () => {
  if (credentialId) {
    await supabase.from('api_credentials').update({ revoked_at: new Date().toISOString() }).eq('id', credentialId);
  }
});
