import { getAiQuota, aiQuotaLabel } from '../lib/aiUsage'
import { useAppStore } from '../store'

export function AiStatusLine() {
  const premium = useAppStore((s) => s.premium)
  const aiUsage = useAppStore((s) => s.aiUsage)
  const limits = useAppStore((s) => s.limits)
  const { used, limit, tier } = getAiQuota(premium, aiUsage, limits)
  const left = Math.max(0, limit - used)

  return (
    <div className="ai-status">
      <p className="ai-status__main">{aiQuotaLabel(used, limit)}</p>
      <p className="ai-status__sub">
        {tier === 'premium'
          ? 'В Премиум — более сильная модель ИИ и больше подсказок в день.'
          : left > 0
            ? 'В Премиум — ИИ умнее и лимит выше. Таймер «Рядом» — без лимита.'
            : 'Лимит на сегодня. Завтра снова или оформи Премиум в боте.'}
      </p>
    </div>
  )
}
