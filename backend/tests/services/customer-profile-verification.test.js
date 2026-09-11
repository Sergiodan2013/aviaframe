'use strict';

// Unit tests for backend/src/services/customerProfileVerification.js — the
// in-memory OTP store backing the A05 fix (GET /public/customer-profile PII
// leak). See backend/tests/security/customer-profile-verification.test.js
// for the route-level (HTTP) tests of the two endpoints that use this.

const otp = require('../../src/services/customerProfileVerification');

describe('customerProfileVerification', () => {
  beforeEach(() => {
    otp._resetForTests();
    jest.useRealTimers();
  });

  test('issue then verify with the correct code succeeds', () => {
    const code = otp.issueVerificationCode('agency-1', 'traveler@example.com');
    expect(code).toMatch(/^\d{6}$/);

    const result = otp.verifyCode('agency-1', 'traveler@example.com', code);
    expect(result).toEqual({ valid: true });
  });

  test('verifying with no code ever issued for that (agency, email) is rejected', () => {
    const result = otp.verifyCode('agency-1', 'nobody@example.com', '123456');
    expect(result).toEqual({ valid: false, reason: 'NOT_REQUESTED' });
  });

  test('a wrong code is rejected and does not consume the real code', () => {
    const code = otp.issueVerificationCode('agency-1', 'traveler@example.com');
    const wrongCode = code === '000000' ? '111111' : '000000';

    const wrongResult = otp.verifyCode('agency-1', 'traveler@example.com', wrongCode);
    expect(wrongResult).toEqual({ valid: false, reason: 'INCORRECT_CODE' });

    // The real code should still work — one wrong guess doesn't burn the code itself.
    const rightResult = otp.verifyCode('agency-1', 'traveler@example.com', code);
    expect(rightResult).toEqual({ valid: true });
  });

  test('a code is single-use — replaying the exact same correct code a second time fails', () => {
    const code = otp.issueVerificationCode('agency-1', 'traveler@example.com');
    expect(otp.verifyCode('agency-1', 'traveler@example.com', code)).toEqual({ valid: true });

    const replay = otp.verifyCode('agency-1', 'traveler@example.com', code);
    expect(replay).toEqual({ valid: false, reason: 'NOT_REQUESTED' });
  });

  test('exceeding MAX_VERIFY_ATTEMPTS wrong guesses locks out and invalidates the code', () => {
    const code = otp.issueVerificationCode('agency-1', 'traveler@example.com');
    const wrongCode = code === '000000' ? '111111' : '000000';

    let lastResult;
    for (let i = 0; i < otp.MAX_VERIFY_ATTEMPTS; i += 1) {
      lastResult = otp.verifyCode('agency-1', 'traveler@example.com', wrongCode);
    }

    expect(lastResult.reason).toBe('TOO_MANY_ATTEMPTS');

    // Even the CORRECT code no longer works — the entry was invalidated, not
    // just the wrong guesses rejected. This forces a fresh request-code call.
    const afterLockout = otp.verifyCode('agency-1', 'traveler@example.com', code);
    expect(afterLockout).toEqual({ valid: false, reason: 'NOT_REQUESTED' });
  });

  test('a code expires after CODE_TTL_MS and can no longer be used', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));

    const code = otp.issueVerificationCode('agency-1', 'traveler@example.com');

    jest.setSystemTime(new Date(Date.now() + otp.CODE_TTL_MS + 1000));

    const result = otp.verifyCode('agency-1', 'traveler@example.com', code);
    expect(result).toEqual({ valid: false, reason: 'EXPIRED' });

    jest.useRealTimers();
  });

  test('codes and rate limits are scoped per agency — the same email at two agencies does not collide', () => {
    const codeAgencyA = otp.issueVerificationCode('agency-A', 'shared@example.com');
    const codeAgencyB = otp.issueVerificationCode('agency-B', 'shared@example.com');
    expect(codeAgencyA).not.toBe(undefined);
    expect(codeAgencyB).not.toBe(undefined);

    // Agency A's code must not verify against agency B's entry.
    expect(otp.verifyCode('agency-B', 'shared@example.com', codeAgencyA).valid).toBe(false);
    // But each agency's own code works for that agency.
    expect(otp.verifyCode('agency-A', 'shared@example.com', codeAgencyA)).toEqual({ valid: true });
    expect(otp.verifyCode('agency-B', 'shared@example.com', codeAgencyB)).toEqual({ valid: true });
  });

  describe('per-email send rate limiting (canSendCode / issueVerificationCode)', () => {
    test('allows sends up to MAX_SENDS_PER_WINDOW, then blocks further sends', () => {
      for (let i = 0; i < otp.MAX_SENDS_PER_WINDOW; i += 1) {
        expect(otp.canSendCode('agency-1', 'victim@example.com')).toBe(true);
        otp.issueVerificationCode('agency-1', 'victim@example.com');
      }

      // The (MAX_SENDS_PER_WINDOW + 1)th send attempt must be blocked — this
      // is what stops the endpoint being used to mail-bomb an arbitrary
      // victim's inbox regardless of which IP/session is asking.
      expect(otp.canSendCode('agency-1', 'victim@example.com')).toBe(false);
    });

    test('the send limit is scoped per (agency, email) — a different agency is not blocked', () => {
      for (let i = 0; i < otp.MAX_SENDS_PER_WINDOW; i += 1) {
        otp.issueVerificationCode('agency-1', 'victim@example.com');
      }
      expect(otp.canSendCode('agency-1', 'victim@example.com')).toBe(false);
      expect(otp.canSendCode('agency-2', 'victim@example.com')).toBe(true);
    });

    test('the send limit resets after SEND_WINDOW_MS has elapsed', () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));

      for (let i = 0; i < otp.MAX_SENDS_PER_WINDOW; i += 1) {
        otp.issueVerificationCode('agency-1', 'victim@example.com');
      }
      expect(otp.canSendCode('agency-1', 'victim@example.com')).toBe(false);

      jest.setSystemTime(new Date(Date.now() + otp.SEND_WINDOW_MS + 1000));

      expect(otp.canSendCode('agency-1', 'victim@example.com')).toBe(true);

      jest.useRealTimers();
    });
  });
});
