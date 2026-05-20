import { aiQuotaHint, aiQuotaLabel } from '../lib/aiUsage'
import { useAppStore } from '../store'

export function AiStatusLine() {
  const premium = useAppStore((s) => s.premium)
  const aiUsage = useAppStore((s) => s.aiUsage)
  const { aiUsedToday, hintsLimit } = aiUsage
  const left = Math.max(0, hintsLimit - aiUsedToday)

  return (
    <div className="ai-status">
      <p className="ai-status__main">{aiQuotaLabel(aiUsedToday, hintsLimit)}</p>
      <p className="ai-status__sub">{aiQuotaHint(premium, left)}</p>
    </div>
  )
}
