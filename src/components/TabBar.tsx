import { useAppStore, type TabId } from '../store'

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'home', label: 'Главная', icon: '⌂' },
  { id: 'dump', label: 'Сброс', icon: '◎' },
  { id: 'steps', label: 'Шаги', icon: '▸' },
  { id: 'focus', label: 'Рядом', icon: '◉' },
  { id: 'today', label: 'День', icon: '☰' },
]

export function TabBar() {
  const tab = useAppStore((s) => s.tab)
  const setTab = useAppStore((s) => s.setTab)
  return (
    <nav className="tab-bar" aria-label="Навигация">
      {TABS.map((t) => (
        <button
          key={t.id}
          type="button"
          className={`tab-btn ${tab === t.id ? 'active' : ''}`}
          onClick={() => setTab(t.id)}
          aria-current={tab === t.id ? 'page' : undefined}
        >
          <span className="tab-btn__icon" aria-hidden>
            {t.icon}
          </span>
          <span>{t.label}</span>
        </button>
      ))}
    </nav>
  )
}
