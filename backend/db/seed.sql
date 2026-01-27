-- Aviaframe Database Seed Data
-- PostgreSQL / Supabase
-- Version: 1.0
-- Date: 2026-01-26
--
-- This file contains sample test data for development and testing.
-- DO NOT use in production!

-- =============================================================================
-- ORGANIZATIONS (Test Agencies)
-- =============================================================================

-- Test organization 1: UAE Agency
INSERT INTO organizations (id, name, legal_name, primary_country, default_currency, status)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Dubai Travel Agency', 'Dubai Travel Agency LLC', 'AE', 'AED', 'active'),
  ('00000000-0000-0000-0000-000000000002', 'Saudi Travel Co', 'Saudi Travel Company Ltd', 'SA', 'SAR', 'active'),
  ('00000000-0000-0000-0000-000000000003', 'Global Tours', 'Global Tours International', 'AE', 'USD', 'active')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- USERS (Test Agents and Admins)
-- =============================================================================

-- Get role IDs
DO $$
DECLARE
  platform_admin_role_id UUID;
  agency_admin_role_id UUID;
  agent_role_id UUID;
BEGIN
  SELECT id INTO platform_admin_role_id FROM roles WHERE name = 'platform_admin';
  SELECT id INTO agency_admin_role_id FROM roles WHERE name = 'agency_admin';
  SELECT id INTO agent_role_id FROM roles WHERE name = 'agent';

  -- Platform admin
  INSERT INTO users (id, tenant_id, email, display_name, password_hash, role_id, status, auth_provider)
  VALUES
    ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'admin@aviaframe.com', 'Platform Admin', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', platform_admin_role_id, 'active', 'password')
  ON CONFLICT (tenant_id, email) DO NOTHING;

  -- Dubai Travel Agency users
  INSERT INTO users (id, tenant_id, email, display_name, password_hash, role_id, status, auth_provider)
  VALUES
    ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'admin@dubaitravel.ae', 'Ahmed Al-Mansoori', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', agency_admin_role_id, 'active', 'password'),
    ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'agent1@dubaitravel.ae', 'Fatima Hassan', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', agent_role_id, 'active', 'password')
  ON CONFLICT (tenant_id, email) DO NOTHING;

  -- Saudi Travel Co users
  INSERT INTO users (id, tenant_id, email, display_name, password_hash, role_id, status, auth_provider)
  VALUES
    ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000002', 'admin@sauditravel.sa', 'Mohammed Al-Saud', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', agency_admin_role_id, 'active', 'password'),
    ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000002', 'agent1@sauditravel.sa', 'Nora Abdullah', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', agent_role_id, 'active', 'password')
  ON CONFLICT (tenant_id, email) DO NOTHING;
END $$;

-- =============================================================================
-- SEARCHES (Sample search history)
-- =============================================================================

-- Recent searches from Dubai Travel Agency
INSERT INTO searches (tenant_id, user_id, origin, destination, depart_date, return_date, adults, children, cabin_class, offers_count, search_duration_ms, source)
VALUES
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'DXB', 'LHR', '2026-03-15', '2026-03-22', 2, 0, 'economy', 15, 850, 'portal'),
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'DXB', 'JFK', '2026-04-10', '2026-04-20', 1, 0, 'business', 8, 920, 'portal'),
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'AUH', 'CDG', '2026-05-05', NULL, 1, 0, 'economy', 12, 780, 'widget'),
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'DXB', 'SYD', '2026-06-01', '2026-06-15', 4, 2, 'economy', 20, 1150, 'portal');

-- Searches from Saudi Travel Co
INSERT INTO searches (tenant_id, user_id, origin, destination, depart_date, return_date, adults, children, cabin_class, offers_count, search_duration_ms, source)
VALUES
  ('00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000005', 'RUH', 'CAI', '2026-02-28', '2026-03-05', 2, 1, 'economy', 18, 650, 'portal'),
  ('00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000005', 'JED', 'IST', '2026-03-10', '2026-03-17', 1, 0, 'business', 10, 890, 'widget'),
  ('00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000005', 'RUH', 'LHR', '2026-04-15', '2026-04-22', 3, 0, 'economy', 14, 820, 'portal');

-- =============================================================================
-- BOOKINGS (Sample orders)
-- =============================================================================

-- Booking 1: Completed ticket (Dubai Travel Agency)
INSERT INTO bookings (
  id,
  tenant_id,
  user_id,
  af_offer_id,
  drct_order_id,
  status,
  amount_total,
  currency,
  fare_breakdown,
  passenger_data,
  contact_email,
  contact_phone,
  idempotency_key,
  route_info,
  issued_at
)
VALUES (
  '20000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000003',
  'AF-2026-001-DXB-LHR',
  'DRCT-ORD-123456',
  'ISSUED',
  2450.00,
  'AED',
  '{"base_fare": 1800.00, "taxes": 450.00, "fees": 200.00}',
  '{"passengers": [{"first_name": "John", "last_name": "Doe", "dob": "1985-05-15", "passport": "ENCRYPTED"}]}',
  'j***@example.com',
  '+971******1234',
  'idem-key-001-20260126',
  '{"origin": "DXB", "destination": "LHR", "depart_date": "2026-03-15", "return_date": "2026-03-22"}',
  NOW() - INTERVAL '2 days'
);

-- Booking 2: Pending booking (Dubai Travel Agency)
INSERT INTO bookings (
  id,
  tenant_id,
  user_id,
  af_offer_id,
  status,
  amount_total,
  currency,
  fare_breakdown,
  passenger_data,
  contact_email,
  contact_phone,
  idempotency_key,
  route_info
)
VALUES (
  '20000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000003',
  'AF-2026-002-DXB-JFK',
  'PENDING',
  8500.00,
  'AED',
  '{"base_fare": 7200.00, "taxes": 900.00, "fees": 400.00}',
  '{"passengers": [{"first_name": "Jane", "last_name": "Smith", "dob": "1990-08-20", "passport": "ENCRYPTED"}]}',
  'j***@example.com',
  '+971******5678',
  'idem-key-002-20260126',
  '{"origin": "DXB", "destination": "JFK", "depart_date": "2026-04-10", "return_date": "2026-04-20"}'
);

-- Booking 3: Issued ticket (Saudi Travel Co)
INSERT INTO bookings (
  id,
  tenant_id,
  user_id,
  af_offer_id,
  drct_order_id,
  status,
  amount_total,
  currency,
  fare_breakdown,
  passenger_data,
  contact_email,
  contact_phone,
  idempotency_key,
  route_info,
  issued_at
)
VALUES (
  '20000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000005',
  'AF-2026-003-RUH-CAI',
  'DRCT-ORD-789012',
  'ISSUED',
  1850.00,
  'SAR',
  '{"base_fare": 1500.00, "taxes": 250.00, "fees": 100.00}',
  '{"passengers": [{"first_name": "Ahmed", "last_name": "Ali", "dob": "1988-03-12", "passport": "ENCRYPTED"}, {"first_name": "Sara", "last_name": "Ali", "dob": "2015-07-08", "passport": "ENCRYPTED"}]}',
  'a***@example.sa',
  '+966******9012',
  'idem-key-003-20260126',
  '{"origin": "RUH", "destination": "CAI", "depart_date": "2026-02-28", "return_date": "2026-03-05"}',
  NOW() - INTERVAL '5 hours'
);

-- Booking 4: Cancelled booking (Saudi Travel Co)
INSERT INTO bookings (
  id,
  tenant_id,
  user_id,
  af_offer_id,
  drct_order_id,
  status,
  amount_total,
  currency,
  fare_breakdown,
  passenger_data,
  contact_email,
  contact_phone,
  idempotency_key,
  route_info,
  issued_at,
  cancelled_at
)
VALUES (
  '20000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000005',
  'AF-2026-004-JED-IST',
  'DRCT-ORD-345678',
  'CANCELLED',
  3200.00,
  'SAR',
  '{"base_fare": 2800.00, "taxes": 300.00, "fees": 100.00}',
  '{"passengers": [{"first_name": "Mohammed", "last_name": "Hassan", "dob": "1992-11-25", "passport": "ENCRYPTED"}]}',
  'm***@example.sa',
  '+966******3456',
  'idem-key-004-20260126',
  '{"origin": "JED", "destination": "IST", "depart_date": "2026-03-10", "return_date": "2026-03-17"}',
  NOW() - INTERVAL '3 days',
  NOW() - INTERVAL '1 day'
);

-- =============================================================================
-- DRCT REQUEST LOGS (Sample DRCT interactions)
-- =============================================================================

INSERT INTO drct_request_logs (
  tenant_id,
  correlation_id,
  request_type,
  request_time,
  response_time,
  latency_ms,
  request_payload_sanitized,
  response_payload_sanitized,
  status_code,
  booking_id
)
VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'trace-001-abc',
    'offers_search',
    NOW() - INTERVAL '1 hour',
    NOW() - INTERVAL '1 hour' + INTERVAL '850 milliseconds',
    850,
    '{"origin": "DXB", "destination": "LHR", "date": "2026-03-15"}',
    '{"offers": ["SANITIZED"], "count": 15}',
    200,
    NULL
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'trace-002-def',
    'order_create',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days' + INTERVAL '1200 milliseconds',
    1200,
    '{"offer_id": "AF-2026-001-DXB-LHR", "passengers": "REDACTED"}',
    '{"order_id": "DRCT-ORD-123456", "status": "confirmed"}',
    200,
    '20000000-0000-0000-0000-000000000001'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'trace-003-ghi',
    'issue',
    NOW() - INTERVAL '2 days' + INTERVAL '5 minutes',
    NOW() - INTERVAL '2 days' + INTERVAL '5 minutes' + INTERVAL '2300 milliseconds',
    2300,
    '{"order_id": "DRCT-ORD-123456"}',
    '{"ticket_numbers": ["REDACTED"], "status": "issued"}',
    200,
    '20000000-0000-0000-0000-000000000001'
  );

-- =============================================================================
-- AUDIT LOGS (Sample audit trail)
-- =============================================================================

INSERT INTO audit_logs (
  tenant_id,
  user_id,
  action,
  resource_type,
  resource_id,
  details_sanitized,
  ip_address_masked
)
VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000003',
    'ORDER_CREATED',
    'booking',
    '20000000-0000-0000-0000-000000000001',
    '{"amount": 2450.00, "currency": "AED", "route": "DXB-LHR"}',
    '192.168.xxx.xxx'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000003',
    'ORDER_ISSUED',
    'booking',
    '20000000-0000-0000-0000-000000000001',
    '{"ticket_issued": true}',
    '192.168.xxx.xxx'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000002',
    'USER_INVITED',
    'user',
    '10000000-0000-0000-0000-000000000003',
    '{"email": "REDACTED", "role": "agent"}',
    '192.168.xxx.xxx'
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000005',
    'ORDER_CANCELLED',
    'booking',
    '20000000-0000-0000-0000-000000000004',
    '{"reason": "customer_request", "refund_amount": 3200.00}',
    '192.168.xxx.xxx'
  );

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Count records per table
SELECT 'organizations' as table_name, COUNT(*) as count FROM organizations
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'searches', COUNT(*) FROM searches
UNION ALL
SELECT 'bookings', COUNT(*) FROM bookings
UNION ALL
SELECT 'drct_request_logs', COUNT(*) FROM drct_request_logs
UNION ALL
SELECT 'audit_logs', COUNT(*) FROM audit_logs
ORDER BY table_name;

-- Sample query: Get all bookings with user and org info
SELECT
  b.id as booking_id,
  b.status,
  b.amount_total,
  b.currency,
  o.name as organization_name,
  u.display_name as agent_name,
  b.created_at
FROM bookings b
JOIN organizations o ON b.tenant_id = o.id
LEFT JOIN users u ON b.user_id = u.id
ORDER BY b.created_at DESC;

-- Sample query: Search statistics
SELECT
  DATE(created_at) as search_date,
  COUNT(*) as total_searches,
  COUNT(CASE WHEN offers_count > 0 THEN 1 END) as successful_searches,
  AVG(search_duration_ms) as avg_duration_ms
FROM searches
GROUP BY DATE(created_at)
ORDER BY search_date DESC;

-- =============================================================================
-- END OF SEED DATA
-- =============================================================================

-- NOTE: Password hash in seed data is bcrypt hash of 'password123'
-- For testing only! Change in production!
