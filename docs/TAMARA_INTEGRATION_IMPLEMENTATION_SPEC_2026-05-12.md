# AviaFrame x Tamara Integration Implementation Spec

Status: implementation spec for external coding agent (`Claude Code`)  
Date: 2026-05-12  
Audience: engineer implementing Tamara end-to-end in AviaFrame

---

## 1. Goal

Integrate `Tamara` as a second payment rail in AviaFrame for Saudi Arabia.

Target user experience:
- User fills passenger/contact data as usual.
- On payment step, user chooses:
  - `Pay now` -> existing `Moyasar` flow
  - `Pay with Tamara` -> installments / BNPL flow
- After successful Tamara flow, AviaFrame continues order processing and ticket issuance.

This spec is for MVP only.

MVP scope:
- `KSA` only
- `SAR` only
- available in both `portal` and `widget`
- full capture only
- full cancel only
- full refund only
- no partial capture
- no partial refund

---

## 2. Business Context

Current AviaFrame payment reality:
- `Moyasar` is already integrated as the direct pay-now PSP.
- `DRCT issue` is the critical downstream fulfillment action.
- Payment success must not rely on frontend redirects alone.

Tamara-specific business rule:
- Tamara sends webhook with order status `approved`
- merchant must call `Authorisation API`
- if the order is not authorised within `72 hours`, the order expires

Important interpretation for AviaFrame:
- `approved` does **not** mean "ticket can already be issued"
- `authorised` is the first safe state to continue merchant-side fulfillment logic

Source docs:
- `Introduction to Tamara`: `https://docs.tamara.co/docs/introduction-to-tamara`
- `Online Order Status Flow`: `https://docs.tamara.co/docs/online-order-status-flow`
- `Create Checkout Session`: `https://docs.tamara.co/reference/createcheckoutsession`
- `Testing Checklist`: `https://docs.tamara.co/docs/testing-checklist`

Additional implementation references mentioned by Tamara onboarding:
- `Transaction Authorisation`
- `Capture API`
- `Cancel API`
- `Refund API`

---

## 3. Non-Negotiable Rules

1. Never issue ticket on frontend redirect alone.
2. Never treat `approved` as final payment completion in AviaFrame.
3. Webhook processing must be idempotent.
4. Sandbox and production credentials must be fully separated.
5. Tamara must be shown only when:
   - selling country / tenant flow is `SA`
   - currency is `SAR`
6. Tamara integration must be shared between `portal` and `widget` through backend orchestration, not duplicated independently.

---

## 4. Environment Separation

Implement two fully separate environment profiles.

### Sandbox
- Base URL: `https://api-sandbox.tamara.co`
- API Token: sandbox token
- Notification Token: sandbox token
- Public Key: sandbox public key
- Portal: `https://partners-sandbox.tamara.co`

### Production
- Base URL: `https://api.tamara.co`
- API Token: production token
- Notification Token: production token
- Public Key: production public key
- Portal: `https://partners.tamara.co`

Required env vars:

```env
TAMARA_ENABLED=true
TAMARA_ENV=sandbox
TAMARA_BASE_URL=https://api-sandbox.tamara.co
TAMARA_API_TOKEN=...
TAMARA_NOTIFICATION_TOKEN=...
TAMARA_PUBLIC_KEY=...
TAMARA_WEBHOOK_PATH=/api/payments/tamara/webhook
TAMARA_SUCCESS_RETURN_URL=https://admin.aviaframe.com/payments/tamara/success
TAMARA_CANCEL_RETURN_URL=https://admin.aviaframe.com/payments/tamara/cancel
```

Production must use the same variable names with production values.

Do not hardcode sandbox/prod URLs in frontend code.

---

## 5. High-Level Data Flow

```text
Portal / Widget
  -> create local AviaFrame order (pending_payment)
  -> choose payment method = tamara
  -> backend creates Tamara checkout session
  -> frontend redirects user to Tamara checkout_url
  -> user completes Tamara flow
  -> Tamara sends webhook: approved
  -> backend validates webhook
  -> backend calls Tamara Authorisation API
  -> if authorised:
       -> backend calls DRCT issue
       -> if DRCT issue success:
            -> backend calls Tamara Capture API
            -> order becomes issued / paid / captured
       -> if DRCT issue fails:
            -> backend calls Tamara Cancel API
            -> order becomes payment_cancelled / issue_failed
  -> return page polls backend for final status
```

---

## 6. Recommended AviaFrame State Machine

Use explicit internal statuses. Do not overload one generic `paid` field.

### Payment method
- `payment_method = moyasar`
- `payment_method = tamara`

### Tamara payment status
- `tamara_checkout_created`
- `tamara_checkout_opened`
- `tamara_approved`
- `tamara_authorised`
- `tamara_capture_pending`
- `tamara_captured`
- `tamara_cancelled`
- `tamara_refunded`
- `tamara_failed`
- `tamara_expired`

### Order status proposal
- `pending_payment`
- `payment_approved`
- `payment_authorised`
- `issue_pending`
- `issued`
- `issue_failed`
- `payment_cancelled`
- `payment_refunded`

Mapping rule:
- Tamara `approved` webhook -> internal `tamara_approved`
- successful Authorisation API -> internal `payment_authorised`
- successful DRCT issue -> internal `issue_pending -> issued`
- successful Capture API -> internal `tamara_captured`

---

## 7. Backend Responsibilities

Create a dedicated Tamara integration service and keep all provider logic server-side.

### Required backend capabilities

1. Create checkout session
2. Validate incoming webhook
3. Authorise Tamara order
4. Capture Tamara order
5. Cancel Tamara order
6. Refund Tamara order
7. Fetch Tamara order state for reconciliation
8. Log all provider interactions

### Suggested backend modules

```text
backend/src/
  routes/
    payments/
      tamara.js
  services/
    tamara/
      client.js
      mapper.js
      webhook.js
      orderFlow.js
      reconciliation.js
  db/
    migrations/
```

### Suggested routes

```text
POST /api/payments/tamara/checkout-session
POST /api/payments/tamara/webhook
GET  /api/payments/tamara/session/:orderId
POST /api/payments/tamara/:orderId/refund
POST /api/payments/tamara/:orderId/cancel
GET  /api/payments/tamara/:orderId/status
```

The frontend should call only AviaFrame backend. Never call Tamara merchant APIs directly from frontend.

---

## 8. Frontend Responsibilities

Frontend must:

1. Show Tamara only if:
   - country is `SA`
   - currency is `SAR`
2. Display Tamara widget/banner using `TAMARA_PUBLIC_KEY`
3. Show payment choice:
   - `Pay now`
   - `Pay with Tamara`
4. When Tamara is chosen:
   - call backend `checkout-session`
   - receive `checkout_url`
   - redirect user to Tamara
5. On return page:
   - show non-final status message
   - poll backend until final state is known

The return page must not issue tickets and must not mutate provider state directly.

### UI messages to support
- `Redirecting to Tamara...`
- `Waiting for payment confirmation...`
- `Payment approved, finalising your booking...`
- `Your ticket is being issued...`
- `Payment failed`
- `Payment cancelled`
- `Booking completed`

---

## 9. Webhook Handling

This is the most important part of the integration.

Tamara explicitly says:
- successful payment triggers webhook with status `Approved`
- merchant must call `Authorisation API` after that
- if merchant does not authorise within `72 hours`, order expires

### Webhook contract requirements

1. Endpoint must be public HTTPS.
2. Validate the Tamara token according to their docs.
3. Store raw webhook payload for audit/debug.
4. Make webhook processing idempotent using provider event/order identifiers.
5. Return `2xx` only after safe persistence of event receipt.

### Webhook processing sequence

1. Receive webhook
2. Validate signature/token
3. Check if already processed
4. Persist event in `payment_provider_events`
5. If status is `approved`:
   - call `Authorisation API`
   - if success:
     - update order payment status
     - trigger DRCT issue workflow

Do not do heavy synchronous retries inside webhook request if avoidable. Persist and hand off to job/worker if needed.

---

## 10. DRCT and Tamara Fulfillment Sequence

For AviaFrame MVP, use this exact sequence:

1. Local order already exists with status `pending_payment`
2. Tamara checkout completed by user
3. Tamara webhook `approved`
4. Backend calls Tamara `Authorisation API`
5. If authorisation succeeds:
   - set local status `payment_authorised`
   - call `DRCT issue`
6. If DRCT issue succeeds:
   - call Tamara `Capture API`
   - set local status `issued`
7. If DRCT issue fails:
   - call Tamara `Cancel API`
   - set local status `issue_failed` and `payment_cancelled`

Reason:
- we do not want to capture funds for a booking we could not actually issue
- we do not want to issue before Tamara authorisation

---

## 11. Data Model Additions

Create explicit provider tables or columns.

### Minimum additions to orders table
- `payment_provider` (`moyasar|tamara`)
- `payment_provider_order_id`
- `payment_provider_status`
- `payment_authorised_at`
- `payment_captured_at`
- `payment_cancelled_at`
- `payment_refunded_at`
- `payment_reference`

### New table: `payment_provider_events`

Suggested fields:
- `id`
- `provider` (`tamara`)
- `provider_event_id` nullable
- `provider_order_id`
- `event_type`
- `event_status`
- `payload_json`
- `processed_at`
- `created_at`
- unique index on meaningful provider identifiers

### New table: `payment_provider_operations`

Suggested fields:
- `id`
- `order_id`
- `provider`
- `operation_type` (`authorise|capture|cancel|refund|fetch_status`)
- `request_json`
- `response_json`
- `provider_reference`
- `success`
- `created_at`

---

## 12. Discount and Pricing Mapping

Tamara onboarding note says:
- if store discounts/promotions exist, include `discount`
- format: `name, amount, currency`
- multiple values separated by `;`

Implementation rule:
- when AviaFrame order contains promo/discount info, map it into Tamara checkout payload exactly as required
- preserve the original local order total and the sent Tamara total
- reject checkout creation if total mismatch exists

Claude Code must inspect the exact Tamara request schema from:
- `Create Checkout Session`
- `Testing Checklist`

and map:
- order amount
- currency
- items
- shipping if applicable
- discounts
- consumer identity fields

---

## 13. KSA-Only Eligibility Logic

Tamara should be enabled only when all conditions are true:

1. selling market is Saudi Arabia
2. checkout currency is `SAR`
3. tenant/agency has Tamara enabled
4. cart/order total is supported by Tamara limits if applicable

If not eligible:
- hide Tamara method completely
- do not render widget

---

## 14. Portal and Widget Sharing Strategy

Use one backend orchestration for both channels.

Frontend differences:
- `portal` may have richer admin/customer context
- `widget` may use a lighter customer checkout UI

But both must call the same backend Tamara routes and use the same order lifecycle rules.

Do not create separate Tamara integrations for:
- portal
- widget

Only the UI layer should differ.

---

## 15. MVP Limitations

Explicitly out of scope for first release:

1. partial capture
2. partial refund
3. UAE flow
4. currencies other than `SAR`
5. advanced split shipment/fulfillment semantics
6. payment method fallback orchestration inside one order after Tamara session created

Meaning of the excluded terms:
- `partial capture`: capturing only part of the approved amount
- `partial refund`: refunding only part of the captured amount

MVP rule:
- always capture full amount after successful ticket issue
- always cancel or refund full amount

---

## 16. Testing Plan

Tamara already provided a UAT checklist. Claude Code must implement in a way that supports these scenarios.

### Mandatory scenarios

1. Tamara widget renders on site
2. Widget language matches site language
3. Successful checkout
4. Failed/declined checkout
5. Cancelled checkout
6. Approved webhook received
7. Authorisation API called after approved
8. Capture API tested
9. Cancel API tested
10. Refund API tested
11. Order statuses sync correctly in:
   - AviaFrame DB
   - AviaFrame UI
   - Tamara Partner Portal

### Additional AviaFrame-specific scenarios

1. Approved webhook arrives twice -> no duplicate issue/capture
2. DRCT issue fails after Tamara approved -> Tamara cancel is executed
3. User closes browser after Tamara payment -> webhook still completes flow
4. Frontend return page reload -> final status still recoverable from backend

---

## 17. Security Requirements

1. Do not commit sandbox or production Tamara tokens to repo.
2. Assume all credentials previously pasted in chat are compromised and rotate them.
3. Store provider secrets only in environment variables / secret manager.
4. Do not expose API token or notification token to frontend.
5. Public key may be exposed to frontend by design.
6. Log provider payloads carefully; avoid sensitive customer data where possible.

---

## 18. Deliverables Expected from Claude Code

Claude Code should produce:

1. Tamara backend service and routes
2. DB migration(s) for payment provider state and event logs
3. Frontend payment option integration in portal and widget
4. Tamara return page / status page behavior
5. Webhook handler with validation and idempotency
6. DRCT issue -> capture / failure -> cancel orchestration
7. Environment variable documentation
8. Basic test plan or smoke-check instructions

---

## 19. Suggested Implementation Order

1. Add DB schema for Tamara provider state/events
2. Add backend Tamara client
3. Add webhook validation + persistence
4. Add checkout-session endpoint
5. Add return/status endpoint
6. Add DRCT issue + Tamara capture/cancel orchestration
7. Add portal UI
8. Add widget UI
9. Run sandbox UAT checklist
10. Prepare production cutover

---

## 20. Open Assumptions

These assumptions are approved unless contradicted by the codebase:

1. Tamara is shown only for `SA + SAR`
2. Existing `Moyasar` flow remains unchanged
3. Tamara is an alternative payment method, not a replacement PSP
4. A local AviaFrame order exists before Tamara checkout session starts
5. DRCT issue should happen only after Tamara authorisation
6. Full capture happens only after successful ticket issue

---

## 21. Source Index

Primary Tamara sources for implementation:

1. Introduction:
   `https://docs.tamara.co/docs/introduction-to-tamara`
2. Online Order Status Flow:
   `https://docs.tamara.co/docs/online-order-status-flow`
3. Create Checkout Session:
   `https://docs.tamara.co/reference/createcheckoutsession`
4. Testing Checklist:
   `https://docs.tamara.co/docs/testing-checklist`

Onboarding email instructions already confirmed:
- use sandbox credentials in staging
- production activation only after testing approval
- `approved` webhook must be followed by authorisation
- portal only shows successfully paid orders

