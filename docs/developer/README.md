# AviaFrame Developer Platform

This directory is the editorial source for the future public developer portal at
`developers.aviaframe.com`. The machine-readable source of truth is
[`../api/partner-openapi.yaml`](../api/partner-openapi.yaml).

## Public site map

- Getting started
- Authentication and environments
- Flight search
- Price confirmation
- Orders and ticketing
- Errors and retries
- Idempotency
- Webhooks
- Rate limits
- Changelog and deprecations
- API reference generated from OpenAPI

Current guide: [Getting started](getting-started.md)

## Service domains

- Documentation: `https://developers.aviaframe.com`
- Sandbox API: `https://sandbox-api.aviaframe.com/partner/v1`
- Production API: `https://api.aviaframe.com/partner/v1`
- Partner dashboard: `https://partners.aviaframe.com`
- Status page: `https://status.aviaframe.com`

Supplier names, credentials, identifiers, source prices, and internal pricing
rules are not part of the public documentation or API responses.

## Publishing rule

The public reference must be generated from the versioned OpenAPI file. Guides
may explain the contract but must not define fields or behavior that differ from
OpenAPI. Breaking changes require a new API version and migration guide.
