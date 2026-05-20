import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { apiSessionDetail, type FocusSessionDetail } from '../api'
import { COPY } from '../lib/copy'

function formatWhen(iso: string | null) {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    return d.toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

type Props = {
  sessionId: number | null
  onClose: () => void
}

export function WinDetailSheet({ sessionId, onClose }: Props) {
  const [data, setData] = useState<FocusSessionDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!sessionId) {
      setData(null)
      setError('')
      return
    }
    let cancelled = false
    async function load() {
      setLoading(true)
      setError('')
      try {
        const res = await apiSessionDetail(sessionId)
        if (!cancelled) setData(res.session)
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
  }, [sessionId])

  return (
    <AnimatePresence>
      {sessionId != null && (
        <motion.div
          className="win-sheet-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="win-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="win-sheet-title"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="win-sheet__handle" aria-hidden />
            <header className="win-sheet__head">
              <div>
                <p className="win-sheet__eyebrow">{COPY.wins.detailEyebrow}</p>
                <h2 id="win-sheet-title" className="win-sheet__title">
                  {COPY.wins.detailTitle}
                </h2>
              </div>
              <button type="button" className="win-sheet__close" onClick={onClose} aria-label="Закрыть">
                ✕
              </button>
            </header>

            {loading && <p className="hint-line">{COPY.wins.loading}</p>}
            {error && <p className="field-error">{error}</p>}

            {data && !loading && (
              <div className="win-sheet__body stack stack--tight">
                <div className="win-sheet__meta-row">
                  <span className="win-sheet__pill win-sheet__pill--mode">
                    {COPY.modeShort[data.mode as keyof typeof COPY.modeShort] || data.mode}
                  </span>
                  {data.outcome && (
                    <span className={`win-sheet__pill win-sheet__pill--${data.outcome}`}>
                      {COPY.outcomes[data.outcome as keyof typeof COPY.outcomes] || data.outcome}
                    </span>
                  )}
                  <span className="win-sheet__when">{formatWhen(data.endedAt || data.startedAt)}</span>
                </div>

                {data.inputText && (
                  <section className="win-sheet__block">
                    <h3 className="win-sheet__label">{COPY.wins.detailRequest}</h3>
                    <p className="win-sheet__request">{data.inputText}</p>
                  </section>
                )}

                {data.userQuote && (
                  <p className="win-sheet__quote">«{data.userQuote}»</p>
                )}

                {data.reflection && (
                  <section className="win-sheet__block win-sheet__block--insight">
                    <h3 className="win-sheet__label">{COPY.wins.detailInsight}</h3>
                    <p className="win-sheet__insight">{data.reflection}</p>
                  </section>
                )}

                {data.microStep && (
                  <section className="win-sheet__anchor">
                    <p className="win-sheet__label">{COPY.wins.detailAnchor}</p>
                    {data.taskLabel && data.taskLabel !== data.microStep && (
                      <p className="win-sheet__task">{data.taskLabel}</p>
                    )}
                    <p className="win-sheet__step">{data.microStep}</p>
                  </section>
                )}

                {(data.mechanism || data.emotionalTone) && (
                  <div className="win-sheet__tags">
                    {data.mechanism && <span className="win-sheet__tag">{data.mechanism}</span>}
                    {data.emotionalTone && <span className="win-sheet__tag win-sheet__tag--muted">{data.emotionalTone}</span>}
                  </div>
                )}

                {data.helpWorked && (
                  <p className="win-sheet__help">
                    {COPY.wins.helped} <strong>{data.helpWorked}</strong>
                  </p>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
