#!/usr/bin/env python3
"""AI background removal (rembg/u2net) + fit for mode cards. Source: cursor assets originals."""
from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image

try:
    from rembg import remove as rembg_remove
except ImportError:
    print("pip install rembg", file=sys.stderr)
    raise

ROOT = Path(__file__).resolve().parents[1]
SRC = Path(
    "/Users/dmitriidekhanov/.cursor/projects/Users-dmitriidekhanov-cozyreset-bot/assets"
)
OUT_DIR = ROOT / "src" / "assets" / "icons"
PUBLIC_DIR = ROOT / "public" / "assets" / "images"

MAPPING = (
    ("unfreeze-icon.png", "mode-stuck.png"),
    ("brain-dump-icon.png", "mode-noise.png"),
    ("flash-step.png", "flash-step.png"),
)

MAX_SIDE = 512
PAD = 12


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


def validate_no_holes(im: Image.Image, name: str) -> None:
    """Fail if large dark transparent holes appear inside the subject bbox."""
    import numpy as np

    arr = np.array(im.convert("RGBA"))
    a = arr[:, :, 3]
    bbox = im.getbbox()
    if not bbox:
        raise ValueError(f"{name}: empty image after rembg")
    x0, y0, x1, y1 = bbox
    pad_x = int((x1 - x0) * 0.15)
    pad_y = int((y1 - y0) * 0.15)
    cx0, cx1 = x0 + pad_x, x1 - pad_x
    cy0, cy1 = y0 + pad_y, y1 - pad_y
    if cx1 <= cx0 or cy1 <= cy0:
        return
    core = arr[cy0:cy1, cx0:cx1]
    rgb = core[:, :, :3]
    alpha = core[:, :, 3]
    if "flash" in name:
        return
    dark_hole = (alpha < 40) & (rgb.max(axis=2) < 90)
    hole_ratio = dark_hole.sum() / max(1, dark_hole.size)
    if hole_ratio > 0.08:
        raise ValueError(f"{name}: too many dark holes in core ({hole_ratio:.2%})")
    if alpha[alpha.shape[0] // 2, alpha.shape[1] // 2] < 128:
        raise ValueError(f"{name}: center pixel too transparent")


def process_one(src: Path, dest: Path, *, session: str = "isnet-general-use") -> None:
    raw = src.read_bytes()
    out_bytes = rembg_remove(raw, session_id=session)
    im = Image.open(__import__("io").BytesIO(out_bytes)).convert("RGBA")
    im = fit_square(im)
    validate_no_holes(im, dest.name)
    dest.parent.mkdir(parents=True, exist_ok=True)
    im.save(dest, "PNG")
    print(f"OK {dest.name} {im.size} {dest.stat().st_size} bytes")


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    PUBLIC_DIR.mkdir(parents=True, exist_ok=True)
    for src_name, out_name in MAPPING:
        src = SRC / src_name
        if not src.exists():
            print(f"MISSING {src}", file=sys.stderr)
            sys.exit(1)
        out = OUT_DIR / out_name
        session = "isnet-general-use"
        process_one(src, out, session=session)
        import shutil

        shutil.copy2(out, PUBLIC_DIR / src_name)


if __name__ == "__main__":
    main()
