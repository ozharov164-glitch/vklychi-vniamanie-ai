import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { apiToday } from '../api'
import { images } from '../lib/assets'
import { ScreenHero } from '../components/ScreenHero'
import { ContextTip } from '../components/ContextTip'
import { VoiceTextField } from '../components/VoiceTextField'
import { SECTION_TIPS } from '../lib/sectionTips'

export function TodayScreen() {
  const [slots, setSlots] = useState({ morning: '', day: '', evening: '' })
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    apiToday()
      .then((r) => setSlots(r.slots))
      .catch(() => setError('Не удалось загрузить якоря'))
      .finally(() => setLoading(false))
  }, [])

  async function save() {
    setSaving(true)
    setError('')
    try {
      await apiToday(slots)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      window.Telegram?.WebApp.HapticFeedback?.notificationOccurred('success')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось сохранить')
    } finally {
      setSaving(false)
    }
  }

  const field = (key: keyof typeof slots, label: string, placeholder: string, hint: string) => (
    <div className="slot-field">
      <div className="slot-field__head">
        <label className="field-label" htmlFor={`slot-${key}`}>
          {label}
        </label>
        <span className="slot-field__hint">{hint}</span>
      </div>
      <VoiceTextField
        id={`slot-${key}`}
        placeholder={placeholder}
        value={slots[key]}
        onChange={(v) => setSlots({ ...slots, [key]: v })}
        disabled={loading || saving}
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
      <ContextTip id="today" text={SECTION_TIPS.today} />

      {loading ? (
        <p className="hint-line">Загружаю якоря…</p>
      ) : (
        <>
          {field('morning', 'Утро', 'Одно главное на утро', 'с чего начать')}
          {field('day', 'День', 'Один фокус днём', 'середина')}
          {field('evening', 'Вечер', 'Мягкое завершение', 'закрыть день')}
        </>
      )}

      {error && <p className="form-error">{error}</p>}
      <button type="button" className="btn-primary" onClick={save} disabled={loading || saving}>
        {saved ? 'Сохранено ✓' : saving ? 'Сохраняю…' : 'Сохранить якоря'}
      </button>
    </motion.div>
  )
}
