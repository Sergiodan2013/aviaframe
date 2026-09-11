# Handoff — A06 done, A05 in progress (2026-09-11)

Context: closing the "code-only" group of findings from the uploaded security
audit (see project doc `claude/security-audit-comparison-and-fixes-2026-09-11.md`
for the full list: A08, A09, A14, A16, A06, A05, A13-partial, A20-partial,
A19-partial). Standing rules for all of this work: commission/markup UI stays
super-admin-only (never agency-admin); verify everything; cover with tests;
never break existing functionality.

## Fully DONE and verified in this session (all with tests, full regression green except the one pre-existing unrelated failure noted below)

- A08 (log redaction), A09 (agency-site XSS), A14 (rate-limit IP spoofing / trust proxy),
  A16 (logout doesn't call Supabase signOut) — done in an earlier part of this session.
- A13-partial (widget admin-preview needs verified admin auth) — done earlier.
- A20-partial — done earlier + just now: `backend/migrations/README.md` and
  `backend/db/migrations/README.md` added, `backend/db/README.md` given a
  prominent orphaned-doc banner. `|| true` removed from both `backend/package.json`
  and `portal/package.json` build scripts (now `cp -R src/. dist/`).
- **A06 (payment routes had no order-ownership check) — DONE, tested, verified.**
  - New helper `enforceOrderOwnershipIfAuthenticated(req, res, order)` in
    `backend/src/middleware/auth.js`: if no Authorization Bearer token is
    present, guest checkout is left untouched (order_id-as-capability, same as
    before — required so the anonymous widget flow keeps working). If a token
    IS present, it must resolve to a real user AND `canAccessOrder` must allow
    it, else 401/403.
  - Wired into `backend/src/routes/payments.js` (`card-scheme-check`, `initiate`)
    and `backend/src/routes/tamara.js` (`checkout-session`, `status/:orderId`).
    Also added the missing `canAccessOrder` check to `tamara.js`'s
    `cancel`/`refund` (they already required auth but never checked
    cross-tenant access — real gap, now fixed).
  - Tests: `backend/tests/security/auth-order-ownership.test.js` (7 tests, unit
    tests of the real helper) + `backend/tests/security/payment-order-ownership-routes.test.js`
    (8 tests, route wiring, including a guest-checkout-still-works regression test
    using the REAL middleware, not a stub).
  - Full regression at that point: 217/218 backend tests green (only failure:
    pre-existing unrelated `tests/partner-api/admin-routes.test.js` bug, confirmed
    independently by the uploaded audit report itself — not caused by any of my changes).
  - **Known, accepted limitation (already flagged to Sergii, not a bug):** an
    anonymous/guest caller who omits the Authorization header entirely still
    bypasses the ownership check — that's intentional, guest checkout has no
    login. Full closure of that specific vector needs a "guest capability
    token" product decision, out of scope for this pass.

## IN PROGRESS — A05 (GET /public/customer-profile leaks PII by email alone)

**User was asked and explicitly chose: "OTP-код на email (Recommended)"** —
i.e. require a one-time 6-digit email code before the widget's autofill
endpoint returns any PII, since a widget_token only proves "this is a
session of agency X's widget," never "the caller owns this email."

### Backend — DONE, NOT YET TESTED

- New file `backend/src/services/customerProfileVerification.js`: in-memory
  OTP store (mirrors the existing in-memory rate limiter pattern in
  `middleware/requestGuards.js` — same known single-instance limitation,
  already an accepted tradeoff elsewhere in this codebase per A14).
  10-min code TTL, 5 max verify attempts (single-use, deleted after
  success/exhaustion), max 3 sends per (agency,email) per 15 min (separate
  from the existing per-IP `profileLookupLimiter`, to stop mail-bombing an
  arbitrary victim's inbox). Exports `canSendCode`, `issueVerificationCode`,
  `verifyCode`, `_resetForTests`.
- `backend/src/services/emailService.js`: added `sendCustomerProfileVerificationCode({ to, code, agencyName })`,
  thin wrapper over the existing generic `sendSupportEmail`. Exported.
- `backend/src/routes/public.js`: **rewrote the customer-profile section.**
  - Factored the widget-token validation (typ/agency_id/origin check) that used
    to be inline in the GET handler into `requireValidWidgetSession(req, res)`,
    shared by all three endpoints below.
  - New `POST /public/customer-profile/request-code` — body `{ email, widget_token }`.
    Sends the OTP. Always responds `{ sent: true }` on success (never reveals
    whether a profile exists — avoids an email-existence oracle). 429 if the
    per-(agency,email) send limit is hit.
  - New `POST /public/customer-profile/verify-code` — body `{ email, widget_token, code }`.
    On success returns `{ found, profile? , verified_token }`. `verified_token`
    is signed via the EXISTING `issueWidgetToken`/`parseWidgetToken` HMAC
    primitives from `utils/helpers.js` (no new crypto) with
    `typ: 'customer_profile_verified'`, `agency_id`, `email`, 30-day `exp`.
  - `GET /public/customer-profile` — **behavior changed**: now REQUIRES a
    `verified_token` query param (in addition to the widget token) that must
    decode to a `customer_profile_verified` token whose `agency_id` matches
    the widget session's agency AND whose `email` matches the query email
    (case-insensitive via `normalizeEmail`). Missing/invalid/mismatched →
    401 `VERIFICATION_REQUIRED`. This is the actual fix — a widget token
    alone is no longer sufficient.
- `backend/src/app.js`: added `verified_token` and `code` to
  `SENSITIVE_QUERY_PARAMS` (URL log redaction).
- `backend/src/lib/logger.js`: added `verified_token` and `code` to the pino
  `redact.paths` field-name list (both bare and `*.` forms, matching the
  existing pattern for `token`/`widget_token`/etc.).
- **Updated existing tests** in `backend/tests/security/public-airport-search.test.js`
  (the old "valid widget token → 200 profile" test would now fail since it
  never provided the new required `verified_token`): replaced with three
  tests using the REAL `utils/helpers` signing (not mocked) — (1) valid widget
  token WITHOUT verified_token → 401 VERIFICATION_REQUIRED (proves the fix),
  (2) valid widget token WITH a matching verified_token → 200 with profile,
  (3) a verified_token issued for a DIFFERENT email can't be reused for
  another email → 401. **These three tests were written but NOT YET RUN** —
  next session should run
  `NODE_ENV=test npx jest --runInBand tests/security/public-airport-search.test.js`
  first thing and fix anything that doesn't pass before moving on.

### Backend — STILL TO DO

1. **Run the new/updated tests** (`public-airport-search.test.js`) — not yet
   executed this session, do this FIRST.
2. Write dedicated unit tests for `customerProfileVerification.js` itself
   (issue → verify happy path; wrong code increments attempts; TTL expiry;
   max-attempts lockout deletes the entry; per-email send-rate-limit; code is
   single-use/replay-proof).
3. Write route tests for the two new endpoints
   (`POST /customer-profile/request-code`, `POST /customer-profile/verify-code`)
   in a new file, e.g. `backend/tests/security/customer-profile-verification.test.js`:
   happy path end-to-end (request-code → verify-code → GET with the returned
   verified_token succeeds), wrong code rejected, expired code rejected,
   send-rate-limit 429, missing/invalid widget token rejected on both new
   endpoints too, email-not-found still returns `sent: true` on request-code
   (no oracle) and `found: false` + a verified_token on verify-code.
4. Full backend regression + eslint on all changed/added files (`git diff`
   discipline — there is no git repo here, so instead compare against the
   pre-A05 state by re-reading files / rerunning the full suite to catch
   anything my A05 edits broke elsewhere, e.g. anything else importing
   `public.js` exports, or the `content-hydrate.js` / `agencyProvision.js`
   agency-content endpoints living later in the same file — should be
   unaffected, but confirm).

### Frontend widget — NOT STARTED YET (required — the API contract changed)

This is the part that makes the fix actually usable rather than just
disabling autofill. Source of truth: **`widget/src/widget.js`** (NOT the
other 5 copies directly — see build/sync process below). The autofill logic
is around line ~3325–3440 in the version as of this session: an email
`blur` listener that calls `_afEnsureSessionToken()` (gets/caches a
`widget_token` via `POST /api/widget/session`) then
`GET /public/customer-profile?email=...` and, if `found`, autofills
phone/gender/dateOfBirth/firstName/lastName into the passenger form with an
"Undo" banner.

**Important, already confirmed:** the widget already does
`if (!_afResp.ok) return;` — i.e. it silently no-ops on any non-200 response.
This means simply shipping the backend change alone (without touching the
widget at all) does NOT break booking — it just silently disables the
autofill convenience feature until the widget bundle below is updated. That
is an acceptable *intermediate* state if a session gets interrupted, but the
work isn't done until the widget is updated to actually use the new
request-code/verify-code flow so autofill starts working again.

**Plan for the widget change (not yet implemented):**
1. On email blur: first check `localStorage` for a previously-stored
   `verified_token` for this exact agency+email pair (e.g. key
   `af_verified_profile:<email>`, since each agency's widget already runs on
   its own site origin so localStorage is naturally scoped per agency — no
   cross-agency leak risk from storage itself). If present and not expired,
   call the existing GET with `&verified_token=...` directly — **zero added
   friction for a returning verified visitor**, same UX as before.
2. If no cached token, or the GET comes back `401 VERIFICATION_REQUIRED`:
   show a small, explicit opt-in prompt (e.g. "Have a saved profile? Verify
   to autofill" button) rather than auto-sending an email on every blur —
   this is a deliberate anti-abuse choice (don't let a scripted blur-event
   spam trigger OTP emails to arbitrary victims without at least one explicit
   click) and was not something Sergii was asked about explicitly, so
   flag it to him if he'd rather it be fully automatic.
3. On click: `POST /public/customer-profile/request-code` with
   `{ email, widget_token }` (`Authorization: Bearer <widget_token>` like the
   existing calls). Show a small inline 6-digit code input + "Verify" +
   "Resend" (resend should be rate-limited client-side too, e.g. disabled for
   30s, since the server also rate-limits to 3/15min per email).
4. On submit: `POST /public/customer-profile/verify-code` with
   `{ email, widget_token, code }`. On success: reuse the EXACT existing
   autofill code (banner + field-fill + Undo) with the returned `profile`,
   and store the returned `verified_token` in localStorage keyed by email for
   next time. On failure: show the error inline (`VERIFICATION_INCORRECT_CODE`,
   `VERIFICATION_EXPIRED`, `VERIFICATION_TOO_MANY_ATTEMPTS`, `TOO_MANY_REQUESTS`
   from request-code) with a normal retry/resend affordance.
5. Bilingual strings needed (the file already has an `_wLang === 'ar'`
   pattern used right next to this code — follow that exact pattern for the
   new UI strings).

**Build/sync process (already verified working this session, DO NOT skip):**
This repo has a `widget/src/widget.js` ES-module source and FIVE checked-in
built-bundle copies that must stay byte-identical:
`widget/dist/aviaframe-widget.iife.js` (build output, gitignored-or-not TBD but
regenerated by build), `widget/aviaframe-widget.js`, `widget/demo/aviaframe-widget.js`,
`aviaframe-site/aviaframe-widget.js`, `backend/agency-site-assets/aviaframe-widget.js`,
`backend/src/agency-site-assets/aviaframe-widget.js`. There is a verifier:
`node scripts/verify-widget-artifacts.js` — run it after rebuilding.
Confirmed this session: `cd widget && npx vite build` reproduces the
CURRENT checked-in bundles byte-for-byte (`diff` showed zero differences) —
so the pipeline is: edit `widget/src/widget.js` → `cd widget && npx vite build`
→ `cp dist/aviaframe-widget.iife.js` to all 5 other locations listed above
(same bytes each) → `node scripts/verify-widget-artifacts.js` to confirm sync
→ done. No test harness exists for the widget JS (no jsdom test infra found
for it) — rely on careful manual code review of the diff, since this file is
served directly to production agency sites.

### Order of work for next session

1. Run `NODE_ENV=test npx jest --runInBand tests/security/public-airport-search.test.js`
   from `backend/` — fix anything red.
2. Write and run the `customerProfileVerification.js` unit tests + the two new
   route tests (`request-code`, `verify-code`) — get everything green.
3. Full backend regression (`NODE_ENV=test npx jest --runInBand --forceExit`
   from `backend/`) — expect only the one pre-existing unrelated
   `tests/partner-api/admin-routes.test.js` failure, nothing else.
4. `npx eslint src tests` from `backend/` — confirm zero NEW warnings/errors
   (there are some pre-existing unused-var warnings in unrelated files,
   already documented as pre-existing in earlier parts of this session).
5. Implement the widget frontend flow in `widget/src/widget.js` per the plan
   above.
6. Rebuild + sync all 5 widget bundle copies + run
   `node scripts/verify-widget-artifacts.js`.
7. Update the project doc `claude/security-audit-comparison-and-fixes-2026-09-11.md`
   to mark A06 done and A05 done (currently stale — still shows both as
   open/needs-decision).
8. Then move to Task 9 from the original plan: final full regression across
   ALL code-only fixes (backend + frontend/portal) and a final summary to
   Sergii of everything closed in this pass.
9. UPDATE (still 2026-09-11): everything above IS now committed — branch
   `wip/a05-a06-security-hardening`, commit `fde955c`, on top of `main` at
   `c1e26de`. **Push to GitHub (`origin`, https://github.com/sergiodan2013/aviaframe.git)
   FAILED**: "access denied by the git proxy: ... not in this session's
   authorized repository set" (403). So the commit only exists inside this
   session's cloud container right now — if that container becomes
   unreachable (e.g. after an account switch), this commit could be lost.
   First thing next session: check `git log --oneline -3` and
   `git branch --show-current` in `/home/claude/aviaframe-repo` — if you see
   commit `fde955c` still there, try `git push -u origin wip/a05-a06-security-hardening`
   again (maybe the new session has proper repo authorization). If the
   container/commit is gone, this markdown file (also mirrored to the
   Aviaframe Claude Project as `claude/HANDOFF_A05_A06_IN_PROGRESS_2026-09-11.md`)
   is the fallback record of exactly what was built — the actual code will
   need to be re-implemented from this description against the last known
   good `main` commit `c1e26de`. Sergii has NOT yet been asked whether/how to
   merge this branch into `main` — ask him once A05 is fully finished and
   tested end-to-end (backend + widget).

## Reference: standing rules for this whole effort (do not relax any of these)

- Commission/markup management stays in the super-admin cabinet ONLY — never
  add it to the agency-admin cabinet.
- Verify everything thoroughly before calling something done.
- Cover every change with tests.
- Never let a fix break existing/working functionality — if a behavior
  change is genuinely required (like this A05 OTP gate), degrade gracefully
  (as confirmed above: old widget code silently drops the now-unavailable
  autofill rather than erroring the booking flow) and get Sergii's explicit
  sign-off first (already obtained for A05 via AskUserQuestion — he chose the
  OTP option).
- Git commit message attribution when commits are eventually made:
  `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>` and
  `Claude-Session: https://claude.ai/code/session_01MHDbLGwdovvawdRYf2DNZr`.
