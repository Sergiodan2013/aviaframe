# AviaFrame — Усиление платформенного плана и remediation backlog

Дата: 2026-08-06

## Зачем нужен этот документ

Предыдущий blueprint задал правильное направление, но его нужно усилить перед активной реализацией. После повторной сверки кода и приложенного ревью стало ясно: у AviaFrame есть не только structural gaps, но и несколько текущих security / payment / release-rigor проблем, которые нельзя откладывать "на потом".

Этот документ:

- усиливает исходный план доказанными находками;
- отделяет `confirmed fact` от `likely hypothesis` и `false / overstated`;
- добавляет `Workstream 0 — Security Hardening`;
- превращает план в backlog по спринтам с owner'ами, effort, зависимостями и acceptance criteria;
- сохраняет безопасную последовательность изменений без риска задеть текущий прод для агентств и внешний сайт.

## Что именно нужно улучшить в плане

### 1. Добавить нулевой этап до platform/growth работ

Причина: часть рисков уже находится в live-paths и config defaults, а не только в архитектурной "будущей" зоне.

### 2. Отделить demo/test/sandbox/live на уровне кода и release policy

Сейчас границы размыты: demo/test флаги и поведение частично проходят через пользовательские hosted-booking сценарии и backend metadata.

### 3. Считать hosted card flow scope-reduction проектом, а не просто UX-потоком

Сейчас полный PAN/CVC проходит через backend, поэтому это не "просто форма оплаты", а compliance и blast-radius вопрос.

### 4. Сдвинуть CRO/UX workstream после trust/safety fixes

Оптимизировать onboarding и conversion полезно, но сначала нужно убрать места, где trust разрушается security/config drift'ом, demo leakage и нестрогими booking/payment границами.

### 5. Добавить release-safety слой перед крупными рефакторами

Без более жестких build/release guardrails любое "улучшение архитектуры" увеличит шанс сломать production booking path.

## Evidence Review

| Статус | Наблюдение | Evidence | Почему это меняет план |
|---|---|---|---|
| Confirmed fact | Секрет widget token имеет опасный fallback на `SUPABASE_ANON_KEY` и потом на hardcoded dev secret | `backend/src/config.js:43-44` | Это прямой security finding, который требует отдельного нулевого workstream и secret-rotation плана |
| Confirmed fact | В лог при DRCT create failure попадают пассажирские данные из widget input и payload | `backend/src/routes/widget.js:782-797` | Нужна немедленная sanitation policy до дальнейших rollout'ов |
| Confirmed fact | `dry_run_issue` приходит из hosted booking metadata и затем влияет на payment/issuance flow | `aviaframe-site/booking.html:1025-1034`, `backend/src/routes/widget.js:487-489`, `backend/src/routes/widget.js:571`, `backend/src/routes/payments.js:383-423`, `backend/src/routes/payments.js:756-777` | Demo/live boundary сейчас недостаточно жесткая; это нельзя оставлять как "просто тестовый режим" |
| Confirmed fact | Moyasar webhook подпись проверяется только если secret вообще задан; если secret нет, проверка пропускается | `backend/src/routes/payments.js:98-102`, `backend/src/routes/payments.js:662-672` | Нужен fail-closed policy для webhooks и env readiness gate |
| Confirmed fact | Hosted booking по умолчанию включает `offer price flow` и `card fee preview` только для `testenvavia.netlify.app`, а не для обычного live host | `aviaframe-site/booking.html:235-249`, `aviaframe-site/booking.html:998-1004` | Проблема integrity/trust: live booking path может идти без обязательной финальной price confirmation |
| Confirmed fact | И portal, и hosted booking отправляют полный card payload в backend | `portal/client/src/components/PaymentScreen.jsx:224-237`, `backend/src/routes/payments.js:357-366`, `aviaframe-site/booking.html:1311-1318` | Это повышает compliance scope и требует отдельного scope-reduction решения |
| Confirmed fact | CORS разрешает любой `*.netlify.app` | `backend/src/app.js:102-117` | Это увеличивает поверхность несанкционированных frontend origins и требует tighten policy |
| Confirmed fact | Auth middleware автоматически создает/патчит profile и повышает пользователя до `agent`, если email совпал с `agencies.contact_email` | `backend/src/middleware/auth.js:84-141` | Это identity/authorization risk; рост self-serve усилит его |
| Confirmed fact | `/healthz` shallow и всегда "ok", deep checks доступны только по internal token | `backend/src/routes/health.js:10-18`, `backend/src/routes/health.js:39-67` | Плохая сигнализация для release safety и инцидентов |
| Confirmed fact | DRCT queue и circuit breaker process-local | `backend/src/services/drctQueue.js:1-16`, `backend/src/services/drctCircuitBreaker.js:1-18` | Horizontal scaling без shared coordination будет давать noisy incidents |
| Confirmed fact | Onboarding и support paths все еще завязаны на personal email fallback | `aviaframe-site/agency-onboard.html:239-240`, `aviaframe-site/agency-onboard.html:563`, `backend/src/config.js:43` | Это ломает operator abstraction и scale economics |
| Confirmed fact | Portal UI показывает `Test Mode ON/OFF` toggle всем, не только dev-only surface | `portal/client/src/App.jsx:70`, `portal/client/src/App.jsx:75`, `portal/client/src/App.jsx:1342-1354` | Это product/trust leakage; даже если mock реально dev-only, UI-сигнал плохой |
| Confirmed fact | Боевые UI-компоненты имеют fallback currency `UAH` | `portal/client/src/components/PassengerForm.jsx:132`, `portal/client/src/components/PaymentScreen.jsx:68`, `aviaframe-site/aviaframe-widget.js:1275` | Это trust и localization defect в customer-facing flow |
| Confirmed fact | Dev fixtures содержат hardcoded future dates для local flow | `portal/client/src/App.jsx:127-133` | Низкий прод-риск, но важно не путать dev fixture и live defaults |
| False / overstated | Route `/super-admins` якобы позволяет любому admin создать `super_admin` | `backend/src/routes/admin.js:373`, `backend/src/routes/admin.js:420`, `backend/src/routes/admin.js:439` | По коду route требует admin, но присваивает роль `admin`, не `super_admin`; этот finding не должен быть Stage 0 priority |

## Обновленная целевая последовательность workstreams

### Workstream 0 — Security Hardening and Live Boundary Cleanup

Цель: убрать текущие live-path слабости до крупных архитектурных и CRO-инициатив.

Фокус:

- secret hygiene и rotation;
- log/data sanitization;
- demo/test/live separation;
- webhook fail-closed;
- auth/profile auto-link review;
- CORS narrowing;
- support inbox / ops routing cleanup.

### Workstream 1 — Release Safety and Change Blast-Radius Reduction

Цель: сделать изменения безопаснее до крупных refactor/deploy waves.

Фокус:

- release checks;
- artifact parity;
- env readiness;
- smoke path matrix;
- deploy freeze rules для booking/payment surfaces.

### Workstream 2 — Booking and Payment Integrity

Цель: зафиксировать строгую модель `search -> price -> order -> pay -> issue`.

Фокус:

- mandatory live repricing;
- explicit status machine;
- idempotency boundaries;
- payment/issuance contract;
- async workflow durability.

### Workstream 3 — Shared Reliability Platform

Цель: подготовить безопасный scale.

Фокус:

- shared rate limit / queue / breaker state;
- deep health and synthetic probes;
- correlation IDs;
- incident visibility;
- graceful shutdown with draining.

### Workstream 4 — Netlify and Monorepo Cost Control

Цель: снизить шумные и дорогие deploy/build cycles.

Фокус:

- path-based build scope;
- site separation by artifact;
- preview policy;
- no-op deploy elimination;
- offloading heavy steps out of Netlify.

### Workstream 5 — Product Packaging and Go-Live Model

Цель: перестать продавать "true self-serve", пока фактически доминирует operator-assisted mode.

Фокус:

- четкое разделение `Hosted`, `Embedded`, `Enterprise`;
- явный go-live contract;
- publish model без ручной магии;
- realistic onboarding promise.

### Workstream 6 — UX / CRO / Conversion

Цель: улучшать conversion уже после укрепления trust и reliability.

Фокус:

- value proposition clarity;
- path to first live booking;
- trust moments в payment flow;
- operator-centric IA cleanup;
- onboarding friction reduction.

## Sprint Backlog

## Sprint 0 — Contain Current Risk

| Epic | Task | Owner | Effort | Dependency | Acceptance criteria |
|---|---|---|---|---|---|
| Security | Убрать fallback `widgetTokenSecret` на `SUPABASE_ANON_KEY` и hardcoded secret; ввести startup fail при отсутствии live secret | Backend | M | none | Live env не стартует без `WIDGET_TOKEN_SECRET`; выпущен rotation runbook |
| Security | Удалить пассажирские/документные данные из error logs и ввести centralized redaction policy | Backend | M | none | В `widget`/payment/DRCT logs отсутствуют passport/card/passenger payloads |
| Security | Сделать webhook verification fail-closed, если webhook secrets отсутствуют | Backend | S | none | `/api/webhooks/moyasar` возвращает 503/500 readiness error без секретов и не обрабатывает события |
| Security | Запретить user-controlled `dry_run_issue` в live booking path; разрешать demo mode только через server-side env gate | Backend + Frontend | M | none | Ни widget, ни hosted booking не могут включить dry-run через клиентский metadata payload |
| Security | Сузить CORS policy до explicit allowlist, убрать blanket `*.netlify.app` | Backend | S | none | Только явно разрешенные origins могут вызывать browser API |
| Security | Убрать personal email fallback из support/onboarding путей | Backend + Ops | S | none | `SUPPORT_INBOX`/ops inbox обязательны в live; onboarding form не шлет на personal mailbox |
| Auth | Остановить auto-promotion по `contact_email`; перевести agency link на explicit invite/claim flow | Backend | M | none | Новый пользователь не получает role/agency attachment только по совпадению email |
| Release | Зафиксировать live/demo/sandbox matrix для `portal`, `widget`, `hosted booking`, `public site` | Platform + Product | S | none | Существует единый env matrix doc и runtime assertions на каждом surface |

### Sprint 0 progress on 2026-08-07

- `Done`: sanitized DRCT/widget failure logs so raw passenger payloads no longer spill into error logs.
- `Done`: moved `dry_run_issue` to server-side host gating; client metadata alone no longer enables dry-run on arbitrary hosts.
- `Done`: made Moyasar webhook verification fail-closed when webhook secrets are missing.
- `Done`: narrowed CORS from blanket `*.netlify.app` to explicit trusted hosts plus `*.aviaframe.com`.
- `Done`: disabled contact-email auto-link by default behind `ENABLE_CONTACT_EMAIL_AUTO_LINK=false`.
- `Done`: added startup/config checks for weak widget token secret and missing production hygiene.
- `Done`: added in-memory throttling for public autocomplete, public search, widget session, widget price, widget order, and DRCT search proxy.
- `Partial`: introduced controlled guard for `/webhook/drct/order/create`, `/issue`, `/cancel` with compatibility mode and internal-token bypass. Next step is inventory of remaining consumers, then flip `ALLOW_PUBLIC_DRCT_MUTATING_PROXY=false`.
- `Done`: completed repo inventory of mutating proxy consumers in [21_DRCT_MUTATING_PROXY_CONSUMER_INVENTORY_2026-08-07.md](/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation%20(2)/docs/21_DRCT_MUTATING_PROXY_CONSUMER_INVENTORY_2026-08-07.md).
- `Done`: migrated portal ticket issuance from browser-to-legacy webhook path to protected backend route `/api/orders/:orderId/issue`.
- `Done`: added protected backend cancel route `/api/orders/:orderId/cancel` as the target replacement for portal/demo legacy cancel flows.
- `Done`: migrated portal order creation away from `drctApi.createOrder -> /api/n8n/webhook/drct/order/create` to protected backend route `POST /api/orders`, with DRCT reservation happening server-side before payment step.
- `Partial`: portal no longer depends on legacy mutating order create/issue/cancel webhook paths; remaining browser-to-n8n dependency in portal is now read/search-oriented and can be separated later without blocking `ALLOW_PUBLIC_DRCT_MUTATING_PROXY=false`.
- `Done`: cleaned repo-owned demo/static mutating consumers:
  `widget/demo/booking.html` now uses `widget/session -> /api/backend/widget/orders`,
  `widget/demo/_redirects` no longer proxies `/api/n8n/*`,
  `portal/client/public/form.html` no longer advertises legacy `orderEndpoint`.
- `Open`: remove widget token secret fallback entirely and enforce hard startup fail in live once secret rollout is ready.
- `Open`: replace contact-email linking with explicit invite/claim flow instead of guarded legacy path.

## Sprint 1 — Make Releases Safer

| Epic | Task | Owner | Effort | Dependency | Acceptance criteria |
|---|---|---|---|---|---|
| Release Safety | Ввести env readiness checks для secrets, webhook config, payment mode, document bucket, ops inbox | Backend + Platform | M | Sprint 0 security tasks | Preflight check падает до deploy/promote, если env incomplete |
| Release Safety | Расширить release gate: booking/payment smoke path, widget artifact parity, portal build, hosted page consistency | Platform | M | existing `check:release` groundwork | CI блокирует релиз при drift в widget artifacts или невалидном booking path |
| Integrity | Включить mandatory live repricing вне зависимости от host regex; live override только server-side | Backend + Frontend | M | Sprint 0 dry-run cleanup | Любой online/tamara booking проходит финальную price confirmation |
| Integrity | Описать и внедрить explicit order/payment/issuance status transitions | Backend | L | repricing decision | Есть единая status table, guard clauses и tests на illegal transitions |
| Observability | Добавить correlation ID сквозь public/widget/payment/webhook/DRCT flow | Backend | M | none | По одному booking можно связать search, order, payment, issue и email |
| Ops | Усилить `/healthz` и добавить synthetic probes на booking-critical path | Backend + Platform | M | none | Monitoring различает app-up и booking-capable |
| Frontend Trust | Убрать `Test Mode` UI из non-dev portal build и убрать `UAH` боевые fallback'и | Portal | S | none | В продовом UI нет test affordances и некорректной валюты по умолчанию |

## Sprint 2 — Durable Platform and Cost Control

| Epic | Task | Owner | Effort | Dependency | Acceptance criteria |
|---|---|---|---|---|---|
| Reliability | Вынести queue / breaker / idempotency coordination в shared store | Backend + Platform | L | Sprint 1 observability | Horizontal scaling не ломает DRCT throttling и breaker semantics |
| Reliability | Исправить graceful shutdown / draining behavior вокруг async payment/issuance work | Backend | M | shared workflow plan | Остановка инстанса не рвет paid-but-not-issued path |
| Payments | Запустить scope-reduction проект: убрать прохождение PAN/CVC через backend или формально оформить card-data boundary | Backend + Payments + Security | XL | Sprint 0 containment | Карточные данные либо токенизируются на стороне gateway, либо scope formally documented and controlled |
| Netlify | Разделить build scope по site/app path и отключить no-op preview deploys | Platform | M | release matrix | Изменение docs/backend/widget не триггерит лишние site builds |
| Netlify | Вынести тяжелые сборки/проверки из Netlify в CI artifact pipeline | Platform | M | path scoping | Netlify выполняет только site-specific publish steps |
| Product | Формализовать 3 deployment modes: `Hosted Managed`, `Embedded`, `Enterprise Custom` | Product + Founder | M | release matrix | Pricing/site/onboarding говорят правду о каждом mode |
| UX/CRO | Пересобрать path `lead -> onboarding -> publish -> first live booking` под реальный operating model | Product + Design | L | packaging clarification | Пользователь понимает next step без founder/operator chat |

## Sprint 3 — Growth Only After Trust

| Epic | Task | Owner | Effort | Dependency | Acceptance criteria |
|---|---|---|---|---|---|
| CRO | Переписать positioning на сайте под реальные deployment modes | Product + Marketing | M | Sprint 2 packaging | Landing не обещает self-serve там, где продукт его еще не дает |
| CRO | Улучшить payment trust layer: fee transparency, final price confirmation, secure payment explanation | Product + Frontend | M | Sprint 1 integrity | Drop-off на payment step снижается без роста support tickets |
| UX | Упростить agency onboarding IA и publish checklist | Portal + Product | M | Sprint 2 packaging | Agency manager реально может пройти onboarding без ручного сопровождения |

## Что не стоит делать прямо сейчас

- Не делать большой monorepo refactor до закрытия `Workstream 0`.
- Не масштабировать per-agency hosted deploy model, пока не автоматизированы env validation, publish rules и cost controls.
- Не усиливать paid acquisition / conversion experiments, пока в live path остаются demo/live boundary defects.
- Не включать horizontal scaling DRCT/payment workers без shared coordination state.

## Safe Change Framework

1. Сначала containment.
2. Потом release safety.
3. Потом booking/payment integrity.
4. Потом shared reliability.
5. Потом Netlify efficiency.
6. Потом packaging и UX/CRO acceleration.

Обязательные правила выполнения:

- Любое изменение в `booking`, `payments`, `widget`, `agency-site-assets`, `portal checkout` идет через smoke matrix.
- Любое изменение env/config сопровождается readiness assertion, а не только документацией.
- Любой demo/test path должен быть server-authorized, а не client-selectable.
- Любая новая growth-фича не должна увеличивать compliance или support burden без owner'а и метрики.

## Финальный вывод

Главное улучшение плана: AviaFrame сейчас нельзя лечить только архитектурой и CRO. Перед platform scale нужен отдельный слой containment и live-boundary cleanup.

Если формулировать жестко:

- AviaFrame ближе к `operator-assisted platform with partially self-serve surfaces`, чем к `true self-serve SaaS`.
- Главный риск роста сейчас не "нехватка фич", а `weak boundaries`: demo/live, auth/tenant, card/backend, env/release.
- Самый правильный следующий шаг не "еще один deploy" и не "еще один UX polish", а `Sprint 0 security + boundary hardening`, затем `Sprint 1 release/integrity`.

Именно в таком порядке рост начнет уменьшать unit cost и incident rate, а не увеличивать их одновременно.
