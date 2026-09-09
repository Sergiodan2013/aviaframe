# AviaFrame — Agent B Brief: Archive and Historical Artifacts

Дата: 2026-08-07

## Цель

Дать Agent B следующий полностью изолированный scope после `docs/31`, без пересечения с runtime, backend cutover logic или portal source code.

Задача Agent B:

- подготовить archive/ownership plan для historical legacy artifacts;
- отдельно разобрать `tmp/railway-deploy-sandbox-host-20260720/**` как operational risk;
- не менять production runtime и не трогать locked files Agent A.

## Почему это важно

На текущем этапе уже подтверждено:

- repo-owned runtime migration сделана;
- backend guard и cutover gates зелёные;
- но в репозитории все еще есть historical artifacts, которые могут:
  - вводить в заблуждение новых разработчиков;
  - повторно оживлять legacy paths при re-import;
  - усложнять audit clarity.

## Что делает Agent A параллельно

Agent A ведет только:

- live n8n blocker verification;
- cutover readiness;
- post-flip cleanup sequencing;
- safety gates and tests.

Agent A не просит Agent B менять код runtime.

## Scope Agent B

Разрешено:

- `docs/**`
- markdown/plain-text planning docs в repo root
- archive/decommission proposals
- historical artifact inventories

## Что НЕ делать

Не трогать:

- `backend/src/**`
- `backend/tests/**`
- `portal/client/src/**`
- `widget/demo/**`
- `package.json`
- `portal/client/.env`
- `.claude/settings.json`
- `backend/n8n_workflows/*.json`
- `tmp/**`

Важно: для `backend/n8n_workflows/*.json` и `tmp/**` Agent B делает только план/decision brief, не move/delete/edit.

## Конкретная задача

Подготовить один документ:

`docs/38_HISTORICAL_ARTIFACTS_ARCHIVE_AND_TMP_DECISION_PLAN_2026-08-07.md`

В документе должно быть:

1. archive candidates inventory:
   - `backend/n8n_workflows/drct_order_create.json`
   - `backend/n8n_workflows/drct_order_issue.json`
   - `backend/n8n_workflows/drct_order_cancel.json`
   - `backend/N8N_SETUP_GUIDE.md`
   - `backend/N8N_INTEGRATION.md`
   - `backend/n8n_workflows/README.md`
   - `N8N_PAYLOAD_FORMAT.md`
   - `TEST_SCENARIOS.md`
   - `FIX_SUMMARY.md`

2. exact archive decision per artifact:
   - keep active
   - archive later
   - rewrite as source of truth
   - delete after owner confirmation

3. separate `tmp` snapshot section:
   - what is inside `tmp/railway-deploy-sandbox-host-20260720/**`
   - why it is risky
   - which owner must confirm archive/delete
   - what conditions allow safe deletion

4. post-flip archive order:
   - what can be archived immediately after stable flip
   - what must wait until Agent A removes runtime dependencies

## Verification

Минимум:

```bash
git diff --check
rg -n "drct_order_create|drct_order_issue|drct_order_cancel|railway-deploy-sandbox-host-20260720" docs backend tmp N8N_PAYLOAD_FORMAT.md TEST_SCENARIOS.md FIX_SUMMARY.md
```

## Done definition

Agent B finished, если:

- создан `docs/38_HISTORICAL_ARTIFACTS_ARCHIVE_AND_TMP_DECISION_PLAN_2026-08-07.md`
- `docs/README.md` обновлен
- `git diff --check` clean
- нет runtime changes
