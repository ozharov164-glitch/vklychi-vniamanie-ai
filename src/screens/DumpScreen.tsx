import { useState } from 'react'
import { motion } from 'framer-motion'
import { apiBrainDump } from '../api'
import { useAppStore } from '../store'
import { images } from '../lib/assets'
import { ScreenHero } from '../components/ScreenHero'
import { PremiumBanner } from '../components/PremiumBanner'

export function DumpScreen() {
  const premium = useAppStore((s) => s.premium)
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
      {!premium && <PremiumBanner />}
      <label className="field-label" htmlFor="dump-text">
        Что крутится в голове?
      </label>
      <textarea
        id="dump-text"
        className="input-field input-field--area"
        placeholder="Мысли, задачи, тревоги, «надо бы»…"
        value={text}
        onChange={(e) => setText(e.target.value)}
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
            </div>
          )}
          {bucket('Сейчас', result.now, '#f59e42')}
          {bucket('Сегодня', result.today, '#7dd3fc')}
          {bucket('Потом', result.later, '#94a3b8')}
          {bucket('Отпустить', result.release, '#4ade80')}
        </motion.div>
      )}
    </motion.div>
  )
}
