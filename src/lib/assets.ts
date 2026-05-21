/** Все иконки импортируются через Vite → URL с content-hash, без кэша старых PNG в public/. */
import splashLogo from '../assets/splash-logo.png'
import modeStuck from '../../public/assets/icons/unfreeze-icon.svg'
import modeNoise from '../../public/assets/icons/brain-dump-icon.svg'
import flashStep from '../../public/assets/icons/flash-step.svg'
import tabUnfreeze from '../assets/icons/icon-tab-unfreeze.png'
import tabWins from '../assets/icons/icon-tab-wins.png'

export const images = {
  hero: splashLogo,
  modeStuck,
  modeNoise,
  flashStep,
  tabUnfreeze,
  tabWins,
} as const

export const modeImages = {
  stuck: images.modeStuck,
  noise: images.modeNoise,
} as const

/** Для inline boot-splash в index.html (тот же файл, что hero). */
export const bootSplashLogo = splashLogo
