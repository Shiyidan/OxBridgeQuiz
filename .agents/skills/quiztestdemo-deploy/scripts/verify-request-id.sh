#!/usr/bin/env bash
set -euo pipefail

HEALTH_URL="${1:-http://127.0.0.1/api/health}"
PROCESS_NAME="${2:-quiz-api}"
HEADERS_FILE="$(mktemp)"
BODY_FILE="$(mktemp)"
PM2_FILE="$(mktemp)"

cleanup() {
  rm -f "$HEADERS_FILE" "$BODY_FILE" "$PM2_FILE"
}
trap cleanup EXIT

curl -sS -D "$HEADERS_FILE" -o "$BODY_FILE" "$HEALTH_URL"
REQUEST_ID="$(sed -n 's/^[Xx]-[Rr]equest-[Ii][Dd]:[[:space:]]*//p' "$HEADERS_FILE" | tr -d '\r' | tail -n 1)"

if [[ -z "$REQUEST_ID" ]]; then
  echo "X-Request-ID was not returned by $HEALTH_URL" >&2
  exit 46
fi

pm2 jlist > "$PM2_FILE"
mapfile -t LOG_PATHS < <(node - "$PM2_FILE" "$PROCESS_NAME" <<'NODE'
const fs = require('fs')
const processes = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'))
const processName = process.argv[3]
const item = processes.find((entry) => entry.name === processName)
if (!item) process.exit(2)
for (const value of [item.pm2_env?.pm_out_log_path, item.pm2_env?.pm_err_log_path]) {
  if (value) console.log(value)
}
NODE
)

if [[ "${#LOG_PATHS[@]}" -eq 0 ]]; then
  echo "PM2 log paths were not found for $PROCESS_NAME" >&2
  exit 47
fi

for log_path in "${LOG_PATHS[@]}"; do
  if [[ -f "$log_path" ]] && grep -Fq "$REQUEST_ID" "$log_path"; then
    echo "request_id=$REQUEST_ID"
    echo "runtime_log=$log_path"
    cat "$BODY_FILE"
    echo
    exit 0
  fi
done

echo "Request ID $REQUEST_ID was not found in PM2 logs: ${LOG_PATHS[*]}" >&2
exit 48
