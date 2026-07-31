'use strict';

const ORDERS_LIST_COLUMNS = [
  'id',
  'order_number',
  'user_id',
  'agency_id',
  'drct_order_id',
  'origin',
  'destination',
  'departure_time',
  'arrival_time',
  'airline_code',
  'airline_name',
  'flight_number',
  'total_price',
  'currency',
  'status',
  'payment_status',
  'payment_method',
  'payment_provider',
  'payment_provider_order_id',
  'payment_provider_status',
  'contact_email',
  'contact_phone',
  'created_at',
  'updated_at',
  'confirmed_at',
  'cancelled_at'
].join(',');

const VALID_PAYMENT_METHODS = ['online', 'cash', 'invoice', 'tamara'];

const config = {
  port: process.env.PORT || 3000,
  host: process.env.HOST || 'localhost',
  nodeEnv: process.env.NODE_ENV || 'development',
  appName: process.env.APP_NAME || 'Aviaframe Backend',
  appVersion: process.env.APP_VERSION || '0.1.0',
  logLevel: process.env.LOG_LEVEL || 'info',
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  documentsBucket: process.env.DOCUMENTS_BUCKET || 'documents',
  supportInbox: process.env.SUPPORT_INBOX || 'sergiodan2013@gmail.com',
  widgetTokenSecret: process.env.WIDGET_TOKEN_SECRET || process.env.SUPABASE_ANON_KEY || 'aviaframe-widget-dev-secret',
  widgetTokenTtlSec: Number(process.env.WIDGET_TOKEN_TTL_SEC || 1800),
  internalApiToken: process.env.INTERNAL_API_TOKEN || '',
  internalQaEnabled: process.env.INTERNAL_QA_ENABLED === 'true',
  internalQaAgencyId: process.env.INTERNAL_QA_AGENCY_ID || '',
  internalQaAllowedHosts: String(process.env.INTERNAL_QA_ALLOWED_HOSTS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean),
  internalQaMaxActiveTickets: Number(process.env.INTERNAL_QA_MAX_ACTIVE_TICKETS || 5),
  internalQaVoidWindowHours: Number(process.env.INTERNAL_QA_VOID_WINDOW_HOURS || 20),
  emailWebhookSecret: process.env.EMAIL_WEBHOOK_SECRET || '',
  allowPdfOnlyTicketIssuance: process.env.ALLOW_PDF_ONLY_TICKET_ISSUANCE === 'true',
  airportAutocompleteUrl: process.env.AIRPORT_AUTOCOMPLETE_URL || 'https://autocomplete.travelpayouts.com/places2',
  airportAutocompleteTimeoutMs: Number(process.env.AIRPORT_AUTOCOMPLETE_TIMEOUT_MS || 3500),
  publicSearchDrctEnabled: process.env.FEATURE_PUBLIC_SEARCH_DRCT === 'true'
};

module.exports = { config, ORDERS_LIST_COLUMNS, VALID_PAYMENT_METHODS };
