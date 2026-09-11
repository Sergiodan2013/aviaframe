'use strict';

// In-memory email-ownership verification for the widget's "returning customer"
// autofill feature (security audit finding A05).
//
// Background: GET /public/customer-profile used to return a customer's PII
// (name, phone, gender, date of birth) given nothing but an email address and
// a widget session token. The widget session token only proves "this request
// came from agency X's widget" — it does NOT prove the caller owns that email
// address. Since the widget requires no login, anyone who opened an agency's
// public widget could type in a stranger's email and read that stranger's PII.
//
// Fix: before any PII is returned for an email on a given device, the caller
// must prove they can read email sent to that address (a one-time 6-digit
// code). Successful verification issues a signed, short-lived token (reusing
// the existing widget-token HMAC signing primitives) that the client can
// present on subsequent lookups so a *returning* verified visitor keeps the
// instant-autofill experience without re-verifying every time.
//
// Storage is in-memory (mirrors the existing rate limiter in
// middleware/requestGuards.js) — acceptable for a single backend instance;
// like that limiter, this does not survive a process restart or scale across
// multiple instances. That is a known, pre-existing limitation of this
// deployment (see the A14 rate-limit finding) and not something this fix
// needs to solve.

const crypto = require('crypto');
const { toSha256 } = require('../utils/helpers');

const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_VERIFY_ATTEMPTS = 5;
const MAX_SENDS_PER_WINDOW = 3;
const SEND_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

// key: `${agencyId}:${normalizedEmail}` -> { codeHash, expiresAt, attempts, sendTimestamps }
const store = new Map();

function cleanupExpired(now) {
  for (const [key, entry] of store.entries()) {
    const noActiveCode = !entry.expiresAt || entry.expiresAt <= now;
    const noRecentSends = !entry.sendTimestamps
      || entry.sendTimestamps.every((ts) => now - ts > SEND_WINDOW_MS);
    if (noActiveCode && noRecentSends) {
      store.delete(key);
    }
  }
}

function keyFor(agencyId, email) {
  return `${agencyId}:${email}`;
}

function generateCode() {
  // 6-digit numeric code, zero-padded.
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
}

/**
 * Checks (and records) whether another verification code may be sent for
 * this (agencyId, email) pair right now. Independent of the per-IP limiter
 * already on the route — this one is keyed by the target email itself, so it
 * caps how many OTP emails a single target address can be sent regardless of
 * how many different IPs/widget sessions request them (defends against using
 * the endpoint to spam an arbitrary victim's inbox).
 */
function canSendCode(agencyId, email) {
  const now = Date.now();
  cleanupExpired(now);
  const key = keyFor(agencyId, email);
  const entry = store.get(key) || {};
  const recentSends = (entry.sendTimestamps || []).filter((ts) => now - ts <= SEND_WINDOW_MS);
  return recentSends.length < MAX_SENDS_PER_WINDOW;
}

/**
 * Generates and stores a new verification code for (agencyId, email),
 * recording the send for rate-limiting purposes. Returns the plaintext code
 * to be emailed to the customer — never stored or logged in plaintext.
 */
function issueVerificationCode(agencyId, email) {
  const now = Date.now();
  cleanupExpired(now);
  const key = keyFor(agencyId, email);
  const code = generateCode();
  const existing = store.get(key) || {};
  const recentSends = (existing.sendTimestamps || []).filter((ts) => now - ts <= SEND_WINDOW_MS);
  recentSends.push(now);

  store.set(key, {
    codeHash: toSha256(code),
    expiresAt: now + CODE_TTL_MS,
    attempts: 0,
    sendTimestamps: recentSends
  });

  return code;
}

/**
 * Verifies a submitted code for (agencyId, email). Single-use: a successful
 * verification (or exhausting the attempt limit) invalidates the stored code
 * so it cannot be replayed or brute-forced further.
 *
 * Returns one of: { valid: true } | { valid: false, reason }
 * reason is one of: 'NOT_REQUESTED' | 'EXPIRED' | 'TOO_MANY_ATTEMPTS' | 'INCORRECT_CODE'
 */
function verifyCode(agencyId, email, submittedCode) {
  const now = Date.now();
  cleanupExpired(now);
  const key = keyFor(agencyId, email);
  const entry = store.get(key);

  if (!entry || !entry.codeHash) {
    return { valid: false, reason: 'NOT_REQUESTED' };
  }
  if (entry.expiresAt <= now) {
    store.delete(key);
    return { valid: false, reason: 'EXPIRED' };
  }
  if (entry.attempts >= MAX_VERIFY_ATTEMPTS) {
    store.delete(key);
    return { valid: false, reason: 'TOO_MANY_ATTEMPTS' };
  }

  const submittedHash = toSha256(String(submittedCode || '').trim());
  const submittedBuffer = Buffer.from(submittedHash, 'utf8');
  const expectedBuffer = Buffer.from(entry.codeHash, 'utf8');
  const matches = submittedBuffer.length === expectedBuffer.length
    && crypto.timingSafeEqual(submittedBuffer, expectedBuffer);

  if (!matches) {
    entry.attempts += 1;
    if (entry.attempts >= MAX_VERIFY_ATTEMPTS) {
      store.delete(key);
    }
    return { valid: false, reason: 'INCORRECT_CODE' };
  }

  // Single-use: consume the code on success.
  store.delete(key);
  return { valid: true };
}

// Exposed for tests only — lets a test suite reset state between cases
// without reaching into module internals.
function _resetForTests() {
  store.clear();
}

module.exports = {
  canSendCode,
  issueVerificationCode,
  verifyCode,
  CODE_TTL_MS,
  MAX_VERIFY_ATTEMPTS,
  MAX_SENDS_PER_WINDOW,
  SEND_WINDOW_MS,
  _resetForTests
};
