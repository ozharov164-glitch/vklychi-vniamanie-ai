"""Общие функции: убрать квадратную matte-плашку, резкость только по неону."""
from __future__ import annotations

import numpy as np
from PIL import Image, ImageEnhance, ImageFilter


def _rgb_stats(rgb: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    lum = rgb.max(axis=2)
    spread = (
        np.abs(rgb[:, :, 0] - rgb[:, :, 1])
        + np.abs(rgb[:, :, 1] - rgb[:, :, 2])
        + np.abs(rgb[:, :, 0] - rgb[:, :, 2])
    )
    return lum, spread


def strip_matte(im: Image.Image) -> Image.Image:
    """Удаляет тёмную полупрозрачную плашку rembg/WebP — источник «квадрата»."""
    arr = np.array(im.convert("RGBA"), dtype=np.uint8)
    rgb = arr[:, :, :3].astype(np.float32)
    a = arr[:, :, 3].astype(np.float32)
    lum, spread = _rgb_stats(rgb)

    plate = (a > 0) & (a < 200) & (lum < 78) & (spread < 58)
    a[plate] = 0
    rgb[plate] = 0

    fringe = (a > 0) & (a < 56)
    a[fringe] = 0
    rgb[fringe] = 0

    neon = (a >= 56) & ((lum > 48) | (spread > 28))
    a[neon] = np.clip(a[neon] * 1.12 + 8, 0, 255)

    arr[:, :, 3] = a.astype(np.uint8)
    arr[:, :, :3] = np.clip(rgb, 0, 255).astype(np.uint8)
    zero = arr[:, :, 3] == 0
    arr[zero, :3] = 0
    return Image.fromarray(arr, "RGBA")


def enhance_neon(im: Image.Image) -> Image.Image:
    """Резкость только внутри неона — прозрачность не заливается чёрным."""
    arr = np.array(im.convert("RGBA"), dtype=np.uint8)
    a = arr[:, :, 3]
    mask = a >= 64
    if not mask.any():
        return im

    rgb = arr[:, :, :3].astype(np.float32)
    lum, spread = _rgb_stats(rgb)
    glow = mask & ((lum > 46) | (spread > 26))
    rgb[glow] = np.clip(rgb[glow] * 1.07 + 5, 0, 255)
    arr[:, :, :3] = rgb.astype(np.uint8)

    bbox = im.getbbox()
    if not bbox:
        return Image.fromarray(arr, "RGBA")

    crop = Image.fromarray(arr, "RGBA").crop(bbox)
    c = np.array(crop)
    cm = c[:, :, 3] >= 64
    sub = Image.fromarray(c, "RGBA").convert("RGB")
    sharp = ImageEnhance.Sharpness(sub).enhance(1.32)
    sharp = sharp.filter(ImageFilter.UnsharpMask(radius=0.9, percent=155, threshold=1))
    sr = np.array(sharp)
    c[:, :, :3] = np.where(cm[..., None], sr, c[:, :, :3])

    out = Image.fromarray(arr, "RGBA")
    out.paste(Image.fromarray(c, "RGBA"), bbox[:2])
    fin = np.array(out)
    fin[fin[:, :, 3] == 0, :3] = 0
    return Image.fromarray(fin, "RGBA")
