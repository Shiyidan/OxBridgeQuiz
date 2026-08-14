---
name: quiztestdemo-deploy
description: Deploy or update QuizTestDemo in the Alibaba Cloud test or production environment. Use when the user asks to deploy, publish, 上线, 更新测试环境, 更新线上代码, or release the Vue frontend, Express/Prisma backend, or both. The workflow must confirm test/prod, deployment scope, and Git branch before selecting the corresponding ECS, runtime profile, database, public URL, validation, and deployment record.
---

# QuizTestDemo Deploy

## Purpose

Use this skill to deploy `QuizTestDemo` to one explicitly selected Alibaba Cloud environment: `test` or `prod`.

Read `references/environments.md` for the private configuration contract. Read `references/quiztestdemo-ecs.md` before executing a deployment.

## Mandatory Preflight

Before any SSH, SCP, Git update, build, migration, runtime sync, or PM2 command, obtain three target values:

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
- `scripts/deploy-test-local-build.ps1`: required test-environment orchestrator; verifies a clean, pushed commit, builds frontend and API artifacts locally, verifies them with a manifest and SHA-256, uploads them with the source bundle, validates the result, and cleans temporary evidence.
- `scripts/check-prisma-migrations.sh`: server-side Prisma schema/migration guard, called by `remote-deploy.sh`.
- `scripts/check-runtime-config.sh`: compares runtime `.env` keys with `.env.example`, merges only an explicit allowlist of non-secret defaults after backup, and never prints values; deployment then runs the repository runtime validator.
- `scripts/merge-visitor-runtime-config.sh`: after explicit environment confirmation, backs up the runtime `.env` and generates the stable visitor analytics HMAC secret only when it is missing, without printing the value.
- `scripts/merge-payment-runtime-config.sh`: after explicit environment confirmation, backs up the runtime `.env` and merges only an allowlisted private payment overlay from stdin without printing values.
- `scripts/backup-rds-runtime.sh`: server-side backup runner for transaction-consistent InnoDB RDS MySQL dumps, uploads, runtime config, manifests, checksums, and retention cleanup.
- `scripts/verify-request-id.sh`: verifies that one health response Request ID appears in the PM2 log paths discovered from `pm2 jlist`; never assume PM2's default log directory.
- `scripts/prune-test-artifact-cache.ps1`: retains only the five most recently used test-build Commit directories after validating every deletion target.
- `scripts/cleanup-transient.ps1`: mandatory finalizer that deletes the exact remote deployment directory and its local raw-evidence directory without creating a report.
- `scripts/bootstrap-repository.sh`: explicit fallback for converting a legacy source package into a commit-verified Git checkout; do not use it during routine updates.
- `scripts/bootstrap-ecs.sh`: idempotently prepares a new Ubuntu ECS host with Node.js 20, Nginx, PM2, runtime directories, deploy user and swap; it never creates application secrets or changes firewall rules.
- `scripts/provision-runtime-env.ps1`: interactively creates a local, access-restricted API runtime file for a fresh ECS. It prompts locally for the RDS account password, generates stable secrets, reuses only the private SMTP profile, and records the selected runtime-file path in `.env.deploy.local` without printing secret values.
- `scripts/audit-operations.sh`: read-only deploy-user or root operational audit.
- `scripts/install-ops-baseline.sh`: installs the versioned `ops/` health check, backup timer, log rotation, and limited Nginx operation after explicit root authorization.
- `scripts/verify-ops-baseline.sh`: read-only verification of the installed operational baseline.

## Test local-artifact deployment

For every `test` deployment, use `scripts/deploy-test-local-build.ps1`; do not invoke `remote-deploy.sh test` directly. The test ECS must never run `npm ci` for frontend, Vite, TypeScript, or backend compilation.

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\.agents\skills\quiztestdemo-deploy\scripts\deploy-test-local-build.ps1 `
  -Scope <frontend|backend|all> `
  -Branch <confirmed-branch>
```

The script rejects a dirty worktree, an unpushed commit, a dirty server worktree, a non-fast-forward source update, or any artifact manifest/checksum mismatch. It builds artifacts from the selected commit:

- frontend: local `npm ci` + `npm run build-only:test`, then `dist` archive;
- backend: local `npm ci` + Prisma generation + `npm run build`, then `dist` archive;
- server: receives only archives and source bundle; runs `npm ci --omit=dev` only if API package files changed, then runs Prisma generation/migration, runtime validation and PM2 reload.

Local dependency installation and both builds run in a temporary detached Git worktree at the exact selected commit. This prevents a local API process from locking Prisma's Windows engine file and keeps the developer's working `node_modules` untouched. The worktree is removed in the mandatory cleanup phase.

Before creating that worktree, the orchestrator uploads the guarded runner and executes `DEPLOY_PREFLIGHT_ONLY=true`. This validates the selected runtime environment, expected database, repository existence and repository cleanliness before local dependency installation or builds begin. A failed target preflight must stop without building or changing the server checkout.

For `scope=all`, the isolated API and frontend dependency-install/build tasks run in parallel. Successfully packaged archives are cached under the Git-ignored `.private/deployment-cache/test/v1/` directory using the exact Commit, scope, Node.js version and npm version. A retry of the same build identity may reuse the cache only after rechecking every archive SHA-256; any missing field, version mismatch or checksum mismatch is a cache miss and triggers a clean rebuild. After the current artifact is ready, run `prune-test-artifact-cache.ps1` and keep only the five most recently used Commit directories across all scopes. The deployment manifest is always regenerated for the current branch and deployment attempt.

Both the local orchestrator and remote runner emit machine-readable `local_timing` / `remote_timing` lines for major stages. Use them during the active deployment to diagnose slow builds, uploads, backups, migration checks and validations; remove them with the transient evidence after recording the concise result.

The remote runner validates the uploaded manifest and archive checksums before updating the server Git checkout. A malformed, mismatched or corrupt artifact must therefore fail before repository mutation, migration, runtime sync or PM2 reload.

`prisma` remains a production dependency because the server must run `prisma generate` and `prisma migrate deploy` without TypeScript development dependencies. The server rejects artifacts whose test environment, scope, branch, commit or SHA-256 values differ from the selected deployment.

## Production server-build deployment

Production retains the server-build flow below. Do not use the test artifact script for `prod`.

High-level production scripted flow:

1. Load `.env.deploy.local` and resolve the selected production environment keys from `references/environments.md`.
2. Verify the selected SSH key exists and run a read-only identity check against that environment's host.
3. Create a unique remote directory such as `/tmp/quiz-deploy-YYYYMMDD-HHMMSS`.
4. Upload `remote-deploy.sh`, `check-prisma-migrations.sh`, `check-runtime-config.sh`, `backup-rds-runtime.sh`, and `verify-request-id.sh` into that directory with `scp`.
5. Execute `bash /tmp/quiz-deploy-*/remote-deploy.sh <environment> <scope> <branch> <expected-database>` on the selected server.
6. Run public checks against the selected environment URL and save their outputs only under the matching local `.tmp/quiz-deploy-<timestamp>` directory while validation is active.
7. For backend or all, verify at least one database-dependent GET endpoint and save the response; also save `verify-request-id.sh` output or equivalent PM2 log evidence.
8. For `backend` or `all` deployment, `remote-deploy.sh` must run `backup-rds-runtime.sh before_deploy <stamp> <environment>` before `prisma migrate deploy`.
9. Write the concise deployment record to the document selected by `references/environments.md`. Do not generate HTML reports and do not send deployment-report email.
10. Run `cleanup-transient.ps1` with the confirmed environment, exact local evidence directory, and exact remote directory. The script must delete both raw-evidence directories and reject paths outside the timestamped deployment locations.
11. Do not leave deploy logs, copied responses, uploaded scripts, Git bundles, built assets, screenshots, or ad hoc repair scripts below `.tmp/` after the finalizer. `.tmp/` is a scratch area, is Git-ignored, and must never be staged or committed.

## New ECS Bootstrap

Use this flow only when the selected ECS is a newly created host without the standard `/opt/quiz` runtime. It is a first-deployment extension, not a substitute for ordinary deployment.

1. Confirm `test|prod`, scope and branch as usual; inspect the selected host identity and free disk space.
2. Obtain explicit root authorization. Upload and run `scripts/bootstrap-ecs.sh <environment>` as root. For a 2 GB test ECS, keep the default `QUIZ_SWAP_GIB=2`; do not add swap blindly when `/swapfile` already exists but is inactive.
3. Reconnect as the non-root deployment user and verify Node 20, PM2, `/opt/quiz` ownership, and swap. Do not grant unrestricted passwordless sudo.
4. Create a clean Git checkout at `/opt/quiz/repo` from the exact approved branch and commit. Prefer the approved origin; use the guarded bundle fallback only when origin access fails.
5. Provision `/opt/quiz/api/.env` through a private runtime-config file or a verified migration from the existing environment. For a new environment, run `scripts/provision-runtime-env.ps1` locally with the selected ECS host, SSH key and public URL; it asks locally for the RDS endpoint/account/password and creates the file referenced by `*_RUNTIME_ENV_FILE`. Upload that file with owner `deploy` and mode `0600` only when the remote runtime file does not yet exist. The file must contain the selected `API_RUNTIME_ENV`, selected RDS database URL, stable `JWT_SECRET` and `EMAIL_CODE_SECRET`, SMTP settings, and the selected frontend/CORS URL. Never paste, print, commit or reconstruct credentials from placeholders.
6. For a new **test** ECS, run `ops/scripts/quiz-nginx-bootstrap.sh test /opt/quiz/repo` as root. It installs the versioned HTTP-only test site only when no QuizTestDemo Nginx site exists. For production, use the separately approved TLS/Nginx process.
7. Run `install-ops-baseline.sh <environment>` as root only after the repository checkout exists, then reconnect as `deploy` and run the normal guarded deployment. `remote-deploy.sh` starts `quiz-api` from the versioned PM2 template on its first backend deployment and reloads it thereafter.
8. Run the complete validation, concise documentation and transient cleanup phases. Record the first deployment, runtime-config migration source, and any rollback path without recording secret values or real addresses in tracked documentation.

Missing private runtime configuration remains a hard stop. A new server may be initialized, but it must not be treated as a working test or production environment until `validate:runtime` and the database/SMTP checks pass.

## Safety Rules

- The local environment selection and the remote runtime/database guard must agree before Git operations. If they differ, stop; never edit `.env` or switch hosts automatically.
- Test deployment requires `DEPLOY_TEST_ARTIFACT_DIR` from `deploy-test-local-build.ps1`; reject it if the directory is not the timestamped remote artifact directory or its manifest does not match the activated commit and checksums.
- Do not allow the test ECS to fall back to Vite or TypeScript builds. Local artifact deployment must fail closed instead.
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
- If `npx prisma migrate deploy` fails because production already contains a table/column from a prior manual `db push`, do not resolve blindly. Inspect the production table/index structure against the failed migration. Use `migrate resolve --applied` only when the existing production structure matches the migration exactly enough to make it a metadata repair, and record the repair in the deployment document.
- Avoid complex inline scripts through PowerShell SSH quoting. Prefer local temp file plus `scp`, then execute on the server.
- Do not write reusable deployment logic as one-off files under `.tmp/`. Add reusable, environment-neutral behavior to this Skill or versioned `ops/` assets, then validate it before removing the scratch implementation.
- Do not preserve raw temporary evidence for later manual review. The concise tracked deployment note is the durable record. If deeper debugging is still required, finish that debugging before running the mandatory finalizer.
- If SSH fails because the public key was removed, ask the user to re-add a temporary public key.
- Do not fall back from `prod` to `test`, or vice versa, after a failed connection.

## Repository Bootstrap Fallback

Routine deployment requires `/opt/quiz/repo` to be a Git-managed checkout. If a legacy server contains only copied source files, stop the routine deployment and obtain explicit approval before running `bootstrap-repository.sh`.

Use `clone` mode when the server can access the approved Git origin. Use `bundle` mode only when direct Git access is unavailable. In either mode, supply the exact approved branch and commit, retain the generated source archive, verify the activated commit, and remove the uploaded bundle through the normal transient finalizer.

For an existing clean Git checkout, when the approved origin fetch fails repeatedly because the
server cannot maintain the network/TLS connection, the guarded deploy runner may use
`DEPLOY_SOURCE_BUNDLE` together with the full `DEPLOY_EXPECTED_COMMIT`. Generate the bundle from the
confirmed branch, upload it only to the timestamped deployment directory, require a fast-forward,
verify the exact commit, keep `origin` unchanged, and remove the bundle in the normal finalizer.

## Operational Baseline

The repository `ops/` directory is the canonical source for health-check, SSH, logrotate, systemd, and production Nginx baseline files. The production Nginx file is not a test-environment template. Do not recreate these files from heredocs in a temporary deployment script.

Installing or changing the operational baseline is not implied by a normal code deployment. Obtain explicit root-level authorization, run `install-ops-baseline.sh <test|prod>`, reconnect as the deployment user when access controls changed, and run `verify-ops-baseline.sh <test|prod>`. SSH and firewall hardening require a separate rollback-protected change and a confirmed deployment-user login; never disable the last working access path.

## Frontend Build Selection

- `test`: `deploy-test-local-build.ps1` runs local `npm run build-only:test` and uploads a verified `dist` archive; the ECS only unpacks and synchronizes it.
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

## Deployment Records

Do not generate standalone HTML reports and do not send deployment-report email. Use transient logs only while the current deployment is being validated, then remove them through the mandatory finalizer.

Keep one concise tracked Markdown record for each completed deployment. Summarize the result, target, deployed Commit, backups, migrations, validations, retries and actionable risks without copying raw logs or sensitive infrastructure values.

## Documentation

After every completed deployment, write a concise dated note to the selected environment document:

- `test`: prepend to `文档/5. 部署方案/5.3 测试环境部署记录.md`
- `prod`: insert the newest dated code deployment as a `###` entry under `## 二、生产环境部署记录` in `文档/5. 部署方案/5.6 线上环境部署记录.md`

Production domain/HTTPS-only validation belongs under section one of the same document. Production security, backup, or other server-operational changes belong under section three. Do not add execution records back to `5.5 线上环境部署方案.md`.

Include the environment, scope, branch, commit, backup manifest, migrations, validation results, and any interrupted/retried step. Do not put real hosts, database names, local paths, email addresses, secrets, command transcripts or raw responses in tracked deployment documents.

Explicitly call out these events when they occur:

- first deployment
- database migration
- data import
- use of `db push`
- domain/HTTPS change
- rollback
- security key change



