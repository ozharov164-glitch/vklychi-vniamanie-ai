import { motion } from 'framer-motion'
import { useAppStore, type TabId } from '../store'

const STEPS: { n: string; title: string; hint: string; tab: TabId }[] = [
  { n: '1', title: 'Сброс', hint: 'Выложи мысли — ИИ разложит', tab: 'dump' },
  { n: '2', title: 'Шаги', hint: 'Одна задача → микро-действия', tab: 'steps' },
  { n: '3', title: 'Рядом', hint: 'Таймер без давления', tab: 'focus' },
]

export function HowItWorks() {
  const setTab = useAppStore((s) => s.setTab)
  const tab = useAppStore((s) => s.tab)

  return (
    <section className="how-it-works" aria-label="Как пользоваться">
      <p className="section-label">За 30 секунд</p>
      <div className="how-it-works__row">
        {STEPS.map((s, i) => (
          <motion.button
            key={s.tab}
            type="button"
            className={`how-step ${tab === s.tab ? 'how-step--active' : ''}`}
            onClick={() => setTab(s.tab)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            whileTap={{ scale: 0.97 }}
          >
            <span className="how-step__n">{s.n}</span>
            <span className="how-step__title">{s.title}</span>
            <span className="how-step__hint">{s.hint}</span>
          </motion.button>
        ))}
      </div>
    </section>
  )
}
