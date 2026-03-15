-- Agency subscription & pricing fields
-- Run in Supabase Dashboard → SQL Editor

ALTER TABLE public.agencies
  ADD COLUMN IF NOT EXISTS moyasar_customer_id    text,
  ADD COLUMN IF NOT EXISTS subscription_status   text    NOT NULL DEFAULT 'trial',
  ADD COLUMN IF NOT EXISTS subscription_plan     text    NOT NULL DEFAULT 'basic',
  ADD COLUMN IF NOT EXISTS next_billing_date     timestamptz,
  ADD COLUMN IF NOT EXISTS trial_ends_at         timestamptz;

-- settings JSONB already exists — markup stored there:
-- { "markup_type": "percent"|"fixed", "markup_value": 8 }

COMMENT ON COLUMN public.agencies.moyasar_customer_id  IS 'Moyasar recurring payment customer token (card stored at Moyasar, not here)';
COMMENT ON COLUMN public.agencies.subscription_status  IS 'trial | active | past_due | cancelled';
COMMENT ON COLUMN public.agencies.subscription_plan    IS 'basic | pro';
COMMENT ON COLUMN public.agencies.next_billing_date    IS 'Next monthly SaaS charge date';
COMMENT ON COLUMN public.agencies.trial_ends_at        IS 'End of free trial period';
