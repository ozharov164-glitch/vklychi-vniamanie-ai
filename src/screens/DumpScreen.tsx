import { useState } from 'react'
import { motion } from 'framer-motion'
import { apiBrainDump } from '../api'
import { useAppStore } from '../store'
import { images } from '../lib/assets'
import { ScreenHero } from '../components/ScreenHero'
import { PremiumBanner } from '../components/PremiumBanner'
import { ContextTip } from '../components/ContextTip'
import { VoiceTextField } from '../components/VoiceTextField'
import { SECTION_TIPS } from '../lib/sectionTips'

export function DumpScreen() {
  const premium = useAppStore((s) => s.premium)
  const setTab = useAppStore((s) => s.setTab)
  const setAiUsage = useAppStore((s) => s.setAiUsage)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<{
    now: string[]
    today: string[]
    later: string[]
    release: string[]
    lightest: string
  } | null>(null)

  async function submit() {
    setError('')
    setLoading(true)
    try {
      const r = await apiBrainDump(text)
      setResult(r)
      if (r.aiUsage) setAiUsage(r.aiUsage)
      window.Telegram?.WebApp.HapticFeedback?.notificationOccurred('success')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка')
    } finally {
      setLoading(false)
    }
  }

  const bucket = (title: string, items: string[], tone: string) =>
    items.length > 0 && (
      <div className="bucket-card" style={{ ['--bucket' as string]: tone }}>
        <p className="bucket-card__title">{title}</p>
        <ul className="bucket-card__list">
          {items.map((x, i) => (
            <li key={i}>{x}</li>
          ))}
        </ul>
      </div>
    )

  return (
    <motion.div className="screen stack" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <ScreenHero
        image={images.dump}
        alt=""
        eyebrow="Шаг 1"
        title="Сброс головы"
        subtitle="Выложи всё как есть — ИИ разложит по корзинам. Без оценки."
        compact
      />
      <ContextTip id="dump" text={SECTION_TIPS.dump} />
      {!premium && <PremiumBanner />}
      <label className="field-label" htmlFor="dump-text">
        Что крутится в голове?
      </label>
      <VoiceTextField
        id="dump-text"
        multiline
        rows={5}
        placeholder="Мысли, задачи, тревоги, «надо бы»… Или нажми 🎤 и скажи вслух."
        value={text}
        onChange={setText}
        disabled={loading}
      />
      {error && <p className="form-error">{error}</p>}
      <button type="button" className="btn-primary" disabled={loading || text.length < 2} onClick={submit}>
        {loading ? 'Разбираю…' : 'Разложить по полочкам'}
      </button>
      {result && (
        <motion.div className="stack stack--tight" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {result.lightest && (
            <div className="highlight-card">
              <p className="highlight-card__label">Самое лёгкое сейчас</p>
              <p className="highlight-card__text">{result.lightest}</p>
              <div className="result-actions">
                <button type="button" className="btn-primary btn-primary--compact" onClick={() => setTab('focus')}>
                  2 мин «Рядом»
                </button>
                <button type="button" className="btn-secondary btn-secondary--compact" onClick={() => setTab('steps')}>
                  Разбить на шаги
                </button>
              </div>
            </div>
          )}
          {bucket('Сейчас', result.now, '#f59e42')}
          {bucket('Сегодня', result.today, '#7dd3fc')}
          {bucket('Потом', result.later, '#94a3b8')}
          {bucket('Отпустить', result.release, '#4ade80')}
          {!result.lightest && result.now.length === 0 && result.today.length === 0 && (
            <p className="hint-line">Попробуй описать подробнее — или перейди в «Шаги» с одной задачей.</p>
          )}
        </motion.div>
      )}
    </motion.div>
  )
}
