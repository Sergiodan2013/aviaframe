import { useState } from 'react';
import { CreditCard, Lock, CheckCircle, Plane, User, Briefcase, ArrowLeft } from 'lucide-react';

export default function PaymentScreen({ selectedOffer, passengerData, onBack, onPaymentSuccess }) {
  const [cardData, setCardData] = useState({
    cardNumber: '',
    cardHolder: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: ''
  });

  const [errors, setErrors] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);

  // Generate order number
  const orderNumber = `AVF${Date.now().toString().slice(-8)}`;

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

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

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

    if (!validateForm()) {
      return;
    }

    setIsProcessing(true);

    try {
      // TODO: Implement actual payment processing
      console.log('Processing payment...', {
        orderNumber,
        cardData,
        passengerData,
        offer: selectedOffer
      });

      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Save booking to localStorage
      const booking = {
        orderNumber,
        offer: selectedOffer,
        passenger: passengerData,
        payment: {
          cardLastFour: cardData.cardNumber.slice(-4),
          timestamp: new Date().toISOString()
        },
        totalAmount: getTotalPrice(),
        status: 'confirmed'
      };

      localStorage.setItem('lastBooking', JSON.stringify(booking));

      // Success!
      onPaymentSuccess?.(booking);
    } catch (error) {
      console.error('Payment failed:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Calculate prices
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

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 sticky top-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>

            {/* Order Number */}
            <div className="bg-blue-50 rounded-lg p-3 mb-4 border border-blue-200">
              <div className="text-xs text-gray-600 mb-1">Order Number</div>
              <div className="text-lg font-bold text-blue-600">{orderNumber}</div>
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
                  <span className="font-semibold">Passenger</span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="font-semibold">
                    {passengerData.firstName} {passengerData.lastName}
                  </div>
                  <div className="text-gray-600">DOB: {passengerData.dateOfBirth}</div>
                  <div className="text-gray-600">Passport: {passengerData.passportNumber}</div>
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
          </div>
        </div>

        {/* Right Column - Payment Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-8 border border-gray-200">
            <div className="flex items-center gap-3 mb-6">
              <CreditCard className="text-blue-600" size={28} />
              <h2 className="text-2xl font-bold text-gray-900">Payment Details</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Card Number */}
              <div>
                <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  Card Number *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="cardNumber"
                    value={cardData.cardNumber}
                    onChange={(e) => handleChange('cardNumber', e.target.value)}
                    placeholder="1234 5678 9012 3456"
                    className={`w-full px-4 py-3 pl-12 border-2 rounded-lg focus:ring-2 focus:ring-blue-200 outline-none transition-all ${
                      errors.cardNumber ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'
                    }`}
                    disabled={isProcessing}
                  />
                  <CreditCard className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                </div>
                {errors.cardNumber && (
                  <p className="text-red-600 text-sm mt-1">{errors.cardNumber}</p>
                )}
              </div>

              {/* Card Holder */}
              <div>
                <label htmlFor="cardHolder" className="block text-sm font-medium text-gray-700 mb-2">
                  Cardholder Name *
                </label>
                <input
                  type="text"
                  id="cardHolder"
                  value={cardData.cardHolder}
                  onChange={(e) => handleChange('cardHolder', e.target.value.toUpperCase())}
                  placeholder="JOHN DOE"
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-200 outline-none transition-all ${
                    errors.cardHolder ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'
                  }`}
                  disabled={isProcessing}
                />
                {errors.cardHolder && (
                  <p className="text-red-600 text-sm mt-1">{errors.cardHolder}</p>
                )}
              </div>

              {/* Expiry & CVV */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label htmlFor="expiryMonth" className="block text-sm font-medium text-gray-700 mb-2">
                    Month *
                  </label>
                  <input
                    type="text"
                    id="expiryMonth"
                    value={cardData.expiryMonth}
                    onChange={(e) => handleChange('expiryMonth', e.target.value)}
                    placeholder="MM"
                    maxLength={2}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-200 outline-none transition-all text-center ${
                      errors.expiryMonth ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'
                    }`}
                    disabled={isProcessing}
                  />
                  {errors.expiryMonth && (
                    <p className="text-red-600 text-xs mt-1">{errors.expiryMonth}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="expiryYear" className="block text-sm font-medium text-gray-700 mb-2">
                    Year *
                  </label>
                  <input
                    type="text"
                    id="expiryYear"
                    value={cardData.expiryYear}
                    onChange={(e) => handleChange('expiryYear', e.target.value)}
                    placeholder="YY"
                    maxLength={2}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-200 outline-none transition-all text-center ${
                      errors.expiryYear ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'
                    }`}
                    disabled={isProcessing}
                  />
                  {errors.expiryYear && (
                    <p className="text-red-600 text-xs mt-1">{errors.expiryYear}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="cvv" className="block text-sm font-medium text-gray-700 mb-2">
                    CVV *
                  </label>
                  <input
                    type="text"
                    id="cvv"
                    value={cardData.cvv}
                    onChange={(e) => handleChange('cvv', e.target.value)}
                    placeholder="123"
                    maxLength={3}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-200 outline-none transition-all text-center ${
                      errors.cvv ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'
                    }`}
                    disabled={isProcessing}
                  />
                  {errors.cvv && (
                    <p className="text-red-600 text-xs mt-1">{errors.cvv}</p>
                  )}
                </div>
              </div>

              {/* Security Notice */}
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-start gap-3">
                  <Lock className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
                  <div className="text-sm text-green-800">
                    <div className="font-semibold mb-1">Secure Payment</div>
                    Your payment information is encrypted and secure. We never store your full card details.
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={onBack}
                  disabled={isProcessing}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <ArrowLeft size={20} />
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-semibold py-3 px-6 rounded-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={20} />
                      Pay {getTotalPrice().toFixed(0)} {currency}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
