import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { apiUnfreeze } from '../api'
import { useAppStore, type UnfreezeMode } from '../store'
import { AiStatusLine } from '../components/AiStatusLine'
import { PremiumBanner } from '../components/PremiumBanner'
import { VoiceTextField } from '../components/VoiceTextField'
import { UnfreezeTimer } from '../components/UnfreezeTimer'
import { images } from '../lib/assets'

type Step = 'pick' | 'input' | 'timer'

const MODE_COPY: Record<UnfreezeMode, { title: string; hint: string; placeholder: string }> = {
  stuck: {
    title: 'Застрял(а)',
    hint: 'Опиши задачу или что мешает начать — одной фразой.',
    placeholder: 'Например: не могу открыть отчёт',
  },
  noise: {
    title: 'Шум в голове',
    hint: 'Выгрузи мысли — можно коротко или голосом. ИИ выберет один лёгкий шаг.',
    placeholder: 'Всё крутится в голове: работа, дом, сообщения…',
  },
}

export function StartScreen() {
  const premium = useAppStore((s) => s.premium)
  const stats = useAppStore((s) => s.stats)
  const activeUnfreeze = useAppStore((s) => s.activeUnfreeze)
  const setActiveUnfreeze = useAppStore((s) => s.setActiveUnfreeze)
  const setAiUsage = useAppStore((s) => s.setAiUsage)

  const [step, setStep] = useState<Step>(activeUnfreeze ? 'timer' : 'pick')
  const [mode, setMode] = useState<UnfreezeMode | null>(null)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!activeUnfreeze && step === 'timer') {
      setStep('pick')
      setMode(null)
      setText('')
    }
  }, [activeUnfreeze, step])

  if (activeUnfreeze || step === 'timer') {
    return (
      <motion.div className="screen stack" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <header className="start-hero start-hero--compact">
          <img src={images.hero} alt="" className="start-hero__logo" />
          <div>
            <p className="start-hero__eyebrow">90 секунд</p>
            <h1 className="start-hero__title">Разморозка</h1>
          </div>
        </header>
        <UnfreezeTimer />
      </motion.div>
    )
  }

  async function runUnfreeze() {
    if (!mode) return
    setLoading(true)
    setError('')
    try {
      const res = await apiUnfreeze(mode, text)
      if (res.aiUsage) setAiUsage(res.aiUsage)
      setActiveUnfreeze({
        sessionId: res.sessionId,
        mode,
        reflection: res.reflection,
        microStep: res.microStep,
        taskLabel: res.taskLabel,
        nextSteps: res.nextSteps || [],
        durationSec: res.durationSec || 90,
      })
      setStep('timer')
      window.Telegram?.WebApp.HapticFeedback?.impactOccurred('medium')
    } catch (e) {
      const err = e as Error & { limitReached?: boolean }
      setError(err.message || 'Не удалось получить подсказку')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div className="screen stack" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <header className="start-hero">
        <img src={images.hero} alt="" className="start-hero__logo" />
        <div>
          <p className="start-hero__eyebrow">ВключиВнимание</p>
          <h1 className="start-hero__title">Разморозка за 90 секунд</h1>
          <p className="start-hero__subtitle">Один шаг вместо бесконечного «надо бы». Без стыда и давления.</p>
        </div>
      </header>

      <div className="stat-grid">
        <div className="stat-card">
          <p className="stat-card__value">{stats.sessionsToday}</p>
          <p className="stat-card__label">разморозок сегодня</p>
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
              className="mode-card"
              onClick={() => {
                setMode('stuck')
                setStep('input')
              }}
            >
              <span className="mode-card__emoji" aria-hidden>
                🧊
              </span>
              <span className="mode-card__title">Застрял(а)</span>
              <span className="mode-card__desc">Знаю задачу, но не могу начать</span>
            </button>
            <button
              type="button"
              className="mode-card"
              onClick={() => {
                setMode('noise')
                setStep('input')
              }}
            >
              <span className="mode-card__emoji" aria-hidden>
                🌫
              </span>
              <span className="mode-card__title">Шум в голове</span>
              <span className="mode-card__desc">Много мыслей, не знаю с чего</span>
            </button>
          </div>
        </>
      )}

      {step === 'input' && mode && (
        <>
          <button type="button" className="link-back" onClick={() => setStep('pick')}>
            ← Назад
          </button>
          <p className="section-label">{MODE_COPY[mode].title}</p>
          <p className="hint-line">{MODE_COPY[mode].hint}</p>
          <VoiceTextField
            id="unfreeze-text"
            multiline
            rows={4}
            placeholder={MODE_COPY[mode].placeholder}
            value={text}
            onChange={setText}
            disabled={loading}
          />
          {error && <p className="field-error">{error}</p>}
          <button
            type="button"
            className="btn-primary btn-primary--glow"
            disabled={loading}
            onClick={runUnfreeze}
          >
            {loading ? 'Подбираю шаг…' : 'Разморозить'}
          </button>
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
