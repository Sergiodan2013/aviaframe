# 📦 Формат данных, отправляемых в n8n Webhook

## ✅ Исправлено

**Проблема**: n8n получал только `contacts`, не было `offer_id` и `passengers`

**Причина**:
1. `offer_id` был вложен в объект `offer.offer_id` вместо верхнего уровня
2. Поле называлось `passenger` (единственное число), а не `passengers` (массив)
3. drctApi.createOrder() делал деструктуризацию и отправлял только 3 поля

**Решение**:
1. ✅ Исправлена структура payload в App.jsx
2. ✅ Добавлены обязательные поля на верхнем уровне
3. ✅ drctApi.createOrder() теперь отправляет весь payload

---

## 🎯 Формат данных для n8n Webhook

### Endpoint
```
POST /webhook-test/drct/order/create
```

### Headers
```
Content-Type: application/json
Idempotency-Key: idem-1738675432123-abc123xyz
```

### Body (JSON)

```json
{
  // ============================================
  // ОБЯЗАТЕЛЬНЫЕ ПОЛЯ для DRCT API
  // ============================================

  // 1. Offer ID (string, обязательно!)
  "offer_id": "offer_abc123xyz",

  // 2. Passengers array (обязательно! минимум 1 пассажир)
  "passengers": [
    {
      "type": "ADT",              // Adult (ADT), Child (CHD), Infant (INF)
      "first_name": "John",
      "last_name": "Doe",
      "date_of_birth": "1990-01-15",
      "gender": "M",              // M или F (не 'male'/'female'!)
      "document": {
        "type": "passport",
        "number": "N1234567",
        "expiry_date": "2030-12-31",
        "issuing_country": "SA"
      }
    }
  ],

  // 3. Contacts (обязательно!)
  "contacts": {
    "email": "john.doe@example.com",
    "phone": "+966501234567"
  },

  // ============================================
  // ДОПОЛНИТЕЛЬНЫЕ ПОЛЯ для Supabase
  // ============================================

  // User information (для связи с пользователем)
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "user_email": "user@example.com",

  // Full offer details (для записи в таблицу orders)
  "offer": {
    "origin": "MAD",
    "destination": "ATH",
    "departure_time": "2026-03-15T10:00:00Z",
    "arrival_time": "2026-03-15T14:00:00Z",
    "airline_code": "IB",
    "airline_name": "Iberia",
    "flight_number": "IB3154",
    "base_price": 12500,
    "taxes": 2500,
    "currency": "UAH"
  },

  // Additional passenger details (для таблицы passengers)
  "passenger_details": {
    "baggage_allowance": "20kg",
    "nationality": "SA",
    "passport_number": "N1234567",
    "passport_expiry": "2030-12-31"
  },

  // Pricing breakdown (для расчетов)
  "pricing": {
    "base_price": 12500,
    "taxes": 2500,
    "baggage_price": 500,
    "total_price": 15500,
    "currency": "UAH"
  },

  // Raw offer data (для бэкапа)
  "raw_offer_data": {
    // Полный объект offer из DRCT API
  }
}
```

---

## 🔧 Как обрабатывать в n8n

### Шаг 1: Webhook Trigger

Получите все данные:
```javascript
const body = $input.item.json.body;
```

### Шаг 2: Извлечь данные для DRCT API

```javascript
// Для запроса к DRCT API нужны только эти 3 поля:
const drctPayload = {
  offer_id: body.offer_id,      // Обязательно!
  passengers: body.passengers,  // Обязательно! (массив)
  contacts: body.contacts       // Обязательно!
};

// HTTP Request к DRCT API
// POST https://api.drct.ru/v1/orders
// Body: drctPayload
```

### Шаг 3: Записать в Supabase (orders table)

```javascript
// После успешного создания заказа в DRCT
const drctResponse = $json; // Response from DRCT API

// Записать в таблицу orders
const orderRecord = {
  // ID заказа от DRCT
  drct_order_id: drctResponse.id,
  order_number: `AVF${Date.now()}`, // Генерируем свой номер
  booking_reference: drctResponse.booking_reference,

  // User info
  user_id: body.user_id,

  // Offer info
  offer_id: body.offer_id,
  origin: body.offer.origin,
  destination: body.offer.destination,
  departure_time: body.offer.departure_time,
  arrival_time: body.offer.arrival_time,
  airline_code: body.offer.airline_code,
  airline_name: body.offer.airline_name,
  flight_number: body.offer.flight_number,

  // Pricing
  total_price: body.pricing.total_price,
  currency: body.pricing.currency,

  // Contacts
  contact_email: body.contacts.email,
  contact_phone: body.contacts.phone,

  // Status
  status: 'pending'
};

// Supabase: INSERT INTO orders
```

### Шаг 4: Записать в Supabase (passengers table)

```javascript
// Для каждого пассажира
body.passengers.forEach((passenger) => {
  const passengerRecord = {
    order_id: orderRecord.id, // ID созданного заказа из шага 3
    first_name: passenger.first_name,
    last_name: passenger.last_name,
    date_of_birth: passenger.date_of_birth,
    gender: passenger.gender,
    passport_number: passenger.document.number,
    passport_expiry: passenger.document.expiry_date,
    nationality: passenger.document.issuing_country,
    passenger_type: passenger.type,
    baggage_allowance: body.passenger_details.baggage_allowance
  };

  // Supabase: INSERT INTO passengers
});
```

### Шаг 5: Вернуть response фронтенду

```javascript
return {
  order_number: orderRecord.order_number,
  booking_reference: orderRecord.booking_reference,
  drct_order_id: drctResponse.id,
  status: 'pending'
};
```

---

## 🧪 Пример полного payload

Вот что теперь приходит в ваш n8n webhook:

```json
{
  "offer_id": "offer_abc123xyz456",
  "passengers": [
    {
      "type": "ADT",
      "first_name": "Ivan",
      "last_name": "Petrov",
      "date_of_birth": "1985-06-20",
      "gender": "M",
      "document": {
        "type": "passport",
        "number": "SA1234567",
        "expiry_date": "2029-06-20",
        "issuing_country": "SA"
      }
    }
  ],
  "contacts": {
    "email": "ivan.petrov@example.com",
    "phone": "+966501234567"
  },
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "user_email": "ivan.petrov@example.com",
  "offer": {
    "origin": "MAD",
    "destination": "ATH",
    "departure_time": "2026-03-15T10:00:00.000Z",
    "arrival_time": "2026-03-15T14:00:00.000Z",
    "airline_code": "IB",
    "airline_name": "Iberia",
    "flight_number": "IB3154",
    "base_price": 12500,
    "taxes": 2500,
    "currency": "UAH"
  },
  "passenger_details": {
    "baggage_allowance": "20kg",
    "nationality": "SA",
    "passport_number": "SA1234567",
    "passport_expiry": "2029-06-20"
  },
  "pricing": {
    "base_price": 12500,
    "taxes": 2500,
    "baggage_price": 500,
    "total_price": 15500,
    "currency": "UAH"
  },
  "raw_offer_data": { /* ... */ }
}
```

---

## ✅ Валидация

Обязательные поля (проверяйте в n8n):

1. ✅ `offer_id` - должен быть строкой
2. ✅ `passengers` - должен быть массивом с минимум 1 элементом
3. ✅ `passengers[0].first_name` - обязательно
4. ✅ `passengers[0].last_name` - обязательно
5. ✅ `passengers[0].date_of_birth` - обязательно
6. ✅ `passengers[0].document.number` - обязательно
7. ✅ `contacts.email` - обязательно
8. ✅ `contacts.phone` - обязательно

---

## 🔍 Debugging

### Проверка в n8n

Добавьте ноду **"Edit Fields"** после Webhook для отладки:

```javascript
// В n8n Code node
console.log('=== Received Order Payload ===');
console.log('Offer ID:', $json.body.offer_id);
console.log('Passengers count:', $json.body.passengers?.length);
console.log('Email:', $json.body.contacts?.email);
console.log('Full body:', JSON.stringify($json.body, null, 2));

// Возврат данных для следующей ноды
return $json;
```

### Проверка в браузере (Frontend)

Откройте Console (F12) при создании заказа:
```
Creating Hold Booking via n8n webhook with passenger data: {...}
Sending complete order to n8n webhook: {...}
```

Проверьте:
- ✅ `offer_id` на верхнем уровне
- ✅ `passengers` - массив
- ✅ `contacts` - объект

---

## 🚨 Важные изменения

### До (старый формат):
```json
{
  "offer": {
    "offer_id": "abc123"  // ❌ Вложенный
  },
  "passenger": {          // ❌ Единственное число
    "first_name": "John"
  },
  "contacts": {
    "email": "..."
  }
}
```

### После (новый формат):
```json
{
  "offer_id": "abc123",   // ✅ На верхнем уровне
  "passengers": [{        // ✅ Массив
    "first_name": "John",
    "gender": "M"         // ✅ Формат DRCT (M/F)
  }],
  "contacts": {
    "email": "..."
  }
}
```

---

## 📚 Ссылки

- [DRCT API Documentation](https://api.drct.ru/docs)
- [Supabase Schema](../backend/supabase/schema.sql)
- [App.jsx (Frontend)](../portal/client/src/App.jsx#L126-L179)
- [drctApi.js (API Client)](../portal/client/src/lib/drctApi.js#L159-L178)

---

**Статус**: ✅ Исправлено и протестировано
**Дата**: 2026-02-04
