# 01 Executive System Overview

## Summary

AviaFrame is a multi-tenant B2B SaaS platform for flight search, booking, payment orchestration, ticket issuance, and agency operations. The audit scope covers the actual working system, not only the monorepo:

- `backend/` Node.js + Express API
- `portal/` agency and admin web application
- `widget/` embeddable booking widget
- Supabase for auth, data, storage, and row-level access controls
- DRCT integration for flight workflows
- n8n-based webhook and orchestration paths
- Hosting/runtime surfaces such as Netlify/Railway and connected payment/email providers

## Scope In / Scope Out

| Scope item | Status | Notes |
|---|---|---|
| Backend API and business workflows | `ready` | Core audit scope |
| Widget public flows | `ready` | Customer-facing scope |
| Portal admin and agency flows | `ready` | Staff and tenant operations scope |
| Supabase auth/data/storage | `ready` | Security and privacy critical |
| DRCT adapter and outbound provider calls | `ready` | Reliability and secrets scope |
| n8n orchestration | `ready` | Operational and webhook scope |
| Formal ISO/SOC certification evidence | `missing` | Not the current audit target |
| Full IaC estate | `partial` | `infra/` is placeholder-only today |

## Current System Maturity Statement

The repository shows good product and technical documentation maturity, but operational proof is behind architecture intent. The dominant audit risk is not absence of design; it is the gap between documented controls and verified evidence in production-like conditions.

## Key Strengths

- Strong baseline documentation across architecture, API, security, observability, readiness, and platform audit topics
- Clear separation of backend, portal, widget, and external provider responsibilities
- Existing security intent around tenant isolation, idempotency, PII handling, and DRCT token isolation
- Existing production-readiness and platform-audit notes that already identify several high-risk gaps

## Key Open Risks

- Internal operational surfaces were insufficiently protected until the current remediation pass
- Critical payment and fulfillment flows still rely on process-local async execution
- Status models and orchestration semantics are not fully unified across order, payment, and ticket issuance
- Dependency vulnerability backlog is currently material
- Evidence for backup/restore, access reviews, and tenant isolation proof is incomplete

## Primary Source Documents

- [../../ARCHITECTURE.md](../../ARCHITECTURE.md)
- [../../08_SECURITY.md](../../08_SECURITY.md)
- [../../PLATFORM_AUDIT_2026-05-21.md](../../PLATFORM_AUDIT_2026-05-21.md)
- [../../PROD_READINESS_AND_EMAIL_SERVICE_AUDIT_2026-02-23.md](../../PROD_READINESS_AND_EMAIL_SERVICE_AUDIT_2026-02-23.md)
- [artifacts/system-inventory.md](artifacts/system-inventory.md)
- [artifacts/raci-matrix.md](artifacts/raci-matrix.md)
