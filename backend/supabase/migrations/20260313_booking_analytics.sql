-- Booking analytics: fare/tax breakdown per booking
-- Written on order creation (fire-and-forget, non-blocking)
-- Used for: fare mix reports, NDC vs Direct, tax structure, refund policy stats

CREATE TABLE IF NOT EXISTS booking_analytics (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at          timestamptz DEFAULT now(),
  order_id            uuid REFERENCES orders(id) ON DELETE SET NULL,
  agency_id           uuid,
  drct_env            text DEFAULT 'sandbox',        -- 'sandbox' | 'prod'

  -- Flight
  origin              text,
  destination         text,
  departure_date      date,
  airline_code        text,
  airline_name        text,
  flight_number       text,
  aircraft            text,
  cabin_class         text,                          -- 'Economy' | 'Business' | 'Premium Economy'

  -- Fare
  drct_offer_id       text,
  fare_basis_code     text,                          -- 'KLSOSSA1/NDC2', 'QFARE' etc
  price_class_name    text,                          -- 'Economy Flex', 'Economy Saver' etc
  class_of_service    text,                          -- 'K', 'Y', 'Q' etc
  channel             text,                          -- 'Emirates', 'Turkish', 'Cashback' etc
  content_type        text,                          -- 'NDC' | 'Direct' (derived from fare_basis_code)

  -- Pricing breakdown
  total_amount        numeric(12,2),
  currency            text,
  fare_amount         numeric(12,2),                 -- base fare (tariff)
  taxes_amount        numeric(12,2),                 -- all taxes combined
  tax_breakdown       jsonb,                         -- [{code,description,amount,currency}]
  price_details       jsonb,                         -- full price_details array from DRCT

  -- Conditions
  changeable          boolean,
  change_fee_applies  boolean,
  cancelable          boolean,
  cancel_fee_applies  boolean,

  -- Baggage
  baggage             jsonb,                         -- [{type,quantity,max_weight,label}]

  -- Passengers
  pax_adt             int DEFAULT 0,
  pax_chd             int DEFAULT 0,
  pax_inf             int DEFAULT 0,

  -- Offer metadata
  offer_expire_at     timestamptz
);

CREATE INDEX IF NOT EXISTS booking_analytics_order_id    ON booking_analytics (order_id);
CREATE INDEX IF NOT EXISTS booking_analytics_agency_id   ON booking_analytics (agency_id);
CREATE INDEX IF NOT EXISTS booking_analytics_created_at  ON booking_analytics (created_at DESC);
CREATE INDEX IF NOT EXISTS booking_analytics_airline     ON booking_analytics (airline_code);
CREATE INDEX IF NOT EXISTS booking_analytics_fare_basis  ON booking_analytics (fare_basis_code);
CREATE INDEX IF NOT EXISTS booking_analytics_env         ON booking_analytics (drct_env);

COMMENT ON TABLE booking_analytics IS
  'Per-booking fare/tax analytics. Written on order creation. Used for fare mix, NDC ratio, tax structure reports.';
