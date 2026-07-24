#!/usr/bin/env bash
set -euo pipefail

# Collect a read-only operational baseline without exposing environment secrets.
MODE="${1:?mode is required: deploy or root}"
[[ "$MODE" == "deploy" || "$MODE" == "root" ]] || {
  echo "Mode must be deploy or root." >&2
  exit 70
}

echo "--- identity ---"
date '+time=%Y-%m-%d %H:%M:%S %z'
id

if [[ "$MODE" == "deploy" ]]; then
  echo "--- sudo-boundary ---"
  sudo -n -l 2>&1 || true

  echo "--- application ---"
  pm2 status --no-color
  pm2 jlist | node -e '
let input = ""
process.stdin.on("data", (chunk) => {
  input += chunk
})
process.stdin.on("end", () => {
  for (const item of JSON.parse(input)) {
    if (item.name !== "quiz-api") continue
    for (const [kind, file] of Object.entries({
      out: item.pm2_env?.pm_out_log_path,
      error: item.pm2_env?.pm_err_log_path,
    })) {
      if (!file) continue
      let size = "missing"
      try {
        size = require("fs").statSync(file).size
      } catch {}
      console.log(`${kind}=${file} size_bytes=${size}`)
    }
  }
})'

  echo "--- backup-inventory ---"
  find /opt/quiz/backups -maxdepth 2 -type f \
    -printf '%TY-%Tm-%Td %TH:%TM:%TS %s %p\n' 2>/dev/null |
    sort |
    tail -n 40

  echo "--- capacity ---"
  df -h /
  du -sh /opt/quiz/backups /opt/quiz/api /opt/quiz/web 2>/dev/null || true
  exit 0
fi

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Root audit mode must run as root." >&2
  exit 71
fi

echo "--- ssh-effective-config ---"
/usr/sbin/sshd -T |
  grep -E '^(permitrootlogin|passwordauthentication|kbdinteractiveauthentication|pubkeyauthentication|maxauthtries|allowusers|allowgroups|logingracetime) ' ||
  true

echo "--- firewall-and-ports ---"
if command -v ufw >/dev/null 2>&1; then
  ufw status verbose
else
  echo "ufw=not-installed"
fi
ss -ltnp

echo "--- scheduled-operations ---"
systemctl list-timers --all --no-pager |
  grep -Ei 'quiz|backup|logrotate|apt|fstrim' ||
  true
systemctl is-enabled logrotate.timer 2>&1 || true
systemctl is-active logrotate.timer 2>&1 || true
journalctl --disk-usage 2>&1 || true

echo "--- service-state ---"
systemctl is-enabled ssh nginx 2>&1 || true
systemctl is-active ssh nginx 2>&1 || true

