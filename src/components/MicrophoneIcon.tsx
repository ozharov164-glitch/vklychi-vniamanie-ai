type Props = {
  recording?: boolean
  className?: string
}

export function MicrophoneIcon({ recording, className = '' }: Props) {
  return (
    <svg
      className={`mic-icon ${recording ? 'mic-icon--recording' : ''} ${className}`.trim()}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <rect x="9" y="2" width="6" height="12" rx="3" fill="currentColor" />
      <path
        d="M5 11a7 7 0 0 0 14 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M12 18v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 21h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      {recording && (
        <>
          <circle className="mic-icon__pulse mic-icon__pulse--1" cx="12" cy="8" r="10" />
          <circle className="mic-icon__pulse mic-icon__pulse--2" cx="12" cy="8" r="10" />
        </>
      )}
    </svg>
  )
}
