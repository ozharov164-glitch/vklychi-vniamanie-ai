#!/usr/bin/env python3
"""
thinking-*-circle.png → прозрачный PNG HQ для панели ожидания ИИ.

Пайплайн: upscale → rembg (alpha matting) → неон/резкость → downscale-chain → pngquant.
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

sys.path.insert(0, str(Path(__file__).resolve().parent))
from thinking_alpha_utils import finalize_icon  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
SRC_DIR = Path(
    "/Users/dmitriidekhanov/.cursor/projects/Users-dmitriidekhanov-cozyreset-bot/assets"
)
OUT_DIR = ROOT / "src" / "assets" / "thinking"

ITEMS: tuple[tuple[str, str], ...] = (
    ("thinking-read-circle.png", "thinking-read.webp"),
    ("thinking-memory-circle.png", "thinking-memory.webp"),
    ("thinking-focus-circle.png", "thinking-focus.webp"),
    ("thinking-sort-circle.png", "thinking-sort.webp"),
    ("thinking-anchor-circle.png", "thinking-anchor.webp"),
    ("thinking-polish-circle.png", "thinking-polish.webp"),
    ("thinking-regenerate-circle.png", "thinking-regenerate.png"),
)

WORK_MIN = 1536
CANVAS = 512
CONTENT_RATIO = 0.82
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


def upscale_work(im: Image.Image) -> Image.Image:
    w, h = im.size
    m = max(w, h)
    if m >= WORK_MIN:
        return im
    scale = WORK_MIN / m
    nw, nh = int(w * scale), int(h * scale)
    return im.resize((nw, nh), Image.Resampling.LANCZOS)


def clean_cutout(im: Image.Image) -> Image.Image:
    arr = np.array(im.convert("RGBA"), dtype=np.uint8)
    rgb, lum, spread = _stats(arr)
    a = arr[:, :, 3].astype(np.int16)

    a[(lum < 38) & (spread < 48)] = 0
    a[(a > 0) & (a < 100) & (lum < 50) & (spread < 40)] = 0

    neon = (a > 12) & ((lum > 52) | (spread > 32))
    a[neon] = np.clip(a[neon] + 24, 0, 255)

    arr[:, :, 3] = a.astype(np.uint8)
    return Image.fromarray(arr, "RGBA")


def crop_subject(im: Image.Image) -> Image.Image:
    a = np.asarray(im.split()[3])
    for thr in (110, 80, 56):
        ys, xs = np.where(a >= thr)
        if xs.size >= 24:
            pad = max(10, int(min(im.size) * 0.012))
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


def downscale_chain(im: Image.Image, target: int) -> Image.Image:
    w, h = im.size
    m = max(w, h)
    if m <= target:
        return im
    cur = im
    while max(cur.size) > target * 1.35:
        m = max(cur.size)
        n = max(target, int(m * 0.72))
        ratio = n / m
        cur = cur.resize(
            (max(1, int(cur.width * ratio)), max(1, int(cur.height * ratio))),
            Image.Resampling.LANCZOS,
        )
    if max(cur.size) != target:
        ratio = target / max(cur.size)
        cur = cur.resize(
            (max(1, int(cur.width * ratio)), max(1, int(cur.height * ratio))),
            Image.Resampling.LANCZOS,
        )
    return cur


def place_on_canvas(im: Image.Image) -> Image.Image:
    im = crop_subject(im)
    content_max = int(CANVAS * CONTENT_RATIO)
    w, h = im.size
    scale = content_max / max(w, h)
    nw, nh = max(1, int(w * scale)), max(1, int(h * scale))
    im = im.resize((nw, nh), Image.Resampling.LANCZOS)
    out = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    out.paste(im, ((CANVAS - nw) // 2, (CANVAS - nh) // 2), im)
    return out


def save_optimized(im: Image.Image, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    im.save(dest, "PNG", optimize=True, compress_level=9)


def process_one(src: Path, dest: Path, session) -> None:
    work = upscale_work(Image.open(src).convert("RGBA"))
    buf = io.BytesIO()
    work.save(buf, format="PNG")
    cut_bytes = rembg_remove(buf.getvalue(), session=session, alpha_matting=False)
    im = Image.open(io.BytesIO(cut_bytes)).convert("RGBA")
    im = clean_cutout(im)
    im = downscale_chain(im, CANVAS)
    im = place_on_canvas(im)
    im = finalize_icon(im)
    save_optimized(im, dest)
    a = np.asarray(im.split()[3])
    vis = 100.0 * (a > 48).sum() / a.size
    print(f"OK {dest.name} {dest.stat().st_size // 1024}KB {CANVAS}px vis={vis:.1f}%", flush=True)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--only")
    args = ap.parse_args()
    missing = [s for s, _ in ITEMS if not (SRC_DIR / s).exists()]
    if missing:
        sys.exit(f"Нет исходников: {', '.join(missing)}")

    print(f"load {SESSION} work>={WORK_MIN} out={CANVAS}px", flush=True)
    session = new_session(SESSION)
    for src, out in ITEMS:
        if args.only and out != args.only:
            continue
        print(out, flush=True)
        process_one(SRC_DIR / src, OUT_DIR / out, session)
    print("done", flush=True)


if __name__ == "__main__":
    main()
