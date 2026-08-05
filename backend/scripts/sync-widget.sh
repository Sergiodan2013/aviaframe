#!/usr/bin/env bash
# Sync aviaframe-widget.js from aviaframe-site (source of truth) to both backend asset dirs.
# Run this after any widget change, before deploying agency sites.
set -e

MONOREPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SRC="$MONOREPO_ROOT/aviaframe-site/aviaframe-widget.js"
DST1="$MONOREPO_ROOT/backend/agency-site-assets/aviaframe-widget.js"
DST2="$MONOREPO_ROOT/backend/src/agency-site-assets/aviaframe-widget.js"

if [ ! -f "$SRC" ]; then
  echo "❌ Source not found: $SRC"
  exit 1
fi

cp "$SRC" "$DST1"
cp "$SRC" "$DST2"

SHA=$(shasum "$SRC" | cut -c1-12)
echo "✅ Widget synced (SHA $SHA)"
echo "   → $DST1"
echo "   → $DST2"
