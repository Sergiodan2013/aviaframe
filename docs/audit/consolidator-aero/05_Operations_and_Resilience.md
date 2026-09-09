# 05 Operations and Resilience

## Summary

Operational readiness is the area where AviaFrame has the largest gap between design and auditable proof. Documentation exists, but restore drills, durable queueing, environment reproducibility, and signed operational checklists need strengthening.

## Current Posture

| Topic | Status | Notes |
|---|---|---|
| Health checks | `partial` | `/healthz` exists and deep health exists; internal guard added during this pass |
| Metrics and observability | `partial` | Prometheus metrics and pino exist; coverage and alert evidence need expansion |
| Environment separation | `partial` | Staging docs exist, but infra codification is incomplete |
| Backup and restore | `missing` | No restore evidence collected in repo |
| Incident response | `partial` | Runbook structure created in this pack; drill evidence still needed |
| DR/BCP | `partial` | Risks and degraded modes known; formal BCP summary created here |
| Async durability | `missing` | Critical payment and webhook orchestration still process-local |

## Immediate Priorities

1. Capture current dashboard and alert evidence.
2. Document restore procedure and run a restore test.
3. Move critical fulfillment and payment follow-up off `setImmediate` into a durable job path.
4. Finalize on-call ownership and escalation tree.

## Evidence Links

- [artifacts/production-readiness-checklist.md](artifacts/production-readiness-checklist.md)
- [07_Policies_and_Runbooks.md](07_Policies_and_Runbooks.md)
- [06_Vulnerability_and_Remediation.md](06_Vulnerability_and_Remediation.md)
