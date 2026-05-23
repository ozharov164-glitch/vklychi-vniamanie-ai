import { useEffect, useMemo, useRef, useState } from 'react'
import type { ThinkingPhase } from '../lib/aiThinkingPhases'
import { preloadThinkingImages } from '../lib/thinkingAssets'

const PROGRESS_CAP = 92
const PROGRESS_TICK_MS = 180

export function useAiThinkingProgress(active: boolean, phases: ThinkingPhase[]) {
  const [phaseIndex, setPhaseIndex] = useState(0)
  const [progress, setProgress] = useState(8)
  const phaseIndexRef = useRef(0)

  const stableKey = useMemo(
    () => phases.map((p) => `${p.id}:${p.durationMs}`).join('|'),
    [phases],
  )

  useEffect(() => {
    if (!active) {
      setPhaseIndex(0)
      phaseIndexRef.current = 0
      setProgress(8)
      return
    }

    preloadThinkingImages()
    setPhaseIndex(0)
    phaseIndexRef.current = 0
    setProgress(10)

    const timeouts: number[] = []
    let cancelled = false

    const scheduleAdvance = (fromIndex: number) => {
      const phase = phases[fromIndex]
      if (!phase || cancelled) return
      const t = window.setTimeout(() => {
        if (cancelled) return
        const next = fromIndex + 1
        if (next < phases.length) {
          phaseIndexRef.current = next
          setPhaseIndex(next)
          window.Telegram?.WebApp.HapticFeedback?.selectionChanged?.()
          scheduleAdvance(next)
        }
      }, phase.durationMs)
      timeouts.push(t)
    }

    if (phases.length > 1) {
      scheduleAdvance(0)
    }

    const progressTimer = window.setInterval(() => {
      setProgress((p) => {
        if (p >= PROGRESS_CAP) return p
        const step = phases.length <= 3 ? 2.4 : 1.5
        return Math.min(PROGRESS_CAP, p + step)
      })
    }, PROGRESS_TICK_MS)

    return () => {
      cancelled = true
      timeouts.forEach((id) => window.clearTimeout(id))
      window.clearInterval(progressTimer)
    }
  }, [active, stableKey, phases])

  const current = phases[phaseIndex] ?? phases[0]
  const total = Math.max(1, phases.length)

  return {
    current,
    phaseIndex,
    total,
    progress: Math.round(progress),
  }
}
