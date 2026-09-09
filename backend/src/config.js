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

const explicitWidgetTokenSecret = String(process.env.WIDGET_TOKEN_SECRET || '').trim();
const supabaseAnonKey = String(process.env.SUPABASE_ANON_KEY || '').trim();
const resolvedWidgetTokenSecret = explicitWidgetTokenSecret || supabaseAnonKey || 'aviaframe-widget-dev-secret';
const widgetTokenSecretUsesFallback = !explicitWidgetTokenSecret;
const widgetTokenSecretIsWeak = (
  !explicitWidgetTokenSecret
  || resolvedWidgetTokenSecret === 'aviaframe-widget-dev-secret'
  || (Boolean(supabaseAnonKey) && resolvedWidgetTokenSecret === supabaseAnonKey)
);

function parseEmailList(value, fallback = '') {
  return String(value || fallback)
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter((item) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item));
}

const config = {
  port: process.env.PORT || 3000,
  host: process.env.HOST || 'localhost',
  nodeEnv: process.env.NODE_ENV || 'development',
  appName: process.env.APP_NAME || 'Aviaframe Backend',
  appVersion: process.env.APP_VERSION || '0.1.0',
  logLevel: process.env.LOG_LEVEL || 'info',
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  trustedFrontendHosts: String(
    process.env.TRUSTED_FRONTEND_HOSTS
    || 'aviaframe.com,www.aviaframe.com,admin.aviaframe.com,sandbox.aviaframe.com,testenvavia.netlify.app,localhost,127.0.0.1'
  )
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean),
  documentsBucket: process.env.DOCUMENTS_BUCKET || 'documents',
  supportInbox: process.env.SUPPORT_INBOX || 'sergiodan2013@gmail.com',
  emailReplyTo: String(process.env.EMAIL_REPLY_TO || '').trim(),
  ticketEmailFrom: String(process.env.TICKET_EMAIL_FROM || '').trim(),
  agencyLeadRecipients: parseEmailList(
    process.env.AGENCY_LEAD_RECIPIENTS,
    'sergiodan2013@gmail.com,Km@consolidator.aero'
  ),
  widgetTokenSecret: resolvedWidgetTokenSecret,
  widgetTokenSecretUsesFallback,
  widgetTokenSecretIsWeak,
  widgetTokenTtlSec: Number(process.env.WIDGET_TOKEN_TTL_SEC || 1800),
  clientDryRunAllowedHosts: String(
    process.env.CLIENT_DRY_RUN_ALLOWED_HOSTS
    || 'aviaframe.com,www.aviaframe.com,sandbox.aviaframe.com,testenvavia.netlify.app,localhost,127.0.0.1'
  )
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean),
  enableContactEmailAutoLink: process.env.ENABLE_CONTACT_EMAIL_AUTO_LINK === 'true',
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
  publicSearchDrctEnabled: process.env.FEATURE_PUBLIC_SEARCH_DRCT === 'true',
  publicRateLimitWindowMs: Number(process.env.PUBLIC_RATE_LIMIT_WINDOW_MS || 60 * 1000),
  publicAutocompleteRateLimitMax: Number(process.env.PUBLIC_AUTOCOMPLETE_RATE_LIMIT_MAX || 80),
  publicSearchRateLimitMax: Number(process.env.PUBLIC_SEARCH_RATE_LIMIT_MAX || 20),
  widgetSessionRateLimitMax: Number(process.env.WIDGET_SESSION_RATE_LIMIT_MAX || 30),
  widgetPriceRateLimitMax: Number(process.env.WIDGET_PRICE_RATE_LIMIT_MAX || 40),
  widgetOrderRateLimitMax: Number(process.env.WIDGET_ORDER_RATE_LIMIT_MAX || 20),
  searchProxyRateLimitMax: Number(process.env.SEARCH_PROXY_RATE_LIMIT_MAX || 20),
  agencyLeadRateLimitMax: Number(process.env.AGENCY_LEAD_RATE_LIMIT_MAX || 5),
  agencyLeadRateLimitWindowMs: Number(process.env.AGENCY_LEAD_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  // Legacy write proxies must fail closed. Temporary compatibility mode now
  // requires an explicit opt-in instead of being enabled by omission.
  allowPublicDrctMutatingProxy: process.env.ALLOW_PUBLIC_DRCT_MUTATING_PROXY === 'true'
};

module.exports = { config, ORDERS_LIST_COLUMNS, VALID_PAYMENT_METHODS };
