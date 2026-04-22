# ТЗ: Рефакторинг backend/src/index.js

> **Для Code:** реализуй строго по этому документу.
> **Приоритет:** 🔴 Критический — это разблокирует тесты, circuit breaker, observability.

---

## Проблема

`backend/src/index.js` содержит **3558 строк** — все роуты, всю бизнес-логику, все хелперы в одном файле. Это "God File". Последствия:
- Невозможно писать юнит-тесты для отдельных модулей
- Merge конфликты при параллельной работе
- Невозможно добавить middleware к отдельным группам роутов
- Сложная локализация багов

## Целевая структура

```
backend/src/
├── index.js              ← только bootstrap: app setup, middleware, listen
├── app.js                ← express app + middleware registration (без listen)
├── config.js             ← вся конфигурация из env переменных
├── routes/
│   ├── index.js          ← регистрация всех роутеров
│   ├── health.js         ← GET /healthz, GET /api/info
│   ├── widget.js         ← POST /api/widget/session, POST /api/widget/orders
│   ├── orders.js         ← GET/PATCH /api/orders/*, issue, cancel
│   ├── agency.js         ← GET/PATCH /api/agency/me
│   ├── admin/
│   │   ├── index.js      ← регистрация admin роутеров
│   │   ├── agencies.js   ← GET/POST/PATCH/DELETE /api/admin/agencies/*
│   │   ├── invoices.js   ← /api/admin/invoices/*
│   │   ├── reports.js    ← /api/admin/reports/*
│   │   └── super-admins.js
│   ├── notifications.js  ← /api/notifications/*, /api/internal/notifications/*
│   ├── documents.js      ← /api/documents/*, /api/orders/:id/ticket-document
│   ├── payments.js       ← /api/payments/*
│   ├── support.js        ← /api/support/*
│   ├── webhooks.js       ← /api/webhooks/*
│   └── public.js         ← /public/search (без auth)
├── middleware/
│   ├── auth.js           ← JWT валидация, req.user
│   ├── idempotency.js    ← (уже существует, не трогать)
│   ├── multi-tenant-hardening.js ← (уже существует, не трогать)
│   └── error-handler.js  ← централизованный error handler
├── services/
│   ├── drctService.js    ← (уже существует)
│   ├── drctLogger.js     ← (уже существует)
│   ├── emailService.js   ← (уже существует)
│   ├── pdfService.js     ← (уже существует)
│   ├── n8nClient.js      ← (уже существует)
│   └── orderService.js   ← бизнес-логика заказов (вынести из index.js)
├── lib/
│   └── supabase.js       ← (уже существует)
└── utils/
    └── helpers.js        ← generateOrderNumber, generateInvoiceNumber, toIsoDate*, normalizeRole
```

---

## Шаги реализации

### Шаг 1 — Вынести конфигурацию

Создать `backend/src/config.js`:

```js
require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  host: process.env.HOST || 'localhost',
  nodeEnv: process.env.NODE_ENV || 'development',
  appName: process.env.APP_NAME || 'Aviaframe Backend',
  appVersion: process.env.APP_VERSION || '0.1.0',
  logLevel: process.env.LOG_LEVEL || 'info',
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  documentsBucket: process.env.DOCUMENTS_BUCKET || 'documents',
  supportInbox: process.env.SUPPORT_INBOX || '',
  widgetTokenSecret: process.env.WIDGET_TOKEN_SECRET || process.env.SUPABASE_ANON_KEY || 'aviaframe-widget-dev-secret',
  widgetTokenTtlSec: Number(process.env.WIDGET_TOKEN_TTL_SEC || 1800),
  internalApiToken: process.env.INTERNAL_API_TOKEN || '',
  emailWebhookSecret: process.env.EMAIL_WEBHOOK_SECRET || '',
};
```

### Шаг 2 — Вынести хелперы

Создать `backend/src/utils/helpers.js` — перенести туда:
- `toIsoDateStart(v)`
- `toIsoDateEnd(v)`
- `normalizeRole(role)`
- `generateOrderNumber()`
- `generateInvoiceNumber()`

### Шаг 3 — Вынести роуты

Для каждого файла в `routes/` использовать `express.Router()`.

Пример структуры `routes/orders.js`:

```js
const router = require('express').Router();
const supabase = require('../lib/supabase');
const { validateOrderBelongsToAgency } = require('../middleware/multi-tenant-hardening');

// GET /api/orders
router.get('/', async (req, res) => { ... });

// PATCH /api/orders/:orderId/status
router.patch('/:orderId/status', async (req, res) => { ... });

// POST /api/orders/:orderId/issue
router.post('/:orderId/issue', async (req, res) => { ... });

module.exports = router;
```

Регистрация в `routes/index.js`:

```js
const express = require('express');
const router = express.Router();

router.use('/api/orders',        require('./orders'));
router.use('/api/agency',        require('./agency'));
router.use('/api/admin',         require('./admin'));
router.use('/api/widget',        require('./widget'));
router.use('/api/notifications', require('./notifications'));
router.use('/api/documents',     require('./documents'));
router.use('/api/payments',      require('./payments'));
router.use('/api/support',       require('./support'));
router.use('/api/webhooks',      require('./webhooks'));
router.use('/public',            require('./public'));

module.exports = router;
```

### Шаг 4 — Создать app.js

```js
const express = require('express');
const config = require('./config');
const routes = require('./routes');
const { authMiddleware } = require('./middleware/auth');
const { multiTenantHardeningMiddleware } = require('./middleware/multi-tenant-hardening');
const errorHandler = require('./middleware/error-handler');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// CORS middleware
// Auth middleware (except /public, /healthz)
app.use(authMiddleware);
app.use(multiTenantHardeningMiddleware);
app.use(routes);
app.use(errorHandler);

module.exports = app;
```

### Шаг 5 — Упростить index.js

```js
const app = require('./app');
const config = require('./config');

app.listen(config.port, () => {
  console.log(`${config.appName} v${config.appVersion} listening on port ${config.port}`);
});
```

### Шаг 6 — Централизованный error handler

Создать `backend/src/middleware/error-handler.js`:

```js
module.exports = function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  console.error(`[ERROR] ${req.method} ${req.path}:`, err);

  res.status(status).json({
    error: err.code || 'INTERNAL_ERROR',
    message,
  });
};
```

---

## Что НЕ трогать

- `middleware/idempotency.js` — работает, не ломать
- `middleware/multi-tenant-hardening.js` — работает, не ломать
- `services/*` — только импортировать из новых мест
- `lib/supabase.js` — не трогать
- Все SQL миграции — не трогать

---

## Проверка после рефакторинга

```bash
npm run build          # должен проходить без ошибок
npm test               # все тесты должны пройти
curl /healthz          # должен вернуть 200
curl /api/orders       # должен работать с auth
```

---

## Связанные документы

- `decisions.md` → D-001 (монорепо структура)
- `docs/drct-reliability.md` → следующий шаг после рефакторинга
