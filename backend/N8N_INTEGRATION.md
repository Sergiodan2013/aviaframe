# ✅ Интеграция n8n для работы с DRCT API

**Дата:** 2026-01-26
**Статус:** ✅ Готово к настройке
**Подход:** Гибридный (Backend + n8n)

---

## 🎯 Обзор архитектуры

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Client    │─────▶│   Backend   │─────▶│     n8n     │─────▶│  DRCT API   │
│  (Widget)   │      │   Express   │      │  Workflow   │      │  Provider   │
└─────────────┘      └─────────────┘      └─────────────┘      └─────────────┘
                           │                      │
                           │                      │
                           ▼                      ▼
                     ┌─────────────┐      ┌─────────────┐
                     │  Supabase   │      │   Logs &    │
                     │  Database   │      │  Analytics  │
                     └─────────────┘      └─────────────┘
```

### Поток данных:

1. **Client → Backend**: Запрос на поиск/бронирование
2. **Backend → n8n**: Отправка через webhook с correlation ID
3. **n8n → DRCT**: Обработка, трансформация, вызов DRCT API
4. **DRCT → n8n**: Ответ от провайдера
5. **n8n → Backend**: Возврат результата
6. **Backend → Database**: Логирование в `drct_request_logs`
7. **Backend → Client**: Финальный ответ

---

## ✅ Что уже сделано

### 1. **n8nClient.js** - Универсальный клиент
- ✅ Отправка POST запросов к n8n webhooks
- ✅ Retry логика (2 попытки по умолчанию)
- ✅ Timeout protection (30s)
- ✅ Correlation ID для трассировки
- ✅ Автоматическое логирование всех запросов

### 2. **drctLogger.js** - Логирование
- ✅ Запись в таблицу `drct_request_logs`
- ✅ Автоматическое удаление PII (sanitization)
- ✅ Расчет latency
- ✅ Связывание с tenant_id и booking_id

### 3. **Переменные окружения (.env)**
- ✅ `N8N_WEBHOOK_URL` - Base URL для n8n
- ✅ `N8N_TIMEOUT_MS` - Timeout запросов
- ✅ `N8N_RETRY_ATTEMPTS` - Количество повторов
- ✅ `N8N_RETRY_DELAY_MS` - Задержка между retry

### 4. **Примеры использования**
- ✅ [src/examples/search-with-n8n.js](src/examples/search-with-n8n.js)
- ✅ [src/services/README.md](src/services/README.md)

---

## 🚀 Следующие шаги: Настройка n8n

### Шаг 1: Установка n8n

#### Вариант A: Docker (рекомендуется)

```bash
# Создать docker-compose.yml для n8n
docker run -d \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

#### Вариант B: npm (локально)

```bash
npm install -g n8n
n8n start
```

n8n будет доступен на `http://localhost:5678`

### Шаг 2: Создать workflows в n8n

Создайте следующие workflows с webhooks:

#### 1. **DRCT Search Workflow**

**Webhook path:** `/webhook/drct/search`

**Nodes:**
1. **Webhook** (POST) - принимает параметры поиска
2. **Set Node** - подготовка параметров для DRCT
3. **HTTP Request** - вызов DRCT API `POST /offers/search`
4. **Function** - трансформация ответа
5. **Respond to Webhook** - возврат результата

**Пример конфигурации:**

```json
{
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "drct/search",
        "method": "POST"
      }
    },
    {
      "name": "DRCT Search",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "={{$env.DRCT_API_BASE_URL}}/offers/search",
        "method": "POST",
        "authentication": "genericCredentialType",
        "headers": {
          "Authorization": "Bearer {{$env.DRCT_BEARER_TOKEN}}",
          "Content-Type": "application/json"
        },
        "body": {
          "origin": "={{$json.origin}}",
          "destination": "={{$json.destination}}",
          "depart_date": "={{$json.depart_date}}",
          "return_date": "={{$json.return_date}}",
          "adults": "={{$json.adults}}",
          "cabin_class": "={{$json.cabin_class}}"
        }
      }
    }
  ]
}
```

#### 2. **DRCT Price Workflow**

**Webhook path:** `/webhook/drct/price`

Аналогично search, но вызывает `POST /offers/price`

#### 3. **DRCT Order Create Workflow** ⚠️ DEPRECATED

> **DEPRECATED** — `/webhook/drct/order/create` — legacy mutating proxy, выводится из эксплуатации.
> Замена: `POST /api/orders` (требует auth)

**Webhook path:** `/webhook/drct/order/create`

**Особенности:**
- Валидация данных пассажиров
- Генерация idempotency key
- Rate limiting (1 RPS для DRCT)

#### 4. **DRCT Issue Workflow** ⚠️ DEPRECATED

> **DEPRECATED** — `/webhook/drct/order/issue` — legacy mutating proxy, выводится из эксплуатации.
> Замена: `POST /api/orders/:orderId/issue` (требует auth-токен staff/admin)

**Webhook path:** `/webhook/drct/order/issue`

Вызывает `POST /orders/{id}/issue`

#### 5. **DRCT Cancel Workflow** ⚠️ DEPRECATED

> **DEPRECATED** — `/webhook/drct/order/cancel` — legacy mutating proxy, выводится из эксплуатации.
> Замена: `POST /api/orders/:orderId/cancel` (требует auth-токен staff/admin)

**Webhook path:** `/webhook/drct/order/cancel`

Вызывает `POST /orders/{id}/cancel`

### Шаг 3: Настроить переменные окружения в n8n

В n8n Settings → Variables добавьте:

```
DRCT_API_BASE_URL=https://api.sandbox.drct.example/v1
DRCT_BEARER_TOKEN=your_real_drct_token_here
```

### Шаг 4: Обновить .env в backend

```bash
# Замените на реальный URL вашего n8n
N8N_WEBHOOK_URL=http://localhost:5678/webhook
```

Если n8n на другом сервере:
```bash
N8N_WEBHOOK_URL=https://n8n.yourdomain.com/webhook
```

---

## 📋 Преимущества гибридного подхода

### ✅ Плюсы

1. **Визуальная настройка**
   - Логику интеграции можно менять без перезапуска backend
   - Удобно для бизнес-пользователей

2. **Быстрое прототипирование**
   - Можно быстро протестировать разные подходы
   - Легко добавить новые endpoints

3. **Встроенные фичи n8n**
   - Rate limiting
   - Retry logic
   - Error handling
   - Webhooks & cron jobs
   - Трансформация данных

4. **Мониторинг**
   - Визуальное отображение выполнения workflows
   - Логи всех запросов в n8n
   - Debugging с пошаговым выполнением

5. **Гибкость**
   - Легко добавить очереди (Bull Queue)
   - Кеширование (Redis)
   - Дополнительные интеграции (Email, Slack)

### ⚠️ Минусы и как их решить

1. **Зависимость от n8n**
   - **Решение**: Добавить fallback на прямой вызов DRCT
   - **Решение**: Мониторинг здоровья n8n (`/api/n8n/health`)

2. **Дополнительная задержка**
   - **Оценка**: +10-50ms на network hop
   - **Решение**: Развернуть n8n на том же сервере

3. **Сложность debugging**
   - **Решение**: Correlation ID в каждом запросе
   - **Решение**: Логирование в обеих системах

4. **Еще одна система для мониторинга**
   - **Решение**: Health checks
   - **Решение**: Alerts при недоступности

---

## 🔍 Примеры использования

### 1. Поиск авиабилетов

```javascript
const n8nClient = require('./services/n8nClient');

app.post('/api/search', async (req, res) => {
  const { origin, destination, depart_date, adults } = req.body;

  const result = await n8nClient.drctSearch({
    origin,
    destination,
    depart_date,
    adults
  }, tenantId);

  if (!result.success) {
    return res.status(500).json({ error: result.error });
  }

  res.json({
    offers: result.data.offers,
    correlation_id: result.correlationId
  });
});
```

### 2. Проверка здоровья n8n

```javascript
app.get('/api/n8n/health', async (req, res) => {
  const health = await n8nClient.healthCheck();
  res.json(health);
});
```

### 3. Fallback на прямой вызов

```javascript
async function searchWithFallback(params, tenantId) {
  // Попробовать через n8n
  const result = await n8nClient.drctSearch(params, tenantId);

  if (result.success) {
    return result;
  }

  // Fallback на прямой вызов DRCT
  console.warn('n8n unavailable, using direct DRCT call');
  return await directDRCTSearch(params, tenantId);
}
```

---

## 🔐 Безопасность

### 1. Не храните DRCT токены в коде
✅ Используйте переменные окружения в n8n
✅ Используйте секреты менеджер (Vault, AWS Secrets)

### 2. Sanitize PII перед логированием
✅ Автоматически в `drctLogger.js`
✅ Настройте также в n8n workflows

### 3. Rate limiting
✅ Реализуйте в n8n (1 RPS для offers_search)
✅ Добавьте очередь для запросов

### 4. Аутентификация n8n webhooks
```javascript
// В n8n workflow добавьте проверку
if ($json.headers['x-api-key'] !== process.env.WEBHOOK_SECRET) {
  throw new Error('Unauthorized');
}
```

---

## 📊 Мониторинг и Логирование

### Что логируется в Supabase

Таблица `drct_request_logs` содержит:
- ✅ Correlation ID (трассировка)
- ✅ Request/Response (sanitized)
- ✅ Latency (ms)
- ✅ Status code
- ✅ Error messages
- ✅ Tenant ID & Booking ID

### Запросы для мониторинга

**Средний latency за 24 часа:**
```sql
SELECT
  request_type,
  AVG(latency_ms) as avg_latency,
  COUNT(*) as total_requests
FROM drct_request_logs
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY request_type;
```

**Error rate:**
```sql
SELECT
  DATE(created_at) as date,
  COUNT(*) as total,
  COUNT(CASE WHEN status_code >= 400 THEN 1 END) as errors,
  ROUND(100.0 * COUNT(CASE WHEN status_code >= 400 THEN 1 END) / COUNT(*), 2) as error_rate
FROM drct_request_logs
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

---

## 🧪 Тестирование

### 1. Проверка n8n доступности

```bash
curl http://localhost:5678/webhook/health
```

### 2. Тестовый поиск через n8n

```bash
curl -X POST http://localhost:5678/webhook/drct/search \
  -H "Content-Type: application/json" \
  -d '{
    "origin": "DXB",
    "destination": "LHR",
    "depart_date": "2026-03-15",
    "adults": 2
  }'
```

### 3. Тест через backend

```bash
curl -X POST http://localhost:3000/api/search-with-n8n \
  -H "Content-Type: application/json" \
  -d '{
    "origin": "DXB",
    "destination": "LHR",
    "depart_date": "2026-03-15",
    "adults": 2
  }'
```

---

## 🎯 Рекомендации

### ✅ Делайте

1. **Используйте correlation ID** - для трассировки запросов
2. **Логируйте все** - в обеих системах (backend + n8n)
3. **Добавьте health checks** - мониторьте доступность n8n
4. **Используйте retry logic** - уже встроен в n8nClient
5. **Sanitize PII** - перед логированием

### ❌ Не делайте

1. **Не храните DRCT токены в коде** - используйте .env
2. **Не игнорируйте ошибки** - обрабатывайте корректно
3. **Не забывайте про timeouts** - 30s по умолчанию
4. **Не логируйте сырые PII** - используйте sanitization
5. **Не перегружайте DRCT** - соблюдайте rate limits

---

## 📚 Полезные ссылки

- [n8n Documentation](https://docs.n8n.io/)
- [n8n Workflow Examples](https://n8n.io/workflows)
- [DRCT API Documentation](https://docs.drct.example)
- [Backend Services README](src/services/README.md)
- [Example Integration](src/examples/search-with-n8n.js)

---

## 🆘 Troubleshooting

### Проблема: n8n недоступен

```
Error: N8N_REQUEST_FAILED - fetch failed
```

**Решение:**
1. Проверьте что n8n запущен: `docker ps` или `curl http://localhost:5678`
2. Проверьте `N8N_WEBHOOK_URL` в .env
3. Проверьте firewall/network

### Проблема: Timeout

```
Error: Request timed out after 30000ms
```

**Решение:**
1. Увеличьте `N8N_TIMEOUT_MS` в .env
2. Оптимизируйте workflow в n8n
3. Проверьте производительность DRCT API

### Проблема: 404 в n8n

```
Error: Webhook /drct/search not found
```

**Решение:**
1. Проверьте что workflow активирован в n8n
2. Проверьте правильность webhook path
3. Проверьте метод (должен быть POST)

---

## ✅ Чек-лист готовности

### Backend
- [x] n8nClient.js создан
- [x] drctLogger.js создан
- [x] N8N_WEBHOOK_URL в .env
- [x] Примеры использования готовы

### n8n (TODO)
- [ ] n8n установлен и запущен
- [ ] Создан workflow для search
- [ ] Создан workflow для price
- [ ] Создан workflow для order/create
- [ ] Создан workflow для order/issue
- [ ] Создан workflow для order/cancel
- [ ] DRCT credentials настроены
- [ ] Workflows протестированы

### Тестирование (TODO)
- [ ] Health check работает
- [ ] Тестовый поиск проходит
- [ ] Логирование работает
- [ ] Error handling проверен
- [ ] Retry logic протестирован

---

**Статус:** ✅ Backend готов, ожидается настройка n8n workflows
**Последнее обновление:** 2026-01-26
