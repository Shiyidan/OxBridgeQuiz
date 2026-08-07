---
name: quiz-run
description: Start or switch the QuizTestDemo local integration environment. Use when the user says “启动开发环境”, “启动测试环境”, “启动线上环境”, “切换到开发/测试/线上环境”, or asks to restart the frontend against the local, test, or production backend. For development, stop existing listeners on ports 5173, 3001, and 3307 before restarting local MySQL, API, and Vue; for test integration, require http://114.215.189.215 as the backend origin; for online integration, restart only the local Vue frontend with the production proxy configuration.
---

# Quiz Run

Start one local working environment through `scripts/start-environment.ps1`.

## Select the mode

Map the user's wording exactly:

- `开发环境` / `本地环境` -> `development`
- `测试环境` -> `test`
- `线上环境` / `生产联调环境` -> `online`

Treat “启动线上环境” as local frontend-to-production integration, not deployment. For deployment, publishing, or remote service restart, use `quiztestdemo-deploy` instead.

## Run the environment

From the repository root, run:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".agents\skills\quiz-run\scripts\start-environment.ps1" -Environment <development|test|online>
```

The script performs prerequisite validation before changing processes. Use `-ValidateOnly` when inspecting configuration or validating an updated Skill without starting or stopping anything.

## Environment behavior

### Development

Allow the bundled script to stop the exact processes listening on local ports `5173`, `3001`, and `3307`. It then starts:

1. Project-local MySQL through `scripts/start-mysql-local.ps1`.
2. Express API with `api/.env` and `npm.cmd run dev`.
3. Vue frontend with `npm.cmd run dev`.

Require successful port checks and `/api/health` before reporting success.

### Test

Restart only the local frontend listener on port `5173` with `npm.cmd run dev:test`. Require `quiz-web/.env.test.local` to contain `VITE_TEST_API_ORIGIN=http://114.215.189.215`. Reject stale or different test origins, then verify `http://127.0.0.1:5173/api/health` through the Vite proxy.

The frontend never connects to the test database directly. The test backend owns its database configuration.

### Online

Restart only the local frontend listener on port `5173` with `npm.cmd run dev:online`. Require `quiz-web/.env.online.local` to contain `VITE_ONLINE_API_ORIGIN`. Verify `http://127.0.0.1:5173/api/health` through the Vite proxy.

Do not SSH, restart production services, run migrations, or read/write production database credentials. The production backend owns its database connection.

## Safety and reporting

- Never print values from `api/.env` or any database URL, secret, token, or password.
- Do not edit `.env.test.local`, `.env.online.local`, or `api/.env` automatically. Report a missing key and stop.
- Do not kill processes outside the exact ports defined for the selected mode.
- Keep background process output under `.tmp/environment-runner/`; this directory is Git-ignored.
- Report the selected mode, local frontend URL, backend target type, verification result, and log directory.
- If startup fails, show the failing stage and relevant log file without dumping secrets.
