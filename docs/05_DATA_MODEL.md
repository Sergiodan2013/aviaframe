# Aviaframe — Logical Data Model

Version: 1.2  
Date: 2026-01-26  
Author: Product / Engineering

This document describes the logical (conceptual) data model for Aviaframe. It intentionally avoids physical schema or SQL, instead focusing on the entities, their purpose, key fields, and relationships. The model is designed to support multi-tenant operation, strong auditability, idempotent booking flows, and strict PII controls.

Guiding principles
- Tenant-first: every tenant (agency) is the primary scoping construct. Tenant context (tenant_id) is required for any tenant-scoped operation.
- Immutable audit trail: business-critical events and DRCT interactions are recorded in append-only logs for traceability.
- Minimize PII footprint: only the minimum necessary PII is persisted, and sensitive values are encrypted and masked in logs and UI.
- Clear separation of persisted vs transient data: ephemeral caches and tokens are explicitly transient; canonical state is persisted.

Entity definitions

1) Tenant
- Purpose
  - Represents an Aviaframe customer (a travel agency, consolidator or partner). All tenant-specific configuration, usage, and data are scoped under a Tenant.
- Key fields (conceptual)
  - tenant_id (UUID) — stable unique identifier
  - name
  - legal_name (optional)
  - primary_country
  - default_currency
  - default_locale
  - status (active | suspended | deleted)
  - subscription_id (link to Subscription)
  - created_at, updated_at
  - metadata (free-form JSON for tags, region hints)
- Relationships
  - Tenant 1:N AgencyUser
  - Tenant 1:1 WidgetConfig
  - Tenant 1:N OrderRecord
  - Tenant 1:N DRCTRequestLog
  - Tenant 1:N AuditLog
- Notes
  - tenant_id is the canonical scoping key used by services, logs, and access controls.

2) AgencyUser
- Purpose
  - Represents an individual human account that logs into the Portal (Agency Admin or Agency Agent). Used for authentication, authorization, and audit attribution.
- Key fields
  - user_id (UUID)
  - tenant_id (FK to Tenant)
  - email
  - display_name
  - role_id (FK to Role)
  - auth_provider (password | oauth | saml)
  - password_hash (if applicable) — stored per security policy
  - status (active | invited | suspended)
  - last_login_at
  - created_at, updated_at
- Relationships
  - AgencyUser N:1 Tenant
  - AgencyUser N:1 Role
  - AgencyUser 1:N AuditLog (user actions)
- Notes
  - Email uniqueness is enforced within a tenant (two tenants may have same email).
  - Access to unmasked PII or sensitive operations requires appropriate role and is recorded to AuditLog.

3) Role
- Purpose
  - Defines a set of permissions used to enforce RBAC in portal and API. Typical roles: platform_admin, agency_admin, agent.
- Key fields
  - role_id (string or UUID)
  - name (e.g., agency_admin)
  - permissions (list of permission identifiers)
  - description
- Relationships
  - Role 1:N AgencyUser
- Notes
  - Roles are used by authorization middleware to validate actions against tenant context.

4) SubscriptionPlan
- Purpose
  - Describes the product tier and its entitlements (quotas, rate limits, SLA level, feature flags).
- Key fields
  - plan_id (UUID)
  - name (Starter | Growth | Enterprise)
  - monthly_fee, yearly_fee
  - included_searches_per_month
  - included_bookings_per_month
  - max_concurrent_search_rps (rate-limit hint)
  - features (list: white_labeling, dedicated_support, custom_rate_limits)
  - created_at, updated_at
- Relationships
  - SubscriptionPlan 1:N Subscription
  - SubscriptionPlan referenced by Tenant via Subscription

5) Subscription
- Purpose
  - Represents a tenant's enrollment in a SubscriptionPlan, billing metadata and active period.
- Key fields
  - subscription_id (UUID)
  - tenant_id
  - plan_id (FK to SubscriptionPlan)
  - start_date, end_date (for renewals)
  - status (active | trial | cancelled | past_due)
  - billing_contact (reference or email)
  - quota_overage_rates (if applicable)
  - created_at, updated_at
- Relationships
  - Subscription N:1 Tenant
  - Subscription N:1 SubscriptionPlan
- Notes
  - Subscription drives per-tenant quotas (metering) and rate-limit enforcement.

6) WidgetConfig
- Purpose
  - Tenant-specific configuration for the embeddable widget (branding, allowed origins, default UX settings).
- Key fields
  - config_id (UUID)
  - tenant_id
  - allowed_origins (list of origins: https://example.com)
  - branding (logo_url, primary_color, font hints)
  - default_currency
  - default_locale
  - feature_flags (object: show_fare_rules, require_agent_confirmation)
  - created_at, updated_at
- Relationships
  - WidgetConfig 1:1 Tenant
- Notes
  - WidgetConfig is read often; a cached copy (transient) is acceptable to improve latency but canonical copy is persisted.

7) DRCTRequestLog
- Purpose
  - Append-only record of every interaction with the DRCT provider for observability, debugging, and compliance.
- Key fields
  - drct_request_id (UUID)
  - tenant_id (nullable) — tenant associated with the request, null for platform-level calls
  - correlation_id (trace id)
  - request_type (offers_search | price | order_create | issue | cancel)
  - request_time, response_time, latency_ms
  - request_payload_sanitized (JSON) — PII removed or masked
  - response_payload_sanitized (JSON) — PII removed or masked
  - status_code (numeric)
  - drct_external_id (if present)
- Relationships
  - DRCTRequestLog N:1 Tenant
  - DRCTRequestLog N:0..1 OrderRecord (if request relates to an order)
- Notes
  - DRCTRequestLog is persisted for operational windows (e.g., 180 days) per retention policy. Full raw payloads with unmasked PII must never be persisted; only sanitized content is allowed.

8) OrderRecord
- Purpose
  - Canonical representation of a booking lifecycle inside Aviaframe: offer selection, booking with DRCT, ticket issuance, cancellations, refunds.
- Key fields
  - order_id (UUID)
  - tenant_id
  - af_offer_id (aviaframe offer id)
  - drct_order_id (external provider id; nullable until created)
  - status (PENDING | BOOKED | ISSUED | CANCELLED | FAILED | RECONCILE)
  - amount_total, currency, fare_breakdown
  - passenger_data (encrypted JSON) — contains passenger names, documents; sensitive fields flagged
  - contact_info (email, phone — masked where stored)
  - idempotency_key (string) — supplied by client for create/issue flows
  - created_at, updated_at
- Relationships
  - OrderRecord N:1 Tenant
  - OrderRecord 1:N DRCTRequestLog (DRCT calls related to this order)
  - OrderRecord 1:N AuditLog (order state changes)
- Notes
  - passenger_data contains PII and must follow PII storage rules (encryption, access control, retention). Some order metadata (status, amounts) is non-sensitive and available for reporting.

9) AuditLog
- Purpose
  - Immutable trail of user and system actions used for compliance, forensics, and dispute resolution.
- Key fields
  - audit_id (UUID)
  - tenant_id (nullable) — null for platform-level actions
  - user_id (nullable) — may be system user for automated actions
  - action (ORDER_CREATED, ORDER_ISSUED, USER_INVITED, CONFIG_UPDATED, SUBSCRIPTION_CHANGED, etc.)
  - timestamp
  - details_sanitized (JSON) — structured context about the action, with PII masked
  - ip_masked (client IP masked per policy)
- Relationships
  - AuditLog N:1 Tenant
  - AuditLog N:0..1 AgencyUser (actor)
  - AuditLog N:0..1 OrderRecord (subject)
- Notes
  - AuditLog is append-only; retention typically longer than operational logs and per contractual obligations.

Relationships summary (high-level)
- Tenant 1:N AgencyUser
- Tenant 1:1 WidgetConfig
- Tenant 1:N Subscription (history) / Tenant 1:1 Subscription (active)
- Tenant 1:N OrderRecord
- Tenant 1:N DRCTRequestLog
- Tenant 1:N AuditLog
- OrderRecord 1:N DRCTRequestLog
- AgencyUser 1:N AuditLog

Tenant isolation strategy (explicit)
- Logical scoping: tenant_id is required and validated for every request. Middleware enforces tenant scoping early in the request pipeline:
  - Incoming request must include authenticated principal and resolved tenant context (from API key, JWT, or session).
  - Authorization layer asserts tenant_id in request matches principal's tenant.
  - Default-deny: any request without tenant context or with mismatched tenant_id fails authorization.
- Data access controls:
  - Application-level filters apply tenant_id = X to all queries; an ORM/DAO layer should centralize this enforcement to avoid leaks.
  - Use DB-level Row-Level Security (RLS) in environments that support it for extra protection (optional, recommended for enterprise).
- Multi-tenant deployment options:
  - Single logical DB with tenant_id scoping (default for small/medium tenants).
  - Optional per-tenant schema or per-tenant DB for enterprise customers with stricter isolation or regional data-residency requirements.
- Secrets and keys:
  - Tenant-specific secrets (if any) are stored in secrets manager and referenced by tenant_id; access controlled to backend service only.
- Observability:
  - All logs and metrics include tenant_id as a required field so monitoring and alerts can be tenant-scoped.
- Network and infra:
  - For tenants with special compliance needs, deploy region-specific instances or dedicated infrastructure as needed.

Persisted vs transient data
- Persisted (canonical, durable)
  - Tenant, AgencyUser, Role, SubscriptionPlan, Subscription, WidgetConfig
  - OrderRecord (canonical booking state)
  - DRCTRequestLog (sanitized)
  - AuditLog (append-only)
  - Billing and metering events (search_count, bookings_count)
  - Idempotency records (durable for TTL)
- Transient (ephemeral, short-lived)
  - Widget runtime state in browser (not persisted)
  - Session tokens and ephemeral tokens for widget initialization (short TTL)
  - Caches for search results (in-memory or distributed cache with defined TTL)
  - Rate-limit tokens/buckets in memory or redis; their state is ephemeral and reconstructible
  - Background queue jobs metadata (reconciliation tasks) — tasks themselves may be transient but results are persisted (AuditLog, OrderRecord)
- Notes
  - DRCT raw payloads should not be persisted in full if they contain PII. Only sanitized payloads go into DRCTRequestLog. Full raw payloads may be stored in a secure, encrypted audit vault for a brief troubleshooting window if absolutely required and with strict controls — default policy is to avoid this.

PII storage rules (explicit)
- PII classification
  - Sensitive PII: passport numbers, national IDs, document numbers, full payment card data (PAN) — treat as highest sensitivity.
  - Personal data: passenger names, email addresses, phone numbers — treat as moderate sensitivity.
- Storage rules
  - Minimize: store only the PII fields required to complete the booking and comply with regulations.
  - Encryption at rest: all sensitive PII fields must be encrypted at the field level (using KMS-managed keys). Example: passenger.document.number, passenger.document.expiry.
  - Masking in persisted views: non-sensitive views used for lists or reports should use masked or derived values (e.g., last 3 characters of passport).
  - No payment card PANs: never persist raw card numbers. Store PSP tokens or payment references only.
- Logging rules
  - All logs must be sanitized: replace or redact sensitive PII before writing to any log sink.
  - DRCTRequestLog stores sanitized request and response payloads only. Any PII present in DRCT responses must be redacted.
- Access controls and auditing
  - Access to unmasked PII requires elevated privileges and must be recorded in AuditLog with who, why, and when.
  - UI and API endpoints that surface PII should perform on-the-fly decryption only when authorized, avoid caching decrypted data.
- Retention & deletion
  - Default retention for passenger PII: configurable (recommended default: 365 days after flight date), after which data is purged or irreversibly pseudonymized unless legal retention requirements apply.
  - Provide tenant-scoped data export and deletion APIs to satisfy data subject requests (GDPR) — deletion must leave an audit trace (pseudonymized).
- Transmission
  - All PII in transit must use TLS 1.2+.
  - Never transmit DRCT credentials or raw sensitive PII to the frontend or widget. Backend-only operations only.
- Monitoring & breach response
  - Monitor for anomalous access to PII stores; alert on suspicious access patterns.
  - Maintain an incident response plan for PII leaks and notify impacted tenants per contractual and legal requirements.

Appendix — usage examples (conceptual)
- Typical booking lifecycle:
  - Tenant A (tenant_id=TA) — AgencyUser U creates order → OrderRecord(order_id=O1, tenant_id=TA) persisted with encrypted passenger_data. DRCT calls are logged in DRCTRequestLog entries linked to O1. AuditLog records ORDER_CREATED by U.
- Widget initialization:
  - Widget requests WidgetConfig for tenant_id TA (transient fetch, cached). Widget enforces allowed_origins. No DRCT credentials are exposed.

This logical model is intended to be the single source of truth for how data is represented and handled in Aviaframe. Implementation teams should map these concepts to physical schemas and storage technologies while preserving tenant isolation, PII protections, and auditability described here. Any deviation or enterprise-specific partitioning (per-tenant DBs, stricter retention) must be documented and approved by Product and Security teams.