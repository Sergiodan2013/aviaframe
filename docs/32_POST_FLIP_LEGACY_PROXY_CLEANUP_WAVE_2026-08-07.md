# AviaFrame — Post-Flip Legacy Proxy Cleanup Wave

Дата: 2026-08-07

## Зачем нужен этот документ

После успешного `ALLOW_PUBLIC_DRCT_MUTATING_PROXY=false` работа не заканчивается.

Останутся технические хвосты:

- catch-all proxy block;
- feature-flag debt;
- n8n mutating client methods;
- старые redirect rules;
- deprecated smoke tests и examples.

Этот документ фиксирует безопасный порядок cleanup уже после подтвержденного flip.

## Важное правило

Ничего из этой wave не делать до тех пор, пока одновременно не выполнены все условия:

- flip уже реально сделан;
- post-flip observation window прошла без business breakage;
- нет необъясненного `blocked` traffic;
- external/manual consumers либо мигрированы, либо явно закрыты.

## Новый automation artifact

Для инвентаризации cleanup-candidates добавлен:

```bash
npm run inventory:legacy-drct-cleanup
```

Он показывает, какие legacy элементы еще физически присутствуют в коде и требуют следующей волны cleanup.

## Cleanup wave order

### Wave 1. Browser-facing compat tail

1. Удалить legacy catch-all rule из:
   - `portal/client/scripts/write-redirects.js`
2. Удалить или переписать deprecated mutating Tests 3-5 из:
   - `backend/scripts/test_n8n.js`

Почему сначала это:

- это уменьшает риск случайного возврата browser/manual traffic в старый путь;
- blast radius ниже, чем при немедленном удалении backend proxy internals.

### Wave 2. Backend mutating n8n abstraction removal

1. Удалить mutating methods из:
   - `backend/src/services/n8nClient.js`
2. Обновить orchestration layer в:
   - `backend/src/services/drctService.js`
3. Обновить зависимые service tests/examples:
   - `backend/tests/services/n8n-client.test.js`
   - `backend/tests/services/drct-service-cancel.test.js`
   - `backend/src/examples/search-with-n8n.js`

Почему это отдельной волной:

- здесь уже меняется не только perimeter, но и внутренний service contract;
- неправильный порядок легко оставит broken imports/mocks even if prod runtime survives.

### Wave 3. Final proxy surface removal

1. Удалить `app.all('/webhook/*')` catch-all proxy из:
   - `backend/src/app.js`
2. После этого оценить, нужен ли еще:
   - `ALLOW_PUBLIC_DRCT_MUTATING_PROXY`
   - `guardDrctMutatingProxy` для mutating compatibility path

Это последняя wave, потому что:

- именно она окончательно убирает legacy surface из backend runtime;
- rollback после этого уже сложнее, чем простой возврат флага.

## Command set for each cleanup wave

Перед каждой wave:

```bash
npm run check:pre-cutover
npm run inventory:legacy-drct-cleanup
```

После каждой wave:

```bash
git diff --check
npm --prefix backend run test:security-cutover
npm --prefix portal/client run build
```

Если меняется backend service layer, дополнительно прогонять связанные service tests.

## Stop conditions

Cleanup wave запрещена, если:

- post-flip telemetry еще не закрыта;
- `blocked` traffic still appears from unknown consumer;
- support/on-call фиксирует шум вокруг order create / issue / cancel;
- есть сомнение, что старый path нужен для rollback.

## What this wave deliberately does not solve

Эта cleanup wave не решает:

- search/price n8n strategy;
- broader n8n decommission;
- Netlify bundle size optimization;
- product/UX conversion work.

Она решает только controlled removal of legacy mutating proxy debt.
