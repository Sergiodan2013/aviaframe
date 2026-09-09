# External / Manual Consumer Validation and Doc Archive Plan — 2026-08-07

## Purpose

This document covers what the grep search on the repo cannot cover:
- which repo references are acceptable as deprecation context vs still operationally risky;
- what manual/external surfaces must be validated before `ALLOW_PUBLIC_DRCT_MUTATING_PROXY=false` flip;
- what happens to docs and tooling after a successful flip.

---

## 1. Repo Evidence Inventory

Search command used:
```bash
rg -n "drct/order/create|drct/order/issue|drct/order/cancel|api/n8n/webhook/drct/order" \
  docs backend README.md TEST_SCENARIOS.md N8N_PAYLOAD_FORMAT.md FIX_SUMMARY.md
```

### Category A — Acceptable: Deprecation Context Only

These references exist in the repo but carry visible `⚠️ DEPRECATED` notices or describe legacy behavior analytically. No operational risk.

| File | Lines | Type | Risk |
|------|-------|------|------|
| `backend/N8N_SETUP_GUIDE.md` | 120–122, 124, 224, 236, 248 | Docs — fully marked deprecated | None |
| `backend/N8N_INTEGRATION.md` | 149, 152, 161, 164, 170, 173 | Docs — fully marked deprecated | None |
| `backend/n8n_workflows/README.md` | 38, 40, 71, 73, 85, 87, 203–205, 254, 329, 335, 344 | Docs — deprecated notices added | None |
| `backend/src/services/README.md` | 69, 147–149, 151 | Docs — deprecated notices added | None |
| `N8N_PAYLOAD_FORMAT.md` | 23, 27 | Docs — deprecated notice at top | None |
| `TEST_SCENARIOS.md` | 133 | QA doc — updated with deprecated marker | None |
| `backend/scripts/test_n8n.js` | 266, 271, 281, 286, 296, 301 | Script — DEPRECATED comments on Tests 3–5 | None |
| `FIX_SUMMARY.md` | 70, 87 | Historical code diff (before/after in code block) — not a live call | None |
| `docs/20_*.md` | Various | Migration history narrative | None |
| `docs/21_*.md` | Various | Consumer inventory analysis | None |
| `docs/22–30_*.md` | Various | Planning/protocol docs referencing paths as analysis targets | None |
| `backend/tests/security/n8n-proxy-fallback.test.js` | 89, 141, 179 | Security test — verifies the guard, not a consumer | None |
| `backend/tests/security/drct-legacy-proxy-telemetry.test.js` | 8, 41, 49, 54, 81, 88, 93, 119 | Security test — verifies telemetry behavior | None |

### Category B — Still Risky: No Effective Deprecation Notice

These references can cause a human or automated consumer to send real traffic to the legacy paths.

| File | Lines | Type | Risk | Owner |
|------|-------|------|------|-------|
| `backend/n8n_workflows/drct_order_create.json` | 7 | n8n workflow JSON — `"path": "drct/order/create"`. Importable file. If imported into n8n, immediately re-activates the legacy create path. README has a deprecated notice but someone importing the JSON directly bypasses it. | **High** — live n8n activation risk | Agent A (decom after flip) |
| `backend/n8n_workflows/drct_order_issue.json` | 7 | Same as above for issue path. | **High** | Agent A |
| `backend/n8n_workflows/drct_order_cancel.json` | 7 | Same as above for cancel path. | **High** | Agent A |
| `portal/client/src/lib/drctApi.js` | 216, 246, 257 | Orphaned legacy helper methods `createOrder()`, `issueOrder()`, `cancelOrder()`. Not called anywhere in current portal (confirmed by grep). But accessible to any developer who reads the file. | **Medium** — dead code, but a developer copy-paste risk | Agent A scope (locked) |
| `backend/src/app.js` | 457, 482 | Runtime proxy middleware — currently open under `ALLOW_PUBLIC_DRCT_MUTATING_PROXY=true` | **High** — controlled by feature flag | Agent A |
| `backend/src/services/n8nClient.js` | 214, 240, 263 | Service methods that call the legacy n8n webhook paths | **Medium** — not called in current flow, but callable | Agent A scope |

### Category C — Missing Data: Cannot Determine From Repo

Surfaces that require manual verification outside the codebase:

- **n8n production instance**: Are `drct_order_create`, `drct_order_issue`, `drct_order_cancel` workflows currently **active** in production n8n? If active, they accept incoming webhook requests from any caller — even after backend ALLOW flag is flipped. Workflow deactivation must be verified separately.
- **Any external scripts or integrations** built by agency partners or AviaFrame ops staff that POST directly to the legacy paths.

---

## 2. Manual / External Consumer Checklist

Items that cannot be validated by repo grep. Each must be checked before the flip.

### 2.1 n8n Production Instance

| Check | Method | Owner | Status |
|-------|--------|-------|--------|
| Are `drct_order_create`, `drct_order_issue`, `drct_order_cancel` workflows active in prod n8n? | Preferred: `npm run check:n8n-legacy-workflows` with live `N8N_API_BASE_URL` + `N8N_API_KEY`. Fallback: open `https://n8n-production-e168.up.railway.app`, go to Workflows, check status | Ops | ❓ Live status not confirmed |
| If active — deactivate them before or at the same time as the backend flip | n8n UI → workflow → toggle off | Ops | ❓ Pending flip |
| Confirm email dispatch workflow (`B9EGaX3ZtFVbI38E`) remains active | n8n UI | Ops | ❓ Must stay active |

> **Important correction**: active legacy workflows in a publicly reachable n8n are not just “cleanup hygiene”.
> If n8n webhooks remain reachable directly, callers can bypass the backend guard entirely and still hit `drct/order/create|issue|cancel`.
> Поэтому live activation status нужно считать **go/no-go blocker**, пока не доказано обратное.

> **Repo evidence already exists**: local export snapshot `outputs/drct-cutover-backup/n8n-workflows-live-2026-06-23.json` shows legacy mutating workflows active on **2026-06-23**. That snapshot is stale, but it is strong enough to require a fresh live check before flip.

### 2.2 Postman / Insomnia / curl Collections

| Check | Method | Owner | Status |
|-------|--------|-------|--------|
| Any shared Postman workspace with `POST /webhook/drct/order/create` saved? | Search Postman org workspace for "drct/order" | Dev team | ❓ Unknown |
| Any Insomnia or Bruno collections checked into other repos? | Ask dev team | Dev team | ❓ Unknown |
| Pinned curl commands in Slack / internal chat? | Search Slack for `webhook/drct/order` | Dev team | ❓ Unknown |

### 2.3 Internal Runbooks / SOPs

| Check | Method | Owner | Status |
|-------|--------|-------|--------|
| Any Notion / Confluence pages describing how to manually issue a ticket via legacy API? | Search internal wiki for "order/create" or "order/issue" | Ops / Support | ❓ Unknown |
| Any internal support procedures using legacy curl? | Ask Support team lead | Support | ❓ Unknown |
| Any agency onboarding docs that show API integration examples using legacy paths? | Check agency onboarding materials and emails | Product | ❓ Unknown |

### 2.4 External Integrators

| Check | Method | Owner | Status |
|-------|--------|-------|--------|
| Were any agency partners given direct API access and integration examples using legacy webhook paths? | Review agency API key issuance history in Supabase | Tech lead | ❓ Unknown |
| Is `api.drct.aero` or DRCT itself aware of AviaFrame's internal webhook paths? | N/A — DRCT does not call back to these paths | — | ✅ Not applicable |
| Any CI pipelines in other repos (staging scripts, QA automation)? | Search org GitHub for `webhook/drct/order` | Dev team | ❓ Unknown |

### 2.5 Telemetry Gap

The definitive answer for items 2.2–2.4 comes from the **telemetry window** (Agent A scope). If `compat_traffic_detected=true` in Railway logs after `ALLOW_PUBLIC_DRCT_MUTATING_PROXY=true` telemetry period, the request `referer` and `user-agent` will identify the actual consumer type.

**Minimum telemetry window**: 7 days of normal operation (covers weekly ops cycles and any scheduled scripts).

---

## 3. Post-Cutover Archive Plan

### 3.1 Archive to `docs/archive/` (historical reference, no action needed after)

These docs are purely historical after the flip. Moving them out of the active docs index reduces confusion for new contributors.

| File | Action | Priority |
|------|--------|----------|
| `N8N_PAYLOAD_FORMAT.md` (root) | Move to `docs/archive/` | Low |
| `FIX_SUMMARY.md` (root) | Move to `docs/archive/` | Low |
| `TEST_SCENARIOS.md` (root) | Move to `docs/archive/` or delete QA sections referencing legacy path | Low |
| `backend/N8N_SETUP_GUIDE.md` | Move to `backend/archive/` | Medium |
| `backend/N8N_INTEGRATION.md` | Move to `backend/archive/` | Medium |
| `backend/n8n_workflows/drct_order_create.json` | Move to `backend/n8n_workflows/archive/` | **High** — prevents accidental reimport |
| `backend/n8n_workflows/drct_order_issue.json` | Move to `backend/n8n_workflows/archive/` | **High** |
| `backend/n8n_workflows/drct_order_cancel.json` | Move to `backend/n8n_workflows/archive/` | **High** |

> **Why JSON files are high priority**: These are importable workflow definitions. If someone runs an n8n setup script and re-imports them, the legacy paths become active in n8n even if the backend is guarded. Moving them to `archive/` removes the import risk from the standard setup flow.

### 3.2 Rewrite as Current Source of Truth

These docs contain valuable information but mix legacy and current references. After flip, they should be updated to reflect only the current contract.

| File | What to rewrite | Owner |
|------|----------------|-------|
| `backend/src/services/README.md` | Remove n8n workflow path table; document `drctService` direct calls and sanctioned routes instead | Next sprint |
| `backend/n8n_workflows/README.md` | Reduce to email dispatch only; remove all order create/issue/cancel sections | Next sprint |
| `TEST_SCENARIOS.md` | Replace scenario 1.5 network check with current `/api/orders` endpoint | Next sprint |

### 3.3 Keep As Historical Record (no action needed)

| Files | Reason |
|-------|--------|
| `docs/20–30_*.md` series | Migration decision log — valuable as-is for audit trail and future reference |
| `backend/scripts/test_n8n.js` | Tests 3–5 will fail after flip (expected). Can be deleted at next cleanup wave. |
| `backend/N8N_INTEGRATION.md`, `backend/N8N_SETUP_GUIDE.md` | Already deprecated. No risk. Archive when convenient. |

### 3.4 Keep Permanently (no change)

| Component | Reason |
|-----------|--------|
| `backend/n8n_workflows/drct_search.json` | Search still active via n8n |
| `backend/n8n_workflows/drct_price.json` | Price check still active |
| n8n email dispatch workflow (`B9EGaX3ZtFVbI38E`) | Still active — cron email pipeline |
| `docs/PARTNER_WIDGET_INTEGRATION_TEST_PLAN.md` | Describes current `/api/widget/session` flow — fully current |
| `docs/NDC_SANDBOX_FRONTEND_2026-07-20.md` | Documents sandbox setup, uses `POST /api/widget/orders` — current |

---

## 4. Operator Communication Checklist

Actions to take **before** flipping `ALLOW_PUBLIC_DRCT_MUTATING_PROXY=false`.

### 4.1 Internal Communication

| Action | Audience | Channel | Timing |
|--------|----------|---------|--------|
| Announce that `POST /webhook/drct/order/create`, `/issue`, `/cancel` will return 403 after flip | All devs, support, ops | Slack #engineering | 48h before flip |
| Confirm replacement routes for anyone who used legacy paths manually: `POST /api/orders` (auth), `POST /api/orders/:orderId/issue` (staff/admin), `POST /api/orders/:orderId/cancel` (staff/admin) | Same | Same | Same message |
| Confirm email dispatch workflow (`B9EGaX3ZtFVbI38E`) is NOT affected | Same | Same | Same message |
| Confirm widget search (`/webhook/drct/search`) is NOT affected | Same | Same | Same message |

### 4.2 n8n Workflow Deactivation

| Action | Who | When |
|--------|-----|------|
| Deactivate `drct_order_create` workflow in prod n8n | Ops | On flip day |
| Deactivate `drct_order_issue` workflow in prod n8n | Ops | On flip day |
| Deactivate `drct_order_cancel` workflow in prod n8n | Ops | On flip day |
| Confirm `drct_search`, `drct_price`, `email_dispatch` remain active | Ops | Immediately after |

### 4.3 External Partner Notification

| Action | Who | When |
|--------|-----|------|
| If any agency partners have API keys and integration examples using legacy paths — notify them directly | Product/Tech lead | Before flip, once identified |
| Update any externally-shared integration guide or API reference | Product | Before flip |

---

## 5. Open Items / Missing Data

These items remain unresolved and must be closed before confirming go/no-go:

| Item | Risk Level | How to Close |
|------|-----------|--------------|
| n8n prod workflow activation status for order create/issue/cancel | **Blocker** | `npm run check:n8n-legacy-workflows` with live n8n API creds or manual check in n8n UI |
| Postman/Insomnia shared collections with legacy paths | Medium | Ask dev team / search Postman workspace |
| Internal runbooks or SOPs outside repo | Medium | Ask Support and Ops leads |
| Agency partners with direct API integrations | Medium–High | Review Supabase API key issuance records + ask Product |
| Telemetry evidence from 7-day window | **Blocker** | Agent A — backend telemetry (in progress) |

---

## Verification

```bash
git diff --check   # ✅ No whitespace issues
rg -n "drct/order/create|drct/order/issue|drct/order/cancel|api/n8n/webhook/drct/order" \
  docs backend README.md TEST_SCENARIOS.md N8N_PAYLOAD_FORMAT.md
# All matches in this doc are analysis references, not operational instructions.
```

This document contains no runtime changes, no env changes, no deploy actions. It is a planning-only document.
