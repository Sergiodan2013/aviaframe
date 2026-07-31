'use strict';

const { normalizeHost } = require('../utils/helpers');
const { roundMoney } = require('./paymentPricingService');

const ENHANCED_TICKET_HOSTS = new Set(['aviaframe.com', 'www.aviaframe.com']);

function safeString(value, fallback = '') {
  if (value === null || value === undefined || value === '') return fallback;
  return String(value);
}

function toMoney(value, currency = 'USD') {
  return `${Number(value || 0).toFixed(2)} ${currency}`;
}

function getTicketArtifactOriginHost(order = {}) {
  return normalizeHost(
    order?.raw_offer_data?.metadata?.origin_host
      || order?.metadata?.origin_host
      || ''
  );
}

function isEnhancedTicketArtifactEnabled(order = {}) {
  return ENHANCED_TICKET_HOSTS.has(getTicketArtifactOriginHost(order));
}

function getOrderCurrency(order = {}) {
  return safeString(
    order?.currency
      || order?.metadata?.payment_pricing?.currency
      || order?.raw_offer_data?.pricing?.currency,
    'UAH'
  ).toUpperCase();
}

function getCleanOrderSubtotal(order = {}) {
  const paymentSubtotal = Number(order?.metadata?.payment_pricing?.order_subtotal);
  if (Number.isFinite(paymentSubtotal) && paymentSubtotal > 0) {
    return roundMoney(paymentSubtotal);
  }

  const pricedTotal = Number(order?.raw_offer_data?.pricing?.total_price);
  if (Number.isFinite(pricedTotal) && pricedTotal > 0) {
    return roundMoney(pricedTotal);
  }

  return roundMoney(order?.total_price || 0);
}

function buildTicketPricingBreakdown(order = {}, { demoMode = false } = {}) {
  const currency = getOrderCurrency(order);
  const pricing = order?.raw_offer_data?.pricing || {};
  const paymentPricing = order?.metadata?.payment_pricing || {};

  const cleanSubtotal = getCleanOrderSubtotal(order);
  const baseFare = roundMoney(pricing?.base_price || 0);
  const taxes = roundMoney(pricing?.taxes || 0);
  const baggagePrice = roundMoney(pricing?.baggage_price || 0);
  const markupAmount = roundMoney(pricing?.markup_amount || 0);
  const processingFee = roundMoney(paymentPricing?.processing_fee_total || 0);
  const variableFee = roundMoney(paymentPricing?.variable_fee || 0);
  const fixedFee = roundMoney(paymentPricing?.fixed_fee || 0);
  const vatAmount = roundMoney(paymentPricing?.vat_amount || 0);
  const totalPaid = roundMoney(paymentPricing?.final_payable_amount || order?.total_price || cleanSubtotal);

  const components = [
    baseFare > 0 ? { key: 'base_fare', label: 'Base fare', amount: baseFare } : null,
    taxes > 0 ? { key: 'taxes', label: 'Taxes & airport charges', amount: taxes } : null,
    baggagePrice > 0 ? { key: 'baggage', label: 'Baggage / ancillaries', amount: baggagePrice } : null,
    markupAmount > 0 ? { key: 'markup', label: 'Agency markup', amount: markupAmount } : null
  ].filter(Boolean);

  const feeComponents = [
    variableFee > 0 ? { key: 'variable_fee', label: 'Percentage fee', amount: variableFee } : null,
    fixedFee > 0 ? { key: 'fixed_fee', label: 'Gateway fixed fee', amount: fixedFee } : null,
    vatAmount > 0 ? { key: 'vat', label: 'VAT on fees', amount: vatAmount } : null
  ].filter(Boolean);

  return {
    currency,
    cleanSubtotal,
    totalPaid,
    processingFee,
    hasPaymentFee: processingFee > 0,
    paymentFeeLabel: safeString(paymentPricing?.display_label, null),
    isEstimateOnly: Boolean(paymentPricing?.estimate_only),
    isDemoMode: Boolean(demoMode),
    components,
    feeComponents,
    showComponentBreakdown: components.length > 0,
    showFeeComponentBreakdown: feeComponents.length > 0
  };
}

function formatBaggageAllowance(value) {
  if (!value) return null;

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || null;
  }

  if (typeof value === 'number') {
    return `${value} piece${value === 1 ? '' : 's'}`;
  }

  if (Array.isArray(value)) {
    const parts = value
      .map((item) => formatBaggageAllowance(item))
      .filter(Boolean);
    return parts.length ? parts.join(', ') : null;
  }

  if (typeof value === 'object') {
    const quantity = Number(value.quantity || value.qty || value.pieces || 0);
    const weight = safeString(value.weight || value.kg || value.allowance || '', '').trim();
    const type = safeString(value.type || value.category || '', '').trim();

    const parts = [];
    if (quantity > 0) parts.push(`${quantity} pc`);
    if (weight) parts.push(weight);
    if (type) parts.push(type.replace(/_/g, ' '));
    return parts.length ? parts.join(' · ') : null;
  }

  return null;
}

function pushUnique(target, value) {
  const normalized = safeString(value, '').trim();
  if (!normalized) return;
  if (!target.includes(normalized)) target.push(normalized);
}

function buildBaggagePrefix(record = {}, fallback = 'Fare') {
  const route = [
    safeString(record?.origin_code || record?.origin || record?.from, '').trim().toUpperCase(),
    safeString(record?.destination_code || record?.destination || record?.to, '').trim().toUpperCase()
  ].filter(Boolean).join(' -> ');
  if (route) return `Segment ${route}`;

  const passengerType = safeString(record?.passenger_type || record?.type || record?.ptc, '').trim().toUpperCase();
  if (passengerType) return passengerType;

  const fareName = safeString(record?.name || record?.title || record?.brand || record?.fare_name, '').trim();
  if (fareName) return fareName;

  return fallback;
}

function collectStructuredBaggageFromRecord(record = {}, fallbackPrefix = 'Fare') {
  const highlights = [];
  const prefix = buildBaggagePrefix(record, fallbackPrefix);

  const generalBaggage = formatBaggageAllowance(
    record?.baggage
      || record?.baggage_allowance
      || record?.allowance
  );
  if (generalBaggage) {
    pushUnique(highlights, `${prefix}: ${generalBaggage}`);
  }

  const cabinBaggage = formatBaggageAllowance(
    record?.cabin_baggage
      || record?.hand_baggage
      || record?.carry_on_baggage
      || record?.carry_on
  );
  if (cabinBaggage) {
    pushUnique(highlights, `${prefix}: Cabin baggage ${cabinBaggage}`);
  }

  const checkedBaggage = formatBaggageAllowance(
    record?.checked_baggage
      || record?.checked
      || record?.hold_baggage
  );
  if (checkedBaggage) {
    pushUnique(highlights, `${prefix}: Checked baggage ${checkedBaggage}`);
  }

  if (!generalBaggage && !checkedBaggage && typeof record?.with_baggage === 'boolean') {
    pushUnique(
      highlights,
      record.with_baggage ? `${prefix}: Included checked baggage` : `${prefix}: No checked baggage included`
    );
  }

  return highlights;
}

function collectStructuredBaggageHighlights(source, fallbackPrefix = 'Fare') {
  if (!source) return [];

  if (Array.isArray(source)) {
    return source.flatMap((item, index) => (
      collectStructuredBaggageHighlights(item, `${fallbackPrefix} ${index + 1}`)
    ));
  }

  if (typeof source !== 'object') return [];

  const highlights = collectStructuredBaggageFromRecord(source, fallbackPrefix);

  const nestedCollections = [
    source?.fare_details,
    source?.fares,
    source?.passengers,
    source?.segments,
    source?.rules
  ];

  nestedCollections.forEach((collection, index) => {
    const nestedPrefix = ['Fare details', 'Fare', 'Passenger', 'Segment', 'Rules'][index];
    collectStructuredBaggageHighlights(collection, nestedPrefix).forEach((item) => pushUnique(highlights, item));
  });

  return highlights;
}

function collectOfferLevelBaggageFallbacks(offer = {}) {
  const highlights = [];
  const baggageText = safeString(offer?.baggage_text || offer?.baggageText, '').trim();
  if (baggageText) {
    pushUnique(highlights, `Included baggage: ${baggageText}`);
  } else if (typeof offer?.with_baggage === 'boolean') {
    pushUnique(
      highlights,
      offer.with_baggage ? 'Included checked baggage' : 'No checked baggage included'
    );
  }

  const directBaggage = formatBaggageAllowance(offer?.baggage);
  if (directBaggage) {
    pushUnique(highlights, `Offer baggage: ${directBaggage}`);
  }

  const segments = Array.isArray(offer?.segments) ? offer.segments : [];
  segments.forEach((segment, index) => {
    const route = [
      safeString(segment?.origin_code || segment?.origin || segment?.from, '').trim().toUpperCase(),
      safeString(segment?.destination_code || segment?.destination || segment?.to, '').trim().toUpperCase()
    ].filter(Boolean).join(' -> ');
    const prefix = route ? `Segment ${route}` : `Segment ${index + 1}`;

    const cabinBaggage = formatBaggageAllowance(
      segment?.cabin_baggage || segment?.hand_baggage || segment?.carry_on_baggage
    );
    if (cabinBaggage) {
      pushUnique(highlights, `${prefix}: Cabin baggage ${cabinBaggage}`);
    }

    const checkedBaggage = formatBaggageAllowance(segment?.checked_baggage || segment?.baggage);
    if (checkedBaggage) {
      pushUnique(highlights, `${prefix}: Checked baggage ${checkedBaggage}`);
    }
  });

  return highlights;
}

function collectBaggageHighlights(order = {}, passengers = []) {
  const passengerHighlights = passengers
    .map((passenger, index) => {
      const allowance = formatBaggageAllowance(passenger?.baggage_allowance);
      if (!allowance) return null;
      const passengerName = safeString(
        `${safeString(passenger?.first_name)} ${safeString(passenger?.last_name)}`.trim(),
        `Passenger ${index + 1}`
      );
      return `${passengerName}: ${allowance}`;
    })
    .filter(Boolean);

  if (passengerHighlights.length > 0) {
    return passengerHighlights;
  }

  const rawOfferData = order?.raw_offer_data || {};
  const offerPriceData = rawOfferData?.metadata?.offer_price_data || {};
  const structuredSources = [
    rawOfferData?.offer,
    rawOfferData?.fare_details,
    rawOfferData?.fares,
    offerPriceData?.fare_details,
    offerPriceData?.rules,
    offerPriceData?.passengers,
    offerPriceData?.flights,
    offerPriceData?.raw?.fare_details,
    offerPriceData?.raw?.fares,
    offerPriceData?.raw?.passengers,
    offerPriceData?.raw?.flights
  ];

  const structuredHighlights = [];
  structuredSources.forEach((source) => {
    collectStructuredBaggageHighlights(source).forEach((item) => pushUnique(structuredHighlights, item));
  });
  if (structuredHighlights.length > 0) {
    return structuredHighlights;
  }

  const offerLevelFallbacks = collectOfferLevelBaggageFallbacks(order?.raw_offer_data?.offer || {});
  if (offerLevelFallbacks.length > 0) {
    return offerLevelFallbacks;
  }

  const pricedBaggage = Number(order?.raw_offer_data?.pricing?.baggage_price || 0);
  if (Number.isFinite(pricedBaggage) && pricedBaggage > 0) {
    return [
      'Baggage / ancillaries are included in the fare pricing, but the airline did not return detailed baggage allowance in the booking response.'
    ];
  }

  return [
    'Baggage allowance details were not returned by the airline for this ticket. Please verify checked and cabin baggage rules with the issuing agency before travel.'
  ];
}

function collectFareHighlights(order = {}) {
  const offer = order?.raw_offer_data?.offer || {};
  const source = offer?.fare_details
    || order?.raw_offer_data?.fare_details
    || order?.raw_offer_data?.metadata?.offer_price_data?.rules
    || order?.raw_offer_data?.metadata?.offer_price_data?.fare_details
    || null;

  const highlights = [];
  const cabin = safeString(
    offer?.cabin_class || order?.cabin_class || order?.fare_class,
    ''
  ).trim();
  if (cabin) highlights.push(`Cabin: ${cabin}`);

  const pushFlag = (label, value) => {
    if (value === null || value === undefined || value === '') return;
    if (typeof value === 'boolean') {
      highlights.push(`${label}: ${value ? 'Allowed' : 'Not allowed'}`);
      return;
    }
    highlights.push(`${label}: ${safeString(value)}`);
  };

  const consumeRecord = (record) => {
    if (!record || typeof record !== 'object') return;
    pushFlag('Fare family', record.name || record.title || record.brand || record.fare_name);
    pushFlag('Cabin', record.cabin_class);
    pushFlag('Booking class', record.booking_class || record.fare_basis || record.code);
    pushFlag('Refunds', record.refund || record.refundable);
    pushFlag('Changes', record.change || record.changeable);
    pushFlag('Carry-on', formatBaggageAllowance(record.cabin_baggage || record.hand_baggage));
    pushFlag('Checked baggage', formatBaggageAllowance(record.checked_baggage || record.baggage));
  };

  if (Array.isArray(source)) {
    source.slice(0, 3).forEach(consumeRecord);
  } else {
    consumeRecord(source);
  }

  return [...new Set(highlights)].filter(Boolean).slice(0, 8);
}

function getAgencyBrandingContext(agency = null) {
  const site = agency?.settings?.site || {};
  return {
    agencyName: safeString(agency?.name, 'AviaFrame'),
    agencyDomain: safeString(agency?.domain, ''),
    supportEmail: safeString(agency?.contact_email, ''),
    supportPhone: safeString(agency?.contact_phone, ''),
    supportPhone2: safeString(site?.contact_phone2, ''),
    whatsappPhone: safeString(site?.whatsapp_phone, ''),
    supervisorName: safeString(site?.supervisor_name, ''),
    supervisorEmail: safeString(site?.supervisor_email, ''),
    brandColor: safeString(site?.brand_color, '#1E3A5F'),
    accentColor: safeString(site?.accent_color, '#0EA5E9'),
    logoUrl: safeString(site?.logo_url, '')
  };
}

module.exports = {
  safeString,
  toMoney,
  getTicketArtifactOriginHost,
  isEnhancedTicketArtifactEnabled,
  buildTicketPricingBreakdown,
  collectBaggageHighlights,
  collectFareHighlights,
  getAgencyBrandingContext
};
