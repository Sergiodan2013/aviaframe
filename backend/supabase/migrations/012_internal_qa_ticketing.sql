-- 012_internal_qa_ticketing.sql
-- Internal-only QA ticket issuance register for controlled DRCT production tests without public payment flow.

create table if not exists public.internal_qa_ticket_runs (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references public.orders(id) on delete cascade,
  agency_id uuid not null references public.agencies(id) on delete cascade,
  drct_order_id text,
  status text not null default 'requested' check (status in ('requested', 'issued', 'cancelled', 'failed')),
  requested_by uuid references public.profiles(id) on delete set null,
  requested_by_email text,
  request_origin_host text,
  request_ip text,
  reason text,
  pnr text,
  ticket_number text,
  issued_at timestamptz,
  void_deadline_at timestamptz,
  cancelled_at timestamptz,
  cancelled_by uuid references public.profiles(id) on delete set null,
  cancel_reason text,
  issue_result jsonb not null default '{}'::jsonb,
  cancel_result jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_internal_qa_ticket_runs_order on public.internal_qa_ticket_runs(order_id);
create index if not exists idx_internal_qa_ticket_runs_agency on public.internal_qa_ticket_runs(agency_id);
create index if not exists idx_internal_qa_ticket_runs_status on public.internal_qa_ticket_runs(status);
create index if not exists idx_internal_qa_ticket_runs_deadline on public.internal_qa_ticket_runs(void_deadline_at);

create unique index if not exists idx_internal_qa_ticket_runs_order_active
on public.internal_qa_ticket_runs(order_id)
where status in ('requested', 'issued');

drop trigger if exists trg_internal_qa_ticket_runs_updated_at on public.internal_qa_ticket_runs;
create trigger trg_internal_qa_ticket_runs_updated_at
before update on public.internal_qa_ticket_runs
for each row execute function public.set_updated_at();

alter table public.internal_qa_ticket_runs enable row level security;

drop policy if exists internal_qa_ticket_runs_admin_all on public.internal_qa_ticket_runs;
create policy internal_qa_ticket_runs_admin_all on public.internal_qa_ticket_runs
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
