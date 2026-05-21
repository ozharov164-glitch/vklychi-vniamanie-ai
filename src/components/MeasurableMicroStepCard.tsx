import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { COPY } from '../lib/copy'
import { images } from '../lib/assets'

type Props = {
  step: string
  sessionKey: string | number
}

export function MeasurableMicroStepCard({ step, sessionKey }: Props) {
  const [pulseAnim, setPulseAnim] = useState(false)
  const [showDoneAction, setShowDoneAction] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    setPulseAnim(false)
    setShowDoneAction(false)
    setDone(false)
  }, [sessionKey, step])

  function onCardClick() {
    if (done) return
    setShowDoneAction(true)
    setPulseAnim(true)
    window.Telegram?.WebApp.HapticFeedback?.impactOccurred('light')
    window.setTimeout(() => setPulseAnim(false), 480)
  }

  return (
    <motion.div
      id="focus-anchor-card"
      className={`measurable-step-card${pulseAnim ? ' measurable-step-card--pulse' : ''}${done ? ' measurable-step-card--done' : ''}`}
      onClick={onCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onCardClick()
      }}
    >
      <div className="measurable-step-card__icon" aria-hidden>
        <img src={images.flashStep} alt="" width={32} height={32} />
        <span className="measurable-step-card__bolt">⚡</span>
      </div>
      <p className="measurable-step-card__caption">{COPY.result.measurableCaption}</p>
      <motion.p
        className="measurable-step-card__step"
        key={step}
        initial={{ opacity: 0.5, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
      >
        {step}
      </motion.p>
      <p className="measurable-step-card__hint">{COPY.result.measurableHint}</p>
      {showDoneAction && (
        <motion.button
          type="button"
          className="measurable-step-card__done-btn"
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={(e) => {
            e.stopPropagation()
            setDone(true)
            window.Telegram?.WebApp.HapticFeedback?.notificationOccurred('success')
          }}
        >
          {done ? `✓ ${COPY.result.measurableDone}` : COPY.result.measurableDone}
        </motion.button>
      )}
    </motion.div>
  )
}
