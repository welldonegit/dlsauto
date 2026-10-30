# Этап 0 — фундамент проекта DLSAuto

Задача этого этапа — чистый, воспроизводимый скелет проекта, который деплоится на stage
одной командой. Никакого UI и бизнес-логики — только инфраструктура.

## 1. Репозиторий и инструменты

- Next.js (App Router, TypeScript strict, актуальная стабильная версия) с Payload CMS
  внутри того же приложения, адаптер Postgres.
- Tailwind v4. В `globals.css` — заготовка под токены: пустые блоки `:root` с
  комментариями-разделами (цвета, типографика, отступы, радиусы, тени). Значения — этап 1.
- ESLint, Prettier, husky + lint-staged, commitlint (Conventional Commits).
- Структура: `src/app`, `src/components` (ui/, blocks/, layout/), `src/lib`,
  `src/integrations` (keycrm, prom, novaposhta, delivery, monopay, telegram, email),
  `src/payload` (collections/, globals/, blocks/), `src/worker`, `scripts/`.
- `.env.example` со всеми переменными по назначению; секретов в репо нет.
- `README.md`: как поднять локально, как деплоится, структура, зависимости с причинами.
- `CLAUDE.md` в корне.

## 2. Локальная разработка

- `docker-compose.yml`: Postgres 16 с pg_trgm и unaccent (init-скрипт), volume. Приложение
  запускается хостом через `pnpm dev`.
- Скрипты `pnpm db:migrate`, `pnpm db:seed` (пустой), `pnpm typecheck`, `pnpm lint`,
  `pnpm test` (vitest, один smoke-тест).

## 3. Образы и CI

- Многоступенчатый `Dockerfile` для web (standalone, non-root, healthcheck `/api/health`).
- Образ воркера (общий Dockerfile, отдельный таргет/команда).
- GitHub Actions: `ci.yml` (PR: lint, typecheck, test, build); `deploy-stage.yml`
  (push в `stage`: build → GHCR теги `stage`+`sha` → webhook Dokploy); `deploy-prod.yml`
  (push в `main`: теги `latest`+`sha`).

## 4. Деплой на сервер (Dokploy)

- `deploy/server-setup.sh` — идемпотентная настройка Ubuntu 22.04.
- `deploy/dokploy/` — compose для stage и prod (web, worker, postgres с volume), env через
  Dokploy, домены `stage.<домен>` и `<домен>`, отдельные БД.
- `deploy/backup.sh` + cron: pg_dump + rsync `/data/media` в R2 через rclone, ротация
  30 дней, Telegram при ошибке.
- `deploy/README.md` — пошаговая инструкция.

## 5. Приложение на этом этапе

- i18n: `uk` по умолчанию без префикса, `ru` под `/ru`. Middleware без авторедиректа по
  Accept-Language; язык — cookie. Словарь UI в `src/i18n/{uk,ru}.json`. Payload
  localization uk/ru.
- `/` — «DLSAuto — у розробці» + версия сборки (sha).
- `/api/health` — JSON: статус, версия, доступность БД.
- `/admin` — Payload, коллекция `users`, роли `admin` / `manager`, первый админ из env.
- Базовые заголовки безопасности (CSP report-only, HSTS, X-Frame-Options, Referrer-Policy).

## 6. Критерии приёмки

- `git clone` → `docker compose up -d` → `pnpm i` → `pnpm dev` → сайт и `/admin` локально.
- PR в `stage` проходит CI.
- Push в `stage` собирает образы и деплоит на `stage.<домен>`; `/api/health` отвечает `ok`.
- Бэкап-скрипт отрабатывает вручную и кладёт файлы в R2.
- README и deploy/README.md достаточны, чтобы повторить всё с нуля.
