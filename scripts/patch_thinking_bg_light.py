#!/usr/bin/env python3
"""Лёгкая починка фона: только PIL/numpy по готовым PNG, без rembg и upscale."""
from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from thinking_alpha_utils import finalize_icon  # noqa: E402

SRC = ROOT / "src" / "assets" / "thinking"
OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else SRC


def main() -> None:
    files = sorted(SRC.glob("thinking-*.png"))
    if not files:
        sys.exit(f"no PNG in {SRC}")
    OUT.mkdir(parents=True, exist_ok=True)
    for path in files:
        im = finalize_icon(Image.open(path))
        dest = OUT / path.name
        im.save(dest, "PNG", optimize=True, compress_level=6)
        print(f"OK {dest.name} {dest.stat().st_size // 1024}KB", flush=True)


if __name__ == "__main__":
    main()
