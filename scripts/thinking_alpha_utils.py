"""Лёгкая постобработка: убрать чёрный фон, сохранить неон (только PIL/numpy)."""
from __future__ import annotations

from collections import deque

import numpy as np
from PIL import Image, ImageEnhance, ImageFilter


def _rgb_stats(rgb: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    lum = rgb.max(axis=2).astype(np.float32)
    spread = (
        np.abs(rgb[:, :, 0] - rgb[:, :, 1])
        + np.abs(rgb[:, :, 1] - rgb[:, :, 2])
        + np.abs(rgb[:, :, 0] - rgb[:, :, 2])
    ).astype(np.float32)
    return lum, spread


def _is_neon(lum: np.ndarray, spread: np.ndarray, rgb: np.ndarray) -> np.ndarray:
    mx = rgb.max(axis=2).astype(np.float32)
    return (
        (mx >= 88)
        | (rgb[:, :, 2] >= 95)
        | (rgb[:, :, 0] >= 82)
        | ((spread >= 34) & (lum >= 62))
        | ((lum >= 78) & (spread >= 24))
    )


def flood_transparent_dark(
    a: np.ndarray,
    lum: np.ndarray,
    spread: np.ndarray,
    *,
    lum_thr: float = 46,
    spread_thr: float = 54,
) -> np.ndarray:
    h, w = a.shape
    bg_seed = (lum <= lum_thr) & (spread <= spread_thr) & (a > 0)
    if not bg_seed.any():
        return a

    out = a.copy()
    q: deque[tuple[int, int]] = deque()
    for y, x in ((0, 0), (0, w - 1), (h - 1, 0), (h - 1, w - 1)):
        if bg_seed[y, x]:
            out[y, x] = 0
            q.append((y, x))

    while q:
        y, x = q.popleft()
        for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if 0 <= ny < h and 0 <= nx < w and out[ny, nx] and bg_seed[ny, nx]:
                out[ny, nx] = 0
                q.append((ny, nx))
    return out


def remove_black_background(im: Image.Image) -> Image.Image:
    arr = np.array(im.convert("RGBA"), dtype=np.uint8)
    rgb = arr[:, :, :3].astype(np.float32)
    lum, spread = _rgb_stats(rgb)
    neon = _is_neon(lum, spread, rgb)
    a = arr[:, :, 3].astype(np.float32)

    a = flood_transparent_dark(a.astype(np.uint8), lum, spread).astype(np.float32)

    kill = (lum <= 50) & (spread <= 52) & (~neon)
    a[kill] = 0
    rgb[kill] = 0

    dim = (~neon) & (a > 0) & (lum < 88)
    if dim.any():
        factor = np.clip(np.power(lum[dim] / 78.0, 1.45), 0.0, 1.0)
        a[dim] *= factor
        for c in range(3):
            rgb[:, :, c][dim] *= factor

    tiny = (a < 28) | ((a > 0) & (lum < 36) & (~neon))
    a[tiny] = 0
    rgb[tiny] = 0

    arr[:, :, 3] = np.clip(a, 0, 255).astype(np.uint8)
    arr[:, :, :3] = np.clip(rgb, 0, 255).astype(np.uint8)
    zero = arr[:, :, 3] == 0
    arr[zero, :3] = 0
    return Image.fromarray(arr, "RGBA")


def decontaminate_rgb(im: Image.Image) -> Image.Image:
    arr = np.array(im.convert("RGBA"), dtype=np.float32)
    rgb = arr[:, :, :3]
    a = arr[:, :, 3]
    lum, spread = _rgb_stats(rgb)
    neon = _is_neon(lum, spread, rgb)

    mask = (a > 6) & (~neon) & (lum < 90)
    if mask.any():
        lift = np.clip(np.power(lum[mask] / 90.0, 0.85), 0.12, 1.0)
        for c in range(3):
            rgb[:, :, c][mask] *= lift
        a[mask] *= np.clip(lum[mask] / 90.0, 0.1, 1.0)
        arr[:, :, :3] = np.clip(rgb, 0, 255)
        arr[:, :, 3] = np.clip(a, 0, 255)

    arr[arr[:, :, 3] < 5, :3] = 0
    return Image.fromarray(arr.astype(np.uint8), "RGBA")


def light_sharpen(im: Image.Image) -> Image.Image:
    r, g, b, a = im.split()
    sharp = ImageEnhance.Sharpness(Image.merge("RGB", (r, g, b))).enhance(1.08)
    return Image.merge("RGBA", (*sharp.split(), a))


def finalize_icon(im: Image.Image) -> Image.Image:
    im = remove_black_background(im)
    im = decontaminate_rgb(im)
    im = light_sharpen(im)
    arr = np.array(im.convert("RGBA"))
    arr[arr[:, :, 3] == 0, :3] = 0
    return Image.fromarray(arr, "RGBA")
