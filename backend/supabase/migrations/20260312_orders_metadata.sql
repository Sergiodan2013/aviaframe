-- Add metadata column to orders table
-- Required for: cancel-refundable-fare feature
-- Run in Supabase Dashboard → SQL Editor

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS metadata JSONB;

COMMENT ON COLUMN public.orders.metadata IS
  'Fare conditions and booking metadata: {cancelable, cancel_fee, drct_env, fare_basis_code, price_class_name}';
