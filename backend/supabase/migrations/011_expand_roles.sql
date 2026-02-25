-- 011_expand_roles.sql
-- Expand profiles.role CHECK constraint to include 'super_admin'.
--
-- Context:
--   Original schema only allowed ('client', 'agent', 'admin').
--   RLS policies (migrations 006, 008, 009) already reference 'super_admin' in their logic
--   but could never be triggered because the constraint blocked the value.
--
-- After this migration:
--   super_admin  — AviaFrame platform-level administrator (replaces ad-hoc 'admin' for root access)
--   admin        — kept for backward compatibility; treated as super_admin by is_super_admin()
--   agent        — agency staff (agency_admin and agency_manager share this role for now)
--   client       — regular end-user (frontend normalizes to 'user')
--
-- Safe: additive only. No existing rows are modified.

-- Drop the existing constraint (name varies by Postgres version / how it was created)
do $$
begin
  -- Try to drop by the standard name; if it doesn't exist, the EXCEPTION block silences it.
  begin
    alter table public.profiles drop constraint profiles_role_check;
  exception when undefined_object then
    null;
  end;

  -- Some older Postgres/Supabase versions name it differently:
  begin
    alter table public.profiles drop constraint "profiles_role_check1";
  exception when undefined_object then
    null;
  end;
end;
$$;

-- Re-add with expanded values
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('client', 'agent', 'admin', 'super_admin'));

-- Update admin_promote_profile_by_email to promote to 'super_admin' instead of 'admin',
-- keeping 'admin' as a legacy alias still accepted by is_super_admin().
create or replace function public.admin_promote_profile_by_email(
  p_email text,
  p_full_name text default null,
  p_phone text default null
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_role text;
  target_row public.profiles%rowtype;
  normalized_email text;
begin
  normalized_email := lower(trim(coalesce(p_email, '')));
  if normalized_email = '' then
    raise exception 'INVALID_EMAIL';
  end if;

  select p.role into actor_role
  from public.profiles p
  where p.id = auth.uid();

  if coalesce(actor_role, '') not in ('admin', 'super_admin') then
    raise exception 'FORBIDDEN';
  end if;

  select *
  into target_row
  from public.profiles p
  where lower(p.email) = normalized_email
  limit 1;

  if not found then
    raise exception 'PROFILE_NOT_FOUND';
  end if;

  update public.profiles p
  set
    role = 'super_admin',
    agency_id = null,
    full_name = case
      when p_full_name is null then p.full_name
      else nullif(trim(p_full_name), '')
    end,
    phone = case
      when p_phone is null then p.phone
      else nullif(trim(p_phone), '')
    end,
    updated_at = now()
  where p.id = target_row.id
  returning * into target_row;

  return target_row;
end;
$$;

grant execute on function public.admin_promote_profile_by_email(text, text, text) to authenticated;
