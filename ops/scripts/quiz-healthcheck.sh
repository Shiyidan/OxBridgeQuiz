#!/usr/bin/env bash
set -euo pipefail

API_HEALTH_URL="${API_HEALTH_URL:-http://127.0.0.1:3001/api/health}"
NGINX_HEALTH_URL="${NGINX_HEALTH_URL:-http://127.0.0.1/api/health}"
PROCESS_NAME="${PROCESS_NAME:-quiz-api}"
DISK_THRESHOLD="${DISK_THRESHOLD:-85}"

curl -fsS --max-time 10 "$API_HEALTH_URL" >/dev/null
curl -fsS --max-time 10 "$NGINX_HEALTH_URL" >/dev/null

pm2 jlist | node -e '
let input = ""
process.stdin.on("data", (chunk) => {
  input += chunk
})
process.stdin.on("end", () => {
  const processName = process.argv[1]
  const items = JSON.parse(input)
  const api = items.find((item) => item.name === processName)
  if (!api || api.pm2_env?.status !== "online") process.exit(1)
})
' "$PROCESS_NAME"

usage="$(df -P / | awk 'NR == 2 { gsub("%", "", $5); print $5 }')"
if [[ -z "$usage" || "$usage" -ge "$DISK_THRESHOLD" ]]; then
  echo "Root filesystem usage is ${usage:-unknown}% (threshold=${DISK_THRESHOLD}%)." >&2
  exit 2
fi
