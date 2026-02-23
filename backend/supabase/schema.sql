-- Aviaframe Platform - Supabase Schema
-- Generated: 2026-02-02

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- AGENCIES TABLE
-- B2B partners/agencies (создаем первым, т.к. profiles ссылается на него)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.agencies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  domain TEXT UNIQUE, -- e.g., 'agency123' for subdomain/widget
  api_key TEXT UNIQUE NOT NULL, -- For widget authentication
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  country TEXT DEFAULT 'SA', -- ISO 3166-1 alpha-2
  address TEXT,
  logo_url TEXT,
  settings JSONB DEFAULT '{}', -- Custom settings (currency, language, etc.)
  is_active BOOLEAN DEFAULT TRUE,
  commission_rate DECIMAL(5,2) DEFAULT 0.00, -- Percentage (e.g., 5.00 = 5%)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PROFILES TABLE
-- Extended user profiles (linked to auth.users)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  country_code TEXT DEFAULT '+966', -- Default: Saudi Arabia
  avatar_url TEXT,
  role TEXT DEFAULT 'client' CHECK (role IN ('client', 'agent', 'admin')),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ORDERS TABLE
-- Main booking/order records
-- =====================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL, -- e.g., AVF12345678

  -- Relations
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  agency_id UUID REFERENCES public.agencies(id) ON DELETE SET NULL,

  -- DRCT API data
  drct_order_id TEXT UNIQUE, -- From DRCT API after create_order
  offer_id TEXT NOT NULL, -- Original offer_id from search

  -- Flight details (denormalized for quick access)
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  departure_time TEXT,
  arrival_time TEXT,
  airline_code TEXT,
  airline_name TEXT,
  flight_number TEXT,

  -- Pricing
  base_price DECIMAL(10,2) NOT NULL,
  taxes DECIMAL(10,2) DEFAULT 0.00,
  baggage_price DECIMAL(10,2) DEFAULT 0.00,
  total_price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'UAH',

  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',      -- Order created, awaiting payment
    'confirmed',    -- Payment received, booking confirmed
    'ticketed',     -- Tickets issued
    'cancelled',    -- Order cancelled
    'refunded',     -- Refund processed
    'failed'        -- Payment or booking failed
  )),

  -- Contact information
  contact_email TEXT NOT NULL,
  contact_phone TEXT NOT NULL,

  -- Additional data
  payment_method TEXT, -- 'card', 'paypal', etc.
  payment_transaction_id TEXT,
  raw_offer_data JSONB, -- Full offer data from search
  raw_drct_response JSONB, -- Full response from DRCT create_order
  notes TEXT, -- Admin notes

  -- Timestamps
  booked_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PASSENGERS TABLE
-- Passenger details for each order
-- =====================================================
CREATE TABLE IF NOT EXISTS public.passengers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,

  -- Personal information
  gender TEXT CHECK (gender IN ('male', 'female')),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,

  -- Document information
  passport_number TEXT NOT NULL,
  passport_expiry DATE NOT NULL,
  passport_issuing_country TEXT DEFAULT 'SA', -- ISO 3166-1 alpha-2
  nationality TEXT DEFAULT 'SA', -- ISO 3166-1 alpha-2

  -- Travel details
  passenger_type TEXT DEFAULT 'ADT' CHECK (passenger_type IN ('ADT', 'CHD', 'INF')),
  seat_number TEXT,
  baggage_allowance TEXT, -- e.g., '20kg', '30kg', 'none'

  -- Additional data
  special_requests TEXT,
  frequent_flyer_number TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- DRCT_REQUESTS_LOG TABLE
-- Log all DRCT API requests for debugging
-- =====================================================
CREATE TABLE IF NOT EXISTS public.drct_requests_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Request details
  endpoint TEXT NOT NULL, -- e.g., '/offers_search', '/orders/{id}/price'
  method TEXT NOT NULL, -- 'GET', 'POST', 'PATCH', 'DELETE'

  -- Relations
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  agency_id UUID REFERENCES public.agencies(id) ON DELETE SET NULL,

  -- Request/Response data
  request_body JSONB,
  response_body JSONB,
  status_code INTEGER,

  -- Performance
  duration_ms INTEGER, -- Request duration in milliseconds

  -- Error tracking
  error_message TEXT,
  error_code TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- SEARCHES TABLE (existing, but updated)
-- Track all flight searches
-- =====================================================
CREATE TABLE IF NOT EXISTS public.searches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Relations
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  agency_id UUID REFERENCES public.agencies(id) ON DELETE SET NULL,

  -- Search parameters
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  depart_date DATE NOT NULL,
  return_date DATE,
  adults INTEGER DEFAULT 1,
  children INTEGER DEFAULT 0,
  infants INTEGER DEFAULT 0,
  cabin_class TEXT DEFAULT 'economy',

  -- Results
  offers_count INTEGER DEFAULT 0,
  search_duration_ms INTEGER,

  -- Metadata
  source TEXT DEFAULT 'web', -- 'web', 'widget', 'api'
  metadata JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Profiles
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_agency_id ON public.profiles(agency_id);

-- Agencies
CREATE INDEX idx_agencies_domain ON public.agencies(domain);
CREATE INDEX idx_agencies_api_key ON public.agencies(api_key);

-- Orders
CREATE INDEX idx_orders_order_number ON public.orders(order_number);
CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_agency_id ON public.orders(agency_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_drct_order_id ON public.orders(drct_order_id);
CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);

-- Passengers
CREATE INDEX idx_passengers_order_id ON public.passengers(order_id);

-- DRCT Requests Log
CREATE INDEX idx_drct_log_order_id ON public.drct_requests_log(order_id);
CREATE INDEX idx_drct_log_created_at ON public.drct_requests_log(created_at DESC);

-- Searches
CREATE INDEX idx_searches_user_id ON public.searches(user_id);
CREATE INDEX idx_searches_agency_id ON public.searches(agency_id);
CREATE INDEX idx_searches_created_at ON public.searches(created_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passengers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drct_requests_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.searches ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Agencies Policies
CREATE POLICY "Agencies are viewable by authenticated users"
  ON public.agencies FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can modify agencies"
  ON public.agencies FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Orders Policies
CREATE POLICY "Users can view own orders"
  ON public.orders FOR SELECT
  USING (
    -- Users can view their own orders
    user_id = auth.uid()
    OR
    -- Admins can view ALL orders (no agency_id restriction)
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
    OR
    -- Agents can view orders from their agency
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'agent'
      AND profiles.agency_id = orders.agency_id
    )
  );

CREATE POLICY "Users can create own orders"
  ON public.orders FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Agents can update orders in their agency"
  ON public.orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (
        profiles.role = 'admin'
        OR (
          profiles.role = 'agent'
          AND (
            (orders.agency_id IS NOT NULL AND profiles.agency_id = orders.agency_id)
            OR orders.user_id = auth.uid()
          )
        )
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (
        profiles.role = 'admin'
        OR (
          profiles.role = 'agent'
          AND (
            (orders.agency_id IS NOT NULL AND profiles.agency_id = orders.agency_id)
            OR orders.user_id = auth.uid()
          )
        )
      )
    )
  );

-- Passengers Policies
CREATE POLICY "Passengers visible with order access"
  ON public.passengers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = passengers.order_id
      AND (
        orders.user_id = auth.uid()
        OR
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role IN ('agent', 'admin')
          AND profiles.agency_id = orders.agency_id
        )
      )
    )
  );

-- DRCT Requests Log Policies
CREATE POLICY "Only admins can view DRCT logs"
  ON public.drct_requests_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Searches Policies
CREATE POLICY "Users can view own searches"
  ON public.searches FOR SELECT
  USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Anyone can create searches"
  ON public.searches FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agencies_updated_at
  BEFORE UPDATE ON public.agencies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_passengers_updated_at
  BEFORE UPDATE ON public.passengers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function: Generate unique order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  new_order_number TEXT;
  exists_flag BOOLEAN;
BEGIN
  LOOP
    -- Generate: AVF + 8 random digits
    new_order_number := 'AVF' || LPAD(FLOOR(RANDOM() * 100000000)::TEXT, 8, '0');

    -- Check if exists
    SELECT EXISTS(SELECT 1 FROM public.orders WHERE order_number = new_order_number) INTO exists_flag;

    EXIT WHEN NOT exists_flag;
  END LOOP;

  RETURN new_order_number;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SEED DATA (for development)
-- =====================================================

-- Insert demo agency
INSERT INTO public.agencies (id, name, domain, api_key, contact_email, contact_phone, country)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Demo Travel Agency',
  'demo',
  'demo_api_key_12345',
  'demo@aviaframe.com',
  '+966501234567',
  'SA'
) ON CONFLICT DO NOTHING;

-- Insert demo admin profile (will be linked after user signs up)
-- Note: This requires manual linking or auth trigger

-- =====================================================
-- VIEWS (for easier querying)
-- =====================================================

-- View: Orders with passenger count
CREATE OR REPLACE VIEW orders_with_details AS
SELECT
  o.*,
  COUNT(p.id) as passenger_count,
  a.name as agency_name,
  prof.email as user_email,
  prof.full_name as user_full_name
FROM public.orders o
LEFT JOIN public.passengers p ON p.order_id = o.id
LEFT JOIN public.agencies a ON a.id = o.agency_id
LEFT JOIN public.profiles prof ON prof.id = o.user_id
GROUP BY o.id, a.name, prof.email, prof.full_name;

-- Grant access to views
GRANT SELECT ON orders_with_details TO authenticated;
