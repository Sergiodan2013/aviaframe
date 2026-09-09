# External Surface Inventory

| Surface | Exposure | Intended audience | Protection status | Notes |
|---|---|---|---|---|
| `/public/*` | Public | widget/partner calls | `partial` | Needs per-endpoint review and rate limiting proof |
| Widget embeds and preview pages | Public | customers/agencies | `partial` | Public booking UX surface |
| Portal routes | Authenticated | admins/agents | `partial` | Requires auth and tenant checks |
| `/api/payments/tamara/webhook` | Public | provider webhook | `partial` | Token validation exists; durable processing missing |
| `/webhook/*` n8n proxy | Public/internal mixed | internal integrations | `partial` | Review intended public exposure carefully |
| `/metrics` | Internal only | monitoring | `partial` | Guard added on 2026-06-02 |
| `/healthz` | Public/basic | load balancer | `ready` | Safe shallow health |
| `/healthz/deep` | Internal only | ops/monitoring | `partial` | Guard added on 2026-06-02 |
