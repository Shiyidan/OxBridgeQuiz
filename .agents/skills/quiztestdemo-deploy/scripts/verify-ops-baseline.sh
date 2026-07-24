#!/usr/bin/env bash
set -euo pipefail

# Verify the installed operational baseline without mutating application data.
ENVIRONMENT="${1:?environment is required: test or prod}"
[[ "$ENVIRONMENT" == "test" || "$ENVIRONMENT" == "prod" ]] || {
  echo "Environment must be test or prod." >&2
  exit 90
}

echo "--- identity ---"
date '+time=%Y-%m-%d %H:%M:%S %z'
id

echo "--- sudo-boundary ---"
sudo -n -l
if sudo -n true 2>/dev/null; then
  echo "unexpected_broad_passwordless_sudo=yes" >&2
  exit 91
fi
echo "unexpected_broad_passwordless_sudo=no"

echo "--- timers ---"
systemctl is-enabled quiz-rds-backup.timer quiz-healthcheck.timer
systemctl is-active quiz-rds-backup.timer quiz-healthcheck.timer
systemctl list-timers --all --no-pager |
  grep -E 'quiz-rds-backup|quiz-healthcheck'

echo "--- healthcheck ---"
bash /opt/quiz/ops/quiz-healthcheck.sh

echo "--- logrotate ---"
test -f /etc/logrotate.d/quiz-pm2
systemctl is-enabled logrotate.timer
systemctl is-active logrotate.timer

echo "--- latest-backup-integrity ---"
latest_dump="$(find /opt/quiz/backups/mysql -maxdepth 1 -type f -name '*.sql.gz' \
  -printf '%T@ %p\n' 2>/dev/null |
  sort -n |
  tail -n 1 |
  cut -d' ' -f2-)"
[[ -n "$latest_dump" ]] || {
  echo "No logical database backup was found." >&2
  exit 92
}
gzip -t "$latest_dump"

echo "--- final-health ---"
curl -fsS http://127.0.0.1:3001/api/health
echo
curl -fsS http://127.0.0.1/api/health
echo
echo "ops_baseline=verified environment=$ENVIRONMENT"

