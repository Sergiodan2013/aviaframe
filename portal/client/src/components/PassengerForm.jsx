import { useState } from 'react';
import { User, Calendar, CreditCard, Briefcase, ArrowRight, Phone, Mail, Globe } from 'lucide-react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import LoadingScreen from './LoadingScreen';

export default function PassengerForm({ selectedOffer, onSubmit, onBack, userEmail, isLoading }) {
  const [formData, setFormData] = useState({
    // Contact
    email: userEmail || '',
    phone: '+966', // Default Saudi Arabia

    // Personal
    gender: 'male',
    firstName: '',
    lastName: '',
    dateOfBirth: '',

    // Document
    passportNumber: '',
    passportExpiry: '',
    nationality: 'SA', // Default Saudi Arabia

    // Travel
    baggage: 'none'
  });

  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    // Phone validation
    if (!formData.phone || formData.phone.length < 10) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    // Name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    // Date of birth validation
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    } else {
      const dob = new Date(formData.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      if (age < 18) {
        newErrors.dateOfBirth = 'Passenger must be at least 18 years old';
      }
      if (age > 120) {
        newErrors.dateOfBirth = 'Please enter a valid date of birth';
      }
    }

    // Passport validation
    if (!formData.passportNumber.trim()) {
      newErrors.passportNumber = 'Passport number is required';
    } else if (formData.passportNumber.length < 6) {
      newErrors.passportNumber = 'Passport number must be at least 6 characters';
    }

    if (!formData.passportExpiry) {
      newErrors.passportExpiry = 'Passport expiry date is required';
    } else {
      const expiry = new Date(formData.passportExpiry);
      const today = new Date();
      // Passport must be valid for at least 6 months
      const sixMonthsFromNow = new Date();
      sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

      if (expiry < today) {
        newErrors.passportExpiry = 'Passport has expired';
      } else if (expiry < sixMonthsFromNow) {
        newErrors.passportExpiry = 'Passport must be valid for at least 6 months';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      onSubmit?.(formData);
    }
  };

  // Get baggage price based on selection
  const getBaggagePrice = () => {
    const prices = {
      none: 0,
      '20kg': 500,
      '30kg': 750
    };
    return prices[formData.baggage] || 0;
  };

  const currency = selectedOffer?.price?.currency || 'UAH';

  // Show loading screen during order creation
  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          {/* Spinner Animation */}
          <div className="mb-8">
            <div className="relative inline-block">
              {/* Rotating circle */}
              <div className="w-32 h-32 mx-auto">
                <div className="w-full h-full border-8 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              </div>
            </div>
          </div>

          {/* Text */}
          <h3 className="text-2xl font-bold text-gray-800 mb-3">
            Order in Progress
          </h3>
          <p className="text-gray-600 mb-2">
            Creating your booking...
          </p>
          <p className="text-sm text-gray-500">
            Please wait, this may take a few moments
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Flight Summary */}
      {selectedOffer && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Selected Flight</h3>
              <div className="flex items-center gap-4 text-gray-600">
                <span className="text-2xl font-bold">{selectedOffer.origin} → {selectedOffer.destination}</span>
                <span className="text-sm">{selectedOffer.airline_name}</span>
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Departure: {selectedOffer.departure_time} | Arrival: {selectedOffer.arrival_time}
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600">
                {selectedOffer.price?.total?.toFixed(0)} {currency}
              </div>
              <div className="text-sm text-gray-500">per person</div>
            </div>
          </div>
        </div>
      )}

      {/* Passenger Form */}
      <div className="bg-white rounded-lg shadow-md p-8 border border-gray-200">
        <div className="flex items-center gap-3 mb-6">
          <User className="text-blue-600" size={28} />
          <h2 className="text-2xl font-bold text-gray-900">Passenger Details</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Contact Information */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Mail size={20} className="text-blue-600" />
              Contact Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-200 outline-none transition-all ${
                    errors.email ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'
                  }`}
                  placeholder="john.doe@example.com"
                />
                {errors.email && (
                  <p className="text-red-600 text-sm mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="inline mr-2" size={16} />
                  Phone Number *
                </label>
                <PhoneInput
                  international
                  defaultCountry="SA"
                  value={formData.phone}
                  onChange={(value) => handleChange('phone', value)}
                  className={`w-full ${errors.phone ? 'phone-input-error' : ''}`}
                />
                {errors.phone && (
                  <p className="text-red-600 text-sm mt-1">{errors.phone}</p>
                )}
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <User size={20} className="text-blue-600" />
              Personal Information
            </h3>

            {/* Gender */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Gender *
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    value="male"
                    checked={formData.gender === 'male'}
                    onChange={(e) => handleChange('gender', e.target.value)}
                    className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">Male</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    value="female"
                    checked={formData.gender === 'female'}
                    onChange={(e) => handleChange('gender', e.target.value)}
                    className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">Female</span>
                </label>
              </div>
            </div>
          </div>

          {/* Name fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                First Name *
              </label>
              <input
                type="text"
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-200 outline-none transition-all ${
                  errors.firstName ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'
                }`}
                placeholder="John"
              />
              {errors.firstName && (
                <p className="text-red-600 text-sm mt-1">{errors.firstName}</p>
              )}
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                Last Name *
              </label>
              <input
                type="text"
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-200 outline-none transition-all ${
                  errors.lastName ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'
                }`}
                placeholder="Doe"
              />
              {errors.lastName && (
                <p className="text-red-600 text-sm mt-1">{errors.lastName}</p>
              )}
            </div>
          </div>

          {/* Date of Birth */}
          <div>
            <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline mr-2" size={16} />
              Date of Birth *
            </label>
            <input
              type="date"
              id="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={(e) => handleChange('dateOfBirth', e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-200 outline-none transition-all ${
                errors.dateOfBirth ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'
              }`}
            />
            {errors.dateOfBirth && (
              <p className="text-red-600 text-sm mt-1">{errors.dateOfBirth}</p>
            )}
          </div>

          {/* Passport Details */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <CreditCard size={20} className="text-blue-600" />
              Passport Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="passportNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  Passport Number *
                </label>
                <input
                  type="text"
                  id="passportNumber"
                  value={formData.passportNumber}
                  onChange={(e) => handleChange('passportNumber', e.target.value.toUpperCase())}
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-200 outline-none transition-all ${
                    errors.passportNumber ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'
                  }`}
                  placeholder="AB123456"
                />
                {errors.passportNumber && (
                  <p className="text-red-600 text-sm mt-1">{errors.passportNumber}</p>
                )}
              </div>

              <div>
                <label htmlFor="passportExpiry" className="block text-sm font-medium text-gray-700 mb-2">
                  Expiry Date *
                </label>
                <input
                  type="date"
                  id="passportExpiry"
                  value={formData.passportExpiry}
                  onChange={(e) => handleChange('passportExpiry', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-200 outline-none transition-all ${
                    errors.passportExpiry ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'
                  }`}
                />
                {errors.passportExpiry && (
                  <p className="text-red-600 text-sm mt-1">{errors.passportExpiry}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="nationality" className="block text-sm font-medium text-gray-700 mb-2">
                <Globe className="inline mr-2" size={16} />
                Nationality *
              </label>
              <select
                id="nationality"
                value={formData.nationality}
                onChange={(e) => handleChange('nationality', e.target.value)}
                className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-200 outline-none transition-all ${
                  errors.nationality ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'
                }`}
              >
                <option value="SA">Saudi Arabia</option>
                <option value="AE">United Arab Emirates</option>
                <option value="QA">Qatar</option>
                <option value="KW">Kuwait</option>
                <option value="BH">Bahrain</option>
                <option value="OM">Oman</option>
                <option value="EG">Egypt</option>
                <option value="JO">Jordan</option>
                <option value="LB">Lebanon</option>
                <option value="US">United States</option>
                <option value="GB">United Kingdom</option>
                <option value="CA">Canada</option>
                <option value="AU">Australia</option>
                <option value="DE">Germany</option>
                <option value="FR">France</option>
                <option value="IT">Italy</option>
                <option value="ES">Spain</option>
                <option value="RU">Russia</option>
                <option value="CN">China</option>
                <option value="IN">India</option>
                <option value="PK">Pakistan</option>
                <option value="BD">Bangladesh</option>
                <option value="PH">Philippines</option>
                <option value="ID">Indonesia</option>
              </select>
              {errors.nationality && (
                <p className="text-red-600 text-sm mt-1">{errors.nationality}</p>
              )}
            </div>
          </div>

          {/* Baggage Selection */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Briefcase size={20} className="text-blue-600" />
              Baggage Options
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { value: 'none', label: 'No Baggage', price: 0, desc: 'Carry-on only (8kg)' },
                { value: '20kg', label: '20kg Checked', price: 500, desc: 'Standard bag' },
                { value: '30kg', label: '30kg Checked', price: 750, desc: 'Extra baggage' }
              ].map((option) => (
                <label
                  key={option.value}
                  className={`relative flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.baggage === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-blue-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="baggage"
                    value={option.value}
                    checked={formData.baggage === option.value}
                    onChange={(e) => handleChange('baggage', e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-gray-800">{option.label}</span>
                    {formData.baggage === option.value && (
                      <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <span className="text-sm text-gray-600 mb-2">{option.desc}</span>
                  <span className="text-blue-600 font-bold">
                    {option.price === 0 ? 'Free' : `+${option.price} ${currency}`}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Total Price */}
          {getBaggagePrice() > 0 && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Total Price (including baggage):</span>
                <span className="text-2xl font-bold text-blue-600">
                  {((selectedOffer?.price?.total || 0) + getBaggagePrice()).toFixed(0)} {currency}
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
            )}
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-3 px-6 rounded-lg transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              Book now
              <ArrowRight size={20} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
