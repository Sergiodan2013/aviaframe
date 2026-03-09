-- Aviaframe MVP: payment method, account claim, order messages
-- Date: 2026-02-26

-- Orders: payment + account claim metadata
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_method TEXT,
  ADD COLUMN IF NOT EXISTS payment_status TEXT,
  ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS claim_token TEXT,
  ADD COLUMN IF NOT EXISTS claim_token_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS order_meta JSONB DEFAULT '{}'::jsonb;

-- Backfill defaults for existing records
UPDATE public.orders
SET payment_method = COALESCE(NULLIF(payment_method, ''), 'bank_transfer')
WHERE payment_method IS NULL OR payment_method = '';

UPDATE public.orders
SET payment_status = COALESCE(NULLIF(payment_status, ''), 'pending')
WHERE payment_status IS NULL OR payment_status = '';

-- Add checks (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'orders_payment_method_check'
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_payment_method_check
      CHECK (payment_method IN ('cash', 'bank_transfer', 'online'));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'orders_payment_status_check'
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_payment_status_check
      CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_orders_claim_token ON public.orders(claim_token) WHERE claim_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_claimed_at ON public.orders(claimed_at) WHERE claimed_at IS NOT NULL;

-- Messages per order thread
CREATE TABLE IF NOT EXISTS public.order_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES public.agencies(id) ON DELETE SET NULL,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('client', 'agent', 'system')),
  sender_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  client_read_at TIMESTAMPTZ,
  agent_read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_messages_order_created ON public.order_messages(order_id, created_at);
CREATE INDEX IF NOT EXISTS idx_order_messages_agency_id ON public.order_messages(agency_id);

