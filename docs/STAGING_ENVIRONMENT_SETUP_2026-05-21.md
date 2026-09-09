# Staging Environment Setup - 2026-05-21

## Goal
Create a safe non-production environment for AviaFrame so new payment, fulfillment, and integration changes do not affect production.

This setup now supports two separate contours:
1. Public staging:
   - DRCT sandbox
   - Moyasar sandbox/test
   - safe for agency demos
2. Internal QA contour:
   - dedicated QA agency/tenant
   - DRCT production
   - protected admin-only issuance without customer payment
   - only for controlled void/cancel testing by AviaFrame staff

## Target Topology

### Frontend
1. Netlify staging site
2. Domain:
   - `staging.aviaframe.com`
   - or temporary `*.netlify.app`
3. Runtime config served from `aviaframe-site/config.js`

### Backend
1. Separate Railway service or separate Railway environment
2. Suggested name:
   - `peaceful-amazement-staging`
3. Separate env vars from production

### Database
1. Separate Supabase project
2. Separate storage bucket or staging-namespaced buckets
3. Separate auth users and data

### Integrations
1. Tamara:
   - still sandbox
   - separate webhook URL pointing to staging backend
2. Moyasar:
   - test keys only
   - if one backend serves both production and `testenvavia.netlify.app`, set both:
     - `MOYASAR_SECRET_KEY` for live
     - `MOYASAR_TEST_SECRET_KEY` for the sandbox/test contour
   - same pattern for webhook secrets:
     - `MOYASAR_WEBHOOK_SECRET`
     - `MOYASAR_TEST_WEBHOOK_SECRET`
3. n8n:
   - separate staging instance or clearly separated staging workflows
4. Email:
   - staging recipients only
   - no real customer inboxes

### Internal QA Guardrails
1. Keep `INTERNAL_QA_ENABLED=false` on public staging unless explicitly testing the protected QA contour.
2. Use a separate internal QA agency/tenant via `INTERNAL_QA_AGENCY_ID`.
3. Restrict the protected endpoints with:
   - `INTERNAL_API_TOKEN`
   - `INTERNAL_QA_ALLOWED_HOSTS`
   - admin/super-admin bearer auth
4. Keep `INTERNAL_QA_MAX_ACTIVE_TICKETS` low.
5. Track every issued QA ticket in `internal_qa_ticket_runs` and cancel inside the configured void window.

## What Was Added in Repo
1. `aviaframe-site/config.js`
   - runtime-configurable site settings with production defaults
2. `aviaframe-site/config.staging.example.js`
   - example staging site config
3. `backend/.env.staging.example`
   - example backend staging env file

## Important Architectural Note
Before this change, `aviaframe-site/booking.html` and `widget-demo.html` were hardcoded to production backend and keys. They now support runtime configuration through:

```js
window.AVIAFRAME_RUNTIME_CONFIG
```

This is required for staging because otherwise the static site would still talk to production even if a staging backend existed.

## Runtime Config Contract for Static Site

Example:

```js
window.AVIAFRAME_RUNTIME_CONFIG = {
  environment: 'staging',
  backendUrl: 'https://your-staging-backend.up.railway.app',
  agencyKey: 'ag_replace_with_staging_agency_key',
  moyasarPublicKey: 'pk_test_replace_me',
  siteOriginHost: 'staging.aviaframe.com',
  portalUrl: 'https://staging-admin.aviaframe.com'
};
```

## Provisioning Checklist

### 1. Supabase staging
1. Create a new Supabase project.
2. Apply current schema/migrations.
3. Create staging storage buckets:
   - `documents-staging`
   - or equivalent
4. Seed minimal agencies/users/test data.

### 2. Railway staging backend
1. Create a new service or environment.
2. Point it to the same codebase.
3. Set env vars from `backend/.env.staging.example`.
4. Confirm:
   - `/healthz`
   - `/healthz/deep`
   - Tamara config endpoint
   - widget session endpoint

### 3. Netlify staging site
1. Create a separate site or deploy preview target.
2. Publish `aviaframe-site`.
3. Replace `config.js` with a staging variant based on `config.staging.example.js`.
4. Keep `defaultDryRunIssue=false` for real sandbox ticketing tests. Use `?dry_run=1` only when you explicitly want demo-PDF mode.
4. Verify:
   - `widget-demo.html` talks to staging backend
   - `booking.html` talks to staging backend

### 4. n8n staging
1. Use separate staging workflows or separate instance.
2. Set `N8N_WEBHOOK_URL` in Railway staging env.
3. Ensure staging does not reuse production workflow state.

### 5. Tamara sandbox
1. Keep sandbox keys.
2. Set staging backend notification URL:
   - `https://<staging-backend>/api/payments/tamara/webhook`
3. Use staging return URLs:
   - `https://staging.aviaframe.com/booking.html`

### 6. Email isolation
1. Use test SMTP or sandbox provider credentials.
2. Route alerts to staging inboxes only.
3. Never send staging tickets to real customer inboxes.

## Deployment Model Recommendation

### Branching
1. `main` -> production
2. `develop` -> staging
3. feature branches -> PR into `develop`

### Railway
1. keep production service manual if needed
2. set up separate staging service first
3. optionally later enable GitHub autodeploy for staging only

### Netlify
1. production site -> main
2. staging site -> develop or manual staging branch

## Verification Checklist

### Staging smoke test
1. Widget search hits staging backend
2. Order creation writes to staging Supabase
3. Moyasar staging test payment works
4. Tamara sandbox checkout works
5. Tamara webhook arrives at staging backend
6. PDF is generated in staging storage
7. Email goes only to staging/test inboxes

## Open Risks to Resolve Next
1. `backend/src/services/agencyProvision.js` still defaults to production backend URL if not configured.
2. Several docs and public pages still mention production domains explicitly.
3. n8n workflows are not yet formally separated by environment in this repo.
4. Railway currently deploys via CLI, not GitHub auto-deploy, so environment discipline must be explicit.
