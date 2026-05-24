#!/usr/bin/env python3
"""Починка прозрачности + резкость уже готовых thinking-*.webp (без AI)."""
from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from thinking_alpha_utils import enhance_neon, strip_matte  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
DIR = ROOT / "src" / "assets" / "thinking"
WEBP_QUALITY = 96


def main() -> None:
    files = sorted(DIR.glob("thinking-*.webp"))
    if not files:
        sys.exit(f"no webp in {DIR}")
    for path in files:
        im = enhance_neon(strip_matte(Image.open(path)))
        im = strip_matte(im)
        im.save(path, "WEBP", quality=WEBP_QUALITY, method=6, lossless=False)
        print(f"OK {path.name} {path.stat().st_size // 1024}KB", flush=True)


if __name__ == "__main__":
    main()
