# ⚓ ВключиВнимание

Telegram Mini App экосистемы [ВключиСебя](https://t.me/CozyReset_bot): **«Застрял(а)»** — вход в задачу, **«Шум в голове»** — разбор мыслей и одна опора.

- **Free:** Groq, 6 запросов ИИ в день  
- **Premium:** DeepSeek (двухпроходный разбор), 12 запросов в день — одна подписка с «Путём к Себе»

Без таймера, без интеграции с чек-инами — автономный инструмент.

## Локально

```bash
npm install
npm run dev
```

Бэкенд: API бота `POST /mini-app/focus/*` (см. `cozyreset-bot/services/focus_app_api.py`).

## Деплой

См. [DEPLOY.md](./DEPLOY.md).
