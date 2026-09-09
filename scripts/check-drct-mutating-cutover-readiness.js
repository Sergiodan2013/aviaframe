#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');

const checks = [
  {
    label: 'portal booking create uses protected backend route',
    file: 'portal/client/src/App.jsx',
    mustInclude: ['createPortalOrder(', "Order created successfully via backend:"],
    mustExclude: ['drctApi.createOrder('],
  },
  {
    label: 'portal admin issue uses protected backend route',
    file: 'portal/client/src/pages/AdminDashboard.jsx',
    mustInclude: ['issueOrderTicket(order.id)'],
    mustExclude: ['drctApi.issueTickets('],
  },
  {
    label: 'portal public form no longer advertises legacy mutating order endpoint',
    file: 'portal/client/public/form.html',
    mustExclude: [
      'orderEndpoint:',
      '/webhook-test/drct/order/create',
      '/webhook/drct/order/create',
    ],
  },
  {
    label: 'widget demo booking uses widget session flow',
    file: 'widget/demo/booking.html',
    mustInclude: ['/widget/session', '/widget/orders'],
    mustExclude: [
      '/api/n8n/webhook-test/drct/order/create',
      '/api/n8n/webhook/drct/order/create',
    ],
  },
  {
    label: 'widget demo redirects no longer expose n8n mutating proxy',
    file: 'widget/demo/_redirects',
    mustInclude: ['/api/backend/*', '/api/drct/search'],
    mustExclude: ['/api/n8n/', '/webhook/drct/order/create', '/webhook/:splat'],
  },
  {
    label: 'backend guard exists for legacy mutating proxy',
    file: 'backend/src/middleware/requestGuards.js',
    mustInclude: [
      'DRCT_PROXY_MUTATION_DISABLED',
      'X-Aviaframe-Legacy-Proxy',
      'allowPublicDrctMutatingProxy !== false',
    ],
  },
  {
    label: 'backend legacy mutating webhook proxy is decommissioned',
    file: 'backend/src/app.js',
    mustExclude: [
      "app.all('/webhook/*'",
      "app.post('/webhook/drct/order/create'",
      "app.post('/webhook/drct/order/issue'",
      "app.post('/webhook/drct/order/cancel'",
    ],
  }
];

const failures = [];
const passes = [];

function readFile(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

for (const check of checks) {
  let content = '';
  try {
    content = readFile(check.file);
  } catch (error) {
    failures.push(`${check.label}: failed to read ${check.file} (${error.message})`);
    continue;
  }

  for (const token of check.mustInclude || []) {
    if (!content.includes(token)) {
      failures.push(`${check.label}: missing expected token in ${check.file}: ${token}`);
    }
  }

  for (const token of check.mustExclude || []) {
    if (content.includes(token)) {
      failures.push(`${check.label}: found forbidden token in ${check.file}: ${token}`);
    }
  }

  if (!failures.some((item) => item.startsWith(`${check.label}:`))) {
    passes.push(`${check.label} — OK`);
  }
}

if (failures.length > 0) {
  console.error('[drct-cutover-readiness] FAILED');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('[drct-cutover-readiness] PASSED');
for (const pass of passes) {
  console.log(`- ${pass}`);
}
