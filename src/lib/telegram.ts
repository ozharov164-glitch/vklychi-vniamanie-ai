const INIT_RETRY_MS = [0, 120, 350, 900, 2000]

let cachedInitData = ''

function readInitDataSync(): string {
  if (typeof window === 'undefined') return ''
  const tg = window.Telegram?.WebApp
  if (tg?.initData?.trim()) return tg.initData.trim()
  const hash = window.location.hash.slice(1)
  if (hash) {
    const fromHash = new URLSearchParams(hash).get('tgWebAppData')?.trim()
    if (fromHash) return fromHash
  }
  const search = new URLSearchParams(window.location.search)
  return search.get('tgWebAppData')?.trim() || ''
}

export function refreshInitData(): void {
  const raw = readInitDataSync()
  if (raw) cachedInitData = raw
}

export function getInitDataString(): string {
  if (cachedInitData) return cachedInitData
  const raw = readInitDataSync()
  if (raw) cachedInitData = raw
  return raw
}

export function getStartTokenFromUrl(): string {
  if (typeof window === 'undefined') return ''
  const search = new URLSearchParams(window.location.search)
  const fromSearch = search.get('start_token')?.trim() || search.get('startToken')?.trim()
  if (fromSearch) return fromSearch
  const hash = window.location.hash.slice(1)
  if (!hash) return ''
  const params = new URLSearchParams(hash)
  return params.get('start_token')?.trim() || params.get('startToken')?.trim() || ''
}

/** Ждём Telegram WebApp и появление initData (на iOS иногда с задержкой). */
export function waitForTelegramReady(): Promise<void> {
  return new Promise((resolve) => {
    refreshInitData()
    if (getInitDataString()) {
      resolve()
      return
    }
    const tg = window.Telegram?.WebApp
    if (!tg) {
      resolve()
      return
    }
    try {
      tg.ready()
      tg.expand()
    } catch {
      /* ignore */
    }
    refreshInitData()
    if (getInitDataString()) {
      resolve()
      return
    }
    let n = 0
    const tick = () => {
      refreshInitData()
      if (getInitDataString() || n >= INIT_RETRY_MS.length) {
        resolve()
        return
      }
      setTimeout(tick, INIT_RETRY_MS[n] ?? 500)
      n += 1
    }
    setTimeout(tick, INIT_RETRY_MS[0])
  })
}
