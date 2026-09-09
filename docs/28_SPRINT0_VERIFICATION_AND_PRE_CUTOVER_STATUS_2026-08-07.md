# AviaFrame — Sprint 0 Verification and Pre-Cutover Status

Дата: 2026-08-07

## Короткий вывод

На уровне кода, репозитория и документации Sprint 0 практически закрыт.

Сделано:

- repo-owned runtime consumers legacy mutating proxy migrated away;
- docs/scripts больше не нормализуют legacy mutating order proxy;
- automated repo gate добавлен;
- telemetry/metrics для compatibility window добавлены;
- cutover checklist и go/no-go framework оформлены.

Следующий шаг уже не большой кодовый рефакторинг, а operational confirmation:

- собрать telemetry window;
- подтвердить отсутствие внешних/manual consumers;
- после этого принять решение по `ALLOW_PUBLIC_DRCT_MUTATING_PROXY=false`.

## Что уже проверено

### 1. Repo-owned runtime migration

Подтверждено:

- portal create идет через `POST /api/orders`
- portal issue идет через `POST /api/orders/:orderId/issue`
- portal cancel идет через `POST /api/orders/:orderId/cancel`
- widget demo booking использует `POST /api/widget/session` -> `POST /api/widget/orders`
- repo demo redirects больше не ведут mutating order flow в `/api/n8n/*`

Automation:

```bash
npm run check:pre-cutover
```

### 2. Backend safety tests

Прогнаны targeted backend tests:

```bash
npm --prefix backend run test:security-cutover
```

Покрывают:

- guard/block behavior для legacy mutating proxy
- compat telemetry metric labeling
- internal surfaces
- portal protected order create/issue/cancel path
- public airport search guardrails

### 3. Portal build sanity

Прогнано:

```bash
npm run check:pre-cutover
```

Это подтверждает:

- portal runtime changes собираются;
- static/public assets не сломали build.

### 4. Diff hygiene

Прогонялось:

```bash
git diff --check
```

На ключевых change sets — clean.

## Что закрыто по Sprint 0

### Security / boundary cleanup

- public legacy mutating proxy теперь под explicit guard;
- repo consumers legacy mutating proxy убраны;
- docs migration debt существенно сокращен;
- compatibility telemetry теперь можно измерять не только логами, но и метрикой:
  - `aviaframe_drct_legacy_proxy_requests_total{target_path,mode,consumer}`

### Change safety

- есть automated repo gate:
  - `npm run check:drct-cutover`
- есть targeted regression tests для наиболее рискованных участков

### Operational readiness

Оформлены:

- cutover checklist
- telemetry/go-no-go doc
- tooling decommission order

## Что еще не проверено

Важно честно разделять `проверено в репо` и `проверено в живом продовом окружении`.

Еще не подтверждено:

- реальные external/manual consumers вне этого репозитория;
- production-time telemetry window;
- поведение после реального flip `ALLOW_PUBLIC_DRCT_MUTATING_PROXY=false`;
- live deploy behavior конкретного production environment;
- full real-provider e2e path после cutover.

## Что делать дальше

### Step 1. Telemetry window

Нужно в живой среде наблюдать:

- `aviaframe_drct_legacy_proxy_requests_total`
- compat logs с `targetPath`, `origin`, `referer`, `userAgent`, `consumer`, `mode`

Цель:

- доказать, что repo-owned browser consumers больше не ходят в legacy mutating proxy;
- классифицировать любой остаточный traffic.

### Step 2. External/manual consumer check

Нужно подтвердить отсутствие:

- старых ops runbooks;
- ручных internal tools;
- внешних preview/static consumers;
- старых browser bookmarks / SOPs.

### Step 3. Go / No-Go

Если telemetry window чистая и внешних потребителей нет:

- можно готовить flip `ALLOW_PUBLIC_DRCT_MUTATING_PROXY=false`

Если остаются неизвестные consumers:

- flip не делать;
- сначала закрыть migration debt.

### Step 4. Controlled flip

Только после explicit decision:

- переключить `ALLOW_PUBLIC_DRCT_MUTATING_PROXY=false`
- наблюдать blocked traffic и business-critical flows
- при проблеме вернуть флаг обратно

## Финальная формулировка

Sprint 0 уже дал нам безопасную базу.

Осталось не "дописать еще кусок кода", а провести аккуратное operational подтверждение перед отключением старого публичного mutating proxy.
