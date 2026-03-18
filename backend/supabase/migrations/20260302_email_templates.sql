-- 20260302_email_templates.sql
-- New email_templates schema with event_type PK + blocks JSONB.
-- If old email_templates (Phase 1) exists with template_key column → rename it.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'email_templates'
      AND column_name  = 'template_key'
  ) THEN
    ALTER TABLE public.email_templates RENAME TO email_templates_v1;
  END IF;
END$$;

-- Global templates
CREATE TABLE IF NOT EXISTS public.email_templates (
  event_type  TEXT PRIMARY KEY,
  subject     TEXT NOT NULL,
  blocks      JSONB NOT NULL DEFAULT '{}',
  variables   JSONB NOT NULL DEFAULT '{}',
  is_active   BOOLEAN NOT NULL DEFAULT true,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Per-agency overrides
CREATE TABLE IF NOT EXISTS public.agency_email_templates (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id   UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  event_type  TEXT NOT NULL,
  subject     TEXT,
  blocks      JSONB,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE (agency_id, event_type)
);

-- RLS
ALTER TABLE public.email_templates         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_email_templates  ENABLE ROW LEVEL SECURITY;

-- Admin full access (uses service-role in backend, so these policies are for anon/authenticated paths)
DROP POLICY IF EXISTS email_templates_admin_all         ON public.email_templates;
DROP POLICY IF EXISTS agency_email_templates_admin_all  ON public.agency_email_templates;

CREATE POLICY email_templates_admin_all ON public.email_templates
  FOR ALL USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY agency_email_templates_admin_all ON public.agency_email_templates
  FOR ALL USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

-- Seed 4 default global templates
INSERT INTO public.email_templates (event_type, subject, blocks, variables)
VALUES
  (
    'booking_created',
    'Booking {{order_number}} — payment instructions',
    '{
      "greeting":      "Dear {{passenger_name}},",
      "intro":         "Your booking {{order_number}} has been successfully created.",
      "payment_note":  "To confirm your reservation please transfer {{total_price}} {{currency}} to:\nBank: {{bank_name}}\nIBAN: {{iban}}\nAccount: {{account_number}}\nSWIFT/BIC: {{swift_bic}}\n\nInclude your order number {{order_number}} in the payment reference.",
      "closing":       "Once payment is received your ticket will be issued. If you have questions please contact us."
    }'::jsonb,
    '{
      "passenger_name": "Lead passenger full name",
      "order_number":   "Booking reference (e.g. AV-00123)",
      "total_price":    "Total amount to pay",
      "currency":       "Currency code (SAR, USD…)",
      "bank_name":      "Agency bank name",
      "iban":           "Agency IBAN",
      "account_number": "Agency bank account number",
      "swift_bic":      "Agency SWIFT/BIC",
      "agency_name":    "Agency display name"
    }'::jsonb
  ),
  (
    'booking_cancelled',
    'Booking {{order_number}} has been cancelled',
    '{
      "greeting": "Dear {{passenger_name}},",
      "intro":    "We regret to inform you that your booking {{order_number}} has been cancelled.",
      "closing":  "If you believe this is a mistake or need assistance, please contact {{agency_name}}."
    }'::jsonb,
    '{
      "passenger_name": "Lead passenger full name",
      "order_number":   "Booking reference",
      "agency_name":    "Agency display name"
    }'::jsonb
  ),
  (
    'booking_confirmed',
    'Booking {{order_number}} is confirmed — your ticket is being issued',
    '{
      "greeting": "Dear {{passenger_name}},",
      "intro":    "Great news! Your payment for booking {{order_number}} has been received and your ticket is now being processed.",
      "closing":  "You will receive your e-ticket shortly. For any questions please contact {{agency_name}}."
    }'::jsonb,
    '{
      "passenger_name": "Lead passenger full name",
      "order_number":   "Booking reference",
      "agency_name":    "Agency display name"
    }'::jsonb
  ),
  (
    'agency_welcome',
    'Welcome to Aviaframe — your agency account is ready',
    '{
      "greeting": "Hello {{contact_person_name}},",
      "intro":    "Your agency account {{agency_name}} has been created on Aviaframe.",
      "closing":  "Please log in to complete your profile and start accepting bookings. If you have any questions please reply to this email."
    }'::jsonb,
    '{
      "agency_name":        "Agency display name",
      "contact_person_name":"Contact person full name"
    }'::jsonb
  )
ON CONFLICT (event_type) DO NOTHING;
