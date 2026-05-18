import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './App'
import { apiInit, loadBackend } from './api'
import { useAppStore } from './store'

async function bootstrap() {
  const tg = window.Telegram?.WebApp
  tg?.ready()
  tg?.expand()
  tg?.themeParams && document.documentElement.style.setProperty('--tg-bg', tg.themeParams.bg_color || '')

  await loadBackend()
  const params = new URLSearchParams(window.location.search)
  const startToken = params.get('start_token') || undefined
  try {
    const data = await apiInit(startToken)
    useAppStore.getState().applyInit(data)
  } catch {
    document.getElementById('root')!.innerHTML =
      '<p style="padding:24px;color:#8b9cb3;text-align:center">Открой приложение из бота «ВключиСебя»</p>'
    return
  }
}

bootstrap()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
