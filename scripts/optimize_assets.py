#!/usr/bin/env python3
"""Оптимизация ассетов: HD splash 384px, иконки режимов 128px, табы 64px, прозрачный фон."""
from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ICONS_DIR = ROOT / "src" / "assets" / "icons"
SPLASH_OUT = ROOT / "src" / "assets" / "splash-logo.png"


def _corner_bg(img: Image.Image, sample: int = 8) -> tuple[int, int, int]:
    w, h = img.size
    pts = [(0, 0), (w - sample, 0), (0, h - sample), (w - sample, h - sample)]
    px = img.load()
    blocks: list[tuple[int, int, int]] = []
    for x, y in pts:
        rs, gs, bs = [], [], []
        for dx in range(sample):
            for dy in range(sample):
                r, g, b, _ = px[x + dx, y + dy]
                rs.append(r)
                gs.append(g)
                bs.append(b)
        blocks.append((sum(rs) // len(rs), sum(gs) // len(gs), sum(bs) // len(bs)))
    return (
        sum(c[0] for c in blocks) // 4,
        sum(c[1] for c in blocks) // 4,
        sum(c[2] for c in blocks) // 4,
    )


def _dist(a: tuple[int, int, int], b: tuple[int, int, int]) -> float:
    return ((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2) ** 0.5


def remove_background(img: Image.Image, *, threshold: float = 48.0, soften: float = 22.0) -> Image.Image:
    img = img.convert("RGBA")
    bg = _corner_bg(img)
    w, h = img.size
    px = img.load()
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            d = _dist((r, g, b), bg)
            if d <= threshold:
                px[x, y] = (r, g, b, 0)
            elif d <= threshold + soften:
                t = (d - threshold) / soften
                px[x, y] = (r, g, b, int(a * t))
    return img


def _fit_square(img: Image.Image, max_side: int, min_side: int = 0) -> Image.Image:
    bbox = img.getbbox()
    if bbox:
        pad = 6
        img = img.crop(
            (
                max(0, bbox[0] - pad),
                max(0, bbox[1] - pad),
                min(img.width, bbox[2] + pad),
                min(img.height, bbox[3] + pad),
            )
        )
    side = max(max(img.size), min_side)
    side = min(side, max_side)
    if max(img.size) > max_side:
        ratio = max_side / max(img.size)
        img = img.resize((int(img.width * ratio), int(img.height * ratio)), Image.Resampling.LANCZOS)
    cw = ch = max(img.size[0], img.size[1], min_side)
    cw = ch = min(cw, max_side)
    canvas = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
    ox = (cw - img.width) // 2
    oy = (ch - img.height) // 2
    canvas.paste(img, (ox, oy), img)
    return canvas


def optimize_splash(source: Path) -> None:
    img = remove_background(Image.open(source))
    out = _fit_square(img, max_side=384, min_side=256)
    out.save(SPLASH_OUT, "PNG", optimize=True)
    print(f"splash {SPLASH_OUT} {out.size} {SPLASH_OUT.stat().st_size} bytes")


def optimize_icon(path: Path, max_side: int) -> None:
    img = remove_background(Image.open(path))
    out = _fit_square(img, max_side=max_side)
    out.save(path, "PNG", optimize=True)
    print(f"icon {path.name} {out.size} {path.stat().st_size} bytes")


def main() -> None:
    src_splash = Path(sys.argv[1]) if len(sys.argv) > 1 else None
    if src_splash is None:
        import subprocess
        import tempfile

        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
            subprocess.run(
                ["git", "show", "4771082:src/assets/splash-logo.png"],
                cwd=ROOT,
                check=True,
                stdout=open(tmp.name, "wb"),
            )
            src_splash = Path(tmp.name)
    optimize_splash(src_splash)
    for name, side in (
        ("icon-mode-stuck.png", 128),
        ("icon-mode-noise.png", 128),
        ("icon-tab-unfreeze.png", 64),
        ("icon-tab-wins.png", 64),
    ):
        p = ICONS_DIR / name
        if p.exists():
            optimize_icon(p, side)


if __name__ == "__main__":
    main()
