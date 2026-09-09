-- Staging Supabase bootstrap
-- Generated from current repo state on 2026-05-21
-- Safe for fresh staging database bootstrap


-- =====================================================
-- SOURCE: backend/supabase/schema.sql
-- =====================================================

-- Aviaframe Platform - Supabase Schema
-- Generated: 2026-02-02

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- AGENCIES TABLE
-- B2B partners/agencies (создаем первым, т.к. profiles ссылается на него)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.agencies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  domain TEXT UNIQUE, -- e.g., 'agency123' for subdomain/widget
  api_key TEXT UNIQUE NOT NULL, -- For widget authentication
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  country TEXT DEFAULT 'SA', -- ISO 3166-1 alpha-2
  address TEXT,
  logo_url TEXT,
  settings JSONB DEFAULT '{}', -- Custom settings (currency, language, etc.)
  is_active BOOLEAN DEFAULT TRUE,
  commission_rate DECIMAL(5,2) DEFAULT 0.00, -- Percentage (e.g., 5.00 = 5%)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PROFILES TABLE
-- Extended user profiles (linked to auth.users)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  country_code TEXT DEFAULT '+966', -- Default: Saudi Arabia
  avatar_url TEXT,
  role TEXT DEFAULT 'client' CHECK (role IN ('client', 'agent', 'admin')),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ORDERS TABLE
-- Main booking/order records
-- =====================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL, -- e.g., AVF12345678

  -- Relations
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  agency_id UUID REFERENCES public.agencies(id) ON DELETE SET NULL,

  -- DRCT API data
  drct_order_id TEXT UNIQUE, -- From DRCT API after create_order
  offer_id TEXT NOT NULL, -- Original offer_id from search

  -- Flight details (denormalized for quick access)
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  departure_time TEXT,
  arrival_time TEXT,
  airline_code TEXT,
  airline_name TEXT,
  flight_number TEXT,

  -- Pricing
  base_price DECIMAL(10,2) NOT NULL,
  taxes DECIMAL(10,2) DEFAULT 0.00,
  baggage_price DECIMAL(10,2) DEFAULT 0.00,
  total_price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'UAH',

  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',      -- Order created, awaiting payment
    'confirmed',    -- Payment received, booking confirmed
    'ticketed',     -- Tickets issued
    'cancelled',    -- Order cancelled
    'refunded',     -- Refund processed
    'failed'        -- Payment or booking failed
  )),

  -- Contact information
  contact_email TEXT NOT NULL,
  contact_phone TEXT NOT NULL,

  -- Additional data
  payment_method TEXT, -- 'card', 'paypal', etc.
  payment_transaction_id TEXT,
  raw_offer_data JSONB, -- Full offer data from search
  raw_drct_response JSONB, -- Full response from DRCT create_order
  notes TEXT, -- Admin notes

  -- Timestamps
  booked_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PASSENGERS TABLE
-- Passenger details for each order
-- =====================================================
CREATE TABLE IF NOT EXISTS public.passengers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,

  -- Personal information
  gender TEXT CHECK (gender IN ('male', 'female')),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,

  -- Document information
  passport_number TEXT NOT NULL,
  passport_expiry DATE NOT NULL,
  passport_issuing_country TEXT DEFAULT 'SA', -- ISO 3166-1 alpha-2
  nationality TEXT DEFAULT 'SA', -- ISO 3166-1 alpha-2

  -- Travel details
  passenger_type TEXT DEFAULT 'ADT' CHECK (passenger_type IN ('ADT', 'CHD', 'INF')),
  seat_number TEXT,
  baggage_allowance TEXT, -- e.g., '20kg', '30kg', 'none'

  -- Additional data
  special_requests TEXT,
  frequent_flyer_number TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- DRCT_REQUESTS_LOG TABLE
-- Log all DRCT API requests for debugging
-- =====================================================
CREATE TABLE IF NOT EXISTS public.drct_requests_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Request details
  endpoint TEXT NOT NULL, -- e.g., '/offers_search', '/orders/{id}/price'
  method TEXT NOT NULL, -- 'GET', 'POST', 'PATCH', 'DELETE'

  -- Relations
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  agency_id UUID REFERENCES public.agencies(id) ON DELETE SET NULL,

  -- Request/Response data
  request_body JSONB,
  response_body JSONB,
  status_code INTEGER,

  -- Performance
  duration_ms INTEGER, -- Request duration in milliseconds

  -- Error tracking
  error_message TEXT,
  error_code TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- SEARCHES TABLE (existing, but updated)
-- Track all flight searches
-- =====================================================
CREATE TABLE IF NOT EXISTS public.searches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Relations
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  agency_id UUID REFERENCES public.agencies(id) ON DELETE SET NULL,

  -- Search parameters
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  depart_date DATE NOT NULL,
  return_date DATE,
  adults INTEGER DEFAULT 1,
  children INTEGER DEFAULT 0,
  infants INTEGER DEFAULT 0,
  cabin_class TEXT DEFAULT 'economy',

  -- Results
  offers_count INTEGER DEFAULT 0,
  search_duration_ms INTEGER,

  -- Metadata
  source TEXT DEFAULT 'web', -- 'web', 'widget', 'api'
  metadata JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Profiles
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_agency_id ON public.profiles(agency_id);

-- Agencies
CREATE INDEX idx_agencies_domain ON public.agencies(domain);
CREATE INDEX idx_agencies_api_key ON public.agencies(api_key);

-- Orders
CREATE INDEX idx_orders_order_number ON public.orders(order_number);
CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_agency_id ON public.orders(agency_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_drct_order_id ON public.orders(drct_order_id);
CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);

-- Passengers
CREATE INDEX idx_passengers_order_id ON public.passengers(order_id);

-- DRCT Requests Log
CREATE INDEX idx_drct_log_order_id ON public.drct_requests_log(order_id);
CREATE INDEX idx_drct_log_created_at ON public.drct_requests_log(created_at DESC);

-- Searches
CREATE INDEX idx_searches_user_id ON public.searches(user_id);
CREATE INDEX idx_searches_agency_id ON public.searches(agency_id);
CREATE INDEX idx_searches_created_at ON public.searches(created_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passengers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drct_requests_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.searches ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Agencies Policies
CREATE POLICY "Agencies are viewable by authenticated users"
  ON public.agencies FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can modify agencies"
  ON public.agencies FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Orders Policies
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

CREATE POLICY "Users can create own orders"
  ON public.orders FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Agents can update orders in their agency"
  ON public.orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (
        profiles.role = 'admin'
        OR (
          profiles.role = 'agent'
          AND (
            (orders.agency_id IS NOT NULL AND profiles.agency_id = orders.agency_id)
            OR orders.user_id = auth.uid()
          )
        )
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (
        profiles.role = 'admin'
        OR (
          profiles.role = 'agent'
          AND (
            (orders.agency_id IS NOT NULL AND profiles.agency_id = orders.agency_id)
            OR orders.user_id = auth.uid()
          )
        )
      )
    )
  );

-- Passengers Policies
CREATE POLICY "Passengers visible with order access"
  ON public.passengers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = passengers.order_id
      AND (
        orders.user_id = auth.uid()
        OR
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role IN ('agent', 'admin')
          AND profiles.agency_id = orders.agency_id
        )
      )
    )
  );

-- DRCT Requests Log Policies
CREATE POLICY "Only admins can view DRCT logs"
  ON public.drct_requests_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Searches Policies
CREATE POLICY "Users can view own searches"
  ON public.searches FOR SELECT
  USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Anyone can create searches"
  ON public.searches FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agencies_updated_at
  BEFORE UPDATE ON public.agencies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_passengers_updated_at
  BEFORE UPDATE ON public.passengers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function: Generate unique order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  new_order_number TEXT;
  exists_flag BOOLEAN;
BEGIN
  LOOP
    -- Generate: AVF + 8 random digits
    new_order_number := 'AVF' || LPAD(FLOOR(RANDOM() * 100000000)::TEXT, 8, '0');

    -- Check if exists
    SELECT EXISTS(SELECT 1 FROM public.orders WHERE order_number = new_order_number) INTO exists_flag;

    EXIT WHEN NOT exists_flag;
  END LOOP;

  RETURN new_order_number;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SEED DATA (for development)
-- =====================================================

-- Insert demo agency
INSERT INTO public.agencies (id, name, domain, api_key, contact_email, contact_phone, country)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Demo Travel Agency',
  'demo',
  'demo_api_key_12345',
  'demo@aviaframe.com',
  '+966501234567',
  'SA'
) ON CONFLICT DO NOTHING;

-- Insert demo admin profile (will be linked after user signs up)
-- Note: This requires manual linking or auth trigger

-- =====================================================
-- VIEWS (for easier querying)
-- =====================================================

-- View: Orders with passenger count
CREATE OR REPLACE VIEW orders_with_details AS
SELECT
  o.*,
  COUNT(p.id) as passenger_count,
  a.name as agency_name,
  prof.email as user_email,
  prof.full_name as user_full_name
FROM public.orders o
LEFT JOIN public.passengers p ON p.order_id = o.id
LEFT JOIN public.agencies a ON a.id = o.agency_id
LEFT JOIN public.profiles prof ON prof.id = o.user_id
GROUP BY o.id, a.name, prof.email, prof.full_name;

-- Grant access to views
GRANT SELECT ON orders_with_details TO authenticated;


-- =====================================================
-- SOURCE: backend/supabase/migrations/005_invoices_table.sql
-- =====================================================

-- 005_invoices_table.sql
-- Stage 1: superadmin invoices support (non-breaking additive migration)

create table if not exists public.invoices (
  id uuid primary key default uuid_generate_v4(),
  invoice_number text not null unique,
  agency_id uuid not null references public.agencies(id) on delete cascade,
  period_from date not null,
  period_to date not null,
  currency text not null default 'USD',
  subtotal numeric(14,2) not null default 0,
  markup_total numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0,
  status text not null default 'draft' check (status in ('draft', 'issued', 'paid', 'cancelled')),
  bank_details jsonb not null default '{}'::jsonb,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_invoices_agency_id on public.invoices(agency_id);
create index if not exists idx_invoices_status on public.invoices(status);
create index if not exists idx_invoices_created_at on public.invoices(created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_invoices_updated_at on public.invoices;
create trigger trg_invoices_updated_at
before update on public.invoices
for each row execute function public.set_updated_at();

alter table public.invoices enable row level security;

drop policy if exists invoices_select_admin on public.invoices;
create policy invoices_select_admin on public.invoices
for select
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

drop policy if exists invoices_manage_admin on public.invoices;
create policy invoices_manage_admin on public.invoices
for all
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);


-- =====================================================
-- SOURCE: backend/supabase/migrations/006_documents_and_ticket_issuance.sql
-- =====================================================

-- 006_documents_and_ticket_issuance.sql
-- Adds PDF document metadata + ticket issuance records.
-- Also creates private storage bucket for generated PDFs.

create table if not exists public.document_files (
  id uuid primary key default uuid_generate_v4(),
  doc_type text not null check (doc_type in ('invoice_pdf', 'ticket_pdf')),
  entity_type text not null check (entity_type in ('invoice', 'order')),
  entity_id uuid not null,
  agency_id uuid references public.agencies(id) on delete set null,
  order_id uuid references public.orders(id) on delete cascade,
  invoice_id uuid references public.invoices(id) on delete cascade,
  file_name text not null,
  storage_bucket text not null default 'documents',
  storage_path text not null unique,
  content_type text not null default 'application/pdf',
  size_bytes integer,
  checksum_sha256 text,
  status text not null default 'ready' check (status in ('ready', 'failed')),
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_document_files_doc_type on public.document_files(doc_type);
create index if not exists idx_document_files_entity on public.document_files(entity_type, entity_id);
create index if not exists idx_document_files_agency on public.document_files(agency_id);
create index if not exists idx_document_files_order on public.document_files(order_id);
create index if not exists idx_document_files_invoice on public.document_files(invoice_id);

create table if not exists public.ticket_issuances (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  agency_id uuid references public.agencies(id) on delete set null,
  drct_order_id text,
  ticket_number text,
  pnr text,
  issued_at timestamptz,
  status text not null default 'pending' check (status in ('pending', 'issued', 'failed')),
  raw_provider_response jsonb not null default '{}'::jsonb,
  document_id uuid references public.document_files(id) on delete set null,
  email_status text not null default 'pending' check (email_status in ('pending', 'sent', 'failed')),
  email_sent_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_ticket_issuances_agency on public.ticket_issuances(agency_id);
create index if not exists idx_ticket_issuances_status on public.ticket_issuances(status);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_ticket_issuances_updated_at on public.ticket_issuances;
create trigger trg_ticket_issuances_updated_at
before update on public.ticket_issuances
for each row execute function public.set_updated_at();

alter table public.document_files enable row level security;
alter table public.ticket_issuances enable row level security;

-- Admin can manage all docs.
drop policy if exists document_files_admin_all on public.document_files;
create policy document_files_admin_all on public.document_files
for all
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('admin', 'super_admin')
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('admin', 'super_admin')
  )
);

-- Agent can read docs for own agency.
drop policy if exists document_files_agent_read on public.document_files;
create policy document_files_agent_read on public.document_files
for select
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'agent' and p.agency_id = document_files.agency_id
  )
);

-- Client can read docs related to own order.
drop policy if exists document_files_client_read on public.document_files;
create policy document_files_client_read on public.document_files
for select
using (
  exists (
    select 1 from public.orders o
    where o.id = document_files.order_id and o.user_id = auth.uid()
  )
);

-- Ticket issuances: admin full access.
drop policy if exists ticket_issuances_admin_all on public.ticket_issuances;
create policy ticket_issuances_admin_all on public.ticket_issuances
for all
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('admin', 'super_admin')
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('admin', 'super_admin')
  )
);

-- Agent can view/update issuance for own agency.
drop policy if exists ticket_issuances_agent_select on public.ticket_issuances;
create policy ticket_issuances_agent_select on public.ticket_issuances
for select
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'agent' and p.agency_id = ticket_issuances.agency_id
  )
);

drop policy if exists ticket_issuances_agent_update on public.ticket_issuances;
create policy ticket_issuances_agent_update on public.ticket_issuances
for update
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'agent' and p.agency_id = ticket_issuances.agency_id
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'agent' and p.agency_id = ticket_issuances.agency_id
  )
);

-- Create private bucket for generated PDFs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('documents', 'documents', false, 10485760, array['application/pdf'])
on conflict (id) do nothing;


-- =====================================================
-- SOURCE: backend/supabase/migrations/007_one_account_one_agency.sql
-- =====================================================

-- Enforce: one account can be linked to only one agency at a time.
-- Rule: changing profiles.agency_id from one non-null value to another non-null value is blocked.
-- To move account to another agency: set agency_id = NULL first, then set new agency_id.

create or replace function public.prevent_direct_agency_reassignment()
returns trigger
language plpgsql
as $$
begin
  if old.agency_id is not null
     and new.agency_id is not null
     and old.agency_id <> new.agency_id then
    raise exception 'one_account_one_agency: clear agency_id before reassigning profile %', old.id
      using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_direct_agency_reassignment on public.profiles;

create trigger trg_prevent_direct_agency_reassignment
before update of agency_id on public.profiles
for each row
execute function public.prevent_direct_agency_reassignment();


-- =====================================================
-- SOURCE: backend/supabase/migrations/008_admin_super_admin_rpc.sql
-- =====================================================

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


-- =====================================================
-- SOURCE: backend/supabase/migrations/009_super_admin_rls_unification.sql
-- =====================================================

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


-- =====================================================
-- SOURCE: backend/supabase/migrations/010_notification_email_phase1.sql
-- =====================================================

-- 010_notification_email_phase1.sql
-- Phase 1 foundation for notification/email service.

create extension if not exists "uuid-ossp";

create table if not exists public.notification_events (
  id uuid primary key default uuid_generate_v4(),
  event_type text not null,
  entity_type text,
  entity_id text,
  agency_id uuid references public.agencies(id) on delete set null,
  recipient_email text,
  recipient_role text,
  template_key text,
  payload jsonb not null default '{}'::jsonb,
  idempotency_key text not null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'processed', 'failed', 'ignored')),
  error text,
  occurred_at timestamptz not null default now(),
  processed_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(event_type, idempotency_key)
);

create index if not exists idx_notification_events_status_created on public.notification_events(status, created_at);
create index if not exists idx_notification_events_event_type on public.notification_events(event_type);
create index if not exists idx_notification_events_agency_id on public.notification_events(agency_id);

create table if not exists public.email_templates (
  id uuid primary key default uuid_generate_v4(),
  template_key text not null,
  locale text not null default 'en',
  version integer not null default 1,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  subject text not null,
  html_body text not null,
  text_body text,
  variables jsonb not null default '[]'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(template_key, locale, version)
);

create index if not exists idx_email_templates_lookup on public.email_templates(template_key, locale, status, version desc);

create table if not exists public.notification_rules (
  id uuid primary key default uuid_generate_v4(),
  event_type text not null,
  audience text not null default 'client',
  channel text not null default 'email' check (channel in ('email')),
  enabled boolean not null default true,
  template_key text not null,
  recipient_strategy text not null default 'payload_email',
  filters jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(event_type, audience, channel, template_key)
);

create index if not exists idx_notification_rules_event_enabled on public.notification_rules(event_type, enabled);

create table if not exists public.email_outbox (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid references public.notification_events(id) on delete set null,
  to_email text not null,
  template_key text,
  subject text,
  provider text,
  provider_message_id text,
  status text not null default 'queued' check (status in ('queued', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'failed')),
  attempt_count integer not null default 0,
  payload jsonb not null default '{}'::jsonb,
  last_error text,
  sent_at timestamptz,
  delivered_at timestamptz,
  failed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_email_outbox_status_created on public.email_outbox(status, created_at);
create index if not exists idx_email_outbox_provider_message on public.email_outbox(provider_message_id);
create index if not exists idx_email_outbox_event_id on public.email_outbox(event_id);

create table if not exists public.email_events (
  id uuid primary key default uuid_generate_v4(),
  outbox_id uuid not null references public.email_outbox(id) on delete cascade,
  provider text not null,
  provider_event text not null,
  provider_message_id text,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_email_events_outbox_id on public.email_events(outbox_id);
create index if not exists idx_email_events_provider_message on public.email_events(provider_message_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_notification_events_updated_at on public.notification_events;
create trigger trg_notification_events_updated_at
before update on public.notification_events
for each row execute function public.set_updated_at();

drop trigger if exists trg_email_templates_updated_at on public.email_templates;
create trigger trg_email_templates_updated_at
before update on public.email_templates
for each row execute function public.set_updated_at();

drop trigger if exists trg_notification_rules_updated_at on public.notification_rules;
create trigger trg_notification_rules_updated_at
before update on public.notification_rules
for each row execute function public.set_updated_at();

drop trigger if exists trg_email_outbox_updated_at on public.email_outbox;
create trigger trg_email_outbox_updated_at
before update on public.email_outbox
for each row execute function public.set_updated_at();

alter table public.notification_events enable row level security;
alter table public.email_templates enable row level security;
alter table public.notification_rules enable row level security;
alter table public.email_outbox enable row level security;
alter table public.email_events enable row level security;

-- Admin/super-admin full access.
drop policy if exists notification_events_admin_all on public.notification_events;
create policy notification_events_admin_all on public.notification_events
for all
using (public.is_super_admin(auth.uid()))
with check (public.is_super_admin(auth.uid()));

drop policy if exists email_templates_admin_all on public.email_templates;
create policy email_templates_admin_all on public.email_templates
for all
using (public.is_super_admin(auth.uid()))
with check (public.is_super_admin(auth.uid()));

drop policy if exists notification_rules_admin_all on public.notification_rules;
create policy notification_rules_admin_all on public.notification_rules
for all
using (public.is_super_admin(auth.uid()))
with check (public.is_super_admin(auth.uid()));

drop policy if exists email_outbox_admin_all on public.email_outbox;
create policy email_outbox_admin_all on public.email_outbox
for all
using (public.is_super_admin(auth.uid()))
with check (public.is_super_admin(auth.uid()));

drop policy if exists email_events_admin_all on public.email_events;
create policy email_events_admin_all on public.email_events
for all
using (public.is_super_admin(auth.uid()))
with check (public.is_super_admin(auth.uid()));

-- Agent read-only access for own agency events/outbox.
drop policy if exists notification_events_agent_select on public.notification_events;
create policy notification_events_agent_select on public.notification_events
for select
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'agent'
      and p.agency_id = notification_events.agency_id
  )
);

drop policy if exists email_outbox_agent_select on public.email_outbox;
create policy email_outbox_agent_select on public.email_outbox
for select
using (
  exists (
    select 1
    from public.notification_events ne
    join public.profiles p on p.id = auth.uid()
    where ne.id = email_outbox.event_id
      and p.role = 'agent'
      and p.agency_id = ne.agency_id
  )
);

drop policy if exists email_events_agent_select on public.email_events;
create policy email_events_agent_select on public.email_events
for select
using (
  exists (
    select 1
    from public.email_outbox eo
    join public.notification_events ne on ne.id = eo.event_id
    join public.profiles p on p.id = auth.uid()
    where eo.id = email_events.outbox_id
      and p.role = 'agent'
      and p.agency_id = ne.agency_id
  )
);

-- Seed minimal templates for Phase 1.
insert into public.email_templates (template_key, locale, version, status, subject, html_body, text_body, variables)
values
  (
    'booking_created',
    'en',
    1,
    'published',
    'Booking {{order_number}} created',
    '<p>Your booking <strong>{{order_number}}</strong> was created and is awaiting payment.</p>',
    'Your booking {{order_number}} was created and is awaiting payment.',
    '["order_number","total_price","currency"]'::jsonb
  ),
  (
    'payment_confirmed',
    'en',
    1,
    'published',
    'Payment confirmed for {{order_number}}',
    '<p>Payment for booking <strong>{{order_number}}</strong> is confirmed.</p>',
    'Payment for booking {{order_number}} is confirmed.',
    '["order_number"]'::jsonb
  ),
  (
    'ticket_issued',
    'en',
    1,
    'published',
    'Ticket issued for {{order_number}}',
    '<p>Your ticket for booking <strong>{{order_number}}</strong> has been issued.</p>',
    'Your ticket for booking {{order_number}} has been issued.',
    '["order_number","pnr","ticket_number"]'::jsonb
  ),
  (
    'agency_invite_activation',
    'en',
    1,
    'published',
    'Activate your agency account',
    '<p>Please activate your agency account using this link: {{activation_link}}</p>',
    'Please activate your agency account using this link: {{activation_link}}',
    '["activation_link","agency_name"]'::jsonb
  )
on conflict (template_key, locale, version) do nothing;



-- =====================================================
-- SOURCE: backend/supabase/migrations/011_expand_roles.sql
-- =====================================================

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



-- =====================================================
-- STAGING ADDON: idempotency_keys (safe variant for current schema)
-- =====================================================
create extension if not exists "pgcrypto";

do $$
begin
  if not exists (select 1 from pg_type where typname = 'idempotency_status') then
    create type public.idempotency_status as enum ('pending', 'completed', 'failed');
  end if;
end $$;

create table if not exists public.idempotency_keys (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  idempotency_key varchar(255) not null,
  operation varchar(255) not null,
  status public.idempotency_status not null default 'pending',
  response_http_status integer,
  response_body jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  expires_at timestamptz not null,
  constraint idempotency_key_length check (char_length(idempotency_key) >= 8)
);

create unique index if not exists idx_idempotency_keys_agency_key
on public.idempotency_keys(agency_id, idempotency_key)
where status = 'completed';

create index if not exists idx_idempotency_keys_agency_created
on public.idempotency_keys(agency_id, created_at desc);

create index if not exists idx_idempotency_keys_expires
on public.idempotency_keys(expires_at)
where status in ('completed', 'failed');

alter table public.idempotency_keys enable row level security;

drop policy if exists idempotency_keys_select_own_agency on public.idempotency_keys;
create policy idempotency_keys_select_own_agency
  on public.idempotency_keys for select to authenticated
  using (
    public.is_super_admin(auth.uid())
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.agency_id = idempotency_keys.agency_id
    )
  );

drop policy if exists idempotency_keys_service_write on public.idempotency_keys;
create policy idempotency_keys_service_write on public.idempotency_keys
  for insert with check (true);

drop policy if exists idempotency_keys_service_update on public.idempotency_keys;
create policy idempotency_keys_service_update on public.idempotency_keys
  for update using (true) with check (true);


-- =====================================================
-- STAGING ADDON: Tamara payment provider support (safe variant)
-- =====================================================
alter table public.orders
  add column if not exists payment_provider text,
  add column if not exists payment_provider_order_id text,
  add column if not exists payment_provider_status text,
  add column if not exists payment_authorised_at timestamptz,
  add column if not exists payment_captured_at timestamptz,
  add column if not exists payment_cancelled_at timestamptz,
  add column if not exists payment_refunded_at timestamptz,
  add column if not exists payment_reference text;

create index if not exists idx_orders_payment_provider_order_id
  on public.orders (payment_provider_order_id)
  where payment_provider_order_id is not null;

create table if not exists public.payment_provider_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_event_id text,
  provider_order_id text not null,
  event_type text not null,
  event_status text,
  payload_json jsonb,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_ppe_provider_event_id
  on public.payment_provider_events (provider, provider_order_id, event_type, event_status)
  where provider_event_id is null;

create unique index if not exists idx_ppe_provider_event_id_unique
  on public.payment_provider_events (provider, provider_event_id)
  where provider_event_id is not null;

create index if not exists idx_ppe_provider_order_id
  on public.payment_provider_events (provider_order_id);

create table if not exists public.payment_provider_operations (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete set null,
  provider text not null,
  operation_type text not null,
  request_json jsonb,
  response_json jsonb,
  provider_reference text,
  success boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_ppo_order_id on public.payment_provider_operations (order_id);
create index if not exists idx_ppo_provider_order on public.payment_provider_operations (provider, operation_type);

alter table public.payment_provider_events enable row level security;
alter table public.payment_provider_operations enable row level security;

drop policy if exists service_role_all_ppe on public.payment_provider_events;
create policy service_role_all_ppe
  on public.payment_provider_events for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists service_role_all_ppo on public.payment_provider_operations;
create policy service_role_all_ppo
  on public.payment_provider_operations for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
