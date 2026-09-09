-- Keep the legacy db/migrations path aligned with Supabase migration 019.

ALTER TABLE public.idempotency_keys
  ADD COLUMN IF NOT EXISTS request_hash TEXT;

-- Non-destructive rollout: retain the legacy partial index and all historical
-- rows. A duplicate causes this statement to fail and requires explicit review.
CREATE UNIQUE INDEX IF NOT EXISTS idx_idempotency_keys_agency_operation_key
  ON public.idempotency_keys(agency_id, operation, idempotency_key);
