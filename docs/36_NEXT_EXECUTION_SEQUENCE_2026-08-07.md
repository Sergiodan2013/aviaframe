# AviaFrame — Next Execution Sequence

Дата: 2026-08-07

## Цель

Зафиксировать ближайший практический порядок действий после Sprint 0 hardening, чтобы:

- не трогать production вслепую;
- не потерять найденные ручные хвосты;
- довести legacy mutating proxy cutover до controlled flip;
- затем безопасно перейти к cleanup wave.

## Что делать дальше

### Step 1. Закрыть manual/local surfaces

Нужно вручную проверить и привести в порядок:

- `portal/client/.env`
- `.claude/settings.json`
- `tmp/railway-deploy-sandbox-host-20260720/**`

Source of truth:

- [35_MANUAL_LOCAL_SURFACES_FOLLOW_UP_2026-08-07.md](35_MANUAL_LOCAL_SURFACES_FOLLOW_UP_2026-08-07.md)

Done when:

- локальный portal больше не хранит legacy `VITE_N8N_ORDER_*`
- local tool settings не дергают `/webhook/drct/order/create`
- по `tmp` snapshot принято явное решение: archive или delete

### Step 2. Открыть telemetry window

В production/staging-like среде нужно наблюдать:

- `aviaframe_drct_legacy_proxy_requests_total{target_path,mode,consumer}`
- compat logs с `origin`, `referer`, `userAgent`, `consumer`

Source of truth:

- [27_DRCT_MUTATING_PROXY_TELEMETRY_AND_GO_NO_GO_2026-08-07.md](27_DRCT_MUTATING_PROXY_TELEMETRY_AND_GO_NO_GO_2026-08-07.md)
- [29_PRE_CUTOVER_EXECUTION_RUNBOOK_2026-08-07.md](29_PRE_CUTOVER_EXECUTION_RUNBOOK_2026-08-07.md)

Done when:

- нет repo-owned browser consumers на compat path
- нет необъясненного `external-or-unknown`
- есть owner decision по любому остаточному traffic
- подтвержден live status legacy mutating workflows в n8n

### Step 3. Перед flip прогнать локальный gate

Запускать:

```bash
npm run check:pre-cutover
npm run inventory:legacy-drct-cleanup
npm run scan:legacy-drct-references
npm run check:n8n-legacy-workflows
```

Done when:

- все три команды зеленые
- `npm run check:n8n-legacy-workflows` не показывает active legacy workflows
- manual/local surfaces уже разобраны
- telemetry window закрыта

### Step 4. Controlled flip

Сделать только отдельным change window:

```env
ALLOW_PUBLIC_DRCT_MUTATING_PROXY=false
```

После flip сразу наблюдать:

- blocked traffic
- portal create / issue / cancel
- widget order create continuity
- support noise

Source of truth:

- [24_DRCT_MUTATING_PROXY_CUTOVER_CHECKLIST_2026-08-07.md](24_DRCT_MUTATING_PROXY_CUTOVER_CHECKLIST_2026-08-07.md)

### Step 5. Если flip стабилен — идти в cleanup wave

Только после подтвержденной stability window:

- убрать `portal/client/scripts/write-redirects.js` legacy catch-all
- убрать deprecated mutating tests из `backend/scripts/test_n8n.js`
- затем убирать `n8nClient` mutating methods и catch-all proxy block

Source of truth:

- [32_POST_FLIP_LEGACY_PROXY_CLEANUP_WAVE_2026-08-07.md](32_POST_FLIP_LEGACY_PROXY_CLEANUP_WAVE_2026-08-07.md)

### Step 6. После этого брать efficiency/CRO wave

Когда perimeter cleanup закрыт, следующий крупный блок:

- portal bundle split
- Netlify/build cost reduction
- onboarding/CRO improvements

Source of truth:

- [33_PORTAL_BUILD_BASELINE_AND_SAFE_OPTIMIZATION_PLAN_2026-08-07.md](33_PORTAL_BUILD_BASELINE_AND_SAFE_OPTIMIZATION_PLAN_2026-08-07.md)
- [25_NETLIFY_BUILD_EFFICIENCY_REVIEW_2026-08-07.md](25_NETLIFY_BUILD_EFFICIENCY_REVIEW_2026-08-07.md)

## Самый правильный порядок по owner'ам

### Repo owner / operator

1. Закрывает manual/local surfaces
2. Запускает telemetry window
3. Принимает go/no-go по flip

### Agent A

1. Держит safety gates зеленым
2. Ведет post-flip cleanup wave
3. Потом берет portal/build optimization wave

### Agent B

1. Дочищает docs/manual consumer layer
2. Помогает с archive/delete decision по historical artifacts
3. Не трогает runtime, пока flip не подтвержден

## Если нужен самый короткий ответ

Следующее действие не “писать еще код”, а:

1. вручную убрать legacy хвосты из `portal/client/.env`, `.claude/settings.json` и решить судьбу `tmp/**`
2. собрать telemetry window
3. потом сделать controlled flip
4. только после стабильного flip идти в cleanup wave
