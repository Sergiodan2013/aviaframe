/**
 * Aviaframe Flight Search Widget
 * Embeddable flight search widget for agency websites
 * Version: 1.0.0
 */

(function() {
  'use strict';

  // Widget configuration defaults
  const defaultConfig = {
    // API Configuration
    apiUrl: 'http://localhost:5678/webhook/drct',

    // Branding
    title: 'Search Flights',
    brandName: 'Aviaframe',
    brandColor: '#3b82f6', // Blue-500
    accentColor: '#10b981', // Green-500

    // Labels (customizable for different languages)
    labels: {
      origin: 'From',
      destination: 'To',
      departDate: 'Departure',
      returnDate: 'Return (optional)',
      adults: 'Adults',
      children: 'Children',
      infants: 'Infants',
      cabinClass: 'Class',
      searchButton: 'Search Flights',
      loading: 'Searching flights...',
      noResults: 'No flights found',
      priceFrom: 'From',
      selectFlight: 'Select',
      oneWay: 'One-way',
      roundTrip: 'Round-trip'
    },

    // Cabin classes
    cabinClasses: [
      { value: 'economy', label: 'Economy' },
      { value: 'premium_economy', label: 'Premium Economy' },
      { value: 'business', label: 'Business' },
      { value: 'first', label: 'First Class' }
    ],

    // Feature flags
    showReturnDate: true,
    showPassengerCounts: true,
    showCabinClass: true,
    directFlightsOnly: false,

    // Styling
    borderRadius: '8px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',

    // Callbacks
    onFlightSelect: null, // function(flight) {}
    onError: null // function(error) {}
  };

  // Create widget instance
  class AviaframeWidget {
    constructor(containerId, userConfig = {}) {
      this.container = document.getElementById(containerId);
      if (!this.container) {
        console.error(`Aviaframe Widget: Container #${containerId} not found`);
        return;
      }

      this.config = { ...defaultConfig, ...userConfig };

      // Merge labels separately to allow partial overrides
      if (userConfig.labels) {
        this.config.labels = { ...defaultConfig.labels, ...userConfig.labels };
      }

      this.flights = [];
      this.loading = false;

      this.init();
    }

    init() {
      this.injectStyles();
      this.render();
      this.attachEventListeners();
    }

    injectStyles() {
      const styleId = 'aviaframe-widget-styles';
      if (document.getElementById(styleId)) return;

      const css = `
        .aviaframe-widget {
          font-family: ${this.config.fontFamily};
          background: #ffffff;
          border-radius: ${this.config.borderRadius};
          box-shadow: ${this.config.boxShadow};
          padding: 24px;
          max-width: 1000px;
          margin: 0 auto;
        }

        .aviaframe-widget * {
          box-sizing: border-box;
        }

        .aviaframe-header {
          margin-bottom: 24px;
          text-align: center;
        }

        .aviaframe-title {
          font-size: 28px;
          font-weight: bold;
          color: #1f2937;
          margin: 0 0 8px 0;
        }

        .aviaframe-brand {
          color: ${this.config.brandColor};
        }

        .aviaframe-form {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .aviaframe-field {
          display: flex;
          flex-direction: column;
        }

        .aviaframe-label {
          font-size: 14px;
          font-weight: 500;
          color: #4b5563;
          margin-bottom: 8px;
        }

        .aviaframe-input,
        .aviaframe-select {
          padding: 12px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 14px;
          transition: border-color 0.2s;
        }

        .aviaframe-input:focus,
        .aviaframe-select:focus {
          outline: none;
          border-color: ${this.config.brandColor};
        }

        .aviaframe-button {
          background: linear-gradient(135deg, ${this.config.brandColor} 0%, ${this.config.accentColor} 100%);
          color: white;
          font-weight: 600;
          padding: 14px 32px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 16px;
          transition: transform 0.2s, box-shadow 0.2s;
          width: 100%;
          margin-top: 8px;
        }

        .aviaframe-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 12px rgba(0, 0, 0, 0.15);
        }

        .aviaframe-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .aviaframe-loading {
          text-align: center;
          padding: 40px;
          color: #6b7280;
        }

        .aviaframe-spinner {
          border: 4px solid #f3f4f6;
          border-top: 4px solid ${this.config.brandColor};
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: aviaframe-spin 1s linear infinite;
          margin: 0 auto 16px;
        }

        @keyframes aviaframe-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .aviaframe-results {
          margin-top: 32px;
        }

        .aviaframe-flight-card {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 16px;
          transition: box-shadow 0.2s;
        }

        .aviaframe-flight-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .aviaframe-flight-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .aviaframe-flight-route {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 20px;
          font-weight: bold;
          color: #1f2937;
        }

        .aviaframe-flight-price {
          text-align: right;
        }

        .aviaframe-price-amount {
          font-size: 28px;
          font-weight: bold;
          color: ${this.config.brandColor};
        }

        .aviaframe-price-label {
          font-size: 12px;
          color: #6b7280;
        }

        .aviaframe-flight-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 12px;
          font-size: 14px;
          color: #4b5563;
          margin-bottom: 16px;
        }

        .aviaframe-select-button {
          background: ${this.config.accentColor};
          color: white;
          font-weight: 600;
          padding: 10px 24px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.2s;
        }

        .aviaframe-select-button:hover {
          background: ${this.config.accentColor}dd;
        }

        .aviaframe-error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #991b1b;
          padding: 16px;
          border-radius: 8px;
          margin-top: 16px;
        }

        .aviaframe-no-results {
          text-align: center;
          padding: 40px;
          color: #6b7280;
        }

        @media (max-width: 768px) {
          .aviaframe-form {
            grid-template-columns: 1fr;
          }

          .aviaframe-flight-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }
        }
      `;

      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = css;
      document.head.appendChild(style);
    }

    render() {
      const html = `
        <div class="aviaframe-widget">
          <div class="aviaframe-header">
            <h2 class="aviaframe-title">
              ${this.config.title} <span class="aviaframe-brand">${this.config.brandName}</span>
            </h2>
          </div>

          <form class="aviaframe-form" id="aviaframe-search-form">
            <div class="aviaframe-field">
              <label class="aviaframe-label">${this.config.labels.origin}</label>
              <input
                type="text"
                class="aviaframe-input"
                name="origin"
                placeholder="JFK"
                required
                maxlength="3"
                pattern="[A-Za-z]{3}"
              />
            </div>

            <div class="aviaframe-field">
              <label class="aviaframe-label">${this.config.labels.destination}</label>
              <input
                type="text"
                class="aviaframe-input"
                name="destination"
                placeholder="LAX"
                required
                maxlength="3"
                pattern="[A-Za-z]{3}"
              />
            </div>

            <div class="aviaframe-field">
              <label class="aviaframe-label">${this.config.labels.departDate}</label>
              <input
                type="date"
                class="aviaframe-input"
                name="depart_date"
                required
                min="${new Date().toISOString().split('T')[0]}"
              />
            </div>

            ${this.config.showReturnDate ? `
              <div class="aviaframe-field">
                <label class="aviaframe-label">${this.config.labels.returnDate}</label>
                <input
                  type="date"
                  class="aviaframe-input"
                  name="return_date"
                />
              </div>
            ` : ''}

            ${this.config.showPassengerCounts ? `
              <div class="aviaframe-field">
                <label class="aviaframe-label">${this.config.labels.adults}</label>
                <select class="aviaframe-select" name="adults">
                  ${[1,2,3,4,5,6,7,8,9].map(n => `<option value="${n}">${n}</option>`).join('')}
                </select>
              </div>

              <div class="aviaframe-field">
                <label class="aviaframe-label">${this.config.labels.children}</label>
                <select class="aviaframe-select" name="children">
                  ${[0,1,2,3,4,5,6,7,8,9].map(n => `<option value="${n}">${n}</option>`).join('')}
                </select>
              </div>

              <div class="aviaframe-field">
                <label class="aviaframe-label">${this.config.labels.infants}</label>
                <select class="aviaframe-select" name="infants">
                  ${[0,1,2,3,4,5,6,7,8,9].map(n => `<option value="${n}">${n}</option>`).join('')}
                </select>
              </div>
            ` : ''}

            ${this.config.showCabinClass ? `
              <div class="aviaframe-field">
                <label class="aviaframe-label">${this.config.labels.cabinClass}</label>
                <select class="aviaframe-select" name="cabin_class">
                  ${this.config.cabinClasses.map(c =>
                    `<option value="${c.value}">${c.label}</option>`
                  ).join('')}
                </select>
              </div>
            ` : ''}

            <div class="aviaframe-field" style="grid-column: 1 / -1;">
              <button type="submit" class="aviaframe-button">
                ✈️ ${this.config.labels.searchButton}
              </button>
            </div>
          </form>

          <div id="aviaframe-results"></div>
        </div>
      `;

      this.container.innerHTML = html;
    }

    attachEventListeners() {
      const form = document.getElementById('aviaframe-search-form');
      form.addEventListener('submit', (e) => this.handleSearch(e));
    }

    parseJsonSafe(value) {
      if (value == null) return null;
      if (typeof value === 'object') return value;
      if (typeof value !== 'string') return null;
      const trimmed = value.trim();
      if (!trimmed) return null;
      try {
        return JSON.parse(trimmed);
      } catch {
        return null;
      }
    }

    resolveSearchUrl() {
      const base = String(this.config.apiUrl || '').replace(/\/+$/, '');
      if (!base) return '/search';
      return /\/search$/i.test(base) ? base : `${base}/search`;
    }

    extractOffers(rawPayload, searchParams) {
      const parse = (v) => this.parseJsonSafe(v) || v;
      const root = parse(rawPayload) || {};
      const top = Array.isArray(root)
        ? (root[0]?.json ? parse(root[0].json) : root[0]) || {}
        : root;
      const data = parse(top?.data) || top;
      const body = parse(data?.body) || parse(top?.body) || data;

      const candidates = [
        body?.offers,
        body?.flights,
        data?.offers,
        data?.flights,
        top?.offers,
        top?.flights
      ];
      const direct = candidates.find(Array.isArray);
      if (direct) return direct;

      const options = Array.isArray(body?.flights_options) ? body.flights_options : [];
      if (!options.length) return [];

      const segments = Array.isArray(body?.segments) ? body.segments : [];
      const segmentById = Object.fromEntries(segments.filter((s) => s?.id).map((s) => [s.id, s]));

      const mapped = [];
      options.forEach((option, optionIdx) => {
        const optionFlights = Array.isArray(option?.flights) ? option.flights : [];
        const outboundIds = Array.isArray(optionFlights[0]?.segments) ? optionFlights[0].segments : [];
        const returnIds = Array.isArray(optionFlights[1]?.segments) ? optionFlights[1].segments : [];
        const outboundSegs = outboundIds.map((id) => segmentById[id]).filter(Boolean);
        const returnSegs = returnIds.map((id) => segmentById[id]).filter(Boolean);
        const allSegs = [...outboundSegs, ...returnSegs];

        const offers = Array.isArray(option?.offers) ? option.offers : [];
        offers.forEach((offer, offerIdx) => {
          const first = outboundSegs[0] || allSegs[0] || null;
          const last = outboundSegs[outboundSegs.length - 1] || allSegs[allSegs.length - 1] || null;
          mapped.push({
            offer_id: offer?.id || `offer_${optionIdx}_${offerIdx}`,
            id: offer?.id || `offer_${optionIdx}_${offerIdx}`,
            price: {
              total: Number(offer?.price?.amount || offer?.price?.total || 0),
              currency: offer?.price?.currency || 'USD'
            },
            origin: first?.departure_airport?.code || searchParams.origin || null,
            destination: last?.arrival_airport?.code || searchParams.destination || null,
            departure_time: [first?.departure_date, first?.departure_time].filter(Boolean).join(' ') || null,
            arrival_time: [last?.arrival_date, last?.arrival_time].filter(Boolean).join(' ') || null,
            airline_code: first?.carrier?.airline_code || null,
            airline_name: first?.carrier?.airline_name || null,
            flight_number: first?.flight_number || null
          });
        });
      });

      return mapped;
    }

    async handleSearch(e) {
      e.preventDefault();

      const formData = new FormData(e.target);
      const searchParams = {
        origin: formData.get('origin').toUpperCase(),
        destination: formData.get('destination').toUpperCase(),
        depart_date: formData.get('depart_date'),
        return_date: formData.get('return_date') || null,
        adults: parseInt(formData.get('adults') || 1),
        children: parseInt(formData.get('children') || 0),
        infants: parseInt(formData.get('infants') || 0),
        cabin_class: formData.get('cabin_class') || 'economy',
        direct_flights_only: this.config.directFlightsOnly
      };

      this.showLoading();

      try {
        const searchUrl = this.resolveSearchUrl();
        const response = await fetch(searchUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(searchParams)
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        this.flights = this.extractOffers(data, searchParams);
        console.log('Aviaframe Widget: search response parsed', {
          url: searchUrl,
          flights: this.flights.length
        });
        this.renderResults();
      } catch (error) {
        console.error('Aviaframe Widget: Search error', error);
        this.showError(error.message);

        if (this.config.onError) {
          this.config.onError(error);
        }
      }
    }

    showLoading() {
      const resultsDiv = document.getElementById('aviaframe-results');
      resultsDiv.innerHTML = `
        <div class="aviaframe-loading">
          <div class="aviaframe-spinner"></div>
          <p>${this.config.labels.loading}</p>
        </div>
      `;
    }

    showError(message) {
      const resultsDiv = document.getElementById('aviaframe-results');
      resultsDiv.innerHTML = `
        <div class="aviaframe-error">
          <strong>Error:</strong> ${message}
        </div>
      `;
    }

    renderResults() {
      const resultsDiv = document.getElementById('aviaframe-results');

      if (this.flights.length === 0) {
        resultsDiv.innerHTML = `
          <div class="aviaframe-no-results">
            <p>${this.config.labels.noResults}</p>
          </div>
        `;
        return;
      }

      const html = `
        <div class="aviaframe-results">
          <h3 style="margin-bottom: 16px; color: #1f2937;">
            ${this.flights.length} flights found
          </h3>
          ${this.flights.map(flight => this.renderFlightCard(flight)).join('')}
        </div>
      `;

      resultsDiv.innerHTML = html;

      // Attach select button listeners
      this.flights.forEach((flight, index) => {
        const btn = document.getElementById(`aviaframe-select-${index}`);
        if (btn) {
          btn.addEventListener('click', () => this.handleFlightSelect(flight));
        }
      });
    }

    renderFlightCard(flight) {
      const price = flight.price?.total || flight.total_price || 0;
      const currency = flight.price?.currency || flight.currency || 'USD';

      return `
        <div class="aviaframe-flight-card">
          <div class="aviaframe-flight-header">
            <div class="aviaframe-flight-route">
              ${flight.origin || flight.departure_airport}
              →
              ${flight.destination || flight.arrival_airport}
            </div>
            <div class="aviaframe-flight-price">
              <div class="aviaframe-price-amount">
                ${price.toFixed(0)} ${currency}
              </div>
              <div class="aviaframe-price-label">
                ${this.config.labels.priceFrom}
              </div>
            </div>
          </div>

          <div class="aviaframe-flight-details">
            <div>
              <strong>Airline:</strong> ${flight.airline_name || flight.carrier}
            </div>
            <div>
              <strong>Departure:</strong> ${flight.departure_time || 'N/A'}
            </div>
            <div>
              <strong>Arrival:</strong> ${flight.arrival_time || 'N/A'}
            </div>
            <div>
              <strong>Flight:</strong> ${flight.flight_number || 'N/A'}
            </div>
          </div>

          <button
            class="aviaframe-select-button"
            id="aviaframe-select-${this.flights.indexOf(flight)}"
          >
            ${this.config.labels.selectFlight}
          </button>
        </div>
      `;
    }

    handleFlightSelect(flight) {
      console.log('Flight selected:', flight);

      if (this.config.onFlightSelect) {
        this.config.onFlightSelect(flight);
      } else {
        alert(`Flight selected: ${flight.origin} → ${flight.destination}\nPrice: ${flight.price?.total} ${flight.price?.currency}`);
      }
    }
  }

  // Expose to global scope
  window.AviaframeWidget = AviaframeWidget;

  // Auto-initialize widgets with data attributes
  document.addEventListener('DOMContentLoaded', () => {
    const containers = document.querySelectorAll('[data-aviaframe-widget]');
    containers.forEach(container => {
      const config = {};

      // Parse data attributes
      if (container.dataset.apiUrl) config.apiUrl = container.dataset.apiUrl;
      if (container.dataset.brandName) config.brandName = container.dataset.brandName;
      if (container.dataset.brandColor) config.brandColor = container.dataset.brandColor;
      if (container.dataset.accentColor) config.accentColor = container.dataset.accentColor;
      if (container.dataset.title) config.title = container.dataset.title;

      new AviaframeWidget(container.id, config);
    });
  });
})();
