import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { apiOutcome } from '../api'
import { useAppStore } from '../store'

const HELP_OPTIONS = [
  { id: 'anchor', label: 'Опора попала в точку' },
  { id: 'focus', label: 'Сменил(а) фокус — стало яснее' },
  { id: 'breath', label: 'Просто выдохнул(а)' },
  { id: 'buckets', label: 'Помог разбор мыслей' },
  { id: 'other', label: 'Другое — но сдвинулось' },
]

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
  const [closePhase, setClosePhase] = useState<'idle' | 'help'>('idle')

  useEffect(() => {
    if (!active) return
    setMicroStep(active.microStep)
    setCopied(false)
    setBucketsOpen(active.showBuckets)
    setWhyOpen(false)
    setPlanOpen(false)
    setShowAlternates(false)
    setClosePhase('idle')
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
  const hasThemePicker = active.themeChoices.length >= 2

  function pickTheme(anchor: string) {
    setMicroStep(anchor)
    window.Telegram?.WebApp.HapticFeedback?.selectionChanged()
  }

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

  async function closeSession(outcome: 'done' | 'enough', helpWorked = '') {
    if (!active || finishing) return
    setFinishing(true)
    try {
      const res = await apiOutcome(active.sessionId, outcome, helpWorked)
      setStats(res.stats)
      setActiveSession(null)
      window.Telegram?.WebApp.HapticFeedback?.impactOccurred('medium')
    } finally {
      setFinishing(false)
      setClosePhase('idle')
    }
  }

  function onDoneClick() {
    setClosePhase('help')
  }

  return (
    <motion.div className="unfreeze-result stack" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      {active.userPriority && <p className="priority-line">{active.userPriority}</p>}
      {active.userQuote && <p className="user-quote-line">«{active.userQuote}»</p>}
      {active.insight && <p className="insight-line">{active.insight}</p>}
      {active.mechanism && <p className="mechanism-line">{active.mechanism}</p>}

      <div className={`unfreeze-card unfreeze-card--hero unfreeze-card--${active.mode}`}>
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

      {hasThemePicker && (
        <div className="priority-picker">
          <p className="priority-picker__title">Что важнее сейчас?</p>
          <p className="priority-picker__hint">Без нового запроса к ИИ — выбери другой фокус.</p>
          <div className="priority-picker__chips">
            {active.themeChoices.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`priority-chip${displayStep === c.anchor ? ' priority-chip--on' : ''}`}
                onClick={() => pickTheme(c.anchor)}
              >
                <span className="priority-chip__label">{c.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

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

        {closePhase === 'idle' && (
          <button type="button" className="btn-primary" disabled={finishing} onClick={onDoneClick}>
            Сдвинулось — сохранить
          </button>
        )}

        {closePhase === 'help' && (
          <motion.div
            className="help-panel"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="help-panel__title">Что именно помогло?</p>
            <p className="help-panel__hint">Один тап — чтобы в следующий раз помнить, что сработало.</p>
            <div className="help-chips">
              {HELP_OPTIONS.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  className="help-chip"
                  disabled={finishing}
                  onClick={() => closeSession('done', o.label)}
                >
                  {o.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="btn-ghost"
              disabled={finishing}
              onClick={() => closeSession('done')}
            >
              Пропустить
            </button>
          </motion.div>
        )}

        {alternatesVisible.length > 0 && closePhase === 'idle' && (
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

        {closePhase === 'idle' && (
          <button type="button" className="btn-ghost" disabled={finishing} onClick={() => closeSession('enough')}>
            Сохранить разбор и выйти
          </button>
        )}
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
