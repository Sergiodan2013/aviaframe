-- ================================================================
-- SAFE DIAGNOSTIC & FIX for Orders RLS Timeout
-- Date: 2026-02-13
-- ================================================================
-- This script:
-- 1. Checks existing structure (tables, functions, policies)
-- 2. Shows current state
-- 3. Applies ONLY minimal safe fix
-- ================================================================

-- ========================================
-- PART 1: DIAGNOSTIC (READ-ONLY)
-- ========================================

-- Check: What tables exist?
DO $$
BEGIN
  RAISE NOTICE '=== CHECKING DATABASE STRUCTURE ===';

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    RAISE NOTICE '✓ Table public.profiles EXISTS';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agency_members') THEN
    RAISE NOTICE '✓ Table public.agency_members EXISTS';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
    RAISE NOTICE '✓ Table public.orders EXISTS';
  END IF;
END $$;

-- Check: What columns does orders have?
DO $$
DECLARE
  col_name TEXT;
BEGIN
  RAISE NOTICE '=== ORDERS TABLE COLUMNS ===';
  FOR col_name IN
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders'
    AND column_name IN ('user_id', 'created_by', 'agency_id')
  LOOP
    RAISE NOTICE '✓ orders.% exists', col_name;
  END LOOP;
END $$;

-- Check: What functions exist?
DO $$
BEGIN
  RAISE NOTICE '=== CHECKING FUNCTIONS ===';

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_super_admin') THEN
    RAISE NOTICE '✓ Function is_super_admin() EXISTS';
  ELSE
    RAISE NOTICE '✗ Function is_super_admin() DOES NOT EXIST';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'has_agency_access') THEN
    RAISE NOTICE '✓ Function has_agency_access() EXISTS';
  ELSE
    RAISE NOTICE '✗ Function has_agency_access() DOES NOT EXIST';
  END IF;
END $$;

-- Check: What RLS policies exist on orders?
DO $$
DECLARE
  pol_record RECORD;
BEGIN
  RAISE NOTICE '=== CURRENT RLS POLICIES ON ORDERS ===';
  FOR pol_record IN
    SELECT policyname, cmd
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'orders'
  LOOP
    RAISE NOTICE '- %: %', pol_record.cmd, pol_record.policyname;
  END LOOP;
END $$;

-- Check: Your user profile
DO $$
DECLARE
  user_record RECORD;
BEGIN
  RAISE NOTICE '=== YOUR USER PROFILE ===';

  -- Try profiles table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    FOR user_record IN
      SELECT id, email, role, agency_id
      FROM public.profiles
      WHERE id = auth.uid()
    LOOP
      RAISE NOTICE 'ID: %, Email: %, Role: %, Agency: %',
        user_record.id, user_record.email, user_record.role, user_record.agency_id;
    END LOOP;
  END IF;

  -- Try agency_members table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agency_members') THEN
    FOR user_record IN
      SELECT user_id, role, agency_id
      FROM public.agency_members
      WHERE user_id = auth.uid()
    LOOP
      RAISE NOTICE 'User ID: %, Role: %, Agency: %',
        user_record.user_id, user_record.role, user_record.agency_id;
    END LOOP;
  END IF;
END $$;

RAISE NOTICE '=== END DIAGNOSTIC ===';
RAISE NOTICE 'Review the output above, then run PART 2 if needed.';
RAISE NOTICE 'DO NOT RUN PART 2 until you verify the structure!';

-- ========================================
-- PART 2: MINIMAL SAFE FIX (COMMENTED OUT)
-- ========================================
-- Uncomment ONLY after reviewing diagnostic output

/*
-- Only if using public.profiles with role column:
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;

CREATE POLICY "Users can view own orders"
  ON public.orders
  FOR SELECT
  USING (
    -- Owner can view
    user_id = auth.uid()
    OR
    -- Admin can view all (no agency_id check)
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
    OR
    -- Agent can view own agency
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'agent'
      AND agency_id = orders.agency_id
    )
  );

RAISE NOTICE '✅ Updated policy: Admins can now view all orders without agency_id check';
*/

-- ========================================
-- VERIFICATION QUERY (Safe to run anytime)
-- ========================================
-- Copy this to SQL Editor to check your role:
/*
SELECT
  id,
  email,
  role,
  agency_id
FROM public.profiles
WHERE email LIKE '%@agilesoft.kz';
*/
