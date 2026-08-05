#!/usr/bin/env node
/**
 * Production smoke test.
 * Run manually: node backend/scripts/smoke-test.js
 * Run in CI: same command, BACKEND_URL env var set via workflow.
 */

const BACKEND_URL =
  process.env.BACKEND_URL ||
  'https://peaceful-amazement-production-629f.up.railway.app';

const WIDGET_SIGNATURE = 'with_baggage:e.with_baggage===!0';

const AGENCY_SITES = [
  { name: 'skyports',      url: 'https://skyports.aviaframe.com' },
  { name: 'sahabalalam',   url: 'https://sahabalalam.aviaframe.com' },
  { name: 'almalektravel', url: 'https://almalektravel.aviaframe.com' },
  { name: 'airwings',      url: 'https://airwings.aviaframe.com' },
  { name: 'alwatania',     url: 'https://alwatania.aviaframe.com' },
];

const DRCT_SEARCH_PAYLOAD = {
  origin: 'JED',
  destination: 'MNL',
  depart_date: '2026-09-15',
  passengers: 1,
};

let failures = 0;

function fail(msg) {
  console.error(`  ❌ ${msg}`);
  failures++;
}

function ok(msg) {
  console.log(`  ✅ ${msg}`);
}

async function get(url, timeoutMs = 15000) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ac.signal });
    return { status: res.status, text: await res.text() };
  } finally {
    clearTimeout(timer);
  }
}

async function post(url, body, headers = {}, timeoutMs = 30000) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
      signal: ac.signal,
    });
    return { status: res.status, json: await res.json().catch(() => null) };
  } finally {
    clearTimeout(timer);
  }
}

async function checkHealth() {
  console.log('\n── Backend health ──');
  try {
    const { status, text } = await get(`${BACKEND_URL}/healthz`);
    if (status === 200) {
      ok(`/healthz → 200`);
    } else {
      fail(`/healthz returned ${status}: ${text.slice(0, 100)}`);
    }
  } catch (e) {
    fail(`/health unreachable: ${e.message}`);
  }
}

async function checkDrctSearch() {
  console.log('\n── DRCT search (JED→MNL) ──');
  try {
    const { status, json } = await post(`${BACKEND_URL}/webhook/drct/search`, DRCT_SEARCH_PAYLOAD, {
      'Content-Type': 'application/json',
      'Origin': 'https://skyports.aviaframe.com',
    });
    if (status !== 200) {
      fail(`/webhook/drct/search returned ${status}`);
      return;
    }
    const offers = json?.offers || json?.data?.offers || [];
    ok(`Got ${offers.length} offers`);

    if (offers.length === 0) {
      fail('No offers returned — DRCT API may be down or misconfigured');
      return;
    }

    const baggageOffers = offers.filter(o => o.with_baggage === true);
    if (baggageOffers.length > 0) {
      ok(`${baggageOffers.length} offers with baggage`);
    } else {
      fail(`0 offers have with_baggage=true out of ${offers.length} total — check DRCT_API env vars or fare data`);
    }

    const missingField = offers.filter(o => !('with_baggage' in o));
    if (missingField.length > 0) {
      fail(`${missingField.length} offers missing with_baggage field entirely`);
    }
  } catch (e) {
    fail(`/webhook/drct/search error: ${e.message}`);
  }
}

async function checkWidget(site) {
  const widgetUrl = `${site.url}/aviaframe-widget.js`;
  try {
    const { status, text } = await get(widgetUrl, 20000);
    if (status !== 200) {
      fail(`${site.name}: widget returned ${status}`);
      return;
    }
    if (text.includes(WIDGET_SIGNATURE)) {
      ok(`${site.name}: widget has baggage normalizer`);
    } else {
      fail(`${site.name}: widget is MISSING baggage normalizer (${WIDGET_SIGNATURE})`);
    }
  } catch (e) {
    fail(`${site.name}: widget unreachable — ${e.message}`);
  }
}

async function checkAgencyWidgets() {
  console.log('\n── Agency site widgets ──');
  await Promise.all(AGENCY_SITES.map(s => checkWidget(s)));
}

async function main() {
  console.log(`Smoke test against: ${BACKEND_URL}`);
  await checkHealth();
  await checkDrctSearch();
  await checkAgencyWidgets();

  console.log(`\n${'─'.repeat(40)}`);
  if (failures === 0) {
    console.log('✅ All checks passed');
    process.exit(0);
  } else {
    console.log(`❌ ${failures} check(s) failed`);
    process.exit(1);
  }
}

main().catch(e => {
  console.error('Smoke test crashed:', e);
  process.exit(1);
});
