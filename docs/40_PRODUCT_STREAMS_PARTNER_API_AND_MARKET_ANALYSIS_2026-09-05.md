# AviaFrame product streams, Partner API, and market analysis

Date: 2026-09-05  
Status: working product strategy

## Recommended product architecture

AviaFrame should be packaged as one air-retailing platform with three distribution
surfaces, not as three unrelated businesses:

1. **AviaFrame White Label** — branded website/widget and agency portal for travel
   agencies (B2B2C).
2. **AviaFrame Connect API** — search, price, order, ticketing, and servicing APIs
   for OTAs, fintechs, loyalty products, and travel technology companies (B2B).
3. **AviaFrame Direct** — AviaFrame's own consumer storefront (B2C).

All three use the same supplier adapter, normalized offer/order model, pricing
engine, payment/settlement layer, servicing workflows, audit trail, and reporting.

```text
White Label ─┐
Connect API ─┼─> AviaFrame Commerce Core ─> DRCT / future suppliers
Direct B2C ──┘
```

The shared core is the leverage: a supplier or servicing improvement benefits all
three products. Pricing policies and customer ownership stay isolated by channel.

## Market evidence

### Duffel

Duffel packages flight distribution as a developer API with offer requests,
offers, orders, test/live tokens, dashboard onboarding, payments, managed content,
and a low-code Links product. It markets access across NDC, GDS, and LCC and allows
sellers to add markup.

Important gap: Duffel's own markup guide says sellers must build tools that decide
when and how markup applies; flight markup rules are not currently managed in its
agent dashboard. This validates a potential AviaFrame differentiator: built-in,
versioned commercial rules by counterparty, source, and carrier.

Sources:

- [Duffel Flights](https://duffel.com/flights)
- [Duffel Orders API](https://duffel.com/docs/api/orders)
- [Duffel dashboard and test/live tokens](https://duffel.com/docs/guides/getting-started-with-the-dashboard)
- [Duffel margin and markup guide](https://duffel.com/guides/understanding-margin-and-markups)
- [Duffel Links](https://duffel.com/links)

### Amadeus

Amadeus separates a quick-start Self-Service API offer for developers/start-ups
from an Enterprise catalog with account management and customized commercial
terms. Its documentation is API-first and uses OpenAPI, guides, SDKs, examples,
Postman collections, a changelog, test access, and production access.

This supports the recommended AviaFrame packaging: self-service sandbox and docs,
followed by controlled production activation and negotiated commercial terms.

Sources:

- [Amadeus API guides](https://developers.amadeus.com/self-service/apis-docs/guides/developer-guides/)
- [Amadeus API FAQ](https://admin.developers.amadeus.com/self-service/apis-docs/guides/developer-guides/faq/)

### Travelport

Travelport's current TripServices positioning is an end-to-end air workflow:
search, price, book, ticket, cancel, and exchange, with NDC and Low Cost content.
Its developer kits include OpenAPI schemas and Postman collections. Its support
material also makes source/carrier capability differences explicit.

The implication for AviaFrame is that a single normalized response is not enough:
the product also needs a capability registry and clear per-channel/per-carrier
support documentation.

Sources:

- [Travelport developer platform](https://developer.travelport.com/)
- [Travelport API references](https://support.travelport.com/webhelp/jsonapis/airv11/content/air11/APIReferences.htm)
- [Travelport developer kits](https://developer.travelport.com/resources/devkits-and-downloads)

### Mystifly

Mystifly is the closest strategic comparison. It combines multi-source NDC, LCC,
GDS, and consolidator content in one API; an optional agent UI; offer/order and
post-booking workflows; settlement; and a manager product for sourcing and pricing
rules. It explicitly targets OTAs, e-commerce, loyalty, travel technology, and
aggregators.

This confirms that the AviaFrame combination of White Label + API + Manager is a
recognized market category. AviaFrame must differentiate through region, speed of
onboarding, pricing usability, local payments, support, and transparent commercial
operations rather than claim the category is unique.

Sources:

- [Mystifly Smart Selling Platform](https://mystifly.com/)
- [Mystifly platform announcement](https://mystifly.com/press-releases/mystifly-unveils-technology-and-vision/)

### Kiwi.com / Tequila

Kiwi.com historically offered API, white label, widgets, links, and affiliate
tools together. In 2024 it moved new Tequila partnerships to invitation-only,
while continuing tools, reports, user/company management, API documentation, and
guides for selected partners.

This is a useful warning: open access creates support and commercial-quality costs.
AviaFrame should make sandbox onboarding easy but keep production activation,
credit, and ticketing permission controlled.

Source:

- [Kiwi.com partnership strategy](https://media.kiwi.com/articles-and-interviews/better-for-business-kiwi-com-takes-a-new-approach-to-partnerships/)

## Strategic assessment

The product is commercially interesting if positioned as **regional air-retailing
infrastructure**, not as a thin DRCT proxy.

Strong points:

- three sales surfaces reuse one commerce core;
- API clients do not need to integrate directly with DRCT;
- built-in counterparty pricing and margin control;
- potential GCC differentiation through Arabic/English UX, SAR settlement, local
  payment methods, and regional support;
- White Label can become the low-code entry product, while the API is the scale-up
  path for larger partners;
- B2C provides direct customer learning and a reference implementation of the API.

Main risks:

- dependency on one supplier and contractual resale restrictions;
- thin base-flight margins and expensive 24/7 post-booking servicing;
- price changes and uncertain upstream order states;
- credit, fraud, chargebacks, and merchant-of-record responsibility;
- channel conflict if AviaFrame Direct competes on price with White Label clients;
- B2C customer acquisition cost can distract from the B2B platform.

Mitigations:

- contractually confirm resale and permitted price presentation with DRCT;
- introduce a provider abstraction even while DRCT is the only supplier;
- keep B2C pricing and inventory strategy separate from partner contracts;
- use B2C initially as a reference storefront and controlled market channel;
- make post-booking capability and SLA part of each commercial package;
- activate production and ticketing only after integration and credit review.

## Commercial packaging

### White Label

- setup/onboarding fee;
- monthly platform fee;
- per booking or per issued ticket fee;
- optional hosted site, payments, support, and custom domain packages.

### Connect API

- sandbox free or approval-based;
- monthly minimum/platform commitment;
- per successful order or issued ticket fee;
- configurable fare/content markup;
- enterprise tiers for SLA, higher limits, dedicated support, reporting, and
  post-booking automation.

### Direct B2C

- markup/service fee;
- ancillary margin;
- payment fee policy;
- optional insurance and other attach products.

Do not rely on API call fees as the primary business model. Search traffic is high
and conversion is low; revenue should align mainly with successful commercial
outcomes while rate limits protect supplier cost.

## Documentation and domains

- Product marketing: `https://aviaframe.com/products/api`
- Developer documentation: `https://developers.aviaframe.com`
- Sandbox API: `https://sandbox-api.aviaframe.com/partner/v1`
- Production API: `https://api.aviaframe.com/partner/v1`
- Partner dashboard: `https://partners.aviaframe.com`
- Platform status: `https://status.aviaframe.com`

The developer portal should include Getting Started, authentication, sandbox,
search-to-order tutorials, API reference generated from OpenAPI, errors/retries,
idempotency, webhooks, capabilities, Postman collection, SDK examples, changelog,
deprecation notices, and support paths.

Only general documentation is public. Live credentials, usage, invoices, enabled
carriers, contract-specific pricing, and support tickets belong in the authenticated
partner dashboard.
