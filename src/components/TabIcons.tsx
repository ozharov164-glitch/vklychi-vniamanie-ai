import type { ReactElement } from 'react'
import type { TabId } from '../store'

type IconProps = { active?: boolean }

const stroke = (active?: boolean) => (active ? 'var(--accent)' : 'currentColor')

export function IconStart({ active }: IconProps) {
  const s = stroke(active)
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className="tab-icon-svg">
      <path
        d="M12 3v4M12 17v4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M3 12h4M17 12h4M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"
        stroke={s}
        strokeWidth="1.55"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="3.5" stroke={s} strokeWidth="1.55" fill={active ? 'var(--accent)' : 'none'} />
    </svg>
  )
}

export function IconWins({ active }: IconProps) {
  const s = stroke(active)
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className="tab-icon-svg">
      <path
        d="M8 4h8l1 4H7l1-4ZM7 8h10l-1.2 10H8.2L7 8Z"
        stroke={s}
        strokeWidth="1.55"
        strokeLinejoin="round"
      />
      <path d="M9.5 12.5 11 14l3.5-4" stroke={active ? 'var(--accent)' : s} strokeWidth="1.65" strokeLinecap="round" />
    </svg>
  )
}

const MAP: Record<TabId, (p: IconProps) => ReactElement> = {
  start: IconStart,
  wins: IconWins,
}

export function TabIcon({ id, active }: { id: TabId; active?: boolean }) {
  const C = MAP[id]
  return <C active={active} />
}
