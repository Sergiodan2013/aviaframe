# 03 Security Controls

## Summary

Security intent is well-documented in the codebase, but the audit outcome will depend on proving which controls are active now. This section tracks implemented controls, known gaps, and immediate remediation.

## Control Snapshot

| Control area | Status | Current position |
|---|---|---|
| AuthN/AuthZ design | `partial` | Roles and auth context exist, but request-time profile creation remains a maturity and audit concern |
| Tenant isolation | `partial` | Design intent and RLS migrations exist; route-level tests now cover order, document, and admin access paths, but DB-level proof still needs explicit RLS verification |
| Secrets management | `partial` | Secrets are env-based in code; inventory and rotation proof need to be maintained outside code |
| Internal endpoint protection | `partial` | `/metrics` and `/healthz/deep` were guarded in code on 2026-06-02; deploy verification pending |
| PII-safe logging | `partial` | Structured logging exists, but `console.*` usage is still widespread |
| Idempotency and replay control | `partial` | Key route-level and provider-event protections now have executable tests, but production-path coverage is still incomplete |
| Webhook security | `partial` | Secret/token validation and duplicate-event short-circuit now have executable tests for email, Tamara, and Moyasar paths, but durable async processing is not yet in place |
| Vulnerability management | `missing` | No closed-loop remediation evidence yet; audit results show outstanding dependency risk |

## Implemented During This Pass

- Protected `GET /metrics` with `x-internal-token`.
- Protected `GET /healthz/deep` with `x-internal-token`.
- Added test coverage for internal-surface protection.
- Added tenant-boundary security tests covering cross-agency order access, document download isolation, and admin route restrictions.
- Added idempotency and replay-control tests for critical order operations and Tamara provider-event deduplication.
- Added webhook security tests for email webhook secret validation and Tamara invalid/duplicate event handling.
- Added Moyasar webhook tests for invalid signature rejection and already-paid duplicate skip behavior.
- Added production-safe guard to prevent PDF-only ticket issuance unless explicitly enabled via `ALLOW_PDF_ONLY_TICKET_ISSUANCE=true`.
- Removed duplicate plain-text request access logging from `backend/src/app.js` to reduce drift from structured logging.

## High-Priority Open Security Gaps

1. Dependency vulnerability backlog is material.
2. Process-local async orchestration remains in payment and webhook flows.
3. Request-time profile creation in auth middleware is still a side-effectful pattern.
4. Console logging still appears in many provider, route, and orchestration paths.
5. Tenant isolation still needs DB-level RLS verification evidence in addition to the new route-level tests.

## Evidence Links

- [artifacts/control-matrix.md](artifacts/control-matrix.md)
- [artifacts/external-surface-inventory.md](artifacts/external-surface-inventory.md)
- [artifacts/secrets-inventory.md](artifacts/secrets-inventory.md)
- [backend/tests/security/tenant-boundaries.test.js](/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation%20(2)/backend/tests/security/tenant-boundaries.test.js:1)
- [backend/tests/security/idempotency-controls.test.js](/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation%20(2)/backend/tests/security/idempotency-controls.test.js:1)
- [backend/tests/security/webhook-security.test.js](/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation%20(2)/backend/tests/security/webhook-security.test.js:1)
- [backend/tests/security/payment-webhook-controls.test.js](/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation%20(2)/backend/tests/security/payment-webhook-controls.test.js:1)
- [06_Vulnerability_and_Remediation.md](06_Vulnerability_and_Remediation.md)
