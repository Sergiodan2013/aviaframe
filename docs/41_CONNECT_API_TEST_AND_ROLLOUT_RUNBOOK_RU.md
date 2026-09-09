# AviaFrame Connect API: план выкладки и тестирования

Дата обновления: 2026-09-09  
Контракт: `1.0.0-alpha.3`  
Текущий статус: staging-база, backend и hosted super-admin UI развёрнуты; production activation остаётся отдельным этапом.

## 1. Что входит в alpha.3

- публичный поток `search -> price -> create order -> retrieve order`;
- изолированные sandbox/production API-клиенты и ключи;
- права `offers:read`, `orders:create`, `orders:read`;
- разрешённые каналы GDS, NDC и LCC;
- versioned pricing rules: процент + fixed amount по умолчанию, каналу,
  перевозчику или комбинации channel + carrier;
- quote integrity, точная decimal-проверка цены и обязательный idempotency key;
- opaque AviaFrame identifiers без выдачи DRCT credentials, DRCT IDs и supplier cost;
- super-admin интерфейс создания контрагента, ротации ключей, entitlements и публикации цен;
- публичный marketing page и developer guide.

Встроенный `Sandbox API tester` в Super Admin поддерживает:

- one-way и round trip с двумя обратными `slices`;
- ADT, CHD и INF с проверкой лимита 9 пассажиров и правила infant <= adult;
- economy, premium economy, business и first;
- `Search -> Reprice -> Create DRCT sandbox order`;
- визуальные предложения, Raw JSON с correlation ID и закрытый super-admin Price audit;
- разбор `supplier total + percentage markup + fixed markup = client sell price`.

Не входят: ticketing, cancellation, exchanges/refunds, webhooks, usage billing и B2C.

## 2. Порядок выкладки в test/staging

Порядок обязателен: база данных -> backend -> admin portal -> public site.

### Шаг 1. База данных

1. Сделать backup/snapshot test Supabase.
2. Применить миграции строго по порядку:
   - `backend/supabase/migrations/016_partner_api_foundation.sql`
   - `backend/supabase/migrations/017_partner_api_orders.sql`
   - `backend/supabase/migrations/018_partner_api_admin.sql`
   - `backend/supabase/migrations/019_security_hardening.sql`
3. Убедиться, что созданы таблицы Partner API и RPC:
   - `provision_partner_api_counterparty`
   - `publish_partner_pricing_version`
   - `create_partner_api_order`
   - `update_partner_api_order_state`
4. Убедиться, что RPC недоступны роли `public` и доступны только `service_role`.

### Шаг 2. Backend

1. Развернуть текущий backend с mounted prefix `/partner/v1` и admin routes
   `/admin/partner-api`.
2. Проверить staging secrets: Supabase URL/service role, DRCT base URL и DRCT credentials.
3. Проверить health endpoint и затем неавторизованный API-вызов. Ожидается `401`, а не `404`:

```bash
curl -i https://STAGING_BACKEND/partner/v1/offers/search \
  -H 'Content-Type: application/json' \
  --data '{}'
```

### Шаг 3. Admin portal

1. Собрать `portal/client` и развернуть только после шагов 1-2.
2. Войти пользователем с ролью `super_admin`.
3. Открыть `Admin -> Connect API`.
4. Убедиться, что обычный `admin` этой вкладки не видит и backend возвращает ему `403`.

### Шаг 4. Public test site

Развернуть содержимое `aviaframe-site` на `testenvavia.netlify.app`, затем проверить:

- `/` — блок двух продуктов White Label / Connect API;
- `/connect-api.html` — продуктовый API-лендинг;
- `/docs/` — developer documentation hub;
- `/docs/connect-api.html` — alpha.2 integration guide.

Не направлять этот deploy на linked site `aviaframe.com`: локальная папка сейчас связана с
production-проектом Netlify, а `testenvavia` имеет отдельный site id.

## 3. Сценарий приёмочного теста менеджером AviaFrame

### Создание контрагента

1. Нажать `New counterparty`.
2. Заполнить legal/trading name, страну, валюту расчётов и контакты.
3. Выбрать доступные GDS/NDC/LCC.
4. Указать default percentage и fixed amount.
5. Сохранить и сразу скопировать `af_test_...` ключ: raw key отображается один раз,
   в базе хранится только hash.

Ожидаемый результат: создаются counterparty, sandbox client, scopes, channel
entitlements, active sandbox pricing plan/version и credential.

### Ценообразование

1. Оставить обязательное правило `ANY + ANY`.
2. Добавить, например:
   - `NDC + ANY`: 3.5% + SAR 6;
   - `NDC + EK`: 2% + SAR 10;
   - `LCC + XY`: 5% + SAR 4.
3. Опубликовать новую pricing version.
4. Проверить, что предыдущая версия retired, а существующие quote сохраняют старый
   pricing snapshot.

### Ключи и доступ

1. Выпустить второй ключ, переключить тестовый consumer на него.
2. Отозвать первый ключ и проверить `401` с ним.
3. Поставить counterparty в `SUSPENDED` и проверить отказ доступа.
4. Вернуть `SANDBOX` для продолжения теста.

## 4. End-to-end API тест

Полные примеры запросов находятся в `docs/developer/getting-started.md` и
`docs/api/partner-openapi.yaml`.

1. `POST /partner/v1/offers/search` — получить `offer_id`, `price_quote_id`,
   commercial `price.total`.
2. `POST /partner/v1/offers/{offer_id}/price` — получить свежий quote.
3. `POST /partner/v1/orders` — передать свежий `price_quote_id`, точный
   `expected_total`, пассажиров и уникальный `Idempotency-Key`.
4. Повторить тот же запрос с тем же key — должен вернуться исходный ответ с
   `Idempotency-Replayed: true`, без второго заказа у DRCT.
5. Повторить key с другим body — ожидать `409 IDEMPOTENCY_CONFLICT`.
6. Изменить `expected_total` — ожидать `409 PRICE_MISMATCH` до вызова DRCT.
7. `GET /partner/v1/orders/{order_id}` — получить текущий статус.
8. Попробовать прочитать order ключом другого контрагента — ожидать `404`.
9. Смоделировать upstream timeout — ожидать `202 PENDING_RECONCILE`; новый order
   создавать нельзя, нужно опрашивать тот же `order_id`.

Во всех ответах проверить `X-Correlation-ID`; во внешнем payload не должно быть
DRCT IDs, DRCT credentials, supplier cost или внутренних pricing rules.

## 5. Go / no-go для production

До production activation обязательны:

- ticketing и post-booking scope либо явное коммерческое ограничение alpha;
- reconciliation worker для `PENDING_RECONCILE` и операционная очередь;
- capability matrix по channel/carrier/action;
- usage metering, invoice/settlement reports и credit limits;
- rate-limit storage, пригодный для нескольких backend instances;
- key rotation runbook, audit export и security review;
- load/soak test с DRCT sandbox;
- partner certification checklist и SLA/support escalation;
- отдельные реальные DNS/TLS endpoints для sandbox и production API;
- OpenAPI reference portal, Postman collection и changelog/deprecation policy.
