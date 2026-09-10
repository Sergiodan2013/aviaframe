/* AviaFrame — runtime content hydration.
 *
 * Loaded on every agency site page (injected by normalizeLandingHtml in
 * backend/src/services/agencyProvision.js, right after aviaframe-widget.js).
 * Fetches the agency's CURRENT settings from a public backend endpoint and
 * applies them to the DOM (colors, logo, phone/whatsapp/email, hero text,
 * about text, services, social links) on every page load.
 *
 * This is what lets an admin change these fields (via PATCH /api/admin/
 * agencies/:agencyId, which only writes to Supabase) and have the change go
 * live immediately — WITHOUT triggering a Netlify redeploy. The HTML that
 * was baked in at last deploy time is just the fallback shown for the
 * instant before this script finishes fetching (and if this script fails
 * for any reason — network hiccup, backend down — the baked-in content
 * stays visible, nothing breaks).
 *
 * Only domain changes and template/engine upgrades still require a real
 * redeploy (POST /api/admin/agencies/:id/redeploy-site).
 */
(function () {
  'use strict';

  function digitsOnly(value) {
    return String(value || '').replace(/\D/g, '');
  }

  function setText(el, text) {
    if (!el) return;
    el.textContent = text == null ? '' : String(text);
  }

  function setVisible(el, visible) {
    if (!el) return;
    if (visible) el.style.removeProperty('display');
    else el.style.display = 'none';
  }

  function clearChildren(el) {
    if (!el) return;
    while (el.firstChild) el.removeChild(el.firstChild);
  }

  function el(tag, opts) {
    const node = document.createElement(tag);
    opts = opts || {};
    if (opts.className) node.className = opts.className;
    if (opts.text != null) node.textContent = opts.text;
    if (opts.href != null) node.setAttribute('href', opts.href);
    if (opts.target) node.setAttribute('target', opts.target);
    if (opts.rel) node.setAttribute('rel', opts.rel);
    if (opts.ariaLabel) node.setAttribute('aria-label', opts.ariaLabel);
    return node;
  }

  function applyTheme(theme) {
    if (!theme) return;
    const root = document.documentElement.style;
    const map = {
      '--av-brand': theme.brand_color,
      '--av-brand-dark': theme.brand_dark,
      '--av-brand-rgb': theme.brand_rgb,
      '--av-accent': theme.accent_color,
      '--av-accent-rgb': theme.accent_rgb,
      '--av-header-bg': theme.header_bg,
      '--av-header-text': theme.header_text,
      '--av-header-logo': theme.header_logo,
      '--av-footer-bg': theme.footer_bg
    };
    Object.keys(map).forEach(function (key) {
      if (map[key]) root.setProperty(key, map[key]);
    });
  }

  function applyLogo(data) {
    const icon = document.getElementById('av-logo-icon');
    if (icon) {
      clearChildren(icon);
      if (data.logo_url) {
        icon.classList.add('av-logo-icon--img');
        const img = el('img', { className: 'av-logo-img' });
        img.setAttribute('src', data.logo_url);
        img.setAttribute('alt', data.agency_name || '');
        icon.appendChild(img);
      } else {
        icon.classList.remove('av-logo-icon--img');
        icon.appendChild(el('div', { className: 'av-logo-icon-text', text: data.logo_initial || 'A' }));
      }
    }
    setText(document.getElementById('av-logo-name'), data.agency_name);
    const ar = document.getElementById('av-logo-ar');
    setText(ar, data.agency_name_ar);
    setVisible(ar, Boolean(data.agency_name_ar));
  }

  function applyHeaderContacts(data) {
    const phone = document.getElementById('av-header-phone');
    setText(phone, data.contact_phone);
    setVisible(phone, Boolean(data.contact_phone));

    const waDigits = digitsOnly(data.whatsapp_phone || data.contact_phone);
    const wa = document.getElementById('av-header-wa');
    if (wa) {
      if (waDigits) wa.setAttribute('href', 'https://wa.me/' + waDigits);
      setVisible(wa, Boolean(waDigits));
    }
  }

  function applyHero(data) {
    const hero = document.getElementById('av-hero');
    if (hero) {
      if (data.hero_image_url) {
        hero.style.background = "linear-gradient(rgba(0,0,0,.58),rgba(0,0,0,.42)),url('" + data.hero_image_url + "') center/cover no-repeat";
      } else {
        hero.style.removeProperty('background');
      }
    }
    setText(document.getElementById('av-hero-h1'), data.hero_tagline);
    setText(document.getElementById('av-hero-sub'), data.hero_description);
  }

  function applyPhones(data) {
    const wrap = document.getElementById('av-phones');
    if (!wrap) return;
    clearChildren(wrap);

    const waDigits = digitsOnly(data.whatsapp_phone || data.contact_phone);
    if (waDigits && data.contact_phone) {
      const a = el('a', {
        className: 'av-phone-link av-phone-wa',
        href: 'https://wa.me/' + waDigits,
        target: '_blank',
        rel: 'noreferrer'
      });
      a.appendChild(el('span', { text: '\u{1F4AC}' }));
      a.appendChild(document.createTextNode(' ' + data.contact_phone));
      wrap.appendChild(a);
    } else if (data.contact_phone) {
      const div = el('div', { className: 'av-phone-link' });
      div.appendChild(el('span', { text: '\u{1F4DE}' }));
      div.appendChild(document.createTextNode(' ' + data.contact_phone));
      wrap.appendChild(div);
    }

    if (data.contact_phone2) {
      const div = el('div', { className: 'av-phone-link' });
      div.appendChild(el('span', { text: '\u{1F4DE}' }));
      div.appendChild(document.createTextNode(' ' + data.contact_phone2));
      wrap.appendChild(div);
    }

    if (data.contact_email) {
      const a = el('a', { className: 'av-phone-link', href: 'mailto:' + data.contact_email });
      a.appendChild(el('span', { text: '✉️' }));
      a.appendChild(document.createTextNode(' ' + data.contact_email));
      wrap.appendChild(a);
    }
  }

  function applyAddressAndHours(data) {
    const addr = document.getElementById('av-address');
    if (addr) {
      clearChildren(addr);
      addr.appendChild(el('span', { text: '\u{1F4CD}' }));
      addr.appendChild(document.createTextNode(' '));
      addr.appendChild(el('span', { text: data.address }));
      setVisible(addr, Boolean(data.address));
    }

    const working = document.getElementById('av-working');
    if (working) {
      clearChildren(working);
      working.appendChild(el('span', { text: '\u{1F550}' }));
      working.appendChild(document.createTextNode(' '));
      working.appendChild(el('span', { className: 'en-text', text: data.working_hours }));
      if (data.working_hours_ar) {
        const arSpan = el('span', { className: 'ar-text', text: data.working_hours_ar });
        arSpan.style.display = 'none';
        working.appendChild(arSpan);
      }
      setVisible(working, Boolean(data.working_hours));
    }
  }

  function applySocial(data) {
    const bar = document.getElementById('av-social-bar');
    if (!bar) return;
    clearChildren(bar);
    const social = data.social || {};
    const items = [
      { url: social.instagram, label: 'Instagram', emoji: '\u{1F4F8}' },
      { url: social.twitter, label: 'Twitter/X', emoji: '\u{1F426}' },
      { url: social.snapchat, label: 'Snapchat', emoji: '\u{1F47B}' },
      { url: social.facebook, label: 'Facebook', emoji: '\u{1F4D8}' }
    ];
    let any = false;
    items.forEach(function (item) {
      if (!item.url) return;
      any = true;
      bar.appendChild(el('a', {
        className: 'av-social-link',
        href: item.url,
        target: '_blank',
        rel: 'noreferrer',
        ariaLabel: item.label,
        text: item.emoji
      }));
    });
    setVisible(bar, any);
  }

  function applyAbout(data) {
    setText(document.getElementById('av-about-en'), data.about_en);
    setText(document.getElementById('av-about-ar'), data.about_ar);

    const list = document.getElementById('av-services-list');
    if (list) {
      clearChildren(list);
      const services = Array.isArray(data.services) ? data.services : [];
      services.forEach(function (s) {
        const li = document.createElement('li');
        li.appendChild(el('span', { className: 'en-text', text: s.en }));
        const ar = el('span', { className: 'ar-text', text: s.ar });
        ar.style.display = 'none';
        li.appendChild(ar);
        list.appendChild(li);
      });
      setVisible(list, services.length > 0);
    }

    const sup = document.getElementById('av-supervisor');
    if (sup) {
      clearChildren(sup);
      if (data.supervisor_name) {
        sup.appendChild(el('strong', { text: data.supervisor_name }));
        if (data.supervisor_email) {
          sup.appendChild(document.createTextNode(' · '));
          sup.appendChild(el('a', { href: 'mailto:' + data.supervisor_email, text: data.supervisor_email }));
        }
      }
      setVisible(sup, Boolean(data.supervisor_name));
    }
  }

  function applyLanguageDefault(data) {
    if (!data.default_language) return;
    try {
      if (localStorage.getItem('aviaframe_lang')) return;
    } catch (e) { return; }
    if (typeof window.avApplyLang === 'function') {
      window.avApplyLang(data.default_language === 'ar' ? 'ar' : 'en');
    }
  }

  function applyDisplayCurrency(data) {
    if (!data.default_display_currency) return;
    try {
      if (localStorage.getItem('aviaframe-display-currency')) return;
    } catch (e) { return; }
    if (window.AviaframeDisplayCurrency && typeof window.AviaframeDisplayCurrency.setSelectedCurrency === 'function') {
      window.AviaframeDisplayCurrency.setSelectedCurrency(data.default_display_currency);
    }
  }

  var GA_ID_RE = /^(G-[A-Z0-9]{6,12}|UA-\d{4,10}-\d{1,4})$/;
  var PIXEL_ID_RE = /^\d{10,20}$/;

  function applyAnalytics(data) {
    const gaId = String(data.ga_measurement_id || '').trim();
    if (gaId && GA_ID_RE.test(gaId) && !window.__avGaLoaded) {
      window.__avGaLoaded = true;
      const s1 = document.createElement('script');
      s1.async = true;
      s1.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(gaId);
      document.head.appendChild(s1);
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag('js', new Date());
      window.gtag('config', gaId);
    }

    const pixelId = String(data.meta_pixel_id || '').trim();
    if (pixelId && PIXEL_ID_RE.test(pixelId) && !window.__avPixelLoaded) {
      window.__avPixelLoaded = true;
      (function (f, b, e, v) {
        if (f.fbq) return;
        var n = f.fbq = function () {
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n;
        n.push = n; n.loaded = true; n.version = '2.0'; n.queue = [];
        var t = b.createElement(e); t.async = true; t.src = v;
        var s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
      })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
      window.fbq('init', pixelId);
      window.fbq('track', 'PageView');
    }
  }

  function applyAll(data) {
    try { applyTheme(data.theme); } catch (e) { /* non-fatal */ }
    try { applyLogo(data); } catch (e) { /* non-fatal */ }
    try { applyHeaderContacts(data); } catch (e) { /* non-fatal */ }
    try { applyHero(data); } catch (e) { /* non-fatal */ }
    try { applyPhones(data); } catch (e) { /* non-fatal */ }
    try { applyAddressAndHours(data); } catch (e) { /* non-fatal */ }
    try { applySocial(data); } catch (e) { /* non-fatal */ }
    try { applyAbout(data); } catch (e) { /* non-fatal */ }
    try { applyLanguageDefault(data); } catch (e) { /* non-fatal */ }
    try { applyDisplayCurrency(data); } catch (e) { /* non-fatal */ }
    try { applyAnalytics(data); } catch (e) { /* non-fatal */ }
  }

  function getSubdomain() {
    const cfg = window.AVIAFRAME_RUNTIME_CONFIG || {};
    const host = cfg.siteOriginHost || window.location.hostname || '';
    return String(host).split('.')[0];
  }

  function run() {
    const cfg = window.AVIAFRAME_RUNTIME_CONFIG || {};
    const backendUrl = cfg.backendUrl;
    const subdomain = getSubdomain();
    if (!backendUrl || !subdomain) return;

    fetch(backendUrl + '/public/agencies/' + encodeURIComponent(subdomain) + '/content', {
      credentials: 'omit'
    })
      .then(function (resp) { return resp.ok ? resp.json() : null; })
      .then(function (data) {
        if (data) applyAll(data);
      })
      .catch(function () {
        // Network/backend hiccup — the statically-baked content from the last
        // deploy stays visible. Never let this break the page.
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
