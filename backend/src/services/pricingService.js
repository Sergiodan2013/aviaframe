'use strict';

// ─── Acquiring fee rate (passed to customer, configurable via env) ────────────
// Default: 2.5% (Moyasar standard rate for Visa/MC)
// For Mada: 1%, but we use a blended rate for simplicity
const ACQUIRING_RATE = parseFloat(process.env.ACQUIRING_FEE_RATE || '0.025');

/**
 * Extract markup config from agency record.
 * Checks settings JSONB first, falls back to legacy commission_rate column.
 *
 * @param {object} agency - Row from agencies table
 * @returns {{ type: 'percent'|'fixed'|'none', value: number }}
 */
function getAgencyMarkup(agency) {
  if (!agency) return { type: 'none', value: 0 };

  const s = agency.settings || {};
  if (s.markup_type && s.markup_value != null) {
    return { type: s.markup_type, value: Number(s.markup_value) };
  }
  // Legacy: commission_rate column (numeric, treated as percent)
  if (agency.commission_rate != null && Number(agency.commission_rate) > 0) {
    return { type: 'percent', value: Number(agency.commission_rate) };
  }
  return { type: 'none', value: 0 };
}

/**
 * Calculate full pricing breakdown for a ticket.
 *
 * Price shown to customer = drct_amount + agency_markup + acquiring_fee
 * AviaFrame takes no cut from ticket price — revenue is monthly SaaS only.
 *
 * @param {number} drctAmount - Raw price from DRCT API
 * @param {object|null} agency - Agency row (or null for direct/no-agency)
 * @returns {{
 *   drct_amount: number,
 *   agency_markup: number,
 *   acquiring_fee: number,
 *   displayed_price: number,
 *   acquiring_rate: number,
 *   markup_type: string,
 *   markup_value: number
 * }}
 */
function calculatePricing(drctAmount, agency) {
  const amount = Number(drctAmount) || 0;
  const { type, value } = getAgencyMarkup(agency);

  let agencyMarkup = 0;
  if (type === 'percent' && value > 0) {
    agencyMarkup = round2(amount * value / 100);
  } else if (type === 'fixed' && value > 0) {
    agencyMarkup = round2(value);
  }

  const subtotal     = round2(amount + agencyMarkup);
  const acquiringFee = round2(subtotal * ACQUIRING_RATE);
  const displayedPrice = round2(subtotal + acquiringFee);

  return {
    drct_amount:     amount,
    agency_markup:   agencyMarkup,
    acquiring_fee:   acquiringFee,
    displayed_price: displayedPrice,
    acquiring_rate:  ACQUIRING_RATE,
    markup_type:     type,
    markup_value:    value,
  };
}

/**
 * Apply pricing to a list of offers from drctService.search().
 * Adds `pricing` object and `displayed_price` to each offer.
 *
 * @param {Array} offers
 * @param {object|null} agency
 * @returns {Array}
 */
function applyPricingToOffers(offers, agency) {
  if (!Array.isArray(offers)) return offers;
  return offers.map(offer => {
    const pricing = calculatePricing(offer.amount || offer.total_price || 0, agency);
    return {
      ...offer,
      displayed_price: pricing.displayed_price,
      pricing,
    };
  });
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

module.exports = { calculatePricing, applyPricingToOffers, getAgencyMarkup };
