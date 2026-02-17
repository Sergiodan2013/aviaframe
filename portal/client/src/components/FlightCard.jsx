import { useMemo, useState } from 'react';
import { Plane, Clock, Briefcase, ChevronDown, ChevronUp } from 'lucide-react';

export default function FlightCard({ offer, onSelect }) {
  const [detailsOpen, setDetailsOpen] = useState(false);

  const isPlaceholder = (v) => {
    if (!v || typeof v !== 'string') return true;
    const x = v.trim().toUpperCase();
    return x === '' || x === 'N/A' || x === 'XX' || x === 'UNKNOWN';
  };

  const getAirlineLogo = (airlineCode) => {
    if (!airlineCode || airlineCode === 'N/A') return null;
    return `https://pics.avs.io/200/80/${airlineCode}.png`;
  };

  const handleSelect = () => {
    if (onSelect) {
      onSelect(offer);
      return;
    }

    const selectedOfferData = {
      offer_id: offer.offer_id,
      price: offer.price,
      origin: offer.origin,
      destination: offer.destination,
      departure_time: offer.departure_time,
      arrival_time: offer.arrival_time,
      airline_code: offer.airline_code || offer.airline,
      airline_name: offer.airline_name,
      selected_at: new Date().toISOString()
    };

    localStorage.setItem('selectedOffer', JSON.stringify(selectedOfferData));

    const event = new CustomEvent('aviaframe:offerSelected', {
      detail: { offer: selectedOfferData },
      bubbles: true
    });
    window.dispatchEvent(event);
  };

  const fallbackFirstSeg = Array.isArray(offer?.segments) && offer.segments.length > 0 ? offer.segments[0] : null;
  const fallbackLastSeg =
    Array.isArray(offer?.segments) && offer.segments.length > 0 ? offer.segments[offer.segments.length - 1] : null;

  const airline = !isPlaceholder(offer.airline_code)
    ? offer.airline_code
    : (!isPlaceholder(offer.airline) ? offer.airline : (fallbackFirstSeg?.carrier?.airline_code || fallbackFirstSeg?.carrier || 'N/A'));
  const airlineName = !isPlaceholder(offer.airline_name)
    ? offer.airline_name
    : (fallbackFirstSeg?.carrier_name || fallbackFirstSeg?.carrier?.airline_name || (!isPlaceholder(airline) ? airline : 'Unknown Airline'));
  const origin = !isPlaceholder(offer.origin)
    ? offer.origin
    : (fallbackFirstSeg?.origin || fallbackFirstSeg?.departure_airport?.code || offer?._searchOrigin || 'N/A');
  const destination = !isPlaceholder(offer.destination)
    ? offer.destination
    : (fallbackLastSeg?.destination || fallbackLastSeg?.arrival_airport?.code || offer?._searchDestination || 'N/A');
  const departureTime = !isPlaceholder(offer.departure_time)
    ? offer.departure_time
    : (fallbackFirstSeg?.departure || [fallbackFirstSeg?.departure_date, fallbackFirstSeg?.departure_time].filter(Boolean).join(' ') || 'N/A');
  const arrivalTime = !isPlaceholder(offer.arrival_time)
    ? offer.arrival_time
    : (fallbackLastSeg?.arrival || [fallbackLastSeg?.arrival_date, fallbackLastSeg?.arrival_time].filter(Boolean).join(' ') || 'N/A');
  const price = Number(offer.price?.total || 0);
  const currency = offer.price?.currency || 'UAH';
  const airlineLogo = getAirlineLogo(airline);

  const stopsCount = useMemo(() => {
    const directStops = Number(offer?.stops);
    if (Number.isFinite(directStops)) return Math.max(0, directStops);
    const segCount = Array.isArray(offer?.segments) ? offer.segments.length : 0;
    if (segCount > 0) return Math.max(0, segCount - 1);
    return 0;
  }, [offer]);

  const checkedBaggageQty = useMemo(() => {
    if (offer?.baggage?.type === 'checked') return Number(offer.baggage.quantity || 0);

    if (Array.isArray(offer?.fare_details?.baggage)) {
      const checked = offer.fare_details.baggage.find((b) => b?.type === 'checked');
      if (checked) return Number(checked.quantity || 0);
    }

    if (Array.isArray(offer?.baggage)) {
      const checked = offer.baggage.find((b) => b?.type === 'checked');
      if (checked) return Number(checked.quantity || 0);
    }

    return 0;
  }, [offer]);

  const stopsLabel = stopsCount === 0 ? 'Без пересадок' : stopsCount === 1 ? '1 пересадка' : `${stopsCount} пересадки`;
  const baggageLabel = checkedBaggageQty > 0 ? `С багажом (${checkedBaggageQty})` : 'Без багажа';

  const segments = useMemo(() => {
    if (!Array.isArray(offer?.segments)) return [];

    const locationCode = (v) => {
      if (!v) return null;
      if (typeof v === 'string') {
        return v.length <= 4 ? v.toUpperCase() : null;
      }
      return null;
    };

    return offer.segments.map((s) => {
      const originCode =
        s?.origin_code ||
        s?.departure_airport?.code ||
        s?.departure?.iataCode ||
        locationCode(s?.origin) ||
        null;
      const destinationCode =
        s?.destination_code ||
        s?.arrival_airport?.code ||
        s?.arrival?.iataCode ||
        locationCode(s?.destination) ||
        null;
      const segOrigin =
        s?.origin ||
        s?.departure_city?.name ||
        s?.departure_airport?.name ||
        s?.departure_airport?.code ||
        'N/A';
      const segDestination =
        s?.destination ||
        s?.arrival_city?.name ||
        s?.arrival_airport?.name ||
        s?.arrival_airport?.code ||
        'N/A';
      const segDeparture = s?.departure || [s?.departure_date, s?.departure_time].filter(Boolean).join(' ') || 'N/A';
      const segArrival = s?.arrival || [s?.arrival_date, s?.arrival_time].filter(Boolean).join(' ') || 'N/A';
      const segAirline = s?.carrier?.airline_name || s?.carrier?.airline_code || s?.carrier || airline;
      const segFlightNumber = s?.flight_number || s?.flightNumber || 'N/A';

      return {
        origin: segOrigin,
        destination: segDestination,
        originCode,
        destinationCode,
        departure: segDeparture,
        arrival: segArrival,
        airline: segAirline,
        flightNumber: segFlightNumber,
      };
    });
  }, [offer, airline]);

  const detailsAvailable = segments.length > 0;
  const isRoundTripCollapsed = origin === destination && segments.length > 0;
  const shownOrigin = segments[0]?.origin || offer._searchOrigin || origin;
  const shownDestination = isRoundTripCollapsed
    ? (segments[0]?.destination || offer._searchDestination || destination)
    : (destination || offer._searchDestination || 'N/A');
  const shownDeparture = segments[0]?.departure || departureTime;
  const shownArrival = isRoundTripCollapsed ? (segments[0]?.arrival || arrivalTime) : arrivalTime;
  const shownOriginCode = segments[0]?.originCode || (typeof shownOrigin === 'string' && shownOrigin.length <= 4 ? shownOrigin.toUpperCase() : null);
  const shownDestinationCode =
    (isRoundTripCollapsed ? segments[0]?.destinationCode : segments[segments.length - 1]?.destinationCode) ||
    (typeof shownDestination === 'string' && shownDestination.length <= 4 ? shownDestination.toUpperCase() : null);
  const outboundRouteCode = shownOriginCode && shownDestinationCode ? `${shownOriginCode}-${shownDestinationCode}` : null;
  const returnSummary =
    isRoundTripCollapsed && segments.length > 1
      ? `${segments[segments.length - 1]?.origin || 'N/A'} → ${segments[segments.length - 1]?.destination || 'N/A'} • ${segments[segments.length - 1]?.departure || 'N/A'}`
      : (offer?._searchReturnDate && offer?._searchDestination && offer?._searchOrigin
          ? `${offer._searchDestination} → ${offer._searchOrigin} • ${offer._searchReturnDate}`
          : null);
  const returnRouteCode =
    isRoundTripCollapsed && segments.length > 1
      ? `${segments[segments.length - 1]?.originCode || 'N/A'}-${segments[segments.length - 1]?.destinationCode || 'N/A'}`
      : (offer?._searchDestination && offer?._searchOrigin ? `${offer._searchDestination}-${offer._searchOrigin}` : null);

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-6 border border-gray-200">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              <Clock size={12} />
              {stopsLabel}
            </span>
            <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border ${checkedBaggageQty > 0 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
              <Briefcase size={12} />
              {baggageLabel}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-center min-w-[140px]">
              <div className="text-2xl font-bold text-gray-800">{shownDeparture}</div>
              <div className="text-sm text-gray-500">{shownOrigin}</div>
              {outboundRouteCode && <div className="text-xs text-gray-400">{outboundRouteCode}</div>}
            </div>

            <div className="flex-1 flex flex-col items-center">
              <div className="text-xs text-gray-500 mb-1">{stopsLabel}</div>
              <div className="w-full relative">
                <div className="border-t-2 border-gray-300"></div>
                <Plane size={16} className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white text-blue-600" />
              </div>
            </div>

            <div className="text-center min-w-[140px]">
              <div className="text-2xl font-bold text-gray-800">{shownArrival}</div>
              <div className="text-sm text-gray-500">{shownDestination}</div>
              {outboundRouteCode && <div className="text-xs text-gray-400">{outboundRouteCode}</div>}
            </div>
          </div>

          {returnSummary && (
            <div className="text-xs text-gray-500">
              Обратно: {returnSummary}
              {returnRouteCode ? ` (${returnRouteCode})` : ''}
            </div>
          )}

          <div className="flex items-center gap-3 text-sm text-gray-600">
            {airlineLogo && (
              <div className="bg-white border border-gray-200 rounded-md p-2 shadow-sm">
                <img
                  src={airlineLogo}
                  alt={airlineName}
                  className="h-10 w-auto object-contain"
                  style={{ maxWidth: '120px' }}
                  onError={(e) => { e.target.parentElement.style.display = 'none'; }}
                />
              </div>
            )}
            <span className="font-medium text-base">{airlineName}</span>

            {detailsAvailable && (
              <button
                onClick={() => setDetailsOpen((v) => !v)}
                className="ml-auto inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium"
              >
                {detailsOpen ? 'Коротко' : 'Детали'}
                {detailsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            )}
          </div>

          {detailsOpen && detailsAvailable && (
            <div className="mt-2 border border-gray-200 rounded-lg p-3 bg-gray-50">
              <div className="space-y-3">
                {segments.map((seg, idx) => (
                  <div key={`${seg.flightNumber}-${idx}`} className="text-sm text-gray-700">
                    <div className="font-semibold">{seg.origin} → {seg.destination}</div>
                    <div className="text-xs text-gray-500">{seg.departure} → {seg.arrival}</div>
                    <div className="text-xs text-gray-500">{seg.airline} • рейс {seg.flightNumber}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-row md:flex-col items-center md:items-end gap-3 md:gap-2 border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-6">
          <div className="text-center md:text-right flex-1 md:flex-none">
            <div className="text-3xl font-bold text-blue-600">
              {price.toFixed(0)} {currency}
            </div>
            <div className="text-xs text-gray-500 mt-1">per person</div>
          </div>
          <button
            onClick={handleSelect}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-md transition-colors duration-200 whitespace-nowrap"
          >
            Select
          </button>
        </div>
      </div>
    </div>
  );
}
