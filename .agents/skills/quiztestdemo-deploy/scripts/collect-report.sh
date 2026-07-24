#!/usr/bin/env bash
set -euo pipefail

ENVIRONMENT="${1:-}"
SCOPE="${2:-unknown}"
BRANCH="${3:-unknown}"
EXPECTED_DATABASE="${4:-}"
PUBLIC_URL="${5:-}"

case "$ENVIRONMENT" in
  test|prod) ;;
  *)
    echo "Usage: bash collect-report.sh <test|prod> <frontend|backend|all> <git-branch> <expected-database> <public-url>" >&2
    exit 2
    ;;
esac

if [[ ! "$EXPECTED_DATABASE" =~ ^[A-Za-z0-9_-]+$ ]]; then
  echo "Invalid expected database name." >&2
  exit 2
fi

if [[ ! "$PUBLIC_URL" =~ ^https?://[A-Za-z0-9.-]+(:[0-9]+)?$ ]]; then
  echo "Invalid public URL." >&2
  exit 2
fi

echo "--- deploy-meta ---"
echo "environment=${ENVIRONMENT}"
echo "scope=${SCOPE}"
echo "branch=${BRANCH}"
echo "public_url=${PUBLIC_URL}"
echo "expected_database=${EXPECTED_DATABASE}"
date '+time=%Y-%m-%d %H:%M:%S %z'

echo "--- git ---"
cd /opt/quiz/repo
git branch --show-current
git rev-parse --short HEAD
git log -1 --format='%h %ci %s'

echo "--- structure ---"
find /opt/quiz -maxdepth 2 -type d | sort

echo "--- timestamps ---"
stat -c '%y %n' \
  /opt/quiz/repo \
  /opt/quiz/api/dist/index.js \
  /opt/quiz/web/dist/index.html \
  /opt/quiz/ecosystem.config.cjs \
  /etc/nginx/sites-available/quiz 2>/dev/null || true

echo "--- health-local-api ---"
curl -sS http://127.0.0.1:3001/api/health
echo

echo "--- health-local-nginx ---"
curl -sS http://127.0.0.1/api/health
echo

echo "--- disk ---"
df -h /
du -sh /opt/quiz /opt/quiz/repo /opt/quiz/api /opt/quiz/web /opt/quiz/data /opt/quiz/backups 2>/dev/null || true

echo "--- memory ---"
free -h

echo "--- cpu-load-uptime ---"
uptime
nproc

echo "--- ports ---"
ss -ltnp 2>/dev/null | grep -E ':80|:443|:3001' || true

echo "--- pm2 ---"
pm2 status --no-color

echo "--- database ---"
find /opt/quiz/backups -maxdepth 2 -type f 2>/dev/null | sort | tail -n 50 | xargs -r ls -lh
node - /opt/quiz/api/.env "$ENVIRONMENT" "$EXPECTED_DATABASE" <<'NODE'
const fs = require('fs')

const values = {}
for (const line of fs.readFileSync(process.argv[2], 'utf8').split(/\r?\n/)) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const index = trimmed.indexOf('=')
  if (index <= 0) continue
  const key = trimmed.slice(0, index).trim()
  let value = trimmed.slice(index + 1).trim()
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1)
  }
  values[key] = value
}

const environment = values.API_RUNTIME_ENV || '<missing>'
let database = '<invalid>'
try {
  database = decodeURIComponent(new URL(values.DATABASE_URL).pathname.replace(/^\//, ''))
} catch {}

console.log(`runtime environment: ${environment}`)
console.log(`runtime database: RDS MySQL ${database}`)
console.log(`target match: ${environment === process.argv[3] && database === process.argv[4] ? 'yes' : 'no'}`)
NODE

echo "--- migrations-status ---"
cd /opt/quiz/repo/api
cp /opt/quiz/api/.env .env
npx prisma migrate status
