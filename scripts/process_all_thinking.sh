#!/usr/bin/env bash
# Обработка по одной иконке — не падает целиком, если одна долго идёт.
set -euo pipefail
cd "$(dirname "$0")/.."
PY=python3
SCRIPT=scripts/process_thinking_icons_rembg.py

icons=(
  thinking-read.png
  thinking-memory.png
  thinking-focus.png
  thinking-sort.png
  thinking-anchor.png
  thinking-polish.png
  thinking-regenerate.png
)

for name in "${icons[@]}"; do
  echo "=== $name ==="
  "$PY" "$SCRIPT" --only "$name"
done

echo "All thinking icons processed."
