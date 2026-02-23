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
