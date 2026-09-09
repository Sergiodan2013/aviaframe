# Secrets Inventory and Rotation Policy

Repository-based baseline prepared on `2026-06-02`.
This inventory covers secrets clearly referenced in code or setup docs. It is not a substitute for exporting the live environment secret list from hosting/provider consoles.

| Secret / credential | Used by | Storage mode | Rotation owner | Status |
|---|---|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | backend | environment secret | Ops | `partial` |
| `SUPABASE_ANON_KEY` | widget / portal / backend public-key paths | environment or public config | Ops | `partial` |
| `SUPABASE_URL` | backend and clients | environment config | Ops | `partial` |
| DRCT credentials / bearer token | backend DRCT adapter | environment secret, target state should be managed secret store | Ops | `partial` |
| `INTERNAL_API_TOKEN` | backend internal endpoints like `/metrics` and `/healthz/deep` | environment secret | Ops | `partial` |
| `EMAIL_WEBHOOK_SECRET` | backend webhook validation | environment secret | Ops | `partial` |
| Tamara credentials / webhook token | backend payment integration | environment secret | Ops | `partial` |
| Moyasar credentials / webhook signature secret | backend payment integration | environment secret | Ops | `partial` |
| `SMTP_*` / email provider credentials | backend email delivery | environment secret | Ops | `partial` |
| `N8N_WEBHOOK_URL` and related integration config | backend to n8n routing | environment config | Ops | `partial` |
| `ADMIN_ALERT_EMAIL` / support mailbox routing | operational alerting | environment config | Ops | `partial` |
| DNS provider API credentials | agency/domain provisioning automation | environment secret | Ops | `partial` |

## Rotation Policy

- Rotate immediately after suspected exposure.
- Rotate on scheduled cadence agreed by Ops and Compliance.
- Record owner, date, environment, validation result, and rollback plan.
- Never expose clear-text secrets in docs, screenshots, logs, or tickets.

## Manual Confirmation Still Needed

- Export current secret names from Railway/Netlify/other runtime environments.
- Confirm which secrets are shared between staging and production and split them if needed.
- Confirm last rotation date for provider-facing secrets.
- Confirm whether any secret is still stored only in a local CLI profile or developer machine.
