import { create } from 'zustand'
import type { ActionResponse, FocusHistoryItem, InitResponse } from './api'

export type TabId = 'start' | 'wins'
export type UnfreezeMode = 'stuck' | 'noise'

export type ActiveSession = {
  sessionId: number
  mode: UnfreezeMode
  reflection: string
  patternLine: string
  microStep: string
  taskLabel: string
  nextSteps: string[]
  steps: string[]
  whyLightest: string
  showBuckets: boolean
  buckets: {
    now: string[]
    today: string[]
    later: string[]
    release: string[]
  }
}

type AppState = {
  ready: boolean
  premium: boolean
  aiUsage: { aiUsedToday: number; hintsLimit: number }
  stats: { sessionsToday: number; winsTotal: number; streakDays: number }
  tab: TabId
  history: FocusHistoryItem[]
  activeSession: ActiveSession | null
  setTab: (t: TabId) => void
  applyInit: (d: InitResponse) => void
  setBootComplete: () => void
  setStats: (s: InitResponse['stats']) => void
  setAiUsage: (u: { aiUsedToday: number; hintsLimit: number }) => void
  setHistory: (items: FocusHistoryItem[]) => void
  setActiveSession: (u: ActiveSession | null) => void
  applyActionResponse: (res: ActionResponse, mode: UnfreezeMode) => void
}

export const useAppStore = create<AppState>((set) => ({
  ready: false,
  premium: false,
  aiUsage: { aiUsedToday: 0, hintsLimit: 6 },
  stats: { sessionsToday: 0, winsTotal: 0, streakDays: 0 },
  tab: 'start',
  history: [],
  activeSession: null,
  setTab: (tab) => set({ tab }),
  applyInit: (d) =>
    set({
      premium: d.isPremium,
      aiUsage: d.aiUsage,
      stats: d.stats,
    }),
  setBootComplete: () => set({ ready: true }),
  setStats: (stats) => set({ stats }),
  setAiUsage: (aiUsage) => set({ aiUsage }),
  setHistory: (history) => set({ history }),
  setActiveSession: (activeSession) => set({ activeSession }),
  applyActionResponse: (res, mode) =>
    set({
      activeSession: {
        sessionId: res.sessionId,
        mode,
        reflection: res.reflection || res.whyLightest || '',
        patternLine: res.patternLine || '',
        microStep: res.microStep || res.lightest || '',
        taskLabel: res.taskLabel || '',
        nextSteps: res.nextSteps || [],
        steps: res.steps || [],
        whyLightest: res.whyLightest || '',
        showBuckets: mode === 'noise',
        buckets: {
          now: res.now || [],
          today: res.today || [],
          later: res.later || [],
          release: res.release || [],
        },
      },
    }),
}))
