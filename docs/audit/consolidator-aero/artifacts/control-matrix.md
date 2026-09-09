# Control Matrix

| Control name | Expected evidence | Status | Owner | Artifact | Remediation date |
|---|---|---|---|---|---|
| Internal observability endpoints protected | Authenticated `/metrics` and deep health proof | `partial` | Engineering | code + tests | 2026-06-06 |
| Tenant isolation enforced | RLS proof, API tests, access review | `partial` | Engineering | security docs + [backend/tests/security/tenant-boundaries.test.js](/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation%20(2)/backend/tests/security/tenant-boundaries.test.js:1) | 2026-06-13 |
| DRCT credentials isolated from frontend | Secrets inventory and architecture proof | `partial` | Engineering | architecture + secrets inventory | 2026-06-10 |
| PII masked in logs | Logging review and sample logs | `partial` | Engineering | security docs | 2026-06-17 |
| Replay-safe state changes | Idempotency tests and endpoint policy | `partial` | Engineering | [backend/tests/security/idempotency-controls.test.js](/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation%20(2)/backend/tests/security/idempotency-controls.test.js:1) + API spec | 2026-06-13 |
| Webhook authentication and duplicate-event handling | Secret/signature validation and duplicate-event proof | `partial` | Engineering | [backend/tests/security/webhook-security.test.js](/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation%20(2)/backend/tests/security/webhook-security.test.js:1) + [backend/tests/security/payment-webhook-controls.test.js](/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation%20(2)/backend/tests/security/payment-webhook-controls.test.js:1) | 2026-06-13 |
| Vulnerability management process | Scan report and remediation tracker | `partial` | Engineering | vulnerability report | 2026-06-10 |
| Backup and restore validated | Restore drill output | `missing` | Ops | external evidence | 2026-06-20 |
| Access reviews performed | Signed access review log | `missing` | Ops | access review log | 2026-06-14 |
| Incident response defined | Incident SOP and escalation tree | `partial` | Ops | runbook doc | 2026-06-12 |
| Vendor register maintained | Subprocessor list and contract status | `partial` | Compliance | vendor register | 2026-06-12 |
