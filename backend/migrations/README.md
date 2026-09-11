# ⚠️ ORPHANED / LEGACY — not the active migration line

This directory is **not used by any running code, script, or deployment**.
It was superseded by `backend/supabase/migrations/`, which is the
**authoritative** migration line for the live database schema.

## Why this exists

`001_create_customer_profiles.sql` in this folder was an early draft of the
customer-profiles table. It was superseded by
`backend/supabase/migrations/014_customer_profiles.sql`, which is the version
actually applied to the live database.

## What to do

- **Do not add new migrations here.** Add them to `backend/supabase/migrations/`
  instead, following that directory's existing naming convention
  (`0NN_description.sql`).
- **Do not run the file in this directory** — it may be out of sync with the
  live schema and could conflict with tables/columns that
  `backend/supabase/migrations/` already created differently.
- This directory is kept only for historical reference. It can be safely
  deleted once nobody needs that history.

Confirmed orphaned as of 2026-09-11: no code, build script, CI config, or
documentation (outside this directory) references `backend/migrations/` or
`001_create_customer_profiles.sql`.
