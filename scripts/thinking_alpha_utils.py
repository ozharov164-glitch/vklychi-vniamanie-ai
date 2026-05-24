"""Прозрачность thinking-иконок: убрать квадратную плашку и обрезать по кругу."""
from __future__ import annotations

import numpy as np
from PIL import Image, ImageEnhance, ImageFilter

# Доля радиуса холста — внутри остаётся круг, квадратные «уши» исчезают
CIRCLE_RADIUS_RATIO = 0.66


def _rgb_stats(rgb: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    lum = rgb.max(axis=2)
    spread = (
        np.abs(rgb[:, :, 0] - rgb[:, :, 1])
        + np.abs(rgb[:, :, 1] - rgb[:, :, 2])
        + np.abs(rgb[:, :, 0] - rgb[:, :, 2])
    )
    return lum, spread


def _radius_map(h: int, w: int) -> np.ndarray:
    cy, cx = (h - 1) / 2.0, (w - 1) / 2.0
    y, x = np.ogrid[:h, :w]
    return np.sqrt((x - cx) ** 2 + (y - cy) ** 2)


def strip_matte(im: Image.Image) -> Image.Image:
    """Удаляет тёмную плашку при любой alpha (в т.ч. 255) — источник квадрата."""
    arr = np.array(im.convert("RGBA"), dtype=np.uint8)
    rgb = arr[:, :, :3].astype(np.float32)
    a = arr[:, :, 3].astype(np.float32)
    lum, spread = _rgb_stats(rgb)
    h, w = a.shape
    rad = _radius_map(h, w)
    r_cut = (min(h, w) / 2.0) * CIRCLE_RADIUS_RATIO

    dark = (a > 0) & (lum < 62) & (spread < 75)
    a[dark] = 0
    rgb[dark] = 0

    outer_plate = (rad > r_cut * 0.88) & (rad < r_cut * 1.08) & (lum < 105) & (a > 12)
    a[outer_plate] = 0
    rgb[outer_plate] = 0

    fringe = (a > 0) & (a < 64)
    a[fringe] = 0
    rgb[fringe] = 0

    neon = (a >= 64) & ((lum > 50) | (spread > 28))
    a[neon] = np.clip(a[neon] * 1.1 + 6, 0, 255)

    arr[:, :, 3] = a.astype(np.uint8)
    arr[:, :, :3] = np.clip(rgb, 0, 255).astype(np.uint8)
    zero = arr[:, :, 3] == 0
    arr[zero, :3] = 0
    return Image.fromarray(arr, "RGBA")


def apply_circle_mask(im: Image.Image, radius_ratio: float = CIRCLE_RADIUS_RATIO) -> Image.Image:
    """Жёсткая круговая маска — квадратный bbox не виден в UI."""
    arr = np.array(im.convert("RGBA"), dtype=np.uint8)
    h, w = arr.shape[:2]
    rad = _radius_map(h, w)
    r_lim = (min(h, w) / 2.0) * radius_ratio
    outside = rad > r_lim
    arr[outside, 3] = 0
    arr[outside, :3] = 0
    return Image.fromarray(arr, "RGBA")


def enhance_neon(im: Image.Image) -> Image.Image:
    arr = np.array(im.convert("RGBA"), dtype=np.uint8)
    a = arr[:, :, 3]
    mask = a >= 64
    if not mask.any():
        return im

    rgb = arr[:, :, :3].astype(np.float32)
    lum, spread = _rgb_stats(rgb)
    glow = mask & ((lum > 48) | (spread > 26))
    rgb[glow] = np.clip(rgb[glow] * 1.06 + 4, 0, 255)
    arr[:, :, :3] = rgb.astype(np.uint8)

    bbox = im.getbbox()
    if not bbox:
        return Image.fromarray(arr, "RGBA")

    crop = Image.fromarray(arr, "RGBA").crop(bbox)
    c = np.array(crop)
    cm = c[:, :, 3] >= 64
    sub = Image.fromarray(c, "RGBA").convert("RGB")
    sharp = ImageEnhance.Sharpness(sub).enhance(1.28)
    sharp = sharp.filter(ImageFilter.UnsharpMask(radius=0.85, percent=150, threshold=1))
    sr = np.array(sharp)
    c[:, :, :3] = np.where(cm[..., None], sr, c[:, :, :3])

    out = Image.fromarray(arr, "RGBA")
    out.paste(Image.fromarray(c, "RGBA"), bbox[:2])
    fin = np.array(out)
    fin[fin[:, :, 3] == 0, :3] = 0
    return Image.fromarray(fin, "RGBA")


def finalize_icon(im: Image.Image) -> Image.Image:
    im = strip_matte(im)
    im = apply_circle_mask(im)
    im = enhance_neon(im)
    im = strip_matte(im)
    im = apply_circle_mask(im)
    return im
