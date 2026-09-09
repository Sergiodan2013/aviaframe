# Partner Widget Integration Test Plan

## Goal

Validate that a newly created travel agency can receive an agency-specific embed snippet, place it on its own website, load the AviaFrame widget only from approved domains, and complete search and booking flows without leaking tenant context.

## Scope

In scope:
- agency provisioning in admin
- public widget key issuance
- allowed-domain setup
- snippet generation
- widget bootstrap via `embed.js`
- widget session issuance via `/api/widget/session`
- search and booking behavior under the correct agency
- Arabic/English public integration and demo pages

Out of scope:
- deep provider settlement validation
- finance reconciliation
- full DRCT provider certification

## Preconditions

Before testing, prepare:
- one newly created test agency in admin
- one production-like hostname for that agency, for example `test-agency.example.com`
- one non-allowed hostname for negative tests
- access to:
  - `admin.aviaframe.com`
  - `aviaframe.com/partner-integration.html`
  - `aviaframe.com/widget-demo.html`
  - backend logs

## Test Data

Use:
- agency name: `Integration QA Agency`
- agency public widget key: from admin after provisioning
- allowed hostname:
  - `test-agency.example.com`
- denied hostname:
  - `evil-example.test`
- sample route:
  - `RUH -> DXB`
- sample traveler:
  - one adult

## Test Areas

### 1. Agency Provisioning

Expected result:
- agency record exists
- `api_key` is populated
- agency is active
- widget-allowed domains can be saved

Checks:
1. Create a new agency in admin.
2. Confirm the agency receives a public widget key.
3. Confirm the agency settings page shows the widget setup section.
4. Save one allowed production hostname.
5. Reload the agency page and confirm the hostname persists.

### 2. Snippet Generation

Expected result:
- snippet is agency-specific
- snippet contains `data-agency-key`
- snippet does not contain secrets

Checks:
1. Open the agency widget setup area in admin.
2. Copy the generated snippet.
3. Confirm it contains:
   - `https://admin.aviaframe.com/embed.js`
   - `data-agency-key="..."`
   - `data-target-id="aviaframe-widget"`
4. Confirm it does not contain:
   - supplier tokens
   - DRCT credentials
   - payment secrets
   - service-role keys

### 3. Allowed Domain Enforcement

Expected result:
- widget works on approved hostnames
- widget session is denied on non-approved hostnames

Checks:
1. Load the snippet on an allowed hostname.
2. Confirm widget renders.
3. Inspect network and confirm `/api/widget/session` returns success.
4. Repeat from a non-allowed hostname.
5. Confirm session request fails with `403`.
6. Confirm widget does not continue into normal booking flow on denied origin.

### 4. Widget Session Bootstrap

Expected result:
- public key resolves to the correct agency
- backend issues a short-lived token
- token is bound to the origin

Checks:
1. Load a page with the real agency snippet.
2. Inspect the widget bootstrap request.
3. Confirm request contains:
   - `agency_key`
   - `origin_host`
4. Confirm response contains:
   - `widget_token`
   - `expires_in`
   - agency metadata
5. Confirm agency metadata matches the correct agency.

### 5. Search Behavior Under Agency Context

Expected result:
- widget can search normally
- tenant context remains tied to the agency

Checks:
1. Search `RUH -> DXB`.
2. Confirm results render normally.
3. Confirm no cross-agency data appears.
4. Confirm any agency branding/config returned for that session matches the agency under test.

### 6. Booking Flow

Expected result:
- booking continues under the correct agency
- resulting order is visible under that agency

Checks:
1. Select an offer.
2. Fill passenger details.
3. Proceed through payment in the approved test path.
4. Confirm order is created.
5. Confirm the order appears in the correct agency dashboard.
6. Confirm it does not appear under a different agency.

### 7. Public Content and Documentation

Expected result:
- partner integration page clearly explains onboarding
- widget demo links to integration page
- Arabic and English versions contain the same controls

Checks:
1. Open `aviaframe.com/partner-integration.html`.
2. Confirm the page shows:
   - canonical snippet
   - admin onboarding steps
   - architecture explanation
   - copy snippet action
3. Open `aviaframe.com/widget-demo.html`.
4. Confirm visible CTA to integration page.
5. Switch page language to Arabic.
6. Confirm the same CTA/buttons/cards remain present.
7. Repeat for partner integration page in Arabic.

### 8. Negative Security Tests

Expected result:
- invalid or missing key does not bootstrap
- origin mismatch is blocked

Checks:
1. Remove `data-agency-key` and reload.
2. Confirm widget session is not issued.
3. Replace with an invalid key.
4. Confirm backend returns not found or denied response.
5. Tamper with origin context if possible in test setup.
6. Confirm widget-origin validation blocks session or protected actions.

## Pass Criteria

The flow passes if:
- a new agency can be provisioned
- a public widget key is issued
- allowed domains are enforced
- approved hostnames receive a widget session
- denied hostnames do not
- the snippet contains no secrets
- search and booking work under the correct agency
- public docs and demo pages are consistent in English and Arabic

## Failure Severity

Blocker:
- wrong agency receives the widget session
- non-allowed domain is accepted
- secrets appear in snippet or frontend payload
- booking ends up under the wrong agency

High:
- snippet not generated
- widget demo does not link to integration flow
- Arabic page loses critical CTA/buttons

Medium:
- wording inconsistency
- minor layout issues
- copy action fails but manual copy still works

## Suggested Execution Order

1. Admin provisioning
2. Snippet generation
3. Allowed-domain enforcement
4. Widget session bootstrap
5. Search
6. Booking
7. Public docs/content
8. Negative security tests

## Evidence to Collect

Collect:
- screenshot of agency settings with public widget key
- screenshot of allowed domains saved
- copied snippet sample
- network capture of successful `/api/widget/session`
- network capture of denied `/api/widget/session`
- screenshot of widget running on allowed domain
- screenshot of order in correct agency dashboard
- screenshot of English and Arabic integration page
