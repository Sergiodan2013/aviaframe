-- 009_super_admin_rls_unification.sql
-- Goal: make super_admin rights first-class across RLS and keep admin compatibility.
-- Safe, additive migration: drops/recreates only affected policies/functions.

-- =====================================================
-- Helpers
-- =====================================================

create or replace function public.is_super_admin(user_uuid uuid)
returns boolean
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  return exists (
    select 1
    from public.profiles p
    where p.id = user_uuid
      and p.role in ('admin', 'super_admin')
  );
end;
$$;

create or replace function public.has_agency_access(user_uuid uuid, order_agency_id uuid)
returns boolean
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  return exists (
    select 1
    from public.profiles p
    where p.id = user_uuid
      and (
        p.role in ('admin', 'super_admin')
        or (p.role = 'agent' and p.agency_id = order_agency_id)
      )
  );
end;
$$;

grant execute on function public.is_super_admin(uuid) to authenticated;
grant execute on function public.has_agency_access(uuid, uuid) to authenticated;

-- =====================================================
-- Profiles policies
-- =====================================================

drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists profiles_admin_read_all on public.profiles;
drop policy if exists profiles_admin_update_all on public.profiles;

create policy profiles_select_own
  on public.profiles
  for select
  using (auth.uid() = id);

create policy profiles_update_own
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy profiles_select_admin_super_admin
  on public.profiles
  for select
  using (public.is_super_admin(auth.uid()));

create policy profiles_update_admin_super_admin
  on public.profiles
  for update
  using (public.is_super_admin(auth.uid()))
  with check (public.is_super_admin(auth.uid()));

-- =====================================================
-- Agencies policies
-- =====================================================

drop policy if exists "Agencies are viewable by authenticated users" on public.agencies;
drop policy if exists "Only admins can modify agencies" on public.agencies;
drop policy if exists agencies_select_authenticated on public.agencies;
drop policy if exists agencies_manage_admin_super_admin on public.agencies;
drop policy if exists agencies_update_own_agent on public.agencies;

create policy agencies_select_authenticated
  on public.agencies
  for select
  to authenticated
  using (true);

create policy agencies_manage_admin_super_admin
  on public.agencies
  for all
  using (public.is_super_admin(auth.uid()))
  with check (public.is_super_admin(auth.uid()));

create policy agencies_update_own_agent
  on public.agencies
  for update
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'agent'
        and p.agency_id = agencies.id
    )
  )
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'agent'
        and p.agency_id = agencies.id
    )
  );

-- =====================================================
-- Orders policies
-- =====================================================

drop policy if exists "Users can view own orders" on public.orders;
drop policy if exists "Users can create own orders" on public.orders;
drop policy if exists "Agents can update orders in their agency" on public.orders;
drop policy if exists "Agents can delete orders in their agency" on public.orders;
drop policy if exists super_admin_view_all_orders on public.orders;
drop policy if exists users_view_own_orders on public.orders;
drop policy if exists agents_view_agency_orders on public.orders;
drop policy if exists users_create_own_orders on public.orders;
drop policy if exists super_admin_update_all_orders on public.orders;
drop policy if exists agents_update_agency_orders on public.orders;
drop policy if exists super_admin_delete_all_orders on public.orders;
drop policy if exists agents_delete_agency_orders on public.orders;

create policy orders_select_admin_super_admin
  on public.orders
  for select
  using (public.is_super_admin(auth.uid()));

create policy orders_select_own
  on public.orders
  for select
  using (user_id = auth.uid());

create policy orders_select_agent_agency
  on public.orders
  for select
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'agent'
        and p.agency_id = orders.agency_id
    )
  );

create policy orders_insert_own
  on public.orders
  for insert
  with check (user_id = auth.uid());

create policy orders_update_admin_super_admin
  on public.orders
  for update
  using (public.is_super_admin(auth.uid()))
  with check (public.is_super_admin(auth.uid()));

create policy orders_update_agent_agency
  on public.orders
  for update
  using (public.has_agency_access(auth.uid(), orders.agency_id))
  with check (public.has_agency_access(auth.uid(), orders.agency_id));

create policy orders_delete_admin_super_admin
  on public.orders
  for delete
  using (public.is_super_admin(auth.uid()));

create policy orders_delete_agent_agency
  on public.orders
  for delete
  using (public.has_agency_access(auth.uid(), orders.agency_id));

-- =====================================================
-- Passengers policies
-- =====================================================

drop policy if exists "Passengers visible with order access" on public.passengers;
drop policy if exists super_admin_view_all_passengers on public.passengers;
drop policy if exists users_view_order_passengers on public.passengers;
drop policy if exists super_admin_manage_all_passengers on public.passengers;
drop policy if exists users_manage_order_passengers on public.passengers;

create policy passengers_select_admin_super_admin
  on public.passengers
  for select
  using (public.is_super_admin(auth.uid()));

create policy passengers_select_order_access
  on public.passengers
  for select
  using (
    exists (
      select 1
      from public.orders o
      where o.id = passengers.order_id
        and (
          o.user_id = auth.uid()
          or public.has_agency_access(auth.uid(), o.agency_id)
        )
    )
  );

create policy passengers_manage_admin_super_admin
  on public.passengers
  for all
  using (public.is_super_admin(auth.uid()))
  with check (public.is_super_admin(auth.uid()));

create policy passengers_manage_own_order
  on public.passengers
  for all
  using (
    exists (
      select 1
      from public.orders o
      where o.id = passengers.order_id
        and o.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.orders o
      where o.id = passengers.order_id
        and o.user_id = auth.uid()
    )
  );

-- =====================================================
-- DRCT logs policies
-- =====================================================

drop policy if exists "Only admins can view DRCT logs" on public.drct_requests_log;
drop policy if exists drct_logs_admin_super_admin_select on public.drct_requests_log;

create policy drct_logs_admin_super_admin_select
  on public.drct_requests_log
  for select
  using (public.is_super_admin(auth.uid()));

-- =====================================================
-- Invoices policies (guarded: table may not exist in old envs)
-- =====================================================

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'invoices'
  ) then
    execute 'drop policy if exists invoices_select_admin on public.invoices';
    execute 'drop policy if exists invoices_manage_admin on public.invoices';
    execute 'drop policy if exists invoices_select_admin_super_admin on public.invoices';
    execute 'drop policy if exists invoices_manage_admin_super_admin on public.invoices';

    execute $sql$
      create policy invoices_select_admin_super_admin
        on public.invoices
        for select
        using (public.is_super_admin(auth.uid()))
    $sql$;

    execute $sql$
      create policy invoices_manage_admin_super_admin
        on public.invoices
        for all
        using (public.is_super_admin(auth.uid()))
        with check (public.is_super_admin(auth.uid()))
    $sql$;
  end if;
end $$;
