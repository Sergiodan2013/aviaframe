# 07 Policies and Runbooks

## Summary

This section centralizes the operational and governance procedures the auditor is likely to ask for. Some policies already exist implicitly across the repo; this file consolidates the minimum runbook set and indicates what still needs approval or execution evidence.

## Required Policy Set

| Policy / runbook | Status | Notes |
|---|---|---|
| Change and release management SOP | `partial` | Drafted in appendix artifacts; owner sign-off pending |
| Access review and offboarding | `partial` | Log template added; real review record still needed |
| Secrets rotation | `partial` | Inventory created; execution evidence not attached |
| Incident response | `partial` | Severity and escalation model defined at draft level |
| Backup and restore | `missing` | Restore evidence not yet attached |
| Provider outage and degraded mode | `partial` | Known for DRCT/Tamara/email, but formal runbook needs sign-off |
| DSAR export/delete/correct | `missing` | Needs tested procedure |
| Manual issue/cancel/refund handling | `partial` | Process exists in product behavior, but not fully documented as controlled ops |

## Minimum Operating Procedures

### Change and release

- Every production-affecting change must have reviewer approval, deployment record, and rollback note.
- Hotfixes must be back-linked to a tracked incident or production defect.

### Access review

- Review production and staging access monthly.
- Record owner, reviewer, system, role, and any revoked access.

### Secrets rotation

- Rotate provider and service tokens on schedule or immediately after suspected exposure.
- Record the date, owner, validation result, and impacted environments.

### Incident response

- Severity model: `SEV-1`, `SEV-2`, `SEV-3`.
- Record detection time, owner, customer impact, comms path, workaround, resolution, and postmortem date.

## Evidence Links

- [artifacts/access-review-log.md](artifacts/access-review-log.md)
- [artifacts/secrets-inventory.md](artifacts/secrets-inventory.md)
- [artifacts/production-readiness-checklist.md](artifacts/production-readiness-checklist.md)
- [artifacts/deployment-safety-gate.md](artifacts/deployment-safety-gate.md)
- [runbooks/incident-response.md](runbooks/incident-response.md)
- [runbooks/credential-rotation.md](runbooks/credential-rotation.md)
- [runbooks/provider-outage.md](runbooks/provider-outage.md)
- [runbooks/backup-restore.md](runbooks/backup-restore.md)
