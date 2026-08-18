#!/usr/bin/env bash
set -euo pipefail

EXAMPLE_ENV="${1:-/opt/quiz/repo/api/.env.example}"
RUNTIME_ENV="${2:-/opt/quiz/api/.env}"
MODE="${3:-check}"

[[ -f "$EXAMPLE_ENV" ]] || { echo "env example not found: $EXAMPLE_ENV" >&2; exit 2; }
[[ -f "$RUNTIME_ENV" ]] || { echo "runtime env not found: $RUNTIME_ENV" >&2; exit 2; }

# 只输出缺失的配置键名，绝不打印运行环境中的配置值或密钥。
node - "$EXAMPLE_ENV" "$RUNTIME_ENV" "$MODE" <<'NODE'
const fs = require('fs')

const SAFE_DEFAULT_KEYS = new Set([
  'JWT_ISSUER',
  'JWT_AUDIENCE',
  'ACCESS_TOKEN_TTL_SECONDS',
  'REFRESH_TOKEN_TTL_SECONDS',
  'EMAIL_CODE_TTL_SECONDS',
  'EMAIL_CODE_RESEND_SECONDS',
  'EMAIL_CODE_MAX_ATTEMPTS',
  'STUDY_RESOURCE_MAX_FILE_SIZE_MB',
  'CHINAUMS_ORDER_DESCRIPTION',
  'CHINAUMS_TIMEOUT_MS',
  'CHINAUMS_ORDER_EXPIRE_MINUTES',
])

function entries(file) {
  const result = new Map()
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=/)
    if (match) result.set(match[1], line)
  }
  return result
}

const exampleEntries = entries(process.argv[2])
const runtimeEntries = entries(process.argv[3])
const mode = process.argv[4]
let missing = [...exampleEntries.keys()].filter((key) => !runtimeEntries.has(key)).sort()

if (mode === '--merge-safe-defaults') {
  const mergeable = missing.filter((key) => SAFE_DEFAULT_KEYS.has(key))
  if (mergeable.length) {
    const lines = mergeable.map((key) => exampleEntries.get(key))
    fs.appendFileSync(
      process.argv[3],
      `\n# Defaults merged by quiztestdemo-deploy (${new Date().toISOString()})\n${lines.join('\n')}\n`,
      { encoding: 'utf8', mode: 0o600 },
    )
    console.log(`Merged safe default keys: ${mergeable.join(', ')}`)
    missing = missing.filter((key) => !SAFE_DEFAULT_KEYS.has(key))
  }
}

if (missing.length) {
  console.error('Runtime .env is missing keys introduced by api/.env.example:')
  for (const key of missing) console.error(`- ${key}`)
  console.error('Merge safe values into /opt/quiz/api/.env, then rerun deployment.')
  process.exit(43)
}

console.log(`Runtime .env key guard passed (${entries(process.argv[3]).size} keys).`)
NODE
