import { useState, useEffect, useRef } from 'react';
import { Plane, Calendar, User, CreditCard, AlertCircle, CheckCircle, Clock, XCircle, ArrowLeft, X, MapPin, Ticket } from 'lucide-react';
import {
  getUserOrders,
  getOrderTicketDocument,
  getOrderPaymentInstructions,
  createSupportRequest
} from '../lib/supabase';

export default function MyBookings({ user, onBackToHome }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [ticketLoadingId, setTicketLoadingId] = useState(null);
  const [paymentInstruction, setPaymentInstruction] = useState(null);
  const [paymentInstructionLoading, setPaymentInstructionLoading] = useState(false);
  const [supportModalOrder, setSupportModalOrder] = useState(null);
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportFile, setSupportFile] = useState(null);
  const [supportSending, setSupportSending] = useState(false);
  const loadingRef = useRef(false);

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
      const originCode =
        first?.departure_airport?.code ||
        first?.origin ||
        first?.departure_city?.code ||
        null;
      const destinationCode =
        last?.arrival_airport?.code ||
        last?.destination ||
        last?.arrival_city?.code ||
        null;
      const departure = [first?.departure_date, first?.departure_time].filter(Boolean).join(' ') || null;
      const arrival = [last?.arrival_date, last?.arrival_time].filter(Boolean).join(' ') || null;
      const airline = first?.carrier?.airline_name || first?.carrier?.airline_code || null;
      const flightNumber = first?.flight_number || null;
      return {
        origin,
        destination,
        originCode,
        destinationCode,
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

  useEffect(() => {
    if (!user?.id) return;
    loadOrders();
  }, [user?.id]);

  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => {
      setError('Истекло время загрузки бронирований. Обновите страницу или попробуйте позже.');
      setLoading(false);
    }, 20000);
    return () => clearTimeout(t);
  }, [loading]);

  useEffect(() => {
    if (!selectedOrder) return;
    const onEsc = (e) => {
      if (e.key === 'Escape') setSelectedOrder(null);
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [selectedOrder]);

  const loadOrders = async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    try {
      setLoading(true);
      setError(null);
      console.log('[MyBookings] loadOrders start');
      console.log('🔍 Loading orders for user:', user.id);
      const { data, error } = await getUserOrders(user.id);

      if (error) {
        console.error('❌ Error fetching orders:', error);
        const cache = readOrdersCache().filter((o) => o?.user_id === user.id);
        if (cache.length > 0) {
          setOrders(cache.map((o) => ({ ...o, status: normalizeStatus(o.status) })));
          setError('Показаны локально сохранённые заказы (база временно недоступна).');
          return;
        }
        throw error;
      }

      console.log('✅ Orders loaded:', data);
      console.log('📊 Total orders:', data?.length || 0);
      const normalized = (data || []).map((o) => ({ ...o, status: normalizeStatus(o.status) }));
      normalized.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      if (normalized.length > 0) {
        setOrders(normalized);
      } else {
        const cache = readOrdersCache().filter((o) => o?.user_id === user.id);
        setOrders(cache.map((o) => ({ ...o, status: normalizeStatus(o.status) })));
      }
    } catch (err) {
      console.error('Error loading orders:', err);
      const cache = readOrdersCache().filter((o) => o?.user_id === user.id);
      if (cache.length > 0) {
        setOrders(cache.map((o) => ({ ...o, status: normalizeStatus(o.status) })));
        setError('Показаны локально сохранённые заказы (база временно недоступна).');
      } else {
        setError('Failed to load bookings. Please try again.');
      }
    } finally {
      console.log('[MyBookings] loadOrders finally -> setLoading(false)');
      setLoading(false);
      loadingRef.current = false;
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      pending: {
        icon: Clock,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        label: 'Ожидает оплаты',
        action: 'payment'
      },
      confirmed: {
        icon: CheckCircle,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        label: 'Подтвержден',
        action: 'view'
      },
      ticketed: {
        icon: CheckCircle,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        label: 'Выписан',
        action: 'ticket'
      },
      cancelled: {
        icon: XCircle,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        label: 'Отменен',
        action: null
      },
    };

    return configs[status] || configs.pending;
  };

  const handlePaymentInstructions = async (order) => {
    try {
      setPaymentInstructionLoading(true);
      const { data, error: reqError } = await getOrderPaymentInstructions(order);
      if (reqError) throw new Error(reqError.message || 'Payment instructions load failed');
      if (!data) throw new Error('Payment instructions not found');
      setPaymentInstruction(data);
    } catch (err) {
      setError(`Не удалось загрузить инструкцию по оплате: ${err.message}`);
    } finally {
      setPaymentInstructionLoading(false);
    }
  };

  const handleDownloadTicket = async (order) => {
    const popup = window.open('about:blank', '_blank');
    try {
      setTicketLoadingId(order.id);
      const { url, error: docError } = await getOrderTicketDocument(order.id);
      if (docError) throw new Error(docError.message || 'Ticket PDF not found');
      if (!url) throw new Error('Download URL not returned');
      if (popup) {
        popup.location.href = url;
      } else {
        window.location.assign(url);
      }
    } catch (err) {
      if (popup) popup.close();
      setError(`Ошибка скачивания билета: ${err.message}`);
    } finally {
      setTicketLoadingId(null);
    }
  };

  const handleOpenSupport = (order) => {
    setSupportModalOrder(order);
    setSupportSubject(order?.order_number ? `Проблема по заказу ${order.order_number}` : 'Вопрос в поддержку');
    setSupportMessage('');
    setSupportFile(null);
  };

  const fileToBase64 = async (file) => {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }
    return btoa(binary);
  };

  const handleSendSupport = async () => {
    try {
      if (!supportMessage || supportMessage.trim().length < 3) {
        setError('Введите текст обращения (минимум 3 символа).');
        return;
      }
      setSupportSending(true);
      let attachment = null;
      if (supportFile) {
        const maxBytes = 8 * 1024 * 1024;
        if (supportFile.size > maxBytes) {
          setError('Файл слишком большой. Максимум 8MB.');
          return;
        }
        const dataBase64 = await fileToBase64(supportFile);
        attachment = {
          name: supportFile.name,
          type: supportFile.type || 'application/octet-stream',
          dataBase64
        };
      }

      const payload = {
        order_id: supportModalOrder?.id || null,
        subject: supportSubject || 'Support request',
        message: supportMessage,
        attachment
      };
      const { error: sendError } = await createSupportRequest(payload);
      if (sendError) throw new Error(sendError.message || 'Support request failed');

      setSupportModalOrder(null);
      setSupportSubject('');
      setSupportMessage('');
      setSupportFile(null);
      setError(null);
      setNotice('Запрос отправлен в поддержку.');
    } catch (err) {
      setError(`Ошибка отправки в поддержку: ${err.message}`);
    } finally {
      setSupportSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Загрузка бронирований...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
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
                <h1 className="text-3xl font-bold text-gray-900">Мои бронирования</h1>
                <p className="text-gray-600 mt-1">Управление вашими заказами</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-md">
              <User size={18} className="text-blue-600" />
              <span className="text-sm font-medium text-blue-900">{user?.email}</span>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <h3 className="text-red-800 font-semibold">Ошибка</h3>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Notice Message */}
        {notice && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-start justify-between gap-3">
            <p className="text-green-700 text-sm font-medium">{notice}</p>
            <button
              onClick={() => setNotice(null)}
              className="text-green-700 hover:text-green-900"
              aria-label="Close notice"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Plane size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              У вас пока нет бронирований
            </h3>
            <p className="text-gray-500 mb-6">
              Найдите и забронируйте свой первый рейс
            </p>
            <button
              onClick={onBackToHome}
              className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold py-3 px-6 rounded-lg transition-all"
            >
              Найти рейсы
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const statusConfig = getStatusConfig(normalizeStatus(order.status));
              const StatusIcon = statusConfig.icon;
              const legs = getLegsFromOrder(order);
              const outbound = legs.outbound;
              const returnLeg = legs.returnLeg;

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-lg shadow-md p-6 border-l-4 hover:shadow-lg transition-shadow"
                  style={{ borderLeftColor: statusConfig.color.replace('text-', '#') }}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Flight Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`flex items-center gap-2 px-3 py-1 ${statusConfig.bgColor} ${statusConfig.borderColor} border rounded-full`}>
                          <StatusIcon size={16} className={statusConfig.color} />
                          <span className={`text-sm font-semibold ${statusConfig.color}`}>
                            {statusConfig.label}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(order.created_at).toLocaleDateString('ru-RU', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="space-y-2">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Plane size={20} className="text-blue-600" />
                                <span className="font-semibold text-lg text-gray-900">
                                  {(outbound?.origin || order.origin) || 'N/A'} → {(outbound?.destination || order.destination) || 'N/A'}
                                </span>
                              </div>
                              {(outbound?.originCode || outbound?.destinationCode) && (
                                <p className="text-xs text-gray-500 mb-1">
                                  {(outbound?.originCode || 'N/A')}-{(outbound?.destinationCode || 'N/A')}
                                </p>
                              )}
                              <p className="text-sm text-gray-600">
                                {(outbound?.airline || order.airline_name || order.airline_code || 'N/A')} • {(outbound?.flightNumber || order.flight_number || 'N/A')}
                              </p>
                              <p className="text-sm text-gray-600">
                                {outbound?.departure || order.departure_time || 'N/A'}
                              </p>
                            </div>
                            {returnLeg && (
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <Plane size={20} className="text-indigo-500 rotate-180" />
                                  <span className="font-semibold text-lg text-gray-900">
                                    {returnLeg.origin || 'N/A'} → {returnLeg.destination || 'N/A'}
                                  </span>
                                </div>
                                {(returnLeg?.originCode || returnLeg?.destinationCode) && (
                                  <p className="text-xs text-gray-500 mb-1">
                                    {(returnLeg?.originCode || 'N/A')}-{(returnLeg?.destinationCode || 'N/A')}
                                  </p>
                                )}
                                <p className="text-sm text-gray-600">
                                  {returnLeg.airline || 'N/A'} • {returnLeg.flightNumber || 'N/A'}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {returnLeg.departure || 'N/A'}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar size={18} className="text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {outbound?.departure || order.departure_time || 'N/A'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CreditCard size={18} className="text-gray-400" />
                            <span className="text-sm font-semibold text-gray-900">
                              {order.total_price} {order.currency}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 text-xs text-gray-500">
                        Номер заказа: <span className="font-mono font-semibold">{order.order_number}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 lg:w-48">
                      {statusConfig.action === 'payment' && (
                        <button
                          onClick={() => handlePaymentInstructions(order)}
                          disabled={paymentInstructionLoading}
                          className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold py-2 px-4 rounded-lg transition-all text-sm"
                        >
                          {paymentInstructionLoading ? 'Загрузка...' : 'Инструкция по оплате'}
                        </button>
                      )}
                      {statusConfig.action === 'ticket' && (
                        <button
                          onClick={() => handleDownloadTicket(order)}
                          className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-2 px-4 rounded-lg transition-all text-sm"
                        >
                          {ticketLoadingId === order.id ? 'Готовим PDF...' : 'Скачать билет'}
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenSupport(order)}
                        className="w-full bg-blue-100 hover:bg-blue-200 text-blue-800 font-semibold py-2 px-4 rounded-lg transition-all text-sm"
                      >
                        Поддержка
                      </button>
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-all text-sm"
                      >
                        Детали
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Payment Instruction Modal */}
        {paymentInstruction && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setPaymentInstruction(null)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[88vh] overflow-y-auto p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Инструкция по оплате</h2>
                  <p className="text-sm text-gray-500 mt-1">Заказ #{paymentInstruction.order_number}</p>
                </div>
                <button
                  onClick={() => setPaymentInstruction(null)}
                  className="inline-flex items-center justify-center h-9 w-9 rounded-md border border-gray-200 text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 text-sm">
                <div className="bg-gray-50 rounded p-3 border">
                  <div className="text-gray-500">Сумма к оплате</div>
                  <div className="text-lg font-semibold">{paymentInstruction.amount} {paymentInstruction.currency}</div>
                </div>
                <div className="bg-gray-50 rounded p-3 border">
                  <div className="text-gray-500">Агентство</div>
                  <div className="font-semibold">{paymentInstruction?.agency?.name || 'N/A'}</div>
                </div>
              </div>
              <div className="bg-gray-50 rounded p-3 border mb-4 text-sm">
                <div className="font-semibold mb-2">Банковские реквизиты</div>
                <div>Банк: {paymentInstruction?.bank_details?.bank_name || 'N/A'}</div>
                <div>Счет: {paymentInstruction?.bank_details?.account_number || 'N/A'}</div>
                <div>IBAN: {paymentInstruction?.bank_details?.iban || 'N/A'}</div>
                <div>SWIFT/BIC: {paymentInstruction?.bank_details?.swift_bic || 'N/A'}</div>
                <div>SAMA: {paymentInstruction?.bank_details?.sama_code || 'N/A'}</div>
              </div>
              <div className="bg-blue-50 rounded p-3 border text-sm">
                {Array.isArray(paymentInstruction?.notes) && paymentInstruction.notes.map((line) => (
                  <p key={line} className="text-gray-700">{line}</p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Support Modal */}
        {supportModalOrder && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setSupportModalOrder(null)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[88vh] overflow-y-auto p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Запрос в поддержку</h2>
                  <p className="text-sm text-gray-500 mt-1">Заказ #{supportModalOrder.order_number}</p>
                </div>
                <button
                  onClick={() => setSupportModalOrder(null)}
                  className="inline-flex items-center justify-center h-9 w-9 rounded-md border border-gray-200 text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-3">
                <input
                  value={supportSubject}
                  onChange={(e) => setSupportSubject(e.target.value)}
                  placeholder="Тема"
                  className="w-full border rounded px-3 py-2"
                />
                <textarea
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  placeholder="Опишите проблему"
                  className="w-full border rounded px-3 py-2 min-h-32"
                />
                <input
                  type="file"
                  onChange={(e) => setSupportFile(e.target.files?.[0] || null)}
                  className="w-full border rounded px-3 py-2"
                />
                <p className="text-xs text-gray-500">Получатель: sergiodan2013@gmail.com</p>
                <button
                  onClick={handleSendSupport}
                  disabled={supportSending}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg disabled:opacity-60"
                >
                  {supportSending ? 'Отправляем...' : 'Отправить в поддержку'}
                </button>
              </div>
            </div>
          </div>
        )}

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
                        <h2 className="text-2xl font-bold text-gray-900">Детали заказа</h2>
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
                          Маршрут
                        </p>
                        <p className="font-semibold text-gray-900 text-lg leading-tight">
                          {(outbound?.origin || selectedOrder.origin) || 'N/A'} → {(outbound?.destination || selectedOrder.destination) || 'N/A'}
                        </p>
                        {(outbound?.originCode || outbound?.destinationCode) && (
                          <p className="text-xs text-gray-500 mt-1">
                            {(outbound?.originCode || 'N/A')}-{(outbound?.destinationCode || 'N/A')}
                          </p>
                        )}
                        <p className="text-sm text-gray-600 mt-1">
                          {(outbound?.airline || selectedOrder.airline_name || selectedOrder.airline_code || 'N/A')} • {(outbound?.flightNumber || selectedOrder.flight_number || 'N/A')}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">Вылет: {outbound?.departure || selectedOrder.departure_time || 'N/A'}</p>
                        <p className="text-sm text-gray-600">Прилет: {outbound?.arrival || selectedOrder.arrival_time || 'N/A'}</p>
                      </div>

                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                          <Ticket size={14} />
                          Заказ
                        </p>
                        <p className="font-semibold text-gray-900 text-lg">
                          {selectedOrder.total_price} {selectedOrder.currency || 'UAH'}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          Статус: {getStatusConfig(normalizeStatus(selectedOrder.status)).label}
                        </p>
                        <p className="text-sm text-gray-600">
                          Создан: {selectedOrder.created_at ? new Date(selectedOrder.created_at).toLocaleString('ru-RU') : 'N/A'}
                        </p>
                      </div>

                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <p className="text-xs text-gray-500">Контакты</p>
                        <p className="text-sm text-gray-800">{selectedOrder.contact_email || 'N/A'}</p>
                        <p className="text-sm text-gray-800">{selectedOrder.contact_phone || 'N/A'}</p>
                        <p className="text-xs text-gray-500 mt-2">User ID: {selectedOrder.user_id || 'N/A'}</p>
                      </div>
                    </div>

                    {returnLeg && (
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 mb-4">
                        <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                          <MapPin size={14} />
                          Обратный маршрут
                        </p>
                        <p className="font-semibold text-gray-900 text-lg leading-tight">
                          {returnLeg.origin || 'N/A'} → {returnLeg.destination || 'N/A'}
                        </p>
                        {(returnLeg?.originCode || returnLeg?.destinationCode) && (
                          <p className="text-xs text-gray-500 mt-1">
                            {(returnLeg?.originCode || 'N/A')}-{(returnLeg?.destinationCode || 'N/A')}
                          </p>
                        )}
                        <p className="text-sm text-gray-600 mt-1">
                          {returnLeg.airline || 'N/A'} • {returnLeg.flightNumber || 'N/A'}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">Вылет: {returnLeg.departure || 'N/A'}</p>
                        <p className="text-sm text-gray-600">Прилет: {returnLeg.arrival || 'N/A'}</p>
                      </div>
                    )}

                    <button
                      onClick={() => setSelectedOrder(null)}
                      className="mt-5 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-all"
                    >
                      Закрыть
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
