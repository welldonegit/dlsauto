# DLSAuto — деплой и воспроизведение сервера с нуля

Пошаговый ранбук: от чистого VPS до работающих stage и prod.
Делай по порядку, не пропуская шаги.

Модель деплоя: образы `web` и `worker` собираются в GitHub Actions и пушатся
в GHCR (`ghcr.io/<owner>/<repo>-web` и `-worker`, теги `stage` / `latest` /
`<sha>`). Сервер **только тянет и запускает** — ничего не собирается на хосте.

Единая переменная домена — `DOMAIN`:

- stage: `stage.${DOMAIN}`
- prod: `${DOMAIN}`

---

## 1. VPS на Hostpro

1. Закажи VPS: Hostpro NVMe, **Ubuntu 22.04**.
2. Получи root-доступ и публичный IP.
3. Войди по SSH под root:
   ```sh
   ssh root@<server-ip>
   ```

## 2. DNS в Cloudflare

1. Добавь домен в Cloudflare, поменяй NS у регистратора на Cloudflare.
2. Создай **A-записи** (обе — Proxied, оранжевое облако):
   - `@` → `<server-ip>` (prod — `${DOMAIN}`)
   - `stage` → `<server-ip>` (stage — `stage.${DOMAIN}`)
3. SSL/TLS → режим **Full (strict)**.
   Traefik на сервере выпустит Let's Encrypt-сертификат, Cloudflare держит
   свой edge-сертификат. Это согласовано с метками Traefik в compose-файлах.

> Пока DNS проксируется через Cloudflare, Let's Encrypt-челлендж должен
> проходить по HTTP-01 через порт 80 (он открыт в ufw). Если возникнут
> проблемы с выпуском серта за оранжевым облаком — временно поставь записи
> в DNS-only (серое облако), дождись серта, верни Proxied.

## 3. Первичная настройка сервера

1. Скопируй скрипт на сервер (или склонируй репозиторий):
   ```sh
   scp deploy/server-setup.sh root@<server-ip>:/root/
   ```
2. Запусти от root:

   ```sh
   ssh root@<server-ip>
   bash /root/server-setup.sh
   ```

   Скрипт идемпотентный: обновит систему, создаст пользователя `deploy`,
   настроит SSH-харденинг, ufw (22/80/443), fail2ban, автообновления
   безопасности, Docker + compose, каталог `/data/media`, установит Dokploy.

3. **КРИТИЧНО — сразу установи SSH-ключ для `deploy`**, т.к. парольный вход
   уже отключён:
   ```sh
   ssh-copy-id -i ~/.ssh/your_key.pub deploy@<server-ip>
   ```
   Проверь вход в **новой** сессии, не закрывая текущую:
   ```sh
   ssh deploy@<server-ip>
   ```

## 4. Dokploy: первый вход и реестр GHCR

1. Открой Dokploy UI:
   ```
   http://<server-ip>:3000
   ```
   Создай админ-аккаунт.
2. Подключи домен к самому Dokploy по желанию (необязательно для приложений).
3. **Registry → добавить GHCR**:
   - Registry URL: `ghcr.io`
   - Username: твой GitHub-логин (владелец образов)
   - Password: **GitHub PAT** со scope `read:packages`
     Это нужно, чтобы сервер мог тянуть приватные образы из GHCR.

## 5. Создание приложений (stage и prod)

Создаём два приложения из compose-файлов в `deploy/dokploy/`.

Для каждого (сначала **stage**, потом **prod**):

1. New → **Compose** (Docker Compose).
2. Источник compose:
   - `deploy/dokploy/stage.compose.yml` — для stage;
   - `deploy/dokploy/prod.compose.yml` — для prod.
     (Подключи репозиторий как источник или вставь содержимое — как удобнее в
     твоём Dokploy. Файлы ссылаются на `./init/extensions.sql` — он лежит рядом
     в `deploy/dokploy/init/` и монтируется в postgres для создания расширений
     `pg_trgm` и `unaccent`.)
3. Убедись, что приложение подключено к сети `dokploy-network` (external) —
   через неё Traefik маршрутизирует хосты.

## 6. Переменные окружения

Задай env в Dokploy для **каждого** приложения (референс — `.env.example`
в корне репозитория). Образы указывает Dokploy через `WEB_IMAGE` и
`WORKER_IMAGE`.

Обязательные переменные:

| Переменная               | Назначение                                                       |
| ------------------------ | ---------------------------------------------------------------- |
| `DOMAIN`                 | Корневой домен (stage сам добавит префикс `stage.`)              |
| `WEB_IMAGE`              | Ref образа web в GHCR (напр. `ghcr.io/<owner>/<repo>-web:stage`) |
| `WORKER_IMAGE`           | Ref образа worker (напр. `ghcr.io/<owner>/<repo>-worker:stage`)  |
| `POSTGRES_USER`          | Пользователь БД                                                  |
| `POSTGRES_PASSWORD`      | Пароль БД (разный для stage/prod)                                |
| `POSTGRES_DB`            | Имя БД                                                           |
| `PAYLOAD_SECRET`         | `openssl rand -hex 32`, разный для stage/prod                    |
| `PAYLOAD_ADMIN_EMAIL`    | Первый админ Payload                                             |
| `PAYLOAD_ADMIN_PASSWORD` | Пароль первого админа                                            |
| `WORKER_PORT`            | `3001`                                                           |
| `NEXT_PUBLIC_BUILD_SHA`  | SHA сборки (обычно подставляет CI)                               |

Примечания:

- `DATABASE_URL` **не задаём вручную** — в compose он собран из `POSTGRES_*`
  и указывает на сервис `postgres` внутри сети compose.
- Для prod и stage — **разные** пароли, секреты и теги образов (`stage` vs
  `latest`). Базы и тома тоже раздельные (`dlsauto-stage-pgdata` /
  `dlsauto-prod-pgdata`).
- Backup-переменные (`RCLONE_REMOTE`, `R2_BUCKET`, `BACKUP_RETENTION_DAYS`,
  `MEDIA_DIR`, `TELEGRAM_*`) нужны только скрипту бэкапа на хосте (см. шаг 9),
  в приложениях Dokploy они не требуются.

## 7. Первый деплой

1. В Dokploy нажми **Deploy** для stage, дождись, пока поднимутся
   `postgres` (healthy) → `web` → `worker`.
2. То же для prod.
3. При пустой БД Payload автоматически создаст первого админа из
   `PAYLOAD_ADMIN_EMAIL` / `PAYLOAD_ADMIN_PASSWORD`.

## 8. Проверка

1. Health веб-приложения должен вернуть `ok` и версию сборки:
   ```sh
   curl -s https://stage.<DOMAIN>/api/health
   curl -s https://<DOMAIN>/api/health
   ```
   Ожидается HTTP 200 и JSON со статусом ok и `NEXT_PUBLIC_BUILD_SHA`.
2. Открой сайт в браузере — должен работать HTTPS (серт от Let's Encrypt,
   Cloudflare Full strict).
3. Worker без публичного маршрута — его состояние смотри в Dokploy (контейнер
   healthy по внутреннему `/health` на `3001`).

## 9. Бэкапы (cron + R2)

1. Установи `rclone` и `postgresql-client` на хост, настрой rclone-remote для
   Cloudflare R2 с именем из `RCLONE_REMOTE` (например `r2`):
   ```sh
   sudo apt-get install -y rclone postgresql-client
   rclone config   # создать remote типа S3 → Cloudflare R2
   ```
2. Положи env для бэкапа в `/etc/dlsauto/backup.env` (chmod 600, owner deploy):
   нужны `DATABASE_URL`, `RCLONE_REMOTE`, `R2_BUCKET`, `BACKUP_RETENTION_DAYS`,
   `MEDIA_DIR`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`.
3. Добавь скрипт `deploy/backup.sh` (см. файл) в cron пользователя `deploy`.
   Готовая crontab-строка (запуск ежедневно в 03:30) приведена в комментарии
   в конце `deploy/backup.sh`:
   ```
   30 3 * * * set -a; . /etc/dlsauto/backup.env; set +a; /opt/dlsauto/deploy/backup.sh >> /var/log/dlsauto-backup.log 2>&1
   ```
   Скрипт делает `pg_dump` → gzip, заливает дамп (в `db/`) и медиа (в `media/`)
   в R2, удаляет дампы старше `BACKUP_RETENTION_DAYS` дней и шлёт алерт в
   Telegram при любой ошибке.
4. Прогони вручную для проверки:
   ```sh
   set -a; . /etc/dlsauto/backup.env; set +a; deploy/backup.sh
   ```

## 10. GitHub Secrets для workflow деплоя

Сборка и пуш образов идут в GitHub Actions. Нужны секреты репозитория:

- `DOKPLOY_STAGE_WEBHOOK` — URL деплой-вебхука stage-приложения из Dokploy
  (дёргается после пуша образа с тегом `stage`).
- `DOKPLOY_PROD_WEBHOOK` — URL деплой-вебхука prod-приложения из Dokploy.
- Для пуша в GHCR отдельный секрет не нужен — используется встроенный
  `GITHUB_TOKEN` (дай workflow права `packages: write`).

После пуша в соответствующую ветку CI собирает образы, пушит в GHCR и
дёргает вебхук Dokploy — тот тянет свежий образ и перезапускает приложение.

---

### Краткий чек-лист

- [ ] VPS Ubuntu 22.04, root-доступ
- [ ] DNS: A `@` и `stage` → IP, Proxied, SSL Full (strict)
- [ ] `server-setup.sh` отработал, SSH-ключ `deploy` установлен
- [ ] Dokploy открыт, GHCR-реестр подключён (PAT `read:packages`)
- [ ] Приложения stage и prod созданы из `deploy/dokploy/*.compose.yml`
- [ ] Env заданы (см. `.env.example`), разные для stage/prod
- [ ] Первый деплой прошёл, `/api/health` → ok + версия
- [ ] Cron на `backup.sh` настроен, тестовый прогон удачен
- [ ] GitHub Secrets (`DOKPLOY_STAGE_WEBHOOK`, `DOKPLOY_PROD_WEBHOOK`) заданы
