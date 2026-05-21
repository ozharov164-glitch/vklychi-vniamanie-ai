#!/usr/bin/env python3
"""Подготовка HQ-иконок режимов: прозрачный фон, без сжатия, только src/assets/icons/."""
from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from optimize_assets import _fit_square, remove_background  # noqa: E402

OUT = ROOT / "src" / "assets" / "icons"
SOURCES = ROOT / "scripts" / "icon_sources"

MAPPING = (
    ("unfreeze-icon.png", "mode-stuck-hq.png"),
    ("brain-dump-icon.png", "mode-noise-hq.png"),
    ("flash-step.png", "flash-step-hq.png"),
)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    src_dir = SOURCES if SOURCES.exists() else ROOT / "public" / "assets" / "images"
    for src_name, out_name in MAPPING:
        p = src_dir / src_name
        if not p.exists():
            print(f"skip missing {p}")
            continue
        img = remove_background(Image.open(p), threshold=42, soften=28)
        out = _fit_square(img, max_side=512)
        dest = OUT / out_name
        out.save(dest, "PNG")
        print(f"ok {dest.name} {out.size} {dest.stat().st_size} bytes")


if __name__ == "__main__":
    main()
