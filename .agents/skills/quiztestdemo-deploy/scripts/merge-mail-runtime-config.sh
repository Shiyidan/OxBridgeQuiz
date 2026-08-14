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

# 邮件覆盖仅接受固定通道键，并校验发件身份；脚本不会输出任何凭据值。
node - "$EXPECTED_ENV" "$RUNTIME_ENV" "$OVERLAY_FILE" "$MERGED_FILE" <<'NODE'
const fs = require('fs')

const expectedEnv = process.argv[2]
const runtimeFile = process.argv[3]
const overlayFile = process.argv[4]
const mergedFile = process.argv[5]
const requiredKeys = [
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_SECURE',
  'SMTP_USER',
  'SMTP_PASS',
  'MAIL_FROM',
  'BULK_SMTP_HOST',
  'BULK_SMTP_PORT',
  'BULK_SMTP_SECURE',
  'BULK_SMTP_USER',
  'BULK_SMTP_PASS',
  'BULK_MAIL_FROM',
]
const allowedKeys = new Set(requiredKeys)

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

function mailbox(value) {
  const normalized = unquote(value).trim()
  return (normalized.match(/<([^<>]+)>/)?.[1] || normalized).trim().toLowerCase()
}

const runtimeText = fs.readFileSync(runtimeFile, 'utf8')
const runtimeEntries = entries(runtimeText)
if (unquote(runtimeEntries.get('API_RUNTIME_ENV')?.rawValue || '') !== expectedEnv) {
  console.error('runtime environment guard failed')
  process.exit(49)
}

const overlayEntries = entries(fs.readFileSync(overlayFile, 'utf8'))
for (const key of overlayEntries.keys()) {
  if (!allowedKeys.has(key)) {
    console.error(`mail runtime overlay contains unsupported key: ${key}`)
    process.exit(2)
  }
}
const missing = requiredKeys.filter((key) => !unquote(overlayEntries.get(key)?.rawValue || ''))
if (missing.length) {
  console.error(`mail runtime overlay is missing required keys: ${missing.join(', ')}`)
  process.exit(2)
}
if (
  mailbox(overlayEntries.get('SMTP_USER').rawValue) !== 'no-reply@mail.acemock.cn'
  || mailbox(overlayEntries.get('MAIL_FROM').rawValue) !== 'no-reply@mail.acemock.cn'
) {
  console.error('transactional mail must use no-reply@mail.acemock.cn')
  process.exit(2)
}
if (
  mailbox(overlayEntries.get('BULK_SMTP_USER').rawValue) !== 'news@mail.acemock.cn'
  || mailbox(overlayEntries.get('BULK_MAIL_FROM').rawValue) !== 'news@mail.acemock.cn'
) {
  console.error('bulk activity mail must use news@mail.acemock.cn')
  process.exit(2)
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
  `# Mail channel config merged by quiztestdemo-deploy (${new Date().toISOString()})`,
  ...requiredKeys.map((key) => overlayEntries.get(key).line),
  '',
)
fs.writeFileSync(mergedFile, retainedLines.join('\n'), { encoding: 'utf8', mode: 0o600 })
console.log(`Validated mail runtime keys: ${requiredKeys.join(', ')}`)
NODE

mkdir -p "$BACKUP_ROOT"
BACKUP_FILE="$BACKUP_ROOT/runtime-env-before-mail-config-$STAMP.tar.gz"
tar -czf "$BACKUP_FILE" -C "$(dirname "$RUNTIME_ENV")" "$(basename "$RUNTIME_ENV")"
chmod 600 "$BACKUP_FILE"
install -m 600 "$MERGED_FILE" "$RUNTIME_ENV"

echo "Mail runtime config merged without printing values."
echo "Runtime config backup: $BACKUP_FILE"
