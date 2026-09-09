# Provider Outage Runbook

Owner: Ops  
Backup owner: Engineering  
Status: draft for approval

## Covered Providers

- DRCT
- payment providers
- email provider
- n8n
- Supabase

## Trigger

- provider returns sustained `5xx`, `401`, `429`, timeout, or degraded health
- provider status page confirms outage
- internal metrics show outage pattern

## Steps

1. Identify which provider is failing and which customer-facing functions depend on it.
2. Confirm whether the issue is provider-wide or configuration-specific.
3. Pause risky operations if they could create duplicate or invalid state.
4. Enable degraded-mode messaging where applicable.
5. Escalate to provider support if outage is external.
6. Track pending manual actions: ticket issue, capture, cancel, resend, or reconciliation.
7. Resume normal operation only after validation of core flows.

## Evidence Produced

- provider and outage window
- impacted flows
- mitigation taken
- manual actions created
- customer/internal communications
