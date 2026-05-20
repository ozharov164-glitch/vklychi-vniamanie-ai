import { motion } from 'framer-motion'

const ORBITS = [
  { r: 72, dur: 14, delay: 0, size: 5 },
  { r: 88, dur: 18, delay: 0.4, size: 4 },
  { r: 104, dur: 22, delay: 0.8, size: 3 },
  { r: 118, dur: 26, delay: 1.1, size: 4 },
  { r: 62, dur: 11, delay: 0.2, size: 3 },
  { r: 96, dur: 16, delay: 0.6, size: 5 },
]

export function SplashArt() {
  return (
    <div className="splash-art" aria-hidden>
      <div className="splash-art__glow splash-art__glow--1" />
      <div className="splash-art__glow splash-art__glow--2" />

      <svg className="splash-art__rays" viewBox="0 0 200 200">
        {[...Array(12)].map((_, i) => (
          <line
            key={i}
            x1="100"
            y1="100"
            x2="100"
            y2="28"
            stroke="url(#rayGrad)"
            strokeWidth="1.2"
            opacity="0.35"
            transform={`rotate(${i * 30} 100 100)`}
          />
        ))}
        <defs>
          <linearGradient id="rayGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffd08a" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#f59e42" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      <div className="splash-art__orbit-field">
        {ORBITS.map((p, i) => (
          <motion.span
            key={i}
            className="splash-art__particle"
            style={{ width: p.size, height: p.size }}
            animate={{ rotate: 360 }}
            transition={{ duration: p.dur, repeat: Infinity, ease: 'linear', delay: p.delay }}
          >
            <span className="splash-art__particle-dot" style={{ transform: `translateX(${p.r}px)` }} />
          </motion.span>
        ))}
      </div>

      <span className="splash-art__ring splash-art__ring--a" />
      <span className="splash-art__ring splash-art__ring--b" />
      <span className="splash-art__ring splash-art__ring--c" />

      <motion.div
        className="splash-art__core"
        initial={{ scale: 0.82, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <svg className="splash-art__anchor-svg" viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="30" stroke="url(#coreRing)" strokeWidth="1.5" opacity="0.55" />
          <path
            d="M32 12c-3.2 0-5.8 2.6-5.8 5.8 0 2.8 2 5.2 4.7 5.7v3.5h-8.4a2.2 2.2 0 0 0 0 4.4h8.4v14.8a2.2 2.2 0 0 0 4.4 0V31.4h8.4a2.2 2.2 0 0 0 0-4.4h-8.4v-3.5c2.7-.5 4.7-2.9 4.7-5.7C37.8 14.6 35.2 12 32 12Z"
            fill="url(#anchorFill)"
          />
          <path d="M22 46h20" stroke="#ffd08a" strokeWidth="2.2" strokeLinecap="round" opacity="0.85" />
          <defs>
            <linearGradient id="anchorFill" x1="22" y1="12" x2="44" y2="48">
              <stop stopColor="#ffe4b8" />
              <stop offset="0.55" stopColor="#f59e42" />
              <stop offset="1" stopColor="#c9782a" />
            </linearGradient>
            <linearGradient id="coreRing" x1="0" y1="0" x2="64" y2="64">
              <stop stopColor="#f59e42" />
              <stop offset="1" stopColor="#38bdf8" stopOpacity="0.4" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>
    </div>
  )
}
