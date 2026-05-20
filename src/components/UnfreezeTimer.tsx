import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { apiOutcome } from '../api'
import { useAppStore } from '../store'

export function UnfreezeTimer() {
  const active = useAppStore((s) => s.activeUnfreeze)
  const setActiveUnfreeze = useAppStore((s) => s.setActiveUnfreeze)
  const setStats = useAppStore((s) => s.setStats)

  const totalSeconds = active?.durationSec ?? 90
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds)
  const [running, setRunning] = useState(true)
  const [paused, setPaused] = useState(false)
  const [timeUp, setTimeUp] = useState(false)
  const [showEarlyFinish, setShowEarlyFinish] = useState(false)
  const [finishing, setFinishing] = useState(false)

  useEffect(() => {
    if (!active) return
    setSecondsLeft(active.durationSec)
    setRunning(true)
    setPaused(false)
    setTimeUp(false)
    setShowEarlyFinish(false)
  }, [active?.sessionId, active?.durationSec])

  useEffect(() => {
    if (!running || paused || secondsLeft <= 0 || !active) return
    const t = window.setInterval(() => setSecondsLeft((s) => s - 1), 1000)
    return () => clearInterval(t)
  }, [running, paused, secondsLeft, active])

  useEffect(() => {
    if (running && !paused && secondsLeft === 0 && active) {
      setRunning(false)
      setTimeUp(true)
      window.Telegram?.WebApp.HapticFeedback?.notificationOccurred('success')
    }
  }, [running, paused, secondsLeft, active])

  const progress = useMemo(() => {
    if (!totalSeconds) return 0
    return Math.max(0, Math.min(1, (totalSeconds - secondsLeft) / totalSeconds))
  }, [secondsLeft, totalSeconds])

  if (!active) return null

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const ss = String(secondsLeft % 60).padStart(2, '0')

  async function finish(outcome: 'done' | 'partial' | 'enough') {
    if (!active || finishing) return
    setFinishing(true)
    try {
      const res = await apiOutcome(active.sessionId, outcome)
      setStats(res.stats)
      setActiveUnfreeze(null)
      window.Telegram?.WebApp.HapticFeedback?.impactOccurred('light')
    } finally {
      setFinishing(false)
    }
  }

  const showOutcomes = timeUp || showEarlyFinish

  return (
    <motion.div className="unfreeze-timer stack" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div className="unfreeze-card">
        <p className="unfreeze-card__label">{active.taskLabel}</p>
        <p className="unfreeze-card__step">{active.microStep}</p>
        {active.reflection && <p className="unfreeze-card__reflection">{active.reflection}</p>}
      </div>

      <div className="timer-card">
        <div className="timer-ring timer-ring--compact">
          <svg className="timer-ring__svg" viewBox="0 0 100 100" aria-hidden>
            <circle className="timer-ring__track" cx="50" cy="50" r="44" />
            <circle
              className="timer-ring__progress"
              cx="50"
              cy="50"
              r="44"
              style={{
                strokeDasharray: `${2 * Math.PI * 44}`,
                strokeDashoffset: `${2 * Math.PI * 44 * (1 - progress)}`,
              }}
            />
          </svg>
          <span className="timer-ring__time">
            {mm}:{ss}
          </span>
        </div>
        <p className="timer-card__hint">
          {timeUp
            ? '90 секунд прошли — как ты? Любой ответ — победа.'
            : paused
              ? 'Пауза. Продолжим, когда будешь готов(а).'
              : 'Один шаг. Без оценки — просто попробуй.'}
        </p>

        {running && !timeUp && !showEarlyFinish && (
          <div className="timer-controls">
            <button type="button" className="btn-secondary btn-secondary--compact" onClick={() => setPaused((p) => !p)}>
              {paused ? 'Продолжить' : 'Пауза'}
            </button>
            <button type="button" className="btn-secondary btn-secondary--compact" onClick={() => setShowEarlyFinish(true)}>
              Завершить раньше
            </button>
          </div>
        )}

        <AnimatePresence>
          {showOutcomes && (
            <motion.div
              className="timer-outcomes"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <button type="button" className="btn-primary" disabled={finishing} onClick={() => finish('done')}>
                Сделал(а)
              </button>
              <button type="button" className="btn-secondary" disabled={finishing} onClick={() => finish('partial')}>
                Частично — и это ок
              </button>
              <button type="button" className="btn-secondary" disabled={finishing} onClick={() => finish('enough')}>
                Достаточно на сегодня
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {active.nextSteps.length > 0 && (
        <div className="next-steps">
          <p className="section-label">Дальше, если захочешь</p>
          <ul className="next-steps__list">
            {active.nextSteps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  )
}
