import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { apiTranscribe } from '../api'
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
  const [recording, setRecording] = useState(false)
  const [processing, setProcessing] = useState(false)
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
      setVoiceError('Микрофон недоступен в этом браузере')
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
      setRecording(true)
      setRecordSeconds(0)
      timerRef.current = window.setInterval(() => setRecordSeconds((s) => s + 1), 1000)
      window.Telegram?.WebApp.HapticFeedback?.impactOccurred('medium')
    } catch {
      setVoiceError('Разреши доступ к микрофону в настройках')
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
    setRecording(false)
    setRecordSeconds(0)
    window.Telegram?.WebApp.HapticFeedback?.impactOccurred('light')
  }

  async function finishRecording() {
    const rec = recorderRef.current
    if (!rec || rec.state === 'inactive') return
    clearTimer()
    setProcessing(true)
    setRecording(false)

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
      if (blob.size < 100) throw new Error('Запись слишком короткая')
      const base64 = await blobToBase64(blob)
      const { text } = await apiTranscribe(base64, blob.type || pickMimeType())
      const trimmed = text.trim()
      if (!trimmed) throw new Error('Не удалось распознать речь')
      onChange(value ? `${value.trimEnd()}\n${trimmed}` : trimmed)
      window.Telegram?.WebApp.HapticFeedback?.notificationOccurred('success')
    } catch (e) {
      setVoiceError(e instanceof Error ? e.message : 'Ошибка распознавания')
      window.Telegram?.WebApp.HapticFeedback?.notificationOccurred('error')
    } finally {
      setProcessing(false)
      setRecordSeconds(0)
    }
  }

  const fieldClass = `input-field voice-field ${multiline ? 'input-field--area' : ''} ${className}`.trim()
  const mm = String(Math.floor(recordSeconds / 60)).padStart(2, '0')
  const ss = String(recordSeconds % 60).padStart(2, '0')

  return (
    <div className="voice-field-wrap">
      {multiline ? (
        <textarea
          id={id}
          className={fieldClass}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled || recording || processing}
          rows={rows}
        />
      ) : (
        <input
          id={id}
          className={fieldClass}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled || recording || processing}
        />
      )}

      <AnimatePresence>
        {recording && (
          <motion.div
            className="voice-recording-bar"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
          >
            <span className="voice-recording-bar__dot" />
            <span className="voice-recording-bar__time">
              {mm}:{ss}
            </span>
            <button type="button" className="voice-recording-bar__cancel" onClick={cancelRecording}>
              Отмена
            </button>
            <button type="button" className="voice-recording-bar__send" onClick={finishRecording}>
              Готово
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {!recording && (
        <button
          type="button"
          className={`voice-mic-btn ${processing ? 'voice-mic-btn--processing' : ''}`}
          onClick={startRecording}
          disabled={disabled || processing}
          aria-label={processing ? 'Распознаю речь…' : 'Записать голосом'}
          title="Записать голосом"
        >
          <MicrophoneIcon recording={processing} />
        </button>
      )}

      {voiceError && <p className="form-error voice-field__error">{voiceError}</p>}
      {processing && !voiceError && <p className="voice-field__hint">Распознаю речь…</p>}
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
