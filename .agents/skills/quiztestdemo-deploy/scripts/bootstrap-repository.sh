#!/usr/bin/env bash
set -euo pipefail

# Convert a legacy source directory into a verified Git-managed checkout.
MODE="${1:?mode is required: clone or bundle}"
SOURCE="${2:?repository URL or bundle path is required}"
BRANCH="${3:?branch is required}"
EXPECTED_COMMIT="${4:?expected commit is required}"
STAMP="${5:?stamp is required}"

ROOT="${QUIZ_ROOT:-/opt/quiz}"
CURRENT="$ROOT/repo"
NEW="$ROOT/repo-bootstrap-$STAMP"
BACKUP_DIR="$ROOT/backups/source"
LEGACY="$BACKUP_DIR/repo-legacy-$STAMP"
ARCHIVE="$BACKUP_DIR/repo-before-git-bootstrap-$STAMP.tgz"

[[ "$MODE" == "clone" || "$MODE" == "bundle" ]] || {
  echo "Mode must be clone or bundle." >&2
  exit 43
}
if [[ "$MODE" == "bundle" && ! -f "$SOURCE" ]]; then
  echo "Git bundle is missing." >&2
  exit 44
fi
[[ -d "$CURRENT" && ! -e "$CURRENT/.git" ]] || {
  echo "Current repository is missing or already Git-managed." >&2
  exit 45
}
[[ ! -e "$NEW" && ! -e "$LEGACY" && ! -e "$ARCHIVE" ]] || {
  echo "A bootstrap target already exists." >&2
  exit 46
}

mkdir -p "$BACKUP_DIR"

# Clone from the approved transport and verify the exact commit before activation.
if [[ "$MODE" == "clone" ]]; then
  git -c http.version=HTTP/1.1 clone \
    --depth 1 \
    --single-branch \
    --branch "$BRANCH" \
    "$SOURCE" \
    "$NEW"
else
  git bundle verify "$SOURCE"
  git clone \
    --single-branch \
    --branch "$BRANCH" \
    "$SOURCE" \
    "$NEW"
fi

actual_commit="$(git -C "$NEW" rev-parse HEAD)"
if [[ "$actual_commit" != "$EXPECTED_COMMIT" ]]; then
  rm -rf -- "$NEW"
  printf 'Commit mismatch: expected=%s actual=%s\n' "$EXPECTED_COMMIT" "$actual_commit" >&2
  exit 47
fi
if [[ -n "$(git -C "$NEW" status --porcelain)" ]]; then
  rm -rf -- "$NEW"
  echo "Cloned repository is not clean." >&2
  exit 48
fi

# Preserve the old source package and restore it automatically if activation fails.
tar -czf "$ARCHIVE" -C "$ROOT" repo
chmod 600 "$ARCHIVE"
mv "$CURRENT" "$LEGACY"
if ! mv "$NEW" "$CURRENT"; then
  mv "$LEGACY" "$CURRENT"
  echo "Activation failed; the original repository was restored." >&2
  exit 49
fi

printf 'source_archive=%s\n' "$ARCHIVE"
printf 'legacy_source=%s\n' "$LEGACY"
printf 'active_commit=%s\n' "$(git -C "$CURRENT" rev-parse HEAD)"
printf 'active_branch=%s\n' "$(git -C "$CURRENT" branch --show-current)"

