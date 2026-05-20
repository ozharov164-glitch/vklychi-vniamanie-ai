import { create } from 'zustand'
import type { InitResponse } from './api'

export type TabId = 'home' | 'dump' | 'steps' | 'focus' | 'today'

type AppState = {
  ready: boolean
  premium: boolean
  aiUsage: { groqCount: number; deepseekCount: number }
  limits: { groqDaily: number; deepseekDaily: number }
  stats: { sessionsToday: number; winsTotal: number }
  tab: TabId
  setTab: (t: TabId) => void
  applyInit: (d: InitResponse) => void
  setBootComplete: () => void
  setStats: (s: { sessionsToday: number; winsTotal: number }) => void
}

export const useAppStore = create<AppState>((set) => ({
  ready: false,
  premium: false,
  aiUsage: { groqCount: 0, deepseekCount: 0 },
  limits: { groqDaily: 6, deepseekDaily: 12 },
  stats: { sessionsToday: 0, winsTotal: 0 },
  tab: 'home',
  setTab: (tab) => set({ tab }),
  applyInit: (d) =>
    set({
      premium: d.isPremium,
      aiUsage: d.aiUsage,
      limits: d.limits,
      stats: d.stats,
    }),
  setBootComplete: () => set({ ready: true }),
  setStats: (stats) => set({ stats }),
}))
