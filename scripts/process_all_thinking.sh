#!/usr/bin/env bash
# Один запуск Python — одна загрузка isnet, все 7 иконок.
set -euo pipefail
cd "$(dirname "$0")/.."
exec python3 scripts/process_thinking_icons_rembg.py
