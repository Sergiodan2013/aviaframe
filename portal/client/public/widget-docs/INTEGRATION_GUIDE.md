# Aviaframe Widget - Partner Integration Guide

This is the canonical partner embed flow for AviaFrame.

## Quick Integration

### Step 1: Get your public widget key

The agency admin gets a public widget key from the AviaFrame admin portal after:
- adding allowed website domains
- saving widget settings
- opening the widget setup section

### Step 2: Paste the canonical snippet

```html
<div id="aviaframe-widget"></div>
<script
  src="https://admin.aviaframe.com/embed.js"
  data-agency-key="YOUR_AGENCY_PUBLIC_WIDGET_KEY"
  data-target-id="aviaframe-widget"
  data-locale="en"
  data-theme="light"
  async
></script>
```

### Step 3: Test

1. Open your website.
2. Confirm the widget loads only on your allowed domain.
3. Open the preview from the admin portal.
4. Verify session bootstrap, search, and booking behavior.

## How It Works

- `data-agency-key` is a public integration key stored in the agency record.
- `embed.js` creates a secure iframe-based widget container.
- The iframe initializes a short-lived widget session via `POST /api/backend/widget/session`.
- The backend validates the website origin against the agency allowlist before issuing a widget token.
- Supplier credentials remain server-side.

## Why this is the correct contract

- No raw supplier credentials in browser code
- Agency identity is explicit in the snippet
- Allowed origins are enforced server-side
- Branding and widget settings stay centrally managed in AviaFrame

## Notes

- `data-agency-key` is public by design.
- It is not a payment secret.
- It is not a DRCT credential.
- If the domain is not in the allowlist, widget session creation is rejected.

## Optional Attributes

| Attribute | Purpose |
|---|---|
| `data-target-id` | ID of the DOM node where the widget iframe will be mounted |
| `data-locale` | Initial locale, for example `en` |
| `data-theme` | Initial theme, for example `light` |
| `data-backend-base` | Optional override for non-default backend proxy setups |

## Platform Examples

### WordPress

```php
<div id="aviaframe-widget"></div>
<script
  src="https://admin.aviaframe.com/embed.js"
  data-agency-key="<?php echo esc_attr(get_option('aviaframe_widget_key')); ?>"
  data-target-id="aviaframe-widget"
  data-locale="en"
  async
></script>
```

### Wix / Webflow / Squarespace

```html
<div id="aviaframe-widget"></div>
<script
  src="https://admin.aviaframe.com/embed.js"
  data-agency-key="YOUR_AGENCY_PUBLIC_WIDGET_KEY"
  data-target-id="aviaframe-widget"
  async
></script>
```

### Shopify

```liquid
<div id="aviaframe-widget"></div>
<script
  src="https://admin.aviaframe.com/embed.js"
  data-agency-key="{{ settings.aviaframe_widget_key }}"
  data-target-id="aviaframe-widget"
  async
></script>
```

## Testing Your Integration

### 1. Visual Test

- Widget frame appears inside the target container
- No domain or widget-session error is shown
- The preview from admin and the live site behave the same way

### 2. Functional Test

- Bootstrap a widget session successfully
- Search for a route
- Confirm results are rendered
- Confirm booking flow starts as expected

### 3. Mobile Test

- The widget should stay responsive inside its container
- Tappable controls should be usable without clipping

## Common Issues & Solutions

### Issue: Widget not appearing

Check:
- `data-agency-key` is present
- the website domain is added to the agency allowlist
- the script source is `https://admin.aviaframe.com/embed.js`
- the target container exists

```html
<div id="aviaframe-widget"></div>
<script
  src="https://admin.aviaframe.com/embed.js"
  data-agency-key="YOUR_AGENCY_PUBLIC_WIDGET_KEY"
  data-target-id="aviaframe-widget"
></script>
```

### Issue: Widget session fails

- Confirm the website hostname is present in widget allowed domains
- Confirm the agency is active
- Confirm the public widget key belongs to the correct agency

### Issue: Need a more detailed setup walkthrough

Use:
- the admin portal `Preview` action
- [https://aviaframe.com/partner-integration.html](https://aviaframe.com/partner-integration.html)
- [https://aviaframe.com/widget-demo.html](https://aviaframe.com/widget-demo.html)
