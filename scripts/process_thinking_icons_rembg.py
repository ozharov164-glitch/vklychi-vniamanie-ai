#!/usr/bin/env python3
"""Быстрая обработка круговых иконок: isnet + обрезка + масштаб под кольцо UI."""
from __future__ import annotations

import argparse
import io
import sys
from pathlib import Path

import numpy as np
from PIL import Image

try:
    from rembg import new_session, remove as rembg_remove
except ImportError:
    sys.exit("pip install rembg pillow numpy onnxruntime")

ROOT = Path(__file__).resolve().parents[1]
SRC_DIR = Path(
    "/Users/dmitriidekhanov/.cursor/projects/Users-dmitriidekhanov-cozyreset-bot/assets"
)
OUT_DIR = ROOT / "src" / "assets" / "thinking"

ITEMS: tuple[tuple[str, str], ...] = (
    ("thinking-read-circle.png", "thinking-read.png"),
    ("thinking-memory-circle.png", "thinking-memory.png"),
    ("thinking-focus-circle.png", "thinking-focus.png"),
    ("thinking-sort-circle.png", "thinking-sort.png"),
    ("thinking-anchor-circle.png", "thinking-anchor.png"),
    ("thinking-polish-circle.png", "thinking-polish.png"),
    ("thinking-regenerate-circle.png", "thinking-regenerate.png"),
)

CANVAS = 512
# Символ ≈70% диаметра холста → внутри пунктирного кольца (CSS disk 72%)
CONTENT_MAX = int(CANVAS * 0.70)
SESSION = "isnet-general-use"


def strip_bg(im: Image.Image) -> Image.Image:
    arr = np.array(im.convert("RGBA"), dtype=np.uint8)
    rgb = arr[:, :, :3].astype(np.int16)
    a = arr[:, :, 3].astype(np.int16)
    lum = rgb.max(axis=2)
    spread = np.abs(rgb[:, :, 0] - rgb[:, :, 1]) + np.abs(rgb[:, :, 1] - rgb[:, :, 2]) + np.abs(
        rgb[:, :, 0] - rgb[:, :, 2]
    )
    # Чёрная/серая подложка
    kill = (lum < 48) & (spread < 40)
    a[kill] = 0
    # Мутная полупрозрачность
    haze = (a > 0) & (a < 120) & (lum < 55) & (spread < 45)
    a[haze] = 0
    # Плотнее яркий неон
    neon = (a > 30) & (lum > 70) & (spread > 42)
    a[neon] = np.clip(a[neon] + 50, 0, 255)
    arr[:, :, 3] = a.astype(np.uint8)
    return Image.fromarray(arr, "RGBA")


def tight_crop(im: Image.Image) -> Image.Image:
    a = np.asarray(im.split()[3])
    for thr in (110, 80, 50):
        ys, xs = np.where(a >= thr)
        if xs.size >= 32:
            pad = 4
            x0, y0, x1, y1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
            return im.crop(
                (
                    max(0, x0 - pad),
                    max(0, y0 - pad),
                    min(im.width, x1 + pad),
                    min(im.height, y1 + pad),
                )
            )
    box = im.getbbox()
    if not box:
        raise ValueError("empty icon after cutout")
    return im.crop(box)


def center_fit(im: Image.Image) -> Image.Image:
    im = tight_crop(im)
    w, h = im.size
    scale = CONTENT_MAX / max(w, h)
    nw, nh = max(1, int(w * scale)), max(1, int(h * scale))
    im = im.resize((nw, nh), Image.Resampling.LANCZOS)
    out = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    out.paste(im, ((CANVAS - nw) // 2, (CANVAS - nh) // 2), im)
    return out


def process_file(src: Path, dest: Path, session) -> None:
    raw = src.read_bytes()
    cut = rembg_remove(raw, session=session, alpha_matting=False)
    im = Image.open(io.BytesIO(cut)).convert("RGBA")
    im = strip_bg(im)
    im = center_fit(im)
    dest.parent.mkdir(parents=True, exist_ok=True)
    im.save(dest, "PNG", optimize=True, compress_level=9)
    a = np.asarray(im.split()[3])
    pct = 100.0 * (a > 50).sum() / a.size
    print(f"OK {dest.name} {dest.stat().st_size // 1024}KB visible={pct:.1f}%", flush=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--only",
        help="только один output, напр. thinking-memory.png",
    )
    args = parser.parse_args()

    missing = [s for s, _ in ITEMS if not (SRC_DIR / s).exists()]
    if missing:
        sys.exit(f"Нет файлов: {', '.join(missing)}")

    print(f"loading {SESSION}…", flush=True)
    session = new_session(SESSION)

    for src_name, out_name in ITEMS:
        if args.only and out_name != args.only:
            continue
        print(f"→ {out_name}", flush=True)
        process_file(SRC_DIR / src_name, OUT_DIR / out_name, session)

    print(f"done {OUT_DIR}", flush=True)


if __name__ == "__main__":
    main()
