# AviaFrame Agency Onboarding Guide

## Purpose

This guide explains the production-ready agency setup flow in AviaFrame:

1. Super admin creates the agency record.
2. The agency manager receives setup access.
3. The agency completes branding, payments, domain setup, and publish steps.
4. The agency tests the public site and widget.
5. The agency goes live for real bookings.

This guide is written to match the current admin portal behavior and button labels.

## Roles

### Super admin

Responsible for:

- creating the agency
- assigning the manager email
- choosing whether to send setup only, create only, or create and deploy immediately
- resending setup instructions if needed
- publishing or republishing the agency site when needed
- verifying that the agency is ready for go-live

### Agency manager

Responsible for:

- signing in with the invited email
- completing agency branding and contact details
- configuring payment methods
- adding allowed widget domains if the widget will be embedded outside the agency site
- checking the onboarding checklist
- publishing or republishing the site after changes
- testing search, booking, payment, and issued ticket delivery

## Three Creation Paths

### 1. `Send setup flow`

Use this when:

- you want to create the agency as a draft first
- the agency manager should finish setup themselves
- you do not want to publish the public site yet

What happens:

- a draft agency is created
- the manager email is linked
- the onboarding email is sent
- the agency appears in the Agencies list
- the agency can continue setup later from the admin portal

### 2. `Create & Deploy Site`

Use this when:

- you already have enough minimum information
- you want the public agency site available immediately
- super admin is handling the initial rollout

What happens:

- the agency is created
- the public site is deployed
- the agency receives its public site URL
- setup can still continue afterward

### 3. `Create only (no site)`

Use this when:

- you want to create the agency record only
- you are waiting for branding, payment, or domain details
- you do not want to send the manager email yet

What happens:

- the agency is saved
- no public site is deployed
- no setup email is sent automatically
- super admin can later use `Send setup again`, `Publish first time`, or `Republish`

## Agency Row Actions

### `Open/Edit`

Opens the agency record for edits.

### `Send setup` / `Send setup again`

Sends or resends the onboarding email to the agency manager.

Use it when:

- the manager did not receive the original email
- the manager needs the instructions again
- the agency was created with `Create only (no site)` and should now start setup

### `Publish first time`

Publishes the public site for the first time.

This button is enabled only when the onboarding checklist is publish-ready.

### `Republish`

Pushes the latest agency settings to an already deployed public site.

Use it after:

- logo changes
- color changes
- text/content changes
- contact updates
- payment method changes
- widget/domain changes that affect site content

### `Suspend`

Disables an agency operationally without deleting its record.

### `Delete`

Use only if the agency should be permanently removed.

## Minimum Data Needed To Create A New Agency

Recommended minimum:

- agency name
- subdomain / domain
- manager email
- primary phone
- default brand colors
- at least one payment method

Recommended before first public publish:

- logo
- agency description
- contact person name
- bank details if `invoice` payment is enabled
- allowed widget domains if the widget will run outside the agency public site

## Current Publish Readiness Checklist

The portal currently checks these required items before first publish:

- agency name
- agency domain / subdomain
- agency manager email
- primary contact phone
- brand colors
- enabled payment methods
- invoice bank details if invoice payment is enabled

Optional but strongly recommended:

- agency logo
- agency description
- manager or supervisor contact
- allowed widget domains

## Recommended Operational Flow

### Phase 1. Super admin creates the agency

Best default production path:

1. Create the agency with name, subdomain, manager email, and phone.
2. Use `Send setup flow`.
3. Let the manager complete setup.
4. Review the checklist.
5. Publish once the required fields are complete.

This is the safest path because it avoids publishing half-configured sites.

### Phase 2. Agency manager completes setup

The agency manager should:

1. Sign in with the invited email.
2. Open `Agency admin`.
3. Upload logo.
4. Set brand and accent colors.
5. Fill contact details and secondary contacts.
6. Configure payment methods.
7. Fill bank details if invoice payments are enabled.
8. Add allowed widget domains if they want to embed the widget elsewhere.
9. Save settings.
10. Review the onboarding checklist until publish-ready.

### Phase 3. Publish and test

After settings are saved:

1. Publish the site.
2. Open the public site.
3. Test search.
4. Test booking.
5. Test payment.
6. Confirm ticket email and PDF delivery.
7. If branding/content changed, use `Republish`.

## What The Agency Manager Should Receive

The onboarding email should give the manager:

- admin portal URL
- agency site URL
- agency domain
- public widget key
- next-step instructions

The manager should not need product knowledge from a separate chat to complete setup.

## What The Agency Should Be Able To Customize

Current portal supports customization of:

- agency name and Arabic name
- logo URL / uploaded logo
- primary and accent colors
- contact phones
- WhatsApp
- about text in EN/AR
- working hours in EN/AR
- license number
- IATA number
- founded year
- Google Maps embed URL
- Instagram / X / Snapchat / Facebook
- services list
- payment methods
- commission model
- widget allowed domains
- bank details for invoice flow

## Widget Embedding Flow

Use this when the agency wants the widget on another site, not only on its AviaFrame public site.

Required:

- public widget key
- allowed widget domain added in agency settings
- embed snippet installed on the target site

Recommended order:

1. Add the target domain to allowed widget domains.
2. Save settings.
3. Republish if the public site or widget config should reflect the change.
4. Copy the embed snippet and widget key.
5. Install on the target site.
6. Smoke-test search and booking.

## Best-Practice Rules For Production

### Recommended default behavior

- default new agencies to draft, not live
- send setup email before first publish
- block first publish until required checklist items are complete
- allow unlimited resend of setup instructions
- allow republish after changes
- keep a short deploy cooldown to prevent accidental spam deploys

### Do not use a very low monthly deploy cap

A hard cap like 3 deploys per month is too restrictive during onboarding and launch.

Better policy:

- keep the technical cooldown between deploys
- optionally add a soft monthly threshold for alerts
- allow super admin override
- log deploy history per agency

This protects infrastructure without blocking legitimate edits.

## Suggested Limits

Best practical version:

- cooldown between deploys: 60 seconds
- deploy-in-progress lock: 5 minutes
- warning threshold: 10 deploys per agency per month
- hard block threshold: optional, only if abuse becomes real
- super admin override: yes

## Recommended Test Scenarios

### Super admin flow

1. Create a new agency with `Send setup flow`.
2. Confirm the agency appears in the Agencies list.
3. Confirm `Send setup again` is available.
4. Confirm `Publish first time` is disabled until checklist is ready.

### Agency manager flow

1. Sign in with the invited email.
2. Complete branding and payment settings.
3. Save settings.
4. Confirm checklist becomes publish-ready.
5. Publish site.
6. Open public site.
7. Change logo or colors.
8. Republish.
9. Confirm public site updates.

### Widget flow

1. Add an external domain to allowed widget domains.
2. Save settings.
3. Install the widget snippet on that domain.
4. Verify search works.
5. Verify booking opens under the correct agency context.

### Booking flow

1. Search flights from the public site.
2. Select a flight.
3. Complete passenger details.
4. Complete payment.
5. Confirm ticket email and PDF are received.

## Go-Live Checklist

Before an agency is considered live:

- manager email confirmed
- branding completed
- payment methods verified
- invoice bank details verified if invoice is enabled
- public site opens successfully
- search works
- booking works
- payment works
- ticket email works
- PDF ticket is delivered
- widget embedding tested if needed

## Known Operational Dependencies

The setup flow depends on:

- email provider being configured
- admin portal URL being correct
- backend being reachable from the admin frontend
- deploy provider credentials being configured
- agency domain matching supported deployment rules

If any of these are missing, setup may save successfully but invite or publish steps may fail.

## Recommended Product Direction

The best long-term product pattern is:

1. Super admin creates the agency with minimal data.
2. Manager receives a guided setup flow.
3. Checklist tracks completion progressively.
4. First publish is gated.
5. Republish is self-serve.
6. Widget domains and payment settings are controlled in one place.
7. Deploys are rate-limited lightly, not aggressively.

This gives the fastest onboarding without giving agencies enough freedom to break production by accident.
