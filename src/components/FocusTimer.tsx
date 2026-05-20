import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { apiSessionFinish, apiSessionStart } from '../api'
import { useAppStore } from '../store'
import { images } from '../lib/assets'
import { ScreenHero } from '../components/ScreenHero'
import { ContextTip } from '../components/ContextTip'
import { VoiceTextField } from '../components/VoiceTextField'
import { SECTION_TIPS } from '../lib/sectionTips'

const DURATIONS = [15, 25, 45] as const

export function FocusTimer() {
  const setStats = useAppStore((s) => s.setStats)
  const [duration, setDuration] = useState<(typeof DURATIONS)[number]>(15)
  const [note, setNote] = useState('')
  const [sessionId, setSessionId] = useState<number | null>(null)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [totalSeconds, setTotalSeconds] = useState(0)
  const [running, setRunning] = useState(false)
  const [paused, setPaused] = useState(false)
  const [timeUp, setTimeUp] = useState(false)
  const [starting, setStarting] = useState(false)
  const [showEarlyFinish, setShowEarlyFinish] = useState(false)

  useEffect(() => {
    if (!running || paused || secondsLeft <= 0) return
    const t = window.setInterval(() => setSecondsLeft((s) => s - 1), 1000)
    return () => clearInterval(t)
  }, [running, paused, secondsLeft])

  useEffect(() => {
    if (running && !paused && secondsLeft === 0 && sessionId) {
      setRunning(false)
      setTimeUp(true)
      window.Telegram?.WebApp.HapticFeedback?.notificationOccurred('success')
    }
  }, [running, paused, secondsLeft, sessionId])

  const progress = useMemo(() => {
    if (!totalSeconds) return 0
    return Math.max(0, Math.min(1, (totalSeconds - secondsLeft) / totalSeconds))
  }, [secondsLeft, totalSeconds])

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const ss = String(secondsLeft % 60).padStart(2, '0')

  async function start() {
    setStarting(true)
    setTimeUp(false)
    setShowEarlyFinish(false)
    try {
      const res = await apiSessionStart(duration, note)
      setSessionId(res.sessionId)
      const total = duration * 60
      setTotalSeconds(total)
      setSecondsLeft(total)
      setRunning(true)
      setPaused(false)
      window.Telegram?.WebApp.HapticFeedback?.impactOccurred('medium')
    } finally {
      setStarting(false)
    }
  }

  async function finish(outcome: string) {
    if (!sessionId) return
    const res = await apiSessionFinish(sessionId, outcome)
    setStats(res.stats)
    setSessionId(null)
    setRunning(false)
    setPaused(false)
    setSecondsLeft(0)
    setTotalSeconds(0)
    setTimeUp(false)
    setShowEarlyFinish(false)
    window.Telegram?.WebApp.HapticFeedback?.impactOccurred('light')
  }

  function togglePause() {
    setPaused((p) => !p)
    window.Telegram?.WebApp.HapticFeedback?.impactOccurred('light')
  }

  const showOutcomes = timeUp || showEarlyFinish

  return (
    <motion.div className="screen stack focus-panel" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <ScreenHero
        image={images.focus}
        alt=""
        eyebrow="Шаг 3"
        title="Рядом"
        subtitle="Таймер и мягкое присутствие. ИИ не нужен — без лимитов."
        compact
      />
      <ContextTip id="focus" text={SECTION_TIPS.focus} />

      {!sessionId && (
        <>
          <p className="field-label">Сколько побыть рядом?</p>
          <div className="duration-pills">
            {DURATIONS.map((d) => (
              <button
                key={d}
                type="button"
                className={`duration-pill ${duration === d ? 'duration-pill--active' : ''}`}
                onClick={() => setDuration(d)}
              >
                {d} мин
              </button>
            ))}
          </div>
          <p className="hint-line">15 мин — мягкий старт · 25 — классика · 45 — глубокий фокус</p>
          <label className="field-label" htmlFor="focus-note">
            Что делаешь? (необязательно)
          </label>
          <VoiceTextField
            id="focus-note"
            placeholder="Например: 5 минут на письмо"
            value={note}
            onChange={setNote}
            disabled={starting}
          />
          <button type="button" className="btn-primary btn-primary--glow" onClick={start} disabled={starting}>
            {starting ? 'Запускаю…' : 'Начать рядом'}
          </button>
        </>
      )}

      {sessionId !== null && (
        <motion.div className="timer-card" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="timer-ring">
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
          {note && <p className="timer-card__task">{note}</p>}
          <p className="timer-card__hint">
            {timeUp
              ? 'Время вышло — выбери, как ты себя чувствуешь. Любой ответ — победа.'
              : paused
                ? 'Пауза. Когда будешь готов(а) — продолжим.'
                : 'Я рядом. Ты в своём темпе — без оценки.'}
          </p>

          {running && !timeUp && !showEarlyFinish && (
            <div className="timer-controls">
              <button type="button" className="btn-secondary btn-secondary--compact timer-card__pause" onClick={togglePause}>
                {paused ? 'Продолжить' : 'Пауза'}
              </button>
              <button type="button" className="btn-secondary btn-secondary--compact" onClick={() => setShowEarlyFinish(true)}>
                Завершить раньше
              </button>
            </div>
          )}

          <AnimatePresence>
            {(showOutcomes || timeUp) && (
              <motion.div
                className="timer-outcomes"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <button type="button" className="btn-primary" onClick={() => finish('done')}>
                  Сделал(а)
                </button>
                <button type="button" className="btn-secondary" onClick={() => finish('partial')}>
                  Частично — и это ок
                </button>
                <button type="button" className="btn-secondary" onClick={() => finish('enough')}>
                  Достаточно на сегодня
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </motion.div>
  )
}
