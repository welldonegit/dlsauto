#!/usr/bin/env bash
#
# DLSAuto — ежедневный бэкап (запускается из cron).
#
# Делает:
#   1) pg_dump базы в gzip с таймстампом во временный каталог;
#   2) заливает дамп и каталог медиа в Cloudflare R2 через rclone;
#   3) ротация: удаляет из R2 бэкапы старше ${BACKUP_RETENTION_DAYS} дней;
#   4) при ЛЮБОЙ ошибке шлёт алерт в Telegram и завершается с ненулевым кодом.
#
# Конфигурация берётся из окружения (переменные из .env.example). Запускать с
# подгруженным env-файлом (см. crontab-блок внизу).
#
set -euo pipefail

# ---------------------------------------------------------------------------
# config (из env)
# ---------------------------------------------------------------------------
RCLONE_REMOTE="${RCLONE_REMOTE:-}"
R2_BUCKET="${R2_BUCKET:-}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
MEDIA_DIR="${MEDIA_DIR:-/data/media}"
TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
TELEGRAM_CHAT_ID="${TELEGRAM_CHAT_ID:-}"
DATABASE_URL="${DATABASE_URL:-}"

TMP_DIR=""

log() {
  printf '[backup %s] %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*"
}

# ---------------------------------------------------------------------------
# алерт в Telegram + очистка (срабатывает на любой ошибке через trap)
# ---------------------------------------------------------------------------
notify_failure() {
  local exit_code=$?
  local line_no="${1:-?}"
  local msg="DLSAuto backup FAILED (exit ${exit_code}, line ${line_no}) on $(hostname) at $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  log "${msg}"

  if [ -n "${TELEGRAM_BOT_TOKEN}" ] && [ -n "${TELEGRAM_CHAT_ID}" ]; then
    curl -fsS --max-time 20 \
      -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
      --data-urlencode "chat_id=${TELEGRAM_CHAT_ID}" \
      --data-urlencode "text=${msg}" >/dev/null 2>&1 || \
      log "Не удалось отправить алерт в Telegram"
  else
    log "TELEGRAM_BOT_TOKEN/CHAT_ID не заданы — алерт не отправлен"
  fi

  cleanup
  exit "${exit_code}"
}

cleanup() {
  if [ -n "${TMP_DIR}" ] && [ -d "${TMP_DIR}" ]; then
    rm -rf "${TMP_DIR}"
  fi
}

# ERR отлавливает любую упавшую команду (set -e); передаём номер строки
trap 'notify_failure "${LINENO}"' ERR

# ---------------------------------------------------------------------------
# валидация обязательных переменных
# ---------------------------------------------------------------------------
require_vars() {
  local missing=""
  local v
  for v in RCLONE_REMOTE R2_BUCKET DATABASE_URL MEDIA_DIR; do
    if [ -z "${!v}" ]; then
      missing="${missing} ${v}"
    fi
  done
  if [ -n "${missing}" ]; then
    log "Не заданы обязательные переменные:${missing}"
    exit 1
  fi
  if ! command -v rclone >/dev/null 2>&1; then
    log "rclone не установлен"
    exit 1
  fi
  if ! command -v pg_dump >/dev/null 2>&1; then
    log "pg_dump не установлен (нужен postgresql-client)"
    exit 1
  fi
}

# ---------------------------------------------------------------------------
# шаги
# ---------------------------------------------------------------------------
do_dump() {
  local ts dump_file
  ts="$(date -u +%Y%m%d-%H%M%S)"
  TMP_DIR="$(mktemp -d /tmp/dlsauto-backup.XXXXXX)"
  dump_file="${TMP_DIR}/dlsauto-${ts}.sql.gz"

  log "pg_dump → ${dump_file}"
  pg_dump --no-owner --no-privileges "${DATABASE_URL}" | gzip -9 > "${dump_file}"

  # вернуть путь через глобал
  DUMP_FILE="${dump_file}"
}

do_upload() {
  log "Заливаю дамп в ${RCLONE_REMOTE}:${R2_BUCKET}/db/"
  rclone copy "${DUMP_FILE}" "${RCLONE_REMOTE}:${R2_BUCKET}/db/" \
    --s3-no-check-bucket

  if [ -d "${MEDIA_DIR}" ]; then
    log "Синхронизирую медиа ${MEDIA_DIR} → ${RCLONE_REMOTE}:${R2_BUCKET}/media/"
    rclone sync "${MEDIA_DIR}" "${RCLONE_REMOTE}:${R2_BUCKET}/media/" \
      --s3-no-check-bucket
  else
    log "Каталог медиа ${MEDIA_DIR} не найден — пропуск медиа"
  fi
}

do_rotate() {
  log "Ротация: удаляю дампы старше ${BACKUP_RETENTION_DAYS} дней"
  # Ротируем только дампы в db/. Медиа — зеркало (sync), не версионируется.
  rclone delete "${RCLONE_REMOTE}:${R2_BUCKET}/db/" \
    --min-age "${BACKUP_RETENTION_DAYS}d"
}

# ---------------------------------------------------------------------------
# main
# ---------------------------------------------------------------------------
main() {
  require_vars
  do_dump
  do_upload
  do_rotate
  cleanup
  log "Бэкап успешно завершён"
}

main "$@"

# ===========================================================================
# CRON: запуск ежедневно в 03:30.
#
# backup.sh опирается на переменные окружения, поэтому env-файл нужно
# подгрузить перед запуском. Положите секреты в /etc/dlsauto/backup.env
# (chmod 600, owner deploy) и добавьте строку в crontab пользователя deploy:
#
#   crontab -e
#
#   30 3 * * * set -a; . /etc/dlsauto/backup.env; set +a; /opt/dlsauto/deploy/backup.sh >> /var/log/dlsauto-backup.log 2>&1
#
# Пояснение: `set -a` экспортирует все переменные из backup.env в окружение
# скрипта. Пути (/opt/dlsauto/...) приведите под фактическое расположение репо.
# ===========================================================================
