import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { apiToday } from '../api'
import { images } from '../lib/assets'
import { ScreenHero } from '../components/ScreenHero'

export function TodayScreen() {
  const [slots, setSlots] = useState({ morning: '', day: '', evening: '' })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    apiToday()
      .then((r) => setSlots(r.slots))
      .catch(() => {})
  }, [])

  async function save() {
    await apiToday(slots)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    window.Telegram?.WebApp.HapticFeedback?.notificationOccurred('success')
  }

  const field = (key: keyof typeof slots, label: string, placeholder: string, hint: string) => (
    <div className="slot-field">
      <div className="slot-field__head">
        <label className="field-label" htmlFor={`slot-${key}`}>
          {label}
        </label>
        <span className="slot-field__hint">{hint}</span>
      </div>
      <input
        id={`slot-${key}`}
        className="input-field"
        placeholder={placeholder}
        value={slots[key]}
        onChange={(e) => setSlots({ ...slots, [key]: e.target.value })}
      />
    </div>
  )

  return (
    <motion.div className="screen stack" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <ScreenHero
        image={images.today}
        alt=""
        eyebrow="Якоря"
        title="Ритм дня"
        subtitle="Три опоры — не список на сорок пунктов. Заполни за минуту."
        compact
      />
      {field('morning', 'Утро', 'Одно главное на утро', 'с чего начать')}
      {field('day', 'День', 'Один фокус днём', 'середина')}
      {field('evening', 'Вечер', 'Мягкое завершение', 'закрыть день')}
      <button type="button" className="btn-primary" onClick={save}>
        {saved ? 'Сохранено ✓' : 'Сохранить якоря'}
      </button>
    </motion.div>
  )
}
