# AviaFrame — Widget Customization Specification

Version: 1.0
Date: 2026-02-25
Status: MVP spec — ready for implementation

---

## Overview

The AviaFrame widget is a whitelabel embeddable flight search and booking component. Each agency tenant configures it with their own brand identity. From the traveler's perspective, there is no AviaFrame branding — only the agency's brand is visible.

Configuration is managed by the agency admin through the **Widget Builder** in the Agency Admin Console. Changes are applied in real time without any widget rebuild.

---

## How It Works Technically

```
Agency admin sets branding in portal
  → saved to WidgetConfig table in Supabase
    → widget loads: GET /public/widget-config?tenant=AGENCY_CODE
      → backend returns WidgetConfig JSON
        → widget injects CSS custom properties
          → full branding applied at runtime
```

No rebuild required. One widget bundle serves all tenants.

### CSS Custom Properties approach

```css
/* Injected at widget init from WidgetConfig */
:root {
  --af-primary: #1a56db;
  --af-accent: #e8f0ff;
  --af-bg: #ffffff;
  --af-text: #1a1a2e;
  --af-radius: 8px;
  --af-font: 'Inter', sans-serif;
  --af-font-size-base: 16px;
}
```

All widget components reference these variables — changing the WidgetConfig changes the entire widget appearance instantly.

---

## Embed Snippet

Agency admin copies this from the portal:

```html
<script
  src="https://widget.aviaframe.com/v1/widget.js"
  data-tenant="AGENCY_CODE"
  data-locale="en"
  async>
</script>
<div id="aviaframe-widget"></div>
```

For custom domain setup (`widget.myagency.com`):

```html
<script
  src="https://widget.myagency.com/v1/widget.js"
  data-tenant="AGENCY_CODE"
  async>
</script>
<div id="aviaframe-widget"></div>
```

The widget validates that the loading origin is in the agency's `allowed_origins` list. If not — widget renders nothing and logs a warning.

---

## Widget Builder — Full Configuration Reference

### Branding

| Setting | Type | Description | Default |
|---|---|---|---|
| Logo | File upload (PNG/SVG, max 200kb) | Shown in widget header, emails, PDF | None |
| Primary color | Color picker (HEX/HSL) | Buttons, links, selected states, header bg | `#1a56db` |
| Accent color | Color picker | Hover states, highlights, tag backgrounds | `#e8f0ff` |
| Background color | Color picker | Widget main background | `#ffffff` |
| Text color | Color picker | Body text, labels | `#1a1a2e` |
| Button border radius | Slider 0–24px | 0 = sharp rectangles, 24 = pill buttons | `8px` |
| Theme | Toggle | Light / Dark / Auto (system preference) | Light |

### Typography

| Setting | Type | Description | Options |
|---|---|---|---|
| Font family | Selector | Applied to all widget text | Inter, Roboto, Cairo (Arabic), Noto Sans Arabic, Open Sans |
| Google Fonts URL | Text input (Enterprise) | Custom font URL | Any valid Google Fonts URL |
| Base font size | Selector | Global text size scale | 14px / 16px / 18px |

### Localization

| Setting | Type | Description |
|---|---|---|
| Language | Selector | English (LTR) / Arabic (RTL automatic) |
| Currency | Selector | AED / SAR / USD / EUR / EGP / KWD / QAR / BHD / OMR |
| Date format | Selector | DD/MM/YYYY or MM/DD/YYYY |
| Timezone | Selector | Dropdown — used for time display |

RTL is applied automatically when Arabic is selected — layout mirrors, text aligns right, icons flip.

### Functionality Toggles

| Setting | Type | Default | Plan gate |
|---|---|---|---|
| Multi-city search | Toggle | Off | Growth+ |
| Cabin class selector | Toggle | On | All |
| Direct flights only (default) | Toggle | Off | All |
| Default max stops | Selector (0 / 1 / any) | Any | All |
| Max passengers per booking | Number input | 9 | All |
| Default departure airport | IATA code input | None | All |
| Show price breakdown | Toggle | On | All |

### Whitelabel Content

| Setting | Type | Description |
|---|---|---|
| Hide "Powered by AviaFrame" | Toggle | On by default for Enterprise; optional for Growth |
| Custom footer text | Text | Small text at widget bottom |
| Terms & Conditions URL | URL | Linked from widget footer |
| Privacy Policy URL | URL | Linked from widget footer |
| Support email | Email | Shown in widget error states |
| Support phone | Phone | Shown in widget error states |

---

## Domain & Origin Management

### Allowed Origins (embed security)

Agency admin manages the list of domains where the widget is allowed to load.

**UI flow:**
1. Click "Add Domain".
2. Enter domain (e.g., `myagency.com`, `booking.myagency.com`).
3. Click "Add" — domain appears in pending list.
4. Click "Save Changes" — domains saved to database.
5. Status feedback: saving → saved / error with reason.
6. Remove button per domain with confirmation.

Rules:
- `myagency.com` also matches `www.myagency.com`.
- Subdomains must be listed separately if needed.
- `localhost` allowed for development testing.

### Custom Domain for Widget

Allows agency to serve the widget from their own domain (`widget.myagency.com`).

**Setup flow:**
1. Agency admin enters custom domain in portal.
2. Portal shows CNAME record to add: `widget.myagency.com → widgets.aviaframe.com`.
3. Agency DNS admin adds the record.
4. Portal shows DNS propagation status (checks via backend).
5. SSL certificate automatically provisioned (Let's Encrypt via Netlify).
6. Once active: widget loads from `widget.myagency.com/v1/widget.js`.

---

## Widget Builder UI — Live Preview

The Widget Builder has a live preview panel on the right side. As the agency admin changes any setting:
- Preview updates in real time (debounced 300ms).
- Preview shows the search form in its configured state.
- Preview is scrollable to show results and booking screens.
- "Preview on your site" button opens a test page with the configured widget in a sandboxed iframe.

---

## WidgetConfig Data Model

Stored in Supabase `agency_settings` table per agency:

```json
{
  "config_id": "uuid",
  "agency_code": "MYAGENCY",
  "branding": {
    "logo_url": "https://cdn.aviaframe.com/logos/myagency.png",
    "primary_color": "#1a56db",
    "accent_color": "#e8f0ff",
    "bg_color": "#ffffff",
    "text_color": "#1a1a2e",
    "button_radius": 8,
    "theme": "light"
  },
  "typography": {
    "font_family": "Inter",
    "font_url": null,
    "font_size_base": 16
  },
  "locale": {
    "language": "en",
    "currency": "AED",
    "date_format": "DD/MM/YYYY",
    "timezone": "Asia/Dubai"
  },
  "features": {
    "multi_city": false,
    "cabin_class_selector": true,
    "direct_only_default": false,
    "max_stops_default": "any",
    "max_passengers": 9,
    "default_origin": null,
    "show_price_breakdown": true
  },
  "whitelabel": {
    "hide_powered_by": true,
    "footer_text": "Book with confidence",
    "terms_url": "https://myagency.com/terms",
    "privacy_url": "https://myagency.com/privacy",
    "support_email": "support@myagency.com",
    "support_phone": "+971 4 XXX XXXX"
  },
  "allowed_origins": ["myagency.com", "booking.myagency.com"],
  "custom_domain": "widget.myagency.com",
  "custom_domain_status": "active",
  "updated_at": "2026-02-25T10:00:00Z"
}
```

---

## API Endpoints

### Public (called by widget on load, no auth)
```
GET /public/widget-config?tenant=AGENCY_CODE
```
Returns sanitized WidgetConfig (no sensitive data). Cached at CDN edge (5 min TTL).

### Private (called by Agency Admin portal)
```
GET  /api/agencies/:code/widget-config
PUT  /api/agencies/:code/widget-config
POST /api/agencies/:code/widget-config/preview-test
POST /api/agencies/:code/custom-domain/verify
```

---

## Shared Branding with Email Service

`branding.logo_url`, `branding.primary_color`, `branding.accent_color`, `whitelabel.support_email`, and `whitelabel.support_phone` are also used by the email service to brand all transactional emails.

Agency admin sets them once in Widget Builder — they apply to both the widget and all emails automatically.

See [docs/12_EMAIL_SERVICE_SPEC.md](12_EMAIL_SERVICE_SPEC.md).

---

## Plan-Gated Features

| Feature | Starter | Growth | Enterprise |
|---|---|---|---|
| Logo + colors + font | Yes | Yes | Yes |
| Hide "Powered by AviaFrame" | No | Optional | Always |
| Custom domain | No | No | Yes |
| Google Fonts custom URL | No | No | Yes |
| Multi-city search | No | Yes | Yes |
| Custom CSS injection | No | No | Yes |
| JS event hooks/callbacks | No | No | Yes |
| Email template override | No | No | Yes |

---

## Security Notes

- `allowed_origins` validated on every widget load request — origin not in list → widget returns empty (no error shown to end user, just no render).
- WidgetConfig served from CDN does not include DRCT credentials, API keys, or any sensitive agency data.
- Logo uploads stored in Supabase Storage with public CDN URL — agency cannot overwrite other agency logos (path scoped by tenant code).
- Custom domain verification checked before activating to prevent domain squatting.

---

## References

- [docs/12_EMAIL_SERVICE_SPEC.md](12_EMAIL_SERVICE_SPEC.md) — Email branding shares WidgetConfig
- [docs/14_WHITELABEL_MVP_SPEC.md](14_WHITELABEL_MVP_SPEC.md) — Full whitelabel implementation plan
- [docs/02_PRD.md](02_PRD.md) — Product requirements
- [docs/05_DATA_MODEL.md](05_DATA_MODEL.md) — Data model (WidgetConfig entity)
