#!/usr/bin/env python3
"""Прозрачные иконки: isnet (1× загрузка) + обрезка + PNG optimize. По одной — без падений."""
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
CONTENT_MAX = int(CANVAS * 0.82)
SESSION = "isnet-general-use"


def strip_bg(im: Image.Image) -> Image.Image:
    arr = np.array(im.convert("RGBA"), dtype=np.uint8)
    rgb = arr[:, :, :3].astype(np.int16)
    a = arr[:, :, 3].astype(np.int16)
    lum = rgb.max(axis=2)
    spread = (
        np.abs(rgb[:, :, 0] - rgb[:, :, 1])
        + np.abs(rgb[:, :, 1] - rgb[:, :, 2])
        + np.abs(rgb[:, :, 0] - rgb[:, :, 2])
    )
    a[(lum < 40) & (spread < 32)] = 0
    a[(a > 0) & (a < 100) & (lum < 50) & (spread < 38)] = 0
    bright = (a > 20) & ((lum > 65) | (spread > 40))
    a[bright] = np.clip(a[bright].astype(np.int16) + 35, 0, 255).astype(np.uint8)
    arr[:, :, 3] = a
    return Image.fromarray(arr, "RGBA")


def tight_crop(im: Image.Image) -> Image.Image:
    a = np.asarray(im.split()[3])
    for thr in (100, 72, 48):
        ys, xs = np.where(a >= thr)
        if xs.size >= 24:
            pad = 6
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
        raise ValueError("empty after rembg")
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
    cut = rembg_remove(src.read_bytes(), session=session, alpha_matting=False)
    im = center_fit(strip_bg(Image.open(io.BytesIO(cut)).convert("RGBA")))
    dest.parent.mkdir(parents=True, exist_ok=True)
    im.save(dest, "PNG", optimize=True, compress_level=9)
    a = np.asarray(im.split()[3])
    print(
        f"OK {dest.name} {dest.stat().st_size // 1024}KB vis={(a > 48).sum() * 100 / a.size:.1f}%",
        flush=True,
    )


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", help="напр. thinking-read.png")
    args = ap.parse_args()
    missing = [s for s, _ in ITEMS if not (SRC_DIR / s).exists()]
    if missing:
        sys.exit(f"Нет: {', '.join(missing)}")
    print(f"session {SESSION}", flush=True)
    session = new_session(SESSION)
    for src, out in ITEMS:
        if args.only and out != args.only:
            continue
        print(out, flush=True)
        process_file(SRC_DIR / src, OUT_DIR / out, session)
    print("done", flush=True)


if __name__ == "__main__":
    main()
