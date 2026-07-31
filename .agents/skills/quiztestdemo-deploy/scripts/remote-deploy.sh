#!/usr/bin/env bash
set -euo pipefail

ENVIRONMENT="${1:-}"
SCOPE="${2:-}"
BRANCH="${3:-}"
EXPECTED_DATABASE="${4:-}"
SOURCE_BUNDLE="${DEPLOY_SOURCE_BUNDLE:-}"
EXPECTED_COMMIT="${DEPLOY_EXPECTED_COMMIT:-}"

if [[ -z "$ENVIRONMENT" || -z "$SCOPE" || -z "$BRANCH" || -z "$EXPECTED_DATABASE" ]]; then
  echo "Usage: bash remote-deploy.sh <test|prod> <frontend|backend|all> <git-branch> <expected-database>" >&2
  exit 2
fi

case "$ENVIRONMENT" in
  test)
    FRONTEND_BUILD_COMMAND=(npm run build-only:test)
    ;;
  prod)
    FRONTEND_BUILD_COMMAND=(npm run build-only)
    ;;
  *)
    echo "Invalid environment: $ENVIRONMENT. Expected test or prod." >&2
    exit 2
    ;;
esac

case "$SCOPE" in
  frontend|backend|all) ;;
  *)
    echo "Invalid scope: $SCOPE. Expected frontend, backend, or all." >&2
    exit 2
    ;;
esac

if [[ ! "$BRANCH" =~ ^[A-Za-z0-9._/-]+$ ]]; then
  echo "Invalid branch name: $BRANCH" >&2
  exit 2
fi

if [[ ! "$EXPECTED_DATABASE" =~ ^[A-Za-z0-9_-]+$ ]]; then
  echo "Invalid expected database name." >&2
  exit 2
fi

if [[ -n "$SOURCE_BUNDLE" || -n "$EXPECTED_COMMIT" ]]; then
  [[ -n "$SOURCE_BUNDLE" && -n "$EXPECTED_COMMIT" ]] || {
    echo "DEPLOY_SOURCE_BUNDLE and DEPLOY_EXPECTED_COMMIT must be provided together." >&2
    exit 2
  }
  [[ "$EXPECTED_COMMIT" =~ ^[0-9a-f]{40}$ ]] || {
    echo "DEPLOY_EXPECTED_COMMIT must be a full lowercase Git commit hash." >&2
    exit 2
  }
  [[ -f "$SOURCE_BUNDLE" ]] || {
    echo "Deployment source bundle not found: $SOURCE_BUNDLE" >&2
    exit 2
  }
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="/opt/quiz/repo"
API_RUNTIME="/opt/quiz/api"
WEB_RUNTIME="/opt/quiz/web/dist"
BACKUP_DIR="/opt/quiz/backups"
PM2_CONFIG_SOURCE="$REPO_DIR/ops/pm2/quiz-api.ecosystem.cjs"
PM2_CONFIG="/opt/quiz/ecosystem.config.cjs"
STAMP="$(date +%Y%m%d_%H%M%S)"

step() {
  echo
  echo "=== $1 ==="
}

wait_for_health() {
  local url="$1"
  local attempt
  for attempt in $(seq 1 15); do
    if curl -sS "$url"; then
      echo
      return 0
    fi
    echo "health check not ready: ${url} attempt=${attempt}/15" >&2
    sleep 2
  done
  return 1
}

run_with_env_file() {
  local env_file="$1"
  shift

  node - "$env_file" "$@" <<'NODE'
const fs = require('fs')
const { spawnSync } = require('child_process')

const envFile = process.argv[2]
const [command, ...args] = process.argv.slice(3)
const values = {}

for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
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

const result = spawnSync(command, args, {
  env: { ...process.env, ...values },
  stdio: 'inherit',
})

if (result.error) {
  console.error(`Failed to start guarded command: ${result.error.message}`)
  process.exit(1)
}
process.exit(result.status ?? 1)
NODE
}

assert_target_environment() {
  local env_file="$API_RUNTIME/.env"

  [[ -f "$env_file" ]] || {
    echo "Runtime env file not found: $env_file" >&2
    exit 44
  }

  node - "$env_file" "$ENVIRONMENT" "$EXPECTED_DATABASE" <<'NODE'
const fs = require('fs')

const envFile = process.argv[2]
const expectedEnvironment = process.argv[3]
const expectedDatabase = process.argv[4]
const values = {}

for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
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

const actualEnvironment = values.API_RUNTIME_ENV || ''
if (actualEnvironment !== expectedEnvironment) {
  console.error(
    `Deployment target mismatch: requested environment=${expectedEnvironment}, runtime API_RUNTIME_ENV=${actualEnvironment || '<missing>'}.`,
  )
  process.exit(49)
}

if (!values.DATABASE_URL) {
  console.error('Deployment target mismatch: DATABASE_URL is missing.')
  process.exit(49)
}

let actualDatabase = ''
try {
  actualDatabase = decodeURIComponent(new URL(values.DATABASE_URL).pathname.replace(/^\//, ''))
} catch {
  console.error('Deployment target mismatch: DATABASE_URL is invalid.')
  process.exit(49)
}

if (actualDatabase !== expectedDatabase) {
  console.error(
    `Deployment target mismatch: environment=${expectedEnvironment} requires database=${expectedDatabase}, runtime database=${actualDatabase || '<missing>'}.`,
  )
  process.exit(49)
}

console.log(`Target guard passed: environment=${actualEnvironment}, database=${actualDatabase}.`)
NODE
}

step "deploy start"
echo "environment=${ENVIRONMENT}"
echo "scope=${SCOPE}"
echo "branch=${BRANCH}"
echo "stamp=${STAMP}"

step "target environment guard"
assert_target_environment

step "git update"
cd "$REPO_DIR"
if [[ -n "$(git status --porcelain)" ]]; then
  echo "Repository has local changes; inspect and preserve them before deployment." >&2
  git status --short >&2
  exit 45
fi
if [[ -n "$SOURCE_BUNDLE" ]]; then
  git bundle verify "$SOURCE_BUNDLE"
  git fetch "$SOURCE_BUNDLE" "refs/heads/$BRANCH"
  git checkout "$BRANCH"
  git merge --ff-only FETCH_HEAD
  ACTUAL_COMMIT="$(git rev-parse HEAD)"
  if [[ "$ACTUAL_COMMIT" != "$EXPECTED_COMMIT" ]]; then
    echo "Bundle deployment commit mismatch: expected=$EXPECTED_COMMIT actual=$ACTUAL_COMMIT" >&2
    exit 46
  fi
  echo "Verified bundle commit: $ACTUAL_COMMIT"
else
  git fetch origin "$BRANCH"
  git checkout "$BRANCH"
  git pull --ff-only origin "$BRANCH"
fi
git rev-parse --short HEAD

if [[ "$SCOPE" == "backend" || "$SCOPE" == "all" ]]; then
  step "backend dependencies"
  cd "$REPO_DIR/api"
  npm ci

  step "prisma migration guard"
  run_with_env_file \
    "$API_RUNTIME/.env" \
    bash "$SCRIPT_DIR/check-prisma-migrations.sh" "$REPO_DIR/api" "/tmp/quiz_migrate_shadow_${STAMP}.db"

  step "runtime backup"
  mkdir -p "$BACKUP_DIR"
  if [[ -f "$SCRIPT_DIR/backup-rds-runtime.sh" ]]; then
    bash "$SCRIPT_DIR/backup-rds-runtime.sh" "before_deploy" "$STAMP" "$ENVIRONMENT"
  else
    echo "backup-rds-runtime.sh not found; aborting before database-impacting deployment." >&2
    exit 1
  fi

  step "runtime config guard"
  bash "$SCRIPT_DIR/check-runtime-config.sh" "$REPO_DIR/api/.env.example" "$API_RUNTIME/.env" --merge-safe-defaults
  cp "$API_RUNTIME/.env" .env
  API_ENV_FILE="$API_RUNTIME/.env" npm run validate:runtime

  step "backend migrate and build"
  npx prisma migrate deploy
  npx prisma generate
  npm run build

  step "backend runtime sync"
  rsync -a --delete dist/ "$API_RUNTIME/dist/"
  rsync -a --delete node_modules/ "$API_RUNTIME/node_modules/"
  cp package.json package-lock.json "$API_RUNTIME/"
  if [[ -d prompts ]]; then
    rsync -a --delete prompts/ "$API_RUNTIME/prompts/"
  fi
  [[ -f "$PM2_CONFIG_SOURCE" ]] || {
    echo "PM2 configuration template is missing: $PM2_CONFIG_SOURCE" >&2
    exit 47
  }
  install -m 0644 "$PM2_CONFIG_SOURCE" "$PM2_CONFIG"
  if pm2 describe quiz-api >/dev/null 2>&1; then
    pm2 reload "$PM2_CONFIG" --only quiz-api --update-env
  else
    pm2 start "$PM2_CONFIG" --only quiz-api --update-env
  fi
  pm2 save
fi

if [[ "$SCOPE" == "frontend" || "$SCOPE" == "all" ]]; then
  step "frontend build"
  cd "$REPO_DIR/quiz-web"
  npm ci
  "${FRONTEND_BUILD_COMMAND[@]}"

  step "frontend runtime sync"
  rsync -a --delete --no-owner --no-group --no-perms --omit-dir-times dist/ "$WEB_RUNTIME/"
fi

step "validation local"
wait_for_health http://127.0.0.1:3001/api/health
wait_for_health http://127.0.0.1/api/health
pm2 status --no-color
bash "$SCRIPT_DIR/verify-request-id.sh" http://127.0.0.1/api/health quiz-api

step "deploy done"
