# Deploy report — Widget Orders atomic booking fix

> **Date:** 2026-07-07
> **Trigger:** Order Q8BBVQ — customer paid 396.30 SAR, DRCT never called, no ticket, no email
> **Files changed:** `backend/src/routes/widget.js`, `backend/src/routes/payments.js`
> **Deploy:** Railway service `peaceful-amazement`, detached upload
> **Ticket recovery:** manual create+issue for Q8BBVQ → PNR `HCYVVH`, ticket `0655461308759`

---

## 1. Root cause (what caused the incident)

`POST /api/widget/orders` created rows in `orders` and `passengers` in Supabase, then **immediately returned 201** to the client. **No DRCT reservation was ever made.** The flow assumed some other step would populate `orders.drct_order_id` before the Moyasar webhook fired, but nothing did.

When Moyasar `payment_paid` webhook reached `handlePaymentPaidAsync`, the code checked `if (fullOrderForFlow.drct_order_id)` — it was `null` — the entire DRCT `issueOrder` block was silently skipped, and the customer received no ticket, no email, and no error.

Result of the specific incident: 396.30 SAR captured, no reservation with SV/Galileo, no PNR, no PDF sent. Customer would arrive at airport with nothing.

## 2. Fix

### 2.1 `backend/src/routes/widget.js`
- Added `require('../services/drctDirectClient')` and `require('../lib/logger')`.
- Added local helper `buildDrctPassengers(passengers)` that maps our DB passenger row to the DRCT payload schema discovered during Q8BBVQ recovery: `{ id, type, date_of_birth, individual: {first_name, last_name, date_of_birth, gender}, document: {type, number, gender, citizenship, country_of_issue, expiration_date} }`.
- Between passenger insert and response, added a DRCT `createOrder` call (only for `online` and `tamara` payment methods; `cash` and `invoice` skip it because ticketing happens later manually anyway):
  - On success → `UPDATE orders SET drct_order_id = <returned id>`, and hand the updated row back to the client.
  - On failure → **rollback** (delete passengers, delete order), return 502 `DRCT_CREATE_FAILED` with the upstream error code. Client can retry safely with the same idempotency key `order-create-<order_id>`.
  - On DRCT returning no order_id (malformed response) → also rollback, 502 `DRCT_INVALID_RESPONSE`.
  - On Supabase update failure after DRCT already reserved → **don't rollback** (the seat is real, deleting the order would leak the reservation), return 500 with `drct_order_id` in the body so support can reconcile.

Why `drctDirectClient` and not the n8n-proxied `drctService`:
- The direct client uses `DRCT_PROD_TOKEN` env, hits `https://api.drct.aero/orders` directly, has clear synchronous return, no queue / retry / breaker wrapper.
- The n8n path adds latency, moving parts, and workflow-version drift risk. Recovery for Q8BBVQ was done with the direct client and worked first try after passing the right passenger schema. Keep the code path the same for future orders so behavior matches what we know works.

### 2.2 `backend/src/routes/payments.js` — safety net
The old `handlePaymentPaidAsync` silently continued when `drct_order_id` was missing. Now:
- Loud `console.error` with order_number and payment_id in the message.
- `UPDATE orders SET status='needs_manual_issue'` + `metadata.alert='drct_order_id_missing_after_payment'` so ops can query for these.
- Fire-and-forget ops email via `emailService.sendSupportEmail` to `OPS_ALERT_EMAIL` (fallback `sergiodan2013@gmail.com`) with subject `[URGENT] Order X paid but not issued — drct_order_id missing`.
- Early `return` — do NOT send a customer ticket email since there is no ticket.

This means if the widget/orders fix ever regresses, we get a same-day alert instead of a mystery.

## 3. Tests run before deploy

| # | Test | Result |
|---|---|---|
| 1 | `node -c backend/src/routes/widget.js` — syntax check | ✅ OK |
| 2 | `node -c backend/src/routes/payments.js` — syntax check | ✅ OK |
| 3 | Module load with real Railway env (`railway run node -e "require(...)"`) — both routes | ✅ both load without throwing |
| 4 | `buildDrctPassengers` helper unit test — 10 assertions on schema mapping (id, type, date_of_birth, individual.gender, document.type/number/citizenship/country_of_issue/expiration_date) | ✅ 10/10 passed |

Manual pre-flight against the DRCT prod endpoint used during Q8BBVQ recovery confirmed the payload shape (`Authorization: Bearer $DRCT_PROD_TOKEN`, `DRCT-Version: 2021-06-01`, offer_id/passengers/contacts/metadata) — the same client is used in this fix.

## 4. What still needs verification after deploy

Post-deploy smoke tests I will run before considering this done:

1. **Fresh test booking** on `https://testenvavia.netlify.app` with a cheap RUH-JED offer + real passenger data. Expect:
   - `POST /api/widget/orders` returns 201 with `order.drct_order_id` populated.
   - Supabase `orders` row has non-null `drct_order_id`.
   - Payment initiation proceeds normally.
   - After payment, PDF email arrives (customer + owner copy).
2. **DRCT failure path** — simulate by sending a malformed offer_id in widget/orders body. Expect:
   - 502 `DRCT_CREATE_FAILED`.
   - Supabase orders and passengers do NOT contain the phantom order (rollback happened).
3. **Webhook safety net** — verify existing Q8BBVQ-recovered order still works and no ops alert fired.

## 5. Known limitations / follow-ups

- **Backend git is out of sync with prod.** These changes exist only locally + Railway-uploaded. They are not in `main` branch. Same workflow gap flagged in the previous autocomplete fix. Highly recommend committing all local backend changes to a branch after deploy stabilizes.
- **OPS_ALERT_EMAIL** env var doesn't exist yet in Railway — falls back to sergiodan2013@gmail.com. Set it if you want a different destination for critical incidents.
- **Idempotency key** for DRCT create is `order-create-<order_id>` — repeat calls will safely dedupe. But if the client retries with a different order_id (e.g. because the previous rolled back), that's a fresh DRCT call and a fresh offer_id may be needed (offers expire ~15 min).
- **DRCT prod tokens are hardcoded in env.** No rotation reminder wired. Rotate manually after test bookings settle.
- **Cash and invoice payment methods** skip DRCT create in this route. Ticketing for those flows happens elsewhere (manual ops after money received). If that flow also has a hidden hole, it's out of scope here.

## 6. What NOT to touch

Per user's persistent deploy safety rules — this fix only touches `widget.js` and `payments.js` handler logic. It does **not** modify the tokenization, payment provider selection, Moyasar or Tamara handler code. Callsites into `drctService`/`drctDirectClient` were only added, not modified.

## 7. Order Q8BBVQ — status snapshot

- `orders.status`: `ticketed`
- `orders.drct_order_id`: `1328579e-88e1-41d7-bbd1-65ad396f0ddf`
- `orders.metadata.drct_pnr`: `HCYVVH`
- `orders.metadata.drct_ticket_number`: `0655461308759`
- `orders.metadata.sv_locator`: `7QVBCB` (real Galileo)
- Email PDF: delivered to both `info.sa@consolidator.aero` and `sergiodan2013@gmail.com` per Resend logs.
- Cancel deadline: **2026-07-07 23:59 KSA** — refund path still open until midnight KSA time.

## 8. Files

- Fix: [backend/src/routes/widget.js](../backend/src/routes/widget.js), [backend/src/routes/payments.js](../backend/src/routes/payments.js)
- Recovery script: [backend/scripts/recovery-email-q8bbvq.js](../backend/scripts/recovery-email-q8bbvq.js) (one-off for Q8BBVQ)
- Related briefs: [AIRPORT_AUTOCOMPLETE_FIX_2026-06-22.md](./AIRPORT_AUTOCOMPLETE_FIX_2026-06-22.md), [PAYMENT_DECLINE_AND_DRCT_PROD_INVESTIGATION.md](./PAYMENT_DECLINE_AND_DRCT_PROD_INVESTIGATION.md)
