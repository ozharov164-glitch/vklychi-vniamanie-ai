import { useState } from 'react'
import { motion } from 'framer-motion'
import { apiSteps, apiStuck } from '../api'
import { useAppStore } from '../store'

export function StepsScreen() {
  const premium = useAppStore((s) => s.premium)
  const setTab = useAppStore((s) => s.setTab)
  const [task, setTask] = useState('')
  const [fear, setFear] = useState(3)
  const [steps, setSteps] = useState<string[]>([])
  const [micro, setMicro] = useState('')
  const [loading, setLoading] = useState(false)
  const [stuckLoading, setStuckLoading] = useState(false)
  const [error, setError] = useState('')
  const [stuck, setStuck] = useState<{ reflection: string; micro_step: string } | null>(null)

  async function split() {
    setError('')
    setLoading(true)
    setStuck(null)
    try {
      const r = await apiSteps(task, fear)
      setSteps(r.steps)
      setMicro(r.first_micro)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка')
    } finally {
      setLoading(false)
    }
  }

  async function onStuck() {
    setStuckLoading(true)
    try {
      const r = await apiStuck(task || 'не могу начать')
      setStuck({ reflection: r.reflection, micro_step: r.micro_step })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка')
    } finally {
      setStuckLoading(false)
    }
  }

  return (
    <motion.div className="space-y-4 pb-4" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <h2 className="text-xl font-bold">Магия шагов</h2>
      <p className="text-sm text-[var(--muted)]">
        Одна фраза → маленькие шаги. Premium — глубже (DeepSeek).
      </p>
      <input
        className="input-field"
        placeholder="Например: написать отчёт"
        value={task}
        onChange={(e) => setTask(e.target.value)}
      />
      <div>
        <p className="mb-2 text-xs text-[var(--muted)]">Насколько страшно? {fear}/5</p>
        <input
          type="range"
          min={1}
          max={5}
          value={fear}
          onChange={(e) => setFear(Number(e.target.value))}
          className="w-full accent-[var(--accent)]"
        />
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button type="button" className="btn-primary" disabled={loading || task.length < 2} onClick={split}>
        {loading ? 'Думаю…' : 'Разбить на шаги'}
      </button>
      <button type="button" className="btn-ghost w-full" disabled={stuckLoading} onClick={onStuck}>
        {stuckLoading ? '…' : 'Застрял(а)'}
      </button>
      {stuck && (
        <div className="card space-y-2 p-4">
          <p className="text-sm">{stuck.reflection}</p>
          <p className="font-medium text-[var(--accent)]">{stuck.micro_step}</p>
          <button type="button" className="btn-primary" onClick={() => setTab('focus')}>
            2 минуты «рядом»
          </button>
        </div>
      )}
      {steps.length > 0 && (
        <motion.ol className="card list-decimal space-y-2 p-4 pl-8 text-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {steps.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </motion.ol>
      )}
      {micro && (
        <motion.div className="card p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <p className="text-xs text-[var(--accent)]">Первый микро-шаг</p>
          <p className="mt-1">{micro}</p>
          {!premium && (
            <p className="mt-2 text-xs text-[var(--muted)]">В Премиум — больше шагов и точнее формулировки.</p>
          )}
        </motion.div>
      )}
    </motion.div>
  )
}
