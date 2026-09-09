-- 016_partner_api_foundation.sql
-- Commercial API distribution foundation. Runtime access is server-side only;
-- external consumers never connect to Supabase directly.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.api_counterparties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE SET NULL,
  legal_name TEXT NOT NULL,
  trading_name TEXT,
  country_code TEXT NOT NULL DEFAULT 'SA' CHECK (country_code ~ '^[A-Z]{2}$'),
  tax_number TEXT,
  contract_number TEXT,
  contract_starts_on DATE,
  contract_ends_on DATE,
  settlement_currency TEXT NOT NULL DEFAULT 'SAR' CHECK (settlement_currency ~ '^[A-Z]{3}$'),
  settlement_mode TEXT NOT NULL DEFAULT 'POSTPAID' CHECK (settlement_mode IN ('PREPAID', 'POSTPAID')),
  credit_limit NUMERIC(18,6) NOT NULL DEFAULT 0 CHECK (credit_limit >= 0),
  billing_terms_days INTEGER NOT NULL DEFAULT 0 CHECK (billing_terms_days BETWEEN 0 AND 365),
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SANDBOX', 'ACTIVE', 'SUSPENDED', 'TERMINATED')),
  commercial_contact JSONB NOT NULL DEFAULT '{}'::jsonb,
  technical_contact JSONB NOT NULL DEFAULT '{}'::jsonb,
  finance_contact JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.api_clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  counterparty_id UUID NOT NULL REFERENCES public.api_counterparties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  environment TEXT NOT NULL CHECK (environment IN ('sandbox', 'production')),
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'ACTIVE', 'SUSPENDED', 'REVOKED')),
  rate_limits JSONB NOT NULL DEFAULT '{"search_per_minute":20,"price_per_minute":30,"mutations_per_minute":10}'::jsonb,
  price_visibility TEXT NOT NULL DEFAULT 'TOTAL_ONLY' CHECK (price_visibility IN ('TOTAL_ONLY', 'PUBLIC_BREAKDOWN')),
  last_request_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (counterparty_id, name, environment)
);

CREATE TABLE IF NOT EXISTS public.api_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  api_client_id UUID NOT NULL REFERENCES public.api_clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL,
  scopes TEXT[] NOT NULL DEFAULT ARRAY['offers:read'],
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.api_entitlements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  api_client_id UUID NOT NULL UNIQUE REFERENCES public.api_clients(id) ON DELETE CASCADE,
  allowed_operations TEXT[] NOT NULL DEFAULT ARRAY['search', 'price'],
  allowed_channels TEXT[] NOT NULL DEFAULT ARRAY['GDS', 'NDC', 'LCC'],
  allowed_carriers TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  denied_carriers TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  allow_unknown_channel BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pricing_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  counterparty_id UUID NOT NULL REFERENCES public.api_counterparties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  environment TEXT NOT NULL CHECK (environment IN ('sandbox', 'production')),
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'ACTIVE', 'RETIRED')),
  active_version_id UUID,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (counterparty_id, environment, name)
);

CREATE TABLE IF NOT EXISTS public.pricing_plan_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pricing_plan_id UUID NOT NULL REFERENCES public.pricing_plans(id) ON DELETE CASCADE,
  version INTEGER NOT NULL CHECK (version > 0),
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'VALIDATED', 'PUBLISHED', 'RETIRED')),
  effective_from TIMESTAMPTZ,
  effective_to TIMESTAMPTZ,
  change_note TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  published_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  UNIQUE (pricing_plan_id, version),
  CHECK (effective_to IS NULL OR effective_from IS NULL OR effective_to > effective_from)
);

ALTER TABLE public.pricing_plans
  DROP CONSTRAINT IF EXISTS pricing_plans_active_version_id_fkey;
ALTER TABLE public.pricing_plans
  ADD CONSTRAINT pricing_plans_active_version_id_fkey
  FOREIGN KEY (active_version_id) REFERENCES public.pricing_plan_versions(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.pricing_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pricing_plan_version_id UUID NOT NULL REFERENCES public.pricing_plan_versions(id) ON DELETE CASCADE,
  channel TEXT NOT NULL DEFAULT 'ANY' CHECK (channel IN ('ANY', 'GDS', 'NDC', 'LCC', 'UNKNOWN')),
  carrier_code TEXT NOT NULL DEFAULT 'ANY' CHECK (carrier_code = 'ANY' OR carrier_code ~ '^[A-Z0-9]{2,3}$'),
  action TEXT NOT NULL DEFAULT 'ALLOW' CHECK (action IN ('ALLOW', 'DENY')),
  percent_bps INTEGER CHECK (percent_bps IS NULL OR percent_bps BETWEEN 0 AND 100000),
  fixed_amount NUMERIC(18,6) CHECK (fixed_amount IS NULL OR fixed_amount >= 0),
  fixed_currency TEXT CHECK (fixed_currency IS NULL OR fixed_currency ~ '^[A-Z]{3}$'),
  fixed_unit TEXT CHECK (fixed_unit IS NULL OR fixed_unit IN ('ORDER', 'PASSENGER', 'TICKET')),
  percent_basis TEXT CHECK (percent_basis IS NULL OR percent_basis IN ('SUPPLIER_TOTAL', 'FARE_ONLY', 'FARE_PLUS_SURCHARGES')),
  min_markup NUMERIC(18,6) CHECK (min_markup IS NULL OR min_markup >= 0),
  max_markup NUMERIC(18,6) CHECK (max_markup IS NULL OR max_markup >= 0),
  priority INTEGER NOT NULL DEFAULT 0,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (max_markup IS NULL OR min_markup IS NULL OR max_markup >= min_markup),
  CHECK (fixed_amount IS NULL OR fixed_amount = 0 OR fixed_currency IS NOT NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_pricing_rules_scope_priority
  ON public.pricing_rules (pricing_plan_version_id, channel, carrier_code, priority)
  WHERE enabled = TRUE;

CREATE TABLE IF NOT EXISTS public.supplier_channel_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  upstream_channel TEXT,
  offer_id_prefix TEXT,
  carrier_code TEXT CHECK (carrier_code IS NULL OR carrier_code ~ '^[A-Z0-9]{2,3}$'),
  distribution_channel TEXT NOT NULL CHECK (distribution_channel IN ('GDS', 'NDC', 'LCC')),
  priority INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (upstream_channel IS NOT NULL OR offer_id_prefix IS NOT NULL OR carrier_code IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS public.offer_quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  api_client_id UUID NOT NULL REFERENCES public.api_clients(id) ON DELETE RESTRICT,
  counterparty_id UUID NOT NULL REFERENCES public.api_counterparties(id) ON DELETE RESTRICT,
  environment TEXT NOT NULL CHECK (environment IN ('sandbox', 'production')),
  external_offer_id TEXT NOT NULL,
  external_quote_id TEXT NOT NULL UNIQUE,
  upstream_offer_id TEXT NOT NULL,
  upstream_search_id TEXT,
  normalized_offer JSONB NOT NULL,
  distribution_channel TEXT NOT NULL CHECK (distribution_channel IN ('GDS', 'NDC', 'LCC', 'UNKNOWN')),
  carrier_code TEXT NOT NULL,
  pricing_plan_version_id UUID NOT NULL REFERENCES public.pricing_plan_versions(id) ON DELETE RESTRICT,
  supplier_total NUMERIC(18,6) NOT NULL CHECK (supplier_total > 0),
  markup_total NUMERIC(18,6) NOT NULL CHECK (markup_total >= 0),
  sell_total NUMERIC(18,6) NOT NULL CHECK (sell_total >= supplier_total),
  currency TEXT NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  pricing_rule_trace JSONB NOT NULL DEFAULT '{}'::jsonb,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.api_order_context (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE RESTRICT,
  api_client_id UUID NOT NULL REFERENCES public.api_clients(id) ON DELETE RESTRICT,
  counterparty_id UUID NOT NULL REFERENCES public.api_counterparties(id) ON DELETE RESTRICT,
  external_order_id TEXT NOT NULL UNIQUE,
  client_order_ref TEXT,
  external_quote_id TEXT NOT NULL REFERENCES public.offer_quotes(external_quote_id) ON DELETE RESTRICT,
  pricing_snapshot JSONB NOT NULL,
  supplier_status TEXT,
  reconcile_required BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (api_client_id, client_order_ref)
);

CREATE TABLE IF NOT EXISTS public.api_idempotency_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  api_client_id UUID NOT NULL REFERENCES public.api_clients(id) ON DELETE CASCADE,
  operation TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  response_status INTEGER,
  response_body JSONB,
  locked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  UNIQUE (api_client_id, operation, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_api_clients_counterparty ON public.api_clients(counterparty_id);
CREATE INDEX IF NOT EXISTS idx_api_credentials_client ON public.api_credentials(api_client_id);
CREATE INDEX IF NOT EXISTS idx_pricing_plans_counterparty_env ON public.pricing_plans(counterparty_id, environment, status);
CREATE INDEX IF NOT EXISTS idx_offer_quotes_offer_client ON public.offer_quotes(api_client_id, external_offer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_offer_quotes_expiry ON public.offer_quotes(expires_at);
CREATE INDEX IF NOT EXISTS idx_api_order_context_counterparty ON public.api_order_context(counterparty_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_idempotency_expiry ON public.api_idempotency_records(expires_at);

ALTER TABLE public.api_counterparties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_plan_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_channel_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_order_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_idempotency_records ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.offer_quotes IS 'Immutable commercial quote snapshots; upstream identifiers are server-side only.';
COMMENT ON COLUMN public.offer_quotes.supplier_total IS 'Internal supplier cost; never expose through Partner API.';
COMMENT ON COLUMN public.offer_quotes.pricing_rule_trace IS 'Audit trace of inherited and winning pricing rules.';
