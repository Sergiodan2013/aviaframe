# Order / Payment / Fulfillment State Note

Prepared on `2026-06-02` as an audit-safe clarification artifact.

## Purpose

AviaFrame currently uses more than one status dimension across order lifecycle, payment providers, and ticket issuance flows. This note establishes the minimum shared interpretation needed for audit discussions before deeper refactoring.

## Status Dimensions

### 1. Business order status

Observed in repo and docs:

- `pending`
- `pending_payment`
- `confirmed`
- `ticketed`
- `cancelled`
- `refunded`
- `failed`

Interpretation:

- `pending` / `pending_payment`: order exists but payment and fulfillment are not complete
- `confirmed`: order is accepted/booked enough to proceed but not yet finally ticketed
- `ticketed`: issuance completed successfully and customer-facing fulfillment may proceed
- `cancelled`: order will not continue
- `refunded`: payment outcome reversed as applicable
- `failed`: workflow terminated unsuccessfully

### 2. Provider payment status

Observed in repo:

- `tamara_checkout_created`
- `tamara_approved`
- `tamara_authorised`
- `tamara_captured`
- `tamara_capture_pending`
- `tamara_failed`
- `tamara_expired`
- `tamara_cancelled`
- `tamara_refunded`

Interpretation:

- These describe provider-specific payment state and must not be treated as the only source of truth for fulfillment.

### 3. Fulfillment / issuance state

Observed in repo and remediation work:

- DRCT-issued ticket path is the normal production path.
- PDF-only issuance without `drct_order_id` is now explicitly blocked unless sandbox override is enabled.
- `manual review required` should be used conceptually for any path where payment or provider state is ambiguous but customer-facing ticket success is not fully confirmed.

## Minimum Rules for Audit Discussion

1. `ticketed` must mean real issuance or a clearly documented sandbox-only exception.
2. Provider approval alone is not equivalent to ticket fulfillment.
3. `tamara_capture_pending` means ticket may be issued while payment capture still needs operational follow-up.
4. Any fallback that generates customer-facing documents without provider-side issuance must be explicitly non-production.
5. Future refactoring should separate:
   - order business status
   - payment provider status
   - fulfillment status

## Current Audit Position

- This note is a control clarification, not a full redesign.
- It reduces ambiguity for the audit immediately.
- Full enforcement in code should be treated as a controlled remediation item, not a rushed pre-audit refactor.
