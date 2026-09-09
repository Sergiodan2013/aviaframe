import { useState } from 'react';
import { User, Calendar, CreditCard, Briefcase, ArrowRight, Phone, Mail, Globe, Users } from 'lucide-react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import {
  buildInitialPassengerFormData,
  buildPassengerSummary,
  countPassengersByType,
  validatePassengerFormData,
} from '../lib/passengerBooking';
import { Alert, Button, Field, StatusBadge, Surface } from '@aviaframe/ui';

const NATIONALITY_OPTIONS = [
  ['SA', 'Saudi Arabia'],
  ['AE', 'United Arab Emirates'],
  ['QA', 'Qatar'],
  ['KW', 'Kuwait'],
  ['BH', 'Bahrain'],
  ['OM', 'Oman'],
  ['EG', 'Egypt'],
  ['JO', 'Jordan'],
  ['LB', 'Lebanon'],
  ['US', 'United States'],
  ['GB', 'United Kingdom'],
  ['CA', 'Canada'],
  ['AU', 'Australia'],
  ['DE', 'Germany'],
  ['FR', 'France'],
  ['IT', 'Italy'],
  ['ES', 'Spain'],
  ['RU', 'Russia'],
  ['CN', 'China'],
  ['IN', 'India'],
  ['PK', 'Pakistan'],
  ['BD', 'Bangladesh'],
  ['PH', 'Philippines'],
  ['ID', 'Indonesia'],
];

function hasErrors(errorState) {
  if (!errorState) return false;
  return Object.values(errorState).some((value) => {
    if (!value) return false;
    if (typeof value === 'string') return Boolean(value);
    if (typeof value === 'object') return hasErrors(value);
    return false;
  });
}

export default function PassengerForm({
  selectedOffer,
  passengerCounts,
  departureDate,
  initialFormData,
  onSubmit,
  onBack,
  userEmail,
  isLoading,
}) {
  const [formData, setFormData] = useState(() => initialFormData || buildInitialPassengerFormData(passengerCounts, userEmail));
  const [errors, setErrors] = useState({ contacts: {}, passengers: {}, global: {} });

  const handleContactChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      contacts: {
        ...prev.contacts,
        [field]: value,
      },
    }));

    if (errors.contacts?.[field]) {
      setErrors((prev) => ({
        ...prev,
        contacts: {
          ...prev.contacts,
          [field]: null,
        },
      }));
    }
  };

  const handlePassengerChange = (passengerId, field, value) => {
    setFormData((prev) => ({
      ...prev,
      passengers: prev.passengers.map((passenger) => (
        passenger.id === passengerId
          ? { ...passenger, [field]: value }
          : passenger
      )),
    }));

    if (errors.passengers?.[passengerId]?.[field]) {
      setErrors((prev) => ({
        ...prev,
        passengers: {
          ...prev.passengers,
          [passengerId]: {
            ...prev.passengers?.[passengerId],
            [field]: null,
          },
        },
      }));
    }
  };

  const handleBaggageChange = (value) => {
    setFormData((prev) => ({ ...prev, baggage: value }));
  };

  const validateForm = () => {
    const nextErrors = validatePassengerFormData(formData, { departureDate });
    setErrors(nextErrors);
    return !hasErrors(nextErrors);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (validateForm()) {
      onSubmit?.(formData);
    }
  };

  const getBaggagePrice = () => {
    const prices = {
      none: 0,
      '20kg': 500,
      '30kg': 750,
    };
    return prices[formData.baggage] || 0;
  };

  const currency = selectedOffer?.price?.currency || 'UAH';
  const passengerSummary = buildPassengerSummary(formData.passengers);
  const counts = countPassengersByType(formData.passengers);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <Surface className="p-12 text-center">
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
        </Surface>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {selectedOffer && (
        <Surface className="p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Selected Flight</h3>
              <div className="flex flex-wrap items-center gap-4 text-gray-600">
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
              <div className="text-sm text-gray-500">base fare</div>
            </div>
          </div>
        </Surface>
      )}

      <Surface className="p-8">
        <div className="flex items-center gap-3 mb-4">
          <Users className="text-blue-600" size={28} />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Passenger Details</h2>
            <p className="text-sm text-gray-500 mt-1">
              Complete the details for every traveler in this booking.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {counts.ADT > 0 && (
            <StatusBadge>
              {counts.ADT} adult{counts.ADT > 1 ? 's' : ''}
            </StatusBadge>
          )}
          {counts.CHD > 0 && (
            <StatusBadge tone="warning">
              {counts.CHD} child{counts.CHD > 1 ? 'ren' : ''}
            </StatusBadge>
          )}
          {counts.INF > 0 && (
            <StatusBadge tone="success">
              {counts.INF} infant{counts.INF > 1 ? 's' : ''}
            </StatusBadge>
          )}
          {passengerSummary && (
            <StatusBadge>
              {passengerSummary}
            </StatusBadge>
          )}
        </div>

        {errors.global?.passengers && (
          <Alert className="mb-6">
            {errors.global.passengers}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Mail size={20} className="text-blue-600" />
              Contact Information
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              We will use these details for booking confirmation, payment updates, and e-ticket delivery.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field htmlFor="email" label="Email Address *" error={errors.contacts?.email}>
                <input
                  type="email"
                  id="email"
                  value={formData.contacts.email}
                  onChange={(event) => handleContactChange('email', event.target.value)}
                  className={`af-input ${errors.contacts?.email ? 'af-input--invalid' : ''}`}
                  placeholder="john.doe@example.com"
                />
              </Field>

              <Field
                htmlFor="phone"
                label={<><Phone className="inline mr-2" size={16} />Phone Number *</>}
                error={errors.contacts?.phone}
              >
                <PhoneInput
                  id="phone"
                  international
                  defaultCountry="SA"
                  value={formData.contacts.phone}
                  onChange={(value) => handleContactChange('phone', value)}
                  className={`w-full ${errors.contacts?.phone ? 'phone-input-error' : ''}`}
                />
              </Field>
            </div>
          </div>

          <div className="space-y-6">
            {formData.passengers.map((passenger, index) => {
              const passengerErrors = errors.passengers?.[passenger.id] || {};
              return (
                <section key={passenger.id} className="rounded-2xl border border-gray-200 bg-gray-50/50 p-6">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-5">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <User size={18} className="text-blue-600" />
                        {passenger.label}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {passenger.description}
                      </p>
                    </div>
                    <span className="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600">
                      Traveler {index + 1} of {formData.passengers.length}
                    </span>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Gender *
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={`gender-${passenger.id}`}
                          value="male"
                          checked={passenger.gender === 'male'}
                          onChange={(event) => handlePassengerChange(passenger.id, 'gender', event.target.value)}
                          className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-gray-700">Male</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={`gender-${passenger.id}`}
                          value="female"
                          checked={passenger.gender === 'female'}
                          onChange={(event) => handlePassengerChange(passenger.id, 'gender', event.target.value)}
                          className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-gray-700">Female</span>
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label htmlFor={`firstName-${passenger.id}`} className="block text-sm font-medium text-gray-700 mb-2">
                        First Name *
                      </label>
                      <input
                        type="text"
                        id={`firstName-${passenger.id}`}
                        value={passenger.firstName}
                        onChange={(event) => handlePassengerChange(passenger.id, 'firstName', event.target.value)}
                        className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-200 outline-none transition-all ${
                          passengerErrors.firstName ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'
                        }`}
                        placeholder="John"
                      />
                      {passengerErrors.firstName && (
                        <p className="text-red-600 text-sm mt-1">{passengerErrors.firstName}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor={`lastName-${passenger.id}`} className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        id={`lastName-${passenger.id}`}
                        value={passenger.lastName}
                        onChange={(event) => handlePassengerChange(passenger.id, 'lastName', event.target.value)}
                        className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-200 outline-none transition-all ${
                          passengerErrors.lastName ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'
                        }`}
                        placeholder="Doe"
                      />
                      {passengerErrors.lastName && (
                        <p className="text-red-600 text-sm mt-1">{passengerErrors.lastName}</p>
                      )}
                    </div>
                  </div>

                  <div className="mb-6">
                    <label htmlFor={`dateOfBirth-${passenger.id}`} className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="inline mr-2" size={16} />
                      Date of Birth *
                    </label>
                    <input
                      type="date"
                      id={`dateOfBirth-${passenger.id}`}
                      value={passenger.dateOfBirth}
                      onChange={(event) => handlePassengerChange(passenger.id, 'dateOfBirth', event.target.value)}
                      min="1900-01-01"
                      max={new Date().toISOString().split('T')[0]}
                      className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-200 outline-none transition-all ${
                        passengerErrors.dateOfBirth ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'
                      }`}
                    />
                    {passengerErrors.dateOfBirth ? (
                      <p className="text-red-600 text-sm mt-1">{passengerErrors.dateOfBirth}</p>
                    ) : (
                      <p className="text-xs text-gray-500 mt-1">
                        Age will be checked against the departure date.
                      </p>
                    )}
                  </div>

                  <div className="border-t pt-6">
                    <h4 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <CreditCard size={18} className="text-blue-600" />
                      Passport Information
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label htmlFor={`passportNumber-${passenger.id}`} className="block text-sm font-medium text-gray-700 mb-2">
                          Passport Number *
                        </label>
                        <input
                          type="text"
                          id={`passportNumber-${passenger.id}`}
                          value={passenger.passportNumber}
                          onChange={(event) => handlePassengerChange(passenger.id, 'passportNumber', event.target.value.toUpperCase())}
                          className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-200 outline-none transition-all ${
                            passengerErrors.passportNumber ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'
                          }`}
                          placeholder="AB123456"
                        />
                        {passengerErrors.passportNumber && (
                          <p className="text-red-600 text-sm mt-1">{passengerErrors.passportNumber}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor={`passportExpiry-${passenger.id}`} className="block text-sm font-medium text-gray-700 mb-2">
                          Expiry Date *
                        </label>
                        <input
                          type="date"
                          id={`passportExpiry-${passenger.id}`}
                          value={passenger.passportExpiry}
                          onChange={(event) => handlePassengerChange(passenger.id, 'passportExpiry', event.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-200 outline-none transition-all ${
                            passengerErrors.passportExpiry ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'
                          }`}
                        />
                        {passengerErrors.passportExpiry && (
                          <p className="text-red-600 text-sm mt-1">{passengerErrors.passportExpiry}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label htmlFor={`nationality-${passenger.id}`} className="block text-sm font-medium text-gray-700 mb-2">
                        <Globe className="inline mr-2" size={16} />
                        Nationality *
                      </label>
                      <select
                        id={`nationality-${passenger.id}`}
                        value={passenger.nationality}
                        onChange={(event) => handlePassengerChange(passenger.id, 'nationality', event.target.value)}
                        className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-200 outline-none transition-all ${
                          passengerErrors.nationality ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'
                        }`}
                      >
                        {NATIONALITY_OPTIONS.map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                      {passengerErrors.nationality && (
                        <p className="text-red-600 text-sm mt-1">{passengerErrors.nationality}</p>
                      )}
                    </div>
                  </div>
                </section>
              );
            })}
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Briefcase size={20} className="text-blue-600" />
              Baggage Options
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Current flow applies one baggage selection to this booking step. Per-passenger baggage can be extended later.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { value: 'none', label: 'No Baggage', price: 0, desc: 'Carry-on only (8kg)' },
                { value: '20kg', label: '20kg Checked', price: 500, desc: 'Standard bag' },
                { value: '30kg', label: '30kg Checked', price: 750, desc: 'Extra baggage' },
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
                    onChange={(event) => handleBaggageChange(event.target.value)}
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
              <Button
                type="button"
                onClick={onBack}
                variant="secondary"
                className="flex-1"
              >
                Back
              </Button>
            )}
            <Button
              type="submit"
              className="flex-1"
            >
              Book now
              <ArrowRight size={20} />
            </Button>
          </div>
        </form>
      </Surface>
    </div>
  );
}
