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

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
    const data = backendResult.data?.profile || null;
    const error = backendResult.error || null;
    console.log('[supabase] getProfile done', {
      hasData: !!data,
      error: error?.message || null
    });
    return { data, error };
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
  const { data, error } = await backendApiRequest('/agency/me', { method: 'GET' });
  return { data: data?.agency || null, error };
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

export const getOrderPaymentInstructions = async (orderId) => {
  const { data, error } = await backendApiRequest(`/orders/${orderId}/payment-instructions`, {
    method: 'GET'
  });
  return {
    data: data?.payment_instruction || null,
    error
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
