# Async Flow Inventory

Date: 2026-06-02  
System: AviaFrame

## Purpose

This note inventories the main in-process asynchronous flows that matter for audit readiness, operational resilience, and payment/ticketing safety.

## Current Position

| Flow area | Status | Current position |
|---|---|---|
| Payment-to-fulfillment async handling | `missing` | Core flows still rely on in-process `setImmediate` execution |
| Webhook async handling | `missing` | Provider webhooks acknowledge fast, then continue work in-process |
| Non-critical email follow-up | `partial` | Some async email work is acceptable as best-effort, but still benefits from explicit operator visibility |

## In-Process Async Flows Identified

### 1. Moyasar initiate success path

After immediate paid response from payment initiation, the backend triggers background fulfillment with:

- [backend/src/routes/payments.js](/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation%20(2)/backend/src/routes/payments.js:121)

Risk:

- if process exits after marking order paid but before async completion, ticketing/email can remain incomplete

### 2. Moyasar callback path

Payment callback also schedules background fulfillment with:

- [backend/src/routes/payments.js](/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation%20(2)/backend/src/routes/payments.js:207)

Risk:

- callback may confirm payment while downstream issue/email work depends on same process staying alive

### 3. Moyasar webhook path

Webhook acknowledges quickly, then processes ticketing and email in-process:

- [backend/src/routes/payments.js](/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation%20(2)/backend/src/routes/payments.js:309)

Risk:

- duplicate events are partially handled, but worker durability and retry visibility are limited

### 4. Manual mark-paid path

Manual paid confirmation triggers async fulfillment with:

- [backend/src/routes/orders.js](/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation%20(2)/backend/src/routes/orders.js:264)

Risk:

- manual operator action can leave order in confirmed state without full fulfillment if background work fails

### 5. Tamara webhook approved flow

Tamara webhook persists event first, acknowledges, then continues provider/order orchestration in-process:

- [backend/src/routes/tamara.js](/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation%20(2)/backend/src/routes/tamara.js:169)

Risk:

- event persistence is a strong interim control, but final capture/issue/email still depends on same process lifecycle

### 6. Widget confirmation emails

Cash and invoice widget orders schedule best-effort follow-up email work with:

- [backend/src/routes/widget.js](/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation%20(2)/backend/src/routes/widget.js:307)
- [backend/src/routes/widget.js](/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation%20(2)/backend/src/routes/widget.js:347)

Risk:

- lower severity than payment/ticket issuance, but still lacks queue visibility if email delivery fails after response

## Current Interim Controls

- duplicate-event protections exist for Tamara and Moyasar webhook paths
- idempotency middleware exists for critical order issue/cancel routes
- order status updates provide partial operator visibility into payment and fulfillment progression
- runbooks now exist for incident response and provider outage handling

## Audit-Safe Statement

AviaFrame already distinguishes between quick provider acknowledgment and heavier downstream fulfillment work, which is good for external integrations. However, several business-critical payment and ticketing paths still rely on in-process async execution rather than a durable queue or worker model. This should be presented as a known resilience gap with active remediation planning.

## Safest Next Steps

These remain safe before any deployment:

1. classify each async flow as critical or best-effort
2. define desired queue/job record for each critical flow
3. document operator-visible failure states and manual recovery paths
4. prepare a staged remediation plan before touching runtime behavior
