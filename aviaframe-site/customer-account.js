(function () {
  const AUTH_STYLE_ID = 'aviaframe-customer-auth-style';
  const AUTH_REDIRECT_KEY = 'aviaframe_post_auth_redirect';
  const AUTH_REDIRECT_TTL_MS = 30 * 60 * 1000;
  const AUTH_CDN_URL = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

  const state = {
    initPromise: null,
    client: null,
    session: null,
    user: null,
    profile: null,
    accessToken: null,
    lastError: null,
    authListenerAttached: false,
    stylesInjected: false,
  };

  function getRuntimeConfig() {
    return window.AVIAFRAME_RUNTIME_CONFIG || window.__AVIAFRAME_SITE_CONFIG__ || {};
  }

  function getBackendBaseUrl() {
    return String(getRuntimeConfig().backendUrl || '').replace(/\/+$/, '');
  }

  function getSupabaseConfig() {
    const runtime = getRuntimeConfig();
    return {
      url: String(runtime.supabaseUrl || '').trim(),
      anonKey: String(runtime.supabaseAnonKey || '').trim(),
    };
  }

  function isConfigured() {
    const cfg = getSupabaseConfig();
    return Boolean(cfg.url && cfg.anonKey);
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function cleanRedirectUrl(rawUrl) {
    const currentUrl = new URL(window.location.href);
    const candidate = new URL(rawUrl || currentUrl.toString(), currentUrl.origin);
    // Customer auth must never turn an arbitrary caller-supplied URL into an
    // external post-login redirect.
    const url = candidate.origin === currentUrl.origin ? candidate : currentUrl;
    [
      'code',
      'type',
      'error',
      'error_code',
      'error_description',
      'provider_token',
      'provider_refresh_token',
      'refresh_token',
      'token_type',
      'expires_in',
      'expires_at',
    ].forEach((key) => url.searchParams.delete(key));

    if (url.hash && /access_token|refresh_token|type=/.test(url.hash)) {
      url.hash = '';
    }

    return url.toString();
  }

  function savePostAuthRedirect(pathname) {
    if (!pathname) return;
    try {
      const target = cleanRedirectUrl(pathname);
      const payload = JSON.stringify({ target, createdAt: Date.now() });
      // localStorage survives opening an email magic link in a new tab.
      localStorage.setItem(AUTH_REDIRECT_KEY, payload);
      sessionStorage.setItem(AUTH_REDIRECT_KEY, payload);
    } catch (_) {}
  }

  function readPostAuthRedirect() {
    try {
      const raw = localStorage.getItem(AUTH_REDIRECT_KEY) || sessionStorage.getItem(AUTH_REDIRECT_KEY);
      if (!raw) return '';
      const payload = JSON.parse(raw);
      if (!payload?.target || !Number.isFinite(payload.createdAt) || Date.now() - payload.createdAt > AUTH_REDIRECT_TTL_MS) {
        clearPostAuthRedirect();
        return '';
      }
      return cleanRedirectUrl(payload.target);
    } catch (_) {
      return '';
    }
  }

  function clearPostAuthRedirect() {
    try {
      localStorage.removeItem(AUTH_REDIRECT_KEY);
      sessionStorage.removeItem(AUTH_REDIRECT_KEY);
    } catch (_) {}
  }

  function injectStyles() {
    if (state.stylesInjected || document.getElementById(AUTH_STYLE_ID)) {
      state.stylesInjected = true;
      return;
    }

    const style = document.createElement('style');
    style.id = AUTH_STYLE_ID;
    style.textContent = `
      .af-auth-toolbar {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
      }
      .af-auth-email {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        min-height: 40px;
        max-width: min(42vw, 320px);
        padding: 0 14px;
        border-radius: 999px;
        border: 1px solid rgba(37, 99, 235, 0.18);
        background: linear-gradient(180deg, #eef4ff 0%, #e3edff 100%);
        color: #0f172a;
        font-size: 13px;
        font-weight: 700;
      }
      .af-auth-email-label {
        color: #475569;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        white-space: nowrap;
      }
      .af-auth-email-value {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: #1d4ed8;
      }
      .af-auth-btn,
      .af-auth-link {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 42px;
        padding: 0 14px;
        border-radius: 999px;
        border: 1px solid rgba(148, 163, 184, 0.28);
        background: rgba(255, 255, 255, 0.96);
        color: #0f172a;
        font-size: 13px;
        font-weight: 800;
        text-decoration: none;
        cursor: pointer;
        transition: 0.16s ease;
      }
      .af-auth-btn:hover,
      .af-auth-link:hover {
        background: #eff6ff;
        border-color: rgba(37, 99, 235, 0.24);
        color: #1d4ed8;
      }
      .af-auth-btn.af-auth-btn-primary {
        background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
        border-color: transparent;
        color: #fff;
      }
      .af-auth-btn.af-auth-btn-primary:hover {
        background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
        color: #fff;
      }
      .af-auth-btn.af-auth-btn-danger {
        background: #fff;
        color: #b91c1c;
        border-color: rgba(239, 68, 68, 0.24);
      }
      .af-auth-btn.af-auth-btn-danger:hover {
        background: #fff1f2;
        color: #b91c1c;
        border-color: rgba(239, 68, 68, 0.34);
      }
      .af-auth-card {
        background: #fff;
        border: 1px solid #dbe6f6;
        border-radius: 18px;
        box-shadow: 0 18px 42px rgba(15, 23, 42, 0.08);
        padding: 26px;
        color: #0f172a;
      }
      .af-auth-card h3 {
        margin: 0 0 10px;
        font-size: 24px;
        color: #0f172a;
      }
      .af-auth-card p {
        margin: 0 0 18px;
        color: #475569;
        line-height: 1.6;
      }
      .af-auth-card .af-auth-error,
      .af-auth-card .af-auth-success {
        border-radius: 12px;
        padding: 12px 14px;
        font-size: 14px;
        margin-bottom: 14px;
      }
      .af-auth-card .af-auth-error {
        background: #fff1f2;
        border: 1px solid #fecdd3;
        color: #be123c;
      }
      .af-auth-card .af-auth-success {
        background: #f0fdf4;
        border: 1px solid #bbf7d0;
        color: #166534;
      }
      .af-auth-card .af-auth-form {
        display: grid;
        gap: 12px;
      }
      .af-auth-card label {
        display: block;
        margin-bottom: 6px;
        font-size: 12px;
        font-weight: 700;
        color: #334155;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .af-auth-card input {
        width: 100%;
        box-sizing: border-box;
        border: 1px solid #cbd5e1;
        border-radius: 10px;
        padding: 12px 14px;
        font-size: 15px;
        color: #0f172a;
      }
      .af-auth-card input:focus {
        outline: none;
        border-color: #2563eb;
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
      }
      .af-auth-card .af-auth-actions {
        display: grid;
        gap: 10px;
      }
      .af-auth-card .af-auth-divider {
        display: flex;
        align-items: center;
        gap: 10px;
        color: #94a3b8;
        font-size: 12px;
        font-weight: 700;
        margin: 6px 0;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }
      .af-auth-card .af-auth-divider::before,
      .af-auth-card .af-auth-divider::after {
        content: '';
        flex: 1;
        height: 1px;
        background: #e2e8f0;
      }
      .af-auth-modal {
        position: fixed;
        inset: 0;
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        background: rgba(15, 23, 42, 0.68);
      }
      .af-auth-modal[hidden] {
        display: none;
      }
      .af-auth-modal-shell {
        width: min(100%, 520px);
      }
      .af-auth-modal-close {
        position: absolute;
        top: 14px;
        right: 14px;
        border: none;
        background: transparent;
        color: #64748b;
        font-size: 26px;
        cursor: pointer;
      }
      .af-auth-inline-link {
        color: #2563eb;
        font-weight: 700;
        text-decoration: none;
      }
      .af-auth-inline-link:hover {
        text-decoration: underline;
      }
    `;

    document.head.appendChild(style);
    state.stylesInjected = true;
  }

  function getPublicState() {
    return {
      configured: isConfigured(),
      user: state.user,
      profile: state.profile,
      session: state.session,
      accessToken: state.accessToken,
      error: state.lastError ? String(state.lastError.message || state.lastError) : null,
    };
  }

  async function syncStateFromSession(session) {
    state.session = session || null;
    state.user = state.session?.user || null;
    state.accessToken = state.session?.access_token || null;
    await loadProfile();
    return getPublicState();
  }

  async function loadProfile() {
    if (!state.user || !state.accessToken) {
      state.profile = null;
      return null;
    }

    const backendBaseUrl = getBackendBaseUrl();
    if (!backendBaseUrl) {
      state.profile = {
        id: state.user.id,
        email: state.user.email || null,
        role: 'user',
        agency_id: null,
      };
      return state.profile;
    }

    try {
      const response = await fetch(`${backendBaseUrl}/api/profile/me`, {
        headers: {
          Authorization: `Bearer ${state.accessToken}`,
        },
      });

      if (response.ok) {
        const payload = await response.json();
        state.profile = payload.profile || {
          id: state.user.id,
          email: state.user.email || null,
          role: 'user',
          agency_id: null,
        };
        return state.profile;
      }
    } catch (_) {}

    state.profile = {
      id: state.user.id,
      email: state.user.email || null,
      role: 'user',
      agency_id: null,
    };
    return state.profile;
  }

  function notifyAuthChange() {
    document.dispatchEvent(new CustomEvent('aviaframe:auth-changed', {
      detail: getPublicState(),
    }));
  }

  function maybeHandlePostAuthRedirect() {
    const redirectPath = readPostAuthRedirect();
    if (!redirectPath || !state.user) return false;

    const target = new URL(redirectPath, window.location.origin);
    const current = new URL(window.location.href);
    if ((target.pathname + target.search) === (current.pathname + current.search)) {
      clearPostAuthRedirect();
      return false;
    }

    clearPostAuthRedirect();
    window.location.href = target.toString();
    return true;
  }

  async function maybeExchangeAuthCode() {
    const currentUrl = new URL(window.location.href);
    const authCode = currentUrl.searchParams.get('code');
    if (!authCode || !state.client) return;

    try {
      await state.client.auth.exchangeCodeForSession(authCode);
    } catch (error) {
      state.lastError = error;
    }

    const cleaned = cleanRedirectUrl(currentUrl.toString());
    if (cleaned !== currentUrl.toString()) {
      window.history.replaceState({}, '', cleaned);
    }
  }

  async function refreshSessionState() {
    if (!state.client) return getPublicState();

    const { data, error } = await state.client.auth.getSession();
    if (error) {
      state.lastError = error;
    }
    return syncStateFromSession(data?.session || null);
  }

  async function ensureUsableSession(options = {}) {
    await init();
    if (!state.client) return getPublicState();

    if (options.forceRefresh) {
      const { data, error } = await state.client.auth.refreshSession();
      if (error) {
        state.lastError = error;
        return syncStateFromSession(null);
      }
      return syncStateFromSession(data?.session || null);
    }

    return refreshSessionState();
  }

  async function init() {
    injectStyles();

    if (state.initPromise) return state.initPromise;
    state.initPromise = (async () => {
      if (!isConfigured()) return getPublicState();

      const supabaseModule = await import(AUTH_CDN_URL);
      const createClient = supabaseModule.createClient || supabaseModule.default?.createClient;
      if (typeof createClient !== 'function') {
        throw new Error('Unable to initialize customer auth');
      }

      const cfg = getSupabaseConfig();
      state.client = createClient(cfg.url, cfg.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          flowType: 'pkce',
        }
      });

      await maybeExchangeAuthCode();
      await refreshSessionState();

      if (!state.authListenerAttached) {
        state.client.auth.onAuthStateChange(async (_event, session) => {
          state.session = session || null;
          state.user = session?.user || null;
          state.accessToken = session?.access_token || null;
          await loadProfile();
          if (maybeHandlePostAuthRedirect()) return;
          notifyAuthChange();
        });
        state.authListenerAttached = true;
      }

      if (maybeHandlePostAuthRedirect()) {
        return getPublicState();
      }

      return getPublicState();
    })().catch((error) => {
      state.lastError = error;
      return getPublicState();
    });

    return state.initPromise;
  }

  async function signInWithEmail(email, redirectTo) {
    await init();
    if (!state.client) throw new Error('Customer auth is not configured');
    const normalizedEmail = String(email || '').trim();
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      throw new Error('Please enter a valid email address');
    }

    const { error } = await state.client.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        emailRedirectTo: cleanRedirectUrl(redirectTo || window.location.href),
      }
    });

    if (error) throw error;
    return true;
  }

  async function signInWithGoogle(redirectTo) {
    await init();
    if (!state.client) throw new Error('Customer auth is not configured');

    const { error } = await state.client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: cleanRedirectUrl(redirectTo || window.location.href),
      }
    });

    if (error) throw error;
    return true;
  }

  async function signOut(redirectTo) {
    await init();
    if (!state.client) return;
    await state.client.auth.signOut();
    state.session = null;
    state.user = null;
    state.profile = null;
    state.accessToken = null;
    notifyAuthChange();
    if (redirectTo) {
      window.location.href = cleanRedirectUrl(redirectTo);
    }
  }

  function renderAuthUi(container, options) {
    if (!container) return;
    injectStyles();

    const title = options?.title || 'Sign in to continue';
    const message = options?.message || 'Use email magic link or Google sign-in to access your bookings.';
    const showGoogle = options?.showGoogle !== false;
    const returnUrl = cleanRedirectUrl(options?.redirectTo || window.location.href);
    const afterAuthPath = options?.afterAuthPath || '';

    container.innerHTML = `
      <div class="af-auth-card">
        ${options?.closable ? '<button type="button" class="af-auth-modal-close" data-af-auth-close aria-label="Close">×</button>' : ''}
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(message)}</p>
        <div class="af-auth-error" data-af-auth-error hidden></div>
        <div class="af-auth-success" data-af-auth-success hidden></div>
        <div class="af-auth-actions">
          ${showGoogle ? '<button type="button" class="af-auth-btn af-auth-btn-primary" data-af-auth-google>Continue with Google</button>' : ''}
          ${showGoogle ? '<div class="af-auth-divider">or</div>' : ''}
          <form class="af-auth-form" data-af-auth-form>
            <div>
              <label for="af-auth-email-input">Email address</label>
              <input id="af-auth-email-input" type="email" placeholder="you@example.com" required />
            </div>
            <button type="submit" class="af-auth-btn af-auth-btn-primary" data-af-auth-email-submit>Send magic link</button>
          </form>
        </div>
      </div>
    `;

    const errorEl = container.querySelector('[data-af-auth-error]');
    const successEl = container.querySelector('[data-af-auth-success]');
    const formEl = container.querySelector('[data-af-auth-form]');
    const googleBtn = container.querySelector('[data-af-auth-google]');
    const closeBtn = container.querySelector('[data-af-auth-close]');

    const showError = (messageText) => {
      if (!errorEl) return;
      errorEl.hidden = !messageText;
      errorEl.textContent = messageText || '';
      if (successEl) {
        successEl.hidden = true;
        successEl.textContent = '';
      }
    };

    const showSuccess = (messageText) => {
      if (!successEl) return;
      successEl.hidden = !messageText;
      successEl.textContent = messageText || '';
      if (errorEl) {
        errorEl.hidden = true;
        errorEl.textContent = '';
      }
    };

    if (formEl) {
      formEl.addEventListener('submit', async (event) => {
        event.preventDefault();
        const emailInput = formEl.querySelector('input[type="email"]');
        const submitBtn = formEl.querySelector('[data-af-auth-email-submit]');
        const email = emailInput ? emailInput.value : '';
        submitBtn.disabled = true;
        showError('');
        showSuccess('');
        // Keep the exact booking URL locally too. Supabase may fall back to the
        // site root when a provider redirect URL is not an exact allow-list match.
        savePostAuthRedirect(afterAuthPath || returnUrl);

        try {
          await signInWithEmail(email, returnUrl);
          showSuccess(`Magic link sent to ${email}. Open the email and continue on this device.`);
        } catch (error) {
          showError(String(error.message || error || 'Failed to send magic link'));
        } finally {
          submitBtn.disabled = false;
        }
      });
    }

    if (googleBtn) {
      googleBtn.addEventListener('click', async () => {
        googleBtn.disabled = true;
        showError('');
        // See the email flow above: this preserves the in-progress booking
        // after Google returns through the site's default redirect URL.
        savePostAuthRedirect(afterAuthPath || returnUrl);
        try {
          await signInWithGoogle(returnUrl);
        } catch (error) {
          showError(String(error.message || error || 'Google sign-in failed'));
          googleBtn.disabled = false;
        }
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        const modal = container.closest('.af-auth-modal');
        if (modal) modal.hidden = true;
      });
    }
  }

  function openAuthModal(options) {
    injectStyles();

    let modal = document.getElementById('af-auth-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'af-auth-modal';
      modal.className = 'af-auth-modal';
      modal.hidden = true;
      modal.innerHTML = '<div class="af-auth-modal-shell" data-af-auth-modal-shell></div>';
      modal.addEventListener('click', (event) => {
        if (event.target === modal) modal.hidden = true;
      });
      document.body.appendChild(modal);
    }

    const shell = modal.querySelector('[data-af-auth-modal-shell]');
    renderAuthUi(shell, {
      title: options?.title || 'Sign in',
      message: options?.message || 'Sign in to save your bookings and use your details again next time.',
      redirectTo: options?.redirectTo || window.location.href,
      afterAuthPath: options?.afterAuthPath || '',
      showGoogle: options?.showGoogle !== false,
      closable: true,
    });

    modal.hidden = false;
    return modal;
  }

  function renderToolbar(target) {
    if (!target) return;

    const currentState = getPublicState();
    const bookingsPath = '/my-bookings.html';
    if (currentState.user) {
      const signedInEmail = escapeHtml(currentState.user.email || currentState.profile?.email || 'Signed in');
      target.innerHTML = `
        <div class="af-auth-toolbar">
          <span class="af-auth-email" title="${signedInEmail}">
            <span class="af-auth-email-label">Signed in as</span>
            <span class="af-auth-email-value">${signedInEmail}</span>
          </span>
          <a class="af-auth-link" href="${bookingsPath}">My Bookings</a>
          <button type="button" class="af-auth-btn af-auth-btn-danger" data-af-auth-signout>Sign Out</button>
        </div>
      `;

      const signOutBtn = target.querySelector('[data-af-auth-signout]');
      if (signOutBtn) {
        signOutBtn.addEventListener('click', () => signOut(window.location.href));
      }
      return;
    }

    target.innerHTML = `
      <div class="af-auth-toolbar">
        <button type="button" class="af-auth-btn af-auth-btn-primary" data-af-auth-open>Sign In</button>
        <button type="button" class="af-auth-btn" data-af-auth-bookings>My Bookings</button>
      </div>
    `;

    const signInBtn = target.querySelector('[data-af-auth-open]');
    const bookingsBtn = target.querySelector('[data-af-auth-bookings]');

    if (signInBtn) {
      signInBtn.addEventListener('click', () => {
        openAuthModal({
          title: 'Sign in to save your bookings',
          message: 'Use Google or email magic link. If you continue without signing in, booking will stop at the customer account step.',
          redirectTo: window.location.href,
        });
      });
    }

    if (bookingsBtn) {
      bookingsBtn.addEventListener('click', () => {
        openAuthModal({
          title: 'Sign in to view your bookings',
          message: 'Your booking history is available after sign-in.',
          redirectTo: window.location.href,
          afterAuthPath: bookingsPath,
        });
      });
    }
  }

  function mountNav(targetOrId) {
    const target = typeof targetOrId === 'string'
      ? document.getElementById(targetOrId)
      : targetOrId;
    if (!target) return;

    const render = () => renderToolbar(target);
    init().then(render).catch(render);
    document.addEventListener('aviaframe:auth-changed', render);
  }

  async function requireAuth(targetOrId, options) {
    const target = typeof targetOrId === 'string'
      ? document.getElementById(targetOrId)
      : targetOrId;

    const currentState = await ensureUsableSession();
    if (currentState.user) return currentState;

    if (target) {
      renderAuthUi(target, {
        title: options?.title || 'Sign in to continue your booking',
        message: options?.message || 'Login is required before passenger details and payment.',
        redirectTo: options?.redirectTo || window.location.href,
        showGoogle: options?.showGoogle !== false,
      });
    }

    return null;
  }

  async function apiFetch(path, initOptions) {
    let currentState = await ensureUsableSession();
    if (!currentState.accessToken) {
      throw new Error('No authenticated customer session');
    }

    const backendBaseUrl = getBackendBaseUrl();
    if (!backendBaseUrl) {
      throw new Error('Backend URL is not configured');
    }

    const request = async (token) => {
      const response = await fetch(`${backendBaseUrl}${path}`, {
        method: initOptions?.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          ...(initOptions?.headers || {}),
        },
        body: initOptions?.body,
      });
      const payload = await response.json().catch(() => null);
      return { response, payload };
    };

    let { response, payload } = await request(currentState.accessToken);
    const invalidToken = response.status === 401
      && ['INVALID_TOKEN', 'UNAUTHORIZED'].includes(String(payload?.error?.message || payload?.error?.code || '').trim());

    if (invalidToken) {
      currentState = await ensureUsableSession({ forceRefresh: true });
      if (!currentState.accessToken) {
        throw new Error('Session expired. Please sign in again.');
      }
      ({ response, payload } = await request(currentState.accessToken));
    }

    if (!response.ok) {
      const errorCode = String(payload?.error?.code || '').trim();
      if (response.status === 401 && errorCode === 'INVALID_TOKEN') {
        await signOut(window.location.href);
        throw new Error('Session expired. Please sign in again.');
      }
      throw new Error(payload?.error?.message || errorCode || `Request failed (${response.status})`);
    }
    return payload;
  }

  window.AviaframeCustomerAuth = {
    init,
    getState: async () => init(),
    mountNav,
    requireAuth,
    openAuthModal,
    renderAuthUi,
    signInWithEmail,
    signInWithGoogle,
    signOut,
    apiFetch,
    savePostAuthRedirect,
    clearPostAuthRedirect,
  };
})();
