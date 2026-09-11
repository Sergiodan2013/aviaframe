// A16: logout previously only cleared the local `user` mirror and React
// state — it never called Supabase's own signOut(), so the underlying auth
// session/refresh token stayed alive, and several localStorage caches of
// the departing user's data were left behind for the next person to use
// this browser. This module is the single, unit-testable place that lists
// what "logging out" actually has to clear, so App.jsx's logout handler
// stays a thin wrapper around it instead of re-deriving this list by hand.

// Every localStorage key that can hold data tied to the signed-in user or
// an in-progress/pending booking of theirs. `user` is the session mirror
// itself; the rest are booking-flow caches that should not survive a
// logout on a shared device.
export const LOGOUT_LOCAL_STORAGE_KEYS = [
  'user',
  'avia_orders_cache',
  'selectedOffer',
  'passengerData',
  'pendingOffer',
  'moyasarPendingBooking',
  'tamaraPendingBooking',
];

/**
 * Performs a full logout: ends the real Supabase session, then clears
 * every local cache that could otherwise leak into the next session on
 * this device.
 *
 * @param {Object} deps
 * @param {() => Promise<{ error?: unknown }>} deps.signOut - Supabase's
 *   own signOut() (or a test double). Failures are logged but never block
 *   clearing local state — a user must always be able to log out locally
 *   even if the sign-out network call fails.
 * @param {{ removeItem: (key: string) => void }} deps.storage - a
 *   Storage-like object (window.localStorage in the app, a plain object
 *   or spy in tests).
 * @param {(err: unknown) => void} [deps.onSignOutError] - optional error
 *   reporter, defaults to a no-op so tests don't need to stub console.
 */
export async function performLogout({ signOut, storage, onSignOutError = () => {} }) {
  try {
    await signOut();
  } catch (err) {
    onSignOutError(err);
  }

  for (const key of LOGOUT_LOCAL_STORAGE_KEYS) {
    storage.removeItem(key);
  }
}
