(() => {
  const STORAGE_KEY = 'aviaframe-display-currency';
  const DEFAULT_SAR_PER_UNIT = {
    SAR: 1,
    USD: 3.75,
    EUR: 4.33,
    // Used only until the ECB snapshot is available; live rates replace it.
    UAH: 0.09,
  };
  const SWITCHER_ATTR = 'data-aviaframe-display-currency-switcher';
  const NOTE_CLASS = 'av-display-currency-note';
  const state = {
    rates: null,
    selectedCurrency: null,
    listeners: new Set(),
    bootstrapped: false,
  };

  function getRuntime() {
    return window.AVIAFRAME_RUNTIME_CONFIG || {};
  }

  function isEnabled() {
    return getRuntime().displayCurrencyEnabled !== false;
  }

  function getSupportedCurrencies() {
    const runtimeList = Array.isArray(getRuntime().supportedDisplayCurrencies)
      ? getRuntime().supportedDisplayCurrencies
      : ['SAR', 'USD', 'EUR'];
    const normalized = runtimeList
      .map((value) => String(value || '').trim().toUpperCase())
      .filter(Boolean);
    return Array.from(new Set(normalized)).filter((currency) => DEFAULT_SAR_PER_UNIT[currency]);
  }

  function getDefaultCurrency() {
    const runtimeCurrency = String(getRuntime().defaultDisplayCurrency || 'SAR').trim().toUpperCase();
    return getSupportedCurrencies().includes(runtimeCurrency) ? runtimeCurrency : 'SAR';
  }

  function readStoredCurrency() {
    try {
      return String(localStorage.getItem(STORAGE_KEY) || '').trim().toUpperCase();
    } catch (_) {
      return '';
    }
  }

  function persistCurrency(currency) {
    try {
      localStorage.setItem(STORAGE_KEY, currency);
    } catch (_) {}
  }

  function getSelectedCurrency() {
    if (state.selectedCurrency && getSupportedCurrencies().includes(state.selectedCurrency)) {
      return state.selectedCurrency;
    }
    const stored = readStoredCurrency();
    state.selectedCurrency = getSupportedCurrencies().includes(stored) ? stored : getDefaultCurrency();
    return state.selectedCurrency;
  }

  function getSourceCurrencyRate(currency) {
    const normalized = String(currency || '').trim().toUpperCase();
    const source = state.rates?.rates?.[normalized];
    const sarPerUnit = Number(source?.sar_per_unit);
    if (Number.isFinite(sarPerUnit) && sarPerUnit > 0) return sarPerUnit;
    return DEFAULT_SAR_PER_UNIT[normalized] || DEFAULT_SAR_PER_UNIT.SAR;
  }

  function convertAmount(amount, sourceCurrency, targetCurrency = getSelectedCurrency()) {
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount)) return 0;

    const source = String(sourceCurrency || 'SAR').trim().toUpperCase();
    const target = String(targetCurrency || getSelectedCurrency()).trim().toUpperCase();
    const amountInSar = numericAmount * getSourceCurrencyRate(source);
    return amountInSar / getSourceCurrencyRate(target);
  }

  function formatAmount(amount, sourceCurrency, options = {}) {
    const converted = convertAmount(amount, sourceCurrency, getSelectedCurrency());
    const minimumFractionDigits = Number.isInteger(options.minimumFractionDigits)
      ? options.minimumFractionDigits
      : 0;
    const maximumFractionDigits = Number.isInteger(options.maximumFractionDigits)
      ? options.maximumFractionDigits
      : 0;
    return `${Number(converted || 0).toLocaleString('en-US', {
      minimumFractionDigits,
      maximumFractionDigits,
    })} ${getSelectedCurrency()}`;
  }

  function getDisplayNoteHtml(sourceCurrency, options = {}) {
    const source = String(sourceCurrency || '').trim().toUpperCase();
    const target = getSelectedCurrency();
    if (!source || source === target) return '';
    const copy = options.compact
      ? `Displayed in ${target} · charged in ${source}`
      : `Prices are displayed in ${target}. Final airline charge and payment settlement stay in ${source}.`;
    return `<div class="${NOTE_CLASS}">${copy}</div>`;
  }

  function notifyCurrencyChange() {
    const selected = getSelectedCurrency();
    document.querySelectorAll(`[${SWITCHER_ATTR}] [data-display-currency-option]`).forEach((button) => {
      const isActive = button.getAttribute('data-display-currency-option') === selected;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
    state.listeners.forEach((listener) => {
      try {
        listener(selected);
      } catch (_) {}
    });
  }

  function setSelectedCurrency(currency) {
    const normalized = String(currency || '').trim().toUpperCase();
    if (!getSupportedCurrencies().includes(normalized)) return;
    state.selectedCurrency = normalized;
    persistCurrency(normalized);
    notifyCurrencyChange();
    if (typeof window.__aviaframeWidgetCurrencyRefresh === 'function') {
      window.__aviaframeWidgetCurrencyRefresh();
    }
    if (typeof window.__aviaframeBookingCurrencyRefresh === 'function') {
      window.__aviaframeBookingCurrencyRefresh();
    }
  }

  function subscribe(listener) {
    if (typeof listener !== 'function') return () => {};
    state.listeners.add(listener);
    return () => state.listeners.delete(listener);
  }

  function injectBaseStyles() {
    if (document.getElementById('aviaframe-display-currency-styles')) return;
    const style = document.createElement('style');
    style.id = 'aviaframe-display-currency-styles';
    style.textContent = `
      [${SWITCHER_ATTR}] {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
        margin: 0 0 16px;
        padding: 12px 14px;
        border: 1px solid rgba(148, 163, 184, 0.28);
        background: rgba(255, 255, 255, 0.85);
        border-radius: 14px;
        box-shadow: 0 8px 20px rgba(15, 23, 42, 0.06);
      }
      [${SWITCHER_ATTR}] .av-currency-label {
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: #64748b;
      }
      [${SWITCHER_ATTR}] .av-currency-options {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }
      [${SWITCHER_ATTR}] [data-display-currency-option] {
        border: 1px solid #cbd5e1;
        border-radius: 999px;
        background: #fff;
        color: #334155;
        font-size: 13px;
        font-weight: 700;
        line-height: 1;
        padding: 9px 14px;
        cursor: pointer;
      }
      [${SWITCHER_ATTR}] [data-display-currency-option].is-active {
        background: #2563eb;
        border-color: #2563eb;
        color: #fff;
        box-shadow: 0 8px 18px rgba(37, 99, 235, 0.2);
      }
      [${SWITCHER_ATTR}] .av-currency-hint {
        font-size: 12px;
        color: #64748b;
      }
      .${NOTE_CLASS} {
        margin-top: 10px;
        font-size: 12px;
        line-height: 1.55;
        color: #475569;
      }
    `;
    document.head.appendChild(style);
  }

  function buildSwitcher() {
    const wrapper = document.createElement('div');
    wrapper.setAttribute(SWITCHER_ATTR, 'true');
    wrapper.innerHTML = `
      <span class="av-currency-label">Display currency</span>
      <div class="av-currency-options">
        ${getSupportedCurrencies().map((currency) => (
          `<button type="button" data-display-currency-option="${currency}" aria-pressed="false">${currency}</button>`
        )).join('')}
      </div>
      <span class="av-currency-hint">Search and booking totals are visual only. Settlement stays in the airline/payment source currency.</span>
    `;
    wrapper.querySelectorAll('[data-display-currency-option]').forEach((button) => {
      button.addEventListener('click', () => setSelectedCurrency(button.getAttribute('data-display-currency-option')));
    });
    return wrapper;
  }

  function injectSwitcherUi() {
    if (!isEnabled()) return;
    const existing = document.querySelector(`[${SWITCHER_ATTR}]`);
    if (existing) return;

    const widget = document.getElementById('aviaframe-widget');
    const bookingWrap = document.querySelector('.wrap');
    const nav = document.querySelector('.nav');
    const host = widget || nav || bookingWrap;
    if (!host) return;

    const switcher = buildSwitcher();
    if (widget && widget.parentNode) {
      widget.parentNode.insertBefore(switcher, widget);
    } else if (nav && nav.parentNode) {
      nav.insertAdjacentElement('afterend', switcher);
    } else if (bookingWrap) {
      bookingWrap.insertAdjacentElement('afterbegin', switcher);
    }
    notifyCurrencyChange();
  }

  function refreshInjectedUi() {
    injectSwitcherUi();
  }

  async function fetchRates() {
    const backendUrl = String(getRuntime().backendUrl || '').trim();
    if (!backendUrl) return;
    try {
      const response = await fetch(`${backendUrl.replace(/\/$/, '')}/public/fx-rates`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) return;
      const payload = await response.json();
      if (!payload || typeof payload !== 'object' || !payload.rates) return;
      state.rates = payload;
    } catch (_) {}
  }

  async function bootstrap() {
    if (state.bootstrapped) return;
    state.bootstrapped = true;
    injectBaseStyles();
    getSelectedCurrency();
    injectSwitcherUi();
    await fetchRates();
    notifyCurrencyChange();
  }

  window.AviaframeDisplayCurrency = {
    convertAmount,
    formatAmount,
    getSelectedCurrency,
    getSupportedCurrencies,
    getDisplayNoteHtml,
    refreshInjectedUi,
    setSelectedCurrency,
    subscribe,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
  } else {
    bootstrap();
  }
})();
