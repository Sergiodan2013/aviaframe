import { useState } from 'react';
import { Search } from 'lucide-react';
import AirportAutocomplete from './AirportAutocomplete';
import { useTranslation } from '../i18n/index.jsx';

export default function SearchForm({ onSearch, isLoading }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    depart_date: '',
    return_date: '',
    adults: 1,
    children: 0,
    infants: 0,
    cabin_class: 'economy'
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    // Build search payload
    const payload = {
      origin: formData.origin.toUpperCase(),
      destination: formData.destination.toUpperCase(),
      depart_date: formData.depart_date,
      adults: parseInt(formData.adults),
      children: parseInt(formData.children),
      infants: parseInt(formData.infants),
      cabin_class: formData.cabin_class
    };

    // Only include return_date if provided
    if (formData.return_date) {
      payload.return_date = formData.return_date;
    }

    console.log('Submitting search with payload:', payload);
    onSearch(payload);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAirportChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-6 space-y-4">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('search.title')}</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Origin */}
        <AirportAutocomplete
          label={t('search.from')}
          value={formData.origin}
          onChange={(value) => handleAirportChange('origin', value)}
          placeholder="Paris, London, LHR..."
          required={true}
        />

        {/* Destination */}
        <AirportAutocomplete
          label={t('search.to')}
          value={formData.destination}
          onChange={(value) => handleAirportChange('destination', value)}
          placeholder="London, Paris, CDG..."
          required={true}
        />

        {/* Depart Date */}
        <div>
          <label htmlFor="depart_date" className="block text-sm font-medium text-gray-700 mb-1">
            {t('search.depart')}
          </label>
          <input
            type="date"
            id="depart_date"
            name="depart_date"
            value={formData.depart_date}
            onChange={handleChange}
            required
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Return Date */}
        <div>
          <label htmlFor="return_date" className="block text-sm font-medium text-gray-700 mb-1">
            {t('search.return')}
          </label>
          <input
            type="date"
            id="return_date"
            name="return_date"
            value={formData.return_date}
            onChange={handleChange}
            min={formData.depart_date || new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Adults */}
        <div>
          <label htmlFor="adults" className="block text-sm font-medium text-gray-700 mb-1">
            {t('search.adults')}
          </label>
          <input
            type="number"
            id="adults"
            name="adults"
            value={formData.adults}
            onChange={handleChange}
            min="1"
            max="9"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Children */}
        <div>
          <label htmlFor="children" className="block text-sm font-medium text-gray-700 mb-1">
            {t('search.children')}
          </label>
          <input
            type="number"
            id="children"
            name="children"
            value={formData.children}
            onChange={handleChange}
            min="0"
            max="9"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Infants */}
        <div>
          <label htmlFor="infants" className="block text-sm font-medium text-gray-700 mb-1">
            {t('search.infants')}
          </label>
          <input
            type="number"
            id="infants"
            name="infants"
            value={formData.infants}
            onChange={handleChange}
            min="0"
            max="9"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Cabin Class */}
        <div>
          <label htmlFor="cabin_class" className="block text-sm font-medium text-gray-700 mb-1">
            {t('search.cabin')}
          </label>
          <select
            id="cabin_class"
            name="cabin_class"
            value={formData.cabin_class}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="economy">{t('search.economy')}</option>
            <option value="premium_economy">{t('search.premiumEconomy')}</option>
            <option value="business">{t('search.business')}</option>
            <option value="first">{t('search.first')}</option>
          </select>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-md transition-colors duration-200 flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            {t('search.searching')}
          </>
        ) : (
          <>
            <Search size={20} />
            {t('search.button')}
          </>
        )}
      </button>
    </form>
  );
}
