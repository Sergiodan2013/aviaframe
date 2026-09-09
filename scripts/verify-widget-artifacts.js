#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const repoRoot = path.resolve(__dirname, '..');

const files = [
  {
    label: 'build output',
    file: path.join(repoRoot, 'widget', 'dist', 'aviaframe-widget.iife.js'),
  },
  {
    label: 'widget package public bundle',
    file: path.join(repoRoot, 'widget', 'aviaframe-widget.js'),
  },
  {
    label: 'widget demo public bundle',
    file: path.join(repoRoot, 'widget', 'demo', 'aviaframe-widget.js'),
  },
  {
    label: 'public site widget bundle',
    file: path.join(repoRoot, 'aviaframe-site', 'aviaframe-widget.js'),
  },
  {
    label: 'backend agency asset bundle',
    file: path.join(repoRoot, 'backend', 'agency-site-assets', 'aviaframe-widget.js'),
  },
  {
    label: 'backend runtime agency asset bundle',
    file: path.join(repoRoot, 'backend', 'src', 'agency-site-assets', 'aviaframe-widget.js'),
  },
];

function sha256(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

function relative(filePath) {
  return path.relative(repoRoot, filePath);
}

const missing = files.filter(({ file }) => !fs.existsSync(file));
if (missing.length > 0) {
  console.error('Missing widget artifact(s):');
  for (const entry of missing) {
    console.error(`- ${entry.label}: ${relative(entry.file)}`);
  }
  console.error('\nBuild the widget first and ensure public copies exist before verifying.');
  process.exit(1);
}

const hashes = files.map((entry) => ({
  ...entry,
  hash: sha256(entry.file),
}));

const baseline = hashes[0].hash;
const mismatches = hashes.filter((entry) => entry.hash !== baseline);

if (mismatches.length > 0) {
  console.error('Widget artifact drift detected:');
  for (const entry of hashes) {
    console.error(`- ${entry.label}: ${relative(entry.file)} ${entry.hash}`);
  }
  console.error(
    '\nExpected all widget bundles to match the built artifact. ' +
    'Sync the public copies intentionally before release.'
  );
  process.exit(1);
}

console.log('Widget artifacts are in sync:');
for (const entry of hashes) {
  console.log(`- ${entry.label}: ${relative(entry.file)}`);
}
