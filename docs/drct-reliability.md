# ТЗ: Надёжность DRCT — Rate Limiting, Circuit Breaker, Retry

> **Для Code:** реализуй строго по этому документу.
> **Приоритет:** 🔴 Критический — без этого один surge трафика кладёт весь аккаунт DRCT.
> **Зависимость:** реализовывать ПОСЛЕ рефакторинга из `refactoring-backend-structure.md`.

---

## Проблемы которые решаем

1. **Нет rate limiting** — DRCT ограничен 1 rps. При 3+ агентствах одновременно — бан аккаунта.
2. **Нет circuit breaker** — если DRCT недоступен, запросы накапливаются и кладут backend.
3. **Нет retry** — временные ошибки DRCT (429, 503) ведут к потере запроса.

---

## Решение: три слоя защиты

```
Client → Backend → [Rate Limiter] → [Circuit Breaker] → [Retry] → DRCT API
```

---

## Слой 1: Rate Limiter (очередь запросов к DRCT)

### Что делать

Создать `backend/src/services/drctQueue.js` — очередь с ограничением 1 rps.

### Зависимость

```bash
npm install --save bottleneck
```

`bottleneck` — lightweight rate limiter, без Redis (для MVP достаточно in-process).

### Реализация

```js
// backend/src/services/drctQueue.js
const Bottleneck = require('bottleneck');

const limiter = new Bottleneck({
  minTime: 1000,        // минимум 1000ms между запросами = 1 rps
  maxConcurrent: 1,     // только 1 запрос одновременно
  reservoir: 10,        // burst: до 10 запросов в очереди
  reservoirRefreshAmount: 10,
  reservoirRefreshInterval: 10 * 1000, // обновление каждые 10 сек
});

// Обёртка — все DRCT-вызовы идут через неё
async function drctRequest(fn) {
  return limiter.schedule(fn);
}

// Метрики для observability
limiter.on('dropped', (info) => {
  console.error('[DRCT Queue] Request dropped — queue full:', info);
});

module.exports = { drctRequest, limiter };
```

### Использование в n8nClient.js

```js
const { drctRequest } = require('./drctQueue');

// Оборачиваем каждый DRCT-вызов:
async function drctSearch(payload) {
  return drctRequest(() => axios.post(DRCT_SEARCH_URL, payload, { headers }));
}
```

---

## Слой 2: Circuit Breaker

### Что делать

Создать `backend/src/services/drctCircuitBreaker.js`.

### Зависимость

```bash
npm install --save opossum
```

`opossum` — стандартный circuit breaker для Node.js.

### Реализация

```js
// backend/src/services/drctCircuitBreaker.js
const CircuitBreaker = require('opossum');

const CIRCUIT_OPTIONS = {
  timeout: 10000,              // 10 сек — если DRCT не ответил, считаем failure
  errorThresholdPercentage: 50, // открыть circuit если 50%+ запросов упали
  resetTimeout: 30000,         // попробовать снова через 30 сек
  volumeThreshold: 5,          // минимум 5 запросов перед анализом
};

function createDrctCircuit(fn) {
  const breaker = new CircuitBreaker(fn, CIRCUIT_OPTIONS);

  breaker.on('open', () => {
    console.error('[Circuit Breaker] DRCT circuit OPEN — requests blocked');
  });

  breaker.on('halfOpen', () => {
    console.warn('[Circuit Breaker] DRCT circuit HALF-OPEN — testing');
  });

  breaker.on('close', () => {
    console.info('[Circuit Breaker] DRCT circuit CLOSED — back to normal');
  });

  breaker.fallback(() => {
    throw { status: 503, code: 'DRCT_UNAVAILABLE', message: 'Flight provider is temporarily unavailable. Please try again in a moment.' };
  });

  return breaker;
}

module.exports = { createDrctCircuit };
```

### Использование в n8nClient.js

```js
const { createDrctCircuit } = require('./drctCircuitBreaker');
const { drctRequest } = require('./drctQueue');

// Создаём circuit breaker один раз при инициализации
const searchCircuit = createDrctCircuit(
  (payload) => drctRequest(() => axios.post(DRCT_SEARCH_URL, payload, { headers }))
);

async function drctSearch(payload) {
  return searchCircuit.fire(payload);
}
```

---

## Слой 3: Retry с exponential backoff

### Что делать

Создать `backend/src/utils/retry.js`.

### Без дополнительных зависимостей (нативный код)

```js
// backend/src/utils/retry.js

const RETRYABLE_STATUSES = [429, 502, 503, 504];

async function withRetry(fn, options = {}) {
  const {
    maxAttempts = 3,
    baseDelayMs = 500,
    maxDelayMs = 5000,
  } = options;

  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      const status = err.response?.status || err.status;
      const isRetryable = RETRYABLE_STATUSES.includes(status);

      if (!isRetryable || attempt === maxAttempts) {
        throw err;
      }

      // Respect Retry-After header from DRCT
      const retryAfter = err.response?.headers?.['retry-after'];
      const delayMs = retryAfter
        ? Number(retryAfter) * 1000
        : Math.min(baseDelayMs * Math.pow(2, attempt - 1), maxDelayMs);

      console.warn(`[Retry] Attempt ${attempt}/${maxAttempts} failed (${status}). Retrying in ${delayMs}ms`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  throw lastError;
}

module.exports = { withRetry };
```

### Использование

```js
const { withRetry } = require('../utils/retry');

async function drctSearch(payload) {
  return withRetry(
    () => searchCircuit.fire(payload),
    { maxAttempts: 3, baseDelayMs: 1000 }
  );
}
```

---

## Итоговая цепочка вызова

```
API Request
  → n8nClient.drctSearch(payload)
    → withRetry(...)                    // retry при 429/503
      → searchCircuit.fire(payload)     // circuit breaker
        → drctRequest(...)              // rate limiter 1 rps
          → axios.post(DRCT_URL, ...)   // реальный HTTP вызов
```

---

## Где применять

| Операция | Rate Limit | Circuit Breaker | Retry |
|---|---|---|---|
| Search (`/public/search`) | ✅ | ✅ | ✅ (max 3) |
| Price (`/offers/:id/price`) | ✅ | ✅ | ✅ (max 2) |
| Order Create | ✅ | ✅ | ❌ (idempotency отдельно) |
| Issue | ✅ | ✅ | ❌ (idempotency отдельно) |
| Cancel | ✅ | ✅ | ❌ |

> ⚠️ Order Create и Issue — **не ретраить автоматически**. Они защищены idempotency middleware. Повторный вызов — только явный от клиента с тем же Idempotency-Key.

---

## Проверка после реализации

```bash
# Симуляция недоступности DRCT — circuit breaker должен открыться
# после 5 ошибок подряд и вернуть 503 DRCT_UNAVAILABLE

# Симуляция burst — 5 параллельных запросов должны выполняться
# последовательно с 1 сек интервалом, не упасть
```

---

## Связанные документы

- `decisions.md` → D-002 (DRCT через адаптер)
- `decisions.md` → D-008 (idempotency)
- `docs/observability.md` → метрики circuit breaker
