import { getInitDataString, getStartTokenFromUrl, refreshInitData } from './lib/telegram'

const TOKEN_KEY = 'fva_token'
const INIT_RETRY_MS = [0, 150, 400, 1000, 2500]

let backend = ''

export async function loadBackend(): Promise<void> {
  const q = new URLSearchParams(window.location.search).get('backend')?.trim()
  if (q?.startsWith('http')) {
    backend = q.replace(/\/$/, '')
    sessionStorage.setItem('fva_backend', backend)
    return
  }
  const stored = sessionStorage.getItem('fva_backend')
  if (stored?.startsWith('http')) {
    backend = stored.replace(/\/$/, '')
    return
  }
  try {
    const base = import.meta.env.BASE_URL || '/'
    const path = base.endsWith('/') ? `${base}config.json` : `${base}/config.json`
    const r = await fetch(`${window.location.origin}${path}`, { cache: 'no-store' })
    if (r.ok) {
      const j = (await r.json()) as { backendUrl?: string }
      if (j.backendUrl?.startsWith('http')) backend = j.backendUrl.replace(/\/$/, '')
    }
  } catch {
    /* ignore */
  }
}

export function getBackend(): string {
  return backend
}

export function setAuthToken(t: string): void {
  sessionStorage.setItem(TOKEN_KEY, t)
}

export function getAuthToken(): string {
  return sessionStorage.getItem(TOKEN_KEY) || ''
}

function authBody(extra: Record<string, unknown> = {}): Record<string, unknown> {
  const token = getAuthToken()
  if (token) return { token, ...extra }
  const initData = getInitDataString()
  if (initData) return { initData, ...extra }
  return extra
}

async function postRaw<T>(path: string, body: Record<string, unknown>): Promise<T> {
  if (!backend) throw new Error('Сервер не настроен')
  const res = await fetch(`${backend}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = (await res.json()) as T & { error?: string; limitReached?: boolean }
  if (!res.ok) {
    const err = new Error(data.error || `Ошибка ${res.status}`) as Error & { limitReached?: boolean }
    err.limitReached = data.limitReached
    throw err
  }
  return data
}

async function post<T>(path: string, body: Record<string, unknown>): Promise<T> {
  return postRaw<T>(path, authBody(body))
}

export type BlockerId = 'fear' | 'fog' | 'perfection' | 'low_energy' | ''

export type FocusHistoryItem = {
  id: number
  mode: string
  taskLabel: string
  microStep: string
  outcome: string | null
  durationSec: number
  startedAt: string
  endedAt: string | null
}

export type InitResponse = {
  app_save_token: string
  isPremium: boolean
  aiUsage: { aiUsedToday: number; hintsLimit: number }
  stats: { sessionsToday: number; winsTotal: number; streakDays: number }
}

export type ActionResponse = {
  ok: boolean
  sessionId: number
  mode: string
  insight?: string
  whyShort?: string
  patternLine?: string
  reflection: string
  microStep: string
  taskLabel: string
  nextSteps: string[]
  steps?: string[]
  alternates?: string[]
  whyLightest?: string
  now?: string[]
  today?: string[]
  later?: string[]
  release?: string[]
  lightest?: string
  aiUsage?: { aiUsedToday: number; hintsLimit: number }
  cached?: boolean
}

async function postFocusInit(body: Record<string, unknown>): Promise<InitResponse> {
  return postRaw<InitResponse>('/mini-app/focus/init', body)
}

export async function apiInit(): Promise<InitResponse> {
  refreshInitData()

  const saved = getAuthToken()
  if (saved) {
    try {
      const data = await postFocusInit({ token: saved })
      setAuthToken(data.app_save_token)
      return data
    } catch {
      sessionStorage.removeItem(TOKEN_KEY)
    }
  }

  const startToken = getStartTokenFromUrl()
  if (startToken) {
    try {
      const data = await postFocusInit({ start_token: startToken, initData: getInitDataString() || undefined })
      setAuthToken(data.app_save_token)
      return data
    } catch {
      /* */
    }
  }

  for (let i = 0; i < INIT_RETRY_MS.length; i++) {
    if (i > 0) await new Promise((r) => setTimeout(r, INIT_RETRY_MS[i]))
    refreshInitData()
    const initData = getInitDataString()
    if (!initData) continue
    try {
      const data = await postFocusInit({ initData })
      setAuthToken(data.app_save_token)
      return data
    } catch (e) {
      const msg = e instanceof Error ? e.message : ''
      if (!msg.includes('401') && !msg.includes('авториза') && !msg.includes('устарел')) throw e
    }
  }

  throw new Error('Не удалось войти. Закрой приложение и открой снова кнопкой в боте.')
}

export async function apiUnfreeze(mode: 'stuck' | 'noise', text: string, blocker: BlockerId = '') {
  return post<ActionResponse>('/mini-app/focus/unfreeze', { mode, text, blocker: blocker || undefined })
}

export async function apiBrainDump(text: string) {
  return post<ActionResponse>('/mini-app/focus/brain-dump', { text })
}

export async function apiTaskSteps(task: string, fearLevel: number, blocker: BlockerId = '') {
  return post<ActionResponse>('/mini-app/focus/steps', {
    task,
    fearLevel,
    blocker: blocker || undefined,
  })
}

export async function apiOutcome(sessionId: number, outcome: 'done' | 'partial' | 'enough') {
  return post<{ ok: boolean; stats: InitResponse['stats'] }>('/mini-app/focus/outcome', {
    sessionId,
    outcome,
  })
}

export async function apiHistory(limit = 20) {
  return post<{ ok: boolean; items: FocusHistoryItem[]; stats: InitResponse['stats'] }>(
    '/mini-app/focus/history',
    { limit },
  )
}

export async function apiTranscribe(audioBase64: string, mimeType: string) {
  return post<{ ok: boolean; text: string }>('/mini-app/focus/transcribe', {
    audioBase64,
    mimeType,
  })
}
