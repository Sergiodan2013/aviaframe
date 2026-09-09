import { getAirportByCode, searchAirports } from '../data/airports.js';

function normalizeQuery(value) {
  return String(value || '').trim();
}

export function resolveAirportInput(value) {
  const query = normalizeQuery(value);
  if (!query) return null;

  if (/^[a-zA-Z]{3}$/.test(query)) {
    const exact = getAirportByCode(query.toUpperCase());
    if (exact) return exact;
  }

  const matches = searchAirports(query, 8);
  if (!matches.length) return null;

  const lowered = query.toLowerCase();
  const exactTextMatch = matches.find((airport) =>
    airport.city.toLowerCase() === lowered ||
    airport.cityRu.toLowerCase() === lowered ||
    airport.name.toLowerCase() === lowered ||
    airport.code.toLowerCase() === lowered
  );

  return exactTextMatch || matches[0];
}

export function resolveAirportCode(value) {
  return resolveAirportInput(value)?.code || '';
}
