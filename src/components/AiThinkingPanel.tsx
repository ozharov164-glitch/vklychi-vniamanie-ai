import { useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  buildThinkingPhases,
  resolveThinkingScenario,
  type ThinkingScenario,
} from '../lib/aiThinkingPhases'
import { COPY } from '../lib/copy'
import { thinkingImages } from '../lib/thinkingAssets'
import { useAiThinkingProgress } from '../hooks/useAiThinkingProgress'

type Props = {
  active: boolean
  scenario: ThinkingScenario
  premium?: boolean
  hasMemory?: boolean
  compact?: boolean
}

export function AiThinkingPanel({
  active,
  scenario,
  premium = false,
  hasMemory = false,
  compact = false,
}: Props) {
  const phases = useMemo(
    () => buildThinkingPhases(scenario, { premium, hasMemory }),
    [scenario, premium, hasMemory],
  )
  const { current, phaseIndex, total, progress } = useAiThinkingProgress(active, phases)

  if (!active || !current) return null

  const iconSrc = thinkingImages[current.icon]

  return (
    <motion.div
      className={`ai-thinking${compact ? ' ai-thinking--compact' : ''}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.99 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="ai-thinking__glow" aria-hidden />
      <div className="ai-thinking__grid" aria-hidden />

      <div className="ai-thinking__icon-wrap">
        <motion.img
          key={current.id}
          src={iconSrc}
          alt=""
          className="ai-thinking__icon"
          width={72}
          height={72}
          decoding="async"
          draggable={false}
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: 1, y: [0, -4, 0] }}
          transition={{
            opacity: { duration: 0.35 },
            scale: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
            y: { duration: 2.6, repeat: Infinity, ease: 'easeInOut', delay: 0.35 },
          }}
        />
      </div>

      <p className="ai-thinking__eyebrow">{COPY.thinking.eyebrow}</p>

      <AnimatePresence mode="wait">
        <motion.p
          key={current.id}
          className="ai-thinking__label"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.28 }}
        >
          {current.label}
        </motion.p>
      </AnimatePresence>

      <div className="ai-thinking__steps" aria-hidden>
        {phases.map((p, i) => (
          <span
            key={p.id}
            className={`ai-thinking__dot${i === phaseIndex ? ' ai-thinking__dot--on' : ''}${i < phaseIndex ? ' ai-thinking__dot--done' : ''}`}
          />
        ))}
      </div>

      <div
        className="ai-thinking__bar"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${COPY.thinking.eyebrow}: ${current.label}`}
      >
        <motion.div
          className="ai-thinking__bar-fill"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        />
        <span className="ai-thinking__bar-shimmer" />
      </div>

      <p className="ai-thinking__meta">
        {COPY.thinking.stepOf(phaseIndex + 1, total)}
      </p>
    </motion.div>
  )
}

export { resolveThinkingScenario }
