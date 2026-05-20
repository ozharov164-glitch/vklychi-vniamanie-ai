/** Блокирует pinch-zoom и двойной тап в Telegram WebView. */
export function lockAppViewport(): void {
  if (typeof document === 'undefined') return

  const meta = document.querySelector('meta[name="viewport"]')
  if (meta) {
    meta.setAttribute(
      'content',
      'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover',
    )
  }

  document.documentElement.style.touchAction = 'manipulation'
  document.body.style.touchAction = 'manipulation'

  const blockGesture = (e: Event) => e.preventDefault()
  document.addEventListener('gesturestart', blockGesture, { passive: false })
  document.addEventListener('gesturechange', blockGesture, { passive: false })
  document.addEventListener('gestureend', blockGesture, { passive: false })

  let lastTouchEnd = 0
  document.addEventListener(
    'touchend',
    (e) => {
      const now = Date.now()
      if (now - lastTouchEnd <= 320) e.preventDefault()
      lastTouchEnd = now
    },
    { passive: false },
  )

  try {
    window.Telegram?.WebApp?.disableVerticalSwipes?.()
  } catch {
    /* ignore */
  }
}
