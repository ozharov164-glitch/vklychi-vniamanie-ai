const base = import.meta.env.BASE_URL

export const images = {
  hero: `${base}images/hero-anchor.png`,
  dump: `${base}images/illus-dump.png`,
  steps: `${base}images/illus-steps.png`,
  focus: `${base}images/illus-focus.png`,
  today: `${base}images/illus-today.png`,
  splashLogo: `${base}images/splash-logo.png`,
  splashLogoGlow: `${base}images/splash-logo-glow.png`,
} as const
