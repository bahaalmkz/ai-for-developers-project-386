# AGENTS.md

## Команды

- `mise run check` — все проверки (линтеры, сборка фронтенда, тесты). Это же вызывает GitHub Actions.
- `powershell -ExecutionPolicy Bypass -File scripts\check.ps1` — то же самое без mise (Windows, если mise заблокирован). Версии в этом случае берутся из установленных Node и JDK.
- `mise run contract` — компиляция контракта `contract/main.tsp` в `contract/openapi.yaml`.
- `mise run generate` — генерация клиента фронтенда из OpenAPI (`frontend/src/api/generated`).
- `mise run lint`, `mise run test`, `mise run typecheck` — отдельные этапы.
- Один тест бэкенда: `cd backend && mvn -Dtest=SmokeTest test`. Тесты фронтенда: `cd frontend && npm test` (Vitest).
- `mise run e2e` — браузерный сценарий Playwright (`e2e/`, версия закреплена в `e2e/package.json`). Сам поднимает бэкенд на порту 18080 (чистая БД в памяти, без профиля dev) и фронтенд на 15173, поэтому демоны для него не нужны. Хромиум ставится автоматически. Входит в `mise run check`, `scripts/check.ps1` и CI.
- `mise daemons start|status|logs|stop` — backend (8080) и frontend (5173) в фоне через pitchfork.
- Git-хуки (hk, `hk.pkl`): pre-commit запускает `mise run lint`, pre-push запускает `mise run check`.

## Устройство

Как части связаны между собой (контракт → бэкенд и SDK фронтенда → проверки) — в CLAUDE.md.

- `contract/` — TypeSpec-контракт. Источник правды для API. Меняем API здесь, затем `mise run contract`.
- `backend/` — Java 21, Spring Boot. Серверные интерфейсы генерируются из `contract/openapi.yaml` при сборке. Реализуем их в контроллерах.
- `frontend/` — React + Vite + TypeScript. Клиент API генерируется, руками не правим `src/api/generated`.

## Правила

- Коммиты по Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:` и т. д. Проверяет хук commit-msg (commitlint, правила в `commitlint.config.mjs`). После клонирования один раз `npm ci` в корне, иначе хук не найдёт commitlint.
- Перед коммитом запускать `mise run check`.
- Не править `.github/workflows/hexlet-check.yml`.

## Релизы

- Релизы делает release-please (`.github/workflows/release-please.yml`, действие `googleapis/release-please-action` v5.0.0, закреплено по SHA). Конфигурация: `release-please-config.json`, текущая версия: `.release-please-manifest.json`.
- На каждый push в `main` действие разбирает Conventional Commits с прошлого релиза и открывает (обновляет) PR «chore(main): release X.Y.Z» с новой версией и `CHANGELOG.md`. Слияние этого PR создаёт git-тег `vX.Y.Z` и GitHub Release. Версию и `CHANGELOG.md` руками не правим.
- Правила версии: `fix:` — patch, `feat:` — minor, `feat!:` или `BREAKING CHANGE:` — major (пока версия 0.x, breaking даёт minor из-за `bump-minor-pre-major`). `docs:`, `chore:`, `test:` и т. п. версию не меняют.
- Выбран один пакет на весь репозиторий (тип `simple`, тег без компонента), а не раздельные `backend` и `frontend`: это один продукт с общим контрактом, API и клиент меняются одним коммитом, раздельные версии только усложнили бы историю. Версии в `pom.xml` и `package.json` с релизом не синхронизируются.
- Один раз в настройках репозитория: Settings → Actions → General → «Allow GitHub Actions to create and approve pull requests». С дефолтным `GITHUB_TOKEN` CI на PR релиза не запускается; при необходимости передать PAT в параметре `token`.

## Скиллы и агентная среда

Инженерные скиллы из `mattpocock/skills` установлены в `.claude/skills/` (агент Claude Code). Настройка под репозиторий записана в `docs/agents/`:

- `docs/agents/issue-tracker.md` — трекер: GitHub Issues через `gh`.
- `docs/agents/triage-labels.md` — метки разбора задач (значения по умолчанию).
- `docs/agents/domain.md` — документы предметной области: один `GLOSSARY.md` и ADR в `docs/adr/` (single-context).

Скиллы `/to-spec`, `/to-tickets`, `/implement-spec` и `/setup-matt-pocock-skills` помечены `disable-model-invocation`: агент их сам не запускает и в списке доступных не показывает. Их вызывает пользователь командой со слэшем в чате. Остальные скиллы (`domain-modeling`, `tdd`, `code-review`, `pr` и др.) агент может подобрать сам по описанию или по просьбе. Перед реализацией читайте спецификацию, связанные тикеты и их зависимости.
