# Email Service Phase 1 (n8n + Supabase)

## What is implemented
Phase 1 adds a production-ready email foundation without breaking current flows:

- Supabase tables for event-driven notifications and delivery tracking.
- Backend API endpoints for:
  - creating notification events,
  - internal dequeue for n8n,
  - recording outbox send results,
  - receiving provider delivery webhooks.
- n8n workflow skeleton for dequeue -> send -> write outbox.

## Files
- Migration: `backend/supabase/migrations/010_notification_email_phase1.sql`
- Backend API: `backend/src/index.js`
- n8n flow: `backend/n8n_workflows/email_notifications_phase1.json`
- Env example: `backend/.env.example`

## New DB tables
- `public.notification_events`
- `public.email_templates`
- `public.notification_rules`
- `public.email_outbox`
- `public.email_events`

## API endpoints

### 1) Create notification event (authenticated staff)
`POST /api/notifications/events`

Body example:
```json
{
  "event_type": "ticket_issued",
  "entity_type": "order",
  "entity_id": "<order-id>",
  "agency_id": "<agency-id>",
  "recipient_email": "client@example.com",
  "template_key": "ticket_issued",
  "payload": {
    "order_number": "AVF123456",
    "ticket_number": "176-1234567890"
  },
  "idempotency_key": "ticket-issued-<order-id>-v1"
}
```

### 2) Dequeue events for n8n (internal token)
`POST /api/internal/notifications/dequeue`

Headers:
- `x-internal-token: <INTERNAL_API_TOKEN>`

Body:
```json
{ "limit": 50 }
```

### 3) Record outbox result from n8n (internal token)
`POST /api/internal/notifications/outbox`

Headers:
- `x-internal-token: <INTERNAL_API_TOKEN>`

Body example:
```json
{
  "event_id": "<notification-event-id>",
  "to_email": "client@example.com",
  "template_key": "ticket_issued",
  "provider": "resend",
  "provider_message_id": "abc123",
  "status": "sent",
  "payload": { "provider_response": "..." }
}
```

### 4) Provider webhook for delivery statuses
`POST /api/webhooks/email-provider`

Headers:
- `x-email-webhook-secret: <EMAIL_WEBHOOK_SECRET>`

Body:
- provider event object or array of objects.

## Required env vars
Add in backend runtime:
- `INTERNAL_API_TOKEN`
- `EMAIL_WEBHOOK_SECRET`

Optional for workflow variables:
- `BACKEND_BASE_URL`
- `EMAIL_PROVIDER_API_URL`
- `EMAIL_PROVIDER_AUTH_HEADER`
- `EMAIL_PROVIDER_NAME`
- `EMAIL_FROM`

## n8n setup
1. Import: `backend/n8n_workflows/email_notifications_phase1.json`
2. Set workflow/environment variables listed above.
3. Replace provider request body/headers with your provider exact contract (Resend/Postmark/SES).
4. Schedule execution (cron) or trigger from upstream workflow.

## Apply migration
Run SQL from:
`backend/supabase/migrations/010_notification_email_phase1.sql`

## Smoke test
1. Create event via `POST /api/notifications/events`.
2. Run n8n workflow manually.
3. Verify row in `email_outbox` with `status='sent'`.
4. Send provider webhook test payload.
5. Verify `email_events` inserted and `email_outbox.status` moved (e.g., `delivered`).

