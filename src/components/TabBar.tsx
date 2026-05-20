import { useAppStore, type TabId } from '../store'
import { TabIcon } from './TabIcons'

const TABS: { id: TabId; label: string }[] = [
  { id: 'start', label: 'Разморозка' },
  { id: 'wins', label: 'Победы' },
]

export function TabBar() {
  const tab = useAppStore((s) => s.tab)
  const setTab = useAppStore((s) => s.setTab)
  return (
    <nav className="tab-bar" aria-label="Навигация">
      {TABS.map((t) => {
        const active = tab === t.id
        return (
          <button
            key={t.id}
            type="button"
            className={`tab-btn ${active ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
            aria-current={active ? 'page' : undefined}
          >
            <span className="tab-btn__pill">
              <span className="tab-btn__icon">
                <TabIcon id={t.id} active={active} />
              </span>
              <span className="tab-btn__label">{t.label}</span>
            </span>
          </button>
        )
      })}
    </nav>
  )
}
