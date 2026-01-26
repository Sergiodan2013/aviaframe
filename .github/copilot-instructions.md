# Aviaframe — Copilot / AI-assisted Development Instructions (Binding)

Version: 1.0  
Date: 2026-01-26  
Author: Platform / Security

Purpose
-------
These instructions are binding rules for any AI-assisted code generation (Copilot, Copilot X, ChatGPT or other automated code tools) and for engineers using those tools in the Aviaframe codebase. They exist to protect security, privacy, tenant isolation, and platform correctness. Treat this file as policy — automated agents and humans must follow it.

Scope
-----
Applies to:
- Any generated or suggested code, configuration, documentation or templates produced by AI tools.
- All engineers, contractors and automation that author changes in this repository.

Core binding rules
------------------

1. Docs under /docs are the source of truth
   - The content in /docs/ is authoritative for product behavior, API contracts, security, integration rules and runbooks.
   - Any change to behavior, API surface, integration patterns or security controls MUST be reflected in /docs before or at the same PR that changes implementation.
   - Automated code generation MUST consult /docs first and incorporate guidance from these documents.

2. Never expose DRCT bearer tokens to frontend
   - DRCT bearer tokens and any provider secrets MUST NOT be embedded in any client-side code, widget, browser payload, or public configuration.
   - AI-generated code MUST NOT create code paths that return DRCT tokens in API responses, logs, or stack traces.
   - Any reference to DRCT credentials in generated code must use secrets manager references (not inline values) and be accessible only to backend services.

3. All backend data access must be tenant-scoped
   - Every backend data access layer, query, service method and API handler that touches tenant data MUST require explicit tenant context (tenant_id) derived from authentication.
   - AI-generated code MUST add middleware-level tenant resolution and guard checks. Do not rely on caller-supplied tenant identifiers without server-side authorization.
   - Centralize tenant scoping at DAO/ORM levels where possible to avoid accidental cross-tenant leaks.

4. Mask PII in logs and responses
   - Production logs, DRCTRequestLog, AuditLog and any emitted metrics or traces MUST NOT contain unmasked PII (passport numbers, full emails, phone numbers, payment PANs, national IDs).
   - AI-generated logging statements MUST use masking helpers (e.g., maskEmail, maskPassport) or structured fields that are sanitized before emission.
   - API responses that echo PII to clients MUST only include masked or minimal required fields unless the client and tenant contract explicitly permits full values.

5. Use idempotency keys for order creation and issuing
   - Calls that create bookings or issue tickets (POST /public/orders and POST /public/orders/{orderId}/issue) MUST require and respect an Idempotency-Key.
   - AI-generated server code MUST persist idempotency records atomically and return the original response for duplicate keys.
   - Do not perform non-idempotent provider calls without first creating an idempotency guard/record.

6. Respect DRCT rate limits
   - The DRCT adapter MUST enforce provider and aggregate rate limits (example baseline: offers_search = 1 rps). Do not exceed provider quotas.
   - AI-generated code MUST include rate-limit checks, request coalescing, caching where allowed, and backoff logic that honors DRCT Retry-After headers.
   - Under saturation, surface 429 to clients with Retry-After and avoid aggressive client-side retries.

7. Prefer clarity over clever abstractions
   - Generated code should favor clear, maintainable implementations over clever one-liners or hacky abstractions.
   - Explicit, well-named functions and comments are preferred to dense, obfuscated code even if longer.
   - When proposing abstraction, include straightforward examples and unit tests demonstrating behavior.

Additional CI / QA rules for AI-generated changes
-------------------------------------------------
- Generated code MUST pass existing linters (ESLint) and unit tests (Jest) before merge.
- Every behavioral change must include or update unit tests and integration tests (especially for idempotency, tenant scoping, and DRCT adapter behaviors).
- PRs containing AI-generated code MUST include a short summary of which Copilot/AI prompts or templates were used and a human reviewer MUST validate security-critical sections (auth, secrets, PII, idempotency, rate-limiting).

Security & secrets handling rules
---------------------------------
- All secrets (DRCT tokens, DB credentials, API keys) MUST be referenced via environment variables and stored in a secrets manager. Never commit secrets.
- Generated config examples must use placeholders (e.g., ${DRCT_TOKEN}) and documentation must instruct using secrets manager.
- Any tooling that prints example tokens in logs or test outputs must be sanitized before commit.

Documentation obligations
-------------------------
- When AI suggests changes to behavior or API, update the corresponding docs in /docs (BRD, PRD, SRS, API_SPEC, DRCT_INTEGRATION, SECURITY) as part of the same change.
- Document any deviation from /docs in the PR description and seek Product or Security approval prior to merging.

Examples and prohibited patterns
--------------------------------
- PROHIBITED: Returning DRCT token in JSON response from any endpoint.
- PROHIBITED: Logging full passenger passport number without masking.
- PROHIBITED: Building SQL queries by concatenating client-supplied tenant_id strings.
- ALLOWED: Using tenant_id resolved from validated JWT in database queries with parameterized queries or ORM filter methods.
- ALLOWED: Persisting idempotency records and returning stored result for duplicate idempotency keys.

Enforcement & review
--------------------
- Security and Platform teams will review AI-generated code in critical areas (DRCT adapter, authentication, logging, idempotency) before merge.
- Violations discovered in code scanners, tests, or reviews must be remediated immediately and recorded in the incident log if they involve secrets or PII exposure.
- Repeated non-compliance may result in escalation and temporary disablement of AI-assisted suggestions in CI.

How to propose changes to these instructions
--------------------------------------------
- These instructions are binding. To propose a change:
  1. Create a PR that updates this file and update the relevant /docs files to reflect the new behavior.
  2. Tag @platform, @security and include rationale and migration plan.
  3. Do not implement behavior contrary to the current file until the PR is approved.

Contact & escalation
--------------------
- Security: security@aviaframe.example (internal)
- Platform: infra@aviaframe.example (internal)
- For suspected secret leakage: follow the emergency credential rotation runbook in docs/08_SECURITY.md and notify on-call SRE.

Acknowledgement
---------------
By committing code or using AI-assisted generation in this repository you acknowledge and accept these binding instructions and agree to follow them in full.
