'use strict';

const ECB_DAILY_XML_URL = process.env.DISPLAY_FX_ECB_DAILY_XML_URL
  || 'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml';
const ECB_FETCH_TIMEOUT_MS = Number(process.env.DISPLAY_FX_FETCH_TIMEOUT_MS || 4000);
const DISPLAY_FX_REFRESH_MS = Number(process.env.DISPLAY_FX_REFRESH_MS || 6 * 60 * 60 * 1000);
const SAR_PER_USD_PEG = Number(process.env.DISPLAY_FX_SAR_PER_USD || 3.75);

const DEFAULT_SAR_PER_UNIT = Object.freeze({
  SAR: 1,
  USD: 3.75,
  EUR: 4.33,
  UAH: 0.09,
});

const snapshotCache = {
  promise: null,
  snapshot: null,
  fetchedAt: 0,
};

function parseEnvSarPerUnit(rawValue) {
  if (!rawValue) return null;
  try {
    const parsed = JSON.parse(rawValue);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    const normalized = {};
    for (const [code, value] of Object.entries(parsed)) {
      const normalizedCode = String(code || '').trim().toUpperCase();
      const numericValue = Number(value);
      if (!normalizedCode || !Number.isFinite(numericValue) || numericValue <= 0) continue;
      normalized[normalizedCode] = numericValue;
    }
    return Object.keys(normalized).length > 0 ? normalized : null;
  } catch (_) {
    return null;
  }
}

function buildSnapshotFromSarPerUnit(sarPerUnit, options = {}) {
  const supportedCurrencies = Object.keys(sarPerUnit).sort();
  return {
    base_currency: 'SAR',
    default_display_currency: 'SAR',
    supported_currencies: supportedCurrencies,
    source: options.source || 'static_reference',
    provider: options.provider || 'fallback',
    provider_updated_at: options.providerUpdatedAt || null,
    fetched_at: options.fetchedAt || new Date().toISOString(),
    updated_at: options.updatedAt || options.providerUpdatedAt || options.fetchedAt || new Date().toISOString(),
    rates: Object.fromEntries(
      supportedCurrencies.map((currency) => ([
        currency,
        {
          sar_per_unit: Number(sarPerUnit[currency].toFixed(8)),
          per_sar: Number((1 / sarPerUnit[currency]).toFixed(8)),
        },
      ]))
    ),
  };
}

function getStaticOverrideSnapshot() {
  const envRates = parseEnvSarPerUnit(process.env.DISPLAY_FX_SAR_PER_UNIT_JSON);
  if (envRates) {
    return buildSnapshotFromSarPerUnit(envRates, {
      source: 'env_override',
      provider: 'env',
      fetchedAt: process.env.DISPLAY_FX_UPDATED_AT || new Date().toISOString(),
      updatedAt: process.env.DISPLAY_FX_UPDATED_AT || new Date().toISOString(),
    });
  }

  return buildSnapshotFromSarPerUnit(DEFAULT_SAR_PER_UNIT, {
    source: 'static_reference',
    provider: 'fallback',
  });
}

function parseEcbDailyXml(xml) {
  const text = String(xml || '');
  const dateMatch = text.match(/<Cube\s+time=['"]([^'"]+)['"]/i);
  if (!dateMatch) {
    throw new Error('ECB daily XML is missing the reference date');
  }

  const rateEntries = Array.from(text.matchAll(/<Cube\s+currency=['"]([A-Z]{3})['"]\s+rate=['"]([0-9.]+)['"]\s*\/>/g));
  const ratesByCurrency = Object.fromEntries(
    rateEntries
      .map(([, currency, rate]) => [currency, Number(rate)])
      .filter(([, rate]) => Number.isFinite(rate) && rate > 0)
  );

  if (!ratesByCurrency.USD) {
    throw new Error('ECB daily XML is missing the USD reference rate');
  }

  return {
    date: dateMatch[1],
    ratesByCurrency,
  };
}

function buildSnapshotFromEcbXml(xml) {
  const parsed = parseEcbDailyXml(xml);
  const usdPerEur = Number(parsed.ratesByCurrency.USD);
  if (!Number.isFinite(SAR_PER_USD_PEG) || SAR_PER_USD_PEG <= 0) {
    throw new Error('DISPLAY_FX_SAR_PER_USD must be a positive number');
  }

  const sarPerEur = usdPerEur * SAR_PER_USD_PEG;

  // ECB quotes every currency against EUR. Publish all of them as source
  // currencies so a fare returned in UAH, GBP, etc. can be displayed in EUR.
  const sarPerUnit = {
    // ECB does not always publish UAH. Keep a conservative reference rate so
    // fares can still be displayed in the selected currency between updates.
    ...DEFAULT_SAR_PER_UNIT,
    SAR: 1,
    EUR: sarPerEur,
    ...Object.fromEntries(
      Object.entries(parsed.ratesByCurrency).map(([currency, unitsPerEur]) => [
        currency,
        sarPerEur / unitsPerEur,
      ])
    ),
  };

  return buildSnapshotFromSarPerUnit(sarPerUnit, {
    source: 'ecb_reference_rates',
    provider: 'ECB',
    providerUpdatedAt: `${parsed.date}T16:00:00Z`,
    fetchedAt: new Date().toISOString(),
    updatedAt: `${parsed.date}T16:00:00Z`,
  });
}

async function fetchEcbDailyXml() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ECB_FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(ECB_DAILY_XML_URL, {
      method: 'GET',
      headers: {
        Accept: 'application/xml,text/xml;q=0.9,*/*;q=0.8',
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`ECB daily XML request failed with status ${response.status}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

function shouldUseFreshCache() {
  if (!snapshotCache.snapshot) return false;
  if (!snapshotCache.fetchedAt) return false;
  return (Date.now() - snapshotCache.fetchedAt) < DISPLAY_FX_REFRESH_MS;
}

async function refreshDisplayFxSnapshot() {
  if (snapshotCache.promise) return snapshotCache.promise;

  snapshotCache.promise = (async () => {
    const fallbackSnapshot = getStaticOverrideSnapshot();
    try {
      if (fallbackSnapshot.source === 'env_override') {
        snapshotCache.snapshot = fallbackSnapshot;
        snapshotCache.fetchedAt = Date.now();
        return snapshotCache.snapshot;
      }

      const xml = await fetchEcbDailyXml();
      const liveSnapshot = buildSnapshotFromEcbXml(xml);
      snapshotCache.snapshot = liveSnapshot;
      snapshotCache.fetchedAt = Date.now();
      return liveSnapshot;
    } catch (_) {
      snapshotCache.snapshot = fallbackSnapshot;
      snapshotCache.fetchedAt = Date.now();
      return fallbackSnapshot;
    } finally {
      snapshotCache.promise = null;
    }
  })();

  return snapshotCache.promise;
}

async function getDisplayFxSnapshot(options = {}) {
  if (!options.forceRefresh && shouldUseFreshCache()) {
    return snapshotCache.snapshot;
  }
  return refreshDisplayFxSnapshot();
}

function convertDisplayAmount(amount, sourceCurrency, targetCurrency, snapshot) {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount)) return 0;

  const resolvedSnapshot = snapshot || snapshotCache.snapshot || getStaticOverrideSnapshot();
  const source = String(sourceCurrency || resolvedSnapshot.default_display_currency || 'SAR').trim().toUpperCase();
  const target = String(targetCurrency || resolvedSnapshot.default_display_currency || 'SAR').trim().toUpperCase();
  const sourceRate = Number(resolvedSnapshot.rates?.[source]?.sar_per_unit);
  const targetRate = Number(resolvedSnapshot.rates?.[target]?.sar_per_unit);

  if (!Number.isFinite(sourceRate) || sourceRate <= 0) return numericAmount;
  if (!Number.isFinite(targetRate) || targetRate <= 0) return numericAmount;

  const amountInSar = numericAmount * sourceRate;
  return amountInSar / targetRate;
}

function __resetDisplayFxCache() {
  snapshotCache.promise = null;
  snapshotCache.snapshot = null;
  snapshotCache.fetchedAt = 0;
}

// Normalizes an offer/order price object to SAR, our settlement currency.
// DRCT/NDC content can be filed in a non-SAR currency depending on the
// upstream account/market configuration; the platform only ever charges and
// settles in SAR (Moyasar only supports SAR), so every priced amount that
// will reach an order, a PDF, an email, or the payment fee calculator must
// already be SAR by the time it leaves this normalization step. Amounts are
// left untouched (only re-tagged) when the source currency is already SAR.
function convertOfferPriceToSar(price = {}, snapshot) {
  const source = String(price?.currency || 'SAR').trim().toUpperCase();
  if (!price || typeof price !== 'object' || source === 'SAR') {
    return price;
  }

  const resolvedSnapshot = snapshot || snapshotCache.snapshot || getStaticOverrideSnapshot();
  const convert = (value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return value;
    return Math.round(convertDisplayAmount(numeric, source, 'SAR', resolvedSnapshot) * 100) / 100;
  };

  const converted = {
    ...price,
    currency: 'SAR',
    original_currency: source,
    original_total: price.total !== undefined ? Number(price.total) : undefined,
  };

  if (price.total !== undefined) converted.total = convert(price.total);
  if (price.amount !== undefined) converted.amount = convert(price.amount);

  if (price.breakdown && typeof price.breakdown === 'object') {
    converted.breakdown = { ...price.breakdown };
    ['base_fare', 'taxes', 'fees', 'surcharges'].forEach((key) => {
      if (price.breakdown[key] !== undefined) {
        converted.breakdown[key] = convert(price.breakdown[key]);
      }
    });
  }

  if (Array.isArray(price.per_passenger)) {
    converted.per_passenger = price.per_passenger.map((entry) => ({
      ...entry,
      currency: 'SAR',
      total: entry?.total !== undefined ? convert(entry.total) : entry?.total,
      fare: entry?.fare !== undefined ? convert(entry.fare) : entry?.fare,
      taxes: entry?.taxes !== undefined ? convert(entry.taxes) : entry?.taxes,
    }));
  }

  return converted;
}

module.exports = {
  DEFAULT_SAR_PER_UNIT,
  ECB_DAILY_XML_URL,
  DISPLAY_FX_REFRESH_MS,
  parseEcbDailyXml,
  buildSnapshotFromEcbXml,
  getDisplayFxSnapshot,
  convertDisplayAmount,
  convertOfferPriceToSar,
  __resetDisplayFxCache,
};
