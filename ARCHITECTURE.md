# Aviaframe — Architecture Overview

**Version:** 1.0
**Date:** 2026-01-26
**Status:** MVP Documentation

---

## 🎯 What is Aviaframe?

Aviaframe is a **B2B SaaS platform** that enables travel agencies to embed flight search and booking capabilities into their websites via:
- A **multi-tenant backend API** that safely mediates DRCT API calls
- An **embeddable JavaScript widget** for customer-facing search/booking
- An **admin portal** for agency staff to manage bookings and settings

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        AVIAFRAME                            │
│                                                             │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Widget    │  │    Portal    │  │   Backend    │     │
│  │  (Browser)  │  │   (Web App)  │  │  (Node.js)   │     │
│  └─────────────┘  └──────────────┘  └──────────────┘     │
│         │                 │                   │            │
│         └─────────────────┴───────────────────┘            │
│                           │                                │
│                  ┌────────▼────────┐                       │
│                  │  DRCT Adapter   │                       │
│                  │  (Rate Limit,   │                       │
│                  │   Idempotency)  │                       │
│                  └────────┬────────┘                       │
└───────────────────────────┼─────────────────────────────────┘
                            │
                   ┌────────▼────────┐
                   │   DRCT API      │
                   │  (Flight Data)  │
                   └─────────────────┘
```

---

## �� Components

### 1. **Backend API** (`backend/`)
- **Tech Stack:** Node.js, Express
- **Responsibilities:**
  - Tenant management & authentication
  - DRCT API proxy with rate limiting
  - Idempotency handling for bookings
  - PII encryption & audit logging
  - Billing/metering

**Key Endpoints:**
- `POST /public/search` — Flight search
- `PATCH /public/offers/{id}/price` — Price confirmation
- `POST /public/orders` — Create booking (idempotent)
- `POST /public/orders/{id}/issue` — Issue tickets (idempotent)
- `DELETE /public/orders/{id}` — Cancel booking

### 2. **Portal** (`portal/`)
- **Tech Stack:** Node.js web app (SPA)
- **Users:** Platform Admins, Agency Admins, Agents
- **Features:**
  - Tenant onboarding
  - Widget configuration & embed snippet generation
  - Order management (search/book/issue/cancel)
  - Reporting & billing visibility
  - API key management

### 3. **Widget** (`widget/`)
- **Tech Stack:** Vanilla JavaScript (embeddable)
- **Integration:** `<script>` tag embed in agency sites
- **Features:**
  - Flight search UI
  - Offer listing & selection
  - Passenger data collection
  - Origin-restricted (security)

### 4. **Infrastructure** (`infra/`)
- **Placeholder for:** Terraform/CloudFormation IaC
- **Future:** CI/CD, monitoring, scaling config

---

## 🔒 Security Principles

1. **DRCT Token Isolation**
   - DRCT bearer tokens **NEVER** exposed to frontend
   - Stored in KMS/secrets manager, backend-only access

2. **Tenant Isolation**
   - Logical multi-tenancy (shared app, isolated data)
   - tenant_id scoping enforced at middleware level
   - Per-tenant rate limits & quotas

3. **PII Protection**
   - Field-level encryption (passport, payment refs)
   - Masked in all logs & metrics
   - GDPR-compliant data export/deletion

4. **Idempotency**
   - Required for order creation & ticket issuing
   - Prevents duplicate bookings on retries
   - 7-day TTL on idempotency records

5. **Rate Limiting**
   - DRCT has strict limits (e.g., offers_search ~1 rps)
   - Backend queues/coalesces requests
   - Per-tenant throttling

---

## 📊 Data Model (Logical)

**Core Entities:**
- `Tenant` — Agency/customer (1:N Users, Orders)
- `AgencyUser` — Portal account (Admin/Agent roles)
- `WidgetConfig` — Branding, origins, locale (1:1 Tenant)
- `OrderRecord` — Booking lifecycle (PENDING → BOOKED → ISSUED)
- `DRCTRequestLog` — Audit trail of all DRCT calls (sanitized)
- `AuditLog` — Immutable event log (compliance)
- `IdempotencyRecord` — Deduplication (7-day TTL)

**Tenant Context Resolution:**
- **Widget:** `widget_public_key` (public identifier)
- **Backend/Portal:** `api_key` or `bearer_token` (privileged)

---

## 🚀 MVP Scope

**In Scope:**
✅ Flight search via DRCT
✅ Price confirmation & fare rules
✅ Order creation (idempotent)
✅ Ticket issuing (idempotent)
✅ Order cancellation
✅ Tenant onboarding & widget embed
✅ PII encryption & audit logging
✅ Rate limiting & DRCT adapter

**Out of Scope (Post-MVP):**
❌ Online payments (handled externally in MVP)
❌ SSO/SAML/OIDC
❌ Automated refunds & exchanges
❌ White-label custom domains
❌ Multi-provider aggregation

---

## 📚 Documentation Structure

All documentation is in [`docs/`](docs/):

| File | Purpose |
|------|---------|
| [`01_BRD.md`](docs/01_BRD.md) | Business Requirements Document |
| [`02_PRD.md`](docs/02_PRD.md) | Product Requirements (user journeys) |
| [`03_SRS.md`](docs/03_SRS.md) | Software Requirements Specification |
| [`05_DATA_MODEL.md`](docs/05_DATA_MODEL.md) | Logical data model & entities |
| [`06_API_SPEC.md`](docs/06_API_SPEC.md) | Public API specification |
| [`08_SECURITY.md`](docs/08_SECURITY.md) | Security & compliance controls |
| [`DRCT_INTEGRATION.md`](docs/DRCT_INTEGRATION.md) | DRCT API integration guide |

---

## 🛠️ Development Workflow

```bash
# Install dependencies
npm ci

# Lint
npm run lint

# Test
npm test

# Build
npm run build

# Run local (Docker Compose)
npm start  # Starts backend:3000 + portal:8080
```

---

## 🔐 AI-Assisted Development Rules

See [`.github/copilot-instructions.md`](.github/copilot-instructions.md) for binding rules:

1. **Never expose DRCT tokens to frontend**
2. **All backend data access must be tenant-scoped**
3. **Mask PII in logs and responses**
4. **Use idempotency keys for order creation/issuing**
5. **Respect DRCT rate limits (offers_search = 1 rps)**
6. **Docs in /docs are the source of truth**

---

## 📞 Support & Contributing

- **Contributing:** See [`CONTRIBUTING.md`](CONTRIBUTING.md)
- **Issues:** GitHub Issues (TBD after repo creation)
- **License:** MIT (see [`LICENSE`](LICENSE))

---

## 🗺️ Roadmap

**Phase 1 (MVP):** ✅ Documentation complete
**Phase 2:** Backend scaffolding + DRCT sandbox integration
**Phase 3:** Portal UI + Widget prototype
**Phase 4:** Security audit + production deployment
**Phase 5:** v2 features (payments, SSO, white-label)

---

**Last Updated:** 2026-01-26
**Maintained By:** Sergiodan2013
