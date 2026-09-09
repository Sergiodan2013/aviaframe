# AviaFrame — Pre-Cutover Execution Runbook

Дата: 2026-08-07

## Зачем нужен этот runbook

Sprint 0 уже перевел repo-owned runtime consumers со старого public mutating proxy на более безопасные backend/internal paths.

Теперь нужен один короткий operational script:

- что именно запускать перед cutover;
- какие evidence собрать;
- в какой момент можно идти к `ALLOW_PUBLIC_DRCT_MUTATING_PROXY=false`;
- когда нужно остановиться и не делать flip.

Этот документ не меняет runtime и не заменяет checklist/go-no-go docs.

Он нужен как практическая инструкция для конкретного execution pass.

## Scope

Только для legacy mutating proxy paths:

- `/webhook/drct/order/create`
- `/webhook/drct/order/issue`
- `/webhook/drct/order/cancel`

Search path в этот runbook не входит.

## Команда номер один

Локальный pre-cutover gate теперь запускается одной командой:

```bash
npm run check:pre-cutover
```

Эта команда последовательно делает:

1. `npm run check:drct-cutover`
2. targeted backend safety tests
3. `npm --prefix portal/client run build`

## Что именно должно пройти

`npm run check:pre-cutover` должен завершиться успешно без ручных оговорок.

Он подтверждает, что:

- repo-owned browser/runtime paths больше не используют legacy mutating proxy;
- guard и telemetry по legacy mutating proxy остались на месте;
- portal changes собираются;
- ключевые backend safety checks не регресснули.

## Порядок действий

### Step 1. Repo gate

Запустить:

```bash
npm run check:pre-cutover
```

Если команда падает:

- cutover запрещен;
- сначала устраняется конкретная причина падения;
- telemetry window без зеленого repo gate не считается достаточной.

### Step 2. Telemetry window

Проверить в живой среде:

- `aviaframe_drct_legacy_proxy_requests_total{target_path,mode,consumer}`
- compatibility logs с `targetPath`, `origin`, `referer`, `userAgent`, `consumer`, `mode`

Нужный результат:

- нет repo-owned browser consumers на `mode=compat`;
- любой остаточный traffic объяснен и классифицирован;
- нет повторяющегося `consumer=external-or-unknown` без владельца.

### Step 3. External/manual consumer confirmation

Отдельно подтвердить, что вне runtime-кода не осталось активных потребителей:

- manual ops runbooks;
- старые SOP;
- старые previews/static pages;
- bookmarks/internal tools;
- ad-hoc internal scripts.

Если ownership хотя бы одного caller неясен:

- cutover не делать.

### Step 4. Go / No-Go review

Flip разрешен только если одновременно true:

- `npm run check:pre-cutover` green;
- telemetry window clean;
- external/manual consumers reviewed;
- rollback owner назначен;
- change window согласован.

### Step 5. Controlled flip

Только после явного решения:

```env
ALLOW_PUBLIC_DRCT_MUTATING_PROXY=false
```

В том же релизе не смешивать с:

- payment logic changes;
- DRCT mapping changes;
- auth/profile changes;
- Netlify restructuring.

### Step 6. Immediate post-flip watch

Сразу после релиза наблюдать:

- `mode=blocked` по mutating proxy paths;
- portal create / issue / cancel;
- widget order create continuity;
- payment-to-issue continuity;
- support noise around booking actions.

## Stop conditions

Не продолжаем к flip, если есть хоть одно:

- `npm run check:pre-cutover` failed;
- repo-owned browser consumer все еще попадает в compat path;
- unknown consumer cannot be classified quickly;
- support/on-call не готовы к observation window;
- нет понятного rollback owner.

## Rollback

Если после flip ломается ожидаемый caller или появляется неожиданный blocked traffic:

```env
ALLOW_PUBLIC_DRCT_MUTATING_PROXY=true
```

Затем:

1. сохранить metric sample и связанные logs;
2. классифицировать caller;
3. закрыть migration debt;
4. повторить cutover позже.

## Артефакты, которые держим рядом

- [24_DRCT_MUTATING_PROXY_CUTOVER_CHECKLIST_2026-08-07.md](24_DRCT_MUTATING_PROXY_CUTOVER_CHECKLIST_2026-08-07.md)
- [27_DRCT_MUTATING_PROXY_TELEMETRY_AND_GO_NO_GO_2026-08-07.md](27_DRCT_MUTATING_PROXY_TELEMETRY_AND_GO_NO_GO_2026-08-07.md)
- [28_SPRINT0_VERIFICATION_AND_PRE_CUTOVER_STATUS_2026-08-07.md](28_SPRINT0_VERIFICATION_AND_PRE_CUTOVER_STATUS_2026-08-07.md)

## Короткое правило

Если решение требует фразы "скорее всего все уже мигрировано", значит cutover еще не готов.
