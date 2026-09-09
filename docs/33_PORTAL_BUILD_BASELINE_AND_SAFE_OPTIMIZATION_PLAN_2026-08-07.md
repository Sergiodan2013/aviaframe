# AviaFrame — Portal Build Baseline and Safe Optimization Plan

Дата: 2026-08-07

## Почему это важно

Во время `npm run check:pre-cutover` портал стабильно собирается, но Vite предупреждает о крупном JS bundle.

Это не блокирует текущий DRCT cutover, но напрямую влияет на:

- Netlify build/deploy efficiency;
- cold-load UX;
- preview noise;
- риск дорогих и медленных изменений во frontend.

## Подтвержденные факты

### 1. Current production build shape

После `npm --prefix portal/client run build` получаем:

- `dist/assets/index-quY1I5ev.js` — `883 KiB`
- `dist/assets/index-C8BjcqGA.css` — `49 KiB`

Vite также предупреждает, что main chunk превышает `500 kB`.

### 2. App shell loads too much eagerly

`portal/client/src/App.jsx` статически импортирует сразу:

- search/results flow
- passenger flow
- payment flow
- bookings page
- admin dashboard
- DRCT helpers
- Supabase client helpers

Это означает, что customer path и staff/admin path попадают в один основной bundle вместо route/page-level split.

### 3. No explicit chunking strategy

В `portal/client/vite.config.js` сейчас:

- нет `build.rollupOptions.output.manualChunks`
- нет явного bundle analysis step
- нет budget/reporting automation

## Safe interpretation

Это пока не доказательство "frontend плохой".

Это конкретный технический вывод:

- текущая структура удобна для быстрого MVP development;
- но для hosted/self-serve economics она уже слишком monolithic.

## Что безопасно делать сначала

### Phase 1. Visibility without behavior change

Добавлен baseline command:

```bash
npm run report:portal-build-artifacts
```

Он дает простой machine-readable snapshot текущих артефактов после build.

Это безопасно, потому что ничего не меняет в runtime.

### Phase 2. Route-level lazy loading

Первый кандидат на split:

- `AdminDashboard`
- `MyBookings`
- `PaymentScreen`

Причина:

- это крупные отдельные surfaces;
- они не нужны пользователю на первом экране одновременно;
- их можно выделять без изменения backend contracts.

### Phase 3. Library/utility isolation

После route-level split отдельно проверить:

- `@supabase/supabase-js`
- `axios`
- `react-phone-number-input`
- payment-related helpers

Цель:

- понять, что должно жить в initial search bundle;
- что можно загружать только при checkout/admin entry.

## Что пока не делать

Пока не стоит:

- резко менять UX-flow структуру одновременно с DRCT cutover;
- вводить агрессивные manualChunks без baseline measurement;
- объединять bundle optimization с payment/refactor wave.

Это увеличит blast radius и ухудшит change safety.

## Recommended next step after Sprint 0

После закрытия DRCT legacy proxy cutover:

1. Зафиксировать baseline:
   - `npm --prefix portal/client run build`
   - `npm run report:portal-build-artifacts`
2. Вынести `AdminDashboard` и `MyBookings` в lazy imports.
3. Повторить build snapshot.
4. Если gain подтвержден, отдельно выносить payment surface.

## Success criteria

Первый оптимизационный проход можно считать успешным, если:

- initial main JS bundle заметно уменьшается;
- portal build остается green;
- first-search / first-booking flow не меняется функционально;
- admin path продолжает работать через lazy-loaded entry.
