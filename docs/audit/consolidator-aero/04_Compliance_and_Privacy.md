# 04 Compliance and Privacy

## Summary

AviaFrame processes booking and passenger data that is sensitive enough to require explicit retention, access, disclosure, and deletion handling. The repository already contains legal pages and security requirements, but the audit must see operational ownership and evidence.

## Current Posture

| Topic | Status | Notes |
|---|---|---|
| Privacy/security design intent | `ready` | Security doc already describes PII classes, masking, and retention intent |
| Data inventory | `partial` | Built in this pack, but needs business/legal review |
| Retention/deletion schedule | `partial` | Drafted in this pack; execution proof still needed |
| DSAR readiness | `missing` | Runbook and tested evidence are not yet present in repo |
| Subprocessor register | `partial` | Draft inventory created; contract/DPA attachments still needed |
| Audit trail sufficiency | `partial` | Logging and webhook persistence exist, but coverage is uneven |
| Customer-facing legal disclosures | `ready` | Legal pages exist in site and portal public assets |

## Required Audit Evidence

- Approved data inventory and classification register
- Retention schedule with owner
- DSAR runbook and test record
- Vendor/subprocessor register with contract status
- Breach/incident communication decision tree
- Evidence that exports, deletions, or pseudonymization can be executed per policy

## Evidence Links

- [artifacts/retention-schedule.md](artifacts/retention-schedule.md)
- [artifacts/vendor-register.md](artifacts/vendor-register.md)
- [07_Policies_and_Runbooks.md](07_Policies_and_Runbooks.md)
