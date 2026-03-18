# AviaFrame x Pipedrive — Sales Automation Blueprint

Статус: рабочий blueprint для реализации агентом  
Дата: 2026-03-09  
Область: GTM/Sales/Onboarding automation (pre-Railway -> post-Railway target)

---

## 1) Цель

Построить максимально автоматизированную воронку продаж для агентств:
- холодные и повторные email-касания,
- перевод заинтересованных лидов в встречу/звонок,
- автозапуск onboarding после `Deal Won`,
- сокращение времени до `first booking`.

Ключевой принцип:
- `Pipedrive` = system of record для sales.
- `AviaFrame` = execution platform для provisioning, onboarding и product activation.

---

## 2) Целевая модель (high level)

```text
Lead Sources (CSV / forms / outbound lists / website)
            |
            v
       Pipedrive CRM
 (Leads, Persons, Orgs, Deals, Activities, Campaigns)
            |
            | Automations + Campaigns + Scheduler
            v
  Meeting booked / Call consent / Deal won
            |
            | Webhook events
            v
      AviaFrame Backend (Railway)
            |
            +--> Supabase (agencies, onboarding, integration_events, billing)
            +--> Email/notifications
            +--> Widget/subdomain provisioning
            +--> Status sync back to Pipedrive
```

---

## 3) Две параллельные воронки

### 3.1 Self-serve funnel

```text
Website -> Signup -> Agency created -> Widget install -> First search -> First booking
```

Назначение:
- быстрый low-touch рост,
- минимальная нагрузка на sales team.

### 3.2 Sales-assisted funnel (Pipedrive)

```text
Lead -> Outreach -> Engaged -> Qualified -> Meeting/Call -> Proposal -> Won -> Onboarding/Activation
```

Назначение:
- high-value партнеры,
- сделки с участием менеджера.

Важно: этапы `Onboarding/Activation` вести как post-sale motion (отдельный pipeline или отдельный блок KPI), не смешивая с классическими sales KPI.

---

## 4) Pipedrive CRM модель

## 4.1 Pipelines

### Pipeline A: Sales
- New
- Outreach
- Engaged
- Qualified
- Meeting Scheduled
- Proposal Sent
- Won
- Lost

### Pipeline B: Activation (post-sale)
- Onboarding Started
- Agency Provisioned
- Widget/Subdomain Delivered
- First Search
- First Booking
- Activated
- Stalled

## 4.2 Обязательные поля (custom fields)

### Lead/Org fields
- `agency_external_id` (string, unique in AviaFrame)
- `country` (enum)
- `language` (enum)
- `segment` (enum: travel_agency, tour_operator, affiliate)
- `source` (enum: outbound, referral, inbound, event)
- `preferred_contact` (enum: meeting, call, whatsapp, email)

### Activation fields
- `onboarding_mode` (enum: widget, subdomain, hosted_portal)
- `onboarding_status` (enum: not_started, in_progress, blocked, completed)
- `activation_status` (enum: not_activated, first_search, first_booking, activated)
- `widget_installed` (boolean)
- `first_search_at` (datetime)
- `first_booking_at` (datetime)

### Commercial fields
- `monthly_volume_estimate` (number)
- `billing_status` (enum: not_set, trial, active, overdue)

---

## 5) Email стратегия (Campaigns + Sequences)

## 5.1 Базовая sequence
- D0: Intro + value proposition
- D+2: Case study + social proof
- D+5: Product demo + clear CTA
- D+9: Reminder + quick setup angle
- D+14: Last call

## 5.2 CTA в каждом письме
- `Book a meeting`
- `Request a call`
- `Start free trial`

## 5.3 Правила
- при ответе/встрече/звонке sequence останавливается,
- bounced/unsubscribed попадают в suppression,
- inactivity N дней -> reactivation sequence.

---

## 6) Автоматизации в Pipedrive

1. New lead -> enroll в outreach sequence.
2. Нет активности до даты `next_touch_at` -> follow-up activity/email.
3. Клик/форма `Book meeting` -> activity type `meeting` + stage update.
4. Клик/форма `Call me` -> activity `call` + task owner + SLA deadline.
5. Deal moved to `Won` -> webhook в AviaFrame.
6. Deal moved to `Lost` -> capture reason + nurture later.

---

## 7) Интеграция Deal Won -> AviaFrame

## 7.1 Endpoint

`POST /api/integrations/pipedrive/deal-won`

## 7.2 Минимальный payload (нормализованный)

```json
{
  "event_id": "pd_evt_123",
  "deal_id": 9876,
  "person": {
    "name": "John Doe",
    "email": "john@agency.com",
    "phone": "+966..."
  },
  "organization": {
    "name": "Golden Travel",
    "country": "SA"
  },
  "owner": {
    "email": "sales@aviaframe.com"
  },
  "onboarding_mode": "widget",
  "metadata": {
    "source": "outbound"
  }
}
```

## 7.3 Обработка на backend

1. Проверить подпись webhook.
2. Проверить idempotency (`deal_id` + `event_id`).
3. Создать/обновить `agency` в Supabase.
4. Запустить onboarding flow по `onboarding_mode`.
5. Создать initial billing profile.
6. Сохранить event-log в `integration_events`.
7. Отправить статус обратно в Pipedrive (note/activity).

## 7.4 Idempotency rules
- уникальный индекс `integration_events(provider, event_id)`
- уникальный индекс `agencies(external_deal_id)`
- повторный webhook должен возвращать `200 already_processed`.

---

## 8) Onboarding сценарии

## 8.1 Widget mode (MVP first)

1. Генерация конфигурации (`brand color`, `language`, `currency`, `layout`).
2. Генерация embed code.
3. Отправка setup-email + короткая инструкция.
4. Проверка первой установки (script ping / first search event).

## 8.2 Subdomain mode

1. Выдать target DNS записи.
2. Проверить TXT/CNAME ownership.
3. Выпустить SSL.
4. Активировать branded subdomain.

## 8.3 Hosted portal mode

1. Создать hosted tenant URL.
2. Применить branding preset.
3. Выдать login + quickstart.

---

## 9) Billing MVP (после provisioning stability)

Рекомендуемая модель: wallet/top-up.

Поток:
- Agency top-up -> wallet balance.
- Каждое бронирование -> fee deduction.
- Низкий баланс -> уведомление + top-up CTA.

Таблицы:
- `agency_wallet`
- `wallet_transactions`
- `payment_sessions`
- `invoices`

Принцип MVP:
- начать с 1 основной валюты,
- заложить расширяемость под multi-currency.

---

## 10) Надежность интеграций

Обязательно:
- retry with exponential backoff,
- DLQ для неуспешных событий,
- `integration_events` журнал,
- Sentry/alerts для integration failures,
- manual replay tool по `event_id`.

Рекомендуемые SLA:
- `Deal Won -> Agency Provisioned` < 5 минут,
- `Engaged lead -> first manager contact` < 2 часа (рабочее время),
- `Agency Provisioned -> first search` < 24 часа.

---

## 11) KPI и аналитика

Sales KPIs:
- lead -> meeting conversion,
- meeting -> won conversion,
- days to close,
- reply rate/open rate/click rate.

Activation KPIs:
- won -> provisioned,
- provisioned -> widget installed,
- installed -> first search,
- first search -> first booking,
- time-to-first-booking.

Operational KPIs:
- webhook success rate,
- retries per event,
- DLQ volume,
- onboarding SLA breach rate.

---

## 12) Security & Compliance

- Валидация подписи webhook.
- Secret rotation для integration tokens.
- RBAC в CRM и backend admin.
- Audit trail для ключевых действий.
- Unsubscribe/suppression и email compliance.
- Rate limiting на widget/API.

---

## 13) План внедрения (6-8 недель)

## Phase 1 (Week 1-2): CRM foundation
- Настроить pipelines/stages/custom fields.
- Подготовить 5 email templates и sequence.
- Настроить scheduler + call-consent flow.

Definition of Done:
- Лид проходит весь путь до meeting/call без ручных переносов.

## Phase 2 (Week 3-4): Deal Won integration
- Реализовать webhook endpoint в backend.
- Добавить idempotency + event logging.
- Синхронизировать статус обратно в Pipedrive.

Definition of Done:
- `Deal Won` автоматически создает agency без дублей.

## Phase 3 (Week 5-6): Onboarding automation
- Widget configurator MVP.
- Авто-email onboarding package.
- Activation event tracking (`first_search`, `first_booking`).

Definition of Done:
- Новый партнер получает код и делает первый поиск без участия инженера.

## Phase 4 (Week 7-8): Billing + hardening
- Wallet MVP + top-up flow.
- Retry/DLQ/manual replay.
- Финальные дашборды KPI/SLA.

Definition of Done:
- Полный цикл `lead -> won -> activation -> billing` работает стабильно.

---

## 14) Технический backlog (priority)

P0:
- Pipedrive webhooks integration
- Idempotency and integration_events
- Onboarding mode orchestration
- Sentry for integration path

P1:
- Widget configurator + setup package
- Activation telemetry
- SLA dashboards

P2:
- Hosted portal onboarding
- Referral/affiliate program
- Advanced scoring/routing

---

## 15) Риски и меры

Риск: много `Won`, мало `Activated`.  
Мера: отдельный Activation pipeline + SLA + nudges.

Риск: дубли agency из-за повторных webhook.  
Мера: idempotency ключи и unique constraints.

Риск: низкая deliverability email-кампаний.  
Мера: SPF/DKIM/DMARC, прогрев, suppression hygiene.

Риск: сложный onboarding для партнеров.  
Мера: widget-first onboarding, 10-минутный quickstart.

---

## 16) Минимальные артефакты для агента (what to produce)

1. CRM setup checklist (pipelines, fields, automations).
2. Backend integration spec (`deal-won` webhook contract).
3. SQL migration for `integration_events` + idempotency indexes.
4. Onboarding playbook templates (widget/subdomain/hosted).
5. KPI dashboard spec (sales + activation + reliability).

---

## 17) Решения по умолчанию (если нет уточнений)

- CRM: Pipedrive + Campaigns enabled.
- Infrastructure: Railway (backend jobs/API), Supabase (data).
- Onboarding default: `widget`.
- Billing default MVP: wallet single-currency.
- Sales model: hybrid (`self-serve` + `sales-assisted`).

