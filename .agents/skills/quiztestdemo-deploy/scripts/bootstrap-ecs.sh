#!/usr/bin/env bash
set -euo pipefail

# Prepare a new Ubuntu ECS host without creating or printing application secrets.
ENVIRONMENT="${1:?environment is required: test or prod}"
DEPLOY_USER="${QUIZ_DEPLOY_USER:-deploy}"
SWAP_GIB="${QUIZ_SWAP_GIB:-2}"

[[ "$ENVIRONMENT" == "test" || "$ENVIRONMENT" == "prod" ]] || {
  echo "Environment must be test or prod." >&2
  exit 60
}
[[ "$(id -u)" -eq 0 ]] || {
  echo "This script must run as root." >&2
  exit 61
}
[[ "$DEPLOY_USER" =~ ^[a-z_][a-z0-9_-]*$ ]] || {
  echo "Invalid deployment user." >&2
  exit 62
}
[[ "$SWAP_GIB" =~ ^[1-9][0-9]*$ ]] || {
  echo "QUIZ_SWAP_GIB must be a positive integer." >&2
  exit 63
}
command -v apt-get >/dev/null || {
  echo "This bootstrap script currently supports Ubuntu/Debian apt hosts only." >&2
  exit 64
}

export DEBIAN_FRONTEND=noninteractive

# Install the operating-system and Node.js prerequisites needed by guarded deployment.
apt-get update
apt-get install -y ca-certificates curl gnupg git nginx rsync
install -d -m 0755 /etc/apt/keyrings
if [[ ! -s /etc/apt/keyrings/nodesource.gpg ]]; then
  curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
fi
printf '%s\n' 'deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main' > /etc/apt/sources.list.d/nodesource.list
apt-get update
apt-get install -y nodejs

NODE_MAJOR="$(node --version | sed -E 's/^v([0-9]+).*/\1/')"
[[ "$NODE_MAJOR" == "20" ]] || {
  echo "Node.js 20 is required; found $(node --version)." >&2
  exit 65
}
npm install -g pm2

# Ensure a non-interactive deployment identity and the standard runtime directories exist.
if ! id "$DEPLOY_USER" >/dev/null 2>&1; then
  adduser --disabled-password --gecos '' "$DEPLOY_USER"
fi
install -d -o "$DEPLOY_USER" -g "$DEPLOY_USER" -m 0755 \
  /opt/quiz/repo \
  /opt/quiz/api \
  /opt/quiz/web \
  /opt/quiz/web/dist \
  /opt/quiz/uploads \
  /opt/quiz/backups
install -d -o "$DEPLOY_USER" -g "$DEPLOY_USER" -m 0775 /var/log/quiz

# Add swap only when the standard file is not already active; never overwrite an existing swap file.
if ! swapon --noheadings --show=NAME | awk '{print $1}' | grep -qx '/swapfile'; then
  [[ ! -e /swapfile ]] || {
    echo "/swapfile exists but is not active; inspect it before bootstrap continues." >&2
    exit 66
  }
  fallocate -l "${SWAP_GIB}G" /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
fi
grep -qxF '/swapfile none swap sw 0 0' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
printf '%s\n' 'vm.swappiness=10' > /etc/sysctl.d/99-quiztest-swap.conf
sysctl --system >/dev/null

printf 'bootstrap=complete environment=%s node=%s npm=%s pm2=%s swap=%s\n' \
  "$ENVIRONMENT" "$(node --version)" "$(npm --version)" "$(pm2 --version | tail -n 1)" "$(swapon --noheadings --show=SIZE | tr -d ' ')"
