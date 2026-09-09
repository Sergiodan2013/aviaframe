-- Supabase emergency fix for Security Advisor issue:
-- code: rls_disabled_in_public
--
-- Use in Supabase SQL Editor for the affected project.
-- This script does two things:
-- 1. lists public tables that still have RLS disabled
-- 2. enables RLS on every such table
--
-- Important:
-- - enabling RLS immediately blocks anon/authenticated access unless policies exist
-- - service-role access used by backend automations still works as expected
-- - after running this, verify frontend/admin flows for any table that was previously open

-- 1) Audit: which public tables are still missing RLS?
select
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relrowsecurity = false
order by c.relname;

-- 2) Emergency remediation: enable RLS on every public table that still lacks it.
do $$
declare
  rec record;
begin
  for rec in
    select c.relname as table_name
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'r'
      and c.relrowsecurity = false
  loop
    execute format('alter table public.%I enable row level security', rec.table_name);
    raise notice 'Enabled RLS on public.%', rec.table_name;
  end loop;
end
$$;

-- 3) Re-run the audit query above after the block.
-- Expected result: zero rows.

-- 4) Optional: inspect tables that now have RLS but no explicit policies.
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

