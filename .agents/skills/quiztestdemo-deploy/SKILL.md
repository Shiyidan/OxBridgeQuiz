---
name: quiztestdemo-deploy
description: Deploy or update QuizTestDemo in the Alibaba Cloud test or production environment. Use when the user asks to deploy, publish, 上线, 更新测试环境, 更新线上代码, or release the Vue frontend, Express/Prisma backend, or both. The workflow must confirm test/prod, deployment scope, and Git branch before selecting the corresponding ECS, runtime profile, database, public URL, validation, and deployment record.
---

# QuizTestDemo Deploy

## Purpose

Use this skill to deploy `QuizTestDemo` to one explicitly selected Alibaba Cloud environment: `test` or `prod`.

Read `references/environments.md` for the private configuration contract. Read `references/quiztestdemo-ecs.md` before executing a deployment.

## Mandatory Preflight

Before any SSH, SCP, Git update, build, migration, runtime sync, or PM2 command, obtain these three explicit values:

1. Environment: `test` or `prod`
2. Scope: `frontend`, `backend`, or `all`
3. Git branch

Ask only for values the user has not already stated exactly. Never infer the environment from the branch name, the words “部署” or “上线”, a previous deployment, or the server `.env`. Never infer the branch.

After collecting the values, repeat the environment, ECS host, public URL, expected database, scope, and branch. For `prod`, require the user to confirm this exact summary before running mutating commands unless their latest message already explicitly confirms the same production target, scope, and branch.

If the user asks only for status or explanation, do not deploy.

## Environment Isolation

The environment choice controls the SSH host, expected `API_RUNTIME_ENV`, expected database, frontend build mode, public validation URL, deployment document, and report label as one unit. Load infrastructure values only from the git-ignored `.env.deploy.local`; never store them in the Skill or other tracked files.

Use two independent guards:

1. Select the SSH target locally from the confirmed environment.
2. Run `remote-deploy.sh <environment> <scope> <branch> <expected-database>`; it must reject the server when `/opt/quiz/api/.env` has a different `API_RUNTIME_ENV` or database name.

An environment mismatch is a hard stop. Do not rewrite the server `.env` to make the guard pass.

## Deployment Workflow

Prefer the bundled scripts in `scripts/` instead of writing ad hoc deployment scripts:

- `scripts/remote-deploy.sh`: guarded server-side deploy runner for `test` or `prod` and `frontend`, `backend`, or `all`.
- `scripts/check-prisma-migrations.sh`: server-side Prisma schema/migration guard, called by `remote-deploy.sh`.
- `scripts/check-runtime-config.sh`: compares runtime `.env` keys with `.env.example`, merges only an explicit allowlist of non-secret defaults after backup, and never prints values; deployment then runs the repository runtime validator.
- `scripts/backup-rds-runtime.sh`: server-side backup runner for transaction-consistent InnoDB RDS MySQL dumps, uploads, runtime config, manifests, checksums, and retention cleanup.
- `scripts/collect-report.sh`: environment-labelled server-side status and resource collector.
- `scripts/verify-request-id.sh`: verifies that one health response Request ID appears in the PM2 log paths discovered from `pm2 jlist`; never assume PM2's default log directory.
- `scripts/generate-report.cjs`: local HTML deployment report generator.
- `scripts/send-deployment-report.cjs`: optional local SMTP sender. Do not run it unless the user explicitly asks to email a report.
- `scripts/cleanup-transient.ps1`: mandatory finalizer that preserves a sanitized HTML result, deletes the exact remote deployment directory, and deletes its local raw-evidence directory.
- `scripts/bootstrap-repository.sh`: explicit fallback for converting a legacy source package into a commit-verified Git checkout; do not use it during routine updates.
- `scripts/audit-operations.sh`: read-only deploy-user or root operational audit.
- `scripts/install-ops-baseline.sh`: installs the versioned `ops/` health check, backup timer, log rotation, and limited Nginx operation after explicit root authorization.
- `scripts/verify-ops-baseline.sh`: read-only verification of the installed operational baseline.

High-level scripted flow:

1. Load `.env.deploy.local` and resolve the selected environment keys from `references/environments.md`.
2. Verify the selected SSH key exists and run a read-only identity check against that environment's host.
3. Create a unique remote directory such as `/tmp/quiz-deploy-YYYYMMDD-HHMMSS`.
4. Upload `remote-deploy.sh`, `check-prisma-migrations.sh`, `check-runtime-config.sh`, `backup-rds-runtime.sh`, `verify-request-id.sh`, and `collect-report.sh` into that directory with `scp`.
5. Execute `bash /tmp/quiz-deploy-*/remote-deploy.sh <environment> <scope> <branch> <expected-database>` on the selected server.
6. Execute `bash /tmp/quiz-deploy-*/collect-report.sh <environment> <scope> <branch> <expected-database> <public-url>` and save the output only under the matching local `.tmp/quiz-deploy-<timestamp>` directory.
7. Run public checks against the selected environment URL and save their outputs only under that same directory.
8. For backend or all, verify at least one database-dependent GET endpoint and save the response; also save `verify-request-id.sh` output or equivalent PM2 log evidence.
9. For `backend` or `all` deployment, `remote-deploy.sh` must run `backup-rds-runtime.sh before_deploy <stamp> <environment>` before `prisma migrate deploy`.
10. Write the sanitized deployment record to the document selected by `references/environments.md` and run `node scripts/generate-report.cjs --environment <environment> ... --deployment-doc <deployment-doc>` to write the detailed HTML report under the ignored local `.private/deployment-reports/` directory.
11. Treat report generation and cleanup as a `finally` phase for every outcome: success, partial success, failure, or an interrupted/retried deployment. Save the normal HTML report first; if normal generation fails, let `cleanup-transient.ps1` create a minimal sanitized failure report.
12. Run `cleanup-transient.ps1` with the confirmed environment, exact local evidence directory, exact remote directory, report path, and final result. The script must delete both raw-evidence directories and must reject paths outside the timestamped deployment locations.
13. Do not leave deploy logs, copied responses, uploaded scripts, Git bundles, built assets, screenshots, or ad hoc repair scripts below `.tmp/` after the finalizer. `.tmp/` is a scratch area, is Git-ignored, and must never be staged or committed.
14. Do not send email reports by default.

## Safety Rules

- The local environment selection and the remote runtime/database guard must agree before Git operations. If they differ, stop; never edit `.env` or switch hosts automatically.
- Never overwrite `/opt/quiz/api/.env`.
- After the backup and before migration, compare `/opt/quiz/api/.env` keys with the checked-out `api/.env.example`. The script may append only its explicit allowlist of non-secret defaults; it must stop and list key names for secrets or environment-specific settings. Never print values.
- Before migration and PM2 reload, run `API_ENV_FILE=/opt/quiz/api/.env npm run validate:runtime`; database and SMTP validation must both pass.
- Runtime data is stored in RDS MySQL. Do not recreate or depend on `/opt/quiz/data/prod.db`.
- Before database-impacting work, run `backup-rds-runtime.sh` to create a compressed logical RDS dump, uploads archive, runtime config archive, manifest, and checksums.
- Alibaba Cloud RDS automatic backup should remain enabled in the RDS console as the physical backup layer; the deployment script creates a deployment-time logical backup layer.
- Test and production deployments use `npx prisma migrate deploy`, not `npx prisma db push`.
- Do not use `db push` during routine deployment. Use it only when the user explicitly asks for an emergency/schema-repair operation in the current conversation, and record it in deployment docs.
- Before backend or all deployment, run the bundled `check-prisma-migrations.sh`. For MySQL, it validates Prisma schema and runs `migrate diff` only when `SHADOW_DATABASE_URL` is configured; otherwise `migrate deploy` is the authoritative migration gate.
- If the diff contains executable schema changes, stop deployment and tell the user a proper migration must be created and committed before production deployment.
- If `npx prisma migrate deploy` fails because production already contains a table/column from a prior manual `db push`, do not resolve blindly. Inspect the production table/index structure against the failed migration. Use `migrate resolve --applied` only when the existing production structure matches the migration exactly enough to make it a metadata repair, and record the repair in the report.
- Avoid complex inline scripts through PowerShell SSH quoting. Prefer local temp file plus `scp`, then execute on the server.
- Do not write reusable deployment logic as one-off files under `.tmp/`. Add reusable, environment-neutral behavior to this Skill or versioned `ops/` assets, then validate it before removing the scratch implementation.
- Do not preserve raw temporary evidence for later manual review. The ignored HTML report and concise tracked deployment note are the durable records. If deeper debugging is still required, finish that debugging before running the mandatory finalizer.
- If SSH fails because the public key was removed, ask the user to re-add a temporary public key.
- Do not fall back from `prod` to `test`, or vice versa, after a failed connection.

## Repository Bootstrap Fallback

Routine deployment requires `/opt/quiz/repo` to be a Git-managed checkout. If a legacy server contains only copied source files, stop the routine deployment and obtain explicit approval before running `bootstrap-repository.sh`.

Use `clone` mode when the server can access the approved Git origin. Use `bundle` mode only when direct Git access is unavailable. In either mode, supply the exact approved branch and commit, retain the generated source archive, verify the activated commit, and remove the uploaded bundle through the normal transient finalizer.

## Operational Baseline

The repository `ops/` directory is the canonical source for health-check, SSH, logrotate, systemd, and production Nginx baseline files. The production Nginx file is not a test-environment template. Do not recreate these files from heredocs in a temporary deployment script.

Installing or changing the operational baseline is not implied by a normal code deployment. Obtain explicit root-level authorization, run `install-ops-baseline.sh <test|prod>`, reconnect as the deployment user when access controls changed, and run `verify-ops-baseline.sh <test|prod>`. SSH and firewall hardening require a separate rollback-protected change and a confirmed deployment-user login; never disable the last working access path.

## Frontend Build Selection

- `test`: run `npm run build-only:test`.
- `prod`: run `npm run build-only`.

Both builds use same-origin `/api` at runtime. Do not inject the test IP into a production build.

## Validation

Always verify on the selected server:

```bash
curl -sS http://127.0.0.1:3001/api/health
curl -sS http://127.0.0.1/api/health
pm2 status --no-color
```

Then verify the homepage and `/api/health` using the selected public URL from `.env.deploy.local`. For production, validate the configured canonical HTTPS URL; do not treat a server IP over HTTP as the canonical production result.

For backend or all deployments, also run `verify-request-id.sh`. It discovers the actual PM2 out/error paths from `pm2 jlist`, checks that `X-Request-ID` is returned, and confirms the same ID exists in a runtime log. Do not hardcode `~/.pm2/logs` because this environment currently uses `/var/log/quiz/`.

If frontend was deployed, check the public homepage returns `200 OK`.

If backend was deployed, check PM2 shows `quiz-api` as `online`.

## Deployment Report

After every completed deployment, generate a standalone HTML report and save it under the git-ignored local `.private/deployment-reports/` directory.

Do not place detailed reports in tracked documentation directories. Do not email reports by default.

The HTML report must include:

- deployment environment: `test` or `prod`
- deployment result: success, partial success, or failed
- deployment scope: `frontend`, `backend`, or `all`
- Git branch and final commit hash
- deployed modules and what changed operationally
- server project directory structure summary
- key update timestamps for repo, backend build, frontend build, database, PM2 config, and Nginx config when available
- health check results
- PM2 process status
- disk usage
- memory usage
- CPU/load and uptime
- open/listening key ports when available
- RDS MySQL migration status and backup notes when relevant
- deployment processing records from the selected environment document
- database-dependent GET result and Request ID-to-runtime-log evidence for backend/all deployments
- remaining risks or follow-up items

Pass `--environment <test|prod>` to `generate-report.cjs` and name the output `quiztestdemo-<environment>-deploy-<timestamp>.html`. Use `references/quiztestdemo-ecs.md` for exact collection commands.

## Email Notification

Email notification is currently paused. Do not run `scripts/send-deployment-report.cjs` during normal deployment.

If the user explicitly asks to email a report later, first confirm whether the report should be sent as a fully detailed internal report or a reduced/sanitized report.

Configure the sender, recipient, SMTP host, account, and authorization code only through `.env.deploy.local` or process environment variables. The send script must not contain fallback addresses or accounts. Keep `.env.deploy.local` git-ignored; do not write SMTP passwords, authorization codes, personal addresses, or recipients into Git, skill files, reports, or deployment logs.

## Documentation

After every completed deployment, write a concise dated note to the selected environment document:

- `test`: prepend to `文档/5. 部署方案/5.3 测试环境部署记录.md`
- `prod`: insert the newest dated code deployment as a `###` entry under `## 二、生产环境部署记录` in `文档/5. 部署方案/5.6 线上环境部署记录.md`

Production domain/HTTPS-only validation belongs under section one of the same document. Production security, backup, or other server-operational changes belong under section three. Do not add execution records back to `5.5 线上环境部署方案.md`.

Include the environment, scope, branch, commit, backup manifest, migrations, validation results, and any interrupted/retried step. Do not put real hosts, database names, local paths, email addresses, or secrets in tracked deployment documents; keep full operational details only in ignored local reports.

Explicitly call out these events when they occur:

- first deployment
- database migration
- data import
- use of `db push`
- domain/HTTPS change
- rollback
- security key change



