#!/usr/bin/env python3
"""Круглые AI-иконки: rembg (isnet) + вписывание в круг + круговая маска."""
from __future__ import annotations

import io
import math
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

try:
    from rembg import remove as rembg_remove
    from rembg import new_session
except ImportError:
    print("pip install rembg pillow numpy onnxruntime", file=sys.stderr)
    raise

ROOT = Path(__file__).resolve().parents[1]
SRC_DIR = Path(
    "/Users/dmitriidekhanov/.cursor/projects/Users-dmitriidekhanov-cozyreset-bot/assets"
)
OUT_DIR = ROOT / "src" / "assets" / "thinking"

# Исходники v2 (круговая композиция) → финальные имена в приложении
MAPPING: tuple[tuple[str, str], ...] = (
    ("thinking-read-circle.png", "thinking-read.png"),
    ("thinking-memory-circle.png", "thinking-memory.png"),
    ("thinking-focus-circle.png", "thinking-focus.png"),
    ("thinking-sort-circle.png", "thinking-sort.png"),
    ("thinking-anchor-circle.png", "thinking-anchor.png"),
    ("thinking-polish-circle.png", "thinking-polish.png"),
    ("thinking-regenerate-circle.png", "thinking-regenerate.png"),
)

MAX_SIDE = 384
PAD = 10
CIRCLE_FILL = 0.82
MASK_FEATHER = 3
SESSION = "isnet-general-use"


def refine_alpha(im: Image.Image) -> Image.Image:
    arr = np.array(im.convert("RGBA"), dtype=np.float32)
    rgb = arr[:, :, :3]
    a = arr[:, :, 3]

    alpha_img = Image.fromarray(a.clip(0, 255).astype(np.uint8), mode="L")
    alpha_img = alpha_img.filter(ImageFilter.GaussianBlur(radius=0.5))
    a = np.array(alpha_img, dtype=np.float32)

    bbox = im.getbbox()
    if bbox:
        x0, y0, x1, y1 = bbox
        mask_core = np.zeros_like(a, dtype=bool)
        cx0 = int(x0 + (x1 - x0) * 0.1)
        cy0 = int(y0 + (y1 - y0) * 0.1)
        cx1 = int(x1 - (x1 - x0) * 0.1)
        cy1 = int(y1 - (y1 - y0) * 0.1)
        mask_core[cy0:cy1, cx0:cx1] = True
        fringe = (a < 40) & (~mask_core)
        a[fringe] = 0

    lum = rgb.max(axis=2)
    dark_fringe = (a > 0) & (a < 180) & (lum < 50)
    a[dark_fringe] *= 0.12

    arr[:, :, 3] = np.clip(a, 0, 255)
    return Image.fromarray(arr.astype(np.uint8), "RGBA")


def apply_circular_mask(im: Image.Image, feather: int = MASK_FEATHER) -> Image.Image:
    w, h = im.size
    cx, cy = w / 2, h / 2
    r = min(cx, cy) - feather
    ys, xs = np.ogrid[:h, :w]
    dist = np.sqrt((xs - cx) ** 2 + (ys - cy) ** 2)
    mask = np.clip(1.0 - (dist - r) / max(feather, 1), 0.0, 1.0)
    arr = np.array(im.convert("RGBA"), dtype=np.float32)
    arr[:, :, 3] *= mask
    return Image.fromarray(arr.astype(np.uint8), "RGBA")


def fit_square(im: Image.Image, max_side: int = MAX_SIDE) -> Image.Image:
    bbox = im.getbbox()
    if not bbox:
        return im
    left = max(0, bbox[0] - PAD)
    top = max(0, bbox[1] - PAD)
    right = min(im.width, bbox[2] + PAD)
    bottom = min(im.height, bbox[3] + PAD)
    im = im.crop((left, top, right, bottom))
    ratio = max_side / max(im.size)
    if ratio < 1:
        im = im.resize(
            (int(im.width * ratio), int(im.height * ratio)),
            Image.Resampling.LANCZOS,
        )
    side = max(im.size)
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    ox = (side - im.width) // 2
    oy = (side - im.height) // 2
    canvas.paste(im, (ox, oy), im)
    if side != max_side:
        canvas = canvas.resize((max_side, max_side), Image.Resampling.LANCZOS)
    return canvas


def fit_in_circle(im: Image.Image, max_side: int = MAX_SIDE, fill: float = CIRCLE_FILL) -> Image.Image:
    im = fit_square(im, max_side)
    w, h = im.size
    bbox = im.getbbox()
    if not bbox:
        return im
    cx, cy = w / 2, h / 2
    x0, y0, x1, y1 = bbox
    corners = ((x0, y0), (x1, y0), (x0, y1), (x1, y1))
    max_r = max(math.hypot(cx - x, cy - y) for x, y in corners)
    limit = (w / 2) * fill
    if max_r > limit:
        scale = limit / max_r
        nw = max(1, int(w * scale))
        nh = max(1, int(h * scale))
        shrunk = im.resize((nw, nh), Image.Resampling.LANCZOS)
        canvas = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        ox = (w - nw) // 2
        oy = (h - nh) // 2
        canvas.paste(shrunk, (ox, oy), shrunk)
        im = canvas
    return apply_circular_mask(im)


def process_one(src: Path, dest: Path, session) -> None:
    raw = src.read_bytes()
    out_bytes = rembg_remove(
        raw,
        session=session,
        alpha_matting=True,
        alpha_matting_foreground_threshold=240,
        alpha_matting_background_threshold=18,
        alpha_matting_erode_size=10,
    )
    im = Image.open(io.BytesIO(out_bytes)).convert("RGBA")
    im = refine_alpha(im)
    im = fit_in_circle(im)
    dest.parent.mkdir(parents=True, exist_ok=True)
    im.save(dest, "PNG", optimize=True)
    print(f"OK {dest.name} {im.size} {dest.stat().st_size} bytes")


def main() -> None:
    session = new_session(SESSION)
    missing = [src for src, _ in MAPPING if not (SRC_DIR / src).exists()]
    if missing:
        print("Missing sources:", ", ".join(missing), file=sys.stderr)
        sys.exit(1)
    for src_name, out_name in MAPPING:
        process_one(SRC_DIR / src_name, OUT_DIR / out_name, session)
    print(f"Done → {OUT_DIR}")


if __name__ == "__main__":
    main()
