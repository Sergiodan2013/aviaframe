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
function resolveSiteTemplateDir() {
  const candidates = [
    path.resolve(__dirname, '../../agency-site-assets'),   // /app/agency-site-assets (Docker)
    path.resolve(__dirname, '../agency-site-assets'),      // local dev: src/agency-site-assets
    path.resolve(__dirname, '../../../aviaframe-site'),
    path.resolve(__dirname, '../../aviaframe-site'),
    path.resolve(process.cwd(), 'aviaframe-site'),
    path.resolve(process.cwd(), '../aviaframe-site'),
    '/app/aviaframe-site'
  ];

  return candidates.find((candidate) => {
    try {
      return fs.existsSync(path.join(candidate, 'booking.html'));
    } catch (_) {
      return false;
    }
  }) || candidates[0];
}

const SITE_TEMPLATE_DIR = resolveSiteTemplateDir();
const DEFAULT_LIVE_MOYASAR_PUBLIC_KEY = process.env.MOYASAR_PUBLIC_KEY
  || process.env.MOYASAR_PUBLISHABLE_KEY
  || 'pk_live_iXhEB7xrWqPoh2SMRBt45fA73mVoKKa8EjZt5end';

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
    services = []
  } = opts;

  // Determine which services to show — use provided list or default to first 8
  const defaultServices = ['flights_domestic', 'flights_intl', 'hotels', 'visa', 'insurance', 'umrah', 'tours', 'corporate'];
  const activeServices = services.length > 0 ? services : defaultServices;
  const serviceList = ALL_SERVICES.filter(s => activeServices.includes(s.key));

  const effectiveAboutEn = aboutEn || `${agencyName} is your trusted travel partner. Our professional team offers flight bookings, hotel reservations, visa assistance, and full travel packages for individuals, families, and corporate clients — with personal service you can count on.`;
  const effectiveAboutAr = aboutAr || `${agencyNameAr || agencyName} هي شريككم الموثوق في السفر. يقدم فريقنا المحترف حجز رحلات وفنادق، ومساعدة في التأشيرة، وباقات سفر كاملة للأفراد والعائلات والشركات.`;

  const waPhone = (whatsappPhone || contactPhone).replace(/\D/g, '');

  const logoHtml = logoUrl
    ? `<img class="agency-logo" src="${logoUrl}" alt="${agencyName} logo" />`
    : '';

  // Normalize social handle/URL: prepend platform base if no protocol given
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

  const socialHtml = [
    igUrl ? `<a class="social-link" href="${igUrl}" target="_blank" rel="noreferrer" aria-label="Instagram"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg></a>` : '',
    twUrl ? `<a class="social-link" href="${twUrl}" target="_blank" rel="noreferrer" aria-label="Twitter/X"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.738l7.724-8.842L1.254 2.25H8.08l4.213 5.57 5.951-5.57zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></a>` : '',
    scUrl ? `<a class="social-link" href="${scUrl}" target="_blank" rel="noreferrer" aria-label="Snapchat"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12.166.009C9.68.009 5.824 1.116 4.8 5.496c-.253 1.084-.199 2.21-.172 3.298l-.013.034c-.097.003-.211.005-.344.005-.54 0-1.092-.1-1.64-.297l-.09-.032a.664.664 0 00-.196-.03c-.38 0-.696.264-.696.623 0 .313.228.579.568.647.042.008 1.044.234 1.527 1.066.054.093.107.196.161.309.357.759.44 1.38.266 1.843-.276.726-1.308 1.27-2.2 1.73l-.084.044c-.396.207-.8.42-.996.72a1.33 1.33 0 00-.178.664c0 .447.225.82.564.982.187.09.396.104.6.104.24 0 .475-.043.693-.087l.14-.028a5.8 5.8 0 011.13-.127c.26 0 .505.022.728.065.452.086.822.297 1.132.644.564.63 1.098 1.914 2.95 2.54.282.096.58.168.894.215.073.01.147.033.147.107 0 .086-.09.147-.159.196-.253.178-.742.44-.742.886 0 .406.346.703.78.703.096 0 .196-.016.287-.048.35-.117.77-.184 1.193-.184.434 0 .849.066 1.233.197.35.12.67.183.951.183.503 0 .914-.223.914-.664 0-.414-.427-.66-.677-.845-.076-.055-.163-.123-.163-.207 0-.077.078-.1.154-.111.313-.047.61-.12.89-.215 1.85-.626 2.384-1.91 2.948-2.54.31-.347.681-.558 1.131-.644.224-.043.468-.065.728-.065.387 0 .776.05 1.13.127l.14.028c.218.044.453.087.694.087.204 0 .413-.013.599-.104.34-.162.565-.535.565-.982 0-.234-.06-.46-.178-.664-.196-.3-.6-.513-.996-.72l-.084-.044c-.892-.46-1.924-1.004-2.2-1.73-.174-.463-.091-1.084.266-1.843.054-.113.107-.216.16-.309.484-.832 1.486-1.058 1.528-1.066.34-.068.568-.334.568-.647 0-.36-.316-.623-.697-.623a.664.664 0 00-.195.03l-.09.032c-.549.197-1.1.297-1.64.297-.134 0-.248-.002-.345-.005l-.013-.034c.027-1.088.081-2.214-.172-3.298C18.176 1.116 14.32.009 12.166.009z"/></svg></a>` : '',
    fbUrl ? `<a class="social-link" href="${fbUrl}" target="_blank" rel="noreferrer" aria-label="Facebook"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg></a>` : ''
  ].filter(Boolean).join('\n          ');

  const trustHtml = [
    licenseNumber ? `<div class="trust-item"><span class="trust-label">License / CR:</span> <span>${licenseNumber}</span></div>` : '',
    iataNumber ? `<div class="trust-item"><span class="trust-label">IATA:</span> <span>${iataNumber}</span></div>` : '',
    foundedYear ? `<div class="trust-item"><span class="trust-label">Est.</span> <span>${foundedYear}</span></div>` : ''
  ].filter(Boolean).join('\n');

  const servicesListHtml = serviceList.map(s =>
    `<li><span class="en-text">${s.en}</span><span class="ar-text" style="display:none">${s.ar}</span></li>`
  ).join('\n          ');

  const mapsHtml = googleMapsUrl
    ? `<div class="maps-embed"><iframe src="${googleMapsUrl}" width="100%" height="220" style="border:0;border-radius:10px" allowfullscreen loading="lazy"></iframe></div>`
    : '';

  const i18nServicesEn = serviceList.map(s => `'${s.key}': '${s.en}'`).join(', ');
  const i18nServicesAr = serviceList.map(s => `'${s.key}': '${s.ar}'`).join(', ');

  const html = `<!doctype html>
<html lang="${language}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${agencyName} | AviaFrame</title>
  <link rel="stylesheet" href="./styles.css" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap">
  <style>
    :root { --brand: ${brandColor}; --accent: ${accentColor}; }
    .header { background: var(--brand); }
    .hero { background: linear-gradient(135deg, var(--brand) 0%, var(--accent) 100%); }
    .btn-primary { background: var(--accent); }
  </style>
</head>
<body>
  <header class="header">
    <div class="lang-switcher">
      <button class="lang-opt active" data-lang="en" onclick="applyLang('en')">EN</button>
      <button class="lang-opt" data-lang="ar" onclick="applyLang('ar')">عر</button>
    </div>
    <div class="container header-inner">
      ${logoHtml}
      <div class="header-text">
        ${agencyNameAr ? `<div class="brand-arabic">${agencyNameAr}</div>` : ''}
        <div class="brand-name">${agencyName}</div>
      </div>
      ${contactPhone ? `<div class="contact-mini">${contactPhone}${contactPhone2 ? ' · ' + contactPhone2 : ''}</div>` : ''}
    </div>
  </header>

  <section class="widget-first">
    <div class="container">
      <div class="widget-main">
        <h2 class="widget-title">
          <span class="en-text">Find the Best Flight Deals Now</span>
          <span class="ar-text" style="display:none">ابحث عن أفضل صفقات الطيران الآن</span>
        </h2>
        <p class="widget-subtitle">
          <span class="en-text">Powered by AviaFrame search. Compare options and book with confidence.</span>
          <span class="ar-text" style="display:none">مدعوم من بحث أفيافريم. قارن الخيارات واحجز بثقة.</span>
        </p>
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
  </section>

  <section class="hero">
    <div class="container hero-grid">
      <article class="hero-card">
        <span class="badge">${subdomain}.aviaframe.com</span>
        <h1>
          <span class="en-text">Reliable Flight Booking &amp; Complete Travel Services</span>
          <span class="ar-text" style="display:none">حجز رحلات موثوق وخدمات سفر متكاملة</span>
        </h1>
        <p class="lead">
          <span class="en-text">${effectiveAboutEn}</span>
          <span class="ar-text" style="display:none">${effectiveAboutAr}</span>
        </p>
        ${trustHtml ? `<div class="trust-bar">${trustHtml}</div>` : ''}
      </article>
      <aside class="hero-card">
        <h3 class="side-title">
          <span class="en-text">Our Services</span>
          <span class="ar-text" style="display:none">خدماتنا</span>
        </h3>
        <ul class="clean-list">
          ${servicesListHtml}
        </ul>
      </aside>
    </div>
  </section>

  <main class="main">
    <div class="container main-grid">
      <article class="info-card">
        <h2><span class="en-text">Contact</span><span class="ar-text" style="display:none">التواصل</span></h2>
        <div class="phones">
          ${waPhone ? `<a class="phone phone-wa" href="https://wa.me/${waPhone}" target="_blank" rel="noreferrer">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            ${contactPhone}
          </a>` : ''}
          ${contactPhone2 ? `<div class="phone">📞 ${contactPhone2}</div>` : ''}
          ${contactEmail ? `<a class="phone phone-email" href="mailto:${contactEmail}">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            ${contactEmail}
          </a>` : ''}
        </div>
        ${address ? `<div class="address">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
          ${address}
        </div>` : ''}
        ${workingHours ? `<div class="working-hours">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span class="en-text">${workingHours}</span>
          ${workingHoursAr ? `<span class="ar-text" style="display:none">${workingHoursAr}</span>` : ''}
        </div>` : ''}
        ${socialHtml ? `<div class="social-bar">${socialHtml}</div>` : ''}
      </article>

      ${supervisorName ? `<article class="info-card">
        <h2><span class="en-text">Office Supervisor</span><span class="ar-text" style="display:none">مشرف المكتب</span></h2>
        <div class="manager-card">
          <div class="manager-name">${supervisorName}</div>
          ${supervisorEmail ? `<div class="manager-contact"><a href="mailto:${supervisorEmail}">${supervisorEmail}</a></div>` : ''}
        </div>
      </article>` : ''}
    </div>

    ${mapsHtml ? `<div class="container" style="margin-top:24px">${mapsHtml}</div>` : ''}
  </main>

  <footer class="footer">
    <div class="container footer-inner">
      <div>
        <strong>${agencyName}</strong>
        ${agencyNameAr ? `<br>${agencyNameAr}` : ''}
      </div>
      ${contactPhone ? `<div>${contactPhone}${contactPhone2 ? ' • ' + contactPhone2 : ''}</div>` : ''}
      <div class="subdomain-note">Host: ${subdomain}.aviaframe.com</div>
    </div>
  </footer>

  <script src="/aviaframe-widget.js"></script>
  <script>
    var currentLang = localStorage.getItem('aviaframe_lang') || '${language}';
    function applyLang(lang) {
      currentLang = lang;
      localStorage.setItem('aviaframe_lang', lang);
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
      document.querySelectorAll('.en-text').forEach(function(el){ el.style.display = lang==='ar'?'none':''; });
      document.querySelectorAll('.ar-text').forEach(function(el){ el.style.display = lang==='ar'?'':'none'; });
      document.querySelectorAll('.lang-opt').forEach(function(btn){
        var isActive = btn.dataset.lang === lang;
        btn.style.background = isActive ? 'rgba(255,255,255,0.3)' : 'transparent';
        btn.style.color = isActive ? '#fff' : 'rgba(255,255,255,0.65)';
        btn.style.fontWeight = isActive ? '800' : '600';
      });
    }
    applyLang(currentLang);
  </script>
</body>
</html>`;

  const css = `*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Cairo',sans-serif;background:#f8f9fb;color:#1a1a2e;line-height:1.6}
.container{max-width:1100px;margin:0 auto;padding:0 20px}
.header{color:#fff;padding:16px 0}
.header-inner{display:flex;align-items:center;gap:16px;flex-wrap:wrap}
.agency-logo{height:48px;width:auto;object-fit:contain;flex-shrink:0}
.header-text{display:flex;flex-direction:column;gap:2px}
.brand-name{font-size:1.1rem;font-weight:700;color:#fff}
.brand-arabic{font-size:1.2rem;font-weight:800;color:rgba(255,255,255,.9)}
.contact-mini{font-size:.85rem;color:rgba(255,255,255,.8);margin-inline-start:auto}
.lang-switcher{position:fixed;top:12px;right:16px;display:flex;gap:6px;z-index:999}
.lang-opt{border:1px solid rgba(255,255,255,.4);border-radius:6px;padding:4px 10px;cursor:pointer;font-size:.82rem;font-family:'Cairo',sans-serif;transition:all .2s;background:transparent;color:rgba(255,255,255,.65);font-weight:600}
.widget-first{background:#fff;padding:40px 0 20px}
.widget-main{max-width:800px;margin:0 auto}
.widget-title{font-size:1.6rem;font-weight:800;color:#1a1a2e;margin-bottom:8px}
.widget-subtitle{color:#666;margin-bottom:24px}
.hero{color:#fff;padding:60px 0}
.hero-grid{display:grid;grid-template-columns:1fr 1fr;gap:32px}
@media(max-width:700px){.hero-grid{grid-template-columns:1fr}}
.hero-card{background:rgba(255,255,255,.12);border-radius:16px;padding:28px}
.badge{display:inline-block;background:rgba(255,255,255,.2);border-radius:20px;padding:4px 14px;font-size:.8rem;margin-bottom:12px}
h1{font-size:1.7rem;font-weight:800;margin-bottom:16px}
.lead{font-size:1rem;opacity:.9;line-height:1.7;margin-bottom:16px}
.trust-bar{display:flex;gap:16px;flex-wrap:wrap;margin-top:8px}
.trust-item{font-size:.82rem;opacity:.85;background:rgba(255,255,255,.15);border-radius:6px;padding:3px 10px}
.trust-label{font-weight:700}
.side-title{font-size:1.1rem;font-weight:700;margin-bottom:14px}
.clean-list{list-style:none;display:flex;flex-direction:column;gap:8px}
.clean-list li::before{content:'✓  ';opacity:.8}
.main{padding:48px 0}
.main-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px}
@media(max-width:700px){.main-grid{grid-template-columns:1fr}}
.info-card{background:#fff;border-radius:16px;padding:28px;box-shadow:0 2px 12px rgba(0,0,0,.06)}
.info-card h2{font-size:1.1rem;font-weight:700;margin-bottom:16px;color:#1a1a2e}
.phones{display:flex;flex-direction:column;gap:10px;margin-bottom:12px}
.phone{display:flex;align-items:center;gap:8px;font-size:.95rem;color:#1a1a2e;text-decoration:none}
.phone-wa{color:#25d366}
.phone-email{color:#2468c4}
.address{display:flex;align-items:flex-start;gap:8px;font-size:.9rem;color:#555;margin-top:10px;line-height:1.5}
.working-hours{display:flex;align-items:center;gap:8px;font-size:.9rem;color:#555;margin-top:8px}
.social-bar{display:flex;gap:12px;margin-top:16px}
.social-link{color:#666;transition:color .2s}
.social-link:hover{color:#1a3c8e}
.maps-embed{margin-top:8px}
.manager-card{background:#f8f9fb;border-radius:10px;padding:16px}
.manager-name{font-size:1rem;font-weight:700;margin-bottom:4px}
.manager-contact a{color:#2468c4;font-size:.9rem;text-decoration:none}
.footer{background:#1a1a2e;color:#ccc;padding:28px 0;margin-top:48px}
.footer-inner{display:flex;gap:32px;flex-wrap:wrap;align-items:flex-start;font-size:.88rem}
.footer-inner strong{color:#fff}
.subdomain-note{margin-inline-start:auto;opacity:.5;font-size:.78rem}
[dir=rtl] .contact-mini{margin-inline-start:0;margin-inline-end:auto}
[dir=rtl] .lang-switcher{right:auto;left:16px}`;

  return { html, css };
}

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

  return {
    'index.html': normalizedLandingHtml,
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
    const createResp = await axios.post(`${NETLIFY_API}/sites`, {
      name: siteName,
      account_slug: NETLIFY_TEAM_SLUG,
      custom_domain: customDomain
    }, { headers });
    siteId = createResp.data.id;
  }

  const zip = new JSZip();
  for (const [path, content] of Object.entries(files)) {
    zip.file(path, content);
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

  try {
    await axios.put(`${NETLIFY_API}/sites/${siteId}`, { force_ssl: true }, { headers });
  } catch (_) {}
  try {
    await axios.post(`${NETLIFY_API}/sites/${siteId}/ssl`, {}, { headers });
  } catch (_) {}

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

/**
 * Add CNAME record to GoDaddy DNS: subdomain.aviaframe.com → netlify-site.netlify.app
 */
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

  // Check if record already exists
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
