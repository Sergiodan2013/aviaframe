# NDC Sandbox Frontend - 2026-07-20

## Live test URL

- `https://aviaframe-ndc-sandbox-20260720.netlify.app/widget-demo.html`

## Why this site exists

- It is an isolated public frontend for sandbox NDC testing.
- It does **not** change `https://aviaframe.com/widget-demo`.
- Search is routed through a site-local proxy so backend search runs with sandbox origin semantics.
- Booking/OfferPrice/DRCT order create are forced into the dedicated sandbox contour by sending:
  - `siteOriginHost: sandbox.aviaframe.com`

## Isolation status

As of `2026-07-20`, the production backend sandbox marker was moved off `testenvavia.netlify.app` and onto `sandbox.aviaframe.com`.

This means:

- `testenvavia.netlify.app` is no longer the sandbox marker host
- the new sandbox site is isolated from `testenv`
- `https://aviaframe.com/widget-demo` was not changed by this isolation step

## What was verified on 2026-07-20

1. Search via the Netlify proxy returns sandbox offers.
2. `OfferPrice` succeeds for a sandbox itinerary.
3. `POST /api/widget/orders` succeeds and returns a real sandbox `drct_order_id`.

Verified working example:

- Route: `CDG -> LHR`
- Date: `2026-08-15`
- Passenger mix: `1 ADT`

Observed result:

- `drct_order_id`: created successfully in sandbox
- verified after isolation with `origin_host = sandbox.aviaframe.com`

## Current blocker for full payment E2E

The backend environment still does not have confirmed sandbox payment secrets available for safe completion of the final payment step:

- `MOYASAR_TEST_SECRET_KEY`
- `MOYASAR_TEST_WEBHOOK_SECRET`

Until those are set or regenerated and installed, the site is ready for:

- sandbox search
- sandbox OfferPrice
- sandbox order create

but the final safe payment confirmation step should be treated as blocked.

## Config source

Template added for reuse:

- [config.ndc-sandbox.example.js](/Users/sergejdaniluk/Documents/aviaframe/mon_jan_26_2026_create_aviaframe_monorepo_and_documentation%20(2)/aviaframe-site/config.ndc-sandbox.example.js)
