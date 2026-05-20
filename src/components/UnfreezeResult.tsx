import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { apiOutcome } from '../api'
import { useAppStore } from '../store'

const PARTIAL_FALLBACK = 'Только вход в задачу: открыть файл или написать одно слово.'

export function UnfreezeResult() {
  const active = useAppStore((s) => s.activeSession)
  const setActiveSession = useAppStore((s) => s.setActiveSession)
  const setStats = useAppStore((s) => s.setStats)
  const premium = useAppStore((s) => s.premium)

  const [microStep, setMicroStep] = useState('')
  const [nextQueue, setNextQueue] = useState<string[]>([])
  const [partialUsed, setPartialUsed] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [bucketsOpen, setBucketsOpen] = useState(true)
  const [whyOpen, setWhyOpen] = useState(false)

  useEffect(() => {
    if (!active) return
    setMicroStep(active.microStep)
    setNextQueue([...active.nextSteps, ...active.alternates])
    setPartialUsed(false)
    setCopied(false)
    setBucketsOpen(active.showBuckets)
    setWhyOpen(false)
  }, [active?.sessionId])

  const bucketCount = useMemo(() => {
    if (!active) return 0
    const b = active.buckets
    return b.now.length + b.today.length + b.later.length + b.release.length
  }, [active])

  if (!active) return null

  const displayStep = microStep || active.microStep

  function pickAlternate(alt: string) {
    setMicroStep(alt)
    setPartialUsed(false)
    window.Telegram?.WebApp.HapticFeedback?.selectionChanged()
  }

  async function copyStep() {
    try {
      await navigator.clipboard.writeText(displayStep)
      setCopied(true)
      window.Telegram?.WebApp.HapticFeedback?.selectionChanged()
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* ignore */
    }
  }

  async function finish(outcome: 'done' | 'partial' | 'enough') {
    if (!active || finishing) return

    if (outcome === 'partial' && !partialUsed) {
      const q = nextQueue.length ? nextQueue : [...active.nextSteps, ...active.alternates]
      const fallback = q.find((s) => s && s !== displayStep) || active.steps[1] || PARTIAL_FALLBACK
      if (fallback && fallback !== displayStep) {
        setMicroStep(fallback)
        setNextQueue(q.filter((s) => s !== fallback))
        setPartialUsed(true)
        window.Telegram?.WebApp.HapticFeedback?.impactOccurred('light')
        return
      }
    }

    setFinishing(true)
    try {
      const res = await apiOutcome(active.sessionId, outcome === 'partial' && partialUsed ? 'partial' : outcome)
      setStats(res.stats)
      setActiveSession(null)
      window.Telegram?.WebApp.HapticFeedback?.impactOccurred('medium')
    } finally {
      setFinishing(false)
    }
  }

  const alternatesVisible = active.alternates.filter((a) => a !== displayStep)

  return (
    <motion.div className="unfreeze-result stack" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      {active.insight && <p className="insight-line">{active.insight}</p>}

      <div className="unfreeze-card unfreeze-card--hero">
        {active.taskLabel && active.taskLabel !== displayStep && (
          <p className="unfreeze-card__label">{active.taskLabel}</p>
        )}
        <p className="unfreeze-card__step">{displayStep}</p>
        {partialUsed && <p className="unfreeze-card__partial-hint">Ещё меньше — попробуй этот вариант</p>}
        {active.whyShort && (
          <button type="button" className="why-toggle" onClick={() => setWhyOpen((o) => !o)}>
            {whyOpen ? '▲ Скрыть' : '▼ Почему этот шаг?'}
          </button>
        )}
        {whyOpen && active.whyShort && <p className="unfreeze-card__reflection">{active.whyShort}</p>}
        <button type="button" className="btn-copy" onClick={copyStep}>
          {copied ? 'Скопировано ✓' : 'Скопировать шаг'}
        </button>
      </div>

      {active.showBuckets && bucketCount > 0 && (
        <div className="brain-buckets brain-buckets--open">
          <button
            type="button"
            className="brain-buckets__toggle brain-buckets__toggle--prominent"
            onClick={() => setBucketsOpen((o) => !o)}
            aria-expanded={bucketsOpen}
          >
            <span className="brain-buckets__chevron">{bucketsOpen ? '▼' : '▶'}</span>
            <span>
              Разложили <strong>{bucketCount}</strong> {bucketCount === 1 ? 'мысль' : bucketCount < 5 ? 'мысли' : 'мыслей'}
            </span>
          </button>
          <AnimatePresence initial={false}>
            {bucketsOpen && (
              <motion.div
                className="brain-buckets__grid"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                {active.buckets.release.length > 0 && (
                  <Bucket title="Можно отпустить" items={active.buckets.release} accent />
                )}
                <Bucket title="Сейчас" items={active.buckets.now} />
                <Bucket title="Сегодня" items={active.buckets.today} />
                <Bucket title="Потом" items={active.buckets.later} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {alternatesVisible.length > 0 && (
        <div className="alt-steps">
          <p className="section-label">Не то? Другой шаг из разбора</p>
          <div className="alt-steps__chips">
            {alternatesVisible.map((alt) => (
              <button key={alt} type="button" className="alt-chip" onClick={() => pickAlternate(alt)}>
                {alt}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="outcome-panel">
        <p className="outcome-panel__hint">Любой ответ — победа. Без оценки.</p>
        <button type="button" className="btn-primary" disabled={finishing} onClick={() => finish('done')}>
          Сделал(а) ✓
        </button>
        <button type="button" className="btn-secondary" disabled={finishing} onClick={() => finish('partial')}>
          {partialUsed ? 'Частично — зафиксировать' : 'Частично — ещё меньше'}
        </button>
        <button type="button" className="btn-secondary" disabled={finishing} onClick={() => finish('enough')}>
          Достаточно на сегодня
        </button>
      </div>

      {premium && active.steps.length > 1 && !active.showBuckets && (
        <div className="next-steps">
          <p className="section-label">Дальше по плану</p>
          <ul className="next-steps__list">
            {active.steps.slice(1).map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  )
}

function Bucket({ title, items, accent }: { title: string; items: string[]; accent?: boolean }) {
  if (!items.length) return null
  return (
    <div className={`brain-bucket${accent ? ' brain-bucket--release' : ''}`}>
      <p className="brain-bucket__title">{title}</p>
      <ul>
        {items.map((it) => (
          <li key={it}>{it}</li>
        ))}
      </ul>
    </div>
  )
}
