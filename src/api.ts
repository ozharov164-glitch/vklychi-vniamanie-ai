const TOKEN_KEY = 'fva_token'

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
  const tg = window.Telegram?.WebApp
  const token = getAuthToken()
  if (token) return { token, ...extra }
  if (tg?.initData) return { initData: tg.initData, ...extra }
  return extra
}

async function post<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${backend}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(authBody(body)),
  })
  const data = (await res.json()) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `Ошибка ${res.status}`)
  return data
}

export type InitResponse = {
  app_save_token: string
  isPremium: boolean
  aiUsage: { groqCount: number; deepseekCount: number }
  limits: { groqDaily: number; deepseekDaily: number }
  stats: { sessionsToday: number; winsTotal: number }
}

export async function apiInit(startToken?: string): Promise<InitResponse> {
  const body: Record<string, unknown> = {}
  if (startToken) body.start_token = startToken
  const data = await post<InitResponse>('/mini-app/focus/init', body)
  setAuthToken(data.app_save_token)
  return data
}

export async function apiBrainDump(text: string) {
  return post<{
    ok: boolean
    now: string[]
    today: string[]
    later: string[]
    release: string[]
    lightest: string
  }>('/mini-app/focus/brain-dump', { text })
}

export async function apiSteps(task: string, fearLevel: number) {
  return post<{ ok: boolean; steps: string[]; first_micro: string; cached?: boolean }>(
    '/mini-app/focus/steps',
    { task, fearLevel },
  )
}

export async function apiStuck(context: string) {
  return post<{ ok: boolean; reflection: string; micro_step: string; premium: boolean }>(
    '/mini-app/focus/stuck',
    { context },
  )
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
