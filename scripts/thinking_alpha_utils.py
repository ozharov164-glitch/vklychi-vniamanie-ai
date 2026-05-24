"""Минимальная постобработка: только убрать чёрный фон, без круговой резки и без «убийства» неона."""
from __future__ import annotations

import numpy as np
from PIL import Image, ImageEnhance, ImageFilter


def remove_black_background(im: Image.Image, *, lum_thr: int = 28) -> Image.Image:
    arr = np.array(im.convert("RGBA"), dtype=np.uint8)
    rgb = arr[:, :, :3].astype(np.int16)
    lum = rgb.max(axis=2)
    spread = (
        np.abs(rgb[:, :, 0] - rgb[:, :, 1])
        + np.abs(rgb[:, :, 1] - rgb[:, :, 2])
        + np.abs(rgb[:, :, 0] - rgb[:, :, 2])
    )
    a = arr[:, :, 3].astype(np.int16)
    bg = (lum <= lum_thr) & (spread < 42)
    a[bg] = 0
    arr[:, :, 3] = a.astype(np.uint8)
    arr[bg, :3] = 0
    return Image.fromarray(arr, "RGBA")


def soften_fringe(im: Image.Image) -> Image.Image:
    """Слабая кромка rembg — не оставляем серую плашку."""
    arr = np.array(im.convert("RGBA"), dtype=np.uint8)
    rgb = arr[:, :, :3].astype(np.int16)
    lum = rgb.max(axis=2)
    a = arr[:, :, 3].astype(np.int16)
    fringe = (a > 0) & (a < 48) & (lum < 55)
    a[fringe] = 0
    arr[:, :, 3] = a.astype(np.uint8)
    arr[fringe, :3] = 0
    return Image.fromarray(arr, "RGBA")


def light_sharpen(im: Image.Image) -> Image.Image:
    r, g, b, a = im.split()
    rgb = Image.merge("RGB", (r, g, b))
    sharp = ImageEnhance.Sharpness(rgb).enhance(1.12)
    sharp = sharp.filter(ImageFilter.UnsharpMask(radius=0.8, percent=110, threshold=2))
    return Image.merge("RGBA", (*sharp.split(), a))


def finalize_icon(im: Image.Image) -> Image.Image:
    im = remove_black_background(im)
    im = soften_fringe(im)
    im = light_sharpen(im)
    arr = np.array(im.convert("RGBA"))
    arr[arr[:, :, 3] == 0, :3] = 0
    return Image.fromarray(arr, "RGBA")
