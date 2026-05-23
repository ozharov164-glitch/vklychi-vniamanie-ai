import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { ThinkingScenario } from '../lib/aiThinkingPhases'
import { COPY } from '../lib/copy'
import { AiThinkingPanel } from './AiThinkingPanel'
import { VoiceTextField } from './VoiceTextField'

type Props = {
  open: boolean
  question: string
  hint: string
  loading?: boolean
  thinkingScenario?: ThinkingScenario
  premium?: boolean
  hasMemory?: boolean
  onClose: () => void
  onSubmit: (detail: string) => void
}

export function ClarifySheet({
  open,
  question,
  hint,
  loading,
  thinkingScenario = 'stuck',
  premium = false,
  hasMemory = false,
  onClose,
  onSubmit,
}: Props) {
  const [detail, setDetail] = useState('')

  useEffect(() => {
    if (open) setDetail('')
  }, [open, question])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            className="clarify-sheet__backdrop"
            aria-label={COPY.clarify.close}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="clarify-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="clarify-title"
            initial={{ opacity: 0, y: 48, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 32, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          >
            <div className="clarify-sheet__glow" aria-hidden />
            <p className="clarify-sheet__eyebrow">{COPY.clarify.eyebrow}</p>
            <h2 id="clarify-title" className="clarify-sheet__title">
              {question}
            </h2>
            <p className="clarify-sheet__hint">{hint}</p>
            <VoiceTextField
              id="clarify-detail"
              multiline
              rows={3}
              placeholder={COPY.clarify.placeholder}
              value={detail}
              onChange={setDetail}
              disabled={loading}
            />
            {loading ? (
              <AiThinkingPanel
                active
                scenario={thinkingScenario}
                premium={premium}
                hasMemory={hasMemory}
                compact
              />
            ) : (
              <div className="clarify-sheet__actions">
                <button
                  type="button"
                  className="btn-primary btn-primary--glow"
                  disabled={detail.trim().length < 2}
                  onClick={() => onSubmit(detail.trim())}
                >
                  {COPY.clarify.submit}
                </button>
                <button type="button" className="btn-cancel" onClick={onClose}>
                  {COPY.clarify.close}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
