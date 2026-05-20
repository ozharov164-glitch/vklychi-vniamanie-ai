import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { AnimatePresence } from 'framer-motion'
import './index.css'
import { App } from './App'
import { LoadingScreen } from './components/LoadingScreen'
import { apiInit, loadBackend } from './api'
import { delay, preloadImages } from './lib/preload'
import { waitForTelegramReady } from './lib/telegram'
import { lockAppViewport } from './lib/viewport'
import { useAppStore } from './store'

const MIN_SPLASH_MS = 2400

function Boot() {
  const ready = useAppStore((s) => s.ready)
  const [progress, setProgress] = useState(12)
  const [phase, setPhase] = useState('Подключаемся…')
  const [fatal, setFatal] = useState('')

  useEffect(() => {
    let cancelled = false

    async function run() {
      lockAppViewport()
      const tg = window.Telegram?.WebApp
      if (tg?.themeParams?.bg_color) {
        document.documentElement.style.setProperty('--tg-bg', tg.themeParams.bg_color)
      }

      const t0 = Date.now()
      try {
        setProgress(18)
        setPhase('Связь с сервером…')
        await loadBackend()
        await waitForTelegramReady()

        setProgress(48)
        setPhase('Загружаем интерфейс…')
        const [, data] = await Promise.all([preloadImages(), apiInit()])

        if (cancelled) return
        useAppStore.getState().applyInit(data)

        setProgress(88)
        setPhase('Почти готово…')
        const elapsed = Date.now() - t0
        if (elapsed < MIN_SPLASH_MS) await delay(MIN_SPLASH_MS - elapsed)

        setProgress(100)
        if (!cancelled) useAppStore.getState().setBootComplete()
      } catch (e) {
        if (!cancelled) {
          setFatal(e instanceof Error ? e.message : 'Открой приложение из бота «ВключиСебя»')
        }
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [])

  if (fatal) {
    return <p className="splash-fatal">{fatal}</p>
  }

  return (
    <AnimatePresence mode="wait">
      {!ready ? (
        <LoadingScreen key="splash" progress={progress} phase={phase} />
      ) : (
        <App key="app" />
      )}
    </AnimatePresence>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Boot />
  </StrictMode>,
)
