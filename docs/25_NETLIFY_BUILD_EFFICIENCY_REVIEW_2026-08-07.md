# Netlify Build Efficiency Review — 2026-08-07

## Scope

Sites reviewed:
- `portal/client` → `admin.aviaframe.com` (Netlify site `03db489d-129d-4e6b-b7f3-5b7ce3f55d86`)
- `aviaframe-site` → `aviaframe.com`

Read-only inputs used:
- `portal/client/netlify.toml`
- `aviaframe-site/netlify.toml`
- `portal/client/scripts/write-redirects.js`
- root `package.json`

---

## Current Build Commands

### portal/client

```
npm ci && npm run build && node scripts/write-redirects.js
```

Steps:
1. `npm ci` — clean install from lock file
2. `npm run build` — Vite production build → `dist/`
3. `node scripts/write-redirects.js` — writes `dist/_redirects` using `BACKEND_URL` env var

Publish dir: `dist`

### aviaframe-site

No build command. `publish = "."` — deploys the whole directory as-is.

---

## Generated Redirect Rules (portal/client)

`write-redirects.js` writes 4 rules when `BACKEND_URL` is set:

| Rule | Target | Purpose |
|------|--------|---------|
| `/api/backend/*` | `BACKEND_URL/api/:splat` | Portal → backend API calls (orders, admin, etc.) |
| `/api/n8n/webhook-test/*` | `BACKEND_URL/webhook/:splat` | Search via DRCT webhook path (active) |
| `/api/n8n/*` | `BACKEND_URL/:splat` | Legacy n8n proxy catch-all (compat) |
| `/*` | `/index.html` | SPA fallback |

---

## Findings

### F1 — `/api/n8n/*` rule is legacy compat, not load-bearing (Medium)

**What**: Rule 3 (`/api/n8n/*`) was historically used to proxy `/api/n8n/webhook-test/drct/order/create` (and `/api/n8n/webhook/drct/order/create`) from the portal frontend to the n8n booking workflow. Portal create/issue/cancel have since migrated to `/api/backend/api/orders/*`.

**Current traffic via this rule**:
- Search: `/api/n8n/webhook-test/drct/search` → covered by the more-specific Rule 2
- Any residual legacy order calls from stale client code or browser caches

Rule 2 (`/api/n8n/webhook-test/*`) takes precedence over Rule 3 for search. Rule 3 now only catches paths that don't match Rule 2 — primarily any legacy `/api/n8n/webhook/*` calls.

**Risk if removed**: If a stale cached portal client makes a legacy order create call, it would 404 instead of reaching the backend. Given the booking path is migrated, this is acceptable after the telemetry window closes.

**Action**: Proposal — after `ALLOW_PUBLIC_DRCT_MUTATING_PROXY=false` flip confirmed, remove Rule 3 from `write-redirects.js`. Requires Agent A sync before action.

### F2 — `npm ci` on every deploy (Low, no action needed)

**What**: `npm ci` always does a clean install, which discards any cached `node_modules` and re-installs from lock file. On Netlify, dependency cache is keyed to `package-lock.json` hash, so if the lock file hasn't changed, Netlify restores the cache and `npm ci` completes in seconds.

**Assessment**: This is correct behavior. `npm ci` is the right command for CI/CD environments. No change needed.

### F3 — `write-redirects.js` writes no proxy rules when `BACKEND_URL` unset (Medium, informational)

**What**: If `BACKEND_URL` is not set in Netlify env vars, `write-redirects.js` writes only the SPA fallback, and all `/api/*` calls fail silently in production. The script logs a warning but does not fail the build.

**Observed**: This is documented in the file's header. The behavior is intentional (fail-open to allow frontend-only previews).

**Proposal**: Add `process.exit(1)` in CI / production build context if `BACKEND_URL` is absent. Can be gated by an env var like `REQUIRE_BACKEND_URL=true` in production Netlify site settings. Does not require root build graph change — only `write-redirects.js`.

### F4 — `aviaframe-site` `publish = "."` exposes entire directory (Low)

**What**: The entire `aviaframe-site/` directory is published as-is. This includes HTML, JS, CSS, but also any config example files (`config.staging.example.js`, `config.ndc-sandbox.example.js`) and any other files that happen to be in the directory.

**Assessment**: Config example files are not secrets — they contain placeholder values only. Low risk. No immediate action needed.

**Proposal (low-priority)**: Consider a `public/` subdirectory for files that should be served, keeping config examples and build tooling outside the publish path.

### F5 — No build-time verification that `_redirects` was actually written (Low)

**What**: If `write-redirects.js` crashes silently (e.g., a Node.js version issue), the build succeeds but `dist/_redirects` is missing or incomplete. Netlify would then use only the `netlify.toml` fallback (just the SPA rule), and all API calls would break.

**Proposal**: Add a post-build check in CI:
```bash
test -f portal/client/dist/_redirects && grep '/api/backend/' portal/client/dist/_redirects
```
Can be added to `.github/workflows/ci.yml` — does not touch root build graph.

---

## Safe Immediate Actions

None required. Both configs are functional and minimal.

## Structural Proposals (require Agent A sync or separate approval)

| ID | Proposal | Scope | Risk |
|----|----------|-------|------|
| P1 | Remove `/api/n8n/*` rule from `write-redirects.js` after cutover | `portal/client/scripts/write-redirects.js` | Low — only after `ALLOW_PUBLIC_DRCT_MUTATING_PROXY=false` confirmed |
| P2 | Add `process.exit(1)` when `BACKEND_URL` unset in production build | `portal/client/scripts/write-redirects.js` | Very low — CI hardening only |
| P3 | Add post-build `_redirects` verification to CI workflow | `.github/workflows/ci.yml` | Very low |
| P4 | Introduce `aviaframe-site/public/` as explicit publish dir | `aviaframe-site/netlify.toml` + file moves | Low — cosmetic, requires file reorganisation |

---

## What Was Not Changed

- `portal/client/netlify.toml` — clean, no changes
- `aviaframe-site/netlify.toml` — clean, no changes
- `portal/client/scripts/write-redirects.js` — read-only for this review; P1/P2 are proposals
- root `package.json` — not touched
