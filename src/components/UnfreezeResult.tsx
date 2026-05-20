import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { apiOutcome } from '../api'
import { useAppStore } from '../store'

const PARTIAL_FALLBACK = 'Открыть то, с чем связана задача, и сделать одно действие на полминуты.'

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
  const [bucketsOpen, setBucketsOpen] = useState(false)

  useEffect(() => {
    if (!active) return
    setMicroStep(active.microStep)
    setNextQueue(active.nextSteps)
    setPartialUsed(false)
    setCopied(false)
  }, [active?.sessionId])

  if (!active) return null

  const displayStep = microStep || active.microStep
  const supportLine = [active.patternLine, active.reflection].filter(Boolean).join(' ')

  function initStepState() {
    if (!microStep) setMicroStep(active!.microStep)
    if (nextQueue.length === 0) {
      const q = [...active!.nextSteps]
      if (!q.length && active!.steps.length > 1) {
        q.push(...active!.steps.slice(1, 4))
      }
      setNextQueue(q)
    }
  }

  async function copyStep() {
    initStepState()
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
      initStepState()
      const q = nextQueue.length ? nextQueue : active.nextSteps
      const fallback = q[0] || active.steps[1] || PARTIAL_FALLBACK
      if (fallback && fallback !== displayStep) {
        setMicroStep(fallback)
        setNextQueue(q.slice(1))
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

  return (
    <motion.div className="unfreeze-result stack" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div className="unfreeze-card unfreeze-card--hero">
        <p className="unfreeze-card__label">{active.taskLabel}</p>
        <p className="unfreeze-card__step">{displayStep}</p>
        {partialUsed && <p className="unfreeze-card__partial-hint">Ещё меньше — попробуй этот шаг</p>}
        {supportLine && <p className="unfreeze-card__reflection">{supportLine}</p>}
        <button type="button" className="btn-copy" onClick={copyStep}>
          {copied ? 'Скопировано ✓' : 'Скопировать шаг'}
        </button>
      </div>

      {active.showBuckets && (
        <div className="brain-buckets">
          <button type="button" className="brain-buckets__toggle" onClick={() => setBucketsOpen((o) => !o)}>
            {bucketsOpen ? 'Свернуть разбор' : 'Как разложили мысли'}
          </button>
          <AnimatePresence>
            {bucketsOpen && (
              <motion.div
                className="brain-buckets__grid"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Bucket title="Сейчас" items={active.buckets.now} />
                <Bucket title="Сегодня" items={active.buckets.today} />
                <Bucket title="Потом" items={active.buckets.later} />
                <Bucket title="Отпустить" items={active.buckets.release} accent />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <div className="outcome-panel">
        <p className="outcome-panel__hint">Любой ответ — победа. Без оценки.</p>
        <button type="button" className="btn-primary" disabled={finishing} onClick={() => finish('done')}>
          Сделал(а)
        </button>
        <button type="button" className="btn-secondary" disabled={finishing} onClick={() => finish('partial')}>
          {partialUsed ? 'Частично — зафиксировать' : 'Частично — дать ещё меньше'}
        </button>
        <button type="button" className="btn-secondary" disabled={finishing} onClick={() => finish('enough')}>
          Достаточно на сегодня
        </button>
      </div>

      {premium && active.steps.length > 1 && !active.showBuckets && (
        <div className="next-steps">
          <p className="section-label">Дальше, если захочешь</p>
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
