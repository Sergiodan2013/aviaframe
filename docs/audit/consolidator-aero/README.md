# Consolidator Aero Audit Pack

Date: 2026-06-02  
System: AviaFrame  
Prepared for: Consolidator Aero  
Audit type: vendor / solution due diligence

This folder is the working `evidence pack` for the upcoming audit. It maps the real AviaFrame implementation and documentation to four review streams:

1. IT maturity and governance
2. Security and vulnerability management
3. Compliance, privacy, and contractual readiness
4. Operational readiness and resilience

## Recommended Review Order

1. [01_Executive_System_Overview.md](01_Executive_System_Overview.md)
2. [02_Architecture_and_Data_Flows.md](02_Architecture_and_Data_Flows.md)
3. [artifacts/current-audit-readiness.md](artifacts/current-audit-readiness.md)
4. [artifacts/control-matrix.md](artifacts/control-matrix.md)
5. [03_Security_Controls.md](03_Security_Controls.md)
6. [05_Operations_and_Resilience.md](05_Operations_and_Resilience.md)
7. [06_Vulnerability_and_Remediation.md](06_Vulnerability_and_Remediation.md)

## Pack Index

1. [01_Executive_System_Overview.md](01_Executive_System_Overview.md)
2. [02_Architecture_and_Data_Flows.md](02_Architecture_and_Data_Flows.md)
3. [03_Security_Controls.md](03_Security_Controls.md)
4. [04_Compliance_and_Privacy.md](04_Compliance_and_Privacy.md)
5. [05_Operations_and_Resilience.md](05_Operations_and_Resilience.md)
6. [06_Vulnerability_and_Remediation.md](06_Vulnerability_and_Remediation.md)
7. [07_Policies_and_Runbooks.md](07_Policies_and_Runbooks.md)
8. [08_Evidence_Appendix.md](08_Evidence_Appendix.md)

## Supporting Artifacts

- [artifacts/control-matrix.md](artifacts/control-matrix.md)
- [artifacts/current-audit-readiness.md](artifacts/current-audit-readiness.md)
- [artifacts/logging-and-secrets-exposure-review.md](artifacts/logging-and-secrets-exposure-review.md)
- [artifacts/public-endpoints-and-pii-map.md](artifacts/public-endpoints-and-pii-map.md)
- [artifacts/async-flow-inventory.md](artifacts/async-flow-inventory.md)
- [artifacts/system-inventory.md](artifacts/system-inventory.md)
- [artifacts/raci-matrix.md](artifacts/raci-matrix.md)
- [artifacts/risk-register.md](artifacts/risk-register.md)
- [artifacts/access-review-log.md](artifacts/access-review-log.md)
- [artifacts/vendor-register.md](artifacts/vendor-register.md)
- [artifacts/secrets-inventory.md](artifacts/secrets-inventory.md)
- [artifacts/external-surface-inventory.md](artifacts/external-surface-inventory.md)
- [artifacts/retention-schedule.md](artifacts/retention-schedule.md)
- [artifacts/production-readiness-checklist.md](artifacts/production-readiness-checklist.md)

## Repository Entry Points

Use these files if the auditor or reviewer wants to inspect the implementation behind the documents:

| Area | Main files |
|---|---|
| Public search and autocomplete | [../../../backend/src/routes/public.js](../../../backend/src/routes/public.js), [../../../backend/src/services/airportAutocompleteService.js](../../../backend/src/services/airportAutocompleteService.js) |
| Authentication and tenant controls | [../../../backend/src/middleware/auth.js](../../../backend/src/middleware/auth.js), [../../../backend/src/middleware/multi-tenant-hardening.js](../../../backend/src/middleware/multi-tenant-hardening.js) |
| Operational surfaces | [../../../backend/src/routes/health.js](../../../backend/src/routes/health.js), [../../../backend/src/lib/metrics.js](../../../backend/src/lib/metrics.js) |
| Order and fulfillment logic | [../../../backend/src/services/orderService.js](../../../backend/src/services/orderService.js), [../../../backend/src/routes/orders.js](../../../backend/src/routes/orders.js) |
| Customer-facing widget | [../../../widget/src/widget.js](../../../widget/src/widget.js) |
| Portal application | [../../../portal/client/src/App.jsx](../../../portal/client/src/App.jsx) |

## Current Readiness Snapshot

| Area | Status | Notes |
|---|---|---|
| Product and architecture documentation | `ready` | Strong base already exists in `docs/`, `ARCHITECTURE.md`, API and security specs |
| Evidence layer for external audit | `partial` | This pack establishes the structure, but many items still need owner sign-off and screenshots/export evidence |
| Internal observability endpoint protection | `partial` | `/metrics` and `/healthz/deep` were guarded in code on 2026-06-02; deployment verification still needed |
| Dependency vulnerability posture | `missing` | `npm audit` reports high and moderate issues; remediation sprint required |
| Tenant isolation proof | `partial` | Documented in design, but automated proof remains limited |
| Operational runbooks and restore evidence | `partial` | Some readiness docs exist; restore drill evidence is not yet collected |

## Working Rules

- Use `ready / partial / missing` as the only status values.
- Every open control must have an owner and remediation date.
- Evidence should prefer concrete artifacts: screenshots, exports, logs, test results, policies, and signed checklists.
- This folder is the auditor-facing index; detailed engineering documents may live elsewhere and be linked from here.
