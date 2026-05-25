/** Нормализация фраз для скрытия дублей на экране результата. */

/** CFLC: почти дословный дубль — не режем слова пользователя из-за частичного overlap */
const DEDUPE_THRESHOLD = 0.95

export function normAnchorKey(s: string): string {
  return s
    .toLowerCase()
    .replace(/[—–-]/g, '-')
    .replace(/[^\wа-яё]+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120)
}

function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/[«»"']/g, '')
    .replace(/[^\wа-яё]+/gi, ' ')
    .trim()
}

export function textsAreDuplicate(a: string, b: string, threshold = DEDUPE_THRESHOLD): boolean {
  if (!a.trim() || !b.trim()) return false
  const na = norm(a)
  const nb = norm(b)
  if (!na || !nb) return false
  if (na === nb) return true
  if (na.length >= 12 && (na.includes(nb) || nb.includes(na))) return true
  const wa = new Set(na.split(/\s+/).filter((w) => w.length >= 3))
  const wb = new Set(nb.split(/\s+/).filter((w) => w.length >= 3))
  if (wa.size < 2 || wb.size < 2) return na === nb
  let overlap = 0
  wa.forEach((w) => {
    if (wb.has(w)) overlap += 1
  })
  return overlap / Math.min(wa.size, wb.size) >= threshold
}

export type DisplayEchoFields = {
  userQuote: string
  userPriority: string
  insight: string
  whyShort: string
  overloadIntro: string
  microStep: string
  firstBlockText: string
}

export function pickDisplayEcho(fields: DisplayEchoFields): {
  userQuote: string
  userPriority: string
  insight: string
  whyShort: string
} {
  let userQuote = fields.userQuote.trim()
  let userPriority = fields.userPriority.trim()
  let insight = fields.insight.trim()
  let whyShort = fields.whyShort.trim()

  if (userQuote && userPriority && textsAreDuplicate(userQuote, userPriority)) {
    userPriority = ''
  } else if (userPriority && !userQuote) {
    userQuote = userPriority
    userPriority = ''
  }

  const echoTargets = [userQuote, fields.overloadIntro, fields.microStep, fields.firstBlockText]
  if (insight && echoTargets.some((t) => t && textsAreDuplicate(insight, t))) {
    insight = ''
  }

  if (whyShort) {
    if (insight && textsAreDuplicate(whyShort, insight, DEDUPE_THRESHOLD)) {
      if (whyShort.split(/\s+/).length <= insight.split(/\s+/).length + 2) whyShort = ''
    } else if (echoTargets.some((t) => t && textsAreDuplicate(whyShort, t, DEDUPE_THRESHOLD))) {
      if (whyShort.split(/\s+/).length <= 12) whyShort = ''
    } else if (
      fields.firstBlockText &&
      textsAreDuplicate(whyShort, fields.firstBlockText, DEDUPE_THRESHOLD)
    ) {
      whyShort = ''
    }
  }

  return { userQuote, userPriority, insight, whyShort }
}
