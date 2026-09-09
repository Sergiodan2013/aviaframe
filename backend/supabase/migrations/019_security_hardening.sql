-- 019_security_hardening.sql
-- Makes legacy portal order mutation idempotency atomic and request-aware.

ALTER TABLE public.idempotency_keys
  ADD COLUMN IF NOT EXISTS request_hash TEXT;

-- Pending rows were previously allowed to race because the legacy index only
-- covered completed rows. Keep that index and all operational history intact;
-- creation of this full unique index fails closed if duplicates need review.
CREATE UNIQUE INDEX IF NOT EXISTS idx_idempotency_keys_agency_operation_key
  ON public.idempotency_keys(agency_id, operation, idempotency_key);

COMMENT ON INDEX public.idx_idempotency_keys_agency_operation_key IS
  'Atomic idempotency claim for portal issue/cancel mutations.';
