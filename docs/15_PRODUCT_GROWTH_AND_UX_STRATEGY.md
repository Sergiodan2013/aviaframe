# AviaFrame — Product Growth and UX Strategy

Version: 1.0  
Date: 2026-06-29  
Author: Codex / Product Strategy Review

## Purpose

This document translates the current AviaFrame state into a practical product growth plan.

It is written to help Product, Design, Engineering, Sales, and Founders answer four questions:

1. What AviaFrame should become to grow faster.
2. What is currently blocking growth from a product and UX point of view.
3. Which improvements should be prioritized first.
4. How to turn the current platform into a clearer, more scalable B2B product.

---

## Executive take

AviaFrame's strongest growth position is not "flight booking software" in general.

Its best strategic wedge is:

> The fastest way for a travel agency in the GCC and nearby markets to launch branded online flight sales without building its own supplier infrastructure.

That means the product should be packaged, designed, and sold around one promise:

- `launch fast`
- `look branded`
- `stay compliant`
- `keep supplier/payment complexity out of the agency frontend`

Today the product already has strong ingredients for this:

- tenant-scoped architecture
- embedded widget model
- agency admin surface
- public integration story
- hosted/whitelabel direction

But growth is currently constrained by four issues:

1. Positioning is blurred.
2. Onboarding feels too operational and internal.
3. Core booking trust and passenger UX are not mature enough yet.
4. The admin product is organized like a power console, not like a scalable SaaS workflow.

---

## Strategic product direction

## 1. Product packaging should be split into 3 clear modes

AviaFrame should stop looking like one generic product and instead be presented as three deployment modes with a shared backend:

### A. Hosted White-Label

Best for agencies without a development team.

What they get:

- branded hosted booking site
- custom domain or branded subdomain
- payment setup
- email delivery
- order management

Core promise:

> Go live with online flight sales in days, not months.

### B. Embedded Widget

Best for agencies that already have a website and want to add booking into their current traffic flow.

What they get:

- public widget key
- snippet
- domain allowlist
- configurable branding
- agency-scoped session bootstrap

Core promise:

> Add flight booking to your existing site with minimal engineering effort.

### C. Enterprise / API

Best for large agencies, consolidators, or travel platforms with their own engineering resources.

What they get:

- deeper integration support
- advanced controls
- commercial customization
- priority SLA

Core promise:

> Keep your own frontend and workflows, while AviaFrame runs the supplier and booking backbone.

### Why this matters

Right now, AviaFrame strategy documents already imply tiered B2B packaging, but the external presentation is still too flat. This limits conversion because different buyer types are forced into the same story.

---

## 2. The real North Star should be "first live agency"

For AviaFrame, a better growth metric than generic traffic or demo views is:

`Time from first contact to first live booking by an agency`

This should become the main operating metric across product and sales.

Recommended funnel:

1. Visitor lands on site.
2. Visitor chooses deployment mode.
3. Visitor starts guided setup.
4. Agency is provisioned.
5. Branding and domain are configured.
6. Payment mode is configured.
7. Preview is validated.
8. Agency goes live.
9. Agency gets first live booking.

If the product is optimized for this funnel, growth becomes much more predictable.

---

## Product gap analysis

## 1. Positioning and pricing gap

### Current issue

The business docs describe a multi-tier B2B SaaS model, but the public experience still reads more like a single-plan sales page.

### Why this hurts growth

- low-tech agencies do not understand that hosted white-label is for them
- larger agencies do not see an enterprise path
- founders lose room for upsell and expansion pricing
- the product can look smaller than it really is

### Product recommendation

- create separate entry points for `Hosted`, `Embed`, and `Enterprise`
- add deployment-mode comparison table
- move from one flat plan story to structured pricing tiers
- create a short "Which setup is right for your agency?" decision block

Priority: `High`

---

## 2. Onboarding gap

### Current issue

The current agency onboarding logic appears powerful, but too much of it still feels like an internal operator flow.

The product promise is fast activation, yet the workflow is still too form-heavy and admin-heavy.

### Why this hurts growth

- slower partner activation
- more founder/support involvement per onboarding
- lower self-serve conversion
- weaker confidence for non-technical agencies

### Product recommendation

Replace generic setup forms with a dedicated onboarding wizard:

1. Create agency
2. Choose deployment mode
3. Upload branding
4. Set allowed domains or hosted URL
5. Choose payment mode
6. Preview experience
7. Run go-live checklist
8. Copy snippet or publish hosted page

### UX improvement

Every step should show:

- progress
- why this matters
- expected input format
- next action
- success state

Priority: `Critical`

---

## 3. Passenger flow gap

### Current issue

The product supports richer passenger mixes at search time, but the booking flow is still too close to a single-adult scenario.

### Why this hurts growth

This is not cosmetic. It creates a credibility risk:

- family travel is common
- group bookings are commercially important
- agencies will quickly notice the mismatch
- the booking promise becomes less trustworthy

### Product recommendation

Make the booking form passenger-aware:

- one form section per passenger
- passenger type aware fields
- adult / child / infant validation rules
- document requirements by passenger type
- clear progression for multi-passenger completion

### UX improvement

Use a structured stepper:

- Passenger 1 of 3
- Passenger 2 of 3
- Passenger 3 of 3

Add completion indicators and validation summaries before payment.

Priority: `Critical`

---

## 4. Payment trust gap

### Current issue

The payment step is functional, but still too transactional and not reassuring enough for a high-trust purchase like flights.

### Why this hurts growth

Users need confidence at the most fragile step:

- airline and itinerary summary must feel final
- payment errors must feel understandable
- support path must be obvious
- price and currency expectations must be explicit

### Product recommendation

Redesign the payment area around trust:

- strong fare summary card
- clear total and currency explanation
- payment method trust badges
- support and escalation visibility
- explicit "what happens after payment"
- better failure handling and retry guidance

### UX improvement

The payment page should answer:

- What exactly am I buying?
- How much will I be charged?
- What happens if this fails?
- When do I get my ticket?
- How do I get help?

Priority: `High`

---

## 5. Search and results gap

### Current issue

Search works, but it is still closer to a functional search form than a high-conversion flight shopping experience.

### Why this hurts growth

For agencies, the public booking flow is the product. If search feels basic, the whole platform feels less mature.

### Product recommendation

Improve search UX in 3 layers:

#### Layer 1: Input quality

- better autocomplete ranking
- city vs airport clarity
- nearby airport grouping
- recent searches
- typo tolerance confidence

#### Layer 2: Shopper confidence

- highlight baggage/refundability/change rules
- clearer price refresh states
- better explanation when fares expire

#### Layer 3: Merchandising

- fastest / cheapest / best value anchors
- "popular choice" labels
- airline filter trust states
- stop-duration emphasis

Priority: `High`

---

## 6. Admin information architecture gap

### Current issue

The admin surface is still too concentrated inside a large power dashboard.

### Why this hurts growth

- difficult onboarding for new staff
- harder to delegate operations
- weaker perceived maturity for partners and stakeholders
- more room for mistakes

### Product recommendation

Split the admin product into clear jobs-to-be-done:

- `Onboarding`
- `Agencies`
- `Widget / Hosted Setup`
- `Orders`
- `Support`
- `Finance`
- `Analytics`
- `Settings`

### UX improvement

For each area:

- make the primary action obvious
- reduce mixed-purpose layouts
- isolate destructive or advanced controls
- separate "setup" from "operations"

Priority: `High`

---

## 7. Partner conversion gap

### Current issue

The public demo and integration story are improving, but they are not yet fully connected into a single partner conversion funnel.

### Why this hurts growth

A prospect should be able to understand:

- what the product is
- which model fits them
- how integration works
- how long it takes
- what they receive after signup

without needing manual explanation from the founder.

### Product recommendation

Build a clear B2B partner funnel:

1. Landing page by deployment mode
2. Demo experience
3. Integration explanation
4. Setup checklist
5. Contact / start onboarding CTA
6. Branded preview or sample snippet

Priority: `Medium-High`

---

## UI/UX direction

## Design principles AviaFrame should adopt

### 1. Premium B2B infrastructure, not generic startup SaaS

The visual identity should feel:

- reliable
- clean
- operationally serious
- modern but not flashy

### 2. Explain complexity without exposing complexity

Agencies should feel empowered, not buried in supplier/payment mechanics.

### 3. Trust before delight

In travel booking, confidence is more important than decorative motion.

### 4. Setup and operations should feel different

- setup = guided, narrow, step-based
- daily operations = fast, dense, efficient

---

## UX redesign priorities by surface

## A. Public website

What to improve:

- clearer split by product mode
- stronger proof and social credibility
- more concrete onboarding timeline
- better partner FAQs
- sharper pricing and packaging logic

Design direction:

- stronger value framing above the fold
- architecture visuals
- deployment mode cards
- founder-sales friction reduction

## B. Widget / public booking

What to improve:

- search quality
- offer readability
- passenger flow
- payment trust
- confirmation and post-booking clarity

Design direction:

- higher contrast hierarchy
- better spacing rhythm
- clearer status chips
- more informative cards
- consistent icon system

## C. Admin / portal

What to improve:

- information architecture
- onboarding wizard
- agency list discoverability
- widget/domain/payment setup clarity
- analytics usefulness

Design direction:

- left-nav modular app shell
- setup checklists
- status-based cards
- fewer overloaded screens

---

## Recommended future-state user journeys

## Journey 1: New agency without developers

1. Agency lands on AviaFrame site.
2. Chooses `Hosted White-Label`.
3. Books a sales/demo call or starts guided onboarding.
4. Agency record is created.
5. Branding and support contacts are configured.
6. Payment and domain are configured.
7. Agency previews hosted experience.
8. Agency goes live on branded domain.
9. Agency receives first live order.

## Journey 2: Agency with its own website

1. Agency lands on site.
2. Chooses `Embedded Widget`.
3. Reads integration page and sees real snippet.
4. Creates agency.
5. Adds allowed domains.
6. Receives widget key and snippet.
7. Developer embeds widget.
8. Agency validates preview and production.
9. Agency goes live.

## Journey 3: Enterprise partner

1. Partner lands on site.
2. Chooses `Enterprise/API`.
3. Sees architecture, controls, SLA story.
4. Starts commercial discussion.
5. AviaFrame provisions enterprise tenant/integration.
6. Partner launches with custom workflow.

---

## 90-day roadmap

## Phase 1 — Credibility and conversion foundations (Weeks 1-4)

Goal:

Remove the biggest blockers to trust and activation.

Priority work:

- fix passenger-flow mismatch for multi-passenger bookings
- redesign payment step for stronger trust and better failure states
- improve search/autocomplete quality and results readability
- stabilize agency creation, discovery, and basic admin workflows
- clarify deployment-mode messaging on public site

Expected outcome:

- higher confidence in demos
- fewer blockers during partner walkthroughs
- better product credibility with agencies and investors

## Phase 2 — Self-serve onboarding (Weeks 5-8)

Goal:

Reduce founder/operator involvement in activation.

Priority work:

- build agency onboarding wizard
- generate snippet and hosted setup outputs more clearly
- add go-live checklist
- add setup completion status
- split setup from daily operations in admin

Expected outcome:

- shorter time-to-live
- less manual onboarding effort
- more repeatable partner activation

## Phase 3 — Growth loops and expansion (Weeks 9-12)

Goal:

Turn the platform into a clearer SaaS with upsell paths.

Priority work:

- restructure pricing and packaging
- add analytics that agencies care about
- add better order/support operational views
- add usage milestones and nudges for expansion
- improve stakeholder-facing reporting

Expected outcome:

- stronger monetization narrative
- better retention and expansion logic
- clearer enterprise upsell path

---

## Prioritized backlog by impact

## P0

- Multi-passenger booking flow aligned with search input
- Agency onboarding wizard
- Stable agency creation/listing/admin retrieval
- Payment page trust redesign
- Deployment-mode positioning on public site

## P1

- Search UX improvements
- Offer and fare merchandising improvements
- Admin IA split into setup vs operations
- Go-live checklist and readiness states
- Better analytics for agencies

## P2

- Enterprise packaging
- deeper branded hosted templates
- expansion reporting
- lifecycle nudges and upsell prompts

---

## Metrics AviaFrame should run the product by

## Growth metrics

- visitor to demo conversion
- demo to onboarding start conversion
- onboarding start to agency created conversion
- agency created to first preview conversion
- preview to go-live conversion
- go-live to first booking conversion

## Product metrics

- search success rate
- offer selection rate
- passenger form completion rate
- payment success rate
- booking completion rate
- ticket delivery success rate

## Operational metrics

- median onboarding time
- median time to first live booking
- failed setup steps per agency
- support tickets per newly onboarded agency

## Commercial metrics

- active agencies
- live agencies
- bookings per live agency
- revenue per agency
- plan mix by deployment mode

---

## Concrete recommendations for the next work cycle

If only a limited amount of work can be done next, the best sequence is:

1. Fix the booking credibility path.
2. Rebuild onboarding as a guided workflow.
3. Repackage the product into clear deployment modes.
4. Split admin into clearer operational modules.

This sequence is strategically better than doing visual polish first because:

- it improves trust
- it improves conversion
- it reduces activation friction
- it creates a stronger commercial story

---

## Final recommendation

AviaFrame should evolve from:

> a technically capable booking widget and admin console

into:

> a structured B2B launch platform for agencies that want branded online flight sales without building airline infrastructure.

That shift is mostly a product packaging, onboarding, and trust-design problem.

The technology foundation is already pointing in the right direction. The next stage of growth depends on making the product easier to understand, easier to activate, and more credible at the most important moments in the booking flow.
