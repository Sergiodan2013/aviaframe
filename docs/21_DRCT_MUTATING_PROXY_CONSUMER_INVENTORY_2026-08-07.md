# DRCT mutating proxy consumer inventory

Дата: 2026-08-07

## Цель

Понять, можно ли уже перевести `/webhook/drct/order/create`, `/webhook/drct/order/issue`, `/webhook/drct/order/cancel` в internal-only режим через `ALLOW_PUBLIC_DRCT_MUTATING_PROXY=false` без риска сломать рабочие сценарии.

## Вывод

На состоянии репозитория после remediation на 2026-08-07 `уже можно готовить controlled cutover`, но `не стоит` делать слепой глобальный flip без telemetry window и without checking external/manual consumers.

Причина задержки уже не в hosted agency booking path и не в portal/demo runtime внутри репо. Основной остаточный риск теперь в том, что legacy mutating proxy исторически использовался:

- в документации, test scripts и n8n setup material;
- потенциально во внешних manual runbooks или consumers вне текущего репозитория.

При этом evidence указывает, что `hosted public/agency booking path` уже живёт в основном через `widget` API и не должен зависеть от open `/webhook/drct/order/*`.

## Classification

### 1. Hosted / agency customer path

Статус: `no confirmed repo consumer of legacy mutating proxy`

Evidence:

- [backend/src/routes/widget.js](/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation%20(2)/backend/src/routes/widget.js:491) создаёт booking через `/api/widget/orders`
- [backend/src/routes/widget.js](/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation%20(2)/backend/src/routes/widget.js:400) подтверждает цену через `/api/widget/price-offer`
- [backend/src/services/agencyProvision.js](/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation%20(2)/backend/src/services/agencyProvision.js:388) встраивает в агентские сайты только `data-api-url=".../webhook/drct/search"`
- [backend/src/services/agencyProvision.js](/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation%20(2)/backend/src/services/agencyProvision.js:822) также переиспользует только `.../webhook/drct/search`

Интерпретация:

- search остаётся публичным и нужен;
- create/issue/cancel через legacy webhook-path по коду не выглядят частью актуального agency hosted flow.

### 2. Portal internal/admin path

Статус: `repo runtime blocker removed`

Evidence:

- [portal/client/src/lib/drctApi.js](/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation%20(2)/portal/client/src/lib/drctApi.js:3) по умолчанию использует `VITE_N8N_BASE_URL || '/api/n8n/webhook'`
- [portal/client/src/lib/drctApi.js](/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation%20(2)/portal/client/src/lib/drctApi.js:199) вызывает `drct/order/create`
- [portal/client/src/lib/drctApi.js](/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation%20(2)/portal/client/src/lib/drctApi.js:245) вызывает `drct/order/cancel`
- [portal/client/src/lib/drctApi.js](/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation%20(2)/portal/client/src/lib/drctApi.js:255) вызывает `drct/order/issue`
- [portal/client/src/App.jsx](/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation%20(2)/portal/client/src/App.jsx:832) использует `createPortalOrder(...)`
- [portal/client/src/pages/AdminDashboard.jsx](/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation%20(2)/portal/client/src/pages/AdminDashboard.jsx:1739) использует `issueOrderTicket(...)`
- [portal/client/netlify.toml](/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation%20(2)/portal/client/netlify.toml:1) собирает redirects
- [portal/client/.netlify/netlify.toml](/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation%20(2)/portal/client/.netlify/netlify.toml:26) проксирует `/api/n8n/webhook-test/* -> /webhook/:splat`
- [portal/client/.netlify/netlify.toml](/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation%20(2)/portal/client/.netlify/netlify.toml:34) проксирует `/api/n8n/* -> /:splat`

Интерпретация:

- `drctApi` mutating methods ещё существуют как legacy helper surface, но текущие repo consumers create/issue уже migrated off;
- browser-to-n8n в portal остаётся только для read/search contours, не для mutating order flow;
- это больше не выглядит runtime blocker для `ALLOW_PUBLIC_DRCT_MUTATING_PROXY=false`.

### 3. Demo / static / showcase path

Статус: `repo runtime blocker removed, demo now uses sanctioned widget flow`

Evidence:

- [widget/demo/index.html](/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation%20(2)/widget/demo/index.html:18) теперь явно требует `agency_key` для end-to-end booking demo
- [widget/demo/booking.html](/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation%20(2)/widget/demo/booking.html:142) больше не вызывает legacy `/api/n8n/webhook*`; он инициализирует `widget/session`
- [widget/demo/booking.html](/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation%20(2)/widget/demo/booking.html:184) создаёт заказ через `/api/backend/widget/orders`
- [widget/demo/_redirects](/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation%20(2)/widget/demo/_redirects:1) теперь проксирует `/api/backend/*`, а не `/api/n8n/*`
- [portal/client/public/form.html](/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation%20(2)/portal/client/public/form.html:208) больше не advertises `orderEndpoint`

Интерпретация:

- demo/static surfaces внутри репо больше не выглядят причиной держать public mutating proxy открытым;
- end-to-end demo booking теперь требует explicit widget session context, что ближе к реальному supported contract.

### 4. Docs / test / ops-only references

Статус: `not runtime blockers, but migration debt`

Evidence:

- [backend/src/services/README.md](/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation%20(2)/backend/src/services/README.md:144)
- [backend/N8N_SETUP_GUIDE.md](/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation%20(2)/backend/N8N_SETUP_GUIDE.md:120)
- [backend/N8N_INTEGRATION.md](/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation%20(2)/backend/N8N_INTEGRATION.md:149)
- [backend/n8n_workflows/README.md](/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation%20(2)/backend/n8n_workflows/README.md:37)
- [backend/scripts/test_n8n.js](/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation%20(2)/backend/scripts/test_n8n.js:269)
- [backend/tests/services/n8n-client.test.js](/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation%20(2)/backend/tests/services/n8n-client.test.js:45)

Интерпретация:

- docs и scripts тоже нужно мигрировать, иначе через 2-4 недели команда снова начнёт использовать deprecated surface.

## Risk assessment

### Что уже можно утверждать

- `Hosted per-agency customer booking path` не показывает прямой зависимости от legacy create/issue/cancel webhook surface.
- `Portal/admin path` в текущем repo runtime больше не зависит от legacy mutating proxy.
- `Demo/static materials` в текущем repo runtime больше не зависят от legacy mutating proxy.

### Что пока нельзя утверждать

- нельзя доказать по одному репо, что никаких внешних интеграторов или ручных ops runbooks вне репо больше нет;
- поэтому финальный cutover лучше делать не одним коммитом, а через telemetry window и затем controlled flip.

## Recommended cutover sequence

1. Сначала оставить `ALLOW_PUBLIC_DRCT_MUTATING_PROXY=true`, но собрать telemetry по реальным вызовам.
2. Держать короткое telemetry window и проверить, что compat logs больше не показывают repo-owned browser consumers.
3. Обновить docs/runbooks/scripts, чтобы legacy path перестал фигурировать как "нормальный".
4. Проверить внешние/manual consumers вне репо.
5. Только после этого перевести production env в `ALLOW_PUBLIC_DRCT_MUTATING_PROXY=false`.

## Immediate next tasks

- `Backend`: логировать compat requests с `origin`, `referer`, `user-agent`, `consumer hint`.
- `Docs`: пометить legacy proxy как deprecated и указать целевые replacement flows.
- `Platform`: после telemetry window подготовить controlled flip `ALLOW_PUBLIC_DRCT_MUTATING_PROXY=false`.
