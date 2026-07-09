# AGENTS.md

This file provides guidance to Codex when working with code in this repository.

## Project Overview

Online quiz and learning web app for G5 entrance exams. The current product focus is:

- exam paper and question bank management
- structured question storage and rendering
- online practice, exam taking, mistake review, and diagnostic reports
- syllabus management and question-to-syllabus mapping
- membership, entitlement, and admin operations

The earlier Qwen-VL-Max PDF/image automatic parsing flow is not part of the current active development focus. Do not treat it as the primary product path unless the user explicitly asks to work on legacy parsing.

- **Backend**: Express + TypeScript + Prisma (MySQL) in `api/`
- **Frontend**: Vue 3 Composition API + TypeScript + Pinia + KaTeX + SCSS in `quiz-web/`

## Commands

```bash
# Backend (api/)
cd api
npm run dev          # Start dev server on :3001 (tsx watch)
npm run build        # TypeScript compile
.\node_modules\.bin\prisma.cmd migrate dev --name <desc> --schema prisma/schema.prisma
.\node_modules\.bin\prisma.cmd migrate status --schema prisma/schema.prisma
.\node_modules\.bin\prisma.cmd studio --schema prisma/schema.prisma

# Frontend (quiz-web/)
cd quiz-web
npm run dev          # Start Vite dev server on :5173
npm run build        # Type-check + production build
npm run type-check   # vue-tsc type check only
npm run lint         # ESLint + Oxlint
npm run format       # Prettier
```

On Windows, if PowerShell blocks `npm.ps1` or `npx.ps1`, use `npm.cmd` or `npx.cmd`.

### Windows Development Notes

Use these rules to avoid repeated Windows/Prisma/tooling friction:

- Prefer project-local Prisma commands from `api/`: `.\node_modules\.bin\prisma.cmd ...`. This avoids `npx` trying to reach the npm registry or write user-level cache directories.
- If `prisma generate` fails with `EPERM` while renaming `query_engine-windows.dll.node`, a running Node/API process is holding Prisma's engine DLL. Stop the backend process first, then rerun `.\node_modules\.bin\prisma.cmd generate --schema prisma/schema.prisma`.
- Do not leave the client in `PRISMA_GENERATE_NO_ENGINE=1` mode. That can be used only as a temporary diagnostic workaround; regenerate normally before finishing work.
- If `prisma migrate dev` refuses to run because the environment is non-interactive, use a non-interactive Prisma migration flow: create a migration SQL with `prisma migrate diff`, put it under `api/prisma/migrations/<timestamp_name>/migration.sql`, then apply it with `prisma migrate deploy`.
- Keep MySQL migration SQL files UTF-8 without BOM. A BOM at the start of `migration.sql` can make MySQL fail in the shadow database with syntax errors near `-- CreateTable`.
- For MySQL shadow database errors, local development may require granting the local dev user permission to create/drop shadow databases. This is for local MySQL only; production RDS should use least-privilege deployment credentials.
- Long-running dev servers started through tool calls may be killed by command timeouts. Prefer starting them from a normal user terminal: `scripts/start-mysql-local.cmd`, `scripts/start-api-dev.cmd`, and `cd quiz-web && npm.cmd run dev`.
- Verify services with ports and health checks: `netstat -ano | findstr ":3001 :5173 :3307"` and `Invoke-WebRequest -UseBasicParsing http://localhost:3001/api/health`.
- In PowerShell one-liners, escape Prisma `$disconnect()` as ``prisma.`$disconnect()`` or put the script in a file. Otherwise `$disconnect` is treated as a PowerShell variable.

## Architecture

### Question Rendering Chain

```text
QuestionCard.vue -> LatexText.vue -> FormulaBlock.vue (KaTeX)
```

- `LatexText.vue` splits text by `/\$\$([^$]+)\$\$|\$([^$]+)\$/g` into text, inline LaTeX, and display LaTeX parts.
- `FormulaBlock.vue` calls `katex.renderToString()` with a module-level `Map` cache.
- Text parts use `white-space: pre-line` so real `\n` newlines render as line breaks.
- Text parts also run `.replace(/\\n/g, '\n')` to normalize literal backslash-n sequences.

### API Response Format

All backend endpoints must return:

```ts
{
  success: boolean
  code: number | string
  errMsg: string
  data: T
}
```

Use `code: 0` for success, `code: 1` for generic failures, and readable string codes for business errors such as `AUTH_WRONG`. Frontend `request.ts` unwraps `data` and redirects to `/login` on 401.

### Frontend API Layer

All backend calls must go through module functions under `quiz-web/src/api/`. Do not call `request.get/post` directly from Vue pages or arbitrary `.ts` files.

API modules should define types first, then API functions. Use `callApi<T>(config)` from `src/utils/request.ts`, and always specify:

- `method`
- `url`
- `isAllData`
- `params` or `body` when needed

Use `isAllData: false` for normal unwrapped API data. Use `true` only when the caller needs response headers, status, or the full Axios response.

### Pagination

Paginated list APIs use `page` and `pageSize` query params. The response `data` shape must be:

```ts
{
  list: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
    hasPrev: boolean
    hasNext: boolean
  }
}
```

Frontend pages should use `src/components/AppPagination.vue`, keep only `pagination.page`, `pagination.pageSize`, and `pagination.total` locally, and pass them with `v-model:page` and `v-model:page-size`.

Search and pagination behavior:

- initial load uses `page=1&pageSize=20`
- clicking search applies draft filters and resets to `page=1`
- page changes use the applied filters, not unsent draft filters
- changing `pageSize` keeps applied filters and resets to `page=1`
- reset clears draft and applied filters, keeps current `pageSize`, and resets to `page=1`

## Data Model

Current Prisma models include:

```text
Paper
Question
ParseTask
User
DiagnosticSession
ExamRecord
AnswerRecord
SyllabusNode
Syllabus
RevenueCost
MembershipPlan
UserMembership
EntitlementConfig
```

See `api/prisma/schema.prisma` and `3.2 数据库构建.md`.

## Database Rules

- `Question` is the single official question data source for business queries, exams, reports, and mistake notebooks.
- `Paper.questions` is legacy compatibility and backfill input only. New features must not read from or write to it.
- JSON/Markdown import and question editing flows that create or update questions must write through `syncPaperQuestions`.
- Historical `Paper.questions` backfill uses `api` script `npm run backfill:questions`; run with `-- --dry-run` first, and only use `-- --clear-legacy` after confirming legacy JSON is no longer needed.
- All database access must go through Prisma Client from `api/src/services/prisma.ts`; do not use raw SQL.
- Prefer database `orderBy` for sorted query results; frontend sorting is only a fallback.
- MySQL JSON fields such as `options`, `answer`, `knowledgePoints`, `syllabusPoints`, `meta`, `examPreferences`, `answers`, `sourceJson`, and `result` must be written as arrays/objects through Prisma, not as JSON strings. Use `api/src/utils/jsonField.ts` only to normalize legacy string JSON when reading old data.
- Use `include` for relations instead of repeated single-table queries.
- Roles, statuses, plans, and exam types must be centralized constants, not scattered hard-coded strings.
- Do not mix semantics in one field: `role` is identity only, `paymentStatus` is legacy student payment state only, and memberships/entitlements are represented by membership tables and entitlement APIs.

### Schema Changes

For every Prisma schema change:

1. Update `api/prisma/schema.prisma`.
2. Run `.\node_modules\.bin\prisma.cmd migrate dev --name <desc>` from `api/` in a real terminal when possible.
3. If the environment is non-interactive, use `migrate diff` + `migrate deploy` instead of `migrate dev`.
4. Run `.\node_modules\.bin\prisma.cmd migrate status --schema prisma/schema.prisma`.
5. Update `3.2 数据库构建.md` with model and field changes.
6. If historical data must move, write and verify a migration/backfill script before deleting old columns.

Do not use `prisma db push` in normal development or deployment. If it was used accidentally, repair the migration history with `migrate diff`, `migrate dev --create-only`, and `migrate resolve --applied` as documented in `1-开发规范.md`.

Do not manually create or delete files under `api/prisma/migrations/` except through Prisma migration commands or an explicitly reviewed repair.

## Question Data Rules

- Paragraph breaks in `Question.title` use `\n\n`.
- Frontend rendering uses `white-space: pre-line`.
- Images should prefer SVG. Use PNG only for photos or complex raster graphics.
- Options JSON format is `[{"label": "A", "text": "..."}]`.
- Answers JSON format is `["A"]`; keep it an array to support multi-select.

## Comment And File Header Rules

- Route comments go above the route definition, not at end of line.
- Route comments are short page labels only; no decorative separators and no long functional descriptions.
- Route hierarchy is expressed by nested `children`, not by comment prefixes.
- Code comments explain WHY, not WHAT. Keep them to one line.
- Do not leave open-ended `TODO` comments. If needed, include a date or clear condition.
- Vue components and utility files should start with a one-line header describing purpose and where they are used.

## Frontend Page Method Comments

Add one-line comments above methods or key calls when they:

- load page data on initialization
- change business source or page context
- persist business data, such as submit exam, publish paper, update status
- navigate into key flows, such as admin, upload, or report pages

Comments should explain the business reason or source context, not repeat the code surface.

## Deployment

Use the `quiztestdemo-deploy` skill for production deployment. Normal production deployment uses Prisma migrations, not `db push`, and must preserve:

- `/opt/quiz/api/.env`
- production database data in RDS MySQL; do not rely on `/opt/quiz/data/prod.db` for new production deployments.

Deployment reports are generated under `deployment-reports/`. The deploy skill is configured to send the HTML report through Agent Mail when `agently-cli +me` is authorized as `solveark@agent.qq.com`.
