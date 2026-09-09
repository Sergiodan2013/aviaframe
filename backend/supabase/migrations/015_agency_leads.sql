-- Public agency applications are accepted only by the backend service role.
-- No browser role can read lead data or submit rows directly.

create table if not exists public.agency_leads (
  id uuid primary key default uuid_generate_v4(),
  agency_name text not null,
  supervisor_name text not null,
  contact_email text not null,
  contact_phone text not null,
  country text not null,
  subdomain text not null,
  services jsonb not null default '[]'::jsonb,
  form_data jsonb not null default '{}'::jsonb,
  source text not null default 'agency-onboard',
  status text not null default 'new' check (status in ('new', 'reviewing', 'contacted', 'qualified', 'won', 'lost', 'spam')),
  notification_status text not null default 'pending' check (notification_status in ('pending', 'sent', 'failed')),
  notification_error text,
  notified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_agency_leads_status_created on public.agency_leads(status, created_at desc);
create index if not exists idx_agency_leads_contact_email on public.agency_leads(lower(contact_email));

alter table public.agency_leads enable row level security;

drop policy if exists agency_leads_super_admin_all on public.agency_leads;
create policy agency_leads_super_admin_all on public.agency_leads
for all
using (public.is_super_admin(auth.uid()))
with check (public.is_super_admin(auth.uid()));

drop trigger if exists trg_agency_leads_updated_at on public.agency_leads;
create trigger trg_agency_leads_updated_at
before update on public.agency_leads
for each row execute function public.set_updated_at();
