import { useState, useMemo, useEffect, useRef, Component } from 'react';
import axios from 'axios';
import SearchForm from './components/SearchForm';
import FlightCard from './components/FlightCard';
import LoadingScreen from './components/LoadingScreen';
import AirlineFilter from './components/AirlineFilter';
import AuthModal from './components/AuthModal';
import PassengerForm from './components/PassengerForm';
import PaymentScreen from './components/PaymentScreen';
import MyBookings from './pages/MyBookings';
import AdminDashboard from './pages/AdminDashboard';
import { getAirportByCode } from './data/airports.js';
import { Plane, AlertCircle, TestTube2, User, LogOut, CheckCircle, BookOpen, Shield } from 'lucide-react';
import { mockFlightData } from './mock/flightData';
import { formatDRCTError, calculateBaggagePrice } from './lib/drctApi';
import { supabase, getProfile, createPortalOrder, signOut } from './lib/supabase';
import { performLogout } from './lib/logout';
import {
  buildCachedOrderRecord,
  buildInitialPassengerFormData,
  buildOrderPayloadForDRCT,
  buildPassengerSummary,
  buildPendingBookingData,
  normalizePassengerCounts,
} from './lib/passengerBooking';
import { buildPaymentReturnUrl, getTamaraReturnState, shouldRequireAuthForCheckout } from './lib/checkoutFlow';

class AdminErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('[AdminDashboard] render crash:', error, info?.componentStack);
    this.setState({ info });
  }
  render() {
    if (this.state.hasError) {
      const msg = this.state.error?.toString() || 'Unknown error';
      const stack = this.state.info?.componentStack || '';
      return (
        <div style={{ padding: '2rem', fontFamily: 'monospace', background: '#fff3f3', border: '2px solid #dc2626', borderRadius: 8, margin: 16 }}>
          <h2 style={{ color: '#dc2626', marginBottom: 8 }}>Admin panel error — send this to support</h2>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 11, color: '#7f1d1d', background: '#fee2e2', padding: 12, borderRadius: 4, maxHeight: 400, overflow: 'auto' }}>
            {msg}{'\n\n'}{stack}
          </pre>
          <button
            onClick={() => { window.location.reload(); }}
            style={{ marginTop: 12, padding: '6px 16px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
          >
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function formatAirportDisplayName(name, code) {
  const normalizedCode = String(code || '').trim().toUpperCase();
  const normalizedName = String(name || '').trim();
  const airport = normalizedCode ? getAirportByCode(normalizedCode) : null;

  if (airport) {
    if (airport.name === 'All Airports') {
      return `${airport.city} (${airport.code})`;
    }
    return `${airport.city} ${airport.name} (${airport.code})`;
  }

  if (normalizedName && normalizedCode) {
    if (normalizedName.toUpperCase() === normalizedCode || normalizedName.endsWith(`(${normalizedCode})`)) {
      return normalizedName;
    }
    return `${normalizedName} (${normalizedCode})`;
  }

  return normalizedName || normalizedCode || 'N/A';
}

function resolveBookingRoute(offer = {}) {
  const segments = Array.isArray(offer?.segments) ? offer.segments.filter(Boolean) : [];
  const firstSegment = segments[0] || null;
  const lastSegment = segments[segments.length - 1] || null;

  const originCode = firstSegment?.departure_airport?.code || offer?.origin || '';
  const originName = firstSegment?.departure_airport?.name || offer?.origin_name || offer?.origin || '';
  const destinationCode = lastSegment?.arrival_airport?.code || offer?.destination || '';
  const destinationName = lastSegment?.arrival_airport?.name || offer?.destination_name || offer?.destination || '';

  if (!originCode && !originName && !destinationCode && !destinationName) {
    return null;
  }

  return {
    origin: formatAirportDisplayName(originName, originCode),
    destination: formatAirportDisplayName(destinationName, destinationCode),
  };
}

function getPortalPageFromPath(pathname = '') {
  if (pathname === '/admin/agency') return 'adminAgency';
  if (pathname === '/admin' || pathname.startsWith('/admin/')) return 'admin';
  if (pathname === '/bookings') return 'bookings';
  return 'search';
}

function getPortalPathForPage(page) {
  if (page === 'adminAgency') return '/admin/agency';
  if (page === 'admin') return '/admin';
  if (page === 'bookings') return '/bookings';
  return '/';
}

function App() {
  const isDevEnvironment = import.meta.env.DEV;
  const [isLoading, setIsLoading] = useState(false);
  const [flights, setFlights] = useState([]);
  const [error, setError] = useState(null);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [useMockData, setUseMockData] = useState(false);
  const [selectedAirlines, setSelectedAirlines] = useState([]);
  const [quickFilter, setQuickFilter] = useState('all');
  const [resultsSort, setResultsSort] = useState('price');
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Page navigation state
  const [currentPage, setCurrentPage] = useState(() => getPortalPageFromPath(window.location.pathname)); // 'search', 'bookings', 'admin', 'adminAgency'
  const [bookingsRefreshKey, setBookingsRefreshKey] = useState(0);

  // Booking flow state
  const [currentStep, setCurrentStep] = useState('search'); // 'search', 'passenger', 'payment', 'success'
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [passengerData, setPassengerData] = useState(null);
  const [currentOrderId, setCurrentOrderId] = useState(null);
  const [booking, setBooking] = useState(null);
  const [lastSearchData, setLastSearchData] = useState(null);
  const [suggestedDates, setSuggestedDates] = useState([]);
  const profileRefreshInFlightRef = useRef({});
  const bookingRoute = useMemo(() => resolveBookingRoute(booking?.offer), [booking?.offer]);
  const isConnectApiPath = window.location.pathname === '/admin/connect-api';

  const normalizeRole = (role) => {
    const normalized = String(role || 'user').trim().toLowerCase().replace(/-/g, '_');
    if (normalized === 'superadmin') return 'super_admin';
    if (normalized === 'agency_admin' || normalized === 'agency') return 'agent';
    if (normalized === 'administrator') return 'admin';
    if (['admin', 'super_admin', 'agent', 'user'].includes(normalized)) return normalized;
    return 'user';
  };

  const isStaffRole = (role) => ['admin', 'super_admin', 'agent'].includes(normalizeRole(role));
  const isAdminRole = (role) => ['admin', 'super_admin'].includes(normalizeRole(role));

  const buildUserView = (sessionUser, role, roleFetchedAt) => ({
    id: sessionUser.id,
    email: sessionUser.email,
    name: (sessionUser.email || '').split('@')[0],
    provider: sessionUser.app_metadata?.provider || 'email',
    role,
    roleFetchedAt: roleFetchedAt || Date.now()
  });

  const buildLocalDevUser = () => ({
    id: 'local-dev-user',
    email: 'local-dev@aviaframe.test',
    name: 'Local Dev User',
    provider: 'local-dev',
    role: 'user',
    roleFetchedAt: Date.now(),
  });

  const buildLocalDevOffer = () => ({
    ...mockFlightData.offers[0],
    passenger_counts: { adults: 2, children: 1, infants: 1 },
    _searchDepartDate: '2026-08-10',
    _searchReturnDate: '2026-08-17',
    selected_at: new Date().toISOString(),
  });

  const buildLocalDevPassengerParty = () => {
    const seeded = buildInitialPassengerFormData({ adults: 2, children: 1, infants: 1 }, 'local-dev@aviaframe.test');
    const sampleData = [
      { firstName: 'SERGII', lastName: 'DANYLIUK', dateOfBirth: '1990-04-10', passportNumber: 'AA123456', passportExpiry: '2032-08-01', nationality: 'US', gender: 'male' },
      { firstName: 'ANNA', lastName: 'DANYLIUK', dateOfBirth: '1992-06-11', passportNumber: 'BB123456', passportExpiry: '2032-08-01', nationality: 'US', gender: 'female' },
      { firstName: 'MARK', lastName: 'DANYLIUK', dateOfBirth: '2018-03-05', passportNumber: 'CC123456', passportExpiry: '2032-08-01', nationality: 'US', gender: 'male' },
      { firstName: 'LIA', lastName: 'DANYLIUK', dateOfBirth: '2025-01-12', passportNumber: 'DD123456', passportExpiry: '2032-08-01', nationality: 'US', gender: 'female' },
    ];

    return {
      ...seeded,
      baggage: '20kg',
      passengers: seeded.passengers.map((passenger, index) => ({
        ...passenger,
        ...sampleData[index],
      })),
    };
  };

  // Returns user view immediately from cache; refreshes role in background if stale.
  const getSessionUserView = (sessionUser, cachedUser = null) => {
    const role = normalizeRole(cachedUser?.role || 'user');
    const roleFetchedAt = Number(cachedUser?.roleFetchedAt || 0);
    const now = Date.now();
    const staleMs = 10 * 60 * 1000;
    const needsRefresh = !cachedUser?.role || cachedUser.role === 'user' || (now - roleFetchedAt > staleMs);

    if (needsRefresh && sessionUser?.id && !profileRefreshInFlightRef.current[sessionUser.id]) {
      profileRefreshInFlightRef.current[sessionUser.id] = true;
      getProfile(sessionUser.id)
        .then(({ data: profile }) => {
          if (profile?.role) {
            const freshUser = buildUserView(sessionUser, normalizeRole(profile.role), Date.now());
            localStorage.setItem('user', JSON.stringify(freshUser));
            setUser(freshUser);
          }
        })
        .catch(() => {})
        .finally(() => { profileRefreshInFlightRef.current[sessionUser.id] = false; });
    }

    return buildUserView(sessionUser, role, roleFetchedAt);
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
    } catch {
      // noop
    }
  };

  // Handle Moyasar 3DS callback: ?payment_result=success|failed&order_id=...
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentResult = params.get('payment_result');
    if (!paymentResult) return;
    window.history.replaceState({}, '', window.location.pathname);
    if (paymentResult === 'success') {
      const orderId = params.get('order_id');
      localStorage.removeItem('selectedOffer');
      localStorage.removeItem('passengerData');
      localStorage.removeItem('pendingOffer');
      sessionStorage.removeItem('selectedOffer');
      sessionStorage.removeItem('passengerData');
      sessionStorage.removeItem('pendingOffer');
      setSelectedOffer(null);
      setPassengerData(null);
      setCurrentOrderId(orderId || null);
      // Restore full booking data saved before 3DS redirect
      // Try sessionStorage first (more reliable for 3DS redirect in same tab), then localStorage
      let restoredBooking = null;
      try {
        const fromSession = sessionStorage.getItem('moyasarPendingBooking');
        const fromLocal = localStorage.getItem('moyasarPendingBooking');
        const saved = fromSession || fromLocal;
        if (saved) {
          restoredBooking = JSON.parse(saved);
          sessionStorage.removeItem('moyasarPendingBooking');
          localStorage.removeItem('moyasarPendingBooking');
        }
      } catch { /* ignore */ }
      setBooking(
        restoredBooking
          ? { ...restoredBooking, status: 'paid' }
          : { orderNumber: null, bookingReference: null, orderId, status: 'paid' }
      );
      setCurrentStep('success');
    } else {
      localStorage.removeItem('pendingOffer');
      sessionStorage.removeItem('pendingOffer');
      setError('Payment was not completed. Please try again.');
    }
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPage(getPortalPageFromPath(window.location.pathname));
      window.scrollTo({ top: 0, behavior: 'auto' });
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (!authReady || (currentPage !== 'admin' && currentPage !== 'adminAgency')) return;
    setIsAuthModalOpen(!user);
  }, [authReady, currentPage, user]);

  const navigateToPortalPage = (page, path = getPortalPathForPage(page)) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const tamaraReturn = getTamaraReturnState(typeof window !== 'undefined' ? window.location : null);
    if (!tamaraReturn.isTamaraReturn || !tamaraReturn.orderId) return;

    let cancelled = false;

    const resetUrl = buildPaymentReturnUrl(typeof window !== 'undefined' ? window.location : null);
    const restorePendingBooking = () => {
      try {
        const fromSession = sessionStorage.getItem('tamaraPendingBooking');
        const fromLocal = localStorage.getItem('tamaraPendingBooking');
        const saved = fromSession || fromLocal;
        if (!saved) return null;
        const parsed = JSON.parse(saved);
        sessionStorage.removeItem('tamaraPendingBooking');
        localStorage.removeItem('tamaraPendingBooking');
        return parsed;
      } catch {
        return null;
      }
    };

    const isSuccessState = (data) => {
      const providerStatus = String(data?.payment_provider_status || '').toLowerCase();
      const orderStatus = String(data?.status || '').toLowerCase();
      return providerStatus === 'tamara_captured' || orderStatus === 'issued';
    };

    const isFailureState = (data) => {
      const providerStatus = String(data?.payment_provider_status || '').toLowerCase();
      const orderStatus = String(data?.status || '').toLowerCase();
      return ['tamara_cancelled', 'tamara_failed', 'tamara_expired'].includes(providerStatus)
        || ['cancelled', 'issue_failed'].includes(orderStatus);
    };

    const handleTamaraReturn = async () => {
      if (tamaraReturn.result === 'cancel' || tamaraReturn.result === 'failure') {
        window.history.replaceState({}, '', resetUrl);
        setError('Tamara payment was not completed. Please try again or choose a different payment method.');
        return;
      }

      setIsLoading(true);

      try {
        for (let attempt = 0; attempt < 12; attempt += 1) {
          const response = await fetch(`/api/backend/payments/tamara/status/${tamaraReturn.orderId}`);
          const result = await response.json().catch(() => ({}));

          if (cancelled) return;

          if (response.ok && isSuccessState(result)) {
            const restoredBooking = restorePendingBooking();
            setBooking(
              restoredBooking
                ? { ...restoredBooking, status: 'paid' }
                : {
                    orderNumber: result.order_number || null,
                    bookingReference: result.order_number || tamaraReturn.orderId,
                    orderId: tamaraReturn.orderId,
                    status: 'paid',
                  }
            );
            setCurrentOrderId(tamaraReturn.orderId);
            setCurrentStep('success');
            window.history.replaceState({}, '', resetUrl);
            return;
          }

          if (response.ok && isFailureState(result)) {
            window.history.replaceState({}, '', resetUrl);
            setError('Tamara payment was not completed. Please try again or choose a different payment method.');
            return;
          }

          await new Promise((resolve) => setTimeout(resolve, 2000));
        }

        window.history.replaceState({}, '', resetUrl);
        setError('Tamara approved the payment, but final booking confirmation is still pending. Please check My bookings in a moment.');
      } catch (error) {
        console.error('Tamara return handling failed:', error);
        window.history.replaceState({}, '', resetUrl);
        setError('We could not verify the Tamara payment result yet. Please refresh My bookings in a moment.');
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    handleTamaraReturn();

    return () => {
      cancelled = true;
    };
  }, []);

  // Check for existing user session on mount
  useEffect(() => {
    let mounted = true;
    const readSessionWithRetry = async (attempts = 3) => {
      let lastError = null;
      for (let i = 0; i < attempts; i += 1) {
        try {
          const { data, error } = await supabase.auth.getSession();
          if (!error) return { data, error: null };
          lastError = error;
          const msg = String(error?.message || '').toLowerCase();
          if (!msg.includes('abort')) break;
        } catch (err) {
          lastError = err;
          const msg = String(err?.message || '').toLowerCase();
          if (!msg.includes('abort')) break;
        }
        await new Promise((resolve) => setTimeout(resolve, 150));
      }
      return { data: null, error: lastError };
    };

    const bootstrap = async () => {
      try {
        const storedUserRaw = localStorage.getItem('user');
        let storedUser = null;
        if (storedUserRaw) {
          try {
            storedUser = JSON.parse(storedUserRaw);
          } catch {
            storedUser = null;
          }
        }

        const { data, error } = await readSessionWithRetry(3);
        if (error || !data?.session?.user) {
          if (storedUser?.id) {
            if (mounted) setUser({ ...storedUser, role: normalizeRole(storedUser.role) });
            return;
          }
          localStorage.removeItem('user');
          if (mounted) setUser(null);
          return;
        }

        const sessionUser = data.session.user;
        const cached = storedUser?.id === sessionUser.id ? storedUser : null;
        const nextUser = getSessionUserView(sessionUser, cached);
        localStorage.setItem('user', JSON.stringify(nextUser));
        if (mounted) setUser(nextUser);
      } catch {
        const storedUserRaw = localStorage.getItem('user');
        if (storedUserRaw) {
          try {
            const parsed = JSON.parse(storedUserRaw);
            if (mounted) setUser({ ...parsed, role: normalizeRole(parsed.role) });
            return;
          } catch {
            // noop
          }
        }
        localStorage.removeItem('user');
        if (mounted) setUser(null);
      } finally {
        if (mounted) setAuthReady(true);
      }
    };
    bootstrap();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isDevEnvironment) return;

    const params = new URLSearchParams(window.location.search);
    const devMockFlow = params.get('devMockFlow');
    if (!devMockFlow) return;

    const devUser = buildLocalDevUser();
    const devOffer = buildLocalDevOffer();
    const devPassengerParty = buildLocalDevPassengerParty();
    const devBooking = {
      orderNumber: 'MOCK-LOCAL-1001',
      bookingReference: 'MOCK-PNR-1001',
      status: devMockFlow === 'success' ? 'paid' : 'pending_payment',
      offer: devOffer,
      passengerParty: devPassengerParty,
      totalPrice: Number(devOffer.price?.total || 0) + 500,
      currency: devOffer.price?.currency || 'UAH',
      payment_id: devMockFlow === 'success' ? 'mock-payment-seeded' : undefined,
    };

    localStorage.setItem('user', JSON.stringify(devUser));
    setUser(devUser);
    setUseMockData(true);
    setSelectedOffer(devOffer);
    setPassengerData(devPassengerParty);
    setCurrentOrderId('mock-order-seeded');
    setBooking(devBooking);

    if (devMockFlow === 'passenger') {
      setCurrentStep('passenger');
    } else if (devMockFlow === 'payment') {
      setCurrentStep('payment');
    } else if (devMockFlow === 'success') {
      setCurrentStep('success');
    }
  }, [isDevEnvironment]);

  // Listen for auth state changes (Magic Link callback)
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);

        if (['SIGNED_IN', 'INITIAL_SESSION', 'TOKEN_REFRESHED', 'USER_UPDATED'].includes(event) && session?.user) {
          let cached = null;
          try {
            const raw = localStorage.getItem('user');
            if (raw) {
              const parsed = JSON.parse(raw);
              if (parsed?.id === session.user.id) cached = parsed;
            }
          } catch {
            // noop
          }

          // Synchronous — returns cached role immediately; refreshes in background if stale.
          const nextUser = getSessionUserView(session.user, cached);
          localStorage.setItem('user', JSON.stringify(nextUser));
          setUser(nextUser);
          setIsAuthModalOpen(false);
          resumePendingOfferAfterAuth();
        }

        if (event === 'SIGNED_OUT') {
          localStorage.removeItem('user');
          setUser(null);
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const getStopsCount = (offer) => {
    const directStops = Number(offer?.stops);
    if (Number.isFinite(directStops)) return Math.max(0, directStops);
    const segCount = Array.isArray(offer?.segments) ? offer.segments.length : 0;
    if (segCount > 0) return Math.max(0, segCount - 1);
    return 0;
  };

  const getCheckedBaggageQty = (offer) => {
    const bag = offer?.baggage;
    if (bag?.type === 'checked') return Number(bag.quantity || 0);
    if (Array.isArray(offer?.fare_details?.baggage)) {
      const checked = offer.fare_details.baggage.find((b) => b?.type === 'checked');
      if (checked) return Number(checked.quantity || 0);
    }
    if (Array.isArray(offer?.baggage)) {
      const checked = offer.baggage.find((b) => b?.type === 'checked');
      if (checked) return Number(checked.quantity || 0);
    }
    return 0;
  };

  const toCode = (v) => (typeof v === 'string' ? v.trim().toUpperCase() : null);

  const parseMaybeJson = (v) => {
    if (!v) return null;
    if (typeof v === 'object') return v;
    if (typeof v !== 'string') return null;
    try {
      return JSON.parse(v);
    } catch {
      return null;
    }
  };

  const isValidIsoDateString = (value) => {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return false;
    }

    const parsed = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(parsed.getTime());
  };

  const resolvePassengerCountsForOffer = (offer = {}) => {
    if (offer?.passenger_counts) {
      return normalizePassengerCounts(offer.passenger_counts);
    }

    if (offer?._searchPassengerCounts) {
      return normalizePassengerCounts(offer._searchPassengerCounts);
    }

    if (lastSearchData) {
      return normalizePassengerCounts(lastSearchData);
    }

    return normalizePassengerCounts({ adults: 1, children: 0, infants: 0 });
  };

  const buildOffersFromRawDRCT = (rawPayload, searchData) => {
    const raw = parseMaybeJson(rawPayload) || {};
    const body = parseMaybeJson(raw.body) || raw;
    const flightOptions = Array.isArray(body.flights_options) ? body.flights_options : [];
    const segmentList = Array.isArray(body.segments) ? body.segments : [];
    const fareList = Array.isArray(body.fares) ? body.fares : [];

    if (!flightOptions.length) return [];

    const segmentById = Object.fromEntries(segmentList.filter((s) => s?.id).map((s) => [s.id, s]));
    const fareById = Object.fromEntries(fareList.filter((f) => f?.id).map((f) => [f.id, f]));

    const toSegmentVm = (seg) => {
      const originCode = seg?.departure_airport?.code || null;
      const destinationCode = seg?.arrival_airport?.code || null;
      return {
        id: seg?.id || null,
        origin: seg?.departure_city?.name || seg?.departure_airport?.name || originCode,
        origin_code: originCode,
        destination: seg?.arrival_city?.name || seg?.arrival_airport?.name || destinationCode,
        destination_code: destinationCode,
        departure: [seg?.departure_date, seg?.departure_time].filter(Boolean).join(' ') || null,
        arrival: [seg?.arrival_date, seg?.arrival_time].filter(Boolean).join(' ') || null,
        carrier: {
          airline_code: seg?.carrier?.airline_code || null,
          airline_name: seg?.carrier?.airline_name || null,
        },
        flight_number: seg?.flight_number || null,
      };
    };

    const expanded = [];
    flightOptions.forEach((option, optionIdx) => {
      const optionFlights = Array.isArray(option?.flights) ? option.flights : [];
      const outboundIds = Array.isArray(optionFlights[0]?.segments) ? optionFlights[0].segments : [];
      const returnIds = Array.isArray(optionFlights[1]?.segments) ? optionFlights[1].segments : [];
      const outboundSegs = outboundIds.map((id) => segmentById[id]).filter(Boolean);
      const returnSegs = returnIds.map((id) => segmentById[id]).filter(Boolean);
      const allSegs = [...outboundSegs, ...returnSegs];

      const offers = Array.isArray(option?.offers) ? option.offers : [];
      offers.forEach((offer, offerIdx) => {
        const outFirst = outboundSegs[0] || allSegs[0] || null;
        const outLast = outboundSegs[outboundSegs.length - 1] || allSegs[allSegs.length - 1] || null;
        const inFirst = returnSegs[0] || null;
        const inLast = returnSegs[returnSegs.length - 1] || null;

        const airlineCode = outFirst?.carrier?.airline_code || 'XX';
        const airlineName = outFirst?.carrier?.airline_name || airlineCode;
        const fareRefs = Array.isArray(offer?.fares) ? offer.fares : [];
        const resolvedFare = fareRefs
          .map((f) => (f?.id ? fareById[f.id] || f : f))
          .find((f) => Array.isArray(f?.baggage));
        const baggage = Array.isArray(resolvedFare?.baggage) ? resolvedFare.baggage : [];

        expanded.push({
          offer_id: offer?.id || `offer_${optionIdx}_${offerIdx}`,
          id: offer?.id || `offer_${optionIdx}_${offerIdx}`,
          price: {
            total: Number(offer?.price?.amount || 0),
            amount: Number(offer?.price?.amount || 0),
            currency: offer?.price?.currency || 'UAH',
          },
          airline_code: airlineCode,
          airline_name: airlineName,
          airline: airlineCode,
          logo_url: airlineCode !== 'XX' ? `https://pics.avs.io/200/80/${airlineCode}.png` : null,
          origin: outFirst?.departure_airport?.code || toCode(searchData?.origin) || null,
          origin_city: outFirst?.departure_city?.name || null,
          destination: outLast?.arrival_airport?.code || toCode(searchData?.destination) || null,
          destination_city: outLast?.arrival_city?.name || null,
          departure_time: [outFirst?.departure_date, outFirst?.departure_time].filter(Boolean).join(' ') || null,
          arrival_time: [outLast?.arrival_date, outLast?.arrival_time].filter(Boolean).join(' ') || null,
          return_origin: inFirst?.departure_airport?.code || null,
          return_origin_city: inFirst?.departure_city?.name || null,
          return_destination: inLast?.arrival_airport?.code || null,
          return_destination_city: inLast?.arrival_city?.name || null,
          return_departure_time: [inFirst?.departure_date, inFirst?.departure_time].filter(Boolean).join(' ') || null,
          return_arrival_time: [inLast?.arrival_date, inLast?.arrival_time].filter(Boolean).join(' ') || null,
          stops: Math.max(0, outboundSegs.length ? outboundSegs.length - 1 : allSegs.length - 1),
          baggage,
          segments: allSegs.map(toSegmentVm),
          _searchOrigin: toCode(searchData?.origin) || null,
          _searchDestination: toCode(searchData?.destination) || null,
          _searchDepartDate: searchData?.depart_date || null,
          _searchReturnDate: searchData?.return_date || null,
          _searchPassengerCounts: normalizePassengerCounts(searchData),
        });
      });
    });

    return expanded;
  };

  // Filter flights based on selected airlines and quick filters
  const filteredFlights = useMemo(() => {
    let result = flights;

    if (selectedAirlines.length > 0) {
      result = result.filter((flight) => {
        const airlineCode = flight.airline_code || flight.airline;
        return selectedAirlines.includes(airlineCode);
      });
    }

    if (quickFilter === 'nonstop') {
      result = result.filter((flight) => getStopsCount(flight) === 0);
    } else if (quickFilter === 'one_stop') {
      result = result.filter((flight) => getStopsCount(flight) === 1);
    } else if (quickFilter === 'baggage') {
      result = result.filter((flight) => getCheckedBaggageQty(flight) > 0);
    }

    return result;
  }, [flights, selectedAirlines, quickFilter]);

  const quickFilterStats = useMemo(() => {
    const groups = {
      all: flights,
      nonstop: flights.filter((f) => getStopsCount(f) === 0),
      one_stop: flights.filter((f) => getStopsCount(f) === 1),
      baggage: flights.filter((f) => getCheckedBaggageQty(f) > 0),
    };
    const minPrice = (items) => {
      if (!items.length) return null;
      return Math.min(...items.map((f) => Number(f?.price?.total || 0)).filter((n) => Number.isFinite(n)));
    };
    return {
      all: { count: groups.all.length, minPrice: minPrice(groups.all) },
      nonstop: { count: groups.nonstop.length, minPrice: minPrice(groups.nonstop) },
      one_stop: { count: groups.one_stop.length, minPrice: minPrice(groups.one_stop) },
      baggage: { count: groups.baggage.length, minPrice: minPrice(groups.baggage) },
    };
  }, [flights]);

  const sortedFilteredFlights = useMemo(() => {
    const arr = [...filteredFlights];
    if (resultsSort === 'airline') {
      arr.sort((a, b) => {
        const an = String(a?.airline_name || a?.airline_code || a?.airline || '').toLowerCase();
        const bn = String(b?.airline_name || b?.airline_code || b?.airline || '').toLowerCase();
        return an.localeCompare(bn);
      });
      return arr;
    }
    if (resultsSort === 'fastest') {
      const duration = (f) => Number(f?.duration_minutes || 999999);
      arr.sort((a, b) => duration(a) - duration(b));
      return arr;
    }
    arr.sort((a, b) => Number(a?.price?.total || 0) - Number(b?.price?.total || 0));
    return arr;
  }, [filteredFlights, resultsSort]);

  const proceedToPassengerStep = (offer) => {
    const selectedOfferData = {
      ...offer,
      passenger_counts: resolvePassengerCountsForOffer(offer),
      _searchDepartDate: offer?._searchDepartDate || lastSearchData?.depart_date || null,
      selected_at: new Date().toISOString()
    };

    setSelectedOffer(selectedOfferData);
    localStorage.setItem('selectedOffer', JSON.stringify(selectedOfferData));

    console.log('Offer selected:', offer.offer_id);
    setCurrentStep('passenger');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    return selectedOfferData;
  };

  const resumePendingOfferAfterAuth = () => {
    const pendingOffer = localStorage.getItem('pendingOffer');
    if (!pendingOffer) return;

    try {
      const offer = JSON.parse(pendingOffer);
      proceedToPassengerStep(offer);
      localStorage.removeItem('pendingOffer');
    } catch {
      console.error('Failed to parse pending offer');
    }
  };

  // Handle offer selection - check auth first, then proceed to passenger form
  const handleOfferSelect = (offer) => {
    const authRequiredForCheckout = shouldRequireAuthForCheckout(
      typeof window !== 'undefined' ? window.location.hostname : ''
    );

    if (authRequiredForCheckout && !user) {
      // Not authenticated - show auth modal
      setIsAuthModalOpen(true);
      // Store selected offer for later
      localStorage.setItem('pendingOffer', JSON.stringify(offer));
      return;
    }

    proceedToPassengerStep(offer);
  };

  // Handle logout
  const handleLogout = async () => {
    // See src/lib/logout.js: this used to only clear the local `user`
    // mirror and component state — it never ended the real Supabase
    // session, and left several caches of the departing user's data
    // (orders cache, in-progress booking, pending payments) behind for
    // the next person on this device.
    await performLogout({
      signOut,
      storage: localStorage,
      onSignOutError: (err) => console.error('Sign out request failed (clearing local session state anyway):', err)
    });
    setUser(null);
    // Reset booking flow
    setCurrentStep('search');
    setSelectedOffer(null);
    setPassengerData(null);
  };

  const handleLocalDevSignIn = () => {
    if (!isDevEnvironment) return;
    const localDevUser = buildLocalDevUser();
    localStorage.setItem('user', JSON.stringify(localDevUser));
    setUser(localDevUser);
    setIsAuthModalOpen(false);
  };

  // Handle passenger form submission - create order in DRCT and Supabase
  const handlePassengerSubmit = async (data) => {
    try {
      setIsLoading(true);
      setError(null);
      setPassengerData(data);

      console.log('Creating hold booking via backend order flow with passenger data:', data);
      console.log('Current user:', user);

      // Calculate baggage price
      const baggagePrice = calculateBaggagePrice(data.baggage);
      const orderPayload = buildOrderPayloadForDRCT({
        selectedOffer,
        passengerFormData: data,
        user,
        baggagePrice,
      });

      if (isDevEnvironment && useMockData) {
        const mockResponse = {
          order_id: `mock-order-${Date.now()}`,
          order_number: `MOCK-${Date.now()}`,
          drct_order_id: `MOCK-DRCT-${Date.now()}`,
          success: true,
        };

        const bookingData = buildPendingBookingData({
          n8nResponse: mockResponse,
          selectedOffer,
          passengerFormData: data,
          baggagePrice,
        });

        const cachedOrder = buildCachedOrderRecord({
          n8nResponse: mockResponse,
          selectedOffer,
          passengerFormData: data,
          user,
          baggagePrice,
        });

        const currentCache = readOrdersCache();
        writeOrdersCache([cachedOrder, ...currentCache].slice(0, 200));

        setBooking(bookingData);
        setCurrentOrderId(mockResponse.order_id);

        const pendingStr = JSON.stringify(bookingData);
        localStorage.setItem('moyasarPendingBooking', pendingStr);
        sessionStorage.setItem('moyasarPendingBooking', pendingStr);

        setCurrentStep('payment');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setIsLoading(false);
        return;
      }

      console.log('Sending complete order to backend order flow:', orderPayload);

      const { data: orderCreateResponse, error: orderCreateError } = await createPortalOrder(orderPayload);

      if (orderCreateError) {
        console.error('backend order creation failed:', orderCreateError);
        setError(formatDRCTError(orderCreateError));
        setIsLoading(false);
        return;
      }

      if (orderCreateResponse?.success === false) {
        const errMsg = orderCreateResponse.error || orderCreateResponse.message || 'Order creation failed. Please try again.';
        console.error('backend order creation app error:', errMsg);
        setError(errMsg);
        setIsLoading(false);
        return;
      }

      console.log('Order created successfully via backend:', orderCreateResponse);

      const bookingData = buildPendingBookingData({
        n8nResponse: orderCreateResponse,
        selectedOffer,
        passengerFormData: data,
        baggagePrice,
      });

      // Local fallback cache (used when Supabase list is slow/unavailable)
      // n8n may return a notification event {entity_type:'order', entity_id:'<order uuid>', id:'<event uuid>'}
      // or a direct order response {order_id, order_number, ...}
      const resolvedOrderId = orderCreateResponse?.order_id
        || (orderCreateResponse?.entity_type === 'order' ? orderCreateResponse?.entity_id : null)
        || orderCreateResponse?.entity_id
        || null;
      const cachedOrder = buildCachedOrderRecord({
        n8nResponse: orderCreateResponse,
        selectedOffer,
        passengerFormData: data,
        user,
        baggagePrice,
      });
      const currentCache = readOrdersCache();
      const nextCache = [cachedOrder, ...currentCache];
      const uniq = [];
      const seen = new Set();
      for (const o of nextCache) {
        const k = `${o.order_number || ''}::${o.drct_order_id || ''}::${o.user_id || ''}`;
        if (seen.has(k)) continue;
        seen.add(k);
        uniq.push(o);
      }
      writeOrdersCache(uniq.slice(0, 200));

      setBooking(bookingData);

      // Save to both storages so success screen can restore after 3DS redirect
      const pendingStr = JSON.stringify(bookingData);
      localStorage.setItem('moyasarPendingBooking', pendingStr);
      sessionStorage.setItem('moyasarPendingBooking', pendingStr);

      // Refresh bookings list when user visits it next time
      setBookingsRefreshKey(prev => prev + 1);

      // Guard: if order ID missing, show error instead of proceeding to payment
      if (!resolvedOrderId) {
        console.error('Order created but no ID returned from backend:', orderCreateResponse);
        setError('Order was created but booking reference is missing. Please contact support or try again.');
        setIsLoading(false);
        return;
      }

      // Navigate to payment screen
      setCurrentOrderId(resolvedOrderId);
      setCurrentStep('payment');
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (err) {
      console.error('Error creating order:', err);
      const details =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        err?.message ||
        null;
      setError(details ? `Failed to create booking: ${details}` : 'Failed to create booking. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle payment success
  const handlePaymentSuccess = (paymentData) => {
    // booking state already has orderNumber from handlePassengerSubmit — preserve it
    setError(null);
    setBooking(prev => ({ ...(prev || {}), status: 'paid', payment_id: paymentData?.payment_id }));
    setCurrentStep('success');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle back to search
  const handleBackToSearch = () => {
    setCurrentStep('search');
    setSelectedOffer(null);
    setPassengerData(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle new search
  const handleNewSearch = () => {
    setCurrentStep('search');
    navigateToPortalPage('search');
    setSelectedOffer(null);
    setPassengerData(null);
    setBooking(null);
    setFlights([]);
    setSearchPerformed(false);
    setSuggestedDates([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Navigate to My Bookings page
  const handleGoToBookings = () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    navigateToPortalPage('bookings');
  };

  // Navigate to Staff Dashboard
  const handleGoToAdmin = () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    // Staff roles only
    if (!isStaffRole(user.role)) {
      setError('You do not have access to the admin panel');
      return;
    }
    navigateToPortalPage('admin');
  };

  const handleGoToAgencyAdmin = () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    if (!isAdminRole(user.role)) {
      setError('You do not have access to agency admin mode');
      return;
    }
    navigateToPortalPage('adminAgency');
  };

  // Navigate back to home/search
  const handleBackToHome = () => {
    navigateToPortalPage('search');
  };

  // Handle retry search with suggested date
  const handleRetryWithDate = (newDate) => {
    if (!lastSearchData) return;

    const newSearchData = {
      ...lastSearchData,
      depart_date: newDate,
      // Adjust return date if exists
      return_date: lastSearchData.return_date
        ? (() => {
            const originalDepart = new Date(lastSearchData.depart_date);
            const originalReturn = new Date(lastSearchData.return_date);
            const daysDiff = Math.floor((originalReturn - originalDepart) / (1000 * 60 * 60 * 24));
            const newReturnDate = new Date(newDate);
            newReturnDate.setDate(newReturnDate.getDate() + daysDiff);
            return newReturnDate.toISOString().split('T')[0];
          })()
        : null
    };

    handleSearch(newSearchData);
  };

  const handleSearch = async (searchData) => {
    setIsLoading(true);
    setError(null);
    setSearchPerformed(false);
    setFlights([]);
    setSelectedAirlines([]); // Reset filters on new search
    setQuickFilter('all');
    setSuggestedDates([]); // Clear previous suggestions
    setLastSearchData(searchData); // Store search params for retry

    // TEST MODE: Use mock data
    if (useMockData) {
      console.log('=== TEST MODE: Using Mock Data ===');
      setTimeout(() => {
        console.log('Mock data loaded:', mockFlightData);
        setFlights(mockFlightData.offers);
        setSearchPerformed(true);
        setIsLoading(false);
      }, 1000);
      return;
    }

    try {
      // Prefer explicit search URL; otherwise derive from configured n8n base URL.
      const n8nBaseUrl = String(import.meta.env.VITE_N8N_BASE_URL || '/api/n8n/webhook').replace(/\/+$/, '');
      const searchUrl = import.meta.env.VITE_N8N_SEARCH_URL || `${n8nBaseUrl}/drct/search`;

      console.log('=== Flight Search Started ===');
      console.log('Search payload:', JSON.stringify(searchData, null, 2));
      console.log('Target URL:', searchUrl);

      const response = await axios.post(searchUrl, searchData, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        },
        validateStatus: (status) => status >= 200 && status < 500
      });

      console.log('Response status:', response.status);
      console.log('Response data RAW:', response.data);
      console.log('Response data stringified:', JSON.stringify(response.data, null, 2));
      console.log('Response data type:', typeof response.data);
      console.log('Is response.data a string?', typeof response.data === 'string');

      // Check if response is double-serialized (string instead of object)
      let parsedData = response.data;

      // Case 1: response.data is a string
      if (typeof response.data === 'string') {
        console.warn('⚠️ Response is a STRING, attempting to parse...');
        if (response.data.trim() === '') {
          throw new Error('Search service returned an empty response. Please retry the search.');
        } else {
          try {
            parsedData = JSON.parse(response.data);
          console.log('✅ Successfully parsed JSON string');
        } catch (e) {
          console.error('❌ Failed to parse response:', e);
            throw new Error('Invalid JSON response from server');
          }
        }
      }

      // Case 2: response.data.data exists and is a string (n8n nested JSON)
      if (parsedData && typeof parsedData.data === 'string') {
        console.warn('⚠️ Nested data field is a STRING, attempting to parse...');
        try {
          parsedData = JSON.parse(parsedData.data);
          console.log('✅ Successfully parsed nested JSON string');
        } catch (e) {
          console.error('❌ Failed to parse nested data:', e);
          throw new Error('Invalid nested JSON response from server');
        }
      }

      console.log('Parsed data:', parsedData);
      console.log('Parsed data.offers:', parsedData?.offers);
      console.log('Parsed data.offers type:', typeof parsedData?.offers);
      console.log('Parsed data.offers length:', parsedData?.offers?.length);

      if (response.status !== 200) {
        throw new Error(`Server returned ${response.status}: ${JSON.stringify(parsedData)}`);
      }

      // Handle the response from n8n workflow
      let resultFlights = [];

      if (parsedData?.error) {
        const providerMessage = parsedData.error.message || 'Search provider error';
        const providerCode = parsedData.error.code ? ` (${parsedData.error.code})` : '';
        throw new Error(`${providerMessage}${providerCode}`);
      }

      if (parsedData && parsedData.offers) {
        console.log(`✅ Found ${parsedData.offers.length} offers`);
        console.log('Offers array:', parsedData.offers);
        resultFlights = parsedData.offers;
      } else if (parsedData?.body?.flights_options || parsedData?.flights_options) {
        const rebuilt = buildOffersFromRawDRCT(parsedData, searchData);
        console.log(`✅ Rebuilt ${rebuilt.length} offers from raw DRCT body`);
        resultFlights = rebuilt;
      } else if (Array.isArray(parsedData)) {
        console.log(`✅ Found ${parsedData.length} flights (array format)`);
        resultFlights = parsedData;
      } else {
        console.warn('⚠️ Unexpected response format:', parsedData);
        resultFlights = [];
      }

      const isValidCode = (v) => {
        if (!v || typeof v !== 'string') return false;
        const x = v.trim().toUpperCase();
        return x !== '' && x !== 'N/A' && x !== 'XX' && x !== 'UNKNOWN';
      };

      // Normalize route/airline/time fallbacks so UI does not show XX/N/A
      // when upstream transform partially misses mappings.
      resultFlights = resultFlights.map((offer) => {
        const segments = Array.isArray(offer?.segments) ? offer.segments : [];
        const firstSeg = segments[0];
        const lastSeg = segments[segments.length - 1];

        const normalizedOrigin = isValidCode(offer?.origin)
          ? offer.origin
          : (
              firstSeg?.origin ||
              firstSeg?.departure_airport?.code ||
              firstSeg?.departure?.iataCode ||
              searchData.origin ||
              'N/A'
            );

        const normalizedDestination = isValidCode(offer?.destination)
          ? offer.destination
          : (
              lastSeg?.destination ||
              lastSeg?.arrival_airport?.code ||
              lastSeg?.arrival?.iataCode ||
              searchData.destination ||
              'N/A'
            );

        const normalizedDepartureTime =
          offer?.departure_time && offer.departure_time !== 'N/A'
            ? offer.departure_time
            : (
                firstSeg?.departure ||
                [firstSeg?.departure_date, firstSeg?.departure_time].filter(Boolean).join(' ') ||
                null
              );

        const normalizedArrivalTime =
          offer?.arrival_time && offer.arrival_time !== 'N/A'
            ? offer.arrival_time
            : (
                lastSeg?.arrival ||
                [lastSeg?.arrival_date, lastSeg?.arrival_time].filter(Boolean).join(' ') ||
                null
              );

        const segCarrier = firstSeg?.carrier || {};
        const normalizedAirlineCode = isValidCode(offer?.airline_code)
          ? offer.airline_code
          : (
              isValidCode(offer?.airline)
                ? offer.airline
                : (segCarrier?.airline_code || null)
            );

        const normalizedAirlineName =
          (offer?.airline_name && offer.airline_name !== 'Unknown Airline' && offer.airline_name !== 'N/A')
            ? offer.airline_name
            : (segCarrier?.airline_name || normalizedAirlineCode || 'Unknown Airline');

        return {
          ...offer,
          origin: normalizedOrigin,
          destination: normalizedDestination,
          departure_time: normalizedDepartureTime,
          arrival_time: normalizedArrivalTime,
          airline_code: normalizedAirlineCode || offer?.airline_code || 'XX',
          airline_name: normalizedAirlineName,
          airline: normalizedAirlineCode || offer?.airline || 'XX',
          logo_url:
            normalizedAirlineCode && normalizedAirlineCode !== 'XX'
              ? `https://pics.avs.io/200/80/${normalizedAirlineCode}.png`
              : offer?.logo_url || null,
          _searchOrigin: searchData.origin || null,
          _searchDestination: searchData.destination || null,
          _searchDepartDate: searchData.depart_date || null,
          _searchReturnDate: searchData.return_date || null,
          _searchPassengerCounts: normalizePassengerCounts(searchData),
        };
      });

      // Hard dedupe in 2 passes:
      // 1) exact duplicate payloads (same segment ids + same price)
      // 2) same visible card (same route/time/airline/baggage/stops + same price)
      const pass1 = [];
      const seen1 = new Set();
      for (const offer of resultFlights) {
        const segIds = (Array.isArray(offer?.segments) ? offer.segments : [])
          .map((s) => s?.id || '')
          .join('|');
        const exactKey = [
          offer?.id || offer?.offer_id || '',
          segIds,
          Number(offer?.price?.amount || offer?.price?.total || 0),
          offer?.price?.currency || ''
        ].join('::');
        if (seen1.has(exactKey)) continue;
        seen1.add(exactKey);
        pass1.push(offer);
      }

      const norm = (v) => String(v ?? '').trim().toUpperCase();
      const pass2 = [];
      const seen2 = new Set();
      for (const offer of pass1) {
        const checkedBagQty = (() => {
          if (Array.isArray(offer?.baggage)) {
            const b = offer.baggage.find((x) => x?.type === 'checked');
            return Number(b?.quantity || 0);
          }
          if (offer?.baggage?.type === 'checked') return Number(offer.baggage.quantity || 0);
          return 0;
        })();

        const segs = Array.isArray(offer?.segments) ? offer.segments : [];
        const f = segs[0] || {};
        const l = segs[segs.length - 1] || {};
        const visibleKey = [
          norm(offer?.airline_code || offer?.airline || f?.carrier?.airline_code),
          norm(offer?.origin || f?.origin_code || f?.origin),
          norm(offer?.destination || l?.destination_code || l?.destination),
          norm(offer?.departure_time || f?.departure),
          norm(offer?.arrival_time || l?.arrival),
          norm(offer?.return_origin),
          norm(offer?.return_destination),
          norm(offer?.return_departure_time),
          norm(offer?.return_arrival_time),
          String(offer?.stops ?? ''),
          String(checkedBagQty),
          Number(offer?.price?.amount || offer?.price?.total || 0),
          offer?.price?.currency || ''
        ].join('::');

        if (seen2.has(visibleKey)) continue;
        seen2.add(visibleKey);
        pass2.push(offer);
      }

      resultFlights = pass2;

      setFlights(resultFlights);

      // Если нет результатов - предложить альтернативные даты
      if (resultFlights.length === 0) {
        const alternatives = [];

        if (isValidIsoDateString(searchData.depart_date)) {
          const departDate = new Date(`${searchData.depart_date}T00:00:00Z`);

          // Предложить ±2 дня от выбранной даты
          for (let offset = -2; offset <= 2; offset++) {
            if (offset === 0) continue; // Пропускаем оригинальную дату
            const newDate = new Date(departDate);
            newDate.setUTCDate(departDate.getUTCDate() + offset);

            const dayLabel = Math.abs(offset) === 1 ? 'day' : 'days';
            alternatives.push({
              date: newDate.toISOString().split('T')[0],
              label: offset > 0 ? `+${offset} ${dayLabel}` : `${offset} ${dayLabel}`,
              displayDate: newDate.toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
                weekday: 'short',
                timeZone: 'UTC'
              })
            });
          }
        }

        setSuggestedDates(alternatives);
        setError(
          alternatives.length > 0
            ? 'No flights were found for selected dates. Try nearby dates:'
            : 'No flights were found for the selected route and passenger mix.'
        );
      }

      setSearchPerformed(true);
    } catch (err) {
      console.error('=== Search Error ===');
      console.error('Error type:', err.name);
      console.error('Error message:', err.message);
      console.error('Error response:', err.response?.data);
      console.error('Full error:', err);

      setError(
        err.response?.data?.error?.message ||
        err.message ||
        'Failed to search flights. Please try again.'
      );
      setSearchPerformed(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Plane size={32} className="text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Aviaframe Portal</h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setUseMockData(!useMockData)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  useMockData
                    ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <TestTube2 size={18} />
                {useMockData ? 'Test Mode ON' : 'Test Mode OFF'}
              </button>

              {isDevEnvironment && useMockData && !user && (
                <button
                  onClick={handleLocalDevSignIn}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-md text-sm font-medium transition-colors"
                >
                  <User size={18} />
                  Local Test Sign-In
                </button>
              )}

              {/* Navigation buttons */}
              {user && (
                <>
                  <button
                    onClick={handleGoToBookings}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      currentPage === 'bookings'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <BookOpen size={18} />
                    My bookings
                  </button>
                  {isStaffRole(user.role) && (
                    <button
                      onClick={handleGoToAdmin}
                      className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        currentPage === 'admin'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Shield size={18} />
                      {user.role === 'agent' ? 'Agency' : 'Admin'}
                    </button>
                  )}
                  {isAdminRole(user.role) && (
                    <button
                      onClick={handleGoToAgencyAdmin}
                      className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        currentPage === 'adminAgency'
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Shield size={18} />
                      Agency admin
                    </button>
                  )}
                </>
              )}

              {/* User section */}
              {user ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-md">
                    <User size={18} className="text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">{user.email}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium text-gray-700 transition-colors"
                  >
                    <LogOut size={18} />
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-md text-sm font-medium transition-colors"
                >
                  <User size={18} />
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page: My Bookings */}
        {currentPage === 'bookings' && (
          <MyBookings key={bookingsRefreshKey} user={user} onBackToHome={handleBackToHome} />
        )}

        {/* Page: Admin Dashboard */}
        {currentPage === 'admin' && (
          user ? (
            <AdminErrorBoundary>
              <AdminDashboard
                user={user}
                onBackToHome={handleBackToHome}
                initialSection={isConnectApiPath ? 'partner_api' : 'agencies'}
              />
            </AdminErrorBoundary>
          ) : (
            <div className="mx-auto max-w-xl rounded-2xl border border-indigo-100 bg-white p-8 text-center shadow-sm">
              <Shield className="mx-auto mb-4 text-indigo-600" size={40} />
              <h2 className="text-2xl font-bold text-gray-900">Aviaframe Admin</h2>
              <p className="mt-2 text-gray-600">
                Sign in with a staff account to manage API counterparties and pricing.
              </p>
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                className="mt-6 inline-flex items-center gap-2 rounded-md bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700"
              >
                <User size={18} />
                Sign in to Admin
              </button>
            </div>
          )
        )}

        {/* Page: Agency Admin View (under same super-admin creds) */}
        {currentPage === 'adminAgency' && (
          <AdminErrorBoundary>
            <AdminDashboard user={user} onBackToHome={handleBackToHome} viewMode="agency_admin" />
          </AdminErrorBoundary>
        )}

        {/* Page: Search/Booking Flow */}
        {currentPage === 'search' && (
          <>
            {error && (
              <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 flex-shrink-0 text-red-600" size={20} />
                  <div className="min-w-0">
                    <h3 className="font-semibold text-red-800">
                      {currentStep === 'search' ? 'Search Error' : currentStep === 'payment' ? 'Payment Error' : 'Booking Error'}
                    </h3>
                    <p className="mt-1 text-sm text-red-700">{error}</p>
                  </div>
                </div>

                {currentStep === 'search' && suggestedDates.length > 0 && (
                  <div className="mt-4 border-t border-red-200 pt-4">
                    <p className="mb-3 text-sm font-medium text-gray-700">
                      Try nearby travel dates:
                    </p>
                    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                      {suggestedDates.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleRetryWithDate(suggestion.date)}
                          className="group flex flex-col items-center justify-center rounded-lg border-2 border-blue-200 bg-white p-3 transition-all hover:border-blue-400 hover:bg-blue-50"
                        >
                          <span className="mb-1 text-xs text-gray-500">{suggestion.label}</span>
                          <span className="text-sm font-semibold text-gray-800 group-hover:text-blue-700">
                            {suggestion.displayDate}
                          </span>
                          <span className="mt-1 text-xs text-gray-400">{suggestion.date}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step: Search */}
            {currentStep === 'search' && (
          <>
            {/* Search Form */}
            <div className="mb-8">
              <SearchForm onSearch={handleSearch} isLoading={isLoading} />
            </div>

        {/* Loading State */}
        {isLoading && <LoadingScreen />}

        {/* Results */}
        {!isLoading && searchPerformed && (
          <div>
            {flights.length > 0 ? (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-800">
                    Search Results
                  </h2>
                  <span className="text-gray-600">
                    {filteredFlights.length} of {flights.length} flight{flights.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Quick Filters */}
                <div className="mb-5 grid grid-cols-1 md:grid-cols-4 gap-3">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'nonstop', label: 'Non-stop' },
                    { id: 'one_stop', label: '1 stop' },
                    { id: 'baggage', label: 'With baggage' },
                  ].map((item) => {
                    const stat = quickFilterStats[item.id];
                    const active = quickFilter === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setQuickFilter(item.id)}
                        className={`text-left rounded-lg border p-3 transition-all ${
                          active
                            ? 'border-blue-500 bg-blue-50 shadow-sm'
                            : 'border-gray-200 bg-white hover:border-blue-300'
                        }`}
                      >
                        <div className={`text-sm font-semibold ${active ? 'text-blue-700' : 'text-gray-700'}`}>
                          {item.label}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {stat?.count || 0} flights
                          {Number.isFinite(stat?.minPrice) ? ` · from ${stat.minPrice} UAH` : ''}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mb-5 flex flex-wrap items-center gap-2">
                  <span className="text-sm text-gray-600">Sort by:</span>
                  {[
                    { id: 'price', label: 'Price' },
                    { id: 'airline', label: 'Airline' },
                    { id: 'fastest', label: 'Fastest' },
                  ].map((sortItem) => (
                    <button
                      key={sortItem.id}
                      onClick={() => setResultsSort(sortItem.id)}
                      className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                        resultsSort === sortItem.id
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {sortItem.label}
                    </button>
                  ))}
                </div>

                {/* Airline Filter */}
                <AirlineFilter
                  offers={flights}
                  selectedAirlines={selectedAirlines}
                  onFilterChange={setSelectedAirlines}
                />

                {/* Flight Cards */}
                <div className="space-y-4">
                  {sortedFilteredFlights.map((offer, index) => (
                    <FlightCard
                      key={offer.id || index}
                      offer={offer}
                      onSelect={handleOfferSelect}
                    />
                  ))}
                </div>

                {/* No results after filtering */}
                {sortedFilteredFlights.length === 0 && (
                  <div className="bg-white rounded-lg shadow-md p-8 text-center mt-4">
                    <AlertCircle size={48} className="mx-auto text-gray-300 mb-3" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      No flights match your filters
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Try selecting different airlines or clear all filters.
                    </p>
                    <button
                      onClick={() => {
                        setSelectedAirlines([]);
                        setQuickFilter('all');
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-md transition-colors"
                    >
                      Clear Filters
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <Plane size={64} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  No flights found
                </h3>
                <p className="text-gray-500">
                  Try adjusting your search criteria and try again.
                </p>
              </div>
            )}
          </div>
        )}

            {/* Initial State */}
            {!isLoading && !searchPerformed && (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <Plane size={64} className="mx-auto text-blue-600 mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  Ready to search
                </h3>
                <p className="text-gray-500">
                  Fill in the search form above to find flights.
                </p>
              </div>
            )}
          </>
        )}

        {/* Step: Passenger Form */}
        {currentStep === 'passenger' && selectedOffer && (
          <PassengerForm
            key={`${selectedOffer.offer_id || selectedOffer.id || 'offer'}-${selectedOffer.passenger_counts?.adults || 1}-${selectedOffer.passenger_counts?.children || 0}-${selectedOffer.passenger_counts?.infants || 0}-${passengerData?.passengers?.map((passenger) => passenger.id).join(',') || 'empty'}-${passengerData?.contacts?.email || user?.email || 'no-email'}`}
            selectedOffer={selectedOffer}
            passengerCounts={selectedOffer.passenger_counts || resolvePassengerCountsForOffer(selectedOffer)}
            departureDate={selectedOffer._searchDepartDate}
            initialFormData={passengerData}
            onSubmit={handlePassengerSubmit}
            onBack={handleBackToSearch}
            userEmail={user?.email}
            isLoading={isLoading}
          />
        )}

        {/* Step: Payment */}
        {currentStep === 'payment' && selectedOffer && passengerData && (
          <PaymentScreen
            selectedOffer={selectedOffer}
            passengerData={passengerData}
            orderId={currentOrderId}
            orderNumber={booking?.orderNumber}
            onBack={() => setCurrentStep('passenger')}
            onPaymentSuccess={handlePaymentSuccess}
            isDevMockMode={isDevEnvironment && useMockData}
          />
        )}

        {/* Step: Success */}
        {currentStep === 'success' && booking && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-8 border border-gray-200 text-center">
              <div className="mb-6">
                <CheckCircle size={64} className="mx-auto text-green-500 mb-4" />
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  {booking.status === 'paid' ? 'Payment confirmed!' : 'Booking created!'}
                </h2>
                <p className="text-gray-600">
                  {booking.status === 'paid'
                    ? 'Your flight is booked and ticket is being issued.'
                    : 'Flight is booked and awaiting payment.'}
                </p>
              </div>

              {/* Booking Reference */}
              <div className="bg-green-50 rounded-lg p-4 mb-4 border border-green-200 space-y-2">
                {(booking.orderNumber || booking.bookingReference) ? (
                  <>
                    <div>
                      <div className="text-xs text-gray-500 mb-0.5">Order number (for support)</div>
                      <div className="text-xl font-bold text-green-600 font-mono">{booking.orderNumber || booking.bookingReference}</div>
                    </div>
                    {booking.bookingReference && booking.bookingReference !== booking.orderNumber && (
                      <div>
                        <div className="text-xs text-gray-500 mb-0.5">PNR / Booking reference</div>
                        <div className="text-lg font-bold text-purple-600 font-mono">{booking.bookingReference}</div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-sm text-green-700">
                    Order confirmed. Check your email for booking details.
                  </div>
                )}
              </div>

              {/* Status */}
              {booking.status === 'paid' ? (
                <div className="bg-green-50 rounded-lg p-4 mb-6 border border-green-200">
                  <div className="text-sm font-semibold text-green-800 mb-2">
                    Status: Payment received ✓
                  </div>
                  <p className="text-xs text-green-700">
                    Ticket confirmation will be sent to your email shortly.
                  </p>
                </div>
              ) : (
                <div className="bg-yellow-50 rounded-lg p-4 mb-6 border border-yellow-200">
                  <div className="text-sm font-semibold text-yellow-800 mb-2">
                    Status: Awaiting payment
                  </div>
                  <p className="text-xs text-yellow-700">
                    Complete payment to finalize booking. Instructions were sent to your email.
                  </p>
                </div>
              )}

              {/* Flight Details — shown only when offer data is available */}
              {booking.offer && (
                <div className="text-left mb-6 p-6 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-4">Flight details</h3>
                  <div className="space-y-2 text-sm">
                    {bookingRoute && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Route:</span>
                        <span className="font-semibold">{bookingRoute.origin} → {bookingRoute.destination}</span>
                      </div>
                    )}
                    {booking.offer.airline_name && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Airline:</span>
                        <span className="font-semibold">{booking.offer.airline_name}</span>
                      </div>
                    )}
                    {booking.offer.departure_time && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Departure:</span>
                        <span className="font-semibold">{booking.offer.departure_time}</span>
                      </div>
                    )}
                    {booking.passengerParty?.passengers?.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Travelers:</span>
                        <span className="font-semibold">{buildPassengerSummary(booking.passengerParty.passengers)}</span>
                      </div>
                    )}
                    {booking.totalPrice != null && (
                      <div className="flex justify-between border-t pt-2 mt-2">
                        <span className="text-gray-600">{booking.status === 'paid' ? 'Amount paid:' : 'Amount due:'}</span>
                        <span className="text-xl font-bold text-green-600">
                          {Number(booking.totalPrice).toFixed(0)} {booking.currency}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-3">
                <p className="text-sm text-gray-500 mb-4">
                  Booking details were sent to <strong>{user?.email || booking.passengerParty?.contacts?.email}</strong>
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleGoToBookings}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-all"
                  >
                    My bookings
                  </button>
                  <button
                    onClick={handleNewSearch}
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold py-3 px-6 rounded-lg transition-all"
                  >
                    New search
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
          </>
        )}
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}

export default App;
