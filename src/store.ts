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
  memory: FocusMemoryItem[]
  tab: TabId
  history: FocusHistoryItem[]
  activeSession: ActiveSession | null
  setTab: (t: TabId) => void
  applyInit: (d: InitResponse) => void
  setBootComplete: () => void
  setStats: (s: InitResponse['stats']) => void
  setAiUsage: (u: { aiUsedToday: number; hintsLimit: number; ownerUnlimited?: boolean }) => void
  setHistory: (items: FocusHistoryItem[]) => void
  setActiveSession: (u: ActiveSession | null) => void
  setMicroStep: (microStep: string) => void
  applyActionResponse: (res: ActionResponse, mode: UnfreezeMode) => void
}

export const useAppStore = create<AppState>((set) => ({
  ready: false,
  premium: false,
  ownerUnlimited: false,
  aiUsage: { aiUsedToday: 0, hintsLimit: 12 },
  stats: {
    sessionsToday: 0,
    winsTotal: 0,
    streakDays: 0,
    microStepsTotal: 0,
    completionPct: 0,
    doneToday: 0,
  },
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
      memory: d.memory || [],
    }),
  setBootComplete: () => set({ ready: true }),
  setStats: (stats) => set({ stats }),
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
  applyActionResponse: (res, mode) => {
    const effectiveMode: UnfreezeMode =
      res.mode === 'noise' ? 'noise' : res.mode === 'stuck' ? 'stuck' : mode
    const micro = res.measurableMicroStep || res.microStep || res.lightest || ''
    const choices = (res.themeChoices || []).filter((c) => c.anchor && c.label)
    const choiceAnchors = new Set(choices.map((c) => c.anchor))
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
        powerLine: res.powerLine || '',
        powerAuthor: res.powerAuthor || '',
        showBuckets:
          effectiveMode === 'noise' || Boolean((res.now?.length || 0) + (res.release?.length || 0)),
        buckets: {
          now: res.now || [],
          today: res.today || [],
          later: res.later || [],
          release: res.release || [],
        },
        cognitiveBlocks: normalizeCognitiveBlocks(res),
        overloadIntro: res.overloadIntro || '',
        aiChoseForYou: Boolean(res.aiChoseForYou),
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
