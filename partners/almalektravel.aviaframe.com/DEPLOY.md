# Deploy: almalektravel.aviaframe.com

## Initial Deploy

```bash
cd /Users/sergejdaniluk/projects/aviaframe/partners/almalektravel.aviaframe.com
node ~/.npm/_npx/da5c1b6ea715e8b4/node_modules/netlify-cli/bin/run.js deploy --prod --dir=. --site=5589fd0b-636c-465c-ac33-7a13213f62cd
```

**Netlify Site ID**: `5589fd0b-636c-465c-ac33-7a13213f62cd`
**Netlify URL**: https://almalektravel-aviaframe.netlify.app

## DNS (aviaframe.com Netlify account)

✅ **Already configured** — CNAME `almalektravel` → `apex-loadbalancer.netlify.com` added to Netlify DNS zone.

Custom domain `almalektravel.aviaframe.com` is set on the Netlify site.

## Redeploy

```bash
cd /Users/sergejdaniluk/projects/aviaframe/partners/almalektravel.aviaframe.com
node ~/.npm/_npx/da5c1b6ea715e8b4/node_modules/netlify-cli/bin/run.js deploy --prod --dir=. --site=5589fd0b-636c-465c-ac33-7a13213f62cd
```
