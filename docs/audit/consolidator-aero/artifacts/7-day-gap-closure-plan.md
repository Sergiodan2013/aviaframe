# 7-Day Gap Closure Plan

Goal: move the biggest audit gaps from `missing` to `partial`, and the weakest `partial` items to `defensible partial`, without destabilizing the live product.

## Operating Rules

- No production deployment without a separate safety checkpoint.
- Prefer `evidence-first` and `tests-first` work before behavior changes.
- Do not refactor core booking, payment, or ticketing flows in the same batch as audit-hardening docs.
- Every task must end with one concrete artifact: filled register, approved runbook, test output, scan result, or remediation note.

## Day 1

| Task | Type | Risk to current instance | Effort | Done definition |
|---|---|---|---|---|
| Fill access review log with real systems, roles, and owners | evidence-only | none | 2-3h | `access-review-log.md` updated with named systems and review actions |
| Finalize vendor register and contract/DPA review status | evidence-only | none | 1-2h | `vendor-register.md` updated with real review states |
| Finalize secrets inventory and rotation owners | evidence-only | none | 1-2h | `secrets-inventory.md` updated with owner and rotation notes |

## Day 2

| Task | Type | Risk to current instance | Effort | Done definition |
|---|---|---|---|---|
| Approve incident response runbook | evidence-only | none | 1h | runbook has owner, trigger, escalation, evidence |
| Approve credential rotation runbook | evidence-only | none | 1h | runbook linked from audit pack |
| Approve provider outage runbook | evidence-only | none | 1h | runbook linked from audit pack |
| Approve backup/restore runbook | evidence-only | none | 1h | runbook linked from audit pack |
| Finalize state model note for order/payment/fulfillment | evidence-only | none | 1-2h | documented allowed states and forbidden transitions |

## Day 3

| Task | Type | Risk to current instance | Effort | Done definition |
|---|---|---|---|---|
| Add tenant-isolation tests for orders/documents/admin boundaries | test-only | very low | 4-6h | test file added and local run output captured |
| Update control matrix with test evidence links | evidence-only | none | 30m | control matrix references the new tests |

## Day 4

| Task | Type | Risk to current instance | Effort | Done definition |
|---|---|---|---|---|
| Replace `console.*` in highest-risk backend paths only | low-risk code | low | 4-6h | auth/payments/tamara/webhooks use structured logs |
| Capture sample sanitized logs for audit appendix | evidence-only | none | 1h | appendix updated with log examples or procedure |

## Day 5

| Task | Type | Risk to current instance | Effort | Done definition |
|---|---|---|---|---|
| Upgrade direct dependencies in the first safe batch: `axios`, `uuid` | bounded code | low-medium | 2-4h | build/tests pass, audit report refreshed |
| Refresh vulnerability snapshot | evidence-only | none | 30m | `06_Vulnerability_and_Remediation.md` updated with delta |

## Day 6

| Task | Type | Risk to current instance | Effort | Done definition |
|---|---|---|---|---|
| Upgrade second direct dependency batch: `nodemailer`, `express` | bounded code | medium | 3-5h | build/tests pass, rollback note prepared |
| Prepare async-flow inventory for webhook/payment/ticketing paths | evidence-first tech note | none | 1-2h | list of `setImmediate`/in-process flows documented |

## Day 7

| Task | Type | Risk to current instance | Effort | Done definition |
|---|---|---|---|---|
| Run final mock-audit review of evidence pack | evidence-only | none | 2h | every `partial`/`missing` item has owner/date |
| Decide whether to schedule controlled remediation deploys | decision gate | none until approved | 1h | explicit go/no-go list for deployable items |

## Safe Starting Order

Start here first because it gives the highest audit lift with no runtime risk:

1. access review log
2. vendor register
3. secrets inventory
4. runbooks
5. state model note

Then move to test-only and low-risk code work:

6. tenant-isolation tests
7. critical-path logging cleanup
8. dependency upgrades in small batches

## Do Not Deploy Without Additional Check

The following items require a separate impact review before any deployment:

- dependency upgrades
- auth middleware behavior changes
- payment/ticketing flow changes
- async job-processing changes
- status-transition guards in live business flows
