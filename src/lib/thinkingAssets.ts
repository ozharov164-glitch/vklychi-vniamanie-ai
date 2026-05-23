import thinkingRead from '../assets/thinking/thinking-read.png'
import thinkingMemory from '../assets/thinking/thinking-memory.png'
import thinkingFocus from '../assets/thinking/thinking-focus.png'
import thinkingSort from '../assets/thinking/thinking-sort.png'
import thinkingAnchor from '../assets/thinking/thinking-anchor.png'
import thinkingPolish from '../assets/thinking/thinking-polish.png'
import thinkingRegenerate from '../assets/thinking/thinking-regenerate.png'

export type ThinkingIconId =
  | 'read'
  | 'memory'
  | 'focus'
  | 'sort'
  | 'anchor'
  | 'polish'
  | 'regenerate'

export const thinkingImages: Record<ThinkingIconId, string> = {
  read: thinkingRead,
  memory: thinkingMemory,
  focus: thinkingFocus,
  sort: thinkingSort,
  anchor: thinkingAnchor,
  polish: thinkingPolish,
  regenerate: thinkingRegenerate,
}

/** Тонкая подгонка под кольцо (1 = после fit_in_circle в скрипте). */
export const thinkingIconFit: Record<ThinkingIconId, number> = {
  read: 1,
  memory: 1,
  focus: 1,
  sort: 1,
  anchor: 1,
  polish: 1,
  regenerate: 1,
}

export const ALL_THINKING_IMAGE_URLS = Object.values(thinkingImages)

let thinkingPreloaded = false

/** Прогрев иконок при первом запросе к ИИ — не блокирует UI. */
export function preloadThinkingImages(): void {
  if (thinkingPreloaded) return
  thinkingPreloaded = true
  for (const url of ALL_THINKING_IMAGE_URLS) {
    const img = new Image()
    img.decoding = 'async'
    img.src = url
  }
}
