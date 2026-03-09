const DEFAULT_N8N_BASE_URL = '/api/n8n/webhook';
const NGROK_HOST_RE = /(?:^|\.)ngrok-free\.dev$/i;
const AVIAFRAME_HOST_RE = /(?:^|\.)aviaframe\.com$/i;

const trimTrailingSlashes = (value) => String(value || '').replace(/\/+$/, '');

const getWindowLocation = () => {
  if (typeof window === 'undefined' || !window.location) return null;
  return window.location;
};

const getHost = () => getWindowLocation()?.hostname || '';

const isAviaframeHost = () => AVIAFRAME_HOST_RE.test(getHost());

const isNgrokUrl = (value) => {
  try {
    const parsed = new URL(value);
    return NGROK_HOST_RE.test(parsed.hostname);
  } catch {
    return false;
  }
};

const isUnsafeProdOverride = (value) => isAviaframeHost() && isNgrokUrl(value);

export const getSafeN8nBaseUrl = () => {
  const raw = trimTrailingSlashes(import.meta.env.VITE_N8N_BASE_URL || '');
  if (!raw) return DEFAULT_N8N_BASE_URL;

  // On production domains, prevent accidental requests to temporary ngrok URLs.
  if (isUnsafeProdOverride(raw)) {
    return DEFAULT_N8N_BASE_URL;
  }

  return raw;
};

export const getSafeSearchUrl = () => {
  const override = trimTrailingSlashes(import.meta.env.VITE_N8N_SEARCH_URL || '');
  if (override && !isUnsafeProdOverride(override)) {
    return override;
  }
  return `${getSafeN8nBaseUrl()}/drct/search`;
};

export const getAuthRedirectUrl = () => {
  const explicit = trimTrailingSlashes(import.meta.env.VITE_AUTH_REDIRECT_URL || '');
  if (explicit) return explicit;

  const location = getWindowLocation();
  if (!location) return '';

  // Keep auth callbacks on branded admin domain if app is already there.
  if (location.hostname === 'admin.aviaframe.com') {
    return `${location.protocol}//${location.hostname}`;
  }

  return `${location.protocol}//${location.host}`;
};
