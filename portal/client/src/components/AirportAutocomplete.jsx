import { useState, useEffect, useRef } from 'react';
import { Plane, X } from 'lucide-react';
import { searchAirports } from '../data/airports';

export default function AirportAutocomplete({ label, value, onChange, placeholder, required = false }) {
  const [inputValue, setInputValue] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const wrapperRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update input when value prop changes
  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    if (newValue.length >= 1) {
      const results = searchAirports(newValue, 8);
      setSuggestions(results);
      setIsOpen(results.length > 0);
      setSelectedIndex(-1);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  };

  const handleSelect = (airport) => {
    setInputValue(airport.code);
    onChange(airport.code);
    setIsOpen(false);
    setSuggestions([]);
  };

  const handleClear = () => {
    setInputValue('');
    onChange('');
    setSuggestions([]);
    setIsOpen(false);
  };

  const handleKeyDown = (e) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  const handleFocus = () => {
    if (inputValue.length >= 1) {
      const results = searchAirports(inputValue, 8);
      setSuggestions(results);
      setIsOpen(results.length > 0);
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Plane size={18} className="text-gray-400" />
        </div>
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder={placeholder}
          required={required}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
        />
        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Dropdown with suggestions */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-64 overflow-y-auto">
          {suggestions.map((airport, index) => (
            <button
              key={airport.code}
              type="button"
              onClick={() => handleSelect(airport)}
              className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors ${
                index === selectedIndex ? 'bg-blue-100' : ''
              } ${index !== 0 ? 'border-t border-gray-100' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-blue-600 text-lg">
                      {airport.code}
                    </span>
                    <span className="text-gray-700 font-medium">
                      {airport.city}
                    </span>
                    {airport.cityRu !== airport.city && (
                      <span className="text-gray-500 text-sm">
                        ({airport.cityRu})
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 mt-0.5">
                    {airport.name} • {airport.country}
                  </div>
                </div>
                <Plane size={16} className="text-gray-400 flex-shrink-0 ml-2" />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results message */}
      {isOpen && inputValue.length >= 1 && suggestions.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg px-4 py-3 text-gray-500 text-sm">
          No airports found for "{inputValue}"
        </div>
      )}
    </div>
  );
}
