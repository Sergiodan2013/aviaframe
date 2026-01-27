-- Aviaframe Database Schema
-- PostgreSQL / Supabase
-- Version: 1.0
-- Date: 2026-01-26
--
-- This schema implements the Aviaframe logical data model with:
-- - Multi-tenant architecture (tenant_id scoping)
-- - Automatic timestamps (created_at, updated_at)
-- - Proper data types for prices (NUMERIC) and dates (TIMESTAMPTZ)
-- - Foreign key constraints for data integrity
-- - Indexes for performance
-- - Row Level Security (RLS) ready for Supabase

-- =============================================================================
-- EXTENSIONS
-- =============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto for encryption functions (for PII encryption later)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- ENUMS (Status types for type safety)
-- =============================================================================

-- Tenant status
CREATE TYPE tenant_status AS ENUM ('active', 'suspended', 'deleted');

-- User status
CREATE TYPE user_status AS ENUM ('active', 'invited', 'suspended');

-- Subscription status
CREATE TYPE subscription_status AS ENUM ('active', 'trial', 'cancelled', 'past_due');

-- Order/Booking status
CREATE TYPE order_status AS ENUM ('PENDING', 'BOOKED', 'ISSUED', 'CANCELLED', 'FAILED', 'RECONCILE');

-- DRCT request types
CREATE TYPE drct_request_type AS ENUM ('offers_search', 'price', 'order_create', 'issue', 'cancel');

-- =============================================================================
-- TABLE: organizations (Tenant)
-- =============================================================================

CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Basic info
  name VARCHAR(255) NOT NULL,
  legal_name VARCHAR(255),

  -- Regional settings
  primary_country VARCHAR(2), -- ISO 3166-1 alpha-2
  default_currency VARCHAR(3) DEFAULT 'USD', -- ISO 4217
  default_locale VARCHAR(10) DEFAULT 'en-US',

  -- Status
  status tenant_status NOT NULL DEFAULT 'active',

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT organizations_name_not_empty CHECK (LENGTH(TRIM(name)) > 0)
);

-- Indexes
CREATE INDEX idx_organizations_status ON organizations(status);
CREATE INDEX idx_organizations_created_at ON organizations(created_at DESC);

-- Comments
COMMENT ON TABLE organizations IS 'Tenant/Agency organizations (B2B customers)';
COMMENT ON COLUMN organizations.metadata IS 'Free-form JSON for tags, region hints, custom fields';

-- =============================================================================
-- TABLE: roles
-- =============================================================================

CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Role definition
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  permissions JSONB NOT NULL DEFAULT '[]', -- Array of permission identifiers

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT roles_name_not_empty CHECK (LENGTH(TRIM(name)) > 0)
);

-- Insert default roles
INSERT INTO roles (name, description, permissions) VALUES
  ('platform_admin', 'Platform administrator with full access', '["*"]'),
  ('agency_admin', 'Agency administrator managing tenant settings and users', '["tenant:manage", "users:manage", "bookings:manage", "widget:configure"]'),
  ('agent', 'Agency agent performing searches and bookings', '["bookings:create", "bookings:view", "searches:create"]')
ON CONFLICT (name) DO NOTHING;

COMMENT ON TABLE roles IS 'User roles for RBAC (Role-Based Access Control)';

-- =============================================================================
-- TABLE: users (AgencyUser)
-- =============================================================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Tenant association
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Authentication
  email VARCHAR(255) NOT NULL,
  display_name VARCHAR(255),
  password_hash VARCHAR(255), -- bcrypt hash (if using password auth)
  auth_provider VARCHAR(50) DEFAULT 'password', -- password, oauth, saml

  -- Authorization
  role_id UUID NOT NULL REFERENCES roles(id),

  -- Status
  status user_status NOT NULL DEFAULT 'invited',
  last_login_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT users_email_not_empty CHECK (LENGTH(TRIM(email)) > 0),
  CONSTRAINT users_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  UNIQUE(tenant_id, email) -- Email unique per tenant
);

-- Indexes
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_email ON users(tenant_id, email);
CREATE INDEX idx_users_role_id ON users(role_id);
CREATE INDEX idx_users_status ON users(status);

COMMENT ON TABLE users IS 'Agency users (admins and agents) with tenant-scoped access';
COMMENT ON COLUMN users.email IS 'Email is unique within tenant scope';

-- =============================================================================
-- TABLE: searches (Search history)
-- =============================================================================

CREATE TABLE searches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Tenant association
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Nullable if widget search

  -- Search parameters
  origin VARCHAR(3) NOT NULL, -- IATA airport code
  destination VARCHAR(3) NOT NULL, -- IATA airport code
  depart_date DATE NOT NULL,
  return_date DATE, -- Nullable for one-way
  adults INT NOT NULL DEFAULT 1,
  children INT DEFAULT 0,
  infants INT DEFAULT 0,
  cabin_class VARCHAR(20), -- economy, premium_economy, business, first

  -- Results summary
  offers_count INT DEFAULT 0, -- Number of offers returned
  search_duration_ms INT, -- Time taken for search

  -- DRCT tracking
  drct_request_id UUID, -- Link to DRCT request log

  -- Metadata
  source VARCHAR(50), -- portal, widget, api
  session_id VARCHAR(100), -- For session tracking
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT searches_origin_valid CHECK (LENGTH(origin) = 3),
  CONSTRAINT searches_destination_valid CHECK (LENGTH(destination) = 3),
  CONSTRAINT searches_adults_positive CHECK (adults > 0),
  CONSTRAINT searches_passengers_reasonable CHECK (adults + children + infants <= 9)
);

-- Indexes
CREATE INDEX idx_searches_tenant_id ON searches(tenant_id);
CREATE INDEX idx_searches_user_id ON searches(user_id);
CREATE INDEX idx_searches_created_at ON searches(created_at DESC);
CREATE INDEX idx_searches_route ON searches(origin, destination);
CREATE INDEX idx_searches_depart_date ON searches(depart_date);

COMMENT ON TABLE searches IS 'Search history for analytics and billing metering';
COMMENT ON COLUMN searches.source IS 'Origin of search: portal, widget, or api';

-- =============================================================================
-- TABLE: bookings (OrderRecord)
-- =============================================================================

CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Tenant association
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- External references
  af_offer_id VARCHAR(255), -- Aviaframe offer ID
  drct_order_id VARCHAR(255), -- DRCT external order ID

  -- Status
  status order_status NOT NULL DEFAULT 'PENDING',

  -- Pricing
  amount_total NUMERIC(10, 2) NOT NULL, -- Total price (e.g., 1234.56)
  currency VARCHAR(3) NOT NULL DEFAULT 'USD', -- ISO 4217
  fare_breakdown JSONB, -- Detailed breakdown: base_fare, taxes, fees

  -- Passenger data (ENCRYPTED - contains PII)
  passenger_data JSONB NOT NULL, -- Encrypted passenger info
  contact_email VARCHAR(255), -- Masked or hashed for privacy
  contact_phone VARCHAR(50), -- Masked or hashed for privacy

  -- Idempotency
  idempotency_key VARCHAR(255) UNIQUE, -- For safe retries

  -- Flight details
  route_info JSONB, -- origin, destination, dates, flight numbers

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  issued_at TIMESTAMPTZ, -- When ticket was issued
  cancelled_at TIMESTAMPTZ, -- When booking was cancelled

  -- Constraints
  CONSTRAINT bookings_amount_positive CHECK (amount_total >= 0),
  CONSTRAINT bookings_currency_valid CHECK (LENGTH(currency) = 3)
);

-- Indexes
CREATE INDEX idx_bookings_tenant_id ON bookings(tenant_id);
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_created_at ON bookings(created_at DESC);
CREATE INDEX idx_bookings_drct_order_id ON bookings(drct_order_id) WHERE drct_order_id IS NOT NULL;
CREATE INDEX idx_bookings_idempotency_key ON bookings(idempotency_key) WHERE idempotency_key IS NOT NULL;

COMMENT ON TABLE bookings IS 'Order/booking records with encrypted passenger data';
COMMENT ON COLUMN bookings.passenger_data IS 'ENCRYPTED JSON containing passenger names, documents, DOB';
COMMENT ON COLUMN bookings.idempotency_key IS 'Client-provided key for idempotent order creation';

-- =============================================================================
-- TABLE: drct_request_logs
-- =============================================================================

CREATE TABLE drct_request_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Tenant association (nullable for platform-level calls)
  tenant_id UUID REFERENCES organizations(id) ON DELETE SET NULL,

  -- Request tracking
  correlation_id VARCHAR(100), -- Trace/correlation ID
  request_type drct_request_type NOT NULL,

  -- Timing
  request_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  response_time TIMESTAMPTZ,
  latency_ms INT,

  -- Request/Response (SANITIZED - no raw PII)
  request_payload_sanitized JSONB,
  response_payload_sanitized JSONB,

  -- Response status
  status_code INT,
  drct_external_id VARCHAR(255), -- External reference from DRCT

  -- Association
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,

  -- Error tracking
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_drct_logs_tenant_id ON drct_request_logs(tenant_id);
CREATE INDEX idx_drct_logs_booking_id ON drct_request_logs(booking_id);
CREATE INDEX idx_drct_logs_request_type ON drct_request_logs(request_type);
CREATE INDEX idx_drct_logs_created_at ON drct_request_logs(created_at DESC);
CREATE INDEX idx_drct_logs_correlation_id ON drct_request_logs(correlation_id);

COMMENT ON TABLE drct_request_logs IS 'Append-only log of DRCT API interactions (sanitized, no raw PII)';
COMMENT ON COLUMN drct_request_logs.request_payload_sanitized IS 'Request payload with PII masked/removed';
COMMENT ON COLUMN drct_request_logs.response_payload_sanitized IS 'Response payload with PII masked/removed';

-- =============================================================================
-- TABLE: audit_logs
-- =============================================================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Tenant association (nullable for platform-level actions)
  tenant_id UUID REFERENCES organizations(id) ON DELETE SET NULL,

  -- Actor
  user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Nullable for system actions

  -- Action details
  action VARCHAR(100) NOT NULL, -- ORDER_CREATED, ORDER_ISSUED, USER_INVITED, etc.
  resource_type VARCHAR(50), -- booking, user, organization, etc.
  resource_id UUID, -- ID of affected resource

  -- Context
  details_sanitized JSONB DEFAULT '{}', -- Structured context, PII masked
  ip_address_masked VARCHAR(50), -- Masked client IP
  user_agent TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

COMMENT ON TABLE audit_logs IS 'Immutable audit trail of user and system actions';
COMMENT ON COLUMN audit_logs.details_sanitized IS 'Action context with PII masked';

-- =============================================================================
-- FUNCTIONS: Auto-update updated_at timestamp
-- =============================================================================

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER set_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON roles
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) - Supabase
-- =============================================================================

-- Enable RLS on tenant-scoped tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE drct_request_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Example RLS policy (customize based on your auth setup)
-- This is a basic policy - adjust based on your authentication strategy

-- Policy: Users can only see their own tenant's data
CREATE POLICY tenant_isolation_policy ON organizations
  FOR ALL
  USING (id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_policy ON users
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_policy ON searches
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_policy ON bookings
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_policy ON drct_request_logs
  FOR ALL
  USING (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
    OR tenant_id IS NULL -- Allow platform-level logs
  );

CREATE POLICY tenant_isolation_policy ON audit_logs
  FOR ALL
  USING (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
    OR tenant_id IS NULL -- Allow platform-level logs
  );

-- =============================================================================
-- VIEWS: Useful reporting views
-- =============================================================================

-- View: Booking statistics per organization
CREATE OR REPLACE VIEW booking_stats_by_org AS
SELECT
  o.id as organization_id,
  o.name as organization_name,
  COUNT(CASE WHEN b.status = 'BOOKED' THEN 1 END) as booked_count,
  COUNT(CASE WHEN b.status = 'ISSUED' THEN 1 END) as issued_count,
  COUNT(CASE WHEN b.status = 'CANCELLED' THEN 1 END) as cancelled_count,
  SUM(CASE WHEN b.status IN ('BOOKED', 'ISSUED') THEN b.amount_total ELSE 0 END) as total_revenue,
  b.currency,
  COUNT(*) as total_bookings
FROM organizations o
LEFT JOIN bookings b ON o.id = b.tenant_id
GROUP BY o.id, o.name, b.currency;

COMMENT ON VIEW booking_stats_by_org IS 'Booking statistics aggregated by organization';

-- View: Search statistics per organization
CREATE OR REPLACE VIEW search_stats_by_org AS
SELECT
  o.id as organization_id,
  o.name as organization_name,
  COUNT(*) as total_searches,
  COUNT(CASE WHEN s.offers_count > 0 THEN 1 END) as searches_with_results,
  AVG(s.search_duration_ms) as avg_search_duration_ms,
  DATE(s.created_at) as search_date
FROM organizations o
LEFT JOIN searches s ON o.id = s.tenant_id
GROUP BY o.id, o.name, DATE(s.created_at);

COMMENT ON VIEW search_stats_by_org IS 'Daily search statistics per organization';

-- =============================================================================
-- SAMPLE DATA (for development/testing)
-- =============================================================================

-- Insert a test organization
INSERT INTO organizations (name, legal_name, primary_country, default_currency, status)
VALUES ('Test Travel Agency', 'Test Travel Agency LLC', 'AE', 'AED', 'active')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- GRANTS (Adjust based on your Supabase role setup)
-- =============================================================================

-- Grant usage to authenticated users (Supabase default role)
-- GRANT USAGE ON SCHEMA public TO authenticated;
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
-- GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =============================================================================
-- END OF SCHEMA
-- =============================================================================

-- To apply this schema in Supabase:
-- 1. Go to SQL Editor in Supabase Dashboard
-- 2. Copy and paste this entire file
-- 3. Click "Run"
--
-- Or use psql:
-- psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT].supabase.co:5432/postgres" < schema.sql
