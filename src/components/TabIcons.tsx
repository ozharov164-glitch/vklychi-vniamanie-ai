import type { TabId } from '../store'
import { images } from '../lib/assets'

type IconProps = { active?: boolean }

const TAB_SRC: Record<TabId, string> = {
  start: images.tabUnfreeze,
  wins: images.tabWins,
}

export function TabIcon({ id, active }: { id: TabId; active?: boolean }) {
  return (
    <img
      src={TAB_SRC[id]}
      alt=""
      aria-hidden
      className={`tab-icon-img ${active ? 'tab-icon-img--active' : ''}`}
      width={28}
      height={28}
      loading="eager"
      decoding="async"
    />
  )
}

export function ModeIcon({ mode }: { mode: 'stuck' | 'noise' }) {
  const src = mode === 'stuck' ? images.modeStuck : images.modeNoise
  return (
    <span className="mode-card__icon-wrap" aria-hidden>
      <img
        src={src}
        alt=""
        className="mode-card__icon"
        width={80}
        height={80}
        loading="eager"
        decoding="async"
        draggable={false}
      />
    </span>
  )
}

// Kept for tree-shaking compatibility if imported elsewhere
export function IconStart(_props: IconProps) {
  return null
}

export function IconWins(_props: IconProps) {
  return null
}
