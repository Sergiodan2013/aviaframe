# 🚀 n8n Setup Guide - Быстрый старт

**Дата:** 2026-01-27
**Статус:** ✅ Workflows готовы к импорту

---

## ✅ Что уже сделано

### 1. Созданы 5 n8n workflows
- ✅ [drct_search.json](n8n_workflows/drct_search.json) - Поиск билетов
- ✅ [drct_price.json](n8n_workflows/drct_price.json) - Получение цены
- ✅ [drct_order_create.json](n8n_workflows/drct_order_create.json) - Создание заказа
- ✅ [drct_order_issue.json](n8n_workflows/drct_order_issue.json) - Выпуск билетов
- ✅ [drct_order_cancel.json](n8n_workflows/drct_order_cancel.json) - Отмена заказа

### 2. Создан backend клиент
- ✅ [src/services/n8nClient.js](src/services/n8nClient.js) - Клиент для работы с n8n
- ✅ [src/services/drctLogger.js](src/services/drctLogger.js) - Логирование запросов

### 3. Готов тестовый скрипт
- ✅ [scripts/test_n8n.js](scripts/test_n8n.js) - Автоматическое тестирование

---

## 🎯 Быстрый старт (5 минут)

### Шаг 1: Проверка n8n

n8n уже запущен в Docker контейнере `n8n_local`:

```bash
# Проверить статус
docker ps | grep n8n

# Если не запущен - запустить
docker start n8n_local

# Открыть в браузере
open http://localhost:5678
```

### Шаг 2: Импорт workflows

1. Откройте n8n: http://localhost:5678
2. Для каждого workflow:
   - Нажмите **Workflows** → **Import from File**
   - Выберите файл из папки `backend/n8n_workflows/`
   - Нажмите **Import**

**Файлы для импорта:**
```
backend/n8n_workflows/drct_search.json
backend/n8n_workflows/drct_price.json
backend/n8n_workflows/drct_order_create.json
backend/n8n_workflows/drct_order_issue.json
backend/n8n_workflows/drct_order_cancel.json
```

### Шаг 3: Настройка credentials в n8n

После импорта откройте любой workflow и настройте HTTP Request node:

1. В node **DRCT API Request** кликните на поле **Authentication**
2. Выберите **Create New Credential**
3. Выберите тип: **Header Auth**
4. Заполните:
   ```
   Name: Authorization
   Value: Bearer YOUR_DRCT_API_TOKEN_HERE
   ```
5. Сохраните как **DRCT API Credentials**

Или используйте переменные окружения:
1. Settings → Variables
2. Добавьте:
   ```
   DRCT_API_URL=https://api.drct.ru/v1
   DRCT_API_TOKEN=your_token_here
   ```

### Шаг 4: Активация workflows

Для каждого импортированного workflow:
1. Откройте workflow
2. Нажмите переключатель **Inactive/Active** в правом верхнем углу
3. Убедитесь что статус **Active** (зеленый)

### Шаг 5: Проверка

Запустите тестовый скрипт:

```bash
cd ~/projects/aviaframe/backend
npm run test:n8n
```

Ожидаемый результат:
```
✅ n8n Health Check: healthy
✅ DRCT Search: 200 (1234ms)
✅ DRCT Price: 200 (567ms)
✅ DRCT Order Create: 200 (2345ms)
✅ DRCT Order Issue: 200 (3456ms)
✅ DRCT Order Cancel: 200 (890ms)

All tests passed! 🎉
```

---

## 📋 Webhook URLs после активации

После активации workflows будут доступны по адресам:

| Workflow | URL | Метод |
|----------|-----|-------|
| Search | http://localhost:5678/webhook/drct/search | POST |
| Price | http://localhost:5678/webhook/drct/price | POST |
| Order Create | http://localhost:5678/webhook/drct/order/create | POST |
| Order Issue | http://localhost:5678/webhook/drct/order/issue | POST |
| Order Cancel | http://localhost:5678/webhook/drct/order/cancel | POST |

---

## 🧪 Примеры использования

### 1. Тестирование через curl

**Поиск билетов:**
```bash
curl -X POST http://localhost:5678/webhook/drct/search \
  -H "Content-Type: application/json" \
  -d '{
    "origin": "DXB",
    "destination": "LHR",
    "depart_date": "2026-03-15",
    "return_date": "2026-03-22",
    "adults": 2,
    "cabin_class": "economy"
  }'
```

**Получение цены:**
```bash
curl -X POST http://localhost:5678/webhook/drct/price \
  -H "Content-Type: application/json" \
  -d '{
    "offer_id": "offer-123"
  }'
```

### 2. Использование через backend

```javascript
const n8nClient = require('./src/services/n8nClient');

// Поиск билетов
const result = await n8nClient.drctSearch({
  origin: 'DXB',
  destination: 'LHR',
  depart_date: '2026-03-15',
  adults: 2
}, tenantId);

if (result.success) {
  console.log('Offers:', result.data.offers);
} else {
  console.error('Error:', result.error);
}
```

### 3. Интеграция в Express

```javascript
const n8nClient = require('./services/n8nClient');

app.post('/api/search', async (req, res) => {
  const { origin, destination, depart_date } = req.body;

  const result = await n8nClient.drctSearch({
    origin,
    destination,
    depart_date
  }, process.env.DEMO_TENANT_ID);

  if (result.success) {
    res.json(result.data);
  } else {
    res.status(500).json({ error: result.error });
  }
});
```

---

## 📊 Структура workflows

### drct_search.json
```
Webhook (POST)
  → Validate Parameters
  → HTTP Request (DRCT API /offers/search)
  → Transform Response
  → Return Response
```

### drct_price.json
```
Webhook (POST)
  → Validate offer_id
  → HTTP Request (DRCT API /offers/price)
  → Transform Response
  → Return Response
```

### drct_order_create.json
```
Webhook (POST)
  → Validate Passengers & Documents
  → HTTP Request (DRCT API /orders)
  → Transform Order Data
  → Return Response
```

### drct_order_issue.json
```
Webhook (POST)
  → Validate order_id
  → HTTP Request (DRCT API /orders/{id}/issue)
  → Transform Tickets
  → Return Response
```

### drct_order_cancel.json
```
Webhook (POST)
  → Validate order_id
  → HTTP Request (DRCT API /orders/{id}/cancel)
  → Transform Cancellation
  → Return Response
```

---

## 🔧 Troubleshooting

### n8n не отвечает

```bash
# Проверить контейнер
docker ps -a | grep n8n

# Перезапустить
docker restart n8n_local

# Проверить логи
docker logs n8n_local --tail 50
```

### Workflow не активируется

1. Проверьте что webhook path уникальный
2. Проверьте что все nodes правильно соединены
3. Проверьте что credentials настроены

### DRCT API возвращает ошибку

1. Проверьте токен в credentials
2. Проверьте URL API (должен быть https://api.drct.ru/v1)
3. Проверьте формат запроса в workflow

### Test script не работает

```bash
# Проверить зависимости
npm install axios

# Проверить n8n доступность
curl http://localhost:5678/webhook/drct/search

# Запустить с debug
node scripts/test_n8n.js
```

---

## 📚 Дополнительная документация

- [N8N_INTEGRATION.md](N8N_INTEGRATION.md) - Полная документация по интеграции
- [n8n_workflows/README.md](n8n_workflows/README.md) - Детали workflows
- [src/services/README.md](src/services/README.md) - Backend сервисы

---

## ✅ Checklist готовности

### Базовая настройка
- [ ] n8n запущен на localhost:5678
- [ ] Импортированы все 5 workflows
- [ ] Настроены credentials (DRCT API token)
- [ ] Workflows активированы
- [ ] Тесты пройдены успешно

### Backend интеграция
- [ ] axios установлен (`npm install axios`)
- [ ] N8N_WEBHOOK_URL настроен в .env
- [ ] n8nClient.js работает
- [ ] Логирование в drct_request_logs работает

### Production готовность (опционально)
- [ ] n8n развернут на выделенном сервере
- [ ] HTTPS настроен для webhooks
- [ ] Rate limiting настроен
- [ ] Мониторинг настроен
- [ ] Backup workflows настроен

---

## 🚀 Следующие шаги

1. **Протестируйте все workflows** через test script
2. **Интегрируйте в backend** используя n8nClient
3. **Настройте мониторинг** для отслеживания ошибок
4. **Добавьте обработку ошибок** в workflows
5. **Настройте production окружение** когда будете готовы

---

## 📞 Поддержка

- **n8n Documentation**: https://docs.n8n.io/
- **Backend Services**: [src/services/README.md](src/services/README.md)
- **Integration Guide**: [N8N_INTEGRATION.md](N8N_INTEGRATION.md)

---

**Готово! 🎉**
Все workflows созданы и готовы к использованию.

**Время настройки:** ~5-10 минут
**Последнее обновление:** 2026-01-27
