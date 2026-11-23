# AGENTS.md

## Команды

- `mise run check` — все проверки (линтеры, сборка фронтенда, тесты). Это же вызывает GitHub Actions.
- `powershell -ExecutionPolicy Bypass -File scripts\check.ps1` — то же самое без mise (Windows, если mise заблокирован). Версии в этом случае берутся из установленных Node и JDK.
- `mise run contract` — компиляция контракта `contract/main.tsp` в `contract/openapi.yaml`.
- `mise run generate` — генерация клиента фронтенда из OpenAPI (`frontend/src/api/generated`).
- `mise run lint`, `mise run test`, `mise run typecheck` — отдельные этапы.
- Один тест бэкенда: `cd backend && mvn -Dtest=SmokeTest test`. Тестов фронтенда пока нет.
- `mise daemons start|status|logs|stop` — backend (8080) и frontend (5173) в фоне через pitchfork.
- Git-хуки (hk, `hk.pkl`): pre-commit запускает `mise run lint`, pre-push запускает `mise run check`.

## Устройство

Как части связаны между собой (контракт → бэкенд и SDK фронтенда → проверки) — в CLAUDE.md.

- `contract/` — TypeSpec-контракт. Источник правды для API. Меняем API здесь, затем `mise run contract`.
- `backend/` — Java 21, Spring Boot. Серверные интерфейсы генерируются из `contract/openapi.yaml` при сборке. Реализуем их в контроллерах.
- `frontend/` — React + Vite + TypeScript. Клиент API генерируется, руками не правим `src/api/generated`.

## Правила

- Коммиты по Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:` и т. д.
- Перед коммитом запускать `mise run check`.
- Не править `.github/workflows/hexlet-check.yml`.
