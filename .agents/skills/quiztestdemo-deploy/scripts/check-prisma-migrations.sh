#!/usr/bin/env bash
set -euo pipefail

API_DIR="${1:-/opt/quiz/repo/api}"
SHADOW_DB="${2:-/tmp/quiz_migrate_shadow.db}"
DIFF_OUT="$(mktemp)"

cleanup() {
  rm -f "$DIFF_OUT" "$SHADOW_DB"
}
trap cleanup EXIT

cd "$API_DIR"

echo "=== prisma migration guard ==="

npx prisma validate

if grep -q 'provider = "mysql"' prisma/schema.prisma; then
  if [[ -n "${SHADOW_DATABASE_URL:-}" ]]; then
    npx prisma migrate diff \
      --from-migrations prisma/migrations \
      --to-schema-datamodel prisma/schema.prisma \
      --shadow-database-url "$SHADOW_DATABASE_URL" \
      --script > "$DIFF_OUT"
  else
    echo "MySQL schema detected; SHADOW_DATABASE_URL is not configured."
    echo "Skipping migrate diff guard and relying on prisma validate + migrate deploy."
    : > "$DIFF_OUT"
  fi
else
  rm -f "$SHADOW_DB"
  npx prisma migrate diff \
    --from-migrations prisma/migrations \
    --to-schema-datamodel prisma/schema.prisma \
    --shadow-database-url "file:${SHADOW_DB}" \
    --script > "$DIFF_OUT"
fi

if grep -Eiq '(^|[[:space:]])(CREATE|ALTER|DROP)[[:space:]]+(TABLE|INDEX|UNIQUE INDEX)|CREATE[[:space:]]+UNIQUE[[:space:]]+INDEX' "$DIFF_OUT"; then
  echo "Prisma schema is not fully represented by committed migrations."
  echo "Create and commit a proper migration before deploying. Do not use db push."
  echo "--- migrate diff output ---"
  cat "$DIFF_OUT"
  exit 42
fi

echo "Prisma schema/migration guard passed."
