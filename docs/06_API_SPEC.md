# Aviaframe — Public API Specification (Backend)

Version: 1.0  
Date: 2026-01-26  
Author: Product / Engineering

This document describes the public (customer-facing) API surface of the Aviaframe backend. This API is Aviaframe's own API and is distinct from DRCT's API. All DRCT interactions are performed server-side by Aviaframe — DRCT bearer tokens are never exposed to clients or frontends.

Guiding principles (quick)
- Authentication: Tenant-scoped credentials (Bearer tokens / API keys / OAuth) are required on all protected endpoints.
- Tenant context: Tenant resolution is enforced server-side; clients MUST not rely on client-supplied tenant_id to provide isolation. The server resolves tenant context from the auth token or validated session.
- Idempotency: Required for state-changing operations prone to duplication (see endpoints).
- Error format: All errors follow the standard structure:
  ```json
  {
    "error": {
      "code": "ERROR_CODE",
      "message": "Human readable message",
      "details": {...} // optional
    }
  }
  ```
- Rate limiting: Per-tenant and global limits are enforced. When rate-limited, responses include Retry-After header and a 429 status.
- DRCT tokens: DRCT bearer tokens are backend-only secrets and are never returned to clients or included in any public responses or logs.

Base URL (examples)
- Sandbox: https://api.sandbox.aviaframe.example/v1
- Production: https://api.aviaframe.example/v1

Authentication & tenant context
- Supported auth mechanisms:
  - Authorization: Bearer <access_token> — token must be tenant-scoped (preferred).
  - X-API-Key: <api_key> — alternative for server-to-server integrations (tenant-bound).
  - Session cookie (portal UI) — backend verifies session and resolves tenant context.
- Tenant resolution:
  - The backend resolves the tenant associated with the authenticated principal (token/API key/session).
  - Clients MUST NOT supply a tenant_id in requests as the source of truth for authorization; any client-supplied tenant_id will be validated against the token's tenant and rejected if mismatched.
  - Public/config endpoints that are intentionally unauthenticated (if any) will be explicitly documented; by default endpoints in this spec require auth.

Common headers
- Authorization: Bearer <token>
- Content-Type: application/json
- Accept: application/json
- Idempotency-Key: <UUID> (REQUIRED for POST /public/orders and POST /public/orders/{orderId}/issue)
- X-Correlation-ID: <uuid> (recommended to correlate logs/traces)
- Retry-After: <seconds> (returned by server on 429)

Standard response codes (summary)
- 200 OK — successful read/update where applicable
- 201 Created — resource created
- 400 Bad Request — invalid input
- 401 Unauthorized — missing/invalid credentials
- 403 Forbidden — authenticated but not authorized for tenant/resource
- 404 Not Found — resource missing or expired (e.g., offer expired)
- 409 Conflict — idempotency conflict or resource conflict (e.g., price changed)
- 422 Unprocessable Entity — semantic validation failed (e.g., passenger data)
- 429 Too Many Requests — rate limiting; includes Retry-After
- 503 Service Unavailable — upstream (DRCT) degraded or platform degraded

Endpoints
- POST /public/search
- PATCH /public/offers/{offerId}/price
- POST /public/orders
- POST /public/orders/{orderId}/issue
- DELETE /public/orders/{orderId}

---

POST /public/search
- Purpose
  - Accepts flight search criteria from widget or portal and returns a normalized list of available offers. The backend mediates to DRCT (or cache) and returns Aviaframe-normalized offers.
- Auth
  - Authorization: Bearer <tenant-scoped-token> OR X-API-Key: <tenant-scoped-key>
  - Tenant is resolved from the token; tenant context is enforced server-side.
- Request example
  - Headers:
    ```
    Authorization: Bearer eyJhbGci...
    Content-Type: application/json
    X-Correlation-ID: 123e4567-e89b-12d3-a456-426614174000
    ```
  - Body:
    ```json
    {
      "origin": "DXB",
      "destination": "LHR",
      "depart_date": "2026-03-10",
      "return_date": "2026-03-20",
      "adults": 1,
      "children": 0,
      "infants": 0,
      "cabin": "economy",
      "currency": "USD",
      "locale": "en"
    }
    ```
- Response example (200 OK)
  ```json
  {
    "search_id": "search-uuid-0001",
    "offers": [
      {
        "offer_id": "af-offer-123",
        "itinerary": [
          {
            "segment_id": "seg-1",
            "dep": "DXB",
            "arr": "LHR",
            "dep_time": "2026-03-10T02:00:00Z",
            "arr_time": "2026-03-10T07:00:00Z",
            "carrier": "EK",
            "flight_number": "001"
          }
        ],
        "price": {
          "amount": 420.00,
          "currency": "USD",
          "breakdown": {"base": 380.00, "taxes": 40.00}
        },
        "fare_rules_summary": "Non-refundable - changes allowed with fees",
        "valid_until": "2026-01-26T15:00:00Z",
        "meta": {
          "booking_code": "Y",
          "provider": "DRCT"
        }
      }
    ]
  }
  ```
- Error cases
  - 400 Bad Request — invalid/missing fields (e.g., missing origin or destination).
  - 401 Unauthorized — missing/invalid token.
  - 403 Forbidden — token valid but not authorized for tenant.
  - 429 Too Many Requests — tenant or global rate limit exceeded (Retry-After returned).
  - 503 Service Unavailable — DRCT upstream failure or system degraded.
- Notes
  - The backend may return cached results when allowed by DRCT contracts. Offer IDs are Aviaframe IDs and must be used for subsequent operations.
  - The server will include the offer valid_until value; clients must check validity before creating an order.

---

PATCH /public/offers/{offerId}/price
- Purpose
  - Confirm or reprice a selected offer (for example, passenger mix changes, extras). Returns final price breakdown including any tenant markups.
- Auth
  - Authorization: Bearer <tenant-scoped-token> OR X-API-Key
  - Tenant resolved server-side.
- Path parameters
  - offerId — Aviaframe offer identifier returned by POST /public/search
- Request example
  - Headers:
    ```
    Authorization: Bearer eyJhbGci...
    Content-Type: application/json
    X-Correlation-ID: 123e4567-e89b-12d3-a456-426614174000
    ```
  - Body (optional; include if changing passenger mix or currency)
    ```json
    {
      "adults": 1,
      "children": 0,
      "infants": 0,
      "currency": "USD"
    }
    ```
- Response example (200 OK)
  ```json
  {
    "offer_id": "af-offer-123",
    "price": {
      "amount": 430.00,
      "currency": "USD",
      "breakdown": {
        "base": 390.00,
        "taxes": 40.00,
        "agency_markup": 10.00
      }
    },
    "fare_rules": "Non-refundable. Changes allowed with fees. See details link.",
    "valid_until": "2026-01-26T15:30:00Z"
  }
  ```
- Error cases
  - 400 Bad Request — invalid request body.
  - 401 Unauthorized — missing/invalid token.
  - 404 Not Found — offer not available or expired.
  - 409 Conflict — price changed since initial search; client should re-initiate search/pricing flow.
  - 429 Too Many Requests — rate limited (Retry-After header).
  - 503 Service Unavailable — DRCT errors or upstream degradation.
- Notes
  - If DRCT signals that the fare has changed or expired, return 409 with a brief description and an optional suggested action (e.g., reprice, re-search).
  - The backend applies tenant-specific markups and returns the final price shown to the agent/customer.

---

POST /public/orders
- Purpose
  - Create a booking on behalf of the tenant. This operation translates Aviaframe order model into a DRCT order_create call. It is state-changing and therefore requires idempotency handling.
- Auth
  - Authorization: Bearer <tenant-scoped-token> OR X-API-Key
  - Idempotency-Key (required header): a UUID provided by the client to ensure exactly-once semantics.
  - Tenant resolved server-side; server validates that the token is authorized to create orders for that tenant.
- Request example
  - Headers:
    ```
    Authorization: Bearer eyJhbGci...
    Content-Type: application/json
    Idempotency-Key: 9f8b7a6e-1234-4c3b-9a8b-0f1e2d3c4b5a
    X-Correlation-ID: 123e4567-e89b-12d3-a456-426614174000
    ```
  - Body:
    ```json
    {
      "offer_id": "af-offer-123",
      "passengers": [
        {
          "type": "ADT",
          "first_name": "John",
          "last_name": "Doe",
          "document": {
            "type": "passport",
            "number": "P<ENCRYPTED>",
            "country": "US",
            "expiry": "2028-01-01"
          }
        }
      ],
      "contact": {
        "email": "agent@agency.example",
        "phone": "+971501234567"
      },
      "payment": {
        "method": "external",
        "reference": "pay-ref-789"
      }
    }
    ```
- Response example (201 Created)
  ```json
  {
    "order_id": "order-uuid-321",
    "status": "BOOKED",
    "amount_total": 430.00,
    "currency": "USD",
    "created_at": "2026-01-26T12:00:00Z"
  }
  ```
- Error cases
  - 400 Bad Request — validation error (missing passenger name, invalid document format).
  - 401 Unauthorized — missing/invalid token.
  - 409 Conflict — idempotency conflict (same Idempotency-Key used with a different payload) OR booking conflict detected by provider.
  - 422 Unprocessable Entity — semantic validation failed (e.g., passport expiry before travel date).
  - 429 Too Many Requests — rate-limited (Retry-After header).
  - 503 Service Unavailable — DRCT upstream failure; order may be in uncertain state (see partial success handling).
- Idempotency & partial success behavior
  - The server MUST persist the Idempotency-Key and the resulting response for the configured TTL (default 7 days).
  - On receiving a request with an Idempotency-Key that already exists:
    - If the payload matches the previous request, return the stored response (status code and body).
    - If the payload differs, return 409 Conflict with details.
  - If an order_create call to DRCT returns a partial/unknown result (e.g., provider accepted but response lost), the server sets order status to PENDING_RECONCILE and schedules a reconciliation job. Clients should poll GET /public/orders/{orderId} (if implemented) or rely on webhooks (v2).
- Notes
  - Passenger documents in the request must be encrypted in transit (TLS) and will be encrypted at rest by the backend. Backend will redact/mask PII in logs and DRCTRequestLog.

---

POST /public/orders/{orderId}/issue
- Purpose
  - Issue tickets for an existing order after payment confirmation. This is state-changing and must be idempotent.
- Auth
  - Authorization: Bearer <tenant-scoped-token> OR X-API-Key
  - Idempotency-Key (required header): UUID
- Path parameters
  - orderId — Aviaframe order_id returned by POST /public/orders
- Request example
  - Headers:
    ```
    Authorization: Bearer eyJhbGci...
    Content-Type: application/json
    Idempotency-Key: 1a2b3c4d-5678-9abc-def0-1234567890ab
    X-Correlation-ID: 123e4567-e89b-12d3-a456-426614174000
    ```
  - Body (optional)
    ```json
    {
      "confirm_payment_reference": "pay-ref-789"
    }
    ```
- Response example (200 OK)
  ```json
  {
    "order_id": "order-uuid-321",
    "status": "ISSUED",
    "tickets": [
      {
        "passenger": "John Doe",
        "ticket_number": "1234567890",
        "ticketed_at": "2026-01-26T15:00:00Z"
      }
    ],
    "issued_at": "2026-01-26T15:00:00Z"
  }
  ```
- Error cases
  - 400 Bad Request — invalid request or order not eligible for issuing (e.g., already cancelled).
  - 401 Unauthorized — missing/invalid token.
  - 404 Not Found — order not found.
  - 409 Conflict — idempotency conflict (same Idempotency-Key used with different intent) OR issuance already processed.
  - 422 Unprocessable Entity — missing payment confirmation or passenger document issues.
  - 429 Too Many Requests — rate-limited.
  - 503 Service Unavailable — DRCT failure or provider-side error.
- Idempotency rules
  - Same as POST /public/orders: server saves Idempotency-Key and returns the same result for repeated calls with the same key.
  - Repeated issue calls with same key MUST NOT create duplicate tickets.
- Notes
  - Issuing may require payment verification. The backend must verify payment_reference (or external proof) before calling DRCT issue endpoint, per tenant policy.

---

DELETE /public/orders/{orderId}
- Purpose
  - Cancel a booking (full or partial depending on DRCT and fare rules). This operation maps to DRCT cancel workflows and may involve refunds handled by the agency/PSP.
- Auth
  - Authorization: Bearer <tenant-scoped-token> OR X-API-Key
- Path parameters
  - orderId — Aviaframe order_id
- Request example
  - Headers:
    ```
    Authorization: Bearer eyJhbGci...
    Content-Type: application/json
    X-Correlation-ID: 123e4567-e89b-12d3-a456-426614174000
    ```
  - Body (optional; for partial cancellations)
    ```json
    {
      "passengers": ["pax-1"], // identifiers for passengers/segments to cancel
      "reason": "Customer request"
    }
    ```
- Response example (200 OK)
  ```json
  {
    "order_id": "order-uuid-321",
    "status": "CANCELLED",
    "refund": {
      "amount": 300.00,
      "currency": "USD",
      "refund_reference": "refund-abc-123"
    },
    "cancelled_at": "2026-01-26T16:00:00Z"
  }
  ```
- Error cases
  - 400 Bad Request — cancellation not permitted for this fare type or invalid parameters.
  - 401 Unauthorized — missing/invalid token.
  - 404 Not Found — order not found.
  - 409 Conflict — concurrent modification or cancellation already in progress.
  - 429 Too Many Requests — rate-limited upstream.
  - 503 Service Unavailable — DRCT failure.
- Notes
  - Refund processing is out-of-scope for MVP (handled by agency/PSP). The backend records refund_reference when provided by the agency or PSP and persists refund metadata.
  - If DRCT returns partial cancellation acceptance, the order status will reflect partial cancellation and AuditLog and DRCTRequestLog will contain sanitized details.

---

Example error response (generic)
```json
{
  "error": {
    "code": "AVF_400_INVALID_INPUT",
    "message": "Invalid request: depart_date is required",
    "details": {
      "field": "depart_date"
    }
  }
}
```

Operational considerations (implementation notes)
- DRCT tokens and credentials are backend-only secrets:
  - They MUST be stored in secure secret storage (KMS / secrets manager).
  - They MUST never be returned to clients, exposed in widget code, logs, or analytics.
- Tenant resolution:
  - The server resolves tenant context from the authenticated principal (token/API key/session). Middleware MUST enforce tenant scoping on every tenant-scoped request.
- Rate limiting:
  - Implement per-tenant token bucket with configurable plan limits and global provider smoothing to avoid DRCT limit violations.
- Idempotency storage:
  - Persist idempotency records durably and ensure low-latency reads. TTL defaults to 7 days but must be configurable.
- DRCT error handling:
  - Follow documented retry/backoff rules in docs/03_SRS.md and docs/DRCT_INTEGRATION.md. Map provider errors to stable Aviaframe error codes.
- Logging & privacy:
  - All logs and DRCTRequestLog entries must have PII redacted or masked. Full unmasked PII must not be logged.
- Webhooks (future):
  - In v2, support tenant-configured webhooks for order state events (order.created, order.issued, order.cancelled). Webhooks must be signed and tenant-scoped.

Change management & versioning
- This API is versioned at the path level (e.g., /v1/...). Breaking changes require a new major version.
- Backwards-compatible additions (new fields) should be optional and non-breaking. Document changes in docs/CHANGELOG.md.

Contact & support
- Integration or sandbox access issues: ops@aviaframe.example (internal)
- DRCT integration incidents: follow runbook in docs/DRCT_INTEGRATION.md and alert on-call SRE.

Appendix — Quick integration notes for widget developers
- The widget should initialize with tenant_id or client_id only as provided by the Portal embed snippet, but must authenticate its calls to backend via a short-lived token or same-origin session — never with DRCT credentials.
- The widget should handle 429 responses gracefully, using Retry-After headers and presenting friendly retry UI to end users.
- For operations that require Idempotency-Key, backend should generate keys for the client flows where appropriate; otherwise clients (server-side integrations) must generate and provide a stable UUID per logical operation.

For full request/response schemas and example SDK snippets (Node, curl), see docs/sdk/ (to be added). If API behavior needs to change, update this specification and increment the API version accordingly.