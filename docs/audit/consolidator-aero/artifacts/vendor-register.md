# Vendor and Subprocessor Register

Repository-based working version prepared on `2026-06-02`.
This table captures what is demonstrably in use or explicitly referenced in the codebase and legal/docs set.

| Vendor | Purpose | Data classes | Contract / DPA status | Owner | Status |
|---|---|---|---|---|---|
| Supabase | Auth, DB, storage, RLS, signed document URLs | Tenant, booking, passenger, document metadata, auth profiles | needs contract/DPA confirmation | Ops / Compliance | `partial` |
| DRCT | Flight search, pricing, order create, issue, cancel | Booking and passenger travel data | needs contract/DPA confirmation | Ops / Compliance | `partial` |
| n8n | Workflow orchestration and webhook fan-out | Booking payloads, operational workflow data | needs contract/DPA confirmation | Ops | `partial` |
| Netlify | Public marketing site, legal pages, static delivery | Public site content, limited contact/config metadata | needs contract confirmation | Ops | `partial` |
| Railway | Backend runtime hosting and env configuration | Application secrets, logs, runtime environment | needs contract confirmation | Ops | `partial` |
| Tamara | BNPL / installment payment workflows | Payment references, order metadata, customer payment journey data | needs contract/DPA confirmation | Ops / Compliance | `partial` |
| Moyasar | Card payment processing / hosted payment form | Payment transaction data, order/payment references | needs contract/DPA confirmation | Ops / Compliance | `partial` |
| Email provider / SMTP | Ticket delivery and notifications | Contact data, document attachments, notification metadata | needs provider and DPA confirmation | Ops / Compliance | `partial` |
| GoDaddy / DNS provider | DNS and subdomain management for agency provisioning | Domain and routing configuration metadata | needs contract confirmation | Ops | `partial` |

## Manual Confirmation Still Needed

- Confirm which vendors are live in production vs only supported in code.
- Attach contract owner and renewal date.
- Mark whether a DPA exists, is pending, or is not required.
- Confirm data residency / transfer implications for each vendor.
