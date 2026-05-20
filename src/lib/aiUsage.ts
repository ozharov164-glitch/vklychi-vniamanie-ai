export function aiQuotaLabel(used: number, limit: number) {
  return `Подсказки ИИ сегодня: ${used} из ${limit}`
}

export function aiQuotaHint(premium: boolean, left: number) {
  if (premium) {
    return left > 0
      ? 'В Премиум — больше подсказок и точнее разбор.'
      : 'Лимит на сегодня. Завтра снова — или продолжай без ИИ.'
  }
  if (left > 0) {
    return 'Разморозка с подсказкой ИИ. Таймер — без лимита.'
  }
  return 'Лимит на сегодня. Завтра снова или оформи Премиум в боте.'
}
