import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

type Props = {
  id: string
  text: string
  /** Автоскрытие через N мс (0 = не скрывать) */
  autoHideMs?: number
}

export function ContextTip({ id, text, autoHideMs = 8000 }: Props) {
  const storageKey = `fva_tip_${id}`
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (localStorage.getItem(storageKey)) return
    const t = window.setTimeout(() => setVisible(true), 400)
    return () => clearTimeout(t)
  }, [storageKey])

  useEffect(() => {
    if (!visible || !autoHideMs) return
    const t = window.setTimeout(() => dismiss(), autoHideMs)
    return () => clearTimeout(t)
  }, [visible, autoHideMs])

  function dismiss() {
    setVisible(false)
    localStorage.setItem(storageKey, '1')
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="context-tip"
          initial={{ opacity: 0, y: -6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.98 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          role="status"
        >
          <p className="context-tip__text">{text}</p>
          <button type="button" className="context-tip__close" onClick={dismiss} aria-label="Закрыть подсказку">
            ✕
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
