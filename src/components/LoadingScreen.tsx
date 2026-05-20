import { motion } from 'framer-motion'

type Props = {
  progress: number
  phase: string
}

export function LoadingScreen({ progress, phase }: Props) {
  return (
    <motion.div
      className="splash"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="splash__bg" aria-hidden />
      <motion.div
        className="splash__mark"
        initial={{ scale: 0.88, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <span className="splash__ring splash__ring--1" />
        <span className="splash__ring splash__ring--2" />
        <span className="splash__ring splash__ring--3" />
        <span className="splash__anchor" aria-hidden>
          ⚓
        </span>
      </motion.div>

      <motion.p
        className="splash__title"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
      >
        ВключиВнимание
      </motion.p>
      <motion.p
        className="splash__phase"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
      >
        {phase}
      </motion.p>

      <div className="splash__bar" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
        <motion.div
          className="splash__bar-fill"
          initial={{ width: '8%' }}
          animate={{ width: `${Math.min(100, Math.max(8, progress))}%` }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        />
      </div>
    </motion.div>
  )
}
