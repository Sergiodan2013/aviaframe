# Public Endpoints and PII Map

Date: 2026-06-02  
System: AviaFrame

## Purpose

This note maps the currently visible backend surface into public, protected, admin, and internal endpoints, and highlights where PII or sensitive operational data is likely to be handled.

## Surface Summary

| Surface | Status | Notes |
|---|---|---|
| Public product endpoints | `partial` | Public search, widget, payment callback, and webhook paths are visible in code |
| Internal-only observability endpoints | `partial` | `/metrics` and `/healthz/deep` now have code-level token protection; deployed verification is still needed |
| Admin and agency endpoints | `partial` | Access control exists, but public-vs-internal classification should be kept explicit for audit walkthroughs |
| PII mapping | `partial` | Major PII-bearing fields can be identified from code, but a final production data-flow confirmation is still needed |

## Endpoint Classification

### Public or externally reachable

- `POST /public/search` via [backend/src/routes/public.js](/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation%20(2)/backend/src/routes/public.js:9)
- `POST /api/widget/session` and `POST /api/widget/orders` via [backend/src/routes/widget.js](/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation%20(2)/backend/src/routes/widget.js:16)
- `POST /api/payments/initiate` and `GET /api/payments/callback` via [backend/src/routes/payments.js](/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation%20(2)/backend/src/routes/payments.js:27)
- `POST /api/webhooks/moyasar` via [backend/src/routes/payments.js](/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation%20(2)/backend/src/routes/payments.js:228)
- `POST /api/payments/tamara/webhook` via [backend/src/routes/tamara.js](/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation%20(2)/backend/src/routes/tamara.js:124)
- `POST /api/webhooks/email-provider` via [backend/src/routes/webhooks.js](/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation%20(2)/backend/src/routes/webhooks.js:10)
- `/webhook/*` n8n proxy routes via [backend/src/app.js](/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation%20(2)/backend/src/app.js:191)

### Authenticated product endpoints

- orders/profile/ticket routes in [backend/src/routes/orders.js](/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation%20(2)/backend/src/routes/orders.js:12)
- document download routes in [backend/src/routes/documents.js](/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation%20(2)/backend/src/routes/documents.js:11)
- agency self-service routes in [backend/src/routes/agency.js](/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation%20(2)/backend/src/routes/agency.js:11)

### Admin or privileged endpoints

- `/api/admin/*` routes including agencies, invoices, tickets, and reports in [backend/src/routes/admin.js](/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation%20(2)/backend/src/routes/admin.js:20)
- super-admin management routes in [backend/src/routes/admin/super-admins.js](/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation%20(2)/backend/src/routes/admin/super-admins.js:18)

### Internal or operational endpoints

- `GET /metrics` in [backend/src/app.js](/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation%20(2)/backend/src/app.js:46)
- `GET /healthz/deep` in [backend/src/routes/health.js](/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation%20(2)/backend/src/routes/health.js:39)
- internal notification dequeue/outbox routes in [backend/src/routes/notifications.js](/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation%20(2)/backend/src/routes/notifications.js:104)

## PII and Sensitive Data Map

### Customer/contact data

- `contact_email`
- `contact_phone`
- passenger names

Observed in:

- widget order creation in [backend/src/routes/widget.js](/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation%20(2)/backend/src/routes/widget.js:155)
- payment and email flows in [backend/src/routes/payments.js](/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation%20(2)/backend/src/routes/payments.js:342)
- email rendering in [backend/src/services/emailService.js](/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation%20(2)/backend/src/services/emailService.js:261)

### Travel and ticketing data

- `pnr`
- `ticket_number`
- origin/destination
- travel times
- order number

Observed in:

- ticket issuance flow in [backend/src/services/orderService.js](/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation%20(2)/backend/src/services/orderService.js:101)
- payment webhook async handling in [backend/src/routes/payments.js](/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation%20(2)/backend/src/routes/payments.js:313)

### Identity document data

- `passport_number`
- `passport_expiry`
- `passport_issuing_country`

Observed in:

- widget passenger creation in [backend/src/routes/widget.js](/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation%20(2)/backend/src/routes/widget.js:282)
- DRCT log sanitization rules in [backend/src/services/drctLogger.js](/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation%20(2)/backend/src/services/drctLogger.js:100)

### Payment/provider identifiers

- `payment_provider_order_id`
- `moyasar_payment_id`
- Tamara order ids

Observed in:

- payment routes in [backend/src/routes/payments.js](/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation%20(2)/backend/src/routes/payments.js:279)
- Tamara flows in [backend/src/routes/tamara.js](/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation%20(2)/backend/src/routes/tamara.js:136)

## Audit-Safe Statement

AviaFrame’s external surface is understandable and can be explained clearly by separating customer-facing product routes, provider webhooks, admin operations, and internal observability paths. PII-bearing fields are concentrated in order creation, passenger handling, payment follow-up, ticketing, and email/document generation flows. The main remaining task is to confirm that logs, dashboards, and storage retention align with this map in deployed environments.

