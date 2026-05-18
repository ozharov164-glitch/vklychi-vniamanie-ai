import { motion } from 'framer-motion'
import { useAppStore } from '../store'
import { images } from '../lib/assets'
import { ScreenHero } from '../components/ScreenHero'
import { HowItWorks } from '../components/HowItWorks'
import { AiStatusLine } from '../components/AiStatusLine'
import { PremiumBanner } from '../components/PremiumBanner'

export function HomeScreen() {
  const premium = useAppStore((s) => s.premium)
  const stats = useAppStore((s) => s.stats)
  const setTab = useAppStore((s) => s.setTab)

  return (
    <motion.div className="screen stack" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <ScreenHero
        image={images.hero}
        alt=""
        eyebrow="ВключиСебя"
        title="ВключиВнимание"
        subtitle="Внешний мозг для старта — без стыда и без давления. Три шага ниже."
      />

      <div className="stat-grid">
        <div className="stat-card">
          <p className="stat-card__value">{stats.sessionsToday}</p>
          <p className="stat-card__label">сессий сегодня</p>
        </div>
        <div className="stat-card">
          <p className="stat-card__value stat-card__value--muted">{stats.winsTotal}</p>
          <p className="stat-card__label">микро-побед всего</p>
        </div>
      </div>

      <HowItWorks />
      <AiStatusLine />
      {!premium && <PremiumBanner />}

      <div className="cta-stack">
        <button type="button" className="btn-primary btn-primary--glow" onClick={() => setTab('focus')}>
          Начать «Рядом» — таймер
        </button>
        <button type="button" className="btn-secondary" onClick={() => setTab('dump')}>
          Сбросить голову
        </button>
      </div>

      <p className="disclaimer">
        Не диагностика СДВГ. Инструмент самопомощи при трудностях с вниманием и стартом задач.
      </p>
    </motion.div>
  )
}
