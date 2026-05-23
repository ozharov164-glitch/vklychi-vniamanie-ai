#!/usr/bin/env python3
"""Обработка уже сгенерированных круговых иконок: rembg + вписывание в кольцо UI."""
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

MAPPING: tuple[tuple[str, str], ...] = (
    ("thinking-read-circle.png", "thinking-read.png"),
    ("thinking-memory-circle.png", "thinking-memory.png"),
    ("thinking-focus-circle.png", "thinking-focus.png"),
    ("thinking-sort-circle.png", "thinking-sort.png"),
    ("thinking-anchor-circle.png", "thinking-anchor.png"),
    ("thinking-polish-circle.png", "thinking-polish.png"),
    ("thinking-regenerate-circle.png", "thinking-regenerate.png"),
)

MAX_SIDE = 512
PAD = 8
# Почти до края кольца UI (кольцо = 100% wrap, иконка чуть внутри)
CIRCLE_FILL = 0.94
MIN_OPAQUE_RATIO = 0.08
ALPHA_CONTENT_MIN = 48
SESSION = "isnet-general-use"


def content_bbox(im: Image.Image, alpha_min: int = ALPHA_CONTENT_MIN) -> tuple[int, int, int, int] | None:
    """BBox по ярким пикселям символа, без размазанного ореола rembg по всему кадру."""
    a = np.array(im.split()[3])
    ys, xs = np.where(a >= alpha_min)
    if xs.size == 0:
        return im.getbbox()
    return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1


def content_radius(im: Image.Image, bbox: tuple[int, int, int, int]) -> float:
    w, h = im.size
    cx, cy = w / 2, h / 2
    a = np.array(im.split()[3])
    x0, y0, x1, y1 = bbox
    ys, xs = np.where(a[x0:x1, y0:y1] >= ALPHA_CONTENT_MIN)
    if xs.size == 0:
        corners = ((x0, y0), (x1, y0), (x0, y1), (x1, y1))
        return max(math.hypot(cx - x, cy - y) for x, y in corners)
    xs = xs + x0
    ys = ys + y0
    return float(max(math.hypot(cx - x, cy - y) for x, y in zip(xs, ys, strict=True)))


def strip_black_plate(im: Image.Image) -> Image.Image:
    """Убрать только чистый чёрный фон rembg, не трогая тёмное неоновое свечение."""
    arr = np.array(im.convert("RGBA"), dtype=np.float32)
    rgb = arr[:, :, :3]
    a = arr[:, :, 3]
    lum = rgb.max(axis=2)
    kill = (lum < 10) & (a > 4)
    a[kill] = 0
    arr[:, :, 3] = np.clip(a, 0, 255)
    return Image.fromarray(arr.astype(np.uint8), "RGBA")


def soften_alpha_edges(im: Image.Image) -> Image.Image:
    arr = np.array(im.convert("RGBA"), dtype=np.float32)
    a = arr[:, :, 3]
    alpha_img = Image.fromarray(a.clip(0, 255).astype(np.uint8), mode="L")
    alpha_img = alpha_img.filter(ImageFilter.GaussianBlur(radius=0.35))
    arr[:, :, 3] = np.array(alpha_img, dtype=np.float32)
    return Image.fromarray(arr.astype(np.uint8), "RGBA")


def fit_square(im: Image.Image, max_side: int = MAX_SIDE) -> Image.Image:
    bbox = content_bbox(im)
    if not bbox:
        raise ValueError("empty after background removal")
    left = max(0, bbox[0] - PAD)
    top = max(0, bbox[1] - PAD)
    right = min(im.width, bbox[2] + PAD)
    bottom = min(im.height, bbox[3] + PAD)
    im = im.crop((left, top, right, bottom))
    side = max(im.size)
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    canvas.paste(im, ((side - im.width) // 2, (side - im.height) // 2), im)
    if side != max_side:
        canvas = canvas.resize((max_side, max_side), Image.Resampling.LANCZOS)
    return canvas


def scale_to_ring(im: Image.Image, fill: float = CIRCLE_FILL) -> Image.Image:
    """Увеличить символ до fill% радиуса кольца (не уменьшаем — rembg-ореол иначе «съедает» кадр)."""
    w, h = im.size
    bbox = content_bbox(im)
    if not bbox:
        raise ValueError("empty bbox")
    cx, cy = w / 2, h / 2
    x0, y0, x1, y1 = bbox
    max_r = max(
        math.hypot(cx - x0, cy - y0),
        math.hypot(cx - x1, cy - y0),
        math.hypot(cx - x0, cy - y1),
        math.hypot(cx - x1, cy - y1),
    )
    target_r = (w / 2) * fill
    if max_r < 1:
        raise ValueError("degenerate radius")
    if max_r >= target_r * 0.98:
        return im
    scale = target_r / max_r
    if abs(scale - 1.0) < 0.02:
        return im
    nw = max(1, int(w * scale))
    nh = max(1, int(h * scale))
    scaled = im.resize((nw, nh), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ox = (w - nw) // 2
    oy = (h - nh) // 2
    canvas.paste(scaled, (ox, oy), scaled)
    return canvas


def opaque_ratio(im: Image.Image) -> float:
    a = np.array(im.split()[3])
    return float((a > 30).sum()) / a.size


def process_one(src: Path, dest: Path, session) -> None:
    raw = src.read_bytes()
    # Без alpha_matting — он «съедает» memory/sort и неон
    out_bytes = rembg_remove(raw, session=session, alpha_matting=False)
    im = Image.open(io.BytesIO(out_bytes)).convert("RGBA")
    im = strip_black_plate(im)
    im = soften_alpha_edges(im)
    im = fit_square(im)
    im = scale_to_ring(im)
    ratio = opaque_ratio(im)
    if ratio < MIN_OPAQUE_RATIO:
        raise ValueError(f"{dest.name}: too little visible content ({ratio:.1%})")
    dest.parent.mkdir(parents=True, exist_ok=True)
    im.save(dest, "PNG", optimize=True)
    print(f"OK {dest.name} {im.size} opaque={ratio:.1%} {dest.stat().st_size} bytes")


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
