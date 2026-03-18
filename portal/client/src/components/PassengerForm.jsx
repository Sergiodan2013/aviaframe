import { useMemo, useState } from 'react';
import { User, Calendar, Briefcase, ArrowRight, Phone, Mail, Globe } from 'lucide-react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { useTranslation } from '../i18n/index.jsx';

function buildPassengers(counts) {
  const adults = Math.max(1, Number(counts?.adults || 1));
  const children = Math.max(0, Number(counts?.children || 0));
  const infants = Math.max(0, Number(counts?.infants || 0));

  const pax = [];
  for (let i = 0; i < adults; i += 1) pax.push({ type: 'ADT' });
  for (let i = 0; i < children; i += 1) pax.push({ type: 'CHD' });
  for (let i = 0; i < infants; i += 1) pax.push({ type: 'INF' });

  return pax.map((p, idx) => ({
    id: `${p.type}-${idx + 1}`,
    type: p.type,
    gender: 'male',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    passportNumber: '',
    passportExpiry: '',
    nationality: 'SA'
  }));
}

function getPassengerLabel(passenger, index) {
  const groupLabel = passenger.type === 'ADT' ? 'Adult' : passenger.type === 'CHD' ? 'Child' : 'Infant';
  return `${groupLabel} ${index + 1}`;
}

function isAdult(passenger) {
  return passenger.type === 'ADT';
}

function isChild(passenger) {
  return passenger.type === 'CHD';
}

function isInfant(passenger) {
  return passenger.type === 'INF';
}

function validateAgeByType(type, dateOfBirth) {
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return 'Please enter a valid date of birth';

  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age -= 1;

  if (age < 0 || age > 120) return 'Please enter a valid date of birth';
  if (type === 'ADT' && age < 12) return 'Adult must be at least 12 years old';
  if (type === 'CHD' && (age < 2 || age > 11)) return 'Child must be 2-11 years old';
  if (type === 'INF' && age >= 2) return 'Infant must be under 2 years old';
  return null;
}

export default function PassengerForm({ selectedOffer, onSubmit, onBack, userEmail, passengerCounts, isLoading }) {
  const { t } = useTranslation();
  const initialPassengers = useMemo(() => buildPassengers(passengerCounts), [passengerCounts]);

  const [formData, setFormData] = useState({
    email: userEmail || '',
    phone: '+966',
    baggage: 'none',
    passengers: initialPassengers
  });

  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handlePassengerChange = (index, field, value) => {
    setFormData((prev) => {
      const nextPassengers = [...prev.passengers];
      nextPassengers[index] = { ...nextPassengers[index], [field]: value };
      return { ...prev, passengers: nextPassengers };
    });

    const key = `passengers.${index}.${field}`;
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.phone || formData.phone.length < 10) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    formData.passengers.forEach((p, index) => {
      if (!p.firstName.trim()) newErrors[`passengers.${index}.firstName`] = 'First name is required';
      if (!p.lastName.trim()) newErrors[`passengers.${index}.lastName`] = 'Last name is required';
      if (!p.dateOfBirth) {
        newErrors[`passengers.${index}.dateOfBirth`] = 'Date of birth is required';
      } else {
        const ageError = validateAgeByType(p.type, p.dateOfBirth);
        if (ageError) newErrors[`passengers.${index}.dateOfBirth`] = ageError;
      }

      if (!p.passportNumber.trim()) {
        newErrors[`passengers.${index}.passportNumber`] = 'Passport number is required';
      } else if (p.passportNumber.length < 6) {
        newErrors[`passengers.${index}.passportNumber`] = 'Passport number must be at least 6 characters';
      }

      if (!p.passportExpiry) {
        newErrors[`passengers.${index}.passportExpiry`] = 'Passport expiry date is required';
      } else {
        const expiry = new Date(p.passportExpiry);
        const today = new Date();
        const sixMonthsFromNow = new Date();
        sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

        if (expiry < today) {
          newErrors[`passengers.${index}.passportExpiry`] = 'Passport has expired';
        } else if (expiry < sixMonthsFromNow) {
          newErrors[`passengers.${index}.passportExpiry`] = 'Passport must be valid for at least 6 months';
        }
      }

      if (!p.nationality) {
        newErrors[`passengers.${index}.nationality`] = 'Nationality is required';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      onSubmit?.(formData);
    }
  };

  const getBaggagePrice = () => {
    const prices = {
      none: 0,
      '20kg': 500,
      '30kg': 750
    };
    return prices[formData.baggage] || 0;
  };

  const currency = selectedOffer?.price?.currency || 'UAH';

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="mb-8">
            <div className="relative inline-block">
              <div className="w-32 h-32 mx-auto">
                <div className="w-full h-full border-8 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              </div>
            </div>
          </div>

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

      <div className="bg-white rounded-lg shadow-md p-8 border border-gray-200">
        <div className="flex items-center gap-3 mb-6">
          <User className="text-blue-600" size={28} />
          <h2 className="text-2xl font-bold text-gray-900">Passenger Details</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Mail size={20} className="text-blue-600" />
              {t('passenger.contactInfo')}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('passenger.email')} *
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

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <User size={20} className="text-blue-600" />
              Passengers ({formData.passengers.length})
            </h3>

            <div className="space-y-6">
              {formData.passengers.map((passenger, index) => (
                <div key={passenger.id} className="rounded-lg border border-gray-200 p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <h4 className="font-semibold text-gray-900">{getPassengerLabel(passenger, index)}</h4>
                    <span className="text-xs rounded-full bg-gray-100 px-2 py-1 text-gray-600">{passenger.type}</span>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-3">Gender *</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={`gender_${passenger.id}`}
                          value="male"
                          checked={passenger.gender === 'male'}
                          onChange={(e) => handlePassengerChange(index, 'gender', e.target.value)}
                          className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-gray-700">Male</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={`gender_${passenger.id}`}
                          value="female"
                          checked={passenger.gender === 'female'}
                          onChange={(e) => handlePassengerChange(index, 'gender', e.target.value)}
                          className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-gray-700">Female</span>
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('passenger.firstName')} *</label>
                      <input
                        type="text"
                        value={passenger.firstName}
                        onChange={(e) => handlePassengerChange(index, 'firstName', e.target.value)}
                        className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-200 outline-none transition-all ${
                          errors[`passengers.${index}.firstName`] ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'
                        }`}
                        placeholder="John"
                      />
                      {errors[`passengers.${index}.firstName`] && (
                        <p className="text-red-600 text-sm mt-1">{errors[`passengers.${index}.firstName`]}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('passenger.lastName')} *</label>
                      <input
                        type="text"
                        value={passenger.lastName}
                        onChange={(e) => handlePassengerChange(index, 'lastName', e.target.value)}
                        className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-200 outline-none transition-all ${
                          errors[`passengers.${index}.lastName`] ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'
                        }`}
                        placeholder="Doe"
                      />
                      {errors[`passengers.${index}.lastName`] && (
                        <p className="text-red-600 text-sm mt-1">{errors[`passengers.${index}.lastName`]}</p>
                      )}
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="inline mr-2" size={16} />
                      {t('passenger.dob')} *
                    </label>
                    <input
                      type="date"
                      value={passenger.dateOfBirth}
                      onChange={(e) => handlePassengerChange(index, 'dateOfBirth', e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                      className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-200 outline-none transition-all ${
                        errors[`passengers.${index}.dateOfBirth`] ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'
                      }`}
                    />
                    {errors[`passengers.${index}.dateOfBirth`] && (
                      <p className="text-red-600 text-sm mt-1">{errors[`passengers.${index}.dateOfBirth`]}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('passenger.passport')} *</label>
                      <input
                        type="text"
                        value={passenger.passportNumber}
                        onChange={(e) => handlePassengerChange(index, 'passportNumber', e.target.value.toUpperCase())}
                        className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-200 outline-none transition-all ${
                          errors[`passengers.${index}.passportNumber`] ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'
                        }`}
                        placeholder="AB123456"
                      />
                      {errors[`passengers.${index}.passportNumber`] && (
                        <p className="text-red-600 text-sm mt-1">{errors[`passengers.${index}.passportNumber`]}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('passenger.expiry')} *</label>
                      <input
                        type="date"
                        value={passenger.passportExpiry}
                        onChange={(e) => handlePassengerChange(index, 'passportExpiry', e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-200 outline-none transition-all ${
                          errors[`passengers.${index}.passportExpiry`] ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'
                        }`}
                      />
                      {errors[`passengers.${index}.passportExpiry`] && (
                        <p className="text-red-600 text-sm mt-1">{errors[`passengers.${index}.passportExpiry`]}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Globe className="inline mr-2" size={16} />
                      {t('passenger.nationality')} *
                    </label>
                    <select
                      value={passenger.nationality}
                      onChange={(e) => handlePassengerChange(index, 'nationality', e.target.value)}
                      className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-200 outline-none transition-all ${
                        errors[`passengers.${index}.nationality`] ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'
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
                    {errors[`passengers.${index}.nationality`] && (
                      <p className="text-red-600 text-sm mt-1">{errors[`passengers.${index}.nationality`]}</p>
                    )}
                  </div>

                  {isAdult(passenger) && <div className="mt-3 text-xs text-gray-500">Type: Adult (12+)</div>}
                  {isChild(passenger) && <div className="mt-3 text-xs text-gray-500">Type: Child (2-11)</div>}
                  {isInfant(passenger) && <div className="mt-3 text-xs text-gray-500">Type: Infant (&lt;2)</div>}
                </div>
              ))}
            </div>
          </div>

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

          <div className="flex gap-4 pt-4">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
              >
                {t('passenger.back')}
              </button>
            )}
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-3 px-6 rounded-lg transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              {t('passenger.bookNow')}
              <ArrowRight size={20} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
