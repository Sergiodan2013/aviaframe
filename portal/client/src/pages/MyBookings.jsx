import { useState, useEffect } from 'react';
import { Plane, Calendar, User, CreditCard, AlertCircle, CheckCircle, Clock, XCircle, ArrowLeft } from 'lucide-react';
import { supabase, getUserOrders } from '../lib/supabase';

export default function MyBookings({ user, onBackToHome }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user?.id) {
      loadOrders();
    }
  }, [user]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading orders for user:', user.id);
      const { data, error } = await getUserOrders(user.id);

      if (error) {
        console.error('❌ Error fetching orders:', error);
        throw error;
      }

      console.log('✅ Orders loaded:', data);
      console.log('📊 Total orders:', data?.length || 0);
      setOrders(data || []);
    } catch (err) {
      console.error('Error loading orders:', err);
      setError('Failed to load bookings. Please try again.');
    } finally {
      setLoading(false);
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
      failed: {
        icon: AlertCircle,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        label: 'Ошибка',
        action: null
      }
    };

    return configs[status] || configs.pending;
  };

  const handlePaymentInstructions = (order) => {
    alert(
      `Инструкция по оплате для заказа ${order.order_number}:\n\n` +
      `1. Переведите ${order.total_price} ${order.currency} на указанный счет\n` +
      `2. В комментарии укажите номер заказа: ${order.order_number}\n` +
      `3. После получения оплаты билеты будут выписаны\n\n` +
      `Контакты: ${order.contact_email}`
    );
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
              const statusConfig = getStatusConfig(order.status);
              const StatusIcon = statusConfig.icon;

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
                          <div className="flex items-center gap-2 mb-2">
                            <Plane size={20} className="text-blue-600" />
                            <span className="font-semibold text-lg text-gray-900">
                              {order.origin} → {order.destination}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            {order.airline_name} • {order.flight_number}
                          </p>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar size={18} className="text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {order.departure_time}
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
                          className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold py-2 px-4 rounded-lg transition-all text-sm"
                        >
                          Инструкция по оплате
                        </button>
                      )}
                      {statusConfig.action === 'ticket' && (
                        <button
                          className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-2 px-4 rounded-lg transition-all text-sm"
                        >
                          Скачать билет
                        </button>
                      )}
                      <button
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
      </div>
    </div>
  );
}
