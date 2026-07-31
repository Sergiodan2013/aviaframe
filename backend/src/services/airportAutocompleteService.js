'use strict';

const logger = require('../lib/logger');
const { config } = require('../config');

const CACHE_TTL_MS = Number(process.env.AIRPORT_AUTOCOMPLETE_CACHE_TTL_MS || 24 * 60 * 60 * 1000);
const MAX_CACHE_ENTRIES = Number(process.env.AIRPORT_AUTOCOMPLETE_CACHE_MAX || 200);
const DEFAULT_LIMIT = 12;

const cache = new Map();

const fallbackPlaces = [
  { type: 'city', code: 'LON', name: 'London', country_code: 'GB', country_name: 'United Kingdom', priority: 1 },
  { type: 'airport', code: 'LHR', name: 'Heathrow', city_code: 'LON', city_name: 'London', country_code: 'GB', country_name: 'United Kingdom', priority: 1 },
  { type: 'airport', code: 'LGW', name: 'Gatwick', city_code: 'LON', city_name: 'London', country_code: 'GB', country_name: 'United Kingdom', priority: 2 },
  { type: 'airport', code: 'LTN', name: 'Luton', city_code: 'LON', city_name: 'London', country_code: 'GB', country_name: 'United Kingdom', priority: 3 },
  { type: 'airport', code: 'STN', name: 'Stansted', city_code: 'LON', city_name: 'London', country_code: 'GB', country_name: 'United Kingdom', priority: 4 },
  { type: 'airport', code: 'LCY', name: 'City Airport', city_code: 'LON', city_name: 'London', country_code: 'GB', country_name: 'United Kingdom', priority: 5 },
  { type: 'city', code: 'MIL', name: 'Milan', country_code: 'IT', country_name: 'Italy', priority: 1 },
  { type: 'airport', code: 'MXP', name: 'Malpensa', city_code: 'MIL', city_name: 'Milan', country_code: 'IT', country_name: 'Italy', priority: 1 },
  { type: 'airport', code: 'BGY', name: 'Bergamo', city_code: 'MIL', city_name: 'Milan', country_code: 'IT', country_name: 'Italy', priority: 2 },
  { type: 'airport', code: 'LIN', name: 'Linate', city_code: 'MIL', city_name: 'Milan', country_code: 'IT', country_name: 'Italy', priority: 3 },
  { type: 'airport', code: 'PMF', name: 'Parma', city_code: 'MIL', city_name: 'Milan', country_code: 'IT', country_name: 'Italy', priority: 4 },
  { type: 'airport', code: 'IMR', name: 'Rogoredo Railway Station', city_code: 'MIL', city_name: 'Milan', country_code: 'IT', country_name: 'Italy', priority: 5 },
  { type: 'city', code: 'MOW', name: 'Moscow', country_code: 'RU', country_name: 'Russia', priority: 1 },
  { type: 'airport', code: 'SVO', name: 'Sheremetyevo', city_code: 'MOW', city_name: 'Moscow', country_code: 'RU', country_name: 'Russia', priority: 1 },
  { type: 'airport', code: 'DME', name: 'Domodedovo', city_code: 'MOW', city_name: 'Moscow', country_code: 'RU', country_name: 'Russia', priority: 2 },
  { type: 'airport', code: 'VKO', name: 'Vnukovo', city_code: 'MOW', city_name: 'Moscow', country_code: 'RU', country_name: 'Russia', priority: 3 },
  { type: 'airport', code: 'ZIA', name: 'Zhukovsky', city_code: 'MOW', city_name: 'Moscow', country_code: 'RU', country_name: 'Russia', priority: 4 },
  { type: 'city', code: 'SPT', name: 'Saint Petersburg', country_code: 'RU', country_name: 'Russia', priority: 2 },
  { type: 'airport', code: 'LED', name: 'Pulkovo', city_code: 'SPT', city_name: 'Saint Petersburg', country_code: 'RU', country_name: 'Russia', priority: 1 },
  { type: 'city', code: 'ALA', name: 'Almaty', country_code: 'KZ', country_name: 'Kazakhstan', priority: 1 },
  { type: 'airport', code: 'ALA', name: 'Almaty International', city_code: 'ALA', city_name: 'Almaty', country_code: 'KZ', country_name: 'Kazakhstan', priority: 1 },
  { type: 'city', code: 'TAS', name: 'Tashkent', country_code: 'UZ', country_name: 'Uzbekistan', priority: 1 },
  { type: 'airport', code: 'TAS', name: 'Tashkent International', city_code: 'TAS', city_name: 'Tashkent', country_code: 'UZ', country_name: 'Uzbekistan', priority: 1 },
  { type: 'city', code: 'DXB', name: 'Dubai', country_code: 'AE', country_name: 'United Arab Emirates', priority: 1 },
  { type: 'airport', code: 'DXB', name: 'Dubai International', city_code: 'DXB', city_name: 'Dubai', country_code: 'AE', country_name: 'United Arab Emirates', priority: 1 },
  { type: 'airport', code: 'DWC', name: 'Al Maktoum', city_code: 'DXB', city_name: 'Dubai', country_code: 'AE', country_name: 'United Arab Emirates', priority: 2 },
  { type: 'city', code: 'NYC', name: 'New York', country_code: 'US', country_name: 'United States', priority: 1 },
  { type: 'airport', code: 'JFK', name: 'John F. Kennedy', city_code: 'NYC', city_name: 'New York', country_code: 'US', country_name: 'United States', priority: 1 },
  { type: 'airport', code: 'EWR', name: 'Newark', city_code: 'NYC', city_name: 'New York', country_code: 'US', country_name: 'United States', priority: 2 },
];

const airportPlaceByCode = new Map(
  fallbackPlaces
    .filter((place) => place.type === 'airport' && place.code)
    .map((place) => [String(place.code).trim().toUpperCase(), place])
);

function normalizeLocale(locale) {
  const value = String(locale || 'en').trim().toLowerCase();
  return value || 'en';
}

function cacheKey(query, locale, limit) {
  return `${normalizeLocale(locale)}:${String(query || '').trim().toLowerCase()}:${limit}`;
}

function pruneCache() {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if ((now - entry.createdAt) > CACHE_TTL_MS) {
      cache.delete(key);
    }
  }
  while (cache.size > MAX_CACHE_ENTRIES) {
    const oldestKey = cache.keys().next().value;
    if (!oldestKey) break;
    cache.delete(oldestKey);
  }
}

function shouldCachePayload(payload) {
  return Array.isArray(payload?.groups) && payload.groups.length > 0;
}

function normalizePlace(item) {
  const type = String(item?.type || '').trim().toLowerCase();
  const code = String(item?.code || '').trim().toUpperCase();
  const cityCode = String(item?.city_code || (type === 'city' ? code : '') || '').trim().toUpperCase();
  const name = String(item?.name || item?.city_name || '').trim();
  const cityName = String(item?.city_name || item?.name || '').trim();
  const countryCode = String(item?.country_code || '').trim().toUpperCase();
  const countryName = String(item?.country_name || '').trim();

  if (!code || !countryCode || !countryName || !name) return null;

  return {
    type: type === 'city' ? 'city' : 'airport',
    code,
    name,
    city_code: cityCode || code,
    city_name: cityName || name,
    country_code: countryCode,
    country_name: countryName,
    priority: Number(item?.priority || 999),
  };
}

function matchesTerm(place, term) {
  const value = term.toLowerCase();
  return [
    place.code,
    place.name,
    place.city_code,
    place.city_name,
    place.country_code,
    place.country_name,
  ].some((field) => String(field || '').toLowerCase().includes(value));
}

function normalizePlaces(rawPlaces, limit = DEFAULT_LIMIT) {
  const normalized = rawPlaces
    .map(normalizePlace)
    .filter(Boolean)
    .slice(0, Math.max(limit * 4, 20));

  const countries = new Map();
  const cityMeta = new Map();
  const airportsByCity = new Map();
  // Preserve upstream (Travelpayouts) ranking by tracking first appearance of each country/city.
  const countryOrder = new Map();
  const cityOrder = new Map();
  let seq = 0;

  for (const place of normalized) {
    const countryKey = `${place.country_code}:${place.country_name}`;
    if (!countries.has(countryKey)) {
      countries.set(countryKey, {
        country_code: place.country_code,
        country_name: place.country_name,
        items: [],
      });
      countryOrder.set(countryKey, seq++);
    }

    const cityKey = `${countryKey}:${place.city_code}`;
    if (!cityOrder.has(cityKey)) {
      cityOrder.set(cityKey, seq++);
    }

    if (place.type === 'city') {
      cityMeta.set(cityKey, place);
      continue;
    }

    if (!airportsByCity.has(cityKey)) {
      airportsByCity.set(cityKey, []);
    }
    airportsByCity.get(cityKey).push(place);
  }

  const sortedCountries = Array.from(countries.values())
    .sort((a, b) => (countryOrder.get(`${a.country_code}:${a.country_name}`) || 0) - (countryOrder.get(`${b.country_code}:${b.country_name}`) || 0));

  for (const country of sortedCountries) {
    const countryKey = `${country.country_code}:${country.country_name}`;
    const airportKeys = Array.from(airportsByCity.keys()).filter((key) => key.startsWith(`${countryKey}:`));
    const cityOnlyKeys = Array.from(cityMeta.keys()).filter((key) => key.startsWith(`${countryKey}:`) && !airportsByCity.has(key));
    const cityKeys = Array.from(new Set([...airportKeys, ...cityOnlyKeys]))
      .sort((a, b) => (cityOrder.get(a) || 0) - (cityOrder.get(b) || 0));

    for (const cityKey of cityKeys) {
      const airports = airportsByCity.get(cityKey) || [];
      const meta = cityMeta.get(cityKey) || airports[0];
      if (!meta) continue;

      // City-only result from Travelpayouts (single-airport cities like Lisbon/Riyadh
      // where the city IATA == airport IATA). Emit the city as a single airport entry.
      if (airports.length === 0) {
        country.items.push({
          type: 'airport',
          code: meta.code,
          name: meta.name,
          city_code: meta.code,
          city_name: meta.name,
          country_code: meta.country_code,
          country_name: meta.country_name,
        });
        continue;
      }

      const children = airports
        .slice()
        .sort((a, b) => (a.priority - b.priority) || a.name.localeCompare(b.name))
        .map((airport) => ({
          type: 'airport',
          code: airport.code,
          name: airport.name,
          city_code: airport.city_code,
          city_name: airport.city_name,
          country_code: airport.country_code,
          country_name: airport.country_name,
        }));

      if (children.length === 1 && !cityMeta.has(cityKey)) {
        country.items.push(children[0]);
        continue;
      }

      country.items.push({
        type: 'city',
        code: meta.code || meta.city_code,
        name: meta.name || meta.city_name,
        city_code: meta.city_code,
        city_name: meta.city_name,
        country_code: meta.country_code,
        country_name: meta.country_name,
        airports: children,
        airport_count: children.length,
      });
    }
  }

  return sortedCountries.filter((country) => country.items.length > 0);
}

async function fetchTravelpayoutsPlaces(query, locale) {
  const url = new URL(config.airportAutocompleteUrl);
  url.searchParams.set('term', query);
  url.searchParams.set('locale', normalizeLocale(locale));
  url.searchParams.append('types[]', 'airport');
  url.searchParams.append('types[]', 'city');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.airportAutocompleteTimeoutMs);

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`autocomplete upstream ${response.status}`);
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } finally {
    clearTimeout(timeout);
  }
}

function searchFallbackPlaces(query, limit) {
  const term = String(query || '').trim().toLowerCase();
  return fallbackPlaces
    .filter((place) => matchesTerm(place, term))
    .sort((a, b) => (a.priority - b.priority) || String(a.city_name || a.name).localeCompare(String(b.city_name || b.name)))
    .slice(0, Math.max(limit * 4, 20));
}

function getAirportPlaceByCode(code) {
  const normalizedCode = String(code || '').trim().toUpperCase();
  if (!normalizedCode) return null;
  return airportPlaceByCode.get(normalizedCode) || null;
}

function resolveAirportDisplayName(name, code) {
  const airportCode = String(code || '').trim().toUpperCase();
  const inputName = String(name || '').trim();
  const matchedAirport = getAirportPlaceByCode(airportCode);

  const chosenAirportName = (
    inputName && inputName.toUpperCase() !== airportCode
      ? inputName
      : matchedAirport?.name || ''
  ).trim();
  const cityName = String(matchedAirport?.city_name || '').trim();

  let fullName = chosenAirportName;
  if (cityName && chosenAirportName) {
    const lowerAirport = chosenAirportName.toLowerCase();
    const lowerCity = cityName.toLowerCase();
    if (!lowerAirport.includes(lowerCity)) {
      fullName = `${cityName} ${chosenAirportName}`;
    }
  } else if (cityName) {
    fullName = cityName;
  }

  if (fullName && airportCode) return `${fullName} (${airportCode})`;
  return fullName || airportCode || 'N/A';
}

async function getAirportAutocomplete({ query, locale = 'en', limit = DEFAULT_LIMIT }) {
  const trimmedQuery = String(query || '').trim();
  if (!trimmedQuery) {
    return {
      query: '',
      locale: normalizeLocale(locale),
      source: 'empty',
      groups: [],
    };
  }

  const safeLimit = Math.max(1, Math.min(Number(limit) || DEFAULT_LIMIT, 20));
  const key = cacheKey(trimmedQuery, locale, safeLimit);
  pruneCache();

  const cached = cache.get(key);
  if (cached) {
    return { ...cached.payload, cached: true };
  }

  let source = 'travelpayouts';
  let rawPlaces = [];

  try {
    rawPlaces = await fetchTravelpayoutsPlaces(trimmedQuery, locale);
  } catch (error) {
    source = 'fallback';
    rawPlaces = searchFallbackPlaces(trimmedQuery, safeLimit);
    logger.warn({ err: error.message, query: trimmedQuery }, 'airport-autocomplete fallback activated');
  }

  const payload = {
    query: trimmedQuery,
    locale: normalizeLocale(locale),
    source,
    groups: normalizePlaces(rawPlaces, safeLimit),
  };

  if (shouldCachePayload(payload)) {
    cache.set(key, { createdAt: Date.now(), payload });
    pruneCache();
  }

  return payload;
}

module.exports = {
  getAirportAutocomplete,
  normalizePlaces,
  searchFallbackPlaces,
  getAirportPlaceByCode,
  resolveAirportDisplayName
};
