import { motion } from 'framer-motion'
import splashLogo from '../assets/splash-logo.png'

export function SplashArt() {
  return (
    <div className="splash-art" aria-hidden>
      <div className="splash-art__halo" />

      <motion.span
        className="splash-art__ring"
        animate={{ rotate: 360 }}
        transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
      />

      <motion.div
        className="splash-art__logo-shell"
        initial={{ opacity: 0, scale: 0.88 }}
        animate={{ opacity: 1, scale: [1, 1.03, 1], y: [0, -5, 0] }}
        transition={{
          opacity: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
          scale: { duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay: 0.6 },
          y: { duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay: 0.6 },
        }}
      >
        <img src={splashLogo} alt="" className="splash-art__logo" draggable={false} />
      </motion.div>
    </div>
  )
}
