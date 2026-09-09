# Legacy Proxy Tooling Decommission Plan — 2026-08-07

## Context

This plan covers the decommission of all tooling that targets the legacy DRCT mutating proxy paths:

- `POST /webhook/drct/order/create`
- `POST /webhook/drct/order/issue`
- `POST /webhook/drct/order/cancel`

These are unauthenticated n8n-forwarding endpoints exposed via `app.all('/webhook/*')` in `backend/src/app.js`, controlled by the `ALLOW_PUBLIC_DRCT_MUTATING_PROXY` feature flag (Agent A scope).

Replacement flows:
- `POST /api/orders` (auth required)
- `POST /api/orders/:orderId/issue` (staff/admin required)
- `POST /api/orders/:orderId/cancel` (staff/admin required)
- `POST /api/widget/session` → `POST /api/widget/orders` (widget/customer)

---

## Inventory of Legacy Tooling

### Tier 1 — Documentation (already deprecated, no runtime impact)

These files were updated by Agent B (2026-08-07) and now carry visible `⚠️ DEPRECATED` notices. They pose no runtime risk but should be archived or rewritten after cutover.

| File | What it contains | Status |
|------|-----------------|--------|
| `backend/N8N_SETUP_GUIDE.md` | Full n8n setup for create/issue/cancel webhook paths | Marked deprecated |
| `backend/N8N_INTEGRATION.md` | Integration reference with webhook path descriptions | Marked deprecated |
| `backend/src/services/README.md` | Workflow path table + `drctCreateOrder()` example | Marked deprecated |
| `backend/n8n_workflows/README.md` | Workflow definitions, curl examples, JS client class | Marked deprecated |
| `N8N_PAYLOAD_FORMAT.md` | Payload format for `/webhook-test/drct/order/create` | Marked deprecated |
| `TEST_SCENARIOS.md` | QA scenarios referencing legacy booking path | Updated |
| `FIX_SUMMARY.md` | Historical fix notes, no endpoint references | Clean, no action |

**Recommended action after cutover**: Archive these files to `docs/archive/` or clearly mark them as historical reference only. No urgency — they are already labeled.

---

### Tier 2 — Test Scripts (runtime-touching, must update after cutover)

#### `backend/scripts/test_n8n.js`

Contains 5 tests; 3 test deprecated mutating proxy paths (already commented as DEPRECATED by Agent B):

| Test | Current target | Status | Post-cutover action |
|------|---------------|--------|---------------------|
| Test 1: Search | `/webhook/drct/search` | ✅ Keep | No change |
| Test 2: Price | `/webhook/drct/price` | ✅ Keep | No change |
| Test 3: Order Create | `/webhook/drct/order/create` | ⚠️ Deprecated | Rewrite or delete |
| Test 4: Order Issue | `/webhook/drct/order/issue` | ⚠️ Deprecated | Rewrite or delete |
| Test 5: Order Cancel | `/webhook/drct/order/cancel` | ⚠️ Deprecated | Rewrite or delete |

**Recommended action after cutover**: Delete Tests 3–5 or replace with equivalent tests for `/api/orders`, `/api/orders/:id/issue`, `/api/orders/:id/cancel`. The replacement tests will need a valid staff/admin auth token, which means updating the test setup.

Note: this script is n8n-targeted by design. If n8n is no longer used for any DRCT mutating operations, the entire script may be decommissioned. Keep only if the search/price tests provide value vs. the existing backend test suite.

---

### Tier 3 — Netlify Redirect Rules (infrastructure, action after cutover)

#### `portal/client/scripts/write-redirects.js`

| Rule | Purpose | Status | Post-cutover action |
|------|---------|--------|---------------------|
| `/api/backend/*` → `BACKEND_URL/api/:splat` | Portal → backend API (sanctioned) | ✅ Keep | No change |
| `/api/n8n/webhook-test/*` → `BACKEND_URL/webhook/:splat` | Search path (active) | ✅ Keep | No change (search stays) |
| `/api/n8n/*` → `BACKEND_URL/:splat` | Legacy compat catch-all | ⚠️ Deprecated | Remove after cutover confirmed |
| `/*` → `/index.html` | SPA fallback | ✅ Keep | No change |

**Recommended action after cutover**: Remove Rule 3 from `write-redirects.js`. Requires triggering a Netlify redeploy of `portal/client` after the change to regenerate `dist/_redirects`.

**Risk of removing Rule 3**: Zero if no live browser clients are still calling `/api/n8n/webhook/drct/order/*`. The telemetry window (Agent A) should confirm this before action.

---

### Tier 4 — Backend Services (Agent A scope, listed for completeness)

These are locked files owned by Agent A. Listed here for full decommission awareness only.

| File | What to decommission | When |
|------|---------------------|------|
| `backend/src/services/n8nClient.js` | `drctCreateOrder()`, `drctIssueOrder()`, `drctCancelOrder()` methods | After cutover + no compat traffic |
| `backend/src/app.js` | `app.all('/webhook/*')` proxy middleware block | After cutover + flip confirmed |
| `backend/src/app.js` | `ALLOW_PUBLIC_DRCT_MUTATING_PROXY` env var check | After flip confirmed |

---

## Recommended Decommission Order

This order minimises rollback risk and follows the natural dependency chain:

```
1. [NOW / Agent A] Collect telemetry on legacy proxy calls
       ↓
2. [NOW / Agent B done] Mark docs deprecated, test_n8n.js DEPRECATED comments
       ↓
3. [After telemetry window] Confirm zero repo-owned browser consumers in prod logs
       ↓
4. [Agent A] Flip ALLOW_PUBLIC_DRCT_MUTATING_PROXY=false
       ↓
5. [Agent B or any] Remove Rule 3 from write-redirects.js + Netlify redeploy
       ↓
6. [Agent B or any] Delete Tests 3–5 in test_n8n.js (or rewrite for /api/orders)
       ↓
7. [Agent A] Remove drctCreateOrder/drctIssueOrder/drctCancelOrder from n8nClient.js
       ↓
8. [Agent A] Remove app.all('/webhook/*') proxy block from app.js
       ↓
9. [Optional] Archive deprecated docs to docs/archive/
```

---

## What to Keep Permanently

| Component | Reason |
|-----------|--------|
| `/webhook/drct/search` + n8n search workflow | Active: widget search still routes through this |
| `/webhook/drct/price` + n8n price workflow | Active: widget OfferPrice check |
| n8n email dispatch workflow (`B9EGaX3ZtFVbI38E`) | Active: cron-based email processing |
| `backend/scripts/smoke-test.js` | Active: keep, remove hardcoded date (`'2026-09-15'` → `+60 days`) |

---

## Open Risks

| Risk | Mitigation |
|------|-----------|
| External integrators not in this repo may still call legacy paths | Telemetry window (Agent A) will surface them |
| `test_n8n.js` Tests 3–5 will fail after `ALLOW_PUBLIC_DRCT_MUTATING_PROXY=false` | Already marked DEPRECATED; expected failure, not a regression |
| Removing Rule 3 from `write-redirects.js` requires a Netlify redeploy | Must coordinate with next portal deployment |
