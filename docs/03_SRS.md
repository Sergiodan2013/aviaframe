# Aviaframe — Software Requirements Specification (SRS)

Version: 1.2  
Date: 2026-01-26  
Author: Product / Engineering

Purpose  
This SRS defines the software requirements for Aviaframe. It is implementation-oriented and intended to be used directly by engineering, QA, and operations to implement and verify the system.

Table of contents
- 1 System overview
- 2 Functional requirements
  - 2.1 Backend
  - 2.2 Portal
  - 2.3 Widget
- 3 Non-functional requirements
- 4 Error handling strategy
- 5 Compliance
- 6 Traceability & acceptance criteria
- 7 Appendix — data/endpoint sketches

---

1. System overview

1.1 High-level architecture

Aviaframe is a multi-tenant, cloud-hosted B2B SaaS system composed of three logical components:

- Backend API (avf-backend)
  - Exposes tenant-scoped public APIs used by the Widget and Portal.
  - Implements DRCT adapter that proxies/normalizes DRCT endpoints.
  - Manages tenant metadata, authentication/authorization, billing metering, idempotency, auditing, logging and operational tooling.

- Portal (avf-portal)
  - Single-page web app for Platform Admins, Agency Admins and Agents.
  - Uses backend APIs for all operations (no direct DRCT access).

- Widget (avf-widget)
  - Embeddable JavaScript delivered to agency websites.
  - Communicates only with backend public endpoints (CORS or signed ephemeral token).
  - Lightweight and configurable via WidgetConfig served by backend.

Supporting services:
- Persistent datastore (relational DB, e.g., PostgreSQL) for tenants, users, orders, idempotency records, WidgetConfig, billing records and AuditLog.
- Append-only storage for DRCTRequestLog (could be DB table or log-append store).
- Secrets manager / KMS for DRCT credentials and other secrets.
- Queueing system (e.g., Redis streams, RabbitMQ, SQS) for background reconciliation and rate‑limit smoothing.
- Monitoring / alerting (Prometheus, Grafana, alert rules).
- CI/CD pipeline for builds, tests and deployments.

1.2 Data flow (simplified)
- Widget -> Backend /public endpoints -> Backend validates tenant & origin -> Backend DRCT adapter -> DRCT -> response -> Backend normalizes -> Widget/Portal.
- Order creation/issue: Client -> Backend (Idempotency-Key) -> Persist IdempotencyRecord -> call DRCT -> persist OrderRecord, DRCTRequestLog, AuditLog -> respond.

1.3 Deployment model
- SaaS multi-tenant deployment hosted in a cloud provider.
- Services run in containers (k8s recommended) with autoscaling.
- Secrets stored in managed secret manager; DB encrypted at rest.

---

2. Functional requirements

This section lists functional requirements organized by module and given unique IDs. Each requirement is specific and testable.

2.1 Backend (API & DRCT adapter)

FR-BE-001: Tenant management
- The backend MUST offer CRUD operations for Tenant:
  - Create: POST /internal/tenants — body: { name, country, currency, timezone, subscription_plan_id } → returns tenant_id (UUID).
  - Read: GET /internal/tenants/{tenant_id}
  - Update: PATCH /internal/tenants/{tenant_id}
  - Deactivate/Delete: DELETE /internal/tenants/{tenant_id} (soft delete).
- Implementation details:
  - tenant_id is primary scoping key for all tenant-specific data.
  - Tenant creation must create a default WidgetConfig record and default quota counters.
  - Tenant status transitions must be logged in AuditLog.

FR-BE-002: Authentication & Authorization
- The backend MUST implement:
  - Platform Admin accounts (global).
  - Tenant-scoped API keys and OAuth tokens for agency integrations.
  - Session-based authentication for Portal users.
- Authorization:
  - All APIs MUST validate that the authenticated principal is authorized to act on the requested tenant_id.
  - Access control enforced by middleware; deny requests missing tenant context.

FR-BE-003: DRCT API proxying & normalization
- The backend MUST provide a DRCT adapter module that:
  - Maps Aviaframe API payloads to DRCT payloads and back to normalized Aviaframe responses.
  - Records every DRCT interaction into DRCTRequestLog with sanitized payloads.
  - Adds x-correlation-id to outbound requests and persists mapping for traceability.
- DRCT adapter responsibilities:
  - Payload validation (schema enforcement).
  - Apply tenant-specific markups/fees to returned prices.
  - Respect provider constraints (e.g., validity windows, fare rules).
- Exposed public endpoints (minimum required):
  - POST /public/search → normalized offers
  - PATCH /public/offers/{id}/price → price confirmation
  - POST /public/orders → order create (idempotent)
  - POST /public/orders/{id}/issue → issue (idempotent)
  - DELETE /public/orders/{id} → cancel
  - GET /public/tenants/{tenant_id}/widget-config → widget config

FR-BE-004: Rate limiting & throttling
- The system MUST implement two tier rate limiting:
  - Per-tenant rate limits (configurable per subscription plan).
  - Global rate limits to protect platform and DRCT contract limits.
- Provider-specific constraints:
  - For endpoints mapped to DRCT offers_search, the backend MUST enforce that DRCT calls do not exceed 1 req/sec per configured DRCT account unless contract says otherwise.
  - Backend MUST implement request queueing or coalescing for concurrent identical search requests (same criteria from same tenant) to reduce DRCT calls.
- Implementation details:
  - Use token-bucket algorithm per-tenant with burst window equal to plan rate.
  - Implement circuit-breaker when provider returns sustained 5xx/429 to mitigate storms.

FR-BE-005: Idempotency handling
- The backend MUST require and persist Idempotency-Key for operations that create external side-effects (order create, issue).
- Rules:
  - Idempotency record key scope = hash(tenant_id + operation_type + idempotency_key).
  - On receiving a request with an Idempotency-Key:
    - If a record exists, return stored result (status code and body) without duplicating operation.
    - If not, create idempotency record in an ACID transaction before calling DRCT.
  - Persistence:
    - Idempotency records MUST be durable and readable with low latency (recommended: same DB used for orders, or an in-memory store with persistence).
    - TTL for idempotency records: default 7 days configurable per tenant.
  - Concurrency:
    - Acquire a short-lived lock per idempotency key to prevent race conditions (eg. SELECT FOR UPDATE or distributed lock).
- Errors:
  - If idempotency record maps to a different request signature (duplicate key with different payload), return 409 Conflict.

FR-BE-006: Order lifecycle & reconciliation
- The backend MUST maintain canonical OrderRecord with fields:
  - order_id (UUID), tenant_id, offer_id, drct_order_id, status, amount_total, currency, passenger_data (encrypted fields), idempotency_key, created_at, updated_at.
- Status transitions MUST be defined and enforced:
  - PENDING -> BOOKED -> ISSUED -> COMPLETED
  - PENDING -> FAILED
  - BOOKED -> CANCEL_PENDING -> CANCELLED
- Reconciliation:
  - For uncertain / partial responses, create background reconciliation job to check DRCT order status and reconcile OrderRecord.
  - Reconciliation jobs must be idempotent and logged.

FR-BE-007: Logging & Audit
- DRCTRequestLog:
  - Record: drct_request_id, tenant_id, request_type, request_payload_sanitized, response_payload_sanitized, status_code, latency_ms, occurred_at, correlation_id.
- AuditLog:
  - Append-only, records user and system actions: audit_id, tenant_id, user_id, action, details (sanitized), ip_masked, occurred_at.
- PII handling:
  - Logs MUST NOT include unmasked PII (see Compliance section).

FR-BE-008: Billing & metering
- Backend MUST emit and persist billing events:
  - search_count, booking_count, issue_count per tenant per period.
- Expose read endpoints for subscription visibility in Portal.

2.2 Portal (avf-portal)

FR-PORT-001: Agency management
- Portal MUST allow Platform Admins and Agency Admins to:
  - Create and manage Agency users (invite, revoke, roles).
  - Manage Agency profile (name, contact, country, currency).
  - View a list of agency orders and their status.

FR-PORT-002: Subscription visibility & management
- Portal MUST display subscription plan, quota usage (searches, bookings), billing metadata and next invoice date.
- Platform Admins MUST be able to update subscription_plan for a tenant.

FR-PORT-003: API key & credential management
- Portal MUST allow:
  - Generating, rotating, revoking tenant-scoped API keys (for server-to-server integrations).
  - Display last-used timestamp for API keys.
- Generated keys MUST be shown only once; subsequent requests show masked token and allow rotation.

FR-PORT-004: Widget configuration UI
- Portal MUST expose a WidgetConfig editor: branding (logo URL), colors, default locale, default currency, allowed_origins list.
- Portal MUST generate and display the embed snippet that includes tenant_id and a client_id/public key (not DRCT token).

FR-PORT-005: Order management UI
- Portal MUST allow agents to:
  - Execute searches, open offer details, create orders and issue tickets manually.
  - View order history, audit trail and DRCTRequestLog entries (sanitized view).
  - Trigger cancellation with confirmation and record refund references.

2.3 Widget (avf-widget)

FR-WG-001: Initialization & config
- Widget loader MUST fetch WidgetConfig via GET /public/tenants/{tenant_id}/widget-config at initialization.
- Widget MUST verify origin against allowed_origins returned; if origin is not allowed widget must render a non-functional error and log the attempt.

FR-WG-002: Search form
- Widget MUST present UI fields: origin, destination, depart_date, return_date (optional), passengers (ADT/CH/INF), cabin, currency and locale.
- Client-side validation MUST be performed for required fields and basic format checks.

FR-WG-003: Results rendering & interaction
- Widget MUST call POST /public/search and display normalized offer list with:
  - offer_id, price summary (base/taxes/total), itinerary summary, valid_until, fare_rules_summary.
- Offer selection MUST allow proceeding to price confirmation and collection of passenger/contact details.
- Widget MUST not perform any DRCT calls directly.

FR-WG-004: Error handling & UX
- Widget MUST render friendly error messages for mapped backend errors (see Error Handling section).
- For transient errors (rate-limit), widget should display a backoff message and allow retry after suggested Retry-After.

FR-WG-005: Security & privacy
- Widget MUST not store or log full passenger PII in browser console or local storage.
- Widget MUST not receive DRCT credentials; only public client_id/tenant_id (if used).
- Widget must dispose any passenger data held in memory once order submission completes.

---

3. Non-functional requirements

NFR-01: Performance
- Search latency targets (Aviaframe API only; excludes DRCT network variability):
  - P95 (95th percentile) response time for POST /public/search ≤ 1.5 seconds.
  - Median response time ≤ 500 ms under normal load.
- Pricing and order creation:
  - PATCH /public/offers/{id}/price P95 ≤ 1.5s.
  - POST /public/orders latency P95 ≤ 2.5s for successful fast-path responses.
- Benchmarks:
  - QA must provide load tests to validate above under representative loads.

NFR-02: Availability
- Platform target availability:
  - 99.9% uptime for public APIs (monthly), measured externally.
  - Planned maintenance windows must be communicated; emergency maintenance must follow incident procedures.

NFR-03: Scalability & capacity
- Design for horizontal scaling—stateless API nodes, central DB & caching tiers.
- Autoscaling rules:
  - Scale up when CPU > 70% or request queue depth exceeds threshold.
- Capacity planning:
  - Must consider DRCT contract throughput; backend may need throttling even if platform capacity grows.

NFR-04: Security
- Transport: TLS 1.2+ enforced on all endpoints (clients, backend → DRCT).
- Secrets: DRCT credentials stored in encrypted secret manager; access limited to backend service account.
- Data at rest: PII and sensitive fields encrypted (AES-256) with KMS-managed keys.
- Authentication: RBAC enforced; stale tokens revoked; API keys rotated.
- Static analysis & SCA integrated into CI; scheduled pentests annually.

NFR-05: Logging, observability & monitoring
- Structured JSON logs with fields: timestamp, service, env, tenant_id, user_id, correlation_id, event, level, message, sanitized_details.
- Metrics:
  - Request rates, latencies, error rates per endpoint and per tenant.
  - DRCT-specific metrics: 429 counts, 401 counts, average latency, RPS.
- Alerting:
  - Alert on > 1% error rate sustained for 5 minutes, repeated 401 from DRCT, or DB replication lag > threshold.
- Retention:
  - Operational logs: 90 days.
  - Audit logs: 1 year (configurable per contract).
  - DRCTRequestLog: 180 days (or as required by contract).

NFR-06: Maintainability & testing
- Unit test coverage target: minimum 60% for core modules at MVP.
- Integration tests must run against DRCT sandbox.
- Code style and linting enforced; PRs require passing CI.

NFR-07: Reliability
- Implement retries with exponential backoff and circuit-breakers for transient errors.
- Reconciliation background worker to handle uncertain states (eg. unknown order status).

---

4. Error handling strategy

4.1 Error mapping principles
- Map low-level DRCT and infrastructure errors to UI-safe, actionable messages.
- Always return structured error object: { error: { code, message, details? } }.
- Error codes must be stable and documented (see Appendix).

4.2 Mapping table (examples)

- DRCT 400 — Map to AVF_400_BAD_REQUEST
  - Client receives 400 with message "Invalid request — check passenger/offer data".
- DRCT 401 — Map to AVF_401_PROVIDER_CREDENTIALS
  - Client receives 401. Backend triggers credential-rotation alert for ops if repeated occurrences. Do not expose provider tokens.
- DRCT 404 (offer not found/expired) — Map to AVF_404_OFFER_NOT_FOUND
  - Client receives 404 with "Offer expired, please re-search".
- DRCT 409 (price changed/booking conflict) — Map to AVF_409_PRICE_CHANGED
  - Client receives 409 with details: new_price or price_changed=true.
- DRCT 429 (rate limit) — Map to AVF_429_RATE_LIMIT
  - Client receives 429 with Retry-After header. Widget should surface message "Rate limit reached, try again in Xs".
- DRCT 5xx — Map to AVF_503_UPSTREAM_UNAVAILABLE
  - Client receives 503 with generic message and suggested retry pattern.

4.3 Retry rules (implementation)
- For DRCT 429:
  - If Retry-After header supplied, wait that many seconds before retry.
  - If no Retry-After, apply exponential backoff with jitter: initial delay 1s → 2s → 4s (max 3 retries). After retries fail, surface AVF_429_RATE_LIMIT.
  - Do NOT retry automatically for idempotent operations without Idempotency-Key semantics in place (order creation/issue require idempotency).
- For DRCT 500/502/503/504:
  - Retry up to 3 times with exponential backoff and full jitter (1s, 2s, 4s).
  - If still failing, return AVF_503_UPSTREAM_UNAVAILABLE and create SRE incident if thresholds crossed.
- For DRCT 400-series (except 429):
  - Treat as permanent failure and return mapped AVF_400 code; do NOT retry automatically.
- For network errors (timeouts, DNS):
  - Retry up to 3 times with backoff; if failures persist, treat as 503 and trigger reconciliation/alert if operation was state-changing.

4.4 Idempotency and partial failure handling
- Order creation and issuing must be idempotent:
  - Require client to provide Idempotency-Key header (UUID).
  - Persist idempotency result before returning success.
  - In case of partial success (DRCT created order but response lost), reconciliation job must detect and attach drct_order_id to OrderRecord and update status.
- Reconciliation job:
  - Should run in background queue and attempt to re-query DRCT order status by available identifiers.
  - Must be idempotent and retriable with backoff.
  - All reconciliation steps logged in AuditLog.

4.5 UI-safe errors and guidance
- Errors returned to widget/portal should include:
  - Human-friendly message for Agent or end-customer.
  - Machine-usable code for automated handling.
  - If action is required (e.g., reprice), include suggested next action.

---

5. Compliance

5.1 GDPR & data subject rights
- Data minimization:
  - Store only fields required for booking and regulatory obligations.
  - Avoid storing unnecessary PII; when stored, mark fields as sensitive.
- Data subject requests:
  - Provide per-tenant tools to export or delete user/customer data on request.
  - Deletion must cascade or anonymize data while retaining audit trail (pseudonymize order traces where legally required).
- Data Processing Agreement:
  - Aviaframe must sign DPAs with agencies and ensure subprocessors (hosting, DRCT if required) comply.

5.2 PII storage rules and encryption
- Classification:
  - Sensitive PII: passport number, national ID, credit card data (should not be stored), payment card numbers.
  - Non-sensitive: names, contact emails (still considered personal data, treat carefully).
- Storage:
  - Encrypt sensitive fields at rest using KMS-managed keys; individual field encryption recommended for passenger documents.
  - Passenger documents: store encrypted, only decrypt in memory for the minimum required processing and audit-read events.
- Logging & Masking:
  - Do not log full PII. Masked examples:
    - Passport: *********123
    - Email: j***@example.com
    - Phone: +9715*****567
- Access control:
  - Access to unmasked PII requires elevated role (Agency Admin with justification or Platform Admin) and must be recorded in AuditLog.
- Retention:
  - Passenger PII retention default: 365 days after flight date, configurable per tenant or contract; then purge or anonymize.
  - Audit logs retention: 1 year (or per customer contract).

5.3 Regional & local compliance (Middle East focus)
- Be prepared to:
  - Support country-specific data residency if required (e.g., deploy regionally or use per-tenant data segregation).
  - Apply VAT/tax handling according to local tax rules; store tax-related metadata for invoices.

5.4 Security & operations
- Secrets & tokens:
  - DRCT tokens stored only in secret manager; never revealed to clients or included in logs.
- Penetration testing & audits:
  - Annual pentest and regular SCA/SAST scans required.
- Incident response:
  - Runbooks for data breach, DRCT credential compromise, or large-scale data exposure.

---

6. Traceability & acceptance criteria

6.1 Traceability
- Each PRD / BRD item maps to SRS FR-IDs above. Implementations must reference FR IDs in tickets.
- API spec in docs/06_API_SPEC.md is the contract for integration; SRS requirements must be satisfied by implementation.

6.2 Acceptance criteria (examples)
- FR-BE-003 (DRCT proxy):
  - Automated test: Given a well-formed /public/search request, backend makes at most 1 DRCT offers_search call per identical concurrent request (coalescing) and returns normalized offers.
  - DRCTRequestLog entry exists with sanitized request/response.
- FR-BE-005 (Idempotency):
  - Repeat POST /public/orders with same Idempotency-Key returns identical 201 response and only one DRCT order_create call is observed.
- NFR-01 (Performance):
  - Under defined load (e.g., 500 concurrent tenants, average 50 rps total), P95 for POST /public/search ≤ 1.5s measured in load test.
- Security:
  - Penetration test reveals no DRCT tokens in frontend code or logs.

---

7. Appendix — data/endpoint sketches

7.1 Key DB tables (recommended columns)

Tenants
- tenant_id UUID PK
- name, country, currency, timezone
- subscription_plan_id FK
- status, created_at, updated_at

AgencyUsers
- user_id UUID PK
- tenant_id FK
- email (unique per tenant)
- password_hash / oauth_subject
- role (agency_admin, agent)
- status, last_login_at

WidgetConfig
- config_id UUID PK
- tenant_id FK
- allowed_origins JSON array
- branding JSON (logo_url, colors)
- default_currency, default_locale
- created_at, updated_at

Orders
- order_id UUID PK
- tenant_id FK
- offer_id
- drct_order_id (nullable)
- status enum
- amount_total numeric
- currency varchar
- passenger_data (encrypted JSON)
- payment_reference varchar (masked)
- idempotency_key varchar
- created_at, updated_at

IdempotencyRecords
- key varchar PK (hash tenant+op+key)
- tenant_id FK
- operation_type varchar
- response_snapshot JSON
- status varchar
- created_at, last_used_at, expires_at

DRCTRequestLog
- drct_request_id UUID PK
- tenant_id FK
- request_type varchar
- request_payload_sanitized JSON
- response_payload_sanitized JSON
- status_code int
- latency_ms int
- correlation_id varchar
- occurred_at

AuditLog
- audit_id UUID PK
- tenant_id FK
- user_id FK
- action varchar
- details JSON (sanitized)
- ip_masked varchar
- occurred_at

7.2 Example Idempotency pseudocode (create order)

1. Validate tenant and input payload.
2. key = hash(tenant_id + 'order_create' + Idempotency-Key)
3. Begin DB transaction:
   - SELECT idempotency_record FOR UPDATE WHERE key = key
   - IF record exists: return record.response_snapshot
   - ELSE:
     - Insert idempotency_record with status=IN_PROGRESS
     - Insert OrderRecord with status=PENDING
4. Commit transaction.
5. Call DRCT order_create.
6. On success:
   - Update OrderRecord with drct_order_id and status=BOOKED.
   - Update idempotency_record with response_snapshot and status=COMPLETED.
7. On failure:
   - Update idempotency_record with status=FAILED and error details.
   - Update OrderRecord status=FAILED (or PENDING_RECONCILE for partial success).
   - Return error to client.

7.3 Monitoring & alerting rules (examples)
- Alert if DRCT 401 count > 5 in 5 minutes → "DRCT credentials failing"
- Alert if DRCT 429 rate-limit events > 50 in 5 minutes → "DRCT rate saturation"
- Alert if P95 search latency > 2s for 10 minutes → "Search Latency Degradation"

---

This SRS provides concrete functional and non-functional requirements to guide implementation and verification. Engineering teams should create implementation tasks referencing FR IDs, include acceptance tests described above, and update docs/06_API_SPEC.md and docs/DRCT_INTEGRATION.md for any changes to the integration contract.