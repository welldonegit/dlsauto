#!/usr/bin/env bash
#
# DLSAuto — первичная настройка чистого сервера Ubuntu 22.04.
#
# Запускать ОДИН раз на свежем VPS (Hostpro NVMe) от root:
#   bash server-setup.sh
#
# Скрипт идемпотентный: каждый шаг проверяет «уже сделано» перед действием,
# повторный запуск безопасен.
#
# ВАЖНО (безопасность SSH):
#   Перед тем как скрипт отключит парольную аутентификацию, у пользователя
#   `deploy` УЖЕ должен быть установлен SSH-ключ в ~deploy/.ssh/authorized_keys,
#   иначе вы потеряете доступ к серверу. См. финальную сводку.
#
set -euo pipefail

DEPLOY_USER="deploy"
MEDIA_DIR="/data/media"
SSHD_HARDENING_FILE="/etc/ssh/sshd_config.d/99-hardening.conf"

# ---------------------------------------------------------------------------
# helpers
# ---------------------------------------------------------------------------
log() {
  printf '\n\033[1;34m==> %s\033[0m\n' "$*"
}

warn() {
  printf '\033[1;33m[warn] %s\033[0m\n' "$*" >&2
}

require_root() {
  if [ "$(id -u)" -ne 0 ]; then
    printf '\033[1;31m[error] Этот скрипт нужно запускать от root (sudo).\033[0m\n' >&2
    exit 1
  fi
}

# ---------------------------------------------------------------------------
# steps
# ---------------------------------------------------------------------------
step_apt_update() {
  log "apt update + upgrade (non-interactive)"
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -y
  apt-get upgrade -y
  # базовые утилиты, которые понадобятся дальше
  apt-get install -y ca-certificates curl gnupg lsb-release ufw
}

step_create_deploy_user() {
  log "Создание пользователя '${DEPLOY_USER}' с sudo"
  if id "${DEPLOY_USER}" >/dev/null 2>&1; then
    log "Пользователь '${DEPLOY_USER}' уже существует — пропуск создания"
  else
    adduser --disabled-password --gecos "" "${DEPLOY_USER}"
  fi

  # добавить в группу sudo (идемпотентно)
  if id -nG "${DEPLOY_USER}" | tr ' ' '\n' | grep -qx "sudo"; then
    log "Пользователь уже в группе sudo"
  else
    usermod -aG sudo "${DEPLOY_USER}"
    log "Пользователь добавлен в группу sudo"
  fi

  # каталог ~/.ssh с правильными правами
  local ssh_dir="/home/${DEPLOY_USER}/.ssh"
  mkdir -p "${ssh_dir}"
  touch "${ssh_dir}/authorized_keys"
  chmod 700 "${ssh_dir}"
  chmod 600 "${ssh_dir}/authorized_keys"
  chown -R "${DEPLOY_USER}:${DEPLOY_USER}" "${ssh_dir}"
}

step_ssh_hardening() {
  log "Настройка SSH-харденинга (${SSHD_HARDENING_FILE})"
  # Напоминание: ключ для deploy должен быть установлен ДО отключения паролей.
  mkdir -p "$(dirname "${SSHD_HARDENING_FILE}")"

  local desired
  desired=$(cat <<'EOF'
# DLSAuto SSH hardening — managed by deploy/server-setup.sh
PasswordAuthentication no
PermitRootLogin prohibit-password
EOF
)

  if [ -f "${SSHD_HARDENING_FILE}" ] && [ "$(cat "${SSHD_HARDENING_FILE}")" = "${desired}" ]; then
    log "SSH-харденинг уже применён — пропуск"
    return 0
  fi

  printf '%s\n' "${desired}" > "${SSHD_HARDENING_FILE}"
  chmod 644 "${SSHD_HARDENING_FILE}"

  # Проверяем конфиг и перезагружаем sshd
  if sshd -t; then
    systemctl reload ssh 2>/dev/null || systemctl reload sshd 2>/dev/null || true
    log "sshd перезагружен с новым конфигом"
  else
    warn "sshd -t сообщил об ошибке конфигурации; sshd НЕ перезагружен"
  fi
}

step_ufw() {
  log "Настройка UFW (deny incoming, allow 22/80/443)"
  ufw allow 22/tcp
  ufw allow 80/tcp
  ufw allow 443/tcp
  ufw default deny incoming
  ufw default allow outgoing
  # --force, чтобы не было интерактивного запроса; enable идемпотентен
  ufw --force enable
  ufw status verbose || true
}

step_fail2ban() {
  log "Установка и запуск fail2ban"
  if ! dpkg -s fail2ban >/dev/null 2>&1; then
    apt-get install -y fail2ban
  else
    log "fail2ban уже установлен"
  fi
  systemctl enable fail2ban
  systemctl start fail2ban
}

step_unattended_upgrades() {
  log "Настройка автоматических обновлений безопасности (unattended-upgrades)"
  if ! dpkg -s unattended-upgrades >/dev/null 2>&1; then
    apt-get install -y unattended-upgrades
  else
    log "unattended-upgrades уже установлен"
  fi

  # Включаем периодические обновления идемпотентно
  cat > /etc/apt/apt.conf.d/20auto-upgrades <<'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
EOF

  systemctl enable unattended-upgrades
  systemctl start unattended-upgrades
}

step_docker() {
  log "Установка Docker Engine + compose plugin"
  if command -v docker >/dev/null 2>&1; then
    log "Docker уже установлен ($(docker --version)) — пропуск установки"
  else
    curl -fsSL https://get.docker.com -o /tmp/get-docker.sh
    sh /tmp/get-docker.sh
    rm -f /tmp/get-docker.sh
    systemctl enable docker
    systemctl start docker
  fi

  # deploy в группу docker (идемпотентно)
  if id -nG "${DEPLOY_USER}" | tr ' ' '\n' | grep -qx "docker"; then
    log "Пользователь '${DEPLOY_USER}' уже в группе docker"
  else
    usermod -aG docker "${DEPLOY_USER}"
    log "Пользователь '${DEPLOY_USER}' добавлен в группу docker (нужен релогин)"
  fi
}

step_media_dir() {
  log "Создание каталога для медиа: ${MEDIA_DIR}"
  mkdir -p "${MEDIA_DIR}"
  chown -R "${DEPLOY_USER}:${DEPLOY_USER}" "${MEDIA_DIR}"
  chmod 755 "${MEDIA_DIR}"
}

step_dokploy() {
  log "Установка Dokploy"
  # Проверяем по контейнеру/сервису dokploy
  if docker ps -a --format '{{.Names}}' 2>/dev/null | grep -qi "dokploy"; then
    log "Dokploy уже установлен (найден контейнер dokploy) — пропуск"
    return 0
  fi
  if systemctl list-units --all 2>/dev/null | grep -qi "dokploy"; then
    log "Dokploy уже установлен (найден systemd-сервис) — пропуск"
    return 0
  fi

  curl -sSL https://dokploy.com/install.sh | sh
}

print_summary() {
  cat <<EOF

\033[1;32m====================================================================\033[0m
\033[1;32m DLSAuto — первичная настройка сервера завершена.\033[0m
\033[1;32m====================================================================\033[0m

Что сделать дальше:

  1. УСТАНОВИТЬ SSH-КЛЮЧ для пользователя '${DEPLOY_USER}' (критично!):
       ssh-copy-id -i ~/.ssh/your_key.pub ${DEPLOY_USER}@<server-ip>
     или вручную добавьте публичный ключ в
       /home/${DEPLOY_USER}/.ssh/authorized_keys
     Парольный вход по SSH уже ОТКЛЮЧЁН — без ключа вы не войдёте.

  2. Проверить вход под '${DEPLOY_USER}' в НОВОЙ сессии (не закрывая текущую!):
       ssh ${DEPLOY_USER}@<server-ip>

  3. Открыть Dokploy UI в браузере:
       http://<server-ip>:3000
     и создать админ-аккаунт.

  4. Дальше — по инструкции deploy/README.md:
     подключить реестр GHCR, создать приложения stage/prod из
     deploy/dokploy/*.compose.yml, задать env, задеплоить.

  Примечание: членство '${DEPLOY_USER}' в группе docker применится после
  повторного входа (релогина).

EOF
}

# ---------------------------------------------------------------------------
# main
# ---------------------------------------------------------------------------
main() {
  require_root
  step_apt_update
  step_create_deploy_user
  step_ssh_hardening
  step_ufw
  step_fail2ban
  step_unattended_upgrades
  step_docker
  step_media_dir
  step_dokploy
  print_summary
}

main "$@"
