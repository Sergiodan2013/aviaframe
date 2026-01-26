# Aviaframe — Business Requirements Document (BRD)

Version: 1.1  
Date: 2026-01-26  
Author: Product / Sergiodan2013

## Executive summary

What Aviaframe is  
Aviaframe is a B2B SaaS platform that provides a tenant-scoped backend API and an embeddable JavaScript widget to deliver flight search, pricing, booking and ticket issuing by integrating with the DRCT supplier API. Aviaframe mediates DRCT interactions so travel agencies and consolidators can embed a compliant, localized flight search and booking experience into their websites or portals without implementing and maintaining direct DRCT integrations.

Who it is for  
Primary customers are travel agencies, consolidators, and small-to-medium OTAs who need a fast, reliable path to online flight retailing in the Middle East. Secondary customers include technology integrators and partners who want a white-label or embeddable solution to offer to their agency customers.

Business value  
- Time-to-market reduction: Agencies gain production-grade flight retail capabilities via an embed snippet and tenant-scoped API rather than building and certifying a full DRCT integration.  
- Risk and compliance containment: Aviaframe centralizes DRCT credential management and enforces security and idempotency patterns (no DRCT credentials on frontend, logged and auditable DRCT interactions).  
- New revenue streams: Recurring subscription revenue plus usage-based fees (per-booking or per-search over quota) and premium enterprise services (custom domain, SLA, consulting).  
- Operational leverage: Platform approach allows us to aggregate demand, optimize DRCT usage (caching, request coalescing within contract limits), and provide analytics and value-added services to agencies.

---

## Business goals

1. Monetization via subscriptions
   - Offer monthly and yearly subscription tiers (Starter, Growth, Enterprise) with predictable recurring revenue.
   - Combine subscription with transaction fees: a per-booking commission (percentage or fixed fee) or overage charges for searches beyond included quotas.
   - Drive annual contracts for Enterprise customers with higher SLAs and customization fees.

2. White‑label widget adoption
   - Provide a configurable, brandable embeddable widget that agencies can drop into their sites with minimal engineering effort (copy/paste snippet).
   - Aim for a significant share of new agency sign-ups to adopt the white-label option as a differentiator.

3. Reduce time‑to‑market for agencies
   - Deliver an out-of-the-box integration path that reduces average integration time from weeks/months to days.
   - Provide developer tooling, SDKs and example integrations to further shorten onboarding.

4. Platform stickiness and expansion
   - Enable upsell paths: payment integration, advanced pricing & markups, reporting and analytics, priority support.
   - Increase lifetime value (LTV) by building features that are hard for agencies to replicate internally (tenant management, audit, DRCT handling).

---

## Stakeholders

- Platform Owner (Aviaframe)
  - Product, Engineering, Sales, Support, Legal, and Ops teams responsible for platform development, commercial agreements (with DRCT and agencies), SLAs, and compliance.

- Travel Agency (Client)
  - Agency Admins and Agents who will configure the widget, perform searches and bookings, and own payments and customer relationships.

- End Customer of Agency (Indirect user)
  - The traveller interacting with the widget on the agency website; they do not have direct accounts in Aviaframe — their relationship is with the agency.

- Investors / Strategic Partners
  - Investors evaluating business viability, growth metrics and risk profile, including dependence on DRCT.

---

## User roles

- Platform Admin
  - Full control over the multi-tenant platform. Responsibilities include tenant provisioning, subscription management, global configuration, and platform-level audit/incident handling.

- Agency Admin
  - Tenant-scoped administration: manage agency users, widget configuration (branding, allowed origins), subscription settings, and billing metadata.

- Agency Agent
  - Day-to-day operator: perform searches, price offers, create orders, trigger ticket issuance and manage cancellations within the agency tenant.

Important: End customers (travellers) do NOT access Aviaframe directly — they interact with the agency’s site or app and the embedded widget. All agency-facing user accounts and API keys are tenant-scoped.

---

## In-scope / Out-of-scope

In-scope (MVP)
- Proxying and mediating DRCT endpoints for:
  - Flight search (offers_search) and normalized offer list.
  - Price confirmation and fare rule retrieval.
  - Order creation (booking) with idempotency safeguards.
  - Ticket issuing (issue) and cancellation flows (as supported by DRCT).
- Embeddable, tenant-configurable JavaScript widget for search and booking UI.
- Tenant-based access control, audit logging and basic billing metering (search and booking counts).
- Developer documentation, sandbox environment and CI for tests and deployments.

Out-of-scope (MVP)
- Direct end-customer payment processing (initially payments are handled by the agency or external payment provider).
- Full refund automation and reconciliation workflows (partial manual processes acceptable in MVP).
- Advanced enterprise integrations (SSO, custom domains) — planned for v2.
- Multi-provider fare shopping beyond DRCT in MVP (possible extension later).

---

## Business constraints

- DRCT rate limits and contract terms
  - DRCT imposes per-account and per-endpoint rate limits (for example, offers_search will have strict RPS limits). Aviaframe must implement per-tenant throttling, queuing and aggregation to avoid violations.
  - Commercial terms with DRCT (quotas, costs, resale permissions, and liability limits) will constrain pricing, usage, and how we can expose fares.

- Commercial and legal constraints
  - Resale and distribution rules differ by market and airline; Aviaframe must enforce any contractual restrictions from DRCT and participating carriers.
  - Agency legal agreements (BSP/ARC or local equivalents) and tax/VAT rules in the Middle East may affect pricing and settlement.

- Geography focus
  - Initial go-to-market: Middle East — specifically Saudi Arabia and UAE (GCC), with expansion to Levant and North Africa later.
  - Local regulations: some countries may require data residency or impose specific consumer protection rules; these must be accommodated where required.

- Operational constraints
  - Platform uptime commitments (99.5% target for public APIs in default tier).
  - Capacity planning must account for aggregated DRCT throughput limits — we cannot scale DRCT calls infinitely.

---

## Assumptions

- Agencies already hold or will obtain any airline/BSP agreements required for settlement and are able to accept payments independently (Aviaframe does not process payments in the MVP).
- DRCT provides a sandbox environment suitable for QA and automated tests, and production credentials are available via contract.
- Most agencies will prefer a simple embed approach; only a minority will require heavy back-end customization at initial launch.
- Initial bookings volume per agency is moderate; extreme high-volume customers will be supported via enterprise contracts and custom DRCT arrangements.
- Regulatory and tax treatment will not require immediate local data residency for all target countries at MVP launch; if required, we will scope regionally compliant deployments later.

---

## Success metrics (KPIs)

Primary KPIs (investor-facing)
- Number of active agencies (MAA - Monthly Active Agencies)
  - Target: 50 active agencies within first 12 months post-MVP (example milestone).
- Monthly Recurring Revenue (MRR)
  - Track subscriptions + transaction fees; target break-even runway by X months (business plan dependent).

Product & adoption KPIs
- Time-to-onboard
  - Median time from signup to first live booking ≤ 7 days (target).
- Widget adoption rate
  - % of onboarded agencies that embed the widget within 14 days; target ≥ 60%.

Conversion & revenue KPIs
- Search → Booking conversion rate
  - Target: 0.5%–1.5% (industry benchmark varies) and improvement over time with UX/pricing optimizations.
- Bookings per agency per month
  - Track distribution and use for tier upgrades and commercial conversations.

Operational KPIs
- API uptime
  - 99.5% availability for public APIs (monthly) for standard customers; enterprise tier SLA negotiable.
- Error & rate-limit incidents
  - Number of DRCT rate-limit violations (target: zero sustained violations).
- Latency
  - 95th percentile time for search responses (Aviaframe API) < 1.5s where feasible, excluding external provider latency.

Security & compliance KPIs
- PII incidents
  - Zero incidents of unmasked PII in logs or public exposure.
- Audit coverage
  - 100% of order state transitions recorded in immutable AuditLog.

---

## Go-to-market & high level financials (summary)

- Sales channels: direct sales to mid/large agencies, partnerships with consolidators, and self-serve signups for small agencies.
- Pricing approach:
  - Starter: low monthly fee + per-booking fee.
  - Growth: higher monthly, larger included quota, lower per-booking fee.
  - Enterprise: custom pricing with higher SLA and integration support.
- Key commercial risks:
  - DRCT contract terms and costs — may compress margins.
  - Customer acquisition cost (CAC) in the region and channel mix.

---

## Next steps / recommendations

1. Finalize DRCT commercial terms and confirm rate limits and allowed caching strategies; incorporate contractual constraints into product specs and pricing.  
2. Build the MVP with tenant isolation, idempotency for order flows, and widget that requires only tenant-scoped credentials from the backend.  
3. Launch a pilot program with 3–5 agencies in the UAE/Saudi markets to validate onboarding, conversions and operational load assumptions.  
4. Implement billing metering and billing dashboard to capture usage for invoicing and to validate the pricing model.  
5. Prepare runbooks and monitoring for DRCT rate-limit events and credential rotation.

---

This document is intended to align product, engineering, sales and investors on the initial scope, constraints and success measures for Aviaframe. For technical details and API contracts see docs/03_SRS.md and docs/06_API_SPEC.md. For DRCT-specific integration guidance see docs/DRCT_INTEGRATION.md.