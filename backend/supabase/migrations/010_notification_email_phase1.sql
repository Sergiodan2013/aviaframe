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

