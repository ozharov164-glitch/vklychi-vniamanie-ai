import type { InitResponse } from '../api'

export function getAiQuota(premium: boolean, aiUsage: InitResponse['aiUsage'], limits: InitResponse['limits']) {
  if (premium) {
    return { used: aiUsage.deepseekCount, limit: limits.deepseekDaily, tier: 'premium' as const }
  }
  return { used: aiUsage.groqCount, limit: limits.groqDaily, tier: 'free' as const }
}

export function aiQuotaLabel(used: number, limit: number) {
  return `Подсказки ИИ сегодня: ${used} из ${limit}`
}
