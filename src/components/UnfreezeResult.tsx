import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { apiOutcome, apiRegenerate } from '../api'
import { COPY } from '../lib/copy'
import { useAppStore } from '../store'

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
      setError(e instanceof Error ? e.message : COPY.errors.save)
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
      const mode = res.mode === 'noise' ? 'noise' : 'stuck'
      applyActionResponse(res, mode)
      window.Telegram?.WebApp.HapticFeedback?.notificationOccurred('success')
    } catch (e) {
      const err = e as Error & { limitReached?: boolean }
      setError(err.message || COPY.errors.regenerate)
      if (err.limitReached) window.Telegram?.WebApp.HapticFeedback?.notificationOccurred('error')
    } finally {
      setRegenerating(false)
    }
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
        <p className="unfreeze-card__eyebrow">{COPY.result.anchorEyebrow}</p>
        {active.taskLabel && active.taskLabel !== displayStep && !/^[A-Z_]+$/.test(active.taskLabel) && (
          <p className="unfreeze-card__label">{active.taskLabel}</p>
        )}
        <p className="unfreeze-card__step">{displayStep}</p>
        {active.whyShort && (
          <button type="button" className="why-toggle" onClick={() => setWhyOpen((o) => !o)}>
            {whyOpen ? COPY.result.whyToggleClose : COPY.result.whyToggleOpen}
          </button>
        )}
        {whyOpen && active.whyShort && <p className="unfreeze-card__reflection">{active.whyShort}</p>}
        <button type="button" className="btn-copy" onClick={copyStep} disabled={busy}>
          {copied ? COPY.result.copied : COPY.result.copyAnchor}
        </button>
      </div>

      {regenerating && <p className="hint-line hint-line--pulse">{COPY.result.regenerating}</p>}
      {error && <p className="field-error">{error}</p>}

      {hasThemePicker && (
        <div className="priority-picker">
          <p className="priority-picker__title">{COPY.result.priorityTitle}</p>
          <p className="priority-picker__hint">{COPY.result.priorityHint}</p>
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
            <span>{COPY.result.bucketsLabel(bucketCount)}</span>
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
                  <Bucket title={COPY.result.bucketRelease} items={active.buckets.release} accent />
                )}
                <Bucket title={COPY.result.bucketNow} items={active.buckets.now} />
                <Bucket title={COPY.result.bucketToday} items={active.buckets.today} />
                <Bucket title={COPY.result.bucketLater} items={active.buckets.later} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <div className="close-panel">
        <p className="close-panel__title">{COPY.result.closeTitle}</p>
        <p className="close-panel__hint">{COPY.result.closeHint}</p>

        {closePhase === 'idle' && (
          <>
            <button type="button" className="btn-not-help" disabled={busy} onClick={onNotHelpful}>
              {regenerating ? COPY.result.notHelpLoading : COPY.result.notHelp}
            </button>
            <button type="button" className="btn-primary" disabled={busy} onClick={() => setClosePhase('help')}>
              {COPY.result.done}
            </button>
          </>
        )}

        {closePhase === 'help' && (
          <motion.div className="help-panel" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <p className="help-panel__title">{COPY.result.helpTitle}</p>
            <p className="help-panel__hint">{COPY.result.helpHint}</p>
            <div className="help-chips">
              {COPY.helpWorked.map((label) => (
                <button
                  key={label}
                  type="button"
                  className="help-chip"
                  disabled={busy}
                  onClick={() => closeSession('done', label)}
                >
                  {label}
                </button>
              ))}
            </div>
            <button type="button" className="btn-ghost" disabled={busy} onClick={() => closeSession('done')}>
              {COPY.result.helpSkip}
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
              {showAlternates ? COPY.result.alternatesHide : COPY.result.alternatesShow}
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
              {COPY.result.saveAndExit}
            </button>
            <button type="button" className="btn-cancel" disabled={busy} onClick={() => closeSession('cancelled')}>
              {COPY.result.cancel}
            </button>
          </>
        )}
      </div>

      {planItems.length > 0 && (
        <div className="plan-later">
          <button type="button" className="plan-later__toggle" onClick={() => setPlanOpen((o) => !o)}>
            {planOpen ? '▲' : '▼'} {COPY.result.planLater}
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
