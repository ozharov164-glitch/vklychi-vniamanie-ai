import { useAppStore } from './store'
import { TabBar } from './components/TabBar'
import { FocusTimer } from './components/FocusTimer'
import { HomeScreen } from './screens/HomeScreen'
import { DumpScreen } from './screens/DumpScreen'
import { StepsScreen } from './screens/StepsScreen'
import { TodayScreen } from './screens/TodayScreen'

export function App() {
  const tab = useAppStore((s) => s.tab)

  return (
    <div className="app-shell">
      {tab === 'home' && <HomeScreen />}
      {tab === 'dump' && <DumpScreen />}
      {tab === 'steps' && <StepsScreen />}
      {tab === 'focus' && <FocusTimer />}
      {tab === 'today' && <TodayScreen />}
      <TabBar />
    </div>
  )
}
