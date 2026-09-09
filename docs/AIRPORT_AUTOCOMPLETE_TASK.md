# Airport Autocomplete — Task Brief

> **Status:** implementation started.
> **Last updated:** 2026-06-02
> **Owner:** TBD
> **Audience:** another agent or engineer picking this up cold.

Related docs:
- [Airport Autocomplete Staging Checklist](./AIRPORT_AUTOCOMPLETE_STAGING_CHECKLIST.md)
- [Airport Autocomplete Rollout Plan](./AIRPORT_AUTOCOMPLETE_ROLLOUT_PLAN.md)

---

## 1. Goal

Replace the current airport input on the customer-facing widget with a Travelpayouts-style autocomplete that, on typing a city name, returns **all airports of that city grouped under a "City (all airports)" parent row**, with country headers above. The user supplied two reference screenshots showing the exact UX:

- Type `lon` → header `United Kingdom (GB)` → bold row **London (all airports)** with code `LON·` → indented children with tree-connector: Heathrow `LHR`, Gatwick `LGW`, Luton `LTN`, Stansted `STN`, Oxford `OXF`, City Airport `LCY` → next country header `Canada (CA)` → its matches.
- Type `mil` → `Italy (IT)` → **Milan (all airports)** `MIL·` → Malpensa `MXP`, Bergamo `BGY`, Linate `LIN`, Parma `PMF`, Rogoredo Railway Station `IMR` → `Greece (GR)` → Milos `MLO`.

User clarified: "ближайшие" = airports of the **same city** (metropolitan grouping). Not geographically nearby cities.

---

## 2. Current State (discovered)

### 2.1 Frontend (customer-facing widget)

- **File:** [widget/src/widget.js](../widget/src/widget.js) — single-line minified IIFE, ~1251 lines by `wc -l` but logic is on line 1.
- **Local airport array `q`**: 48 entries (LHR, CDG, FRA, AMS, DXB, JFK… — major hubs only). **Moscow, St. Petersburg, Almaty, Tashkent etc. are absent.**
- **Search function `F(query, limit=8)`**: substring `.filter()` over `code/city/cityRu/name/country`, `.sort()` by priority, `.slice(0, 8)`. Returns ALL matches up to 8 — not literally "one" — but the dataset is so sparse that for many queries it shows nothing or partial results.
- **Autocomplete UI `R(inputId, dropdownId)`**: at line 1107+. Renders flat list of `F()` results. No grouping. No keyboard navigation visible.
- **Selection writes**: `input.dataset.code = <IATA>` (line 1115, 1128).
- **Form submit**: `fetch(u, {method:"POST", body: JSON.stringify(f)})` at line 1132. `f.origin` and `f.destination` are taken from `input.dataset.code` — single IATA string.

### 2.2 Three copies of widget.js

| Path | Purpose | State |
|---|---|---|
| [widget/src/widget.js](../widget/src/widget.js) | Source | 1251 lines, ~48 airports |
| [widget/aviaframe-widget.js](../widget/aviaframe-widget.js) | Build output? | Differs from src |
| [aviaframe-site/aviaframe-widget.js](../aviaframe-site/aviaframe-widget.js) | Deployed to aviaframe.com via Netlify | Differs from src |

[widget/package.json](../widget/package.json) shows `"build": "vite build"` and `"main": "dist/aviaframe-widget.js"`. **Build pipeline unconfirmed** — verify whether deploy = `vite build` + copy to `aviaframe-site/`, or manual copy.

### 2.3 Backend (`/public/search`)

- **File:** [backend/src/routes/public.js](../backend/src/routes/public.js)
- **Critical finding:** lines 40–41 contain `const mockOffers = [];` with comment `// Mock search results (DRCT adapter not yet implemented)`. **The search endpoint is a stub. It saves the search to Supabase and returns an empty offer list. It does not call DRCT.**
- Accepts `origin`, `destination` as **strings**, calls `.toUpperCase()`, no IATA regex validation.
- No fan-out, no city→airports mapping.

### 2.4 DRCT integration — ready but not wired

- [backend/src/services/drctService.js](../backend/src/services/drctService.js) exposes `searchOffers(searchParams, tenantId)` with full reliability stack: rate limiter (`drctQueue`) → circuit breaker → retry → n8nClient → n8n webhook → DRCT API.
- DRCT request schema (per [backend/n8n_workflows/drct_search.json](../backend/n8n_workflows/drct_search.json)) requires `departure_airport_code` / `arrival_airport_code` — **specific IATA only, no metro codes**.

### 2.5 Other autocomplete (out of scope but noted)

- [portal/client/src/data/airports.js](../portal/client/src/data/airports.js) + [portal/client/src/components/AirportAutocomplete.jsx](../portal/client/src/components/AirportAutocomplete.jsx) — admin tool. Has 4 Moscow airports (MOW, DME, SVO, VKO). **Admin-only, not seen by customers.** Do not change as part of this task.

---

## 3. Architecture

```
┌─────────────────┐
│  Customer site  │  ← embedded widget.js
│  (agency.com)   │
└────────┬────────┘
         │ user types "lon"
         ▼
   ┌─────────────────────┐
   │ widget.js F(query)  │  CURRENT: filter local q[48]
   │                     │  NEW: fetch Travelpayouts + fallback
   └────────┬────────────┘
            │ user picks "London (all airports)"
            ▼
   ┌─────────────────────┐
   │ input.dataset.code  │  CURRENT: "LHR" (single)
   │                     │  NEW: code="LON", airports="LHR,LGW,LTN,STN,LCY"
   └────────┬────────────┘
            │ form submit
            ▼
   ┌─────────────────────┐
   │ POST /public/search │  CURRENT: stub, returns []
   │  (backend)          │  PHASE 2: wire drctService + fan-out
   └────────┬────────────┘
            │
            ▼ (Phase 2)
   ┌─────────────────────┐
   │ drctService         │  ALREADY WORKS for single airport
   │  → n8n → DRCT API   │  Needs caller to loop over airport pairs
   └─────────────────────┘
```

---

## 4. Solution Options Considered

### 4.1 Data source

| Option | Pros | Cons | Decision |
|---|---|---|---|
| Expand local JSON (~500 airports) | Offline, zero deps, fastest first paint | Manual maintenance, will drift | ❌ |
| **Travelpayouts `autocomplete.travelpayouts.com/places2`** (direct from widget) | Global, free, no auth needed, returns city_code + airports + country grouping natively | Network dep, debounce required | ✅ |
| Travelpayouts via backend proxy | Centralized rate-limit, analytics | Extra latency on every keystroke, ops burden | ❌ — premature |
| Aviasales/Amadeus suggest | Comparable | Auth required, no clear win | ❌ |

**Travelpayouts response shape** (for reference):
```json
[
  {
    "type": "city",
    "code": "LON",
    "name": "London",
    "country_code": "GB",
    "country_name": "United Kingdom",
    "main_airport_name": "Heathrow",
    "coordinates": { "lat": 51.5, "lon": -0.12 }
  },
  {
    "type": "airport",
    "code": "LHR",
    "name": "Heathrow",
    "city_code": "LON",
    "city_name": "London",
    "country_code": "GB",
    "country_name": "United Kingdom"
  }
]
```

### 4.2 Metro-code handling (where to fan out)

| Option | Pros | Cons | Decision |
|---|---|---|---|
| Frontend fan-out (widget sends N parallel `/public/search` calls) | Backend untouched | 5x backend load, UI must merge results, ruins "one search = one session" analytics | ❌ |
| **Backend fan-out, frontend sends airport list** | Single round-trip, backend can cache + dedupe, clean analytics | Requires backend changes | ✅ |
| Backend owns city→airports mapping table | Frontend simpler | Duplicates Travelpayouts data, deploy needed for every new airport | ❌ |
| Switch DRCT → metro-aware provider | One-shot solution | Massive rewrite, not in scope | ❌ |

### 4.3 Phasing

Phase split because backend is currently a stub — coupling autocomplete UX to a working search would block UX shipping behind DRCT integration.

| Phase | Scope | Independence |
|---|---|---|
| **1** | Widget: Travelpayouts integration, grouping UI, fallback, cache, keyboard nav. Stores `dataset.airports` on metro pick. | Self-contained. Search still returns `[]` (unchanged from today). |
| **2** | Backend: wire `drctService` to `/public/search`, fan-out over comma-separated airports, in-memory cache, pair limit. | Depends on Phase 1 sending the airport list, but can be developed independently. |
| **3** | Polish: mobile full-screen sheet, recent picks, analytics event for metro-code selection. | After Phase 1 + 2 land. |

---

## 5. Recommended Approach

### Phase 1 — Frontend autocomplete (estimated 3–4 hours)

**Files to modify:**
- [widget/src/widget.js](../widget/src/widget.js): replace `F()` and `R()` blocks; reduce local `q` to ~30 fallback hubs; add CSS for tree-connector and country headers.
- Rebuild via `vite build` (verify pipeline first).
- Copy/sync to [aviaframe-site/aviaframe-widget.js](../aviaframe-site/aviaframe-widget.js).

**Implementation notes:**
- Suggest endpoint: `https://autocomplete.travelpayouts.com/places2?term={q}&locale=ru&types[]=airport&types[]=city`. No auth.
- Debounce 250ms.
- Min query length: 1 char (Travelpayouts handles short queries well).
- localStorage cache key `aviaframe_ac_v1:{locale}:{term}`, TTL 24h, soft limit 200 entries (LRU).
- Group result:
  ```
  groupBy(country_code) → for each city, render parent row + children
  cities with single airport: skip parent, render airport as standalone
  ```
- Keyboard: ↑/↓ navigate, Enter select, Esc close, Tab move focus to next field.
- On select metro:
  ```js
  input.dataset.code = "LON"
  input.dataset.airports = "LHR,LGW,LTN,STN,LCY"
  input.dataset.cityName = "London"
  ```
  On select specific airport:
  ```js
  input.dataset.code = "LHR"
  input.dataset.airports = "" // empty = single
  ```
- Form submit (line 1132 area):
  ```js
  origin: input.dataset.airports || input.dataset.code
  origin_city: input.dataset.code   // for analytics
  ```
- Fallback: if Travelpayouts fails (network/CORS/timeout), fall back to local `q` filter silently. No error UI.
- Loading state: do NOT show spinner (debounce hides perceived latency).

**Acceptance criteria:**
- Typing "lon" → exactly the screenshot layout (country header → city parent → indented airports).
- Typing "mos" → Moscow shown with SVO + DME + VKO + ZIA children (proves dataset gap is closed).
- Selecting metro stores both code and airport list in dataset.
- With network blocked, typing still surfaces top 30 hubs from fallback.
- No console errors, no layout shift.

### Phase 2 — Backend fan-out (estimated 4–6 hours)

**Files to modify:**
- [backend/src/routes/public.js](../backend/src/routes/public.js): replace mock with real `drctService.searchOffers` call(s) + fan-out.

**Implementation notes:**
- Accept `origin`/`destination` as comma-separated string. Split.
- Max pairs = 25 (London↔Moscow ~6×4=24 fits). Return 400 if exceeded.
- Parallelism: `p-limit(5)`. DRCT sandbox may not love bursts.
- `Promise.allSettled` — partial failures are OK. Return `partial: true` flag if any failed.
- Merge offers, dedupe by `offer_id` (or `flight_number+date+price` as fallback), sort by price ASC.
- In-memory cache, TTL 90s, key `{origin}|{destination}|{depart}|{return}|{pax}|{cabin}`. Reset on process restart is fine.
- Logging: emit one search row in `searches` table with `origin_city` field + JSON meta of actual airports queried. Add columns if needed:
  ```sql
  ALTER TABLE searches
    ADD COLUMN origin_city VARCHAR(8),
    ADD COLUMN destination_city VARCHAR(8),
    ADD COLUMN fanout_meta JSONB;
  ```

**Acceptance criteria:**
- POST `/public/search` with `origin="LHR,LGW,LTN"` returns merged offers from 3 DRCT calls.
- If 1 of 3 DRCT calls fails, response includes 2 sets + `partial: true`.
- 25-pair limit enforced.
- Re-submitting identical search within 90s hits cache.

---

## 6. Open Questions (need user/owner answer before Phase 1)

1. **Deploy target confirmation.** Is `aviaframe-site/aviaframe-widget.js` the file Netlify serves? Should the workflow be: edit `widget/src/widget.js` → `npm run build` → copy `widget/dist/aviaframe-widget.js` → `aviaframe-site/aviaframe-widget.js`? Or is there a different pipeline?
2. **Travelpayouts partner token.** Public endpoint `places2` works tokenless. If we have `TRAVELPAYOUTS_API_TOKEN`, switching to authed Suggest API gives higher rate limits and richer data. Check env / 1Password / Vercel/Netlify env vars.
3. **Locale.** Widget supports `en` + `ar`. Travelpayouts supports many locales. Pass `locale=en` for English UI, `locale=ar` for Arabic, fallback `en`. Confirm Arabic results are acceptable.
4. **Multi-city / 2nd segment.** Widget supports multi-city mode (`from_2`, `to_2`). Should those inputs also get the new autocomplete? (Assumed yes — they're the same field type.)
5. **Phase 2 priority.** Backend search is currently a stub — UX work in Phase 1 ships even with broken search. Is wiring DRCT in scope of this task, or tracked separately?

---

## 7. Risks

- **Safety rule** (from user memory): "Before every deploy: do not touch payments.js/tamara.js/widget.js without explicit ask". User explicitly authorized this specific change ("делай что будет лучше всего" in the airport autocomplete thread). **Do not bundle unrelated widget changes.**
- **Minified source.** Editing a single-line 1251-char file with `Edit` tool is fragile. Strongly prefer: reformat `widget/src/widget.js` once (or work on a beautified copy), make changes, rebuild via Vite. Verify diff before deploy.
- **Backend stub.** Phase 1 ships UX but search results stay empty until Phase 2. Communicate this clearly to user/agencies — don't let them think autocomplete fixed search.
- **Tamara/payments untouched.** Verify zero diff in `widget/src/payments.js`, `widget/src/tamara.js` (or equivalents) after every build.
- **CORS.** Travelpayouts allows `*` origin on `places2` (verified in docs). Re-verify in actual browser before relying on it.
- **Rate limit.** Free Travelpayouts public endpoint: no documented hard limit, but at scale (1000s of agencies × keystrokes) we may hit one. localStorage cache + debounce mitigates. Plan B: add Netlify Function proxy with edge cache.

---

## 8. Out of Scope

- Geographic "nearby cities by radius" — user explicitly rejected this.
- Train/bus autocomplete (separate tabs shown in screenshots — different data source).
- Portal admin airport selector — different component, leave alone.
- Travelpayouts affiliate marker / tracking — not relevant for `places2`.
- Persisted recent picks — moved to Phase 3.

---

## 9. How another agent should pick this up

1. **Read the brief in full.** Particularly §2 (current state) and §5 (recommended approach).
2. **Answer the open questions in §6 with the user** before writing code. The deploy pipeline question is the biggest unknown — guessing it wrong wastes the work.
3. **Phase 1 first.** Self-contained, shippable, gives the user the visible win immediately.
4. **Verify with the user that they accept "search still returns []" between Phase 1 and Phase 2.** If not, do Phases 1 and 2 together.
5. **Before any deploy:** diff against the safety-listed files (`payments.js`, `tamara.js`, `widget.js`) — confirm only widget.js changed, and only the autocomplete-related sections.
6. **Test on `widget-demo.html`** (in `aviaframe-site/`) locally before pushing.
7. **Cross-check with reference screenshots** — they're the spec for UI.
