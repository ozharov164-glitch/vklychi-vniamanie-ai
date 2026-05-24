import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  apiBrainDump,
  apiTaskSteps,
  apiUnfreeze,
  isClarificationResponse,
  type BlockerId,
} from '../api'
import { AiThinkingPanel, resolveThinkingScenario } from '../components/AiThinkingPanel'
import { ClarifySheet } from '../components/ClarifySheet'
import { COPY } from '../lib/copy'
import { useAppStore, type UnfreezeMode } from '../store'
import { AiStatusLine } from '../components/AiStatusLine'
import { PremiumBanner } from '../components/PremiumBanner'
import { VoiceTextField } from '../components/VoiceTextField'
import { UnfreezeResult } from '../components/UnfreezeResult'
import { ModeIcon } from '../components/TabIcons'
import { images } from '../lib/assets'

type Step = 'pick' | 'input' | 'blocker' | 'result'

const BLOCKERS: { id: BlockerId; label: string }[] = [
  { id: 'fear', label: COPY.blockers.fear },
  { id: 'fog', label: COPY.blockers.fog },
  { id: 'low_energy', label: COPY.blockers.lowEnergy },
  { id: 'perfection', label: COPY.blockers.perfection },
]

function fearFromBlocker(blocker: BlockerId): number {
  if (blocker === 'fear') return 5
  if (blocker === 'perfection') return 4
  if (blocker === 'fog') return 3
  if (blocker === 'low_energy') return 2
  return 3
}

function isClearTask(text: string): boolean {
  const t = text.trim()
  if (t.length < 10) return false
  const verb =
    /(написать|сделать|открыть|отправить|позвонить|убрать|начать|закончить|подготовить|собрать|оплатить|купить|прочитать|ответить|создать|заполнить|найти|скачать|загрузить|проверить|набрать|вызвать|записать|вынести|помыть|приготовить)/i
  return verb.test(t)
}

/** Несколько болей сразу — разбор мыслей, не чек-лист по одной задаче. */
export function isOverload(text: string): boolean {
  return /(алкогол|зависим|предательств|разрыв|девушк|навалил|перегруз|кризис|мести|вина|устал|без\s*сил|тревог|паник|выгор|не\s*могу|бросить|плач)/i.test(
    text,
  )
}

export function StartScreen() {
  const premium = useAppStore((s) => s.premium)
  const memory = useAppStore((s) => s.memory)
  const stats = useAppStore((s) => s.stats)
  const activeSession = useAppStore((s) => s.activeSession)
  const applyActionResponse = useAppStore((s) => s.applyActionResponse)
  const setAiUsage = useAppStore((s) => s.setAiUsage)

  const [step, setStep] = useState<Step>(activeSession ? 'result' : 'pick')
  const [mode, setMode] = useState<UnfreezeMode | null>(activeSession?.mode ?? null)
  const [text, setText] = useState('')
  const [blocker, setBlocker] = useState<BlockerId>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [clarifyOpen, setClarifyOpen] = useState(false)
  const [clarifyQuestion, setClarifyQuestion] = useState('')
  const [clarifyHint, setClarifyHint] = useState('')
  const [pendingBaseText, setPendingBaseText] = useState('')
  const totalStarts = stats.winsTotal + stats.sessionsToday
  const showEncouragement = totalStarts >= 3

  useEffect(() => {
    if (!activeSession && step === 'result') {
      setStep('pick')
      setMode(null)
      setText('')
      setBlocker('')
    }
  }, [activeSession, step])

  if (activeSession || step === 'result') {
    return (
      <motion.div className="screen stack" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <header className="start-hero start-hero--compact">
          <img src={images.hero} alt="" className="start-hero__logo" width={384} height={384} decoding="async" />
          <div>
            <p className="start-hero__eyebrow">{COPY.appName}</p>
            <h1 className="start-hero__title">{COPY.hero.resultTitle}</h1>
          </div>
        </header>
        <UnfreezeResult />
      </motion.div>
    )
  }

  async function runAction(inputText?: string, opts?: { clarificationFollowUp?: boolean }) {
    if (!mode) return
    const payload = (inputText ?? text).trim()
    if (payload.length < 2) return
    setLoading(true)
    setError('')
    try {
      let res
      const postOpts = opts?.clarificationFollowUp
        ? { clarificationFollowUp: true }
        : undefined
      if (mode === 'noise') {
        res = await apiBrainDump(payload, postOpts)
      } else if (isClearTask(payload)) {
        res = await apiTaskSteps(payload, fearFromBlocker(blocker), blocker, postOpts)
      } else {
        res = await apiUnfreeze('stuck', payload, blocker, postOpts)
      }
      if (isClarificationResponse(res)) {
        setPendingBaseText(res.originalText || payload)
        setClarifyQuestion(res.clarificationQuestion)
        setClarifyHint(res.clarificationHint)
        setClarifyOpen(true)
        window.Telegram?.WebApp.HapticFeedback?.notificationOccurred('warning')
        return
      }
      if (res.aiUsage) setAiUsage(res.aiUsage)
      applyActionResponse(res, mode)
      setClarifyOpen(false)
      setStep('result')
      window.Telegram?.WebApp.HapticFeedback?.impactOccurred('medium')
    } catch (e) {
      const err = e as Error & { limitReached?: boolean }
      setError(err.message || COPY.errors.hint)
    } finally {
      setLoading(false)
    }
  }

  function mergeClarification(base: string, detail: string): string {
    const b = base.trim()
    const d = detail.trim()
    if (!b) return d
    if (!d) return b
    return `${b}\n${d}`
  }

  function submitClarification(detail: string) {
    const merged = mergeClarification(pendingBaseText || text, detail)
    setText(merged)
    void runAction(merged, { clarificationFollowUp: true })
  }

  function resetToPick() {
    setStep('pick')
    setMode(null)
    setText('')
    setBlocker('')
    setError('')
  }

  const hideBlockerChips = mode === 'noise' && isOverload(text)
  const hasMemory = memory.some((m) => Boolean(m.helpWorked?.trim()))
  const thinkingScenario =
    mode != null ? resolveThinkingScenario(mode, text) : 'stuck'

  function primaryButtonLabel() {
    if (mode === 'noise') {
      return COPY.overload.btnAnalyze
    }
    return COPY.actions.next
  }

  return (
    <motion.div className="screen stack" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <header className="start-hero">
        <img src={images.hero} alt="" className="start-hero__logo" width={384} height={384} decoding="async" />
        <div>
          <p className="start-hero__eyebrow">{COPY.appName}</p>
          <h1 className="start-hero__title">{COPY.hero.title}</h1>
          <p className="start-hero__subtitle">{COPY.hero.subtitle}</p>
        </div>
      </header>

      {showEncouragement && (
        <p className="encouragement-banner">{COPY.encouragement}</p>
      )}

      {(() => {
        const tip = memory.find((m) => m.helpWorked?.trim())
        if (!tip?.helpWorked) return null
        return (
          <div className="memory-hint">
            <p className="memory-hint__label">{COPY.memory.label}</p>
            <p className="memory-hint__text">{tip.helpWorked}</p>
          </div>
        )
      })()}

      <div className="stat-grid">
        <div className="stat-card">
          <p className="stat-card__value">{stats.sessionsToday}</p>
          <p className="stat-card__label">{COPY.stats.today}</p>
        </div>
        <div className="stat-card">
          <p className="stat-card__value stat-card__value--muted">{stats.winsTotal}</p>
          <p className="stat-card__label">{COPY.stats.total}</p>
        </div>
      </div>

      {step === 'pick' && (
        <>
          <p className="section-label">{COPY.actions.whatBlocks}</p>
          <div className="mode-grid">
            <button
              type="button"
              className="mode-card mode-card--stuck"
              onClick={() => {
                setMode('stuck')
                setStep('input')
              }}
            >
              <ModeIcon mode="stuck" />
              <span className="mode-card__title">{COPY.modes.stuck.title}</span>
              <span className="mode-card__desc">{COPY.modes.stuck.cardDesc}</span>
            </button>
            <button
              type="button"
              className="mode-card mode-card--noise"
              onClick={() => {
                setMode('noise')
                setStep('input')
              }}
            >
              <ModeIcon mode="noise" />
              <span className="mode-card__title">{COPY.modes.noise.title}</span>
              <span className="mode-card__desc">{COPY.modes.noise.cardDesc}</span>
            </button>
          </div>
        </>
      )}

      {(step === 'input' || step === 'blocker') && mode && (
        <>
          <button type="button" className="link-back" onClick={step === 'blocker' ? () => setStep('input') : resetToPick}>
            {COPY.actions.back}
          </button>

          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              className="mode-input-head"
              initial={{ opacity: 0, x: mode === 'noise' ? 12 : -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
            >
              <ModeIcon mode={mode} />
              <div>
                <p className="section-label section-label--inline">{COPY.modes[mode].title}</p>
                <p className="hint-line hint-line--tight">{COPY.modes[mode].hint}</p>
              </div>
            </motion.div>
          </AnimatePresence>

          {step === 'input' && (
            <>
              <VoiceTextField
                id="focus-input"
                multiline
                rows={4}
                placeholder={COPY.modes[mode].placeholder}
                value={text}
                onChange={setText}
                disabled={loading}
              />
              {loading ? (
                <AiThinkingPanel
                  active
                  scenario={thinkingScenario}
                  premium={premium}
                  hasMemory={hasMemory}
                />
              ) : (
                <button
                  type="button"
                  className="btn-primary btn-primary--glow"
                  disabled={text.trim().length < 2}
                  onClick={() =>
                    mode === 'stuck' && !isOverload(text) && !hideBlockerChips
                      ? setStep('blocker')
                      : runAction()
                  }
                >
                  {primaryButtonLabel()}
                </button>
              )}
            </>
          )}

          {step === 'blocker' && mode === 'stuck' && !hideBlockerChips && (
            <>
              <p className="section-label">{COPY.blockers.section}</p>
              <div className="blocker-chips">
                {BLOCKERS.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    className={`blocker-chip${blocker === b.id ? ' blocker-chip--on' : ''}`}
                    onClick={() => setBlocker(blocker === b.id ? '' : b.id)}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
              {loading ? (
                <AiThinkingPanel
                  active
                  scenario={thinkingScenario}
                  premium={premium}
                  hasMemory={hasMemory}
                />
              ) : (
                <button
                  type="button"
                  className="btn-primary btn-primary--glow"
                  onClick={runAction}
                >
                  {COPY.actions.getStep}
                </button>
              )}
            </>
          )}

          {error && <p className="field-error">{error}</p>}
        </>
      )}

      <AiStatusLine />
      {!premium && <PremiumBanner />}

      <ClarifySheet
        open={clarifyOpen}
        question={clarifyQuestion}
        hint={clarifyHint}
        loading={loading}
        thinkingScenario={thinkingScenario}
        premium={premium}
        hasMemory={hasMemory}
        onClose={() => setClarifyOpen(false)}
        onSubmit={submitClarification}
      />

      <p className="disclaimer">{COPY.disclaimer}</p>
    </motion.div>
  )
}
