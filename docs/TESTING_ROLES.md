# AviaFrame — Role Testing Guide

Date: 2026-02-25

---

## Prerequisites

1. **Backend running locally with ngrok tunnel**
   ```bash
   cd backend && npm run dev        # starts on port 3000
   ngrok http 3000                  # get public URL
   ```

2. **Netlify env var set** — Netlify → Site config → Environment variables:
   ```
   BACKEND_URL = https://<your-ngrok-subdomain>.ngrok-free.dev
   ```
   Then trigger a redeploy (or push a commit). Without this, all `/api/*` calls fail.

3. **Supabase** — project running. Apply any pending migrations:
   ```bash
   # In Supabase dashboard → SQL editor, run each file in order:
   backend/supabase/migrations/011_expand_roles.sql  ← NEW: expands role values
   ```

---

## Role Mapping

| Business role | DB value | Portal label | Navigation |
|---|---|---|---|
| Super admin | `super_admin` | "Admin" | Admin panel + Agency admin view |
| Agency admin | `admin` *(legacy)* or `super_admin` | "Admin" | Admin panel + Agency admin view |
| Agency manager | `agent` | "Agency" | Agency dashboard only |
| Regular user | `client` | — | Search + My bookings only |

> **Note:** `admin` and `super_admin` have the same access level. Existing `admin` users remain as-is (backward compat). New promotions via the portal create `super_admin` users.

---

## Step 1: Create Test Users in Supabase

Run in **Supabase Dashboard → SQL Editor**:

```sql
-- 1. Create a test agency (needed for agent role)
INSERT INTO public.agencies (name, domain, contact_email, is_active)
VALUES ('Test Agency', 'testagency', 'agency@test.com', true)
ON CONFLICT DO NOTHING;

-- 2. Get the agency id (copy it for step 4)
SELECT id, name FROM public.agencies WHERE domain = 'testagency';
```

Then create 3 users via **Supabase Dashboard → Authentication → Users → Add user**:
- `superadmin@test.com` / any password
- `agentuser@test.com` / any password
- `enduser@test.com` / any password

After creation, run the SQL below to set roles (replace the emails and agency_id):

```sql
-- Super admin
UPDATE public.profiles
SET role = 'super_admin'
WHERE email = 'superadmin@test.com';

-- Agency manager (replace <agency-uuid> with the id from step 2)
UPDATE public.profiles
SET role = 'agent', agency_id = '<agency-uuid>'
WHERE email = 'agentuser@test.com';

-- Regular user stays as 'client' (default, no update needed)
```

---

## Step 2: Test Each Role

### Role 1 — Super Admin (`super_admin`)

Sign in as `superadmin@test.com`.

Expected nav buttons: **My bookings** | **Admin** | **Agency admin**

**Test checklist:**
- [ ] "Admin" → Admin Dashboard opens, header shows "Admin Dashboard"
  - [ ] Agencies tab: can list, create, edit agencies
  - [ ] Super Admin section: can add another super admin by email
  - [ ] Invoices tab: can create draft invoice
  - [ ] Tickets tab: can see ticket issuance records
- [ ] "Agency admin" → switches to Agency Dashboard view
  - [ ] Can edit agency settings (commission model, bank details)
  - [ ] Widget domains manager works (Add domain / Delete domain)
  - [ ] Can copy widget embed snippet
- [ ] "My bookings" → shows all orders (no agency filter for super_admin)
- [ ] Search works (needs backend + ngrok running)

---

### Role 2 — Agency Manager (`agent`)

Sign in as `agentuser@test.com`.

Expected nav buttons: **My bookings** | **Agency**

**Test checklist:**
- [ ] "Agency" → Agency Dashboard opens, header shows "Agency Dashboard"
  - [ ] Agency settings form is pre-populated (from the test agency)
  - [ ] Can edit commission model, bank details
  - [ ] Widget domains manager works
  - [ ] Widget embed snippet shows agency key
- [ ] Orders area shows only orders for this agency
- [ ] No "Admin" or "Agency admin" buttons visible (correct — no platform access)
- [ ] If no orders yet: "No orders yet" state shown

**Troubleshoot:** If you see "Agency is not linked to this account" — the `agency_id` UPDATE in step 1 didn't execute. Re-run the SQL.

---

### Role 3 — Regular User (`client`)

Sign in as `enduser@test.com`.

Expected nav buttons: **My bookings** only

**Test checklist:**
- [ ] No "Admin" or "Agency" buttons visible
- [ ] Can search flights (Test Mode ON = mock data, no backend needed)
- [ ] Can go through booking flow: Search → Select → Passenger form → Payment screen → Success
- [ ] "My bookings" shows their own bookings

---

## Step 3: Backend Connection Verification

With backend running + ngrok:

```bash
# Verify backend is reachable through ngrok
curl https://<your-ngrok>.ngrok-free.dev/healthz
# Expected: {"status":"ok", ...}

# Verify Netlify proxy works (from browser console or terminal)
curl https://<your-netlify-site>.netlify.app/api/backend/healthz
# Expected: same response
```

If `/api/backend/*` returns 404, the Netlify redeploy hasn't picked up `BACKEND_URL` yet.

---

## Known Limitations (MVP)

| Issue | Impact | Fix |
|---|---|---|
| `agent` and `agency_admin` share same DB role `agent` | Can't differentiate agency admin from manager in DB | Migration to add `agency_admin` role — planned Phase 4 |
| No email sending yet | Booking confirmation emails not sent | Resend integration — planned Phase 1 |
| Widget uses n8n webhook, not backend proxy | Search needs n8n running locally too | n8n running on port 5678 |
| PDF itinerary not implemented | No e-ticket PDF | Planned Phase 1 |

---

## Quick Reference — ngrok + Backend

```bash
# Terminal 1: Start backend
cd backend
cp .env.example .env    # fill in SUPABASE_URL, SUPABASE_ANON_KEY, etc.
npm install
npm run dev             # → http://localhost:3000

# Terminal 2: Start ngrok
ngrok http 3000         # → https://xxx.ngrok-free.dev

# Update Netlify env var BACKEND_URL to the ngrok URL, trigger redeploy
```
