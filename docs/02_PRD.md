# Aviaframe — Product Requirements Document (PRD)

Version: 1.1  
Date: 2026-01-26  
Author: Product / Sergiodan2013

Purpose  
This PRD describes the product surface, user journeys, MVP scope and v2 roadmap for Aviaframe. It is written to be actionable for frontend, backend, QA and product teams so they can derive implementation tasks directly.

1. Product overview

High-level description  
Aviaframe is a tenant-scoped B2B SaaS product for travel agencies. It is composed of three integrated products:

- Portal (Admin / Agent UI)
  - A web application used by Platform Admins and Agency Admins/Agents for onboarding, tenant configuration, user management, and manual booking workflows. The portal is the place for agency staff to manage orders, view audit history, and retrieve embed snippets.

- Widget (Embeddable JS)
  - A lightweight, tenant-configurable JavaScript widget that agencies embed into their public websites to expose flight search and booking flows to end customers. The widget communicates only with Aviaframe backend public endpoints and never receives DRCT credentials.

- Backend (API & DRCT adapter)
  - Multi-tenant API service that mediates all DRCT interactions (search, price, order create, issue, cancel), enforces tenant isolation, idempotency and rate limiting, records DRCTRequestLogs and AuditLogs, and exposes public endpoints used by the Portal and Widget.

Key principles
- The widget is a thin client; all sensitive operations occur server-side.
- Backend enforces tenant scoping and idempotency for state-changing operations.
- Portal supports agency onboarding and day-to-day agent operations.

2. User journeys (detailed step-by-step)

For each journey below we list actors, preconditions, step-by-step flow (UI/API calls), backend responsibilities, success criteria and suggested acceptance tests.

a) Agency onboarding
Actors: Platform Admin, Agency Admin (first user)

Preconditions:
- Platform Admin account exists.
- DRCT commercial contract configured on platform level.

Flow:
1. Platform Admin creates tenant (Backend API: POST /internal/tenants)
   - Required fields: name, primary_country, currency, timezone, subscription_plan.
   - Backend: create Tenant record, allocate tenant_id, create default WidgetConfig, generate agency invite link or create Agency Admin user.
2. Platform Admin configures subscription (Portal UI) and attaches billing metadata.
   - Backend: persist SubscriptionPlan and BillingRecord entries.
3. Agency Admin receives invite email, sets password and completes profile (Portal).
   - Backend: create AgencyUser, log AuditLog (USER_INVITED, USER_CREATED).
4. Agency Admin configures widget and allowed origins (Portal UI)
   - API: PATCH /api/tenants/{tenant_id}/widget-config
   - Backend: validate allowed_origins format and persist WidgetConfig.
5. Agency Admin obtains embed snippet (Portal UI)
   - Snippet contains tenant_id and non-sensitive public key or client id for widget initialization; no DRCT tokens.
6. (Optional) Invite Agency Agents.

Backend responsibilities:
- Ensure tenant_id uniqueness, create idempotency-safe initial records, send invite email (outbound).
- Validate allowed origins and sanitize inputs.
- Record AuditLogs for tenant creation and configuration changes.

Success criteria / Acceptance tests:
- Tenant created with tenant_id and default WidgetConfig.
- Invite flow yields working Agency Admin account able to login.
- Widget embed snippet renders a widget shell on an allowed origin.

b) Widget configuration and embedding
Actors: Agency Admin, Agency Developer, End Customer (uses widget)

Preconditions:
- Tenant exists and Agency Admin has WidgetConfig and embed snippet.

Flow:
1. Agency Admin customizes WidgetConfig: logo_url, primary_color, default_currency, default_locale, allowed_origins (Portal UI).
   - Backend: validate inputs and persist.
2. Agency Developer copies embed snippet and pastes into agency site:
   - Example snippet loads widget.js and initializes with tenant_id and client_id (public).
3. On page load widget:
   - Calls GET /public/tenants/{tenant_id}/widget-config to fetch config (no DRCT token).
   - Validates window.location.origin is in allowed_origins; if not, show error and do not proceed.
4. Widget renders search UI localized per WidgetConfig.
5. Widget initiates search when end customer fills form:
   - POST /public/search (tenant-scoped auth or ephemeral token issued by widget initialization).
   - Widget displays results and enables selecting an offer.

Backend responsibilities:
- Serve WidgetConfig; ensure allowed_origins enforcement.
- Provide tenant-scoped token or accept CORS calls with origin checks (decide approach).
- Rate-limit public search calls per tenant; enforce caching/coalescing.

Success criteria / Acceptance tests:
- Widget fetches config and enforces allowed origins.
- Widget can render localized UI based on WidgetConfig.
- Widget search requests are accepted and return standardized offers.

c) Flight search → offer pricing
Actors: Agency Agent (portal) or End Customer (widget)

Preconditions:
- Widget or Portal can call backend authenticated endpoints.
- DRCT sandbox available for testing.

Flow:
1. User submits search criteria (origin, destination, dates, pax).
   - Widget/Portal calls: POST /public/search { tenant_id, criteria }.
2. Backend validates request, enforces tenant quota/rate-limit, and either:
   - Synchronous path: call DRCT offers_search (respecting rate limits) and return normalized offers.
   - Cached/coalesced path: serve from cache where allowed by DRCT rules.
   - Always record DRCTRequestLog with sanitized payload and response.
3. Backend returns offers list with the following data:
   - offer_id (aviaframe id), itinerary segments, price (base/taxes), valid_until, fare_rules_summary, provider meta.
4. User selects an offer and requests price confirmation (if needed):
   - PATCH /public/offers/{offer_id}/price with passenger mix or extras.
5. Backend calls DRCT price/price-confirm endpoint, applies tenant-specific markups/fees, returns final price and fare_rules.

Backend responsibilities:
- Normalization layer for DRCT responses.
- Enforce offers validity and expiration.
- Maintain mapping from af-offer-id to DRCT-specific identifiers for later order creation.
- Handle 429 and 5xx from DRCT with backoff, surface helpful errors to client (409 for price change).

Success criteria / Acceptance tests:
- Search returns normalized offers with required fields.
- Price confirmation returns final payable amount and indicates if fare expired or changed (409).
- DRCTRequestLog entries created for each DRCT call (sanitized).

d) Order creation → ticket issuing
Actors: Agency Agent (portal) or server-side integration using tenant API keys

Preconditions:
- Offer selected and price confirmed.
- Agency has provided passenger data and payment reference (payment handled externally per MVP).
- Client provides Idempotency-Key header for POST /public/orders.

Flow: Order creation
1. Client POST /public/orders with body: { tenant_id, offer_id, passengers, contact, payment } and header Idempotency-Key.
2. Backend validates input (passenger docs, mandatory fields), checks idempotency record:
   - If idempotency record exists: return stored result.
   - Else: create local OrderRecord with status PENDING and persist IdempotencyRecord.
3. Backend maps Aviaframe payload to DRCT order_create model and calls DRCT order create.
   - On success, persist drct_order_id and update OrderRecord status to BOOKED (or BOOKING_CONFIRMED as per DRCT semantics), record DRCTRequestLog and AuditLog.
   - On partial/uncertain success, set status to PENDING_RECONCILE and create reconciliation task.
4. Return 201 with order_id and status.

Flow: Ticket issuing
1. After payment is confirmed externally, client POST /public/orders/{order_id}/issue with Idempotency-Key.
2. Backend validates order status, idempotency, and calls DRCT issue endpoint.
3. On success, persist ticket numbers in OrderRecord, change status to ISSUED, emit AuditLog, and return ticket details.
4. On failure (e.g., DRCT 429/500), apply retry policy; if irrecoverable, set status to FAILED and surface actionable error.

Backend responsibilities:
- Enforce idempotency and low-latency idempotency-record reads.
- Validate passenger documents and required fields before DRCT call.
- Persist DRCT responses and reconciliation tasks.
- Emit webhooks to agency endpoints (if configured) for order state changes (v2).

Success criteria / Acceptance tests:
- POST /public/orders returns 201 and persists OrderRecord with mapped drct_order_id when DRCT returns success.
- Repeated POST with same Idempotency-Key returns same result (idempotent).
- Issue endpoint returns ISSUED and ticket numbers; repeated calls with same Idempotency-Key do not create duplicates.

e) Order cancellation
Actors: Agency Agent

Preconditions:
- Existing OrderRecord in BOOKED or ISSUED state (as allowed).
- Cancellation allowed by fare rules or agency policy.

Flow:
1. Agent issues DELETE /public/orders/{id} (include reason metadata optional).
2. Backend validates cancellation eligibility:
   - Check fare_rules, time limits, and drct_order_id.
3. If allowed, map to DRCT cancel/refund endpoints and call DRCT.
4. Update OrderRecord status to CANCELLED (or CANCEL_PENDING until DRCT confirms).
5. If refunds are applicable and processed via agency or a payment provider, record refund_reference.
6. Emit AuditLog and optionally webhook to agency endpoints.

Backend responsibilities:
- Validate cancellation rules; prevent cancellations that DRCT forbids.
- Map DRCT cancel responses and persist refund details.
- Handle partial cancellations (per passenger/segment) and reflect status accordingly.

Success criteria / Acceptance tests:
- DELETE returns 200 and OrderRecord updated to CANCELLED with refund_reference where applicable.
- If cancellation denied by DRCT, return 400 with explanation and log the reason.

3. MVP scope (explicit, deliverable and testable)

Core features (MVP)
- Search
  - POST /public/search — normalized offers; backend DRCT adapter.
- Price
  - PATCH /public/offers/{id}/price — final pricing with agency markups.
- Order create / issue
  - POST /public/orders (idempotent), POST /public/orders/{id}/issue (idempotent).
- Manual payment by agency
  - Payment processing occurs outside Aviaframe in the MVP; API accepts payment reference and records it.
- Whitelabel widget (MVP — not v2)
  - Agency branding: logo, primary color, accent color, font, locale (en/ar with RTL), currency.
  - Custom domain per agency (e.g., `widget.myagency.com`) with automatic SSL.
  - Origin allowlist with domain manager UI.
  - No Aviaframe branding visible to end users.
  - Widget preview in Agency Admin portal.
  - See docs/13_WIDGET_CUSTOMIZATION_SPEC.md.
- Email service via Resend (MVP — not v2)
  - Invite/onboarding emails with magic link.
  - Booking confirmation, e-ticket with branded PDF itinerary, cancellation, payment instructions.
  - All emails branded per agency (logo, colors, sender name, reply-to).
  - Custom sender domain per agency (DKIM/SPF).
  - See docs/12_EMAIL_SERVICE_SPEC.md.
- Super Admin Console (all UI in English)
  - Agency CRUD, member management, platform analytics, audit log, integration health.
  - See docs/09_SUPER_ADMIN_MVP.md.
- Agency Admin Console (all UI in English)
  - Widget Builder with live preview, domain manager, team management, orders, analytics, email settings.
  - See docs/09_SUPER_ADMIN_MVP.md.
- Security & reliability
  - 2FA for super_admin and agency_admin.
  - API keys per agency, rate limiting per tenant, webhook system, feature flags.
  - Correlation ID (UI → backend → n8n → DRCT).
- Observability & compliance
  - DRCTRequestLog, AuditLog, idempotency persistence, tenant-scoped auth, PII masking in logs.
  - Data export for GDPR, soft delete everywhere.
- Dev & Ops
  - Sandbox integration with DRCT, CI with lint/test/build, Docker Compose for local dev.

Acceptance criteria for MVP
- End-to-end sandbox flow from search → price → order create → issue completes with idempotency keys and logs recorded.
- Widget renders on allowed origins and can perform search and start booking flow.
- Portal supports tenant onboarding and widget config retrieval.
- CI pipeline passes lint, unit tests, and build.

4. Post-MVP / v2 scope (prioritized)

High-value additions (v2+)
- Online payments integration
  - Support payment capture in-platform (PCI-compliant or tokenized PSP) and automated refund reconciliation.
- Advanced reporting & analytics
  - Per-tenant dashboards: booking volumes, revenue, conversion funnels, search heatmaps.
- Multi-language widget
  - Full i18n support including Arabic (RTL), currency formatting and locale-aware date handling.
- Advanced white-label & CMS
  - Full CMS-level template customization, drag-and-drop email editor, deeper widget theming (Enterprise).
- Webhooks & integrations
  - Robust webhook delivery with retry/backoff, subscription management for order events.
- Multi-provider aggregation
  - Add connectors to other content providers beyond DRCT for improved coverage and pricing.
- Enterprise features
  - SSO (SAML/OIDC), SLA upgrades, dedicated instances or rate-limit increases via contract.

5. UX principles (guiding design & implementation)

These principles must be applied across Portal and Widget.

- Minimal steps for agents
  - Agent flows should require the fewest possible interactions to complete booking tasks. Default values from WidgetConfig (currency, pax defaults) should be applied where reasonable.

- Fast response time
  - Aim for < 1.5s 95th percentile for search response from Aviaframe API (excluding DRCT network time). UI should show progressive states and meaningful ETA for long-running operations.

- Clear error & recovery guidance
  - Surface actionable messages to agents (e.g., "Fare expired, please reprice", "Try again — rate limit reached, retry in 30s"). Provide “retry” actions in the UI where safe.

- White‑label friendly
  - Widget must support tenant branding: logo, colors, fonts, and limited layout options. Styling must be configurable without code changes for agency sites.

- Mobile-first & accessibility
  - Widget must be responsive and meet basic accessibility (A11y) guidelines (contrast, keyboard navigable).

- Security-first UX
  - Never prompt for or display DRCT credentials in UI. Mask sensitive passenger fields where not needed.

6. Non-goals (explicit)

- Competing with full GDS systems
  - Aviaframe is not attempting to be a full GDS replacement; it provides a rapid DRCT-mediated booking surface for agencies.

- Direct B2C sales
  - The product will not target direct-to-consumer acquisition or consumer-facing accounts in MVP; end-customers interact through agencies.

- Full payment processing and settlement workflows (MVP)
  - Payment capture, settlement and reconciliation are out-of-scope for MVP and planned for v2.

7. Implementation notes & team task mapping (actionable)

Below are suggested first-cut tasks derived from the PRD to help teams plan sprints. Each task should be split further into sub-tasks for implementation.

Frontend (Portal & Widget)
- Implement tenant onboarding screens (Portal) and invite flow.
- Build WidgetConfig editor in Portal and embed-snippet generator.
- Implement widget.js loader and initialization handshake with backend.
- Build search UI, results list, price confirmation dialog, passenger data form and order summary UI.
- Implement issue/cancel actions in Portal agent UI and confirmation modals.

Backend (API & DRCT adapter)
- Implement tenant model, user model, WidgetConfig and subscription model.
- Implement public endpoints: GET /public/tenants/{id}/widget-config, POST /public/search, PATCH /public/offers/{id}/price, POST /public/orders, POST /public/orders/{id}/issue, DELETE /public/orders/{id}.
- Implement DRCT adapter with:
  - Rate limiting, retries with exponential backoff & jitter,
  - Idempotency persistence for order and issue operations,
  - Sanitized DRCTRequestLog and AuditLog.
- Implement allowed_origin checks for widget requests and tenant-scoped auth.
- Implement billing metering events (search_count, booking_count) emission.

QA & Test
- Unit tests for idempotency logic, DRCT adapter error mapping and retry behavior.
- Integration tests against DRCT sandbox: search, price, order create, issue, cancel.
- End-to-end tests for widget flows (embedding, search, start booking).
- Performance tests for search endpoint (simulate concurrent tenants and enforce DRCT rate-limit safe behavior).
- Security tests: verify no DRCT tokens surface to frontend, verify PII masking in logs.

CI / DevOps
- CI pipeline to run lint, unit tests, integration tests against sandbox and build artifacts.
- Docker Compose dev environment that runs backend and portal and allows local widget testing.
- Monitoring and alerting hooks for DRCT 429/401/5xx spike detection.

8. Acceptance criteria (release readiness)

To ship MVP the following must be true:
- End-to-end booking flow works in DRCT sandbox from search → price → order create → issue, including idempotency behavior and AuditLog entries.
- Portal supports onboarding and widget configuration; widget snippet produces a working widget on allowed origins.
- Security checks pass: DRCT tokens are not returned to frontend, PII masked in logs, tenant isolation validated.
- CI passes: lint, unit tests and integration tests.
- Basic observability in place: DRCTRequestLogs, error metrics, and alerting for repeated 401/429 errors.

9. Appendix — quick API call mapping (for frontend/back-end teams)

- Widget boot:
  - GET /public/tenants/{tenant_id}/widget-config
- Search:
  - POST /public/search
- Price confirm:
  - PATCH /public/offers/{offer_id}/price
- Create order:
  - POST /public/orders (Idempotency-Key header required)
- Issue tickets:
  - POST /public/orders/{order_id}/issue (Idempotency-Key header required)
- Cancel:
  - DELETE /public/orders/{order_id}

Each endpoint should be implemented with standard response wrappers, error codes and consistent logging. See docs/06_API_SPEC.md for request/response examples and auth expectations.

---

This PRD is the source of truth for scope, UX principles, and user journeys for the Aviaframe MVP. Teams should break the above items into sprint-sized tickets and attach acceptance tests to each ticket. For technical constraints and integration details consult docs/03_SRS.md and docs/DRCT_INTEGRATION.md.