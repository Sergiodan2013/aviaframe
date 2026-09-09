import { useEffect, useMemo, useState } from 'react';
import { CreditCard, Lock, CheckCircle, Plane, User, Briefcase, ArrowLeft } from 'lucide-react';
import { buildPassengerSummary, countPassengersByType } from '../lib/passengerBooking';
import { buildPaymentReturnUrl, buildTamaraReturnUrls, shouldOfferTamara } from '../lib/checkoutFlow';
import { Alert, Button, Field, Surface } from '@aviaframe/ui';

export default function PaymentScreen({ selectedOffer, passengerData, orderId, orderNumber, onBack, onPaymentSuccess, isDevMockMode = false }) {
  const [cardData, setCardData] = useState({
    cardNumber: '',
    cardHolder: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: ''
  });

  const [errors, setErrors] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('card');
  const [tamaraConfig, setTamaraConfig] = useState({
    isLoading: false,
    enabled: false,
    publicKey: '',
    environment: 'sandbox',
  });

  const handleChange = (field, value) => {
    let processedValue = value;

    // Format card number with spaces
    if (field === 'cardNumber') {
      processedValue = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
      if (processedValue.replace(/\s/g, '').length > 16) return;
    }

    // Only numbers for CVV
    if (field === 'cvv') {
      processedValue = value.replace(/\D/g, '');
      if (processedValue.length > 3) return;
    }

    // Only numbers for expiry
    if (field === 'expiryMonth' || field === 'expiryYear') {
      processedValue = value.replace(/\D/g, '');
    }

    setCardData(prev => ({ ...prev, [field]: processedValue }));
    setPaymentError('');

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const getBaggagePrice = () => {
    const prices = {
      none: 0,
      '20kg': 500,
      '30kg': 750
    };
    return prices[passengerData?.baggage] || 0;
  };

  const getTicketPrice = () => selectedOffer?.price?.total || 0;
  const getTaxes = () => selectedOffer?.price?.taxes || 0;
  const getTotalPrice = () => getTicketPrice() + getBaggagePrice();

  const currency = selectedOffer?.price?.currency || 'UAH';
  const passengerList = Array.isArray(passengerData?.passengers) ? passengerData.passengers : [];
  const passengerCounts = countPassengersByType(passengerList);
  const passengerSummary = buildPassengerSummary(passengerList);
  const isTamaraAvailable = useMemo(
    () => shouldOfferTamara({ tamaraEnabled: tamaraConfig.enabled, currency }),
    [tamaraConfig.enabled, currency]
  );

  useEffect(() => {
    let isMounted = true;

    if (isDevMockMode) {
      return undefined;
    }

    const loadTamaraConfig = async () => {
      setTamaraConfig((prev) => ({ ...prev, isLoading: true }));
      try {
        const response = await fetch('/api/backend/payments/tamara/config');
        if (!response.ok) {
          throw new Error(`Tamara config failed: ${response.status}`);
        }

        const result = await response.json();
        if (!isMounted) return;

        setTamaraConfig({
          isLoading: false,
          enabled: Boolean(result?.enabled),
          publicKey: String(result?.public_key || ''),
          environment: String(result?.environment || 'sandbox'),
        });
      } catch (error) {
        console.warn('Tamara config unavailable:', error);
        if (!isMounted) return;
        setTamaraConfig({
          isLoading: false,
          enabled: false,
          publicKey: '',
          environment: 'sandbox',
        });
      }
    };

    loadTamaraConfig();

    return () => {
      isMounted = false;
    };
  }, [isDevMockMode]);

  const validateForm = () => {
    const newErrors = {};

    // Card number validation
    const cardNumberClean = cardData.cardNumber.replace(/\s/g, '');
    if (!cardNumberClean) {
      newErrors.cardNumber = 'Card number is required';
    } else if (cardNumberClean.length !== 16) {
      newErrors.cardNumber = 'Card number must be 16 digits';
    }

    // Card holder validation
    if (!cardData.cardHolder.trim()) {
      newErrors.cardHolder = 'Cardholder name is required';
    }

    // Expiry validation
    if (!cardData.expiryMonth) {
      newErrors.expiryMonth = 'Required';
    } else if (parseInt(cardData.expiryMonth) < 1 || parseInt(cardData.expiryMonth) > 12) {
      newErrors.expiryMonth = 'Invalid month';
    }

    if (!cardData.expiryYear) {
      newErrors.expiryYear = 'Required';
    } else if (cardData.expiryYear.length !== 2) {
      newErrors.expiryYear = 'YY format';
    }

    // CVV validation
    if (!cardData.cvv) {
      newErrors.cvv = 'CVV required';
    } else if (cardData.cvv.length < 3) {
      newErrors.cvv = '3 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!orderId) {
      alert('Order ID is missing. Please go back and try again.');
      return;
    }

    setIsProcessing(true);
    setPaymentError('');

    try {
      if (isDevMockMode) {
        await new Promise((resolve) => setTimeout(resolve, 400));
        onPaymentSuccess?.({ status: 'paid', payment_id: `mock-payment-${Date.now()}` });
        return;
      }

      const currentLocation = typeof window !== 'undefined' ? window.location : null;

      if (selectedMethod === 'tamara') {
        const returnUrls = buildTamaraReturnUrls(currentLocation, orderId);
        const pendingBookingSnapshot = {
          orderId,
          orderNumber,
          bookingReference: orderNumber || orderId,
          status: 'pending_payment',
          offer: selectedOffer,
          passengerParty: passengerData,
          totalPrice: getTotalPrice(),
          currency,
        };
        const pendingPayload = JSON.stringify(pendingBookingSnapshot);
        localStorage.setItem('tamaraPendingBooking', pendingPayload);
        sessionStorage.setItem('tamaraPendingBooking', pendingPayload);

        const tamaraResponse = await fetch('/api/backend/payments/tamara/checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order_id: orderId,
            language: typeof document !== 'undefined' && document.documentElement?.lang === 'ar' ? 'ar' : 'en',
            ...returnUrls,
          }),
        });

        const tamaraResult = await tamaraResponse.json();

        if (!tamaraResponse.ok) {
          throw new Error(tamaraResult?.error?.message || 'Tamara checkout failed');
        }

        if (!tamaraResult?.checkout_url) {
          throw new Error('Tamara checkout URL is missing');
        }

        window.location.href = tamaraResult.checkout_url;
        return;
      }

      if (!validateForm()) {
        return;
      }

      const response = await fetch('/api/backend/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderId,
          return_url: buildPaymentReturnUrl(currentLocation),
          card: {
            name: cardData.cardHolder,
            number: cardData.cardNumber.replace(/\s/g, ''),
            month: cardData.expiryMonth,
            year: cardData.expiryYear,
            cvc: cardData.cvv,
          },
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error?.message || 'Payment failed');
      }

      if (result.status === 'paid') {
        onPaymentSuccess?.({ status: 'paid', payment_id: result.payment_id });
        return;
      }

      if (result.transaction_url) {
        window.location.href = result.transaction_url;
        return;
      }

      throw new Error('Unexpected payment response');
    } catch (err) {
      console.error('Payment failed:', err);
      setPaymentError(err.message || 'Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Order Summary */}
        <div className="lg:col-span-1">
          <Surface className="sticky top-4 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>

            {/* Order Number */}
            <div className="bg-blue-50 rounded-lg p-3 mb-4 border border-blue-200">
              <div className="text-xs text-gray-600 mb-1">Order Number</div>
              <div className="text-lg font-bold text-blue-600">{orderNumber || '—'}</div>
            </div>

            {/* Flight Info */}
            {selectedOffer && (
              <div className="mb-4 pb-4 border-b">
                <div className="flex items-center gap-2 text-blue-600 mb-2">
                  <Plane size={18} />
                  <span className="font-semibold">Flight Details</span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Route:</span>
                    <span className="font-semibold">{selectedOffer.origin} → {selectedOffer.destination}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Airline:</span>
                    <span className="font-semibold">{selectedOffer.airline_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Departure:</span>
                    <span className="font-semibold">{selectedOffer.departure_time}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Passenger Info */}
            {passengerData && (
              <div className="mb-4 pb-4 border-b">
                <div className="flex items-center gap-2 text-blue-600 mb-2">
                  <User size={18} />
                  <span className="font-semibold">Travelers</span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="font-semibold">
                    {passengerSummary || `${passengerList.length || 1} traveler`}
                  </div>
                  <div className="text-gray-600">
                    Adults: {passengerCounts.ADT || 0}
                    {passengerCounts.CHD ? ` · Children: ${passengerCounts.CHD}` : ''}
                    {passengerCounts.INF ? ` · Infants: ${passengerCounts.INF}` : ''}
                  </div>
                  {passengerList.slice(0, 3).map((passenger) => (
                    <div key={passenger.id || `${passenger.firstName}-${passenger.lastName}`} className="text-gray-600">
                      {passenger.firstName} {passenger.lastName} · {passenger.type}
                    </div>
                  ))}
                  {passengerList.length > 3 && (
                    <div className="text-gray-500">+{passengerList.length - 3} more traveler(s)</div>
                  )}
                </div>
              </div>
            )}

            {/* Baggage */}
            {passengerData && passengerData.baggage !== 'none' && (
              <div className="mb-4 pb-4 border-b">
                <div className="flex items-center gap-2 text-blue-600 mb-2">
                  <Briefcase size={18} />
                  <span className="font-semibold">Baggage</span>
                </div>
                <div className="text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{passengerData.baggage === '20kg' ? '20kg Checked' : '30kg Checked'}</span>
                    <span className="font-semibold">+{getBaggagePrice()} {currency}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Price Breakdown */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Ticket Price</span>
                <span className="font-semibold">{getTicketPrice().toFixed(0)} {currency}</span>
              </div>
              {getBaggagePrice() > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Baggage</span>
                  <span className="font-semibold">{getBaggagePrice().toFixed(0)} {currency}</span>
                </div>
              )}
              {getTaxes() > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Taxes & Fees</span>
                  <span className="font-semibold">{getTaxes().toFixed(0)} {currency}</span>
                </div>
              )}
            </div>

            {/* Total */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border-2 border-blue-200">
              <div className="flex justify-between items-center">
                <span className="text-gray-700 font-semibold">Total Amount</span>
                <span className="text-3xl font-bold text-blue-600">
                  {getTotalPrice().toFixed(0)} {currency}
                </span>
              </div>
            </div>
          </Surface>
        </div>

        {/* Right Column - Payment Form */}
        <div className="lg:col-span-2">
          <Surface className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <CreditCard className="text-blue-600" size={28} />
              <h2 className="text-2xl font-bold text-gray-900">Payment Details</h2>
            </div>

            {isDevMockMode && (
              <Alert tone="warning" className="mb-6">
                DEV mock payment mode is active. Submitting this form will simulate a successful payment locally and will not call a real payment gateway.
              </Alert>
            )}

            {paymentError && (
              <Alert className="mb-6">
                {paymentError}
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {isTamaraAvailable && (
                <div>
                  <div className="mb-3 block text-sm font-medium text-gray-700">
                    Payment Method
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMethod('card');
                        setPaymentError('');
                      }}
                      disabled={isProcessing}
                      className={`rounded-xl border-2 px-4 py-4 text-left transition-all ${
                        selectedMethod === 'card'
                          ? 'border-blue-500 bg-blue-50 shadow-sm'
                          : 'border-gray-200 bg-white hover:border-blue-200'
                      }`}
                    >
                      <div className="mb-2 flex items-center gap-3">
                        <CreditCard className="text-blue-600" size={20} />
                        <span className="font-semibold text-gray-900">Online Payment</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Pay now by card.
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMethod('tamara');
                        setPaymentError('');
                      }}
                      disabled={isProcessing}
                      className={`rounded-xl border-2 px-4 py-4 text-left transition-all ${
                        selectedMethod === 'tamara'
                          ? 'border-pink-500 bg-pink-50 shadow-sm'
                          : 'border-gray-200 bg-white hover:border-pink-200'
                      }`}
                    >
                      <div className="mb-2 flex items-center gap-3">
                        <img
                          src="https://cdn.tamara.co/assets/svg/tamara-logo-badge-en.svg"
                          alt="Tamara"
                          className="h-5 w-auto"
                        />
                        <span className="font-semibold text-gray-900">Pay with Tamara</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Instalments and buy now, pay later.
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {selectedMethod === 'tamara' && isTamaraAvailable && (
                <div className="rounded-lg border border-pink-200 bg-pink-50 p-4">
                  <div className="mb-1 font-semibold text-pink-800">Tamara checkout</div>
                  <div className="text-sm text-pink-700">
                    You will be redirected to Tamara to complete the payment and then returned here automatically.
                  </div>
                  <div className="mt-2 text-xs text-pink-600">
                    Available only for SAR orders. Environment: {tamaraConfig.environment}
                  </div>
                </div>
              )}

              {selectedMethod === 'card' && (
                <>
              {/* Card Number */}
              <Field htmlFor="cardNumber" label="Card Number *" error={errors.cardNumber}>
                <div className="relative">
                  <input
                    type="text"
                    id="cardNumber"
                    value={cardData.cardNumber}
                    onChange={(e) => handleChange('cardNumber', e.target.value)}
                    placeholder="1234 5678 9012 3456"
                    className={`af-input pl-12 ${errors.cardNumber ? 'af-input--invalid' : ''}`}
                    aria-invalid={Boolean(errors.cardNumber)}
                    disabled={isProcessing}
                  />
                  <CreditCard className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                </div>
              </Field>

              {/* Card Holder */}
              <Field htmlFor="cardHolder" label="Cardholder Name *" error={errors.cardHolder}>
                <input
                  type="text"
                  id="cardHolder"
                  value={cardData.cardHolder}
                  onChange={(e) => handleChange('cardHolder', e.target.value.toUpperCase())}
                  placeholder="JOHN DOE"
                  className={`af-input ${errors.cardHolder ? 'af-input--invalid' : ''}`}
                  aria-invalid={Boolean(errors.cardHolder)}
                  disabled={isProcessing}
                />
              </Field>

              {/* Expiry & CVV */}
              <div className="grid grid-cols-3 gap-4">
                <Field htmlFor="expiryMonth" label="Month *" error={errors.expiryMonth}>
                  <input
                    type="text"
                    id="expiryMonth"
                    value={cardData.expiryMonth}
                    onChange={(e) => handleChange('expiryMonth', e.target.value)}
                    placeholder="MM"
                    maxLength={2}
                    className={`af-input text-center ${errors.expiryMonth ? 'af-input--invalid' : ''}`}
                    aria-invalid={Boolean(errors.expiryMonth)}
                    disabled={isProcessing}
                  />
                </Field>

                <Field htmlFor="expiryYear" label="Year *" error={errors.expiryYear}>
                  <input
                    type="text"
                    id="expiryYear"
                    value={cardData.expiryYear}
                    onChange={(e) => handleChange('expiryYear', e.target.value)}
                    placeholder="YY"
                    maxLength={2}
                    className={`af-input text-center ${errors.expiryYear ? 'af-input--invalid' : ''}`}
                    aria-invalid={Boolean(errors.expiryYear)}
                    disabled={isProcessing}
                  />
                </Field>

                <Field htmlFor="cvv" label="CVV *" error={errors.cvv}>
                  <input
                    type="text"
                    id="cvv"
                    value={cardData.cvv}
                    onChange={(e) => handleChange('cvv', e.target.value)}
                    placeholder="123"
                    maxLength={3}
                    className={`af-input text-center ${errors.cvv ? 'af-input--invalid' : ''}`}
                    aria-invalid={Boolean(errors.cvv)}
                    disabled={isProcessing}
                  />
                </Field>
              </div>
                </>
              )}

              {/* Security Notice */}
              <div className={`rounded-lg border p-4 ${selectedMethod === 'tamara' ? 'border-pink-200 bg-pink-50' : 'border-green-200 bg-green-50'}`}>
                <div className="flex items-start gap-3">
                  <Lock className={`${selectedMethod === 'tamara' ? 'text-pink-600' : 'text-green-600'} flex-shrink-0 mt-0.5`} size={20} />
                  <div className={`text-sm ${selectedMethod === 'tamara' ? 'text-pink-800' : 'text-green-800'}`}>
                    <div className="font-semibold mb-1">
                      {selectedMethod === 'tamara' ? 'Secure Tamara Checkout' : 'Secure Payment'}
                    </div>
                    {selectedMethod === 'tamara'
                      ? 'Tamara completes the payment on its own secure checkout and returns the customer back to AviaFrame.'
                      : 'Your payment information is encrypted and secure. We never store your full card details.'}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  onClick={onBack}
                  disabled={isProcessing}
                  variant="secondary"
                >
                  <ArrowLeft size={20} />
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={isProcessing}
                  className="flex-1"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      {selectedMethod === 'tamara' ? 'Redirecting...' : 'Processing...'}
                    </>
                  ) : (
                    <>
                      <CheckCircle size={20} />
                      {selectedMethod === 'tamara'
                        ? `Continue with Tamara`
                        : `Pay ${getTotalPrice().toFixed(0)} ${currency}`}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Surface>
        </div>
      </div>
    </div>
  );
}
