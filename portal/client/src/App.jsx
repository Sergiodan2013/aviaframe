import { useState, useMemo, useEffect, useRef } from 'react';
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
import { Plane, AlertCircle, TestTube2, User, LogOut, CheckCircle, BookOpen, Shield } from 'lucide-react';
import { mockFlightData } from './mock/flightData';
import { drctApi, formatDRCTError, calculateBaggagePrice } from './lib/drctApi';
import { supabase, getProfile } from './lib/supabase';

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [flights, setFlights] = useState([]);
  const [error, setError] = useState(null);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [useMockData, setUseMockData] = useState(false);
  const [selectedAirlines, setSelectedAirlines] = useState([]);
  const [quickFilter, setQuickFilter] = useState('all');
  const [user, setUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Page navigation state
  const [currentPage, setCurrentPage] = useState('search'); // 'search', 'bookings', 'admin', 'adminAgency'
  const [bookingsRefreshKey, setBookingsRefreshKey] = useState(0);

  // Booking flow state
  const [currentStep, setCurrentStep] = useState('search'); // 'search', 'passenger', 'payment', 'success'
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [passengerData, setPassengerData] = useState(null);
  const [booking, setBooking] = useState(null);
  const [lastSearchData, setLastSearchData] = useState(null);
  const [suggestedDates, setSuggestedDates] = useState([]);
  const profileRefreshInFlightRef = useRef({});

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

  const getSessionUserView = async (sessionUser, cachedUser = null) => {
    let role = normalizeRole(cachedUser?.role || 'user');
    let roleFetchedAt = Number(cachedUser?.roleFetchedAt || 0);
    const now = Date.now();
    const staleMs = 10 * 60 * 1000;
    const needsRefresh = !role || role === 'user' || (now - roleFetchedAt > staleMs);

    if (needsRefresh && sessionUser?.id && !profileRefreshInFlightRef.current[sessionUser.id]) {
      profileRefreshInFlightRef.current[sessionUser.id] = true;
      try {
        const { data: profile, error: profileError } = await getProfile(sessionUser.id);
        if (profile?.role) {
          role = normalizeRole(profile.role);
          roleFetchedAt = Date.now();
        } else if (profileError?.message) {
          console.info('Profile role not refreshed:', profileError.message);
        }
      } finally {
        profileRefreshInFlightRef.current[sessionUser.id] = false;
      }
    }

    return {
      id: sessionUser.id,
      email: sessionUser.email,
      name: (sessionUser.email || '').split('@')[0],
      provider: sessionUser.app_metadata?.provider || 'email',
      role,
      roleFetchedAt: roleFetchedAt || Date.now()
    };
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
          const msg = String(error?.message || '').toLowerCase();
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
        const nextUser = await getSessionUserView(sessionUser, cached);
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
      }
    };
    bootstrap();
    return () => {
      mounted = false;
    };
  }, []);

  // Listen for auth state changes (Magic Link callback)
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
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

          const nextUser = await getSessionUserView(session.user, cached);
          localStorage.setItem('user', JSON.stringify(nextUser));
          setUser(nextUser);
          setIsAuthModalOpen(false);
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
          _searchReturnDate: searchData?.return_date || null,
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

  // Handle offer selection - check auth first, then proceed to passenger form
  const handleOfferSelect = (offer) => {
    if (!user) {
      // Not authenticated - show auth modal
      setIsAuthModalOpen(true);
      // Store selected offer for later
      localStorage.setItem('pendingOffer', JSON.stringify(offer));
      return;
    }

    // Authenticated - save offer and go to passenger form
    const selectedOfferData = {
      ...offer,
      selected_at: new Date().toISOString()
    };

    setSelectedOffer(selectedOfferData);
    localStorage.setItem('selectedOffer', JSON.stringify(selectedOfferData));

    console.log('Offer selected:', offer.offer_id);

    // Navigate to passenger form
    setCurrentStep('passenger');

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle successful authentication
  const handleAuthSuccess = (userData) => {
    setUser(userData);

    // Check if there's a pending offer
    const pendingOffer = localStorage.getItem('pendingOffer');
    if (pendingOffer) {
      try {
        const offer = JSON.parse(pendingOffer);
        handleOfferSelect(offer);
        localStorage.removeItem('pendingOffer');
      } catch {
        console.error('Failed to parse pending offer');
      }
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    // Reset booking flow
    setCurrentStep('search');
    setSelectedOffer(null);
    setPassengerData(null);
  };

  // Handle passenger form submission - create order in DRCT and Supabase
  const handlePassengerSubmit = async (data) => {
    try {
      setIsLoading(true);
      setPassengerData(data);

      console.log('Creating Hold Booking via n8n webhook with passenger data:', data);
      console.log('Current user:', user);

      // Calculate baggage price
      const baggagePrice = calculateBaggagePrice(data.baggage);

      // Prepare complete order payload for n8n webhook
      // n8n will handle: DRCT API call + Supabase writes (orders + passengers)
      const orderPayload = {
        // ============================================
        // DRCT API Required Fields (критически важно!)
        // ============================================

        // 1. offer_id - на верхнем уровне (обязательно!)
        offer_id: selectedOffer.offer_id,

        // 2. passengers - массив с данными пассажиров (обязательно!)
        passengers: [{
          type: 'ADT', // Adult passenger type
          first_name: data.firstName,
          last_name: data.lastName,
          date_of_birth: data.dateOfBirth,
          gender: data.gender === 'male' ? 'M' : 'F', // DRCT expects M/F, not 'male'/'female'
          document: {
            type: 'passport',
            number: data.passportNumber,
            expiry_date: data.passportExpiry,
            issuing_country: data.nationality || 'SA'
          }
        }],

        // 3. contacts - email и phone (обязательно!)
        contacts: {
          email: data.email,
          phone: data.phone
        },

        // ============================================
        // Дополнительные данные для n8n → Supabase
        // ============================================

        // User info (для связи с пользователем)
        user_id: user?.id,
        user_email: user?.email,

        // Full offer details (для записи в таблицу orders)
        offer: {
          origin: selectedOffer.origin,
          destination: selectedOffer.destination,
          departure_time: selectedOffer.departure_time,
          arrival_time: selectedOffer.arrival_time,
          airline_code: selectedOffer.airline_code,
          airline_name: selectedOffer.airline_name,
          flight_number: selectedOffer.flight_number,
          base_price: selectedOffer.price?.total || 0,
          taxes: selectedOffer.price?.taxes || 0,
          currency: selectedOffer.price?.currency || 'UAH'
        },

        // Additional passenger info (для таблицы passengers в Supabase)
        passenger_details: {
          baggage_allowance: data.baggage,
          nationality: data.nationality,
          passport_number: data.passportNumber,
          passport_expiry: data.passportExpiry
        },

        // Pricing breakdown (для расчета итоговой стоимости)
        pricing: {
          base_price: selectedOffer.price?.total || 0,
          taxes: selectedOffer.price?.taxes || 0,
          baggage_price: baggagePrice.amount,
          total_price: (selectedOffer.price?.total || 0) + baggagePrice.amount,
          currency: selectedOffer.price?.currency || 'UAH'
        },

        // Raw offer data for backup
        raw_offer_data: selectedOffer
      };

      console.log('Sending complete order to n8n webhook:', orderPayload);

      // Send to n8n webhook - it will handle everything
      const { data: n8nResponse, error: n8nError } = await drctApi.createOrder(orderPayload);

      if (n8nError) {
        console.error('n8n order creation failed:', n8nError);
        setError(formatDRCTError(n8nError));
        setIsLoading(false);
        return;
      }

      console.log('Order created successfully via n8n:', n8nResponse);

      // n8n returns: { order_number, booking_reference, drct_order_id, status }
      const bookingData = {
        orderNumber: n8nResponse.order_number,
        bookingReference: n8nResponse.booking_reference || n8nResponse.drct_order_id,
        status: 'pending_payment',
        offer: selectedOffer,
        passenger: data,
        totalPrice: (selectedOffer.price?.total || 0) + baggagePrice.amount,
        currency: selectedOffer.price?.currency || 'UAH'
      };

      // Local fallback cache (used when Supabase list is slow/unavailable)
      const resolvedOrderId = n8nResponse?.id || n8nResponse?.order_id || null;
      const cachedOrder = {
        id: resolvedOrderId || `local_${Date.now()}`,
        order_number: n8nResponse.order_number || n8nResponse.booking_reference || `ORD-${Date.now()}`,
        drct_order_id: n8nResponse.drct_order_id || n8nResponse.booking_reference || null,
        user_id: user?.id || null,
        contact_email: data.email,
        contact_phone: data.phone,
        passenger_count: 1,
        origin: selectedOffer.origin,
        destination: selectedOffer.destination,
        departure_time: selectedOffer.departure_time,
        arrival_time: selectedOffer.arrival_time,
        airline_code: selectedOffer.airline_code || selectedOffer.airline,
        airline_name: selectedOffer.airline_name,
        flight_number: selectedOffer.flight_number || null,
        total_price: (selectedOffer.price?.total || 0) + baggagePrice.amount,
        currency: selectedOffer.price?.currency || 'UAH',
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        raw_offer_data: selectedOffer
      };
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

      // Refresh bookings list when user visits it next time
      setBookingsRefreshKey(prev => prev + 1);

      // Navigate directly to success screen (skip payment)
      setCurrentStep('success');
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (err) {
      console.error('Error creating order:', err);
      const details =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        err?.message ||
        null;
      setError(details ? `Не удалось создать бронирование: ${details}` : 'Не удалось создать бронирование. Попробуйте еще раз.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle payment success
  const handlePaymentSuccess = (bookingData) => {
    setBooking(bookingData);
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
    setCurrentPage('search');
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
    setCurrentPage('bookings');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Navigate to Staff Dashboard
  const handleGoToAdmin = () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    // Staff roles only
    if (!isStaffRole(user.role)) {
      setError('У вас нет прав доступа к админ-панели');
      return;
    }
    setCurrentPage('admin');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoToAgencyAdmin = () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    if (!isAdminRole(user.role)) {
      setError('У вас нет прав доступа к режиму админа агентства');
      return;
    }
    setCurrentPage('adminAgency');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Navigate back to home/search
  const handleBackToHome = () => {
    setCurrentPage('search');
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      const n8nBaseUrl = String(import.meta.env.VITE_N8N_BASE_URL || '/api/n8n/webhook-test').replace(/\/+$/, '');
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
          console.warn('⚠️ Empty string response from n8n. Treating as empty offers list.');
          parsedData = { offers: [] };
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
          _searchReturnDate: searchData.return_date || null,
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
        const departDate = new Date(searchData.depart_date);
        const alternatives = [];

        // Предложить ±2 дня от выбранной даты
        for (let offset = -2; offset <= 2; offset++) {
          if (offset === 0) continue; // Пропускаем оригинальную дату
          const newDate = new Date(departDate);
          newDate.setDate(departDate.getDate() + offset);

          const dayLabel = Math.abs(offset) === 1 ? 'день' : 'дня';
          alternatives.push({
            date: newDate.toISOString().split('T')[0],
            label: offset > 0 ? `+${offset} ${dayLabel}` : `${offset} ${dayLabel}`,
            displayDate: newDate.toLocaleDateString('ru-RU', {
              day: 'numeric',
              month: 'long',
              weekday: 'short'
            })
          });
        }

        setSuggestedDates(alternatives);
        setError('К сожалению, на выбранные даты рейсов не найдено. Попробуйте соседние даты:');
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
      <header className="bg-white shadow-sm">
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
                    Мои бронирования
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
                      {user.role === 'agent' ? 'Агентство' : 'Админ'}
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
                      Админ агентства
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
          <AdminDashboard user={user} onBackToHome={handleBackToHome} />
        )}

        {/* Page: Agency Admin View (under same super-admin creds) */}
        {currentPage === 'adminAgency' && (
          <AdminDashboard user={user} onBackToHome={handleBackToHome} viewMode="agency_admin" />
        )}

        {/* Page: Search/Booking Flow */}
        {currentPage === 'search' && (
          <>
            {/* Step: Search */}
            {currentStep === 'search' && (
          <>
            {/* Search Form */}
            <div className="mb-8">
              <SearchForm onSearch={handleSearch} isLoading={isLoading} />
            </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <h3 className="text-red-800 font-semibold">Search Error</h3>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
            </div>

            {/* Suggested Dates */}
            {suggestedDates.length > 0 && (
              <div className="mt-4 pt-4 border-t border-red-200">
                <p className="text-sm text-gray-700 mb-3 font-medium">
                  Попробуйте рейсы на соседние даты:
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {suggestedDates.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleRetryWithDate(suggestion.date)}
                      className="flex flex-col items-center justify-center p-3 bg-white border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 rounded-lg transition-all group"
                    >
                      <span className="text-xs text-gray-500 mb-1">{suggestion.label}</span>
                      <span className="text-sm font-semibold text-gray-800 group-hover:text-blue-700">
                        {suggestion.displayDate}
                      </span>
                      <span className="text-xs text-gray-400 mt-1">{suggestion.date}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

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
                    { id: 'all', label: 'Все' },
                    { id: 'nonstop', label: 'Без пересадок' },
                    { id: 'one_stop', label: '1 пересадка' },
                    { id: 'baggage', label: 'С багажом' },
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
                          {stat?.count || 0} рейс(ов)
                          {Number.isFinite(stat?.minPrice) ? ` · от ${stat.minPrice} UAH` : ''}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Airline Filter */}
                <AirlineFilter
                  offers={flights}
                  selectedAirlines={selectedAirlines}
                  onFilterChange={setSelectedAirlines}
                />

                {/* Flight Cards */}
                <div className="space-y-4">
                  {filteredFlights.map((offer, index) => (
                    <FlightCard
                      key={offer.id || index}
                      offer={offer}
                      onSelect={handleOfferSelect}
                    />
                  ))}
                </div>

                {/* No results after filtering */}
                {filteredFlights.length === 0 && (
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
            selectedOffer={selectedOffer}
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
            onBack={() => setCurrentStep('passenger')}
            onPaymentSuccess={handlePaymentSuccess}
          />
        )}

        {/* Step: Success (Hold Booking - Awaiting Payment) */}
        {currentStep === 'success' && booking && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-8 border border-gray-200 text-center">
              <div className="mb-6">
                <CheckCircle size={64} className="mx-auto text-orange-500 mb-4" />
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Бронирование создано!</h2>
                <p className="text-gray-600">Рейс забронирован. Ожидает оплаты.</p>
              </div>

              {/* Booking Reference */}
              <div className="bg-orange-50 rounded-lg p-4 mb-4 border border-orange-200">
                <div className="text-sm text-gray-600 mb-1">Номер бронирования</div>
                <div className="text-2xl font-bold text-orange-600">{booking.bookingReference}</div>
              </div>

              {/* Status */}
              <div className="bg-yellow-50 rounded-lg p-4 mb-6 border border-yellow-200">
                <div className="text-sm font-semibold text-yellow-800 mb-2">
                  Статус: Ожидает оплаты
                </div>
                <p className="text-xs text-yellow-700">
                  Для завершения бронирования необходимо произвести оплату. Инструкции отправлены на ваш email.
                </p>
              </div>

              {/* Flight Details */}
              <div className="text-left mb-6 p-6 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-4">Детали рейса</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Маршрут:</span>
                    <span className="font-semibold">{booking.offer.origin} → {booking.offer.destination}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Авиакомпания:</span>
                    <span className="font-semibold">{booking.offer.airline_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Вылет:</span>
                    <span className="font-semibold">{booking.offer.departure_time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Пассажир:</span>
                    <span className="font-semibold">{booking.passenger.firstName} {booking.passenger.lastName}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 mt-2">
                    <span className="text-gray-600">К оплате:</span>
                    <span className="text-xl font-bold text-orange-600">
                      {booking.totalPrice.toFixed(0)} {booking.currency}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <p className="text-sm text-gray-500 mb-4">
                  Детали бронирования и инструкции по оплате отправлены на <strong>{user?.email || booking.passenger.email}</strong>
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleGoToBookings}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-all"
                  >
                    Мои бронирования
                  </button>
                  <button
                    onClick={handleNewSearch}
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold py-3 px-6 rounded-lg transition-all"
                  >
                    Новый поиск
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
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}

export default App;
