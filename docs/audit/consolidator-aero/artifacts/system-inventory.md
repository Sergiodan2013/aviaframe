# System Inventory

| System / component | Purpose | Data sensitivity | Primary owner | Notes |
|---|---|---|---|---|
| `backend/` | API, authz, provider orchestration, documents | High | Engineering | Core trust boundary |
| `portal/` | Admin and agency UI | Medium | Engineering/Product | Tenant and ops workflows |
| `widget/` | Customer booking frontend | High | Engineering/Product | Public embed surface |
| Supabase | Auth, DB, storage, RLS | High | Engineering/Ops | Security-critical dependency |
| DRCT | Flight search and issuance provider | High | Engineering/Ops | External transactional dependency |
| n8n | Workflow orchestration and webhooks | High | Engineering/Ops | Reliability-sensitive |
| Tamara / payment providers | Payment and installment flows | High | Engineering/Ops | Regulated and customer-impacting |
| Email provider / SMTP | Ticket and notification delivery | Medium | Engineering/Ops | Customer communication path |
| Netlify / Railway / hosting | Runtime and website delivery | High | Ops | Needs access review and secrets hygiene |
