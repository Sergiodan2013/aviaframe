# AviaFrame — Super Admin & Agency Admin MVP

Version: 2.0
Date: 2026-02-25

---

## Goal

Build a multi-tenant "super_admin → agencies" layer for aviation-only flow:
- Super admin creates and manages agencies.
- Agencies operate in full isolation (RBAC + RLS).
- Every booking and ticket is attributable to agency and source channel.
- DRCT credentials remain backend-only via n8n webhooks.
- Widget is fully whitelabel — agency brand only, no AviaFrame branding.

---

## Roles (MVP)

| Role | Scope |
|---|---|
| `super_admin` | Global — all tenants, all data |
| `agency_admin` | Own agency — full control |
| `agency_manager` | Own agency — operational, no admin settings |

Note: `agency_viewer` role is **not part of MVP** and should not be implemented.

---

## Super Admin Console — MVP Scope

All UI in English.

### Agency Management
- Create agency: `code`, `name`, `legal_name`, country, currency, locale, subscription tier.
- Edit agency profile and operational metadata.
- Archive/deactivate agency (`is_active=false`, soft delete).
- List agencies with filters: status, date, code, name, subscription tier.
- Agency detail page with tabs: **Profile | Members | Referers | Analytics | Audit**.

### Member Management
- Add member to agency by email (invite flow via Resend).
- Assign/change role: `agency_admin`, `agency_manager`.
- Activate/deactivate member access.
- Grant/revoke `super_admin` role (controlled flow, audit required).
- All membership changes produce audit log entries.

### Referer / Attribution Management
- Add/edit/deactivate agency referers and domains.
- Source channel taxonomy: `portal`, `widget`, `iframe`, `api`, `unknown`.
- Prevent duplicate referers per agency.
- Attribution health indicator (mapped vs unmapped referer rate).

### Platform Analytics Dashboard
- Metrics: searches / orders / issues / cancels / revenue — by agency and time.
- Filters: agency, date range, channel, order status, currency.
- Trend over time, top agencies, conversion funnel.
- Export: CSV/JSON.

### Orders Monitor
- All orders across all agencies.
- Drilldown: `drct_offer_id`, `drct_order_id`, `drct_ticket_number`, `drct_locator`.
- Status timeline: new → booked → issued → cancelled, with timestamps.
- Retry/status-sync actions for super_admin and agency_admin (with permission checks).

### Audit Log
- Immutable log: agency create/update/archive, role changes, referer changes, order events, credential rotations.
- Filters: actor, agency, action, entity type, date range.

### DRCT / n8n Integration Health
- Health indicators for n8n workflows.
- Correlation ID tracking across backend ↔ n8n ↔ DRCT.
- Manual workflow re-run for failed operations (permission-gated).

### Billing Summary (read-only in MVP)
- Usage counters per agency: searches, bookings.
- Plan status and entitlements.
- Plan limit warnings at 80% and 100%.

### Email Template Management
- View and edit global email templates (React Email).
- Test send to arbitrary email.
- Template versioning.
- Override template for specific agency (Enterprise).

---

## Agency Admin Console — MVP Scope

All UI in English.

### Widget Builder
- Logo upload (PNG/SVG, max 200kb).
- Primary color, accent color, background color, text color — color picker.
- Button border radius slider (0px sharp → 24px pill).
- Theme toggle: Light / Dark / Auto.
- Font family selector: Inter, Roboto, Cairo, Noto Sans Arabic (+ Google Fonts URL for Enterprise).
- Base font size: 14 / 16 / 18px.
- Language: English / Arabic (RTL automatic).
- Currency selector: AED / SAR / USD / EUR / EGP.
- Date format: DD/MM/YYYY or MM/DD/YYYY.
- Live preview panel — widget renders in real time as settings change.

### Domain & Embed Setup
- Domain manager: add domain, pending list, save/apply, persisted list with remove.
- Explicit feedback states: idle / saving / saved / error.
- Custom domain setup: CNAME instructions for `widget.myagency.com`.
- Embed snippet generator with copy button (shows success feedback).
- Widget preview on allowed domain directly from portal.

### Widget Feature Toggles
- Multi-city search: on/off (plan-gated).
- Cabin class selector: on/off.
- Default direct flights only: on/off.
- Default max stops: 0 / 1 / any.
- Max passengers per booking.
- Default departure airport (IATA code).

### Whitelabel Content
- Hide "Powered by AviaFrame": on (always on for Enterprise, optional for Growth).
- Custom footer text.
- Terms & Conditions URL.
- Privacy Policy URL.
- Support email and phone (shown in widget errors).

### Team Management
- Invite team members by email (Resend invite email sent).
- Assign role: `agency_manager`.
- Deactivate/reactivate access.
- Member list with roles and status.

### Orders
- Orders list with filters: status, date range, passenger name.
- Order detail: flight info, passenger data (PII masked for agency_manager), status timeline, DRCT identifiers.
- Actions (agency_admin only): trigger issue, cancel.

### Agency Analytics
- Searches / bookings / issues / cancels by channel and time period.
- Conversion funnel.
- Export CSV.

### Email Settings
- Sender name (e.g., "MyAgency Travel Tickets").
- Reply-to email address.
- Custom sender domain setup instructions (DKIM/SPF).
- Support contact (shown in email footers).
- Custom footer text for emails.
- Toggle: send copy of booking/ticket emails to traveler.
- Email preview per template type.

### Integration Docs
- Quick Start tab: copy/paste only, minimal steps.
- Integration Guide tab: step-by-step for developers.
- Technical Reference tab: full API docs link, webhook events, error codes.

---

## Booking Attribution

On every search/order/issue, persist:
- `agency_id`
- `source_referer`
- `source_channel`: `widget` / `portal` / `iframe` / `api`
- DRCT identifiers: `drct_offer_id`, `drct_order_id`, `drct_ticket_number`, `drct_locator`

---

## Security

- Supabase RLS isolates all agency data at DB level.
- Middleware RBAC as first line of defense.
- Default deny when agency scope cannot be resolved.
- 2FA required for `super_admin` and `agency_admin`.
- DRCT credentials never exposed in frontend, logs, or error responses.
- PII masked in logs and UI for roles without privilege.
- All admin mutations produce audit log entries.

---

## Architecture (as-is → as-target)

```
Client (Portal / Widget)
  → Backend (Express) — auth middleware, RBAC, agency scope resolution
    → n8n webhook — DRCT adapter (search / price / order / issue / cancel)
      → DRCT API

Parallel:
  Backend → Supabase — orders, order_events, tickets, audit_logs, agencies, agency_members
  Backend → Resend — transactional emails (invite, booking, e-ticket, cancel)
  Backend → PDF service — branded itinerary generation on issue
```

---

## API Surface (MVP)

### Already implemented
- `POST /api/search`
- `POST /api/search/price`
- `POST /api/orders`
- `POST /api/orders/:orderId/issue`
- `POST /api/orders/:orderId/cancel`
- `GET /api/orders/:orderId/status`
- `GET /api/agencies`
- `POST /api/agencies`
- `POST /api/agencies/:code/referers`
- `GET /api/analytics/summary`
- `GET /healthz`

### Required additions
- `GET /api/agencies/:code`
- `PATCH /api/agencies/:code`
- `PATCH /api/agencies/:code/status`
- `GET /api/agencies/:code/members`
- `POST /api/agencies/:code/members`
- `PATCH /api/agencies/:code/members/:memberId`
- `DELETE /api/agencies/:code/referers/:refererId`
- `GET /api/audit-logs`
- `GET /api/analytics/agency/:code/timeseries`
- `GET /api/platform/health/integrations`
- `GET /api/agencies/:code/widget-config`
- `PUT /api/agencies/:code/widget-config`
- `POST /api/auth/invite`
- `POST /api/auth/accept-invite`
- `GET /api/agencies/:code/api-keys`
- `POST /api/agencies/:code/api-keys`
- `DELETE /api/agencies/:code/api-keys/:keyId`

---

## Out of MVP

- Full CMS template editor for email/widget (drag & drop).
- Complex financial settlement and reconciliation.
- Dynamic pricing rules engine with versioning.
- Multi-provider content beyond aviation.
- Enterprise SSO (SAML/OIDC).
