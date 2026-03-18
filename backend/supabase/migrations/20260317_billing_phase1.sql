-- 20260317_billing_phase1.sql
-- Phase 1: auto invoice generation + email
-- Adds: invoices.type, agencies.billing_method, billing_events table, email templates

-- 1. Invoice type
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS type text DEFAULT 'commission'
    CHECK (type IN ('commission', 'subscription'));

-- 2. Billing method on agency
ALTER TABLE public.agencies
  ADD COLUMN IF NOT EXISTS billing_method text DEFAULT 'invoice'
    CHECK (billing_method IN ('invoice', 'card'));

-- 3. Billing events audit log
CREATE TABLE IF NOT EXISTS public.billing_events (
  id                  uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id           uuid REFERENCES public.agencies(id) ON DELETE CASCADE,
  type                text NOT NULL,
  amount              numeric(10,2),
  currency            text DEFAULT 'SAR',
  invoice_id          uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
  status              text NOT NULL DEFAULT 'success'
                        CHECK (status IN ('success', 'failed', 'skipped')),
  error_message       text,
  billing_period_from date,
  billing_period_to   date,
  idempotency_key     text UNIQUE,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_billing_events_agency_id
  ON public.billing_events(agency_id);
CREATE INDEX IF NOT EXISTS idx_billing_events_created_at
  ON public.billing_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_billing_events_idempotency
  ON public.billing_events(idempotency_key)
  WHERE idempotency_key IS NOT NULL;

ALTER TABLE public.billing_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS billing_events_admin ON public.billing_events;
CREATE POLICY billing_events_admin ON public.billing_events
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
  )
);

-- 4. Email templates for billing
INSERT INTO public.email_templates (event_type, subject, blocks, variables, is_active)
VALUES
(
  'subscription_invoice',
  'Platform Subscription Invoice {{invoice_number}} — SAR 300',
  '{
    "greeting": "Dear {{agency_name}},",
    "intro": "Please find attached your monthly platform subscription invoice for {{period}}.",
    "details": "Amount due: SAR 300.00. Payment is due within 14 days of invoice date.",
    "payment_note": "To pay, please reply to this email or contact billing@aviaframe.com.",
    "closing": "Thank you for using AviaFrame."
  }',
  '{"agency_name": "", "invoice_number": "", "period": ""}',
  true
),
(
  'commission_statement',
  'Commission Statement {{period}} — {{agency_name}}',
  '{
    "greeting": "Dear {{agency_name}},",
    "intro": "Please find attached your commission statement for {{period}}.",
    "details": "Total commissions earned: {{currency}} {{total}}. This amount will be remitted to you by bank transfer by the end of the month.",
    "closing": "For any questions please contact billing@aviaframe.com."
  }',
  '{"agency_name": "", "period": "", "currency": "", "total": ""}',
  true
),
(
  'invoice_reminder',
  'Reminder: Invoice {{invoice_number}} is overdue — SAR {{total}}',
  '{
    "greeting": "Dear {{agency_name}},",
    "intro": "This is a reminder that invoice {{invoice_number}}, issued on {{issued_date}} for SAR {{total}}, remains unpaid.",
    "details": "Please arrange payment at your earliest convenience to avoid service interruption.",
    "closing": "Contact billing@aviaframe.com with any questions."
  }',
  '{"agency_name": "", "invoice_number": "", "issued_date": "", "total": ""}',
  true
)
ON CONFLICT (event_type) DO NOTHING;
