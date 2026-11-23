# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Команды запуска, проверок и правила коммитов — в [AGENTS.md](AGENTS.md). Здесь только то, что нужно понять, читая несколько файлов.

## Архитектура

Сервис бронирования времени (см. README.md: типы встреч, слоты, занятость). Пока есть только каркас: один эндпоинт `GET /api/health`.

**Контракт — источник правды.** `contract/main.tsp` (TypeSpec) компилируется в `contract/openapi.yaml`. Оба файла коммитятся, и менять API нужно в TypeSpec, затем перекомпилировать.

**Бэкенд (`backend/`, Spring Boot).** Серверный интерфейс не пишется руками: плагин `openapi-generator-maven-plugin` в `pom.xml` генерирует `HealthApi` и модели из `contract/openapi.yaml` во время сборки (`target/generated-sources`). Контроллер (`health/HealthController`) реализует этот интерфейс. Значит, новый маршрут сначала появляется в контракте, затем в контроллере, и компилятор не даст их разойтись.

**Фронтенд (`frontend/`, React + Vite).** Клиент API генерируется из того же `openapi.yaml` генератором `typescript-fetch` в `src/api/generated` (папка в `.gitignore`, ее создает `npm run generate:api`). Поэтому `mise run check` и хук pre-commit сначала вызывают генерацию. В dev-режиме Vite проксирует `/api` на `localhost:8080`, а клиент использует относительный `basePath: ''` — иначе запросы пошли бы мимо прокси.

**Проверки — одна цепочка.** `mise run check` = контракт → генерация SDK → Spotless + oxlint (с `--deny-warnings`) + jactionlint для workflow-файлов → сборка фронтенда → тесты бэкенда. Та же команда вызывается из `.github/workflows/ci.yml` и из хука `pre-push` (hk, `hk.pkl`). Отдельно `scripts/check.ps1` повторяет эту цепочку без mise. Изменяя одно звено, проверяйте всю цепочку, потому что версии инструментов зафиксированы в `mise.toml`, а `scripts/check.ps1` — отдельная копия последовательности.

**Тесты.** Единственный тест — `backend/src/test/.../SmokeTest`: поднимает сервер на случайном порту и делает реальный HTTP-запрос. Один тест: `cd backend && mvn -Dtest=SmokeTest test`. Тестов фронтенда пока нет. Новые проверки сценариев добавляются в бэкенд-тесты рядом с кодом.

**Два способа запуска проверок.** `scripts/check.ps1` и `mise run check` повторяют одну и ту же последовательность, но `check.ps1` вызывает `./mvnw`, а mise — `mvn` из своего набора. Версии Maven держатся в `mise.toml` (3.10.1) и в `backend/.mvn/wrapper/maven-wrapper.properties`; при обновлении меняйте оба места.

**Файлы, которые не трогаем вручную:** `.github/workflows/hexlet-check.yml` (его генерирует Хекслет), `frontend/src/api/generated`, `backend/target`, `contract/openapi.yaml` (только через `mise run contract`).
