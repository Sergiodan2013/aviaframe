```markdown
# Aviaframe — Security Review & Controls

Version: 1.0  
Date: 2026-01-26  
Author: Security / Platform

Purpose
This document provides the security design, controls and operational recommendations for Aviaframe as an enterprise multi-tenant SaaS. It is written as a security review / requirements document intended for architects, engineers, product and operations teams. Where possible the guidance is prescriptive and implementation-oriented.

Scope
Covers authentication & authorization, tenant isolation, DRCT token management, PII handling and masking, logging & audit, idempotency/replay protection, and rate limiting/abuse protection. It assumes the backend is the only component that communicates with DRCT; the widget and portal are clients of the backend only.

1. Authentication & Authorization

Goals
- Strong, auditable identity for humans and services.
- Tenant-scoped access tokens; least privilege by default.
- Clear separation between user sessions (portal) and machine-to-machine credentials (API keys / tokens).

Requirements and recommendations
- Identity types
  - Human users: Portal accounts (Agency Admin, Agent, Platform Admin) authenticated via:
    - Enterprise: SAML or OIDC (recommended for enterprise customers).
    - Small agencies: username/password backed by secure hashing (bcrypt/argon2) + optional MFA.
  - Service accounts / integrations: tenant-scoped API keys (long-lived) or OAuth client credentials (preferred).
- Token formats and lifecycle
  - Use JWTs signed by platform private key (RS256). Token payload MUST NOT include sensitive PII.
  - Access token lifetime: short (e.g., 15–60 minutes). Use refresh tokens for session continuation where needed.
  - For machine-to-machine flows, support client-credentials OAuth with short-lived tokens and refresh flows for long-running processes.
- API keys
  - Store API keys as hashed values (e.g., HMAC-SHA256) in datastore; show the clear-text value only once at creation.
  - Support key rotation and immediate revocation. Track last-used timestamp.
  - Provide scoped API keys: bind to tenant_id and allowed IP ranges / allowed origins where applicable.
- RBAC and policy enforcement
  - Implement role-based access control (Role entity) with least-privilege permission sets.
  - Authorization middleware MUST verify both authentication and tenant-scoped authorization before executing any operation.
- Session & cookie security (Portal)
  - Use sameSite=Lax/Strict for session cookies; set Secure and HttpOnly flags.
  - Protect against CSRF: use CSRF tokens on state-changing endpoints when using cookies.
- Logging & monitoring of auth
  - Log authentication events (login success/failure, token issuances, key rotations) to AuditLog with tenant_id and user_id.
  - Alert on repeated failures and suspicious token usage.

2. Tenant Isolation

Goals
- Prevent any cross-tenant data leakage.
- Ensure logical isolation, with options for stronger physical isolation for high-risk customers.

Design and controls
- Tenant resolution
  - Resolve tenant context server-side from the authenticated principal. Do NOT trust client-supplied tenant identifiers.
  - All inbound requests must pass through middleware that attaches tenant_id to request context and enforces a policy: tenant_id present and principal authorized for that tenant.
- Data access enforcement
  - Centralize tenant scoping in the data access layer / ORM so all queries automatically filter by tenant_id.
  - Consider DB Row-Level Security (RLS) for additional enforcement in Postgres for sensitive deployments.
- Multi-tenant deployment models
  - Default: Shared logical tenancy (single DB with tenant_id scoping) — cost-effective for most customers.
  - Enterprise option: Dedicated schema or dedicated database per tenant for customers requiring strong isolation, data residency, or contractual separation.
  - Document per-tenant isolation model in contracts and for infra provisioning.
- Secrets & configuration
  - Tenant-specific secrets (e.g., DRCT mapping per tenant) stored in secret manager and accessed by backend with tenant-scoped keys.
- Network isolation & infra
  - For enterprise customers requiring network-level separation, support VPC peering or private endpoints and dedicated compute pools.
- Testing & validation
  - Implement automated tests that assert tenant isolation (e.g., tests that attempt cross-tenant reads fail).
  - Periodic access reviews to ensure no code paths bypass tenant scoping.

3. DRCT Token Management

Goals
- Protect DRCT credentials; ensure they are never exposed to frontend or logs.
- Provide operational safety: rotation, expiry, least privilege.

Controls & procedures
- Storage and access
  - Store DRCT bearer tokens (and any provider secrets) in a managed secrets store (e.g., AWS Secrets Manager, GCP Secret Manager, HashiCorp Vault).
  - Backend services access secrets using service identities with least privilege. No other component (widget, portal UI) should have access.
- Usage patterns
  - All DRCT calls must be made server-side by the DRCT adapter. Never return or embed DRCT tokens in API responses or widget code.
  - Add x-correlation-id to each DRCT request and persist mapping in DRCTRequestLog.
- Rotation & lifecycle
  - Support rotation API in the admin console for DRCT tokens and automate rotation where DRCT supports short-lived tokens.
  - Maintain an audit trail of credential creation/rotation and require re-validation on rotation.
  - Implement alerting for repeated 401s from DRCT (possible credential compromise).
- Secrets in memory
  - Use secure in-memory handling for tokens; avoid long-lived in-process caches. Prefer retrieving tokens per-call or short-lived cached tokens with strict TTL.
- Logging
  - Never log full DRCT tokens. If an access token must be recorded for debugging, log only a hashed or masked form and keep it in a secured, access-controlled vault if necessary for forensics.
- Emergency procedures
  - Provide an emergency credential revocation and rotation playbook. In case of suspected leakage, revoke tokens immediately and rotate keys, then notify impacted tenants per policy.

4. PII Handling & Masking

Goals
- Minimize PII retention; encrypt sensitive fields and prevent leakage in logs, metrics and monitoring.
- Support data subject requests and legal retention rules.

Classification and rules
- Data classification
  - Sensitive PII: passport numbers, national ID, full payment card PANs, government-issued IDs.
  - PII: passenger full names, email, phone numbers, addresses.
- Storage rules
  - Encrypt sensitive fields at field-level using KMS-managed keys. For example: passenger.document.number must be encrypted; passenger.name may be stored plainly (but consider masking).
  - Use deterministic hashing (with salt) only for correlation where needed; do not use hashing as the sole protection for sensitive attributes.
  - Avoid storing raw payment PANs. Store PSP tokens or payment references only.
- Masking & logging
  - Apply masking for logs and UIs:
    - Passport: show last 3–4 characters only (e.g., ********A123).
    - Email: j***@example.com or partial masking.
    - Phone: +9715*****567.
  - All log outputs must go through a sanitization layer that removes or masks any PII before emission to log sinks.
  - Metrics and aggregated reports must use anonymized identifiers or bucketed values—never include raw PII.
- Access & decryption
  - Limit decryption privileges to a small set of backend roles/services; require explicit authorization and log every decryption event to AuditLog with actor, reason, tenant_id and timestamp.
- Retention & deletion
  - Default retention: store PII for a minimum necessary period (e.g., until ticketing/regulatory obligations are satisfied). Recommended default: purge/pseudonymize passenger PII 365 days after flight date unless tenant contract specifies otherwise.
  - Provide tenant-scoped export and erase APIs to satisfy GDPR-style requests. Erasures should leave an audit trace and may pseudonymize the record rather than delete if required for regulatory retention.
- Transmission
  - All PII in transit must use TLS 1.2+ with strong ciphers.
  - Never transmit PII to third parties without contract and tenant consent. When sending to DRCT, send only what is necessary; sanitize before logging.

5. Logging & Audit

Goals
- Provide robust, tamper-evident audit trails and operational logs while protecting PII and tenant confidentiality.

Logging tiers
- AuditLog (append-only, high-trust)
  - Records user actions and critical system events: ORDER_CREATED, ORDER_ISSUED, CREDENTIAL_ROTATED, USER_INVITED, CONFIG_UPDATED.
  - Fields: audit_id, tenant_id, user_id, action, timestamp, details_sanitized, ip_masked.
  - Retention: long-term per contract (default 1 year).
  - Access: highly restricted; read operations require RBAC and are audited.
- DRCTRequestLog (append-only)
  - Store sanitized request/response pairs for each DRCT interaction (no unmasked PII).
  - Retention: operational period (e.g., 180 days) or per contract.
- Operational logs
  - Standard service logs for errors, metrics and traces (JSON structured).
  - PII policy: pass logs through sanitization pipeline. If PII is required for debugging, use secured debug dumps with limited retention and access.
- Metrics
  - Collect metrics per tenant: requests/sec, error rates, latency, DRCT 429/401 counts. Ensure metrics are aggregated/anonymized where necessary to avoid exposing PII.

Operational controls
- Correlation & tracing
  - Require X-Correlation-ID on client requests (generate server-side if absent) and propagate to DRCT and downstream services.
  - Use distributed tracing (OpenTelemetry) and ensure traces do not contain raw PII.
- Immutability & tamper-evidence
  - Write AuditLog and DRCTRequestLog to append-only stores (or S3 with write-once lifecycle) to ensure tamper-evidence.
- Access controls
  - Restrict who can query logs; enforce justification and log access attempts.
- Monitoring & alerts
  - Alert on anomalous activity: spikes in failed logins, high-volume data exports, mass deletions, repeated 401s from DRCT, or unusual access to audit/DPR tools.
- Retention & disposal
  - Implement automated retention policies and secure deletion for expired log data.
- Compliance & eDiscovery
  - Provide export mechanisms for AuditLog and tenant data for eDiscovery requests within contractual SLA.

6. Idempotency & Replay Protection

Goals
- Prevent duplicate booking side-effects and mitigate replay attacks on state-changing operations.

Idempotency controls
- Required idempotency
  - For state-changing endpoints that interact with DRCT and create external side effects, require an Idempotency-Key header:
    - POST /public/orders (order creation)
    - POST /public/orders/{orderId}/issue (ticket issuing)
  - Reject requests missing Idempotency-Key with 400 for these endpoints.
- Idempotency record handling
  - Persist IdempotencyRecord with:
    - composite key: hash(tenant_id + operation_type + idempotency_key).
    - stored response snapshot, status, creation and last-used timestamps, and TTL (default 7 days, configurable).
  - Acquire a lock or use transactional guard (SELECT FOR UPDATE or distributed lock) to prevent concurrent duplication.
  - Return stored result for repeated requests with the same key and matching payload; return 409 if payload differs.
- Replay protection for non-idempotent flows
  - Enforce Idempotency-Key uniqueness and TTL windows to bound replay scope.
  - For one-time operations from widget (client-side), consider issuing server-generated request tokens (nonce) during widget initialization: short-lived, single-use tokens signed by backend and validated on submission.
- Timestamp & nonce checks
  - For critical operations, validate a client-supplied timestamp plus nonce and reject requests outside acceptable skew (e.g., > 2 minutes) or re-used nonces.
- Signature-based verification (optional)
  - For higher assurance server-to-server flows, support HMAC signatures of payload + timestamp using per-tenant secret to prevent tampering and replay.
- Auditing
  - All idempotency events (create, reuse, conflict) must be recorded in AuditLog and DRCTRequestLog.

7. Rate Limiting & Abuse Protection

Goals
- Protect the platform and DRCT contracts from abusive or accidental overload.
- Provide fair usage per tenant according to subscribed plan; prevent single tenant from impacting others.

Rate limiting architecture
- Two-layer model (enforced by gateway/middleware)
  - Global (platform) limits: protect platform capacity and DRCT contractual limits.
  - Per-tenant limits: configured by SubscriptionPlan (included_searches_per_month, max_search_rps, concurrent_requests).
- Enforcement mechanisms
  - Token bucket / leaky-bucket algorithm implemented in a distributed store (e.g., Redis) for per-tenant and global buckets.
  - Burst capacity: allow short bursts up to a configured limit but enforce average rate over a window.
  - Queueing & smoothing: when DRCT limits are low, use backend queueing to serialize / coalesce requests and avoid hitting provider RPS. Implement request coalescing for identical search queries within short windows.
- Responses & client behavior
  - On limit exceeded, return 429 Too Many Requests with Retry-After header and a machine-readable error code (AVF_429_RATE_LIMIT).
  - Widget should surface friendly retry guidance and backoff.
- Abuse detection
  - Detect anomalous patterns (sudden spikes in searches, repeated failed auth attempts, automated scraping).
  - Integrate WAF and bot detection for public endpoints and widget endpoints.
  - Apply progressive defenses: rate-limits -> challenge (CAPTCHA) -> IP/tenant throttling -> temporary suspension and alerting.
- Throttle policies
  - Plan-based defaults:
    - Starter: low RPS and strict quotas.
    - Growth: higher RPS, larger quotas.
    - Enterprise: custom RPS and possibly dedicated capacity.
  - Allow emergency throttles for the platform (global kill-switch) to protect DRCT contracts.
- Monitoring & escalation
  - Record per-tenant rate-limit events and alert on sustained throttling.
  - Implement dashboards for top-rate-limited tenants to support sales/ops engagement.
- DRCT-specific protection
  - Respect DRCT stated limits (e.g., offers_search ~1 rps per account). If multiple tenants share the same DRCT account, implement pooling and per-tenant smoothing to respect aggregate limits.
  - If DRCT returns Retry-After on 429, respect the header and backoff. Do not retry immediately.

Operational recommendations & runbooks
- Implement runbooks for:
  - DRCT 401 spike: check credentials, rotate tokens, notify partners.
  - DRCT 429 spike: enable smoothing, contact DRCT to increase quota if required, throttle tenants.
  - Mass export or data exfiltration suspicion: freeze exports, start incident response.
- Regular reviews:
  - Quarterly review of rate-limit thresholds, tenant usage patterns and potential need for plan adjustments.
- Testing
  - Add load tests that include simulated DRCT rate limits and verify queueing/coalescing behavior does not cause provider violations.

Appendices and additional controls

- Secure development lifecycle
  - Integrate SAST, DAST, and dependency vulnerability scanning into CI.
  - Require code reviews for security-sensitive changes (auth, encryption, logging).
- Penetration testing
  - Annual authorized pentest and remediation tracking; retest critical findings.
- Incident response & disclosure
  - Maintain incident response plan with contact lists, tenant notification templates and legal involvement guidance.
- Third-party assessments & compliance
  - Pursue SOC2 / ISO27001 certification path as needed for enterprise customers.
  - Document subprocessors (hosting, logs, third-party monitoring) and ensure contractual data protection.

Summary
The security posture for Aviaframe combines defense-in-depth (auth, tenant isolation, secrets management), operational controls (logging, alerts, runbooks), and provider-aware protections (DRCT token isolation, rate limiting). Implementation must enforce tenant scoping at every layer, encrypt and mask PII, and require idempotency for booking-related flows. Security controls are mandatory for MVP and must be audited and tested continuously as the platform scales.
```