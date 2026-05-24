# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Online exam parsing and quiz web app for G5 entrance exams. Upload PDF exam papers → Qwen-VL-Max AI parses questions/formulas/diagrams → structured quiz with online answering and diagnostic reports.

- **Backend**: Express + TypeScript + Prisma (SQLite) at `api/`
- **Frontend**: Vue 3 Composition API + TypeScript + Pinia + KaTeX + SCSS at `quiz-web/`

## Commands

```bash
# Backend (api/)
cd api
npm run dev          # Start dev server on :3001 (tsx watch)
npm run build        # TypeScript compile
npx prisma migrate dev --name <desc>   # DB migration after schema change
npx prisma studio    # Visual DB browser

# Frontend (quiz-web/)
cd quiz-web
npm run dev          # Start Vite dev server on :5173
npm run build        # Type-check + production build
npm run type-check   # vue-tsc type check only
npm run lint         # ESLint + Oxlint
npm run format       # Prettier
```

## Architecture

### Question rendering chain (critical path)

```
QuestionCard.vue → LatexText.vue → FormulaBlock.vue (KaTeX)
```

- **LatexText.vue** splits text by regex `/\$\$([^$]+)\$\$|\$([^$]+)\$/g` into text/latex/latex-display parts
- **FormulaBlock.vue** calls `katex.renderToString()` with module-level `Map` cache
- Text parts get `white-space: pre-line` to render actual `\n` newlines as line breaks
- Text parts also undergo `.replace(/\\n/g, '\n')` to convert literal backslash-n sequences (from Qwen output inconsistencies) into real newlines

### API response format

All endpoints return `{ success: boolean, code: number, errMsg: string, data: T }`. Frontend Axios interceptor in `request.ts` auto-unwraps the `data` field and redirects to `/login` on 401.

### PDF parse flow

```
upload PDF/image → browser pdf.js renders pages to JPEG base64 (or direct image bytes)
→ per-page POST to parse-tasks/:id/pages → Qwen-VL-Max per-page recognition → JSON
→ parseService.ts deduplicates, sorts, writes Paper.questions
```

### Data model

6 tables: User, Paper (with JSON `questions` column), ParseTask, DiagnosticSession, ExamRecord, AnswerRecord. See `api/prisma/schema.prisma`.

## Key conventions

- **Route comments**: above the route definition, short label only, no inline comments. Hierarchy via nested `children`.
- **Code comments**: WHY only, never WHAT. One line max.
- **Component file header**: one-line description of what it does and where it's used.
- **Question data**: paragraph breaks in `title` use `\n\n`, rendered via `white-space: pre-line`. Images prefer SVG over PNG. Options JSON: `[{"label": "A", "text": "..."}]`. Answers JSON: `["A"]`.
- **DB changes**: after schema change, run `prisma migrate dev` AND update `数据库构建.md`.
- **All DB access**: through Prisma Client (`api/src/services/prisma.ts`), never raw SQL.
