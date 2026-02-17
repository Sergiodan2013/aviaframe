# Debug Guide - Почему не показываются результаты поиска

## Проблема

В n8n в ноде "DRCT Search API" есть данные (output), но в UI показывает "No flights found".

## Как протестировать

### 1. Включите Test Mode

1. Откройте приложение: http://localhost:3002/
2. В правом верхнем углу нажмите кнопку **"Test Mode OFF"**
3. Она станет оранжевой: **"Test Mode ON"**
4. Теперь выполните поиск - вы увидите 3 тестовых рейса

**Если Test Mode работает** ✅ - значит UI работает правильно, проблема в n8n workflow.

### 2. Проверьте консоль браузера

1. Откройте Developer Console (F12 или Cmd+Option+I)
2. Перейдите на вкладку **Console**
3. Выключите Test Mode (кнопка станет серой)
4. Выполните реальный поиск
5. Смотрите логи

#### Ожидаемые логи:

```javascript
=== Flight Search Started ===
Search payload: {...}
Target URL: http://localhost:5678/webhook/drct/search
Response status: 200
Response data RAW: {...}
Response data type: object  // ИЛИ string
Is response.data a string?: false  // ИЛИ true
```

### 3. Проверьте формат ответа

#### Вариант A: Ответ - это СТРОКА

Если видите:
```javascript
Response data type: string
Is response.data a string?: true
⚠️ Response is a STRING, attempting to parse...
```

**Проблема**: n8n возвращает JSON как строку (двойная сериализация)

**Решение**: В n8n в ноде "Respond to Webhook" измените:
```
ИЗ: responseBody: "={{ JSON.stringify($json) }}"
В:   responseBody: "={{ $json }}"
```

#### Вариант B: Ответ - это объект, но offers пустой

Если видите:
```javascript
Response data type: object
Parsed data.offers: []
✅ Found 0 offers
```

**Проблема**: Workflow работает, но DRCT API возвращает пустой массив

**Возможные причины**:
1. DRCT API token невалидный/истек
2. DRCT sandbox возвращает пустые данные для тестовых запросов
3. Transformation node неправильно парсит ответ от DRCT API

**Решение**: Проверьте в n8n execution logs:
1. Откройте n8n: http://localhost:5678
2. Найдите workflow "DRCT Search Workflow"
3. Нажмите "Executions"
4. Откройте последний execution
5. Посмотрите output ноды "DRCT Search API"

Если там есть данные, но "Transform Response" возвращает `offers: []`, значит проблема в transformation logic.

#### Вариант C: Ответ - это объект с offers

Если видите:
```javascript
Response data type: object
Parsed data.offers: [{...}, {...}]
✅ Found 3 offers
```

**Но UI все равно показывает "No flights found"** ❌

**Проблема**: FlightCard компонент не может отобразить данные

**Решение**: Проверьте structure of offers. Они должны содержать:
```javascript
{
  id: "...",
  price: {
    total: 123.45,
    currency: "EUR"
  },
  segments: [{
    origin: "CDG",
    destination: "LHR",
    departure: "2026-03-15T10:30:00Z",
    arrival: "2026-03-15T11:00:00Z",
    carrier: "AF",
    flight_number: "AF1234"
  }]
}
```

### 4. Проверьте n8n workflow

#### Шаг 1: Откройте workflow
```
http://localhost:5678
→ Workflows
→ "DRCT Search Workflow"
```

#### Шаг 2: Проверьте "Respond to Webhook" ноду

Должно быть:
```json
{
  "respondWith": "json",
  "responseBody": "={{ $json }}",  // БЕЗ JSON.stringify!
  "options": {
    "responseHeaders": {
      "entries": [{
        "name": "Content-Type",
        "value": "application/json"
      }]
    },
    "responseCode": 200
  }
}
```

❌ **НЕПРАВИЛЬНО**: `"responseBody": "={{ JSON.stringify($json) }}"`
✅ **ПРАВИЛЬНО**: `"responseBody": "={{ $json }}"`

#### Шаг 3: Проверьте "Transform Response" ноду

Output должен быть:
```javascript
{
  search_id: "...",
  offers: [...],  // Массив с данными
  metadata: {...}
}
```

Если `offers: []` (пустой), значит "DRCT Search API" нода не вернула данные.

#### Шаг 4: Проверьте "DRCT Search API" ноду

Если там `"No output data returned"`:
- Проблема с DRCT API (token, endpoint, neverError settings)
- Проверьте HTTP Request node settings:
  - URL: `https://sandbox-api.drct.aero/offers_search`
  - Method: POST
  - Authentication: Bearer token
  - neverError: true

## Чек-лист для дебага

- [ ] Test Mode работает и показывает 3 рейса
- [ ] Консоль браузера открыта
- [ ] В логах видно "Response status: 200"
- [ ] В логах видно тип response (string или object)
- [ ] Если string - исправлен responseBody в n8n
- [ ] Если offers: [] - проверены n8n execution logs
- [ ] DRCT Search API нода возвращает данные
- [ ] Transform Response правильно форматирует данные
- [ ] Respond to Webhook НЕ использует JSON.stringify

## Быстрый фикс

### Если проблема в n8n:

1. Откройте workflow
2. Найдите ноду "Respond to Webhook"
3. В Parameters → Response Body измените:
   ```
   ИЗ: {{ JSON.stringify($json) }}
   В:   {{ $json }}
   ```
4. Нажмите Save
5. Нажмите "Activate" если workflow неактивен

### Если проблема в DRCT API:

1. Проверьте credential "DRCT API Sandbox"
2. Убедитесь что Bearer token валидный
3. Попробуйте запрос напрямую:
   ```bash
   curl -X POST https://sandbox-api.drct.aero/offers_search \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "DRCT-Version: 2021-06-01" \
     -H "Content-Type: application/json" \
     -d '{
       "flights": [{"departure_airport_code":"CDG","arrival_airport_code":"LHR","departure_date":"2026-03-15"}],
       "passengers": [{"type":"ADT"}]
     }'
   ```

## Следующие шаги

После того как проблема найдена и исправлена:
1. Отключите Test Mode
2. Выполните реальный поиск
3. Проверьте что данные отображаются
4. Если все работает - можно переходить к созданию виджета для партнеров
