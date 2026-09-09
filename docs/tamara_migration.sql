-- Tamara integration DB migration
-- Run in Supabase SQL Editor

-- 1. Add Tamara columns to orders table
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_provider text DEFAULT 'moyasar',
  ADD COLUMN IF NOT EXISTS payment_provider_order_id text,
  ADD COLUMN IF NOT EXISTS payment_provider_status text,
  ADD COLUMN IF NOT EXISTS payment_authorised_at timestamptz,
  ADD COLUMN IF NOT EXISTS payment_captured_at timestamptz,
  ADD COLUMN IF NOT EXISTS payment_cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS payment_refunded_at timestamptz,
  ADD COLUMN IF NOT EXISTS payment_reference text;

-- Index for looking up orders by Tamara order ID
CREATE INDEX IF NOT EXISTS idx_orders_payment_provider_order_id
  ON orders (payment_provider_order_id)
  WHERE payment_provider_order_id IS NOT NULL;

-- 2. Table for raw provider webhook events (idempotency + audit)
CREATE TABLE IF NOT EXISTS payment_provider_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  provider_event_id text,
  provider_order_id text NOT NULL,
  event_type text NOT NULL,
  event_status text,
  payload_json jsonb,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ppe_provider_event_id
  ON payment_provider_events (provider, provider_order_id, event_type, event_status)
  WHERE provider_event_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_ppe_provider_event_id_unique
  ON payment_provider_events (provider, provider_event_id)
  WHERE provider_event_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ppe_provider_order_id
  ON payment_provider_events (provider_order_id);

-- 3. Table for API operations log (authorize/capture/cancel/refund)
CREATE TABLE IF NOT EXISTS payment_provider_operations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  provider text NOT NULL,
  operation_type text NOT NULL,
  request_json jsonb,
  response_json jsonb,
  provider_reference text,
  success boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ppo_order_id ON payment_provider_operations (order_id);
CREATE INDEX IF NOT EXISTS idx_ppo_provider_order ON payment_provider_operations (provider, operation_type);

-- RLS: service role can read/write, authenticated can read own
ALTER TABLE payment_provider_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_provider_operations ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (backend uses service role key)
CREATE POLICY IF NOT EXISTS "service_role_all_ppe"
  ON payment_provider_events FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY IF NOT EXISTS "service_role_all_ppo"
  ON payment_provider_operations FOR ALL
  USING (auth.role() = 'service_role');
