import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { apiClearHistory, apiHistory } from '../api'
import { WinDetailSheet } from '../components/WinDetailSheet'
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
  const [detailId, setDetailId] = useState<number | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)
  const [clearing, setClearing] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError('')
      try {
        const res = await apiHistory(30)
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

  async function onClearHistory() {
    if (clearing) return
    setClearing(true)
    setError('')
    try {
      const res = await apiClearHistory()
      setHistory([])
      setStats(res.stats)
      setConfirmClear(false)
      setDetailId(null)
      window.Telegram?.WebApp.HapticFeedback?.notificationOccurred('success')
    } catch (e) {
      setError(e instanceof Error ? e.message : COPY.errors.save)
    } finally {
      setClearing(false)
    }
  }

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
        <div className="stat-card stat-card--streak">
          <p className="stat-card__value stat-card__value--streak">
            <span className="stat-card__fire" aria-hidden>
              🔥
            </span>
            {stats.streakDays || 0}
          </p>
          <p className="stat-card__label">{COPY.wins.streak}</p>
        </div>
      </div>

      {loading && <p className="hint-line">{COPY.wins.loading}</p>}
      {error && <p className="field-error">{error}</p>}

      {!loading && history.length === 0 && (
        <div className="empty-wins">
          <p>{COPY.wins.empty1}</p>
          <p className="hint-line">{COPY.wins.empty2}</p>
        </div>
      )}

      {history.length > 0 && (
        <>
          <p className="wins-section-title">{COPY.wins.requestsTitle}</p>
          <p className="hint-line wins-section-hint">{COPY.wins.requestsHint}</p>
        </>
      )}

      <ul className="wins-list">
        {history.map((item) => {
          const inProgress = !item.outcome
          const preview = item.inputPreview || item.taskLabel || item.microStep
          return (
            <li key={item.id}>
              <button
                type="button"
                className={`wins-item wins-item--clickable${inProgress ? ' wins-item--open' : ''}`}
                onClick={() => {
                  setDetailId(item.id)
                  window.Telegram?.WebApp.HapticFeedback?.impactOccurred('light')
                }}
              >
                <div className="wins-item__top">
                  <span className="wins-item__mode">
                    {COPY.modeShort[item.mode as keyof typeof COPY.modeShort] || item.mode}
                  </span>
                  <span
                    className={`wins-item__outcome wins-item__outcome--${item.outcome || 'none'}`}
                  >
                    {item.outcome
                      ? COPY.outcomes[item.outcome as keyof typeof COPY.outcomes]
                      : COPY.outcomes.progress}
                  </span>
                </div>
                <p className="wins-item__task">{preview}</p>
                {item.microStep && (
                  <p className="wins-item__measurable">
                    <span className="wins-item__measurable-tag">{COPY.wins.microStepTag}</span>
                    {item.microStep}
                  </p>
                )}
                {item.helpWorked && (
                  <p className="wins-item__help">
                    {COPY.wins.helped} {item.helpWorked}
                  </p>
                )}
                <div className="wins-item__foot">
                  <p className="wins-item__when">{formatWhen(item.endedAt || item.startedAt)}</p>
                  <span className="wins-item__open">{COPY.wins.open}</span>
                </div>
              </button>
            </li>
          )
        })}
      </ul>

      {history.length > 0 && !confirmClear && (
        <button
          type="button"
          className="btn-clear-history"
          disabled={clearing || loading}
          onClick={() => setConfirmClear(true)}
        >
          {COPY.wins.clear}
        </button>
      )}

      {confirmClear && (
        <motion.div
          className="clear-history-panel"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="clear-history-panel__title">{COPY.wins.clearConfirmTitle}</p>
          <p className="clear-history-panel__text">{COPY.wins.clearConfirmText}</p>
          <div className="clear-history-panel__actions">
            <button
              type="button"
              className="btn-primary btn-primary--danger"
              disabled={clearing}
              onClick={onClearHistory}
            >
              {clearing ? COPY.wins.clearing : COPY.wins.clearConfirmBtn}
            </button>
            <button
              type="button"
              className="btn-ghost"
              disabled={clearing}
              onClick={() => setConfirmClear(false)}
            >
              {COPY.wins.clearCancel}
            </button>
          </div>
        </motion.div>
      )}

      <WinDetailSheet sessionId={detailId} onClose={() => setDetailId(null)} />
    </motion.div>
  )
}
