import { useAppStore } from './store'
import { TabBar } from './components/TabBar'
import { FocusTimer } from './components/FocusTimer'
import { HomeScreen } from './screens/HomeScreen'
import { DumpScreen } from './screens/DumpScreen'
import { StepsScreen } from './screens/StepsScreen'
import { TodayScreen } from './screens/TodayScreen'

export function App() {
  const ready = useAppStore((s) => s.ready)
  const tab = useAppStore((s) => s.tab)

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-6 text-center">
        <p className="text-[var(--muted)]">Подключаемся…</p>
      </div>
    )
  }

  return (
    <div className="mx-auto min-h-dvh max-w-lg px-4 pb-28 pt-6">
      {tab === 'home' && <HomeScreen />}
      {tab === 'dump' && <DumpScreen />}
      {tab === 'steps' && <StepsScreen />}
      {tab === 'focus' && <FocusTimer />}
      {tab === 'today' && <TodayScreen />}
      <TabBar />
    </div>
  )
}
