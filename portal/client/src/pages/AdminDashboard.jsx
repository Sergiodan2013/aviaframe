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
  markOrderPaid,
  getDocumentDownloadUrl,
  getOrderTicketDocument,
  getProfile,
  getMyAgency,
  updateMyAgency,
  publishMyAgencySite,
  redeployMyAgencySite,
  provisionAdminAgency,
  uploadAgencyLogo,
  uploadAgencyMedia,
  redeployAdminAgencySite,
  publishAdminAgencySite,
  sendAdminAgencySetupEmail
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
  const [markingPaidOrderId, setMarkingPaidOrderId] = useState(null);
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
    name_ar: '',
    domain: '',
    contact_email: '',
    contact_phone: '',
    contact_phone2: '',
    whatsapp_phone: '',
    is_active: true,
    contact_person_name: '',
    supervisor_name: '',
    supervisor_email: '',
    bank_name: '',
    bank_account: '',
    iban: '',
    swift_bic: '',
    sama_code: '',
    widget_allowed_domains: '',
    payment_methods: ['online'],
    commission_model: 'fixed',
    commission_fixed_amount: 0,
    commission_rate: 0,
    logo_url: '',
    brand_color: '#1a3c8e',
    accent_color: '#2468c4',
    about_en: '',
    about_ar: '',
    working_hours: '',
    working_hours_ar: '',
    license_number: '',
    iata_number: '',
    founded_year: '',
    google_maps_url: '',
    instagram: '',
    twitter: '',
    snapchat: '',
    facebook: '',
    services: ['flights_domestic','flights_intl','hotels','visa','insurance','umrah','tours','corporate'],
    hero_tagline: '',
    hero_description: '',
    destinations: [],
    reviews: [],
    featured_airlines: [],
    hero_image_url: '',
    header_bg: '',
    footer_bg: ''
  });
  const [editLogoUploading, setEditLogoUploading] = useState(false);
  const [editMediaUploading, setEditMediaUploading] = useState(false);
  const [agencyForm, setAgencyForm] = useState({
    name: '',
    name_ar: '',
    domain: '',
    contact_email: '',
    contact_phone: '',
    contact_phone2: '',
    contact_person_name: '',
    country: 'SA',
    brand_color: '#1a3c8e',
    accent_color: '#2468c4',
    bank_name: '',
    bank_account: '',
    iban: '',
    swift_bic: '',
    sama_code: '',
    widget_allowed_domains: '',
    payment_methods: ['online'],
    commission_model: 'fixed',
    commission_fixed_amount: 0,
    commission_rate: 0,
    logo_url: '',
    about_en: '',
    about_ar: '',
    working_hours: '',
    working_hours_ar: '',
    license_number: '',
    iata_number: '',
    founded_year: '',
    google_maps_url: '',
    instagram: '',
    twitter: '',
    snapchat: '',
    facebook: '',
    whatsapp_phone: '',
    services: ['flights_domestic','flights_intl','hotels','visa','insurance','umrah','tours','corporate']
  });
  const [provisionResult, setProvisionResult] = useState(null);
  const [provisioning, setProvisioning] = useState(false);
  const [createOnlyLoading, setCreateOnlyLoading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({
    agency_id: '',
    period_from: '',
    period_to: '',
    currency: 'EUR',
    manual_total: '',
    statuses: 'confirmed,issued'
  });
  const CARRIERS = [
    { code: 'AF', name: 'Air France' }, { code: 'AM', name: 'Aeromexico' }, { code: 'A3', name: 'Aegean Airlines' },
    { code: 'BG', name: 'Biman Bangladesh' }, { code: 'BJ', name: 'Nouvelair' }, { code: 'BS', name: 'US-Bangla' },
    { code: 'B4', name: 'ZanAir' }, { code: 'DT', name: 'TAAG Angola' }, { code: 'EK', name: 'Emirates' },
    { code: 'ET', name: 'Ethiopian Airlines' }, { code: 'EY', name: 'Etihad Airways' }, { code: 'FZ', name: 'flydubai' },
    { code: 'F3', name: 'Flyadeal' }, { code: 'GA', name: 'Garuda Indonesia' }, { code: 'GF', name: 'Gulf Air' },
    { code: 'GP', name: 'APG Airlines' }, { code: 'GQ', name: 'Sky Express' }, { code: 'HC', name: 'Air Senegal' },
    { code: 'HR', name: 'Hahn Air' }, { code: 'J4', name: 'Buffalo Airways' }, { code: 'J9', name: 'Jazeera Airways' },
    { code: 'KL', name: 'KLM' }, { code: 'LH', name: 'Lufthansa' }, { code: 'LO', name: 'LOT Polish Airlines' },
    { code: 'LX', name: 'Swiss' }, { code: 'MF', name: 'Xiamen Air' }, { code: 'MH', name: 'Malaysia Airlines' },
    { code: 'NE', name: 'Nesma Airlines' }, { code: 'NP', name: 'Nile Air' }, { code: 'NX', name: 'Air Macau' },
    { code: 'OV', name: 'Estonian Air' }, { code: 'PK', name: 'PIA' }, { code: 'PR', name: 'Philippine Airlines' },
    { code: 'QP', name: 'Akasa Air' }, { code: 'QR', name: 'Qatar Airways' }, { code: 'Q4', name: 'Starbow Airlines' },
    { code: 'RJ', name: 'Royal Jordanian' }, { code: 'R5', name: 'Jordan Aviation' }, { code: 'SM', name: 'Air Cairo' },
    { code: 'SQ', name: 'Singapore Airlines' }, { code: 'SV', name: 'Saudia' }, { code: 'TC', name: 'Air Tanzania' },
    { code: 'TK', name: 'Turkish Airlines' }, { code: 'TP', name: 'TAP Air Portugal' }, { code: 'UJ', name: 'Al Masria' },
    { code: 'UL', name: 'SriLankan Airlines' }, { code: 'VF', name: 'Valuair' }, { code: 'WB', name: 'RwandAir' },
    { code: 'WY', name: 'Oman Air' }, { code: 'W2', name: 'Flexflight' }, { code: 'XJ', name: 'Thai AirAsia X' },
    { code: 'XY', name: 'flynas' }, { code: '5J', name: 'Cebu Pacific' }, { code: '6E', name: 'IndiGo' },
  ];
  const SERVICE_OPTIONS = [
    { key: 'flights_domestic', label: 'Domestic flights' },
    { key: 'flights_intl', label: 'International flights' },
    { key: 'hotels', label: 'Hotels' },
    { key: 'visa', label: 'Visa support' },
    { key: 'insurance', label: 'Insurance' },
    { key: 'umrah', label: 'Umrah / Hajj' },
    { key: 'tours', label: 'Tours & holidays' },
    { key: 'corporate', label: 'Corporate travel' },
    { key: 'transfers', label: 'Airport transfers' },
    { key: 'car_rental', label: 'Car rental' }
  ];

  const [agencySelfForm, setAgencySelfForm] = useState({
    commission_rate: 0,
    commission_model: 'percent',
    commission_fixed_amount: 0,
    carrier_commission_mode: 'all', // 'all' or 'per_carrier'
    carrier_commission_all_amount: 0, // used in 'all' mode
    carrier_commissions: {}, // { SV: 50, EK: 75 } — used in 'per_carrier' mode
    currency: 'SAR',
    bank_name: '',
    bank_account: '',
    iban: '',
    swift_bic: '',
    sama_code: '',
    contact_person_name: '',
    widget_allowed_domains: '',
    name_ar: '',
    contact_phone2: '',
    whatsapp_phone: '',
    brand_color: '#1a3c8e',
    accent_color: '#2468c4',
    supervisor_name: '',
    supervisor_email: '',
    logo_url: '',
    about_en: '',
    about_ar: '',
    working_hours: '',
    working_hours_ar: '',
    license_number: '',
    iata_number: '',
    founded_year: '',
    google_maps_url: '',
    instagram: '',
    twitter: '',
    snapchat: '',
    facebook: '',
    services: ['flights_domestic','flights_intl','hotels','visa','insurance','umrah','tours','corporate'],
    hero_tagline: '',
    hero_description: '',
    destinations: [],
    reviews: [],
    featured_airlines: [],
    hero_image_url: '',
    header_bg: '',
    footer_bg: ''
  });
  const [agencySelfMeta, setAgencySelfMeta] = useState(null);
  const [agencyPreviewId, setAgencyPreviewId] = useState('');
  const [agencySelfLoading, setAgencySelfLoading] = useState(false);
  const [sitePublishing, setSitePublishing] = useState(false);
  const [siteRedeploying, setSiteRedeploying] = useState(false);
  const [setupEmailSendingId, setSetupEmailSendingId] = useState(null);
  const [rowPublishingId, setRowPublishingId] = useState(null);
  const [rowRedeployingId, setRowRedeployingId] = useState(null);
  const [draftInviting, setDraftInviting] = useState(false);
  const [widgetDomains, setWidgetDomains] = useState([]);
  const [domainDraft, setDomainDraft] = useState('');
  const [showAddDomain, setShowAddDomain] = useState(false);
  const [domainsDirty, setDomainsDirty] = useState(false);
  const [domainsSaving, setDomainsSaving] = useState(false);
  const [salesReportFilters, setSalesReportFilters] = useState({
    date_from: '',
    date_to: '',
    agency_id: '',
    status: ''
  });
  const [salesReportLoading, setSalesReportLoading] = useState(false);
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
    if (s === 'ticketed' || s === 'ticket_issued') return 'issued';
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

  const formatDateTime = (value) => {
    if (!value) return '—';
    try {
      return new Date(value).toLocaleString();
    } catch {
      return String(value);
    }
  };

  const getOnboardingStatusMeta = (status) => {
    switch (status) {
      case 'invited':
        return { label: 'Invite sent', tone: 'bg-blue-50 text-blue-800 border-blue-200' };
      case 'setup_in_progress':
        return { label: 'Setup in progress', tone: 'bg-amber-50 text-amber-800 border-amber-200' };
      case 'ready_to_publish':
        return { label: 'Ready to publish', tone: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
      case 'published':
        return { label: 'Published', tone: 'bg-green-50 text-green-800 border-green-200' };
      default:
        return { label: 'Draft', tone: 'bg-slate-50 text-slate-700 border-slate-200' };
    }
  };

  const getDeployStatusMeta = (status) => {
    switch (status) {
      case 'deploying':
        return { label: 'Deploying', tone: 'bg-blue-50 text-blue-800 border-blue-200' };
      case 'deployed':
        return { label: 'Last deploy succeeded', tone: 'bg-green-50 text-green-800 border-green-200' };
      case 'failed':
        return { label: 'Last deploy failed', tone: 'bg-red-50 text-red-800 border-red-200' };
      default:
        return { label: 'Not deployed yet', tone: 'bg-slate-50 text-slate-700 border-slate-200' };
    }
  };

  const selectedAgencyOnboarding = agencySelfMeta?.onboarding_state || null;
  const selectedAgencyDeploy = agencySelfMeta?.deploy_state || null;
  const selectedOnboardingMeta = getOnboardingStatusMeta(selectedAgencyOnboarding?.status);
  const selectedDeployMeta = getDeployStatusMeta(selectedAgencyDeploy?.status);

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
    const carrierComms = agencyData?.settings?.carrier_commissions || {};
    const site = agencyData?.settings?.site || {};
    const carrierCodes = Object.keys(carrierComms);
    let ccMode = 'all';
    let ccAllAmount = 0;
    if (carrierCodes.length > 0) {
      const values = carrierCodes.map((k) => Number(carrierComms[k]));
      const allSame = values.every((v) => v === values[0]);
      if (allSame && carrierCodes.length === CARRIERS.length) {
        ccMode = 'all';
        ccAllAmount = values[0];
      } else {
        ccMode = 'per_carrier';
      }
    }
    setAgencySelfForm({
      commission_rate: agencyData?.commission_rate ?? 0,
      commission_model: commission.model || 'percent',
      commission_fixed_amount: commission.fixed_amount ?? 0,
      carrier_commission_mode: ccMode,
      carrier_commission_all_amount: ccAllAmount,
      carrier_commissions: carrierComms,
      currency: (commission.currency || 'SAR').toUpperCase(),
      bank_name: bankDetails.bank_name || '',
      bank_account: bankDetails.bank_account || '',
      iban: bankDetails.iban || '',
      swift_bic: bankDetails.swift_bic || '',
      sama_code: bankDetails.sama_code || '',
      contact_person_name: agencyData?.settings?.contact_person?.full_name || '',
      widget_allowed_domains: Array.isArray(agencyData?.settings?.widget_allowed_domains)
        ? agencyData.settings.widget_allowed_domains.join('\n')
        : '',
      name_ar: site.name_ar || '',
      contact_phone2: site.contact_phone2 || '',
      whatsapp_phone: site.whatsapp_phone || '',
      brand_color: site.brand_color || '#1a3c8e',
      accent_color: site.accent_color || '#2468c4',
      supervisor_name: site.supervisor_name || '',
      supervisor_email: site.supervisor_email || '',
      logo_url: site.logo_url || '',
      about_en: site.about_en || '',
      about_ar: site.about_ar || '',
      working_hours: site.working_hours || '',
      working_hours_ar: site.working_hours_ar || '',
      license_number: site.license_number || '',
      iata_number: site.iata_number || '',
      founded_year: site.founded_year || '',
      google_maps_url: site.google_maps_url || '',
      instagram: site.instagram || '',
      twitter: site.twitter || '',
      snapchat: site.snapchat || '',
      facebook: site.facebook || '',
      services: Array.isArray(site.services) && site.services.length
        ? site.services
        : ['flights_domestic','flights_intl','hotels','visa','insurance','umrah','tours','corporate'],
      hero_tagline: site.hero_tagline || '',
      hero_description: site.hero_description || '',
      destinations: Array.isArray(site.destinations) ? site.destinations : [],
      reviews: Array.isArray(site.reviews) ? site.reviews : [],
      featured_airlines: Array.isArray(site.featured_airlines) ? site.featured_airlines : [],
      hero_image_url: site.hero_image_url || '',
      header_bg: site.header_bg || '',
      footer_bg: site.footer_bg || ''
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
      api_key: agencyData?.api_key || null,
      contact_email: agencyData?.contact_email || null,
      onboarding_state: agencyData?.onboarding_state || null,
      deploy_state: agencyData?.deploy_state || null,
      site_url: agencyData?.deploy_state?.site_url || agencyData?.settings?.deploy?.site_url || null
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
    if (!agencyForm.name || !agencyForm.contact_email) {
      setNotice({ type: 'error', text: 'Name and email are required' });
      return;
    }
    if ((agencyForm.payment_methods || []).includes('invoice') && (!agencyForm.bank_name || !agencyForm.iban)) {
      setNotice({ type: 'error', text: 'Bank name and IBAN are required when Invoice payment method is enabled' });
      return;
    }
    try {
      setCreateOnlyLoading(true);
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
        payment_methods: agencyForm.payment_methods || ['online'],
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
    } finally {
      setCreateOnlyLoading(false);
    }
  };

  const handleCreateAgencyDraftAndInvite = async () => {
    if (!agencyForm.name || !agencyForm.contact_email || !agencyForm.domain) {
      setNotice({ type: 'error', text: 'Agency name, subdomain and manager email are required' });
      return;
    }
    try {
      setDraftInviting(true);
      setProvisionResult(null);
      const payload = {
        name: agencyForm.name,
        name_ar: agencyForm.name_ar || '',
        subdomain: agencyForm.domain,
        contact_email: agencyForm.contact_email,
        contact_phone: agencyForm.contact_phone || '',
        contact_phone2: agencyForm.contact_phone2 || '',
        whatsapp_phone: agencyForm.whatsapp_phone || '',
        contact_person_name: agencyForm.contact_person_name || '',
        country: agencyForm.country || 'SA',
        brand_color: agencyForm.brand_color || '#1a3c8e',
        accent_color: agencyForm.accent_color || '#2468c4',
        payment_methods: agencyForm.payment_methods || ['online'],
        commission_model: agencyForm.commission_model || 'fixed',
        commission_fixed_amount: Number(agencyForm.commission_fixed_amount) || 0,
        commission_rate: Number(agencyForm.commission_rate) || 0,
        bank_details: {
          bank_name: agencyForm.bank_name || null,
          iban: agencyForm.iban || null,
          swift_bic: agencyForm.swift_bic || null,
          bank_account: agencyForm.bank_account || null,
          sama_code: agencyForm.sama_code || null
        },
        logo_url: agencyForm.logo_url || '',
        about_en: agencyForm.about_en || '',
        about_ar: agencyForm.about_ar || '',
        working_hours: agencyForm.working_hours || '',
        working_hours_ar: agencyForm.working_hours_ar || '',
        license_number: agencyForm.license_number || '',
        iata_number: agencyForm.iata_number || '',
        founded_year: agencyForm.founded_year || '',
        google_maps_url: agencyForm.google_maps_url || '',
        instagram: agencyForm.instagram || '',
        twitter: agencyForm.twitter || '',
        snapchat: agencyForm.snapchat || '',
        facebook: agencyForm.facebook || '',
        services: agencyForm.services || [],
        deploy_site: false,
        send_setup_email: true
      };
      const { data, error } = await provisionAdminAgency(payload);
      if (error) throw new Error(error.message || 'Agency draft setup failed');
      setProvisionResult(data);
      setNotice({
        type: 'success',
        text: `Agency draft created and setup email sent to ${agencyForm.contact_email}`
      });
      setShowCreateAgencyForm(false);
      await Promise.all([loadAdminData(), loadAgencies()]);
    } catch (err) {
      setNotice({ type: 'error', text: `Draft setup failed: ${err.message}` });
    } finally {
      setDraftInviting(false);
    }
  };

  const handleLogoUpload = async (file) => {
    if (!file) return;
    setLogoUploading(true);
    const { url, error } = await uploadAgencyLogo(file);
    setLogoUploading(false);
    if (error) {
      setNotice({ type: 'error', text: `Logo upload failed: ${error.message}` });
    } else {
      setAgencyForm(p => ({ ...p, logo_url: url }));
      setNotice({ type: 'success', text: 'Logo uploaded successfully' });
    }
  };

  const handleLogoUploadForEdit = async (file) => {
    if (!file) return;
    setEditLogoUploading(true);
    const { url, error } = await uploadAgencyLogo(file);
    setEditLogoUploading(false);
    if (error) {
      setNotice({ type: 'error', text: `Logo upload failed: ${error.message}` });
    } else {
      setAgencyEditForm(p => ({ ...p, logo_url: url }));
      setNotice({ type: 'success', text: 'Logo uploaded. Click Save to apply.' });
    }
  };

  const handleAgencySelfLogoUpload = async (file) => {
    if (!file) return;
    setLogoUploading(true);
    const { url, error } = await uploadAgencyLogo(file);
    setLogoUploading(false);
    if (error) {
      setNotice({ type: 'error', text: `Logo upload failed: ${error.message}` });
      return;
    }
    setAgencySelfForm((prev) => ({ ...prev, logo_url: url }));
    setNotice({ type: 'success', text: 'Agency logo uploaded. Save settings to publish it.' });
  };

  const handleProvisionAgency = async () => {
    if (!agencyForm.name || !agencyForm.contact_email || !agencyForm.domain) {
      setNotice({ type: 'error', text: 'Name, subdomain and email are required' });
      return;
    }
    try {
      setProvisioning(true);
      setProvisionResult(null);
      const payload = {
        name: agencyForm.name,
        name_ar: agencyForm.name_ar || '',
        subdomain: agencyForm.domain,
        contact_email: agencyForm.contact_email,
        contact_phone: agencyForm.contact_phone || '',
        contact_phone2: agencyForm.contact_phone2 || '',
        whatsapp_phone: agencyForm.whatsapp_phone || '',
        contact_person_name: agencyForm.contact_person_name || '',
        country: agencyForm.country || 'SA',
        brand_color: agencyForm.brand_color || '#1a3c8e',
        accent_color: agencyForm.accent_color || '#2468c4',
        payment_methods: agencyForm.payment_methods || ['online'],
        commission_model: agencyForm.commission_model || 'fixed',
        commission_fixed_amount: Number(agencyForm.commission_fixed_amount) || 0,
        commission_rate: Number(agencyForm.commission_rate) || 0,
        bank_details: {
          bank_name: agencyForm.bank_name || null,
          iban: agencyForm.iban || null,
          swift_bic: agencyForm.swift_bic || null,
          bank_account: agencyForm.bank_account || null,
          sama_code: agencyForm.sama_code || null
        },
        logo_url: agencyForm.logo_url || '',
        about_en: agencyForm.about_en || '',
        about_ar: agencyForm.about_ar || '',
        working_hours: agencyForm.working_hours || '',
        working_hours_ar: agencyForm.working_hours_ar || '',
        license_number: agencyForm.license_number || '',
        iata_number: agencyForm.iata_number || '',
        founded_year: agencyForm.founded_year || '',
        google_maps_url: agencyForm.google_maps_url || '',
        instagram: agencyForm.instagram || '',
        twitter: agencyForm.twitter || '',
        snapchat: agencyForm.snapchat || '',
        facebook: agencyForm.facebook || '',
        services: agencyForm.services || []
      };
      const { data, error } = await provisionAdminAgency(payload);
      if (error) throw new Error(error.message || 'Provision failed');
      setProvisionResult(data);
      setNotice({ type: 'success', text: `Agency created & site deployed: ${data?.site_url || ''}` });
      setShowCreateAgencyForm(false);
      await Promise.all([loadAdminData(), loadAgencies()]);
    } catch (err) {
      setNotice({ type: 'error', text: `Provision failed: ${err.message}` });
    } finally {
      setProvisioning(false);
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
    const site = agency?.settings?.site || {};
    setAgencyEditForm({
      name: agency.name || '',
      name_ar: site.name_ar || '',
      domain: agency.domain || '',
      contact_email: agency.contact_email || '',
      contact_phone: agency.contact_phone || '',
      contact_phone2: site.contact_phone2 || '',
      whatsapp_phone: site.whatsapp_phone || '',
      is_active: !!agency.is_active,
      contact_person_name: agency?.settings?.contact_person?.full_name || '',
      supervisor_name: site.supervisor_name || '',
      supervisor_email: site.supervisor_email || '',
      bank_name: agency?.settings?.bank_details?.bank_name || '',
      bank_account: agency?.settings?.bank_details?.bank_account || '',
      iban: agency?.settings?.bank_details?.iban || '',
      swift_bic: agency?.settings?.bank_details?.swift_bic || '',
      sama_code: agency?.settings?.bank_details?.sama_code || '',
      widget_allowed_domains: Array.isArray(agency?.settings?.widget_allowed_domains)
        ? agency.settings.widget_allowed_domains.join('\n')
        : '',
      payment_methods: Array.isArray(agency?.settings?.payment_methods) && agency.settings.payment_methods.length
        ? agency.settings.payment_methods
        : ['online'],
      commission_model: agency?.settings?.commission?.model || 'fixed',
      commission_fixed_amount: agency?.settings?.commission?.fixed_amount ?? 0,
      commission_rate: agency?.commission_rate ?? 0,
      logo_url: site.logo_url || '',
      brand_color: site.brand_color || '#1a3c8e',
      accent_color: site.accent_color || '#2468c4',
      about_en: site.about_en || '',
      about_ar: site.about_ar || '',
      working_hours: site.working_hours || '',
      working_hours_ar: site.working_hours_ar || '',
      license_number: site.license_number || '',
      iata_number: site.iata_number || '',
      founded_year: site.founded_year || '',
      google_maps_url: site.google_maps_url || '',
      instagram: site.instagram || '',
      twitter: site.twitter || '',
      snapchat: site.snapchat || '',
      facebook: site.facebook || '',
      services: Array.isArray(site.services) && site.services.length
        ? site.services
        : ['flights_domestic','flights_intl','hotels','visa','insurance','umrah','tours','corporate'],
      hero_tagline: site.hero_tagline || '',
      hero_description: site.hero_description || '',
      destinations: Array.isArray(site.destinations) ? site.destinations : [],
      reviews: Array.isArray(site.reviews) ? site.reviews : [],
      featured_airlines: Array.isArray(site.featured_airlines) ? site.featured_airlines : [],
      hero_image_url: site.hero_image_url || '',
      header_bg: site.header_bg || '',
      footer_bg: site.footer_bg || ''
    });
  };

  const handleSaveAgency = async (agencyId) => {
    try {
      const payload = {
        name: agencyEditForm.name,
        name_ar: agencyEditForm.name_ar || '',
        domain: agencyEditForm.domain || null,
        contact_email: agencyEditForm.contact_email,
        contact_phone: agencyEditForm.contact_phone || null,
        contact_phone2: agencyEditForm.contact_phone2 || '',
        whatsapp_phone: agencyEditForm.whatsapp_phone || '',
        is_active: !!agencyEditForm.is_active,
        contact_person_name: agencyEditForm.contact_person_name || null,
        supervisor_name: agencyEditForm.supervisor_name || '',
        supervisor_email: agencyEditForm.supervisor_email || '',
        bank_details: {
          bank_name: agencyEditForm.bank_name || null,
          bank_account: agencyEditForm.bank_account || null,
          iban: agencyEditForm.iban || null,
          swift_bic: agencyEditForm.swift_bic || null,
          sama_code: agencyEditForm.sama_code || null
        },
        payment_methods: agencyEditForm.payment_methods || ['online'],
        commission_model: agencyEditForm.commission_model || 'fixed',
        commission_fixed_amount: Number(agencyEditForm.commission_fixed_amount) || 0,
        commission_rate: Number(agencyEditForm.commission_rate) || 0,
        widget_allowed_domains: parseWidgetDomains(agencyEditForm.widget_allowed_domains),
        logo_url: agencyEditForm.logo_url || '',
        brand_color: agencyEditForm.brand_color || '#1a3c8e',
        accent_color: agencyEditForm.accent_color || '#2468c4',
        about_en: agencyEditForm.about_en || '',
        about_ar: agencyEditForm.about_ar || '',
        working_hours: agencyEditForm.working_hours || '',
        working_hours_ar: agencyEditForm.working_hours_ar || '',
        license_number: agencyEditForm.license_number || '',
        iata_number: agencyEditForm.iata_number || '',
        founded_year: agencyEditForm.founded_year || '',
        google_maps_url: agencyEditForm.google_maps_url || '',
        instagram: agencyEditForm.instagram || '',
        twitter: agencyEditForm.twitter || '',
        snapchat: agencyEditForm.snapchat || '',
        facebook: agencyEditForm.facebook || '',
        services: agencyEditForm.services || [],
        hero_tagline: agencyEditForm.hero_tagline || '',
        hero_description: agencyEditForm.hero_description || '',
        destinations: agencyEditForm.destinations || [],
        reviews: agencyEditForm.reviews || [],
        featured_airlines: agencyEditForm.featured_airlines || [],
        hero_image_url: agencyEditForm.hero_image_url || '',
        header_bg: agencyEditForm.header_bg || '',
        footer_bg: agencyEditForm.footer_bg || ''
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
      // Build carrier_commissions based on mode
      let carrierCommissionsPayload = {};
      if (agencySelfForm.carrier_commission_mode === 'all') {
        const allAmt = Number(agencySelfForm.carrier_commission_all_amount || 0);
        if (allAmt > 0) {
          CARRIERS.forEach(({ code }) => { carrierCommissionsPayload[code] = allAmt; });
        }
      } else {
        // per_carrier mode — only include positive values
        Object.entries(agencySelfForm.carrier_commissions || {}).forEach(([code, val]) => {
          const v = Number(val);
          if (v > 0) carrierCommissionsPayload[code] = v;
        });
      }

      const payload = {
        commission_rate: agencySelfForm.commission_model === 'percent'
          ? Number(agencySelfForm.commission_rate || 0)
          : 0,
        commission_model: agencySelfForm.commission_model || 'percent',
        commission_fixed_amount: agencySelfForm.commission_model === 'fixed'
          ? Number(agencySelfForm.commission_fixed_amount || 0)
          : 0,
        carrier_commissions: carrierCommissionsPayload,
        currency: agencySelfForm.currency || 'SAR',
        bank_details: {
          bank_name: agencySelfForm.bank_name || null,
          bank_account: agencySelfForm.bank_account || null,
          iban: agencySelfForm.iban || null,
          swift_bic: agencySelfForm.swift_bic || null,
          sama_code: agencySelfForm.sama_code || null
        },
        contact_person_name: agencySelfForm.contact_person_name || null,
        widget_allowed_domains: widgetDomains,
        name_ar: agencySelfForm.name_ar || '',
        contact_phone2: agencySelfForm.contact_phone2 || '',
        whatsapp_phone: agencySelfForm.whatsapp_phone || '',
        brand_color: agencySelfForm.brand_color || '#1a3c8e',
        accent_color: agencySelfForm.accent_color || '#2468c4',
        supervisor_name: agencySelfForm.supervisor_name || '',
        supervisor_email: agencySelfForm.supervisor_email || '',
        logo_url: agencySelfForm.logo_url || '',
        about_en: agencySelfForm.about_en || '',
        about_ar: agencySelfForm.about_ar || '',
        working_hours: agencySelfForm.working_hours || '',
        working_hours_ar: agencySelfForm.working_hours_ar || '',
        license_number: agencySelfForm.license_number || '',
        iata_number: agencySelfForm.iata_number || '',
        founded_year: agencySelfForm.founded_year || '',
        google_maps_url: agencySelfForm.google_maps_url || '',
        instagram: agencySelfForm.instagram || '',
        twitter: agencySelfForm.twitter || '',
        snapchat: agencySelfForm.snapchat || '',
        facebook: agencySelfForm.facebook || '',
        services: Array.isArray(agencySelfForm.services) ? agencySelfForm.services : [],
        hero_tagline: agencySelfForm.hero_tagline || '',
        hero_description: agencySelfForm.hero_description || '',
        destinations: agencySelfForm.destinations || [],
        reviews: agencySelfForm.reviews || [],
        featured_airlines: agencySelfForm.featured_airlines || [],
        hero_image_url: agencySelfForm.hero_image_url || '',
        header_bg: agencySelfForm.header_bg || '',
        footer_bg: agencySelfForm.footer_bg || ''
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

  const handleRedeployAgencySite = async () => {
    try {
      setSiteRedeploying(true);
      let result;
      if (isAgencyAdminPreview && ['admin', 'super_admin'].includes(userProfile?.role)) {
        let agencyIdForUpdate = userProfile?.agency_id || agencyPreviewId || agencies[0]?.id || null;
        if (!agencyIdForUpdate) {
          agencyIdForUpdate = await resolveAgencyIdForAgencyAdmin();
        }
        if (!agencyIdForUpdate) {
          throw new Error('Agency is not linked to this account');
        }
        result = await redeployAdminAgencySite(agencyIdForUpdate);
      } else {
        result = await redeployMyAgencySite();
      }
      if (result?.error) {
        throw new Error(result.error.message || 'Agency site redeploy failed');
      }
      setNotice({
        type: 'success',
        text: `Site update started — your live site will refresh in 1–2 minutes.${result?.data?.site_url ? ` URL: ${result.data.site_url}` : ''}`
      });
    } catch (err) {
      setNotice({ type: 'error', text: `Failed to publish site updates: ${err.message}` });
    } finally {
      setSiteRedeploying(false);
    }
  };

  const handlePublishAgencySite = async () => {
    try {
      setSitePublishing(true);
      let result;
      if (isAgencyAdminPreview && ['admin', 'super_admin'].includes(userProfile?.role)) {
        let agencyIdForUpdate = userProfile?.agency_id || agencyPreviewId || agencies[0]?.id || null;
        if (!agencyIdForUpdate) {
          agencyIdForUpdate = await resolveAgencyIdForAgencyAdmin();
        }
        if (!agencyIdForUpdate) {
          throw new Error('Agency is not linked to this account');
        }
        result = await publishAdminAgencySite(agencyIdForUpdate);
      } else {
        result = await publishMyAgencySite();
      }
      if (result?.error) {
        throw new Error(result.error.message || 'Agency site publish failed');
      }
      setNotice({
        type: 'success',
        text: `Site publish started — your site will be live in 1–2 minutes.${result?.data?.site_url ? ` URL: ${result.data.site_url}` : ''}`
      });
      if (isAgencyAdminPreview) {
        await Promise.all([loadAdminData(), loadMyAgencySettings()]);
      } else {
        await loadMyAgencySettings();
      }
    } catch (err) {
      setNotice({ type: 'error', text: `Failed to publish agency site: ${err.message}` });
    } finally {
      setSitePublishing(false);
    }
  };

  const handleSendSetupEmail = async (agencyId) => {
    if (!agencyId) {
      setNotice({ type: 'error', text: 'Agency id is missing' });
      return;
    }
    try {
      setSetupEmailSendingId(agencyId);
      const { data, error } = await sendAdminAgencySetupEmail(agencyId);
      if (error) throw new Error(error.message || 'Setup email failed');
      setNotice({
        type: 'success',
        text: `Setup email sent to ${data?.agency?.contact_email || 'agency manager'}`
      });
      if (agencySelfMeta?.id === agencyId) {
        await loadMyAgencySettings();
      }
      await Promise.all([loadAdminData(), loadAgencies()]);
    } catch (err) {
      setNotice({ type: 'error', text: `Failed to send setup email: ${err.message}` });
    } finally {
      setSetupEmailSendingId(null);
    }
  };

  const handlePublishAgencyRow = async (agency) => {
    if (!agency?.id) {
      setNotice({ type: 'error', text: 'Agency id is missing' });
      return;
    }
    try {
      setRowPublishingId(agency.id);
      const result = await publishAdminAgencySite(agency.id);
      if (result?.error) {
        throw new Error(result.error.message || 'Initial publish failed');
      }
      setNotice({
        type: 'success',
        text: `Site publish started — will be live in 1–2 minutes.${result?.data?.site_url ? ` URL: ${result.data.site_url}` : ''}`
      });
      await Promise.all([loadAdminData(), loadAgencies()]);
    } catch (err) {
      setNotice({ type: 'error', text: `Failed to publish site: ${err.message}` });
    } finally {
      setRowPublishingId(null);
    }
  };

  const handleRedeployAgencyRow = async (agency) => {
    if (!agency?.id) {
      setNotice({ type: 'error', text: 'Agency id is missing' });
      return;
    }
    try {
      setRowRedeployingId(agency.id);
      const result = await redeployAdminAgencySite(agency.id);
      if (result?.error) {
        throw new Error(result.error.message || 'Republish failed');
      }
      setNotice({
        type: 'success',
        text: `Site republish started — changes will be live in 1–2 minutes.${result?.data?.site_url ? ` URL: ${result.data.site_url}` : ''}`
      });
      await Promise.all([loadAdminData(), loadAgencies()]);
    } catch (err) {
      setNotice({ type: 'error', text: `Failed to republish site: ${err.message}` });
    } finally {
      setRowRedeployingId(null);
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
          status: 'issued',
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
                status: 'issued',
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

  const handleMarkOrderPaid = async (order) => {
    if (!window.confirm(`Mark order ${order.order_number} as paid? This will trigger ticket issuance and email to ${order.contact_email}.`)) return;
    try {
      setMarkingPaidOrderId(order.id);
      const { error } = await markOrderPaid(order.id);
      if (error) throw new Error(error.message || 'Failed to mark as paid');
      setNotice({ type: 'success', text: `Order ${order.order_number} marked as paid. Ticket will be issued and emailed shortly.` });
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, payment_status: 'paid', status: 'confirmed', confirmed_at: new Date().toISOString() } : o));
    } catch (err) {
      setNotice({ type: 'error', text: `Failed to mark as paid: ${err.message}` });
    } finally {
      setMarkingPaidOrderId(null);
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
      issued: {
        icon: CheckCircle,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        label: 'Issued'
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
        order.drct_order_id?.toLowerCase().includes(query) ||
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
    issued: orders.filter(o => normalizeStatus(o.status) === 'issued').length,
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
    return `<div id="aviaframe-widget"></div>
<script
  src="${widgetBase}/embed.js"
  data-agency-key="${agencyKey}"
  data-target-id="aviaframe-widget"
  data-locale="en"
  data-theme="light"
  async
></script>`;
  }, [agencySelfMeta?.api_key, agencySelfMeta?.domain, agencySelfMeta?.name]);

  const widgetPreviewUrl = useMemo(() => {
    const agencyKey = agencySelfMeta?.api_key || agencySelfMeta?.domain || agencySelfMeta?.id || '';
    const widgetBase = typeof window !== 'undefined' ? window.location.origin : '';
    if (!widgetBase) return '/widget-preview.html';
    const preview = new URL('/widget-preview.html', widgetBase);
    if (agencyKey) preview.searchParams.set('agency_key', agencyKey);
    preview.searchParams.set('backend_base', `${widgetBase}/api/backend`);
    preview.searchParams.set('agency_name', agencySelfMeta?.name || 'Aviaframe');
    if (agencySelfMeta?.domain) preview.searchParams.set('agency_domain', agencySelfMeta.domain);
    preview.searchParams.set('preview_mode', '1');
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
              onClick={() => setStatusFilter('issued')}
              className={`text-left rounded-lg shadow-md p-4 border ${statusFilter === 'issued' ? 'border-green-400 bg-green-100' : 'border-green-200 bg-green-50'}`}
            >
              <div className="text-2xl font-bold text-green-600">{stats.issued}</div>
              <div className="text-sm text-green-700">Issued</div>
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
            {isAgencyAdminPreview && agencies.length > 0 && (
              <div className="mb-3 flex items-center gap-2">
                <label className="text-sm text-gray-600 shrink-0">Agency:</label>
                <select
                  value={agencyPreviewId || userProfile?.agency_id || agencies[0]?.id || ''}
                  onChange={(e) => {
                    const selected = agencies.find((a) => a.id === e.target.value);
                    if (!selected) return;
                    setAgencyPreviewId(selected.id);
                    setUserProfile((p) => p ? { ...p, agency_id: selected.id } : p);
                    applyAgencyToSelfForm(selected);
                  }}
                  className="border rounded px-2 py-1 text-sm font-semibold text-gray-900 flex-1 max-w-xs"
                >
                  {agencies.map((a) => (
                    <option key={a.id} value={a.id}>{a.name} {a.domain ? `(${a.domain})` : ''}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="mb-4 border border-slate-200 rounded-xl bg-gradient-to-br from-slate-50 to-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500 font-semibold">Onboarding</p>
                  <h3 className="text-base font-semibold text-slate-900">
                    {agencySelfMeta?.name || 'Agency setup'}
                  </h3>
                  <p className="text-sm text-slate-600">
                    Public site and widget rollout are now tracked step by step.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${selectedOnboardingMeta.tone}`}>
                    {selectedOnboardingMeta.label}
                  </span>
                  <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${selectedDeployMeta.tone}`}>
                    {selectedDeployMeta.label}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-3">
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="font-medium text-slate-900 mb-1">Checklist</div>
                  <div className="space-y-1">
                    {(selectedAgencyOnboarding?.checklist?.items || []).map((item) => (
                      <div key={item.key} className="flex items-start gap-2">
                        <span className={`mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${item.done ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                          {item.done ? '✓' : '•'}
                        </span>
                        <div>
                          <div className="text-slate-900">{item.label}</div>
                          {!item.done && item.hint && (
                            <div className="text-xs text-slate-500">{item.hint}</div>
                          )}
                        </div>
                      </div>
                    ))}
                    {!(selectedAgencyOnboarding?.checklist?.items || []).length && (
                      <p className="text-slate-500">Save agency settings to start the onboarding checklist.</p>
                    )}
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-2">
                  <div>
                    <div className="font-medium text-slate-900">Manager access</div>
                    <div className="text-slate-600">
                      {agencySelfMeta?.contact_email || 'No manager email yet'}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-slate-900">Last setup email</div>
                    <div className="text-slate-600">
                      {formatDateTime(selectedAgencyOnboarding?.invite_sent_at)}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-slate-900">Last site publish</div>
                    <div className="text-slate-600">
                      {formatDateTime(selectedAgencyDeploy?.last_success_at)}
                    </div>
                  </div>
                  {selectedAgencyDeploy?.last_error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                      {selectedAgencyDeploy.last_error}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {isAgencyAdminPreview && ['admin', 'super_admin'].includes(userProfile?.role) && agencySelfMeta?.id && (
                  <button
                    onClick={() => handleSendSetupEmail(agencySelfMeta.id)}
                    disabled={setupEmailSendingId === agencySelfMeta.id}
                    className={`rounded px-3 py-1.5 text-sm ${setupEmailSendingId === agencySelfMeta.id ? 'bg-gray-200 text-gray-500' : 'bg-indigo-600 text-white'}`}
                  >
                    {setupEmailSendingId === agencySelfMeta.id ? 'Sending setup email...' : 'Send setup email'}
                  </button>
                )}
                <button
                  onClick={handlePublishAgencySite}
                  disabled={sitePublishing || !selectedAgencyOnboarding?.publish_ready}
                  className={`rounded px-3 py-1.5 text-sm ${sitePublishing || !selectedAgencyOnboarding?.publish_ready ? 'bg-gray-200 text-gray-500' : 'bg-emerald-600 text-white'}`}
                >
                  {sitePublishing ? 'Publishing...' : 'Publish site'}
                </button>
                <button
                  onClick={handleRedeployAgencySite}
                  disabled={siteRedeploying || !agencySelfMeta?.domain}
                  className={`rounded px-3 py-1.5 text-sm ${siteRedeploying || !agencySelfMeta?.domain ? 'bg-gray-200 text-gray-500' : 'bg-amber-500 text-white'}`}
                >
                  {siteRedeploying ? 'Publishing...' : 'Republish current site'}
                </button>
                {agencySelfMeta?.domain && (
                  <button
                    onClick={() => window.open(`https://${agencySelfMeta.domain}`, '_blank')}
                    className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700"
                  >
                    Open public site
                  </button>
                )}
              </div>
            </div>
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

              {/* Per-carrier commission section */}
              <div className="md:col-span-3 border border-amber-200 rounded-lg p-3 bg-amber-50/40">
                <h3 className="text-sm font-semibold text-gray-800 mb-1">
                  Per-carrier commission <span className="font-normal text-gray-500">(SAR, added on top of global commission)</span>
                </h3>
                <div className="flex gap-4 mb-3">
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="radio"
                      name="carrier_commission_mode"
                      value="all"
                      checked={agencySelfForm.carrier_commission_mode === 'all'}
                      onChange={() => setAgencySelfForm((p) => ({ ...p, carrier_commission_mode: 'all' }))}
                    />
                    Same for all carriers
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="radio"
                      name="carrier_commission_mode"
                      value="per_carrier"
                      checked={agencySelfForm.carrier_commission_mode === 'per_carrier'}
                      onChange={() => setAgencySelfForm((p) => ({ ...p, carrier_commission_mode: 'per_carrier' }))}
                    />
                    Per carrier
                  </label>
                </div>

                {agencySelfForm.carrier_commission_mode === 'all' ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={agencySelfForm.carrier_commission_all_amount}
                      onChange={(e) => setAgencySelfForm((p) => ({ ...p, carrier_commission_all_amount: e.target.value }))}
                      placeholder="0"
                      className="border rounded px-2 py-1 w-36"
                    />
                    <span className="text-sm text-gray-600">SAR per ticket (all carriers)</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-1 max-h-64 overflow-y-auto pr-1">
                    {CARRIERS.map(({ code, name }) => (
                      <div key={code} className="flex items-center gap-1">
                        <span className="text-xs font-mono text-gray-700 w-7 shrink-0">{code}</span>
                        <span className="text-xs text-gray-500 truncate flex-1 min-w-0" title={name}>{name}</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={agencySelfForm.carrier_commissions[code] ?? ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setAgencySelfForm((p) => ({
                              ...p,
                              carrier_commissions: {
                                ...p.carrier_commissions,
                                [code]: val === '' ? undefined : val
                              }
                            }));
                          }}
                          placeholder="0"
                          className="border rounded px-1 py-0.5 w-16 text-xs shrink-0"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

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
              <div className="md:col-span-3 border border-indigo-100 rounded-lg p-4 bg-indigo-50/30">
                <h3 className="text-sm font-semibold text-indigo-900 mb-3">Branding, support and public site content</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    value={agencySelfForm.name_ar}
                    onChange={(e) => setAgencySelfForm((p) => ({ ...p, name_ar: e.target.value }))}
                    placeholder="Arabic agency name"
                    className="border rounded px-2 py-1"
                  />
                  <input
                    value={agencySelfForm.contact_phone2}
                    onChange={(e) => setAgencySelfForm((p) => ({ ...p, contact_phone2: e.target.value }))}
                    placeholder="Secondary phone"
                    className="border rounded px-2 py-1"
                  />
                  <input
                    value={agencySelfForm.whatsapp_phone}
                    onChange={(e) => setAgencySelfForm((p) => ({ ...p, whatsapp_phone: e.target.value }))}
                    placeholder="WhatsApp phone"
                    className="border rounded px-2 py-1"
                  />
                  <input
                    value={agencySelfForm.supervisor_name}
                    onChange={(e) => setAgencySelfForm((p) => ({ ...p, supervisor_name: e.target.value }))}
                    placeholder="Supervisor name"
                    className="border rounded px-2 py-1"
                  />
                  <input
                    type="email"
                    value={agencySelfForm.supervisor_email}
                    onChange={(e) => setAgencySelfForm((p) => ({ ...p, supervisor_email: e.target.value }))}
                    placeholder="Supervisor email"
                    className="border rounded px-2 py-1"
                  />
                  <input
                    value={agencySelfForm.logo_url}
                    onChange={(e) => setAgencySelfForm((p) => ({ ...p, logo_url: e.target.value }))}
                    placeholder="Logo URL"
                    className="border rounded px-2 py-1"
                  />
                  <label className="border rounded px-3 py-2 text-sm text-gray-700 bg-white cursor-pointer flex items-center justify-between">
                    <span>{logoUploading ? 'Uploading logo...' : 'Upload logo file'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleAgencySelfLogoUpload(e.target.files?.[0])}
                    />
                  </label>
                  <p className="text-xs text-gray-400">PNG, SVG, or JPG. Max 2 MB. Recommended size: min 200px height, 2:1–4:1 aspect ratio (e.g. 400×100px), transparent background. After uploading, save settings and click <strong>Republish</strong> to update your live site.</p>
                  <div className="flex items-center gap-3 border rounded px-3 py-2 bg-white">
                    <label className="text-sm text-gray-600">Brand</label>
                    <input
                      type="color"
                      value={agencySelfForm.brand_color}
                      onChange={(e) => setAgencySelfForm((p) => ({ ...p, brand_color: e.target.value }))}
                      className="w-12 h-8 border rounded"
                    />
                    <label className="text-sm text-gray-600 ml-2">Accent</label>
                    <input
                      type="color"
                      value={agencySelfForm.accent_color}
                      onChange={(e) => setAgencySelfForm((p) => ({ ...p, accent_color: e.target.value }))}
                      className="w-12 h-8 border rounded"
                    />
                  </div>
                  <input
                    value={agencySelfForm.license_number}
                    onChange={(e) => setAgencySelfForm((p) => ({ ...p, license_number: e.target.value }))}
                    placeholder="License / CR number"
                    className="border rounded px-2 py-1"
                  />
                  <input
                    value={agencySelfForm.iata_number}
                    onChange={(e) => setAgencySelfForm((p) => ({ ...p, iata_number: e.target.value }))}
                    placeholder="IATA number"
                    className="border rounded px-2 py-1"
                  />
                  <input
                    value={agencySelfForm.founded_year}
                    onChange={(e) => setAgencySelfForm((p) => ({ ...p, founded_year: e.target.value }))}
                    placeholder="Founded year"
                    className="border rounded px-2 py-1"
                  />
                  <input
                    value={agencySelfForm.google_maps_url}
                    onChange={(e) => setAgencySelfForm((p) => ({ ...p, google_maps_url: e.target.value }))}
                    placeholder="Google Maps embed URL"
                    className="border rounded px-2 py-1"
                  />
                  <input
                    value={agencySelfForm.instagram}
                    onChange={(e) => setAgencySelfForm((p) => ({ ...p, instagram: e.target.value }))}
                    placeholder="Instagram URL"
                    className="border rounded px-2 py-1"
                  />
                  <input
                    value={agencySelfForm.twitter}
                    onChange={(e) => setAgencySelfForm((p) => ({ ...p, twitter: e.target.value }))}
                    placeholder="Twitter / X URL"
                    className="border rounded px-2 py-1"
                  />
                  <input
                    value={agencySelfForm.snapchat}
                    onChange={(e) => setAgencySelfForm((p) => ({ ...p, snapchat: e.target.value }))}
                    placeholder="Snapchat URL"
                    className="border rounded px-2 py-1"
                  />
                  <input
                    value={agencySelfForm.facebook}
                    onChange={(e) => setAgencySelfForm((p) => ({ ...p, facebook: e.target.value }))}
                    placeholder="Facebook URL"
                    className="border rounded px-2 py-1"
                  />
                  <input
                    value={agencySelfForm.working_hours}
                    onChange={(e) => setAgencySelfForm((p) => ({ ...p, working_hours: e.target.value }))}
                    placeholder="Working hours (EN)"
                    className="border rounded px-2 py-1 md:col-span-2"
                  />
                  <input
                    value={agencySelfForm.working_hours_ar}
                    onChange={(e) => setAgencySelfForm((p) => ({ ...p, working_hours_ar: e.target.value }))}
                    placeholder="Working hours (AR)"
                    className="border rounded px-2 py-1 md:col-span-2"
                  />
                  <textarea
                    value={agencySelfForm.about_en}
                    onChange={(e) => setAgencySelfForm((p) => ({ ...p, about_en: e.target.value }))}
                    placeholder="About section (EN)"
                    className="border rounded px-2 py-2 md:col-span-2 min-h-24"
                  />
                  <textarea
                    value={agencySelfForm.about_ar}
                    onChange={(e) => setAgencySelfForm((p) => ({ ...p, about_ar: e.target.value }))}
                    placeholder="About section (AR)"
                    className="border rounded px-2 py-2 md:col-span-2 min-h-24"
                  />
                  <div className="md:col-span-2 border rounded px-3 py-3 bg-white">
                    <div className="text-sm font-medium text-gray-700 mb-2">Services shown on agency landing page</div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {SERVICE_OPTIONS.map((service) => {
                        const checked = agencySelfForm.services.includes(service.key);
                        return (
                          <label key={service.key} className="flex items-center gap-2 text-sm text-gray-700">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                setAgencySelfForm((p) => ({
                                  ...p,
                                  services: e.target.checked
                                    ? [...new Set([...p.services, service.key])]
                                    : p.services.filter((value) => value !== service.key)
                                }));
                              }}
                            />
                            {service.label}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
              {/* Self: Header / Footer colors */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 font-semibold mb-1">Header background color</p>
                  <div className="flex items-center gap-2">
                    <input type="color" value={agencySelfForm.header_bg || '#ffffff'}
                      onChange={(e) => setAgencySelfForm((p) => ({ ...p, header_bg: e.target.value }))}
                      className="h-8 w-10 rounded border cursor-pointer" />
                    <input value={agencySelfForm.header_bg || ''}
                      onChange={(e) => setAgencySelfForm((p) => ({ ...p, header_bg: e.target.value }))}
                      className="border rounded px-2 py-1 text-sm flex-1" placeholder="#ffffff (default white)" />
                    {agencySelfForm.header_bg && (
                      <button onClick={() => setAgencySelfForm((p) => ({ ...p, header_bg: '' }))}
                        className="text-xs text-gray-400 hover:text-gray-600">✕</button>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold mb-1">Footer background color</p>
                  <div className="flex items-center gap-2">
                    <input type="color" value={agencySelfForm.footer_bg || agencySelfForm.brand_color || '#1a3c8e'}
                      onChange={(e) => setAgencySelfForm((p) => ({ ...p, footer_bg: e.target.value }))}
                      className="h-8 w-10 rounded border cursor-pointer" />
                    <input value={agencySelfForm.footer_bg || ''}
                      onChange={(e) => setAgencySelfForm((p) => ({ ...p, footer_bg: e.target.value }))}
                      className="border rounded px-2 py-1 text-sm flex-1" placeholder="default = brand color" />
                    {agencySelfForm.footer_bg && (
                      <button onClick={() => setAgencySelfForm((p) => ({ ...p, footer_bg: '' }))}
                        className="text-xs text-gray-400 hover:text-gray-600">✕</button>
                    )}
                  </div>
                </div>
              </div>

              {/* Self: Hero */}
              <div>
                <p className="text-xs text-gray-500 font-semibold mb-1">Hero — headline, sub-text &amp; background image</p>
                <div className="space-y-2">
                  <input value={agencySelfForm.hero_tagline || ''}
                    onChange={(e) => setAgencySelfForm((p) => ({ ...p, hero_tagline: e.target.value }))}
                    className="border rounded px-2 py-1 w-full text-sm"
                    placeholder="Hero headline (leave blank for default)" />
                  <textarea value={agencySelfForm.hero_description || ''}
                    onChange={(e) => setAgencySelfForm((p) => ({ ...p, hero_description: e.target.value }))}
                    className="border rounded px-2 py-1 w-full text-sm min-h-14"
                    placeholder="Hero sub-text (leave blank for default)" />
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Hero background image (leave blank for brand color gradient). Recommended: 1920×600px min, JPG/WebP, under 2 MB.</p>
                    <div className="flex gap-2">
                      <input value={agencySelfForm.hero_image_url || ''}
                        onChange={(e) => setAgencySelfForm((p) => ({ ...p, hero_image_url: e.target.value }))}
                        className="border rounded px-2 py-1 text-sm flex-1"
                        placeholder="https://... image URL" />
                      {agencySelfForm.hero_image_url && (
                        <button onClick={() => setAgencySelfForm((p) => ({ ...p, hero_image_url: '' }))}
                          className="text-xs text-gray-400 hover:text-gray-600 px-1">✕</button>
                      )}
                    </div>
                    {agencySelfForm.hero_image_url && (
                      <img src={agencySelfForm.hero_image_url} alt="hero preview"
                        className="mt-2 h-20 w-full object-cover rounded border" />
                    )}
                  </div>
                </div>
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
                <p>3) Publish site updates after changing logo, colors or content.</p>
                <p>4) Open preview and verify the widget loads.</p>
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
                  onClick={handleRedeployAgencySite}
                  disabled={siteRedeploying || !agencySelfMeta?.domain}
                  className={`rounded px-3 py-1 text-sm ${siteRedeploying || !agencySelfMeta?.domain ? 'bg-gray-200 text-gray-500' : 'bg-amber-500 text-white'}`}
                >
                  {siteRedeploying ? 'Publishing...' : 'Publish site updates'}
                </button>
                {agencySelfMeta?.domain && (
                  <button
                    onClick={() => window.open(`https://${agencySelfMeta.domain}`, '_blank')}
                    className="bg-white border border-amber-300 text-amber-700 rounded px-3 py-1 text-sm"
                  >
                    Open public site
                  </button>
                )}
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
              <div className="text-xs text-gray-600 mt-2 space-y-1">
                <p>
                  Current public widget key: <span className="font-mono">{agencySelfMeta?.api_key || agencySelfMeta?.domain || agencySelfMeta?.id || '—'}</span>
                </p>
                {agencySelfMeta?.domain && (
                  <p>
                    Public site domain: <span className="font-mono">{agencySelfMeta.domain}</span>
                  </p>
                )}
              </div>
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
              <button
                onClick={() => setActiveAdminSection('sales_report')}
                className={`px-3 py-2 rounded text-sm font-medium ${activeAdminSection === 'sales_report' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                Sales Report
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
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide pt-1">Basic info</p>
                    <input value={agencyForm.name} onChange={(e) => setAgencyForm((p) => ({ ...p, name: e.target.value }))} placeholder="Agency name (English) *" className="w-full border rounded px-2 py-1" />
                    <input value={agencyForm.name_ar} onChange={(e) => setAgencyForm((p) => ({ ...p, name_ar: e.target.value }))} placeholder="Agency name (Arabic) اسم الوكالة" className="w-full border rounded px-2 py-1" dir="rtl" />
                    <div className="flex gap-2">
                      <input value={agencyForm.domain} onChange={(e) => setAgencyForm((p) => ({ ...p, domain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,'') }))} placeholder="Subdomain * e.g. almalek" className="flex-1 border rounded px-2 py-1" />
                      <span className="self-center text-gray-400 text-sm">.aviaframe.com</span>
                    </div>
                    <input value={agencyForm.contact_email} onChange={(e) => setAgencyForm((p) => ({ ...p, contact_email: e.target.value }))} placeholder="Email (agency admin login) *" className="w-full border rounded px-2 py-1" />
                    <input value={agencyForm.contact_phone} onChange={(e) => setAgencyForm((p) => ({ ...p, contact_phone: e.target.value }))} placeholder="Phone 1 (WhatsApp) e.g. +966 50 274 7653" className="w-full border rounded px-2 py-1" />
                    <input value={agencyForm.contact_phone2} onChange={(e) => setAgencyForm((p) => ({ ...p, contact_phone2: e.target.value }))} placeholder="Phone 2 (office)" className="w-full border rounded px-2 py-1" />
                    <input value={agencyForm.contact_person_name} onChange={(e) => setAgencyForm((p) => ({ ...p, contact_person_name: e.target.value }))} placeholder="Supervisor name" className="w-full border rounded px-2 py-1" />
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide pt-1">Logo</p>
                    <div className="flex gap-3 items-center flex-wrap">
                      <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 border rounded px-3 py-1 text-sm transition-colors">
                        {logoUploading ? 'Uploading...' : '📁 Upload logo (PNG/SVG)'}
                        <input type="file" accept="image/*" className="hidden" disabled={logoUploading}
                          onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])} />
                      </label>
                      {agencyForm.logo_url && (
                        <div className="flex items-center gap-2">
                          <img src={agencyForm.logo_url} alt="logo preview" className="h-10 w-auto object-contain border rounded bg-white p-1" />
                          <button onClick={() => setAgencyForm(p => ({ ...p, logo_url: '' }))} className="text-red-400 text-xs">✕ Remove</button>
                        </div>
                      )}
                      <input value={agencyForm.logo_url} onChange={(e) => setAgencyForm(p => ({ ...p, logo_url: e.target.value }))} placeholder="Or paste logo URL" className="flex-1 min-w-0 border rounded px-2 py-1 text-sm" />
                    </div>
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide pt-1">Brand colors</p>
                    <div className="flex gap-3 items-center">
                      <label className="text-sm text-gray-600 flex items-center gap-2">
                        Header color
                        <input type="color" value={agencyForm.brand_color} onChange={(e) => setAgencyForm((p) => ({ ...p, brand_color: e.target.value }))} className="w-10 h-8 rounded cursor-pointer border" />
                        <span className="text-xs text-gray-400">{agencyForm.brand_color}</span>
                      </label>
                      <label className="text-sm text-gray-600 flex items-center gap-2">
                        Accent color
                        <input type="color" value={agencyForm.accent_color} onChange={(e) => setAgencyForm((p) => ({ ...p, accent_color: e.target.value }))} className="w-10 h-8 rounded cursor-pointer border" />
                        <span className="text-xs text-gray-400">{agencyForm.accent_color}</span>
                      </label>
                    </div>
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide pt-1">About (optional)</p>
                    <textarea value={agencyForm.about_en} onChange={(e) => setAgencyForm(p => ({ ...p, about_en: e.target.value }))} placeholder="About agency (English) — shown on site homepage" className="w-full border rounded px-2 py-1 text-sm min-h-16" />
                    <textarea value={agencyForm.about_ar} onChange={(e) => setAgencyForm(p => ({ ...p, about_ar: e.target.value }))} placeholder="About agency (Arabic) — نبذة عن الوكالة" className="w-full border rounded px-2 py-1 text-sm min-h-16" dir="rtl" />
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide pt-1">Services (optional — check what the agency offers)</p>
                    <div className="grid grid-cols-2 gap-1">
                      {[
                        {key:'flights_domestic',label:'Domestic flights'},
                        {key:'flights_intl',label:'International flights'},
                        {key:'hotels',label:'Hotel reservations'},
                        {key:'visa',label:'Visa assistance'},
                        {key:'insurance',label:'Travel insurance'},
                        {key:'umrah',label:'Umrah & Hajj'},
                        {key:'tours',label:'Tour packages'},
                        {key:'corporate',label:'Corporate travel'},
                        {key:'transfers',label:'Airport transfers'},
                        {key:'car_rental',label:'Car rental'}
                      ].map(s => (
                        <label key={s.key} className="flex items-center gap-1 text-sm cursor-pointer">
                          <input type="checkbox" checked={(agencyForm.services||[]).includes(s.key)}
                            onChange={e => setAgencyForm(p => ({
                              ...p,
                              services: e.target.checked
                                ? [...(p.services||[]), s.key]
                                : (p.services||[]).filter(x => x !== s.key)
                            }))} />
                          {s.label}
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide pt-1">Office info (optional)</p>
                    <input value={agencyForm.working_hours} onChange={(e) => setAgencyForm(p => ({ ...p, working_hours: e.target.value }))} placeholder="Working hours EN: Sat–Thu 9:00–18:00" className="w-full border rounded px-2 py-1 text-sm" />
                    <input value={agencyForm.working_hours_ar} onChange={(e) => setAgencyForm(p => ({ ...p, working_hours_ar: e.target.value }))} placeholder="Working hours AR: السبت–الخميس 9:00–18:00" className="w-full border rounded px-2 py-1 text-sm" dir="rtl" />
                    <input value={agencyForm.google_maps_url} onChange={(e) => setAgencyForm(p => ({ ...p, google_maps_url: e.target.value }))} placeholder="Google Maps embed URL (iframe src=...)" className="w-full border rounded px-2 py-1 text-sm" />
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide pt-1">Trust & credentials (optional)</p>
                    <div className="grid grid-cols-3 gap-2">
                      <input value={agencyForm.license_number} onChange={(e) => setAgencyForm(p => ({ ...p, license_number: e.target.value }))} placeholder="License / CR #" className="border rounded px-2 py-1 text-sm" />
                      <input value={agencyForm.iata_number} onChange={(e) => setAgencyForm(p => ({ ...p, iata_number: e.target.value }))} placeholder="IATA #" className="border rounded px-2 py-1 text-sm" />
                      <input value={agencyForm.founded_year} onChange={(e) => setAgencyForm(p => ({ ...p, founded_year: e.target.value }))} placeholder="Founded year" className="border rounded px-2 py-1 text-sm" />
                    </div>
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide pt-1">Social media (optional)</p>
                    <div className="grid grid-cols-2 gap-2">
                      <input value={agencyForm.instagram} onChange={(e) => setAgencyForm(p => ({ ...p, instagram: e.target.value }))} placeholder="Instagram URL" className="border rounded px-2 py-1 text-sm" />
                      <input value={agencyForm.twitter} onChange={(e) => setAgencyForm(p => ({ ...p, twitter: e.target.value }))} placeholder="Twitter/X URL" className="border rounded px-2 py-1 text-sm" />
                      <input value={agencyForm.snapchat} onChange={(e) => setAgencyForm(p => ({ ...p, snapchat: e.target.value }))} placeholder="Snapchat URL" className="border rounded px-2 py-1 text-sm" />
                      <input value={agencyForm.facebook} onChange={(e) => setAgencyForm(p => ({ ...p, facebook: e.target.value }))} placeholder="Facebook URL" className="border rounded px-2 py-1 text-sm" />
                      <input value={agencyForm.whatsapp_phone} onChange={(e) => setAgencyForm(p => ({ ...p, whatsapp_phone: e.target.value }))} placeholder="WhatsApp (if different from Phone 1)" className="border rounded px-2 py-1 text-sm col-span-2" />
                    </div>
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide pt-1">Commission</p>
                    <div className="flex gap-2">
                      <select value={agencyForm.commission_model} onChange={(e) => setAgencyForm((p) => ({ ...p, commission_model: e.target.value }))} className="border rounded px-2 py-1 text-sm">
                        <option value="fixed">Fixed (SAR)</option>
                        <option value="percent">Percentage (%)</option>
                      </select>
                      {agencyForm.commission_model === 'fixed'
                        ? <input type="number" value={agencyForm.commission_fixed_amount} onChange={(e) => setAgencyForm((p) => ({ ...p, commission_fixed_amount: e.target.value }))} placeholder="Amount SAR" className="flex-1 border rounded px-2 py-1 text-sm" />
                        : <input type="number" value={agencyForm.commission_rate} onChange={(e) => setAgencyForm((p) => ({ ...p, commission_rate: e.target.value }))} placeholder="%" className="flex-1 border rounded px-2 py-1 text-sm" />
                      }
                    </div>
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide pt-1">Payment methods</p>
                    <div className="flex gap-3 flex-wrap">
                      {['online', 'cash', 'invoice'].map(m => (
                        <label key={m} className="flex items-center gap-1 text-sm cursor-pointer">
                          <input type="checkbox" checked={(agencyForm.payment_methods || []).includes(m)}
                            onChange={e => setAgencyForm(p => ({
                              ...p,
                              payment_methods: e.target.checked
                                ? [...(p.payment_methods || []).filter(x => x !== m), m]
                                : (p.payment_methods || []).filter(x => x !== m)
                            }))}
                          />
                          {m.charAt(0).toUpperCase() + m.slice(1)}
                        </label>
                      ))}
                    </div>
                    {(agencyForm.payment_methods || []).includes('invoice') && (
                      <>
                        <p className="text-xs text-gray-500 pt-1">Bank details — shown in invoice instructions</p>
                        <input value={agencyForm.bank_name} onChange={(e) => setAgencyForm((p) => ({ ...p, bank_name: e.target.value }))} placeholder="Bank name *" className={`w-full border rounded px-2 py-1 ${!agencyForm.bank_name ? 'border-orange-300' : ''}`} />
                        <input value={agencyForm.bank_account} onChange={(e) => setAgencyForm((p) => ({ ...p, bank_account: e.target.value }))} placeholder="Account number" className="w-full border rounded px-2 py-1" />
                        <input value={agencyForm.iban} onChange={(e) => setAgencyForm((p) => ({ ...p, iban: e.target.value.toUpperCase() }))} placeholder="IBAN (SA...) *" className={`w-full border rounded px-2 py-1 ${!agencyForm.iban ? 'border-orange-300' : ''}`} />
                        <input value={agencyForm.swift_bic} onChange={(e) => setAgencyForm((p) => ({ ...p, swift_bic: e.target.value.toUpperCase() }))} placeholder="SWIFT/BIC" className="w-full border rounded px-2 py-1" />
                        <input value={agencyForm.sama_code} onChange={(e) => setAgencyForm((p) => ({ ...p, sama_code: e.target.value.toUpperCase() }))} placeholder="SAMA bank code" className="w-full border rounded px-2 py-1" />
                      </>
                    )}
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={handleCreateAgencyDraftAndInvite}
                        disabled={draftInviting || provisioning || createOnlyLoading}
                        className="flex-1 bg-indigo-600 text-white rounded px-3 py-2 font-semibold disabled:opacity-50"
                      >
                        {draftInviting ? 'Creating draft...' : 'Send setup flow'}
                      </button>
                      <button
                        onClick={handleProvisionAgency}
                        disabled={provisioning || draftInviting || createOnlyLoading}
                        className="flex-1 bg-green-600 text-white rounded px-3 py-2 font-semibold disabled:opacity-50"
                      >
                        {provisioning ? 'Creating & deploying...' : '🚀 Create & Deploy Site'}
                      </button>
                      <button
                        onClick={handleCreateAgency}
                        disabled={createOnlyLoading || draftInviting || provisioning}
                        className="flex-1 bg-blue-600 text-white rounded px-3 py-2 text-sm disabled:opacity-50"
                      >
                        {createOnlyLoading ? 'Creating agency...' : 'Create only (no site)'}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Send setup flow creates a draft agency and emails the manager instructions.
                      Create & Deploy Site publishes the public agency site immediately.
                      Create only saves the agency record so setup or publish can be done later.
                    </p>
                    {provisionResult && (
                      <div className="bg-green-50 border border-green-200 rounded p-3 text-sm">
                        <p className="font-semibold text-green-800">✅ Agency created & site deployed!</p>
                        <p>Site: <a href={provisionResult.site_url} target="_blank" rel="noreferrer" className="text-blue-600 underline">{provisionResult.site_url}</a></p>
                        <p className="text-xs text-gray-500 mt-1">api_key: {provisionResult.agency?.api_key}</p>
                        {provisionResult.deploy_error && <p className="text-orange-600 text-xs mt-1">Deploy warning: {provisionResult.deploy_error}</p>}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="border border-gray-200 rounded-lg p-3">
                <h3 className="font-semibold mb-2">Summary</h3>
                <div className="text-sm space-y-1">
                  <p>Total: <b>{reportSummary?.total_orders ?? 0}</b></p>
                  <p>Pending: <b>{reportSummary?.pending ?? 0}</b></p>
                  <p>Confirmed: <b>{reportSummary?.confirmed ?? 0}</b></p>
                  <p>Issued: <b>{reportSummary?.issued ?? 0}</b></p>
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
                    <div className="space-y-4">
                      {/* Basic info */}
                      <div>
                        <p className="text-xs text-gray-500 font-semibold mb-1">Basic info</p>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                          <input value={agencyEditForm.name} onChange={(e) => setAgencyEditForm((p) => ({ ...p, name: e.target.value }))} className="border rounded px-2 py-1" placeholder="Name (EN)" />
                          <input value={agencyEditForm.name_ar} onChange={(e) => setAgencyEditForm((p) => ({ ...p, name_ar: e.target.value }))} className="border rounded px-2 py-1" placeholder="Name (AR)" dir="rtl" />
                          <input value={agencyEditForm.domain} onChange={(e) => setAgencyEditForm((p) => ({ ...p, domain: e.target.value }))} className="border rounded px-2 py-1" placeholder="Domain" />
                          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={agencyEditForm.is_active} onChange={(e) => setAgencyEditForm((p) => ({ ...p, is_active: e.target.checked }))} /> Active</label>
                        </div>
                      </div>

                      {/* Contact */}
                      <div>
                        <p className="text-xs text-gray-500 font-semibold mb-1">Contact</p>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                          <input value={agencyEditForm.contact_email} onChange={(e) => setAgencyEditForm((p) => ({ ...p, contact_email: e.target.value }))} className="border rounded px-2 py-1" placeholder="Email" />
                          <input value={agencyEditForm.contact_phone} onChange={(e) => setAgencyEditForm((p) => ({ ...p, contact_phone: e.target.value }))} className="border rounded px-2 py-1" placeholder="Phone" />
                          <input value={agencyEditForm.contact_phone2} onChange={(e) => setAgencyEditForm((p) => ({ ...p, contact_phone2: e.target.value }))} className="border rounded px-2 py-1" placeholder="Phone 2" />
                          <input value={agencyEditForm.whatsapp_phone} onChange={(e) => setAgencyEditForm((p) => ({ ...p, whatsapp_phone: e.target.value }))} className="border rounded px-2 py-1" placeholder="WhatsApp" />
                          <input value={agencyEditForm.contact_person_name} onChange={(e) => setAgencyEditForm((p) => ({ ...p, contact_person_name: e.target.value }))} className="border rounded px-2 py-1" placeholder="Contact person" />
                          <input value={agencyEditForm.supervisor_name} onChange={(e) => setAgencyEditForm((p) => ({ ...p, supervisor_name: e.target.value }))} className="border rounded px-2 py-1" placeholder="Supervisor name" />
                          <input value={agencyEditForm.supervisor_email} onChange={(e) => setAgencyEditForm((p) => ({ ...p, supervisor_email: e.target.value }))} className="border rounded px-2 py-1" placeholder="Supervisor email" />
                        </div>
                      </div>

                      {/* Branding */}
                      <div>
                        <p className="text-xs text-gray-500 font-semibold mb-1">Branding</p>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                          <div className="flex items-center gap-2 border rounded px-2 py-1">
                            <input type="color" value={agencyEditForm.brand_color} onChange={(e) => setAgencyEditForm((p) => ({ ...p, brand_color: e.target.value }))} className="w-7 h-7 rounded border-0 cursor-pointer" />
                            <span className="text-sm text-gray-600">Brand color</span>
                            <span className="text-xs text-gray-400 ml-auto">{agencyEditForm.brand_color}</span>
                          </div>
                          <div className="flex items-center gap-2 border rounded px-2 py-1">
                            <input type="color" value={agencyEditForm.accent_color} onChange={(e) => setAgencyEditForm((p) => ({ ...p, accent_color: e.target.value }))} className="w-7 h-7 rounded border-0 cursor-pointer" />
                            <span className="text-sm text-gray-600">Accent color</span>
                            <span className="text-xs text-gray-400 ml-auto">{agencyEditForm.accent_color}</span>
                          </div>
                          <div className="md:col-span-4">
                            <div className="flex gap-3 items-center flex-wrap">
                              <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 border rounded px-3 py-1 text-sm transition-colors">
                                {editLogoUploading ? 'Uploading...' : '📁 Upload logo (PNG/SVG)'}
                                <input type="file" accept="image/*" className="hidden" disabled={editLogoUploading}
                                  onChange={(e) => e.target.files?.[0] && handleLogoUploadForEdit(e.target.files[0])} />
                              </label>
                              {agencyEditForm.logo_url && (
                                <div className="flex items-center gap-2">
                                  <img src={agencyEditForm.logo_url} alt="logo" className="h-8 w-auto object-contain border rounded bg-white p-1" />
                                  <button onClick={() => setAgencyEditForm(p => ({ ...p, logo_url: '' }))} className="text-red-400 text-xs">✕</button>
                                </div>
                              )}
                              <input value={agencyEditForm.logo_url} onChange={(e) => setAgencyEditForm(p => ({ ...p, logo_url: e.target.value }))} placeholder="Or paste logo URL" className="flex-1 min-w-0 border rounded px-2 py-1 text-sm" />
                            </div>
                            <p className="text-xs text-gray-400 mt-1">Recommended: PNG/SVG, transparent background, 2:1–4:1 ratio (e.g. 400×100px), min 200px height.</p>
                          </div>
                        </div>
                      </div>

                      {/* About / Description */}
                      <div>
                        <p className="text-xs text-gray-500 font-semibold mb-1">About</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <textarea value={agencyEditForm.about_en} onChange={(e) => setAgencyEditForm((p) => ({ ...p, about_en: e.target.value }))} className="border rounded px-2 py-1 min-h-20" placeholder="About (EN)" />
                          <textarea value={agencyEditForm.about_ar} onChange={(e) => setAgencyEditForm((p) => ({ ...p, about_ar: e.target.value }))} className="border rounded px-2 py-1 min-h-20" placeholder="About (AR)" dir="rtl" />
                          <input value={agencyEditForm.working_hours} onChange={(e) => setAgencyEditForm((p) => ({ ...p, working_hours: e.target.value }))} className="border rounded px-2 py-1" placeholder="Working hours (EN)" />
                          <input value={agencyEditForm.working_hours_ar} onChange={(e) => setAgencyEditForm((p) => ({ ...p, working_hours_ar: e.target.value }))} className="border rounded px-2 py-1" placeholder="Working hours (AR)" dir="rtl" />
                        </div>
                      </div>

                      {/* Social & Location */}
                      <div>
                        <p className="text-xs text-gray-500 font-semibold mb-1">Social &amp; Location</p>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                          <input value={agencyEditForm.instagram} onChange={(e) => setAgencyEditForm((p) => ({ ...p, instagram: e.target.value }))} className="border rounded px-2 py-1" placeholder="Instagram (handle or URL)" />
                          <input value={agencyEditForm.twitter} onChange={(e) => setAgencyEditForm((p) => ({ ...p, twitter: e.target.value }))} className="border rounded px-2 py-1" placeholder="X/Twitter (handle or URL)" />
                          <input value={agencyEditForm.snapchat} onChange={(e) => setAgencyEditForm((p) => ({ ...p, snapchat: e.target.value }))} className="border rounded px-2 py-1" placeholder="Snapchat (handle or URL)" />
                          <input value={agencyEditForm.facebook} onChange={(e) => setAgencyEditForm((p) => ({ ...p, facebook: e.target.value }))} className="border rounded px-2 py-1" placeholder="Facebook (handle or URL)" />
                          <input value={agencyEditForm.google_maps_url} onChange={(e) => setAgencyEditForm((p) => ({ ...p, google_maps_url: e.target.value }))} className="border rounded px-2 py-1 md:col-span-3" placeholder="Google Maps embed URL (must contain google.com/maps)" />
                          <span className="text-xs text-gray-400 self-center">Use Share → Embed map URL from Google Maps</span>
                        </div>
                      </div>

                      {/* Regulatory */}
                      <div>
                        <p className="text-xs text-gray-500 font-semibold mb-1">Regulatory</p>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                          <input value={agencyEditForm.license_number} onChange={(e) => setAgencyEditForm((p) => ({ ...p, license_number: e.target.value }))} className="border rounded px-2 py-1" placeholder="License number" />
                          <input value={agencyEditForm.iata_number} onChange={(e) => setAgencyEditForm((p) => ({ ...p, iata_number: e.target.value }))} className="border rounded px-2 py-1" placeholder="IATA number" />
                          <input value={agencyEditForm.founded_year} onChange={(e) => setAgencyEditForm((p) => ({ ...p, founded_year: e.target.value }))} className="border rounded px-2 py-1" placeholder="Founded year" type="number" min="1900" max="2099" />
                        </div>
                      </div>

                      {/* Services */}
                      <div>
                        <p className="text-xs text-gray-500 font-semibold mb-1">Services</p>
                        <div className="flex flex-wrap gap-3">
                          {['flights_domestic','flights_intl','hotels','visa','insurance','umrah','tours','corporate'].map(s => (
                            <label key={s} className="flex items-center gap-1 text-sm cursor-pointer">
                              <input type="checkbox" checked={(agencyEditForm.services || []).includes(s)}
                                onChange={e => setAgencyEditForm(p => ({
                                  ...p,
                                  services: e.target.checked
                                    ? [...(p.services || []).filter(x => x !== s), s]
                                    : (p.services || []).filter(x => x !== s)
                                }))}
                              />
                              {s.replace(/_/g, ' ')}
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Header / Footer colors */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 font-semibold mb-1">Header background color</p>
                          <div className="flex items-center gap-2">
                            <input type="color" value={agencyEditForm.header_bg || '#ffffff'}
                              onChange={(e) => setAgencyEditForm((p) => ({ ...p, header_bg: e.target.value }))}
                              className="h-8 w-10 rounded border cursor-pointer" />
                            <input value={agencyEditForm.header_bg || ''}
                              onChange={(e) => setAgencyEditForm((p) => ({ ...p, header_bg: e.target.value }))}
                              className="border rounded px-2 py-1 text-sm flex-1" placeholder="#ffffff (default white)" />
                            {agencyEditForm.header_bg && (
                              <button onClick={() => setAgencyEditForm((p) => ({ ...p, header_bg: '' }))}
                                className="text-xs text-gray-400 hover:text-gray-600">✕</button>
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-semibold mb-1">Footer background color</p>
                          <div className="flex items-center gap-2">
                            <input type="color" value={agencyEditForm.footer_bg || agencyEditForm.brand_color || '#1a3c8e'}
                              onChange={(e) => setAgencyEditForm((p) => ({ ...p, footer_bg: e.target.value }))}
                              className="h-8 w-10 rounded border cursor-pointer" />
                            <input value={agencyEditForm.footer_bg || ''}
                              onChange={(e) => setAgencyEditForm((p) => ({ ...p, footer_bg: e.target.value }))}
                              className="border rounded px-2 py-1 text-sm flex-1" placeholder="default = brand color" />
                            {agencyEditForm.footer_bg && (
                              <button onClick={() => setAgencyEditForm((p) => ({ ...p, footer_bg: '' }))}
                                className="text-xs text-gray-400 hover:text-gray-600">✕</button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Hero tagline */}
                      <div>
                        <p className="text-xs text-gray-500 font-semibold mb-1">Hero — headline &amp; tagline</p>
                        <div className="space-y-2">
                          <input
                            value={agencyEditForm.hero_tagline}
                            onChange={(e) => setAgencyEditForm((p) => ({ ...p, hero_tagline: e.target.value }))}
                            className="border rounded px-2 py-1 w-full text-sm"
                            placeholder="Hero headline (leave blank for default)"
                          />
                          <textarea
                            value={agencyEditForm.hero_description}
                            onChange={(e) => setAgencyEditForm((p) => ({ ...p, hero_description: e.target.value }))}
                            className="border rounded px-2 py-1 w-full text-sm min-h-14"
                            placeholder="Hero sub-text (leave blank for default)"
                          />
                          <div>
                            <p className="text-xs text-gray-400 mb-1">Hero background image URL (leave blank to use brand color gradient). Recommended: 1920×600px min, JPG/WebP, under 2 MB.</p>
                            <div className="flex gap-2">
                              <input value={agencyEditForm.hero_image_url || ''}
                                onChange={(e) => setAgencyEditForm((p) => ({ ...p, hero_image_url: e.target.value }))}
                                className="border rounded px-2 py-1 text-sm flex-1"
                                placeholder="https://... or upload below" />
                              <label className="cursor-pointer">
                                <span className="px-3 py-1 bg-gray-100 border rounded text-sm hover:bg-gray-200 inline-block">
                                  {editMediaUploading ? '...' : 'Upload'}
                                </span>
                                <input type="file" accept="image/*" className="hidden"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    setEditMediaUploading(true);
                                    const { url, error } = await uploadAgencyMedia(file, openAgencyId);
                                    setEditMediaUploading(false);
                                    if (url) setAgencyEditForm((p) => ({ ...p, hero_image_url: url }));
                                    else alert(error?.message || 'Upload failed');
                                  }} />
                              </label>
                              {agencyEditForm.hero_image_url && (
                                <button onClick={() => setAgencyEditForm((p) => ({ ...p, hero_image_url: '' }))}
                                  className="text-xs text-gray-400 hover:text-gray-600 px-1">✕</button>
                              )}
                            </div>
                            {agencyEditForm.hero_image_url && (
                              <img src={agencyEditForm.hero_image_url} alt="hero preview"
                                className="mt-2 h-20 w-full object-cover rounded border" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Destinations */}
                      <div>
                        <p className="text-xs text-gray-500 font-semibold mb-1">
                          Destinations — shown on public site ({(agencyEditForm.destinations || []).length > 0 ? 'custom' : 'using defaults'})
                        </p>
                        <div className="space-y-2">
                          {(agencyEditForm.destinations || []).map((dest, di) => (
                            <div key={di} className="border rounded p-2 bg-gray-50 grid grid-cols-2 md:grid-cols-5 gap-2 items-start">
                              <input
                                value={dest.city || ''}
                                onChange={(e) => setAgencyEditForm((p) => {
                                  const next = [...(p.destinations || [])];
                                  next[di] = { ...next[di], city: e.target.value };
                                  return { ...p, destinations: next };
                                })}
                                className="border rounded px-2 py-1 text-sm"
                                placeholder="City"
                              />
                              <input
                                value={dest.country || ''}
                                onChange={(e) => setAgencyEditForm((p) => {
                                  const next = [...(p.destinations || [])];
                                  next[di] = { ...next[di], country: e.target.value };
                                  return { ...p, destinations: next };
                                })}
                                className="border rounded px-2 py-1 text-sm"
                                placeholder="Country"
                              />
                              <input
                                value={dest.price || ''}
                                onChange={(e) => setAgencyEditForm((p) => {
                                  const next = [...(p.destinations || [])];
                                  next[di] = { ...next[di], price: e.target.value };
                                  return { ...p, destinations: next };
                                })}
                                className="border rounded px-2 py-1 text-sm"
                                placeholder="Price (SAR)"
                              />
                              <div className="flex gap-1 items-center">
                                <input
                                  value={dest.image_url || ''}
                                  onChange={(e) => setAgencyEditForm((p) => {
                                    const next = [...(p.destinations || [])];
                                    next[di] = { ...next[di], image_url: e.target.value || null };
                                    return { ...p, destinations: next };
                                  })}
                                  className="border rounded px-2 py-1 text-xs flex-1 min-w-0"
                                  placeholder="Photo URL"
                                />
                                <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 border rounded px-2 py-1 text-xs whitespace-nowrap">
                                  {editMediaUploading ? '…' : '📁'}
                                  <input type="file" accept="image/*" className="hidden" disabled={editMediaUploading}
                                    onChange={async (e) => {
                                      const f = e.target.files?.[0];
                                      if (!f) return;
                                      setEditMediaUploading(true);
                                      const { url, error: uploadErr } = await uploadAgencyMedia(f, a.id);
                                      setEditMediaUploading(false);
                                      if (uploadErr) { setNotice({ type: 'error', text: `Image upload failed: ${uploadErr.message}` }); return; }
                                      setAgencyEditForm((p) => {
                                        const next = [...(p.destinations || [])];
                                        next[di] = { ...next[di], image_url: url };
                                        return { ...p, destinations: next };
                                      });
                                    }}
                                  />
                                </label>
                              </div>
                              <button
                                onClick={() => setAgencyEditForm((p) => ({
                                  ...p,
                                  destinations: (p.destinations || []).filter((_, i) => i !== di)
                                }))}
                                className="text-red-400 text-xs self-center"
                              >
                                ✕ Remove
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={() => setAgencyEditForm((p) => ({
                              ...p,
                              destinations: [...(p.destinations || []), { city: '', country: '', price: '', image_url: null }]
                            }))}
                            className="text-blue-600 text-xs border border-blue-200 rounded px-3 py-1 hover:bg-blue-50"
                          >
                            + Add destination
                          </button>
                          {(agencyEditForm.destinations || []).length > 0 && (
                            <button
                              onClick={() => setAgencyEditForm((p) => ({ ...p, destinations: [] }))}
                              className="text-gray-400 text-xs border rounded px-3 py-1 hover:bg-gray-50 ml-2"
                            >
                              ✕ Clear (use defaults)
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Reviews */}
                      <div>
                        <p className="text-xs text-gray-500 font-semibold mb-1">
                          Reviews ({(agencyEditForm.reviews || []).length > 0 ? 'custom' : 'using defaults'})
                        </p>
                        <div className="space-y-2">
                          {(agencyEditForm.reviews || []).map((rev, ri) => (
                            <div key={ri} className="border rounded p-2 bg-gray-50 space-y-1">
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                <input
                                  value={rev.name || ''}
                                  onChange={(e) => setAgencyEditForm((p) => {
                                    const next = [...(p.reviews || [])];
                                    next[ri] = { ...next[ri], name: e.target.value };
                                    return { ...p, reviews: next };
                                  })}
                                  className="border rounded px-2 py-1 text-sm"
                                  placeholder="Reviewer name"
                                />
                                <input
                                  value={rev.location || ''}
                                  onChange={(e) => setAgencyEditForm((p) => {
                                    const next = [...(p.reviews || [])];
                                    next[ri] = { ...next[ri], location: e.target.value };
                                    return { ...p, reviews: next };
                                  })}
                                  className="border rounded px-2 py-1 text-sm"
                                  placeholder="Location (e.g. Riyadh, KSA)"
                                />
                                <select
                                  value={rev.rating || 5}
                                  onChange={(e) => setAgencyEditForm((p) => {
                                    const next = [...(p.reviews || [])];
                                    next[ri] = { ...next[ri], rating: Number(e.target.value) };
                                    return { ...p, reviews: next };
                                  })}
                                  className="border rounded px-2 py-1 text-sm"
                                >
                                  {[5,4,3,2,1].map(r => <option key={r} value={r}>{r} stars</option>)}
                                </select>
                              </div>
                              <textarea
                                value={rev.text || ''}
                                onChange={(e) => setAgencyEditForm((p) => {
                                  const next = [...(p.reviews || [])];
                                  next[ri] = { ...next[ri], text: e.target.value };
                                  return { ...p, reviews: next };
                                })}
                                className="border rounded px-2 py-1 text-sm w-full min-h-14"
                                placeholder="Review text"
                              />
                              <button
                                onClick={() => setAgencyEditForm((p) => ({
                                  ...p,
                                  reviews: (p.reviews || []).filter((_, i) => i !== ri)
                                }))}
                                className="text-red-400 text-xs"
                              >
                                ✕ Remove
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={() => setAgencyEditForm((p) => ({
                              ...p,
                              reviews: [...(p.reviews || []), { name: '', location: '', rating: 5, text: '' }]
                            }))}
                            className="text-blue-600 text-xs border border-blue-200 rounded px-3 py-1 hover:bg-blue-50"
                          >
                            + Add review
                          </button>
                          {(agencyEditForm.reviews || []).length > 0 && (
                            <button
                              onClick={() => setAgencyEditForm((p) => ({ ...p, reviews: [] }))}
                              className="text-gray-400 text-xs border rounded px-3 py-1 hover:bg-gray-50 ml-2"
                            >
                              ✕ Clear (use defaults)
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Featured Airlines */}
                      <div>
                        <p className="text-xs text-gray-500 font-semibold mb-1">
                          Featured airlines ({(agencyEditForm.featured_airlines || []).length > 0 ? 'custom' : 'using defaults'})
                        </p>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {(agencyEditForm.featured_airlines || []).map((airline, ai) => (
                            <div key={ai} className="flex items-center gap-1 border rounded px-2 py-1 bg-gray-50">
                              <input
                                value={airline}
                                onChange={(e) => setAgencyEditForm((p) => {
                                  const next = [...(p.featured_airlines || [])];
                                  next[ai] = e.target.value;
                                  return { ...p, featured_airlines: next };
                                })}
                                className="text-sm bg-transparent border-0 outline-none w-28"
                                placeholder="Airline name"
                              />
                              <button
                                onClick={() => setAgencyEditForm((p) => ({
                                  ...p,
                                  featured_airlines: (p.featured_airlines || []).filter((_, i) => i !== ai)
                                }))}
                                className="text-red-400 text-xs"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setAgencyEditForm((p) => ({
                              ...p,
                              featured_airlines: [...(p.featured_airlines || []), '']
                            }))}
                            className="text-blue-600 text-xs border border-blue-200 rounded px-3 py-1 hover:bg-blue-50"
                          >
                            + Add airline
                          </button>
                          {(agencyEditForm.featured_airlines || []).length > 0 && (
                            <button
                              onClick={() => setAgencyEditForm((p) => ({ ...p, featured_airlines: [] }))}
                              className="text-gray-400 text-xs border rounded px-3 py-1 hover:bg-gray-50"
                            >
                              ✕ Clear (use defaults)
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Commission */}
                      <div>
                        <p className="text-xs text-gray-500 font-semibold mb-1">Commission model</p>
                        <div className="flex gap-2 items-center flex-wrap">
                          <select
                            value={agencyEditForm.commission_model}
                            onChange={(e) => setAgencyEditForm((p) => ({ ...p, commission_model: e.target.value }))}
                            className="border rounded px-2 py-1 text-sm"
                          >
                            <option value="fixed">Fixed amount (SAR per ticket)</option>
                            <option value="percent">Percentage (% of fare)</option>
                          </select>
                          {agencyEditForm.commission_model === 'fixed' ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="number" min="0" step="1"
                                value={agencyEditForm.commission_fixed_amount}
                                onChange={(e) => setAgencyEditForm((p) => ({ ...p, commission_fixed_amount: e.target.value }))}
                                className="border rounded px-2 py-1 text-sm w-28"
                                placeholder="Amount SAR"
                              />
                              <span className="text-xs text-gray-400">SAR</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <input
                                type="number" min="0" max="100" step="0.5"
                                value={agencyEditForm.commission_rate}
                                onChange={(e) => setAgencyEditForm((p) => ({ ...p, commission_rate: e.target.value }))}
                                className="border rounded px-2 py-1 text-sm w-24"
                                placeholder="%"
                              />
                              <span className="text-xs text-gray-400">%</span>
                            </div>
                          )}
                          <span className="text-xs text-gray-400">
                            {agencyEditForm.commission_model === 'fixed'
                              ? `Added to every ticket price (e.g. SAR ${agencyEditForm.commission_fixed_amount || 0} flat)`
                              : `Added as % of fare (e.g. ${agencyEditForm.commission_rate || 0}% markup)`}
                          </span>
                        </div>
                      </div>

                      {/* Payment methods */}
                      <div>
                        <p className="text-xs text-gray-500 font-semibold mb-1">Payment methods</p>
                        <div className="flex gap-4">
                          {['online', 'cash', 'invoice'].map(m => (
                            <label key={m} className="flex items-center gap-1 text-sm cursor-pointer">
                              <input type="checkbox" checked={(agencyEditForm.payment_methods || []).includes(m)}
                                onChange={e => setAgencyEditForm(p => ({
                                  ...p,
                                  payment_methods: e.target.checked
                                    ? [...(p.payment_methods || []).filter(x => x !== m), m]
                                    : (p.payment_methods || []).filter(x => x !== m)
                                }))}
                              />
                              {m.charAt(0).toUpperCase() + m.slice(1)}
                            </label>
                          ))}
                        </div>
                      </div>
                      {(agencyEditForm.payment_methods || []).includes('invoice') && (
                        <div>
                          <p className="text-xs text-gray-500 font-semibold mb-1">Bank details</p>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                            <input value={agencyEditForm.bank_name} onChange={(e) => setAgencyEditForm((p) => ({ ...p, bank_name: e.target.value }))} className="border rounded px-2 py-1" placeholder="Bank name" />
                            <input value={agencyEditForm.bank_account} onChange={(e) => setAgencyEditForm((p) => ({ ...p, bank_account: e.target.value }))} className="border rounded px-2 py-1" placeholder="Account number" />
                            <input value={agencyEditForm.iban} onChange={(e) => setAgencyEditForm((p) => ({ ...p, iban: e.target.value.toUpperCase() }))} className="border rounded px-2 py-1" placeholder="IBAN (SA...)" />
                            <input value={agencyEditForm.swift_bic} onChange={(e) => setAgencyEditForm((p) => ({ ...p, swift_bic: e.target.value.toUpperCase() }))} className="border rounded px-2 py-1" placeholder="SWIFT/BIC" />
                            <input value={agencyEditForm.sama_code} onChange={(e) => setAgencyEditForm((p) => ({ ...p, sama_code: e.target.value.toUpperCase() }))} className="border rounded px-2 py-1" placeholder="SAMA bank code" />
                          </div>
                        </div>
                      )}

                      {/* Widget domains */}
                      <div>
                        <p className="text-xs text-gray-500 font-semibold mb-1">Allowed widget domains</p>
                        <textarea
                          value={agencyEditForm.widget_allowed_domains}
                          onChange={(e) => setAgencyEditForm((p) => ({ ...p, widget_allowed_domains: e.target.value }))}
                          className="border rounded px-2 py-1 min-h-16 w-full"
                          placeholder="One domain per line"
                        />
                      </div>

                      <div className="flex gap-2 pt-1">
                        <button onClick={() => handleSaveAgency(a.id)} className="bg-green-600 text-white rounded px-4 py-1.5 text-sm font-medium">Save changes</button>
                        <button onClick={() => setAgencyEditId(null)} className="bg-gray-100 rounded px-4 py-1.5 text-sm">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <div className="text-sm">
                        <div className="font-semibold">{a.name} ({a.domain || 'no-domain'})</div>
                        <div>{a.contact_email} • {a.contact_phone || 'N/A'}</div>
                        <div>Contact person: {a?.settings?.contact_person?.full_name || 'N/A'}</div>
                        <div>Bank: {a?.settings?.bank_details?.bank_name || 'N/A'} • IBAN: {a?.settings?.bank_details?.iban || 'N/A'}</div>
                        <div>SWIFT/BIC: {a?.settings?.bank_details?.swift_bic || 'N/A'} • SAMA: {a?.settings?.bank_details?.sama_code || 'N/A'}</div>
                        <div>Payment methods: {Array.isArray(a?.settings?.payment_methods) && a.settings.payment_methods.length ? a.settings.payment_methods.join(', ') : 'online'}</div>
                        <div>Widget domains: {Array.isArray(a?.settings?.widget_allowed_domains) && a.settings.widget_allowed_domains.length ? a.settings.widget_allowed_domains.join(', ') : 'not set'}</div>
                        <div>Status: {a.is_active ? 'Active' : 'Inactive'}</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getOnboardingStatusMeta(a?.onboarding_state?.status).tone}`}>
                            {getOnboardingStatusMeta(a?.onboarding_state?.status).label}
                          </span>
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getDeployStatusMeta(a?.deploy_state?.status).tone}`}>
                            {getDeployStatusMeta(a?.deploy_state?.status).label}
                          </span>
                        </div>
                        {a?.deploy_state?.last_error && (
                          <div className="mt-2 rounded border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700">
                            {a.deploy_state.last_error}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => beginEditAgency(a)} className="bg-gray-100 rounded px-3 py-1 text-sm">Open/Edit</button>
                        <button
                          onClick={() => handleSendSetupEmail(a.id)}
                          disabled={setupEmailSendingId === a.id}
                          className={`rounded px-3 py-1 text-sm ${setupEmailSendingId === a.id ? 'bg-gray-200 text-gray-500' : 'bg-indigo-100 text-indigo-700'}`}
                        >
                          {setupEmailSendingId === a.id
                            ? 'Sending...'
                            : a?.onboarding_state?.invite_sent_at
                              ? 'Send setup again'
                              : 'Send setup'}
                        </button>
                        <button
                          onClick={() => handlePublishAgencyRow(a)}
                          disabled={rowPublishingId === a.id || !a?.onboarding_state?.publish_ready || a?.deploy_state?.status === 'deployed'}
                          className={`rounded px-3 py-1 text-sm ${rowPublishingId === a.id || !a?.onboarding_state?.publish_ready || a?.deploy_state?.status === 'deployed' ? 'bg-gray-200 text-gray-500' : 'bg-green-100 text-green-700'}`}
                        >
                          {rowPublishingId === a.id ? 'Publishing...' : 'Publish first time'}
                        </button>
                        <button
                          onClick={() => handleRedeployAgencyRow(a)}
                          disabled={rowRedeployingId === a.id || a?.deploy_state?.status === 'not_deployed'}
                          className={`rounded px-3 py-1 text-sm ${rowRedeployingId === a.id || a?.deploy_state?.status === 'not_deployed' ? 'bg-gray-200 text-gray-500' : 'bg-amber-100 text-amber-700'}`}
                        >
                          {rowRedeployingId === a.id ? 'Republishing...' : 'Republish'}
                        </button>
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
                <option value="issued">Issued</option>
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

        {/* Sales Report */}
        {['admin', 'super_admin'].includes(userProfile?.role) && isSuperAdminView && activeAdminSection === 'sales_report' && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-6 border border-green-100">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Sales Report</h2>
            <p className="text-sm text-gray-500 mb-4">Export all sales across all agencies for a given period.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 mb-4">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Date from</label>
                <input
                  type="date"
                  value={salesReportFilters.date_from}
                  onChange={(e) => setSalesReportFilters((p) => ({ ...p, date_from: e.target.value }))}
                  className="border rounded px-2 py-1 w-full"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Date to</label>
                <input
                  type="date"
                  value={salesReportFilters.date_to}
                  onChange={(e) => setSalesReportFilters((p) => ({ ...p, date_to: e.target.value }))}
                  className="border rounded px-2 py-1 w-full"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Agency</label>
                <select
                  value={salesReportFilters.agency_id}
                  onChange={(e) => setSalesReportFilters((p) => ({ ...p, agency_id: e.target.value }))}
                  className="border rounded px-2 py-1 w-full"
                >
                  <option value="">All agencies</option>
                  {agencies.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Status</label>
                <select
                  value={salesReportFilters.status}
                  onChange={(e) => setSalesReportFilters((p) => ({ ...p, status: e.target.value }))}
                  className="border rounded px-2 py-1 w-full"
                >
                  <option value="">All statuses</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="issued">Issued</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {['csv', 'xlsx', 'json', 'txt'].map((fmt) => (
                <button
                  key={fmt}
                  disabled={salesReportLoading}
                  onClick={async () => {
                    setSalesReportLoading(true);
                    try {
                      const params = new URLSearchParams();
                      if (salesReportFilters.date_from) params.set('date_from', salesReportFilters.date_from);
                      if (salesReportFilters.date_to) params.set('date_to', salesReportFilters.date_to);
                      if (salesReportFilters.agency_id) params.set('agency_id', salesReportFilters.agency_id);
                      if (salesReportFilters.status) params.set('status', salesReportFilters.status);
                      params.set('format', fmt);
                      const { data: { session } } = await supabase.auth.getSession();
                      const token = session?.access_token;
                      const resp = await fetch(`/api/backend/admin/reports/sales?${params.toString()}`, {
                        headers: token ? { Authorization: `Bearer ${token}` } : {}
                      });
                      if (!resp.ok) {
                        const err = await resp.json().catch(() => ({}));
                        throw new Error(err?.error?.message || `HTTP ${resp.status}`);
                      }
                      const blob = await resp.blob();
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      const from = salesReportFilters.date_from || 'all';
                      const to = salesReportFilters.date_to || 'all';
                      a.download = `sales_report_${from}_${to}.${fmt}`;
                      a.click();
                      URL.revokeObjectURL(url);
                    } catch (err) {
                      setNotice({ type: 'error', text: `Export failed: ${err.message}` });
                    } finally {
                      setSalesReportLoading(false);
                    }
                  }}
                  className={`px-4 py-2 rounded font-medium text-sm uppercase tracking-wide ${salesReportLoading ? 'bg-gray-200 text-gray-400' : 'bg-green-600 text-white hover:bg-green-700'}`}
                >
                  {salesReportLoading ? '...' : fmt}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-3">Exports up to 50,000 rows. All fields included: order details, agency, passenger contacts, pricing, payment, timestamps.</p>
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
                  <option value="issued">Issued</option>
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
                          <p className="text-xs font-mono font-semibold text-blue-700 mt-1">
                            {order.order_number}
                          </p>
                          {order.drct_order_id && (
                            <p className="text-xs font-mono text-purple-600 mt-0.5" title="PNR / DRCT Order ID">
                              PNR: {order.drct_order_id}
                            </p>
                          )}
                          {order.payment_method && order.payment_method !== 'online' && (
                            <span className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                              order.payment_method === 'cash'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}>
                              {order.payment_method === 'cash' ? 'Cash' : 'Invoice'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 lg:w-64">
                      {/* Mark as Paid — only for cash/invoice orders not yet paid */}
                      {(order.payment_method === 'cash' || order.payment_method === 'invoice') &&
                       order.payment_status !== 'paid' &&
                       normalizeStatus(order.status) !== 'cancelled' && (
                        <button
                          onClick={() => handleMarkOrderPaid(order)}
                          disabled={markingPaidOrderId === order.id}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 rounded-lg transition-all text-sm disabled:opacity-60"
                        >
                          {markingPaidOrderId === order.id ? 'Processing...' : '✓ Mark as Paid'}
                        </button>
                      )}
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
                      {normalizeStatus(order.status) === 'issued' && (
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
                        <option value="issued">Issued</option>
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
                  <p className="text-xs text-gray-500 mb-2">References</p>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Order #</span>
                      <span className="text-xs font-mono font-semibold text-blue-700 select-all">{selectedOrder.order_number}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">PNR / DRCT</span>
                      <span className="text-xs font-mono font-semibold text-purple-600 select-all">{selectedOrder.drct_order_id || '—'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Passengers</span>
                      <span className="text-xs text-gray-700">{selectedOrder.passenger_count || 1}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">UUID</span>
                      <span className="text-xs font-mono text-gray-400 break-all">{selectedOrder.id}</span>
                    </div>
                  </div>
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
