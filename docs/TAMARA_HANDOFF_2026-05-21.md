# Tamara Handoff - 2026-05-21

## Purpose
This document captures what was debugged, what was fixed, what was deployed, and what still needs verification for the Tamara integration in AviaFrame.

## Executive Summary
Tamara checkout creation is now working and the browser returns to AviaFrame with a success screen. The main blockers that were resolved were not in Tamara itself, but in AviaFrame order persistence and status handling:

1. Orders created for Tamara were being stored as `payment_provider = 'moyasar'`.
2. Tamara webhook callbacks could not find the local order because `payment_provider_order_id` was never reliably linked.
3. Tamara flow attempted to write order statuses that were not allowed by the production `orders_status_check` constraint.

Two production backend deploys were made to resolve those issues.

## User-Visible Symptoms We Investigated
1. Tamara checkout session initially failed with generic 500 responses.
2. Tamara checkout later succeeded, but the customer could hit `Security Check Failed` in sandbox for some phone numbers.
3. Tamara portal showed `Approved`, but no ticket was issued and no email was sent.
4. Backend logs showed:
   - webhook received from Tamara
   - no AviaFrame order found for Tamara order id
5. Orders in Supabase remained:
   - `payment_provider = moyasar`
   - `payment_provider_order_id = null`
   - `payment_provider_status = null`
   - `status = pending`

## Root Causes

### 1. Tamara method was not accepted as a valid widget payment method
Frontend sent `payment_method = 'tamara'`, but backend only treated `online`, `cash`, and `invoice` as valid methods.

Effect:
1. Backend silently normalized the order back into the generic online path.
2. Order was inserted with `payment_provider = 'moyasar'`.
3. Tamara webhook later could not find the order by `payment_provider = 'tamara'` and `payment_provider_order_id`.

### 2. Database default masked the problem
`docs/tamara_migration.sql` added:

```sql
payment_provider text DEFAULT 'moyasar'
```

That meant any order created without an explicit provider looked like a Moyasar order even if the user had chosen Tamara.

### 3. Tamara flow used statuses not allowed by the live schema
Production `orders.status` only permits:
1. `pending`
2. `confirmed`
3. `ticketed`
4. `cancelled`
5. `refunded`
6. `failed`

Tamara flow tried to write:
1. `pending_payment`
2. `payment_authorised`
3. `issuing`
4. `issued`
5. `issue_failed`

Effect:
1. Order update failed with `orders_status_check`.
2. Checkout flow surfaced a DB constraint error to the user.

## Fixes Applied

### Deploy 1: Fix Tamara provider linkage
Commit: `ecea27a`

Files changed:
1. `backend/src/config.js`
2. `backend/src/routes/widget.js`
3. `backend/src/routes/tamara.js`

Changes:
1. Added `tamara` to `VALID_PAYMENT_METHODS`.
2. Added `payment_provider`, `payment_provider_order_id`, `payment_provider_status` to `ORDERS_LIST_COLUMNS`.
3. Updated widget order creation:
   - if user selected Tamara:
     - `payment_method = 'online'`
     - `payment_provider = 'tamara'`
   - if user selected normal online card payment:
     - `payment_provider = 'moyasar'`
4. Added hard verification after successful Tamara checkout-session creation:
   - update order with:
     - `payment_provider = 'tamara'`
     - `payment_provider_order_id = session.order_id`
     - `payment_provider_status = 'tamara_checkout_created'`
     - `status = 'pending'`
   - if update fails, return a backend error instead of silently continuing

### Deploy 2: Make Tamara flow compatible with current DB status constraint
Commit: `59c43c2`

Files changed:
1. `backend/src/routes/tamara.js`
2. `backend/src/services/tamara/orderFlow.js`

Changes:
1. On checkout-session link step, status was kept schema-compatible:
   - `pending`
2. Tamara orchestration statuses were mapped to currently valid order statuses:
   - `payment_authorised` -> `confirmed`
   - `issuing` -> `confirmed`
   - `issued` -> `ticketed`
   - `issue_failed` -> `failed`

Reason:
This was the lowest-risk production fix. It avoided altering the schema during active debugging and preserved compatibility with the rest of the system.

## Railway Deployment Notes
The Railway backend service is not auto-deployed from GitHub. It is currently deployed through Railway CLI.

Current backend service:
1. Project: `peaceful-amazement`
2. Environment: `production`
3. Service: `peaceful-amazement`

Deployment method:
1. `railway up`

This means a normal `git push` does not deploy production by itself.

## Current Intended Tamara Flow

### Checkout phase
1. Widget creates local order.
2. If user selected Tamara:
   - order must be stored as `payment_provider = 'tamara'`
3. Backend calls Tamara checkout API.
4. Backend must persist:
   - `payment_provider_order_id`
   - `payment_provider_status = 'tamara_checkout_created'`

### Post-payment phase
1. Tamara sends webhook with `approved`.
2. Backend finds local order by `payment_provider_order_id`.
3. Backend runs:
   - `authoriseOrder()`
   - `issueDrctTicket()`
   - `ensureTicketPdfForOrder()`
   - `captureOrder()`
   - `sendTicketEmail()`

## Important Operational Notes

### Sandbox customer behavior
Tamara sandbox can show `Security Check Failed` for some test phone numbers/accounts. This is not always a merchant or payload bug. Using another sandbox number can allow checkout to proceed.

### The first historical order in Tamara portal was misleading
One portal order appeared as Tamara `Approved`, but the local DB order had remained `payment_provider = moyasar`. That order is not a good control sample for end-to-end validation because local and provider records were already inconsistent before the provider-linkage fix.

## What Still Needs Verification
After the latest deploy, a fresh Tamara order should be validated with all of the following:

1. Immediately after checkout-session creation:
   - `payment_provider = tamara`
   - `payment_provider_order_id IS NOT NULL`
   - `payment_provider_status = tamara_checkout_created`
   - `status = pending`
2. After webhook:
   - order is found by `payment_provider_order_id`
   - `payment_provider_status` advances
3. After orchestration:
   - DRCT issue executes or explicit fallback is logged
   - PDF exists in storage
   - ticket issuance row exists
   - email send step runs

## Recommended Verification SQL

```sql
select
  id,
  order_number,
  payment_method,
  payment_provider,
  payment_provider_order_id,
  payment_provider_status,
  status
from orders
where id = '<ORDER_ID>';
```

```sql
select *
from ticket_issuances
where order_id = '<ORDER_ID>';
```

```sql
select *
from document_files
where order_id = '<ORDER_ID>';
```

## Important Code Paths
1. `backend/src/routes/widget.js`
2. `backend/src/routes/tamara.js`
3. `backend/src/services/tamara/mapper.js`
4. `backend/src/services/tamara/orderFlow.js`
5. `backend/src/services/orderService.js`
6. `backend/src/services/emailService.js`
7. `aviaframe-site/booking.html`

## Known Follow-Up Risks
1. `docs/tamara_migration.sql` still documents `payment_provider DEFAULT 'moyasar'`. That should be removed or superseded in a cleanup migration.
2. Order state modeling is still split between:
   - `orders.status`
   - `payment_provider_status`
   This works now, but needs formalization.
3. `issueDrctTicket()` currently contains a fallback path that generates a PDF even when no real `drct_order_id` exists. This is useful for sandbox/debug, but it is not a safe production equivalent to real ticket issuance.

