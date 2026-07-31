'use strict';

const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const supabase = require('../lib/supabase');
const drctService = require('../services/drctService');
const emailService = require('../services/emailService');
const { ensureTicketPdfForOrder } = require('../services/orderService');
const { config } = require('../config');
const {
  sanitizeCardNumber,
  normalizeCompany,
  buildPaymentFeeQuote
} = require('../services/paymentPricingService');

const router = express.Router();

const MOYASAR_API = 'https://api.moyasar.com/v1';
const BACKEND_URL = process.env.BACKEND_URL || 'https://peaceful-amazement-production-629f.up.railway.app';
const APP_URL = process.env.APP_URL || 'https://admin.aviaframe.com';
const SANDBOX_WIDGET_HOSTS = new Set(['sandbox.aviaframe.com']);
const DEMO_CARD_ISSUER_FIXTURES = new Map([
  ['4111111111111111', {
    company: 'visa',
    issuer_country: 'SA',
    issuer_name: 'Demo Visa Bank',
    issuer_card_type: 'credit',
    issuer_card_category: 'classic',
    first_digits: '411111',
    last_digits: '1111'
  }],
  ['5123450000000008', {
    company: 'mastercard',
    issuer_country: 'SA',
    issuer_name: 'Demo Mastercard Bank',
    issuer_card_type: 'credit',
    issuer_card_category: 'classic',
    first_digits: '512345',
    last_digits: '0008'
  }],
  ['4464000000000007', {
    company: 'mada',
    issuer_country: 'SA',
    issuer_name: 'Demo mada Bank',
    issuer_card_type: 'debit',
    issuer_card_category: 'classic',
    first_digits: '446400',
    last_digits: '0007'
  }]
]);

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

function resolveOrderOriginHost(order = {}) {
  return normalizeHost(order?.raw_offer_data?.metadata?.origin_host || order?.metadata?.origin_host || '');
}

function shouldUseMoyasarTestForOrder(order = {}) {
  return SANDBOX_WIDGET_HOSTS.has(resolveOrderOriginHost(order));
}

function getMoyasarConfigForOrder(order = {}) {
  const testSecret = String(process.env.MOYASAR_TEST_SECRET_KEY || '').trim();
  const liveSecret = String(process.env.MOYASAR_SECRET_KEY || '').trim();

  if (shouldUseMoyasarTestForOrder(order)) {
    return {
      mode: 'test',
      secret: testSecret,
      secretConfigured: Boolean(testSecret)
    };
  }

  return {
    mode: 'live',
    secret: liveSecret,
    secretConfigured: Boolean(liveSecret)
  };
}

function moyasarAuthForOrder(order = {}) {
  const { secret } = getMoyasarConfigForOrder(order);
  return { username: secret, password: '' };
}

function getConfiguredWebhookSecrets() {
  return [
    String(process.env.MOYASAR_WEBHOOK_SECRET || '').trim(),
    String(process.env.MOYASAR_TEST_WEBHOOK_SECRET || '').trim()
  ].filter(Boolean);
}

function verifyWebhookWithSecret(secret, req) {
  const headerSecret = String(req.headers['x-event-secret'] || '');
  if (headerSecret) {
    const secretBuf = Buffer.from(headerSecret, 'utf8');
    const expectedSecretBuf = Buffer.from(secret, 'utf8');
    return (
      secretBuf.length === expectedSecretBuf.length &&
      crypto.timingSafeEqual(secretBuf, expectedSecretBuf)
    );
  }

  const signature = String(req.headers['x-moyasar-signature'] || '');
  const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body));
  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  const sigBuf = Buffer.from(signature, 'hex');
  const expBuf = Buffer.from(expected, 'hex');
  return sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf);
}

function isAllowedReturnUrl(value, requestOrigin = '') {
  if (!value) return false;

  try {
    const url = new URL(value);
    const isHttps = url.protocol === 'https:';
    const isLocalHttp = url.protocol === 'http:' && (url.hostname === 'localhost' || url.hostname === '127.0.0.1');
    if (!isHttps && !isLocalHttp) return false;

    if (requestOrigin) {
      try {
        const requestUrl = new URL(requestOrigin);
        return requestUrl.origin === url.origin;
      } catch (_) {
        return false;
      }
    }

    return (
      url.hostname === 'localhost' ||
      url.hostname === '127.0.0.1' ||
      url.hostname.endsWith('.netlify.app') ||
      url.hostname === 'aviaframe.com' ||
      url.hostname.endsWith('.aviaframe.com')
    );
  } catch (_) {
    return false;
  }
}

function withRedirectParams(baseUrl, params) {
  try {
    const url = new URL(baseUrl);
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
    return url.toString();
  } catch (_) {
    return baseUrl;
  }
}

function summarizeMoyasarFailure(payment) {
  return {
    payment_id: payment?.id || null,
    status: payment?.status || null,
    amount: payment?.amount || null,
    currency: payment?.currency || null,
    message: payment?.message || null,
    source_type: payment?.source?.type || null,
    source_name: payment?.source?.name || null,
    source_company: payment?.source?.company || null,
    source_scheme: payment?.source?.scheme || null,
    source_issuer_country: payment?.source?.issuer_country || null,
    response_code: payment?.source?.response_code || null,
    source_message: payment?.source?.message || null,
    transaction_url_present: Boolean(payment?.source?.transaction_url),
  };
}

function buildPaymentSourceSummary(source = {}) {
  return {
    company: normalizeCompany(source.company || source.scheme || ''),
    issuer_country: String(source.issuer_country || '').trim().toUpperCase() || null,
    issuer_name: source.issuer_name || null,
    issuer_card_type: source.issuer_card_type || null,
    issuer_card_category: source.issuer_card_category || null,
    first_digits: source.first_digits || null,
    last_digits: source.last_digits || null
  };
}

function buildPaymentPricingMessage(quote = {}) {
  switch (quote.pricing_tier) {
    case 'sandbox_estimated_non_sar':
      return `Demo estimate for ${quote.currency}. Card type was verified with Moyasar issuer lookup, and the preview uses the same pricing tiers as the live SAR checkout.`;
    case 'mada_local':
      return 'This Saudi-issued mada card is charged at 1% + 1 SAR + VAT.';
    case 'local_credit_card':
      return `This ${quote.scheme === 'visa' ? 'Saudi-issued Visa' : 'Saudi-issued Mastercard'} is charged at 2.75% + 1 SAR + VAT.`;
    case 'international_card':
      return `This ${quote.scheme === 'visa' ? 'Visa' : 'Mastercard'} is issued outside Saudi Arabia and is charged at 3.75% + 1 SAR + VAT.`;
    default:
      return 'Card processing fee is calculated after card verification.';
  }
}

function paymentPricingErrorForQuote(quote = {}) {
  if (quote.reason === 'unsupported_currency') {
    return {
      statusCode: 409,
      code: 'unsupported_currency',
      message: 'This payment gateway does not support fee calculation for this booking currency yet.'
    };
  }
  if (quote.reason === 'unsupported_card') {
    return {
      statusCode: 409,
      code: 'card_not_supported',
      message: 'This card type is not supported. Please use Visa, Mastercard or mada.'
    };
  }
  return {
    statusCode: 400,
    code: 'invalid_card_number',
    message: 'We could not verify this card number. Please check and try again.'
  };
}

async function loadOrderForPayment(orderId) {
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .select('id, order_number, total_price, currency, drct_order_id, payment_status, metadata, raw_offer_data')
    .eq('id', orderId)
    .maybeSingle();

  if (orderErr || !order) return { order: null, error: orderErr };
  return { order, error: null };
}

async function lookupMoyasarIssuer(order, cardNumber) {
  const digits = sanitizeCardNumber(cardNumber);
  if (!/^\d{16,19}$/.test(digits)) {
    const err = new Error('Card number must contain 16 to 19 digits');
    err.statusCode = 400;
    err.code = 'invalid_card_number';
    throw err;
  }

  // Keep demo dry-run pricing deterministic instead of relying on external
  // issuer lookup responses for gateway test cards.
  if (Boolean(order?.raw_offer_data?.metadata?.dry_run_issue) && DEMO_CARD_ISSUER_FIXTURES.has(digits)) {
    return DEMO_CARD_ISSUER_FIXTURES.get(digits);
  }

  const { data } = await axios.post(
    `${MOYASAR_API}/source/issuer`,
    {
      source: {
        type: 'creditcard',
        number: digits
      }
    },
    { auth: moyasarAuthForOrder(order) }
  );

  return data;
}

async function resolvePaymentPricing(order, cardNumber) {
  const issuer = await lookupMoyasarIssuer(order, cardNumber);
  const paymentSource = buildPaymentSourceSummary(issuer);
  const quote = buildPaymentFeeQuote({
    order,
    issuer: paymentSource,
    options: {
      allowSandboxEstimateForNonSar: shouldUseMoyasarTestForOrder(order)
    }
  });

  if (!quote.supported) {
    const pricingError = paymentPricingErrorForQuote(quote);
    const err = new Error(pricingError.message);
    err.statusCode = pricingError.statusCode;
    err.code = pricingError.code;
    err.quote = quote;
    throw err;
  }

  return {
    issuer,
    paymentSource,
    quote: {
      ...quote,
      message: buildPaymentPricingMessage(quote)
    }
  };
}

router.post('/api/payments/card-scheme-check', express.json(), async (req, res) => {
  const { order_id: orderId, card_number: cardNumber } = req.body || {};

  if (!orderId || !cardNumber) {
    return res.status(400).json({
      error: {
        code: 'INVALID_INPUT',
        message: 'order_id and card_number are required'
      }
    });
  }

  const { order, error } = await loadOrderForPayment(orderId);
  if (error || !order) {
    return res.status(404).json({ error: { code: 'ORDER_NOT_FOUND', message: 'Order not found' } });
  }

  const moyasarConfig = getMoyasarConfigForOrder(order);
  if (!moyasarConfig.secretConfigured) {
    const code = moyasarConfig.mode === 'test' ? 'MOYASAR_TEST_NOT_CONFIGURED' : 'CONFIG_ERROR';
    const message = moyasarConfig.mode === 'test'
      ? 'Moyasar test gateway is not configured for the test environment'
      : 'Payment gateway not configured';
    return res.status(500).json({ error: { code, message } });
  }

  try {
    const pricing = await resolvePaymentPricing(order, cardNumber);
    return res.json({
      supported: true,
      payment_pricing: pricing.quote,
      issuer: pricing.paymentSource
    });
  } catch (err) {
    const errData = err.response?.data || {};
    const errStr = JSON.stringify(errData.errors || {}).toLowerCase();
    const code = err.code
      || (errStr.includes('source.number') ? 'invalid_card_number' : 'PAYMENT_GATEWAY_ERROR');
    const statusCode = err.statusCode || (code === 'invalid_card_number' ? 400 : 502);
    const message = err.message || errData.message || 'Unable to verify card details right now.';
    return res.status(statusCode).json({ error: { code, message } });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payments/initiate
// Body: { order_id, card: { name, number, month, year, cvc } }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/api/payments/initiate', express.json(), async (req, res) => {
  const { order_id, card, return_url: returnUrlFromBody } = req.body || {};
  const requestOrigin = String(req.headers.origin || '').trim();

  if (!order_id) {
    return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'order_id is required' } });
  }
  if (!card?.name || !card?.number || !card?.month || !card?.year || !card?.cvc) {
    return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'card.name, number, month, year, cvc are required' } });
  }

  // Load order from Supabase
  const { order, error: orderErr } = await loadOrderForPayment(order_id);

  if (orderErr || !order) {
    return res.status(404).json({ error: { code: 'ORDER_NOT_FOUND', message: 'Order not found' } });
  }
  if (order.payment_status === 'paid') {
    return res.status(400).json({ error: { code: 'ALREADY_PAID', message: 'Order is already paid' } });
  }

  const currency = (order.currency || 'SAR').toUpperCase();
  const callback_url = `${BACKEND_URL}/api/payments/callback`;
  const paymentReturnUrl = isAllowedReturnUrl(returnUrlFromBody, requestOrigin)
    ? returnUrlFromBody
    : null;
  const dryRunIssue = Boolean(order?.raw_offer_data?.metadata?.dry_run_issue);
  const moyasarConfig = getMoyasarConfigForOrder(order);

  if (dryRunIssue) {
    const demoPaymentId = `demo_${order.id}_${Date.now()}`;

    await supabase
      .from('orders')
      .update({
        payment_status: 'paid',
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
        metadata: {
          ...(order.metadata || {}),
          moyasar_payment_id: demoPaymentId,
          payment_return_url: paymentReturnUrl || order.metadata?.payment_return_url || null,
          payment_gateway: 'demo'
        },
        payment_method: 'online'
      })
      .eq('id', order_id);

    setImmediate(() => handlePaymentPaidAsync({
      ...order,
      payment_status: 'paid',
      status: 'confirmed',
      metadata: {
        ...(order.metadata || {}),
        moyasar_payment_id: demoPaymentId,
        payment_return_url: paymentReturnUrl || order.metadata?.payment_return_url || null,
        payment_gateway: 'demo'
      }
    }, demoPaymentId));

    return res.json({
      payment_id: demoPaymentId,
      status: 'paid',
      order_number: order.order_number,
      dry_run_issue: true,
      payment_mode: 'demo'
    });
  }

  if (!moyasarConfig.secretConfigured) {
    const code = moyasarConfig.mode === 'test' ? 'MOYASAR_TEST_NOT_CONFIGURED' : 'CONFIG_ERROR';
    const message = moyasarConfig.mode === 'test'
      ? 'Moyasar test gateway is not configured for the test environment'
      : 'Payment gateway not configured';
    return res.status(500).json({ error: { code, message } });
  }

  let paymentPricing = null;
  let paymentSourceSummary = null;
  try {
    const resolvedPricing = await resolvePaymentPricing(order, card.number);
    paymentPricing = resolvedPricing.quote;
    paymentSourceSummary = resolvedPricing.paymentSource;
  } catch (err) {
    const errData = err.response?.data || {};
    const errCode = err.code || errData.type || 'PAYMENT_GATEWAY_ERROR';
    const message = err.message || errData.message || 'Unable to verify the card details.';
    return res.status(err.statusCode || 502).json({ error: { code: errCode, message } });
  }

  // Amount in smallest currency unit (halalas for SAR, cents for USD, etc.)
  const amount = Math.round((paymentPricing?.final_payable_amount || order.total_price || 0) * 100);
  if (amount < 1) {
    return res.status(400).json({ error: { code: 'INVALID_AMOUNT', message: 'Order amount is too small' } });
  }

  // Call Moyasar
  let moyasarPayment;
  try {
    const { data } = await axios.post(
      `${MOYASAR_API}/payments`,
      {
        amount,
        currency,
        description: `Flight booking ${order.order_number}`,
        callback_url,
        source: {
          type: 'creditcard',
          name: card.name,
          number: String(card.number).replace(/\s/g, ''),
          month: String(card.month).padStart(2, '0'),
          year: String(card.year).length === 2 ? `20${card.year}` : String(card.year),
          cvc: String(card.cvc),
        },
      },
      { auth: moyasarAuthForOrder(order) }
    );
    moyasarPayment = data;
  } catch (err) {
    const errData = err.response?.data || {};
    // Extract human-readable message from Moyasar validation errors object
    let moyasarMsg = errData.message || err.message;
    let errCode = 'PAYMENT_GATEWAY_ERROR';
    if (errData.errors && typeof errData.errors === 'object') {
      const allMsgs = Object.values(errData.errors).flat();
      moyasarMsg = allMsgs.join('; ') || moyasarMsg;
      // Map Moyasar field errors to our codes
      const errStr = JSON.stringify(errData.errors).toLowerCase();
      if (errStr.includes('source.number') || errStr.includes('card number')) errCode = 'invalid_card_number';
      else if (errStr.includes('source.cvc') || errStr.includes('cvc')) errCode = 'invalid_cvc';
      else if (errStr.includes('source.month') || errStr.includes('source.year') || errStr.includes('expir')) errCode = 'invalid_expiry_date';
    } else if (errData.type === 'blocked' || (errData.message || '').toLowerCase().includes('country')) {
      errCode = 'restricted_card';
    }
    console.error('[payments/initiate] Moyasar error:', moyasarMsg, JSON.stringify(errData));
    return res.status(502).json({ error: { code: errCode, message: moyasarMsg } });
  }

  const nextMetadata = {
    ...(order.metadata || {}),
    moyasar_payment_id: moyasarPayment.id,
    payment_return_url: paymentReturnUrl || order.metadata?.payment_return_url || null,
    origin_host: resolveOrderOriginHost(order) || order.metadata?.origin_host || null,
    moyasar_mode: moyasarConfig.mode,
    payment_pricing: paymentPricing,
    payment_source: {
      ...paymentSourceSummary,
      ...buildPaymentSourceSummary(moyasarPayment?.source || {})
    }
  };

  // Save moyasar payment data and the computed payable total
  await supabase
    .from('orders')
    .update({
      total_price: paymentPricing?.final_payable_amount || order.total_price,
      metadata: nextMetadata,
      payment_method: 'online',
    })
    .eq('id', order_id);

  // Payment paid immediately (no 3DS required)
  if (moyasarPayment.status === 'paid') {
    // Mark as paid synchronously so client gets instant response
    await supabase
      .from('orders')
      .update({ payment_status: 'paid', status: 'confirmed', confirmed_at: new Date().toISOString() })
      .eq('id', order_id);
    // Fire-and-forget DRCT issuance + email (do not block the response)
    setImmediate(() => handlePaymentPaidAsync(order, moyasarPayment.id));
    return res.json({
      payment_id: moyasarPayment.id,
      status: 'paid',
      order_number: order.order_number,
      dry_run_issue: Boolean(order?.raw_offer_data?.metadata?.dry_run_issue),
      payment_pricing: paymentPricing
    });
  }

  // Payment failed — extract response code and return user-facing error code
  if (moyasarPayment.status === 'failed') {
    const responseCode = String(moyasarPayment.source?.response_code || '');
    const failMsg = moyasarPayment.message || moyasarPayment.source?.message || 'Payment failed';
    const normalizedFailMsg = String(failMsg || '').toLowerCase();
    const RESPONSE_CODE_MAP = {
      '06': 'invalid_card_number', '14': 'invalid_card_number', '15': 'invalid_card_number',
      '56': 'invalid_card_number', '79': 'invalid_card_number',
      '33': 'expired_card', '54': 'expired_card',
      '51': 'insufficient_funds',
      '61': 'exceeds_limit', '65': 'exceeds_limit',
      '82': 'invalid_cvc',
      '55': 'incorrect_pin', '75': 'pin_tries_exceeded',
      '05': 'do_not_honor', '12': 'do_not_honor',
      '04': 'card_blocked', '07': 'card_blocked', '34': 'card_blocked',
      '35': 'card_blocked', '36': 'card_blocked', '37': 'card_blocked',
      '38': 'card_blocked', '41': 'card_blocked', '43': 'card_blocked',
      '59': 'card_blocked', '63': 'card_blocked', '67': 'card_blocked',
      '40': 'function_not_supported', '57': 'function_not_supported',
      '62': 'restricted_card', '93': 'restricted_card',
      '94': 'duplicate_transaction',
      '01': 'bank_unavailable', '02': 'bank_unavailable', '09': 'bank_unavailable',
      '22': 'bank_unavailable', '90': 'bank_unavailable', '91': 'bank_unavailable',
      '92': 'bank_unavailable', '96': 'bank_unavailable',
    };
    let errCode = RESPONSE_CODE_MAP[responseCode] || 'do_not_honor';
    if (!responseCode && normalizedFailMsg.includes('cannot find a gateway that accepts') && normalizedFailMsg.includes('currency')) {
      errCode = 'unsupported_currency';
    }
    console.warn('[payments/initiate] payment failed', JSON.stringify({
      order_number: order.order_number,
      err_code: errCode,
      fail_msg: failMsg,
      ...summarizeMoyasarFailure(moyasarPayment),
    }));
    await supabase.from('orders').update({ payment_status: 'failed' }).eq('id', order_id);
    return res.status(402).json({ error: { code: errCode, message: failMsg, response_code: responseCode } });
  }

  // Payment requires 3DS or pending
  const transactionUrl = moyasarPayment.source?.transaction_url || null;
  console.log(`[payments/initiate] order ${order.order_number} → moyasar ${moyasarPayment.id} status=${moyasarPayment.status}`);
  return res.json({
    payment_id: moyasarPayment.id,
    status: moyasarPayment.status,
    transaction_url: transactionUrl,
    payment_pricing: paymentPricing
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/payments/callback
// Browser redirect from Moyasar after 3DS: ?id=PAY_ID&status=paid|failed
// Verifies with Moyasar API, updates order, redirects to portal
// ─────────────────────────────────────────────────────────────────────────────
router.get('/api/payments/callback', async (req, res) => {
  const { id: paymentId } = req.query;

  if (!paymentId) {
    return res.redirect(withRedirectParams(APP_URL, { payment_result: 'failed' }));
  }

  // Find order by moyasar_payment_id stored in metadata
  const { data: orders } = await supabase
    .from('orders')
    .select('id, order_number, drct_order_id, payment_status, contact_email, origin, destination, departure_time, currency, total_price, metadata, raw_offer_data')
    .filter('metadata->>moyasar_payment_id', 'eq', paymentId)
    .limit(1);

  const order = orders?.[0];
  if (!order) {
    console.error('[payments/callback] order not found for payment', paymentId);
    return res.redirect(withRedirectParams(APP_URL, { payment_result: 'failed' }));
  }

  // Verify payment status with Moyasar (never trust query params)
  let payment;
  try {
    const { data } = await axios.get(`${MOYASAR_API}/payments/${paymentId}`, { auth: moyasarAuthForOrder(order) });
    payment = data;
  } catch (err) {
    console.error('[payments/callback] Moyasar verify error:', err.message);
    return res.redirect(withRedirectParams(APP_URL, {
      payment_result: 'failed',
      order_id: order.id
    }));
  }

  const paymentReturnUrl = isAllowedReturnUrl(order.metadata?.payment_return_url)
    ? order.metadata.payment_return_url
    : APP_URL;

  if (payment.status === 'paid') {
    if (order.payment_status !== 'paid') {
      // Mark as paid synchronously, then redirect immediately; DRCT + email run async
      await supabase
        .from('orders')
        .update({ payment_status: 'paid', status: 'confirmed', confirmed_at: new Date().toISOString() })
        .eq('id', order.id);
      setImmediate(() => handlePaymentPaidAsync(order, paymentId));
    }
    return res.redirect(withRedirectParams(paymentReturnUrl, {
      payment_result: 'success',
      order_id: order.id
    }));
  }

  // Payment failed or cancelled
  await supabase
    .from('orders')
    .update({ payment_status: 'failed' })
    .eq('id', order.id);

  console.log(`[payments/callback] payment ${paymentId} failed for order ${order.order_number}`);
  return res.redirect(withRedirectParams(paymentReturnUrl, {
    payment_result: 'failed',
    order_id: order.id
  }));
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/webhooks/moyasar
// Server-to-server webhook from Moyasar on payment status change.
// Verifies HMAC-SHA256 signature, then handles paid/failed events.
// Set MOYASAR_WEBHOOK_SECRET in Railway env vars (from Moyasar dashboard → Webhooks).
// ─────────────────────────────────────────────────────────────────────────────
router.post('/api/webhooks/moyasar', async (req, res) => {
  const webhookSecrets = getConfiguredWebhookSecrets();

  // 1. Verify HMAC signature if secret is configured
  if (webhookSecrets.length) {
    const verified = webhookSecrets.some((secret) => verifyWebhookWithSecret(secret, req));
    if (!verified) {
      console.warn('[webhooks/moyasar] Invalid signature — rejected');
      return res.status(401).json({ error: { code: 'INVALID_SIGNATURE', message: 'Invalid webhook signature' } });
    }
  }

  // 2. Parse body
  let payment;
  try {
    const bodyStr = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : JSON.stringify(req.body);
    payment = JSON.parse(bodyStr);
  } catch {
    return res.status(400).json({ error: { code: 'INVALID_BODY', message: 'Cannot parse webhook body' } });
  }

  const paymentId = payment?.id;
  const status = payment?.status;

  console.log(`[webhooks/moyasar] received payment=${paymentId} status=${status}`);

  // 3. Only act on paid events
  if (status !== 'paid') {
    // For failed/cancelled — update order status but no ticket issuance
    if (paymentId && (status === 'failed' || status === 'authorized')) {
      const { data: orders } = await supabase
        .from('orders')
        .select('id, payment_status')
        .filter('metadata->>moyasar_payment_id', 'eq', paymentId)
        .limit(1);
      const order = orders?.[0];
      if (order && order.payment_status !== 'paid' && order.payment_status !== 'failed') {
        await supabase.from('orders').update({ payment_status: status }).eq('id', order.id);
      }
    }
    return res.json({ received: true });
  }

  // 4. Find order by moyasar_payment_id
  const { data: orders } = await supabase
    .from('orders')
    .select('id, order_number, drct_order_id, payment_status, contact_email, origin, destination, departure_time, currency, total_price, agency_id, metadata')
    .filter('metadata->>moyasar_payment_id', 'eq', paymentId)
    .limit(1);

  const order = orders?.[0];
  if (!order) {
    // Payment arrived before initiate saved the ID — log and accept (Moyasar will retry)
    console.error(`[webhooks/moyasar] order not found for payment ${paymentId}`);
    return res.status(404).json({ error: { code: 'ORDER_NOT_FOUND' } });
  }

  // 5. Idempotency — if already paid, skip (webhook may fire twice)
  if (order.payment_status === 'paid') {
    console.log(`[webhooks/moyasar] order ${order.order_number} already paid — skipping`);
    return res.json({ received: true, skipped: true });
  }

  // 6. Mark as paid and issue ticket async
  await supabase
    .from('orders')
    .update({ payment_status: 'paid', status: 'confirmed', confirmed_at: new Date().toISOString() })
    .eq('id', order.id);

  // Respond immediately — Moyasar expects 2xx fast
  res.json({ received: true });

  // Issue ticket + send email in background
  setImmediate(() => handlePaymentPaidAsync(order, paymentId));
});

// ─────────────────────────────────────────────────────────────────────────────
// Internal: issue DRCT ticket + generate PDF + send HTML email with attachment
// ─────────────────────────────────────────────────────────────────────────────
async function handlePaymentPaidAsync(order, paymentId) {
  console.log(`[payments] handlePaymentPaidAsync start: order=${order.order_number} payment=${paymentId}`);

  let fullOrderForFlow = order;
  try {
    const { data: refreshedOrder } = await supabase
      .from('orders')
      .select('id,order_number,user_id,agency_id,drct_order_id,origin,destination,departure_time,arrival_time,airline_code,airline_name,flight_number,total_price,currency,status,contact_email,contact_phone,raw_offer_data')
      .eq('id', order.id)
      .single();
    if (refreshedOrder) fullOrderForFlow = refreshedOrder;
  } catch (err) {
    console.error(`[payments] order refresh failed for ${order.order_number}:`, err.message);
  }

  const dryRunIssue = Boolean(fullOrderForFlow?.raw_offer_data?.metadata?.dry_run_issue);
  if (dryRunIssue) {
    console.warn('[payments] dry run issue hold active', JSON.stringify({
      order_number: fullOrderForFlow.order_number,
      payment_id: paymentId,
      drct_order_id: fullOrderForFlow.drct_order_id || null
    }));
    await supabase
      .from('orders')
      .update({ status: 'confirmed' })
      .eq('id', fullOrderForFlow.id);
    try {
      const demoSuffix = String(fullOrderForFlow.order_number || fullOrderForFlow.id || 'TEST').slice(-8).toUpperCase();
      const demoPnr = `DEMO-${demoSuffix}`;
      const demoTicketNumber = `TEST-${demoSuffix}`;

      const { doc, issuance: savedIssuance, agency } = await ensureTicketPdfForOrder({
        order: fullOrderForFlow,
        createdBy: 'payment_webhook',
        pnr: demoPnr,
        ticketNumber: demoTicketNumber
      });

      if (fullOrderForFlow.contact_email && doc) {
        const { data: blob } = await supabase.storage
          .from(config.documentsBucket)
          .download(doc.storage_path);

        if (blob) {
          const buffer = Buffer.from(await blob.arrayBuffer());
          const { data: passengers } = await supabase
            .from('passengers')
            .select('first_name,last_name,passenger_type,baggage_allowance')
            .eq('order_id', fullOrderForFlow.id);

          const emailResult = await emailService.sendTicketEmail({
            to: fullOrderForFlow.contact_email,
            order: fullOrderForFlow,
            passengers: passengers || [],
            issuance: savedIssuance || {},
            agency: agency || null,
            demoMode: true,
            attachment: {
              fileName: `demo-ticket-${fullOrderForFlow.order_number}.pdf`,
              buffer
            }
          });

          if (emailResult.sent && savedIssuance?.id) {
            await supabase.from('ticket_issuances')
              .update({ email_status: 'sent', email_sent_at: new Date().toISOString() })
              .eq('id', savedIssuance.id);
          }
          console.log(`[payments] dry-run ticket email sent to ${fullOrderForFlow.contact_email} for ${fullOrderForFlow.order_number}`);
        }
      }
    } catch (err) {
      console.error(`[payments] dry-run PDF/email failed for ${fullOrderForFlow.order_number}:`, err.message);
    }
    return;
  }

  // 1. Issue DRCT ticket
  let pnr = null;
  let ticketNumber = null;
  let airlinePnr = null;
  let drctTickets = [];
  const requestOriginHost = fullOrderForFlow?.raw_offer_data?.metadata?.origin_host || null;
  if (fullOrderForFlow.drct_order_id) {
    try {
      const issued = await drctService.issueOrder(fullOrderForFlow.drct_order_id, {
        orderId: fullOrderForFlow.id,
        agencyId: fullOrderForFlow.agency_id,
        originHost: requestOriginHost
      });
      pnr = issued.pnr;
      ticketNumber = issued.ticket_number;
      await supabase.from('orders').update({ status: 'ticketed' }).eq('id', fullOrderForFlow.id);
      console.log(`[payments] DRCT issued: order=${fullOrderForFlow.order_number} pnr=${pnr}`);

      // Enrich with the REAL airline locator + e-ticket numbers. The n8n issue path
      // often returns no locator, so `pnr` falls back to the internal DRCT order UUID.
      // Reading the live order gives us the human PNR (e.g. "HDLK5Z") and ticket numbers.
      try {
        const details = await drctService.getOrderDetails(fullOrderForFlow.drct_order_id, {
          originHost: requestOriginHost
        });
        if (details) {
          if (details.locator) pnr = details.locator;
          airlinePnr = details.airline_locators?.[0]?.locator || null;
          drctTickets = Array.isArray(details.tickets) ? details.tickets : [];
          if ((!ticketNumber || ticketNumber === fullOrderForFlow.drct_order_id) && drctTickets[0]?.number) {
            ticketNumber = drctTickets[0].number;
          }
          console.log(`[payments] DRCT order details: order=${fullOrderForFlow.order_number} locator=${pnr} airline_pnr=${airlinePnr} tickets=${drctTickets.length}`);
        }
      } catch (detailErr) {
        console.error(`[payments] getOrderDetails failed for ${fullOrderForFlow.order_number}:`, detailErr.message);
      }
    } catch (err) {
      console.error(`[payments] DRCT issue failed for ${fullOrderForFlow.order_number}:`, err.message);
      // Continue — payment done, ticket can be issued manually
    }
  } else {
    // Safety net for the Q8BBVQ-class bug: payment succeeded but drct_order_id is missing.
    // Loud error, mark the order so ops can spot it, and DO NOT continue silently to email.
    console.error(`[payments] CRITICAL: payment_paid but drct_order_id is NULL — cannot issue ticket. order=${fullOrderForFlow.order_number} payment=${paymentId}`);
    await supabase
      .from('orders')
      .update({
        status: 'needs_manual_issue',
        metadata: {
          ...(fullOrderForFlow.metadata || {}),
          alert: 'drct_order_id_missing_after_payment',
          alert_at: new Date().toISOString(),
          moyasar_payment_id: paymentId
        }
      })
      .eq('id', fullOrderForFlow.id);
    // Fire-and-forget ops email so we notice the same day
    try {
      const opsEmail = process.env.OPS_ALERT_EMAIL || 'sergiodan2013@gmail.com';
      await emailService.sendSupportEmail({
        to: opsEmail,
        subject: `[URGENT] Order ${fullOrderForFlow.order_number} paid but not issued — drct_order_id missing`,
        text: [
          `Order ${fullOrderForFlow.order_number} received payment_paid webhook but has no drct_order_id.`,
          `The DRCT create step was skipped or failed silently earlier in the booking flow.`,
          ``,
          `order_id: ${fullOrderForFlow.id}`,
          `moyasar_payment_id: ${paymentId}`,
          `total: ${fullOrderForFlow.total_price} ${fullOrderForFlow.currency}`,
          `contact: ${fullOrderForFlow.contact_email} / ${fullOrderForFlow.contact_phone}`,
          ``,
          `ACTION REQUIRED: manually reserve+issue via DRCT (recovery-email-* script pattern) or refund.`,
        ].join('\n')
      });
    } catch (mailErr) {
      console.error('[payments] alert email failed:', mailErr.message);
    }
    return; // exit — do not send a customer ticket email since there is no real ticket
  }

  // 2. Generate PDF + send ticket email
  try {
    const fullOrder = fullOrderForFlow;
    if (!fullOrder) throw new Error('Could not re-fetch order for PDF generation');

    const { doc, issuance: savedIssuance, agency } = await ensureTicketPdfForOrder({
      order: fullOrder,
      createdBy: 'payment_webhook',
      pnr,
      ticketNumber,
      airlinePnr,
      tickets: drctTickets
    });

    if (fullOrder.contact_email && doc) {
      const { data: blob } = await supabase.storage
        .from(config.documentsBucket)
        .download(doc.storage_path);

      if (blob) {
        const buffer = Buffer.from(await blob.arrayBuffer());

        const { data: passengers } = await supabase
          .from('passengers')
          .select('first_name,last_name,passenger_type,baggage_allowance')
          .eq('order_id', fullOrder.id);

        const emailResult = await emailService.sendTicketEmail({
          to: fullOrder.contact_email,
          order: fullOrder,
          passengers: passengers || [],
          issuance: savedIssuance || {},
          agency: agency || null,
          attachment: {
            fileName: `ticket-${fullOrder.order_number}.pdf`,
            buffer
          }
        });

        if (emailResult.sent && savedIssuance?.id) {
          await supabase.from('ticket_issuances')
            .update({ email_status: 'sent', email_sent_at: new Date().toISOString() })
            .eq('id', savedIssuance.id);
        }
        console.log(`[payments] ticket email sent to ${fullOrder.contact_email} for ${fullOrder.order_number}`);
      }
    }
  } catch (err) {
    console.error(`[payments] PDF/email failed for ${fullOrderForFlow.order_number}:`, err.message);
  }
}

module.exports = router;
module.exports.handlePaymentPaidAsync = handlePaymentPaidAsync;
