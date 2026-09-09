# Production Readiness Checklist

| Check | Status | Owner | Evidence |
|---|---|---|---|
| Staging and production environments separated | `partial` | Ops | staging setup docs |
| Internal endpoints protected | `partial` | Engineering | code + tests + deploy verification |
| Structured logging enabled | `partial` | Engineering | pino in backend |
| Metrics available to monitoring only | `partial` | Engineering/Ops | code + deploy verification |
| Alert rules defined | `missing` | Ops | dashboard export required |
| Backup schedule documented | `missing` | Ops | external evidence required |
| Restore drill executed | `missing` | Ops | drill output required |
| Provider outage runbook prepared | `partial` | Ops | audit pack runbook section |
| Payment/ticketing async durability | `missing` | Engineering | queue/worker implementation required |
| Support escalation and complaint SLA defined | `partial` | Support / Product | legal + support docs |
