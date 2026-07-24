#!/usr/bin/env bash
set -euo pipefail

# Install the versioned operational assets after explicit root authorization.
ENVIRONMENT="${1:?environment is required: test or prod}"
REPO_ROOT="${2:-/opt/quiz/repo}"
DEPLOY_USER="${QUIZ_DEPLOY_USER:-deploy}"
DEPLOY_GROUP="${QUIZ_DEPLOY_GROUP:-deploy}"

[[ "$ENVIRONMENT" == "test" || "$ENVIRONMENT" == "prod" ]] || {
  echo "Environment must be test or prod." >&2
  exit 80
}
[[ "$(id -u)" -eq 0 ]] || {
  echo "This script must run as root." >&2
  exit 81
}
[[ -d "$REPO_ROOT/ops" ]] || {
  echo "Versioned ops assets are missing from $REPO_ROOT." >&2
  exit 82
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
install -d -m 0750 -o root -g "$DEPLOY_GROUP" /opt/quiz/ops
install -d -m 0750 -o "$DEPLOY_USER" -g "$DEPLOY_GROUP" /opt/quiz/nginx
install -d -m 0750 -o root -g root /opt/quiz/backups/config

install -m 0750 -o root -g "$DEPLOY_GROUP" \
  "$REPO_ROOT/ops/scripts/quiz-healthcheck.sh" \
  /opt/quiz/ops/quiz-healthcheck.sh
install -m 0750 -o root -g "$DEPLOY_GROUP" \
  "$SCRIPT_DIR/backup-rds-runtime.sh" \
  /opt/quiz/ops/backup-rds-runtime.sh
install -m 0750 -o root -g root \
  "$REPO_ROOT/ops/scripts/quiz-nginx-apply.sh" \
  /usr/local/sbin/quiz-nginx-apply
install -m 0644 -o root -g root \
  "$REPO_ROOT/ops/logrotate/quiz-pm2" \
  /etc/logrotate.d/quiz-pm2

for unit in \
  quiz-rds-backup.service \
  quiz-rds-backup.timer \
  quiz-healthcheck.service \
  quiz-healthcheck.timer; do
  install -m 0644 -o root -g root \
    "$REPO_ROOT/ops/systemd/$unit" \
    "/etc/systemd/system/$unit"
done

# Bind the shared backup service to the explicitly selected runtime environment.
install -d -m 0755 -o root -g root \
  /etc/systemd/system/quiz-rds-backup.service.d
cat > /etc/systemd/system/quiz-rds-backup.service.d/environment.conf <<EOF
[Service]
ExecStart=
ExecStart=/bin/bash /opt/quiz/ops/backup-rds-runtime.sh scheduled "" $ENVIRONMENT
EOF
chmod 0644 /etc/systemd/system/quiz-rds-backup.service.d/environment.conf

cat > /etc/sudoers.d/quiz-deploy-ops <<EOF
$DEPLOY_USER ALL=(root) NOPASSWD: /usr/local/sbin/quiz-nginx-apply
EOF
chmod 0440 /etc/sudoers.d/quiz-deploy-ops
/usr/sbin/visudo -cf /etc/sudoers.d/quiz-deploy-ops >/dev/null

/usr/sbin/logrotate -d /etc/logrotate.conf >/dev/null
/usr/bin/systemctl daemon-reload
/usr/bin/systemctl enable --now quiz-rds-backup.timer quiz-healthcheck.timer

echo "ops_baseline=installed environment=$ENVIRONMENT"
