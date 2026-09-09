-- 018_partner_api_admin.sql
-- Atomic super-admin provisioning and immutable pricing publication.

CREATE OR REPLACE FUNCTION public.provision_partner_api_counterparty(
  p_payload JSONB,
  p_created_by UUID,
  p_key_hash TEXT,
  p_key_prefix TEXT,
  p_scopes TEXT[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_counterparty_id UUID;
  v_client_id UUID;
  v_entitlement_id UUID;
  v_plan_id UUID;
  v_version_id UUID;
  v_credential_id UUID;
  v_channels TEXT[];
BEGIN
  v_channels := ARRAY(
    SELECT value
    FROM jsonb_array_elements_text(COALESCE(p_payload->'allowed_channels', '["GDS","NDC","LCC"]'::jsonb)) value
  );

  INSERT INTO public.api_counterparties (
    legal_name, trading_name, country_code, tax_number, contract_number,
    contract_starts_on, contract_ends_on, settlement_currency, settlement_mode,
    credit_limit, billing_terms_days, status, commercial_contact,
    technical_contact, finance_contact, created_by
  ) VALUES (
    p_payload->>'legal_name', NULLIF(p_payload->>'trading_name', ''),
    COALESCE(NULLIF(p_payload->>'country_code', ''), 'SA'), NULLIF(p_payload->>'tax_number', ''),
    NULLIF(p_payload->>'contract_number', ''), NULLIF(p_payload->>'contract_starts_on', '')::DATE,
    NULLIF(p_payload->>'contract_ends_on', '')::DATE,
    COALESCE(NULLIF(p_payload->>'settlement_currency', ''), 'SAR'),
    COALESCE(NULLIF(p_payload->>'settlement_mode', ''), 'POSTPAID'),
    COALESCE((p_payload->>'credit_limit')::NUMERIC, 0),
    COALESCE((p_payload->>'billing_terms_days')::INTEGER, 0),
    'SANDBOX', COALESCE(p_payload->'commercial_contact', '{}'::jsonb),
    COALESCE(p_payload->'technical_contact', '{}'::jsonb),
    COALESCE(p_payload->'finance_contact', '{}'::jsonb), p_created_by
  ) RETURNING id INTO v_counterparty_id;

  INSERT INTO public.api_clients (
    counterparty_id, name, environment, status, rate_limits, price_visibility
  ) VALUES (
    v_counterparty_id, 'Default sandbox', 'sandbox', 'ACTIVE',
    COALESCE(p_payload->'rate_limits', '{"search_per_minute":20,"price_per_minute":30,"mutations_per_minute":10}'::jsonb),
    'TOTAL_ONLY'
  ) RETURNING id INTO v_client_id;

  INSERT INTO public.api_entitlements (
    api_client_id, allowed_operations, allowed_channels, allowed_carriers,
    denied_carriers, allow_unknown_channel
  ) VALUES (
    v_client_id, ARRAY['search','price','create_order','get_order'], v_channels,
    ARRAY[]::TEXT[], ARRAY[]::TEXT[], FALSE
  ) RETURNING id INTO v_entitlement_id;

  INSERT INTO public.pricing_plans (
    counterparty_id, name, environment, status, created_by
  ) VALUES (
    v_counterparty_id, 'Default sandbox pricing', 'sandbox', 'ACTIVE', p_created_by
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
    COALESCE(NULLIF(p_payload->>'default_fixed_currency', ''), NULLIF(p_payload->>'settlement_currency', ''), 'SAR'),
    'ORDER', 'SUPPLIER_TOTAL', 0, TRUE
  );

  UPDATE public.pricing_plans SET active_version_id = v_version_id WHERE id = v_plan_id;

  INSERT INTO public.api_credentials (
    api_client_id, name, key_hash, key_prefix, scopes, created_by
  ) VALUES (
    v_client_id, 'Initial sandbox key', p_key_hash, p_key_prefix, p_scopes, p_created_by
  ) RETURNING id INTO v_credential_id;

  RETURN jsonb_build_object(
    'counterparty_id', v_counterparty_id,
    'client_id', v_client_id,
    'entitlement_id', v_entitlement_id,
    'pricing_plan_id', v_plan_id,
    'pricing_version_id', v_version_id,
    'credential_id', v_credential_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.publish_partner_pricing_version(
  p_counterparty_id UUID,
  p_environment TEXT,
  p_rules JSONB,
  p_change_note TEXT,
  p_actor_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan public.pricing_plans%ROWTYPE;
  v_version_id UUID;
  v_version INTEGER;
  v_rule JSONB;
BEGIN
  SELECT * INTO v_plan
  FROM public.pricing_plans
  WHERE counterparty_id = p_counterparty_id
    AND environment = p_environment
    AND status = 'ACTIVE'
  ORDER BY created_at ASC
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'ACTIVE_PRICING_PLAN_NOT_FOUND'; END IF;
  IF jsonb_typeof(p_rules) <> 'array' OR jsonb_array_length(p_rules) = 0 THEN
    RAISE EXCEPTION 'PRICING_RULES_REQUIRED';
  END IF;

  SELECT COALESCE(MAX(version), 0) + 1 INTO v_version
  FROM public.pricing_plan_versions
  WHERE pricing_plan_id = v_plan.id;

  INSERT INTO public.pricing_plan_versions (
    pricing_plan_id, version, status, effective_from, change_note,
    created_by, published_by, published_at
  ) VALUES (
    v_plan.id, v_version, 'PUBLISHED', NOW(), NULLIF(p_change_note, ''),
    p_actor_id, p_actor_id, NOW()
  ) RETURNING id INTO v_version_id;

  FOR v_rule IN SELECT value FROM jsonb_array_elements(p_rules)
  LOOP
    INSERT INTO public.pricing_rules (
      pricing_plan_version_id, channel, carrier_code, action, percent_bps,
      fixed_amount, fixed_currency, fixed_unit, percent_basis,
      min_markup, max_markup, priority, enabled
    ) VALUES (
      v_version_id,
      COALESCE(NULLIF(v_rule->>'channel', ''), 'ANY'),
      COALESCE(NULLIF(v_rule->>'carrier_code', ''), 'ANY'),
      COALESCE(NULLIF(v_rule->>'action', ''), 'ALLOW'),
      COALESCE((v_rule->>'percent_bps')::INTEGER, 0),
      COALESCE((v_rule->>'fixed_amount')::NUMERIC, 0),
      NULLIF(v_rule->>'fixed_currency', ''),
      COALESCE(NULLIF(v_rule->>'fixed_unit', ''), 'ORDER'),
      COALESCE(NULLIF(v_rule->>'percent_basis', ''), 'SUPPLIER_TOTAL'),
      NULLIF(v_rule->>'min_markup', '')::NUMERIC,
      NULLIF(v_rule->>'max_markup', '')::NUMERIC,
      COALESCE((v_rule->>'priority')::INTEGER, 0), TRUE
    );
  END LOOP;

  UPDATE public.pricing_plan_versions
  SET status = 'RETIRED', effective_to = NOW()
  WHERE id = v_plan.active_version_id AND id <> v_version_id;

  UPDATE public.pricing_plans
  SET active_version_id = v_version_id, updated_at = NOW()
  WHERE id = v_plan.id;

  RETURN jsonb_build_object(
    'pricing_plan_id', v_plan.id,
    'pricing_version_id', v_version_id,
    'version', v_version,
    'rule_count', jsonb_array_length(p_rules)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.provision_partner_api_counterparty(JSONB, UUID, TEXT, TEXT, TEXT[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.publish_partner_pricing_version(UUID, TEXT, JSONB, TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.provision_partner_api_counterparty(JSONB, UUID, TEXT, TEXT, TEXT[]) TO service_role;
GRANT EXECUTE ON FUNCTION public.publish_partner_pricing_version(UUID, TEXT, JSONB, TEXT, UUID) TO service_role;
