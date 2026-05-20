import { images } from './assets'
import splashLogo from '../assets/splash-logo.png'

const ALL_IMAGES = [
  ...Object.values(images),
  splashLogo,
]

export function preloadImages(urls: string[] = ALL_IMAGES): Promise<void> {
  return Promise.all(
    urls.map(
      (url) =>
        new Promise<void>((resolve) => {
          const img = new Image()
          img.onload = () => resolve()
          img.onerror = () => resolve()
          img.src = url
        }),
    ),
  ).then(() => undefined)
}

export function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}
