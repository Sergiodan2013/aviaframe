# 02 Architecture and Data Flows

## Summary

AviaFrame follows a multi-tenant SaaS model where the backend is the only component allowed to call DRCT and other privileged providers directly. The widget and portal act as clients of the backend. Supabase is the system of record for auth, tenant-linked data, and file metadata.

## High-Level Flows

1. Widget or portal sends request to backend.
2. Backend resolves tenant and authorization context.
3. Backend calls DRCT, payment provider, email service, or n8n where required.
4. Backend records business data, sanitized logs, and document metadata in Supabase.
5. Ticket PDFs and invoices are stored via Supabase storage and served through signed URLs.

## Data Categories

| Category | Examples | Systems | Status |
|---|---|---|---|
| Tenant metadata | agency profile, config, domains, commission settings | Supabase, portal, backend | `ready` |
| Authentication data | Supabase auth user, profile, role, agency_id | Supabase, backend | `partial` |
| Booking data | order, route, fare, price, payment state | Supabase, backend, DRCT | `ready` |
| Passenger PII | names, email, phone, passport-related fields | Supabase, backend, DRCT, PDF/email | `partial` |
| Payment references | provider ids, payment status, refund/cancel refs | Supabase, payment providers | `partial` |
| Documents | ticket PDFs, invoices, signed URLs | Supabase storage, backend, email | `partial` |
| Audit/operational data | logs, webhook events, provider operation logs | backend, Supabase, monitoring | `partial` |

## Architecture Observations Relevant to Audit

- Backend-centric provider isolation is the right security pattern and aligns with the current design intent.
- Supabase is a security-critical dependency because it covers auth, storage, and tenant data.
- Some orchestration paths still execute inside request-serving processes via `setImmediate`, which weakens reliability and replay safety.
- `infra/` is still a placeholder, so infrastructure reproducibility and environment hardening proof must come from runtime configuration and external platform records rather than repository IaC.

## Evidence Links

- [artifacts/system-inventory.md](artifacts/system-inventory.md)
- [artifacts/external-surface-inventory.md](artifacts/external-surface-inventory.md)
- [artifacts/retention-schedule.md](artifacts/retention-schedule.md)
