# QuizTestDemo ECS Deployment Reference

## Required Inputs and Environment

Collect `environment` (`test` or `prod`), `scope` (`frontend`, `backend`, or `all`), and the Git branch before running commands.

Load host, SSH user, key path, URL, and database from the git-ignored `.env.deploy.local` according to `environments.md`. Never infer, combine, or commit environment values.

- sudo password is user-provided; do not assume it unless the user gives it in the current conversation.
- The branch is user-selected for every deployment.

## Paths

- Repo: `/opt/quiz/repo`
- API runtime: `/opt/quiz/api`
- Web runtime: `/opt/quiz/web/dist`
- Runtime database: the selected environment's RDS database from `environments.md`
- Backups: `/opt/quiz/backups`
- PM2 config: `/opt/quiz/ecosystem.config.cjs`
- Nginx config: detect the existing environment file; production currently uses `/etc/nginx/sites-available/quiztestdemo`, while older environments may use `/etc/nginx/sites-available/quiz`

## SSH Pattern

Resolve the target locally:

```powershell
$Environment = "<test|prod>"
$Scope = "<frontend|backend|all>"
$Branch = "<branch>"
$PrivateConfig = Join-Path (Get-Location) ".env.deploy.local"

if (-not (Test-Path -LiteralPath $PrivateConfig)) {
  throw "Missing .env.deploy.local. Copy .env.deploy.local.example and fill it locally."
}

Get-Content -Encoding UTF8 -LiteralPath $PrivateConfig | ForEach-Object {
  $line = $_.Trim()
  if (-not $line -or $line.StartsWith("#")) { return }
  $index = $line.IndexOf("=")
  if ($index -le 0) { return }
  $key = $line.Substring(0, $index).Trim()
  $value = $line.Substring($index + 1).Trim().Trim('"').Trim("'")
  if (-not [Environment]::GetEnvironmentVariable($key, "Process")) {
    [Environment]::SetEnvironmentVariable($key, $value, "Process")
  }
}

switch ($Environment) {
  "test" {
    $Prefix = "QUIZ_TEST"
    $DeploymentDoc = "文档\5. 部署方案\5.3 测试环境部署记录.md"
  }
  "prod" {
    $Prefix = "QUIZ_PROD"
    $DeploymentDoc = "文档\5. 部署方案\5.6 线上环境部署记录.md"
  }
  default { throw "Environment must be test or prod." }
}

$HostName = [Environment]::GetEnvironmentVariable("${Prefix}_SSH_HOST", "Process")
$SshUser = [Environment]::GetEnvironmentVariable("${Prefix}_SSH_USER", "Process")
$SshKey = [Environment]::GetEnvironmentVariable("${Prefix}_SSH_KEY", "Process")
$PublicUrl = [Environment]::GetEnvironmentVariable("${Prefix}_PUBLIC_URL", "Process")
$ExpectedDatabase = [Environment]::GetEnvironmentVariable("${Prefix}_DATABASE", "Process")

$required = @{
  "${Prefix}_SSH_HOST" = $HostName
  "${Prefix}_SSH_USER" = $SshUser
  "${Prefix}_SSH_KEY" = $SshKey
  "${Prefix}_PUBLIC_URL" = $PublicUrl
  "${Prefix}_DATABASE" = $ExpectedDatabase
}
$missing = @($required.GetEnumerator() | Where-Object { -not $_.Value } | ForEach-Object Key)
if ($missing.Count) { throw "Missing private deployment keys: $($missing -join ', ')" }

if ($Scope -notin @("frontend", "backend", "all")) { throw "Invalid scope." }
if ($Branch -notmatch "^[A-Za-z0-9._/-]+$") { throw "Invalid branch." }
if ($HostName -notmatch "^[A-Za-z0-9.-]+$") { throw "Invalid SSH host." }
if ($SshUser -notmatch "^[A-Za-z0-9._-]+$") { throw "Invalid SSH user." }
if ($ExpectedDatabase -notmatch "^[A-Za-z0-9_-]+$") { throw "Invalid database name." }
if ($PublicUrl -notmatch "^https?://[A-Za-z0-9.-]+(?::[0-9]+)?$") { throw "Invalid public URL." }
if (-not (Test-Path -LiteralPath $SshKey)) { throw "SSH key not found: $SshKey" }

$Target = "${SshUser}@${HostName}"
ssh -i $SshKey -o IdentitiesOnly=yes $Target "printf 'connected\n'; hostname; whoami"
```

If network access requires escalation, request approval with a narrow `["ssh"]` prefix rule.
If authentication fails, stop and ask for the correct key. Do not try the other environment's host.

## Git Update

```bash
cd /opt/quiz/repo
git fetch origin <branch>
git checkout <branch>
git pull --ff-only origin <branch>
git rev-parse --short HEAD
```

If checkout fails because of local changes, inspect before changing anything. Do not reset production without explicit approval.
The bundled deploy runner now checks repository cleanliness before fetch/checkout and exits with status 45 before deployment work if local changes exist.

If the server's direct origin fetch fails repeatedly at the HTTP/TLS transport layer while the
existing checkout remains clean, create a Git bundle from the confirmed branch and pass its remote
temporary path through `DEPLOY_SOURCE_BUNDLE` plus the full commit through
`DEPLOY_EXPECTED_COMMIT`. The runner verifies the bundle, requires a fast-forward and checks the
exact commit without changing `origin`.

## Scripted Deployment Pattern

Use bundled scripts from the skill directory. Avoid recreating inline scripts unless a script itself must be patched.

For `test`, run the local artifact orchestrator instead of manually uploading and calling the server runner:

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\.agents\skills\quiztestdemo-deploy\scripts\deploy-test-local-build.ps1 `
  -Scope <frontend|backend|all> `
  -Branch <branch>
```

It performs test-environment preflight, local builds, source bundle/artifact upload, guarded server activation, validation and cleanup. It rejects dirty or unpushed source. The test server only installs `--omit=dev` runtime dependencies after API package files change, plus Prisma generation/migration and process reload. After artifact preparation, the local cache keeps only the five most recently used Commit directories.

For `prod`, use the server-build outline below.

PowerShell outline:

```powershell
$stamp = Get-Date -Format yyyyMMdd-HHmmss
$remoteDir = "/tmp/quiz-deploy-$stamp"
$skill = Join-Path (Get-Location) ".agents\skills\quiztestdemo-deploy"
$localDir = Join-Path (Get-Location) ".tmp\quiz-deploy-$Environment-$stamp"
New-Item -ItemType Directory -Force -Path $localDir | Out-Null

ssh -i $SshKey -o IdentitiesOnly=yes $Target "mkdir -p $remoteDir"
scp -i $SshKey -o IdentitiesOnly=yes "$skill\scripts\remote-deploy.sh" "$skill\scripts\check-prisma-migrations.sh" "$skill\scripts\check-runtime-config.sh" "$skill\scripts\backup-rds-runtime.sh" "$skill\scripts\verify-request-id.sh" "${Target}:$remoteDir/"
ssh -i $SshKey -o IdentitiesOnly=yes $Target "bash $remoteDir/remote-deploy.sh $Environment $Scope $Branch $ExpectedDatabase"
```

Save validation output only under the timestamped local `.tmp/` directory while the deployment is active. Summarize the final result in the tracked environment deployment document, then remove local and remote transient evidence. Do not generate or email an HTML report.

The remote runner exits with status `49` before Git changes when the selected environment does not match `API_RUNTIME_ENV` or the configured database name. Never edit the server `.env` to bypass this guard.

## Backend Deploy

For `test`, TypeScript compilation is local. The server receives an API `dist` archive, retains the private runtime `.env`, and uses the runtime Prisma CLI for validation, `migrate deploy` and `generate`; it does not run `tsc`.

`remote-deploy.sh` runs this flow for backend or all deployments:

1. Git fetch/checkout/pull.
2. `npm ci` in `/opt/quiz/repo/api`.
3. `check-prisma-migrations.sh` before copying `.env`, migrating, building, or syncing runtime files.
4. Run `backup-rds-runtime.sh before_deploy <stamp>`:
   - compressed RDS MySQL logical dump under `/opt/quiz/backups/mysql/`
   - uploads archive under `/opt/quiz/backups/uploads/`
   - runtime config archive under `/opt/quiz/backups/config/`
   - manifest and checksums under `/opt/quiz/backups/manifests/`
   - default retention cleanup: 14 days
5. Compare runtime `.env` keys with `.env.example`; after backup, merge only the script's explicit allowlist of non-secret defaults and stop without printing values if secrets or environment-specific keys are missing.
6. Copy runtime `.env` into the repo API directory and run `API_ENV_FILE=/opt/quiz/api/.env npm run validate:runtime`.
7. Run `npx prisma migrate deploy`.
8. Run `npx prisma generate`.
9. Run `npm run build`.
10. Sync backend runtime files to `/opt/quiz/api`.
11. Reload `quiz-api` with PM2.

When a confirmed payment rollout also requires changing existing payment runtime values, upload
`merge-payment-runtime-config.sh` with the other deployment scripts and pipe only the private
payment overlay to it before the routine deployment. The script must use the confirmed environment,
back up the current runtime `.env`, reject non-payment keys, and never print values.

For reference, the migration guard is:

```bash
cd /opt/quiz/repo/api
npm ci
npx prisma validate
if [ -n "$SHADOW_DATABASE_URL" ]; then
  npx prisma migrate diff \
    --from-migrations prisma/migrations \
    --to-schema-datamodel prisma/schema.prisma \
    --shadow-database-url "$SHADOW_DATABASE_URL" \
    --script
else
  echo "MySQL deployment uses prisma validate + migrate deploy when no shadow database is configured."
fi
```

Interpretation:

- Empty output or a message equivalent to "No difference detected" means the schema is represented by committed migrations.
- SQL statements such as `ALTER TABLE`, `CREATE TABLE`, `DROP TABLE`, or `CREATE INDEX` mean `schema.prisma` changed without a matching migration. Stop deployment and ask for a proper migration commit.
- Do not use `npx prisma db push` to repair this during normal deployment.

Before schema/data-risk changes in the current RDS flow:

```bash
# Confirm RDS automated backup or take an explicit logical dump when requested.
```

If `npx prisma migrate deploy` fails because production already has a table or column from a prior manual `db push`:

1. Stop the deployment.
2. Inspect the failed migration SQL and production structure.
3. Use `npx prisma migrate resolve --applied <migration_name>` only when the production structure already matches that migration.
4. Record the metadata repair in the selected environment's deployment document.

## Frontend Deploy

For `test`, Vite runs locally through `deploy-test-local-build.ps1`; the ECS only verifies and synchronizes the `dist` archive.

```bash
cd /opt/quiz/repo/quiz-web
npm ci
# test
npm run build-only:test

# prod
npm run build-only

rsync -a --delete --no-owner --no-group --no-perms --omit-dir-times dist/ /opt/quiz/web/dist/
```

Both builds use same-origin `/api`. Never inject the test IP into a production build.

## Full Deploy

Run Git update, backend deploy, frontend deploy, then validation.

## Validation

Server-local:

```bash
curl -sS http://127.0.0.1:3001/api/health
curl -sS http://127.0.0.1/api/health
pm2 status --no-color
bash /tmp/quiz-deploy-*/verify-request-id.sh http://127.0.0.1/api/health quiz-api
```

Public:

```powershell
curl.exe -I "$PublicUrl/"
curl.exe -sS "$PublicUrl/api/health"
```

For production, the configured `QUIZ_PROD_PUBLIC_URL` must be the canonical HTTPS validation target.

Expected health response:

```json
{"success":true,"code":0,"errMsg":"","data":{"status":"ok"}}
```

## Deployment Record and Cleanup

Write the durable deployment record after the result is known:

- `test`: prepend the newest dated record to `文档/5. 部署方案/5.3 测试环境部署记录.md`.
- `prod`: insert the newest dated code deployment under `## 二、生产环境部署记录` in `文档/5. 部署方案/5.6 线上环境部署记录.md`; use sections one and three for domain validation and operational changes.

Include the environment, scope, branch, commit, backup manifest, migration result, validations, retries, and remaining risks. Keep actual hosts, database names, local paths, addresses, and raw server evidence out of tracked documents.

Do not generate standalone HTML reports and do not send deployment-report email. Run `cleanup-transient.ps1` after the tracked note is complete so timestamped local and remote evidence is removed.

## Known Pitfalls

- Keep SSH private keys outside the workspace in an OS-protected user directory and reference them through `.env.deploy.local`.
- PowerShell expands `$...` before remote Bash sees it. Avoid inline `node -e` or `awk` commands with `$`; use temporary script files and `scp`.
- SCP from Windows may not preserve executable bits. Bundled remote scripts are invoked explicitly with `bash`; do not require `-x` merely to call them.
- Do not print `JWT_SECRET` or API keys in command output.
- Test and production use separate RDS MySQL databases. `/opt/quiz/data/prod.db` is legacy only and should not be recreated.
- Do not silently switch environments after SSH, DNS, certificate, SMTP, or database failures.
- If `schema.prisma` changed but no migration exists, stop and ask whether to create a proper migration. Avoid routine production `db push`.

## Data Import Pattern

For one-table imports, prefer:

1. Export selected table from the source database to JSON with Prisma.
2. Upload JSON to `/opt/quiz/api`.
3. Confirm RDS backup policy or take an explicit logical dump when requested.
4. Run a temporary `.cjs` script in `/opt/quiz/api` so it can resolve `@prisma/client`.
5. Use `upsert` on the table's natural unique key.
6. Delete temporary JSON/script.
7. Verify counts and append deployment doc note.

Known previous imports:

- `User`: upsert by `email`.
- `SyllabusNode`: upsert by `examType + code`.




