import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { apiOutcome, apiRegenerate } from '../api'
import { useAppStore, type UnfreezeMode } from '../store'

const HELP_OPTIONS = [
  { id: 'anchor', label: 'Опора попала в точку' },
  { id: 'focus', label: 'Сменил(а) фокус — стало яснее' },
  { id: 'breath', label: 'Просто выдохнул(а)' },
  { id: 'buckets', label: 'Помог разбор мыслей' },
  { id: 'other', label: 'Другое — но сдвинулось' },
]

export function UnfreezeResult() {
  const active = useAppStore((s) => s.activeSession)
  const applyActionResponse = useAppStore((s) => s.applyActionResponse)
  const setActiveSession = useAppStore((s) => s.setActiveSession)
  const setStats = useAppStore((s) => s.setStats)
  const setAiUsage = useAppStore((s) => s.setAiUsage)

  const [microStep, setMicroStep] = useState('')
  const [finishing, setFinishing] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [bucketsOpen, setBucketsOpen] = useState(true)
  const [whyOpen, setWhyOpen] = useState(false)
  const [planOpen, setPlanOpen] = useState(false)
  const [showAlternates, setShowAlternates] = useState(false)
  const [closePhase, setClosePhase] = useState<'idle' | 'help'>('idle')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!active) return
    setMicroStep(active.microStep)
    setCopied(false)
    setBucketsOpen(active.showBuckets)
    setWhyOpen(false)
    setPlanOpen(false)
    setShowAlternates(false)
    setClosePhase('idle')
    setError('')
  }, [active?.sessionId, active?.microStep])

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
  const busy = finishing || regenerating

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

  async function closeSession(outcome: 'done' | 'enough' | 'cancelled', helpWorked = '') {
    if (!active || busy) return
    setFinishing(true)
    setError('')
    try {
      const res = await apiOutcome(active.sessionId, outcome, helpWorked)
      setStats(res.stats)
      setActiveSession(null)
      window.Telegram?.WebApp.HapticFeedback?.impactOccurred('medium')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось сохранить')
    } finally {
      setFinishing(false)
      setClosePhase('idle')
    }
  }

  async function onNotHelpful() {
    if (!active || busy) return
    setRegenerating(true)
    setError('')
    try {
      const res = await apiRegenerate(active.sessionId, displayStep)
      if (res.aiUsage) setAiUsage(res.aiUsage)
      const mode = (res.mode === 'noise' ? 'noise' : 'stuck') as UnfreezeMode
      applyActionResponse(res, mode)
      window.Telegram?.WebApp.HapticFeedback?.notificationOccurred('success')
    } catch (e) {
      const err = e as Error & { limitReached?: boolean }
      setError(err.message || 'Не удалось подобрать другую опору')
      if (err.limitReached) window.Telegram?.WebApp.HapticFeedback?.notificationOccurred('error')
    } finally {
      setRegenerating(false)
    }
  }

  function onDoneClick() {
    setClosePhase('help')
  }

  return (
    <motion.div className="unfreeze-result stack" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      {active.powerLine && (
        <blockquote className="power-line">
          <p className="power-line__text">{active.powerLine}</p>
          {active.powerAuthor && <cite className="power-line__author">— {active.powerAuthor}</cite>}
        </blockquote>
      )}

      {active.userPriority && <p className="priority-line">{active.userPriority}</p>}
      {active.userQuote && <p className="user-quote-line">«{active.userQuote}»</p>}
      {active.insight && <p className="insight-line">{active.insight}</p>}

      <div className={`unfreeze-card unfreeze-card--hero unfreeze-card--${active.mode}`}>
        <p className="unfreeze-card__eyebrow">Опора сейчас</p>
        {active.taskLabel && active.taskLabel !== displayStep && !/^[A-Z_]+$/.test(active.taskLabel) && (
          <p className="unfreeze-card__label">{active.taskLabel}</p>
        )}
        <p className="unfreeze-card__step">{displayStep}</p>
        {active.whyShort && (
          <button type="button" className="why-toggle" onClick={() => setWhyOpen((o) => !o)}>
            {whyOpen ? '▲ Скрыть' : '▼ Зачем именно это'}
          </button>
        )}
        {whyOpen && active.whyShort && <p className="unfreeze-card__reflection">{active.whyShort}</p>}
        <button type="button" className="btn-copy" onClick={copyStep} disabled={busy}>
          {copied ? 'Скопировано ✓' : 'Скопировать опору'}
        </button>
      </div>

      {regenerating && <p className="hint-line hint-line--pulse">Подбираю другую опору — конкретнее…</p>}
      {error && <p className="field-error">{error}</p>}

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
                disabled={busy}
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
        <p className="close-panel__hint">Не подошло — скажи честно. История не засорится отменой.</p>

        {closePhase === 'idle' && (
          <>
            <button type="button" className="btn-not-help" disabled={busy} onClick={onNotHelpful}>
              {regenerating ? 'Ищу другую опору…' : 'Не поможет — подобрать заново'}
            </button>
            <button type="button" className="btn-primary" disabled={busy} onClick={onDoneClick}>
              Сдвинулось — сохранить
            </button>
          </>
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
                  disabled={busy}
                  onClick={() => closeSession('done', o.label)}
                >
                  {o.label}
                </button>
              ))}
            </div>
            <button type="button" className="btn-ghost" disabled={busy} onClick={() => closeSession('done')}>
              Пропустить
            </button>
          </motion.div>
        )}

        {alternatesVisible.length > 0 && closePhase === 'idle' && (
          <>
            <button
              type="button"
              className="btn-secondary"
              disabled={busy}
              onClick={() => setShowAlternates((v) => !v)}
            >
              {showAlternates ? 'Скрыть другие опоры' : 'Другая опора из разбора'}
            </button>
            {showAlternates && (
              <div className="alt-steps alt-steps--inline">
                {alternatesVisible.map((alt) => (
                  <button key={alt} type="button" className="alt-chip" onClick={() => pickAlternate(alt)} disabled={busy}>
                    {alt}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {closePhase === 'idle' && (
          <>
            <button type="button" className="btn-ghost" disabled={busy} onClick={() => closeSession('enough')}>
              Сохранить разбор и выйти
            </button>
            <button
              type="button"
              className="btn-cancel"
              disabled={busy}
              onClick={() => closeSession('cancelled')}
            >
              Отменить — не сохранять в историю
            </button>
          </>
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
