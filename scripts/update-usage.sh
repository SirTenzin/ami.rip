#!/usr/bin/env bash
# Refreshes the AI-usage accolade end to end:
#   1. runs slopmeter across all harnesses (writes heatmap-last-year.json to cwd)
#   2. converts the export into src/data/usage.ts (build-usage.sh)
#   3. regenerates public/og.png with the new numbers (takumi)
# Run manually whenever you want the accolade bumped: ./scripts/update-usage.sh
set -euo pipefail
cd "$(dirname "$0")/.."

EXPORT="heatmap-last-year.json"
trap 'rm -f "$EXPORT"' EXIT

echo "==> running slopmeter"
SLOPMETER_MAX_JSONL_RECORD_BYTES=9999999999 bunx slopmeter@latest --all --format json

[ -s "$EXPORT" ] || { echo "error: expected slopmeter output at $PWD/$EXPORT" >&2; exit 1; }

echo "==> rebuilding src/data/usage.ts"
./scripts/build-usage.sh "$EXPORT"

echo "==> merging with committed history (retention losses can't shrink totals)"
python3 ./scripts/merge-usage.py

echo "==> regenerating public/og.png"
bun run og

echo "done. review with: git diff src/data/usage.ts"
