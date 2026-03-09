# Aviaframe — Current Setup (Pre-Railway)

_Зафиксировано: 2026-03-07. Актуальное состояние до миграции на Railway._

## Архитектура

```text
Browser / Partner Sites (Netlify)
        |
        |- /api/backend/*  --> ngrok tunnel --> MacBook:3000 (Express backend)
        |- /api/n8n/*      --> ngrok tunnel --> MacBook:3000 --> n8n:5678 (proxy)
        \- static files    --> Netlify CDN
                                      |
                               Supabase Cloud (DB + Auth + Storage)
                               DRCT API (external, через n8n)
```

Ключевой факт: backend и n8n работают на локальном MacBook через ngrok. Если ноутбук выключен или ngrok не запущен, сервис недоступен.

## Компоненты и расположение

| Компонент | Путь | Где работает |
|---|---|---|
| Backend (Express) | `/Users/sergejdaniluk/projects/aviaframe/backend/` | MacBook:3000 |
| n8n | `/Users/sergejdaniluk/n8n-https/` (Docker) | MacBook:5678 |
| Portal (admin.aviaframe.com) | монорепо `/portal/client/` | Netlify (`03db489d`) |
| Public site (aviaframe.com) | `/Users/sergejdaniluk/projects/aviaframe/aviaframe-site/` | Netlify |
| Widget source | монорепо `/widget/src/widget.js` | локальная сборка |
| Partner sites | `/Users/sergejdaniluk/projects/aviaframe/partners/` | Netlify (разные site ID) |
| Supabase | cloud | `kirvqjgyxjyvwflghchw.supabase.co` |

Монорепо: `/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation (2)/`

## Локальный запуск (current setup)

### 1) ngrok

```bash
ngrok http --domain=benedictory-tyrannous-norris.ngrok-free.dev 3000
```

Домен: `https://benedictory-tyrannous-norris.ngrok-free.dev`
- Проксирует на backend port `3000` (не на n8n)
- `/api/*` -> backend
- `/webhook/*` и `/webhook-test/*` -> backend proxy на `n8n:5678`

### 2) Backend

```bash
cd /Users/sergejdaniluk/projects/aviaframe/backend
node src/index.js
# или:
node --watch src/index.js
```

### 3) n8n

```bash
cd /Users/sergejdaniluk/n8n-https
docker compose up -d
# или restart:
docker compose restart n8n
```

n8n: `http://localhost:5678`
- Basic Auth: хранится в `docker-compose.yml`
- SQLite: `~/.n8n/database.sqlite`

### 4) Portal (локально)

```bash
cd "/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation (2)/portal/client"
npm run dev
```

## Environment variables

Секреты не дублируются в этом документе. Используйте исходные файлы:
- Backend: `/Users/sergejdaniluk/projects/aviaframe/backend/.env`
- Portal: `/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation (2)/portal/client/.env`
- n8n Docker: `/Users/sergejdaniluk/n8n-https/docker-compose.yml`

Критичные переменные по категориям:
- Backend: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, SMTP credentials, `WIDGET_TOKEN_SECRET`, `EMAIL_WEBHOOK_SECRET`, `INTERNAL_API_TOKEN`, `CORS_ORIGINS`
- Portal: `VITE_N8N_*`, `VITE_SUPABASE_*`, `VITE_USE_BACKEND_ORDERS`, `VITE_BACKEND_API_BASE_URL`
- n8n: `N8N_BASIC_AUTH_*`, `WEBHOOK_URL`, `N8N_CORS_ALLOW_ORIGIN`

## Netlify redirects (Portal)

Генерируются: `portal/client/scripts/write-redirects.js`

Netlify env:
- `BACKEND_URL=https://benedictory-tyrannous-norris.ngrok-free.dev`

Результирующий `dist/_redirects`:

```text
/api/backend/*            https://benedictory-tyrannous-norris.ngrok-free.dev/api/:splat   200
/api/n8n/webhook-test/*   https://benedictory-tyrannous-norris.ngrok-free.dev/webhook/:splat 200
/api/n8n/*                https://benedictory-tyrannous-norris.ngrok-free.dev/:splat         200
/*                        /index.html                                                         200
```

Backend proxy n8n: `backend/src/index.js`

## Netlify sites

- Portal: `admin.aviaframe.com` (`03db489d-129d-4e6b-b7f3-5b7ce3f55d86`)
- Public: `aviaframe.com`
- Sahab Al Alam: `ae7e3eed-a55c-4350-84fd-c550c0aa80d5`
- UTD Travel: `dc3d9ed1-68e4-4ab7-b0b5-f611c9a3abcd`
- Skyways: `6b831fca-20dd-4566-bfbd-d463547ed19d`
- The Golden: `c393b04e-3d6c-4e49-bc7f-20b477b1dbf3`

Netlify CLI path:
- `node ~/.npm/_npx/da5c1b6ea715e8b4/node_modules/netlify-cli/bin/run.js`

## n8n workflows

- Order creation: `w5Wu8AKKK5iBMAMT`, webhook `POST /webhook/drct/order/create`
- Email dispatch: `B9EGaX3ZtFVbI38E`, cron каждую минуту

Storage:
- `~/.n8n/database.sqlite` (workflow JSON)

Patterns:
- Использовать `specifyBody: "json"` + `jsonBody: ={{ JSON.stringify({...}) }}`
- Не использовать `bodyParameters` для Supabase RPC/Resend (form-encoded)
- Для прод-логики использовать `/webhook/`, не `/webhook-test/`

## Supabase

- URL: `https://kirvqjgyxjyvwflghchw.supabase.co`
- Ключи: в `.env` (см. выше)

Ключевые таблицы:
- `orders`, `agencies`, `notification_events`, `email_templates`, `agency_email_templates`

Email pipeline:
- `notification_events`: `pending -> processing -> processed/failed`
- RPC: `claim_notification_events(p_limit=1)`
- RPC: `finish_notification_event(id, status, error)`
- Сброс зависших `processing`: PATCH в Supabase API на `pending`

## Backend structure

```text
backend/src/
  index.js  (монолитный файл)
  lib/
    supabase.js
  services/
    emailService.js
    pdfService.js
```

Ключевые endpoints:
- `GET /healthz`
- `POST /public/search`
- `POST /api/orders/create`
- `PATCH /api/orders/:id`
- `GET /api/orders`
- `GET /api/admin/orders`
- `POST /api/admin/agencies`
- `GET /api/admin/agencies`
- `POST /api/internal/send-email`
- `GET /api/admin/email-templates`

## Widget

Source:
- `widget/src/widget.js`

Build:

```bash
cd widget
npm run build
```

Output:
- `widget/dist/aviaframe-widget.iife.js`

Post-build deploy copies:

```bash
cp widget/dist/aviaframe-widget.iife.js portal/client/public/partner-widget/aviaframe-widget.js
cp widget/dist/aviaframe-widget.iife.js aviaframe-site/public/widget/aviaframe-widget.js
# + вручную для каждого партнерского сайта
```

Main attributes:
- `data-api-url`
- `data-booking-url`
- `data-brand-color`
- `data-accent-color`
- `data-brand-name`

## DRCT API

- Sandbox: `https://sandbox-api.drct.aero`
- Поиск/заказ через n8n workflow `w5Wu8AKKK5iBMAMT`
- `phone` и `email` на уровне каждого пассажира
- `document.gender` обязателен
- Fallback DOB: CHD `today-8y`, INF `today-1y`, ADT `1990-01-01`

## Recovery playbook

Если backend не отвечает:

```bash
curl https://benedictory-tyrannous-norris.ngrok-free.dev/healthz
ngrok http --domain=benedictory-tyrannous-norris.ngrok-free.dev 3000
cd /Users/sergejdaniluk/projects/aviaframe/backend && node src/index.js
```

Если n8n не работает:

```bash
cd /Users/sergejdaniluk/n8n-https && docker compose restart n8n
```

После restart нужен re-activate workflow в n8n UI.

Если email не уходит:
- Проверить `notification_events` со статусом `processing` > 5 минут
- Сбросить в `pending`, обнулить claim-поля/attempts

Если portal не деплоится:

```bash
cd "/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation (2)/portal/client"
npm run build
node ~/.npm/_npx/da5c1b6ea715e8b4/node_modules/netlify-cli/bin/run.js deploy --prod --dir=dist --site=03db489d-129d-4e6b-b7f3-5b7ce3f55d86
```

---

Owner note:
- Это baseline-документ до migration track на Railway.
- При изменении любого URL/туннеля/ключевого маршрута обновлять этот файл в первую очередь.
