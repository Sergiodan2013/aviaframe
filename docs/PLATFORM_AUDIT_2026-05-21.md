# Platform Audit - 2026-05-21

## Scope
This audit reviews the current AviaFrame backend and adjacent integration code from four angles:

1. application architecture
2. security and data protection
3. reliability and operational readiness
4. scale, load, and maintainability

The focus is on the existing production-oriented code in:
1. backend routes
2. payment flows
3. DRCT and n8n integration
4. Tamara integration
5. email delivery
6. observability and runtime concerns

## Executive Assessment
The platform is functional and has made meaningful progress, but it is still in a fragile integration-heavy stage. The largest risks are not a single critical exploit, but a pattern:

1. business workflows depend on implicit state transitions across several services
2. schema constraints and runtime status models are not fully aligned
3. public-facing operational endpoints are too open
4. background/orchestration work is executed inside request-serving processes
5. resilience patterns exist, but only on some DRCT paths, not across the whole payment and fulfillment lifecycle

In short:
1. the product can work
2. but production stability under failure, retries, concurrency, and operator mistakes is not yet strong enough for confident scale

## Findings

### 1. Public `/metrics` endpoint is exposed without protection
File:
1. `backend/src/app.js`

Current behavior:
1. Prometheus metrics are exposed on `GET /metrics`
2. no internal token
3. no IP restriction
4. no auth guard

Risk:
1. reveals service internals, route timings, and load behavior
2. increases reconnaissance surface
3. can become an abuse target under scrape amplification

Recommendation:
1. protect `/metrics` behind:
   - internal token
   - private ingress
   - or infrastructure-level access restriction

Priority:
1. High

### 2. CORS policy is too simple for production
Files:
1. `backend/src/app.js`
2. `backend/src/config.js`

Current behavior:
1. exact-string origin check only
2. no `Vary: Origin`
3. no credentials model
4. no per-route distinction

Risk:
1. brittle behavior across staging/custom domains
2. easy misconfiguration
3. hidden cache issues at CDN/proxy layers without `Vary: Origin`

Recommendation:
1. set `Vary: Origin`
2. centralize a production-grade CORS policy
3. explicitly model:
   - public widget routes
   - authenticated app routes
   - internal routes

Priority:
1. Medium

### 3. Business orchestration runs inside webhook/request process
Files:
1. `backend/src/routes/tamara.js`
2. `backend/src/services/tamara/orderFlow.js`

Current behavior:
1. webhook acknowledges and then uses `setImmediate()` for orchestration
2. issue, capture, PDF, email all happen in the backend process

Risk:
1. worker progress is tied to web process lifecycle
2. redeploy/crash can interrupt orchestration
3. replay/recovery is harder than with a proper job queue

Recommendation:
1. move Tamara post-payment orchestration into a durable async worker or queue
2. keep webhook route as:
   - validate
   - persist event
   - enqueue job
   - return 200

Priority:
1. High

### 4. DRCT issue fallback can produce a PDF without real ticket issuance
File:
1. `backend/src/services/orderService.js`

Current behavior:
1. if `drct_order_id` is missing, code logs:
   - `No drct_order_id — skipping DRCT call, generating PDF only`
2. then still produces a ticket PDF path

Risk:
1. business integrity risk
2. possible false-positive “ticketed” experience
3. customer could receive something that looks like a ticket but is not a real airline-issued document

Recommendation:
1. make this fallback explicitly sandbox-only
2. never treat that path as equivalent to real issuance in production
3. introduce a separate status such as:
   - `manual_issue_required`
   - or `sandbox_pdf_only`

Priority:
1. Critical

### 5. Status model is under-defined and partially split
Files:
1. `backend/supabase/schema.sql`
2. `backend/src/services/tamara/orderFlow.js`
3. `backend/src/routes/payments.js`
4. `backend/src/routes/orders.js`

Current behavior:
1. `orders.status` is a compact business-state field
2. `payment_provider_status` carries provider-specific state
3. some code still assumes legacy order states
4. previous Tamara bug showed schema/runtime mismatch

Risk:
1. state drift
2. hidden invalid transitions
3. inconsistent UI interpretations
4. difficult reconciliation across providers

Recommendation:
1. formalize a state model document and enforce transitions
2. separate clearly:
   - booking status
   - fulfillment status
   - provider payment status
3. add transition guards and tests

Priority:
1. High

### 6. `payment_provider` migration default is dangerous
File:
1. `docs/tamara_migration.sql`

Current behavior:
1. documents `payment_provider DEFAULT 'moyasar'`

Risk:
1. silent misclassification of orders
2. exactly the kind of bug already observed in production debugging

Recommendation:
1. remove the default in a real migration
2. always set provider explicitly in application code

Priority:
1. High

### 7. Logging strategy is duplicated and inconsistent
Files:
1. `backend/src/app.js`
2. `backend/src/lib/logger.js`
3. many route/service files

Current behavior:
1. pino structured logging exists
2. plain `console.log` and `console.error` are still heavily used
3. request logs are duplicated by:
   - `pino-http`
   - manual access logging

Risk:
1. noisy logs
2. weaker correlation under incident response
3. harder parsing in aggregation tools

Recommendation:
1. standardize on structured logging
2. add correlation IDs consistently
3. remove redundant console access logs
4. make provider/order ids first-class log fields

Priority:
1. Medium

### 8. Auth bootstrap logic creates profiles dynamically in request path
File:
1. `backend/src/middleware/auth.js`

Current behavior:
1. missing profile triggers on-the-fly profile creation
2. role defaults can be derived from matching agency contact email

Risk:
1. surprising side effects on read paths
2. security/identity complexity
3. hard-to-trace authorization state mutation

Recommendation:
1. separate profile provisioning from request-time auth resolution
2. create explicit onboarding/provisioning flow
3. tighten role derivation semantics

Priority:
1. Medium

### 9. n8n and DRCT reliability patterns are partial
Files:
1. `backend/src/services/n8nClient.js`
2. `backend/src/services/drctService.js`
3. `backend/src/services/drctCircuitBreaker.js`
4. `backend/src/services/drctQueue.js`

Strengths:
1. retries exist
2. circuit breakers exist
3. queue-based rate limiting exists

Weaknesses:
1. queue is process-local
2. breaker state is process-local
3. no durable queue for cross-instance coordination
4. webhook/payment orchestration does not use the same resiliency model

Risk:
1. under horizontal scaling, each replica has its own breaker and queue state
2. DRCT rate-limiting may not remain globally safe if replicas increase

Recommendation:
1. move rate limiting and durable work scheduling to shared infrastructure
2. add centralized job processing for issue/cancel/capture flows

Priority:
1. High

### 10. Health checks are useful but incomplete
Files:
1. `backend/src/routes/health.js`
2. `backend/src/app.js`

Current behavior:
1. `/healthz` basic liveness exists
2. `/healthz/deep` checks Supabase and breaker states

Missing:
1. n8n reachability
2. storage reachability
3. email provider readiness
4. queue backlog metrics
5. webhook lag/reconciliation visibility

Recommendation:
1. extend deep health checks
2. expose degraded dependencies clearly
3. make readiness distinct from liveness

Priority:
1. Medium

### 11. Email delivery is better than before, but not fully operationalized
Files:
1. `backend/src/services/emailService.js`
2. `backend/src/routes/webhooks.js`
3. `backend/src/services/tamara/orderFlow.js`

Current behavior:
1. send path exists
2. provider webhook ingestion exists
3. Tamara flow attempts to send ticket emails

Risk:
1. email is still part of request-owned orchestration logic
2. no guaranteed retry queue is evident in the primary flow
3. success/failure handling is partially best-effort

Recommendation:
1. move send-email into durable outbox/event processing
2. make delivery tracking and retries explicit
3. avoid coupling ticket issuance success to immediate email transport success

Priority:
1. High

### 12. Route surface mixes public, internal, admin, and proxy concerns in one app
Files:
1. `backend/src/app.js`
2. multiple routes

Current behavior:
1. public widget routes
2. authenticated routes
3. admin routes
4. payment webhooks
5. n8n proxy routes
6. metrics
all served from one app without strong boundary distinctions

Risk:
1. broader blast radius
2. harder policy enforcement
3. more accidental exposure of internal behavior

Recommendation:
1. document route trust zones
2. split internal-only endpoints from public application surface where possible
3. apply middleware by route class, not globally by convenience

Priority:
1. Medium

## Positive Observations
1. The codebase already has useful building blocks:
   - Prometheus metrics
   - circuit breakers
   - retry wrapper
   - ticket/email services
2. Tamara flow now has a clearer provider-state concept.
3. There is evidence of operational thinking in:
   - observability docs
   - DRCT reliability docs
   - email lifecycle docs
4. The team has been actively fixing issues with production evidence rather than purely speculative changes.

## Action Plan

### Phase 1: Immediate stability hardening
1. Protect `/metrics` and any internal-only operational endpoints.
2. Remove `payment_provider DEFAULT 'moyasar'` from the real DB migration path.
3. Add hard assertions and post-update verification around all provider linkage writes.
4. Make `issueDrctTicket()` production-safe:
   - disable fake-ticket PDF fallback outside sandbox
5. Add reconciliation script/check for:
   - Tamara orders without linked local provider order id
   - captured/approved mismatches
   - ticket/email missing after successful payment

### Phase 2: Workflow reliability
1. Move Tamara orchestration to a durable async queue/worker.
2. Introduce provider event outbox/inbox discipline:
   - persist
   - enqueue
   - process
   - retry
   - reconcile
3. Build idempotent workers for:
   - Tamara approved handling
   - DRCT issue
   - PDF generation
   - email send
4. Add a manual replay tool for failed provider events.

### Phase 3: State model cleanup
1. Define canonical order/payment/fulfillment state machine.
2. Align DB constraints, UI polling logic, and provider orchestration with that model.
3. Add transition tests.
4. Remove legacy status assumptions from mixed flows.

### Phase 4: Observability and incident response
1. Standardize structured logging and correlation IDs.
2. Add dashboards for:
   - checkout success/failure
   - webhook lag
   - DRCT issue success/failure
   - email send success/failure
   - capture pending/manual review
3. Expand `/healthz/deep` to include:
   - n8n
   - storage
   - email provider
4. Add alerting for:
   - webhook not processed
   - capture pending
   - issue failure
   - repeated provider errors

### Phase 5: Scale readiness
1. Replace process-local queue/rate-limit assumptions with shared infrastructure if replicas increase.
2. Decide on a production queue system.
3. Separate read API, webhook handling, and background workers if traffic grows.
4. Load-test checkout, search, and order orchestration with realistic concurrency.

## QA Scenarios That Must Be Automated
1. Tamara order created and linked correctly in DB.
2. Approved webhook finds order and runs authorise.
3. DRCT issue success path produces ticket issuance row and PDF.
4. Capture success updates provider status.
5. Email success updates issuance/email tracking.
6. Capture failure still leaves issued order with manual-review provider status.
7. Issue failure cancels provider order and marks local order failed.
8. Duplicate webhook does not double-issue or double-capture.
9. Moyasar path remains unaffected by Tamara changes.
10. Cash and invoice flows remain unaffected by Tamara changes.

## Final Assessment
The platform is salvageable and already contains many of the right building blocks. The next step is not another round of ad hoc patches, but turning the payment and fulfillment lifecycle into a durable, observable, idempotent workflow system. That is what will give the product stable uptime, safer growth, and faster incident recovery.

