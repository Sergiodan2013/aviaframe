# ТЗ: Observability — логи, метрики, health checks

> **Для Code:** реализуй строго по этому документу.
> **Приоритет:** 🟡 Важный — без этого невозможно понять что происходит в production.
> **Зависимость:** реализовывать ПОСЛЕ рефакторинга из `refactoring-backend-structure.md`.

---

## Что сейчас

- Есть `/healthz` — возвращает 200
- Логи через `console.log` — неструктурированные, нет уровней, нет контекста
- Нет метрик запросов
- Нет алертинга
- Нет трекинга DRCT latency / error rate

## Что нужно

Три уровня: структурированные логи → метрики → health checks.

---

## Уровень 1: Структурированные логи (pino)

### Зависимость

```bash
npm install --save pino pino-http
```

### Создать `backend/src/lib/logger.js`

```js
const pino = require('pino');
const config = require('../config');

const logger = pino({
  level: config.logLevel || 'info',
  base: {
    app: config.appName,
    version: config.appVersion,
    env: config.nodeEnv,
  },
  // В production выводим JSON, в dev — красивый формат
  transport: config.nodeEnv !== 'production'
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined,
});

module.exports = logger;
```

### Подключить в app.js

```js
const pinoHttp = require('pino-http');
const logger = require('./lib/logger');

app.use(pinoHttp({
  logger,
  // Не логировать healthcheck
  autoLogging: { ignore: (req) => req.url === '/healthz' },
  customSuccessMessage: (req, res) => `${req.method} ${req.url} → ${res.statusCode}`,
  customErrorMessage: (req, res, err) => `${req.method} ${req.url} → ${res.statusCode}: ${err.message}`,
}));
```

### Использование в коде (заменить все console.log)

```js
const logger = require('../lib/logger');

// Вместо console.log:
logger.info({ tenant_id, order_id }, 'Order created');
logger.warn({ drct_status: 429 }, 'DRCT rate limit hit');
logger.error({ err, order_id }, 'DRCT issue failed');
```

### Обязательный контекст в каждом логе

- `tenant_id` / `agency_id` — всегда если есть
- `order_id` — для операций с заказами
- `correlation_id` — из заголовка `x-correlation-id`
- `drct_request_id` — из ответа DRCT

---

## Уровень 2: Метрики (prometheus-style)

### Зависимость

```bash
npm install --save prom-client
```

### Создать `backend/src/lib/metrics.js`

```js
const client = require('prom-client');

// Сброс дефолтных метрик (CPU, memory, event loop)
client.collectDefaultMetrics({ prefix: 'avf_' });

// HTTP запросы
const httpRequestDuration = new client.Histogram({
  name: 'avf_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.05, 0.1, 0.3, 0.5, 1, 2, 5],
});

// DRCT вызовы
const drctRequestDuration = new client.Histogram({
  name: 'avf_drct_request_duration_seconds',
  help: 'DRCT API call duration in seconds',
  labelNames: ['operation', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
});

const drctErrorsTotal = new client.Counter({
  name: 'avf_drct_errors_total',
  help: 'Total DRCT API errors',
  labelNames: ['operation', 'error_type'],
});

// Circuit breaker состояние
const circuitBreakerState = new client.Gauge({
  name: 'avf_circuit_breaker_state',
  help: 'Circuit breaker state: 0=closed, 1=open, 2=half-open',
  labelNames: ['service'],
});

// Очередь DRCT
const drctQueueSize = new client.Gauge({
  name: 'avf_drct_queue_size',
  help: 'Current DRCT request queue size',
});

module.exports = {
  client,
  httpRequestDuration,
  drctRequestDuration,
  drctErrorsTotal,
  circuitBreakerState,
  drctQueueSize,
};
```

### Добавить endpoint в health.js

```js
const { client } = require('../lib/metrics');

// GET /metrics — для Prometheus scraping
router.get('/metrics', async (req, res) => {
  // Защитить от внешнего доступа
  const token = req.headers['authorization']?.replace('Bearer ', '');
  if (token !== config.internalApiToken) {
    return res.status(401).end();
  }
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});
```

---

## Уровень 3: Улучшенный Health Check

### Обновить `routes/health.js`

```js
// GET /healthz — быстрая проверка (load balancer)
router.get('/healthz', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// GET /healthz/deep — полная проверка зависимостей
router.get('/healthz/deep', async (req, res) => {
  const checks = {};

  // Supabase
  try {
    await supabase.from('agencies').select('id').limit(1);
    checks.supabase = 'ok';
  } catch (e) {
    checks.supabase = 'error';
  }

  // n8n (опционально)
  try {
    await axios.get(`${config.n8nBaseUrl}/healthz`, { timeout: 3000 });
    checks.n8n = 'ok';
  } catch (e) {
    checks.n8n = 'degraded';
  }

  // Circuit breaker state
  checks.drct_circuit = drctCircuit.opened ? 'open' : 'closed';

  const allOk = checks.supabase === 'ok';
  res.status(allOk ? 200 : 503).json({
    status: allOk ? 'ok' : 'degraded',
    checks,
    timestamp: new Date().toISOString(),
  });
});
```

---

## Что логировать обязательно

| Событие | Уровень | Поля |
|---|---|---|
| HTTP запрос/ответ | info | method, url, status, duration_ms |
| DRCT вызов | info | operation, tenant_id, duration_ms, drct_status |
| DRCT ошибка | error | operation, tenant_id, error, drct_status |
| Circuit breaker open | error | service, reason |
| Rate limit hit (queue full) | warn | tenant_id, operation |
| Idempotency hit (повтор) | info | idempotency_key, agency_id |
| Order create/issue | info | order_id, agency_id, drct_order_id |
| Auth failure | warn | reason, ip |

---

## Порядок реализации

1. Установить `pino`, `pino-http`, `prom-client`
2. Создать `lib/logger.js`
3. Подключить `pino-http` в `app.js`
4. Заменить все `console.log/error/warn` на `logger.*` с контекстом
5. Создать `lib/metrics.js`
6. Добавить метрики в `drctQueue.js` и `drctCircuitBreaker.js`
7. Обновить `/healthz` → добавить `/healthz/deep`
8. Добавить `/metrics` endpoint

---

## Связанные документы

- `docs/drct-reliability.md` → circuit breaker метрики
- `docs/refactoring-backend-structure.md` → структура куда добавлять файлы
