-- ================================================================
-- CRITICAL FIX: Explicit Admin Bypass for RLS
-- Date: 2026-02-13
-- Problem: Timeout when loading orders due to RLS checking agency_id for EVERY row
-- Solution: Create helper functions + explicit policies for super clear admin bypass
-- ================================================================

-- ========================================
-- 1. Helper Functions
-- ========================================

-- Check if user is super admin (admin role, can see everything)
CREATE OR REPLACE FUNCTION public.is_super_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_uuid
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user has access to orders from specific agency
CREATE OR REPLACE FUNCTION public.has_agency_access(user_uuid UUID, order_agency_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_uuid
    AND (
      -- Agent must match agency_id
      (role = 'agent' AND agency_id = order_agency_id)
      -- Admin can access all agencies
      OR role = 'admin'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ========================================
-- 2. Drop Old Policies
-- ========================================

DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create own orders" ON public.orders;
DROP POLICY IF EXISTS "Agents can update orders in their agency" ON public.orders;
DROP POLICY IF EXISTS "Agents can delete orders in their agency" ON public.orders;

-- ========================================
-- 3. New Explicit Policies for Orders
-- ========================================

-- Policy 1: Super Admin can see ALL orders (bypass agency_id check)
CREATE POLICY "super_admin_view_all_orders"
  ON public.orders
  FOR SELECT
  USING (public.is_super_admin(auth.uid()));

-- Policy 2: Users can view their own orders
CREATE POLICY "users_view_own_orders"
  ON public.orders
  FOR SELECT
  USING (user_id = auth.uid());

-- Policy 3: Agents can view orders from their agency
CREATE POLICY "agents_view_agency_orders"
  ON public.orders
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'agent'
      AND profiles.agency_id = orders.agency_id
    )
  );

-- Policy 4: Users can create their own orders
CREATE POLICY "users_create_own_orders"
  ON public.orders
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Policy 5: Super Admin can update ALL orders
CREATE POLICY "super_admin_update_all_orders"
  ON public.orders
  FOR UPDATE
  USING (public.is_super_admin(auth.uid()));

-- Policy 6: Agents can update orders from their agency
CREATE POLICY "agents_update_agency_orders"
  ON public.orders
  FOR UPDATE
  USING (public.has_agency_access(auth.uid(), agency_id));

-- Policy 7: Super Admin can delete ALL orders
CREATE POLICY "super_admin_delete_all_orders"
  ON public.orders
  FOR DELETE
  USING (public.is_super_admin(auth.uid()));

-- Policy 8: Agents can delete orders from their agency
CREATE POLICY "agents_delete_agency_orders"
  ON public.orders
  FOR DELETE
  USING (public.has_agency_access(auth.uid(), agency_id));

-- ========================================
-- 4. Apply Same Pattern to Passengers
-- ========================================

DROP POLICY IF EXISTS "Users can view passengers for own orders" ON public.passengers;
DROP POLICY IF EXISTS "Users can manage passengers for own orders" ON public.passengers;

-- Super Admin can see all passengers
CREATE POLICY "super_admin_view_all_passengers"
  ON public.passengers
  FOR SELECT
  USING (public.is_super_admin(auth.uid()));

-- Users/Agents can view passengers for accessible orders
CREATE POLICY "users_view_order_passengers"
  ON public.passengers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = passengers.order_id
      AND (
        orders.user_id = auth.uid()
        OR public.has_agency_access(auth.uid(), orders.agency_id)
      )
    )
  );

-- Super Admin can manage all passengers
CREATE POLICY "super_admin_manage_all_passengers"
  ON public.passengers
  FOR ALL
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

-- Users can manage passengers for their orders
CREATE POLICY "users_manage_order_passengers"
  ON public.passengers
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = passengers.order_id
      AND orders.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = passengers.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- ========================================
-- 5. Verification
-- ========================================

DO $$
DECLARE
  admin_count INT;
  policy_count INT;
BEGIN
  -- Check how many admins exist
  SELECT COUNT(*) INTO admin_count
  FROM public.profiles
  WHERE role = 'admin';

  -- Check how many policies exist for orders
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'orders';

  RAISE NOTICE '✅ Migration complete!';
  RAISE NOTICE 'Found % admin(s) in profiles', admin_count;
  RAISE NOTICE 'Created % policies for orders table', policy_count;
  RAISE NOTICE 'Helper functions created: is_super_admin(), has_agency_access()';
END $$;
