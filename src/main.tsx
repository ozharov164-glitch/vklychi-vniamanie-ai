import { enforceFreshDeploy } from './lib/appCache'

enforceFreshDeploy()

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
import { COPY } from './lib/copy'
import { useAppStore } from './store'

const MIN_SPLASH_MS = 2400

function removeBootSplash() {
  document.getElementById('boot-splash')?.remove()
}

function Boot() {
  const ready = useAppStore((s) => s.ready)
  const [progress, setProgress] = useState(12)
  const [phase, setPhase] = useState(COPY.splash.phases.connecting)
  const [fatal, setFatal] = useState('')

  useEffect(() => {
    removeBootSplash()
    let cancelled = false

    async function run() {
      lockAppViewport()
      const tg = window.Telegram?.WebApp
      const scheme = tg?.colorScheme || 'dark'
      document.documentElement.setAttribute('data-tg-theme', scheme)
      if (tg?.themeParams?.bg_color) {
        document.documentElement.style.setProperty('--tg-bg', tg.themeParams.bg_color)
      }
      tg?.ready?.()
      tg?.expand?.()

      const t0 = Date.now()
      try {
        setProgress(18)
        setPhase(COPY.splash.phases.server)
        await loadBackend()
        await waitForTelegramReady()

        setProgress(48)
        setPhase(COPY.splash.phases.ui)
        const [, data] = await Promise.all([preloadImages(), apiInit()])

        if (cancelled) return
        useAppStore.getState().applyInit(data)

        setProgress(88)
        setPhase(COPY.splash.phases.almost)
        const elapsed = Date.now() - t0
        if (elapsed < MIN_SPLASH_MS) await delay(MIN_SPLASH_MS - elapsed)

        setProgress(100)
        if (!cancelled) useAppStore.getState().setBootComplete()
      } catch (e) {
        if (!cancelled) {
          setFatal(e instanceof Error ? e.message : COPY.splash.fatal)
        }
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [])

  if (fatal) {
    removeBootSplash()
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
