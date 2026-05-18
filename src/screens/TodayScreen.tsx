import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { apiToday } from '../api'

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
  }

  const field = (key: keyof typeof slots, label: string, placeholder: string) => (
    <div>
      <label className="mb-1 block text-xs font-semibold text-[var(--muted)]">{label}</label>
      <input
        className="input-field"
        placeholder={placeholder}
        value={slots[key]}
        onChange={(e) => setSlots({ ...slots, [key]: e.target.value })}
      />
    </div>
  )

  return (
    <motion.div className="space-y-4 pb-4" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <h2 className="text-xl font-bold">Ритм дня</h2>
      <p className="text-sm text-[var(--muted)]">Три якоря — не список на 40 пунктов.</p>
      {field('morning', 'Утро', 'Главное на утро')}
      {field('day', 'День', 'Один фокус днём')}
      {field('evening', 'Вечер', 'Мягкое завершение')}
      <button type="button" className="btn-primary" onClick={save}>
        {saved ? 'Сохранено ✓' : 'Сохранить'}
      </button>
    </motion.div>
  )
}
