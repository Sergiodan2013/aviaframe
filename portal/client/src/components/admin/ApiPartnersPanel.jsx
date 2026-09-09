import { useEffect, useMemo, useState } from 'react';
import { Building2, Check, Copy, KeyRound, Plus, RefreshCw, Search, ShieldCheck, SlidersHorizontal, Trash2 } from 'lucide-react';
import { Alert, Button, Field, StatusBadge, Surface } from '@aviaframe/ui';
import {
  createApiCounterparty,
  createPartnerApiCredential,
  getApiCounterparties,
  getApiCounterparty,
  getPartnerQuoteAudit,
  publishPartnerPricingVersion,
  revokePartnerApiCredential,
  updateApiCounterparty,
} from '../../lib/supabase';
import { CARRIERS } from '../../data/carriers';
import {
  buildPartnerSearchPayload,
  buildSandboxOrderPayload,
  buildSearchPassengers,
} from '../../lib/partnerApiTester';

const EMPTY_FORM = {
  legal_name: '',
  trading_name: '',
  country_code: 'SA',
  settlement_currency: 'SAR',
  settlement_mode: 'POSTPAID',
  billing_terms_days: 30,
  default_percent: 5,
  default_fixed_amount: 0,
  allowed_channels: ['GDS', 'NDC', 'LCC'],
  commercial_contact: { name: '', email: '', phone: '' },
  technical_contact: { name: '', email: '', phone: '' },
};

const DEFAULT_RULE = {
  channel: 'ANY',
  carrier_code: 'ANY',
  action: 'ALLOW',
  percent_bps: 500,
  fixed_amount: '0',
  fixed_currency: 'SAR',
  fixed_unit: 'ORDER',
  percent_basis: 'SUPPLIER_TOTAL',
  priority: 0,
};

const CARRIER_CODES = new Set(CARRIERS.map(({ code }) => code));

function carrierSelectValue(value) {
  const code = String(value || '').trim().toUpperCase();
  if (!code) return '';
  if (code === 'ANY' || CARRIER_CODES.has(code)) return code;
  return '__CUSTOM__';
}

function statusTone(status) {
  if (status === 'ACTIVE') return 'success';
  if (status === 'SANDBOX' || status === 'DRAFT') return 'info';
  if (status === 'SUSPENDED') return 'warning';
  return 'neutral';
}

function messageOf(error) {
  return error?.message || error?.error?.message || 'Request failed';
}

function defaultTestDepartureDate() {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + 30);
  return date.toISOString().slice(0, 10);
}

function defaultTestReturnDate() {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + 37);
  return date.toISOString().slice(0, 10);
}

function correlationId() {
  return globalThis.crypto?.randomUUID?.() || `admin-test-${Date.now()}`;
}

function apiErrorMessage(payload, status) {
  return payload?.message || payload?.error?.message || payload?.code || payload?.error?.code || `API request failed (${status})`;
}

export default function ApiPartnersPanel() {
  const [counterparties, setCounterparties] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [rules, setRules] = useState([DEFAULT_RULE]);
  const [changeNote, setChangeNote] = useState('Commercial pricing update');
  const [oneTimeKey, setOneTimeKey] = useState('');
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState(null);
  const [testApiKey, setTestApiKey] = useState('');
  const [testSearch, setTestSearch] = useState({
    trip_type: 'one_way',
    origin: 'LON',
    destination: 'MIL',
    departure_date: defaultTestDepartureDate(),
    return_date: defaultTestReturnDate(),
    adults: 1,
    children: 0,
    infants: 0,
    cabin_class: 'economy',
  });
  const [testLoading, setTestLoading] = useState(false);
  const [testPricingOfferId, setTestPricingOfferId] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [testPricedOffer, setTestPricedOffer] = useState(null);
  const [testView, setTestView] = useState('offers');
  const [testTraces, setTestTraces] = useState({});
  const [testAudits, setTestAudits] = useState({});
  const [testAuditLoadingId, setTestAuditLoadingId] = useState('');
  const [testOrderLoading, setTestOrderLoading] = useState(false);
  const [testOrderResult, setTestOrderResult] = useState(null);
  const [testOrderForm, setTestOrderForm] = useState({
    email: 'sandbox@example.com',
    phone: '+966500000000',
    confirmed: false,
  });
  const [testError, setTestError] = useState('');

  const selectedSummary = useMemo(
    () => counterparties.find((item) => item.id === selectedId) || null,
    [counterparties, selectedId],
  );

  const loadList = async ({ preserveSelection = true } = {}) => {
    setLoading(true);
    const { data, error } = await getApiCounterparties();
    if (error) setNotice({ tone: 'danger', text: messageOf(error) });
    else {
      setCounterparties(data || []);
      if (!preserveSelection || !selectedId) setSelectedId(data?.[0]?.id || '');
    }
    setLoading(false);
  };

  const loadDetail = async (counterpartyId) => {
    if (!counterpartyId) {
      setDetail(null);
      return;
    }
    const { data, error } = await getApiCounterparty(counterpartyId);
    if (error) {
      setNotice({ tone: 'danger', text: messageOf(error) });
      return;
    }
    setDetail(data);
    const activePlan = data?.pricing_plans?.find((plan) => plan.environment === 'sandbox') || data?.pricing_plans?.[0];
    setRules((activePlan?.rules?.length ? activePlan.rules : [DEFAULT_RULE]).map((rule) => ({
      ...DEFAULT_RULE,
      ...rule,
      fixed_amount: String(rule.fixed_amount ?? 0),
      fixed_currency: rule.fixed_currency || data.counterparty.settlement_currency,
    })));
  };

  useEffect(() => {
    let active = true;
    getApiCounterparties().then(({ data, error }) => {
      if (!active) return;
      if (error) setNotice({ tone: 'danger', text: messageOf(error) });
      else {
        setCounterparties(data || []);
        setSelectedId(data?.[0]?.id || '');
      }
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    if (!selectedId) return () => { active = false; };
    getApiCounterparty(selectedId).then(({ data, error }) => {
      if (!active) return;
      if (error) {
        setNotice({ tone: 'danger', text: messageOf(error) });
        return;
      }
      setDetail(data);
      const activePlan = data?.pricing_plans?.find((plan) => plan.environment === 'sandbox') || data?.pricing_plans?.[0];
      setRules((activePlan?.rules?.length ? activePlan.rules : [DEFAULT_RULE]).map((rule) => ({
        ...DEFAULT_RULE,
        ...rule,
        fixed_amount: String(rule.fixed_amount ?? 0),
        fixed_currency: rule.fixed_currency || data.counterparty.settlement_currency,
      })));
    });
    return () => { active = false; };
  }, [selectedId]);

  const updateForm = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const updateContact = (group, field, value) => setForm((current) => ({
    ...current,
    [group]: { ...current[group], [field]: value },
  }));

  const toggleChannel = (channel) => setForm((current) => ({
    ...current,
    allowed_channels: current.allowed_channels.includes(channel)
      ? current.allowed_channels.filter((item) => item !== channel)
      : [...current.allowed_channels, channel],
  }));

  const handleCreate = async (event) => {
    event.preventDefault();
    setSaving(true);
    setNotice(null);
    const { data, error } = await createApiCounterparty(form);
    setSaving(false);
    if (error) {
      setNotice({ tone: 'danger', text: messageOf(error) });
      return;
    }
    setOneTimeKey(data.api_key || '');
    setShowCreate(false);
    setForm(EMPTY_FORM);
    await loadList({ preserveSelection: true });
    if (data.provisioning?.counterparty_id) setSelectedId(data.provisioning.counterparty_id);
    setNotice({ tone: 'success', text: 'Sandbox counterparty, pricing, entitlements, and API key created.' });
  };

  const handleStatus = async (status) => {
    setSaving(true);
    const { error } = await updateApiCounterparty(selectedId, { status });
    setSaving(false);
    if (error) return setNotice({ tone: 'danger', text: messageOf(error) });
    await Promise.all([loadList(), loadDetail(selectedId)]);
    setNotice({ tone: 'success', text: `Counterparty status changed to ${status}.` });
  };

  const updateRule = (index, field, value) => setRules((current) => current.map((rule, ruleIndex) => (
    ruleIndex === index ? { ...rule, [field]: value } : rule
  )));

  const handlePublish = async () => {
    const invalidCarrierIndex = rules.findIndex((rule) => {
      const carrier = String(rule.carrier_code || '').trim().toUpperCase();
      return carrier !== 'ANY' && !/^[A-Z0-9]{2,3}$/.test(carrier);
    });
    if (invalidCarrierIndex >= 0) {
      setNotice({ tone: 'danger', text: `Select a carrier or enter a valid 2–3 character IATA code in rule ${invalidCarrierIndex + 1}.` });
      return;
    }
    setSaving(true);
    const payloadRules = rules.map((rule, index) => ({
      ...rule,
      carrier_code: String(rule.carrier_code).trim().toUpperCase(),
      percent_bps: Math.round(Number(rule.percent_bps || 0)),
      fixed_amount: String(rule.fixed_amount || 0),
      priority: index,
    }));
    const { error } = await publishPartnerPricingVersion(selectedId, {
      environment: 'sandbox',
      change_note: changeNote,
      rules: payloadRules,
    });
    setSaving(false);
    if (error) return setNotice({ tone: 'danger', text: messageOf(error) });
    await loadDetail(selectedId);
    setNotice({ tone: 'success', text: 'A new immutable sandbox pricing version is now active.' });
  };

  const handleNewKey = async (clientId) => {
    setSaving(true);
    const { data, error } = await createPartnerApiCredential(clientId, { name: 'Rotated key' });
    setSaving(false);
    if (error) return setNotice({ tone: 'danger', text: messageOf(error) });
    setOneTimeKey(data.api_key || '');
    await loadDetail(selectedId);
  };

  const handleRevokeKey = async (clientId, credentialId) => {
    if (!window.confirm('Revoke this API key? Existing integrations using it will stop working.')) return;
    const { error } = await revokePartnerApiCredential(clientId, credentialId);
    if (error) return setNotice({ tone: 'danger', text: messageOf(error) });
    await loadDetail(selectedId);
  };

  const copyKey = async () => {
    await navigator.clipboard.writeText(oneTimeKey);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const partnerApiRequest = async (path, body, { idempotent = false } = {}) => {
    const requestCorrelationId = correlationId();
    const idempotencyKey = idempotent ? correlationId() : null;
    const response = await fetch(`/partner/v1${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${testApiKey.trim()}`,
        'Content-Type': 'application/json',
        'X-Correlation-ID': requestCorrelationId,
        ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
      },
      body: JSON.stringify(body),
    });
    const payload = await response.json().catch(() => null);
    const trace = {
      path: `/partner/v1${path}`,
      request: body,
      response: payload,
      status: response.status,
      correlation_id: response.headers.get('X-Correlation-ID') || requestCorrelationId,
      ...(idempotencyKey ? { idempotency_key: idempotencyKey } : {}),
    };
    if (!response.ok) {
      const error = new Error(apiErrorMessage(payload, response.status));
      error.trace = trace;
      throw error;
    }
    return { payload, trace };
  };

  const handleTestSearch = async (event) => {
    event.preventDefault();
    setTestError('');
    setTestResult(null);
    setTestPricedOffer(null);
    setTestOrderResult(null);
    setTestAudits({});
    if (!testApiKey.trim().startsWith('af_test_')) {
      setTestError('Paste the sandbox key beginning with af_test_.');
      return;
    }
    setTestLoading(true);
    try {
      const request = buildPartnerSearchPayload(testSearch);
      const { payload, trace } = await partnerApiRequest('/offers/search', request);
      setTestResult(payload);
      setTestTraces({ search: trace });
      setTestView('offers');
    } catch (error) {
      setTestError(error.message);
      if (error.trace) setTestTraces({ search: error.trace });
    } finally {
      setTestLoading(false);
    }
  };

  const handleTestAudit = async (quoteId, { open = true } = {}) => {
    if (!quoteId) return;
    setTestAuditLoadingId(quoteId);
    const { data, error } = await getPartnerQuoteAudit(selectedId, quoteId);
    setTestAuditLoadingId('');
    if (error) {
      setTestError(messageOf(error));
      return;
    }
    setTestAudits((current) => ({ ...current, [quoteId]: data }));
    if (open) setTestView('audit');
  };

  const handleTestPrice = async (offerId) => {
    setTestError('');
    setTestPricedOffer(null);
    setTestPricingOfferId(offerId);
    try {
      const request = { passengers: buildSearchPassengers(testSearch) };
      const { payload, trace } = await partnerApiRequest(
        `/offers/${encodeURIComponent(offerId)}/price`,
        request,
        { idempotent: true },
      );
      setTestPricedOffer(payload);
      setTestTraces((current) => ({ ...current, price: trace }));
      setTestOrderForm((current) => ({ ...current, confirmed: false }));
      await handleTestAudit(payload.price_quote_id);
    } catch (error) {
      setTestError(error.message);
      if (error.trace) setTestTraces((current) => ({ ...current, price: error.trace }));
    } finally {
      setTestPricingOfferId('');
    }
  };

  const handleTestOrder = async () => {
    setTestError('');
    setTestOrderResult(null);
    if (!testOrderForm.confirmed) {
      setTestError('Confirm that you understand this creates a DRCT sandbox order.');
      return;
    }
    setTestOrderLoading(true);
    try {
      const suffix = `${Date.now()}`;
      const request = buildSandboxOrderPayload({
        pricedOffer: testPricedOffer,
        search: testSearch,
        contact: testOrderForm,
        uniqueSuffix: suffix,
      });
      const { payload, trace } = await partnerApiRequest('/orders', request, { idempotent: true });
      setTestOrderResult(payload);
      setTestTraces((current) => ({ ...current, order: trace }));
      setTestView('json');
    } catch (error) {
      setTestError(error.message);
      if (error.trace) setTestTraces((current) => ({ ...current, order: error.trace }));
    } finally {
      setTestOrderLoading(false);
    }
  };

  const testAuditRows = Object.values(testAudits);

  return (
    <div className="space-y-5">
      <Surface className="overflow-hidden">
        <div className="border-b border-[var(--af-border)] bg-[var(--af-bg)] p-5 md:flex md:items-center md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--af-primary)]">
              <ShieldCheck size={17} /> AviaFrame Connect API
            </div>
            <h2 className="text-2xl font-bold text-[var(--af-text)]">API counterparties</h2>
            <p className="mt-1 max-w-2xl text-sm text-[var(--af-text-muted)]">
              Provision consumers, isolate credentials, control available content, and publish auditable pricing by channel and carrier.
            </p>
          </div>
          <div className="mt-4 flex gap-2 md:mt-0">
            <Button variant="secondary" onClick={() => loadList()} disabled={loading}><RefreshCw size={16} /> Refresh</Button>
            <Button onClick={() => setShowCreate((value) => !value)}><Plus size={16} /> New counterparty</Button>
          </div>
        </div>

        {notice && <div className="p-4 pb-0"><Alert tone={notice.tone}>{notice.text}</Alert></div>}

        {oneTimeKey && (
          <div className="p-4 pb-0">
            <Alert tone="warning">
              <div className="font-semibold">Copy this API key now — it will not be shown again.</div>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <code className="min-w-0 flex-1 overflow-x-auto rounded bg-white px-3 py-2 text-xs text-[var(--af-text)]">{oneTimeKey}</code>
                <Button variant="secondary" onClick={copyKey}>{copied ? <Check size={16} /> : <Copy size={16} />}{copied ? 'Copied' : 'Copy key'}</Button>
                <Button variant="secondary" onClick={() => setOneTimeKey('')}>Dismiss</Button>
              </div>
            </Alert>
          </div>
        )}

        {showCreate && (
          <form onSubmit={handleCreate} className="border-b border-[var(--af-border)] p-5">
            <div className="mb-4">
              <h3 className="font-bold text-[var(--af-text)]">New API consumer</h3>
              <p className="text-sm text-[var(--af-text-muted)]">Creates a safe sandbox environment first. Production activation remains a separate approval.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Field label="Legal name" htmlFor="api-legal-name"><input id="api-legal-name" className="af-input" required value={form.legal_name} onChange={(e) => updateForm('legal_name', e.target.value)} /></Field>
              <Field label="Trading name" htmlFor="api-trading-name"><input id="api-trading-name" className="af-input" value={form.trading_name} onChange={(e) => updateForm('trading_name', e.target.value)} /></Field>
              <Field label="Commercial email" htmlFor="api-commercial-email"><input id="api-commercial-email" type="email" className="af-input" required value={form.commercial_contact.email} onChange={(e) => updateContact('commercial_contact', 'email', e.target.value)} /></Field>
              <Field label="Country" htmlFor="api-country"><input id="api-country" className="af-input" maxLength="2" value={form.country_code} onChange={(e) => updateForm('country_code', e.target.value.toUpperCase())} /></Field>
              <Field label="Settlement currency" htmlFor="api-currency"><input id="api-currency" className="af-input" maxLength="3" value={form.settlement_currency} onChange={(e) => updateForm('settlement_currency', e.target.value.toUpperCase())} /></Field>
              <Field label="Billing terms, days" htmlFor="api-terms"><input id="api-terms" type="number" min="0" max="365" className="af-input" value={form.billing_terms_days} onChange={(e) => updateForm('billing_terms_days', Number(e.target.value))} /></Field>
              <Field label="Default markup, %" htmlFor="api-percent"><input id="api-percent" type="number" min="0" step="0.01" className="af-input" value={form.default_percent} onChange={(e) => updateForm('default_percent', e.target.value)} /></Field>
              <Field label={`Default fixed markup, ${form.settlement_currency}`} htmlFor="api-fixed"><input id="api-fixed" type="number" min="0" step="0.01" className="af-input" value={form.default_fixed_amount} onChange={(e) => updateForm('default_fixed_amount', e.target.value)} /></Field>
              <Field label="Technical contact" htmlFor="api-tech-email"><input id="api-tech-email" type="email" className="af-input" value={form.technical_contact.email} onChange={(e) => updateContact('technical_contact', 'email', e.target.value)} /></Field>
            </div>
            <fieldset className="mt-4">
              <legend className="mb-2 text-sm font-semibold text-[var(--af-text)]">Enabled content</legend>
              <div className="flex flex-wrap gap-3">
                {['GDS', 'NDC', 'LCC'].map((channel) => (
                  <label key={channel} className="flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--af-border)] px-3 py-2 text-sm">
                    <input type="checkbox" checked={form.allowed_channels.includes(channel)} onChange={() => toggleChannel(channel)} /> {channel}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="mt-5 flex justify-end gap-2"><Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? 'Provisioning…' : 'Create sandbox consumer'}</Button></div>
          </form>
        )}

        <div className="grid min-h-[520px] lg:grid-cols-[300px_1fr]">
          <aside className="border-b border-[var(--af-border)] bg-[var(--af-bg)] p-3 lg:border-b-0 lg:border-r">
            {loading && <p className="p-3 text-sm text-[var(--af-text-muted)]">Loading counterparties…</p>}
            {!loading && !counterparties.length && <p className="p-3 text-sm text-[var(--af-text-muted)]">No API counterparties yet.</p>}
            <div className="space-y-2">
              {counterparties.map((counterparty) => (
                <button key={counterparty.id} type="button" onClick={() => setSelectedId(counterparty.id)} className={`w-full rounded-lg border p-3 text-left transition ${selectedId === counterparty.id ? 'border-[var(--af-primary)] bg-white shadow-sm' : 'border-transparent hover:border-[var(--af-border)] hover:bg-white'}`}>
                  <div className="flex items-start justify-between gap-2"><span className="font-semibold text-[var(--af-text)]">{counterparty.trading_name || counterparty.legal_name}</span><StatusBadge tone={statusTone(counterparty.status)}>{counterparty.status}</StatusBadge></div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-[var(--af-text-muted)]"><Building2 size={13} /> {counterparty.country_code} · {counterparty.settlement_currency} · {counterparty.clients?.length || 0} client</div>
                </button>
              ))}
            </div>
          </aside>

          <div className="min-w-0 p-5">
            {!selectedSummary && <div className="flex h-full items-center justify-center text-sm text-[var(--af-text-muted)]">Select or create a counterparty.</div>}
            {selectedSummary && detail && (
              <div className="space-y-6">
                <div className="flex flex-col gap-3 border-b border-[var(--af-border)] pb-5 sm:flex-row sm:items-center sm:justify-between">
                  <div><h3 className="text-xl font-bold text-[var(--af-text)]">{detail.counterparty.trading_name || detail.counterparty.legal_name}</h3><p className="text-sm text-[var(--af-text-muted)]">{detail.counterparty.legal_name} · {detail.counterparty.settlement_mode} · {detail.counterparty.billing_terms_days} day terms</p></div>
                  <select aria-label="Counterparty status" className="af-input max-w-52" value={detail.counterparty.status} disabled={saving} onChange={(e) => handleStatus(e.target.value)}>{['SANDBOX', 'ACTIVE', 'SUSPENDED', 'TERMINATED'].map((status) => <option key={status}>{status}</option>)}</select>
                </div>

                <section>
                  <div className="mb-3 flex items-center gap-2"><KeyRound size={18} className="text-[var(--af-primary)]" /><h4 className="font-bold text-[var(--af-text)]">API clients and keys</h4></div>
                  <div className="grid gap-3 xl:grid-cols-2">
                    {detail.clients.map((client) => (
                      <div key={client.id} className="rounded-xl border border-[var(--af-border)] p-4">
                        <div className="flex items-center justify-between"><div><div className="font-semibold">{client.name}</div><div className="text-xs uppercase text-[var(--af-text-muted)]">{client.environment}</div></div><StatusBadge tone={client.status === 'ACTIVE' ? 'success' : 'warning'}>{client.status}</StatusBadge></div>
                        <div className="mt-3 flex flex-wrap gap-1">{client.entitlements?.allowed_channels?.map((channel) => <StatusBadge key={channel} tone="info">{channel}</StatusBadge>)}</div>
                        <div className="mt-4 space-y-2">{client.credentials.filter((credential) => !credential.revoked_at).map((credential) => <div key={credential.id} className="flex items-center justify-between rounded-lg bg-[var(--af-bg)] p-2 text-xs"><div><div className="font-mono">{credential.key_prefix}••••</div><div className="text-[var(--af-text-muted)]">{credential.name} · active</div></div><button type="button" aria-label="Revoke API key" className="rounded p-2 text-[var(--af-danger)] hover:bg-white" onClick={() => handleRevokeKey(client.id, credential.id)}><Trash2 size={15} /></button></div>)}{client.credentials.some((credential) => credential.revoked_at) && <p className="text-[var(--af-text-muted)] text-xs">{client.credentials.filter((credential) => credential.revoked_at).length} revoked key(s) hidden</p>}</div>
                        <Button variant="secondary" className="mt-3 w-full" onClick={() => handleNewKey(client.id)} disabled={saving}><Plus size={15} /> Generate key</Button>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <div className="mb-1 flex items-center gap-2"><SlidersHorizontal size={18} className="text-[var(--af-primary)]" /><h4 className="font-bold text-[var(--af-text)]">Sandbox pricing matrix</h4></div>
                  <p className="text-sm text-[var(--af-text-muted)]">Rules inherit from ANY/ANY to channel, carrier, then channel + carrier. Publishing creates a new immutable version.</p>
                  <p className="mb-3 mt-2 rounded-lg border border-[var(--af-border)] bg-[var(--af-bg)] px-3 py-2 text-sm text-[var(--af-text-muted)]">
                    <strong className="text-[var(--af-text)]">Sale access:</strong> Sell (ALLOW) includes matching offers in new search and pricing responses. Block (DENY) excludes them from new searches and repricing; markup values are ignored. An already confirmed, unexpired quote keeps its existing lifecycle.
                  </p>
                  <div className="overflow-x-auto rounded-xl border border-[var(--af-border)]">
                    <table className="w-full min-w-[1080px] text-left text-sm">
                      <thead className="bg-[var(--af-bg)] text-xs uppercase text-[var(--af-text-muted)]"><tr><th className="p-3">Channel</th><th className="p-3">Carrier</th><th className="p-3">Sale access</th><th className="p-3">Markup %</th><th className="p-3">Fixed markup</th><th className="p-3">Applied per</th><th className="w-12 p-3"><span className="sr-only">Remove</span></th></tr></thead>
                      <tbody>{rules.map((rule, index) => {
                        const denied = rule.action === 'DENY';
                        const selectedCarrier = carrierSelectValue(rule.carrier_code);
                        return <tr key={`${rule.id || 'new'}-${index}`} className="border-t border-[var(--af-border)]"><td className="p-2"><select aria-label={`Channel for rule ${index + 1}`} className="af-input min-w-28" value={rule.channel} onChange={(e) => updateRule(index, 'channel', e.target.value)}>{['ANY', 'GDS', 'NDC', 'LCC'].map((value) => <option key={value}>{value}</option>)}</select></td><td className="p-2"><div className="min-w-64 space-y-2"><select aria-label={`Carrier for rule ${index + 1}`} className="af-input" value={selectedCarrier} onChange={(e) => updateRule(index, 'carrier_code', e.target.value)}><option value="" disabled>Select carrier…</option><option value="ANY">ANY — All carriers</option>{CARRIERS.map(({ code, name }) => <option key={code} value={code}>{code} — {name}</option>)}<option value="__CUSTOM__">Other IATA code…</option></select>{selectedCarrier === '__CUSTOM__' && <input aria-label={`Custom carrier code for rule ${index + 1}`} className="af-input uppercase" maxLength="3" placeholder="e.g. LH" value={rule.carrier_code === '__CUSTOM__' ? '' : rule.carrier_code} onChange={(e) => updateRule(index, 'carrier_code', e.target.value.toUpperCase())} />}</div></td><td className="p-2"><select aria-label={`Sale access for rule ${index + 1}`} className="af-input min-w-40" value={rule.action} onChange={(e) => updateRule(index, 'action', e.target.value)}><option value="ALLOW">Sell (ALLOW)</option><option value="DENY">Block (DENY)</option></select></td><td className="p-2"><input aria-label={`Percentage markup for rule ${index + 1}`} className="af-input disabled:cursor-not-allowed disabled:opacity-50" disabled={denied} type="number" min="0" step="0.01" value={Number(rule.percent_bps || 0) / 100} onChange={(e) => updateRule(index, 'percent_bps', Math.round(Number(e.target.value) * 100))} /></td><td className="p-2"><div className="flex gap-1"><input aria-label={`Fixed markup for rule ${index + 1}`} className="af-input disabled:cursor-not-allowed disabled:opacity-50" disabled={denied} type="number" min="0" step="0.01" value={rule.fixed_amount} onChange={(e) => updateRule(index, 'fixed_amount', e.target.value)} /><input aria-label={`Fixed markup currency for rule ${index + 1}`} className="af-input max-w-20 uppercase disabled:cursor-not-allowed disabled:opacity-50" disabled={denied} maxLength="3" value={rule.fixed_currency} onChange={(e) => updateRule(index, 'fixed_currency', e.target.value.toUpperCase())} /></div></td><td className="p-2"><select aria-label={`Fixed markup unit for rule ${index + 1}`} className="af-input min-w-36 disabled:cursor-not-allowed disabled:opacity-50" disabled={denied} value={rule.fixed_unit} onChange={(e) => updateRule(index, 'fixed_unit', e.target.value)}><option value="ORDER">Order</option><option value="PASSENGER">Passenger</option><option value="TICKET">Ticket</option></select></td><td className="p-2"><button type="button" aria-label={`Remove rule ${index + 1}`} disabled={rules.length === 1} className="rounded p-2 text-[var(--af-danger)] disabled:opacity-30" onClick={() => setRules((current) => current.filter((_, row) => row !== index))}><Trash2 size={16} /></button></td></tr>;
                      })}</tbody>
                    </table>
                  </div>
                  <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><Button variant="secondary" onClick={() => setRules((current) => [...current, { ...DEFAULT_RULE, fixed_currency: detail.counterparty.settlement_currency, channel: 'ANY', carrier_code: '', priority: current.length }])}><Plus size={15} /> Add carrier override</Button><div className="flex flex-1 flex-col gap-2 sm:max-w-xl sm:flex-row"><Field className="flex-1" label="Publication note"><input className="af-input" value={changeNote} onChange={(e) => setChangeNote(e.target.value)} /></Field><Button className="sm:self-end" onClick={handlePublish} disabled={saving}>{saving ? 'Publishing…' : 'Publish new version'}</Button></div></div>
                </section>

                <Surface as="section" className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-[var(--af-bg)] p-2 text-[var(--af-primary)]"><Search size={20} /></div>
                    <div>
                      <h4 className="font-bold text-[var(--af-text)]">Sandbox API tester</h4>
                      <p className="mt-1 text-sm text-[var(--af-text-muted)]">Runs the complete external-client flow: Search → Reprice → Create sandbox order. Returned prices already include this counterparty&apos;s published markup.</p>
                    </div>
                  </div>
                  <Alert tone="warning" className="mt-4">Use only a disposable <code>af_test_</code> key. It stays in memory for this page. Order creation calls DRCT sandbox and never creates a production booking.</Alert>

                  <form onSubmit={handleTestSearch} className="mt-4 space-y-3">
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      <Field className="md:col-span-2" label="Sandbox API key" htmlFor="partner-test-key" hint="Generate a new key above if the original was not saved."><input id="partner-test-key" className="af-input font-mono" type="password" autoComplete="new-password" spellCheck="false" placeholder="af_test_…" value={testApiKey} onChange={(e) => setTestApiKey(e.target.value)} /></Field>
                      <Field label="Trip type" htmlFor="partner-test-trip"><select id="partner-test-trip" className="af-input" value={testSearch.trip_type} onChange={(e) => setTestSearch((current) => ({ ...current, trip_type: e.target.value }))}><option value="one_way">One-way</option><option value="round_trip">Round trip</option></select></Field>
                      <Field label="Cabin" htmlFor="partner-test-cabin"><select id="partner-test-cabin" className="af-input" value={testSearch.cabin_class} onChange={(e) => setTestSearch((current) => ({ ...current, cabin_class: e.target.value }))}><option value="economy">Economy</option><option value="premium_economy">Premium economy</option><option value="business">Business</option><option value="first">First</option></select></Field>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      <Field label="From" htmlFor="partner-test-origin"><input id="partner-test-origin" className="af-input uppercase" required maxLength="3" value={testSearch.origin} onChange={(e) => setTestSearch((current) => ({ ...current, origin: e.target.value.toUpperCase() }))} /></Field>
                      <Field label="To" htmlFor="partner-test-destination"><input id="partner-test-destination" className="af-input uppercase" required maxLength="3" value={testSearch.destination} onChange={(e) => setTestSearch((current) => ({ ...current, destination: e.target.value.toUpperCase() }))} /></Field>
                      <Field label="Departure" htmlFor="partner-test-date"><input id="partner-test-date" className="af-input" required type="date" value={testSearch.departure_date} onChange={(e) => setTestSearch((current) => ({ ...current, departure_date: e.target.value }))} /></Field>
                      {testSearch.trip_type === 'round_trip' && <Field label="Return" htmlFor="partner-test-return-date"><input id="partner-test-return-date" className="af-input" required type="date" min={testSearch.departure_date} value={testSearch.return_date} onChange={(e) => setTestSearch((current) => ({ ...current, return_date: e.target.value }))} /></Field>}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <Field label="Adults (ADT)" htmlFor="partner-test-adults"><input id="partner-test-adults" className="af-input" type="number" min="1" max="9" value={testSearch.adults} onChange={(e) => setTestSearch((current) => ({ ...current, adults: Number(e.target.value) }))} /></Field>
                      <Field label="Children (CHD)" htmlFor="partner-test-children"><input id="partner-test-children" className="af-input" type="number" min="0" max="8" value={testSearch.children} onChange={(e) => setTestSearch((current) => ({ ...current, children: Number(e.target.value) }))} /></Field>
                      <Field label="Infants (INF)" htmlFor="partner-test-infants"><input id="partner-test-infants" className="af-input" type="number" min="0" max="8" value={testSearch.infants} onChange={(e) => setTestSearch((current) => ({ ...current, infants: Number(e.target.value) }))} /></Field>
                      <Button type="submit" className="self-end" disabled={testLoading}>{testLoading ? 'Searching…' : 'Run client search'}</Button>
                    </div>
                  </form>

                  {testError && <Alert tone="danger" className="mt-4">{testError}</Alert>}
                  {testResult && (
                    <div className="mt-5">
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <div><h5 className="font-semibold text-[var(--af-text)]">Client response</h5><p className="text-xs text-[var(--af-text-muted)]">{testSearch.trip_type === 'round_trip' ? `Round trip · ${testSearch.departure_date} → ${testSearch.return_date}` : `One-way · ${testSearch.departure_date}`} · {testSearch.adults} ADT · {testSearch.children} CHD · {testSearch.infants} INF</p></div>
                        <div className="flex flex-wrap gap-2"><StatusBadge tone={testResult.offers?.length ? 'success' : 'warning'}>{testResult.offers?.length || 0} offers</StatusBadge>{Number.isInteger(testResult.meta?.provider_offer_count) && <StatusBadge tone="neutral">{testResult.meta.provider_offer_count} before policy</StatusBadge>}</div>
                      </div>
                      <div className="mb-4 flex flex-wrap gap-2 border-b border-[var(--af-border)] pb-3" role="tablist" aria-label="Sandbox response views">
                        {[['offers', 'Offers'], ['audit', `Price audit${testAuditRows.length ? ` (${testAuditRows.length})` : ''}`], ['json', 'Raw JSON']].map(([value, label]) => <button key={value} type="button" role="tab" aria-selected={testView === value} className={`rounded-lg px-3 py-2 text-sm font-semibold ${testView === value ? 'bg-[var(--af-primary)] text-white' : 'bg-[var(--af-bg)] text-[var(--af-text)]'}`} onClick={() => setTestView(value)}>{label}</button>)}
                      </div>

                      {testView === 'offers' && <>
                        {!testResult.offers?.length && Number(testResult.meta?.provider_offer_count || 0) > 0 && <p className="rounded-lg bg-[var(--af-bg)] p-3 text-sm text-[var(--af-text-muted)]">DRCT returned {testResult.meta.provider_offer_count} offers, but this client&apos;s policy excluded all of them.</p>}
                        {!testResult.offers?.length && Number(testResult.meta?.provider_offer_count || 0) === 0 && <p className="rounded-lg bg-[var(--af-bg)] p-3 text-sm text-[var(--af-text-muted)]">DRCT sandbox returned no matching offers for this route and date.</p>}
                        <div className="grid gap-3 xl:grid-cols-2">
                          {testResult.offers?.slice(0, 10).map((offer) => (
                            <div key={offer.offer_id} className="rounded-xl border border-[var(--af-border)] p-4">
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><div className="font-semibold text-[var(--af-text)]">{offer.airline_name || offer.validating_carrier || 'Carrier'} · {offer.origin} → {offer.destination}</div><div className="mt-1 text-xs text-[var(--af-text-muted)]">{offer.validating_carrier || '—'} · {offer.distribution_channel || 'UNKNOWN'} · Outbound {offer.departure_time || 'time unavailable'}</div>{testSearch.trip_type === 'round_trip' && <div className="mt-1 text-xs font-medium text-[var(--af-text-muted)]">Return {offer.return_departure_time || `${testSearch.return_date} · see segments in Raw JSON`}</div>}</div><div className="text-left sm:text-right"><div className="font-bold text-[var(--af-primary)]">{offer.price?.total} {offer.price?.currency}</div><div className="text-xs text-[var(--af-text-muted)]">client sell price</div></div></div>
                              <div className="mt-3 grid gap-2 sm:grid-cols-2"><Button variant="secondary" disabled={Boolean(testPricingOfferId)} onClick={() => handleTestPrice(offer.offer_id)}>{testPricingOfferId === offer.offer_id ? 'Confirming…' : 'Confirm current price'}</Button><Button variant="secondary" disabled={testAuditLoadingId === offer.price_quote_id} onClick={() => handleTestAudit(offer.price_quote_id)}>{testAuditLoadingId === offer.price_quote_id ? 'Loading…' : 'View markup'}</Button></div>
                            </div>
                          ))}
                        </div>
                      </>}

                      {testView === 'audit' && <div className="space-y-3">
                        {!testAuditRows.length && <p className="rounded-lg bg-[var(--af-bg)] p-4 text-sm text-[var(--af-text-muted)]">Click <strong>View markup</strong> on an offer, or confirm its current price, to load the internal super-admin audit.</p>}
                        {testAuditRows.map((audit) => <div key={audit.external_quote_id} className="rounded-xl border border-[var(--af-border)] p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div className="font-semibold">{audit.carrier_code} · {audit.distribution_channel}</div><code className="text-xs text-[var(--af-text-muted)]">{audit.external_quote_id}</code></div><div className="mt-3 grid gap-2 sm:grid-cols-4"><div className="rounded-lg bg-[var(--af-bg)] p-3"><div className="text-xs text-[var(--af-text-muted)]">DRCT supplier price</div><div className="font-bold">{audit.supplier_total} {audit.currency}</div></div><div className="rounded-lg bg-[var(--af-bg)] p-3"><div className="text-xs text-[var(--af-text-muted)]">Percentage markup</div><div className="font-bold">{audit.pricing_rule_trace?.percentage_markup || '0'} {audit.currency}</div></div><div className="rounded-lg bg-[var(--af-bg)] p-3"><div className="text-xs text-[var(--af-text-muted)]">Fixed markup</div><div className="font-bold">{audit.pricing_rule_trace?.fixed_markup || '0'} {audit.currency}</div></div><div className="rounded-lg bg-[var(--af-bg)] p-3"><div className="text-xs text-[var(--af-text-muted)]">Client sell price</div><div className="font-bold text-[var(--af-primary)]">{audit.sell_total} {audit.currency}</div></div></div><div className="mt-2 text-xs text-[var(--af-text-muted)]">Applied markup: {audit.markup_total} {audit.currency} · {Number(audit.pricing_rule_trace?.percent_bps || 0) / 100}% · {audit.pricing_rule_trace?.passenger_count || 0} passenger(s)</div></div>)}
                      </div>}

                      {testView === 'json' && <pre className="max-h-[560px] overflow-auto rounded-xl bg-slate-950 p-4 text-xs leading-relaxed text-slate-100">{JSON.stringify(testTraces, null, 2)}</pre>}
                    </div>
                  )}

                  {testPricedOffer && <div className="mt-4 space-y-4"><Alert tone="success"><strong>Reprice succeeded:</strong> {testPricedOffer.price?.total} {testPricedOffer.price?.currency}. Quote <code>{testPricedOffer.price_quote_id}</code> is valid until {testPricedOffer.valid_until}.</Alert><div className="rounded-xl border border-[var(--af-border)] p-4"><h5 className="font-semibold text-[var(--af-text)]">Create DRCT sandbox order</h5><p className="mt-1 text-sm text-[var(--af-text-muted)]">Uses generated sandbox passenger names and documents matching the selected ADT/CHD/INF mix. No payment or production ticket is created.</p><div className="mt-3 grid gap-3 sm:grid-cols-2"><Field label="Test contact email" htmlFor="partner-test-order-email"><input id="partner-test-order-email" className="af-input" type="email" value={testOrderForm.email} onChange={(e) => setTestOrderForm((current) => ({ ...current, email: e.target.value }))} /></Field><Field label="Test contact phone" htmlFor="partner-test-order-phone"><input id="partner-test-order-phone" className="af-input" value={testOrderForm.phone} onChange={(e) => setTestOrderForm((current) => ({ ...current, phone: e.target.value }))} /></Field></div><label className="mt-3 flex items-start gap-2 text-sm text-[var(--af-text)]"><input className="mt-1" type="checkbox" checked={testOrderForm.confirmed} onChange={(e) => setTestOrderForm((current) => ({ ...current, confirmed: e.target.checked }))} /><span>I understand this submits an order to DRCT sandbox using generated test passenger data.</span></label><Button className="mt-3" disabled={!testOrderForm.confirmed || testOrderLoading} onClick={handleTestOrder}>{testOrderLoading ? 'Creating sandbox order…' : 'Create sandbox order'}</Button></div></div>}
                  {testOrderResult && <Alert tone="success" className="mt-4"><strong>Sandbox order created:</strong> {testOrderResult.order_id} · status {testOrderResult.status}{testOrderResult.booking_reference ? ` · booking reference ${testOrderResult.booking_reference}` : ''}. Full response is in Raw JSON.</Alert>}
                </Surface>
              </div>
            )}
          </div>
        </div>
      </Surface>
    </div>
  );
}
