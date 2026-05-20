const base = import.meta.env.BASE_URL

export const images = {
  hero: `${base}images/splash-logo.png`,
  modeStuck: `${base}images/icon-mode-stuck.png`,
  modeNoise: `${base}images/icon-mode-noise.png`,
  tabUnfreeze: `${base}images/icon-tab-unfreeze.png`,
  tabWins: `${base}images/icon-tab-wins.png`,
} as const

export const modeImages = {
  stuck: images.modeStuck,
  noise: images.modeNoise,
} as const
