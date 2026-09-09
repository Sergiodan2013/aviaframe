#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const LEGACY_PATHS = new Set([
  'drct/order/create',
  'drct/order/issue',
  'drct/order/cancel',
]);

const DEFAULT_EXPORT_FILE = 'outputs/drct-cutover-backup/n8n-workflows-live-2026-06-23.json';

function extractJsonArray(raw) {
  const start = raw.indexOf('[');
  if (start === -1) {
    throw new Error('Could not find JSON array in workflow export');
  }
  return JSON.parse(raw.slice(start));
}

function findLegacyWebhookPaths(workflow) {
  const matches = [];
  for (const node of Array.isArray(workflow.nodes) ? workflow.nodes : []) {
    const maybePath = node?.parameters?.path;
    if (typeof maybePath === 'string' && LEGACY_PATHS.has(maybePath)) {
      matches.push(maybePath);
    }
  }
  return [...new Set(matches)];
}

async function loadFromApi() {
  const baseUrl = String(process.env.N8N_API_BASE_URL || '').replace(/\/+$/, '');
  const apiKey = String(process.env.N8N_API_KEY || '').trim();
  if (!baseUrl || !apiKey) {
    return null;
  }

  const url = `${baseUrl}/api/v1/workflows?limit=250`;
  const response = await fetch(url, {
    headers: {
      'X-N8N-API-KEY': apiKey,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`n8n API request failed: ${response.status} ${response.statusText}`);
  }

  const payload = await response.json();
  const data = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
  return {
    source: `api:${baseUrl}`,
    workflows: data,
  };
}

function loadFromExport(repoRoot) {
  const relativeFile = process.env.N8N_WORKFLOWS_EXPORT_FILE || DEFAULT_EXPORT_FILE;
  const fullPath = path.join(repoRoot, relativeFile);
  const raw = fs.readFileSync(fullPath, 'utf8');
  return {
    source: `export:${relativeFile}`,
    workflows: extractJsonArray(raw),
  };
}

async function main() {
  const repoRoot = path.resolve(__dirname, '..');
  let loaded = null;

  try {
    loaded = await loadFromApi();
  } catch (error) {
    console.error(`[n8n-legacy-workflows] API check failed: ${error.message}`);
    process.exit(1);
  }

  if (!loaded) {
    loaded = loadFromExport(repoRoot);
  }

  const legacy = loaded.workflows
    .map((workflow) => ({
      name: workflow.name || 'Unnamed workflow',
      id: workflow.id || null,
      active: Boolean(workflow.active),
      isArchived: Boolean(workflow.isArchived),
      paths: findLegacyWebhookPaths(workflow),
    }))
    .filter((workflow) => workflow.paths.length > 0);

  console.log(`[n8n-legacy-workflows] source=${loaded.source}`);

  if (legacy.length === 0) {
    console.log('No legacy mutating workflows found.');
    process.exit(0);
  }

  for (const workflow of legacy) {
    console.log(`- ${workflow.name}`);
    console.log(`  id: ${workflow.id || 'unknown'}`);
    console.log(`  active: ${workflow.active}`);
    console.log(`  archived: ${workflow.isArchived}`);
    console.log(`  paths: ${workflow.paths.join(', ')}`);
  }

  const activeLegacy = legacy.filter((workflow) => workflow.active && !workflow.isArchived);
  if (activeLegacy.length > 0) {
    console.error(`[n8n-legacy-workflows] BLOCKER: ${activeLegacy.length} active legacy mutating workflows detected.`);
    process.exit(2);
  }

  console.log('[n8n-legacy-workflows] OK: legacy workflows exist only as inactive or archived artifacts.');
}

main().catch((error) => {
  console.error(`[n8n-legacy-workflows] unexpected error: ${error.message}`);
  process.exit(1);
});
