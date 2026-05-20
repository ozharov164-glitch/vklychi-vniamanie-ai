import { motion } from 'framer-motion'

const base = import.meta.env.BASE_URL

export const splashLogo = `${base}images/splash-logo.png`
export const splashLogoGlow = `${base}images/splash-logo-glow.png`

export function SplashArt() {
  return (
    <div className="splash-art" aria-hidden>
      <motion.div
        className="splash-art__ambient"
        animate={{ opacity: [0.45, 0.75, 0.45], scale: [0.95, 1.05, 0.95] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.span
        className="splash-art__orbit splash-art__orbit--outer"
        animate={{ rotate: 360 }}
        transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
      />
      <motion.span
        className="splash-art__orbit splash-art__orbit--inner"
        animate={{ rotate: -360 }}
        transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
      />

      <motion.div
        className="splash-art__logo-wrap"
        initial={{ opacity: 0, scale: 0.72, filter: 'blur(12px)' }}
        animate={{
          opacity: 1,
          scale: 1,
          filter: 'blur(0px)',
          y: [0, -7, 0],
        }}
        transition={{
          opacity: { duration: 0.85, ease: [0.22, 1, 0.36, 1] },
          scale: { duration: 0.85, ease: [0.22, 1, 0.36, 1] },
          filter: { duration: 0.85, ease: [0.22, 1, 0.36, 1] },
          y: { duration: 3.6, repeat: Infinity, ease: 'easeInOut', delay: 0.85 },
        }}
      >
        <img src={splashLogoGlow} alt="" className="splash-art__logo-glow" draggable={false} />
        <img src={splashLogo} alt="" className="splash-art__logo" draggable={false} />
        <motion.span
          className="splash-art__shimmer"
          animate={{ x: ['-130%', '130%'] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1.2 }}
        />
      </motion.div>
    </div>
  )
}
