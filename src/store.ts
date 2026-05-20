import { create } from 'zustand'
import type { FocusHistoryItem, InitResponse } from './api'

export type TabId = 'start' | 'wins'
export type UnfreezeMode = 'stuck' | 'noise'

export type ActiveUnfreeze = {
  sessionId: number
  mode: UnfreezeMode
  reflection: string
  microStep: string
  taskLabel: string
  nextSteps: string[]
  durationSec: number
}

type AppState = {
  ready: boolean
  premium: boolean
  aiUsage: { aiUsedToday: number; hintsLimit: number }
  stats: { sessionsToday: number; winsTotal: number; streakDays: number }
  tab: TabId
  history: FocusHistoryItem[]
  activeUnfreeze: ActiveUnfreeze | null
  setTab: (t: TabId) => void
  applyInit: (d: InitResponse) => void
  setBootComplete: () => void
  setStats: (s: InitResponse['stats']) => void
  setAiUsage: (u: { aiUsedToday: number; hintsLimit: number }) => void
  setHistory: (items: FocusHistoryItem[]) => void
  setActiveUnfreeze: (u: ActiveUnfreeze | null) => void
}

export const useAppStore = create<AppState>((set) => ({
  ready: false,
  premium: false,
  aiUsage: { aiUsedToday: 0, hintsLimit: 6 },
  stats: { sessionsToday: 0, winsTotal: 0, streakDays: 0 },
  tab: 'start',
  history: [],
  activeUnfreeze: null,
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
  setActiveUnfreeze: (activeUnfreeze) => set({ activeUnfreeze }),
}))
