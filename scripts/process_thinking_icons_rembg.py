#!/usr/bin/env python3
"""
Оригинальные chat-логотипы (thinking-*-circle.png) → прозрачный PNG для панели.
Один проход isnet, без matting; убираем чёрный фон и «иконку-плашку», оставляем неон.
"""
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
CONTENT_MAX = int(CANVAS * 0.78)
SESSION = "isnet-general-use"


def _stats(arr: np.ndarray) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    rgb = arr[:, :, :3].astype(np.int16)
    lum = rgb.max(axis=2)
    spread = (
        np.abs(rgb[:, :, 0] - rgb[:, :, 1])
        + np.abs(rgb[:, :, 1] - rgb[:, :, 2])
        + np.abs(rgb[:, :, 0] - rgb[:, :, 2])
    )
    return rgb, lum, spread


def clean_cutout(im: Image.Image) -> Image.Image:
    arr = np.array(im.convert("RGBA"), dtype=np.uint8)
    rgb, lum, spread = _stats(arr)
    a = arr[:, :, 3].astype(np.int16)

    # Чистый чёрный и тёмная заливка плашки
    a[(lum < 42) & (spread < 44)] = 0
    # Мутный ореол rembg
    a[(a > 0) & (a < 110) & (lum < 54) & (spread < 42)] = 0
    # Неон / стекло — плотнее
    neon = (a > 16) & ((lum > 58) | (spread > 36))
    a[neon] = np.clip(a[neon] + 30, 0, 255)

    arr[:, :, 3] = a.astype(np.uint8)
    return Image.fromarray(arr, "RGBA")


def crop_subject(im: Image.Image) -> Image.Image:
    a = np.asarray(im.split()[3])
    for thr in (96, 72, 48):
        ys, xs = np.where(a >= thr)
        if xs.size >= 20:
            pad = 8
            return im.crop(
                (
                    max(0, int(xs.min()) - pad),
                    max(0, int(ys.min()) - pad),
                    min(im.width, int(xs.max()) + 1 + pad),
                    min(im.height, int(ys.max()) + 1 + pad),
                )
            )
    box = im.getbbox()
    if not box:
        raise ValueError("empty cutout")
    return im.crop(box)


def place_on_canvas(im: Image.Image) -> Image.Image:
    im = crop_subject(im)
    w, h = im.size
    scale = CONTENT_MAX / max(w, h)
    nw, nh = max(1, int(w * scale)), max(1, int(h * scale))
    im = im.resize((nw, nh), Image.Resampling.LANCZOS)
    out = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    out.paste(im, ((CANVAS - nw) // 2, (CANVAS - nh) // 2), im)
    return out


def process_one(src: Path, dest: Path, session) -> None:
    cut = rembg_remove(src.read_bytes(), session=session, alpha_matting=False)
    im = place_on_canvas(clean_cutout(Image.open(io.BytesIO(cut)).convert("RGBA")))
    dest.parent.mkdir(parents=True, exist_ok=True)
    im.save(dest, "PNG", optimize=True, compress_level=9)
    a = np.asarray(im.split()[3])
    vis = 100.0 * (a > 48).sum() / a.size
    print(f"OK {dest.name} {dest.stat().st_size // 1024}KB vis={vis:.1f}%", flush=True)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--only")
    args = ap.parse_args()
    missing = [s for s, _ in ITEMS if not (SRC_DIR / s).exists()]
    if missing:
        sys.exit(f"Нет исходников: {', '.join(missing)}")

    print(f"load {SESSION}", flush=True)
    session = new_session(SESSION)
    for src, out in ITEMS:
        if args.only and out != args.only:
            continue
        print(out, flush=True)
        process_one(SRC_DIR / src, OUT_DIR / out, session)
    print("done", flush=True)


if __name__ == "__main__":
    main()
