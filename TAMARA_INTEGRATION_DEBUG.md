# Tamara BNPL Integration — Debug Guide

**Проблема:** При клике на "Pay with Tamara" пользователь видит ошибку:
> `Tamara error: Something went wrong with us. We are notified.`

Это ответ от самого Tamara API (не от нашего бэкенда) при создании checkout session.

---

## 1. Структура проекта

```
backend/
  src/
    routes/tamara.js                  — Express роуты (/api/payments/tamara/*)
    services/tamara/
      client.js                       — HTTP клиент к Tamara API
      mapper.js                       — buildCheckoutPayload() — формирует тело запроса
      orderFlow.js                    — processApprovedOrder() — авторизация + выписка + capture
      webhook.js                      — валидация webhook JWT, логирование операций
    app.js                            — монтирует роутер: app.use('/api/payments', ...)

aviaframe-site/
  booking.html                        — виджет бронирования (фронтенд)
```

---

## 2. Доступы и переменные окружения

### Railway (бэкенд)
Все переменные настраиваются в Railway dashboard → проект `aviaframe` → Variables.

| Переменная | Описание | Текущее значение |
|---|---|---|
| `TAMARA_ENABLED` | Включить интеграцию | `true` |
| `TAMARA_ENV` | `sandbox` или `production` | `sandbox` |
| `TAMARA_BASE_URL` | Base URL API | `https://api-sandbox.tamara.co` |
| `TAMARA_API_TOKEN` | Bearer токен для API запросов | из Railway vars (секрет) |
| `TAMARA_MERCHANT_ID` | ID мерчанта | `3a3d337a-d9d3-4084-9787-65790c557cfc` |
| `TAMARA_NOTIFICATION_TOKEN` | Secret для валидации webhook JWT | sandbox: `0920d4a6-1384-4a8d-b595-10f642200e1b` |
| `TAMARA_PUBLIC_KEY` | Публичный ключ для виджета | sandbox: `9b260108-c133-4a24-8f3c-cd695c14de1b` |
| `TAMARA_SUCCESS_RETURN_URL` | URL возврата после успешной оплаты | `https://admin.aviaframe.com/payments/tamara/success` |
| `TAMARA_CANCEL_RETURN_URL` | URL при отмене | `https://admin.aviaframe.com/payments/tamara/cancel` |
| `TAMARA_FAILURE_RETURN_URL` | URL при ошибке | `https://admin.aviaframe.com/payments/tamara/failure` |
| `BACKEND_URL` | URL бэкенда (используется в webhook notification URL) | `https://peaceful-amazement-production-629f.up.railway.app` |

### Tamara Partner Portals
- **Sandbox:** https://partners-sandbox.tamara.co — логин `bm@consolidator.aero`
- **Production:** https://partners.tamara.co

### Tamara API Docs
- Sandbox API: `https://api-sandbox.tamara.co`
- Swagger/docs: https://docs.tamara.co

---

## 3. Флоу оплаты

```
[booking.html] — пользователь выбирает "Pay with Tamara"
    │
    ▼
POST /api/payments/tamara/checkout-session  { order_id, language }
    │
    ├─ Загружает order из Supabase
    ├─ Проверяет: currency === 'SAR', status IN ('pending','pending_payment')
    ├─ buildCheckoutPayload(order) → формирует JSON для Tamara API
    ├─ tamaraClient.createCheckoutSession(payload) → POST https://api-sandbox.tamara.co/checkout
    │
    │  [ОШИБКА ПРОИСХОДИТ ЗДЕСЬ — Tamara возвращает 4xx с "Something went wrong"]
    │
    ▼
Tamara возвращает: { checkout_id, checkout_url, order_id (tamara) }
    │
    ▼
[booking.html] → window.location.href = checkout_url (редирект на Tamara)
    │
    ▼
Пользователь проходит BNPL flow на сайте Tamara
    │
    ▼
Tamara → POST /api/payments/tamara/webhook?tamaraToken=...
    │
    ├─ Если approved → authoriseOrder → issueDrctTicket → captureOrder
    └─ Если declined/failed → updateStatus(cancelled)
    │
    ▼
[booking.html] опрашивает GET /api/payments/tamara/status/:orderId
```

---

## 4. Файл mapper.js — тело запроса к Tamara

**Файл:** `backend/src/services/tamara/mapper.js`

Функция `buildCheckoutPayload(order)` формирует следующий JSON:

```json
{
  "order_reference_id": "<AviaFrame order UUID>",
  "order_number": "<order_number>",
  "total_amount": { "amount": 1234.56, "currency": "SAR" },
  "description": "Flight booking K4H89D",
  "country_code": "SA",
  "payment_type": "PAY_BY_INSTALMENTS",
  "instalments": null,
  "locale": "en_US",
  "items": [{
    "reference_id": "<order UUID>",
    "type": "Digital",
    "name": "Flight AMS - JFK",
    "sku": "<order_number>",
    "quantity": 1,
    "unit_price": { "amount": "1234.56", "currency": "SAR" },
    "discount_amount": { "amount": "0.00", "currency": "SAR" },
    "tax_amount": { "amount": "0.00", "currency": "SAR" },
    "total_amount": { "amount": "1234.56", "currency": "SAR" }
  }],
  "consumer": {
    "first_name": "Customer",
    "last_name": "Customer",
    "phone_number": "512345678",
    "email": "user@example.com"
  },
  "billing_address": {
    "first_name": "Customer",
    "last_name": "Customer",
    "line1": "Saudi Arabia",
    "region": "Riyadh",
    "postal_code": "12345",
    "city": "Riyadh",
    "country_code": "SA",
    "phone_number": "512345678"
  },
  "shipping_address": { "...same as billing..." },
  "merchant_url": {
    "success": "https://admin.aviaframe.com/payments/tamara/success?order_id=...",
    "failure": "https://admin.aviaframe.com/payments/tamara/failure?order_id=...",
    "cancel": "https://admin.aviaframe.com/payments/tamara/cancel?order_id=...",
    "notification": "https://peaceful-amazement-production-629f.up.railway.app/api/payments/tamara/webhook"
  },
  "is_mobile": false,
  "risk_assessment": {}
}
```

### Важные замечания по payload:
- `total_amount.amount` — передаётся как **number** (не строка). Tamara может требовать строку с двумя знаками — это потенциальная причина ошибки.
- `consumer.first_name/last_name` — заполняется из `order.contact_first_name/last_name`. В таблице `orders` этих полей **может не быть** — тогда падает `"Customer"`. Нужно проверить.
- `phone_number` — нормализуется через `normalisePhone()`: убирает `+966` или `05`, оставляет 9 цифр. Если номер не саудовский (например, `+380...`) — подставляется `512345678`. Tamara **может отклонять** несаудовский номер.
- `notification` URL должен быть доступен с серверов Tamara — это Railway URL продакшн-бэкенда.

---

## 5. Вероятные причины ошибки "Something went wrong"

### Причина 1 — Неверный API токен (самая вероятная)
- Убедись, что `TAMARA_API_TOKEN` в Railway содержит **sandbox** токен, а не production.
- Sandbox API токен берётся из https://partners-sandbox.tamara.co → Settings → API Keys
- Проверить: в Railway Variables смотри значение `TAMARA_API_TOKEN` — должен начинаться с sandbox-токена

### Причина 2 — Несовпадение окружения
- `TAMARA_BASE_URL` = `https://api-sandbox.tamara.co` (sandbox)
- `TAMARA_API_TOKEN` должен быть от sandbox, не от production
- Если `TAMARA_API_TOKEN` — продакшн ключ, а `TAMARA_BASE_URL` — sandbox → 401/error

### Причина 3 — Формат `total_amount.amount`
Tamara API ожидает `amount` как **строку** `"1234.56"`, но в mapper.js передаётся **number** `1234.56`:
```js
total_amount: { amount: total, currency },  // total — number, не строка!
```
Во всех остальных полях используется `fmtAmt()` → строка, но в `total_amount` верхнего уровня — нет.
**Фикс:** изменить на `amount: fmtAmt(total)`.

### Причина 4 — `consumer.phone_number` не саудовский
Tamara работает только для SA. Если тестовый аккаунт зарегистрирован с `+380...` (украинский номер), `normalisePhone()` подставляет `512345678`. Это может вызвать `risk_assessment` отказ.

### Причина 5 — `instalments: null`
Tamara для `payment_type: "PAY_BY_INSTALMENTS"` ожидает конкретное количество инсталментов (`3` или `6`). Передача `null` может вызывать ошибку в некоторых конфигурациях мерчанта.
**Фикс:** попробовать `instalments: 3`.

### Причина 6 — Аккаунт мерчанта не активирован в sandbox
В https://partners-sandbox.tamara.co нужно убедиться, что:
- Merchant статус `Active`
- Настроен `notification_url` (webhook)
- Верифицирован email / завершена онбординг процедура

---

## 6. Как дебажить

### Шаг 1 — Смотреть Railway логи
```
railway logs --tail
```
При запросе checkout-session бэкенд логирует полный payload:
```
[tamara] checkout payload: { ... }
```
И в случае ошибки:
```
[tamara-client] createCheckoutSession failed 422: { "message": "..." }
```
Точный код и тело ответа от Tamara будут видны в логах.

### Шаг 2 — Проверить env vars в Railway
```
railway variables
```
Проверить: `TAMARA_API_TOKEN`, `TAMARA_BASE_URL`, `TAMARA_ENABLED`, `TAMARA_MERCHANT_ID`.

### Шаг 3 — Тест curl прямо к Tamara sandbox API
```bash
curl -s -X POST https://api-sandbox.tamara.co/checkout \
  -H "Authorization: Bearer <TAMARA_API_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "order_reference_id": "test-001",
    "order_number": "TEST001",
    "total_amount": { "amount": "100.00", "currency": "SAR" },
    "description": "Test",
    "country_code": "SA",
    "payment_type": "PAY_BY_INSTALMENTS",
    "instalments": 3,
    "locale": "en_US",
    "items": [{
      "reference_id": "item-1",
      "type": "Digital",
      "name": "Test Item",
      "sku": "SKU001",
      "quantity": 1,
      "unit_price": { "amount": "100.00", "currency": "SAR" },
      "discount_amount": { "amount": "0.00", "currency": "SAR" },
      "tax_amount": { "amount": "0.00", "currency": "SAR" },
      "total_amount": { "amount": "100.00", "currency": "SAR" }
    }],
    "consumer": {
      "first_name": "Test",
      "last_name": "User",
      "phone_number": "512345678",
      "email": "test@example.com"
    },
    "billing_address": {
      "first_name": "Test",
      "last_name": "User",
      "line1": "Saudi Arabia",
      "region": "Riyadh",
      "postal_code": "12345",
      "city": "Riyadh",
      "country_code": "SA",
      "phone_number": "512345678"
    },
    "shipping_address": {
      "first_name": "Test",
      "last_name": "User",
      "line1": "Saudi Arabia",
      "region": "Riyadh",
      "postal_code": "12345",
      "city": "Riyadh",
      "country_code": "SA",
      "phone_number": "512345678"
    },
    "merchant_url": {
      "success": "https://admin.aviaframe.com/payments/tamara/success",
      "failure": "https://admin.aviaframe.com/payments/tamara/failure",
      "cancel": "https://admin.aviaframe.com/payments/tamara/cancel",
      "notification": "https://peaceful-amazement-production-629f.up.railway.app/api/payments/tamara/webhook"
    },
    "is_mobile": false,
    "risk_assessment": {}
  }'
```

### Шаг 4 — Проверить `contact_first_name`/`contact_last_name` в orders
```sql
-- В Supabase SQL editor:
SELECT id, order_number, contact_first_name, contact_last_name, contact_phone, contact_email, currency, status
FROM orders
ORDER BY created_at DESC
LIMIT 5;
```
Если `contact_first_name` = `NULL` → mapper берёт `"Customer"` — это нормально.
Если `currency` ≠ `'SAR'` → роут вернёт ошибку `CURRENCY_NOT_SUPPORTED`.

### Шаг 5 — Тест через наш API эндпоинт
```bash
# Сначала создай тестовый order через booking.html
# Возьми order_id из Supabase
curl -s -X POST https://peaceful-amazement-production-629f.up.railway.app/api/payments/tamara/checkout-session \
  -H "Content-Type: application/json" \
  -d '{"order_id": "<UUID из orders таблицы>"}'
```

---

## 7. Таблицы Supabase (Tamara операции)

### `orders` (релевантные поля)
| Поле | Описание |
|---|---|
| `payment_provider` | `'tamara'` |
| `payment_provider_order_id` | Tamara order UUID |
| `payment_provider_status` | `tamara_checkout_created`, `tamara_approved`, `tamara_authorised`, `tamara_captured`, `tamara_failed`, `tamara_cancelled` |
| `payment_authorised_at` | Timestamp авторизации |
| `payment_captured_at` | Timestamp capture |
| `payment_cancelled_at` | Timestamp отмены |
| `payment_refunded_at` | Timestamp возврата |

### `payment_provider_events`
Все webhook события для idempotency:
```sql
SELECT * FROM payment_provider_events WHERE provider = 'tamara' ORDER BY created_at DESC LIMIT 20;
```

### `payment_provider_operations`
Все API вызовы (authorise, capture, cancel, refund):
```sql
SELECT operation_type, success, request_json, response_json, created_at
FROM payment_provider_operations
WHERE provider = 'tamara'
ORDER BY created_at DESC LIMIT 20;
```

---

## 8. Ключевые файлы и строки

| Файл | Строка | Описание |
|---|---|---|
| `backend/src/routes/tamara.js:18` | `POST /tamara/checkout-session` | Создание сессии |
| `backend/src/services/tamara/mapper.js:36` | `buildCheckoutPayload()` | Формирование payload |
| `backend/src/services/tamara/mapper.js:71` | `total_amount: { amount: total }` | **Потенциальный баг: number вместо string** |
| `backend/src/services/tamara/mapper.js:75` | `instalments: null` | **Потенциальный баг: может нужно 3** |
| `backend/src/services/tamara/client.js:26` | `createCheckoutSession()` | HTTP вызов к Tamara |
| `backend/src/services/tamara/orderFlow.js:11` | `processApprovedOrder()` | Authorise→Issue→Capture |
| `backend/src/services/tamara/webhook.js:11` | `validateWebhookToken()` | JWT валидация |
| `aviaframe-site/booking.html:474` | Tamara button handler | Фронтенд инициация |

---

## 9. Деплой после фикса

### Бэкенд (Railway)
```bash
cd backend
railway up --detach
```

### Фронтенд (Netlify, aviaframe.com)
```bash
cd aviaframe-site
netlify deploy --prod --site 618fac54-4ed4-4186-a8b9-aa028f6f0c8d --dir .
```

---

## 10. Приоритет проверок

1. **Railway логи** при реальной попытке оплаты — точное сообщение от Tamara API
2. **`TAMARA_API_TOKEN`** — sandbox vs production ключ
3. **`total_amount.amount`** — тип number vs string в `mapper.js:71`
4. **`instalments: null`** → попробовать `3`
5. **Статус мерчанта** в Tamara Partner Sandbox портале
