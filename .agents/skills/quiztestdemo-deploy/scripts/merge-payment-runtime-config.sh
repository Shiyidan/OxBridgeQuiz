#!/usr/bin/env bash
set -euo pipefail

EXPECTED_ENV="${1:-}"
RUNTIME_ENV="${2:-/opt/quiz/api/.env}"
BACKUP_ROOT="${3:-/opt/quiz/backups/config}"
STAMP="${4:-$(date +%Y%m%d_%H%M%S)}"

[[ "$EXPECTED_ENV" == "test" || "$EXPECTED_ENV" == "prod" ]] || {
  echo "expected environment must be test or prod" >&2
  exit 2
}
[[ -f "$RUNTIME_ENV" ]] || {
  echo "runtime env not found: $RUNTIME_ENV" >&2
  exit 2
}

OVERLAY_FILE="$(mktemp)"
MERGED_FILE="$(mktemp)"
cleanup() {
  rm -f "$OVERLAY_FILE" "$MERGED_FILE"
}
trap cleanup EXIT
chmod 600 "$OVERLAY_FILE" "$MERGED_FILE"
cat > "$OVERLAY_FILE"

# 支付参数仅允许从私有覆盖文件合并；脚本只输出键名，不输出任何配置值。
node - "$EXPECTED_ENV" "$RUNTIME_ENV" "$OVERLAY_FILE" "$MERGED_FILE" <<'NODE'
const fs = require('fs')

const expectedEnv = process.argv[2]
const runtimeFile = process.argv[3]
const overlayFile = process.argv[4]
const mergedFile = process.argv[5]

const allowedKeys = new Set([
  'CHINAUMS_ENABLED',
  'CHINAUMS_ENV',
  'CHINAUMS_BASE_URL',
  'CHINAUMS_APP_ID',
  'CHINAUMS_APP_KEY',
  'CHINAUMS_MID',
  'CHINAUMS_EXPECTED_MID',
  'CHINAUMS_TID',
  'CHINAUMS_INST_MID',
  'CHINAUMS_MSG_SRC_ID',
  'CHINAUMS_COMMUNICATION_KEY',
  'CHINAUMS_NOTIFY_URL',
  'CHINAUMS_RETURN_URL',
  'CHINAUMS_ORDER_DESCRIPTION',
  'CHINAUMS_TIMEOUT_MS',
  'CHINAUMS_ORDER_EXPIRE_MINUTES',
  'PAYMENT_PURCHASE_ALLOWED_EMAILS',
  'PAYMENT_LIFECYCLE_ENABLED',
  'PAYMENT_LIFECYCLE_POLL_INTERVAL_MS',
  'PAYMENT_LIFECYCLE_LEASE_MS',
  'PAYMENT_LIFECYCLE_BATCH_SIZE',
  'PAYMENT_PENDING_QUERY_AGE_SECONDS',
  'PAYMENT_REFUND_QUERY_AGE_SECONDS',
  'PAYMENT_RECONCILIATION_ENABLED',
  'PAYMENT_RECONCILIATION_HOUR',
  'PAYMENT_RECONCILIATION_BATCH_SIZE',
])

function entries(text) {
  const result = new Map()
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=(.*)$/)
    if (match) result.set(match[1], { line, rawValue: match[2].trim() })
  }
  return result
}

function unquote(value) {
  if (
    (value.startsWith('"') && value.endsWith('"'))
    || (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1)
  }
  return value
}

const runtimeText = fs.readFileSync(runtimeFile, 'utf8')
const runtimeEntries = entries(runtimeText)
if (unquote(runtimeEntries.get('API_RUNTIME_ENV')?.rawValue || '') !== expectedEnv) {
  console.error('runtime environment guard failed')
  process.exit(49)
}

const overlayEntries = entries(fs.readFileSync(overlayFile, 'utf8'))
if (overlayEntries.size === 0) {
  console.error('payment runtime overlay is empty')
  process.exit(2)
}

for (const key of overlayEntries.keys()) {
  if (!allowedKeys.has(key)) {
    console.error(`payment runtime overlay contains unsupported key: ${key}`)
    process.exit(2)
  }
}

if (unquote(overlayEntries.get('CHINAUMS_ENV')?.rawValue || '') !== expectedEnv) {
  console.error('ChinaUMS environment does not match the selected runtime environment')
  process.exit(49)
}

const overlayKeys = new Set(overlayEntries.keys())
const retainedLines = runtimeText
  .split(/\r?\n/)
  .filter((line) => {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=/)
    return !match || !overlayKeys.has(match[1])
  })

while (retainedLines.length && retainedLines.at(-1) === '') retainedLines.pop()
retainedLines.push(
  '',
  `# Payment runtime config merged by quiztestdemo-deploy (${new Date().toISOString()})`,
  ...[...overlayEntries.values()].map(({ line }) => line),
  '',
)
fs.writeFileSync(mergedFile, retainedLines.join('\n'), { encoding: 'utf8', mode: 0o600 })
console.log(`Validated payment runtime keys: ${[...overlayKeys].sort().join(', ')}`)
NODE

mkdir -p "$BACKUP_ROOT"
BACKUP_FILE="$BACKUP_ROOT/runtime-env-before-payment-config-$STAMP.tar.gz"
tar -czf "$BACKUP_FILE" -C "$(dirname "$RUNTIME_ENV")" "$(basename "$RUNTIME_ENV")"
chmod 600 "$BACKUP_FILE"
install -m 600 "$MERGED_FILE" "$RUNTIME_ENV"

echo "Payment runtime config merged without printing values."
echo "Runtime config backup: $BACKUP_FILE"
