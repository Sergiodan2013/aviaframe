-- Prevent two ACTIVE pricing plans existing for the same (counterparty, environment)
-- pair. Before this, provisioning a second client for an environment that already
-- had an active plan silently created a duplicate ACTIVE row, which broke pricing
-- lookups for every client under that counterparty+environment (loadActivePricingContext
-- expects exactly one row via .maybeSingle() and errors out on more than one).

-- 1. Hard safety net at the schema level, regardless of which function writes here.
CREATE UNIQUE INDEX IF NOT EXISTS pricing_plans_one_active_per_counterparty_env
  ON public.pricing_plans (counterparty_id, environment)
  WHERE status = 'ACTIVE';

-- 2. Give provision_partner_api_client() a friendly, catchable failure instead of
--    letting a raw unique-violation reach the caller, and default allow_unknown_channel
--    to TRUE since supplier_channel_mappings starts empty and most non-Lufthansa/
--    non-Flynas carriers otherwise classify as UNKNOWN and get silently excluded.
CREATE OR REPLACE FUNCTION public.provision_partner_api_client(p_counterparty_id uuid, p_environment text, p_payload jsonb, p_created_by uuid, p_key_hash text, p_key_prefix text, p_scopes text[])
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_client_id UUID;
  v_entitlement_id UUID;
  v_plan_id UUID;
  v_version_id UUID;
  v_credential_id UUID;
  v_channels TEXT[];
  v_settlement_currency TEXT;
  v_existing_plan_id UUID;
BEGIN
  IF p_environment NOT IN ('sandbox', 'production') THEN
    RAISE EXCEPTION 'invalid environment: %', p_environment;
  END IF;

  SELECT settlement_currency INTO v_settlement_currency
  FROM public.api_counterparties WHERE id = p_counterparty_id;

  IF v_settlement_currency IS NULL THEN
    RAISE EXCEPTION 'counterparty % not found', p_counterparty_id;
  END IF;

  SELECT id INTO v_existing_plan_id
  FROM public.pricing_plans
  WHERE counterparty_id = p_counterparty_id AND environment = p_environment AND status = 'ACTIVE'
  LIMIT 1;

  IF v_existing_plan_id IS NOT NULL THEN
    RAISE EXCEPTION 'ACTIVE_PRICING_PLAN_ALREADY_EXISTS: counterparty % already has an active % pricing plan (%). Provision a new API client via the credentials endpoint on the existing client instead of creating a second one for this environment.',
      p_counterparty_id, p_environment, v_existing_plan_id;
  END IF;

  v_channels := ARRAY(
    SELECT value
    FROM jsonb_array_elements_text(COALESCE(p_payload->'allowed_channels', '["GDS","NDC","LCC"]'::jsonb)) value
  );

  INSERT INTO public.api_clients (
    counterparty_id, name, environment, status, rate_limits, price_visibility
  ) VALUES (
    p_counterparty_id,
    COALESCE(NULLIF(p_payload->>'name', ''), initcap(p_environment) || ' client'),
    p_environment,
    'ACTIVE',
    COALESCE(p_payload->'rate_limits', '{"search_per_minute":20,"price_per_minute":30,"mutations_per_minute":10}'::jsonb),
    COALESCE(NULLIF(p_payload->>'price_visibility', ''), 'TOTAL_ONLY')
  ) RETURNING id INTO v_client_id;

  INSERT INTO public.api_entitlements (
    api_client_id, allowed_operations, allowed_channels, allowed_carriers,
    denied_carriers, allow_unknown_channel
  ) VALUES (
    v_client_id, ARRAY['search','price','create_order','get_order'], v_channels,
    ARRAY[]::TEXT[], ARRAY[]::TEXT[], TRUE
  ) RETURNING id INTO v_entitlement_id;

  INSERT INTO public.pricing_plans (
    counterparty_id, name, environment, status, created_by
  ) VALUES (
    p_counterparty_id,
    COALESCE(NULLIF(p_payload->>'name', ''), initcap(p_environment) || ' client') || ' pricing',
    p_environment, 'ACTIVE', p_created_by
  ) RETURNING id INTO v_plan_id;

  INSERT INTO public.pricing_plan_versions (
    pricing_plan_id, version, status, effective_from, change_note,
    created_by, published_by, published_at
  ) VALUES (
    v_plan_id, 1, 'PUBLISHED', NOW(), 'Initial provisioning',
    p_created_by, p_created_by, NOW()
  ) RETURNING id INTO v_version_id;

  INSERT INTO public.pricing_rules (
    pricing_plan_version_id, channel, carrier_code, action, percent_bps,
    fixed_amount, fixed_currency, fixed_unit, percent_basis, priority, enabled
  ) VALUES (
    v_version_id, 'ANY', 'ANY', 'ALLOW',
    COALESCE((p_payload->>'default_percent_bps')::INTEGER, 0),
    COALESCE((p_payload->>'default_fixed_amount')::NUMERIC, 0),
    COALESCE(NULLIF(p_payload->>'default_fixed_currency', ''), v_settlement_currency, 'SAR'),
    'ORDER', 'SUPPLIER_TOTAL', 0, TRUE
  );

  UPDATE public.pricing_plans SET active_version_id = v_version_id WHERE id = v_plan_id;

  INSERT INTO public.api_credentials (
    api_client_id, name, key_hash, key_prefix, scopes, created_by
  ) VALUES (
    v_client_id, 'Initial ' || p_environment || ' key', p_key_hash, p_key_prefix, p_scopes, p_created_by
  ) RETURNING id INTO v_credential_id;

  RETURN jsonb_build_object(
    'client_id', v_client_id,
    'entitlement_id', v_entitlement_id,
    'pricing_plan_id', v_plan_id,
    'pricing_version_id', v_version_id,
    'credential_id', v_credential_id
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.provision_partner_api_client(uuid, text, jsonb, uuid, text, text, text[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.provision_partner_api_client(uuid, text, jsonb, uuid, text, text, text[]) FROM anon;
REVOKE ALL ON FUNCTION public.provision_partner_api_client(uuid, text, jsonb, uuid, text, text, text[]) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.provision_partner_api_client(uuid, text, jsonb, uuid, text, text, text[]) TO service_role;
