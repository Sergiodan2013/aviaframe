# AviaFrame — DRCT Mutating Proxy Cutover Checklist

Дата: 2026-08-07

## Цель

Подготовить безопасный controlled flip:

- `ALLOW_PUBLIC_DRCT_MUTATING_PROXY=true` -> `ALLOW_PUBLIC_DRCT_MUTATING_PROXY=false`

Речь только про mutating legacy proxy paths:

- `/webhook/drct/order/create`
- `/webhook/drct/order/issue`
- `/webhook/drct/order/cancel`

Search path в этот cutover не входит.

## Что уже подтверждено на 2026-08-07

### Repo-owned runtime consumers removed

- portal create moved to `POST /api/orders`
- portal issue moved to `POST /api/orders/:orderId/issue`
- portal cancel moved to `POST /api/orders/:orderId/cancel`
- widget demo booking moved to `POST /api/backend/widget/session` + `POST /api/backend/widget/orders`
- repo demo redirects no longer proxy `/api/n8n/*` for mutating order flow

### Compatibility guard exists

Backend already:

- logs compat usage with consumer hints;
- adds deprecation headers on allowed public mutating proxy usage;
- blocks public usage when `ALLOW_PUBLIC_DRCT_MUTATING_PROXY=false`;
- still allows explicit internal-token bypass.

## Automation

Перед cutover запускать:

```bash
npm run check:drct-cutover
```

Эта проверка валидирует repo-owned runtime state:

- portal no longer uses browser-to-legacy mutating create/issue flow;
- demo/static runtime surfaces no longer call mutating `/api/n8n/webhook*`;
- backend guard is still present.

## Preconditions

Все пункты ниже должны быть true до flip.

### 1. Repo readiness

- `npm run check:drct-cutover` passes
- targeted backend security tests pass
- portal build passes

Suggested commands:

```bash
npm run check:pre-cutover
```

### 2. Telemetry readiness

Нужна telemetry window, в которой compat logs на mutating proxy показывают:

- либо `0` repo-owned browser consumers;
- либо только known manual/internal callers with explicit follow-up.

Primary metric:

- `aviaframe_drct_legacy_proxy_requests_total{target_path,mode,consumer}`

Минимум нужно проверить compat logs по полям:

- `targetPath`
- `origin`
- `referer`
- `userAgent`
- `consumer`
- `mode`

### 3. External/manual consumer check

Нужно отдельно подтвердить, что вне репо не осталось активных production consumers:

- manual ops runbooks
- external previews
- ad-hoc admin tools
- old static sites
- browser bookmarks / internal SOPs

Без этого слепой flip делать нельзя, даже если repo уже чистый.

### 4. Production config readiness

Нужно убедиться, что:

- `INTERNAL_API_TOKEN` задан и известен тем internal consumers, которым он реально нужен;
- support/on-call знает о planned cutover;
- rollback path подготовлен;
- deploy window выбрана осознанно.

## Go / No-Go Rule

## GO

Можно делать flip, если одновременно выполнено все:

- repo readiness checks are green
- telemetry window does not show repo-owned browser consumers
- external/manual consumer review completed
- rollback instructions prepared
- owner explicitly approves cutover

## NO-GO

Flip запрещен, если есть хоть одно из ниже:

- compat logs still show browser consumers from non-internal origins
- unknown `consumer=external-or-unknown` traffic still appears
- docs/runbooks still actively route operators to legacy mutating proxy
- no verified internal-token path for allowed internal consumers
- no rollback owner or no monitoring window

## Rollout Steps

### Step 1. Freeze

На время flip:

- не совмещать cutover с payment changes, DRCT mapping changes, portal checkout changes;
- не совмещать с Netlify restructuring;
- не совмещать с auth/profile changes.

### Step 2. Final checks

Run:

```bash
npm run check:pre-cutover
```

### Step 3. Flip config

Set:

```env
ALLOW_PUBLIC_DRCT_MUTATING_PROXY=false
```

Do not change any other behavior in the same release unless strictly necessary.

### Step 4. Observe

Immediately after rollout monitor:

- blocked proxy requests count
- 403 responses on `/webhook/drct/order/create|issue|cancel`
- portal booking create
- portal issue/cancel
- widget order create
- payment-to-issue continuity

### Step 5. Hold window

Keep a short observation window after deploy before declaring success.

## Rollback

Rollback trigger examples:

- expected internal caller starts failing
- new unknown manual consumer appears
- real agency booking path shows unexpected dependency
- post-deploy support noise spikes around order create / issue / cancel

Rollback action:

```env
ALLOW_PUBLIC_DRCT_MUTATING_PROXY=true
```

Then:

- capture failing caller identity
- classify as repo-owned / external / manual
- fix migration debt
- retry cutover later

## What this cutover does NOT solve

Этот flip сам по себе не решает:

- docs debt outside current scope
- legacy search proxy
- full n8n topology simplification
- broader DRCT direct-vs-workflow architecture decisions
- payment scope reduction

Это только закрывает public mutating legacy proxy surface.

## Minimum artifacts to keep with the cutover

- [21_DRCT_MUTATING_PROXY_CONSUMER_INVENTORY_2026-08-07.md](/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation%20(2)/docs/21_DRCT_MUTATING_PROXY_CONSUMER_INVENTORY_2026-08-07.md)
- [22_PARALLEL_EXECUTION_PROTOCOL_2026-08-07.md](/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation%20(2)/docs/22_PARALLEL_EXECUTION_PROTOCOL_2026-08-07.md)
- this checklist

## Final rule

Если есть сомнение, делаем не flip, а еще одну telemetry / classification итерацию.
