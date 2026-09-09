'use strict';

const { config } = require('../src/config');

const errors = [];
const warnings = [];

if (config.nodeEnv === 'production' && config.widgetTokenSecretIsWeak) {
  errors.push('WIDGET_TOKEN_SECRET must be explicitly configured in production and must not fall back to SUPABASE_ANON_KEY or aviaframe-widget-dev-secret');
}

if (config.nodeEnv === 'production' && !config.supportInbox) {
  errors.push('SUPPORT_INBOX must be configured in production');
}

if (config.nodeEnv === 'production' && config.allowPublicDrctMutatingProxy !== false) {
  warnings.push('ALLOW_PUBLIC_DRCT_MUTATING_PROXY is still enabled in production; plan migration to internal-token-only mode for /webhook/drct/order/* routes');
}

if (errors.length > 0) {
  console.error('[security-config] invalid production configuration:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

if (warnings.length > 0) {
  console.warn('[security-config] warnings:');
  for (const warning of warnings) {
    console.warn(`- ${warning}`);
  }
}

console.log('[security-config] configuration check passed');
