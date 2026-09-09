# AviaFrame — Documentation Index

All product and technical documentation lives in this directory.

---

## Start Here

If you are reviewing AviaFrame from GitHub, use one of these paths first:

| Goal | Open first |
|---|---|
| Audit / due diligence | [audit/consolidator-aero/README.md](audit/consolidator-aero/README.md) |
| Product and market context | [01_BRD.md](01_BRD.md) |
| System overview | [../ARCHITECTURE.md](../ARCHITECTURE.md) |
| API and contracts | [06_API_SPEC.md](06_API_SPEC.md) |
| Security posture | [08_SECURITY.md](08_SECURITY.md) |

## Recommended Review Order

1. [../README.md](../README.md)
2. [../ARCHITECTURE.md](../ARCHITECTURE.md)
3. [audit/consolidator-aero/README.md](audit/consolidator-aero/README.md)
4. [06_API_SPEC.md](06_API_SPEC.md)
5. [08_SECURITY.md](08_SECURITY.md)

## Product Docs

| File | Description | Version |
|---|---|---|
| [01_BRD.md](01_BRD.md) | Business Requirements — goals, roles, pricing, KPIs | v1.1 |
| [02_PRD.md](02_PRD.md) | Product Requirements — user journeys, MVP scope, features | v1.1 |
| [03_SRS.md](03_SRS.md) | Software Requirements Specification — technical constraints | v1.0 |
| [15_PRODUCT_GROWTH_AND_UX_STRATEGY.md](15_PRODUCT_GROWTH_AND_UX_STRATEGY.md) | Product growth strategy — packaging, onboarding, UX gaps, and 90-day roadmap | v1.0 |
| [16_PRODUCT_GROWTH_PITCH_RU.md](16_PRODUCT_GROWTH_PITCH_RU.md) | Russian stakeholder pitch — current state, roadmap, rationale, and expected outcomes | v1.0 |
| [17_BOOKING_PATH_AUDIT_CHECKLIST_RU.md](17_BOOKING_PATH_AUDIT_CHECKLIST_RU.md) | Russian audit checklist — full customer booking path review by screen and step | v1.0 |
| [18_BOOKING_PATH_AUDIT_FINDINGS_RU.md](18_BOOKING_PATH_AUDIT_FINDINGS_RU.md) | Russian findings report — real issues in the current booking path with severity and remediation priorities | v1.0 |
| [19_PLATFORM_TARGET_BLUEPRINT_AND_EXECUTION_PLAN_2026-08-06.md](19_PLATFORM_TARGET_BLUEPRINT_AND_EXECUTION_PLAN_2026-08-06.md) | Post-audit target blueprint — hosted self-serve architecture, platform workstreams, and execution order | v1.0 |
| [20_PLATFORM_PLAN_HARDENING_REVIEW_AND_REMEDIATION_BACKLOG_2026-08-06.md](20_PLATFORM_PLAN_HARDENING_REVIEW_AND_REMEDIATION_BACKLOG_2026-08-06.md) | Evidence-backed plan hardening — Stage 0 security, sprint backlog, owners, effort, and safe execution order | v1.0 |
| [21_DRCT_MUTATING_PROXY_CONSUMER_INVENTORY_2026-08-07.md](21_DRCT_MUTATING_PROXY_CONSUMER_INVENTORY_2026-08-07.md) | Repo evidence for legacy DRCT mutating proxy consumers, blockers, and cutover sequence | v1.0 |
| [22_PARALLEL_EXECUTION_PROTOCOL_2026-08-07.md](22_PARALLEL_EXECUTION_PROTOCOL_2026-08-07.md) | Parallel work protocol — exact split between main and secondary agent, locked files, checks, and sync rules | v1.0 |
| [23_AGENT_B_WORK_BRIEF_2026-08-07.md](23_AGENT_B_WORK_BRIEF_2026-08-07.md) | Agent B handoff — exact scope, file boundaries, required inputs, and verification rules | v1.0 |
| [24_DRCT_MUTATING_PROXY_CUTOVER_CHECKLIST_2026-08-07.md](24_DRCT_MUTATING_PROXY_CUTOVER_CHECKLIST_2026-08-07.md) | Go/no-go checklist and rollback plan for flipping `ALLOW_PUBLIC_DRCT_MUTATING_PROXY=false` | v1.0 |
| [25_NETLIFY_BUILD_EFFICIENCY_REVIEW_2026-08-07.md](25_NETLIFY_BUILD_EFFICIENCY_REVIEW_2026-08-07.md) | Netlify build and redirect efficiency review — findings, safe immediate actions, structural proposals | v1.0 |
| [26_LEGACY_PROXY_TOOLING_DECOMMISSION_PLAN_2026-08-07.md](26_LEGACY_PROXY_TOOLING_DECOMMISSION_PLAN_2026-08-07.md) | Ordered decommission plan for all tooling referencing legacy mutating proxy paths | v1.0 |
| [27_DRCT_MUTATING_PROXY_TELEMETRY_AND_GO_NO_GO_2026-08-07.md](27_DRCT_MUTATING_PROXY_TELEMETRY_AND_GO_NO_GO_2026-08-07.md) | Operational telemetry guide — how to evaluate compat traffic, classify residual consumers, and decide go/no-go | v1.0 |
| [28_SPRINT0_VERIFICATION_AND_PRE_CUTOVER_STATUS_2026-08-07.md](28_SPRINT0_VERIFICATION_AND_PRE_CUTOVER_STATUS_2026-08-07.md) | Simple status snapshot — what Sprint 0 verified, what remains unverified, and the next pre-cutover steps | v1.0 |
| [29_PRE_CUTOVER_EXECUTION_RUNBOOK_2026-08-07.md](29_PRE_CUTOVER_EXECUTION_RUNBOOK_2026-08-07.md) | Practical execution runbook — exact pre-cutover command, evidence sequence, stop conditions, and rollback order | v1.0 |
| [30_AGENT_B_EXTERNAL_CONSUMER_AUDIT_BRIEF_2026-08-07.md](30_AGENT_B_EXTERNAL_CONSUMER_AUDIT_BRIEF_2026-08-07.md) | Isolated brief for Agent B — external/manual consumer audit and post-cutover docs archive prep without runtime changes | v1.0 |
| [31_EXTERNAL_MANUAL_CONSUMER_VALIDATION_AND_DOC_ARCHIVE_PLAN_2026-08-07.md](31_EXTERNAL_MANUAL_CONSUMER_VALIDATION_AND_DOC_ARCHIVE_PLAN_2026-08-07.md) | Repo evidence classification, external consumer checklist, post-cutover archive plan, and operator comms checklist | v1.0 |
| [32_POST_FLIP_LEGACY_PROXY_CLEANUP_WAVE_2026-08-07.md](32_POST_FLIP_LEGACY_PROXY_CLEANUP_WAVE_2026-08-07.md) | Controlled post-flip cleanup plan — inventory command, removal order, stop conditions, and verification per wave | v1.0 |
| [33_PORTAL_BUILD_BASELINE_AND_SAFE_OPTIMIZATION_PLAN_2026-08-07.md](33_PORTAL_BUILD_BASELINE_AND_SAFE_OPTIMIZATION_PLAN_2026-08-07.md) | Evidence-based portal bundle baseline — current artifact sizes, why the main chunk is heavy, and a safe optimization order | v1.0 |
| [34_REPO_LEGACY_REFERENCE_SCAN_AND_TMP_RISK_2026-08-07.md](34_REPO_LEGACY_REFERENCE_SCAN_AND_TMP_RISK_2026-08-07.md) | Repo-wide legacy reference scan — classification of residual paths and explicit risk note for `tmp` snapshots | v1.0 |
| [35_MANUAL_LOCAL_SURFACES_FOLLOW_UP_2026-08-07.md](35_MANUAL_LOCAL_SURFACES_FOLLOW_UP_2026-08-07.md) | Manual follow-up list for local/user-owned surfaces that still reference legacy paths and should not be auto-edited | v1.0 |
| [36_NEXT_EXECUTION_SEQUENCE_2026-08-07.md](36_NEXT_EXECUTION_SEQUENCE_2026-08-07.md) | Immediate next-step sequence — exact order of manual cleanup, telemetry window, flip, cleanup wave, and later efficiency work | v1.0 |
| [37_AGENT_B_ARCHIVE_AND_HISTORICAL_ARTIFACTS_BRIEF_2026-08-07.md](37_AGENT_B_ARCHIVE_AND_HISTORICAL_ARTIFACTS_BRIEF_2026-08-07.md) | Isolated brief for Agent B — archive plan for historical artifacts and ownership decision plan for `tmp` snapshot | v1.0 |
| [38_AVIAFRAME_DESIGN_SYSTEM_ADOPTION.md](38_AVIAFRAME_DESIGN_SYSTEM_ADOPTION.md) | Shared UI tokens, component foundation, agent guidance, and staged adoption plan | v0.1 |

## Data & API

| File | Description |
|---|---|
| [05_DATA_MODEL.md](05_DATA_MODEL.md) | Logical data model — entities and relationships |
| [06_API_SPEC.md](06_API_SPEC.md) | API specification — endpoints and contracts |
| [api/](api/) | OpenAPI and API reference files |
| [api/aviaframe-openapi.yaml](api/aviaframe-openapi.yaml) | OpenAPI 3.0 contract |

## Security

| File | Description |
|---|---|
| [08_SECURITY.md](08_SECURITY.md) | Security requirements — auth, RLS, PII, DRCT |

## Feature Specs (MVP)

| File | Description |
|---|---|
| [09_SUPER_ADMIN_MVP.md](09_SUPER_ADMIN_MVP.md) | Super Admin + Agency Admin console — full spec, roles, API surface |
| [12_EMAIL_SERVICE_SPEC.md](12_EMAIL_SERVICE_SPEC.md) | Email service (Resend) — 14 email types, PDF itinerary, branded templates |
| [13_WIDGET_CUSTOMIZATION_SPEC.md](13_WIDGET_CUSTOMIZATION_SPEC.md) | Widget customization — branding, domains, embed, WidgetConfig |
| [14_WHITELABEL_MVP_SPEC.md](14_WHITELABEL_MVP_SPEC.md) | Whitelabel implementation — custom domains, new DB tables, 5 phases |

## Integration

| File | Description |
|---|---|
| [DRCT_INTEGRATION.md](DRCT_INTEGRATION.md) | DRCT API integration — workflows, payloads, n8n |
| [EMAIL_SERVICE_PHASE1.md](EMAIL_SERVICE_PHASE1.md) | Email service Phase 1 — Supabase outbox, n8n workflow |
| [TAMARA_INTEGRATION_IMPLEMENTATION_SPEC_2026-05-12.md](TAMARA_INTEGRATION_IMPLEMENTATION_SPEC_2026-05-12.md) | Implementation spec for Tamara BNPL integration across portal, widget, backend, and DRCT flow |
| [TAMARA_HANDOFF_2026-05-21.md](TAMARA_HANDOFF_2026-05-21.md) | Handoff for the next agent: debug trail, root causes, deployed fixes, and current Tamara verification state |
| [PLATFORM_AUDIT_2026-05-21.md](PLATFORM_AUDIT_2026-05-21.md) | Cross-functional platform audit covering architecture, security, reliability, scale, and operations with a prioritized action plan |
| [STAGING_ENVIRONMENT_SETUP_2026-05-21.md](STAGING_ENVIRONMENT_SETUP_2026-05-21.md) | Staging blueprint, runtime config model, environment separation checklist, and external provisioning steps |

## Implementation State

| File | Description |
|---|---|
| [PROD_READINESS_AND_EMAIL_SERVICE_AUDIT_2026-02-23.md](PROD_READINESS_AND_EMAIL_SERVICE_AUDIT_2026-02-23.md) | Production readiness audit — current state, gaps, priorities |
| [audit/consolidator-aero/README.md](audit/consolidator-aero/README.md) | Consolidator Aero audit evidence pack — control matrix, risks, inventories, and readiness tracking |

## Code Entry Points

| Area | Main files |
|---|---|
| Backend | [../backend/src/index.js](../backend/src/index.js), [../backend/src/app.js](../backend/src/app.js), [../backend/src/routes/public.js](../backend/src/routes/public.js) |
| Widget | [../widget/src/widget.js](../widget/src/widget.js) |
| Portal | [../portal/src/index.js](../portal/src/index.js), [../portal/client/src/App.jsx](../portal/client/src/App.jsx) |

---

## 🧠 Workflow Docs (Cowork → Docs → Code)

| File | Description |
|---|---|
| [decisions.md](decisions.md) | **Decision log** — почему приняты ключевые решения (мозг проекта) |
| [tasks.md](tasks.md) | **Текущие задачи** — бэклог, в работе, готово |

> **Правило:** Code не придумывает архитектуру. Code реализует то, что зафиксировано в docs.
>
> Новое решение → `decisions.md` → ТЗ для Code → реализация.
