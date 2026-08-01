#!/usr/bin/env bash
set -euo pipefail

ENVIRONMENT="${1:-}"
SCOPE="${2:-}"
BRANCH="${3:-}"
EXPECTED_DATABASE="${4:-}"
SOURCE_BUNDLE="${DEPLOY_SOURCE_BUNDLE:-}"
EXPECTED_COMMIT="${DEPLOY_EXPECTED_COMMIT:-}"
TEST_ARTIFACT_DIR="${DEPLOY_TEST_ARTIFACT_DIR:-}"
PREFLIGHT_ONLY="${DEPLOY_PREFLIGHT_ONLY:-false}"
ARTIFACT_STAGE=""

if [[ -z "$ENVIRONMENT" || -z "$SCOPE" || -z "$BRANCH" || -z "$EXPECTED_DATABASE" ]]; then
  echo "Usage: bash remote-deploy.sh <test|prod> <frontend|backend|all> <git-branch> <expected-database>" >&2
  exit 2
fi

case "$ENVIRONMENT" in
  test)
    if [[ "$PREFLIGHT_ONLY" != "true" ]]; then
      [[ -n "$TEST_ARTIFACT_DIR" ]] || {
        echo "Test deployment requires DEPLOY_TEST_ARTIFACT_DIR from the local artifact builder." >&2
        exit 2
      }
      [[ "$TEST_ARTIFACT_DIR" =~ ^/tmp/quiz-deploy-[0-9]{8}[-_][0-9]{6}/artifacts$ ]] || {
        echo "DEPLOY_TEST_ARTIFACT_DIR must be a timestamped deployment artifact directory." >&2
        exit 2
      }
    fi
    ;;
  prod)
    FRONTEND_BUILD_COMMAND=(npm run build-only)
    ;;
  *)
    echo "Invalid environment: $ENVIRONMENT. Expected test or prod." >&2
    exit 2
    ;;
esac

if [[ "$PREFLIGHT_ONLY" != "true" && "$PREFLIGHT_ONLY" != "false" ]]; then
  echo "DEPLOY_PREFLIGHT_ONLY must be true or false." >&2
  exit 2
fi

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
DEPLOY_STARTED_AT="$(date +%s)"
PREVIOUS_STEP_STARTED_AT="$DEPLOY_STARTED_AT"
PREVIOUS_STEP_NAME=""

step() {
  local now
  now="$(date +%s)"
  if [[ -n "$PREVIOUS_STEP_NAME" ]]; then
    printf 'remote_timing stage=%s seconds=%d total_seconds=%d\n' \
      "$PREVIOUS_STEP_NAME" \
      "$((now - PREVIOUS_STEP_STARTED_AT))" \
      "$((now - DEPLOY_STARTED_AT))"
  fi
  PREVIOUS_STEP_STARTED_AT="$now"
  PREVIOUS_STEP_NAME="$1"
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

cleanup_artifact_stage() {
  if [[ -n "$ARTIFACT_STAGE" && -d "$ARTIFACT_STAGE" ]]; then
    rm -rf -- "$ARTIFACT_STAGE"
  fi
  return 0
}
trap cleanup_artifact_stage EXIT

validate_test_artifacts() {
  [[ "$ENVIRONMENT" == "test" ]] || return 0
  local artifact_commit="${1:-}"
  [[ -d "$TEST_ARTIFACT_DIR" ]] || {
    echo "Test artifact directory is missing: $TEST_ARTIFACT_DIR" >&2
    exit 50
  }

  node - "$TEST_ARTIFACT_DIR/manifest.json" "$SCOPE" "$BRANCH" "$artifact_commit" <<'NODE'
const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

const [manifestFile, scope, branch, commit] = process.argv.slice(2)
if (!fs.existsSync(manifestFile)) throw new Error('Test artifact manifest is missing.')
const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'))
if (manifest.schemaVersion !== 1 || manifest.environment !== 'test') {
  throw new Error('Test artifact manifest does not target the test environment.')
}
if (manifest.scope !== scope || manifest.branch !== branch || manifest.commit !== commit) {
  throw new Error('Test artifact manifest does not match the selected scope, branch, or commit.')
}

const required = []
if (scope === 'backend' || scope === 'all') required.push('api-dist.tar.gz')
if (scope === 'frontend' || scope === 'all') required.push('web-dist.tar.gz')
for (const name of required) {
  const expected = manifest.files?.[name]?.sha256
  if (!/^[a-f0-9]{64}$/.test(expected || '')) throw new Error(`Missing checksum for ${name}.`)
  const file = path.join(path.dirname(manifestFile), name)
  const actual = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
  if (actual !== expected) throw new Error(`Checksum mismatch for ${name}.`)
}
console.log(`Verified local test artifacts for commit ${commit}.`)
NODE
}

extract_test_artifact() {
  local archive="$1"
  local destination="$2"
  local entries

  entries="$(tar -tzf "$archive")"
  if grep -Eq '(^/|(^|/)\.\.(/|$))' <<<"$entries"; then
    echo "Unsafe archive path detected: $archive" >&2
    exit 51
  fi
  mkdir -p "$destination"
  tar -xzf "$archive" -C "$destination"
}

prepare_test_artifact_stage() {
  [[ "$ENVIRONMENT" == "test" ]] || return 0
  ARTIFACT_STAGE="$(mktemp -d "/tmp/quiz-test-artifacts-${STAMP}.XXXXXX")"

  if [[ "$SCOPE" == "backend" || "$SCOPE" == "all" ]]; then
    extract_test_artifact "$TEST_ARTIFACT_DIR/api-dist.tar.gz" "$ARTIFACT_STAGE/api"
    [[ -f "$ARTIFACT_STAGE/api/dist/index.js" ]] || {
      echo "API artifact does not contain dist/index.js." >&2
      exit 51
    }
  fi
  if [[ "$SCOPE" == "frontend" || "$SCOPE" == "all" ]]; then
    extract_test_artifact "$TEST_ARTIFACT_DIR/web-dist.tar.gz" "$ARTIFACT_STAGE/web"
    [[ -f "$ARTIFACT_STAGE/web/dist/index.html" ]] || {
      echo "Web artifact does not contain dist/index.html." >&2
      exit 51
    }
  fi
}

ensure_test_runtime_dependencies() {
  [[ "$ENVIRONMENT" == "test" ]] || return 0
  local package_changed=false
  if [[ ! -d "$API_RUNTIME/node_modules" || ! -f "$API_RUNTIME/package.json" || ! -f "$API_RUNTIME/package-lock.json" ]]; then
    package_changed=true
  elif ! cmp -s "$REPO_DIR/api/package.json" "$API_RUNTIME/package.json" || ! cmp -s "$REPO_DIR/api/package-lock.json" "$API_RUNTIME/package-lock.json"; then
    package_changed=true
  fi

  if [[ "$package_changed" == true ]]; then
    step "test runtime dependencies changed"
    cp "$REPO_DIR/api/package.json" "$REPO_DIR/api/package-lock.json" "$API_RUNTIME/"
    (
      cd "$API_RUNTIME"
      npm ci --omit=dev --ignore-scripts
    )
  else
    step "test runtime dependencies unchanged"
    echo "Reusing existing production dependency set."
  fi

  [[ -x "$API_RUNTIME/node_modules/.bin/prisma" ]] || {
    echo "Test runtime Prisma CLI is unavailable; prisma must remain a production dependency." >&2
    exit 52
  }
}

step "deploy start"
echo "environment=${ENVIRONMENT}"
echo "scope=${SCOPE}"
echo "branch=${BRANCH}"
echo "stamp=${STAMP}"

step "target environment guard"
assert_target_environment

if [[ "$PREFLIGHT_ONLY" == "true" ]]; then
  step "repository preflight"
  [[ -d "$REPO_DIR/.git" ]] || {
    echo "Repository checkout not found: $REPO_DIR" >&2
    exit 45
  }
  cd "$REPO_DIR"
  if [[ -n "$(git status --porcelain)" ]]; then
    echo "Repository has local changes; inspect and preserve them before deployment." >&2
    git status --short >&2
    exit 45
  fi
  echo "preflight=passed current_commit=$(git rev-parse HEAD)"
  exit 0
fi

step "test artifact guard"
validate_test_artifacts "$EXPECTED_COMMIT"
prepare_test_artifact_stage

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
ACTUAL_COMMIT="$(git rev-parse HEAD)"
git rev-parse --short HEAD

if [[ "$SCOPE" == "backend" || "$SCOPE" == "all" ]]; then
  if [[ "$ENVIRONMENT" == "test" ]]; then
    ensure_test_runtime_dependencies
    TEST_PRISMA_BIN="$API_RUNTIME/node_modules/.bin/prisma"
    ln -sfn "$API_RUNTIME/node_modules" "$ARTIFACT_STAGE/api/node_modules"
  else
    step "backend dependencies"
    cd "$REPO_DIR/api"
    npm ci
    TEST_PRISMA_BIN=""
  fi

  step "prisma migration guard"
  run_with_env_file \
    "$API_RUNTIME/.env" \
    bash "$SCRIPT_DIR/check-prisma-migrations.sh" "$REPO_DIR/api" "/tmp/quiz_migrate_shadow_${STAMP}.db" "$TEST_PRISMA_BIN"

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

  if [[ "$ENVIRONMENT" == "test" ]]; then
    step "test runtime validate and migrate"
    mkdir -p "$API_RUNTIME/prisma"
    cp "$REPO_DIR/api/prisma/schema.prisma" "$API_RUNTIME/prisma/schema.prisma"
    (
      cd "$API_RUNTIME"
      run_with_env_file \
        "$API_RUNTIME/.env" \
        "$TEST_PRISMA_BIN" generate --schema "$API_RUNTIME/prisma/schema.prisma"
    )
    run_with_env_file \
      "$API_RUNTIME/.env" \
      node "$REPO_DIR/api/scripts/validate-runtime-config.mjs" "$ARTIFACT_STAGE/api"
    run_with_env_file \
      "$API_RUNTIME/.env" \
      "$TEST_PRISMA_BIN" migrate deploy --schema "$REPO_DIR/api/prisma/schema.prisma"
  else
    cd "$REPO_DIR/api"
    cp "$API_RUNTIME/.env" .env
    step "backend migrate and build"
    npx prisma migrate deploy
    npx prisma generate
    npm run build
  fi

  step "backend runtime sync"
  if [[ "$ENVIRONMENT" == "test" ]]; then
    rsync -a --delete "$ARTIFACT_STAGE/api/dist/" "$API_RUNTIME/dist/"
  else
    rsync -a --delete "$REPO_DIR/api/dist/" "$API_RUNTIME/dist/"
    rsync -a --delete "$REPO_DIR/api/node_modules/" "$API_RUNTIME/node_modules/"
    cp "$REPO_DIR/api/package.json" "$REPO_DIR/api/package-lock.json" "$API_RUNTIME/"
  fi
  if [[ -d "$REPO_DIR/api/prompts" ]]; then
    rsync -a --delete "$REPO_DIR/api/prompts/" "$API_RUNTIME/prompts/"
  fi
  [[ -f "$PM2_CONFIG_SOURCE" ]] || {
    echo "PM2 configuration template is missing: $PM2_CONFIG_SOURCE" >&2
    exit 47
  }
  # A fresh ECS pre-creates this file as deploy-owned while /opt/quiz remains root-owned.
  # Overwrite an existing writable file in place so deployment does not require directory write access.
  if [[ -e "$PM2_CONFIG" ]]; then
    [[ -w "$PM2_CONFIG" ]] || {
      echo "PM2 configuration is not writable by the deployment user: $PM2_CONFIG" >&2
      exit 47
    }
    cat "$PM2_CONFIG_SOURCE" > "$PM2_CONFIG"
    chmod 0644 "$PM2_CONFIG"
  else
    install -m 0644 "$PM2_CONFIG_SOURCE" "$PM2_CONFIG"
  fi
  if pm2 describe quiz-api >/dev/null 2>&1; then
    pm2 reload "$PM2_CONFIG" --only quiz-api --update-env
  else
    pm2 start "$PM2_CONFIG" --only quiz-api --update-env
  fi
  pm2 save
fi

if [[ "$SCOPE" == "frontend" || "$SCOPE" == "all" ]]; then
  if [[ "$ENVIRONMENT" == "test" ]]; then
    step "test frontend artifact"
    echo "Using the verified frontend artifact built outside the ECS."
  else
    step "frontend build"
    cd "$REPO_DIR/quiz-web"
    npm ci
    "${FRONTEND_BUILD_COMMAND[@]}"
  fi

  step "frontend runtime sync"
  if [[ "$ENVIRONMENT" == "test" ]]; then
    rsync -a --delete --no-owner --no-group --no-perms --omit-dir-times "$ARTIFACT_STAGE/web/dist/" "$WEB_RUNTIME/"
  else
    rsync -a --delete --no-owner --no-group --no-perms --omit-dir-times dist/ "$WEB_RUNTIME/"
  fi
fi

step "validation local"
wait_for_health http://127.0.0.1:3001/api/health
wait_for_health http://127.0.0.1/api/health
pm2 status --no-color
bash "$SCRIPT_DIR/verify-request-id.sh" http://127.0.0.1/api/health quiz-api

step "deploy done"
echo "remote_timing total_seconds=$(($(date +%s) - DEPLOY_STARTED_AT))"
