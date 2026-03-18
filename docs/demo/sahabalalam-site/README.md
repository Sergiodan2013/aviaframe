# Sahab Al Alam Demo Site (White-Label Mock)

## Files
- `index.html` - complete demo page
- `styles.css` - visual style
- `brand.json` - brand data source (reference)
- `assets/sahabalalam-logo.png` - place original logo here

## Quick local preview

```bash
cd "$(pwd)"
cd docs/demo/sahabalalam-site
python3 -m http.server 8080
```

Open: `http://localhost:8080`

## Simulate subdomain locally

Add to `/etc/hosts`:

```txt
127.0.0.1 sahabalalam.aviaframe.local
```

Then open: `http://sahabalalam.aviaframe.local:8080`

## Real demo on subdomain

1. Deploy this folder to your static host (Netlify/Vercel/S3).
2. Add DNS record:
   - `sahabalalam.aviaframe.com` -> your deployed site target.
3. Enable SSL for the custom domain.

## Notes
- This demo is fully in English.
- Widget area is currently a placeholder and ready for AviaFrame embed script.
- If logo is missing, place the provided logo image at:
  - `assets/sahabalalam-logo.png`
