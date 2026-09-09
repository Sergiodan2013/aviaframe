export function isAdminHostname(hostname = '') {
  return String(hostname || '').trim().toLowerCase() === 'admin.aviaframe.com';
}

export function shouldRequireAuthForCheckout(hostname = '') {
  return isAdminHostname(hostname);
}

export function buildPaymentReturnUrl(locationLike) {
  const fallbackOrigin = 'http://localhost:5173';

  if (!locationLike || typeof locationLike !== 'object') {
    return fallbackOrigin;
  }

  const origin = String(locationLike.origin || fallbackOrigin).trim();
  const pathname = String(locationLike.pathname || '/').trim() || '/';

  try {
    return new URL(pathname, origin).toString();
  } catch {
    return origin;
  }
}

export function shouldOfferTamara({ tamaraEnabled = false, currency = '' } = {}) {
  return Boolean(tamaraEnabled) && String(currency || '').trim().toUpperCase() === 'SAR';
}

export function buildTamaraReturnUrls(locationLike, orderId = '') {
  const baseUrl = buildPaymentReturnUrl(locationLike);
  const safeOrderId = String(orderId || '').trim();

  const withResult = (result) => {
    try {
      const url = new URL(baseUrl);
      url.searchParams.set('tamara_result', result);
      if (safeOrderId) {
        url.searchParams.set('order_id', safeOrderId);
      }
      return url.toString();
    } catch {
      return baseUrl;
    }
  };

  return {
    success_url: withResult('success'),
    cancel_url: withResult('cancel'),
    failure_url: withResult('failure'),
  };
}

export function getTamaraReturnState(locationLike) {
  if (!locationLike || typeof locationLike !== 'object') {
    return { isTamaraReturn: false, result: null, orderId: null };
  }

  const pathname = String(locationLike.pathname || '/').trim() || '/';
  const search = String(locationLike.search || '').trim();
  const params = new URLSearchParams(search);

  const queryResult = params.get('tamara_result');
  const queryOrderId = params.get('order_id');

  if (queryResult) {
    return {
      isTamaraReturn: true,
      result: queryResult,
      orderId: queryOrderId,
    };
  }

  if (pathname.includes('/payments/tamara/')) {
    const result = pathname.endsWith('/success')
      ? 'success'
      : pathname.endsWith('/cancel')
        ? 'cancel'
        : pathname.endsWith('/failure')
          ? 'failure'
          : null;

    return {
      isTamaraReturn: Boolean(result),
      result,
      orderId: queryOrderId,
    };
  }

  return { isTamaraReturn: false, result: null, orderId: null };
}
