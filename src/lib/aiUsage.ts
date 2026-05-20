import { COPY } from './copy'

export function aiQuotaLabel(used: number, limit: number) {
  return COPY.ai.quota(used, limit)
}

export function aiQuotaHint(premium: boolean, left: number, ownerUnlimited?: boolean) {
  if (ownerUnlimited) {
    return COPY.ai.ownerHint
  }
  if (premium) {
    return left > 0 ? COPY.ai.premiumMore : COPY.ai.premiumLimit
  }
  if (left > 0) {
    return COPY.ai.freeHint
  }
  return COPY.ai.freeLimit
}
