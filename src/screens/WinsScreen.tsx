import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { apiHistory } from '../api'
import { COPY } from '../lib/copy'
import { useAppStore } from '../store'

function formatWhen(iso: string | null) {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    return d.toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

export function WinsScreen() {
  const history = useAppStore((s) => s.history)
  const stats = useAppStore((s) => s.stats)
  const setHistory = useAppStore((s) => s.setHistory)
  const setStats = useAppStore((s) => s.setStats)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError('')
      try {
        const res = await apiHistory(20)
        if (!cancelled) {
          setHistory(res.items)
          setStats(res.stats)
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : COPY.errors.loadHistory)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [setHistory, setStats])

  const completed = history.filter(
    (h) => h.outcome && ['done', 'partial', 'enough'].includes(h.outcome),
  )

  return (
    <motion.div className="screen stack" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <header className="wins-header">
        <p className="start-hero__eyebrow">{COPY.wins.eyebrow}</p>
        <h1 className="start-hero__title">{COPY.wins.title}</h1>
        <p className="start-hero__subtitle">{COPY.wins.subtitle}</p>
      </header>

      <div className="stat-grid stat-grid--3">
        <div className="stat-card">
          <p className="stat-card__value">{stats.winsTotal}</p>
          <p className="stat-card__label">{COPY.wins.total}</p>
        </div>
        <div className="stat-card">
          <p className="stat-card__value stat-card__value--muted">{stats.sessionsToday}</p>
          <p className="stat-card__label">{COPY.wins.today}</p>
        </div>
        <div className="stat-card">
          <p className="stat-card__value stat-card__value--accent">{stats.streakDays || 0}</p>
          <p className="stat-card__label">{COPY.wins.streak}</p>
        </div>
      </div>

      {loading && <p className="hint-line">{COPY.wins.loading}</p>}
      {error && <p className="field-error">{error}</p>}

      {!loading && completed.length === 0 && (
        <div className="empty-wins">
          <p>{COPY.wins.empty1}</p>
          <p className="hint-line">{COPY.wins.empty2}</p>
        </div>
      )}

      <ul className="wins-list">
        {completed.map((item) => (
          <li key={item.id} className="wins-item">
            <div className="wins-item__top">
              <span className="wins-item__mode">{COPY.modeShort[item.mode as keyof typeof COPY.modeShort] || item.mode}</span>
              <span className={`wins-item__outcome wins-item__outcome--${item.outcome || 'none'}`}>
                {COPY.outcomes[item.outcome as keyof typeof COPY.outcomes] || COPY.outcomes.progress}
              </span>
            </div>
            <p className="wins-item__task">{item.taskLabel || item.microStep}</p>
            {item.microStep && item.taskLabel !== item.microStep && (
              <p className="wins-item__step">{item.microStep}</p>
            )}
            {item.helpWorked && (
              <p className="wins-item__help">
                {COPY.wins.helped} {item.helpWorked}
              </p>
            )}
            <p className="wins-item__when">{formatWhen(item.endedAt || item.startedAt)}</p>
          </li>
        ))}
      </ul>
    </motion.div>
  )
}
