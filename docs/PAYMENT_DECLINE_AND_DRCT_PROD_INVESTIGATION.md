# Investigation Brief — Payment Decline Analysis + DRCT Production Cutover

> **Date:** 2026-06-22
> **Requested by:** product owner
> **Status:** not started
> **Audience:** next agent (research + minimal code changes; do NOT cut over DRCT to prod without explicit user approval)
> **Estimated effort:** 2–4 hours research + 1–2 hours scoped implementation per task

This brief has **two independent tracks**. Treat them separately — they can be done by different agents in parallel.

---

## TRACK A — Diagnose payment declines on Moyasar live mode

### A.1 Background — what just happened

A few minutes before this brief, the previous agent migrated Moyasar from sandbox to live:

- `MOYASAR_PUBLISHABLE_KEY` (`pk_live_iXhEB7xrWqPoh2SMRBt45fA73mVoKKa8EjZt5end`) — updated in [aviaframe-site/config.js](../aviaframe-site/config.js) and [aviaframe-site/booking.html:158](../aviaframe-site/booking.html#L158), deployed to Netlify.
- `MOYASAR_SECRET_KEY` (sk_live_*) — set in Railway → service `peaceful-amazement`.
- `MOYASAR_WEBHOOK_SECRET` — `394e8f3df2ba38c3ee56dfc40f015a45df05fbfb276eab412727bf1504d3b234`, matches webhook configured in Moyasar live dashboard.
- Webhook endpoint URL: `https://peaceful-amazement-production-629f.up.railway.app/api/webhooks/moyasar`.
- Webhook events subscribed: `payment_paid`, `payment_failed`, `payment_authorized`, `payment_captured`, `payment_refunded`, `payment_voided`, `payment_abandoned`, `payment_verified`.

The user then tried a real test transaction (6,264 SAR, Mastercard 5127 88...) and got:
> "Payment declined by your bank. Please contact your bank or use a different card."

This message comes from [aviaframe-site/booking.html:234](../aviaframe-site/booking.html#L234) under the `do_not_honor` key in `PAY_ERRORS`. The backend at [backend/src/routes/payments.js:127](../backend/src/routes/payments.js#L127) extracts `moyasarPayment.source.response_code` and maps it to a user-facing error.

### A.2 What the next agent should investigate

**Step 1 — pull the actual Moyasar decline code from production logs.**

`do_not_honor` is the user-facing mapping. The raw response from Moyasar contains:
- `source.response_code` — numeric/string code (e.g. `05`, `51`, `61`, `62`)
- `source.message` — bank-side message
- `source.transaction_url` — Moyasar-hosted hostedfields URL
- Possibly a chained `failure_reason` field

Sources to pull from:
1. **Moyasar Dashboard** → Live mode → Payments → filter by date → find the declined transaction → expand details. Has the full bank response.
2. **Railway logs** for `peaceful-amazement` service → search `payments/initiate` and `response_code=`. Format from [payments.js:150](../backend/src/routes/payments.js#L150): `[payments/initiate] payment failed: order=<num> response_code=<code> code=<errCode>`.
3. **Supabase `orders` table** → find the order row by `order_number` shown on the failed payment page → check `metadata.moyasar_payment_id` → cross-reference with Moyasar dashboard.

**Step 2 — interpret the response code.**

Reference table (subset of ISO 8583):
| Code | Meaning | Typical cause |
|---|---|---|
| `05` | Do not honor | Generic refusal, often fraud/risk flag |
| `14` | Invalid card | Card not valid for online |
| `41` | Lost card | Reported lost |
| `43` | Stolen card | Reported stolen |
| `51` | Insufficient funds | Self-explanatory |
| `54` | Expired card | Self-explanatory |
| `61` | Exceeds amount limit | Per-txn or daily limit |
| `62` | Restricted card | Region/MCC restricted |
| `63` | Security violation | 3DS issue or CVV mismatch |
| `65` | Exceeds frequency limit | Too many txns recently |
| `91` | Issuer unavailable | Bank network down |
| `1A` | Additional auth required (SCA) | 3DS challenge not completed |

**Step 3 — hypotheses to test.**

By likelihood (highest first):

1. **First-merchant fraud flag.** Banks (esp. Saudi banks) commonly auto-decline first transaction to a new merchant, especially large amounts. Test: try a small amount (e.g. 50 SAR — search a cheap domestic flight) with the same card.
2. **Online/international payments not enabled on card.** Many KSA cards disable online + foreign transactions by default — user has to toggle in bank app. Verify with cardholder.
3. **3DS challenge failure or skip.** Check Moyasar dashboard if `3ds_completed=true`. If false, the bank may decline without proper SCA.
4. **MCC mismatch.** Travel/airline MCC (4511, 4722) may be blocked by issuing bank. Check Moyasar dashboard for the merchant MCC. Verify with cardholder bank app rules.
5. **Mada vs Mastercard routing.** Some cards have dual BIN (Mada + Mastercard scheme). Moyasar may route to Mada network which has different rules. Check `source.scheme` field.
6. **Moyasar account restrictions.** Live mode may have additional KYC requirements — check Moyasar dashboard → Settings → Account Status → no restrictions/holds.

**Step 4 — collect data, write findings.**

Pull data for at least:
- The specific failed transaction (full Moyasar payload)
- 2–3 additional test transactions (different cards if possible, different amounts)
- Moyasar account status snapshot

Report back with:
- Exact `response_code`/`message` returned
- Hypothesis ranking based on evidence
- Recommended user-side actions (call bank, enable online payments, try smaller amount)
- Recommended platform-side actions if any (PAY_ERRORS message tuning, MCC follow-up with Moyasar)

### A.3 Constraints — do NOT do

- ❌ Do not change Moyasar back to sandbox without explicit user request.
- ❌ Do not change `pk_live`/`sk_live` keys. They were rotated in this session and are stable.
- ❌ Do not "fix" `do_not_honor` mapping by silencing the error — the message is correct.
- ❌ Do not bypass the bank decline by tampering with status handling in `payments.js`. The backend correctly returns 402 — that is intentional.

### A.4 Reference files

- [backend/src/routes/payments.js](../backend/src/routes/payments.js) — payment route + webhook handler
- [aviaframe-site/booking.html](../aviaframe-site/booking.html) — checkout UI + error mapping
- [aviaframe-site/config.js](../aviaframe-site/config.js) — runtime config (live publishable key)
- Memory: `~/.claude/projects/-Users-sergejdaniluk-Documents-aviaframe/memory/reference_tamara.md` — payment provider context (Tamara, but adjacent)

---

## TRACK B — DRCT production cutover assessment

### B.1 Background — current DRCT state

Production backend currently sends ALL DRCT calls to the **sandbox** environment:

| Operation | URL | File |
|---|---|---|
| Search | `https://sandbox-api.drct.aero/offers_search` | [n8n_workflows/drct_search.json:31](../backend/n8n_workflows/drct_search.json#L31) |
| Price | `https://sandbox-api.drct.aero/offers/{id}/price` | [n8n_workflows/drct_price.json:31](../backend/n8n_workflows/drct_price.json#L31) |
| Order create | `https://sandbox-api.drct.aero/orders` | [n8n_workflows/drct_order_create.json:31](../backend/n8n_workflows/drct_order_create.json#L31) |
| Order issue | `https://sandbox-api.drct.aero/orders/{id}/issue` | [n8n_workflows/drct_order_issue.json:31](../backend/n8n_workflows/drct_order_issue.json#L31) |
| Order cancel | `https://sandbox-api.drct.aero/orders/{id}` | [n8n_workflows/drct_order_cancel.json:31](../backend/n8n_workflows/drct_order_cancel.json#L31) |

Backend call chain (per [backend/src/services/drctService.js](../backend/src/services/drctService.js)):
```
backend → drctService (rate limit + circuit breaker + retry)
       → n8nClient (HTTP POST to n8n webhook)
       → n8n (transforms + auth)
       → DRCT API (sandbox-api.drct.aero today)
```

The actual DRCT credentials are stored in **n8n** (not in Railway env vars). To switch environments, you change both the URL in workflows AND the API token credential in n8n.

### B.2 What the next agent should investigate

**Step 1 — confirm whether DRCT production access exists.**

Questions to answer (ask user, don't guess):
- Does the company have a signed DRCT contract for production access?
- What's the production API base URL? (Likely `https://api.drct.aero` — confirm)
- What credentials do we have for production? (API key, API secret, partner ID, etc.)
- Where are they currently stored, if at all? (Maybe in 1Password, maybe with the user)
- Is there a separate n8n production environment, or does the same n8n instance need to switch?
- Billing model: does DRCT bill per-ticket-issued or per-search? When does the meter start?

**Step 2 — map the cutover surface area.**

Things that need to change for DRCT prod:
1. Five n8n workflow JSONs (URLs in [n8n_workflows/drct_*.json](../backend/n8n_workflows/))
2. n8n credentials for the auth token used in those workflows
3. Possibly env vars in Railway if any prod-specific config exists (check `process.env.DRCT_*` references in [backend/src](../backend/src))
4. Confirm n8n itself runs in a mode that has DRCT prod credentials (it might need redeployment)

Run:
```bash
grep -rn "DRCT_\|drct\." backend/src/ --include="*.js" | grep -i "env\|config\|process"
```
to find any env-driven DRCT switches.

**Step 3 — design the cutover, do NOT execute.**

Produce a written plan with:
- Pre-cutover checks (signed DRCT contract, prod creds in hand, n8n updated)
- The exact change to each of the 5 JSON files (`sandbox-api.drct.aero` → `api.drct.aero`)
- How n8n credentials switch — does n8n have an `environment` switcher, or do we manually edit the credential object?
- Test plan: cheap domestic KSA route, single-passenger, real Moyasar live card, expected timeline
- Rollback plan: keep the sandbox URL versions of the JSON files for quick revert; document n8n cred snapshot
- Monitoring: where to watch logs (Railway, n8n, DRCT dashboard if any) during the first 10 transactions

**Step 4 — answer the "free ticket via test-Moyasar + prod-DRCT" question.**

The user asked: "Can we issue a real ticket while paying nothing, via test Moyasar + real DRCT?"

The honest answer (confirm with their finance/operations counterpart):
- Technically yes — Moyasar test will mock-emit `payment_paid` webhook → backend issues DRCT order → DRCT prod issues a real PNR
- BUT DRCT bills the merchant (us) for every issued ticket regardless of customer payment
- Net effect: "free for customer" = "we eat the cost"
- For valid testing: use Moyasar test + DRCT sandbox (current setup). Sandbox PNRs are fake and free.
- Document the **financial implications in writing** before recommending any path.

### B.3 Constraints — do NOT do

- ❌ Do not execute the DRCT URL switch without the user's explicit go-ahead and confirmation that production credentials exist.
- ❌ Do not flip `sandbox-api.drct.aero` → `api.drct.aero` "to test" — first transaction will be real-money to us if credentials are valid, real-error if invalid (both bad).
- ❌ Do not mix Moyasar live + DRCT sandbox for an actual customer — customer would pay real money and get a fake PNR. Hard refunds and reputation damage.
- ❌ Do not commit credential changes into git or n8n_workflows JSON. Use n8n credential store.

### B.4 Reference files

- [backend/src/services/drctService.js](../backend/src/services/drctService.js) — reliability layer
- [backend/src/services/n8nClient.js](../backend/src/services/n8nClient.js) — n8n HTTP client
- [backend/n8n_workflows/drct_search.json](../backend/n8n_workflows/drct_search.json) etc — workflow definitions
- [backend/src/routes/public.js](../backend/src/routes/public.js) — the public `/search` route that fans out to DRCT
- [backend/src/routes/payments.js](../backend/src/routes/payments.js) — webhook handler that triggers DRCT issue after `payment_paid`

---

## Deliverables expected from the next agent

For both tracks, deliver:
1. A markdown report under `docs/` with findings (separate files OK)
2. Hypothesis ranking with evidence
3. Recommended next actions, scoped small
4. List of follow-up questions for the user/business that block further work
5. **No code changes** unless explicitly requested by the user after reviewing the report

For Track B specifically: produce a `DRCT_CUTOVER_PLAN.md` with the cutover checklist, but **do not execute** anything.

---

## Open context (do not assume, ask user)

- Who owns the Moyasar merchant account? Are they reachable in real-time for KYC questions?
- Does the company have a Slack channel where bank-side declines are tracked?
- Is there a CFO/finance person who needs to sign off on DRCT production financial exposure?
- Are agencies (the multi-tenant partners) aware that live transactions are now possible? If yes, do any of them have separate Moyasar sub-accounts vs the single platform account?

---

## Memory / persisted context for the agent

- The user has a saved deploy-safety rule: do not touch `payments.js`, `tamara.js`, `widget.js` without explicit ask. **This applies. Both files are in scope here only for read/analysis. Do not edit.**
- The user has a recent autocomplete fix deployed via `railway up` (see [AIRPORT_AUTOCOMPLETE_FIX_2026-06-22.md](./AIRPORT_AUTOCOMPLETE_FIX_2026-06-22.md)) — backend code may not match git. Treat what's in `~/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation (2)/backend/` as the source of truth for what's running.
- Tamara is on a different (likely still sandbox) flow — out of scope for this brief but flagged in [reference_tamara.md](../../../.claude/projects/-Users-sergejdaniluk-Documents-aviaframe/memory/reference_tamara.md) memory.
