'use strict';

function throwDatabaseError(error, operation) {
  if (!error) return;
  const wrapped = new Error(`Partner API database operation failed: ${operation}`);
  wrapped.code = 'PARTNER_DATABASE_ERROR';
  wrapped.cause = error;
  throw wrapped;
}

function createPartnerRepository(supabase) {
  return {
    async loadActivePricingContext({ counterpartyId, environment }) {
      const { data: plan, error: planError } = await supabase
        .from('pricing_plans')
        .select('id,active_version_id,name')
        .eq('counterparty_id', counterpartyId)
        .eq('environment', environment)
        .eq('status', 'ACTIVE')
        .maybeSingle();
      throwDatabaseError(planError, 'load pricing plan');
      if (!plan?.active_version_id) return null;

      const { data: version, error: versionError } = await supabase
        .from('pricing_plan_versions')
        .select('id,pricing_plan_id,version,status,effective_from,effective_to')
        .eq('id', plan.active_version_id)
        .eq('pricing_plan_id', plan.id)
        .eq('status', 'PUBLISHED')
        .maybeSingle();
      throwDatabaseError(versionError, 'load pricing plan version');
      if (!version) return null;
      const now = Date.now();
      if (version.effective_from && new Date(version.effective_from).getTime() > now) return null;
      if (version.effective_to && new Date(version.effective_to).getTime() <= now) return null;

      const { data: rules, error: rulesError } = await supabase
        .from('pricing_rules')
        .select('id,channel,carrier_code,action,percent_bps,fixed_amount,fixed_currency,fixed_unit,percent_basis,min_markup,max_markup,priority,enabled')
        .eq('pricing_plan_version_id', version.id)
        .eq('enabled', true);
      throwDatabaseError(rulesError, 'load pricing rules');

      return { plan, version, rules: rules || [] };
    },

    async loadEntitlements(apiClientId) {
      const { data, error } = await supabase
        .from('api_entitlements')
        .select('allowed_operations,allowed_channels,allowed_carriers,denied_carriers,allow_unknown_channel')
        .eq('api_client_id', apiClientId)
        .maybeSingle();
      throwDatabaseError(error, 'load API entitlements');
      return data;
    },

    async listChannelMappings() {
      const { data, error } = await supabase
        .from('supplier_channel_mappings')
        .select('id,upstream_channel,offer_id_prefix,carrier_code,distribution_channel,priority,is_active')
        .eq('is_active', true);
      throwDatabaseError(error, 'load channel mappings');
      return data || [];
    },

    async insertOfferQuotes(rows) {
      const { error } = await supabase.from('offer_quotes').insert(rows);
      throwDatabaseError(error, 'insert offer quotes');
    },

    async findLatestOfferQuote({ apiClientId, externalOfferId }) {
      const { data, error } = await supabase
        .from('offer_quotes')
        .select('*')
        .eq('api_client_id', apiClientId)
        .eq('external_offer_id', externalOfferId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      throwDatabaseError(error, 'load offer quote');
      return data;
    },

    async findOfferQuoteByExternalId({ apiClientId, externalQuoteId }) {
      const { data, error } = await supabase
        .from('offer_quotes')
        .select('*')
        .eq('api_client_id', apiClientId)
        .eq('external_quote_id', externalQuoteId)
        .maybeSingle();
      throwDatabaseError(error, 'load price quote');
      return data;
    },

    async claimIdempotencyRecord({ apiClientId, operation, idempotencyKey, requestHash }) {
      const row = {
        api_client_id: apiClientId,
        operation,
        idempotency_key: idempotencyKey,
        request_hash: requestHash,
      };
      const { data, error } = await supabase
        .from('api_idempotency_records')
        .insert(row)
        .select('*')
        .single();

      if (!error) return { created: true, record: data };
      if (String(error.code || '') !== '23505') {
        throwDatabaseError(error, 'claim idempotency record');
      }

      const { data: existing, error: existingError } = await supabase
        .from('api_idempotency_records')
        .select('*')
        .eq('api_client_id', apiClientId)
        .eq('operation', operation)
        .eq('idempotency_key', idempotencyKey)
        .maybeSingle();
      throwDatabaseError(existingError, 'load idempotency record');
      return { created: false, record: existing };
    },

    async completeIdempotencyRecord({ id, responseStatus, responseBody }) {
      const { error } = await supabase
        .from('api_idempotency_records')
        .update({
          response_status: responseStatus,
          response_body: responseBody,
          completed_at: new Date().toISOString(),
        })
        .eq('id', id);
      throwDatabaseError(error, 'complete idempotency record');
    },

    async releaseIdempotencyRecord(id) {
      const { error } = await supabase
        .from('api_idempotency_records')
        .delete()
        .eq('id', id)
        .is('completed_at', null);
      throwDatabaseError(error, 'release idempotency record');
    },

    async createPartnerOrderDraft({
      apiClientId,
      counterpartyId,
      quoteId,
      externalOrderId,
      clientOrderRef,
      idempotencyKey,
      order,
      pricingSnapshot,
    }) {
      const { data, error } = await supabase
        .rpc('create_partner_api_order', {
          p_api_client_id: apiClientId,
          p_counterparty_id: counterpartyId,
          p_quote_id: quoteId,
          p_external_order_id: externalOrderId,
          p_client_order_ref: clientOrderRef,
          p_idempotency_key: idempotencyKey,
          p_order: order,
          p_pricing_snapshot: pricingSnapshot,
        })
        .single();
      if (error) {
        const wrapped = new Error(error.message || 'Unable to create partner order draft');
        wrapped.code = String(error.message || '').includes('QUOTE_ALREADY_CONSUMED')
          ? 'QUOTE_ALREADY_CONSUMED'
          : 'PARTNER_DATABASE_ERROR';
        wrapped.cause = error;
        throw wrapped;
      }
      return data;
    },

    async updatePartnerOrderState({
      orderId,
      status,
      supplierStatus,
      reconcileRequired,
      upstreamOrderId = null,
      upstreamResponse = null,
      partnerResponse,
      upstreamError = null,
    }) {
      const { data, error } = await supabase
        .rpc('update_partner_api_order_state', {
          p_order_id: orderId,
          p_status: status,
          p_supplier_status: supplierStatus,
          p_reconcile_required: reconcileRequired,
          p_upstream_order_id: upstreamOrderId,
          p_upstream_response: upstreamResponse,
          p_partner_response: partnerResponse,
          p_upstream_error: upstreamError,
        })
        .single();
      throwDatabaseError(error, 'update partner order state');
      return data;
    },

    async findPartnerOrder({ apiClientId, externalOrderId }) {
      const { data, error } = await supabase
        .from('api_order_context')
        .select('id,order_id,external_order_id,client_order_ref,status,supplier_status,reconcile_required,pricing_snapshot,partner_response,created_at,updated_at')
        .eq('api_client_id', apiClientId)
        .eq('external_order_id', externalOrderId)
        .maybeSingle();
      throwDatabaseError(error, 'load partner order');
      return data;
    },
  };
}

module.exports = { createPartnerRepository };
