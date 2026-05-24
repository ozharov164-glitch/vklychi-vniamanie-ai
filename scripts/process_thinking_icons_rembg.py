#!/usr/bin/env python3
"""thinking-*-circle.png → прозрачный PNG 512px для панели ИИ."""
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

sys.path.insert(0, str(ROOT / "scripts"))
from thinking_alpha_utils import finalize_icon  # noqa: E402

ITEMS: tuple[tuple[str, str], ...] = (
    ("thinking-read-circle.png", "thinking-read.png"),
    ("thinking-memory-circle.png", "thinking-memory.png"),
    ("thinking-focus-circle.png", "thinking-focus.png"),
    ("thinking-sort-circle.png", "thinking-sort.png"),
    ("thinking-anchor-circle.png", "thinking-anchor.png"),
    ("thinking-polish-circle.png", "thinking-polish.png"),
    ("thinking-regenerate-circle.png", "thinking-regenerate.png"),
)

WORK_MIN = 1536
CANVAS = 512
CONTENT_RATIO = 0.84
SESSION = "isnet-general-use"


def upscale_work(im: Image.Image) -> Image.Image:
    m = max(im.size)
    if m >= WORK_MIN:
        return im
    s = WORK_MIN / m
    return im.resize((int(im.width * s), int(im.height * s)), Image.Resampling.LANCZOS)


def crop_subject(im: Image.Image) -> Image.Image:
    a = np.asarray(im.split()[3])
    for thr in (96, 64, 40):
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
        raise ValueError("empty cutout")
    return im.crop(box)


def place_on_canvas(im: Image.Image) -> Image.Image:
    im = crop_subject(im)
    side = int(CANVAS * CONTENT_RATIO)
    im.thumbnail((side, side), Image.Resampling.LANCZOS)
    out = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    out.paste(im, ((CANVAS - im.width) // 2, (CANVAS - im.height) // 2), im)
    return out


def process_one(src: Path, dest: Path, session) -> None:
    work = upscale_work(Image.open(src).convert("RGBA"))
    buf = io.BytesIO()
    work.save(buf, format="PNG")
    cut = Image.open(
        io.BytesIO(
            rembg_remove(
                buf.getvalue(),
                session=session,
                alpha_matting=True,
                alpha_matting_foreground_threshold=250,
                alpha_matting_background_threshold=15,
                alpha_matting_erode_size=9,
            )
        )
    ).convert("RGBA")
    im = finalize_icon(place_on_canvas(cut))
    im = finalize_icon(im)
    dest.parent.mkdir(parents=True, exist_ok=True)
    im.save(dest, "PNG", optimize=True, compress_level=6)
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
    session = new_session(SESSION)
    print(f"load {SESSION}", flush=True)
    for src, out in ITEMS:
        if args.only and out != args.only:
            continue
        process_one(SRC_DIR / src, OUT_DIR / out, session)
    print("done", flush=True)


if __name__ == "__main__":
    main()
