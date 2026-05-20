import { AnimatePresence, motion } from 'framer-motion'
import { SplashArt } from './SplashArt'

type Props = {
  progress: number
  phase: string
}

export function LoadingScreen({ progress, phase }: Props) {
  const pct = Math.min(100, Math.max(6, progress))

  return (
    <motion.div
      className="splash splash--premium"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="splash__bg splash__bg--premium" aria-hidden />
      <div className="splash__grid" aria-hidden />

      <SplashArt />

      <motion.p
        className="splash__title splash__title--premium"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        ВключиВнимание
      </motion.p>
      <motion.p
        className="splash__tagline"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.32, duration: 0.45 }}
      >
        Разморозка за 90 секунд
      </motion.p>

      <AnimatePresence mode="wait">
        <motion.p
          key={phase}
          className="splash__phase splash__phase--premium"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.28 }}
        >
          {phase}
        </motion.p>
      </AnimatePresence>

      <div className="splash__bar splash__bar--premium" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <motion.div
          className="splash__bar-fill splash__bar-fill--premium"
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        />
        <span className="splash__bar-shimmer" />
      </div>
      <p className="splash__pct">{pct}%</p>
    </motion.div>
  )
}
