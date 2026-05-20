import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { apiBrainDump, apiTaskSteps, apiUnfreeze, type BlockerId } from '../api'
import { useAppStore, type UnfreezeMode } from '../store'
import { AiStatusLine } from '../components/AiStatusLine'
import { PremiumBanner } from '../components/PremiumBanner'
import { VoiceTextField } from '../components/VoiceTextField'
import { UnfreezeResult } from '../components/UnfreezeResult'
import { ModeIcon } from '../components/TabIcons'
import { images } from '../lib/assets'

type Step = 'pick' | 'input' | 'blocker' | 'result'

const MODE_COPY: Record<UnfreezeMode, { title: string; hint: string; placeholder: string; cardDesc: string }> = {
  stuck: {
    title: 'Застрял(а)',
    hint: 'Назови задачу — получишь первый шаг без лекций.',
    placeholder: 'Например: не могу открыть отчёт',
    cardDesc: 'Знаю задачу — нужен первый шаг',
  },
  noise: {
    title: 'Шум в голове',
    hint: 'Выложи всё из головы — одна опора по главной боли.',
    placeholder: 'Всё крутится: работа, дом, сообщения…',
    cardDesc: 'Много мыслей — разложим и выберем одно',
  },
}

const BLOCKERS: { id: BlockerId; label: string }[] = [
  { id: 'fear', label: 'Страшно / тяжело' },
  { id: 'fog', label: 'Неясно с чего' },
  { id: 'low_energy', label: 'Мало сил' },
  { id: 'perfection', label: 'Застрял на идеале' },
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

/** Несколько болей сразу — нужен разбор, не чек-лист учёбы. */
function isOverload(text: string): boolean {
  return /(алкогол|зависим|предательств|разрыв|девушк|навалил|кризис|мести|вина|устал|без\s*сил|тревог|паник|выгор|не\s*могу|бросить|плач)/i.test(
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
            <p className="start-hero__eyebrow">ВключиВнимание</p>
            <h1 className="start-hero__title">Твой шаг</h1>
          </div>
        </header>
        <UnfreezeResult />
      </motion.div>
    )
  }

  async function runAction() {
    if (!mode) return
    setLoading(true)
    setError('')
    try {
      let res
      const useBrainDump = mode === 'noise' || isOverload(text)
      if (useBrainDump) {
        res = await apiBrainDump(text)
      } else if (isClearTask(text)) {
        res = await apiTaskSteps(text, fearFromBlocker(blocker), blocker)
      } else {
        res = await apiUnfreeze('stuck', text, blocker)
      }
      if (res.aiUsage) setAiUsage(res.aiUsage)
      applyActionResponse(res, useBrainDump ? 'noise' : mode)
      setStep('result')
      window.Telegram?.WebApp.HapticFeedback?.impactOccurred('medium')
    } catch (e) {
      const err = e as Error & { limitReached?: boolean }
      setError(err.message || 'Не удалось получить подсказку')
    } finally {
      setLoading(false)
    }
  }

  function resetToPick() {
    setStep('pick')
    setMode(null)
    setText('')
    setBlocker('')
    setError('')
  }

  return (
    <motion.div className="screen stack" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <header className="start-hero">
        <img src={images.hero} alt="" className="start-hero__logo" width={384} height={384} decoding="async" />
        <div>
          <p className="start-hero__eyebrow">ВключиВнимание</p>
          <h1 className="start-hero__title">Один шаг вместо «надо бы»</h1>
          <p className="start-hero__subtitle">Без стыда и давления. Два режима — под разную блокировку.</p>
        </div>
      </header>

      {memory.length > 0 && memory[0].helpWorked && (
        <div className="memory-hint">
          <p className="memory-hint__label">В прошлый раз помогло</p>
          <p className="memory-hint__text">{memory[0].helpWorked}</p>
        </div>
      )}

      <div className="stat-grid">
        <div className="stat-card">
          <p className="stat-card__value">{stats.sessionsToday}</p>
          <p className="stat-card__label">шагов сегодня</p>
        </div>
        <div className="stat-card">
          <p className="stat-card__value stat-card__value--muted">{stats.winsTotal}</p>
          <p className="stat-card__label">побед всего</p>
        </div>
      </div>

      {step === 'pick' && (
        <>
          <p className="section-label">Что мешает?</p>
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
              <span className="mode-card__title">Застрял(а)</span>
              <span className="mode-card__desc">{MODE_COPY.stuck.cardDesc}</span>
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
              <span className="mode-card__title">Шум в голове</span>
              <span className="mode-card__desc">{MODE_COPY.noise.cardDesc}</span>
            </button>
          </div>
        </>
      )}

      {(step === 'input' || step === 'blocker') && mode && (
        <>
          <button type="button" className="link-back" onClick={step === 'blocker' ? () => setStep('input') : resetToPick}>
            ← Назад
          </button>
          <div className="mode-input-head">
            <ModeIcon mode={mode} />
            <div>
              <p className="section-label section-label--inline">{MODE_COPY[mode].title}</p>
              <p className="hint-line hint-line--tight">{MODE_COPY[mode].hint}</p>
            </div>
          </div>

          {step === 'input' && (
            <>
              {mode === 'stuck' && isOverload(text) && text.trim().length >= 2 && (
                <div className="overload-banner overload-banner--stuck">
                  <p className="overload-banner__title">Похоже, навало</p>
                  <p className="overload-banner__text">
                    Сначала разберём мысли — не будем давить чек-листом по одной задаче.
                  </p>
                </div>
              )}
              <VoiceTextField
                id="focus-input"
                multiline
                rows={4}
                placeholder={MODE_COPY[mode].placeholder}
                value={text}
                onChange={setText}
                disabled={loading}
              />
              <button
                type="button"
                className="btn-primary btn-primary--glow"
                disabled={loading || text.trim().length < 2}
                onClick={() => (mode === 'stuck' ? setStep('blocker') : runAction())}
              >
                {mode === 'noise' || isOverload(text)
                  ? loading
                    ? 'Разбираю навало…'
                    : mode === 'stuck' && isOverload(text)
                      ? 'Сначала разобрать мысли'
                      : 'Разобрать навало'
                  : 'Дальше'}
              </button>
            </>
          )}

          {step === 'blocker' && mode === 'stuck' && (
            <>
              <p className="section-label">Что ближе?</p>
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
              <button
                type="button"
                className="btn-primary btn-primary--glow"
                disabled={loading}
                onClick={runAction}
              >
                {loading ? 'Подбираю шаг…' : 'Получить первый шаг'}
              </button>
            </>
          )}

          {error && <p className="field-error">{error}</p>}
        </>
      )}

      <AiStatusLine />
      {!premium && <PremiumBanner />}

      <p className="disclaimer">
        Не диагностика СДВГ. Инструмент самопомощи при трудностях с вниманием и стартом задач.
      </p>
    </motion.div>
  )
}
