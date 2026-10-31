# DLSAuto

Интернет-магазин вживаних автозапчастин (Next.js + Payload CMS). Источник правды
по разработке — [`docs/DEV_CONTEXT.md`](docs/DEV_CONTEXT.md), по продукту/дизайну —
[`docs/PROJECT_CONTEXT.md`](docs/PROJECT_CONTEXT.md),
[`docs/DESIGN_RULES.md`](docs/DESIGN_RULES.md). Правила для Claude Code — `CLAUDE.md`.

Текущий этап — **0 (фундамент)**: скелет проекта, Docker, CI, деплой, i18n-маршрутизация,
пустой деплой на stage. Никакого UI и бизнес-логики.

## Стек (зафиксированные версии)

| Слой            | Версия                                     |
| --------------- | ------------------------------------------ |
| Node            | 22.x (`>=22`)                              |
| Package manager | pnpm 10.11.0                               |
| Next.js         | 16.4.3 (App Router, standalone)            |
| React           | 19.3.1                                     |
| Payload CMS     | 3.92.1 (адаптер `@payloadcms/db-postgres`) |
| PostgreSQL      | 16 (расширения `pg_trgm`, `unaccent`)      |
| Tailwind        | 4.3.3 (через PostCSS)                      |
| TypeScript      | 5.9.3 (strict)                             |

Полный список зависимостей и причины — в конце файла.

## Локальный запуск

Требуется Node 22+, pnpm 10+, Docker (для Postgres).

```bash
git clone <repo> && cd dlsauto
cp .env.example .env            # заполнить PAYLOAD_SECRET и, при желании, админа
docker compose up -d            # поднимает Postgres 16 с pg_trgm + unaccent
pnpm install
pnpm dev                        # http://localhost:3000, админка /admin
```

- Сайт: `http://localhost:3000` (uk, без префикса) и `http://localhost:3000/ru`.
- Админка Payload: `http://localhost:3000/admin`. Первый админ создаётся из
  `PAYLOAD_ADMIN_EMAIL` / `PAYLOAD_ADMIN_PASSWORD` при первом запуске на пустой БД
  (если переменные не заданы — создайте админа через форму регистрации в `/admin`).
- Health: `http://localhost:3000/api/health` → JSON `{ status, version, db, timestamp }`.

Postgres-расширения создаются init-скриптом `docker/postgres/initdb/01-extensions.sql`
**только при первой инициализации пустого тома**. Если том уже существовал — примените
скрипт вручную или пересоздайте том (`docker compose down -v`).

## Скрипты

| Команда                             | Действие                                          |
| ----------------------------------- | ------------------------------------------------- |
| `pnpm dev` / `pnpm devsafe`         | дев-сервер (devsafe — с очисткой `.next`)         |
| `pnpm build` / `pnpm start`         | продовая сборка / запуск                          |
| `pnpm lint` / `pnpm lint:fix`       | ESLint                                            |
| `pnpm typecheck`                    | `tsc --noEmit`                                    |
| `pnpm format` / `pnpm format:check` | Prettier                                          |
| `pnpm test` / `pnpm test:watch`     | Vitest                                            |
| `pnpm generate:types`               | перегенерировать `src/payload-types.ts`           |
| `pnpm generate:importmap`           | перегенерировать import-map админки               |
| `pnpm db:migrate`                   | миграции Payload                                  |
| `pnpm db:seed`                      | сид (пока пустой)                                 |
| `pnpm worker` / `pnpm worker:dev`   | фоновый воркер (healthcheck + пустой планировщик) |

## Структура

```
src/app            — маршруты Next (App Router)
  (frontend)/[locale]  — публичные страницы (uk без префикса, ru под /ru)
  (payload)            — админка и API Payload (сгенерировано, не править)
  api/health           — health-эндпоинт
src/components     — ui/ (примитивы), blocks/ (составные), layout/
src/lib            — утилиты, бизнес-правила
src/i18n           — конфиг локалей и словари uk/ru
src/integrations   — внешние сервисы (keycrm, prom, novaposhta, delivery, monopay, telegram, email)
src/payload        — collections/, globals/, blocks/
src/worker         — фоновый процесс
scripts/           — скрипты обслуживания
docker/            — init-скрипты Postgres для локалки
deploy/            — server-setup, compose для Dokploy, бэкап, runbook
docs/              — контексты и экспорт дизайна (docs/design-export/, вне сборки)
```

Принцип: дизайн-система раньше страниц (токены → примитивы → составные → `/ui` → страницы).
Экспорт Claude Design в `docs/design-export/` — спецификация, а не исходник; исключён из
tsconfig/eslint/prettier и из Docker-образа.

## i18n

`uk` — по умолчанию без префикса, `ru` — под `/ru`. Выбор языка хранится в cookie
`NEXT_LOCALE`; автоматического редиректа по `Accept-Language` нет (`src/middleware.ts`).
Домен задаётся единственной переменной `DOMAIN` и используется в metadataBase, canonical,
hreflang, sitemap и CSP.

## Деплой

Образы собираются в GitHub Actions и пушатся в GHCR; сервер (Dokploy) только тянет и
запускает — см. [`deploy/README.md`](deploy/README.md).

- PR в `stage`/`main` → `ci.yml` (lint, typecheck, test, build).
- push в `stage` → `deploy-stage.yml`: сборка образов (теги `stage` + sha) → GHCR →
  webhook Dokploy. Хост `stage.<DOMAIN>`.
- push в `main` → `deploy-prod.yml`: то же, теги `latest` + sha. Хост `<DOMAIN>`.

Один `Dockerfile` с двумя таргетами: **`web`** (Next standalone) и **`worker`**
(процесс на `tsx`). Выбор в пользу общего Dockerfile с разными таргетами: единый граф
сборки гарантирует одинаковые версии зависимостей для обоих процессов и одну сборку в CI;
таргеты отличаются только содержимым и командой запуска.

Нужные секреты GitHub: `DOKPLOY_STAGE_WEBHOOK`, `DOKPLOY_PROD_WEBHOOK` (GHCR использует
встроенный `GITHUB_TOKEN`).

## Зависимости и причины

**Runtime**

| Пакет                          | Причина                                                           |
| ------------------------------ | ----------------------------------------------------------------- |
| `next`                         | фреймворк (App Router, SSR, standalone-сборка)                    |
| `react`, `react-dom`           | обязательны для Next 16                                           |
| `payload`                      | CMS и админка внутри того же приложения                           |
| `@payloadcms/next`             | интеграция Payload с App Router (admin + REST/GraphQL)            |
| `@payloadcms/db-postgres`      | адаптер PostgreSQL                                                |
| `@payloadcms/richtext-lexical` | richText-редактор (описания товаров)                              |
| `@payloadcms/ui`               | компоненты админки (требуется Payload)                            |
| `graphql`                      | peer-зависимость Payload (GraphQL API)                            |
| `pg`                           | лёгкая проверка БД в `/api/health` и служебные скрипты            |
| `sharp`                        | обработка изображений (WebP, размеры)                             |
| `tsx`                          | запуск TS-скриптов и воркера без отдельной сборки                 |
| `cross-env`                    | кроссплатформенные env в npm-скриптах (payload CLI, NODE_OPTIONS) |

**Dev**

| Пакет                                                    | Причина                |
| -------------------------------------------------------- | ---------------------- |
| `typescript`, `@types/*`                                 | типы                   |
| `tailwindcss`, `@tailwindcss/postcss`                    | стили через токены     |
| `eslint`, `eslint-config-next`, `eslint-config-prettier` | линтинг                |
| `prettier`                                               | форматирование         |
| `husky`, `lint-staged`                                   | проверки на pre-commit |
| `@commitlint/cli`, `@commitlint/config-conventional`     | Conventional Commits   |
| `vitest`                                                 | тесты                  |
| `@playwright/test`                                       | скриншоты и сверка дизайна (этап 1, `scripts/design-compare`) |
