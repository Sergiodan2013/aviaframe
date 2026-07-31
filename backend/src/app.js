'use strict';

try {
  require('dotenv').config();
} catch (_) {
  // In managed runtimes like Railway, env vars are injected directly.
}
const express = require('express');
const axios = require('axios');
const { config } = require('./config');
const logger = require('./lib/logger');
const pinoHttp = require('pino-http');
const { client, httpDuration } = require('./lib/metrics');
const { requireInternalToken } = require('./middleware/auth');
const drctDirectClient = require('./services/drctDirectClient');
const { filterBookableOffers } = require('./utils/offerFilters');

const app = express();
const SANDBOX_WIDGET_HOSTS = new Set(['sandbox.aviaframe.com', 'aviaframe.com', 'www.aviaframe.com']);
const SEARCH_PROXY_MAX_PAIRS = Number(process.env.SEARCH_PROXY_MAX_PAIRS || 25);
const SEARCH_PROXY_CONCURRENCY = Number(process.env.SEARCH_PROXY_CONCURRENCY || 5);

function normalizeHost(value) {
  if (!value) return '';
  const raw = String(value).trim().toLowerCase();
  try {
    if (raw.startsWith('http://') || raw.startsWith('https://')) {
      return new URL(raw).hostname.toLowerCase();
    }
    return raw.split('/')[0].split(':')[0].trim().toLowerCase();
  } catch {
    return raw.split('/')[0].split(':')[0].trim().toLowerCase();
  }
}

function getRequestOriginHost(req) {
  return normalizeHost(
    req.body?.origin_host ||
    req.body?.metadata?.origin_host ||
    req.headers.origin ||
    req.headers.referer ||
    ''
  );
}

function hasDrctSandboxConfig() {
  return Boolean(
    process.env.DRCT_SANDBOX_TOKEN
    || process.env.DRCT_TEST_TOKEN
    || process.env.DRCT_SANDBOX_BEARER_TOKEN
    || (
      String(process.env.DRCT_API_BASE_URL || '').includes('sandbox-api.drct.aero')
      && process.env.DRCT_BEARER_TOKEN
    )
  );
}

function shouldUseDrctSandboxForHost(host) {
  return hasDrctSandboxConfig() && SANDBOX_WIDGET_HOSTS.has(normalizeHost(host || ''));
}

function normalizeCodeList(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean);
}

function dedupeOffers(offers) {
  const seen = new Map();
  for (const offer of Array.isArray(offers) ? offers : []) {
    const key = offer.offer_id || [
      offer.origin,
      offer.destination,
      offer.departure_time,
      offer.arrival_time,
      offer.airline_code,
      offer.flight_number,
      offer.price?.total,
    ].join('|');

    if (!seen.has(key)) {
      seen.set(key, offer);
    }
  }

  return Array.from(seen.values()).sort(
    (a, b) => Number(a?.price?.total || 0) - Number(b?.price?.total || 0),
  );
}

async function runWithConcurrency(items, limit, worker) {
  const results = [];
  for (let index = 0; index < items.length; index += limit) {
    const chunk = items.slice(index, index + limit);
    const chunkResults = await Promise.all(chunk.map(worker));
    results.push(...chunkResults);
  }
  return results;
}

function isAllowedCorsOrigin(origin) {
  if (!origin) return false;
  if (config.corsOrigins.includes(origin)) return true;

  try {
    const { hostname } = new URL(origin);
    if (!hostname) return false;

    return (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === 'aviaframe.com' ||
      hostname === 'www.aviaframe.com' ||
      hostname.endsWith('.netlify.app') ||
      hostname.endsWith('.aviaframe.com')
    );
  } catch (_) {
    return false;
  }
}

// Moyasar webhook needs raw body for HMAC signature verification — must be before express.json()
app.use('/api/webhooks/moyasar', express.raw({ type: '*/*' }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Structured request logging via pino-http
app.use(pinoHttp({
  logger,
  autoLogging: {
    ignore: (req) => req.url === '/healthz'
  }
}));

// HTTP request duration metrics
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const route = req.route?.path || req.path;
    httpDuration.observe(
      { method: req.method, route, status_code: res.statusCode },
      (Date.now() - start) / 1000
    );
  });
  next();
});

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
  if (!requireInternalToken(req, res)) return;
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

// CORS (simple implementation for development)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  res.setHeader('Vary', 'Origin');
  if (isAllowedCorsOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Idempotency-Key, X-Correlation-Id, X-Internal-Token');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Routes
app.use('/', require('./routes/health'));
app.use('/', require('./routes/widget'));
app.use('/', require('./routes/orders'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/admin/internal-qa', require('./routes/internalQa'));
app.use('/api/agency', require('./routes/agency'));
app.use('/api', require('./routes/notifications'));
app.use('/api', require('./routes/webhooks'));
app.use('/api/support', require('./routes/support'));
app.use('/public', require('./routes/public'));
app.use('/api', require('./routes/documents'));
app.use('/', require('./routes/payments'));
app.use('/api/payments', require('./routes/tamara'));

// n8n webhook proxy — MUST be before 404 handler
const N8N_BASE_URL = (process.env.N8N_WEBHOOK_URL || '').replace(/\/+$/, '');

// ─── Search proxy with markup application ────────────────────────────────────
app.post('/webhook/drct/search', express.json({ limit: '10mb' }), async (req, res) => {
  const requestHost = getRequestOriginHost(req);
  const useSandboxSearch = shouldUseDrctSandboxForHost(requestHost);
  const originCodes = normalizeCodeList(req.body?.origin);
  const destinationCodes = normalizeCodeList(req.body?.destination);

  // N8N is no longer needed for search — always go direct to DRCT


  const agencyKey = req.body?.agency_key || null;

  // Load agency commission settings
  let commission = null;
  if (agencyKey) {
    try {
      const supabase = require('./lib/supabase');
      const normalizedKey = String(agencyKey).trim().toLowerCase();
      const { data: agency } = await supabase
        .from('agencies')
        .select('settings,commission_rate')
        .or(`api_key.eq.${normalizedKey},domain.eq.${normalizedKey}`)
        .maybeSingle();
      commission = agency?.settings?.commission || null;
      // Attach commission_rate column value so applyMarkup can use it for percentage model
      if (commission && agency?.commission_rate) {
        commission = { ...commission, _rate: Number(agency.commission_rate) };
      }
      // Attach per-carrier commissions
      if (commission && agency?.settings?.carrier_commissions) {
        commission = { ...commission, carrier_commissions: agency.settings.carrier_commissions };
      }
    } catch (err) {
      logger.warn({ err: err.message, agency_key: agencyKey }, 'search-proxy failed to load agency commission');
    }
  }

  let result = null;
  let responseStatus = 200;
  const shouldFanout = originCodes.length > 1 || destinationCodes.length > 1;

  if (shouldFanout) {
    const pairs = [];
    for (const originCode of originCodes) {
      for (const destinationCode of destinationCodes) {
        pairs.push({ origin: originCode, destination: destinationCode });
      }
    }

    if (pairs.length > SEARCH_PROXY_MAX_PAIRS) {
      return res.status(400).json({
        error: {
          code: 'FANOUT_LIMIT_EXCEEDED',
          message: `Too many airport pairs requested: ${pairs.length}. Maximum is ${SEARCH_PROXY_MAX_PAIRS}.`
        }
      });
    }

    const pairResults = await runWithConcurrency(
      pairs,
      SEARCH_PROXY_CONCURRENCY,
      async (pair) => {
        const payload = {
          ...req.body,
          origin: pair.origin,
          destination: pair.destination,
          origin_city: req.body?.origin_city || pair.origin,
          destination_city: req.body?.destination_city || pair.destination,
        };

        const pairResponse = await executeSearchProxyRequest(payload, {
          useSandboxSearch,
          requestHost,
        });

        const pairOffers = Array.isArray(pairResponse.result?.offers)
          ? pairResponse.result.offers.map((offer) => ({
              ...offer,
              _searchOrigin: pair.origin,
              _searchDestination: pair.destination,
              _searchReturnDate: req.body?.return_date || null,
            }))
          : [];

        return {
          pair,
          responseStatus: pairResponse.responseStatus,
          result: pairResponse.result,
          success:
            pairResponse.responseStatus >= 200 &&
            pairResponse.responseStatus < 300 &&
            !pairResponse.result?.error,
          offers: pairOffers,
        };
      },
    );

    const successfulPairs = pairResults.filter((entry) => entry.success);
    const failedPairs = pairResults
      .filter((entry) => !entry.success)
      .map((entry) => ({
        origin: entry.pair.origin,
        destination: entry.pair.destination,
        status: entry.responseStatus,
        error: entry.result?.error?.message || 'Search failed',
      }));

    if (!successfulPairs.length) {
      const firstFailure = pairResults.find((entry) => entry.result?.error)?.result?.error;
      return res.status(firstFailure?.statusCode || pairResults[0]?.responseStatus || 502).json({
        error: {
          code: firstFailure?.code || 'SEARCH_FANOUT_FAILED',
          message: firstFailure?.message || 'All city-airport search combinations failed.',
          details: { pair_failures: failedPairs }
        }
      });
    }

    const baseResult = successfulPairs[0].result && typeof successfulPairs[0].result === 'object'
      ? successfulPairs[0].result
      : {};

    result = {
      ...baseResult,
      origin: req.body?.origin || null,
      destination: req.body?.destination || null,
      origin_airports: originCodes,
      destination_airports: destinationCodes,
      offers: dedupeOffers(successfulPairs.flatMap((entry) => entry.offers)),
      partial: failedPairs.length > 0,
      pair_count: pairs.length,
      pair_failures: failedPairs,
    };
    responseStatus = 200;

    logger.info({
      request_host: requestHost,
      pair_count: pairs.length,
      successful_pairs: successfulPairs.length,
      failed_pairs: failedPairs.length,
      offer_count: result.offers.length,
    }, 'search-proxy expanded city search into airport fan-out');
  } else {
    const searchResponse = await executeSearchProxyRequest(req.body, {
      useSandboxSearch,
      requestHost,
    });
    result = searchResponse.result;
    responseStatus = searchResponse.responseStatus;
  }

  if (!useSandboxSearch && Array.isArray(result?.offers) && result.offers.length > 0) {
    const filtered = filterBookableOffers(result.offers);
    if (filtered.dropped > 0) {
      logger.warn({
        request_host: requestHost,
        dropped_offers: filtered.dropped,
        kept_offers: filtered.kept.length,
        rejected_channels: filtered.rejectedChannels,
        rejected_prefixes: filtered.rejectedPrefixes,
      }, 'search-proxy dropped offers that DRCT /orders cannot book');
    }
    result.offers = filtered.kept;
  }

  // Apply markup to offers if commission is configured
  if (commission && Array.isArray(result?.offers) && result.offers.length > 0) {
    result.offers = result.offers.map(offer => applyMarkup(offer, commission));
    const pctLog = Number(commission._rate ?? commission.percentage ?? 0);
    logger.info({
      agency_key: agencyKey,
      commission_model: commission.model,
      offer_count: result.offers.length,
      markup_value: commission.model === 'percent' || commission.model === 'percentage'
        ? `${pctLog}%`
        : `${commission.fixed_amount} ${commission.currency || 'SAR'}`
    }, 'search-proxy applied markup');
  }

  return res.status(responseStatus).json(result);
});

function applyMarkup(offer, commission) {
  const price = offer?.price || {};
  const total = Number(price.total || 0);
  if (!total) return offer;

  // Base global commission
  let markup = 0;
  const pct = Number(commission._rate ?? commission.percentage ?? 0);
  if ((commission.model === 'percent' || commission.model === 'percentage') && pct > 0) {
    markup = Math.round(total * pct / 100 * 100) / 100;
  } else if (commission.model === 'fixed' && Number(commission.fixed_amount) > 0) {
    markup = Number(commission.fixed_amount);
  }

  // Per-carrier additional commission (additive on top of global)
  const carrierCommissions = commission.carrier_commissions || {};
  const carrierCode = offer?.airline_code || offer?.airline ||
    offer?.validating_carrier || offer?.carrier_code ||
    (offer?.slices?.[0]?.segments?.[0]?.operating_carrier?.iata_code) ||
    (offer?.slices?.[0]?.segments?.[0]?.marketing_carrier?.iata_code) || null;

  if (carrierCode && carrierCommissions[carrierCode] !== undefined) {
    markup += Number(carrierCommissions[carrierCode]) || 0;
  }

  markup = Math.round(markup * 100) / 100;
  if (!markup) return offer;

  return {
    ...offer,
    price: {
      ...price,
      total: Math.round((total + markup) * 100) / 100,
      original_total: total,
      markup_amount: markup,
    }
  };
}

// Always go direct to DRCT (n8n is no longer in the search critical path).
// Route sandbox vs prod by host: SANDBOX_WIDGET_HOSTS → sandbox DRCT, everything else → prod DRCT.
async function executeSearchProxyRequest(payload, { useSandboxSearch = false, requestHost = null } = {}) {
  try {
    const result = await drctDirectClient.searchOffers(payload, { sandbox: useSandboxSearch });
    return { responseStatus: 200, result };
  } catch (err) {
    logger.error({ err: err.message, request_host: requestHost }, 'search-proxy direct DRCT error');
    return {
      responseStatus: err.statusCode || 502,
      result: {
        error: {
          code: err.code || 'DRCT_SEARCH_FAILED',
          message: err.message || 'Failed to fetch search results from DRCT'
        }
      }
    };
  }
}

function hasMeaningfulCreatePayload(payload) {
  return Boolean(
    payload
    && typeof payload === 'object'
    && !Array.isArray(payload)
    && typeof payload.order_id === 'string'
    && payload.order_id.trim()
  );
}

function hasMeaningfulIssuePayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return false;
  if (typeof payload.pnr === 'string' && payload.pnr.trim()) return true;
  if (typeof payload.booking_reference === 'string' && payload.booking_reference.trim()) return true;
  if (Array.isArray(payload.tickets) && payload.tickets.length > 0) return true;
  return false;
}

async function maybeHandleDrctProxyFallback({ req, res, targetPath, upstreamStatus, upstreamData }) {
  if (targetPath === '/drct/order/create') {
    const shouldFallback = upstreamStatus >= 500 || (upstreamStatus >= 200 && upstreamStatus < 300 && !hasMeaningfulCreatePayload(upstreamData));
    if (!shouldFallback) return false;

    logger.warn({
      upstreamStatus,
      has_order_id: Boolean(upstreamData?.order_id),
    }, 'n8n-proxy falling back to direct DRCT order create');

    try {
      const fallbackData = await drctDirectClient.createOrder(req.body, {
        idempotencyKey: req.headers['idempotency-key'] || req.headers['Idempotency-Key'] || null,
      });
      res.status(201).json(fallbackData);
      return true;
    } catch (error) {
      logger.error({
        err: error.message,
        code: error.code || null,
        statusCode: error.statusCode || null,
      }, 'direct DRCT order create fallback failed');
      return false;
    }
  }

  if (targetPath === '/drct/order/issue') {
    const shouldFallback = upstreamStatus >= 500 || (upstreamStatus >= 200 && upstreamStatus < 300 && !hasMeaningfulIssuePayload(upstreamData));
    if (!shouldFallback) return false;

    logger.warn({
      upstreamStatus,
      has_pnr: Boolean(upstreamData?.pnr),
      ticket_count: Array.isArray(upstreamData?.tickets) ? upstreamData.tickets.length : 0,
    }, 'n8n-proxy falling back to direct DRCT order issue');

    try {
      const fallbackData = await drctDirectClient.issueOrder(req.body, {
        idempotencyKey: req.headers['idempotency-key'] || req.headers['Idempotency-Key'] || null,
      });
      res.status(200).json(fallbackData);
      return true;
    } catch (error) {
      logger.error({
        err: error.message,
        code: error.code || null,
        statusCode: error.statusCode || null,
      }, 'direct DRCT order issue fallback failed');
      return false;
    }
  }

  return false;
}

app.all('/webhook/*', express.json({ limit: '10mb' }), async (req, res) => {
  if (!N8N_BASE_URL) {
    return res.status(503).json({ error: { code: 'N8N_NOT_CONFIGURED', message: 'N8N_WEBHOOK_URL is not configured on the server' } });
  }
  const targetPath = req.path.replace(/^\/webhook/, '');
  const targetUrl = `${N8N_BASE_URL}${targetPath}`;
  try {
    const response = await axios({
      method: req.method,
      url: targetUrl,
      headers: {
        'Content-Type': 'application/json',
        ...Object.fromEntries(
          Object.entries(req.headers).filter(([k]) =>
            ['idempotency-key', 'x-correlation-id', 'x-tenant-id'].includes(k.toLowerCase())
          )
        )
      },
      data: req.body,
      timeout: 55000,
      validateStatus: () => true
    });
    if (await maybeHandleDrctProxyFallback({
      req,
      res,
      targetPath,
      upstreamStatus: response.status,
      upstreamData: response.data,
    })) {
      return;
    }
    res.status(response.status).json(response.data);
  } catch (err) {
    if (await maybeHandleDrctProxyFallback({
      req,
      res,
      targetPath,
      upstreamStatus: err.response?.status || 502,
      upstreamData: err.response?.data || null,
    })) {
      return;
    }
    logger.error({ err: err.message, path: req.path }, 'n8n-proxy error');
    res.status(502).json({ error: { code: 'N8N_PROXY_ERROR', message: err.message } });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`
    }
  });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error({ err }, 'Unhandled application error');
  res.status(err.status || 500).json({
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: config.nodeEnv === 'development' ? err.message : 'Internal server error'
    }
  });
});

module.exports = app;
