#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');

const candidates = [
  {
    area: 'runtime-proxy',
    label: 'backend webhook catch-all proxy block',
    file: 'backend/src/app.js',
    tokens: ["app.all('/webhook/*'", 'guardDrctMutatingProxy'],
    action: 'Remove after flip is proven stable and no internal callers depend on the catch-all proxy.',
  },
  {
    area: 'runtime-config',
    label: 'feature flag for public legacy mutating proxy',
    file: 'backend/src/config.js',
    tokens: ['ALLOW_PUBLIC_DRCT_MUTATING_PROXY', 'allowPublicDrctMutatingProxy'],
    action: 'Keep through cutover; remove only after proxy path is fully decommissioned.',
  },
  {
    area: 'service-client',
    label: 'n8n mutating order client methods',
    file: 'backend/src/services/n8nClient.js',
    tokens: ['drctCreateOrder', 'drctIssue', 'drctCancel', '/drct/order/create', '/drct/order/issue', '/drct/order/cancel'],
    action: 'Remove mutating methods after consumers are migrated or rewrite to sanctioned backend/internal flow.',
  },
  {
    area: 'service-orchestration',
    label: 'drct service circuit breakers for mutating n8n calls',
    file: 'backend/src/services/drctService.js',
    tokens: ['drct-order-create', 'drct-issue', 'drct-cancel', 'n8nClient.drctCreateOrder', 'n8nClient.drctIssue', 'n8nClient.drctCancel'],
    action: 'Refactor only together with n8nClient mutating method removal.',
  },
  {
    area: 'netlify-redirect',
    label: 'portal legacy catch-all /api/n8n redirect rule',
    file: 'portal/client/scripts/write-redirects.js',
    tokens: ['/api/n8n/*', '${backendUrl}/:splat 200'],
    action: 'Remove after telemetry window and successful flip confirm no browser traffic relies on it.',
  },
  {
    area: 'manual-test',
    label: 'deprecated mutating tests in n8n smoke script',
    file: 'backend/scripts/test_n8n.js',
    tokens: ['/drct/order/create', '/drct/order/issue', '/drct/order/cancel', 'DEPRECATED'],
    action: 'Delete or rewrite Tests 3-5 after flip; keep search/price coverage if still useful.',
  },
  {
    area: 'service-tests',
    label: 'n8n mutating service tests and examples',
    file: 'backend/tests/services/n8n-client.test.js',
    tokens: ['drctCreateOrder', 'drctCancel'],
    action: 'Update when n8nClient mutating methods are removed.',
  },
  {
    area: 'service-tests',
    label: 'drct service mock surface still expects mutating n8n client methods',
    file: 'backend/tests/services/drct-service-cancel.test.js',
    tokens: ['drctCreateOrder', 'drctIssue', 'drctCancel'],
    action: 'Adjust together with drctService/n8nClient refactor.',
  },
  {
    area: 'example',
    label: 'example code still references mutating n8n client',
    file: 'backend/src/examples/search-with-n8n.js',
    tokens: ['drctCreateOrder'],
    action: 'Archive or rewrite example after sanctioned flow becomes the only supported path.',
  },
];

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

const results = candidates.map((candidate) => {
  try {
    const content = read(candidate.file);
    const matches = candidate.tokens.filter((token) => content.includes(token));
    return {
      ...candidate,
      exists: matches.length > 0,
      matches,
    };
  } catch (error) {
    return {
      ...candidate,
      exists: false,
      error: error.message,
      matches: [],
    };
  }
});

const present = results.filter((item) => item.exists);
const missing = results.filter((item) => !item.exists);

console.log('[legacy-drct-cleanup-inventory]');
console.log(`present=${present.length} missing=${missing.length}`);

for (const item of present) {
  console.log(`- PRESENT [${item.area}] ${item.label}`);
  console.log(`  file: ${item.file}`);
  console.log(`  matched: ${item.matches.join(', ')}`);
  console.log(`  action: ${item.action}`);
}

for (const item of missing) {
  console.log(`- MISSING [${item.area}] ${item.label}`);
  console.log(`  file: ${item.file}`);
  if (item.error) {
    console.log(`  error: ${item.error}`);
  } else {
    console.log('  matched: none');
  }
}

