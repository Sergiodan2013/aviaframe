#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const distDir = path.join(repoRoot, 'portal/client/dist');
const assetsDir = path.join(distDir, 'assets');

function formatKb(bytes) {
  return `${(bytes / 1024).toFixed(2)} KiB`;
}

function listFiles(dir) {
  return fs.readdirSync(dir)
    .map((name) => {
      const fullPath = path.join(dir, name);
      const stat = fs.statSync(fullPath);
      return {
        name,
        fullPath,
        bytes: stat.size,
      };
    })
    .filter((entry) => fs.statSync(entry.fullPath).isFile())
    .sort((a, b) => b.bytes - a.bytes);
}

if (!fs.existsSync(distDir) || !fs.existsSync(assetsDir)) {
  console.error('[portal-build-artifacts] missing portal/client/dist/assets');
  console.error('Run `npm --prefix portal/client run build` first.');
  process.exit(1);
}

const assetFiles = listFiles(assetsDir);
const indexHtmlPath = path.join(distDir, 'index.html');
const indexHtmlSize = fs.existsSync(indexHtmlPath) ? fs.statSync(indexHtmlPath).size : 0;

console.log('[portal-build-artifacts]');
console.log(`index.html: ${formatKb(indexHtmlSize)}`);

for (const file of assetFiles) {
  console.log(`- ${file.name}: ${formatKb(file.bytes)}`);
}

const jsAssets = assetFiles.filter((file) => file.name.endsWith('.js'));
if (jsAssets.length > 0) {
  const largestJs = jsAssets[0];
  console.log(`largest-js: ${largestJs.name} (${formatKb(largestJs.bytes)})`);
}
