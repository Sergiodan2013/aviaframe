# Aviaframe Embeddable Widget

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/aviaframe/widget)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

A lightweight, embeddable flight search widget for travel websites and partner platforms. Built with vanilla JavaScript - no dependencies required.

## ✨ Features

- 🚀 **Zero Dependencies** - Pure JavaScript, no frameworks needed
- 📦 **Tiny Bundle Size** - Under 30KB minified
- 🎨 **Beautiful UI** - Modern, responsive design that works everywhere
- 🌍 **Multilingual** - Search airports in English or Russian
- ⚡ **Fast** - Instant autocomplete with 50+ major airports
- 🔧 **Easy Integration** - Just 2 lines of code

## 📦 Quick Start

### Step 1: Add the Container

Add this `<div>` where you want the widget to appear:

```html
<div id="aviaframe-widget" data-api-url="https://your-api.com/webhook/drct/search"></div>
```

### Step 2: Include the Script

Add the widget script before closing `</body>` tag:

```html
<script src="https://cdn.aviaframe.com/widget/aviaframe-widget.js"></script>
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

  <!-- Aviaframe Widget -->
  <div id="aviaframe-widget" data-api-url="https://your-api.com/webhook/drct/search"></div>
  <script src="https://cdn.aviaframe.com/widget/aviaframe-widget.js"></script>

</body>
</html>
```

That's it! 🎉

## ⚙️ Configuration

Configure the widget using `data-*` attributes:

| Attribute | Description | Required | Default |
|-----------|-------------|----------|---------|
| `data-api-url` | Your flight search API endpoint | ✅ Yes | - |
| `data-theme` | Widget theme (`light` or `dark`) | ❌ No | `light` |
| `data-language` | Interface language (`en` or `ru`) | ❌ No | `en` |

### Example with All Options

```html
<div
  id="aviaframe-widget"
  data-api-url="https://api.example.com/search"
  data-theme="dark"
  data-language="ru"
></div>
```

## 🔌 API Requirements

Your API endpoint should accept POST requests with this JSON format:

```json
{
  "origin": "CDG",
  "destination": "LHR",
  "depart_date": "2026-03-15",
  "return_date": "2026-03-22",
  "adults": 2,
  "children": 0,
  "infants": 0,
  "cabin_class": "economy"
}
```

And return this response format:

```json
{
  "search_id": "abc123",
  "offers": [
    {
      "offer_id": "LH_123",
      "price": {
        "total": 8384,
        "currency": "UAH"
      },
      "airline": "LH",
      "airline_name": "Lufthansa",
      "departure_time": "06:25",
      "arrival_time": "11:10",
      "origin": "CDG",
      "destination": "FRA"
    }
  ]
}
```

**Important:** The widget automatically displays airline logos from `https://pics.avs.io/al_base/64/64/{airline}.png` using the `airline` code (IATA code).

## 🎨 Customization

### Custom Styling

Override default styles using CSS:

```css
/* Change primary color */
.aviaframe-button {
  background: linear-gradient(to right, #10b981, #059669) !important;
}

/* Adjust widget width */
.aviaframe-widget {
  max-width: 1000px !important;
}

/* Custom font */
.aviaframe-widget {
  font-family: 'Your Custom Font', sans-serif !important;
}
```

### Programmatic Control

Use JavaScript API for advanced control:

```javascript
// Initialize widget manually
AviaframeWidget.init();

// Listen to search events
document.addEventListener('aviaframe:search', function(e) {
  console.log('Search initiated:', e.detail);
});

// Listen to results
document.addEventListener('aviaframe:results', function(e) {
  console.log('Results received:', e.detail.offers);
});
```

## 🌍 Supported Airports

The widget includes 50+ major airports:

- 🇬🇧 **UK**: London Heathrow (LHR), Gatwick (LGW)
- 🇫🇷 **France**: Paris CDG, Orly
- 🇩🇪 **Germany**: Frankfurt (FRA), Munich (MUC)
- 🇪🇸 **Spain**: Madrid (MAD), Barcelona (BCN)
- 🇦🇪 **UAE**: Dubai (DXB), Abu Dhabi (AUH)
- 🇺🇦 **Ukraine**: Kyiv Boryspil (KBP)
- 🇺🇸 **USA**: New York JFK, Los Angeles (LAX)
- 🇹🇭 **Thailand**: Bangkok (BKK)
- 🇸🇬 **Singapore**: Changi (SIN)
- And many more...

## 🚀 Development

### Local Setup

```bash
cd widget
npm install
npm run dev
```

Open [http://localhost:5173/demo/](http://localhost:5173/demo/)

### Build for Production

```bash
npm run build
```

Output will be in `dist/aviaframe-widget.js`

## 📖 Examples

### WordPress Integration

```php
<?php
function add_aviaframe_widget() {
  echo '<div id="aviaframe-widget" data-api-url="' . get_option('aviaframe_api_url') . '"></div>';
  wp_enqueue_script('aviaframe-widget', 'https://cdn.aviaframe.com/widget/aviaframe-widget.js', [], '1.0.0', true);
}
add_shortcode('aviaframe', 'add_aviaframe_widget');
?>
```

Usage: `[aviaframe]`

### React Integration

```jsx
import { useEffect } from 'react';

function FlightSearch() {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.aviaframe.com/widget/aviaframe-widget.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div
      id="aviaframe-widget"
      data-api-url="https://api.example.com/search"
    />
  );
}
```

### Vue.js Integration

```vue
<template>
  <div
    id="aviaframe-widget"
    :data-api-url="apiUrl"
  />
</template>

<script>
export default {
  data() {
    return {
      apiUrl: 'https://api.example.com/search'
    };
  },
  mounted() {
    const script = document.createElement('script');
    script.src = 'https://cdn.aviaframe.com/widget/aviaframe-widget.js';
    document.body.appendChild(script);
  }
};
</script>
```

## 🐛 Troubleshooting

### Widget Not Appearing

1. Check browser console for errors
2. Verify `#aviaframe-widget` div exists
3. Ensure script is loaded after the div
4. Check API URL is correct

### No Search Results

1. Open browser DevTools → Network tab
2. Check API response status (should be 200)
3. Verify API returns correct JSON format
4. Check CORS headers if API is on different domain

### Autocomplete Not Working

1. Clear browser cache
2. Check JavaScript console for errors
3. Ensure input fields are not disabled by other scripts

## 📄 License

MIT License - see [LICENSE](LICENSE) file

## 🤝 Support

- 📧 Email: support@aviaframe.com
- 💬 Telegram: [@aviaframe_support](https://t.me/aviaframe_support)
- 📖 Docs: [docs.aviaframe.com](https://docs.aviaframe.com)
- 🐛 Issues: [GitHub Issues](https://github.com/aviaframe/widget/issues)

## 🗺️ Roadmap

- [ ] Dark theme support
- [ ] Multi-language UI (currently supports EN/RU search only)
- [ ] Date range selector
- [ ] Price alerts
- [ ] Booking integration
- [ ] Analytics dashboard

---

Built with ❤️ by Aviaframe Team