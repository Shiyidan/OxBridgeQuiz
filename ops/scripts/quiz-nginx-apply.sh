#!/usr/bin/env bash
set -euo pipefail

TARGET="${QUIZ_NGINX_TARGET:-}"
BACKUP_DIR="${QUIZ_NGINX_BACKUP_DIR:-/opt/quiz/backups/config}"

if [[ -z "$TARGET" ]]; then
  for candidate_target in \
    /etc/nginx/sites-available/quiztestdemo \
    /etc/nginx/sites-available/quiz; do
    if [[ -f "$candidate_target" ]]; then
      TARGET="$candidate_target"
      break
    fi
  done
fi

[[ -n "$TARGET" && -f "$TARGET" ]] || {
  echo "Active Nginx configuration was not found." >&2
  exit 91
}

CANDIDATE="${QUIZ_NGINX_CANDIDATE:-/opt/quiz/nginx/$(basename "$TARGET").candidate}"
[[ -f "$CANDIDATE" ]] || {
  echo "Nginx candidate was not found: $CANDIDATE" >&2
  exit 90
}

mkdir -p "$BACKUP_DIR"
BACKUP="$BACKUP_DIR/$(basename "$TARGET")-before-deploy-$(date +%Y%m%d_%H%M%S).conf"
install -m 0600 -o root -g root "$TARGET" "$BACKUP"
install -m 0644 -o root -g root "$CANDIDATE" "$TARGET"

if ! /usr/sbin/nginx -t; then
  install -m 0644 -o root -g root "$BACKUP" "$TARGET"
  /usr/sbin/nginx -t
  echo "Nginx validation failed; previous configuration restored." >&2
  exit 92
fi

if ! /usr/bin/systemctl reload nginx; then
  install -m 0644 -o root -g root "$BACKUP" "$TARGET"
  /usr/sbin/nginx -t
  /usr/bin/systemctl reload nginx
  echo "Nginx reload failed; previous configuration restored." >&2
  exit 93
fi

echo "Nginx candidate applied; backup=$BACKUP"
