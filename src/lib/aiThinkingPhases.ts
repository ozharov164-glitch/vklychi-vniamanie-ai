import { COPY } from './copy'
import type { ThinkingIconId } from './thinkingAssets'

export type ThinkingScenario = 'noise' | 'stuck' | 'regenerate'

export type ThinkingPhase = {
  id: string
  label: string
  icon: ThinkingIconId
  durationMs: number
}

type BuildOpts = {
  premium: boolean
  hasMemory: boolean
}

function phaseMs(premium: boolean, long = true): number {
  if (premium) return long ? 2400 : 2000
  return long ? 1800 : 1400
}

/** Сценарий фаз для панели ожидания ИИ. */
export function buildThinkingPhases(scenario: ThinkingScenario, opts: BuildOpts): ThinkingPhase[] {
  const ms = phaseMs(opts.premium, true)
  const msShort = phaseMs(opts.premium, false)

  if (scenario === 'regenerate') {
    return [
      {
        id: 'regenerate',
        label: COPY.thinking.regenerateAlt,
        icon: 'regenerate',
        durationMs: ms,
      },
      {
        id: 'anchor',
        label: COPY.thinking.regenerateAnchor,
        icon: 'anchor',
        durationMs: ms,
      },
      {
        id: 'polish',
        label: COPY.thinking.polish,
        icon: 'polish',
        durationMs: msShort,
      },
    ]
  }

  if (scenario === 'noise') {
    const phases: ThinkingPhase[] = [
      { id: 'read', label: COPY.thinking.read, icon: 'read', durationMs: ms },
    ]
    if (opts.hasMemory) {
      phases.push({
        id: 'memory',
        label: COPY.thinking.memory,
        icon: 'memory',
        durationMs: ms,
      })
    }
    phases.push(
      { id: 'focus', label: COPY.thinking.focusPain, icon: 'focus', durationMs: ms },
      { id: 'sort', label: COPY.thinking.sort, icon: 'sort', durationMs: ms },
      { id: 'anchor', label: COPY.thinking.anchor, icon: 'anchor', durationMs: ms },
      { id: 'polish', label: COPY.thinking.polish, icon: 'polish', durationMs: msShort },
    )
    return phases
  }

  return [
    { id: 'read', label: COPY.thinking.readTask, icon: 'read', durationMs: ms },
    { id: 'focus', label: COPY.thinking.findStep, icon: 'focus', durationMs: ms },
    { id: 'anchor', label: COPY.thinking.anchor, icon: 'anchor', durationMs: ms },
    { id: 'polish', label: COPY.thinking.polish, icon: 'polish', durationMs: msShort },
  ]
}

export function resolveThinkingScenario(
  mode: 'stuck' | 'noise' | null,
  _text: string,
): ThinkingScenario {
  if (mode === 'noise') return 'noise'
  return 'stuck'
}
