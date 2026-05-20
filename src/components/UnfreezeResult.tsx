import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { apiOutcome } from '../api'
import { useAppStore } from '../store'

export function UnfreezeResult() {
  const active = useAppStore((s) => s.activeSession)
  const setActiveSession = useAppStore((s) => s.setActiveSession)
  const setStats = useAppStore((s) => s.setStats)

  const [microStep, setMicroStep] = useState('')
  const [finishing, setFinishing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [bucketsOpen, setBucketsOpen] = useState(true)
  const [whyOpen, setWhyOpen] = useState(false)
  const [planOpen, setPlanOpen] = useState(false)
  const [showAlternates, setShowAlternates] = useState(false)

  useEffect(() => {
    if (!active) return
    setMicroStep(active.microStep)
    setCopied(false)
    setBucketsOpen(active.showBuckets)
    setWhyOpen(false)
    setPlanOpen(false)
    setShowAlternates(false)
  }, [active?.sessionId])

  const bucketCount = useMemo(() => {
    if (!active) return 0
    const b = active.buckets
    return b.now.length + b.today.length + b.later.length + b.release.length
  }, [active])

  if (!active) return null

  const displayStep = microStep || active.microStep
  const alternatesVisible = active.alternates.filter((a) => a !== displayStep)
  const planItems = active.planLater.length ? active.planLater : active.steps.slice(1)

  function pickAlternate(alt: string) {
    setMicroStep(alt)
    setShowAlternates(false)
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

  async function closeSession(outcome: 'done' | 'enough') {
    if (!active || finishing) return
    setFinishing(true)
    try {
      const res = await apiOutcome(active.sessionId, outcome)
      setStats(res.stats)
      setActiveSession(null)
      window.Telegram?.WebApp.HapticFeedback?.impactOccurred('medium')
    } finally {
      setFinishing(false)
    }
  }

  return (
    <motion.div className="unfreeze-result stack" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      {active.userPriority && <p className="priority-line">{active.userPriority}</p>}
      {active.insight && <p className="insight-line">{active.insight}</p>}

      <div className="unfreeze-card unfreeze-card--hero">
        <p className="unfreeze-card__eyebrow">Опора сейчас</p>
        {active.taskLabel && active.taskLabel !== displayStep && (
          <p className="unfreeze-card__label">{active.taskLabel}</p>
        )}
        <p className="unfreeze-card__step">{displayStep}</p>
        {active.whyShort && (
          <button type="button" className="why-toggle" onClick={() => setWhyOpen((o) => !o)}>
            {whyOpen ? '▲ Скрыть' : '▼ Зачем именно это'}
          </button>
        )}
        {whyOpen && active.whyShort && <p className="unfreeze-card__reflection">{active.whyShort}</p>}
        <button type="button" className="btn-copy" onClick={copyStep}>
          {copied ? 'Скопировано ✓' : 'Скопировать опору'}
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
              Разбор: <strong>{bucketCount}</strong>{' '}
              {bucketCount === 1 ? 'пункт' : bucketCount < 5 ? 'пункта' : 'пунктов'}
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
                  <Bucket title="Отпустить — не твоя работа сейчас" items={active.buckets.release} accent />
                )}
                <Bucket title="Опора сейчас" items={active.buckets.now} />
                <Bucket title="Границы на сегодня" items={active.buckets.today} />
                <Bucket title="Потом" items={active.buckets.later} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <div className="close-panel">
        <p className="close-panel__title">Что дальше?</p>
        <p className="close-panel__hint">Не оценка. Ты решаешь, зачем тебе этот разбор.</p>

        <button type="button" className="btn-primary" disabled={finishing} onClick={() => closeSession('done')}>
          Сдвинулось — сохранить
        </button>

        {alternatesVisible.length > 0 && (
          <>
            <button
              type="button"
              className="btn-secondary"
              disabled={finishing}
              onClick={() => setShowAlternates((v) => !v)}
            >
              {showAlternates ? 'Скрыть другие опоры' : 'Нужна другая опора'}
            </button>
            {showAlternates && (
              <div className="alt-steps alt-steps--inline">
                {alternatesVisible.map((alt) => (
                  <button key={alt} type="button" className="alt-chip" onClick={() => pickAlternate(alt)}>
                    {alt}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        <button type="button" className="btn-ghost" disabled={finishing} onClick={() => closeSession('enough')}>
          Сохранить разбор и выйти
        </button>
      </div>

      {planItems.length > 0 && (
        <div className="plan-later">
          <button type="button" className="plan-later__toggle" onClick={() => setPlanOpen((o) => !o)}>
            {planOpen ? '▲' : '▼'} Когда будешь готов(а) — не сейчас
          </button>
          {planOpen && (
            <ul className="plan-later__list">
              {planItems.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          )}
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
