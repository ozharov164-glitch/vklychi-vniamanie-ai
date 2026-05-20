/** Все иконки импортируются через Vite → URL с content-hash, без кэша старых PNG в public/. */
import splashLogo from '../assets/splash-logo.png'
import modeStuck from '../assets/icons/icon-mode-stuck.png'
import modeNoise from '../assets/icons/icon-mode-noise.png'
import tabUnfreeze from '../assets/icons/icon-tab-unfreeze.png'
import tabWins from '../assets/icons/icon-tab-wins.png'

export const images = {
  hero: splashLogo,
  modeStuck,
  modeNoise,
  tabUnfreeze,
  tabWins,
} as const

export const modeImages = {
  stuck: images.modeStuck,
  noise: images.modeNoise,
} as const

/** Для inline boot-splash в index.html (тот же файл, что hero). */
export const bootSplashLogo = splashLogo
