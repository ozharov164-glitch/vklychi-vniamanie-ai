import { useState } from 'react'
import { motion } from 'framer-motion'
import { apiSteps, apiStuck } from '../api'
import { useAppStore } from '../store'
import { images } from '../lib/assets'
import { ScreenHero } from '../components/ScreenHero'
import { ContextTip } from '../components/ContextTip'
import { VoiceTextField } from '../components/VoiceTextField'
import { SECTION_TIPS } from '../lib/sectionTips'

const FEAR_LABELS = ['', 'легко', 'терпимо', 'напряжно', 'страшно', 'парализует']

export function StepsScreen() {
  const premium = useAppStore((s) => s.premium)
  const setTab = useAppStore((s) => s.setTab)
  const setAiUsage = useAppStore((s) => s.setAiUsage)
  const [task, setTask] = useState('')
  const [fear, setFear] = useState(3)
  const [steps, setSteps] = useState<string[]>([])
  const [doneSteps, setDoneSteps] = useState<Set<number>>(new Set())
  const [micro, setMicro] = useState('')
  const [loading, setLoading] = useState(false)
  const [stuckLoading, setStuckLoading] = useState(false)
  const [error, setError] = useState('')
  const [stuck, setStuck] = useState<{ reflection: string; micro_step: string } | null>(null)

  async function split() {
    setError('')
    setLoading(true)
    setStuck(null)
    setDoneSteps(new Set())
    try {
      const r = await apiSteps(task, fear)
      setSteps(r.steps)
      setMicro(r.first_micro)
      if (r.aiUsage) setAiUsage(r.aiUsage)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка')
    } finally {
      setLoading(false)
    }
  }

  async function onStuck() {
    setStuckLoading(true)
    setError('')
    try {
      const r = await apiStuck(task || 'не могу начать')
      setStuck({ reflection: r.reflection, micro_step: r.micro_step })
      if (r.aiUsage) setAiUsage(r.aiUsage)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка')
    } finally {
      setStuckLoading(false)
    }
  }

  function toggleStep(i: number) {
    setDoneSteps((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
    window.Telegram?.WebApp.HapticFeedback?.impactOccurred('light')
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
      <ContextTip id="steps" text={SECTION_TIPS.steps} />

      <label className="field-label" htmlFor="task-input">
        Что нужно сделать?
      </label>
      <VoiceTextField
        id="task-input"
        placeholder="Например: написать отчёт"
        value={task}
        onChange={setTask}
        disabled={loading || stuckLoading}
      />

      <div className="fear-block">
        <div className="fear-block__head">
          <p className="field-label">Насколько страшно?</p>
          <span className="fear-block__value">
            {fear}/5 · {FEAR_LABELS[fear]}
          </span>
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
        <p className="hint-line fear-block__hint">
          {fear >= 4 ? 'Высокий страх — ИИ предложит микро-шаг на 2 минуты первым.' : 'Средний уровень — обычные конкретные шаги.'}
        </p>
      </div>

      {error && <p className="form-error">{error}</p>}

      <button type="button" className="btn-primary" disabled={loading || task.length < 2} onClick={split}>
        {loading ? 'Думаю…' : 'Разбить на шаги'}
      </button>
      <button type="button" className="btn-secondary" disabled={stuckLoading} onClick={onStuck}>
        {stuckLoading ? 'Секунду…' : 'Застрял(а) — нужен микро-шаг'}
      </button>

      {stuck && (
        <motion.div className="highlight-card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <p className="highlight-card__text">{stuck.reflection}</p>
          <p className="highlight-card__accent">{stuck.micro_step}</p>
          <button type="button" className="btn-primary btn-primary--compact" onClick={() => setTab('focus')}>
            2 минуты «Рядом»
          </button>
        </motion.div>
      )}

      {steps.length > 0 && (
        <ol className="steps-list">
          {steps.map((s, i) => {
            const done = doneSteps.has(i)
            return (
              <li key={i} className={done ? 'steps-list__item--done' : ''}>
                <button type="button" className="steps-list__check" onClick={() => toggleStep(i)} aria-label={done ? 'Снять отметку' : 'Отметить выполненным'}>
                  {done ? '✓' : i + 1}
                </button>
                <span className={done ? 'steps-list__text--done' : ''}>{s}</span>
              </li>
            )
          })}
        </ol>
      )}

      {micro && (
        <div className="highlight-card">
          <p className="highlight-card__label">Первый микро-шаг</p>
          <p className="highlight-card__text">{micro}</p>
          <div className="result-actions">
            <button type="button" className="btn-primary btn-primary--compact" onClick={() => setTab('focus')}>
              Начать «Рядом»
            </button>
          </div>
          {!premium && (
            <p className="hint-line">В Премиум — до 6 шагов и более точные формулировки.</p>
          )}
        </div>
      )}
    </motion.div>
  )
}
