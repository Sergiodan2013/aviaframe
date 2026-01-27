# n8n Workflows для интеграции с DRCT API

Этот каталог содержит готовые n8n workflows для интеграции с DRCT API.

## Описание Workflows

### 1. drct_search.json - Поиск билетов
- **Webhook**: `POST /webhook/drct/search`
- **Описание**: Поиск авиабилетов по параметрам
- **Входные данные**:
  ```json
  {
    "origin": "MOW",
    "destination": "LED",
    "departure_date": "2026-02-15",
    "return_date": "2026-02-20",
    "passengers": {
      "adults": 1,
      "children": 0,
      "infants": 0
    }
  }
  ```

### 2. drct_price.json - Получение цены
- **Webhook**: `POST /webhook/drct/price`
- **Описание**: Получение актуальной цены для выбранного предложения
- **Входные данные**:
  ```json
  {
    "offer_id": "offer-123456",
    "passengers": []
  }
  ```

### 3. drct_order_create.json - Создание заказа
- **Webhook**: `POST /webhook/drct/order/create`
- **Описание**: Создание заказа с данными пассажиров
- **Входные данные**:
  ```json
  {
    "offer_id": "offer-123456",
    "passengers": [
      {
        "first_name": "Ivan",
        "last_name": "Ivanov",
        "middle_name": "Ivanovich",
        "date_of_birth": "1990-01-01",
        "gender": "M",
        "document": {
          "type": "PASSPORT",
          "number": "1234567890",
          "expiry_date": "2030-01-01",
          "citizenship": "RU"
        }
      }
    ],
    "contacts": {
      "email": "ivan@example.com",
      "phone": "+79001234567"
    },
    "payment_method": "CARD"
  }
  ```

### 4. drct_order_issue.json - Выпуск билетов
- **Webhook**: `POST /webhook/drct/order/issue`
- **Описание**: Выпуск электронных билетов после оплаты
- **Входные данные**:
  ```json
  {
    "order_id": "order-789012",
    "payment_confirmation": "payment-ref-123"
  }
  ```

### 5. drct_order_cancel.json - Отмена заказа
- **Webhook**: `POST /webhook/drct/order/cancel`
- **Описание**: Отмена заказа и возврат средств
- **Входные данные**:
  ```json
  {
    "order_id": "order-789012",
    "reason": "USER_REQUEST",
    "refund_requested": true
  }
  ```

## Установка и настройка

### Шаг 1: Проверка n8n

Убедитесь, что n8n запущен и доступен:

```bash
# Проверка Docker контейнера
docker ps | grep n8n

# Проверка доступности
curl http://localhost:5678
```

n8n должен быть доступен по адресу: http://localhost:5678

### Шаг 2: Настройка переменных окружения

В n8n необходимо настроить следующие переменные окружения:

1. Откройте n8n UI: http://localhost:5678
2. Перейдите в **Settings** → **Environments**
3. Добавьте переменные:

```
DRCT_API_URL=https://api.drct.ru/v1
DRCT_API_KEY=your_drct_api_key_here
```

Либо добавьте их в Docker Compose файл:

```yaml
services:
  n8n:
    environment:
      - DRCT_API_URL=https://api.drct.ru/v1
      - DRCT_API_KEY=your_drct_api_key_here
```

### Шаг 3: Импорт Workflows

#### Способ 1: Через UI (Рекомендуется)

1. Откройте n8n UI: http://localhost:5678
2. Нажмите на кнопку **"+"** → **Import from File**
3. Выберите один из JSON файлов из этого каталога
4. Повторите для каждого workflow

#### Способ 2: Через API

```bash
# Установите jq если не установлен
# brew install jq  (macOS)
# apt-get install jq  (Ubuntu/Debian)

# Импорт всех workflows
for file in drct_*.json; do
  curl -X POST http://localhost:5678/api/v1/workflows \
    -H "Content-Type: application/json" \
    -d @"$file"
done
```

#### Способ 3: Через CLI

```bash
# Если n8n установлен глобально
n8n import:workflow --input=drct_search.json
n8n import:workflow --input=drct_price.json
n8n import:workflow --input=drct_order_create.json
n8n import:workflow --input=drct_order_issue.json
n8n import:workflow --input=drct_order_cancel.json
```

### Шаг 4: Настройка Credentials (если требуется)

Если вы хотите использовать credentials вместо переменных окружения:

1. Перейдите в **Credentials** → **Add Credential**
2. Выберите **HTTP Header Auth**
3. Добавьте:
   - **Name**: DRCT API Key
   - **Header Name**: X-API-KEY
   - **Header Value**: ваш API ключ

Затем в каждом workflow обновите узел HTTP Request, чтобы использовать созданный credential.

### Шаг 5: Активация Workflows

1. Откройте каждый импортированный workflow
2. Нажмите кнопку **"Active"** в правом верхнем углу
3. Убедитесь, что статус изменился на "Active"

### Шаг 6: Получение Webhook URLs

После активации каждого workflow:

1. Откройте workflow
2. Кликните на узел **Webhook**
3. Скопируйте URL из секции **Production URL**

Пример URLs:
```
POST http://localhost:5678/webhook/drct/search
POST http://localhost:5678/webhook/drct/price
POST http://localhost:5678/webhook/drct/order/create
POST http://localhost:5678/webhook/drct/order/issue
POST http://localhost:5678/webhook/drct/order/cancel
```

## Тестирование

### Использование test_n8n.js

Запустите тестовый скрипт для проверки всех workflows:

```bash
cd /Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation\ \(2\)/v1_backend

# Установите зависимости (если нужно)
npm install axios

# Запустите тесты
node scripts/test_n8n.js
```

### Ручное тестирование с curl

#### Тест 1: Поиск билетов
```bash
curl -X POST http://localhost:5678/webhook/drct/search \
  -H "Content-Type: application/json" \
  -d '{
    "origin": "MOW",
    "destination": "LED",
    "departure_date": "2026-02-15",
    "passengers": {"adults": 1}
  }'
```

#### Тест 2: Получение цены
```bash
curl -X POST http://localhost:5678/webhook/drct/price \
  -H "Content-Type: application/json" \
  -d '{
    "offer_id": "test-offer-123"
  }'
```

#### Тест 3: Создание заказа
```bash
curl -X POST http://localhost:5678/webhook/drct/order/create \
  -H "Content-Type: application/json" \
  -d '{
    "offer_id": "test-offer-123",
    "passengers": [{
      "first_name": "Ivan",
      "last_name": "Ivanov",
      "date_of_birth": "1990-01-01",
      "document": {
        "type": "PASSPORT",
        "number": "1234567890"
      }
    }],
    "contacts": {
      "email": "test@example.com",
      "phone": "+79001234567"
    }
  }'
```

## Мониторинг и отладка

### Просмотр логов выполнения

1. В n8n UI откройте **Executions** в левом меню
2. Выберите execution для просмотра деталей
3. Просмотрите входные/выходные данные каждого узла

### Ошибки подключения

Если workflows не могут подключиться к DRCT API:

1. Проверьте переменные окружения `DRCT_API_URL` и `DRCT_API_KEY`
2. Убедитесь что API ключ валиден
3. Проверьте сетевое подключение:
```bash
curl -H "X-API-KEY: your_key" https://api.drct.ru/v1/health
```

### Тайм-ауты

Если запросы занимают слишком много времени:

1. Откройте workflow
2. Найдите узел **HTTP Request**
3. В настройках увеличьте **Timeout** (например, до 60000 мс для issue операций)

## Интеграция с Backend

Для использования n8n workflows из вашего backend создайте клиент:

```javascript
// src/services/n8nClient.js
const axios = require('axios');

class N8NClient {
  constructor(baseURL = 'http://localhost:5678/webhook') {
    this.baseURL = baseURL;
  }

  async searchOffers(searchParams) {
    const response = await axios.post(`${this.baseURL}/drct/search`, searchParams);
    return response.data;
  }

  async getPrice(offerId, passengers = []) {
    const response = await axios.post(`${this.baseURL}/drct/price`, {
      offer_id: offerId,
      passengers
    });
    return response.data;
  }

  async createOrder(orderData) {
    const response = await axios.post(`${this.baseURL}/drct/order/create`, orderData);
    return response.data;
  }

  async issueOrder(orderId, paymentConfirmation = null) {
    const response = await axios.post(`${this.baseURL}/drct/order/issue`, {
      order_id: orderId,
      payment_confirmation: paymentConfirmation
    });
    return response.data;
  }

  async cancelOrder(orderId, reason = 'USER_REQUEST') {
    const response = await axios.post(`${this.baseURL}/drct/order/cancel`, {
      order_id: orderId,
      reason,
      refund_requested: true
    });
    return response.data;
  }
}

module.exports = N8NClient;
```

## Безопасность

### Защита Webhooks

Рекомендуется добавить аутентификацию для webhooks:

1. В каждом workflow добавьте узел **Validate Auth** после Webhook
2. Используйте HTTP Header Auth или Bearer Token
3. Настройте API Gateway перед n8n

### Ограничение доступа

Если n8n доступен извне:

1. Используйте HTTPS
2. Настройте firewall rules
3. Добавьте rate limiting
4. Используйте VPN или внутреннюю сеть

## Обновление Workflows

При необходимости обновить workflows:

1. Экспортируйте текущий workflow как backup
2. Внесите изменения в JSON файл
3. Импортируйте обновленный workflow (он заменит старый)
4. Протестируйте изменения

## Troubleshooting

### Workflow не активируется
- Проверьте что все обязательные узлы настроены
- Проверьте что нет ошибок валидации
- Перезапустите n8n

### Webhook возвращает 404
- Убедитесь что workflow активен
- Проверьте правильность URL webhook
- Перезапустите workflow

### Ошибки трансформации данных
- Проверьте узлы **Code** на синтаксические ошибки
- Используйте **Execute Node** для отладки
- Проверьте структуру входных данных

## Дополнительные ресурсы

- [n8n Documentation](https://docs.n8n.io/)
- [DRCT API Documentation](https://docs.drct.ru/)
- [n8n Community Forum](https://community.n8n.io/)
