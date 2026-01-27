# Backend Services

Эта папка содержит бизнес-логику и интеграции с внешними сервисами.

## 📁 Файлы

### n8nClient.js
Универсальный клиент для работы с n8n workflows через webhooks.

**Основные функции:**
- `sendRequest()` - Отправка запроса к n8n webhook
- `drctSearch()` - Поиск авиабилетов через DRCT
- `drctPrice()` - Получение цены предложения
- `drctCreateOrder()` - Создание заказа
- `drctIssue()` - Выпуск билетов
- `drctCancel()` - Отмена заказа
- `healthCheck()` - Проверка доступности n8n

**Возможности:**
- Автоматические retry при ошибках сети
- Timeout protection (30s по умолчанию)
- Correlation ID для трассировки запросов
- Логирование всех запросов в БД
- Обработка различных типов ошибок

### drctLogger.js
Сервис для логирования всех взаимодействий с DRCT API в таблицу `drct_request_logs`.

**Основные функции:**
- `logDRCTRequest()` - Запись лога в БД
- `sanitizePayload()` - Удаление PII из payload
- `generateCorrelationId()` - Генерация correlation ID

**Функции безопасности:**
- Автоматическое удаление PII (паспорта, email, телефоны)
- Маскирование чувствительных данных
- Расчет latency
- Связывание с booking_id и tenant_id

---

## 🚀 Примеры использования

### 1. Поиск авиабилетов

```javascript
const n8nClient = require('./services/n8nClient');

// Поиск DXB → LHR
const result = await n8nClient.drctSearch({
  origin: 'DXB',
  destination: 'LHR',
  depart_date: '2026-03-15',
  return_date: '2026-03-22',
  adults: 2,
  cabin_class: 'economy'
}, tenantId);

if (result.success) {
  console.log('Offers:', result.data.offers);
  console.log('Correlation ID:', result.correlationId);
} else {
  console.error('Error:', result.error);
}
```

### 2. Создание заказа

```javascript
const result = await n8nClient.drctCreateOrder({
  offer_id: 'offer-123',
  passengers: [
    {
      first_name: 'John',
      last_name: 'Doe',
      date_of_birth: '1990-01-01',
      passport_number: 'AB123456'
    }
  ],
  contact: {
    email: 'john@example.com',
    phone: '+971501234567'
  }
}, tenantId, bookingId);

if (result.success) {
  console.log('Order ID:', result.data.order_id);
} else {
  console.error('Failed to create order:', result.error);
}
```

### 3. Проверка здоровья n8n

```javascript
const health = await n8nClient.healthCheck();
console.log('n8n status:', health.status); // healthy, unhealthy, unavailable
```

### 4. Ручное логирование

```javascript
const { logDRCTRequest, generateCorrelationId } = require('./services/drctLogger');

const correlationId = generateCorrelationId();
const requestTime = Date.now();

// ... выполнить запрос ...

await logDRCTRequest({
  tenantId: 'uuid-here',
  requestType: 'offers_search',
  correlationId,
  requestTime,
  responseTime: Date.now(),
  requestPayload: { origin: 'DXB', destination: 'LHR' },
  responsePayload: { offers: [] },
  statusCode: 200
});
```

---

## ⚙️ Конфигурация (.env)

```bash
# n8n Workflow Integration
N8N_WEBHOOK_URL=http://localhost:5678/webhook  # Base URL n8n webhooks
N8N_TIMEOUT_MS=30000                            # Request timeout (30s)
N8N_RETRY_ATTEMPTS=2                            # Number of retries
N8N_RETRY_DELAY_MS=1000                         # Delay between retries
```

---

## 🔄 Workflow пути в n8n

Создайте следующие webhooks в n8n:

| Эндпоинт | Workflow Path | Request Type |
|----------|---------------|--------------|
| Поиск | `/webhook/drct/search` | offers_search |
| Цена | `/webhook/drct/price` | price |
| Заказ | `/webhook/drct/order/create` | order_create |
| Выпуск билета | `/webhook/drct/order/issue` | issue |
| Отмена | `/webhook/drct/order/cancel` | cancel |

---

## 🛡️ Обработка ошибок

### Типы ошибок

1. **Network Errors** (retryable)
   - Connection timeout
   - DNS resolution failed
   - Network unreachable

2. **Server Errors 5xx** (retryable)
   - 500 Internal Server Error
   - 502 Bad Gateway
   - 503 Service Unavailable

3. **Rate Limiting 429** (retryable)
   - Too Many Requests

4. **Client Errors 4xx** (NOT retryable)
   - 400 Bad Request
   - 401 Unauthorized
   - 404 Not Found
   - 422 Unprocessable Entity

### Пример обработки

```javascript
const result = await n8nClient.drctSearch(params, tenantId);

if (!result.success) {
  const { error } = result;

  if (error.statusCode === 400) {
    // Validation error - показать пользователю
    return res.status(400).json({
      error: {
        code: 'INVALID_INPUT',
        message: error.message
      }
    });
  }

  if (error.statusCode >= 500) {
    // Server error - попробовать позже
    return res.status(503).json({
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Search service temporarily unavailable'
      }
    });
  }

  // Other errors
  return res.status(500).json({
    error: {
      code: 'SEARCH_FAILED',
      message: 'Failed to perform search',
      correlationId: error.correlationId
    }
  });
}
```

---

## 📊 Логирование

Все запросы автоматически логируются в таблицу `drct_request_logs`:

```sql
SELECT
  correlation_id,
  request_type,
  status_code,
  latency_ms,
  created_at
FROM drct_request_logs
WHERE tenant_id = 'your-tenant-id'
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🔒 Безопасность

### PII Sanitization

Следующие поля автоматически маскируются в логах:
- Паспорта и документы
- Email и телефоны
- Имена и адреса
- Платежные данные
- Токены и ключи API

### Пример sanitization:

**До:**
```json
{
  "passenger": {
    "first_name": "John",
    "last_name": "Doe",
    "passport_number": "AB123456",
    "email": "john@example.com"
  }
}
```

**После (в логах):**
```json
{
  "passenger": {
    "first_name": "[REDACTED]",
    "last_name": "[REDACTED]",
    "passport_number": "[REDACTED]",
    "email": "[REDACTED]"
  }
}
```

---

## 📈 Мониторинг

### Метрики для отслеживания:

1. **Latency** - время ответа n8n
2. **Success Rate** - процент успешных запросов
3. **Error Rate** - процент ошибок по типам
4. **Retry Rate** - частота повторных попыток

### Пример запроса статистики:

```sql
SELECT
  request_type,
  COUNT(*) as total_requests,
  AVG(latency_ms) as avg_latency,
  COUNT(CASE WHEN status_code >= 200 AND status_code < 300 THEN 1 END) as success_count,
  COUNT(CASE WHEN status_code >= 400 THEN 1 END) as error_count
FROM drct_request_logs
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY request_type;
```

---

## 🧪 Тестирование

### Unit Tests
```bash
npm test -- services/n8nClient.test.js
```

### Integration Tests
```bash
# Убедитесь что n8n запущен на localhost:5678
npm run test:integration
```

---

## 🔧 Troubleshooting

### n8n недоступен
```
Error: N8N_REQUEST_FAILED
Message: fetch failed
```

**Решение:** Проверьте что n8n запущен и доступен по адресу из `N8N_WEBHOOK_URL`

### Timeout errors
```
Error: Request timed out after 30000ms
```

**Решение:** Увеличьте `N8N_TIMEOUT_MS` в .env или оптимизируйте workflow в n8n

### Validation errors
```
Error: origin and destination are required
```

**Решение:** Проверьте payload запроса на наличие всех обязательных полей

---

**Последнее обновление:** 2026-01-26
