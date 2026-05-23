#!/usr/bin/env python3
"""Remove background from AI thinking icons (isnet-general-use + alpha matting)."""
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

NAMES = (
    "thinking-read.png",
    "thinking-memory.png",
    "thinking-focus.png",
    "thinking-sort.png",
    "thinking-anchor.png",
    "thinking-polish.png",
    "thinking-regenerate.png",
)

MAX_SIDE = 384
PAD = 14
# Доля радиуса холста, в которую должен влезать объект (круг UI ≈ 116% wrap, √2 для квадрата)
CIRCLE_FILL = 0.70
SESSION = "isnet-general-use"


def refine_alpha(im: Image.Image) -> Image.Image:
    """Убрать серую кайму и мелкие пятна фона, не трогая неоновое свечение."""
    arr = np.array(im.convert("RGBA"), dtype=np.float32)
    rgb = arr[:, :, :3]
    a = arr[:, :, 3]

    # Лёгкое сглаживание альфы — меньше «зубцов» и пятен по краю
    alpha_img = Image.fromarray(a.clip(0, 255).astype(np.uint8), mode="L")
    alpha_img = alpha_img.filter(ImageFilter.GaussianBlur(radius=0.6))
    a = np.array(alpha_img, dtype=np.float32)

    # Удалить мелкие полупрозрачные осколки фона (не в ядре объекта)
    bbox = im.getbbox()
    if bbox:
        x0, y0, x1, y1 = bbox
        mask_core = np.zeros_like(a, dtype=bool)
        cx0 = int(x0 + (x1 - x0) * 0.12)
        cy0 = int(y0 + (y1 - y0) * 0.12)
        cx1 = int(x1 - (x1 - x0) * 0.12)
        cy1 = int(y1 - (y1 - y0) * 0.12)
        mask_core[cy0:cy1, cx0:cx1] = True
        fringe = (a < 48) & (~mask_core)
        a[fringe] = 0

    # Подавить тёмно-серую кайму (остатки checkerboard / #060a10)
    lum = rgb.max(axis=2)
    dark_fringe = (a > 0) & (a < 200) & (lum < 55)
    a[dark_fringe] *= 0.15

    arr[:, :, 3] = np.clip(a, 0, 255)
    return Image.fromarray(arr.astype(np.uint8), "RGBA")


def fit_in_circle(im: Image.Image, max_side: int = MAX_SIDE, fill: float = CIRCLE_FILL) -> Image.Image:
    """Уменьшить объект, чтобы bbox вписывался во внутренний круг (без выступов за кольцо)."""
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
    if max_r <= limit:
        return im
    scale = limit / max_r
    nw = max(1, int(w * scale))
    nh = max(1, int(h * scale))
    shrunk = im.resize((nw, nh), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ox = (w - nw) // 2
    oy = (h - nh) // 2
    canvas.paste(shrunk, (ox, oy), shrunk)
    return canvas


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


def process_one(src: Path, dest: Path, session) -> None:
    raw = src.read_bytes()
    out_bytes = rembg_remove(
        raw,
        session=session,
        alpha_matting=True,
        alpha_matting_foreground_threshold=240,
        alpha_matting_background_threshold=20,
        alpha_matting_erode_size=11,
    )
    im = Image.open(io.BytesIO(out_bytes)).convert("RGBA")
    im = refine_alpha(im)
    im = fit_in_circle(im)
    dest.parent.mkdir(parents=True, exist_ok=True)
    im.save(dest, "PNG", optimize=True)
    print(f"OK {dest.name} {im.size} {dest.stat().st_size} bytes")


def main() -> None:
    session = new_session(SESSION)
    missing = [n for n in NAMES if not (SRC_DIR / n).exists()]
    if missing:
        print("Missing sources:", ", ".join(missing), file=sys.stderr)
        sys.exit(1)
    for name in NAMES:
        process_one(SRC_DIR / name, OUT_DIR / name, session)
    print(f"Done → {OUT_DIR}")


if __name__ == "__main__":
    main()
