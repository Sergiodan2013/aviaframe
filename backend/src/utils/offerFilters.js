'use strict';

// Whitelist of DRCT channels we've confirmed as bookable via /orders endpoint.
// Confirmed-working:
//   • Cashback (GL_* offer_ids, Galileo GDS)
//   • Flynas (XY_* offer_ids, direct connect, tested 2026-07-08)
// Known-broken (NDC that /orders rejects with "Unrecognized request URL"):
//   • Singapore Airlines (SQ_*), Emirates NDC (EK_* non-Cashback)
//   • EasyJet (U2_* / EJU_*), Lufthansa, British Airways, Air France, KLM
//   • AFN_* offers observed on 2026-07-27 in production search: OfferPrice succeeds,
//     but createOrder fails with DRCT 404 not_found / "Unrecognized request URL."
// Override via env: PUBLIC_SEARCH_ALLOWED_CHANNELS=Cashback,Flynas,Foo,...
const ALLOWED_CHANNELS = new Set(
  String(process.env.PUBLIC_SEARCH_ALLOWED_CHANNELS || 'Cashback,Flynas')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.toLowerCase())
);

// Fallback: when n8n strips the channel field (which it currently does),
// reject by offer_id prefix. These prefixes correspond to NDC-only channels
// that DRCT's /orders endpoint rejects.
const REJECTED_PREFIXES = new Set(
  String(process.env.PUBLIC_SEARCH_REJECTED_PREFIXES ||
    'SQ,EK,LH,LWC,BA,AF,AFN,KL,U2,EJU,EJ,QR,AA,EY,TK,LX,OS,SN,IB,FR,W6,F9,6E'
  )
    .split(',')
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean)
);

function getOfferPrefix(offer) {
  const id = String(offer?.offer_id || offer?.id || '');
  const underscoreIdx = id.indexOf('_');
  if (underscoreIdx <= 0) return '';
  return id.slice(0, underscoreIdx).toUpperCase();
}

function isBookableChannel(offer) {
  // Primary signal: explicit `channel` field from DRCT
  const channel = String(offer?.channel || '').trim().toLowerCase();
  if (channel) return ALLOWED_CHANNELS.has(channel);
  // Fallback: offer_id prefix (n8n strips channel, so this is what actually fires in prod)
  const prefix = getOfferPrefix(offer);
  if (prefix && REJECTED_PREFIXES.has(prefix)) return false;
  // No signals: assume bookable (backward compat, don't lose good offers)
  return true;
}

function filterBookableOffers(offers) {
  if (!Array.isArray(offers)) return { kept: [], dropped: 0, rejectedChannels: [], rejectedPrefixes: [] };
  const kept = [];
  const rejectedChannels = new Set();
  const rejectedPrefixes = new Set();
  for (const offer of offers) {
    if (isBookableChannel(offer)) {
      kept.push(offer);
    } else {
      const ch = String(offer?.channel || '').trim();
      if (ch) rejectedChannels.add(ch);
      const px = getOfferPrefix(offer);
      if (px) rejectedPrefixes.add(px);
    }
  }
  return {
    kept,
    dropped: offers.length - kept.length,
    rejectedChannels: Array.from(rejectedChannels),
    rejectedPrefixes: Array.from(rejectedPrefixes),
  };
}

module.exports = {
  ALLOWED_CHANNELS,
  isBookableChannel,
  filterBookableOffers,
};
