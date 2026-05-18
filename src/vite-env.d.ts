/// <reference types="vite/client" />

interface TelegramWebApp {
  ready: () => void
  expand: () => void
  close: () => void
  initData: string
  initDataUnsafe: { user?: { id: number; first_name?: string } }
  themeParams: Record<string, string>
  MainButton: {
    show: () => void
    hide: () => void
    setText: (t: string) => void
    onClick: (cb: () => void) => void
    offClick: (cb: () => void) => void
  }
  HapticFeedback?: { impactOccurred: (s: string) => void }
}

interface Window {
  Telegram?: { WebApp: TelegramWebApp }
}
