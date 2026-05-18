import { useState } from 'react'
import { motion } from 'framer-motion'
import { apiBrainDump } from '../api'
import { useAppStore } from '../store'

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

  const bucket = (title: string, items: string[], color: string) =>
    items.length > 0 && (
      <div className="card p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color }}>
          {title}
        </p>
        <ul className="space-y-1 text-sm">
          {items.map((x, i) => (
            <li key={i}>• {x}</li>
          ))}
        </ul>
      </div>
    )

  return (
    <motion.div className="space-y-4 pb-4" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <h2 className="text-xl font-bold">Сброс головы</h2>
      <p className="text-sm text-[var(--muted)]">
        Выложи всё как есть. ИИ разложит по корзинам
        {premium ? ' (DeepSeek)' : ' (Groq)'}.
      </p>
      <textarea
        className="input-field min-h-[120px] resize-none"
        placeholder="Мысли, задачи, тревоги…"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button type="button" className="btn-primary" disabled={loading || text.length < 2} onClick={submit}>
        {loading ? 'Разбираю…' : 'Разложить'}
      </button>
      {result && (
        <motion.div className="space-y-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {result.lightest && (
            <motion.div className="card border border-[var(--accent)] p-4">
              <p className="text-xs text-[var(--accent)]">Самое лёгкое сейчас</p>
              <p className="mt-1 font-medium">{result.lightest}</p>
            </motion.div>
          )}
          {bucket('Сейчас', result.now, '#f59e42')}
          {bucket('Сегодня', result.today, '#94a3b8')}
          {bucket('Потом', result.later, '#64748b')}
          {bucket('Отпустить', result.release, '#4ade80')}
        </motion.div>
      )}
    </motion.div>
  )
}
