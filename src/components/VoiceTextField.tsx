import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { apiTranscribe } from '../api'
import { COPY } from '../lib/copy'
import { MicrophoneIcon } from './MicrophoneIcon'

type Props = {
  id: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  multiline?: boolean
  rows?: number
  disabled?: boolean
  className?: string
}

type DockMode = 'idle' | 'recording' | 'processing'

function isIOS(): boolean {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

function pickMimeType(): string {
  const candidates = isIOS()
    ? ['audio/mp4', 'audio/aac', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus']
    : ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4']
  if (typeof MediaRecorder === 'undefined') return isIOS() ? 'audio/mp4' : 'audio/webm'
  return candidates.find((t) => MediaRecorder.isTypeSupported(t)) || (isIOS() ? 'audio/mp4' : 'audio/webm')
}

function VoiceWaveform({ active }: { active: boolean }) {
  return (
    <div className="voice-waveform" aria-hidden>
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className={`voice-waveform__bar ${active ? 'voice-waveform__bar--live' : 'voice-waveform__bar--idle'}`}
          style={{ animationDelay: `${i * 0.12}s` }}
        />
      ))}
    </div>
  )
}

export function VoiceTextField({
  id,
  value,
  onChange,
  placeholder,
  multiline = false,
  rows = 4,
  disabled = false,
  className = '',
}: Props) {
  const [mode, setMode] = useState<DockMode>('idle')
  const [recordSeconds, setRecordSeconds] = useState(0)
  const [voiceError, setVoiceError] = useState('')
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      stopTracks()
      if (timerRef.current) window.clearInterval(timerRef.current)
    }
  }, [])

  function stopTracks() {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }

  function clearTimer() {
    if (timerRef.current) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  async function startRecording() {
    setVoiceError('')
    if (!navigator.mediaDevices?.getUserMedia) {
      setVoiceError(COPY.voice.micUnavailable)
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mimeType = pickMimeType()
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      chunksRef.current = []
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.start(200)
      recorderRef.current = recorder
      setMode('recording')
      setRecordSeconds(0)
      timerRef.current = window.setInterval(() => setRecordSeconds((s) => s + 1), 1000)
      window.Telegram?.WebApp.HapticFeedback?.impactOccurred('medium')
    } catch {
      setVoiceError(COPY.voice.micDenied)
      stopTracks()
    }
  }

  function cancelRecording() {
    const rec = recorderRef.current
    if (rec && rec.state !== 'inactive') {
      rec.ondataavailable = null
      rec.onstop = null
      try {
        rec.stop()
      } catch {
        /* ignore */
      }
    }
    recorderRef.current = null
    chunksRef.current = []
    clearTimer()
    stopTracks()
    setMode('idle')
    setRecordSeconds(0)
    window.Telegram?.WebApp.HapticFeedback?.impactOccurred('light')
  }

  async function finishRecording() {
    const rec = recorderRef.current
    if (!rec || rec.state === 'inactive') return
    clearTimer()
    setMode('processing')

    const blob: Blob = await new Promise((resolve, reject) => {
      rec.onstop = () => {
        const type = rec.mimeType || pickMimeType()
        resolve(new Blob(chunksRef.current, { type }))
      }
      rec.onerror = () => reject(new Error('record_failed'))
      try {
        rec.stop()
      } catch (e) {
        reject(e)
      }
    })

    stopTracks()
    recorderRef.current = null
    chunksRef.current = []

    try {
      if (blob.size < 100) throw new Error(COPY.voice.tooShort)
      const base64 = await blobToBase64(blob)
      const { text } = await apiTranscribe(base64, blob.type || pickMimeType())
      const trimmed = text.trim()
      if (!trimmed) throw new Error(COPY.voice.recognizeFail)
      onChange(value ? `${value.trimEnd()}\n${trimmed}` : trimmed)
      window.Telegram?.WebApp.HapticFeedback?.notificationOccurred('success')
    } catch (e) {
      setVoiceError(e instanceof Error ? e.message : COPY.voice.errorGeneric)
      window.Telegram?.WebApp.HapticFeedback?.notificationOccurred('error')
    } finally {
      setMode('idle')
      setRecordSeconds(0)
    }
  }

  const mm = String(Math.floor(recordSeconds / 60)).padStart(2, '0')
  const ss = String(recordSeconds % 60).padStart(2, '0')
  const shellClass = [
    'voice-input',
    mode === 'recording' ? 'voice-input--recording' : '',
    mode === 'processing' ? 'voice-input--processing' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const controlClass = `voice-input__control ${multiline ? 'voice-input__control--area' : ''}`

  return (
    <div className={shellClass}>
      {multiline ? (
        <textarea
          id={id}
          className={controlClass}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled || mode !== 'idle'}
          rows={rows}
        />
      ) : (
        <input
          id={id}
          className={controlClass}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled || mode !== 'idle'}
        />
      )}

      <div className="voice-input__dock">
        <AnimatePresence mode="wait" initial={false}>
          {mode === 'recording' && (
            <motion.div
              key="rec"
              className="voice-dock voice-dock--recording"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="voice-dock__rec-dot" />
              <VoiceWaveform active />
              <span className="voice-dock__time">
                {mm}:{ss}
              </span>
              <div className="voice-dock__actions">
                <button type="button" className="voice-dock__btn voice-dock__btn--ghost" onClick={cancelRecording}>
                  {COPY.voice.cancel}
                </button>
                <button type="button" className="voice-dock__btn voice-dock__btn--accent" onClick={finishRecording}>
                  {COPY.voice.done}
                </button>
              </div>
            </motion.div>
          )}

          {mode === 'processing' && (
            <motion.div
              key="proc"
              className="voice-dock voice-dock--processing"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="voice-dock__spinner" />
              <VoiceWaveform active={false} />
              <span className="voice-dock__label">{COPY.voice.processing}</span>
            </motion.div>
          )}

          {mode === 'idle' && (
            <motion.div
              key="idle"
              className="voice-dock voice-dock--idle"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="voice-dock__hint">{COPY.voice.hint}</span>
              <button
                type="button"
                className="voice-dock__mic"
                onClick={startRecording}
                disabled={disabled}
                aria-label="Записать голосом"
              >
                <MicrophoneIcon />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {voiceError && <p className="form-error voice-input__error">{voiceError}</p>}
    </div>
  )
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result
      if (typeof result !== 'string') {
        reject(new Error('read_failed'))
        return
      }
      const comma = result.indexOf(',')
      resolve(comma >= 0 ? result.slice(comma + 1) : result)
    }
    reader.onerror = () => reject(new Error('read_failed'))
    reader.readAsDataURL(blob)
  })
}
