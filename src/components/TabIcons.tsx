import type { ReactElement } from 'react'
import type { TabId } from '../store'

type IconProps = { active?: boolean }

const stroke = (active?: boolean) => (active ? 'var(--accent)' : 'currentColor')

export function IconHome({ active }: IconProps) {
  const s = stroke(active)
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className="tab-icon-svg">
      <path
        d="M4 10.5 12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5H15v-6.5h-6V20.5H5.5A1.5 1.5 0 0 1 4 19v-8.5Z"
        stroke={s}
        strokeWidth="1.65"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function IconDump({ active }: IconProps) {
  const s = stroke(active)
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className="tab-icon-svg">
      <circle cx="12" cy="12" r="7.25" stroke={s} strokeWidth="1.55" opacity={active ? 1 : 0.55} />
      <circle cx="12" cy="12" r="2.35" stroke={s} strokeWidth="1.55" />
    </svg>
  )
}

export function IconSteps({ active }: IconProps) {
  const s = stroke(active)
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className="tab-icon-svg">
      <path
        d="M9.5 7.2 15.8 12 9.5 16.8V7.2Z"
        fill={active ? 'var(--accent)' : 'none'}
        stroke={s}
        strokeWidth="1.55"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function IconFocus({ active }: IconProps) {
  const s = stroke(active)
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className="tab-icon-svg">
      <circle cx="12" cy="12" r="7.25" stroke={s} strokeWidth="1.55" opacity={active ? 1 : 0.55} />
      <circle cx="12" cy="12" r="2.6" fill={active ? 'var(--accent)' : s} />
    </svg>
  )
}

export function IconToday({ active }: IconProps) {
  const s = stroke(active)
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className="tab-icon-svg">
      <path d="M6 8.2h12M6 12h12M6 15.8h12" stroke={s} strokeWidth="1.65" strokeLinecap="round" />
    </svg>
  )
}

const MAP: Record<TabId, (p: IconProps) => ReactElement> = {
  home: IconHome,
  dump: IconDump,
  steps: IconSteps,
  focus: IconFocus,
  today: IconToday,
}

export function TabIcon({ id, active }: { id: TabId; active?: boolean }) {
  const C = MAP[id]
  return <C active={active} />
}
