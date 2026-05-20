import { COPY } from '../lib/copy'
import { useAppStore, type TabId } from '../store'
import { TabIcon } from './TabIcons'

const TABS: { id: TabId; label: string }[] = [
  { id: 'start', label: COPY.tabs.start },
  { id: 'wins', label: COPY.tabs.wins },
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
          className={`tab-btn${tab === t.id ? ' active' : ''}`}
          onClick={() => setTab(t.id)}
          aria-current={tab === t.id ? 'page' : undefined}
        >
          <span className="tab-btn__pill">
            <span className="tab-btn__icon">
              <TabIcon id={t.id} active={tab === t.id} />
            </span>
            <span className="tab-btn__label">{t.label}</span>
          </span>
        </button>
      ))}
    </nav>
  )
}
