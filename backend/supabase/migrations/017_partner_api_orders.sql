-- 017_partner_api_orders.sql
-- Atomic Partner API order reservation and state persistence.

ALTER TABLE public.api_order_context
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'CREATING',
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT,
  ADD COLUMN IF NOT EXISTS partner_response JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS upstream_error JSONB;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'api_order_context_status_check'
  ) THEN
    ALTER TABLE public.api_order_context
      ADD CONSTRAINT api_order_context_status_check
      CHECK (status IN ('CREATING', 'CREATED', 'PENDING_RECONCILE', 'FAILED', 'ISSUED', 'CANCELLED'));
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_api_order_context_idempotency
  ON public.api_order_context(api_client_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE OR REPLACE FUNCTION public.create_partner_api_order(
  p_api_client_id UUID,
  p_counterparty_id UUID,
  p_quote_id UUID,
  p_external_order_id TEXT,
  p_client_order_ref TEXT,
  p_idempotency_key TEXT,
  p_order JSONB,
  p_pricing_snapshot JSONB
)
RETURNS TABLE(order_id UUID, context_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_quote public.offer_quotes%ROWTYPE;
  v_order_id UUID;
  v_context_id UUID;
BEGIN
  SELECT * INTO v_quote
  FROM public.offer_quotes
  WHERE id = p_quote_id
    AND api_client_id = p_api_client_id
    AND counterparty_id = p_counterparty_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'QUOTE_NOT_FOUND';
  END IF;
  IF v_quote.consumed_at IS NOT NULL THEN
    RAISE EXCEPTION 'QUOTE_ALREADY_CONSUMED';
  END IF;
  IF v_quote.expires_at <= NOW() THEN
    RAISE EXCEPTION 'QUOTE_EXPIRED';
  END IF;

  UPDATE public.offer_quotes
  SET consumed_at = NOW()
  WHERE id = v_quote.id;

  INSERT INTO public.orders (
    order_number, offer_id, origin, destination, departure_time, arrival_time,
    airline_code, airline_name, base_price, taxes, baggage_price, total_price,
    currency, status, payment_method, contact_email, contact_phone, raw_offer_data
  ) VALUES (
    p_order->>'order_number',
    v_quote.upstream_offer_id,
    COALESCE(p_order->>'origin', 'UNKNOWN'),
    COALESCE(p_order->>'destination', 'UNKNOWN'),
    p_order->>'departure_time',
    p_order->>'arrival_time',
    p_order->>'airline_code',
    p_order->>'airline_name',
    v_quote.supplier_total,
    0,
    0,
    v_quote.sell_total,
    v_quote.currency,
    'pending',
    'invoice',
    p_order->>'contact_email',
    p_order->>'contact_phone',
    p_order->'raw_offer_data'
  )
  RETURNING id INTO v_order_id;

  INSERT INTO public.api_order_context (
    order_id, api_client_id, counterparty_id, external_order_id, client_order_ref,
    external_quote_id, pricing_snapshot, status, supplier_status,
    reconcile_required, idempotency_key
  ) VALUES (
    v_order_id, p_api_client_id, p_counterparty_id, p_external_order_id,
    p_client_order_ref, v_quote.external_quote_id, p_pricing_snapshot,
    'CREATING', 'NOT_SENT', FALSE, p_idempotency_key
  )
  RETURNING id INTO v_context_id;

  RETURN QUERY SELECT v_order_id, v_context_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_partner_api_order_state(
  p_order_id UUID,
  p_status TEXT,
  p_supplier_status TEXT,
  p_reconcile_required BOOLEAN,
  p_upstream_order_id TEXT,
  p_upstream_response JSONB,
  p_partner_response JSONB,
  p_upstream_error JSONB
)
RETURNS TABLE(order_id UUID, context_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_context_id UUID;
BEGIN
  UPDATE public.orders
  SET drct_order_id = COALESCE(p_upstream_order_id, drct_order_id),
      raw_drct_response = COALESCE(p_upstream_response, raw_drct_response),
      status = CASE WHEN p_status = 'FAILED' THEN 'failed' ELSE status END,
      updated_at = NOW()
  WHERE id = p_order_id;

  UPDATE public.api_order_context
  SET status = p_status,
      supplier_status = p_supplier_status,
      reconcile_required = p_reconcile_required,
      partner_response = COALESCE(p_partner_response, '{}'::jsonb),
      upstream_error = p_upstream_error,
      updated_at = NOW()
  WHERE api_order_context.order_id = p_order_id
  RETURNING id INTO v_context_id;

  IF v_context_id IS NULL THEN
    RAISE EXCEPTION 'PARTNER_ORDER_CONTEXT_NOT_FOUND';
  END IF;

  RETURN QUERY SELECT p_order_id, v_context_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_partner_api_order(UUID, UUID, UUID, TEXT, TEXT, TEXT, JSONB, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_partner_api_order_state(UUID, TEXT, TEXT, BOOLEAN, TEXT, JSONB, JSONB, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_partner_api_order(UUID, UUID, UUID, TEXT, TEXT, TEXT, JSONB, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.update_partner_api_order_state(UUID, TEXT, TEXT, BOOLEAN, TEXT, JSONB, JSONB, JSONB) TO service_role;

COMMENT ON FUNCTION public.create_partner_api_order IS
  'Atomically consumes an AviaFrame quote and creates the internal/API order records.';
