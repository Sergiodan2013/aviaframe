# Airport Autocomplete Rollout Plan

> Goal: release the new airport autocomplete and metro-aware search with minimal customer risk.

---

## 1. Rollout Strategy

We release in two gates:

1. `UI + proxy gate`
- widget grouped autocomplete enabled
- backend autocomplete proxy enabled
- `FEATURE_PUBLIC_SEARCH_DRCT=false`
- customer sees improved airport selection
- search behavior stays compatible with today's placeholder-safe mode

2. `DRCT fan-out gate`
- enable `FEATURE_PUBLIC_SEARCH_DRCT=true`
- backend starts real metro-airport fan-out
- only after staging validation and explicit approval

This split keeps the highest-risk change behind a separate switch.

---

## 2. Why This Is Safe

Safety properties already built in:
- backend public search logic is feature-flagged
- when flag is off, placeholder response is preserved
- widget autocomplete has a local fallback dataset
- widget still supports single-airport selections
- backend has pair limit protection
- backend has short-lived cache to reduce duplicate load

Operationally, this means:
- autocomplete can improve before real fan-out is enabled
- rollback for search behavior is a flag flip, not a code revert

---

## 3. Release Order

### Step 1. Merge and deploy to staging

Deploy:
- backend changes
- widget bundle changes

Do not enable:
- `FEATURE_PUBLIC_SEARCH_DRCT=true`

Validate:
- [AIRPORT_AUTOCOMPLETE_STAGING_CHECKLIST.md](./AIRPORT_AUTOCOMPLETE_STAGING_CHECKLIST.md)

### Step 2. Approve UI + proxy gate

If staging passes:
- ship widget + backend proxy to production
- keep DRCT fan-out disabled

Expected production effect:
- users get improved airport suggestions
- search behavior does not change materially yet

### Step 3. Staging fan-out validation

In staging only:
- enable `FEATURE_PUBLIC_SEARCH_DRCT=true`
- run metro and single-airport test cases

Validate:
- merged offers
- partial failure behavior
- pair limit behavior
- no UI regressions

### Step 4. Approve DRCT fan-out gate

Only after explicit review:
- enable `FEATURE_PUBLIC_SEARCH_DRCT=true` in production

Recommended release window:
- business hours
- engineering observer available
- logs open live

---

## 4. Production Impact Check

Before any production deployment or flag enablement, confirm:

- no schema migration is required for the current release
- no payment, booking, or admin API route is changed
- widget embed contract remains backward compatible
- all changed files are limited to:
  - widget autocomplete behavior
  - backend public search behavior
  - backend autocomplete endpoint

Specific user-facing risks to review:
- dropdown usability on mobile
- multi-city search payload integrity
- Arabic UI directionality around autocomplete
- slow upstream autocomplete responses
- high fan-out combinations causing slow search

---

## 5. Observability During Release

Watch live during rollout:
- backend errors for `/public/airports/autocomplete`
- backend errors for `/public/search`
- request latency for autocomplete
- request latency for metro fan-out searches
- count of `partial: true` responses
- count of `FANOUT_LIMIT_EXCEEDED`

Useful evidence to save:
- one successful `lon` autocomplete response
- one successful single-airport search
- one successful metro fan-out search
- one handled partial failure example

---

## 6. Rollback Plan

### Fast rollback

If fan-out causes issues:
- set `FEATURE_PUBLIC_SEARCH_DRCT=false`

Effect:
- widget still works
- autocomplete still works
- search path falls back to placeholder-safe mode

### Full rollback

If widget autocomplete causes issues:
- restore previous widget bundle
- keep backend deployed if needed, since new endpoint is additive

Effect:
- customer UI returns to old flat airport list
- no need to rollback unrelated backend systems

---

## 7. Recommended Release Decision Tree

Release `UI + proxy gate` if:
- staging checklist blockers passed
- widget selection payload is correct
- no runtime JS errors

Release `DRCT fan-out gate` if:
- staging fan-out tests passed
- response times are acceptable
- dedupe is correct
- partial failures are handled cleanly

Do not release fan-out yet if:
- merged offers look duplicated or inconsistent
- multi-city flow is unstable
- provider latency is too high under common metro searches

---

## 8. Owner Checklist

Engineering owner:
- verify final branch diff
- verify widget build artifact
- verify feature flag default

Release owner:
- schedule staging validation
- collect screenshots and request payload evidence
- record go/no-go decision

Observer:
- monitor logs during first release window
- confirm no customer-facing regression reports

