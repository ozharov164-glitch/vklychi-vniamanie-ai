import thinkingRead from '../assets/thinking/thinking-read.webp'
import thinkingMemory from '../assets/thinking/thinking-memory.webp'
import thinkingFocus from '../assets/thinking/thinking-focus.webp'
import thinkingSort from '../assets/thinking/thinking-sort.webp'
import thinkingAnchor from '../assets/thinking/thinking-anchor.webp'
import thinkingPolish from '../assets/thinking/thinking-polish.webp'
import thinkingRegenerate from '../assets/thinking/thinking-regenerate.webp'

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

export const ALL_THINKING_IMAGE_URLS = Object.values(thinkingImages)

let thinkingPreloaded = false

/** Прогрев иконок при первом запросе к ИИ — не блокирует UI. */
export function preloadThinkingImages(): void {
  if (thinkingPreloaded) return
  thinkingPreloaded = true
  for (const url of ALL_THINKING_IMAGE_URLS) {
    const img = new Image()
    img.decoding = 'sync'
    img.fetchPriority = 'high'
    img.src = url
  }
}
