export default function AirlineFilter({ offers, selectedAirlines, onFilterChange }) {
  const isPlaceholderCode = (code) => {
    if (!code || typeof code !== 'string') return true;
    const x = code.trim().toUpperCase();
    return x === '' || x === 'XX' || x === 'N/A' || x === 'UNKNOWN';
  };

  const resolveAirlineCode = (offer) => {
    const top = offer?.airline_code || offer?.airline;
    if (!isPlaceholderCode(top)) return top;
    const firstSeg = Array.isArray(offer?.segments) ? offer.segments[0] : null;
    const segCode = firstSeg?.carrier?.airline_code || firstSeg?.carrier || null;
    if (!isPlaceholderCode(segCode)) return segCode;
    return 'XX';
  };

  const resolveAirlineName = (offer, code) => {
    const topName = offer?.airline_name;
    if (topName && topName !== 'Unknown Airline' && topName !== 'N/A') return topName;
    const firstSeg = Array.isArray(offer?.segments) ? offer.segments[0] : null;
    return firstSeg?.carrier?.airline_name || code;
  };

  // Extract unique airlines with their minimum prices
  const getAirlineStats = () => {
    const stats = {};

    offers.forEach(offer => {
      const code = resolveAirlineCode(offer);
      const name = resolveAirlineName(offer, code);
      const price = offer.price?.total || 0;

      if (!stats[code]) {
        stats[code] = {
          code,
          name,
          minPrice: price,
          count: 1
        };
      } else {
        stats[code].minPrice = Math.min(stats[code].minPrice, price);
        stats[code].count += 1;
      }
    });

    let rows = Object.values(stats);
    const hasRealAirlines = rows.some((r) => !isPlaceholderCode(r.code));
    if (hasRealAirlines) {
      rows = rows.filter((r) => !isPlaceholderCode(r.code));
    }
    // Sort by price (lowest first)
    return rows.sort((a, b) => a.minPrice - b.minPrice);
  };

  const airlineStats = getAirlineStats();

  if (airlineStats.length === 0) {
    return null;
  }

  const handleAirlineClick = (airlineCode) => {
    if (selectedAirlines.includes(airlineCode)) {
      // Remove airline from filter
      onFilterChange(selectedAirlines.filter(code => code !== airlineCode));
    } else {
      // Add airline to filter
      onFilterChange([...selectedAirlines, airlineCode]);
    }
  };

  const getAirlineLogo = (code) => {
    if (!code || isPlaceholderCode(code)) return null;
    return `https://pics.avs.io/200/80/${code}.png`;
  };

  // Get currency from first offer
  const currency = offers[0]?.price?.currency || 'UAH';

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">
        Filter by Airline
      </h3>

      {/* Airline Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {airlineStats.map(airline => {
          const isSelected = selectedAirlines.includes(airline.code);
          const logo = getAirlineLogo(airline.code);

          return (
            <button
              key={airline.code}
              onClick={() => handleAirlineClick(airline.code)}
              className={`
                relative p-4 rounded-lg border-2 transition-all duration-200 text-left
                ${isSelected
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
                }
              `}
            >
              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}

              {/* Airline Logo */}
              {logo && (
                <div className="mb-3 flex items-center justify-center h-12">
                  <img
                    src={logo}
                    alt={airline.name}
                    className="max-h-full w-auto object-contain"
                    style={{ maxWidth: '100px' }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
              )}

              {/* Airline Name (if logo fails or for smaller screens) */}
              <div className="text-sm font-medium text-gray-700 mb-1 truncate">
                {airline.name}
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-1">
                <span className="text-xs text-gray-500">from</span>
                <span className="text-lg font-bold text-blue-600">
                  {airline.minPrice.toFixed(0)}
                </span>
                <span className="text-xs text-gray-500">{currency}</span>
              </div>

              {/* Flight count */}
              <div className="text-xs text-gray-400 mt-1">
                {airline.count} flight{airline.count !== 1 ? 's' : ''}
              </div>
            </button>
          );
        })}
      </div>

      {/* Clear filters button */}
      {selectedAirlines.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => onFilterChange([])}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear all filters ({selectedAirlines.length} selected)
          </button>
        </div>
      )}
    </div>
  );
}
