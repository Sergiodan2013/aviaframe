-- Admin/Super-admin profile management RPC for frontend-only deploys
-- Safe with RLS via SECURITY DEFINER.

create or replace function public.admin_list_super_admin_profiles()
returns table (
  id uuid,
  email text,
  full_name text,
  phone text,
  role text,
  agency_id uuid,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_role text;
begin
  select p.role into actor_role
  from public.profiles p
  where p.id = auth.uid();

  if coalesce(actor_role, '') not in ('admin', 'super_admin') then
    raise exception 'FORBIDDEN';
  end if;

  return query
  select p.id, p.email, p.full_name, p.phone, p.role, p.agency_id, p.created_at, p.updated_at
  from public.profiles p
  where p.role in ('admin', 'super_admin')
  order by p.updated_at desc nulls last;
end;
$$;

grant execute on function public.admin_list_super_admin_profiles() to authenticated;

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
    role = 'admin',
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
