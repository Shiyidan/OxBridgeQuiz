#!/usr/bin/env bash
set -euo pipefail

REASON="${1:-manual}"
STAMP="${2:-$(date +%Y%m%d_%H%M%S)}"
ENVIRONMENT="${3:-unknown}"

API_RUNTIME="${API_RUNTIME:-/opt/quiz/api}"
QUIZ_ROOT="${QUIZ_ROOT:-/opt/quiz}"
BACKUP_ROOT="${BACKUP_ROOT:-/opt/quiz/backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"

ENV_FILE="$API_RUNTIME/.env"
MYSQL_DIR="$BACKUP_ROOT/mysql"
UPLOADS_DIR="$BACKUP_ROOT/uploads"
CONFIG_DIR="$BACKUP_ROOT/config"
MANIFEST_DIR="$BACKUP_ROOT/manifests"

step() {
  echo
  echo "=== backup: $1 ==="
}

die() {
  echo "backup failed: $*" >&2
  exit 1
}

quote_sh() {
  local value="${1:-}"
  printf "'%s'" "${value//\'/\'\\\'\'}"
}

read_database_url() {
  [[ -f "$ENV_FILE" ]] || die "env file not found: $ENV_FILE"

  local parsed
  parsed="$(node - "$ENV_FILE" <<'NODE'
const fs = require('fs')
const file = process.argv[2]
const text = fs.readFileSync(file, 'utf8')

function parseEnv(text) {
  const result = {}
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const index = trimmed.indexOf('=')
    if (index <= 0) continue
    const key = trimmed.slice(0, index).trim()
    let value = trimmed.slice(index + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    result[key] = value
  }
  return result
}

function quote(value) {
  return `'${String(value ?? '').replace(/'/g, `'\\''`)}'`
}

const env = parseEnv(text)
if (!env.DATABASE_URL) {
  console.error('DATABASE_URL is missing')
  process.exit(2)
}

const url = new URL(env.DATABASE_URL)
if (!url.protocol.startsWith('mysql')) {
  console.error(`DATABASE_URL is not mysql: ${url.protocol}`)
  process.exit(3)
}

const database = decodeURIComponent(url.pathname.replace(/^\//, ''))
if (!database) {
  console.error('DATABASE_URL database name is missing')
  process.exit(4)
}

console.log(`DB_HOST=${quote(url.hostname)}`)
console.log(`DB_PORT=${quote(url.port || '3306')}`)
console.log(`DB_USER=${quote(decodeURIComponent(url.username))}`)
console.log(`DB_PASS=${quote(decodeURIComponent(url.password))}`)
console.log(`DB_NAME=${quote(database)}`)
NODE
)"

  eval "$parsed"
}

make_dirs() {
  mkdir -p "$MYSQL_DIR" "$UPLOADS_DIR" "$CONFIG_DIR" "$MANIFEST_DIR"
  chmod 700 "$BACKUP_ROOT" "$MYSQL_DIR" "$UPLOADS_DIR" "$CONFIG_DIR" "$MANIFEST_DIR" 2>/dev/null || true
}

backup_mysql() {
  command -v mysqldump >/dev/null 2>&1 || die "mysqldump not found"
  command -v gzip >/dev/null 2>&1 || die "gzip not found"

  local file="$MYSQL_DIR/${DB_NAME}_${REASON}_${STAMP}.sql.gz"
  local fallback_file="$MYSQL_DIR/${DB_NAME}_${REASON}_${STAMP}.fallback.sql.gz"

  step "rds mysql logical dump"
  echo "database=${DB_NAME}"
  echo "host=${DB_HOST}"
  echo "output=${file}"

  set +e
  MYSQL_PWD="$DB_PASS" mysqldump \
    --no-defaults \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --user="$DB_USER" \
    --default-character-set=utf8mb4 \
    --skip-opt \
    --skip-lock-tables \
    --no-tablespaces \
    --skip-column-statistics \
    --set-gtid-purged=OFF \
    --quick \
    --quote-names \
    --create-options \
    --set-charset \
    --add-drop-table \
    --extended-insert \
    --triggers \
    --routines \
    --events \
    --hex-blob \
    "$DB_NAME" | gzip -9 > "$file"
  local status=$?
  set -e

  if [[ "$status" -ne 0 ]]; then
    rm -f "$file"
    echo "full mysqldump failed; retrying without routines/events."
    MYSQL_PWD="$DB_PASS" mysqldump \
      --no-defaults \
      --host="$DB_HOST" \
      --port="$DB_PORT" \
      --user="$DB_USER" \
      --default-character-set=utf8mb4 \
      --skip-opt \
      --skip-lock-tables \
      --no-tablespaces \
      --skip-column-statistics \
      --set-gtid-purged=OFF \
      --quick \
      --quote-names \
      --create-options \
      --set-charset \
      --add-drop-table \
      --extended-insert \
      --triggers \
      --hex-blob \
      "$DB_NAME" | gzip -9 > "$fallback_file"
    file="$fallback_file"
  fi

  chmod 600 "$file" 2>/dev/null || true
  gzip -t "$file"
  ls -lh "$file"
  MYSQL_BACKUP_FILE="$file"
}

backup_uploads() {
  command -v tar >/dev/null 2>&1 || die "tar not found"
  local source="$QUIZ_ROOT/uploads"
  local file="$UPLOADS_DIR/uploads_${REASON}_${STAMP}.tar.gz"

  step "uploads archive"
  if [[ -d "$source" ]]; then
    tar -czf "$file" -C "$QUIZ_ROOT" uploads
    chmod 600 "$file" 2>/dev/null || true
    ls -lh "$file"
    UPLOADS_BACKUP_FILE="$file"
  else
    echo "uploads directory not found: $source"
    UPLOADS_BACKUP_FILE=""
  fi
}

backup_config() {
  local file="$CONFIG_DIR/config_${REASON}_${STAMP}.tar.gz"

  step "runtime config archive"
  local items=()
  [[ -f "$API_RUNTIME/.env" ]] && items+=("$API_RUNTIME/.env")
  [[ -f "$QUIZ_ROOT/ecosystem.config.cjs" ]] && items+=("$QUIZ_ROOT/ecosystem.config.cjs")
  [[ -f "/etc/nginx/sites-available/quiz" ]] && items+=("/etc/nginx/sites-available/quiz")

  if [[ "${#items[@]}" -eq 0 ]]; then
    echo "no config files found"
    CONFIG_BACKUP_FILE=""
    return
  fi

  tar -czf "$file" --ignore-failed-read "${items[@]}" 2>/dev/null || true
  if [[ -s "$file" ]]; then
    chmod 600 "$file" 2>/dev/null || true
    ls -lh "$file"
    CONFIG_BACKUP_FILE="$file"
  else
    rm -f "$file"
    echo "config archive is empty"
    CONFIG_BACKUP_FILE=""
  fi
}

write_manifest() {
  local file="$MANIFEST_DIR/backup_${REASON}_${STAMP}.txt"

  step "manifest"
  {
    echo "stamp=${STAMP}"
    echo "reason=${REASON}"
    echo "environment=${ENVIRONMENT}"
    echo "database=${DB_NAME}"
    echo "host=${DB_HOST}"
    echo "created_at=$(date '+%Y-%m-%d %H:%M:%S %z')"
    echo "mysql_backup=${MYSQL_BACKUP_FILE:-}"
    echo "uploads_backup=${UPLOADS_BACKUP_FILE:-}"
    echo "config_backup=${CONFIG_BACKUP_FILE:-}"
    echo
    echo "--- sha256 ---"
    for item in "${MYSQL_BACKUP_FILE:-}" "${UPLOADS_BACKUP_FILE:-}" "${CONFIG_BACKUP_FILE:-}"; do
      [[ -n "$item" && -f "$item" ]] || continue
      if command -v sha256sum >/dev/null 2>&1; then
        sha256sum "$item"
      else
        shasum -a 256 "$item"
      fi
    done
  } > "$file"
  chmod 600 "$file" 2>/dev/null || true
  cat "$file"
  MANIFEST_FILE="$file"
}

prune_old_backups() {
  step "retention"
  echo "retention_days=${RETENTION_DAYS}"
  find "$MYSQL_DIR" "$UPLOADS_DIR" "$CONFIG_DIR" "$MANIFEST_DIR" -type f -mtime +"$RETENTION_DAYS" -print -delete 2>/dev/null || true
}

main() {
  read_database_url
  make_dirs
  backup_mysql
  backup_uploads
  backup_config
  write_manifest
  prune_old_backups

  step "backup done"
  echo "manifest=${MANIFEST_FILE}"
}

main "$@"
