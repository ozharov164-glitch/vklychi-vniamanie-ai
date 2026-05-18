import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { apiSessionFinish, apiSessionStart } from '../api'
import { useAppStore } from '../store'
import { images } from '../lib/assets'
import { ScreenHero } from '../components/ScreenHero'

const DURATIONS = [15, 25, 45] as const

export function FocusTimer() {
  const setStats = useAppStore((s) => s.setStats)
  const [duration, setDuration] = useState<(typeof DURATIONS)[number]>(15)
  const [note, setNote] = useState('')
  const [sessionId, setSessionId] = useState<number | null>(null)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (!running || secondsLeft <= 0) return
    const t = window.setInterval(() => setSecondsLeft((s) => s - 1), 1000)
    return () => clearInterval(t)
  }, [running, secondsLeft])

  useEffect(() => {
    if (running && secondsLeft === 0 && sessionId) {
      setRunning(false)
    }
  }, [running, secondsLeft, sessionId])

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const ss = String(secondsLeft % 60).padStart(2, '0')

  async function start() {
    const res = await apiSessionStart(duration, note)
    setSessionId(res.sessionId)
    setSecondsLeft(duration * 60)
    setRunning(true)
    window.Telegram?.WebApp.HapticFeedback?.impactOccurred('medium')
  }

  async function finish(outcome: string) {
    if (!sessionId) return
    const res = await apiSessionFinish(sessionId, outcome)
    setStats(res.stats)
    setSessionId(null)
    setRunning(false)
    setSecondsLeft(0)
    window.Telegram?.WebApp.HapticFeedback?.impactOccurred('light')
  }

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

      {!running && (
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
          <label className="field-label" htmlFor="focus-note">
            Что делаешь? (необязательно)
          </label>
          <input
            id="focus-note"
            className="input-field"
            placeholder="Например: 5 минут на письмо"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <button type="button" className="btn-primary btn-primary--glow" onClick={start}>
            Начать рядом
          </button>
        </>
      )}

      {running && (
        <motion.div className="timer-card" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="timer-ring">
            <span className="timer-ring__time">
              {mm}:{ss}
            </span>
          </div>
          <p className="timer-card__hint">Я рядом. Ты в своём темпе — без оценки.</p>
          <div className="timer-outcomes">
            <button type="button" className="btn-primary" onClick={() => finish('done')}>
              Сделал(а)
            </button>
            <button type="button" className="btn-secondary" onClick={() => finish('partial')}>
              Частично — и это ок
            </button>
            <button type="button" className="btn-secondary" onClick={() => finish('enough')}>
              Достаточно на сегодня
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
