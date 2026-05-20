import { getInitDataString, getStartTokenFromUrl, refreshInitData } from './lib/telegram'

const TOKEN_KEY = 'fva_token'
const INIT_RETRY_MS = [0, 150, 400, 1000, 2500]

let backend = ''

export async function loadBackend(): Promise<void> {
  const origin = window.location.origin.replace(/\/$/, '')
  // Mini app на том же домене, что и API — без github.io и без ?backend=
  if (origin && !origin.includes('github.io') && !origin.includes('localhost')) {
    backend = origin
    sessionStorage.setItem('fva_backend', backend)
    return
  }

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
  const data = (await res.json()) as T & { error?: string }
  if (!res.ok) throw new Error(data.error || `Ошибка ${res.status}`)
  return data
}

async function post<T>(path: string, body: Record<string, unknown>): Promise<T> {
  return postRaw<T>(path, authBody(body))
}

export type InitResponse = {
  app_save_token: string
  isPremium: boolean
  aiUsage: { groqCount: number; deepseekCount: number }
  limits: { groqDaily: number; deepseekDaily: number }
  stats: { sessionsToday: number; winsTotal: number }
}

async function postFocusInit(body: Record<string, unknown>): Promise<InitResponse> {
  return postRaw<InitResponse>('/mini-app/focus/init', body)
}

/** Вход: сохранённый token → start_token из URL → initData с повторами. */
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
      /* start_token мог быть уже использован — пробуем initData */
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

export async function apiBrainDump(text: string) {
  return post<{
    ok: boolean
    now: string[]
    today: string[]
    later: string[]
    release: string[]
    lightest: string
    aiUsage?: { groqCount: number; deepseekCount: number }
  }>('/mini-app/focus/brain-dump', { text })
}

export async function apiSteps(task: string, fearLevel: number) {
  return post<{
    ok: boolean
    steps: string[]
    first_micro: string
    cached?: boolean
    aiUsage?: { groqCount: number; deepseekCount: number }
  }>('/mini-app/focus/steps', { task, fearLevel })
}

export async function apiStuck(context: string) {
  return post<{
    ok: boolean
    reflection: string
    micro_step: string
    premium: boolean
    aiUsage?: { groqCount: number; deepseekCount: number }
  }>('/mini-app/focus/stuck', { context })
}

export async function apiTranscribe(audioBase64: string, mimeType: string) {
  return post<{ ok: boolean; text: string }>('/mini-app/focus/transcribe', {
    audioBase64,
    mimeType,
  })
}

export async function apiSessionStart(durationMin: number, taskNote: string) {
  return post<{ ok: boolean; sessionId: number }>('/mini-app/focus/session', {
    action: 'start',
    durationMin,
    taskNote,
  })
}

export async function apiSessionFinish(sessionId: number, outcome: string) {
  return post<{ ok: boolean; stats: { sessionsToday: number; winsTotal: number } }>(
    '/mini-app/focus/session',
    { action: 'finish', sessionId, outcome },
  )
}

export async function apiToday(slots?: { morning: string; day: string; evening: string }) {
  return post<{ ok: boolean; slots: { morning: string; day: string; evening: string } }>(
    '/mini-app/focus/today',
    slots ? { slots } : {},
  )
}
