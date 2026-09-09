# AviaFrame — Agent B Work Brief

Дата: 2026-08-07

## Роль Agent B

Ты работаешь как `parallel cleanup + efficiency agent`.

Твоя задача:

- дочистить migration debt вокруг legacy DRCT mutating proxy;
- убрать из docs/scripts ложный сигнал, что legacy webhook still normal;
- проверить и улучшить low-risk Netlify / build efficiency;
- не затронуть production booking runtime.

## Что уже делает Agent A

`Agent A` сейчас ведет production-risk work:

- backend cutover readiness;
- security / webhook / auth / booking integrity;
- runtime-safe migration away from legacy mutating proxy;
- controlled preparation for future flip `ALLOW_PUBLIC_DRCT_MUTATING_PROXY=false`.

Ты не должен дублировать его работу и не должен менять его файлы.

## Твой scope

Ты работаешь только в двух потоках:

### 1. Legacy docs / runbooks / scripts cleanup

Нужно:

- найти места, где legacy mutating proxy описан как нормальный контракт;
- заменить это на:
  - `legacy / deprecated / compatibility-only`;
  - указать правильные replacement flows;
- убрать misleading examples, которые снова заведут команду в `/webhook/drct/order/*`.

### 2. Netlify / monorepo efficiency review

Нужно:

- проверить Netlify config и build scope;
- найти low-risk improvements без вмешательства в runtime-critical booking flow;
- если improvement безопасен и локален, можно внести;
- если improvement требует системного решения, оформить proposal doc, не ломая существующий flow.

## Что тебе запрещено трогать

Без отдельной синхронизации не меняй:

- `/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation (2)/backend/src/app.js`
- `/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation (2)/backend/src/config.js`
- `/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation (2)/backend/src/index.js`
- `/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation (2)/backend/src/middleware/auth.js`
- `/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation (2)/backend/src/middleware/requestGuards.js`
- `/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation (2)/backend/src/routes/orders.js`
- `/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation (2)/backend/src/routes/payments.js`
- `/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation (2)/backend/src/routes/widget.js`
- `/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation (2)/backend/src/routes/health.js`
- `/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation (2)/backend/src/services/drctDirectClient.js`
- `/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation (2)/backend/src/services/drctService.js`
- `/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation (2)/portal/client/src/App.jsx`
- `/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation (2)/portal/client/src/lib/supabase.js`
- `/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation (2)/portal/client/src/pages/AdminDashboard.jsx`
- `/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation (2)/widget/demo/booking.html`
- `/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation (2)/widget/demo/index.html`
- `/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation (2)/docs/20_PLATFORM_PLAN_HARDENING_REVIEW_AND_REMEDIATION_BACKLOG_2026-08-06.md`
- `/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation (2)/docs/21_DRCT_MUTATING_PROXY_CONSUMER_INVENTORY_2026-08-07.md`

Также запрещено:

- делать deploy;
- менять env vars;
- переключать feature flags;
- делать production flip;
- менять payment / booking runtime behavior;
- менять shared CI/build graph без отдельного согласования.

## Твои allowed files

Ты можешь работать здесь:

- `/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation (2)/backend/N8N_SETUP_GUIDE.md`
- `/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation (2)/backend/N8N_INTEGRATION.md`
- `/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation (2)/backend/src/services/README.md`
- `/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation (2)/backend/n8n_workflows/README.md`
- `/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation (2)/backend/scripts/test_n8n.js`
- `/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation (2)/N8N_PAYLOAD_FORMAT.md`
- `/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation (2)/TEST_SCENARIOS.md`
- `/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation (2)/FIX_SUMMARY.md`
- `/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation (2)/portal/client/netlify.toml`
- `/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation (2)/aviaframe-site/netlify.toml`
- новые docs files в `/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation (2)/docs/`, кроме `docs/20...` и `docs/21...`

## Твои цели по результату

### Goal A

Сделать так, чтобы инженер, открыв docs/scripts, больше не считал `/webhook/drct/order/create`, `/issue`, `/cancel` рекомендованным актуальным путем.

### Goal B

Сделать low-risk review Netlify/build inefficiency и либо:

- внести локальные безопасные улучшения;
- либо оформить точный proposal без рискованных правок.

## Какие replacement flows ты должен использовать в текстах

Вместо legacy mutating proxy ориентируй docs на такие surfaces:

- `POST /api/orders`
- `POST /api/orders/:orderId/issue`
- `POST /api/orders/:orderId/cancel`
- `POST /api/widget/session`
- `POST /api/widget/orders`

Важно:

- search path остается отдельной темой и не должен быть переписан наугад;
- не придумывай новые runtime contracts, которых нет в коде.

## Точные файлы, которые тебе нужно загрузить в контекст

### Обязательные файлы

1. `/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation (2)/docs/22_PARALLEL_EXECUTION_PROTOCOL_2026-08-07.md`
2. `/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation (2)/docs/20_PLATFORM_PLAN_HARDENING_REVIEW_AND_REMEDIATION_BACKLOG_2026-08-06.md`
3. `/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation (2)/docs/21_DRCT_MUTATING_PROXY_CONSUMER_INVENTORY_2026-08-07.md`
4. `/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation (2)/docs/23_AGENT_B_WORK_BRIEF_2026-08-07.md`

### Обязательные runtime-reference files read-only

Эти файлы нужны тебе только для понимания replacement target, не для редактирования:

1. `/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation (2)/backend/src/routes/orders.js`
2. `/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation (2)/backend/src/routes/widget.js`
3. `/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation (2)/portal/client/netlify.toml`
4. `/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation (2)/aviaframe-site/netlify.toml`

### Основные editable files

1. `/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation (2)/backend/N8N_SETUP_GUIDE.md`
2. `/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation (2)/backend/N8N_INTEGRATION.md`
3. `/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation (2)/backend/src/services/README.md`
4. `/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation (2)/backend/n8n_workflows/README.md`
5. `/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation (2)/backend/scripts/test_n8n.js`
6. `/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation (2)/N8N_PAYLOAD_FORMAT.md`
7. `/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation (2)/TEST_SCENARIOS.md`
8. `/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation (2)/FIX_SUMMARY.md`
9. `/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation (2)/portal/client/netlify.toml`
10. `/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation (2)/aviaframe-site/netlify.toml`

## Порядок работы

1. Прочитай coordination docs.
2. Прочитай inventory и backlog docs.
3. Сначала сделай docs/scripts cleanup.
4. Потом отдельно сделай Netlify/build efficiency review.
5. Если нужна unsafe change, не делай ее, а оформи proposal.

## Как именно синхронизироваться с Agent A

После первого meaningful chunk верни статус в таком формате:

```text
Area:
Files changed:
What changed:
What was intentionally not changed:
Verification run:
Open risks:
```

Перед финальным handoff верни:

```text
Summary:
Changed files:
Verification commands:
Remaining risks:
Needs Agent A follow-up:
```

## Обязательные проверки

### Если менялись только docs / markdown / scripts

Запусти:

- `git diff --check`
- `rg -n "drct/order/create|drct/order/issue|drct/order/cancel|/webhook/drct/order" <changed-files>`

### Если менялись Netlify configs или portal public assets

Запусти:

- `npm --prefix portal/client run build`
- `git diff --check`

### Если трогал backend scripts

Проверь:

- что не сломались import paths;
- что примеры endpoint’ов больше не противоречат новому target flow;
- что не появилось misleading runtime guidance.

## Что считается хорошим результатом

Хороший результат для твоего трека:

- docs и scripts больше не нормализуют legacy mutating proxy;
- Netlify review сделан конкретно, а не общими словами;
- нет изменений в booking-critical runtime;
- все проверки пройдены;
- Agent A не вынужден вручную разруливать твои runtime-side effects.

## Короткая формулировка задачи

Ты не чинишь booking runtime. Ты делаешь так, чтобы команда, docs и deploy surface больше не тянули систему назад в legacy proxy и лишние Netlify/build расходы.
