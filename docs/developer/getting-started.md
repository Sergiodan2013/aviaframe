# Getting started with the AviaFrame Connect API

The current contract version is `1.0.0-alpha.2`. Search, price confirmation, order
creation, and order retrieval are implemented. Ticketing is not yet available in
this alpha.

## 1. Obtain a sandbox key

An AviaFrame manager creates a sandbox API client and gives you a key beginning
with `af_test_`. Keep it server-side and never embed it in a browser or mobile app.

## 2. Search offers

```bash
curl --request POST \
  --url https://sandbox-api.aviaframe.com/partner/v1/offers/search \
  --header 'Authorization: Bearer af_test_REPLACE_ME' \
  --header 'Content-Type: application/json' \
  --header 'X-Correlation-ID: 12d6064d-0a21-4471-b521-c47f7b85cb22' \
  --data '{
    "slices": [
      {
        "origin": "RUH",
        "destination": "DXB",
        "departure_date": "2026-10-10"
      }
    ],
    "passengers": [{ "type": "ADT" }],
    "cabin_class": "economy"
  }'
```

The response contains opaque `offer_id` and `price_quote_id` values. The amount in
`price.total` is the commercial AviaFrame price for your organisation.

## 3. Confirm the price

Reprice before creating an order. Search prices can change or expire.

```bash
curl --request POST \
  --url https://sandbox-api.aviaframe.com/partner/v1/offers/off_test_REPLACE_ME/price \
  --header 'Authorization: Bearer af_test_REPLACE_ME' \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: 80ee1771-7afb-48c2-a4ac-e5ce21e9fa17' \
  --data '{
    "passengers": [{ "type": "ADT" }]
  }'
```

Use the newest `price_quote_id` and respect `valid_until`. A `409 OFFER_CHANGED`
response means the supplier offer changed and the customer must accept a new
quote or run another search.

## 4. Create an order

Send the latest `price_quote_id`, repeat the exact commercial total, and use a
unique idempotency key. Never create a second order when the response status is
`PENDING_RECONCILE`; retrieve the returned order until reconciliation completes.

```bash
curl --request POST \
  --url https://sandbox-api.aviaframe.com/partner/v1/orders \
  --header 'Authorization: Bearer af_test_REPLACE_ME' \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: 30d9fa55-89e8-4f54-bb22-6ec189790195' \
  --data '{
    "price_quote_id": "quote_test_REPLACE_ME",
    "client_order_ref": "WEB-2026-000184",
    "expected_total": { "total": "418.00", "currency": "USD" },
    "contact": { "email": "traveler@example.com", "phone": "+966500000000" },
    "passengers": [{
      "type": "ADT",
      "title": "Mr",
      "gender": "M",
      "first_name": "Omar",
      "last_name": "Saleh",
      "date_of_birth": "1990-04-12",
      "document": {
        "number": "P1234567",
        "issuing_country": "SA",
        "citizenship": "SA",
        "expiration_date": "2030-04-11"
      }
    }]
  }'
```

Retrieve the order with `GET /orders/{order_id}` using a credential with the
`orders:read` scope.

## Errors and support

Every non-2xx response contains `code`, `message`, `details`, and
`correlation_id`. Provide `correlation_id` when contacting support. Do not retry
validation, permission, or expired-offer errors unchanged. Retry 429 and 5xx
responses with exponential backoff and jitter.

The complete field-level contract is in
[`../api/partner-openapi.yaml`](../api/partner-openapi.yaml).
