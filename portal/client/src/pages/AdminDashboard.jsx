import { useState, useEffect, useRef, useMemo } from 'react';
import { Plane, Calendar, User, CreditCard, AlertCircle, CheckCircle, Clock, XCircle, ArrowLeft, Phone, Mail, Search, Filter, X, MapPin, Ticket } from 'lucide-react';
import {
  supabase,
  getOrdersList,
  updateOrderStatus as updateOrderStatusApi,
  getAdminAgencies,
  getAdminSuperAdmins,
  createAdminSuperAdmin,
  createAdminAgency,
  updateAdminAgency,
  deleteAdminAgency,
  getAdminOrdersSummary,
  getAdminInvoices,
  getAdminTickets,
  createAdminInvoice,
  updateAdminInvoice,
  generateAdminInvoicePdf,
  finalizeTicketDocument,
  getDocumentDownloadUrl,
  getOrderTicketDocument,
  getProfile,
  getMyAgency,
  updateMyAgency
} from '../lib/supabase';
import { drctApi } from '../lib/drctApi';

export default function AdminDashboard({ user, onBackToHome, viewMode = 'super_admin' }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [issuingOrderId, setIssuingOrderId] = useState(null);
  const [ticketDocLoadingId, setTicketDocLoadingId] = useState(null);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [agencies, setAgencies] = useState([]);
  const [reportSummary, setReportSummary] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [superAdmins, setSuperAdmins] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [agenciesLoading, setAgenciesLoading] = useState(false);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [superAdminsLoading, setSuperAdminsLoading] = useState(false);
  const [creatingSuperAdmin, setCreatingSuperAdmin] = useState(false);
  const [activeAdminSection, setActiveAdminSection] = useState('agencies');
  const [showCreateAgencyForm, setShowCreateAgencyForm] = useState(false);
  const [superAdminForm, setSuperAdminForm] = useState({
    email: '',
    full_name: '',
    phone: ''
  });
  const [agencyFilters, setAgencyFilters] = useState({
    q: '',
    is_active: 'all'
  });
  const [invoiceFilters, setInvoiceFilters] = useState({
    agency_id: '',
    currency: '',
    date_from: '',
    date_to: ''
  });
  const [ticketFilters, setTicketFilters] = useState({
    agency_id: '',
    order_status: '',
    status: '',
    email_status: '',
    date_from: '',
    date_to: '',
    q: ''
  });
  const [agencyEditId, setAgencyEditId] = useState(null);
  const [agencyEditForm, setAgencyEditForm] = useState({
    name: '',
    domain: '',
    contact_email: '',
    contact_phone: '',
    is_active: true,
    contact_person_name: '',
    bank_name: '',
    bank_account: '',
    iban: '',
    swift_bic: '',
    sama_code: '',
    widget_allowed_domains: ''
  });
  const [agencyForm, setAgencyForm] = useState({
    name: '',
    domain: '',
    contact_email: '',
    contact_phone: '',
    contact_person_name: '',
    country: 'SA',
    bank_name: '',
    bank_account: '',
    iban: '',
    swift_bic: '',
    sama_code: '',
    widget_allowed_domains: ''
  });
  const [invoiceForm, setInvoiceForm] = useState({
    agency_id: '',
    period_from: '',
    period_to: '',
    currency: 'EUR',
    manual_total: '',
    statuses: 'confirmed,ticketed'
  });
  const [agencySelfForm, setAgencySelfForm] = useState({
    commission_rate: 0,
    commission_model: 'percent',
    commission_fixed_amount: 0,
    currency: 'SAR',
    bank_name: '',
    bank_account: '',
    iban: '',
    swift_bic: '',
    sama_code: '',
    contact_person_name: '',
    widget_allowed_domains: ''
  });
  const [agencySelfMeta, setAgencySelfMeta] = useState(null);
  const [agencyPreviewId, setAgencyPreviewId] = useState('');
  const [agencySelfLoading, setAgencySelfLoading] = useState(false);
  const [widgetDomains, setWidgetDomains] = useState([]);
  const [domainDraft, setDomainDraft] = useState('');
  const [showAddDomain, setShowAddDomain] = useState(false);
  const [domainsDirty, setDomainsDirty] = useState(false);
  const [domainsSaving, setDomainsSaving] = useState(false);
  const loadingRef = useRef(false);
  const isAgencyAdminPreview = viewMode === 'agency_admin';
  const isSuperAdminView = !isAgencyAdminPreview;

  const normalizeRole = (role) => {
    const normalized = String(role || 'user').trim().toLowerCase().replace(/[\s-]+/g, '_');
    if (normalized === 'superadmin') return 'super_admin';
    if (normalized === 'agency_admin' || normalized === 'agency') return 'agent';
    if (normalized === 'administrator') return 'admin';
    if (['admin', 'super_admin', 'agent', 'user'].includes(normalized)) return normalized;
    return 'user';
  };

  const readOrdersCache = () => {
    try {
      const raw = localStorage.getItem('avia_orders_cache');
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const writeOrdersCache = (orders) => {
    try {
      localStorage.setItem('avia_orders_cache', JSON.stringify(orders));
      console.log(`[AdminDashboard] Cached ${orders.length} orders`);
    } catch (e) {
      console.warn('Failed to write orders cache:', e);
    }
  };

  const normalizeStatus = (status) => {
    if (!status) return 'pending';
    const s = String(status).toLowerCase();
    if (s === 'pending_payment' || s === 'awaiting_payment') return 'pending';
    if (s === 'paid') return 'confirmed';
    if (s === 'issued' || s === 'ticket_issued') return 'ticketed';
    if (s === 'canceled') return 'cancelled';
    if (s === 'error' || s === 'failed') return 'pending';
    return s;
  };

  useEffect(() => {
    if (!user?.id) return;
    loadOrders();
  }, [user?.id]);

  useEffect(() => {
    if (!selectedOrder) return;
    const onEsc = (e) => {
      if (e.key === 'Escape') setSelectedOrder(null);
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [selectedOrder]);

  useEffect(() => {
    if (!isAgencyAdminPreview) return;
    if (!['admin', 'super_admin'].includes(userProfile?.role)) return;
    if (!Array.isArray(agencies) || agencies.length === 0) return;

    const resolvedId = userProfile?.agency_id || (agencies.length === 1 ? agencies[0].id : null);
    if (!resolvedId) return;
    if (agencyPreviewId !== resolvedId) {
      setAgencyPreviewId(resolvedId);
    }
    const selectedAgency = agencies.find((a) => a.id === resolvedId) || agencies[0];
    if (selectedAgency) {
      applyAgencyToSelfForm(selectedAgency);
    }
  }, [isAgencyAdminPreview, userProfile?.role, userProfile?.agency_id, agencies, agencyPreviewId]);

  useEffect(() => {
    if (!['admin', 'super_admin'].includes(userProfile?.role)) return;
    if (activeAdminSection === 'agencies') {
      void loadAgencies();
      if (['admin', 'super_admin'].includes(userProfile?.role)) {
        void loadSuperAdmins();
      }
      return;
    }
    if (activeAdminSection === 'invoices') {
      void loadInvoices();
      return;
    }
    if (activeAdminSection === 'tickets') {
      void loadTickets();
    }
  }, [activeAdminSection, userProfile?.role]);

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

  const parseJsonSafe = (v) => {
    if (!v) return null;
    if (typeof v === 'object') return v;
    if (typeof v !== 'string') return null;
    try {
      return JSON.parse(v);
    } catch {
      return null;
    }
  };

  const parseWidgetDomains = (raw) => {
    if (!raw) return [];
    return String(raw)
      .split(/\n|,|;/g)
      .map((d) => d.trim().toLowerCase())
      .map((d) => d.replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/:\d+$/, ''))
      .filter(Boolean);
  };

  const normalizeWidgetDomain = (raw) => {
    const list = parseWidgetDomains(raw);
    return list[0] || '';
  };

  const getLegsFromOrder = (order) => {
    const raw =
      parseJsonSafe(order?.raw_drct_response) ||
      parseJsonSafe(order?.raw_offer_data) ||
      parseJsonSafe(order?.offer_details) ||
      parseJsonSafe(order?._raw);
    const flights = Array.isArray(raw?.flights) ? raw.flights : [];
    const outboundSegments = Array.isArray(flights[0]?.segments) ? flights[0].segments : [];
    const returnSegments = Array.isArray(flights[1]?.segments) ? flights[1].segments : [];

    const legInfo = (segments) => {
      if (!segments.length) return null;
      const first = segments[0] || {};
      const last = segments[segments.length - 1] || {};
      const originCity =
        first?.departure_city?.name ||
        first?.departure_city?.code ||
        first?.departure_airport?.city?.name ||
        first?.departure_airport?.city ||
        null;
      const destinationCity =
        last?.arrival_city?.name ||
        last?.arrival_city?.code ||
        last?.arrival_airport?.city?.name ||
        last?.arrival_airport?.city ||
        null;
      const originAirport = first?.departure_airport?.name || first?.departure_airport?.code || first?.origin || null;
      const destinationAirport = last?.arrival_airport?.name || last?.arrival_airport?.code || last?.destination || null;
      const origin = originCity || originAirport || null;
      const destination = destinationCity || destinationAirport || null;
      const departure = [first?.departure_date, first?.departure_time].filter(Boolean).join(' ') || null;
      const arrival = [last?.arrival_date, last?.arrival_time].filter(Boolean).join(' ') || null;
      const airline = first?.carrier?.airline_name || first?.carrier?.airline_code || null;
      const flightNumber = first?.flight_number || null;
      return {
        origin,
        destination,
        originAirport,
        destinationAirport,
        departure,
        arrival,
        airline,
        flightNumber
      };
    };

    return {
      outbound: legInfo(outboundSegments),
      returnLeg: legInfo(returnSegments),
    };
  };

  const loadOrders = async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    try {
      setLoading(true);
      setError(null);
      console.log('[AdminDashboard] loadOrders start');

      let profile = userProfile;
      if (!profile) {
        let dbProfile = null;
        try {
          const profileResp = await getProfile(user.id);
          dbProfile = profileResp?.data || null;
        } catch {
          dbProfile = null;
        }

        const role = normalizeRole(dbProfile?.role || user?.role || 'user');
        profile = {
          id: user.id,
          role,
          agency_id: dbProfile?.agency_id || user?.agency_id || null
        };

        if (role === 'agent' && !profile.agency_id) {
          const { data: agencyData } = await getMyAgency();
          if (agencyData?.id) {
            profile.agency_id = agencyData.id;
          }
        }

        console.log('[AdminDashboard] User profile:', profile);
        setUserProfile(profile);

        if (['admin', 'super_admin'].includes(profile.role) && isSuperAdminView) {
          void loadAdminData();
        } else if (profile.role === 'agent' || isAgencyAdminPreview) {
          void loadMyAgencySettings();
        }

        if (!['admin', 'super_admin', 'agent'].includes(profile.role)) {
          throw new Error('Access denied: insufficient permissions');
        }
      }

      if (!profile) {
        throw new Error('Failed to resolve user profile');
      }

      console.log('[AdminDashboard] Loading orders from orders table...');
      let agencyId = profile.role === 'agent' ? profile.agency_id : null;
      if (isAgencyAdminPreview) {
        agencyId = profile.agency_id || agencyPreviewId || null;
        if (!agencyId) {
          const resolvedAgencyId = await loadMyAgencySettings();
          agencyId = resolvedAgencyId || null;
        }
      }

      if (profile.role === 'agent' && !agencyId) {
        throw new Error('Agency is not linked to this account');
      }
      if (isAgencyAdminPreview && !agencyId) {
        setNotice({ type: 'error', text: 'Agency link is missing. Open Agencies section and select/create agency.' });
      }

      if (agencyId) {
        console.log('[AdminDashboard] Filtering by agency_id:', agencyId);
      }
      const { data, error } = await withTimeout(
        'AdminDashboard orders load',
        getOrdersList({ agencyId, limit: 200 }),
        30000
      );

      if (error) throw error;
      console.log('[AdminDashboard] Orders loaded:', data?.length || 0);

      const normalized = (data || []).map((o) => ({
        ...o,
        status: normalizeStatus(o.status),
      }));
      normalized.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      if (normalized.length > 0) {
        setOrders(normalized);
        writeOrdersCache(normalized);
      } else {
        const cache = readOrdersCache().map((o) => ({ ...o, status: normalizeStatus(o.status) }));
        cache.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        setOrders(cache);
      }
    } catch (err) {
      console.error('Error loading orders:', err);
      const cache = readOrdersCache().map((o) => ({ ...o, status: normalizeStatus(o.status) }));
      cache.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

      if (cache.length > 0) {
        setOrders(cache);
        setError(
          `Showing locally cached orders (${cache.length}). ` +
          `Database is temporarily unavailable: ${err.message}`
        );
      } else {
        setError(
          `Failed to load orders: ${err.message}. ` +
          `Please refresh the page in a few seconds.`
        );
      }
    } finally {
      console.log('[AdminDashboard] loadOrders finally -> setLoading(false)');
      setLoading(false);
      loadingRef.current = false;
    }
  };

  const loadAdminData = async () => {
    try {
      setAdminLoading(true);
      const [agenciesRes, summaryRes, invoicesRes, ticketsRes, superAdminsRes] = await Promise.allSettled([
        getAdminAgencies(),
        getAdminOrdersSummary(),
        getAdminInvoices({ limit: 20 }),
        getAdminTickets({ limit: 20 }),
        ['admin', 'super_admin'].includes(userProfile?.role)
          ? getAdminSuperAdmins()
          : Promise.resolve({ data: [], error: null })
      ]);

      if (agenciesRes.status === 'fulfilled' && !agenciesRes.value?.error) {
        setAgencies(Array.isArray(agenciesRes.value?.data) ? agenciesRes.value.data : []);
      }
      if (summaryRes.status === 'fulfilled' && !summaryRes.value?.error) {
        setReportSummary(summaryRes.value?.data || null);
      }
      if (invoicesRes.status === 'fulfilled' && !invoicesRes.value?.error) {
        setInvoices(Array.isArray(invoicesRes.value?.data) ? invoicesRes.value.data : []);
      }
      if (ticketsRes.status === 'fulfilled' && !ticketsRes.value?.error) {
        setTickets(Array.isArray(ticketsRes.value?.data) ? ticketsRes.value.data : []);
      }
      if (superAdminsRes.status === 'fulfilled' && !superAdminsRes.value?.error) {
        setSuperAdmins(Array.isArray(superAdminsRes.value?.data) ? superAdminsRes.value.data : []);
      }
    } catch (err) {
      console.error('Admin tools load failed:', err);
    } finally {
      setAdminLoading(false);
    }
  };

  const loadSuperAdmins = async () => {
    try {
      setSuperAdminsLoading(true);
      const { data, error } = await getAdminSuperAdmins();
      if (error) throw new Error(error.message || 'Super admins load failed');
      setSuperAdmins(Array.isArray(data) ? data : []);
    } catch (err) {
      setNotice({ type: 'error', text: `Failed to load super admins: ${err.message}` });
    } finally {
      setSuperAdminsLoading(false);
    }
  };

  const applyAgencyToSelfForm = (agencyData) => {
    const commission = agencyData?.settings?.commission || {};
    const bankDetails = agencyData?.settings?.bank_details || {};
    setAgencySelfForm({
      commission_rate: agencyData?.commission_rate ?? 0,
      commission_model: commission.model || 'percent',
      commission_fixed_amount: commission.fixed_amount ?? 0,
      currency: (commission.currency || 'SAR').toUpperCase(),
      bank_name: bankDetails.bank_name || '',
      bank_account: bankDetails.bank_account || '',
      iban: bankDetails.iban || '',
      swift_bic: bankDetails.swift_bic || '',
      sama_code: bankDetails.sama_code || '',
      contact_person_name: agencyData?.settings?.contact_person?.full_name || '',
      widget_allowed_domains: Array.isArray(agencyData?.settings?.widget_allowed_domains)
        ? agencyData.settings.widget_allowed_domains.join('\n')
        : ''
    });
    const domains = Array.isArray(agencyData?.settings?.widget_allowed_domains)
      ? agencyData.settings.widget_allowed_domains
      : [];
    setWidgetDomains(domains.map((d) => normalizeWidgetDomain(d)).filter(Boolean));
    setDomainsDirty(false);
    setShowAddDomain(false);
    setDomainDraft('');
    setAgencySelfMeta({
      id: agencyData?.id || null,
      name: agencyData?.name || null,
      domain: agencyData?.domain || null,
      api_key: agencyData?.api_key || null
    });
  };

  const loadMyAgencySettings = async () => {
    try {
      setAgencySelfLoading(true);
      if (isAgencyAdminPreview && ['admin', 'super_admin'].includes(userProfile?.role || user?.role)) {
        const { data: agenciesData, error: agenciesError } = await getAdminAgencies({ limit: 100 });
        if (agenciesError) throw new Error(agenciesError.message || 'Agency settings load failed');
        const list = Array.isArray(agenciesData) ? agenciesData : [];
        if (!list.length) {
          const mine = await getMyAgency();
          if (mine?.data?.id) {
            applyAgencyToSelfForm(mine.data);
            setAgencyPreviewId(mine.data.id);
            setUserProfile((prev) => (prev ? { ...prev, agency_id: prev.agency_id || mine.data.id } : prev));
            return mine.data.id;
          }
          throw new Error('No agencies found');
        }
        setAgencies(list);

        const resolvedId = userProfile?.agency_id || agencyPreviewId || list[0]?.id || null;
        if (!resolvedId) {
          throw new Error('No agencies available for agency admin mode');
        }
        if (agencyPreviewId !== resolvedId) {
          setAgencyPreviewId(resolvedId);
        }
        setUserProfile((prev) => (prev ? { ...prev, agency_id: prev.agency_id || resolvedId } : prev));
        const selectedAgency = list.find((a) => a.id === resolvedId) || list[0];
        if (!selectedAgency) throw new Error('Agency not found');
        applyAgencyToSelfForm(selectedAgency);
        return selectedAgency.id;
      }

      const { data, error } = await getMyAgency();
      if (error) throw new Error(error.message || 'Agency settings load failed');
      applyAgencyToSelfForm(data);
      return data?.id || null;
    } catch (err) {
      setNotice({ type: 'error', text: `Failed to load agency settings: ${err.message}` });
      return null;
    } finally {
      setAgencySelfLoading(false);
    }
  };

  const resolveAgencyIdForAgencyAdmin = async () => {
    let resolvedId = userProfile?.agency_id || agencyPreviewId || agencies[0]?.id || null;
    if (resolvedId) return resolvedId;

    const preferredEmail = String(user?.email || '').trim().toLowerCase();
    const fromAdmin = await getAdminAgencies({ limit: 200 });
    if (!fromAdmin?.error && Array.isArray(fromAdmin?.data) && fromAdmin.data.length > 0) {
      const list = fromAdmin.data;
      setAgencies(list);
      const matched = list.find((a) => String(a?.contact_email || '').trim().toLowerCase() === preferredEmail) || list[0];
      resolvedId = matched?.id || null;
      if (resolvedId) {
        setAgencyPreviewId(resolvedId);
        setUserProfile((prev) => (prev ? { ...prev, agency_id: prev.agency_id || resolvedId } : prev));
        if (matched) applyAgencyToSelfForm(matched);
        return resolvedId;
      }
    }

    const mine = await getMyAgency();
    if (mine?.data?.id) {
      resolvedId = mine.data.id;
      setAgencyPreviewId(resolvedId);
      setUserProfile((prev) => (prev ? { ...prev, agency_id: prev.agency_id || resolvedId } : prev));
      applyAgencyToSelfForm(mine.data);
      return resolvedId;
    }

    return null;
  };

  const loadAgencies = async () => {
    try {
      setAgenciesLoading(true);
      const params = {
        q: agencyFilters.q || undefined,
        is_active: agencyFilters.is_active === 'all' ? undefined : agencyFilters.is_active
      };
      const { data, error } = await getAdminAgencies(params);
      if (error) throw new Error(error.message || 'Agencies load failed');
      setAgencies(Array.isArray(data) ? data : []);
    } catch (err) {
      setNotice({ type: 'error', text: `Failed to load agencies: ${err.message}` });
    } finally {
      setAgenciesLoading(false);
    }
  };

  const loadInvoices = async () => {
    try {
      setInvoicesLoading(true);
      const params = {
        agency_id: invoiceFilters.agency_id || undefined,
        currency: invoiceFilters.currency || undefined,
        date_from: invoiceFilters.date_from || undefined,
        date_to: invoiceFilters.date_to || undefined
      };
      const { data, error } = await getAdminInvoices(params);
      if (error) throw new Error(error.message || 'Invoices load failed');
      setInvoices(Array.isArray(data) ? data : []);
    } catch (err) {
      setNotice({ type: 'error', text: `Failed to load invoices: ${err.message}` });
    } finally {
      setInvoicesLoading(false);
    }
  };

  const loadTickets = async () => {
    try {
      setTicketsLoading(true);
      const params = {
        agency_id: ticketFilters.agency_id || undefined,
        order_status: ticketFilters.order_status || undefined,
        status: ticketFilters.status || undefined,
        email_status: ticketFilters.email_status || undefined,
        date_from: ticketFilters.date_from || undefined,
        date_to: ticketFilters.date_to || undefined,
        q: ticketFilters.q || undefined
      };
      const { data, error } = await getAdminTickets(params);
      if (error) throw new Error(error.message || 'Tickets load failed');
      const rows = Array.isArray(data) ? data : [];
      rows.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      setTickets(rows);
    } catch (err) {
      setNotice({ type: 'error', text: `Failed to load tickets: ${err.message}` });
    } finally {
      setTicketsLoading(false);
    }
  };

  const handleCreateAgency = async () => {
    try {
      const payload = {
        name: agencyForm.name,
        domain: agencyForm.domain || null,
        contact_email: agencyForm.contact_email,
        contact_phone: agencyForm.contact_phone || null,
        contact_person_name: agencyForm.contact_person_name || null,
        country: agencyForm.country || 'SA',
        bank_details: {
          bank_name: agencyForm.bank_name || null,
          bank_account: agencyForm.bank_account || null,
          iban: agencyForm.iban || null,
          swift_bic: agencyForm.swift_bic || null,
          sama_code: agencyForm.sama_code || null
        },
        widget_allowed_domains: parseWidgetDomains(agencyForm.widget_allowed_domains)
      };
      const { data, error } = await createAdminAgency(payload);
      if (error) throw new Error(error.message || 'Failed to create agency');
      setNotice({ type: 'success', text: `Agency created: ${data?.name || 'OK'}` });
      setAgencyForm((prev) => ({
        ...prev,
        name: '',
        domain: '',
        contact_email: '',
        contact_phone: '',
        contact_person_name: '',
        bank_name: '',
        bank_account: '',
        iban: '',
        swift_bic: '',
        sama_code: '',
        widget_allowed_domains: ''
      }));
      setShowCreateAgencyForm(false);
      await Promise.all([loadAdminData(), loadAgencies()]);
    } catch (err) {
      setNotice({ type: 'error', text: `Failed to create agency: ${err.message}` });
    }
  };

  const handleCreateSuperAdmin = async () => {
    const email = String(superAdminForm.email || '').trim().toLowerCase();
    if (!email) {
      setNotice({ type: 'error', text: 'Enter email for super admin' });
      return;
    }

    try {
      setCreatingSuperAdmin(true);
      const payload = {
        email,
        full_name: String(superAdminForm.full_name || '').trim() || null,
        phone: String(superAdminForm.phone || '').trim() || null
      };
      const { data, created, error } = await createAdminSuperAdmin(payload);
      if (error) throw new Error(error.message || 'Failed to create super admin');
      setNotice({
        type: 'success',
        text: created
          ? `Super admin added: ${data?.email || email}`
          : `Super admin permissions updated: ${data?.email || email}`
      });
      setSuperAdminForm({ email: '', full_name: '', phone: '' });
      await loadSuperAdmins();
    } catch (err) {
      setNotice({ type: 'error', text: `Failed to create super admin: ${err.message}` });
    } finally {
      setCreatingSuperAdmin(false);
    }
  };

  const beginEditAgency = (agency) => {
    setAgencyEditId(agency.id);
    setAgencyEditForm({
      name: agency.name || '',
      domain: agency.domain || '',
      contact_email: agency.contact_email || '',
      contact_phone: agency.contact_phone || '',
      is_active: !!agency.is_active,
      contact_person_name: agency?.settings?.contact_person?.full_name || '',
      bank_name: agency?.settings?.bank_details?.bank_name || '',
      bank_account: agency?.settings?.bank_details?.bank_account || '',
      iban: agency?.settings?.bank_details?.iban || '',
      swift_bic: agency?.settings?.bank_details?.swift_bic || '',
      sama_code: agency?.settings?.bank_details?.sama_code || '',
      widget_allowed_domains: Array.isArray(agency?.settings?.widget_allowed_domains)
        ? agency.settings.widget_allowed_domains.join('\n')
        : ''
    });
  };

  const handleSaveAgency = async (agencyId) => {
    try {
      const payload = {
        name: agencyEditForm.name,
        domain: agencyEditForm.domain || null,
        contact_email: agencyEditForm.contact_email,
        contact_phone: agencyEditForm.contact_phone || null,
        is_active: !!agencyEditForm.is_active,
        contact_person_name: agencyEditForm.contact_person_name || null,
        bank_details: {
          bank_name: agencyEditForm.bank_name || null,
          bank_account: agencyEditForm.bank_account || null,
          iban: agencyEditForm.iban || null,
          swift_bic: agencyEditForm.swift_bic || null,
          sama_code: agencyEditForm.sama_code || null
        },
        widget_allowed_domains: parseWidgetDomains(agencyEditForm.widget_allowed_domains)
      };
      const { error } = await updateAdminAgency(agencyId, payload);
      if (error) throw new Error(error.message || 'Agency update failed');
      setNotice({ type: 'success', text: 'Agency updated' });
      setAgencyEditId(null);
      await Promise.all([loadAdminData(), loadAgencies()]);
    } catch (err) {
      setNotice({ type: 'error', text: `Failed to update agency: ${err.message}` });
    }
  };

  const handleToggleAgencyActive = async (agency) => {
    try {
      const { error } = await updateAdminAgency(agency.id, {
        is_active: !agency.is_active
      });
      if (error) throw new Error(error.message || 'Agency status update failed');
      setNotice({ type: 'success', text: agency.is_active ? 'Agency suspended' : 'Agency activated' });
      await Promise.all([loadAdminData(), loadAgencies()]);
    } catch (err) {
      setNotice({ type: 'error', text: `Failed to update agency status: ${err.message}` });
    }
  };

  const handleDeleteAgency = async (agency) => {
    try {
      const { error } = await deleteAdminAgency(agency.id);
      if (error) throw new Error(error.message || 'Agency delete failed');
      setNotice({ type: 'success', text: `Agency deleted: ${agency.name}` });
      await Promise.all([loadAdminData(), loadAgencies()]);
    } catch (err) {
      setNotice({ type: 'error', text: `Failed to delete agency: ${err.message}` });
    }
  };

  const handleCreateInvoice = async () => {
    try {
      const statuses = String(invoiceForm.statuses || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        agency_id: invoiceForm.agency_id,
        period_from: invoiceForm.period_from,
        period_to: invoiceForm.period_to,
        currency: invoiceForm.currency || 'EUR',
        manual_total: invoiceForm.manual_total === '' ? null : Number(invoiceForm.manual_total),
        statuses
      };
      const { data, error } = await createAdminInvoice(payload);
      if (error) throw new Error(error.message || 'Failed to create invoice');
      setNotice({ type: 'success', text: `Invoice created: ${data?.invoice_number || data?.id}` });
      setInvoiceForm((prev) => ({ ...prev, manual_total: '' }));
      await Promise.all([loadAdminData(), loadInvoices()]);
    } catch (err) {
      setNotice({ type: 'error', text: `Failed to create invoice: ${err.message}` });
    }
  };

  const handleGenerateInvoicePdf = async (invoiceId) => {
    const popup = window.open('about:blank', '_blank');
    try {
      const { downloadUrl, error } = await generateAdminInvoicePdf(invoiceId);
      if (error) throw new Error(error.message || 'Invoice PDF generation failed');
      setNotice({ type: 'success', text: 'Invoice PDF generated' });
      if (downloadUrl) {
        if (popup) {
          popup.location.href = downloadUrl;
        } else {
          window.location.assign(downloadUrl);
        }
      } else if (popup) {
        popup.close();
      }
      await loadInvoices();
    } catch (err) {
      if (popup) popup.close();
      setNotice({ type: 'error', text: `Failed to generate PDF: ${err.message}` });
    }
  };

  const handleMarkInvoiceIssued = async (invoiceId) => {
    const popup = window.open('about:blank', '_blank');
    try {
      const { error, downloadUrl } = await updateAdminInvoice(invoiceId, { status: 'issued' });
      if (error) throw new Error(error.message || 'Invoice status update failed');
      setNotice({ type: 'success', text: 'Invoice marked as issued, PDF generated' });
      if (downloadUrl) {
        if (popup) {
          popup.location.href = downloadUrl;
        } else {
          window.location.assign(downloadUrl);
        }
      } else if (popup) {
        popup.close();
      }
      await loadInvoices();
    } catch (err) {
      if (popup) popup.close();
      setNotice({ type: 'error', text: `Failed to update invoice status: ${err.message}` });
    }
  };

  const handleDownloadDocument = async (documentId) => {
    const popup = window.open('about:blank', '_blank');
    try {
      const { url, error } = await getDocumentDownloadUrl(documentId);
      if (error) throw new Error(error.message || 'Document download failed');
      if (!url) throw new Error('Download URL not returned');
      if (popup) {
        popup.location.href = url;
      } else {
        window.location.assign(url);
      }
    } catch (err) {
      if (popup) popup.close();
      setNotice({ type: 'error', text: `Failed to download PDF: ${err.message}` });
    }
  };

  const handleDownloadOrderTicketPdf = async (orderId) => {
    const popup = window.open('about:blank', '_blank');
    try {
      setTicketDocLoadingId(orderId);
      const { error, url } = await getOrderTicketDocument(orderId);
      if (error) throw new Error(error.message || 'Ticket PDF not found');
      if (!url) throw new Error('Download URL not returned');
      if (popup) {
        popup.location.href = url;
      } else {
        window.location.assign(url);
      }
    } catch (err) {
      if (popup) popup.close();
      setNotice({ type: 'error', text: `Failed to download ticket PDF: ${err.message}` });
    } finally {
      setTicketDocLoadingId(null);
    }
  };

  const handleSaveMyAgencySettings = async () => {
    try {
      setAgencySelfLoading(true);
      const payload = {
        commission_rate: agencySelfForm.commission_model === 'percent'
          ? Number(agencySelfForm.commission_rate || 0)
          : 0,
        commission_model: agencySelfForm.commission_model || 'percent',
        commission_fixed_amount: agencySelfForm.commission_model === 'fixed'
          ? Number(agencySelfForm.commission_fixed_amount || 0)
          : 0,
        currency: agencySelfForm.currency || 'SAR',
        bank_details: {
          bank_name: agencySelfForm.bank_name || null,
          bank_account: agencySelfForm.bank_account || null,
          iban: agencySelfForm.iban || null,
          swift_bic: agencySelfForm.swift_bic || null,
          sama_code: agencySelfForm.sama_code || null
        },
        contact_person_name: agencySelfForm.contact_person_name || null,
        widget_allowed_domains: widgetDomains
      };
      let agencyIdForUpdate = userProfile?.agency_id || agencyPreviewId || agencies[0]?.id || null;
      if (isAgencyAdminPreview && !agencyIdForUpdate) {
        const resolvedAgencyId = await loadMyAgencySettings();
        agencyIdForUpdate = resolvedAgencyId || null;
      }
      if (isAgencyAdminPreview && !agencyIdForUpdate) {
        agencyIdForUpdate = await resolveAgencyIdForAgencyAdmin();
      }
      if (isAgencyAdminPreview && !agencyIdForUpdate) {
        throw new Error('Agency is not linked to this account');
      }
      const { error } = (isAgencyAdminPreview && ['admin', 'super_admin'].includes(userProfile?.role))
        ? await updateAdminAgency(agencyIdForUpdate, payload)
        : await updateMyAgency(payload);
      if (error) throw new Error(error.message || 'Agency settings update failed');
      setNotice({ type: 'success', text: 'Agency settings saved' });
      if (isAgencyAdminPreview) {
        await loadAdminData();
      } else {
        await loadMyAgencySettings();
      }
    } catch (err) {
      setNotice({ type: 'error', text: `Failed to save settings: ${err.message}` });
    } finally {
      setAgencySelfLoading(false);
    }
  };

  const handleAddWidgetDomain = () => {
    const next = normalizeWidgetDomain(domainDraft);
    if (!next) {
      setNotice({ type: 'error', text: 'Enter a valid domain (for example: example.com)' });
      return;
    }
    if (widgetDomains.includes(next)) {
      setNotice({ type: 'error', text: 'Domain already added' });
      return;
    }
    setWidgetDomains((prev) => [...prev, next]);
    setDomainDraft('');
    setShowAddDomain(false);
    setDomainsDirty(true);
  };

  const handleRemoveWidgetDomain = (domain) => {
    setWidgetDomains((prev) => prev.filter((d) => d !== domain));
    setDomainsDirty(true);
  };

  const handleSaveWidgetDomains = async () => {
    try {
      setDomainsSaving(true);
      const payload = {
        widget_allowed_domains: widgetDomains
      };
      let agencyIdForUpdate = userProfile?.agency_id || agencyPreviewId || agencies[0]?.id || null;
      if (isAgencyAdminPreview && !agencyIdForUpdate) {
        const resolvedAgencyId = await loadMyAgencySettings();
        agencyIdForUpdate = resolvedAgencyId || null;
      }
      if (isAgencyAdminPreview && !agencyIdForUpdate) {
        agencyIdForUpdate = await resolveAgencyIdForAgencyAdmin();
      }
      if (isAgencyAdminPreview && !agencyIdForUpdate) {
        throw new Error('Agency is not linked to this account');
      }
      const { error } = (isAgencyAdminPreview && ['admin', 'super_admin'].includes(userProfile?.role))
        ? await updateAdminAgency(agencyIdForUpdate, payload)
        : await updateMyAgency(payload);
      if (error) throw new Error(error.message || 'Domains save failed');
      setDomainsDirty(false);
      setNotice({ type: 'success', text: 'Widget domains saved' });
      if (isAgencyAdminPreview) {
        await loadAdminData();
      } else {
        await loadMyAgencySettings();
      }
    } catch (err) {
      setNotice({ type: 'error', text: `Failed to save widget domains: ${err.message}` });
    } finally {
      setDomainsSaving(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      setUpdatingOrderId(orderId);
      const nextStatus = normalizeStatus(newStatus);

      const nowIso = new Date().toISOString();
      const { error } = await updateOrderStatusApi(orderId, nextStatus, {
        updated_at: nowIso,
        ...(nextStatus === 'confirmed' ? { confirmed_at: nowIso } : {}),
        ...(nextStatus === 'cancelled' ? { cancelled_at: nowIso } : {}),
        ...(nextStatus !== 'cancelled' ? { cancelled_at: null } : {}),
        ...(nextStatus !== 'confirmed' ? { confirmed_at: null } : {})
      });

      if (error) throw error;
      const updatedAt = nowIso;

      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status: nextStatus,
                updated_at: updatedAt,
                confirmed_at: nextStatus === 'confirmed' ? updatedAt : null,
                cancelled_at: nextStatus === 'cancelled' ? updatedAt : null,
              }
            : o
        )
      );

      setSelectedOrder((prev) =>
        prev && prev.id === orderId
          ? { ...prev, status: nextStatus, updated_at: updatedAt }
          : prev
      );

      setNotice({
        type: 'success',
        text: `Order status updated: ${getStatusConfig(nextStatus).label}`,
      });
    } catch (err) {
      console.error('Error updating status:', err);
      setNotice({
        type: 'error',
        text: `Failed to update order status: ${err.message}`,
      });
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleIssueTicket = async (order) => {
    try {
      setIssuingOrderId(order.id);

      const orderIdForDRCT =
        order.drct_order_id ||
        order.booking_reference ||
        order.order_number ||
        order.id;

      const { error: issueError } = await drctApi.issueTickets(orderIdForDRCT);
      if (issueError) {
        throw new Error(issueError.message || 'Issue ticket failed');
      }

      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'ticketed',
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id);

      if (updateError) throw updateError;

      const { error: ticketFinalizeError, email } = await finalizeTicketDocument(order.id, {
        send_email: true,
        pnr: order.drct_order_id || null
      });
      if (ticketFinalizeError) {
        setNotice({
          type: 'error',
          text: `Ticket issued, but PDF/email finalization is incomplete: ${ticketFinalizeError.message}`
        });
      } else if (email?.sent) {
        setNotice({ type: 'success', text: 'Ticket issued and emailed to customer' });
      } else {
        setNotice({ type: 'success', text: 'Ticket issued. PDF generated.' });
      }

      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id
            ? {
                ...o,
                status: 'ticketed',
                updated_at: new Date().toISOString(),
              }
            : o
        )
      );

    } catch (err) {
      console.error('Error issuing ticket:', err);
      setNotice({ type: 'error', text: `Failed to issue ticket: ${err.message}` });
    } finally {
      setIssuingOrderId(null);
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      pending: {
        icon: Clock,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        label: 'Awaiting payment'
      },
      confirmed: {
        icon: CheckCircle,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        label: 'Confirmed'
      },
      ticketed: {
        icon: CheckCircle,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        label: 'Ticketed'
      },
      cancelled: {
        icon: XCircle,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        label: 'Cancelled'
      },
    };

    return configs[status] || configs.pending;
  };

  const filteredOrders = orders.filter(order => {
    // Status filter
    if (statusFilter !== 'all' && normalizeStatus(order.status) !== statusFilter) {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        order.order_number?.toLowerCase().includes(query) ||
        order.contact_email?.toLowerCase().includes(query) ||
        order.contact_phone?.toLowerCase().includes(query) ||
        order.origin?.toLowerCase().includes(query) ||
        order.destination?.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter(o => normalizeStatus(o.status) === 'pending').length,
    confirmed: orders.filter(o => normalizeStatus(o.status) === 'confirmed').length,
    ticketed: orders.filter(o => normalizeStatus(o.status) === 'ticketed').length,
    cancelled: orders.filter(o => normalizeStatus(o.status) === 'cancelled').length,
  };
  const showOrdersArea = (
    isAgencyAdminPreview ||
    userProfile?.role === 'agent' ||
    !['admin', 'super_admin'].includes(userProfile?.role) ||
    activeAdminSection === 'tickets'
  );

  const widgetEmbedSnippet = useMemo(() => {
    const agencyKey = agencySelfMeta?.api_key || agencySelfMeta?.domain || agencySelfMeta?.id || '';
    if (!agencyKey) {
      return '<!-- Save agency settings first to get the widget key -->';
    }
    const widgetBase = typeof window !== 'undefined' ? window.location.origin : '';
    const rawN8nBase = String(import.meta.env.VITE_N8N_BASE_URL || '/api/n8n/webhook-test').replace(/\/+$/, '');
    const n8nBaseAbsolute = rawN8nBase.startsWith('http')
      ? rawN8nBase
      : `${widgetBase}${rawN8nBase.startsWith('/') ? '' : '/'}${rawN8nBase}`;
    const widgetApiUrl = n8nBaseAbsolute.endsWith('/drct')
      ? n8nBaseAbsolute
      : `${n8nBaseAbsolute}/drct`;
    return `<div
  id="aviaframe-widget"
  data-aviaframe-widget
  data-api-url="${widgetApiUrl}"
  data-brand-name="${agencySelfMeta?.name || 'Aviaframe'}"
  data-title="Flight Search"
></div>
<script
  src="${widgetBase}/partner-widget/aviaframe-widget.js"
></script>`;
  }, [agencySelfMeta?.api_key, agencySelfMeta?.domain, agencySelfMeta?.name]);

  const widgetPreviewUrl = useMemo(() => {
    const agencyKey = agencySelfMeta?.api_key || agencySelfMeta?.domain || agencySelfMeta?.id || '';
    const widgetBase = typeof window !== 'undefined' ? window.location.origin : '';
    if (!widgetBase) return '/widget-preview.html';
    const preview = new URL('/widget-preview.html', widgetBase);
    if (agencyKey) preview.searchParams.set('agency_key', agencyKey);
    const rawN8nBase = String(import.meta.env.VITE_N8N_BASE_URL || '/api/n8n/webhook-test').replace(/\/+$/, '');
    const n8nBaseAbsolute = rawN8nBase.startsWith('http')
      ? rawN8nBase
      : `${widgetBase}${rawN8nBase.startsWith('/') ? '' : '/'}${rawN8nBase}`;
    const widgetApiUrl = n8nBaseAbsolute.endsWith('/drct')
      ? n8nBaseAbsolute
      : `${n8nBaseAbsolute}/drct`;
    preview.searchParams.set('api_url', widgetApiUrl);
        preview.searchParams.set('agency_name', agencySelfMeta?.name || 'Aviaframe');
    return preview.toString();
  }, [agencySelfMeta?.api_key, agencySelfMeta?.domain, agencySelfMeta?.name]);

  const handleCopyWidgetSnippet = async () => {
    if (!widgetEmbedSnippet) return;
    const agencyKey = agencySelfMeta?.api_key || agencySelfMeta?.domain || agencySelfMeta?.id || '';
    if (!agencyKey) {
      setNotice({ type: 'error', text: 'Save agency settings first and obtain the widget key.' });
      return;
    }
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(widgetEmbedSnippet);
      } else {
        const ta = document.createElement('textarea');
        ta.value = widgetEmbedSnippet;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setNotice({ type: 'success', text: 'Widget code copied' });
    } catch {
      setNotice({ type: 'error', text: 'Failed to copy widget code' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading orders...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBackToHome}
                className="text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft size={24} />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {isAgencyAdminPreview || userProfile?.role === 'agent' ? 'Agency Dashboard' : 'Admin Dashboard'}
                </h1>
                <p className="text-gray-600 mt-1">
                  {isAgencyAdminPreview || userProfile?.role === 'agent' ? 'Manage agency orders' : 'Manage all orders'}
                </p>
              </div>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-md border ${(isAgencyAdminPreview || userProfile?.role === 'agent') ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'}`}>
              <User size={18} className={(isAgencyAdminPreview || userProfile?.role === 'agent') ? 'text-blue-600' : 'text-red-600'} />
              <span className={`text-sm font-medium ${(isAgencyAdminPreview || userProfile?.role === 'agent') ? 'text-blue-900' : 'text-red-900'}`}>
                {(isAgencyAdminPreview || userProfile?.role === 'agent') ? 'Agency Admin' : 'Admin'}: {user?.email}
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        {showOrdersArea && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`text-left rounded-lg shadow-md p-4 border ${statusFilter === 'all' ? 'border-gray-500 bg-gray-50' : 'border-transparent bg-white'}`}
            >
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-600">Total orders</div>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('pending')}
              className={`text-left rounded-lg shadow-md p-4 border ${statusFilter === 'pending' ? 'border-orange-400 bg-orange-100' : 'border-orange-200 bg-orange-50'}`}
            >
              <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
              <div className="text-sm text-orange-700">Awaiting payment</div>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('confirmed')}
              className={`text-left rounded-lg shadow-md p-4 border ${statusFilter === 'confirmed' ? 'border-blue-400 bg-blue-100' : 'border-blue-200 bg-blue-50'}`}
            >
              <div className="text-2xl font-bold text-blue-600">{stats.confirmed}</div>
              <div className="text-sm text-blue-700">Confirmed</div>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('ticketed')}
              className={`text-left rounded-lg shadow-md p-4 border ${statusFilter === 'ticketed' ? 'border-green-400 bg-green-100' : 'border-green-200 bg-green-50'}`}
            >
              <div className="text-2xl font-bold text-green-600">{stats.ticketed}</div>
              <div className="text-sm text-green-700">Ticketed</div>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('cancelled')}
              className={`text-left rounded-lg shadow-md p-4 border ${statusFilter === 'cancelled' ? 'border-red-400 bg-red-100' : 'border-red-200 bg-red-50'}`}
            >
              <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
              <div className="text-sm text-red-700">Cancelled</div>
            </button>
          </div>
        )}

        {/* Agency Admin Settings */}
        {(userProfile?.role === 'agent' || isAgencyAdminPreview) && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-6 border border-blue-100">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Agency settings</h2>
            <p className="text-sm text-gray-600 mb-3">
              Set commission model: percentage or fixed amount per sold ticket.
            </p>
            {isAgencyAdminPreview && (
              <div className="mb-3 text-sm text-gray-600">
                Agency: <span className="font-semibold text-gray-900">{agencies.find((a) => a.id === (userProfile?.agency_id || agencyPreviewId))?.name || agencies[0]?.name || '—'}</span>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
              <select
                value={agencySelfForm.commission_model}
                onChange={(e) => setAgencySelfForm((p) => ({ ...p, commission_model: e.target.value }))}
                className="border rounded px-2 py-1"
              >
                <option value="percent">Percent</option>
                <option value="fixed">Fixed</option>
              </select>
              {agencySelfForm.commission_model === 'percent' ? (
                <div className="flex items-center border rounded px-2 py-1">
                  <input
                    type="number"
                    value={agencySelfForm.commission_rate}
                    onChange={(e) => setAgencySelfForm((p) => ({ ...p, commission_rate: e.target.value }))}
                    placeholder="Commission"
                    className="w-full outline-none"
                  />
                  <span className="text-gray-500 text-sm">%</span>
                </div>
              ) : (
                <input
                  type="number"
                  value={agencySelfForm.commission_fixed_amount}
                  onChange={(e) => setAgencySelfForm((p) => ({ ...p, commission_fixed_amount: e.target.value }))}
                  placeholder="Fixed amount"
                  className="border rounded px-2 py-1"
                />
              )}
              <select
                value={agencySelfForm.currency}
                onChange={(e) => setAgencySelfForm((p) => ({ ...p, currency: e.target.value.toUpperCase() }))}
                className="border rounded px-2 py-1"
              >
                <option value="SAR">SAR</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
              </select>
              <input
                value={agencySelfForm.contact_person_name}
                onChange={(e) => setAgencySelfForm((p) => ({ ...p, contact_person_name: e.target.value }))}
                placeholder="Contact person full name"
                className="border rounded px-2 py-1"
              />
              <input
                value={agencySelfForm.bank_name}
                onChange={(e) => setAgencySelfForm((p) => ({ ...p, bank_name: e.target.value }))}
                placeholder="Bank name"
                className="border rounded px-2 py-1"
              />
              <input
                value={agencySelfForm.bank_account}
                onChange={(e) => setAgencySelfForm((p) => ({ ...p, bank_account: e.target.value }))}
                placeholder="Account number"
                className="border rounded px-2 py-1"
              />
              <input
                value={agencySelfForm.iban}
                onChange={(e) => setAgencySelfForm((p) => ({ ...p, iban: e.target.value.toUpperCase() }))}
                placeholder="IBAN (SA...)"
                className="border rounded px-2 py-1"
              />
              <input
                value={agencySelfForm.swift_bic}
                onChange={(e) => setAgencySelfForm((p) => ({ ...p, swift_bic: e.target.value.toUpperCase() }))}
                placeholder="SWIFT/BIC"
                className="border rounded px-2 py-1"
              />
              <input
                value={agencySelfForm.sama_code}
                onChange={(e) => setAgencySelfForm((p) => ({ ...p, sama_code: e.target.value.toUpperCase() }))}
                placeholder="SAMA bank code"
                className="border rounded px-2 py-1"
              />
              <div className="md:col-span-3 border rounded px-3 py-3 bg-white">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-gray-700">Allowed widget domains</span>
                  <button
                    onClick={() => setShowAddDomain((v) => !v)}
                    className="bg-indigo-600 text-white rounded px-3 py-1 text-xs"
                  >
                    Add domain
                  </button>
                  <button
                    onClick={handleSaveWidgetDomains}
                    disabled={!domainsDirty || domainsSaving}
                    className={`rounded px-3 py-1 text-xs ${(!domainsDirty || domainsSaving) ? 'bg-gray-200 text-gray-500' : 'bg-blue-600 text-white'}`}
                  >
                    {domainsSaving ? 'Saving...' : domainsDirty ? 'Save domains' : 'Saved'}
                  </button>
                </div>
                {showAddDomain && (
                  <div className="flex gap-2 mb-2">
                    <input
                      value={domainDraft}
                      onChange={(e) => setDomainDraft(e.target.value)}
                      placeholder="example.com"
                      className="border rounded px-2 py-1 flex-1"
                    />
                    <button
                      onClick={handleAddWidgetDomain}
                      className="bg-indigo-600 text-white rounded px-3 py-1 text-sm"
                    >
                      Add
                    </button>
                  </div>
                )}
                {widgetDomains.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {widgetDomains.map((d) => (
                      <div key={d} className="flex items-center gap-2 px-2 py-1 rounded bg-indigo-50 border border-indigo-200">
                        <span className="text-xs font-mono text-indigo-900">{d}</span>
                        <button
                          onClick={() => handleRemoveWidgetDomain(d)}
                          className="text-xs text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">No domains yet. Add at least one agency website domain.</p>
                )}
              </div>
              <button
                onClick={handleSaveMyAgencySettings}
                className="bg-blue-600 text-white rounded px-3 py-1"
                disabled={agencySelfLoading}
              >
                {agencySelfLoading ? 'Saving...' : 'Save settings'}
              </button>
            </div>

            <div className="mt-4 border border-indigo-100 rounded-lg p-3 bg-indigo-50/40">
              <h3 className="text-sm font-semibold text-indigo-900 mb-2">Widget setup</h3>
              <div className="text-xs text-indigo-900/80 mb-3 space-y-1">
                <p>1) Add your website domains above and save.</p>
                <p>2) Copy embed code and paste it on the agency website.</p>
                <p>3) Open preview and verify the widget loads.</p>
              </div>
              <textarea
                readOnly
                value={widgetEmbedSnippet}
                className="w-full border rounded px-2 py-2 min-h-32 text-xs font-mono bg-white"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  onClick={handleCopyWidgetSnippet}
                  className="bg-indigo-600 text-white rounded px-3 py-1 text-sm"
                >
                  Copy code
                </button>
                <button
                  onClick={() => window.open(widgetPreviewUrl, '_blank')}
                  className="bg-white border border-indigo-300 text-indigo-700 rounded px-3 py-1 text-sm"
                >
                  Preview
                </button>
                <button
                  onClick={() => window.open('/widget-docs/INTEGRATION_GUIDE.md', '_blank')}
                  className="bg-white border border-indigo-300 text-indigo-700 rounded px-3 py-1 text-sm"
                >
                  Guide
                </button>
                <button
                  onClick={() => window.open('/widget-docs/README.md', '_blank')}
                  className="bg-white border border-indigo-300 text-indigo-700 rounded px-3 py-1 text-sm"
                >
                  Technical docs
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Current widget key: <span className="font-mono">{agencySelfMeta?.api_key || agencySelfMeta?.domain || agencySelfMeta?.id || '—'}</span>
              </p>
            </div>
          </div>
        )}

        {/* Super Admin Sections */}
        {['admin', 'super_admin'].includes(userProfile?.role) && isSuperAdminView && (
          <div className="bg-white rounded-lg shadow-md p-3 mb-6">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveAdminSection('agencies')}
                className={`px-3 py-2 rounded text-sm font-medium ${activeAdminSection === 'agencies' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                Agencies
              </button>
              <button
                onClick={() => setActiveAdminSection('invoices')}
                className={`px-3 py-2 rounded text-sm font-medium ${activeAdminSection === 'invoices' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                Invoices
              </button>
              <button
                onClick={() => setActiveAdminSection('tickets')}
                className={`px-3 py-2 rounded text-sm font-medium ${activeAdminSection === 'tickets' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                Tickets
              </button>
            </div>
          </div>
        )}

        {/* SuperAdmin Tools */}
        {['admin', 'super_admin'].includes(userProfile?.role) && isSuperAdminView && activeAdminSection === 'agencies' && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-6 border border-blue-100">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Agencies section</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Create agency</h3>
                  <button
                    onClick={() => setShowCreateAgencyForm((v) => !v)}
                    className="bg-blue-600 text-white rounded px-3 py-1 text-sm"
                  >
                    {showCreateAgencyForm ? 'Hide form' : 'New agency'}
                  </button>
                </div>
                {showCreateAgencyForm && (
                  <div className="space-y-2">
                    <input value={agencyForm.name} onChange={(e) => setAgencyForm((p) => ({ ...p, name: e.target.value }))} placeholder="Name" className="w-full border rounded px-2 py-1" />
                    <input value={agencyForm.domain} onChange={(e) => setAgencyForm((p) => ({ ...p, domain: e.target.value }))} placeholder="Domain (subdomain)" className="w-full border rounded px-2 py-1" />
                    <input value={agencyForm.contact_email} onChange={(e) => setAgencyForm((p) => ({ ...p, contact_email: e.target.value }))} placeholder="Email (agency admin login)" className="w-full border rounded px-2 py-1" />
                    <input value={agencyForm.contact_phone} onChange={(e) => setAgencyForm((p) => ({ ...p, contact_phone: e.target.value }))} placeholder="Phone" className="w-full border rounded px-2 py-1" />
                    <input value={agencyForm.contact_person_name} onChange={(e) => setAgencyForm((p) => ({ ...p, contact_person_name: e.target.value }))} placeholder="Contact person full name" className="w-full border rounded px-2 py-1" />
                    <input value={agencyForm.bank_name} onChange={(e) => setAgencyForm((p) => ({ ...p, bank_name: e.target.value }))} placeholder="Bank name" className="w-full border rounded px-2 py-1" />
                    <input value={agencyForm.bank_account} onChange={(e) => setAgencyForm((p) => ({ ...p, bank_account: e.target.value }))} placeholder="Account number" className="w-full border rounded px-2 py-1" />
                    <input value={agencyForm.iban} onChange={(e) => setAgencyForm((p) => ({ ...p, iban: e.target.value.toUpperCase() }))} placeholder="IBAN (SA...)" className="w-full border rounded px-2 py-1" />
                    <input value={agencyForm.swift_bic} onChange={(e) => setAgencyForm((p) => ({ ...p, swift_bic: e.target.value.toUpperCase() }))} placeholder="SWIFT/BIC" className="w-full border rounded px-2 py-1" />
                    <input value={agencyForm.sama_code} onChange={(e) => setAgencyForm((p) => ({ ...p, sama_code: e.target.value.toUpperCase() }))} placeholder="SAMA bank code" className="w-full border rounded px-2 py-1" />
                    <textarea
                      value={agencyForm.widget_allowed_domains}
                      onChange={(e) => setAgencyForm((p) => ({ ...p, widget_allowed_domains: e.target.value }))}
                      placeholder="Allowed widget domains (one per line), for example:&#10;kiyavia.com&#10;aviatickets.kiyavia.com"
                      className="w-full border rounded px-2 py-1 min-h-20"
                    />
                    <button onClick={handleCreateAgency} className="w-full bg-blue-600 text-white rounded px-3 py-2">Create</button>
                  </div>
                )}
              </div>

              <div className="border border-gray-200 rounded-lg p-3">
                <h3 className="font-semibold mb-2">Summary</h3>
                <div className="text-sm space-y-1">
                  <p>Total: <b>{reportSummary?.total_orders ?? 0}</b></p>
                  <p>Pending: <b>{reportSummary?.pending ?? 0}</b></p>
                  <p>Confirmed: <b>{reportSummary?.confirmed ?? 0}</b></p>
                  <p>Ticketed: <b>{reportSummary?.ticketed ?? 0}</b></p>
                  <p>Cancelled: <b>{reportSummary?.cancelled ?? 0}</b></p>
                  <p>Gross: <b>{reportSummary?.gross_total ?? 0}</b></p>
                </div>
                <button onClick={loadAdminData} className="mt-3 w-full bg-gray-100 rounded px-3 py-2">
                  {adminLoading ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
            </div>
          </div>
        )}

        {['admin', 'super_admin'].includes(userProfile?.role) && isSuperAdminView && activeAdminSection === 'agencies' && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-6 border border-purple-100">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-gray-900">Super Admin</h2>
              <button onClick={loadSuperAdmins} className="bg-gray-100 px-3 py-1 rounded text-sm">
                {superAdminsLoading ? 'Loading...' : 'Refresh list'}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-3">
              <input
                value={superAdminForm.email}
                onChange={(e) => setSuperAdminForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="Email"
                className="border rounded px-2 py-1"
              />
              <input
                value={superAdminForm.full_name}
                onChange={(e) => setSuperAdminForm((p) => ({ ...p, full_name: e.target.value }))}
                placeholder="Name"
                className="border rounded px-2 py-1"
              />
              <input
                value={superAdminForm.phone}
                onChange={(e) => setSuperAdminForm((p) => ({ ...p, phone: e.target.value }))}
                placeholder="Phone"
                className="border rounded px-2 py-1"
              />
              <button
                onClick={handleCreateSuperAdmin}
                disabled={creatingSuperAdmin}
                className="bg-purple-600 text-white rounded px-3 py-1 disabled:opacity-60"
              >
                {creatingSuperAdmin ? 'Saving...' : 'Add super admin'}
              </button>
            </div>
            <div className="space-y-2 text-sm">
              {superAdmins.map((sa) => (
                <div key={sa.id} className="border rounded px-3 py-2 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div>
                    <div className="font-semibold">{sa.full_name || 'No name'}</div>
                    <div>{sa.email}</div>
                  </div>
                  <div className="text-gray-600">
                    <div>Phone: {sa.phone || 'N/A'}</div>
                    <div>Updated: {sa.updated_at ? new Date(sa.updated_at).toLocaleString() : 'N/A'}</div>
                  </div>
                </div>
              ))}
              {superAdmins.length === 0 && <p className="text-gray-500">No super admins yet</p>}
            </div>
          </div>
        )}

        {/* Agencies Management */}
        {['admin', 'super_admin'].includes(userProfile?.role) && isSuperAdminView && activeAdminSection === 'agencies' && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-gray-900">Agencies</h2>
              <button onClick={loadAgencies} className="bg-gray-100 px-3 py-1 rounded text-sm">
                {agenciesLoading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
              <input
                value={agencyFilters.q}
                onChange={(e) => setAgencyFilters((p) => ({ ...p, q: e.target.value }))}
                placeholder="Search (name/domain/email)"
                className="border rounded px-2 py-1"
              />
              <select
                value={agencyFilters.is_active}
                onChange={(e) => setAgencyFilters((p) => ({ ...p, is_active: e.target.value }))}
                className="border rounded px-2 py-1"
              >
                <option value="all">All</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
              <button onClick={loadAgencies} className="bg-blue-600 text-white rounded px-3 py-1">Filter</button>
            </div>
            <div className="space-y-2">
              {agencies.map((a) => (
                <div key={a.id} className="border rounded p-3">
                  {agencyEditId === a.id ? (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                      <input value={agencyEditForm.name} onChange={(e) => setAgencyEditForm((p) => ({ ...p, name: e.target.value }))} className="border rounded px-2 py-1" placeholder="Name" />
                      <input value={agencyEditForm.domain} onChange={(e) => setAgencyEditForm((p) => ({ ...p, domain: e.target.value }))} className="border rounded px-2 py-1" placeholder="Domain" />
                      <input value={agencyEditForm.contact_email} onChange={(e) => setAgencyEditForm((p) => ({ ...p, contact_email: e.target.value }))} className="border rounded px-2 py-1" placeholder="Email" />
                      <input value={agencyEditForm.contact_phone} onChange={(e) => setAgencyEditForm((p) => ({ ...p, contact_phone: e.target.value }))} className="border rounded px-2 py-1" placeholder="Phone" />
                      <input value={agencyEditForm.contact_person_name} onChange={(e) => setAgencyEditForm((p) => ({ ...p, contact_person_name: e.target.value }))} className="border rounded px-2 py-1" placeholder="Contact person full name" />
                      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={agencyEditForm.is_active} onChange={(e) => setAgencyEditForm((p) => ({ ...p, is_active: e.target.checked }))} /> Active</label>
                      <input value={agencyEditForm.bank_name} onChange={(e) => setAgencyEditForm((p) => ({ ...p, bank_name: e.target.value }))} className="border rounded px-2 py-1" placeholder="Bank name" />
                      <input value={agencyEditForm.bank_account} onChange={(e) => setAgencyEditForm((p) => ({ ...p, bank_account: e.target.value }))} className="border rounded px-2 py-1" placeholder="Account number" />
                      <input value={agencyEditForm.iban} onChange={(e) => setAgencyEditForm((p) => ({ ...p, iban: e.target.value.toUpperCase() }))} className="border rounded px-2 py-1" placeholder="IBAN (SA...)" />
                      <input value={agencyEditForm.swift_bic} onChange={(e) => setAgencyEditForm((p) => ({ ...p, swift_bic: e.target.value.toUpperCase() }))} className="border rounded px-2 py-1" placeholder="SWIFT/BIC" />
                      <input value={agencyEditForm.sama_code} onChange={(e) => setAgencyEditForm((p) => ({ ...p, sama_code: e.target.value.toUpperCase() }))} className="border rounded px-2 py-1" placeholder="SAMA bank code" />
                      <textarea
                        value={agencyEditForm.widget_allowed_domains}
                        onChange={(e) => setAgencyEditForm((p) => ({ ...p, widget_allowed_domains: e.target.value }))}
                        className="border rounded px-2 py-1 min-h-20 md:col-span-2"
                        placeholder="Allowed widget domains (one per line)"
                      />
                      <button onClick={() => handleSaveAgency(a.id)} className="bg-green-600 text-white rounded px-3 py-1">Save</button>
                      <button onClick={() => setAgencyEditId(null)} className="bg-gray-100 rounded px-3 py-1">Cancel</button>
                    </div>
                  ) : (
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <div className="text-sm">
                        <div className="font-semibold">{a.name} ({a.domain || 'no-domain'})</div>
                        <div>{a.contact_email} • {a.contact_phone || 'N/A'}</div>
                        <div>Contact person: {a?.settings?.contact_person?.full_name || 'N/A'}</div>
                        <div>Bank: {a?.settings?.bank_details?.bank_name || 'N/A'} • IBAN: {a?.settings?.bank_details?.iban || 'N/A'}</div>
                        <div>SWIFT/BIC: {a?.settings?.bank_details?.swift_bic || 'N/A'} • SAMA: {a?.settings?.bank_details?.sama_code || 'N/A'}</div>
                        <div>Widget domains: {Array.isArray(a?.settings?.widget_allowed_domains) && a.settings.widget_allowed_domains.length ? a.settings.widget_allowed_domains.join(', ') : 'not set'}</div>
                        <div>Status: {a.is_active ? 'Active' : 'Inactive'}</div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => beginEditAgency(a)} className="bg-gray-100 rounded px-3 py-1 text-sm">Open/Edit</button>
                        <button onClick={() => handleToggleAgencyActive(a)} className="bg-yellow-100 rounded px-3 py-1 text-sm">{a.is_active ? 'Suspend' : 'Unsuspend'}</button>
                        <button onClick={() => handleDeleteAgency(a)} className="bg-red-100 text-red-700 rounded px-3 py-1 text-sm">Delete</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {agencies.length === 0 && <p className="text-sm text-gray-500">No agencies found</p>}
            </div>
          </div>
        )}

        {/* Invoices List */}
        {['admin', 'super_admin'].includes(userProfile?.role) && isSuperAdminView && activeAdminSection === 'invoices' && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-gray-900">Invoices</h2>
              <button onClick={loadInvoices} className="bg-gray-100 px-3 py-1 rounded text-sm">
                {invoicesLoading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
            <div className="border border-gray-200 rounded-lg p-3 mb-3">
              <h3 className="font-semibold mb-2">Create draft invoice</h3>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
                <select value={invoiceForm.agency_id} onChange={(e) => setInvoiceForm((p) => ({ ...p, agency_id: e.target.value }))} className="border rounded px-2 py-1">
                  <option value="">Select agency</option>
                  {agencies.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
                <div className="flex items-center gap-2 border rounded px-2 py-1">
                  <span className="text-xs text-gray-500">From</span>
                  <input type="date" value={invoiceForm.period_from} onChange={(e) => setInvoiceForm((p) => ({ ...p, period_from: e.target.value }))} className="w-full outline-none" />
                </div>
                <div className="flex items-center gap-2 border rounded px-2 py-1">
                  <span className="text-xs text-gray-500">To</span>
                  <input type="date" value={invoiceForm.period_to} onChange={(e) => setInvoiceForm((p) => ({ ...p, period_to: e.target.value }))} className="w-full outline-none" />
                </div>
                <select
                  value={invoiceForm.currency}
                  onChange={(e) => setInvoiceForm((p) => ({ ...p, currency: e.target.value }))}
                  className="border rounded px-2 py-1"
                >
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                  <option value="SAR">SAR</option>
                </select>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={invoiceForm.manual_total}
                  onChange={(e) => setInvoiceForm((p) => ({ ...p, manual_total: e.target.value }))}
                  placeholder="Invoice amount"
                  className="border rounded px-2 py-1"
                />
                <button onClick={handleCreateInvoice} className="bg-green-600 text-white rounded px-3 py-1">Create invoice</button>
              </div>
              <p className="text-xs text-gray-500 mt-2">Invoice period is from date to date. If amount is provided, it is used as final invoice total.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-3">
              <select value={invoiceFilters.agency_id} onChange={(e) => setInvoiceFilters((p) => ({ ...p, agency_id: e.target.value }))} className="border rounded px-2 py-1">
                <option value="">All agencies</option>
                {agencies.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              <select value={invoiceFilters.currency} onChange={(e) => setInvoiceFilters((p) => ({ ...p, currency: e.target.value }))} className="border rounded px-2 py-1">
                <option value="">All currencies</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
                <option value="SAR">SAR</option>
              </select>
              <div className="flex items-center gap-2 border rounded px-2 py-1">
                <span className="text-xs text-gray-500">From</span>
                <input type="date" value={invoiceFilters.date_from} onChange={(e) => setInvoiceFilters((p) => ({ ...p, date_from: e.target.value }))} className="w-full outline-none" />
              </div>
              <div className="flex items-center gap-2 border rounded px-2 py-1">
                <span className="text-xs text-gray-500">To</span>
                <input type="date" value={invoiceFilters.date_to} onChange={(e) => setInvoiceFilters((p) => ({ ...p, date_to: e.target.value }))} className="w-full outline-none" />
              </div>
              <button onClick={loadInvoices} className="bg-blue-600 text-white rounded px-3 py-1">Filter</button>
            </div>
            <div className="space-y-2 text-sm">
              {invoices.map((inv) => (
                <div key={inv.id} className="border rounded px-3 py-2 flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{inv.invoice_number}</div>
                    <div>{inv.period_from} → {inv.period_to} • {inv.status}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div>{inv.total} {inv.currency}</div>
                    {inv.status !== 'issued' && (
                      <button
                        onClick={() => handleMarkInvoiceIssued(inv.id)}
                        className="bg-emerald-100 text-emerald-800 rounded px-2 py-1 text-xs"
                      >
                        Issue
                      </button>
                    )}
                    <button
                      onClick={() => handleGenerateInvoicePdf(inv.id)}
                      className="bg-blue-100 text-blue-800 rounded px-2 py-1 text-xs"
                    >
                      PDF
                    </button>
                  </div>
                </div>
              ))}
              {invoices.length === 0 && <p className="text-gray-500">No invoices</p>}
            </div>
          </div>
        )}

        {/* Tickets List */}
        {['admin', 'super_admin'].includes(userProfile?.role) && isSuperAdminView && activeAdminSection === 'tickets' && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-gray-900">Tickets</h2>
              <button onClick={loadTickets} className="bg-gray-100 px-3 py-1 rounded text-sm">
                {ticketsLoading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-7 gap-2 mb-3">
              <select value={ticketFilters.agency_id} onChange={(e) => setTicketFilters((p) => ({ ...p, agency_id: e.target.value }))} className="border rounded px-2 py-1">
                <option value="">All agencies</option>
                {agencies.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              <select value={ticketFilters.order_status} onChange={(e) => setTicketFilters((p) => ({ ...p, order_status: e.target.value }))} className="border rounded px-2 py-1">
                <option value="">Order: all statuses</option>
                <option value="pending">Awaiting payment</option>
                <option value="confirmed">Confirmed</option>
                <option value="ticketed">Ticketed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <select value={ticketFilters.status} onChange={(e) => setTicketFilters((p) => ({ ...p, status: e.target.value }))} className="border rounded px-2 py-1">
                <option value="">Issuance: all statuses</option>
                <option value="issued">Issued</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
              <select value={ticketFilters.email_status} onChange={(e) => setTicketFilters((p) => ({ ...p, email_status: e.target.value }))} className="border rounded px-2 py-1">
                <option value="">Email: all</option>
                <option value="sent">Sent</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
              <input type="date" value={ticketFilters.date_from} onChange={(e) => setTicketFilters((p) => ({ ...p, date_from: e.target.value }))} className="border rounded px-2 py-1" />
              <input type="date" value={ticketFilters.date_to} onChange={(e) => setTicketFilters((p) => ({ ...p, date_to: e.target.value }))} className="border rounded px-2 py-1" />
              <input value={ticketFilters.q} onChange={(e) => setTicketFilters((p) => ({ ...p, q: e.target.value }))} placeholder="ticket/pnr/order/email" className="border rounded px-2 py-1" />
            </div>
            <button onClick={loadTickets} className="bg-blue-600 text-white rounded px-3 py-1 mb-3">Filter</button>
            <div className="space-y-2 text-sm">
              {tickets.map((t) => (
                <div key={t.id} className="border rounded px-3 py-2 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div>
                    <div className="font-semibold">{t.ticket_number || 'N/A'} • {t.pnr || 'N/A'}</div>
                    <div>{t.order?.order_number || t.order_id} • {t.order?.origin || 'N/A'} → {t.order?.destination || 'N/A'}</div>
                    <div>{t.agency?.name || 'No agency'} • status: {t.status} • email: {t.email_status}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div>{t.order?.total_price || 0} {t.order?.currency || ''}</div>
                    {t.document_id && (
                      <button
                        onClick={() => handleDownloadDocument(t.document_id)}
                        className="bg-blue-100 text-blue-800 rounded px-2 py-1 text-xs"
                      >
                        PDF
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {tickets.length === 0 && <p className="text-gray-500">No tickets</p>}
            </div>
          </div>
        )}

        {/* Filters */}
        {showOrdersArea && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by order number, email, phone, route..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none transition-all"
                />
              </div>

              {/* Status Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none transition-all appearance-none bg-white"
                >
                  <option value="all">All statuses</option>
                  <option value="pending">Awaiting payment</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="ticketed">Ticketed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <h3 className="text-red-800 font-semibold">Error</h3>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Notice Message */}
        {notice && (
          <div className={`${notice.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'} border rounded-lg p-4 mb-6 flex items-start justify-between gap-3`}>
            <p className="text-sm font-medium">{notice.text}</p>
            <button
              onClick={() => setNotice(null)}
              className="text-gray-500 hover:text-gray-800"
              aria-label="Close notice"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Orders List */}
        {showOrdersArea && (filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Plane size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {searchQuery || statusFilter !== 'all' ? 'Orders not found' : 'No orders yet'}
            </h3>
            <p className="text-gray-500">
              {searchQuery || statusFilter !== 'all'
                ? 'Try changing the search filters'
                : 'Orders will appear here after the first booking'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const statusConfig = getStatusConfig(normalizeStatus(order.status));
              const StatusIcon = statusConfig.icon;
              const legs = getLegsFromOrder(order);
              const outbound = legs.outbound;
              const returnLeg = legs.returnLeg;

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    {/* Order Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`flex items-center gap-2 px-3 py-1 ${statusConfig.bgColor} ${statusConfig.borderColor} border rounded-full`}>
                          <StatusIcon size={16} className={statusConfig.color} />
                          <span className={`text-sm font-semibold ${statusConfig.color}`}>
                            {statusConfig.label}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(order.created_at).toLocaleString('en-US')}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <div className="space-y-2">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Plane size={18} className="text-blue-600" />
                                <span className="font-semibold text-gray-900">
                                  {(outbound?.origin || order.origin) || 'N/A'} → {(outbound?.destination || order.destination) || 'N/A'}
                                </span>
                              </div>
                              <p className="text-xs text-gray-600">
                                {(outbound?.airline || order.airline_name || order.airline_code || 'N/A')} • {(outbound?.flightNumber || order.flight_number || 'N/A')}
                              </p>
                              <p className="text-xs text-gray-500">
                                {(outbound?.departure || order.departure_time || 'N/A')}
                              </p>
                            </div>
                            {returnLeg && (
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <Plane size={18} className="text-indigo-500 rotate-180" />
                                  <span className="font-semibold text-gray-900">
                                    {returnLeg.origin || 'N/A'} → {returnLeg.destination || 'N/A'}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-600">
                                  {returnLeg.airline || 'N/A'} • {returnLeg.flightNumber || 'N/A'}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {returnLeg.departure || 'N/A'}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Mail size={16} className="text-gray-400" />
                            <span className="text-sm text-gray-900">{order.contact_email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone size={16} className="text-gray-400" />
                            <span className="text-sm text-gray-900">{order.contact_phone}</span>
                          </div>
                          {order.user_email && (
                            <p className="text-xs text-gray-500 mt-1">
                              User: {order.user_email}
                            </p>
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <CreditCard size={16} className="text-gray-400" />
                            <span className="text-sm font-semibold text-gray-900">
                              {order.total_price} {order.currency}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600">
                            Passengers: {order.passenger_count || 1}
                          </p>
                          <p className="text-xs text-gray-500 mt-1 font-mono">
                            {order.order_number}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 lg:w-64">
                      <button
                        onClick={() => handleIssueTicket(order)}
                        disabled={normalizeStatus(order.status) !== 'confirmed' || issuingOrderId === order.id}
                        className={`w-full font-semibold py-2 px-4 rounded-lg transition-all text-sm ${
                          normalizeStatus(order.status) !== 'confirmed' || issuingOrderId === order.id
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-green-600 hover:bg-green-700 text-white'
                        }`}
                      >
                        {issuingOrderId === order.id ? 'Issuing...' : 'Issue ticket'}
                      </button>
                      {normalizeStatus(order.status) === 'ticketed' && (
                        <button
                          onClick={() => handleDownloadOrderTicketPdf(order.id)}
                          disabled={ticketDocLoadingId === order.id}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-all text-sm disabled:opacity-60"
                        >
                          {ticketDocLoadingId === order.id ? 'Preparing PDF...' : 'Download ticket PDF'}
                        </button>
                      )}
                      <select
                        value={normalizeStatus(order.status)}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        disabled={updatingOrderId === order.id}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none transition-all text-sm font-semibold"
                      >
                        <option value="pending">Awaiting payment</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="ticketed">Ticketed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>

                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-all text-sm"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {/* Order Details Modal */}
        {selectedOrder && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedOrder(null)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[88vh] overflow-y-auto p-6"
              onClick={(e) => e.stopPropagation()}
            >
              {(() => {
                const legs = getLegsFromOrder(selectedOrder);
                const outbound = legs.outbound;
                const returnLeg = legs.returnLeg;
                return (
                  <>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Order details</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    #{selectedOrder.order_number || selectedOrder.id}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="inline-flex items-center justify-center h-9 w-9 rounded-md border border-gray-200 text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                    <MapPin size={14} />
                    Route
                  </p>
                  <p className="font-semibold text-gray-900 text-lg leading-tight">
                    {(outbound?.origin || selectedOrder.origin) || 'N/A'} → {(outbound?.destination || selectedOrder.destination) || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {(outbound?.airline || selectedOrder.airline_name || selectedOrder.airline_code || 'N/A')} • {(outbound?.flightNumber || selectedOrder.flight_number || 'N/A')}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Departure: {outbound?.departure || selectedOrder.departure_time || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600">
                    Arrival: {outbound?.arrival || selectedOrder.arrival_time || 'N/A'}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                    <Ticket size={14} />
                    Order
                  </p>
                  <p className="font-semibold text-gray-900 text-lg">
                    {selectedOrder.total_price} {selectedOrder.currency || 'UAH'}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Status: {getStatusConfig(normalizeStatus(selectedOrder.status)).label}
                  </p>
                  <p className="text-sm text-gray-600">
                    Created: {selectedOrder.created_at ? new Date(selectedOrder.created_at).toLocaleString('en-US') : 'N/A'}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="text-xs text-gray-500">Contacts</p>
                  <p className="text-sm text-gray-800">{selectedOrder.contact_email || 'N/A'}</p>
                  <p className="text-sm text-gray-800">{selectedOrder.contact_phone || 'N/A'}</p>
                  <p className="text-xs text-gray-500 mt-2">User ID: {selectedOrder.user_id || 'N/A'}</p>
                </div>
              </div>

              {returnLeg && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 mb-4">
                  <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                    <MapPin size={14} />
                    Return route
                  </p>
                  <p className="font-semibold text-gray-900 text-lg leading-tight">
                    {returnLeg.origin || 'N/A'} → {returnLeg.destination || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {returnLeg.airline || 'N/A'} • {returnLeg.flightNumber || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Departure: {returnLeg.departure || 'N/A'}</p>
                  <p className="text-sm text-gray-600">Arrival: {returnLeg.arrival || 'N/A'}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="text-xs text-gray-500">System fields</p>
                  <p className="text-xs text-gray-700 break-all">order_id: {selectedOrder.id}</p>
                  <p className="text-xs text-gray-700 break-all">drct_order_id: {selectedOrder.drct_order_id || 'N/A'}</p>
                  <p className="text-xs text-gray-700">pax: {selectedOrder.passenger_count || 1}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="text-xs text-gray-500">Price</p>
                  <p className="text-sm text-gray-800">Base: {selectedOrder.base_price ?? 'N/A'}</p>
                  <p className="text-sm text-gray-800">Taxes: {selectedOrder.taxes ?? 'N/A'}</p>
                  <p className="text-sm text-gray-800">Baggage: {selectedOrder.baggage_price ?? 'N/A'}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                className="mt-5 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-all"
              >
                Close
              </button>
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
