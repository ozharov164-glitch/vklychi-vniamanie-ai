import { create } from 'zustand'
import type {
  ActionResponse,
  CognitiveBlock,
  FocusHistoryItem,
  FocusMemoryItem,
  InitResponse,
  ThemeChoice,
} from './api'

export type TabId = 'start' | 'wins'
export type UnfreezeMode = 'stuck' | 'noise'

export const DAILY_PROGRESS_GOAL = 6

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
  measurableMicroStep: string
  taskLabel: string
  nextSteps: string[]
  planLater: string[]
  steps: string[]
  alternates: string[]
  themeChoices: ThemeChoice[]
  activeLaneId: string
  powerLine: string
  powerAuthor: string
  showBuckets: boolean
  buckets: {
    now: string[]
    today: string[]
    later: string[]
    release: string[]
  }
  cognitiveBlocks: CognitiveBlock[]
  overloadIntro: string
  aiChoseForYou: boolean
  motivationalBridge: string
  actionMetaphor: string
  resultGlimpse: string
}

type AppState = {
  ready: boolean
  premium: boolean
  ownerUnlimited: boolean
  aiUsage: { aiUsedToday: number; hintsLimit: number; ownerUnlimited?: boolean }
  stats: {
    sessionsToday: number
    winsTotal: number
    streakDays: number
    microStepsTotal: number
    completionPct: number
    doneToday: number
  }
  dailyProgress: { done: number; goal: number }
  memory: FocusMemoryItem[]
  tab: TabId
  history: FocusHistoryItem[]
  activeSession: ActiveSession | null
  setTab: (t: TabId) => void
  applyInit: (d: InitResponse) => void
  setBootComplete: () => void
  setStats: (s: InitResponse['stats']) => void
  bumpDailyProgress: () => void
  setAiUsage: (u: { aiUsedToday: number; hintsLimit: number; ownerUnlimited?: boolean }) => void
  setHistory: (items: FocusHistoryItem[]) => void
  setActiveSession: (u: ActiveSession | null) => void
  setMicroStep: (microStep: string) => void
  setLaneChoice: (laneId: string, microStep: string) => void
  applyActionResponse: (res: ActionResponse, mode: UnfreezeMode) => void
}

export const useAppStore = create<AppState>((set) => ({
  ready: false,
  premium: false,
  ownerUnlimited: false,
  aiUsage: { aiUsedToday: 0, hintsLimit: 6 },
  stats: {
    sessionsToday: 0,
    winsTotal: 0,
    streakDays: 0,
    microStepsTotal: 0,
    completionPct: 0,
    doneToday: 0,
  },
  dailyProgress: { done: 0, goal: DAILY_PROGRESS_GOAL },
  memory: [],
  tab: 'start',
  history: [],
  activeSession: null,
  setTab: (tab) => set({ tab }),
  applyInit: (d) =>
    set({
      premium: d.isPremium,
      ownerUnlimited: Boolean(d.ownerUnlimited || d.aiUsage?.ownerUnlimited),
      aiUsage: d.aiUsage,
      stats: d.stats,
      dailyProgress: {
        done: d.stats.doneToday ?? 0,
        goal: DAILY_PROGRESS_GOAL,
      },
      memory: d.memory || [],
    }),
  setBootComplete: () => set({ ready: true }),
  setStats: (stats) =>
    set({
      stats,
      dailyProgress: {
        done: stats.doneToday ?? 0,
        goal: DAILY_PROGRESS_GOAL,
      },
    }),
  bumpDailyProgress: () =>
    set((state) => {
      const done = Math.min(
        state.dailyProgress.goal,
        Math.max(state.dailyProgress.done, (state.stats.doneToday ?? 0)) + 1,
      )
      return {
        dailyProgress: { ...state.dailyProgress, done },
        stats: { ...state.stats, doneToday: done },
      }
    }),
  setAiUsage: (aiUsage) => set({ aiUsage }),
  setHistory: (history) => set({ history }),
  setActiveSession: (activeSession) => set({ activeSession }),
  setMicroStep: (microStep) =>
    set((state) =>
      state.activeSession
        ? {
            activeSession: {
              ...state.activeSession,
              microStep,
              measurableMicroStep: microStep,
            },
          }
        : state,
    ),
  setLaneChoice: (laneId, microStep) =>
    set((state) =>
      state.activeSession
        ? {
            activeSession: {
              ...state.activeSession,
              activeLaneId: laneId,
              microStep,
              measurableMicroStep: microStep,
            },
          }
        : state,
    ),
  applyActionResponse: (res, mode) => {
    const effectiveMode: UnfreezeMode =
      res.mode === 'noise' ? 'noise' : res.mode === 'stuck' ? 'stuck' : mode
    const micro = res.measurableMicroStep || res.microStep || res.lightest || ''
    const seenAnchor = new Set<string>()
    const choices = (res.themeChoices || []).filter((c) => {
      if (!c.anchor || !c.label) return false
      const k = c.anchor.toLowerCase().replace(/\s+/g, ' ').trim()
      if (seenAnchor.has(k)) return false
      seenAnchor.add(k)
      return true
    })
    const choiceAnchors = new Set(choices.map((c) => c.anchor))
    const activeLaneId =
      res.activeLaneId ||
      choices.find((c) => c.anchor === micro)?.id ||
      choices[0]?.id ||
      ''
    const alternates = [
      ...(res.alternates || []),
      ...(res.now || []),
      ...(res.today || []),
    ]
      .filter((s) => s && s !== micro && !choiceAnchors.has(s))
      .filter((s, i, arr) => arr.indexOf(s) === i)
      .slice(0, 4)
    set({
      activeSession: {
        sessionId: res.sessionId,
        mode: effectiveMode,
        insight: res.insight || res.patternLine || '',
        userPriority: res.userPriority || '',
        userQuote: res.userQuote || '',
        mechanism: res.mechanism || '',
        emotionalTone: res.emotionalTone || '',
        whyShort: res.whyShort || res.whyLightest || '',
        microStep: micro,
        measurableMicroStep: micro,
        taskLabel: res.taskLabel || 'Твой шаг',
        nextSteps: res.nextSteps || [],
        planLater: res.planLater || res.nextSteps || [],
        steps: res.steps || [],
        alternates,
        themeChoices: choices,
        activeLaneId,
        powerLine: res.powerLine || '',
        powerAuthor: res.powerAuthor || '',
        showBuckets: effectiveMode === 'noise',
        buckets: {
          now: res.now || [],
          today: res.today || [],
          later: res.later || [],
          release: res.release || [],
        },
        cognitiveBlocks: normalizeCognitiveBlocks(res),
        overloadIntro: res.overloadIntro || '',
        aiChoseForYou: Boolean(res.aiChoseForYou),
        motivationalBridge: res.motivationalBridge || '',
        actionMetaphor: res.actionMetaphor || '',
        resultGlimpse: res.resultGlimpse || '',
      },
    })
  },
}))

function normalizeCognitiveBlocks(res: ActionResponse): CognitiveBlock[] {
  const raw = res.cognitiveBlocks
  if (Array.isArray(raw) && raw.length) {
    return raw
      .map((b) => ({
        icon: String(b?.icon || '⚡').slice(0, 4),
        text: String(b?.text || '').trim(),
      }))
      .filter((b) => b.text.length >= 8)
      .slice(0, 4)
  }
  const release = res.release || []
  const fallback: CognitiveBlock[] = []
  for (const item of release) {
    const parts = String(item)
      .split(/(?<=[а-яё])\.\s+(?=[А-ЯЁ])|;\s*/)
      .map((p) => p.trim())
      .filter((p) => p.length >= 12)
    const icons = ['⚡', '🧠', '⏳', '🔄'] as const
    parts.forEach((text, i) => fallback.push({ icon: icons[i % icons.length], text }))
  }
  return fallback.slice(0, 4)
}
