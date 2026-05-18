import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { apiSessionFinish, apiSessionStart } from '../api'
import { useAppStore } from '../store'

const DURATIONS = [15, 25, 45] as const

export function FocusTimer() {
  const premium = useAppStore((s) => s.premium)
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
    <motion.div className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <p className="text-sm text-[var(--muted)]">
        Режим «рядом»: таймер и мягкое присутствие. {!premium && 'ИИ не нужен — без лимитов.'}
      </p>

      {!running && (
        <>
          <div className="flex gap-2">
            {DURATIONS.map((d) => (
              <button
                key={d}
                type="button"
                className={`flex-1 rounded-xl py-3 text-sm font-semibold ${
                  duration === d
                    ? 'bg-[var(--accent)] text-[#1a1208]'
                    : 'bg-[var(--bg-elevated)] text-[var(--muted)]'
                }`}
                onClick={() => setDuration(d)}
              >
                {d} мин
              </button>
            ))}
          </div>
          <input
            className="input-field"
            placeholder="Что делаешь? (необязательно)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <button type="button" className="btn-primary" onClick={start}>
            Начать рядом
          </button>
        </>
      )}

      {running && (
        <motion.div
          className="card flex flex-col items-center py-10"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <motion.div className="pulse-ring mb-6 flex h-32 w-32 items-center justify-center rounded-full border-2 border-[var(--accent)]">
            <span className="font-mono text-4xl font-bold text-[var(--accent)]">
              {mm}:{ss}
            </span>
          </motion.div>
          <p className="mb-6 text-center text-sm text-[var(--muted)]">Я рядом. Ты в своём темпе.</p>
          <div className="grid w-full gap-2 px-4">
            <button type="button" className="btn-primary" onClick={() => finish('done')}>
              Сделал(а)
            </button>
            <button type="button" className="btn-ghost" onClick={() => finish('partial')}>
              Частично — и это ок
            </button>
            <button type="button" className="btn-ghost" onClick={() => finish('enough')}>
              Достаточно на сегодня
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
