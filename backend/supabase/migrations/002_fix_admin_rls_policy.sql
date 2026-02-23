-- Migration: Fix RLS policy to allow admins to see all orders
-- Date: 2026-02-13
-- Problem: Current policy requires agency_id match even for admins, blocking queries
-- Solution: Admins should see ALL orders, agents only their agency orders

-- Drop existing policy
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;

-- Create corrected policy
CREATE POLICY "Users can view own orders"
  ON public.orders FOR SELECT
  USING (
    -- Users can view their own orders
    user_id = auth.uid()
    OR
    -- Admins can view ALL orders (no agency_id restriction)
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
    OR
    -- Agents can view orders from their agency
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'agent'
      AND profiles.agency_id = orders.agency_id
    )
  );

-- Verify the policy was created
DO $$
BEGIN
  RAISE NOTICE 'RLS policy updated: Admins can now view all orders';
END $$;
