#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');

const patterns = [
  '/webhook/drct/order/create',
  '/webhook/drct/order/issue',
  '/webhook/drct/order/cancel',
  '/api/n8n/webhook/drct/order/create',
  '/api/n8n/webhook/drct/order/issue',
  '/api/n8n/webhook/drct/order/cancel',
];

const ignoredDirs = new Set(['.git', 'node_modules', 'dist']);

function shouldSkipDir(dirName) {
  return ignoredDirs.has(dirName);
}

function classify(relativePath) {
  if (relativePath.startsWith('tmp/')) return 'tmp-snapshot';
  if (relativePath.startsWith('docs/')) return 'docs';
  if (relativePath.endsWith('.md')) return 'docs';
  if (relativePath.includes('/tests/')) return 'tests';
  if (relativePath.startsWith('backend/scripts/')) return 'scripts';
  if (relativePath.startsWith('scripts/')) return 'scripts';
  return 'runtime-or-source';
}

function walk(dir, relativeBase = '') {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relativePath = path.join(relativeBase, entry.name);
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (shouldSkipDir(entry.name)) continue;
      files.push(...walk(fullPath, relativePath));
      continue;
    }
    files.push({ fullPath, relativePath });
  }
  return files;
}

const results = [];

for (const file of walk(repoRoot)) {
  let content = '';
  try {
    content = fs.readFileSync(file.fullPath, 'utf8');
  } catch {
    continue;
  }

  const matchedPatterns = patterns.filter((pattern) => content.includes(pattern));
  if (matchedPatterns.length === 0) continue;

  results.push({
    file: file.relativePath,
    className: classify(file.relativePath),
    matchedPatterns,
  });
}

const grouped = results.reduce((acc, item) => {
  acc[item.className] = acc[item.className] || [];
  acc[item.className].push(item);
  return acc;
}, {});

console.log('[legacy-drct-reference-scan]');
for (const className of Object.keys(grouped).sort()) {
  console.log(`## ${className} (${grouped[className].length})`);
  for (const item of grouped[className].sort((a, b) => a.file.localeCompare(b.file))) {
    console.log(`- ${item.file}`);
    console.log(`  matched: ${item.matchedPatterns.join(', ')}`);
  }
}
