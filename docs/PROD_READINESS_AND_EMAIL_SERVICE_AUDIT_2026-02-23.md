# Aviaframe: Prod Readiness + Email Service Audit
Date: 2026-02-23

## 1) Scope and goal
This document fixes project context and records:
- what is currently in local workspace vs GitHub,
- what was validated before push,
- what remains for production readiness,
- how to implement a full email service with current architecture (`Portal UI + n8n + Supabase`).

## 2) Current architecture (actual)
- Portal UI: frontend application used by super admin / agency admin / clients.
- Supabase: source of truth for auth, data, RLS, storage metadata.
- n8n: workflow orchestration and integration entry points (search/order webhooks, planned notification orchestration).
- Backend API: partially present and useful for service-role operations, but current Netlify proxy target may be misconfigured in some environments.

## 3) Local vs GitHub audit snapshot
### Git status (before this commit)
- Modified tracked files:
  - `backend/.env.example`
  - `backend/n8n_workflows/drct_search.json`
  - `backend/src/lib/supabase.js`
  - `package-lock.json`
  - `widget/README.md`
  - `widget/package.json`
- Untracked files/folders:
  - `backend/src/routes/admin/super-admins.js`
  - `backend/src/services/emailService.js`
  - `backend/src/services/pdfService.js`
  - `backend/supabase/migrations/002_fix_admin_rls_policy.sql`
  - `backend/supabase/migrations/003_explicit_admin_bypass.sql`
  - `backend/supabase/migrations/004_safe_diagnostic_and_fix.sql`
  - `backend/supabase/migrations/005_invoices_table.sql`
  - `backend/supabase/migrations/006_documents_and_ticket_issuance.sql`
  - `backend/supabase/migrations/007_one_account_one_agency.sql`
  - `backend/supabase/schema.sql`
  - `widget/.gitignore`
  - `widget/INTEGRATION_GUIDE.md`
  - `widget/WIDGET_COMPLETE.md`
  - `widget/demo/production.html`
  - `widget/vite.config.js`

### Branch/remote state
- Branch: `main`
- Remote: `origin` -> `https://github.com/Sergiodan2013/aviaframe.git`
- Prior to this commit, `HEAD` was aligned with `origin/main`.

## 4) Validation done before push
Build checks completed:
- `widget`: `npm run -w widget build` -> OK
- `backend`: `npm run -w backend build` -> OK
- `portal/client`: `npm run build` -> OK

Notes:
- Portal bundle size warning exists (>500kb chunk), non-blocking for functionality.
- No destructive cleanup performed to avoid removing potentially needed product files.

## 5) Already applied functional fixes (in recent commits)
- Portal fallback behavior improved for missing backend proxy / HTML responses.
- Agency settings update/delete fallback improved when `/api/backend` is unavailable.
- Role/linking fixes for agency admin flow and `agency_id` resolution.
- RLS unification migration added for `admin` + `super_admin` parity:
  - `backend/supabase/migrations/009_super_admin_rls_unification.sql`

## 6) Email service design for production (with n8n)
Use **n8n as orchestrator**, Supabase as state store, provider as delivery engine.

### 6.1 Data model
Create/maintain tables:
- `notification_events`
  - `id, event_type, entity_type, entity_id, agency_id, payload, idempotency_key, occurred_at, created_at`
- `email_templates`
  - `id, template_key, locale, version, status(draft/published), subject, html_body, text_body, created_at, updated_at`
- `notification_rules`
  - `id, event_type, audience, channel, enabled, template_key, recipient_strategy, created_at, updated_at`
- `email_outbox`
  - `id, event_id, to_email, template_key, provider, provider_message_id, status(queued/sent/failed), error, sent_at, created_at`
- `email_events`
  - `id, outbox_id, provider_event, raw_payload, created_at`

### 6.2 Delivery flow
1. Business action writes `notification_events` row.
2. n8n workflow picks event by `event_type`.
3. Resolve recipients + template + variables.
4. Send via provider API (Resend/Postmark/SES).
5. Write `email_outbox` status.
6. Provider webhook -> n8n -> persist to `email_events` and update `email_outbox`.

### 6.3 Required event catalog (phase baseline)
Client-facing:
- `booking_created`
- `payment_confirmed`
- `payment_failed`
- `ticket_issued`
- `booking_cancelled`
- `schedule_changed`
- `refund_processed`

Agency-facing:
- `agency_invite_activation`
- `agency_activated`
- `booking_created_for_agency`
- `manual_ticket_required`
- `manual_ticket_marked_issued`
- `invoice_generated`
- `invoice_issued`
- `invoice_overdue`
- `agency_settings_changed`

Internal/super-admin:
- `agency_created`
- `agency_suspended`
- `agency_deleted`
- `email_delivery_alert`
- `daily_ops_digest`

## 7) Production hardening checklist
- Configure SPF/DKIM/DMARC for sending domain.
- Use one provider for primary + one fallback path.
- Enforce idempotency for events and sends.
- Add retries + dead-letter handling in n8n.
- Add dashboard for outbox failures and bounce rates.
- Gate high-risk actions with audit trail (who changed what and when).

## 8) Recommended implementation order
1. Phase 1: event/outbox schema + n8n send flow + 4 critical emails.
2. Phase 2: template versioning and UI for templates/rules.
3. Phase 3: agency lifecycle + invoice/ticket notifications.
4. Phase 4: observability, SLA alerts, and deliverability optimization.

## 9) Cleanup policy used in this pass
- Keep potentially functional files.
- Avoid destructive removal without explicit user instruction.
- Prefer documenting state + pushing validated code so work is not lost.

