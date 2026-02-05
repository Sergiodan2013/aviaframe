# 🎨 Aviaframe Widget - Embedding Guide

## Quick Start (2 minutes)

### 1. Add the Script

Add this single line to your HTML page:

```html
<script src="https://your-domain.com/aviaframe-widget.js"></script>
```

### 2. Add the Container

Add a container where you want the widget to appear:

```html
<div id="flight-search-widget" data-aviaframe-widget></div>
```

That's it! The widget will auto-initialize.

---

## Full Example

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Travel Agency</title>
</head>
<body>
  <h1>Welcome to Our Travel Agency</h1>

  <!-- Aviaframe Widget -->
  <div
    id="flight-search-widget"
    data-aviaframe-widget
    data-api-url="http://localhost:5678/webhook/drct"
    data-brand-name="Your Agency"
    data-brand-color="#ff6b6b"
    data-title="Book Your Flight"
  ></div>

  <script src="https://your-domain.com/aviaframe-widget.js"></script>
</body>
</html>
```

---

## Configuration Options

### Using Data Attributes (Simple)

```html
<div
  id="widget"
  data-aviaframe-widget
  data-api-url="https://api.yourdomain.com"
  data-brand-name="Acme Travel"
  data-brand-color="#3b82f6"
  data-accent-color="#10b981"
  data-title="Search Flights"
></div>
```

### Using JavaScript API (Advanced)

```html
<div id="widget"></div>

<script src="aviaframe-widget.js"></script>
<script>
  new AviaframeWidget('widget', {
    // API Configuration
    apiUrl: 'https://api.yourdomain.com',

    // Branding
    title: 'Search Flights',
    brandName: 'Acme Travel',
    brandColor: '#3b82f6',    // Primary color
    accentColor: '#10b981',   // Secondary color

    // Custom Labels (translate to your language!)
    labels: {
      origin: 'От',
      destination: 'До',
      departDate: 'Дата вылета',
      returnDate: 'Дата возврата',
      adults: 'Взрослые',
      children: 'Дети',
      infants: 'Младенцы',
      cabinClass: 'Класс',
      searchButton: 'Искать рейсы',
      loading: 'Поиск рейсов...',
      noResults: 'Рейсов не найдено',
      selectFlight: 'Выбрать',
      priceFrom: 'От'
    },

    // Features
    showReturnDate: true,
    showPassengerCounts: true,
    showCabinClass: true,
    directFlightsOnly: false,

    // Styling
    borderRadius: '12px',
    fontFamily: 'Arial, sans-serif',
    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.15)',

    // Callbacks
    onFlightSelect: function(flight) {
      console.log('Selected flight:', flight);
      // Redirect to booking page
      window.location.href = '/book?flight=' + flight.offer_id;
    },

    onError: function(error) {
      console.error('Widget error:', error);
      alert('Failed to search flights. Please try again.');
    }
  });
</script>
```

---

## Color Customization

### Brand Colors

```html
<div
  id="widget"
  data-aviaframe-widget
  data-brand-color="#e74c3c"   <!-- Red theme -->
  data-accent-color="#27ae60"  <!-- Green accent -->
></div>
```

### Popular Color Schemes

**Blue (Default)**
```javascript
brandColor: '#3b82f6',
accentColor: '#10b981'
```

**Red**
```javascript
brandColor: '#ef4444',
accentColor: '#f59e0b'
```

**Purple**
```javascript
brandColor: '#8b5cf6',
accentColor: '#ec4899'
```

**Green**
```javascript
brandColor: '#10b981',
accentColor: '#3b82f6'
```

**Dark**
```javascript
brandColor: '#1f2937',
accentColor: '#6366f1'
```

---

## Language Customization

### Arabic (RTL)

```javascript
new AviaframeWidget('widget', {
  labels: {
    origin: 'من',
    destination: 'إلى',
    departDate: 'تاريخ المغادرة',
    returnDate: 'تاريخ العودة',
    adults: 'البالغين',
    children: 'الأطفال',
    infants: 'الرضع',
    cabinClass: 'الدرجة',
    searchButton: 'ابحث عن رحلات',
    loading: 'جارٍ البحث...',
    noResults: 'لم يتم العثور على رحلات',
    selectFlight: 'اختر',
    priceFrom: 'من'
  }
});
```

### Russian

```javascript
new AviaframeWidget('widget', {
  labels: {
    origin: 'Откуда',
    destination: 'Куда',
    departDate: 'Дата вылета',
    returnDate: 'Дата возврата',
    adults: 'Взрослые',
    children: 'Дети',
    infants: 'Младенцы',
    cabinClass: 'Класс',
    searchButton: 'Найти рейсы',
    loading: 'Поиск рейсов...',
    noResults: 'Рейсов не найдено',
    selectFlight: 'Выбрать',
    priceFrom: 'От'
  }
});
```

### Spanish

```javascript
new AviaframeWidget('widget', {
  labels: {
    origin: 'Desde',
    destination: 'Hasta',
    departDate: 'Fecha de salida',
    returnDate: 'Fecha de regreso',
    adults: 'Adultos',
    children: 'Niños',
    infants: 'Bebés',
    cabinClass: 'Clase',
    searchButton: 'Buscar vuelos',
    loading: 'Buscando vuelos...',
    noResults: 'No se encontraron vuelos',
    selectFlight: 'Seleccionar',
    priceFrom: 'Desde'
  }
});
```

---

## Callbacks

### onFlightSelect

Called when user clicks "Select" on a flight.

```javascript
onFlightSelect: function(flight) {
  // Redirect to your booking page
  window.location.href = '/booking?id=' + flight.offer_id;

  // Or open in modal
  openBookingModal(flight);

  // Or send to parent window (for iframes)
  window.parent.postMessage({
    type: 'flight-selected',
    flight: flight
  }, '*');
}
```

### onError

Called when search fails.

```javascript
onError: function(error) {
  // Log to analytics
  gtag('event', 'widget_error', {
    error_message: error.message
  });

  // Show custom error message
  document.getElementById('error-container').innerHTML =
    'Please try again or contact support.';
}
```

---

## Styling

### Match Your Website Theme

```javascript
new AviaframeWidget('widget', {
  // Use your brand colors
  brandColor: getComputedStyle(document.documentElement)
    .getPropertyValue('--primary-color'),

  // Use your font
  fontFamily: getComputedStyle(document.body).fontFamily,

  // Match your border radius
  borderRadius: '16px',

  // Adjust shadow
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)'
});
```

### Responsive Sizing

The widget is fully responsive and will adapt to container width.

```css
#widget {
  max-width: 1200px;  /* Desktop */
  margin: 0 auto;
  padding: 20px;
}

@media (max-width: 768px) {
  #widget {
    padding: 10px;
  }
}
```

---

## Advanced Features

### Hide Passenger Counts

For simple search widget:

```javascript
new AviaframeWidget('widget', {
  showPassengerCounts: false,
  showCabinClass: false
});
```

### Direct Flights Only

```javascript
new AviaframeWidget('widget', {
  directFlightsOnly: true
});
```

### One-way Only

```javascript
new AviaframeWidget('widget', {
  showReturnDate: false
});
```

---

## Integration Examples

### WordPress

```php
<!-- In your theme's template file -->
<div id="flight-widget" data-aviaframe-widget></div>
<script src="<?php echo get_template_directory_uri(); ?>/js/aviaframe-widget.js"></script>
```

### React

```jsx
import { useEffect } from 'react';

function FlightWidget() {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = '/aviaframe-widget.js';
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      new window.AviaframeWidget('widget', {
        apiUrl: process.env.REACT_APP_API_URL,
        brandName: 'My Agency'
      });
    };

    return () => document.body.removeChild(script);
  }, []);

  return <div id="widget"></div>;
}
```

### Vue

```vue
<template>
  <div id="widget" ref="widgetRef"></div>
</template>

<script>
export default {
  mounted() {
    const script = document.createElement('script');
    script.src = '/aviaframe-widget.js';
    document.body.appendChild(script);

    script.onload = () => {
      new window.AviaframeWidget('widget', {
        apiUrl: this.$config.apiUrl,
        brandName: 'My Agency'
      });
    };
  }
};
</script>
```

### Next.js

```jsx
import Script from 'next/script';

export default function FlightPage() {
  return (
    <>
      <div id="widget" data-aviaframe-widget />

      <Script
        src="/aviaframe-widget.js"
        onLoad={() => {
          new window.AviaframeWidget('widget', {
            apiUrl: process.env.NEXT_PUBLIC_API_URL
          });
        }}
      />
    </>
  );
}
```

---

## API Response Format

Your backend should return flights in this format:

```json
{
  "flights": [
    {
      "offer_id": "offer_123",
      "origin": "JFK",
      "destination": "LAX",
      "departure_time": "2026-03-15 10:00",
      "arrival_time": "2026-03-15 13:30",
      "airline_name": "American Airlines",
      "flight_number": "AA100",
      "price": {
        "total": 299.99,
        "currency": "USD"
      }
    }
  ]
}
```

---

## Troubleshooting

### Widget Not Appearing

1. Check console for errors (F12)
2. Verify container ID matches: `<div id="widget"></div>`
3. Ensure script is loaded before initialization

### Styling Issues

1. Check for CSS conflicts (inspect element)
2. Try increasing widget container z-index:
   ```css
   #widget { position: relative; z-index: 1000; }
   ```

### API Errors

1. Check CORS headers on your API
2. Verify API URL is correct
3. Check network tab for failed requests

---

## Support

For issues or questions:
- GitHub: https://github.com/Sergiodan2013/aviaframe
- Email: support@aviaframe.com

---

## License

MIT License - Free to use for commercial and personal projects.
