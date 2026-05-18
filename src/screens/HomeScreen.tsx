import { motion } from 'framer-motion'
import { useAppStore } from '../store'

export function HomeScreen() {
  const premium = useAppStore((s) => s.premium)
  const stats = useAppStore((s) => s.stats)
  const aiUsage = useAppStore((s) => s.aiUsage)
  const limits = useAppStore((s) => s.limits)
  const setTab = useAppStore((s) => s.setTab)

  const aiLabel = premium
    ? `ИИ сегодня: ${aiUsage.deepseekCount}/${limits.deepseekDaily} (DeepSeek)`
    : `ИИ сегодня: ${aiUsage.groqCount}/${limits.groqDaily} (Groq)`

  return (
    <motion.div className="space-y-5 pb-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <header>
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">ВключиСебя</p>
        <h1 className="mt-1 text-2xl font-bold">⚓ ВключиВнимание</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Внешний мозг для старта задач — без стыда и без давления.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4 text-center">
          <p className="font-mono text-2xl font-bold text-[var(--accent)]">{stats.sessionsToday}</p>
          <p className="mt-1 text-xs text-[var(--muted)]">сессий сегодня</p>
        </div>
        <div className="card p-4 text-center">
          <p className="font-mono text-2xl font-bold">{stats.winsTotal}</p>
          <p className="mt-1 text-xs text-[var(--muted)]">микро-побед всего</p>
        </div>
      </div>

      <p className="text-center text-xs text-[var(--muted)]">{aiLabel}</p>

      {!premium && (
        <div className="card border border-[var(--accent)]/30 p-4 text-sm">
          <p className="font-medium text-[var(--accent)]">Премиум</p>
          <p className="mt-1 text-[var(--muted)]">
            Один тариф открывает «Путь к Себе» и умный ИИ здесь (DeepSeek). Оформи в боте: «💰 Тарифы».
          </p>
        </div>
      )}

      <div className="space-y-2">
        <button type="button" className="btn-primary" onClick={() => setTab('focus')}>
          Начать «Рядом»
        </button>
        <button type="button" className="btn-ghost w-full" onClick={() => setTab('dump')}>
          Сбросить голову
        </button>
      </div>

      <p className="text-center text-[10px] text-[var(--muted)]">
        Не диагностика СДВГ. Инструмент самопомощи при трудностях внимания.
      </p>
    </motion.div>
  )
}
