# ⚠️ ORPHANED / LEGACY — not the active migration line

This directory is **not used by any running code, script, or deployment**.
The authoritative migration line for the live database schema is
`backend/supabase/migrations/`.

See `backend/db/README.md` for the full explanation of why this whole
`backend/db/` folder is a historical draft that does not match the live
schema (`agencies`/`orders`/`profiles`), not the early design it describes
(`organizations`/`bookings`/`users`/`roles`).

## What to do

- **Do not run** `0002_idempotency_keys.sql` or `0003_security_hardening.sql`
  from this folder against the live database.
- **Do not add new migrations here.** Add them to
  `backend/supabase/migrations/` instead.

Confirmed orphaned as of 2026-09-11: no code, build script, CI config, or
documentation (outside `backend/db/`) references this directory.
