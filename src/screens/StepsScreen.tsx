import { useState } from 'react'
import { motion } from 'framer-motion'
import { apiSteps, apiStuck } from '../api'
import { useAppStore } from '../store'
import { images } from '../lib/assets'
import { ScreenHero } from '../components/ScreenHero'

const FEAR_LABELS = ['', 'легко', 'терпимо', 'напряжно', 'страшно', 'парализует']

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
    <motion.div className="screen stack" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <ScreenHero
        image={images.steps}
        alt=""
        eyebrow="Шаг 2"
        title="Магия шагов"
        subtitle="Одна задача → маленькие действия. Чем страшнее — тем мельче шаги."
        compact
      />

      <label className="field-label" htmlFor="task-input">
        Что нужно сделать?
      </label>
      <input
        id="task-input"
        className="input-field"
        placeholder="Например: написать отчёт"
        value={task}
        onChange={(e) => setTask(e.target.value)}
      />

      <div className="fear-block">
        <div className="fear-block__head">
          <p className="field-label">Насколько страшно?</p>
          <span className="fear-block__value">{fear}/5 · {FEAR_LABELS[fear]}</span>
        </div>
        <input
          type="range"
          min={1}
          max={5}
          value={fear}
          onChange={(e) => setFear(Number(e.target.value))}
          className="fear-slider"
          aria-label="Уровень страха"
        />
      </div>

      {error && <p className="form-error">{error}</p>}

      <button type="button" className="btn-primary" disabled={loading || task.length < 2} onClick={split}>
        {loading ? 'Думаю…' : 'Разбить на шаги'}
      </button>
      <button type="button" className="btn-secondary" disabled={stuckLoading} onClick={onStuck}>
        {stuckLoading ? 'Секунду…' : 'Застрял(а) — нужен микро-шаг'}
      </button>

      {stuck && (
        <div className="highlight-card">
          <p className="highlight-card__text">{stuck.reflection}</p>
          <p className="highlight-card__accent">{stuck.micro_step}</p>
          <button type="button" className="btn-primary btn-primary--compact" onClick={() => setTab('focus')}>
            2 минуты «Рядом»
          </button>
        </div>
      )}

      {steps.length > 0 && (
        <ol className="steps-list">
          {steps.map((s, i) => (
            <li key={i}>
              <span className="steps-list__n">{i + 1}</span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
      )}

      {micro && (
        <div className="highlight-card">
          <p className="highlight-card__label">Первый микро-шаг</p>
          <p className="highlight-card__text">{micro}</p>
          {!premium && (
            <p className="hint-line">В Премиум — больше шагов и точнее формулировки (ИИ сильнее).</p>
          )}
        </div>
      )}
    </motion.div>
  )
}
