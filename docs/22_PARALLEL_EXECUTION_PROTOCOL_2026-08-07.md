# AviaFrame — Parallel Execution Protocol

Дата: 2026-08-07

## Зачем нужен этот документ

Этот документ нужен, чтобы два агента могли работать параллельно без:

- конфликтов по одним и тем же файлам;
- скрытых регрессий в live booking path;
- случайного затрагивания production-used surfaces;
- потери времени на ручное разруливание merge-конфликтов.

Главная цель параллелизации сейчас:

- ускорить remediation backlog;
- не трогать production без необходимости;
- разделить `backend / cutover / security-critical` и `docs / Netlify / low-blast-radius cleanup`.

## Текущее состояние на 2026-08-07

Уже сделано в рамках Sprint 0:

- portal create-order переведен с legacy mutating webhook на protected backend route `POST /api/orders`;
- portal ticket issue переведен на `POST /api/orders/:orderId/issue`;
- backend cancel route добавлен как `POST /api/orders/:orderId/cancel`;
- repo-owned demo booking переведен с legacy mutating proxy на sanctioned `widget/session -> /api/backend/widget/orders`;
- `widget/demo/_redirects` больше не проксирует `/api/n8n/*`;
- `portal/client/public/form.html` больше не advertises legacy order create endpoint.

Текущий остаточный риск:

- нужно подготовить controlled flip `ALLOW_PUBLIC_DRCT_MUTATING_PROXY=false`;
- нужно дочистить docs/runbooks/scripts, где legacy mutating proxy еще описан как нормальный контракт;
- нужно отдельно оптимизировать Netlify / monorepo build waste.

## Решение по параллелизации

Да, распараллеливание возможно и целесообразно, но только по слабо связанным зонам.

Разделение:

- `Agent A (main / backend-safe track)` — production-risk, cutover, security, runtime behavior.
- `Agent B (parallel / cleanup-efficiency track)` — docs, Netlify, low-risk build/deploy efficiency, migration debt cleanup.

## Критический принцип

До следующей синхронизации `Agent B` не должен менять runtime-critical backend flow, а `Agent A` не должен трогать выделенный `Agent B` file scope без явного sync checkpoint.

Иначе мы получим ложную экономию времени и реальную потерю времени на reconciliation.

## File Locking Model

### Locked for Agent A

Эти файлы и зоны считаются `locked by Agent A` до отдельной синхронизации:

- `backend/src/app.js`
- `backend/src/config.js`
- `backend/src/index.js`
- `backend/src/middleware/auth.js`
- `backend/src/middleware/requestGuards.js`
- `backend/src/routes/orders.js`
- `backend/src/routes/payments.js`
- `backend/src/routes/widget.js`
- `backend/src/routes/health.js`
- `backend/src/services/drctDirectClient.js`
- `backend/src/services/drctService.js`
- `backend/tests/security/*`
- `docs/20_PLATFORM_PLAN_HARDENING_REVIEW_AND_REMEDIATION_BACKLOG_2026-08-06.md`
- `docs/21_DRCT_MUTATING_PROXY_CONSUMER_INVENTORY_2026-08-07.md`

### Allowed for Agent B

`Agent B` может работать только в этих зонах без дополнительного согласования:

- `backend/N8N_SETUP_GUIDE.md`
- `backend/N8N_INTEGRATION.md`
- `backend/src/services/README.md`
- `backend/n8n_workflows/README.md`
- `backend/scripts/test_n8n.js`
- `N8N_PAYLOAD_FORMAT.md`
- `TEST_SCENARIOS.md`
- `FIX_SUMMARY.md`
- `portal/client/netlify.toml`
- `aviaframe-site/netlify.toml`
- `widget/demo/_redirects`
  примечание: уже изменен в текущем remediation path, поэтому если Agent B хочет его трогать повторно, сначала нужен sync checkpoint
- новые docs-файлы в `docs/`, если они не редактируют `docs/20` и `docs/21`

### Forbidden for Agent B without sync

`Agent B` не трогает:

- `backend/src/routes/*` кроме чисто документационных комментариев по отдельному согласованию;
- `backend/src/middleware/*`;
- `backend/src/services/drct*`;
- `portal/client/src/App.jsx`;
- `portal/client/src/lib/supabase.js`;
- `portal/client/src/pages/AdminDashboard.jsx`;
- `widget/demo/booking.html`;
- `widget/demo/index.html`;
- любые payment-critical or booking-critical tests;
- любые env flips, deploy scripts, production config changes.

## Scope Split

## Agent A — Main Track

### Цель

Подготовить безопасный backend/internal cutover до состояния, где можно делать controlled flip `ALLOW_PUBLIC_DRCT_MUTATING_PROXY=false`.

### Что делает Agent A

- проверяет остаточные runtime blockers для cutover;
- держит под контролем compatibility telemetry logic;
- готовит exact cutover plan и rollback plan;
- усиливает env/readiness/check gates;
- закрывает security-sensitive and booking-integrity changes;
- проверяет, что live booking / payment / issuance path не деградирует.

### Deliverables Agent A

- controlled cutover checklist;
- backend hardening changes;
- updated risk register in core remediation docs;
- exact acceptance criteria for flip;
- rollback steps if compat traffic remains.

### Done definition for Agent A

Agent A считается done по своему этапу, когда:

- repo-owned runtime consumers уже убраны или подтвержденно migrated;
- compat telemetry window описан и readiness criteria сформулированы;
- есть clear go/no-go rule for `ALLOW_PUBLIC_DRCT_MUTATING_PROXY=false`;
- есть rollback instruction if traffic remains.

## Agent B — Parallel Track

### Цель

Убрать migration debt и build/deploy waste, не затрагивая production booking runtime.

### Что делает Agent B

Трек B состоит из двух подзадач.

### B1. Legacy Docs / Runbooks / Scripts Cleanup

Нужно:

- пометить legacy mutating proxy как deprecated;
- заменить формулировки "нормальный путь" на "legacy / compatibility only";
- везде, где возможно, указать target replacement flow:
  - `POST /api/orders`
  - `POST /api/orders/:orderId/issue`
  - `POST /api/orders/:orderId/cancel`
  - `POST /api/widget/session`
  - `POST /api/widget/orders`

### B2. Netlify / Build Efficiency Review and Safe Changes

Нужно:

- проверить `portal/client/netlify.toml`;
- проверить `aviaframe-site/netlify.toml`;
- проверить, какие шаги реально исполняются слишком широко;
- предложить и, если безопасно, внедрить low-risk optimization:
  - уменьшение unnecessary redirects/proxy complexity;
  - build-scope clarification;
  - preview/no-op deploy notes;
  - artifact/path separation suggestions.

Важно:

- если для optimization нужно менять root `package.json`, root build graph или CI policy, Agent B сначала поднимает это как proposal, а не правит напрямую без sync.

### Deliverables Agent B

- cleaned docs/runbooks/scripts;
- one compact doc with Netlify/build inefficiencies and applied low-risk fixes;
- evidence table:
  - что было legacy;
  - что заменено;
  - что осталось deliberately untouched;
- verification notes for every changed file.

### Done definition for Agent B

Agent B done, когда:

- docs/scripts больше не ведут инженеров в legacy mutating proxy как в рекомендуемый путь;
- low-risk Netlify fixes внесены либо clearly separated as proposal;
- нет правок в runtime-critical files;
- все проверки из verification matrix прошли.

## Verification Matrix

## Обязательные проверки для Agent A

- `npm --prefix backend test -- --runInBand backend/tests/security/portal-order-actions.test.js backend/tests/security/n8n-proxy-fallback.test.js backend/tests/security/public-airport-search.test.js`
- дополнительные targeted backend tests по затронутым файлам
- `git diff --check`

Если затронут portal runtime:

- `npm --prefix portal/client run build`

## Обязательные проверки для Agent B

Если менялись только docs / markdown / scripts:

- `git diff --check`
- `rg -n "drct/order/create|drct/order/issue|drct/order/cancel|/webhook/drct/order" <changed-files>`

Если менялись Netlify or portal public assets:

- `npm --prefix portal/client run build`
- `git diff --check`
- ручная сверка generated redirect logic against intended backend proxy behavior

Если менялись `backend/scripts/*`:

- script lint sanity:
  - no broken imports
  - no outdated endpoint examples after edit

## Shared verification rule

Ни один агент не делает deploy, env flip, secret rotation или production config switch без отдельного explicit checkpoint.

## Synchronization Protocol

## Checkpoint 0 — Kickoff

Перед стартом `Agent B` получает:

- этот документ;
- ссылки на:
  - `docs/20_PLATFORM_PLAN_HARDENING_REVIEW_AND_REMEDIATION_BACKLOG_2026-08-06.md`
  - `docs/21_DRCT_MUTATING_PROXY_CONSUMER_INVENTORY_2026-08-07.md`
- запрет менять `Agent A locked files`.

## Checkpoint 1 — Midpoint

Когда Agent B заканчивает первый meaningful chunk, он должен вернуть короткий статус в таком формате:

```text
Area:
Files changed:
What changed:
What was intentionally not changed:
Verification run:
Open risks:
```

## Checkpoint 2 — Pre-merge

Перед merge / handoff Agent B обязан сообщить:

- список измененных файлов;
- есть ли runtime-touching effects;
- есть ли пересечение с `Agent A locked files`;
- какие команды проверки запускались;
- какие unresolved assumptions остались.

## Escalation Rules

Agent B должен остановиться и синхронизироваться, если:

- для задачи понадобилось менять любой locked file;
- optimization затрагивает root `package.json`, build graph, CI, shared scripts;
- возникает идея менять `/api/backend` proxy shape;
- нужно менять widget session contract;
- нужно менять booking/payment runtime behavior;
- docs cleanup обнаружил, что внешний текущий production flow на самом деле еще зависит от legacy mutating proxy.

## Merge Order

Правильный порядок:

1. Agent B заканчивает docs/netlify isolated work.
2. Agent A finishes backend cutover readiness work.
3. Сверяется overlap report.
4. Merge low-risk cleanup.
5. Только потом готовится actual flip `ALLOW_PUBLIC_DRCT_MUTATING_PROXY=false`.

Если есть хоть малейшее пересечение по runtime behavior:

- merge Agent A first;
- Agent B rebases after sync;
- only then merge Agent B.

## Branch / Worktree Recommendation

Рекомендуется работать в отдельных worktree/branch:

### Agent A

- branch: `codex/backend-cutover-hardening`

### Agent B

- branch: `codex/docs-netlify-cleanup`

Если доступен отдельный worktree, это предпочтительнее, чем работа в одном dirty tree.

## Output Format for Agent B

Финальный отчет Agent B должен включать:

### 1. Summary

- что сделано;
- что не сделано специально;
- почему это безопасно.

### 2. Changed Files

Плоский список файлов.

### 3. Verification

- exact commands;
- результат;
- что не удалось проверить.

### 4. Follow-up

- что остается на Agent A;
- что можно делать только после cutover;
- какие optimization ideas требуют отдельного approval.

## What success looks like

После параллельной работы мы хотим получить:

- backend cutover readiness controlled and documented;
- runtime repo consumers of legacy mutating proxy eliminated;
- docs/runbooks/scripts no longer normalize deprecated paths;
- Netlify/build inefficiencies separated from security-critical flow;
- no accidental regression in production-used booking path.

## Single-sentence rule

`Agent A` отвечает за безопасность и runtime-корректность, `Agent B` отвечает за cleanup и efficiency без права менять booking-critical behavior.
