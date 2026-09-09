# AviaFrame — DRCT Mutating Proxy Telemetry and Go/No-Go

Дата: 2026-08-07

## Зачем нужен этот документ

После repo migration cleanup уже недостаточно просто сказать "кажется, legacy mutating proxy можно выключать".

Нужно иметь:

- измеримый telemetry window;
- понятный набор сигналов;
- формальный `go / no-go`;
- ясный rollback trigger.

Этот документ дополняет cutover checklist и отвечает только на operational question:

`видим ли мы достаточно evidence, чтобы выключить public legacy mutating proxy safely?`

## Scope

Речь идет только про:

- `/webhook/drct/order/create`
- `/webhook/drct/order/issue`
- `/webhook/drct/order/cancel`

Search path сюда не входит.

## Sources of truth

### Metrics

Primary metric:

- `aviaframe_drct_legacy_proxy_requests_total{target_path,mode,consumer}`

Где:

- `target_path`:
  - `/drct/order/create`
  - `/drct/order/issue`
  - `/drct/order/cancel`
- `mode`:
  - `compat`
  - `blocked`
- `consumer`:
  - `portal-admin`
  - `portal-preview`
  - `netlify-preview`
  - `local-dev`
  - `aviaframe-site`
  - `external-or-unknown`

### Logs

Compatibility guard already logs:

- `targetPath`
- `origin`
- `referer`
- `userAgent`
- `consumer`
- `mode`
- `ip`

### Repo readiness gate

Run before decision:

```bash
npm run check:drct-cutover
```

## How to interpret telemetry

## Good signal

Telemetry window is healthy when:

- `compat` traffic is zero or near-zero for repo-owned browser consumers;
- any residual calls are explained and classified;
- `blocked` traffic is absent before flip and either zero or intentionally observed after flip;
- no spike appears from `external-or-unknown`.

## Bad signal

Telemetry window is unhealthy when:

- `portal-admin`, `portal-preview`, `aviaframe-site`, or other repo-owned browser consumers still hit compat path;
- `external-or-unknown` appears repeatedly;
- traffic exists but ownership is unclear;
- support or ops cannot map a caller to a known runbook/integration.

## Recommended telemetry window

Minimum recommendation:

- one explicit observation window before flip;
- one observation window immediately after flip;
- one short follow-up window after the first business cycle that would normally include order create/issue/cancel actions.

Если traffic volume низкий, лучше взять не фиксированное число часов, а window, которая покрывает:

- portal create flow;
- portal issue/cancel flow;
- at least one demo/static smoke contour if it still exists operationally;
- at least one business usage period.

## Pre-flip go/no-go

## GO

Можно идти к flip, если одновременно true:

- `npm run check:drct-cutover` passes
- targeted backend tests pass
- portal build passes
- `compat` metric does not show repo-owned browser consumers
- any remaining compat traffic is classified and explicitly accepted
- rollback owner and rollback steps are ready

## NO-GO

Нельзя идти к flip, если выполняется хоть одно:

- `compat` metric still shows `portal-admin`, `portal-preview`, `aviaframe-site`, or another repo-owned browser path
- repeated `external-or-unknown`
- unresolved manual/external consumers
- missing internal-token path for allowed internal callers
- no active support/ops coverage during rollout

## Post-flip monitoring

После `ALLOW_PUBLIC_DRCT_MUTATING_PROXY=false` наблюдаем:

- `blocked` metric by `target_path`
- any new `consumer=external-or-unknown`
- portal order create health
- portal issue/cancel health
- widget order create continuity
- payment-to-issue continuity

## Immediate rollback triggers

Rollback immediately if:

- a known business-critical internal caller starts failing;
- support/ops reports real user path breakage tied to create/issue/cancel;
- `blocked` metric spikes from a consumer that should have been migrated;
- unknown consumer appears and cannot be classified quickly.

## Rollback action

Rollback action is still simple:

```env
ALLOW_PUBLIC_DRCT_MUTATING_PROXY=true
```

Then:

- capture metric sample;
- capture matching logs;
- classify caller;
- patch migration debt;
- retry later.

## Minimal pre-flip command set

```bash
npm run check:pre-cutover
```

## Practical decision rule

Если хотя бы один сигнал требует слов "скорее всего", "наверное", "похоже", cutover еще не готов.

Для flip нужен state, в котором вопрос решается не интуицией, а:

- metrics;
- logs;
- targeted checks;
- explicit owner decision.
