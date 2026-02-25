#!/usr/bin/env node
/**
 * Generates dist/_redirects with backend proxy rules.
 * Run after `npm run build` (configured in netlify.toml build command).
 *
 * Required Netlify env var:
 *   BACKEND_URL — backend base URL (e.g. https://xxx.ngrok-free.dev)
 *
 * Without BACKEND_URL the script writes only the SPA fallback rule and
 * logs a warning. All /api/* calls will fail until you set the variable.
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(__dirname, '../dist');

if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true });
}

const backendUrl = (process.env.BACKEND_URL || '').replace(/\/+$/, '');

const rules = [];

if (backendUrl) {
  rules.push(`/api/backend/* ${backendUrl}/api/:splat 200`);
  rules.push(`/api/n8n/webhook-test/* ${backendUrl}/webhook/:splat 200`);
  rules.push(`/api/n8n/* ${backendUrl}/:splat 200`);
  console.log(`[write-redirects] Backend proxy → ${backendUrl}`);
} else {
  console.warn(
    '[write-redirects] WARNING: BACKEND_URL is not set.\n' +
    '  All /api/* calls will fail in production.\n' +
    '  Set BACKEND_URL in Netlify → Site configuration → Environment variables.'
  );
}

// SPA fallback must be last
rules.push('/* /index.html 200');

writeFileSync(resolve(distDir, '_redirects'), rules.join('\n') + '\n');
console.log('[write-redirects] dist/_redirects written.');
