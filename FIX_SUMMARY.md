# 🔧 Исправление: n8n получает полный payload

## ❌ Проблема

n8n webhook получал **только contacts**, не было **offer_id** и **passengers**.

---

## ✅ Решение

### Изменено в [App.jsx](portal/client/src/App.jsx#L126-L179)

**ДО:**
```javascript
const orderPayload = {
  user_id: user?.id,
  offer: {
    offer_id: selectedOffer.offer_id  // ❌ Вложенный!
  },
  passenger: {                        // ❌ Единственное число!
    first_name: data.firstName,
    gender: data.gender               // ❌ 'male'/'female'
  },
  contacts: {
    email: data.email,
    phone: data.phone
  }
};
```

**ПОСЛЕ:**
```javascript
const orderPayload = {
  // ✅ DRCT API обязательные поля (на верхнем уровне!)
  offer_id: selectedOffer.offer_id,   // ✅ На верхнем уровне
  passengers: [{                       // ✅ Массив!
    type: 'ADT',
    first_name: data.firstName,
    last_name: data.lastName,
    date_of_birth: data.dateOfBirth,
    gender: data.gender === 'male' ? 'M' : 'F',  // ✅ M/F формат
    document: {
      type: 'passport',
      number: data.passportNumber,
      expiry_date: data.passportExpiry,
      issuing_country: data.nationality
    }
  }],
  contacts: {
    email: data.email,
    phone: data.phone
  },

  // ✅ Дополнительные поля для n8n → Supabase
  user_id: user?.id,
  user_email: user?.email,
  offer: { /* детали рейса */ },
  passenger_details: { /* доп. инфо */ },
  pricing: { /* цены */ }
};
```

### Изменено в [drctApi.js](portal/client/src/lib/drctApi.js#L159-L178)

**ДО:**
```javascript
async createOrder(orderData) {
  const { offer_id, passengers, contacts } = orderData;  // ❌ Деструктуризация

  return await this.request('drct/order/create', 'POST', {
    offer_id,      // ❌ Только 3 поля
    passengers,
    contacts
  });
}
```

**ПОСЛЕ:**
```javascript
async createOrder(orderData) {
  // ✅ Валидация обязательных полей
  if (!orderData.offer_id) throw new Error('offer_id is required');
  if (!orderData.passengers) throw new Error('passengers is required');
  if (!orderData.contacts) throw new Error('contacts is required');

  // ✅ Отправляем весь payload
  return await this.request('drct/order/create', 'POST', orderData);
}
```

---

## 📦 Что теперь приходит в n8n

### Обязательные поля (для DRCT API):

```json
{
  "offer_id": "offer_abc123",
  "passengers": [
    {
      "type": "ADT",
      "first_name": "John",
      "last_name": "Doe",
      "date_of_birth": "1990-01-15",
      "gender": "M",
      "document": {
        "type": "passport",
        "number": "N1234567",
        "expiry_date": "2030-12-31",
        "issuing_country": "SA"
      }
    }
  ],
  "contacts": {
    "email": "john@example.com",
    "phone": "+966501234567"
  }
}
```

### Дополнительные поля (для Supabase):

```json
{
  "user_id": "uuid",
  "user_email": "user@example.com",
  "offer": {
    "origin": "MAD",
    "destination": "ATH",
    "departure_time": "2026-03-15T10:00:00Z",
    "airline_code": "IB",
    "airline_name": "Iberia",
    "flight_number": "IB3154",
    "base_price": 12500,
    "currency": "UAH"
  },
  "passenger_details": {
    "baggage_allowance": "20kg",
    "nationality": "SA"
  },
  "pricing": {
    "base_price": 12500,
    "baggage_price": 500,
    "total_price": 15500,
    "currency": "UAH"
  }
}
```

---

## 🔧 Что делать в n8n

### 1. Извлечь данные для DRCT API

```javascript
// В n8n workflow, после Webhook node
const body = $input.item.json.body;

// Для запроса к DRCT API нужны только эти поля:
const drctPayload = {
  offer_id: body.offer_id,
  passengers: body.passengers,
  contacts: body.contacts
};

// HTTP Request к DRCT:
// POST https://api.drct.ru/v1/orders
// Body: drctPayload
```

### 2. Записать в Supabase

```javascript
// После успешного ответа от DRCT
const drctResponse = $json;

// Записать в таблицу orders
await supabase.from('orders').insert({
  drct_order_id: drctResponse.id,
  order_number: `AVF${Date.now()}`,
  user_id: body.user_id,
  offer_id: body.offer_id,
  origin: body.offer.origin,
  destination: body.offer.destination,
  airline_name: body.offer.airline_name,
  flight_number: body.offer.flight_number,
  total_price: body.pricing.total_price,
  currency: body.pricing.currency,
  contact_email: body.contacts.email,
  contact_phone: body.contacts.phone,
  status: 'pending'
});

// Записать пассажиров
await supabase.from('passengers').insert(
  body.passengers.map(p => ({
    order_id: orderRecord.id,
    first_name: p.first_name,
    last_name: p.last_name,
    date_of_birth: p.date_of_birth,
    gender: p.gender,
    passport_number: p.document.number,
    nationality: p.document.issuing_country
  }))
);
```

### 3. Вернуть response

```javascript
return {
  order_number: orderRecord.order_number,
  booking_reference: drctResponse.booking_reference,
  drct_order_id: drctResponse.id,
  status: 'pending'
};
```

---

## ✅ Как проверить

### 1. Запустите приложение

```bash
cd /Users/sergejdaniluk/projects/aviaframe/portal/client
npm run dev
```

### 2. Создайте тестовый заказ

1. Откройте http://localhost:3002
2. Войдите (Sign In)
3. Найдите рейс (Test Mode ON)
4. Нажмите "Select"
5. Заполните форму пассажира
6. Нажмите "Забронировать"

### 3. Проверьте Console (F12)

Должен быть лог:
```
Sending complete order to n8n webhook: {
  offer_id: "...",
  passengers: [...],
  contacts: {...}
}
```

### 4. Проверьте n8n Executions

В n8n должен прийти полный payload с:
- ✅ `offer_id` (строка)
- ✅ `passengers` (массив)
- ✅ `contacts` (объект)

---

## 📊 Сравнение

| Поле | До | После |
|------|----|----|
| `offer_id` | ❌ Вложен в `offer.offer_id` | ✅ На верхнем уровне |
| `passengers` | ❌ `passenger` (единственное число) | ✅ `passengers` (массив) |
| `gender` | ❌ `'male'`/`'female'` | ✅ `'M'`/`'F'` |
| Доп. поля | ❌ Не отправлялись | ✅ Отправляются для Supabase |

---

## 📚 Документация

- **Полный формат payload**: [N8N_PAYLOAD_FORMAT.md](N8N_PAYLOAD_FORMAT.md)
- **Измененные файлы**:
  - [App.jsx](portal/client/src/App.jsx#L126-L179)
  - [drctApi.js](portal/client/src/lib/drctApi.js#L159-L178)

---

**Статус**: ✅ Готово к тестированию
**Дата**: 2026-02-04
