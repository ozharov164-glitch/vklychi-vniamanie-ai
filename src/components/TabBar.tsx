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
    <nav className="tab-bar">
      {TABS.map((t) => (
        <button
          key={t.id}
          type="button"
          className={`tab-btn ${tab === t.id ? 'active' : ''}`}
          onClick={() => setTab(t.id)}
        >
          <span className="text-lg">{t.icon}</span>
          <span>{t.label}</span>
        </button>
      ))}
    </nav>
  )
}
