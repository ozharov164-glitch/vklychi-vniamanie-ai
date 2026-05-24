#!/usr/bin/env python3
"""Пост-обработка уже готовых thinking-*.webp: резкость без перегенерации AI."""
from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageEnhance, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
DIR = ROOT / "src" / "assets" / "thinking"
WEBP_QUALITY = 96


def enhance(im: Image.Image) -> Image.Image:
    arr = np.array(im.convert("RGBA"), dtype=np.uint8)
    a = arr[:, :, 3]
    mask = a > 36
    rgb = arr[:, :, :3].astype(np.float32)
    lum = rgb.max(axis=2)
    spread = (
        np.abs(rgb[:, :, 0] - rgb[:, :, 1])
        + np.abs(rgb[:, :, 1] - rgb[:, :, 2])
        + np.abs(rgb[:, :, 0] - rgb[:, :, 2])
    )
    glow = mask & ((lum > 42) | (spread > 26))
    rgb[glow] = np.clip(rgb[glow] * 1.06 + 4, 0, 255)
    arr[:, :, :3] = rgb.astype(np.uint8)

    out = Image.fromarray(arr, "RGBA")
    sharp = ImageEnhance.Sharpness(out.convert("RGB")).enhance(1.28)
    sharp = sharp.filter(ImageFilter.UnsharpMask(radius=0.9, percent=150, threshold=1))
    sr = np.array(sharp, dtype=np.uint8)
    arr[:, :, :3] = np.where(mask[..., None], sr, arr[:, :, :3])
    a[a < 12] = 0
    arr[:, :, 3] = a
    return Image.fromarray(arr, "RGBA")


def main() -> None:
    files = sorted(DIR.glob("thinking-*.webp"))
    if not files:
        sys.exit(f"no webp in {DIR}")
    for path in files:
        im = enhance(Image.open(path))
        im.save(path, "WEBP", quality=WEBP_QUALITY, method=6, lossless=False)
        print(f"OK {path.name} {path.stat().st_size // 1024}KB", flush=True)


if __name__ == "__main__":
    main()
