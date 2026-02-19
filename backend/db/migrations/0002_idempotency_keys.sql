BEGIN;

CREATE TYPE idempotency_status AS ENUM ('pending', 'completed', 'failed');

CREATE TABLE idempotency_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  idempotency_key VARCHAR(255) NOT NULL,
  operation VARCHAR(255) NOT NULL,
  status idempotency_status NOT NULL DEFAULT 'pending',
  response_http_status INTEGER,
  response_body JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  CONSTRAINT idempotency_key_length CHECK (char_length(idempotency_key) >= 8)
);

CREATE UNIQUE INDEX idx_idempotency_keys_agency_key 
ON idempotency_keys(agency_id, idempotency_key)
WHERE status = 'completed';

CREATE INDEX idx_idempotency_keys_agency_created 
ON idempotency_keys(agency_id, created_at DESC);

CREATE INDEX idx_idempotency_keys_expires 
ON idempotency_keys(expires_at)
WHERE status IN ('completed', 'failed');

ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY idempotency_keys_select_own_agency
  ON idempotency_keys FOR SELECT TO authenticated
  USING (agency_id IN (SELECT agency_id FROM agency_members WHERE user_id = auth.uid()) OR (SELECT is_super_admin(auth.uid())));

CREATE POLICY idempotency_keys_service_write ON idempotency_keys FOR INSERT WITH CHECK (true);
CREATE POLICY idempotency_keys_service_update ON idempotency_keys FOR UPDATE USING (true) WITH CHECK (true);

COMMIT;
