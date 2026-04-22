# AviaFrame — Tasks

> Текущие задачи проекта. Обновляется вручную.
> Workflow: Cowork ставит задачу → Code реализует → отмечаем ✅

---

## 🔴 В работе (In Progress)

_Сюда идёт то, что делается прямо сейчас._

---

## 🟠 Технический долг — приоритет (сделать до новых фич)

> ТЗ готовы в `/docs/`. Code может реализовывать по ним напрямую.

### 1. Рефакторинг backend/src/index.js → модульная структура
- [ ] Вынести конфиг в `config.js`
- [ ] Вынести хелперы в `utils/helpers.js`
- [ ] Разбить роуты по файлам: `routes/orders.js`, `routes/admin/*.js`, `routes/widget.js` и др.
- [ ] Создать `app.js` (express setup) отдельно от `index.js` (listen)
- [ ] Добавить централизованный `middleware/error-handler.js`
- **ТЗ:** `docs/refactoring-backend-structure.md`

### 2. DRCT надёжность: rate limit + circuit breaker + retry
- [ ] Установить `bottleneck`, `opossum`
- [ ] Создать `services/drctQueue.js` (rate limiter 1 rps)
- [ ] Создать `services/drctCircuitBreaker.js`
- [ ] Создать `utils/retry.js` (exponential backoff)
- [ ] Обернуть все DRCT-вызовы в n8nClient.js
- **ТЗ:** `docs/drct-reliability.md`

### 3. Observability: структурированные логи + метрики
- [ ] Установить `pino`, `pino-http`, `prom-client`
- [ ] Создать `lib/logger.js`
- [ ] Заменить все `console.*` на `logger.*` с контекстом
- [ ] Создать `lib/metrics.js` (DRCT latency, circuit state, queue size)
- [ ] Добавить `/healthz/deep` и `/metrics` endpoints
- **ТЗ:** `docs/observability.md`

---

## 🟡 Бэклог (To Do)

### Backend
- [ ] Реализовать order lifecycle: search → price → create → issue → cancel
- [ ] Rate limiting для DRCT (1 rps per account)
- [ ] Idempotency для order_create и issue (Idempotency-Key header + DB lock)
- [ ] Audit log: все state-changing операции
- [ ] DRCTRequestLog: логировать каждый вызов DRCT (latency, status, tenant_id)
- [ ] PII-маскировка в логах (паспорт, email, телефон)
- [ ] Email-сервис: подтверждение бронирования, invite-письма

### Portal
- [ ] Super Admin: создание и управление агентствами
- [ ] Agency Admin: настройка виджета (цвет, лого, allowed origins)
- [ ] Agency Admin: получение embed snippet
- [ ] Управление заказами (поиск, бронирование, выпуск, отмена)
- [ ] Управление пользователями внутри агентства
- [ ] Analytics tab: базовые метрики по агентству

### Widget
- [ ] Flight search UI (форма поиска)
- [ ] Offer listing (список предложений)
- [ ] Passenger data collection
- [ ] White-label: брендирование от агентства, нет AviaFrame-логотипа
- [ ] Валидация allowed_origins при инициализации

### Инфраструктура
- [ ] Docker-compose для локального dev (backend + portal)
- [ ] Railway деплой backend
- [ ] Supabase: применить все миграции в production
- [ ] n8n: настроить webhook-flow для order lifecycle
- [ ] CI: lint + test на каждый PR

---

## ✅ Готово (Done)

- [x] Монорепозиторий scaffold (backend, portal, widget, docs, infra)
- [x] BRD v1.1 — бизнес-требования
- [x] PRD v1.1 — продуктовые требования
- [x] SRS — системные требования
- [x] Data model — схема БД
- [x] API Spec — спецификация эндпоинтов
- [x] DRCT Integration guide
- [x] Security doc
- [x] Super Admin MVP spec (v2.0)
- [x] Widget customization spec
- [x] White-label MVP spec
- [x] Email service spec
- [x] Magic link auth (Supabase Auth)
- [x] Базовый docker-compose

---

## 📌 Принципы работы с этим файлом

- Задачи, которые требуют архитектурного решения → сначала обсуждаем в **Cowork**, фиксируем в `/docs/decisions.md`
- Задачи с готовым ТЗ → отдаём в **Code** с ссылкой на doc
- Завершённые задачи → переносим в раздел ✅ Done
