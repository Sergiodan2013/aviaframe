# Aviaframe Widget - Partner Integration Guide

## 📋 Quick Integration (3 Steps)

### Step 1: Get Your API Credentials

Contact Aviaframe support to receive:
- Your unique API endpoint URL
- Optional: Partner ID for analytics tracking

### Step 2: Add Widget to Your Website

Copy and paste this code where you want the flight search to appear:

```html
<!-- Place this where you want the widget -->
<div id="aviaframe-widget" data-api-url="YOUR_API_URL_HERE"></div>

<!-- Place this before closing </body> tag -->
<script src="https://cdn.aviaframe.com/widget/aviaframe-widget.js"></script>
```

### Step 3: Test

1. Open your website
2. You should see the flight search form
3. Try searching: Paris → London
4. Verify results are displayed

✅ Done! Your widget is live.

---

## 🎨 Customization Examples

### Change Colors

```html
<style>
/* Primary color (buttons, links) */
.aviaframe-button {
  background: linear-gradient(to right, #10b981, #059669) !important;
}

/* Widget background */
.aviaframe-widget {
  background: #f9fafb !important;
}

/* Price color */
.aviaframe-flight-price {
  color: #10b981 !important;
}
</style>
```

### Adjust Size

```html
<style>
/* Full width widget */
.aviaframe-widget {
  max-width: 100% !important;
}

/* Compact widget (sidebar) */
.aviaframe-widget {
  max-width: 400px !important;
  padding: 16px !important;
}
</style>
```

### Hide Certain Fields

```html
<style>
/* Hide return date field (one-way flights only) */
#aviaframe-return-date {
  display: none !important;
}

/* Hide cabin class selector */
#aviaframe-cabin {
  display: none !important;
}
</style>
```

---

## 🔌 Platform-Specific Integrations

### WordPress

#### Option 1: Manual Integration

1. Go to **Appearance → Theme File Editor**
2. Edit `footer.php`
3. Add before `</body>`:

```php
<div id="aviaframe-widget" data-api-url="<?php echo get_option('aviaframe_api_url'); ?>"></div>
<script src="https://cdn.aviaframe.com/widget/aviaframe-widget.js"></script>
```

#### Option 2: Using Page Builder (Elementor, Beaver Builder, etc.)

1. Add **HTML Block**
2. Paste widget code
3. Publish

### Wix

1. Click **Add → Embed → Custom embeds**
2. Select **HTML iframe**
3. Paste this code:

```html
<div id="aviaframe-widget" data-api-url="YOUR_API_URL"></div>
<script src="https://cdn.aviaframe.com/widget/aviaframe-widget.js"></script>
```

4. Adjust iframe size as needed

### Shopify

1. Go to **Online Store → Themes → Edit code**
2. Edit `theme.liquid`
3. Add before `</body>`:

```liquid
<div id="aviaframe-widget" data-api-url="{{ settings.aviaframe_api_url }}"></div>
<script src="https://cdn.aviaframe.com/widget/aviaframe-widget.js"></script>
```

### Squarespace

1. Add **Code Block**
2. Paste widget code
3. Save and publish

### Webflow

1. Add **Embed** element
2. Paste widget code
3. Publish site

---

## 🧪 Testing Your Integration

### 1. Visual Test

**Expected Result:**
- Form appears with 6 fields: From, To, Departure Date, Return Date, Adults, Cabin Class
- Autocomplete shows airports when typing (e.g., "Paris" shows CDG, ORY)
- Search button is visible and clickable

### 2. Functional Test

**Test Search:** Paris (CDG) → London (LHR), Tomorrow, 2 Adults

**Expected Result:**
- Loading spinner appears
- Results display within 5 seconds
- Each result shows: route, price, times, airline

### 3. Mobile Test

Open on mobile device:
- Form should be responsive (single column)
- Inputs should be easily tappable
- Date picker should open native mobile picker

---

## 🚨 Common Issues & Solutions

### Issue: Widget not appearing

**Solution 1:** Check div ID
```html
<!-- ✅ Correct -->
<div id="aviaframe-widget"></div>

<!-- ❌ Wrong -->
<div id="flight-widget"></div>
<div class="aviaframe-widget"></div>
```

**Solution 2:** Check script placement
```html
<!-- ✅ Correct - script after div -->
<div id="aviaframe-widget"></div>
<script src="..."></script>

<!-- ❌ Wrong - script before div -->
<script src="..."></script>
<div id="aviaframe-widget"></div>
```

### Issue: "No flights found" always shows

**Check API endpoint:**
```bash
# Test your API manually
curl -X POST YOUR_API_URL \
  -H "Content-Type: application/json" \
  -d '{
    "origin": "CDG",
    "destination": "LHR",
    "depart_date": "2026-03-15",
    "adults": 1
  }'
```

Expected response: `{ "offers": [...] }`

**Check CORS settings:**
Your API must allow requests from your website domain.

### Issue: Autocomplete not working

**Check browser console** (F12):
- Look for JavaScript errors
- Ensure no conflicting scripts

**Clear cache:**
- Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

### Issue: Widget looks broken

**Check CSS conflicts:**
```html
<!-- Add this to isolate widget styles -->
<style>
.aviaframe-widget * {
  all: revert;
}
</style>
```

---

## 📊 Analytics & Tracking

### Track Search Events

```javascript
// Add this script to track searches
document.addEventListener('aviaframe:search', function(e) {
  // Send to Google Analytics
  gtag('event', 'flight_search', {
    origin: e.detail.origin,
    destination: e.detail.destination,
    passengers: e.detail.adults
  });

  // Or send to your analytics
  fetch('/api/analytics', {
    method: 'POST',
    body: JSON.stringify({
      event: 'flight_search',
      data: e.detail
    })
  });
});
```

### Track Results

```javascript
document.addEventListener('aviaframe:results', function(e) {
  console.log('Found', e.detail.offers.length, 'flights');

  // Track to analytics
  gtag('event', 'search_results', {
    results_count: e.detail.offers.length
  });
});
```

---

## 🎯 Advanced Configuration

### Pre-fill Search Fields

```javascript
// Set default values on page load
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('aviaframe-origin').value = 'Paris (CDG)';
  document.getElementById('aviaframe-origin').dataset.code = 'CDG';

  document.getElementById('aviaframe-destination').value = 'London (LHR)';
  document.getElementById('aviaframe-destination').dataset.code = 'LHR';

  // Set date to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  document.getElementById('aviaframe-depart-date').value =
    tomorrow.toISOString().split('T')[0];
});
```

### Trigger Search Programmatically

```javascript
// Trigger search from your code
document.getElementById('aviaframe-search-form').dispatchEvent(
  new Event('submit', { bubbles: true, cancelable: true })
);
```

### Customize Airports List

Contact Aviaframe support to:
- Add specific airports
- Remove unused airports
- Prioritize certain routes

---

## 📞 Support Channels

**Email:** support@aviaframe.com
- Response time: < 24 hours
- Include: website URL, browser console screenshot

**Telegram:** [@aviaframe_support](https://t.me/aviaframe_support)
- Response time: < 2 hours (9 AM - 6 PM UTC)

**Documentation:** [docs.aviaframe.com](https://docs.aviaframe.com)

**Emergency Support:** +971-XX-XXX-XXXX (24/7)
- For critical production issues only

---

## ✅ Pre-Launch Checklist

Before going live, verify:

- [ ] Widget appears correctly on desktop
- [ ] Widget appears correctly on mobile
- [ ] Autocomplete works (try typing "Paris", "London", "Dubai")
- [ ] Search returns results (test with popular routes)
- [ ] Prices display correctly
- [ ] No JavaScript errors in console (F12)
- [ ] Widget matches your brand colors
- [ ] Page load time is acceptable (widget adds < 100ms)
- [ ] HTTPS enabled on your website (required for API calls)
- [ ] Analytics tracking configured (optional)

---

## 🎉 You're All Set!

Your Aviaframe widget is ready to generate flight bookings.

**Next Steps:**
1. Monitor search volume in your dashboard
2. Contact us for custom features
3. Join our partner community for tips and updates

Happy selling! ✈️

---

*Last updated: January 2026*
*Widget version: 1.0.0*
