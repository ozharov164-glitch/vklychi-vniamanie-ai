#!/usr/bin/env python3
"""Remove dark/solid backgrounds from icon PNGs → true alpha transparency."""
from __future__ import annotations

import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("pip install Pillow", file=sys.stderr)
    raise


def _corner_colors(img: Image.Image, sample: int = 8) -> list[tuple[int, int, int]]:
    w, h = img.size
    pts = [
        (0, 0),
        (w - sample, 0),
        (0, h - sample),
        (w - sample, h - sample),
    ]
    colors: list[tuple[int, int, int]] = []
    px = img.load()
    for x, y in pts:
        block = []
        for dx in range(sample):
            for dy in range(sample):
                r, g, b, _ = px[x + dx, y + dy]
                block.append((r, g, b))
        colors.append(
            (
                sum(c[0] for c in block) // len(block),
                sum(c[1] for c in block) // len(block),
                sum(c[2] for c in block) // len(block),
            )
        )
    return colors


def _dist(c1: tuple[int, int, int], c2: tuple[int, int, int]) -> float:
    return ((c1[0] - c2[0]) ** 2 + (c1[1] - c2[1]) ** 2 + (c1[2] - c2[2]) ** 2) ** 0.5


def remove_background(src: Path, dst: Path, *, threshold: float = 42.0, soften: float = 18.0) -> None:
    img = Image.open(src).convert("RGBA")
    corners = _corner_colors(img)
    # Background = average of corners (usually black/dark)
    bg = (
        sum(c[0] for c in corners) // 4,
        sum(c[1] for c in corners) // 4,
        sum(c[2] for c in corners) // 4,
    )
    w, h = img.size
    px = img.load()
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            d = _dist((r, g, b), bg)
            if d <= threshold:
                px[x, y] = (r, g, b, 0)
            elif d <= threshold + soften:
                # Soft edge feather
                t = (d - threshold) / soften
                na = int(a * t)
                px[x, y] = (r, g, b, na)

    # Trim near-empty margins
    bbox = img.getbbox()
    if bbox:
        pad = 4
        left = max(0, bbox[0] - pad)
        top = max(0, bbox[1] - pad)
        right = min(w, bbox[2] + pad)
        bottom = min(h, bbox[3] + pad)
        img = img.crop((left, top, right, bottom))

    # Center on square canvas for consistent layout
    cw = ch = max(img.size[0], img.size[1], 64)
    canvas = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
    ox = (cw - img.size[0]) // 2
    oy = (ch - img.size[1]) // 2
    canvas.paste(img, (ox, oy), img)
    # Resize for target use
    max_side = 128 if "mode" in dst.name else 64
    if max(canvas.size) > max_side:
        canvas.thumbnail((max_side, max_side), Image.Resampling.LANCZOS)

    canvas.save(dst, "PNG", optimize=True)


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    assets = Path(sys.argv[1]) if len(sys.argv) > 1 else root.parent / ".cursor/projects/Users-dmitriidekhanov-cozyreset-bot/assets"
    out_dir = root / "public" / "images"
    out_dir.mkdir(parents=True, exist_ok=True)

    mapping = [
        ("icon-mode-stuck-v2.png", "icon-mode-stuck.png"),
        ("icon-mode-noise-v2.png", "icon-mode-noise.png"),
        ("icon-tab-unfreeze-v2.png", "icon-tab-unfreeze.png"),
        ("icon-tab-wins-v2.png", "icon-tab-wins.png"),
    ]
    for src_name, out_name in mapping:
        src = assets / src_name
        if not src.exists():
            src = assets / src_name.replace("-v2", "")
        if not src.exists():
            print(f"skip missing {src_name}")
            continue
        dst = out_dir / out_name
        remove_background(src, dst, threshold=48.0, soften=22.0)
        print(f"OK {dst} ({dst.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
