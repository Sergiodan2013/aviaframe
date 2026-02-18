import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const useBackendOrders = String(import.meta.env.VITE_USE_BACKEND_ORDERS || 'true').toLowerCase() === 'true';
const backendApiBaseUrl = import.meta.env.VITE_BACKEND_API_BASE_URL || '/api/backend';

// Debug: Check if Supabase credentials are loaded
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase credentials missing!', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    urlLength: supabaseUrl.length,
    keyLength: supabaseAnonKey.length
  });
} else {
  console.log('✅ Supabase initialized:', {
    url: supabaseUrl,
    keyPrefix: supabaseAnonKey.substring(0, 20) + '...',
    keyLength: supabaseAnonKey.length
  });
}

export const supabase = createClient(supabaseUrl || 'https://example.supabase.co', supabaseAnonKey || 'dummy-key');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const withTimeout = async (label, promise, ms = 30000) => {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`${label}: Timeout after ${ms}ms`)), ms);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId);
  }
};

const getTokenFromLocalStorage = () => {
  try {
    const authKey = Object.keys(localStorage).find((k) => k.includes('-auth-token'));
    if (!authKey) return null;
    const raw = localStorage.getItem(authKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.access_token) return parsed.access_token;
    if (parsed?.currentSession?.access_token) return parsed.currentSession.access_token;
    if (Array.isArray(parsed) && parsed[0]?.access_token) return parsed[0].access_token;
    return null;
  } catch {
    return null;
  }
};

const getBackendAuthHeaders = async () => {
  let token = null;
  let lastError = null;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        lastError = error;
      } else {
        token = data?.session?.access_token || null;
        if (token) break;
      }
    } catch (err) {
      lastError = err;
    }
    await sleep(120);
  }

  if (!token) {
    token = getTokenFromLocalStorage();
  }

  if (!token) {
    const details = lastError?.message ? `: ${lastError.message}` : '';
    throw new Error(`No active access token for backend request${details}`);
  }

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };
};

const fetchBackendOrders = async (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value));
    }
  });
  const headers = await getBackendAuthHeaders();
  const resp = await withTimeout(
    'backend orders request',
    fetch(`${backendApiBaseUrl}/orders?${query.toString()}`, {
      method: 'GET',
      headers
    }),
    30000
  );
  const raw = await resp.text();
  let payload = null;
  try {
    payload = raw ? JSON.parse(raw) : null;
  } catch {
    payload = null;
  }
  if (!resp.ok) {
    return {
      data: null,
      error: payload?.error || { message: raw || `Backend orders request failed (${resp.status})` }
    };
  }
  return { data: payload?.orders || [], error: null };
};

const parseBackendResponse = async (resp, fallbackMessage) => {
  const raw = await resp.text();
  let payload = null;
  try {
    payload = raw ? JSON.parse(raw) : null;
  } catch {
    payload = null;
  }
  if (!resp.ok) {
    return {
      data: null,
      error: payload?.error || { message: raw || `${fallbackMessage} (${resp.status})` }
    };
  }
  return { data: payload, error: null };
};

const backendApiRequest = async (path, { method = 'GET', body } = {}) => {
  try {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const headers = await getBackendAuthHeaders();
        const resp = await withTimeout(
          `backend ${method} ${path}`,
          fetch(`${backendApiBaseUrl}${path}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined
          }),
          30000
        );
        return await parseBackendResponse(resp, 'Backend API request failed');
      } catch (innerErr) {
        const msg = String(innerErr?.message || '');
        const abortLike = msg.toLowerCase().includes('aborted');
        if (attempt === 0 && abortLike) {
          await sleep(150);
          continue;
        }
        throw innerErr;
      }
    }
    return { data: null, error: { message: 'Backend API request failed' } };
  } catch (err) {
    return { data: null, error: { message: err?.message || 'Backend API request failed' } };
  }
};

// ====================================================
// AUTH HELPERS
// ====================================================

export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin
    }
  });
  return { data, error };
};

export const signInWithEmail = async (email) => {
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: window.location.origin
    }
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
};

// ====================================================
// PROFILE HELPERS
// ====================================================

export const getProfile = async (userId) => {
  console.log('[supabase] getProfile start', { userId });
  try {
    const backendResult = await backendApiRequest('/profile/me', { method: 'GET' });
    const backendData = backendResult.data?.profile || null;
    const backendError = backendResult.error || null;
    if (backendData?.id || backendData?.role) {
      console.log('[supabase] getProfile done', {
        source: 'backend',
        hasData: true,
        error: backendError?.message || null
      });
      return { data: backendData, error: null };
    }

    // Fallback for frontend-only deploys where /api/backend is not wired.
    const { data: directProfile, error: directError } = await supabase
      .from('profiles')
      .select('id,email,role,agency_id,updated_at')
      .eq('id', userId)
      .maybeSingle();

    console.log('[supabase] getProfile done', {
      source: 'supabase-fallback',
      hasData: !!directProfile,
      backendError: backendError?.message || null,
      directError: directError?.message || null
    });

    if (directProfile) {
      return { data: directProfile, error: null };
    }

    return { data: null, error: directError || backendError || null };
  } catch (err) {
    console.warn('[supabase] getProfile failed', err?.message || err);
    return {
      data: null,
      error: {
        message: err?.message || 'getProfile failed'
      }
    };
  }
};

export const upsertProfile = async (userId, profileData) => {
  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      ...profileData,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();
  return { data, error };
};

// ====================================================
// ORDERS HELPERS
// ====================================================

export const createOrder = async (orderData) => {
  const { data, error } = await supabase
    .from('orders')
    .insert(orderData)
    .select()
    .single();
  return { data, error };
};

export const getOrder = async (orderId) => {
  const { data, error } = await supabase
    .from('orders_with_details')
    .select('*')
    .eq('id', orderId)
    .single();
  return { data, error };
};

export const getUserOrders = async (userId) => {
  console.log('[supabase] getUserOrders start', { userId });
  if (useBackendOrders) {
    try {
      return await fetchBackendOrders({ user_id: userId, limit: 100 });
    } catch (err) {
      return { data: null, error: { message: err?.message || 'Backend orders request failed' } };
    }
  }

  const ORDERS_LIST_COLUMNS = [
    'id',
    'order_number',
    'user_id',
    'agency_id',
    'drct_order_id',
    'origin',
    'destination',
    'departure_time',
    'arrival_time',
    'airline_code',
    'airline_name',
    'flight_number',
    'total_price',
    'currency',
    'status',
    'contact_email',
    'contact_phone',
    'created_at',
    'updated_at',
    'confirmed_at',
    'cancelled_at'
  ].join(',');

  // Use base table directly to avoid view-related timeouts in UI.
  const basePromise = supabase
    .from('orders')
    .select(ORDERS_LIST_COLUMNS)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100);

  const { data, error } = await withTimeout('getUserOrders', basePromise, 30000);
  console.log('[supabase] getUserOrders done', {
    count: Array.isArray(data) ? data.length : 0,
    error: error?.message || null
  });
  return { data, error };
};

export const getOrdersList = async ({ userId, agencyId, limit = 200 } = {}) => {
  if (useBackendOrders) {
    try {
      return await fetchBackendOrders({
        limit,
        user_id: userId,
        agency_id: agencyId
      });
    } catch (err) {
      return { data: null, error: { message: err?.message || 'Backend orders request failed' } };
    }
  }

  const ORDERS_LIST_COLUMNS = [
    'id',
    'order_number',
    'user_id',
    'agency_id',
    'drct_order_id',
    'origin',
    'destination',
    'departure_time',
    'arrival_time',
    'airline_code',
    'airline_name',
    'flight_number',
    'total_price',
    'currency',
    'status',
    'contact_email',
    'contact_phone',
    'created_at',
    'updated_at',
    'confirmed_at',
    'cancelled_at'
  ].join(',');

  let query = supabase
    .from('orders')
    .select(ORDERS_LIST_COLUMNS)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (userId) query = query.eq('user_id', userId);
  if (agencyId) query = query.eq('agency_id', agencyId);

  const { data, error } = await withTimeout('getOrdersList', query, 30000);
  return { data, error };
};

export const getAgencyOrders = async (agencyId) => {
  const { data, error } = await supabase
    .from('orders_with_details')
    .select('*')
    .eq('agency_id', agencyId)
    .order('created_at', { ascending: false });
  return { data, error };
};

export const updateOrderStatus = async (orderId, status, additionalData = {}) => {
  if (useBackendOrders) {
    try {
      const headers = await getBackendAuthHeaders();
      const resp = await withTimeout(
        'updateOrderStatus backend',
        fetch(`${backendApiBaseUrl}/orders/${orderId}/status`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ status, additionalData })
        }),
        30000
      );
      const raw = await resp.text();
      let payload = null;
      try {
        payload = raw ? JSON.parse(raw) : null;
      } catch {
        payload = null;
      }
      if (!resp.ok) {
        return {
          data: null,
          error: payload?.error || { message: raw || `Backend status update failed (${resp.status})` }
        };
      }
      return { data: payload?.order || null, error: null };
    } catch (err) {
      return { data: null, error: { message: err?.message || 'Backend status update failed' } };
    }
  }

  const updateData = {
    status,
    updated_at: new Date().toISOString(),
    ...additionalData
  };

  // Set status-specific timestamps
  if (status === 'confirmed' && !additionalData.confirmed_at) {
    updateData.confirmed_at = new Date().toISOString();
  }
  if (status === 'cancelled' && !additionalData.cancelled_at) {
    updateData.cancelled_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('orders')
    .update(updateData)
    .eq('id', orderId)
    .select()
    .single();
  return { data, error };
};

// ====================================================
// PASSENGERS HELPERS
// ====================================================

export const createPassengers = async (passengers) => {
  const { data, error } = await supabase
    .from('passengers')
    .insert(passengers)
    .select();
  return { data, error };
};

export const getOrderPassengers = async (orderId) => {
  const { data, error } = await supabase
    .from('passengers')
    .select('*')
    .eq('order_id', orderId);
  return { data, error };
};

// ====================================================
// AGENCY HELPERS
// ====================================================

export const getAgency = async (agencyId) => {
  const { data, error } = await supabase
    .from('agencies')
    .select('*')
    .eq('id', agencyId)
    .single();
  return { data, error };
};

export const getAgencyByDomain = async (domain) => {
  const { data, error } = await supabase
    .from('agencies')
    .select('*')
    .eq('domain', domain)
    .single();
  return { data, error };
};

// ====================================================
// DRCT LOGS HELPERS
// ====================================================

export const logDRCTRequest = async (logData) => {
  const { data, error } = await supabase
    .from('drct_requests_log')
    .insert(logData);
  return { data, error };
};

export const getDRCTLogs = async (filters = {}) => {
  let query = supabase
    .from('drct_requests_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (filters.order_id) {
    query = query.eq('order_id', filters.order_id);
  }

  if (filters.endpoint) {
    query = query.eq('endpoint', filters.endpoint);
  }

  const { data, error } = await query;
  return { data, error };
};

// ====================================================
// ADMIN BACKEND HELPERS
// ====================================================

export const getAdminAgencies = async (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') query.set(k, String(v));
  });
  const suffix = query.toString() ? `?${query.toString()}` : '';
  const { data, error } = await backendApiRequest(`/admin/agencies${suffix}`, { method: 'GET' });
  return { data: data?.agencies || null, error };
};

export const getAdminSuperAdmins = async () => {
  const { data, error } = await backendApiRequest('/admin/super-admins', { method: 'GET' });
  return { data: data?.super_admins || null, error };
};

export const createAdminSuperAdmin = async (payload) => {
  const { data, error } = await backendApiRequest('/admin/super-admins', {
    method: 'POST',
    body: payload
  });
  return {
    data: data?.super_admin || null,
    created: !!data?.created,
    error
  };
};

export const createAdminAgency = async (payload) => {
  const { data, error } = await backendApiRequest('/admin/agencies', {
    method: 'POST',
    body: payload
  });
  return { data: data?.agency || null, error };
};

export const updateAdminAgency = async (agencyId, payload) => {
  const { data, error } = await backendApiRequest(`/admin/agencies/${agencyId}`, {
    method: 'PATCH',
    body: payload
  });
  return { data: data?.agency || null, error };
};

export const deleteAdminAgency = async (agencyId) => {
  const { data, error } = await backendApiRequest(`/admin/agencies/${agencyId}`, {
    method: 'DELETE'
  });
  return { data: data?.agency || null, error };
};

export const getAdminOrdersReport = async (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') query.set(k, String(v));
  });
  const { data, error } = await backendApiRequest(`/admin/reports/orders?${query.toString()}`, { method: 'GET' });
  return {
    data: data?.rows || null,
    filters: data?.filters || null,
    error
  };
};

export const getAdminOrdersSummary = async (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') query.set(k, String(v));
  });
  const { data, error } = await backendApiRequest(`/admin/reports/orders-summary?${query.toString()}`, { method: 'GET' });
  return {
    data: data?.summary || null,
    filters: data?.filters || null,
    error
  };
};

export const getAdminInvoices = async (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') query.set(k, String(v));
  });
  const { data, error } = await backendApiRequest(`/admin/invoices?${query.toString()}`, { method: 'GET' });
  return { data: data?.invoices || null, error };
};

export const getAdminTickets = async (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') query.set(k, String(v));
  });
  const { data, error } = await backendApiRequest(`/admin/tickets?${query.toString()}`, { method: 'GET' });
  return { data: data?.tickets || null, error };
};

export const createAdminInvoice = async (payload) => {
  const { data, error } = await backendApiRequest('/admin/invoices', {
    method: 'POST',
    body: payload
  });
  return { data: data?.invoice || null, error };
};

export const updateAdminInvoice = async (invoiceId, payload) => {
  const { data, error } = await backendApiRequest(`/admin/invoices/${invoiceId}`, {
    method: 'PATCH',
    body: payload
  });
  return {
    data: data?.invoice || null,
    document: data?.document || null,
    downloadUrl: data?.download_url || null,
    error
  };
};

export const getMyAgency = async () => {
  const backend = await backendApiRequest('/agency/me', { method: 'GET' });
  if (backend?.data?.agency) {
    return { data: backend.data.agency, error: null };
  }

  // Fallback for frontend-only deploys without /api/backend proxy.
  try {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    const userId = authData?.user?.id;
    if (authError || !userId) {
      return { data: null, error: authError || backend?.error || { message: 'UNAUTHORIZED' } };
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('agency_id')
      .eq('id', userId)
      .maybeSingle();
    if (profileError) return { data: null, error: profileError };
    if (!profile?.agency_id) {
      return { data: null, error: { message: 'AGENCY_NOT_ASSIGNED' } };
    }

    const { data: agency, error: agencyError } = await supabase
      .from('agencies')
      .select('id,name,domain,api_key,contact_email,contact_phone,country,address,is_active,commission_rate,settings,created_at,updated_at')
      .eq('id', profile.agency_id)
      .single();
    return { data: agency || null, error: agencyError || null };
  } catch (err) {
    return { data: null, error: { message: err?.message || 'Agency load failed' } };
  }
};

export const updateMyAgency = async (payload) => {
  const { data, error } = await backendApiRequest('/agency/me', {
    method: 'PATCH',
    body: payload
  });
  return { data: data?.agency || null, error };
};

export const generateAdminInvoicePdf = async (invoiceId) => {
  const { data, error } = await backendApiRequest(`/admin/invoices/${invoiceId}/generate-pdf`, {
    method: 'POST'
  });
  return {
    data: data?.document || null,
    downloadUrl: data?.download_url || null,
    error
  };
};

export const getDocumentDownloadUrl = async (documentId) => {
  const { data, error } = await backendApiRequest(`/documents/${documentId}/download`, {
    method: 'GET'
  });
  return { url: data?.url || null, error };
};

export const finalizeTicketDocument = async (orderId, payload = {}) => {
  const { data, error } = await backendApiRequest(`/orders/${orderId}/ticket/finalize`, {
    method: 'POST',
    body: payload
  });
  return {
    data: data?.ticket_issuance || null,
    document: data?.document || null,
    downloadUrl: data?.download_url || null,
    email: data?.email || null,
    error
  };
};

export const getOrderTicketDocument = async (orderId) => {
  const { data, error } = await backendApiRequest(`/orders/${orderId}/ticket-document`, {
    method: 'GET'
  });
  return {
    data: data?.ticket || null,
    document: data?.document || null,
    url: data?.url || null,
    error
  };
};

const isUuid = (value) => (
  typeof value === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
);

export const getOrderPaymentInstructions = async (orderRef) => {
  const inputOrderId = typeof orderRef === 'string' ? orderRef : (orderRef?.id || null);
  const inputOrderNumber = typeof orderRef === 'object' ? (orderRef?.order_number || null) : null;
  const inputDrctOrderId = typeof orderRef === 'object' ? (orderRef?.drct_order_id || null) : null;
  const inputEmail = typeof orderRef === 'object' ? (orderRef?.contact_email || null) : null;
  const inputOrigin = typeof orderRef === 'object' ? (orderRef?.origin || null) : null;
  const inputDestination = typeof orderRef === 'object' ? (orderRef?.destination || null) : null;
  const inputDepartureTime = typeof orderRef === 'object' ? (orderRef?.departure_time || null) : null;

  if (inputOrderId && isUuid(inputOrderId)) {
    const { data, error } = await backendApiRequest(`/orders/${inputOrderId}/payment-instructions`, {
      method: 'GET'
    });
    if (data?.payment_instruction) {
      return {
        data: data.payment_instruction,
        error: null
      };
    }
    if (error && !inputOrderNumber) {
      return {
        data: null,
        error
      };
    }
  }

  let order = null;
  let orderError = null;
  if (inputOrderId && isUuid(inputOrderId)) {
    const resp = await supabase
      .from('orders')
      .select('id,order_number,user_id,agency_id,total_price,currency,status,contact_email,drct_order_id,origin,destination,departure_time,created_at')
      .eq('id', inputOrderId)
      .single();
    order = resp.data || null;
    orderError = resp.error || null;
  }

  if (!order && inputOrderNumber) {
    const respByNumber = await supabase
      .from('orders')
      .select('id,order_number,user_id,agency_id,total_price,currency,status,contact_email,drct_order_id,origin,destination,departure_time,created_at')
      .eq('order_number', inputOrderNumber)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    order = respByNumber.data || null;
    orderError = respByNumber.error || orderError;
  }

  if (!order && inputDrctOrderId) {
    const respByDrct = await supabase
      .from('orders')
      .select('id,order_number,user_id,agency_id,total_price,currency,status,contact_email,drct_order_id,origin,destination,departure_time,created_at')
      .eq('drct_order_id', inputDrctOrderId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    order = respByDrct.data || null;
    orderError = respByDrct.error || orderError;
  }

  // Heuristic resolver for local cached entries without UUID.
  if (!order && inputEmail && inputOrigin && inputDestination) {
    const respByMeta = await supabase
      .from('orders')
      .select('id,order_number,user_id,agency_id,total_price,currency,status,contact_email,drct_order_id,origin,destination,departure_time,created_at')
      .eq('contact_email', String(inputEmail).trim().toLowerCase())
      .eq('origin', inputOrigin)
      .eq('destination', inputDestination)
      .order('created_at', { ascending: false })
      .limit(10);
    const candidates = Array.isArray(respByMeta.data) ? respByMeta.data : [];
    if (candidates.length > 0) {
      const exactByTime = inputDepartureTime
        ? candidates.find((r) => String(r.departure_time || '') === String(inputDepartureTime))
        : null;
      order = exactByTime || candidates[0];
    }
    orderError = respByMeta.error || orderError;
  }

  if (!order) {
    if (inputOrderId && !isUuid(inputOrderId)) {
      return {
        data: null,
        error: { message: 'Не удалось сопоставить локальный заказ с записью в базе. Откройте бронирование из актуального списка.' }
      };
    }
    return {
      data: null,
      error: orderError || { message: 'Order not found' }
    };
  }

  /*
   * Continue with resolved order from Supabase fallback.
   */
  const { data, error } = await backendApiRequest(`/orders/${order.id}/payment-instructions`, {
    method: 'GET'
  });
  if (data?.payment_instruction) {
    return {
      data: data.payment_instruction,
      error: null
    };
  }

  // Fallback for frontend-only deploys without /api/backend proxy.
  if (error && !order) return { data: null, error };

  let resolvedAgencyId = order.agency_id || null;
  if (!resolvedAgencyId && order.user_id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('agency_id')
      .eq('id', order.user_id)
      .maybeSingle();
    if (profile?.agency_id) resolvedAgencyId = profile.agency_id;
  }
  if (!resolvedAgencyId && order.contact_email) {
    const { data: agenciesByEmail } = await supabase
      .from('agencies')
      .select('id')
      .eq('contact_email', String(order.contact_email).trim().toLowerCase())
      .limit(2);
    if (Array.isArray(agenciesByEmail) && agenciesByEmail.length === 1) {
      resolvedAgencyId = agenciesByEmail[0].id;
    }
  }
  if (!resolvedAgencyId) {
    return {
      data: null,
      error: { message: 'Бронирование не связано с агентством' }
    };
  }

  // Best-effort backfill; ignore failure if RLS blocks update.
  if (!order.agency_id) {
    await supabase
      .from('orders')
      .update({ agency_id: resolvedAgencyId, updated_at: new Date().toISOString() })
      .eq('id', order.id);
  }

  const { data: agency, error: agencyError } = await supabase
    .from('agencies')
    .select('id,name,domain,contact_email,contact_phone,settings')
    .eq('id', resolvedAgencyId)
    .single();
  if (agencyError || !agency) {
    return {
      data: null,
      error: agencyError || { message: 'Агентство для бронирования не найдено' }
    };
  }

  const bank = agency?.settings?.bank_details || {};
  const hasBankDetails = !!(
    bank.bank_name ||
    bank.bank_account ||
    bank.iban ||
    bank.swift_bic ||
    bank.sama_code
  );
  if (!hasBankDetails) {
    return {
      data: null,
      error: { message: 'У агентства не заполнены банковские реквизиты' }
    };
  }

  const paymentInstruction = {
    order_id: order.id,
    order_number: order.order_number,
    amount: Number(order.total_price || 0),
    currency: order.currency || 'USD',
    status: order.status || 'pending',
    agency: {
      id: agency.id,
      name: agency.name,
      domain: agency.domain,
      contact_email: agency.contact_email,
      contact_phone: agency.contact_phone
    },
    bank_details: {
      bank_name: bank.bank_name || null,
      account_number: bank.bank_account || null,
      iban: bank.iban || null,
      swift_bic: bank.swift_bic || null,
      sama_code: bank.sama_code || null
    },
    notes: [
      'Переведите сумму по реквизитам агентства.',
      `В комментарии укажите номер заказа: ${order.order_number}`,
      'После поступления оплаты статус будет подтвержден и билет выписан.'
    ]
  };

  return {
    data: paymentInstruction,
    error: null
  };
};

export const createSupportRequest = async (payload) => {
  const { data, error } = await backendApiRequest('/support/requests', {
    method: 'POST',
    body: payload
  });
  return {
    data: data?.support_request || null,
    email: data?.email || null,
    error
  };
};

// ====================================================
// REALTIME SUBSCRIPTIONS
// ====================================================

export const subscribeToOrderUpdates = (orderId, callback) => {
  return supabase
    .channel(`order:${orderId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${orderId}`
      },
      callback
    )
    .subscribe();
};

export const subscribeToUserOrders = (userId, callback) => {
  return supabase
    .channel(`user_orders:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `user_id=eq.${userId}`
      },
      callback
    )
    .subscribe();
};
