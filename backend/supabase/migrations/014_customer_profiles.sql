-- 014_customer_profiles.sql
-- Stores minimal repeat-booking customer profile data per agency.

CREATE TABLE IF NOT EXISTS public.customer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  phone TEXT,
  first_name TEXT,
  last_name TEXT,
  date_of_birth DATE,
  gender TEXT,
  passport_number TEXT,
  passport_expiry DATE,
  nationality TEXT,
  last_booking_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT customer_profiles_agency_email_unique UNIQUE (agency_id, email)
);

CREATE INDEX IF NOT EXISTS idx_customer_profiles_agency_email
  ON public.customer_profiles (agency_id, email);

ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;
