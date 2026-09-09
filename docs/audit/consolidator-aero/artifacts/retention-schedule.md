# Retention Schedule

| Data set | Proposed retention | Action after retention | Owner | Status |
|---|---|---|---|---|
| Orders and booking records | per contractual / regulatory need | archive or pseudonymize | Product / Compliance | `partial` |
| Passenger PII | minimum necessary, target 365 days after travel unless required otherwise | pseudonymize or delete | Compliance | `partial` |
| Audit logs | 1 year minimum | secure archive or delete per contract | Ops / Compliance | `partial` |
| DRCT request logs | 180 days target | secure delete | Ops | `partial` |
| Notification and email events | operational need | secure delete | Ops | `partial` |
| Backups | per backup policy | expiry and secure destruction | Ops | `missing` |
| Signed documents | per customer and regulatory need | archive or delete | Product / Compliance | `partial` |
