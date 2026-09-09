# AviaFrame — Agent B Brief: External Consumer Audit and Docs Archive Prep

Дата: 2026-08-07

## Цель

Дать Agent B следующий isolated scope без пересечения с backend/runtime migration.

Задача Agent B:

- найти и описать все не-runtime источники, которые еще могут направлять людей или manual consumers в legacy mutating proxy flow;
- подготовить post-cutover docs/archive plan;
- не менять production runtime, routing, env или deploy behavior.

## Почему это важно

На уровне repo-owned runtime migration Sprint 0 почти закрыт.

Остаточный риск сейчас не только в коде, но и в operational/documentation layer:

- старые инструкции;
- старые SOP;
- старые ссылки;
- ручные внутренние сценарии;
- устаревшие примеры интеграции.

Даже если код уже мигрирован, один старый runbook или bookmark может создать ложный blocked incident после flip.

## Что делает Agent A параллельно

Agent A в это время ведет только:

- pre-cutover execution runbook;
- backend/runtime-safe verification;
- targeted safety tests;
- cutover readiness checks.

Agent A не просит Agent B менять runtime-код.

## Scope Agent B

Разрешено:

- `docs/**`
- markdown/plain-text files в root, если они не затрагивают runtime
- audit/handoff docs
- proposal docs
- archive/decommission plans

Разрешено создавать новые docs.

## Что НЕ делать

Не трогать:

- `backend/src/**`
- `backend/tests/**`
- `portal/client/src/**`
- `widget/demo/**`
- `package.json`
- `scripts/check-drct-mutating-cutover-readiness.js`
- `docs/20_PLATFORM_PLAN_HARDENING_REVIEW_AND_REMEDIATION_BACKLOG_2026-08-06.md`
- `docs/21_DRCT_MUTATING_PROXY_CONSUMER_INVENTORY_2026-08-07.md`
- `docs/22_PARALLEL_EXECUTION_PROTOCOL_2026-08-07.md`
- `docs/23_AGENT_B_WORK_BRIEF_2026-08-07.md`
- `docs/24_DRCT_MUTATING_PROXY_CUTOVER_CHECKLIST_2026-08-07.md`
- `docs/27_DRCT_MUTATING_PROXY_TELEMETRY_AND_GO_NO_GO_2026-08-07.md`
- `docs/28_SPRINT0_VERIFICATION_AND_PRE_CUTOVER_STATUS_2026-08-07.md`
- `docs/29_PRE_CUTOVER_EXECUTION_RUNBOOK_2026-08-07.md`

Также не делать:

- deploy;
- env changes;
- feature flags;
- redirect/runtime rewiring;
- backend/internal flow edits.

## Конкретная задача

Подготовить один документ формата:

`docs/31_EXTERNAL_MANUAL_CONSUMER_VALIDATION_AND_DOC_ARCHIVE_PLAN_2026-08-07.md`

В документе должно быть:

1. repo evidence inventory:
   - где еще встречаются legacy mutating paths в docs/examples/comments;
   - какие из этих упоминаний допустимы как deprecation context;
   - какие еще выглядят operationally dangerous.

2. manual/external consumer checklist:
   - какие SOP/runbooks/bookmarks/internal pages нужно отдельно проверить вне кода;
   - какие owners должны подтвердить each area.

3. post-cutover archive plan:
   - какие docs после успешного flip нужно оставить как historical;
   - какие нужно переписать как current source of truth;
   - какие можно удалить в следующем cleanup wave.

4. operator communication checklist:
   - что сообщить support/ops/internal users перед flip;
   - какие legacy endpoints больше не считаются нормальным путем.

## Suggested search set

Искать минимум по:

- `/webhook/drct/order/create`
- `/webhook/drct/order/issue`
- `/webhook/drct/order/cancel`
- `/api/n8n/webhook/drct/order/create`
- `/api/n8n/webhook/drct/order/issue`
- `/api/n8n/webhook/drct/order/cancel`

## Verification

Минимум:

```bash
git diff --check
rg -n "drct/order/create|drct/order/issue|drct/order/cancel|api/n8n/webhook/drct/order" docs backend README.md TEST_SCENARIOS.md N8N_PAYLOAD_FORMAT.md
```

В финальном отчете Agent B должен явно разделить:

- acceptable deprecated references;
- still-risky operational references;
- missing data outside repo.

## Done definition

Agent B finished, если:

- создан `docs/31_EXTERNAL_MANUAL_CONSUMER_VALIDATION_AND_DOC_ARCHIVE_PLAN_2026-08-07.md`;
- `docs/README.md` обновлен;
- `git diff --check` clean;
- нет runtime changes.
