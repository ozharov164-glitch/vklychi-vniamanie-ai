#!/usr/bin/env python3
"""Финальная починка thinking-иконок: круг, без квадрата, PNG для Telegram."""
from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from thinking_alpha_utils import finalize_icon  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
DIR = ROOT / "src" / "assets" / "thinking"


def main() -> None:
    files = sorted(DIR.glob("thinking-*.webp")) + sorted(DIR.glob("thinking-*.png"))
    if not files:
        sys.exit(f"no icons in {DIR}")
    seen: set[str] = set()
    for path in files:
        stem = path.stem
        if stem in seen:
            continue
        seen.add(stem)
        out = DIR / f"{stem}.png"
        im = finalize_icon(Image.open(path))
        im.save(out, "PNG", optimize=True, compress_level=9)
        if path.suffix.lower() == ".webp" and path.exists():
            path.unlink()
        print(f"OK {out.name} {out.stat().st_size // 1024}KB", flush=True)


if __name__ == "__main__":
    main()
