'use strict';

const axios = require('axios');
const fs = require('fs');
const JSZip = require('jszip');
const path = require('path');

const NETLIFY_TOKEN = process.env.NETLIFY_TOKEN || '';
const NETLIFY_TEAM_SLUG = process.env.NETLIFY_TEAM_SLUG || 'sergiodan2013';
const NETLIFY_API = 'https://api.netlify.com/api/v1';
const BACKEND_URL = process.env.BACKEND_URL || 'https://peaceful-amazement-production-629f.up.railway.app';
const AVIAFRAME_DOMAIN = 'aviaframe.com';
const APP_URL = process.env.APP_URL || 'https://admin.aviaframe.com';
const GODADDY_API_KEY = process.env.GODADDY_API_KEY || '';
const GODADDY_API_SECRET = process.env.GODADDY_API_SECRET || '';
const GODADDY_API = 'https://api.godaddy.com/v1';

// ── Default content (used when agency hasn't configured their own) ─────────────
const DEFAULT_DESTINATIONS = [
  { city: 'Dubai', country: 'UAE', price: '450', emoji: '🏙️', gradient: 'linear-gradient(160deg,#c8a44a 0%,#7a4f10 50%,#3d2007 100%)', image_url: null },
  { city: 'Istanbul', country: 'Turkey', price: '980', emoji: '🕌', gradient: 'linear-gradient(160deg,#2480c8 0%,#0e5090 50%,#062040 100%)', image_url: null },
  { city: 'London', country: 'United Kingdom', price: '1,850', emoji: '🎡', gradient: 'linear-gradient(160deg,#5f7280 0%,#2d3f50 50%,#1a2530 100%)', image_url: null },
  { city: 'Paris', country: 'France', price: '1,920', emoji: '🗼', gradient: 'linear-gradient(160deg,#c87199 0%,#6e3576 50%,#2d1040 100%)', image_url: null },
  { city: 'Bangkok', country: 'Thailand', price: '1,200', emoji: '🛕', gradient: 'linear-gradient(160deg,#d4a020 0%,#8b4f08 50%,#3d2200 100%)', image_url: null },
  { city: 'Maldives', country: 'Maldives', price: '2,400', emoji: '🏝️', gradient: 'linear-gradient(160deg,#20c4d8 0%,#087890 50%,#023040 100%)', image_url: null }
];

const DEFAULT_REVIEWS = [
  { name: 'Ahmed Al-K.', location: 'Riyadh, KSA', rating: 5, text: 'Excellent service! Found me the best fare and the ticket arrived instantly. Highly recommended.' },
  { name: 'Sara M.', location: 'Jeddah, KSA', rating: 5, text: 'The WhatsApp support is exceptional. Fast replies, zero hassle. Will always use this agency.' },
  { name: 'Faisal N.', location: 'Dammam, KSA', rating: 5, text: 'Booked flights for the whole family. Great price, PDF tickets delivered instantly. Perfect.' }
];

const DEFAULT_AIRLINES = ['Emirates', 'Qatar Airways', 'Turkish Airlines', 'Saudia', 'Etihad Airways', 'British Airways', 'Flynas', 'flydubai', 'Air Arabia', 'KLM'];

const ALL_SERVICES = [
  { key: 'flights_domestic', en: 'Domestic flight bookings', ar: 'حجز رحلات محلية' },
  { key: 'flights_intl', en: 'International flight bookings', ar: 'حجز رحلات دولية' },
  { key: 'hotels', en: 'Hotel reservations worldwide', ar: 'حجز فنادق حول العالم' },
  { key: 'visa', en: 'Visa application support', ar: 'دعم طلبات التأشيرة' },
  { key: 'insurance', en: 'Medical travel insurance', ar: 'تأمين السفر الطبي' },
  { key: 'umrah', en: 'Umrah & Hajj packages', ar: 'باقات العمرة والحج' },
  { key: 'tours', en: 'Tour packages & holidays', ar: 'باقات السياحة والعطلات' },
  { key: 'corporate', en: 'Corporate travel management', ar: 'إدارة سفر الشركات' },
  { key: 'transfers', en: 'Airport transfers', ar: 'خدمات نقل المطار' },
  { key: 'car_rental', en: 'Car rental', ar: 'تأجير السيارات' }
];

// ── Color helpers ─────────────────────────────────────────────────────────────
function hexToRgb(hex) {
  const h = String(hex || '#1a3c8e').replace('#', '');
  const full = h.length === 3
    ? h.split('').map(c => c + c).join('')
    : h.padEnd(6, '0');
  const r = parseInt(full.slice(0, 2), 16) || 0;
  const g = parseInt(full.slice(2, 4), 16) || 0;
  const b = parseInt(full.slice(4, 6), 16) || 0;
  return `${r},${g},${b}`;
}

function darkenHex(hex, amount = 40) {
  const h = String(hex || '#1a3c8e').replace('#', '').padEnd(6, '0');
  const r = Math.max(0, parseInt(h.slice(0, 2), 16) - amount);
  const g = Math.max(0, parseInt(h.slice(2, 4), 16) - amount);
  const b = Math.max(0, parseInt(h.slice(4, 6), 16) - amount);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function getLuminance(hex) {
  const h = String(hex || '#ffffff').replace('#', '').padEnd(6, '0');
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  return 0.299 * r + 0.587 * g + 0.114 * b;
}
function getContrastColor(hex) {
  return getLuminance(hex) > 0.5 ? '#0a1628' : '#ffffff';
}

// ── Site template resolver ────────────────────────────────────────────────────
function resolveSiteTemplateDir() {
  const candidates = [
    path.resolve(__dirname, '../../agency-site-assets'),
    path.resolve(__dirname, '../agency-site-assets'),
    path.resolve(__dirname, '../../../aviaframe-site'),
    path.resolve(__dirname, '../../aviaframe-site'),
    path.resolve(process.cwd(), 'aviaframe-site'),
    path.resolve(process.cwd(), '../aviaframe-site'),
    '/app/aviaframe-site'
  ];
  return candidates.find((candidate) => {
    try { return fs.existsSync(path.join(candidate, 'booking.html')); } catch (_) { return false; }
  }) || candidates[0];
}

const SITE_TEMPLATE_DIR = resolveSiteTemplateDir();
const DEFAULT_LIVE_MOYASAR_PUBLIC_KEY = process.env.MOYASAR_PUBLIC_KEY
  || process.env.MOYASAR_PUBLISHABLE_KEY
  || 'pk_live_iXhEB7xrWqPoh2SMRBt45fA73mVoKKa8EjZt5end';

// ── Main template generator ───────────────────────────────────────────────────
function generateAgencySiteFiles(opts) {
  const {
    agencyName,
    agencyNameAr = '',
    subdomain,
    apiKey,
    contactEmail = '',
    contactPhone = '',
    contactPhone2 = '',
    whatsappPhone = '',
    brandColor = '#1a3c8e',
    accentColor = '#2468c4',
    supervisorName = '',
    supervisorEmail = '',
    language = 'en',
    logoUrl = '',
    aboutEn = '',
    aboutAr = '',
    address = '',
    workingHours = '',
    workingHoursAr = '',
    licenseNumber = '',
    iataNumber = '',
    foundedYear = '',
    googleMapsUrl = '',
    instagram = '',
    twitter = '',
    snapchat = '',
    facebook = '',
    services = [],
    // New content fields
    heroTagline = '',
    heroDescription = '',
    destinations = [],
    reviews = [],
    featuredAirlines = [],
    heroImageUrl = '',
    headerBg = '',
    footerBg = ''
  } = opts;

  // ── Resolve effective content (agency data or defaults) ─────────────────
  const effectiveDestinations = (Array.isArray(destinations) && destinations.length > 0) ? destinations : DEFAULT_DESTINATIONS;
  const effectiveReviews = (Array.isArray(reviews) && reviews.length > 0) ? reviews : DEFAULT_REVIEWS;
  const effectiveAirlines = (Array.isArray(featuredAirlines) && featuredAirlines.length > 0) ? featuredAirlines : DEFAULT_AIRLINES;
  const effectiveTagline = heroTagline || 'Book Flights Worldwide at the Best Prices';
  const effectiveHeroDesc = heroDescription || 'Compare hundreds of airlines. Secure booking. Real travel agents available 24/7.';

  const effectiveAboutEn = aboutEn || `${agencyName} is your trusted travel partner. Our professional team offers flight bookings, hotel reservations, visa assistance, and full travel packages for individuals, families, and corporate clients — with personal service you can count on.`;
  const effectiveAboutAr = aboutAr || `${agencyNameAr || agencyName} هي شريككم الموثوق في السفر.`;

  // ── Colors ──────────────────────────────────────────────────────────────
  const brandDark = darkenHex(brandColor, 45);
  const brandRgb = hexToRgb(brandColor);
  const accentRgb = hexToRgb(accentColor);

  // ── Header / footer computed colors ─────────────────────────────────────
  const effectiveHeaderBg = headerBg || 'rgba(255,255,255,0.97)';
  const effectiveFooterBg = footerBg || brandColor;
  const headerTextColor = getContrastColor(headerBg || '#ffffff');
  const headerLogoColor = (headerBg && getLuminance(headerBg) < 0.5) ? '#ffffff' : brandColor;
  const footerTextColor = getContrastColor(footerBg || brandColor);
  const footerMuted = footerTextColor === '#ffffff' ? 'rgba(255,255,255,.65)' : 'rgba(10,22,40,.55)';
  const footerDim = footerTextColor === '#ffffff' ? 'rgba(255,255,255,.45)' : 'rgba(10,22,40,.35)';
  const footerDivider = footerTextColor === '#ffffff' ? 'rgba(255,255,255,.1)' : 'rgba(10,22,40,.1)';

  // ── Services ────────────────────────────────────────────────────────────
  const defaultServices = ['flights_domestic', 'flights_intl', 'hotels', 'visa', 'insurance', 'umrah', 'tours', 'corporate'];
  const activeServices = services.length > 0 ? services : defaultServices;
  const serviceList = ALL_SERVICES.filter(s => activeServices.includes(s.key));

  // ── WhatsApp ────────────────────────────────────────────────────────────
  const waPhone = (whatsappPhone || contactPhone).replace(/\D/g, '');

  // ── Logo ────────────────────────────────────────────────────────────────
  const logoInitial = (agencyName || 'A').charAt(0).toUpperCase();
  const logoHtml = logoUrl
    ? `<img class="av-logo-img" src="${logoUrl}" alt="${agencyName}" />`
    : `<div class="av-logo-icon-text">${logoInitial}</div>`;

  // ── Social links ────────────────────────────────────────────────────────
  function normalizeSocialUrl(value, baseUrl) {
    if (!value) return '';
    const v = String(value).trim().replace(/^@/, '');
    if (!v) return '';
    if (/^https?:\/\//i.test(v)) return v;
    if (v.includes('/')) return `https://${v}`;
    return `${baseUrl}/${v}`;
  }
  const igUrl = normalizeSocialUrl(instagram, 'https://www.instagram.com');
  const twUrl = normalizeSocialUrl(twitter, 'https://x.com');
  const scUrl = normalizeSocialUrl(snapchat, 'https://www.snapchat.com/add');
  const fbUrl = normalizeSocialUrl(facebook, 'https://www.facebook.com');

  const socialItems = [
    igUrl ? `<a class="av-social-link" href="${igUrl}" target="_blank" rel="noreferrer" aria-label="Instagram">📸</a>` : '',
    twUrl ? `<a class="av-social-link" href="${twUrl}" target="_blank" rel="noreferrer" aria-label="Twitter/X">🐦</a>` : '',
    scUrl ? `<a class="av-social-link" href="${scUrl}" target="_blank" rel="noreferrer" aria-label="Snapchat">👻</a>` : '',
    fbUrl ? `<a class="av-social-link" href="${fbUrl}" target="_blank" rel="noreferrer" aria-label="Facebook">📘</a>` : ''
  ].filter(Boolean).join('\n');

  // ── Trust badges ────────────────────────────────────────────────────────
  const trustItems = [
    licenseNumber ? `<span class="av-trust-badge">License: ${licenseNumber}</span>` : '',
    iataNumber ? `<span class="av-trust-badge">IATA: ${iataNumber}</span>` : '',
    foundedYear ? `<span class="av-trust-badge">Est. ${foundedYear}</span>` : '',
    '<span class="av-trust-badge">Secure Payment</span>',
    '<span class="av-trust-badge">24/7 Support</span>'
  ].filter(Boolean).join('\n');

  // ── Destinations HTML ───────────────────────────────────────────────────
  const destinationsHtml = effectiveDestinations.slice(0, 6).map(d => {
    const bgStyle = d.image_url
      ? `background-image:url('${d.image_url}');background-size:cover;background-position:center`
      : `background:${d.gradient || 'linear-gradient(160deg,#1a3c8e,#0d2355)'}`;
    return `<div class="av-dest-card">
        <div class="av-dest-bg" style="${bgStyle}"></div>
        <div class="av-dest-overlay"></div>
        <div class="av-dest-icon">${d.emoji || '✈️'}</div>
        <div class="av-dest-content">
          <div class="av-dest-city">${d.city || ''}</div>
          <div class="av-dest-price">${d.country ? d.country + ' · ' : ''}From SAR ${d.price || '—'}</div>
          <a href="#aviaframe-widget" class="av-dest-btn">Search Flights</a>
        </div>
      </div>`;
  }).join('\n');

  // ── Reviews HTML ─────────────────────────────────────────────────────────
  const reviewAccentColors = ['var(--av-brand)', 'var(--av-accent)', '#0ea5e9'];
  const reviewsHtml = effectiveReviews.slice(0, 3).map((r, i) => {
    const stars = '★'.repeat(Math.max(1, Math.min(5, r.rating || 5)));
    const initials = (r.name || 'A').split(/[\s.]+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
    return `<div class="av-review" style="border-left-color:${reviewAccentColors[i] || 'var(--av-brand)'}${i === 1 ? ';margin-top:18px' : ''}">
        <div class="av-review-stars">${stars}</div>
        <div class="av-review-text">"${(r.text || '').replace(/"/g, '&quot;')}"</div>
        <div class="av-reviewer">
          <div class="av-reviewer-av">${initials}</div>
          <div>
            <div class="av-reviewer-name">${r.name || ''}</div>
            <div class="av-reviewer-loc">${r.location || ''}</div>
          </div>
        </div>
      </div>`;
  }).join('\n');

  // ── Airlines HTML ─────────────────────────────────────────────────────────
  const airlinesHtml = effectiveAirlines.slice(0, 12).map(a =>
    `<div class="av-airline">✈ ${a}</div>`
  ).join('\n');

  // ── Why choose us (derived from services + hardcoded UX advantages) ──────
  const whyCards = [
    { icon: '💰', title: 'Best Price Guarantee', desc: 'We compare 700+ airlines in real time to find you the most competitive fares. Found cheaper? We\'ll match it.' },
    { icon: '📞', title: '24/7 Live Support', desc: 'Real travel agents available around the clock via phone, WhatsApp, or email — always a human on the other end.' },
    { icon: '🛡️', title: 'Secure Payments', desc: 'All transactions are SSL-encrypted and processed through PCI-DSS compliant gateways. Your data stays safe.' },
    { icon: '📋', title: 'Visa Assistance', desc: 'Expert help with travel documentation and visa applications for 50+ countries. We handle the paperwork.' }
  ];
  if (activeServices.includes('umrah')) {
    whyCards[3] = { icon: '🕌', title: 'Umrah Specialists', desc: 'Dedicated Umrah & Hajj department with group and individual packages, premium hotels near Haram.' };
  }
  const whyHtml = whyCards.map(c => `<div class="av-why-card">
        <div class="av-why-icon">${c.icon}</div>
        <div class="av-why-title">${c.title}</div>
        <div class="av-why-desc">${c.desc}</div>
      </div>`).join('\n');

  // ── Services list for contact section ────────────────────────────────────
  const servicesListHtml = serviceList.map(s =>
    `<li><span class="en-text">${s.en}</span><span class="ar-text" style="display:none">${s.ar}</span></li>`
  ).join('\n');

  // ── Google Maps embed ────────────────────────────────────────────────────
  const isValidMapsUrl = googleMapsUrl && /google\.com\/maps/i.test(googleMapsUrl);
  const mapsHtml = isValidMapsUrl
    ? `<div class="av-maps-embed"><iframe src="${googleMapsUrl}" width="100%" height="200" style="border:0;border-radius:10px" allowfullscreen loading="lazy"></iframe></div>`
    : '';

  // ── FAQ items ────────────────────────────────────────────────────────────
  const faqItems = [
    { q: 'Can I cancel my booking?', a: 'Yes. Cancellation policies vary by airline and fare type. Most bookings allow cancellation within 24 hours of purchase for a full refund. Check your ticket details for specific conditions.' },
    { q: 'How do refunds work?', a: 'Approved refunds are processed within 7–14 business days, depending on your bank and the airline\'s policy. Our team handles the refund claim on your behalf.' },
    { q: 'Can I change my flight date or route?', a: 'Flight changes are possible for most fares, subject to availability and any difference in fare plus the airline\'s change fee. Contact our support team via WhatsApp for rebooking.' },
    { q: 'Do prices include taxes and fees?', a: 'Yes. All prices shown include all taxes, airport fees and our service charge. The price you see is the total price you pay — no surprises at checkout.' },
    { q: 'How can I contact customer support?', a: `We're available 24/7 via WhatsApp${contactPhone ? ', phone (' + contactPhone + ')' : ''}, and email. WhatsApp is the fastest channel — most queries answered within minutes.` }
  ];
  const faqHtml = faqItems.map((f, i) => `<div class="av-faq-item${i === 0 ? ' open' : ''}">
        <div class="av-faq-q" onclick="avToggleFaq(this)">
          ${f.q}
          <span class="av-faq-toggle">+</span>
        </div>
        <div class="av-faq-a">${f.a}</div>
      </div>`).join('\n');

  // ── Stats ────────────────────────────────────────────────────────────────
  const statsHtml = `
      <div class="av-stat">
        <div class="av-stat-num">700<span>+</span></div>
        <div class="av-stat-label">Partner Airlines</div>
      </div>
      <div class="av-stat">
        <div class="av-stat-num">15<span>K+</span></div>
        <div class="av-stat-label">Happy Travelers</div>
      </div>
      <div class="av-stat">
        <div class="av-stat-num">24<span>/7</span></div>
        <div class="av-stat-label">Customer Support</div>
      </div>
      <div class="av-stat">
        <div class="av-stat-num">4.9<span>★</span></div>
        <div class="av-stat-label">Average Rating</div>
      </div>`;

  // ── HTML template ────────────────────────────────────────────────────────
  const html = `<!doctype html>
<html lang="${language}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${agencyName} | Flights &amp; Travel</title>
  <link rel="stylesheet" href="./styles.css" />
  <style>
    :root {
      --av-brand: ${brandColor};
      --av-brand-dark: ${brandDark};
      --av-brand-rgb: ${brandRgb};
      --av-accent: ${accentColor};
      --av-accent-rgb: ${accentRgb};
      --av-header-bg: ${effectiveHeaderBg};
      --av-header-text: ${headerTextColor};
      --av-header-logo: ${headerLogoColor};
      --av-footer-bg: ${effectiveFooterBg};
    }
  </style>
</head>
<body>

  <!-- LANGUAGE SWITCHER (fixed) -->
  <div class="av-lang-switcher">
    <button class="av-lang-btn active" data-lang="en" onclick="avApplyLang('en')">EN</button>
    <button class="av-lang-btn" data-lang="ar" onclick="avApplyLang('ar')">عر</button>
  </div>

  <!-- HEADER -->
  <header class="av-header">
    <div class="av-header-inner">
      <a href="/" class="av-logo">
        <div class="av-logo-icon${logoUrl ? ' av-logo-icon--img' : ''}">${logoHtml}</div>
        <div class="av-logo-text">
          ${agencyNameAr ? `<div class="av-logo-ar en-hidden">${agencyNameAr}</div>` : ''}
          <div class="av-logo-name">${agencyName}</div>
        </div>
      </a>
      <div class="av-header-contacts">
        ${contactPhone ? `<span class="av-phone-display">${contactPhone}</span>` : ''}
        ${waPhone ? `<a class="av-wa-btn" href="https://wa.me/${waPhone}" target="_blank" rel="noreferrer">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          WhatsApp
        </a>` : ''}
      </div>
    </div>
  </header>

  <!-- HERO -->
  <section class="av-hero"${heroImageUrl ? ` style="background:linear-gradient(rgba(0,0,0,.58),rgba(0,0,0,.42)),url('${heroImageUrl}') center/cover no-repeat"` : ''}>
    <div class="av-hero-badge">✈ ${subdomain}.aviaframe.com</div>
    <h1 class="av-hero-h1">${effectiveTagline}</h1>
    <p class="av-hero-sub">${effectiveHeroDesc}</p>
    <div class="av-trust-badges">
      ${trustItems}
    </div>
  </section>

  <!-- SEARCH WIDGET -->
  <div class="av-widget-wrap">
    <div class="av-widget-card">
      <div class="av-widget-title">
        <span class="en-text">Find the Best Flights Now</span>
        <span class="ar-text" style="display:none">ابحث عن أفضل رحلاتك الآن</span>
      </div>
      <div class="av-widget-sub">
        <span class="en-text">Powered by AviaFrame · 700+ airlines · Instant booking</span>
        <span class="ar-text" style="display:none">مدعوم من أفيافريم · أكثر من 700 شركة طيران</span>
      </div>
      <div
        id="aviaframe-widget"
        data-aviaframe-widget
        data-api-url="${BACKEND_URL}/webhook/drct/search"
        data-checkout-url="/booking.html"
        data-agency-key="${apiKey}"
        data-brand-name="${agencyName}"
        data-brand-color="${brandColor}"
        data-accent-color="${accentColor}"
        data-title="Search Flights"
        data-primary-color="${accentColor}"
      ></div>
    </div>
  </div>

  <!-- DESTINATIONS -->
  <section class="av-section">
    <div class="av-section-inner">
      <div class="av-section-header">
        <span class="av-eyebrow">✈ Popular Routes</span>
        <h2 class="av-section-title">
          <span class="en-text">Top Destinations</span>
          <span class="ar-text" style="display:none">الوجهات الأكثر طلباً</span>
        </h2>
        <p class="av-section-sub en-text">Handpicked routes with the best fares — updated weekly</p>
      </div>
      <div class="av-dest-grid">
        ${destinationsHtml}
      </div>
    </div>
  </section>

  <!-- WHY CHOOSE US -->
  <section class="av-section av-why-section">
    <div class="av-section-inner">
      <div class="av-section-header">
        <span class="av-eyebrow">⭐ Why Choose Us</span>
        <h2 class="av-section-title">
          <span class="en-text">Travel with Confidence</span>
          <span class="ar-text" style="display:none">سافر بثقة</span>
        </h2>
      </div>
      <div class="av-why-grid">
        ${whyHtml}
      </div>
    </div>
  </section>

  <!-- AIRLINES -->
  <section class="av-section av-airlines-section">
    <div class="av-section-inner">
      <div class="av-section-header" style="margin-bottom:28px">
        <span class="av-eyebrow">✈ Partner Airlines</span>
        <h2 class="av-section-title">
          <span class="en-text">700+ Airlines at Your Fingertips</span>
          <span class="ar-text" style="display:none">أكثر من 700 شركة طيران</span>
        </h2>
      </div>
      <div class="av-airlines-wrap">
        ${airlinesHtml}
      </div>
    </div>
  </section>

  <!-- STATS -->
  <section class="av-stats">
    <div class="av-section-inner">
      <div class="av-stats-grid">
        ${statsHtml}
      </div>
    </div>
  </section>

  <!-- REVIEWS -->
  <section class="av-section av-reviews-section">
    <div class="av-section-inner">
      <div class="av-section-header">
        <span class="av-eyebrow">💬 Testimonials</span>
        <h2 class="av-section-title">
          <span class="en-text">What Our Travelers Say</span>
          <span class="ar-text" style="display:none">ماذا يقول مسافرونا</span>
        </h2>
        <div class="av-rating-row">
          <div class="av-rating-num">4.9</div>
          <div>
            <div class="av-rating-stars">★★★★★</div>
            <div class="av-rating-count">Based on 1,000+ verified bookings</div>
          </div>
        </div>
      </div>
      <div class="av-reviews-grid">
        ${reviewsHtml}
      </div>
    </div>
  </section>

  <!-- CONTACT & ABOUT -->
  <section class="av-section av-contact-section">
    <div class="av-section-inner">
      <div class="av-section-header">
        <span class="av-eyebrow">📍 Find Us</span>
        <h2 class="av-section-title">
          <span class="en-text">Get in Touch</span>
          <span class="ar-text" style="display:none">تواصل معنا</span>
        </h2>
      </div>
      <div class="av-contact-grid">
        <div class="av-contact-card">
          <h3><span class="en-text">Contact Information</span><span class="ar-text" style="display:none">معلومات التواصل</span></h3>
          <div class="av-phones">
            ${waPhone ? `<a class="av-phone-link av-phone-wa" href="https://wa.me/${waPhone}" target="_blank" rel="noreferrer">
              <span>💬</span> ${contactPhone}
            </a>` : contactPhone ? `<div class="av-phone-link"><span>📞</span> ${contactPhone}</div>` : ''}
            ${contactPhone2 ? `<div class="av-phone-link"><span>📞</span> ${contactPhone2}</div>` : ''}
            ${contactEmail ? `<a class="av-phone-link" href="mailto:${contactEmail}"><span>✉️</span> ${contactEmail}</a>` : ''}
          </div>
          ${address ? `<div class="av-address"><span>📍</span> <span>${address}</span></div>` : ''}
          ${workingHours ? `<div class="av-working"><span>🕐</span> <span class="en-text">${workingHours}</span>${workingHoursAr ? `<span class="ar-text" style="display:none">${workingHoursAr}</span>` : ''}</div>` : ''}
          ${socialItems ? `<div class="av-social-bar">${socialItems}</div>` : ''}
        </div>
        <div class="av-contact-card">
          <h3><span class="en-text">About Us</span><span class="ar-text" style="display:none">عنّا</span></h3>
          <p class="av-about-text">
            <span class="en-text">${effectiveAboutEn}</span>
            <span class="ar-text" style="display:none">${effectiveAboutAr}</span>
          </p>
          ${serviceList.length > 0 ? `<ul class="av-services-list">${servicesListHtml}</ul>` : ''}
          ${supervisorName ? `<div class="av-supervisor"><strong>${supervisorName}</strong>${supervisorEmail ? ` · <a href="mailto:${supervisorEmail}">${supervisorEmail}</a>` : ''}</div>` : ''}
        </div>
      </div>
      ${mapsHtml ? `<div style="margin-top:20px">${mapsHtml}</div>` : ''}
    </div>
  </section>

  <!-- FAQ -->
  <section class="av-section">
    <div class="av-section-inner">
      <div class="av-section-header">
        <span class="av-eyebrow">❓ Help Center</span>
        <h2 class="av-section-title">
          <span class="en-text">Frequently Asked Questions</span>
          <span class="ar-text" style="display:none">أسئلة شائعة</span>
        </h2>
      </div>
      <div class="av-faq-list">
        ${faqHtml}
      </div>
    </div>
  </section>

  <!-- FOOTER -->
  <footer class="av-footer">
    <div class="av-section-inner">
      <div class="av-footer-grid">
        <div class="av-footer-brand">
          <div class="av-footer-brand-name">${agencyName}${agencyNameAr ? ` · ${agencyNameAr}` : ''}</div>
          <p class="av-footer-desc">${effectiveAboutEn.slice(0, 120)}...</p>
          ${socialItems ? `<div class="av-footer-social">${socialItems}</div>` : ''}
        </div>
        <div class="av-footer-col">
          <h4>Services</h4>
          <ul>
            <li><a href="#aviaframe-widget">Flight Booking</a></li>
            ${activeServices.includes('hotels') ? '<li><a href="#">Hotel Reservations</a></li>' : ''}
            ${activeServices.includes('visa') ? '<li><a href="#">Visa Assistance</a></li>' : ''}
            ${activeServices.includes('umrah') ? '<li><a href="#">Umrah Packages</a></li>' : ''}
          </ul>
        </div>
        <div class="av-footer-col">
          <h4>Legal</h4>
          <ul>
            <li><a href="#">Privacy Policy</a></li>
            <li><a href="#">Terms &amp; Conditions</a></li>
            <li><a href="#">Refund Policy</a></li>
          </ul>
        </div>
      </div>
      <div class="av-footer-bottom">
        <span>© ${new Date().getFullYear()} ${agencyName}. All rights reserved.</span>
        <span class="av-footer-subdomain">${subdomain}.aviaframe.com</span>
      </div>
    </div>
  </footer>

  <script src="/aviaframe-widget.js"></script>
  <script>
    // Language switcher
    var _avLang = localStorage.getItem('aviaframe_lang') || '${language}';
    function avApplyLang(lang) {
      _avLang = lang;
      localStorage.setItem('aviaframe_lang', lang);
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
      document.querySelectorAll('.en-text,.en-hidden').forEach(function(el){
        el.style.display = lang === 'ar' ? 'none' : '';
      });
      document.querySelectorAll('.ar-text').forEach(function(el){
        el.style.display = lang === 'ar' ? '' : 'none';
      });
      document.querySelectorAll('.av-lang-btn').forEach(function(btn){
        var active = btn.dataset.lang === lang;
        btn.classList.toggle('active', active);
      });
    }
    avApplyLang(_avLang);

    // FAQ accordion
    function avToggleFaq(el) {
      var item = el.closest('.av-faq-item');
      var isOpen = item.classList.contains('open');
      document.querySelectorAll('.av-faq-item').forEach(function(i){ i.classList.remove('open'); });
      if (!isOpen) item.classList.add('open');
    }

    // Sticky header shadow
    window.addEventListener('scroll', function() {
      var header = document.querySelector('.av-header');
      if (header) header.style.boxShadow = window.scrollY > 10
        ? '0 4px 20px rgba(0,0,0,0.12)'
        : '0 2px 8px rgba(0,0,0,0.06)';
    });
  </script>
</body>
</html>`;

  // ── CSS ───────────────────────────────────────────────────────────────────
  const css = `/* Agency site — generated by AviaFrame */
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{font-family:-apple-system,'SF Pro Display','Segoe UI',system-ui,sans-serif;font-size:16px;color:#0a1628;background:#fff;line-height:1.6;-webkit-font-smoothing:antialiased}
a{text-decoration:none;color:inherit}

/* Lang switcher */
.av-lang-switcher{position:fixed;top:14px;right:16px;z-index:200;display:flex;gap:4px}
.av-lang-btn{border:1px solid rgba(255,255,255,.4);border-radius:6px;padding:4px 10px;cursor:pointer;font-size:12px;background:transparent;color:rgba(255,255,255,.7);font-weight:600;transition:all .2s}
.av-lang-btn.active{background:rgba(255,255,255,.25);color:#fff;border-color:rgba(255,255,255,.6)}
[dir=rtl] .av-lang-switcher{right:auto;left:16px}

/* Header */
.av-header{position:sticky;top:0;z-index:100;background:var(--av-header-bg);backdrop-filter:blur(12px);border-bottom:1px solid rgba(var(--av-brand-rgb),.12);box-shadow:0 2px 8px rgba(0,0,0,.06)}
.av-header-inner{max-width:1240px;margin:0 auto;padding:0 24px;height:68px;display:flex;align-items:center;gap:24px}
.av-logo{display:flex;align-items:center;gap:12px;flex-shrink:0}
.av-logo-icon{height:48px;min-width:48px;border-radius:10px;background:var(--av-brand);overflow:hidden;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.av-logo-icon.av-logo-icon--img{background:transparent;border-radius:0;min-width:0;height:48px}
.av-logo-img{height:48px;width:auto;max-width:220px;object-fit:contain;display:block}
.av-logo-icon-text{font-size:20px;font-weight:800;color:#fff}
.av-logo-name{font-size:17px;font-weight:700;color:var(--av-header-logo);letter-spacing:-0.3px}
.av-logo-ar{font-size:15px;font-weight:700;color:var(--av-header-logo)}
.av-header-contacts{margin-left:auto;display:flex;align-items:center;gap:12px;flex-shrink:0}
.av-phone-display{font-size:14px;font-weight:600;color:var(--av-header-text)}
.av-wa-btn{display:flex;align-items:center;gap:6px;padding:7px 14px;border-radius:99px;background:#25D366;color:#fff;font-size:13px;font-weight:600;transition:opacity .2s}
.av-wa-btn:hover{opacity:.88}
[dir=rtl] .av-header-contacts{margin-left:0;margin-right:auto}

/* Hero */
.av-hero{position:relative;overflow:hidden;min-height:380px;background:radial-gradient(ellipse 90% 50% at 50% 110%,rgba(var(--av-accent-rgb),.4) 0%,transparent 65%),linear-gradient(175deg,var(--av-brand-dark) 0%,var(--av-brand) 50%,color-mix(in srgb,var(--av-brand) 80%,#fff 20%) 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:52px 24px 82px}
.av-hero-badge{display:inline-flex;align-items:center;gap:8px;padding:6px 16px;border-radius:99px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);color:rgba(255,255,255,.85);font-size:13px;font-weight:500;margin-bottom:22px}
.av-hero-h1{font-size:clamp(1.8rem,5vw,3.2rem);font-weight:800;color:#fff;line-height:1.1;letter-spacing:-1.5px;margin-bottom:14px;max-width:680px;text-wrap:balance}
.av-hero-sub{font-size:1.05rem;color:rgba(255,255,255,.75);max-width:480px;margin-bottom:24px;line-height:1.7}
.av-trust-badges{display:flex;flex-wrap:wrap;gap:8px;justify-content:center}
.av-trust-badge{display:flex;align-items:center;gap:5px;padding:5px 12px;border-radius:99px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.15);color:rgba(255,255,255,.9);font-size:12px;font-weight:500}

/* Widget wrapper */
.av-widget-wrap{max-width:1100px;width:100%;margin:-44px auto 0;padding:0 24px;position:relative;z-index:10}
.av-widget-card{background:#fff;border-radius:16px;box-shadow:0 16px 48px rgba(var(--av-brand-rgb),.16),0 4px 16px rgba(var(--av-brand-rgb),.08);padding:16px 22px 22px}
.av-widget-title{font-size:15px;font-weight:700;color:#0a1628;margin-bottom:3px}
.av-widget-sub{font-size:12px;color:#5a6b8a;margin-bottom:14px}

/* Sections */
.av-section{padding:52px 24px}
.av-section-inner{max-width:1200px;margin:0 auto}
.av-section-header{text-align:center;margin-bottom:32px}
.av-eyebrow{font-size:12px;font-weight:700;color:var(--av-accent);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:10px;display:inline-block;padding-bottom:4px;border-bottom:2px solid var(--av-accent)}
.av-section-title{font-size:clamp(1.4rem,3vw,2rem);font-weight:800;color:var(--av-brand);letter-spacing:-0.8px;line-height:1.2}
.av-section-sub{font-size:1rem;color:#5a6b8a;margin-top:8px}

/* Destinations */
.av-dest-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:14px}
.av-dest-card{border-radius:14px;overflow:hidden;cursor:pointer;position:relative;aspect-ratio:3/4;transition:transform .22s,box-shadow .22s;box-shadow:0 2px 12px rgba(0,0,0,.08)}
.av-dest-card:hover{transform:translateY(-5px);box-shadow:0 16px 48px rgba(0,0,0,.16)}
.av-dest-bg{position:absolute;inset:0;background-size:cover;background-position:center}
.av-dest-bg::after{content:'';position:absolute;inset:0;background:repeating-linear-gradient(45deg,transparent,transparent 20px,rgba(255,255,255,.02) 20px,rgba(255,255,255,.02) 40px)}
.av-dest-overlay{position:absolute;inset:0;background:rgba(var(--av-brand-rgb),.12);opacity:0;transition:opacity .22s}
.av-dest-card:hover .av-dest-overlay{opacity:1}
.av-dest-content{position:absolute;bottom:0;left:0;right:0;padding:14px 12px;background:linear-gradient(transparent,rgba(0,0,0,.72))}
.av-dest-city{font-size:14px;font-weight:700;color:#fff;margin-bottom:2px}
.av-dest-price{font-size:11px;color:rgba(255,255,255,.8);margin-bottom:6px}
.av-dest-btn{display:block;padding:5px 0;background:rgba(var(--av-accent-rgb),.92);color:#fff;border-radius:6px;font-size:11px;font-weight:700;text-align:center}
.av-dest-card:hover .av-dest-btn{background:var(--av-accent)}
.av-dest-icon{position:absolute;top:10px;right:10px;font-size:26px;filter:drop-shadow(0 2px 4px rgba(0,0,0,.3))}

/* Why */
.av-why-section{background:#f4f7fc}
.av-why-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:18px}
.av-why-card{background:#fff;border-radius:14px;padding:26px 22px;box-shadow:0 2px 12px rgba(var(--av-brand-rgb),.06);border:1px solid rgba(var(--av-brand-rgb),.1);transition:transform .22s,box-shadow .22s;position:relative;overflow:hidden}
.av-why-card:hover{transform:translateY(-4px);box-shadow:0 8px 28px rgba(var(--av-brand-rgb),.12)}
.av-why-card::after{content:'';position:absolute;bottom:0;left:0;right:0;height:3px;background:var(--av-accent);transform:scaleX(0);transform-origin:left;transition:transform .3s}
.av-why-card:hover::after{transform:scaleX(1)}
.av-why-icon{width:46px;height:46px;border-radius:12px;margin-bottom:16px;background:rgba(var(--av-brand-rgb),.08);display:flex;align-items:center;justify-content:center;font-size:20px}
.av-why-title{font-size:15px;font-weight:700;color:var(--av-brand);margin-bottom:8px}
.av-why-desc{font-size:13px;color:#5a6b8a;line-height:1.6}

/* Airlines */
.av-airlines-section{padding-top:40px;padding-bottom:40px}
.av-airlines-wrap{display:flex;flex-wrap:wrap;gap:10px;justify-content:center}
.av-airline{padding:11px 22px;border-radius:99px;border:1.5px solid rgba(var(--av-brand-rgb),.15);background:#fff;font-size:13px;font-weight:700;color:#5a6b8a;cursor:pointer;transition:all .22s;box-shadow:0 2px 8px rgba(0,0,0,.04)}
.av-airline:hover{color:var(--av-brand);border-color:var(--av-brand);box-shadow:0 6px 20px rgba(var(--av-brand-rgb),.1);transform:translateY(-2px)}

/* Stats */
.av-stats{background:var(--av-brand);position:relative;overflow:hidden}
.av-stats::before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 20% 50%,rgba(255,255,255,.08) 0%,transparent 60%),radial-gradient(circle at 80% 50%,rgba(var(--av-accent-rgb),.12) 0%,transparent 60%)}
.av-stats-grid{display:grid;grid-template-columns:repeat(4,1fr);position:relative}
.av-stat{text-align:center;padding:36px 16px;border-right:1px solid rgba(255,255,255,.1)}
.av-stat:last-child{border-right:none}
.av-stat-num{font-size:clamp(2rem,5vw,3.2rem);font-weight:900;color:#fff;line-height:1;letter-spacing:-2px;margin-bottom:6px}
.av-stat-num span{color:var(--av-accent)}
.av-stat-label{font-size:13px;color:rgba(255,255,255,.55);font-weight:500}

/* Reviews */
.av-reviews-section{background:#f4f7fc}
.av-rating-row{display:flex;align-items:center;gap:14px;justify-content:center;margin-bottom:36px}
.av-rating-num{font-size:2.8rem;font-weight:900;color:var(--av-brand);line-height:1}
.av-rating-stars{font-size:22px;color:#f59e0b;letter-spacing:2px}
.av-rating-count{font-size:13px;color:#5a6b8a}
.av-reviews-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
.av-review{background:#fff;border-radius:14px;padding:22px;box-shadow:0 2px 12px rgba(var(--av-brand-rgb),.06);border:1px solid rgba(var(--av-brand-rgb),.1);border-left:4px solid var(--av-brand);transition:transform .22s,box-shadow .22s}
.av-review:hover{transform:translateY(-4px);box-shadow:0 8px 28px rgba(var(--av-brand-rgb),.12)}
.av-review-stars{font-size:13px;color:#f59e0b;margin-bottom:10px}
.av-review-text{font-size:13px;color:#0a1628;line-height:1.7;margin-bottom:14px;font-style:italic}
.av-reviewer{display:flex;align-items:center;gap:8px}
.av-reviewer-av{width:34px;height:34px;border-radius:50%;background:rgba(var(--av-brand-rgb),.1);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:var(--av-brand);flex-shrink:0}
.av-reviewer-name{font-size:13px;font-weight:700;color:var(--av-brand)}
.av-reviewer-loc{font-size:11px;color:#5a6b8a}

/* Contact */
.av-contact-section{background:#f4f7fc}
.av-contact-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px}
.av-contact-card{background:#fff;border-radius:14px;padding:24px;box-shadow:0 2px 12px rgba(var(--av-brand-rgb),.06);border:1px solid rgba(var(--av-brand-rgb),.1)}
.av-contact-card h3{font-size:16px;font-weight:700;color:var(--av-brand);margin-bottom:16px}
.av-phones{display:flex;flex-direction:column;gap:10px;margin-bottom:12px}
.av-phone-link{display:flex;align-items:center;gap:8px;font-size:14px;color:#0a1628}
.av-phone-wa{color:#25D366}
.av-address{display:flex;align-items:flex-start;gap:8px;font-size:13px;color:#5a6b8a;margin-top:8px}
.av-working{display:flex;align-items:center;gap:8px;font-size:13px;color:#5a6b8a;margin-top:8px}
.av-social-bar{display:flex;gap:10px;margin-top:14px}
.av-social-link{font-size:18px;transition:opacity .2s}
.av-social-link:hover{opacity:.7}
.av-about-text{font-size:14px;color:#5a6b8a;line-height:1.7;margin-bottom:14px}
.av-services-list{list-style:none;display:flex;flex-direction:column;gap:6px;font-size:13px;color:#5a6b8a}
.av-services-list li::before{content:'✓  ';color:var(--av-brand);font-weight:700}
.av-supervisor{margin-top:14px;font-size:13px;color:#5a6b8a}
.av-supervisor a{color:var(--av-brand)}
.av-maps-embed{margin-top:16px}

/* FAQ */
.av-faq-list{max-width:740px;margin:0 auto;display:flex;flex-direction:column;gap:8px}
.av-faq-item{border-radius:8px;border:1.5px solid rgba(var(--av-brand-rgb),.12);background:#fff;overflow:hidden}
.av-faq-q{display:flex;align-items:center;justify-content:space-between;padding:16px 18px;cursor:pointer;gap:16px;font-size:14px;font-weight:600;color:var(--av-brand);user-select:none;transition:background .2s}
.av-faq-q:hover{background:#f4f7fc}
.av-faq-toggle{width:24px;height:24px;border-radius:50%;background:rgba(var(--av-brand-rgb),.08);display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:300;color:var(--av-brand);flex-shrink:0;transition:all .22s;line-height:1}
.av-faq-item.open .av-faq-toggle{background:var(--av-brand);color:#fff;transform:rotate(45deg)}
.av-faq-a{max-height:0;overflow:hidden;transition:max-height .35s cubic-bezier(0,1,0,1),padding .25s;padding:0 18px;font-size:14px;color:#5a6b8a;line-height:1.7}
.av-faq-item.open .av-faq-a{max-height:300px;padding:0 18px 16px;transition:max-height .45s cubic-bezier(.5,0,1,0),padding .25s}

/* Footer */
.av-footer{background:var(--av-footer-bg);color:${footerMuted};padding:52px 24px 22px}
.av-footer-grid{display:grid;grid-template-columns:2fr 1fr 1fr;gap:36px;margin-bottom:32px}
.av-footer-brand-name{font-size:17px;font-weight:700;color:${footerTextColor};margin-bottom:10px}
.av-footer-desc{font-size:13px;line-height:1.7;margin-bottom:16px}
.av-footer-social{display:flex;gap:10px}
.av-footer-col h4{font-size:11px;font-weight:700;color:${footerTextColor};text-transform:uppercase;letter-spacing:.8px;margin-bottom:14px}
.av-footer-col ul{list-style:none;display:flex;flex-direction:column;gap:8px}
.av-footer-col ul li a{font-size:13px;color:${footerDim};transition:color .2s}
.av-footer-col ul li a:hover{color:${footerTextColor}}
.av-footer-bottom{border-top:1px solid ${footerDivider};padding-top:16px;display:flex;align-items:center;justify-content:space-between;font-size:12px;color:${footerDim}}

/* Responsive */
@media(max-width:1100px){.av-dest-grid{grid-template-columns:repeat(3,1fr)}}
@media(max-width:900px){.av-why-grid{grid-template-columns:repeat(2,1fr)}.av-footer-grid{grid-template-columns:1fr 1fr}}
@media(max-width:680px){
  .av-dest-grid{grid-template-columns:repeat(2,1fr)}
  .av-reviews-grid{grid-template-columns:1fr}
  .av-review:nth-child(2){margin-top:0!important}
  .av-stats-grid{grid-template-columns:repeat(2,1fr)}
  .av-stat:nth-child(2){border-right:none}
  .av-stat:nth-child(3){border-top:1px solid rgba(255,255,255,.1)}
  .av-contact-grid{grid-template-columns:1fr}
  .av-footer-grid{grid-template-columns:1fr}
  .av-footer-bottom{flex-direction:column;gap:8px;text-align:center}
  .av-phone-display{display:none}
}
/* RTL */
[dir=rtl] .av-header-contacts{margin-left:0;margin-right:auto}
[dir=rtl] .av-footer-bottom{flex-direction:row-reverse}`;

  return { html, css };
}

// ── Asset helpers ─────────────────────────────────────────────────────────────
function readTemplateAsset(relativePath, encoding = null) {
  const assetPath = path.join(SITE_TEMPLATE_DIR, relativePath);
  if (!fs.existsSync(assetPath)) {
    const error = new Error(`Site template asset is missing: ${relativePath}`);
    error.code = 'SITE_TEMPLATE_ASSET_MISSING';
    error.assetPath = assetPath;
    error.templateDir = SITE_TEMPLATE_DIR;
    throw error;
  }
  return fs.readFileSync(assetPath, encoding);
}

function buildAgencyRuntimeConfig({ apiKey, subdomain }) {
  const siteUrl = `https://${subdomain}.${AVIAFRAME_DOMAIN}`;
  const runtimeConfig = {
    environment: 'production',
    backendUrl: BACKEND_URL,
    agencyKey: apiKey,
    moyasarPublicKey: DEFAULT_LIVE_MOYASAR_PUBLIC_KEY,
    siteOriginHost: `${subdomain}.${AVIAFRAME_DOMAIN}`,
    portalUrl: APP_URL,
    defaultDryRunIssue: false,
    showTestPaymentCards: false,
    enableCardFeePreview: true,
    enableOfferPriceFlow: true,
    paymentReturnUrl: `${siteUrl}/booking.html`
  };
  return `(() => {
  window.AVIAFRAME_RUNTIME_CONFIG = Object.assign(
    ${JSON.stringify(runtimeConfig, null, 2)},
    window.AVIAFRAME_RUNTIME_CONFIG || {}
  );
})();\n`;
}

function normalizeLandingHtml(html, { apiKey, assetVersion }) {
  if (!html) return '';
  let next = String(html);
  next = next.replace(/data-api-url="[^"]*"/g, `data-api-url="${BACKEND_URL}/webhook/drct/search"`);
  next = next.replace(/data-checkout-url="[^"]*"/g, 'data-checkout-url="/booking.html"');
  next = next.replace(/data-agency-key="[^"]*"/g, `data-agency-key="${apiKey}"`);
  next = next.replace(
    /<script\s+src=["'](?:\.\/)?\/?aviaframe-widget\.js(?:\?[^"']*)?["']><\/script>/gi,
    `<script src="/aviaframe-widget.js?v=${assetVersion}"></script>`
  );
  if (!/aviaframe-widget\.js\?v=/i.test(next) && /<\/body>/i.test(next)) {
    next = next.replace(/<\/body>/i, `  <script src="/aviaframe-widget.js?v=${assetVersion}"></script>\n</body>`);
  }
  return next;
}

function buildAgencyDeployFiles({ subdomain, apiKey, landingHtml, landingCss }) {
  const assetVersion = `agency-${subdomain}-${Date.now()}`;
  const normalizedLandingHtml = normalizeLandingHtml(landingHtml, { apiKey, assetVersion });
  const normalizedLandingCss = String(landingCss || '');

  const page404Html = `<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta http-equiv="refresh" content="3;url=/"><title>Page Not Found</title><style>body{font-family:system-ui,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f4f7fc;color:#0a1628;text-align:center}h1{font-size:2rem;font-weight:800;margin-bottom:8px}p{color:#5a6b8a;margin-bottom:24px}a{display:inline-block;padding:10px 24px;background:#1a3c8e;color:#fff;border-radius:8px;text-decoration:none;font-weight:600}</style></head><body><h1>Page Not Found</h1><p>Redirecting you to the home page...</p><a href="/">Go Home</a></body></html>`;

  return {
    'index.html': normalizedLandingHtml,
    '404.html': page404Html,
    'widget-demo.html': normalizedLandingHtml,
    'styles.css': normalizedLandingCss,
    'booking.html': readTemplateAsset('booking.html', 'utf8'),
    'config.js': buildAgencyRuntimeConfig({ apiKey, subdomain }),
    'aviaframe-widget.js': readTemplateAsset('aviaframe-widget.js', 'utf8'),
    'assets/style.css': readTemplateAsset('assets/style.css', 'utf8'),
    'images/favicon.svg': readTemplateAsset('images/favicon.svg'),
    'images/payments/mada-badge.png': readTemplateAsset('images/payments/mada-badge.png'),
    'images/payments/mada.png': readTemplateAsset('images/payments/mada.png')
  };
}

async function fetchExistingAgencySiteFiles(domain) {
  const baseUrl = `https://${domain}`;
  const [htmlResp, cssResp] = await Promise.all([
    axios.get(baseUrl, { responseType: 'text' }),
    axios.get(`${baseUrl}/styles.css`, { responseType: 'text' })
  ]);
  return {
    html: String(htmlResp.data || ''),
    css: String(cssResp.data || '')
  };
}

async function deployToNetlify({ subdomain, files }) {
  if (!NETLIFY_TOKEN) throw new Error('NETLIFY_TOKEN is not configured');

  const headers = {
    Authorization: `Bearer ${NETLIFY_TOKEN}`,
    'Content-Type': 'application/json'
  };

  const siteName = `aviaframe-${subdomain}`;
  const customDomain = `${subdomain}.aviaframe.com`;
  let siteId = null;
  let isNewSite = false;

  try {
    const listResp = await axios.get(`${NETLIFY_API}/sites?filter=all&name=${siteName}`, { headers });
    const existing = (listResp.data || []).find((s) => (
      s.name === siteName
      || s.custom_domain === customDomain
      || (Array.isArray(s.domain_aliases) && s.domain_aliases.includes(customDomain))
    ));
    if (existing) siteId = existing.id;
  } catch (_) {}

  if (!siteId) {
    try {
      const listResp = await axios.get(`${NETLIFY_API}/sites?filter=all`, { headers });
      const existing = (listResp.data || []).find((s) => (
        s.name === siteName
        || s.custom_domain === customDomain
        || (Array.isArray(s.domain_aliases) && s.domain_aliases.includes(customDomain))
      ));
      if (existing) siteId = existing.id;
    } catch (_) {}
  }

  if (!siteId) {
    // Create site WITHOUT force_ssl — Netlify returns 422 if you set force_ssl
    // before a certificate has been provisioned for the custom domain.
    const createResp = await axios.post(`${NETLIFY_API}/sites`, {
      name: siteName,
      account_slug: NETLIFY_TEAM_SLUG,
      custom_domain: customDomain
    }, { headers });
    siteId = createResp.data.id;
    isNewSite = true;
  }

  // Trigger SSL cert provisioning (idempotent — safe to call on existing sites too)
  try {
    await axios.post(`${NETLIFY_API}/sites/${siteId}/ssl`, {}, { headers });
  } catch (_) {}

  // For new sites: wait up to 90s for the cert to be issued, THEN enable force_ssl.
  // For existing sites: just enable force_ssl immediately (cert already issued).
  if (isNewSite) {
    const deadline = Date.now() + 90_000;
    let sslIssued = false;
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 5000));
      try {
        const statusResp = await axios.get(`${NETLIFY_API}/sites/${siteId}`, { headers });
        if (statusResp.data.ssl === true) { sslIssued = true; break; }
      } catch (_) {}
    }
    if (sslIssued) {
      try {
        await axios.put(`${NETLIFY_API}/sites/${siteId}`, { force_ssl: true }, { headers });
      } catch (_) {}
    }
  } else {
    try {
      await axios.put(`${NETLIFY_API}/sites/${siteId}`, { force_ssl: true }, { headers });
    } catch (_) {}
  }

  const zip = new JSZip();
  for (const [filePath, content] of Object.entries(files)) {
    zip.file(filePath, content);
  }
  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

  const deployResp = await axios.post(
    `${NETLIFY_API}/sites/${siteId}/deploys`,
    zipBuffer,
    {
      headers: {
        Authorization: `Bearer ${NETLIFY_TOKEN}`,
        'Content-Type': 'application/zip'
      }
    }
  );

  return {
    siteId,
    deployId: deployResp.data.id,
    siteUrl: `https://${subdomain}.aviaframe.com`
  };
}

async function findNetlifySiteBySubdomain(subdomain) {
  if (!NETLIFY_TOKEN) throw new Error('NETLIFY_TOKEN is not configured');

  const siteName = `aviaframe-${subdomain}`;
  const customDomain = `${subdomain}.aviaframe.com`;
  const headers = {
    Authorization: `Bearer ${NETLIFY_TOKEN}`,
    'Content-Type': 'application/json'
  };

  try {
    const listResp = await axios.get(`${NETLIFY_API}/sites?filter=all&name=${siteName}`, { headers });
    const existing = (listResp.data || []).find((s) => (
      s.name === siteName
      || s.custom_domain === customDomain
      || (Array.isArray(s.domain_aliases) && s.domain_aliases.includes(customDomain))
    ));
    if (existing) return existing;
  } catch (_) {}

  const listResp = await axios.get(`${NETLIFY_API}/sites?filter=all`, { headers });
  return (listResp.data || []).find((s) => (
    s.name === siteName
    || s.custom_domain === customDomain
    || (Array.isArray(s.domain_aliases) && s.domain_aliases.includes(customDomain))
  )) || null;
}

async function deleteNetlifySite({ subdomain }) {
  const existing = await findNetlifySiteBySubdomain(subdomain);
  if (!existing?.id) {
    return { deleted: false, missing: true };
  }

  const headers = {
    Authorization: `Bearer ${NETLIFY_TOKEN}`,
    'Content-Type': 'application/json'
  };

  await axios.delete(`${NETLIFY_API}/sites/${existing.id}`, { headers });
  return {
    deleted: true,
    siteId: existing.id,
    customDomain: existing.custom_domain || `${subdomain}.aviaframe.com`
  };
}

async function addGodaddyCname({ subdomain, netlifyAppName }) {
  if (!GODADDY_API_KEY || !GODADDY_API_SECRET) {
    console.warn('[dns] GODADDY_API_KEY not configured, skipping CNAME creation');
    return { skipped: true };
  }

  const cnameTarget = `${netlifyAppName}.netlify.app`;
  const headers = {
    Authorization: `sso-key ${GODADDY_API_KEY}:${GODADDY_API_SECRET}`,
    'Content-Type': 'application/json'
  };

  try {
    const check = await axios.get(
      `${GODADDY_API}/domains/${AVIAFRAME_DOMAIN}/records/CNAME/${subdomain}`,
      { headers, validateStatus: () => true }
    );
    if (check.status === 200 && check.data?.length > 0) {
      console.log(`[dns] CNAME ${subdomain}.${AVIAFRAME_DOMAIN} already exists`);
      return { created: false, existing: true };
    }
  } catch (_) {}

  await axios.patch(
    `${GODADDY_API}/domains/${AVIAFRAME_DOMAIN}/records`,
    [{ type: 'CNAME', name: subdomain, data: cnameTarget, ttl: 600 }],
    { headers }
  );

  console.log(`[dns] Created CNAME ${subdomain}.${AVIAFRAME_DOMAIN} → ${cnameTarget}`);
  return { created: true, cname: cnameTarget };
}

async function deleteGodaddyCname({ subdomain }) {
  if (!GODADDY_API_KEY || !GODADDY_API_SECRET) {
    console.warn('[dns] GODADDY_API_KEY not configured, skipping CNAME deletion');
    return { skipped: true };
  }

  const headers = {
    Authorization: `sso-key ${GODADDY_API_KEY}:${GODADDY_API_SECRET}`,
    'Content-Type': 'application/json'
  };

  const check = await axios.get(
    `${GODADDY_API}/domains/${AVIAFRAME_DOMAIN}/records/CNAME/${subdomain}`,
    { headers, validateStatus: () => true }
  );

  if (check.status === 404 || !Array.isArray(check.data) || check.data.length === 0) {
    return { deleted: false, missing: true };
  }

  await axios.delete(
    `${GODADDY_API}/domains/${AVIAFRAME_DOMAIN}/records/CNAME/${subdomain}`,
    { headers, validateStatus: () => true }
  );

  console.log(`[dns] Deleted CNAME ${subdomain}.${AVIAFRAME_DOMAIN}`);
  return { deleted: true };
}

module.exports = {
  generateAgencySiteFiles,
  buildAgencyDeployFiles,
  fetchExistingAgencySiteFiles,
  deployToNetlify,
  findNetlifySiteBySubdomain,
  deleteNetlifySite,
  addGodaddyCname,
  deleteGodaddyCname
};
