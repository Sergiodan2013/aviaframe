import test from 'node:test';
import assert from 'node:assert/strict';

import { resolveAirportCode, resolveAirportInput } from './airportInput.js';

test('resolveAirportInput returns exact airport by IATA code', () => {
  const result = resolveAirportInput('lgw');
  assert.equal(result?.code, 'LGW');
  assert.equal(result?.city, 'London');
});

test('resolveAirportInput resolves city names to the first ranked airport', () => {
  const london = resolveAirportInput('London');
  const milan = resolveAirportInput('Milan');

  assert.equal(london?.code, 'LHR');
  assert.equal(milan?.code, 'MXP');
});

test('resolveAirportCode supports russian city names and trims input', () => {
  assert.equal(resolveAirportCode('  Милан '), 'MXP');
  assert.equal(resolveAirportCode('Лондон'), 'LHR');
});

test('resolveAirportCode returns empty string when nothing matches', () => {
  assert.equal(resolveAirportCode('zzzz-not-found'), '');
});
