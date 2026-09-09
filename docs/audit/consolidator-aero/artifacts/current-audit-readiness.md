# Current Audit Readiness

Date: 2026-06-02  
System: AviaFrame  
Prepared for: Consolidator Aero

## Purpose

This note is the current-state summary for the audit pack. It shows what AviaFrame can already defend today, what is only partially ready, and what still requires remediation or external evidence.

Use this document as the opening status page before walking through the detailed sections.

## Status Legend

- `ready`: evidence exists now and can be shown to the auditor
- `partial`: control or documentation exists, but more proof, sign-off, or deployment verification is still needed
- `missing`: the control is not yet implemented well enough, or no audit-grade evidence exists yet

## Current Status

| Area | Status | What we can show now | What is still needed |
|---|---|---|---|
| Executive system overview | `ready` | Scope, architecture, delivery model, and main components are documented | Keep aligned with any production topology changes |
| Architecture and data flows | `ready` | Main platform and integration flows are documented | Add screenshots if auditor asks for visual proof |
| Governance and ownership mapping | `ready` | RACI, system inventory, and risk register are present | Owner sign-off is still useful before the meeting |
| Vendor and secrets inventory | `ready` | Vendor register, secrets inventory, and retention schedule exist | Confirm contract/DPA and rotation details from production consoles |
| Runbooks and operating procedures | `ready` | Incident, credential rotation, provider outage, and backup/restore runbooks are documented | Add named approver/date if formal sign-off is required |
| Internal endpoint protection evidence | `partial` | Code changes and local tests exist for `/metrics` and `/healthz/deep` protection | Verify deployed behavior in staging or production |
| Tenant isolation proof | `partial` | Route-level security tests now cover orders, documents, and admin boundaries | Add DB-level RLS verification evidence |
| Idempotency and replay controls | `partial` | Local tests prove key middleware and duplicate-event handling behavior | Add production-path verification for live issue/cancel flows |
| Webhook security | `partial` | Local tests prove invalid secret/token/signature rejection and duplicate skip behavior | Add durable async processing plan and deployed verification |
| Logging maturity | `partial` | Structured logging exists in part of the backend | Remaining `console.*` cleanup and sanitized sample logs are still needed |
| Vulnerability management | `partial` | `npm audit` snapshot and remediation backlog exist | Reduce high/moderate findings and capture refreshed scan output |
| Payment and fulfillment safety | `partial` | PDF-only issuance guard is documented and code-level control exists | Confirm deployed env policy and harden async orchestration |
| Compliance and privacy posture | `partial` | Data inventory, retention, DSAR/runbook framing, and legal/compliance materials are drafted | External legal confirmation, customer-facing page verification, and DPA proof |
| Backup and restore evidence | `missing` | Runbook exists | Real restore drill output and RPO/RTO confirmation |
| Access review evidence | `missing` | Access review log structure exists | Real console export or manual review completion with actions |
| Durable async operations | `missing` | Risk is identified in remediation docs | Queue/worker design or operator-safe interim control |

## What Is Strong Today

- Audit pack structure is complete and organized for external review.
- Technical evidence now includes executable local tests for:
  - internal observability protection
  - tenant boundaries
  - idempotency and replay controls
  - webhook authentication and duplicate-event handling
- Supporting operational artifacts already exist for ownership, vendors, secrets, retention, and runbooks.

## What Still Needs Human or Production Evidence

- access review completion
- restore drill output
- deployment verification of already-implemented code protections
- DPA / contract confirmation for subprocessors
- screenshots or exports for monitoring, alerts, and backups

## Safest Next Steps

These can continue immediately without affecting the live instance:

1. refine audit-facing status notes and owner fields
2. collect screenshots and exports from consoles
3. add more local `test-only` evidence where useful
4. prepare mock-audit speaking notes from this status page

## Do Not Claim As Fully Closed Yet

- durable async processing
- backup/restore validation
- final vulnerability cleanup
- production deployment verification of recent security patches
- formal access review completion
