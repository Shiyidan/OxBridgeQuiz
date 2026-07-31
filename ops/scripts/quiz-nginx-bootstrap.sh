#!/usr/bin/env bash
set -euo pipefail

# Install the initial test Nginx site only when no active QuizTestDemo site exists.
ENVIRONMENT="${1:?environment is required}"
REPO_ROOT="${2:-/opt/quiz/repo}"
TARGET="/etc/nginx/sites-available/quiztestdemo"
ENABLED="/etc/nginx/sites-enabled/quiztestdemo"
DEFAULT_ENABLED="/etc/nginx/sites-enabled/default"

[[ "$ENVIRONMENT" == "test" ]] || {
  echo "Initial Nginx bootstrap is supported only for test." >&2
  exit 70
}
[[ "$(id -u)" -eq 0 ]] || {
  echo "This script must run as root." >&2
  exit 71
}
[[ -f "$REPO_ROOT/ops/nginx/quiztestdemo-test.conf" ]] || {
  echo "Test Nginx template is missing from $REPO_ROOT." >&2
  exit 72
}
[[ ! -e "$TARGET" && ! -e "$ENABLED" ]] || {
  echo "An active QuizTestDemo Nginx site already exists; use the guarded Nginx apply flow instead." >&2
  exit 73
}

install -m 0644 -o root -g root "$REPO_ROOT/ops/nginx/quiztestdemo-test.conf" "$TARGET"
ln -s "$TARGET" "$ENABLED"
rm -f "$DEFAULT_ENABLED"

if ! /usr/sbin/nginx -t; then
  rm -f "$ENABLED" "$TARGET"
  /usr/sbin/nginx -t
  echo "Initial Nginx configuration failed validation and was removed." >&2
  exit 74
fi

/usr/bin/systemctl enable --now nginx
/usr/bin/systemctl reload nginx
echo "nginx_bootstrap=installed environment=test"
