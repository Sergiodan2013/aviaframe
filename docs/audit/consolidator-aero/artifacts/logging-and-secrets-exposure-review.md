# Logging and Secrets Exposure Review

Date: 2026-06-02  
System: AviaFrame

## Purpose

This note summarizes the current logging posture and the main secrets/PII exposure risks observed directly in the codebase. It is intended for audit preparation and remediation planning, not as a runtime change record.

## Current Position

| Area | Status | Current position |
|---|---|---|
| Structured application logging | `partial` | `pino-http` and `pino` are present in the backend entrypoints |
| Console logging cleanup | `missing` | `console.*` remains widespread in routes, payment flows, and provider integrations |
| PII-safe logging discipline | `partial` | Some sanitization helpers exist, but log statements still reference email, phone, PNR, ticket, and payment identifiers |
| Secret leakage in logs | `partial` | No obvious direct secret dumps were found, but provider error logging and payload logging still need manual review and tightening |

## Positive Controls Already Present

- Structured request logging exists in [backend/src/app.js](/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation%20(2)/backend/src/app.js:24).
- Central logger setup exists in [backend/src/lib/logger.js](/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation%20(2)/backend/src/lib/logger.js:1).
- DRCT request logging includes sanitization rules for `passport`, `document_number`, `email`, and `phone` fields in [backend/src/services/drctLogger.js](/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation%20(2)/backend/src/services/drctLogger.js:100).

## Main Exposure Observations

### 1. Console logging is still widespread

Operational and business flows still use `console.log`, `console.warn`, and `console.error` across:

- Tamara checkout and webhook routes in [backend/src/routes/tamara.js](/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation%20(2)/backend/src/routes/tamara.js:74)
- Moyasar payment and webhook routes in [backend/src/routes/payments.js](/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation%20(2)/backend/src/routes/payments.js:100)
- ticket issuance flow in [backend/src/services/orderService.js](/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation%20(2)/backend/src/services/orderService.js:370)
- Tamara orchestration flow in [backend/src/services/tamara/orderFlow.js](/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation%20(2)/backend/src/services/tamara/orderFlow.js:30)
- widget order email notifications in [backend/src/routes/widget.js](/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation%20(2)/backend/src/routes/widget.js:336)

### 2. Some log lines contain business identifiers or contact details

Examples directly visible in code:

- Tamara checkout logging includes consumer phone in [backend/src/routes/tamara.js](/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation%20(2)/backend/src/routes/tamara.js:75)
- payment/ticketing logs reference order number, PNR, and sometimes contact email in [backend/src/routes/payments.js](/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation%20(2)/backend/src/routes/payments.js:330)
- Tamara flow logs reference `contact_email` and provider/order identifiers in [backend/src/services/tamara/orderFlow.js](/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation%20(2)/backend/src/services/tamara/orderFlow.js:174)

These are not always raw secrets, but they are audit-relevant because they can reveal PII or sensitive operational data in central logs.

### 3. Provider error logging still needs manual review

Some statements log serialized provider error bodies, for example:

- Tamara checkout error path in [backend/src/routes/tamara.js](/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation%20(2)/backend/src/routes/tamara.js:112)
- Moyasar initiate error path in [backend/src/routes/payments.js](/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation%20(2)/backend/src/routes/payments.js:100)

This is useful operationally, but should be reviewed for whether provider payloads might include customer or payment metadata that should be masked.

## Secrets Handling Observations

- Environment-based secret configuration is documented in [backend/src/config.js](/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation%20(2)/backend/src/config.js:42) and the audit [secrets inventory](/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation%20(2)/docs/audit/consolidator-aero/artifacts/secrets-inventory.md:1).
- No direct hardcoded live secrets were identified in the reviewed backend sources.
- The main risk is secondary exposure through logs, error dumps, or provider request/response persistence rather than secret literals in code.

## Audit-Safe Statement

AviaFrame already uses structured logging in part of the backend and maintains a documented secrets inventory. However, backend logging is not yet fully standardized, and several business-critical paths still emit console logs containing operational identifiers and potential PII-bearing context. This should be presented as an active remediation area, not as a closed control.

## Safe Next Steps

These remain safe before any deployment:

1. capture representative sample log lines from staging or production and classify them
2. annotate which log fields are acceptable, masked, or should be removed
3. prepare a small runtime patch list for the highest-risk `console.*` statements

