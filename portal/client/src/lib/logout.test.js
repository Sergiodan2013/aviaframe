import test from 'node:test';
import assert from 'node:assert/strict';
import { performLogout, LOGOUT_LOCAL_STORAGE_KEYS } from './logout.js';

function fakeStorage() {
  const removed = [];
  return {
    removed,
    removeItem: (key) => removed.push(key),
  };
}

test('performLogout calls the real signOut() before clearing anything', async () => {
  const calls = [];
  const signOut = async () => { calls.push('signOut'); return { error: null }; };
  const storage = fakeStorage();

  await performLogout({ signOut, storage });

  assert.equal(calls.length, 1, 'signOut must be called exactly once');
  assert.ok(storage.removed.length > 0, 'local caches must still be cleared');
});

test('performLogout clears every known session/booking cache key, not just "user"', async () => {
  const storage = fakeStorage();
  await performLogout({ signOut: async () => ({}), storage });

  for (const key of LOGOUT_LOCAL_STORAGE_KEYS) {
    assert.ok(storage.removed.includes(key), `expected logout to clear "${key}"`);
  }
  // Guards against silently dropping a key from the list in the future
  // without anyone noticing in this test.
  assert.ok(LOGOUT_LOCAL_STORAGE_KEYS.includes('user'));
  assert.ok(LOGOUT_LOCAL_STORAGE_KEYS.includes('avia_orders_cache'));
  assert.ok(LOGOUT_LOCAL_STORAGE_KEYS.includes('passengerData'));
  assert.ok(LOGOUT_LOCAL_STORAGE_KEYS.includes('moyasarPendingBooking'));
  assert.ok(LOGOUT_LOCAL_STORAGE_KEYS.includes('tamaraPendingBooking'));
});

test('a failing signOut() network call still results in every local cache being cleared', async () => {
  const storage = fakeStorage();
  const errors = [];
  const signOut = async () => { throw new Error('network down'); };

  await performLogout({ signOut, storage, onSignOutError: (err) => errors.push(err) });

  assert.equal(errors.length, 1);
  assert.equal(errors[0].message, 'network down');
  for (const key of LOGOUT_LOCAL_STORAGE_KEYS) {
    assert.ok(storage.removed.includes(key), `expected "${key}" to be cleared even when signOut() throws`);
  }
});
