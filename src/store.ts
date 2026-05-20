import { create } from 'zustand'
import type { ActionResponse, FocusHistoryItem, FocusMemoryItem, InitResponse, ThemeChoice } from './api'

export type TabId = 'start' | 'wins'
export type UnfreezeMode = 'stuck' | 'noise'

export type ActiveSession = {
  sessionId: number
  mode: UnfreezeMode
  insight: string
  userPriority: string
  userQuote: string
  mechanism: string
  emotionalTone: string
  whyShort: string
  microStep: string
  taskLabel: string
  nextSteps: string[]
  planLater: string[]
  steps: string[]
  alternates: string[]
  themeChoices: ThemeChoice[]
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
  memory: FocusMemoryItem[]
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
  memory: [],
  tab: 'start',
  history: [],
  activeSession: null,
  setTab: (tab) => set({ tab }),
  applyInit: (d) =>
    set({
      premium: d.isPremium,
      aiUsage: d.aiUsage,
      stats: d.stats,
      memory: d.memory || [],
    }),
  setBootComplete: () => set({ ready: true }),
  setStats: (stats) => set({ stats }),
  setAiUsage: (aiUsage) => set({ aiUsage }),
  setHistory: (history) => set({ history }),
  setActiveSession: (activeSession) => set({ activeSession }),
  applyActionResponse: (res, mode) => {
    const micro = res.microStep || res.lightest || ''
    const choices = (res.themeChoices || []).filter((c) => c.anchor && c.label)
    const altFromChoices = choices.map((c) => c.anchor).filter((a) => a !== micro)
    const alternates = [
      ...altFromChoices,
      ...(res.alternates || res.now || []).filter((s) => s && s !== micro),
    ]
      .filter((s, i, arr) => arr.indexOf(s) === i)
      .slice(0, 4)
    set({
      activeSession: {
        sessionId: res.sessionId,
        mode,
        insight: res.insight || res.patternLine || '',
        userPriority: res.userPriority || '',
        userQuote: res.userQuote || '',
        mechanism: res.mechanism || '',
        emotionalTone: res.emotionalTone || '',
        whyShort: res.whyShort || res.whyLightest || '',
        microStep: micro,
        taskLabel: res.taskLabel || 'Твой шаг',
        nextSteps: res.nextSteps || [],
        planLater: res.planLater || res.nextSteps || [],
        steps: res.steps || [],
        alternates,
        themeChoices: choices,
        showBuckets: mode === 'noise',
        buckets: {
          now: res.now || [],
          today: res.today || [],
          later: res.later || [],
          release: res.release || [],
        },
      },
    })
  },
}))
