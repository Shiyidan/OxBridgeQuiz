# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

G5 入学考试在线练习与学习平台。当前产品重心：

- 试卷与试题库管理
- 结构化题目存储与渲染（LaTeX / SVG）
- 在线练习、模拟考、错题本、诊断报告
- 考纲管理与题目挂考纲
- 会员权益、后台运营

早期的 Qwen-VL-Max PDF/图片自动解析流程属于历史模块，非当前主线，除非用户明确要求处理旧解析。

- **后端**：Express + TypeScript + Prisma (SQLite)，位于 [api/](api/)
- **前端**：Vue 3 Composition API + TypeScript + Pinia + KaTeX + SCSS，位于 [quiz-web/](quiz-web/)

详细目录职责与路由表见 [项目架构.md](项目架构.md)。

## Commands

```bash
# Backend (api/)
cd api
npm run dev                              # dev server on :3001 (tsx watch)
npm run build                            # TypeScript compile
npx prisma migrate dev --name <desc>     # Schema 变更后生成迁移
npx prisma migrate status                # 校验迁移一致性
npx prisma studio                        # 可视化 DB 浏览器
npm run backfill:questions -- --dry-run  # Paper.questions 回填校验

# Frontend (quiz-web/)
cd quiz-web
npm run dev          # Vite dev server on :5173
npm run build        # type-check + production build
npm run type-check   # vue-tsc only
npm run lint         # ESLint + Oxlint
npm run format       # Prettier
```

Windows 下若 PowerShell 拦截 `npm.ps1` / `npx.ps1`，改用 `npm.cmd` / `npx.cmd`。

## Architecture

### 题目渲染链（关键路径）

```text
QuestionCard.vue → LatexText.vue → FormulaBlock.vue (KaTeX)
```

- `LatexText.vue` 按 `/\$\$([^$]+)\$\$|\$([^$]+)\$/g` 切分为文本 / 行内公式 / 块级公式
- `FormulaBlock.vue` 调 `katex.renderToString()`，用模块级 `Map` 缓存
- 文本段用 `white-space: pre-line` 让 `\n` 换行
- 文本段还会执行 `.replace(/\\n/g, '\n')`，兼容 Qwen 输出中的字面 `\n`

### API 响应封装

所有后端接口统一返回：

```ts
{
  success: boolean
  code: number | string    // 0=成功；1=通用失败；业务错误用可读字符串如 AUTH_WRONG
  errMsg: string
  data: T
}
```

前端 `src/utils/request.ts` 拦截器自动解包 `data`；401 自动跳 `/login`。

新增业务错误码时追加到 [1-开发规范.md](1-开发规范.md) §3.4 的错误码表。

### 分页

分页列表请求参数固定 `page` + `pageSize`，响应 `data` 形状：

```ts
{
  list: T[]
  pagination: { page, pageSize, total, totalPages, hasPrev, hasNext }
}
```

前端页面只维护 `pagination.page/pageSize/total`，分页器统一使用 [quiz-web/src/components/AppPagination.vue](quiz-web/src/components/AppPagination.vue)，通过 `v-model:page` / `v-model:page-size` 双向绑定。

分页交互规则（[1-开发规范.md](1-开发规范.md) §3.5）：

- 首次进入用 `page=1&pageSize=20`
- 点击搜索：应用草稿筛选并重置到 `page=1`
- 切页：只用已应用筛选，不用未提交的草稿
- 切 `pageSize`：保留已应用筛选，重置到 `page=1`
- 重置：清空草稿+已应用筛选，保留 `pageSize`，回到 `page=1`

### 前端 API 层

所有后端调用**必须**通过 [quiz-web/src/api/](quiz-web/src/api/) 下的模块函数发起，禁止在 `.vue` / 任意 `.ts` 中直接 `request.get/post`。

API 模块结构：先写类型（`interface`），再写函数，函数体统一用 `callApi<T>({ url, method, isAllData, params?, body? })`。

- `isAllData: false`（绝大多数场景）：拦截器已解包，直接拿 `data`
- `isAllData: true`：需要响应头 / 状态码 / 完整 AxiosResponse 时

### PDF 解析流程（历史模块）

```text
上传 PDF/图片 → 浏览器 pdf.js 逐页渲染为 JPEG base64
  → 逐页 POST /parse-tasks/:id/pages
  → Qwen-VL-Max 单页识别（信号量并发 5）
  → parseService.ts 汇合、去重、排序，写入 Paper.questions
```

非当前主线，除非用户明确要求，不要动这条路径。

## Data model

当前 Prisma 模型：

```text
Paper, Question, ParseTask,
User, DiagnosticSession, ExamRecord, AnswerRecord,
SyllabusNode, Syllabus,
RevenueCost,
MembershipPlan, UserMembership, EntitlementConfig
```

详见 [api/prisma/schema.prisma](api/prisma/schema.prisma) 与 [3.2 数据库构建.md](3.2%20数据库构建.md)。

### 关键数据规则

- **`Question` 是唯一正式数据源**：业务查询、答题、诊断报告、错题本都从 `Question` 读；`Paper.questions` 只作历史兼容和回填输入，新功能不得读写。
- 上传解析、JSON/Markdown 导入、试卷编辑创建/更新题目必须通过 `syncPaperQuestions` 写入 `Question`。
- 历史 `Paper.questions` 回填用 `npm run backfill:questions`；先 `-- --dry-run`，确认无问题再正式跑；确认旧 JSON 不再需要后才追加 `-- --clear-legacy`。
- 所有 DB 读写必须走 Prisma Client（[api/src/services/prisma.ts](api/src/services/prisma.ts)），**禁止** raw SQL。
- 排序优先用数据库 `orderBy`，前端只做兜底。
- JSON 字段（`options` / `answer` / `knowledgePoints` / `syllabusPoints` / `tags`）：写入前 `JSON.stringify`，API 返回前必须 `JSON.parse`。
- 关联查询用 `include`，不要多次单表查询。
- 角色、状态、套餐、考试类型等枚举值必须集中定义常量，禁止在业务代码里散落硬编码字符串。
- 语义不混用：`role` 只表达身份；`paymentStatus` 只保留学生旧付费状态；会员权益走会员表 + 权益接口。

### Schema 变更流程

1. 改 [api/prisma/schema.prisma](api/prisma/schema.prisma)
2. 在 `api/` 下跑 `npx prisma migrate dev --name <desc>`
3. `npx prisma migrate status` 确认一致
4. **同步更新 [3.2 数据库构建.md](3.2%20数据库构建.md)**（新增/修改/删除表或字段都要维护）
5. 有历史数据要迁移的，先写并验证迁移脚本，再删旧列

⛔ **禁止 `prisma db push`**：会绕过迁移历史造成 Schema / 数据库 / 迁移文件三者不一致。若已误用，用 `migrate diff` → `migrate dev --create-only` → `migrate resolve --applied` 修复，详见 [1-开发规范.md](1-开发规范.md) §2.1.1。

不得手动创建或删除 `api/prisma/migrations/` 下的文件（除非是评审过的修复操作）。

### 题目数据格式

- 题干 `title` 段落分隔用 `\n\n`，前端 `white-space: pre-line` 渲染
- 图片优先 SVG（`QuestionImage.type = "svg"`），PNG 仅用于照片 / 复杂位图
- 选项 JSON：`[{"label": "A", "text": "..."}]`
- 答案 JSON：`["A"]`（数组，支持多选）

## Comment & file header conventions

- **路由注释**：放在路由定义**上方**，只写页面名称，不写功能描述、不写装饰性分隔线。层级由嵌套 `children` 表达，不在注释里模拟层级。禁止行尾注释。
- **代码注释**：只写 **WHY**，不写 **WHAT**。一行最多。
- **禁止无期限 `// TODO`**：如需保留，附时间或明确条件。
- **组件 / 工具文件顶部**：一行简述用途和使用位置。

### 前端页面方法注释

以下场景需要在方法定义或关键调用的上一行加一行注释，说明业务原因或来源上下文（不复述代码表面）：

- 页面初始化时的接口调用（`onMounted` 里的加载）
- 会改变业务来源 / 页面上下文的方法（如诊断测试→套卷答题、试题库→练习）
- 会持久化数据的方法（交卷、发布、状态更新）
- 会跳转到关键流程的方法（进后台、进上传页、看报告）

共用页面必须标注来源差异（例如答题页/结果页依赖 `paperId`、`source`、`paperType` 等上下文字段）。

## Style system

样式使用 CSS 变量，**不引入 Tailwind**，禁止硬编码色值、禁止 `!important`、禁止行内 `style="..."`、禁止 >3 层嵌套选择器。完整 token（色板 / 排版 / 间距 / 圆角阴影 / 按钮 / 卡片 / 导航 / Hero / 断点）见 [2-样式规范.md](2-样式规范.md)。

常用规则速查：

- 卡片：`--radius-xl` 或 `--radius-2xl` + `--shadow-sm`，hover 时边框转主色 + `--shadow-lg` + `translateY(-4px)`
- 按钮圆角：`--radius-md`；三种变体 `primary` / `secondary` / `ghost`
- 页面容器：`max-width: var(--container-max); margin: 0 auto; padding: 0 var(--container-px)`
- 章节间距：桌面 `--space-20`（80px），移动端 `--space-12`（48px）
- 交互过渡：不低于 `0.2s`
- 组件命名：文件 `PascalCase.vue`，class `kebab-case`

## Deployment

生产部署使用 `quiztestdemo-deploy` 技能。生产走 Prisma 迁移，不使用 `db push`。部署必须保留：

- `/opt/quiz/api/.env`
- `/opt/quiz/data/prod.db`

部署报告生成到 [deployment-reports/](deployment-reports/)。授权 `agently-cli +me` 为 `solveark@agent.qq.com` 后，deploy 技能会通过 Agent Mail 发送 HTML 报告。

## Reference docs

| 文档 | 内容 |
| ---- | ---- |
| [1-开发规范.md](1-开发规范.md) | 注释 / 数据库 / API 响应 / 前端 API 层 / 页面方法注释规范（本文所有条目的权威源） |
| [2-样式规范.md](2-样式规范.md) | 设计 token、按钮/卡片/导航/Hero、响应式、命名 |
| [3-技术方案.md](3-技术方案.md) / [3.1](3.1%20技术实现方案详解.md) | 整体技术方案 |
| [3.2 数据库构建.md](3.2%20数据库构建.md) | 数据模型详细文档（Schema 变更必须同步维护） |
| [3.3 登录模块技术方案.md](3.3%20登录模块技术方案.md) | 登录 / 注册 / JWT |
| [3.4 试卷上传解析技术方案.md](3.4%20试卷上传解析技术方案.md) | PDF → Qwen 解析（历史模块） |
| [4.1错题本.md](4.1错题本.md) / [4.2 会员权益.md](4.2%20会员权益.md) / [4.3个人中心.md](4.3个人中心.md) / [4.4登录注册.md](4.4登录注册.md) / [4.5 考纲管理.md](4.5%20考纲管理.md) | 各业务模块方案 |
| [5-部署方案.md](5-部署方案.md) | 部署方案 |
| [项目架构.md](项目架构.md) | 目录职责、API 路由表、路由层级、路由守卫 |
