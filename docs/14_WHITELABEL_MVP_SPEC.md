# AviaFrame — Whitelabel MVP Implementation Specification

Version: 1.0
Date: 2026-02-25
Status: MVP spec — ready for implementation

---

## What Whitelabel Means for AviaFrame

An agency's end users (travelers) interact with a flight booking experience that looks and feels like the agency's own product. AviaFrame is entirely invisible:

- Widget uses agency logo, colors, and font.
- Widget loads from agency's own domain (e.g., `widget.myagency.com`).
- All emails come from agency's sender (e.g., `tickets@myagency.com`).
- PDF itineraries carry agency branding.
- "Powered by AviaFrame" hidden (Enterprise always, Growth optionally).
- No AviaFrame branding in any customer-facing surface.

---

## Whitelabel Components

| Component | What agency controls | Where configured |
|---|---|---|
| Widget branding | Logo, colors, font, RTL, currency, locale | Agency Admin → Widget Builder |
| Widget domain | Custom domain with SSL | Agency Admin → Widget Builder → Domain |
| Widget embed | Origin allowlist, embed snippet | Agency Admin → Widget Builder → Domains |
| Email sender identity | Sender name, reply-to, custom domain (DKIM/SPF) | Agency Admin → Email Settings |
| Email branding | Logo, colors, footer (shared with widget) | Agency Admin → Widget Builder |
| PDF itinerary | Agency logo, colors, support contact | Inherited from Widget Builder |
| "Powered by" text | Hidden / custom text | Agency Admin → Widget Builder → Whitelabel |

---

## Subscription Tier Gating

| Whitelabel Feature | Starter | Growth | Enterprise |
|---|---|---|---|
| Logo + colors + font | Yes | Yes | Yes |
| Hide "Powered by AviaFrame" | No | Optional ($) | Always |
| Custom widget domain | No | No | Yes |
| Custom email sender domain | No | Yes | Yes |
| Agency email sender name | Yes | Yes | Yes |
| Google Fonts custom URL | No | No | Yes |
| Custom CSS injection | No | No | Yes |
| Email template override | No | No | Yes |

---

## Custom Domain — Technical Implementation

### User-facing flow
1. Agency admin enters custom domain: `widget.myagency.com`.
2. Portal displays CNAME record: `widget.myagency.com → widgets.aviaframe.com`.
3. Agency DNS admin adds record.
4. Portal polls DNS verification (backend check every 30s for up to 24h).
5. SSL certificate auto-provisioned via Let's Encrypt (Netlify handles this).
6. Status displayed: Pending → Verifying → Active / Failed.
7. Once active: widget script served from `widget.myagency.com/v1/widget.js`.

### Backend: tenant resolution by hostname

```js
// Middleware: resolve tenant from hostname or query param
async function resolveTenant(req, res, next) {
  const hostname = req.hostname;              // widget.myagency.com
  const tenantParam = req.query.tenant;       // AGENCY_CODE fallback

  const agency = tenantParam
    ? await db.agencies.findByCode(tenantParam)
    : await db.agencies.findByCustomDomain(hostname);

  if (!agency) return res.status(404).json({ error: 'tenant_not_found' });
  req.agency = agency;
  next();
}
```

### Netlify configuration

Wildcard domain `*.aviaframe.com` + custom domains per agency both point to the same Netlify deployment. Netlify automatically handles SSL for custom domains added via its API or dashboard.

---

## Email Custom Domain — Technical Implementation

### User-facing flow (Agency Admin → Email Settings)
1. Agency admin enters sender domain: `myagency.com`.
2. Portal shows 3 DNS records to add:
   - **SPF** TXT record on `myagency.com`.
   - **DKIM** TXT record (key provided by Resend) on `resend._domainkey.myagency.com`.
   - **DMARC** TXT record on `_dmarc.myagency.com` (recommended).
3. Agency DNS admin adds records.
4. Portal shows verification status (Resend verifies automatically).
5. Once verified: emails sent from `[senderName] <tickets@myagency.com>`.

### Resend domain management
```js
// Register domain with Resend
await resend.domains.create({ name: 'myagency.com' });

// Check verification status
const domain = await resend.domains.get(domainId);
// domain.status: 'not_started' | 'pending' | 'verified' | 'failed'
```

---

## WidgetConfig — Single Source of Truth for Branding

`WidgetConfig` (stored in `agency_settings`) is the canonical branding record. It is consumed by:
1. **Widget** — CSS custom properties applied at load time.
2. **Email service** — logo, colors, sender info injected into every email template.
3. **PDF service** — logo, colors, agency contact for itinerary documents.

Agency admin sets branding once in Widget Builder → applies everywhere.

---

## Best Practices Implemented for Whitelabel SaaS

### Security
- 2FA mandatory for `super_admin` and `agency_admin`.
- API keys per agency for server-to-server integration (generate/rotate/revoke).
- Rate limiting per tenant — one agency cannot impact others.
- Origin allowlist validated on every widget load.
- Custom domain ownership verified before activation.
- Email domain verified (DKIM/SPF) before enabling custom sender.
- PII masked in all logs.
- DRCT credentials exclusively in backend/n8n environment variables — never in frontend.

### Tenant Isolation
- Supabase RLS on all tenant tables.
- Middleware RBAC as first defense layer.
- Default deny when agency scope cannot be resolved.
- Logo uploads path-scoped by tenant code in Supabase Storage.
- WidgetConfig CDN cache keyed by tenant — no cross-tenant data leakage.

### Reliability
- Email send failures do not block booking flow.
- PDF generation failures logged and retried async — email sent without attachment with fallback message.
- Dead letter queue for failed DRCT operations.
- Retry with exponential backoff for email and DRCT calls.
- Correlation ID (`X-Correlation-ID`) across UI → backend → n8n → DRCT → email.

### Operational
- Feature flags per agency — enable/disable features per tenant without deploy.
- Webhook system — agencies receive HTTP callbacks for order events (order.booked, order.issued, order.cancelled).
- Soft delete everywhere (agencies, members, referers, API keys).
- Audit trail for all admin mutations.
- Immutable `email_send_log` for debugging delivery issues.

### GDPR / Compliance
- Data export per agency (all orders, passengers, events).
- Right to erasure — PII deletion on request while preserving anonymized audit records.
- PII fields (passenger names, passport numbers, phone) encrypted at rest in Supabase.

---

## New Backend Services Required

### emailService.js
Single entry point for all email sends. Resolves branding, compiles template, attaches PDF if needed, sends via Resend.

### pdfService.js
Generates branded PDF itinerary using `@react-pdf/renderer`. Called by emailService on ticket-issued event.

### brandingResolver.js
Fetches and caches WidgetConfig per agency. Used by emailService and pdfService.

### webhookService.js
Sends HTTP POST callbacks to agency-configured webhook URLs on order events. Includes HMAC signature for payload verification.

### apiKeyService.js
Manages agency API keys: generate (bcrypt hash stored), validate, rotate, revoke. API keys allow server-to-server calls without JWT.

### rateLimitMiddleware.js
Per-tenant rate limiting using sliding window. Enforces plan quotas for searches and bookings. Returns 429 with `Retry-After` header.

### featureFlagService.js
Checks agency plan + feature flags table. Returns boolean for each feature. Used by route handlers to gate functionality.

---

## New Database Tables Required

```sql
-- Email send log (append-only)
CREATE TABLE email_send_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_code text NOT NULL,
  template_type text NOT NULL,
  recipient_email text NOT NULL,
  status text NOT NULL,      -- 'sent' | 'failed' | 'retrying'
  error_message text,
  resend_message_id text,
  correlation_id text,
  created_at timestamptz DEFAULT now()
);

-- Agency API keys
CREATE TABLE agency_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_code text NOT NULL REFERENCES agencies(code),
  key_hash text NOT NULL,    -- bcrypt hash, never store plaintext
  key_prefix text NOT NULL,  -- e.g., "af_live_xxxx" for display
  name text,                 -- e.g., "Production key"
  last_used_at timestamptz,
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES user_profiles(id),
  created_at timestamptz DEFAULT now()
);

-- Webhooks per agency
CREATE TABLE agency_webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_code text NOT NULL REFERENCES agencies(code),
  url text NOT NULL,
  events text[] NOT NULL,    -- ['order.booked', 'order.issued', 'order.cancelled']
  secret text NOT NULL,      -- HMAC signing secret
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Feature flags per agency
CREATE TABLE agency_feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_code text NOT NULL REFERENCES agencies(code),
  flag_key text NOT NULL,
  flag_value boolean NOT NULL DEFAULT false,
  updated_by uuid REFERENCES user_profiles(id),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(agency_code, flag_key)
);

-- Custom domain tracking
CREATE TABLE agency_custom_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_code text NOT NULL REFERENCES agencies(code),
  domain text NOT NULL UNIQUE,
  domain_type text NOT NULL, -- 'widget' | 'email'
  status text NOT NULL DEFAULT 'pending', -- 'pending' | 'verifying' | 'active' | 'failed'
  resend_domain_id text,     -- for email domains
  verified_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Workflow failures (dead letter queue)
CREATE TABLE workflow_failures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_code text,
  correlation_id text,
  workflow_name text NOT NULL,
  payload jsonb,
  error_message text,
  retry_count int DEFAULT 0,
  status text DEFAULT 'pending', -- 'pending' | 'retrying' | 'resolved' | 'abandoned'
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);
```

---

## Implementation Phases

### Phase 1 — Foundation (Whitelabel Backend)
- WidgetConfig CRUD API endpoints.
- Custom domain: verification flow, SSL provisioning.
- brandingResolver.js service.
- emailService.js + all templates.
- pdfService.js + itinerary template.
- Resend integration + custom sender domain flow.
- New DB tables (migration).

### Phase 2 — Agency Admin Console UI
- Widget Builder: branding panel + live preview.
- Domain manager: allowlist + custom domain setup.
- Email Settings panel + email preview.
- Embed snippet generator.
- All UI in English.

### Phase 3 — Super Admin Console UI
- Agency CRUD with subscription tier.
- Member management.
- Platform analytics dashboard.
- Audit log viewer.
- Email template management.
- Integration health dashboard.
- All UI in English.

### Phase 4 — Security & Reliability
- 2FA for super_admin and agency_admin.
- API key management.
- Rate limiting per tenant.
- Webhook system.
- Feature flags.
- Correlation ID middleware.
- GDPR: data export, PII masking audit.

### Phase 5 — QA & Hardening
- Integration tests: RBAC, RLS, tenant isolation.
- Smoke test suite: full booking flow, email delivery, PDF generation.
- CI quality gates: lint, test, build, migration check.
- Pre-deploy checklist.
- Production runbook.

---

## References

- [docs/12_EMAIL_SERVICE_SPEC.md](12_EMAIL_SERVICE_SPEC.md) — Email service
- [docs/13_WIDGET_CUSTOMIZATION_SPEC.md](13_WIDGET_CUSTOMIZATION_SPEC.md) — Widget customization
- [docs/09_SUPER_ADMIN_MVP.md](09_SUPER_ADMIN_MVP.md) — Admin consoles
- [docs/02_PRD.md](02_PRD.md) — Product requirements
- [docs/05_DATA_MODEL.md](05_DATA_MODEL.md) — Data model
- [docs/08_SECURITY.md](08_SECURITY.md) — Security requirements
