# Incident Response Runbook

Owner: Ops  
Backup owner: Engineering lead  
Status: draft for approval

## Trigger

- booking flow unavailable
- payment callback failures
- ticket issuance failures
- widespread admin/login access issue
- suspected security incident

## Severity

- `SEV-1`: customer bookings/payments/ticketing materially unavailable or security compromise suspected
- `SEV-2`: important degradation with workaround
- `SEV-3`: limited functional issue, low customer impact

## Steps

1. Confirm scope: affected surface, tenant(s), provider(s), and time window.
2. Assign incident owner and capture first timestamp.
3. Freeze unrelated production changes until impact is understood.
4. Check health endpoints, provider status, recent deploys, and logs.
5. Decide: rollback, isolate, degrade gracefully, or continue investigation.
6. Notify internal owners and, if required, affected customers.
7. Record root cause, workaround, and resolution time.
8. Schedule postmortem for `SEV-1` and `SEV-2`.

## Evidence Produced

- incident timeline
- impacted systems list
- owner and responders
- customer communication copy
- resolution and follow-up actions
