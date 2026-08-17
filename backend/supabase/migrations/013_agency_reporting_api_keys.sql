-- 013_agency_reporting_api_keys.sql
-- Read-only API keys for agency partners to pull reporting data.
-- Keys are stored as SHA-256 hashes — raw key is never persisted.

CREATE TABLE IF NOT EXISTS public.agency_api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Reporting Key',
  key_hash TEXT NOT NULL UNIQUE,
  scopes TEXT[] NOT NULL DEFAULT ARRAY['reports:read'],
  last_used_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agency_api_keys_agency_id ON public.agency_api_keys(agency_id);
CREATE INDEX IF NOT EXISTS idx_agency_api_keys_key_hash ON public.agency_api_keys(key_hash);

ALTER TABLE public.agency_api_keys ENABLE ROW LEVEL SECURITY;

-- Admin and super_admin can manage all keys
DROP POLICY IF EXISTS agency_api_keys_admin_all ON public.agency_api_keys;
CREATE POLICY agency_api_keys_admin_all ON public.agency_api_keys
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin')
  )
);
