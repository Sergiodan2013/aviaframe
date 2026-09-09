# Airport Autocomplete Staging Checklist

> Purpose: validate the new backend-controlled airport autocomplete and metro-airport fan-out flow before any production release.
> Scope: widget + `/public/airports/autocomplete` + `/public/search`.
> Rule: do not enable `FEATURE_PUBLIC_SEARCH_DRCT=true` in production until every `Blocker` item passes.

---

## 1. Release Scope

Included changes:
- backend autocomplete proxy at `/public/airports/autocomplete`
- widget grouped autocomplete UX
- widget metro selection payload:
  - `origin`
  - `destination`
  - `origin_city`
  - `destination_city`
- backend fan-out support for comma-separated airport lists
- backend search cache and pair limit

Excluded from this release:
- new pricing/sorting logic
- booking checkout changes
- admin portal behavior changes
- DRCT contract changes

---

## 2. Environment Preconditions

Blocker:
- staging backend is deployed from the current branch/build
- staging widget bundle matches [widget/dist/aviaframe-widget.iife.js](../widget/dist/aviaframe-widget.iife.js)
- `FEATURE_PUBLIC_SEARCH_DRCT=false` for phase-1 validation
- `AIRPORT_AUTOCOMPLETE_URL` is set or default is reachable
- staging has working network egress to the autocomplete upstream
- staging logs are accessible during test session

Recommended:
- one tester on desktop Chrome
- one tester on mobile viewport
- one observer watching backend logs

Evidence to capture:
- widget screenshots for `lon`, `mil`, `mos`
- request payload screenshot from browser devtools
- backend log snippet for autocomplete
- backend log snippet for public search

---

## 3. Phase A: Safe UI Validation

Goal: validate the widget behavior while DRCT public fan-out stays disabled.

Configuration:
- `FEATURE_PUBLIC_SEARCH_DRCT=false`

### A1. Basic autocomplete

Blocker:
- typing `lon` shows `United Kingdom (GB)` and grouped London results
- typing `mil` shows `Italy (IT)` and grouped Milan results
- typing `mos` shows Moscow airports including `SVO`, `DME`, `VKO`, `ZIA`
- typing `ala` shows Almaty
- typing `tas` shows Tashkent

Pass if:
- country headers are visible
- parent city row is selectable
- child airport rows are selectable
- no broken layout or overlapping dropdown

### A2. Keyboard behavior

Blocker:
- `ArrowDown` highlights next item
- `ArrowUp` highlights previous item
- `Enter` selects highlighted item
- `Escape` closes dropdown

Pass if:
- no page jump
- no duplicate selection
- no stuck active state after selection

### A3. Metro selection payload

Blocker:
- selecting `London (all airports)` stores metro selection and submits airport list
- selecting `Heathrow` stores single-airport selection and submits single code

How to verify:
- inspect outgoing `/public/search` request in devtools

Expected for metro selection:
```json
{
  "origin": "LHR,LGW,LTN,STN,LCY",
  "origin_city": "LON"
}
```

Expected for single airport:
```json
{
  "origin": "LHR",
  "origin_city": "LHR"
}
```

### A4. Existing flows must still work

Blocker:
- one-way search form submits
- return search form submits
- multi-city form still validates second segment correctly
- fallback demo results still render when backend returns no offers or is unreachable

Pass if:
- no JS exception in console
- no broken passenger step
- no change to existing result card UI structure

---

## 4. Phase B: Backend Autocomplete Validation

Goal: validate proxy behavior without enabling DRCT fan-out yet.

### B1. Endpoint behavior

Blocker:
- `GET /public/airports/autocomplete?q=lon` returns `200`
- payload contains `groups`
- payload contains `source`
- empty `q` returns `400`

### B2. Fallback behavior

Recommended:
- simulate upstream failure
- confirm endpoint still returns fallback suggestions for common cities

Pass if:
- no `500`
- response remains usable for the widget

### B3. No secrets leakage

Blocker:
- autocomplete response does not expose internal config
- logs do not print tokens, secrets, or full raw request bodies with sensitive data

---

## 5. Phase C: DRCT Fan-Out Validation

Goal: validate real search behavior only after UI and proxy are stable.

Configuration:
- enable `FEATURE_PUBLIC_SEARCH_DRCT=true` in staging only

### C1. Simple search

Blocker:
- single-airport search still works for `LHR -> JFK`
- response contains offers or expected empty-provider behavior
- no server error

### C2. Metro fan-out

Blocker:
- metro search `London (all airports) -> JFK` triggers merged result flow
- backend returns `pair_count`
- backend returns deduped offers

Pass if:
- search completes successfully
- result rendering stays intact
- no duplicate cards caused by pair fan-out

### C3. Partial failure handling

Recommended:
- simulate one pair failure
- verify `partial: true`
- verify successful pairs still render

### C4. Pair limit

Blocker:
- oversized request returns `400 FANOUT_LIMIT_EXCEEDED`
- widget handles this gracefully

---

## 6. Regression Checks

Blocker:
- admin portal still loads
- widget embed on demo page still initializes
- existing checkout handoff event still fires
- existing `selectedOffer` storage still works
- Arabic language toggle still works

Recommended:
- smoke-check public legal pages if using `aviaframe-site` build copy

---

## 7. Go / No-Go Decision

Go if:
- all `Blocker` items passed
- no high-severity console error remains
- no backend `500`/uncaught exception in staging logs
- `FEATURE_PUBLIC_SEARCH_DRCT=true` is validated in staging

No-Go if:
- grouped autocomplete breaks selection
- outgoing payload is malformed
- multi-city flow regresses
- fan-out duplicates or corrupts offers
- response time becomes unacceptable for normal searches

---

## 8. Sign-Off

- Engineering owner:
- QA / reviewer:
- Date:
- Staging build/version:
- Feature flag status:

