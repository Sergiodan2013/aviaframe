# Aviaframe Embeddable Widget

A lightweight, embeddable flight search widget for travel websites and partner platforms. For production partner onboarding, use the secure AviaFrame loader with a public agency widget key.

## Quick Start

### Step 1: Add the Container

```html
<div id="aviaframe-widget"></div>
```

### Step 2: Include the Script

```html
<script
  src="https://admin.aviaframe.com/embed.js"
  data-agency-key="YOUR_AGENCY_PUBLIC_WIDGET_KEY"
  data-target-id="aviaframe-widget"
  data-locale="en"
  data-theme="light"
  async
></script>
```

### Complete Example

```html
<!DOCTYPE html>
<html>
<head>
  <title>My Travel Website</title>
</head>
<body>
  <h1>Find Your Next Flight</h1>

  <div id="aviaframe-widget"></div>
  <script
    src="https://admin.aviaframe.com/embed.js"
    data-agency-key="YOUR_AGENCY_PUBLIC_WIDGET_KEY"
    data-target-id="aviaframe-widget"
    async
  ></script>
</body>
</html>
```

## Loader Attributes

| Attribute | Description | Required | Default |
|---|---|---|---|
| `data-agency-key` | Public agency widget key from AviaFrame admin | Yes | - |
| `data-target-id` | DOM node ID where the widget is mounted | No | `aviaframe-widget` |
| `data-theme` | Widget theme (`light` or `dark`) | No | `light` |
| `data-locale` | Initial interface locale | No | `en` |
| `data-backend-base` | Optional backend proxy override | No | `https://admin.aviaframe.com/api/backend` |

## Security Model

- `data-agency-key` is public by design.
- The real tenant scoping happens on the backend.
- Allowed website domains are enforced during widget session bootstrap.
- DRCT and provider credentials remain server-side.

## WordPress Example

```php
function add_aviaframe_widget() {
  echo '<div id="aviaframe-widget"></div>';
  echo '<script src="https://admin.aviaframe.com/embed.js" data-agency-key="' . esc_attr(get_option('aviaframe_widget_key')) . '" data-target-id="aviaframe-widget" async></script>';
}
add_shortcode('aviaframe', 'add_aviaframe_widget');
```

## React Example

```jsx
import { useEffect } from 'react';

function FlightSearch() {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://admin.aviaframe.com/embed.js';
    script.setAttribute('data-agency-key', 'YOUR_AGENCY_PUBLIC_WIDGET_KEY');
    script.setAttribute('data-target-id', 'aviaframe-widget');
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return <div id="aviaframe-widget" />;
}
```
