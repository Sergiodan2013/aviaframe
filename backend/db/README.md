> ## ⚠️ ORPHANED / LEGACY DOCUMENT — DOES NOT MATCH THE LIVE SCHEMA
>
> This document (and the `schema.sql` / `seed.sql` / `migrations/` files in this
> folder) describe an **early draft schema** (`organizations`, `bookings`,
> `users`, `roles`, `drct_request_logs`, `audit_logs`) that is **not the schema
> actually running in production**.
>
> The live schema uses `agencies`, `orders`, and `profiles` (not
> `organizations`/`bookings`/`users`), and the **only authoritative migration
> line is `backend/supabase/migrations/`**. That directory is what is actually
> applied to the Supabase project and what the application code queries
> against.
>
> **Do not** apply `backend/db/schema.sql`, run anything under
> `backend/db/migrations/`, or add new migrations to `backend/db/migrations/`
> (as the "📝 Миграции" section below still suggests) — doing so would create
> tables/columns that do not match, and could conflict with, the real schema.
> New migrations belong in `backend/supabase/migrations/`, following that
> directory's existing `0NN_description.sql` naming convention.
>
> Confirmed orphaned as of 2026-09-11: no application code, build script, CI
> config, or other documentation references `backend/db/schema.sql`,
> `backend/db/seed.sql`, or `backend/db/migrations/`. This folder is kept only
> for historical reference.

# Aviaframe Database Schema (historical draft — see warning above)

Эта папка содержит SQL-скрипты для создания структуры базы данных Aviaframe в Supabase (PostgreSQL).

## 📋 Файлы

- `schema.sql` — Основная схема базы данных с таблицами, индексами, триггерами и RLS политиками
- `seed.sql` — Тестовые данные для разработки (опционально)

## 🗄️ Структура таблиц

### Основные таблицы (запрошенные)

1. **organizations** — Организации/агентства (B2B клиенты)
   - Многопользовательская архитектура (multi-tenant)
   - Статусы: active, suspended, deleted
   - Автоматические поля: `created_at`, `updated_at`

2. **searches** — История поисков билетов
   - Привязка к организации (`tenant_id`)
   - Параметры поиска: origin, destination, dates, passengers
   - Метрики: количество результатов, длительность поиска
   - Только `created_at` (immutable logs)

3. **bookings** — Заказы/бронирования
   - Статусы: PENDING, BOOKED, ISSUED, CANCELLED, FAILED, RECONCILE
   - Цены: `NUMERIC(10,2)` для точных денежных расчетов
   - Даты: `TIMESTAMPTZ` с часовыми поясами
   - Шифрование: `passenger_data` (JSONB) для PII
   - Автоматические поля: `created_at`, `updated_at`, `issued_at`, `cancelled_at`

### Дополнительные таблицы (для полноценной работы)

4. **users** — Пользователи агентств (агенты, администраторы)
   - Привязка к организации
   - Роли через таблицу `roles`
   - Email уникален в рамках tenant

5. **roles** — Роли для RBAC
   - Предустановленные: platform_admin, agency_admin, agent
   - Права доступа в JSONB

6. **drct_request_logs** — Логи запросов к DRCT API
   - Append-only (только добавление)
   - Санитизированные данные (без сырого PII)
   - Метрики производительности

7. **audit_logs** — Аудит действий пользователей
   - Immutable (неизменяемый)
   - Маскированные IP адреса
   - Для compliance и форензики

## 🚀 Применение схемы в Supabase

### Вариант 1: Через Supabase Dashboard (рекомендуется)

1. Откройте [Supabase Dashboard](https://supabase.com/dashboard)
2. Выберите ваш проект: `kirvqjgyxjyvwflghchw`
3. Перейдите в **SQL Editor**
4. Нажмите **New Query**
5. Скопируйте содержимое `schema.sql`
6. Нажмите **Run** или `Cmd+Enter`

### Вариант 2: Через psql (командная строка)

```bash
# Получите строку подключения из Supabase Dashboard → Settings → Database
psql "postgresql://postgres:[YOUR-PASSWORD]@db.kirvqjgyxjyvwflghchw.supabase.co:5432/postgres" -f backend/db/schema.sql
```

### Вариант 3: Через Node.js скрипт

```javascript
const supabase = require('./src/lib/supabase');
const fs = require('fs');

const schema = fs.readFileSync('./db/schema.sql', 'utf8');

// Выполнить через Supabase SQL
// (требует admin доступ)
```

## 🔐 Row Level Security (RLS)

Схема включает политики RLS для защиты данных:

- **Tenant Isolation**: Пользователи видят только данные своей организации
- **Настройка контекста**: Используйте `SET app.current_tenant_id = 'uuid'` для установки tenant context

### Примеры использования RLS

```sql
-- Установить текущий tenant (в вашем middleware)
SET app.current_tenant_id = 'your-tenant-uuid-here';

-- Теперь все запросы будут автоматически фильтроваться по tenant_id
SELECT * FROM bookings; -- Вернет только bookings для текущего tenant
```

## 📊 Типы данных

### Денежные значения
- **Тип**: `NUMERIC(10, 2)`
- **Пример**: `1234.56` (до 8 цифр до запятой, 2 после)
- **Почему**: Точность без ошибок округления (в отличие от FLOAT)

### Даты и время
- **Тип**: `TIMESTAMPTZ`
- **Формат**: ISO 8601 с часовым поясом
- **Пример**: `2026-01-26T15:30:00+00:00`
- **Почему**: Автоматическое преобразование часовых поясов

### UUID
- **Тип**: `UUID`
- **Генерация**: `uuid_generate_v4()`
- **Пример**: `550e8400-e29b-41d4-a716-446655440000`

### JSONB
- **Тип**: `JSONB` (бинарный JSON с индексацией)
- **Использование**: metadata, permissions, fare_breakdown, passenger_data
- **Преимущества**: Гибкость + производительность запросов

## 🔍 Индексы

Схема включает индексы для оптимизации запросов:

- **tenant_id**: На всех tenant-scoped таблицах (критично для multi-tenancy)
- **created_at**: Для сортировки по дате (DESC для последних записей)
- **status**: Для фильтрации по статусам
- **Foreign keys**: Автоматические индексы на FK

## 🔄 Автоматические триггеры

### updated_at
Таблицы с триггером автоматического обновления `updated_at`:
- organizations
- roles
- users
- bookings

```sql
-- Триггер автоматически обновляет updated_at при UPDATE
UPDATE bookings SET status = 'ISSUED' WHERE id = '...';
-- updated_at будет автоматически установлен в NOW()
```

## 📈 Представления (Views)

### booking_stats_by_org
Статистика бронирований по организациям:
- Количество по статусам (booked, issued, cancelled)
- Общая выручка
- Группировка по валютам

```sql
SELECT * FROM booking_stats_by_org WHERE organization_id = 'your-uuid';
```

### search_stats_by_org
Статистика поисков по организациям:
- Общее количество поисков
- Поиски с результатами
- Средняя длительность поиска
- По дням

```sql
SELECT * FROM search_stats_by_org
WHERE organization_id = 'your-uuid'
  AND search_date >= CURRENT_DATE - INTERVAL '30 days';
```

## 🧪 Тестовые данные

После применения схемы, в базе будет создана тестовая организация:
- **Name**: Test Travel Agency
- **Legal Name**: Test Travel Agency LLC
- **Country**: AE (UAE)
- **Currency**: AED
- **Status**: active

## 🔒 Безопасность PII

### Шифрование данных пассажиров

В таблице `bookings`:
- `passenger_data` — JSONB с зашифрованными данными пассажиров
- `contact_email` — маскированный email
- `contact_phone` — маскированный телефон

### Логи без PII
- `drct_request_logs` — только санитизированные данные
- `audit_logs` — замаскированные IP адреса и PII

## 📝 Миграции

⚠️ **Устарело.** Реальные миграции живут в `backend/supabase/migrations/` —
см. предупреждение в начале файла. Не создавайте новые файлы в
`backend/db/migrations/`.

## 🆘 Troubleshooting

### Ошибка: "extension uuid-ossp does not exist"
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```
Убедитесь что запускаете с правами суперпользователя или в Supabase Dashboard.

### Ошибка: RLS блокирует запросы
Временно отключить для тестирования:
```sql
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;
```

### Сброс схемы (ВНИМАНИЕ: Удаляет все данные!)
```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
-- Затем применить schema.sql заново
```

## 📚 Дополнительные ресурсы

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Data Types](https://www.postgresql.org/docs/current/datatype.html)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Aviaframe Data Model](../docs/05_DATA_MODEL.md)

---

**Последнее обновление:** 2026-01-26
