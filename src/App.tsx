import { useAppStore } from './store'
import { TabBar } from './components/TabBar'
import { StartScreen } from './screens/StartScreen'
import { WinsScreen } from './screens/WinsScreen'

export function App() {
  const tab = useAppStore((s) => s.tab)

  return (
    <div className="app-shell">
      {tab === 'start' && <StartScreen />}
      {tab === 'wins' && <WinsScreen />}
      <TabBar />
    </div>
  )
}
