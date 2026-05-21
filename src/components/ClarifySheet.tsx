import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { COPY } from '../lib/copy'
import { VoiceTextField } from './VoiceTextField'

type Props = {
  open: boolean
  question: string
  hint: string
  loading?: boolean
  onClose: () => void
  onSubmit: (detail: string) => void
}

export function ClarifySheet({ open, question, hint, loading, onClose, onSubmit }: Props) {
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
            <div className="clarify-sheet__actions">
              <button
                type="button"
                className="btn-primary btn-primary--glow"
                disabled={loading || detail.trim().length < 2}
                onClick={() => onSubmit(detail.trim())}
              >
                {loading ? COPY.clarify.submitting : COPY.clarify.submit}
              </button>
              <button type="button" className="btn-cancel" disabled={loading} onClick={onClose}>
                {COPY.clarify.close}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
