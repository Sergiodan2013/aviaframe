# CI Support Bot Architecture

Date: 2026-09-03
Status: proposed
Owner: Product + Backend + Ops

## Purpose

This document proposes a practical support architecture for AviaFrame where a customer-facing CI chatbot:

- collects structured information for post-booking issues;
- retrieves the relevant booking and customer context;
- tries to resolve common cases automatically;
- escalates unresolved cases to internal support through durable operational channels.

Primary target use case:

- an issue on an existing booking;
- collect all available information from the customer and from AviaFrame data;
- if automation is not enough, route the case to internal support via email first and WhatsApp-based escalation where operationally safe.

## What already exists

AviaFrame already has several building blocks needed for a first production version.

### 1. Canonical booking state already exists

- `orders` in Supabase is the canonical booking record.
- `customer_profiles` already stores reusable contact and passenger profile data.
- customer self-service booking history already exists on the website via `/my-bookings.html`.

Relevant files:

- `backend/src/routes/orders.js`
- `backend/src/services/customerProfile.js`
- `aviaframe-site/my-bookings.html`
- `aviaframe-site/customer-account.js`

### 2. Support email sending already exists

- `POST /api/support/requests` already validates auth, optionally binds the request to an order, accepts an attachment, and sends an email to the support inbox.

Relevant files:

- `backend/src/routes/support.js`
- `backend/src/services/emailService.js`
- `backend/src/config.js`

### 3. Event-driven notifications already exist

- `notification_events`, `email_outbox`, and `email_events` already provide a durable notification/outbox foundation.
- n8n is already part of the platform architecture and is a natural place for support escalations and channel fan-out.

Relevant files:

- `backend/src/routes/notifications.js`
- `docs/EMAIL_SERVICE_PHASE1.md`
- `backend/n8n_workflows/email_notifications_phase1.json`
- `docs/decisions.md`

### 4. Security and operational constraints are already documented

- tenant scoping, PII handling, and auditability are first-class requirements in the repo.
- there is an explicit warning that support/onboarding still rely too much on inbox fallbacks instead of proper operator abstractions.

Relevant files:

- `docs/05_DATA_MODEL.md`
- `docs/08_SECURITY.md`
- `docs/20_PLATFORM_PLAN_HARDENING_REVIEW_AND_REMEDIATION_BACKLOG_2026-08-06.md`

## Target architecture

The cleanest architecture is not "LLM chatbot directly talking to everything". It should be a controlled support workflow with an LLM layer inside guardrails.

### Components

1. `Support Chat UI`
- embedded website chat widget on booking pages and `my-bookings` page;
- optionally available later inside the portal for agents.

2. `Support Orchestrator API`
- new backend module in `backend/src/routes/support-chat.js` plus services;
- owns conversation state, case creation, retrieval, and escalation decisions;
- exposes a small set of support-safe tools to the AI layer.

3. `Case Store`
- new Supabase tables for support cases, messages, attachments, routing, and audit trail.

4. `Support AI Layer`
- intent classification;
- structured slot-filling;
- answer generation based on allowed data only;
- escalation decisioning based on rules plus confidence thresholds.

5. `Support Operations Router`
- n8n workflow that takes a created support case and fans out to email, WhatsApp, and later Slack/helpdesk systems.

6. `Internal Support Console`
- new portal section for open cases, conversation transcript, booking timeline, and operator actions.

## Recommended data flow

### A. Entry and identity

There should be two entry modes.

1. `Authenticated customer`
- user is signed in on `my-bookings`;
- chatbot receives `customer_id`, `email`, and can list that customer’s orders safely.

2. `Unauthenticated customer`
- chatbot asks for booking reference plus one verifier:
  - email, or
  - phone, or
  - last name.
- backend resolves the order only after verification succeeds.

Rule:

- never let the LLM run arbitrary booking lookups;
- booking resolution must happen through backend-owned tools with tenant and identity checks.

### B. Conversation workflow for existing booking issues

1. Customer opens chat from booking page or `my-bookings`.
2. Bot identifies intent: existing booking issue.
3. Bot resolves booking:
   - by current authenticated session, or
   - by booking reference + verifier.
4. Backend assembles a `support context packet`:
   - order status;
   - payment status;
   - ticket issuance status;
   - travel route and dates;
   - contact data;
   - last outbound email statuses if available;
   - recent DRCT correlation IDs or sanitized event history;
   - agency routing metadata.
5. Bot asks only for missing facts:
   - what exactly is wrong;
   - affected passenger;
   - desired outcome;
   - urgency;
   - screenshots or documents if relevant.
6. Rules engine decides:
   - auto-answer;
   - create human case;
   - immediate escalation.
7. Backend persists the case and transcript.
8. n8n routes the escalation:
   - email to support queue;
   - operator WhatsApp notification if configured;
   - optional additional internal channel.
9. Human support continues in portal or outside channel, with the case linked back to the booking.

### C. Common auto-resolvable cases

The bot should resolve only narrow, low-risk cases at first.

- "Where is my ticket?"
- "Was my payment received?"
- "I did not receive the email."
- "What is my booking status?"
- "Please resend documents."
- "Which support channel should I use for changes or refunds?"

The bot should not autonomously execute high-risk actions in phase 1.

- ticket issue;
- cancellation;
- refund approval;
- itinerary change;
- fare repricing;
- compensation promise;
- manual provider-side operations.

For those, it should gather facts and escalate.

## Proposed new backend capabilities

### New APIs

1. `POST /api/support/chat/session`
- start or resume support conversation;
- returns chat session ID and available customer context.

2. `POST /api/support/chat/message`
- accepts user message and attachments;
- runs orchestrator;
- returns assistant reply and any structured next questions.

3. `POST /api/support/cases`
- explicit case creation from bot or human UI.

4. `GET /api/support/cases/:id`
- case detail for portal operators.

5. `POST /api/support/cases/:id/escalate`
- triggers routing workflow manually or automatically.

6. `POST /api/support/cases/:id/close`
- closes resolved cases with reason.

### New backend services

- `supportCaseService`
- `supportConversationService`
- `supportContextService`
- `supportRoutingService`
- `supportPolicyService`
- `supportAiOrchestrator`

## Proposed new database model

Add the following Supabase tables.

### 1. `support_cases`

Core record.

- `id`
- `agency_id`
- `order_id`
- `customer_profile_id` nullable
- `channel` (`web_chat`, `portal`, `email`, `whatsapp`)
- `status` (`open`, `waiting_customer`, `queued_human`, `in_progress`, `resolved`, `closed`)
- `priority` (`low`, `normal`, `high`, `urgent`)
- `intent` (`booking_status`, `missing_ticket`, `change_request`, `refund`, `payment_issue`, `other`)
- `summary`
- `desired_outcome`
- `escalation_reason`
- `assigned_to`
- `sla_due_at`
- `created_at`, `updated_at`, `resolved_at`

### 2. `support_case_messages`

Conversation transcript.

- `id`
- `case_id`
- `author_type` (`customer`, `bot`, `agent`, `system`)
- `author_id` nullable
- `message_text`
- `structured_payload` JSONB
- `created_at`

### 3. `support_case_attachments`

- `id`
- `case_id`
- `message_id`
- `storage_path`
- `content_type`
- `file_name`
- `size_bytes`
- `created_at`

### 4. `support_case_events`

Audit trail.

- `id`
- `case_id`
- `event_type` (`created`, `classified`, `booking_linked`, `escalated_email`, `escalated_whatsapp`, `assigned`, `closed`)
- `payload` JSONB
- `created_at`

### 5. `support_routing_rules`

- `id`
- `agency_id` nullable
- `intent`
- `priority`
- `route_email_to`
- `route_whatsapp_to`
- `route_slack_to` nullable
- `active`

## AI design principles

### Use AI for conversation, not for authority

The model should:

- classify intent;
- ask missing questions;
- produce summaries;
- draft operator handoff text;
- suggest routing priority.

The model should not:

- decide access rights;
- directly query the database without guardrails;
- mutate bookings;
- promise refunds or schedule changes;
- send uncontrolled free-form messages to operations channels.

### Recommended tool contract for the AI layer

Expose a very small support toolset:

- `resolve_customer_identity`
- `find_customer_orders`
- `get_order_support_context`
- `create_support_case`
- `append_case_message`
- `attach_case_file`
- `request_escalation`

Everything else stays behind backend services.

## Escalation architecture

### Preferred phase-1 route

`web chat -> backend case record -> n8n -> support email inbox`

This is the fastest path because email already exists in the repo.

Email payload should include:

- case ID;
- booking reference;
- order status snapshot;
- customer contacts;
- AI-generated summary;
- transcript excerpt;
- attachments;
- portal deep link to the case.

### WhatsApp route

Do not make "send message to a WhatsApp group" the primary hard dependency for v1.

Reason:

- based on current Meta developer documentation discovered on 2026-09-03, WhatsApp group messaging is now documented through a Groups API, but availability is restricted and not generally safe to assume for every business number;
- Meta also states that groups are not available for some number types and solution configurations.

Sources:

- [Meta Groups API](https://developers.facebook.com/documentation/business-messaging/whatsapp/groups)
- [Meta Group Messaging](https://developers.facebook.com/documentation/business-messaging/whatsapp/groups/groups-messaging)
- [Meta About the WhatsApp Business Platform](https://developers.facebook.com/documentation/business-messaging/whatsapp/about-the-platform)

Practical recommendation:

1. phase 1: email queue is the system of record;
2. phase 1 optional: WhatsApp notification to one or more operator numbers, not a group;
3. phase 2: only add direct group integration after confirming your exact WhatsApp Business setup is eligible.

If internal team chat is required immediately, Slack is operationally cleaner than WhatsApp groups for durable routing, assignment, and history.

## What is missing today

### Missing product capabilities

- no chat session model;
- no support case domain model;
- no operator queue in portal;
- no support SLA/routing rules;
- no structured support taxonomy for booking issues;
- no customer-visible handoff state after escalation.

### Missing backend capabilities

- no support context aggregator for order + payment + ticket + notifications;
- no support conversation orchestrator;
- no case persistence;
- no attachment storage policy for support conversations;
- no outbound escalation workflow dedicated to support cases.

### Missing AI guardrails

- no support-specific tool boundary for the model;
- no confidence thresholds and escalation rules;
- no approved response library for high-risk travel support topics;
- no prompt policy tied to tenant scope and PII masking.

### Missing infra and ops

- no durable queue/worker ownership specifically for support cases;
- no formal operator inbox ownership model;
- no WhatsApp Business integration readiness validation;
- no support analytics dashboard;
- no alerting on stuck or aging support cases;
- no runbook for bot failure, bad classification, or provider outage.

## Recommended implementation phases

### Phase 1. Structured intake + email escalation

Goal:

- replace free-form support contact with guided intake for existing bookings.

Build:

- web chat UI on `my-bookings` and booking page;
- support case tables;
- support context backend;
- bot slot-filling for common booking issues;
- create case and send structured email through n8n.

Do not build yet:

- autonomous booking mutations;
- WhatsApp group dependency;
- multilingual knowledge base generation beyond core support prompts.

### Phase 2. Internal operations console

Build:

- portal support queue;
- case detail page;
- manual assignment;
- case statuses and SLA timers;
- transcript and attachment viewer;
- canned replies and resend-email action.

### Phase 3. Channel expansion

Build:

- WhatsApp notification to operator numbers if approved;
- optional Slack/helpdesk integration;
- customer callback links and proactive follow-up.

### Phase 4. Safe automation expansion

Only after the support case foundation is stable, add narrowly scoped actions such as:

- resend documents;
- re-send payment link;
- explain payment/ticket/email status;
- create change/refund request tickets for manual processing.

## Recommended technology choices

### Keep

- `Node.js + Express` for orchestration APIs;
- `Supabase` for durable case storage and RLS-aware data access;
- `n8n` for support routing workflows;
- existing email provider path for initial escalation.

### Add

- support attachment storage in Supabase Storage or equivalent;
- one AI orchestration layer with strict server-side tools;
- portal support pages;
- support analytics and alerts.

### Avoid for v1

- making n8n the place where business rules live without backend ownership;
- direct frontend-to-LLM architecture;
- direct booking mutations from the bot;
- dependence on WhatsApp group support before verifying number eligibility and operational constraints.

## Suggested KPI set

- case deflection rate;
- first-response time;
- escalation rate;
- cases resolved without human handoff;
- average missing fields per booking issue intake;
- aging cases over SLA;
- repeat contacts for the same booking within 7 days.

## Decision summary

The best near-term architecture for AviaFrame is:

- chat on booking surfaces;
- backend-owned support orchestrator;
- Supabase-backed case model;
- n8n for durable escalation routing;
- email as the primary human handoff channel;
- WhatsApp as an optional operator notification channel, not a required group-based system of record.

This reuses what already exists in the repo and avoids the two biggest risks:

- letting the bot operate outside tenant/PII guardrails;
- designing v1 around a WhatsApp group integration that may not be consistently available for your business setup.
