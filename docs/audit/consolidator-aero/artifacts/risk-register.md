# Risk Register

| Risk | Severity | Owner | Mitigation | Due date |
|---|---|---|---|---|
| Public exposure of operational endpoints | High | Engineering | Internal token guards, ingress restriction, deploy verification | 2026-06-06 |
| False-positive ticket issuance without DRCT | Critical | Engineering | Disable PDF-only issuance in production, test sandbox override only | 2026-06-06 |
| Process-local async payment fulfillment | High | Engineering | Durable queue / worker model | 2026-06-20 |
| Request-time profile creation mutates auth state | Medium | Engineering | Dedicated provisioning flow | 2026-06-20 |
| Dependency vulnerabilities in direct packages | High | Engineering | Upgrade and retest `axios`, `nodemailer`, `express`, `uuid` | 2026-06-10 |
| Incomplete proof of tenant isolation | High | Engineering | Add executable tests and access boundary review | 2026-06-13 |
| PII leakage through legacy logs | Medium | Engineering | Migrate remaining `console.*` usage to structured logging | 2026-06-17 |
| Missing restore drill evidence | High | Ops | Execute and capture backup restore drill | 2026-06-20 |
| Incomplete vendor / DPA inventory | Medium | Compliance | Complete register and attach contract status | 2026-06-12 |
| Undefined signed operational ownership | Medium | Ops | Finalize owners for on-call, incidents, support, and compliance | 2026-06-12 |
