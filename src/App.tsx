import { useAppStore } from './store'
import { TabBar } from './components/TabBar'
import { FocusTimer } from './components/FocusTimer'
import { HomeScreen } from './screens/HomeScreen'
import { DumpScreen } from './screens/DumpScreen'
import { StepsScreen } from './screens/StepsScreen'
import { TodayScreen } from './screens/TodayScreen'
import { images } from './lib/assets'

export function App() {
  const ready = useAppStore((s) => s.ready)
  const tab = useAppStore((s) => s.tab)

  if (!ready) {
    return (
      <div className="app-loading">
        <img src={images.hero} alt="" className="app-loading__img" />
        <p className="app-loading__text">Подключаем ВключиВнимание…</p>
      </div>
    )
  }

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
