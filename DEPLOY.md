# Деплой «ВключиВнимание»

## Фронт (этот репозиторий)

Из папки `vklychi-vniamanie-ai`:

```bash
git add -A && git commit -m "ваше сообщение" && git push origin main
```

GitHub Actions → **Deploy to GitHub Pages**  
URL: https://ozharov164-glitch.github.io/vklychi-vniamanie-ai/

Проверка: [Actions → Workflow runs](https://github.com/ozharov164-glitch/vklychi-vniamanie-ai/actions)

## Бэкенд (бот)

После изменений API или промптов — **обязательно** деплой бота из корня `cozyreset-bot`:

```bash
./deploy_to_server.sh
```

Сервер: `217.114.11.97`, сервис `vklyuchisebya-bot`, `/opt/bot`.

Новые эндпоинты и поля JSON не заработают, если обновить только фронт.

## Порядок при v2-изменениях

1. `./deploy_to_server.sh` (бот)  
2. `git push origin main` (мини-приложение)  
3. Открыть приложение из бота → проверить оба режима
