# AGENTS.md

本文件用于指导 Codex 在此仓库中进行代码相关工作。

## 项目概述

这是一个面向 G5 入学考试的在线测验与学习 Web 应用。当前产品重点包括：

- 试卷与题库管理
- 结构化题目存储与渲染
- 在线练习、考试作答、错题复习与诊断报告
- 教学大纲管理以及题目与教学大纲的映射
- 会员、权益与后台管理操作

早期基于 Qwen-VL-Max 的 PDF/图片自动解析流程不属于当前活跃开发重点。除非用户明确要求处理旧版解析功能，否则不要将其视为主要产品路径。

## 技术栈与目录结构

- 后端：Express + TypeScript + Prisma + MySQL
- 前端：Vue 3 Composition API + TypeScript + Pinia + Element Plus + KaTeX + SCSS
- 构建工具：Vite
- 前后端通信：Axios，通过统一 API 层调用

```text
api/
├─ prisma/
│  ├─ schema.prisma       # 数据模型
│  └─ migrations/         # Prisma 迁移
├─ scripts/               # 数据迁移和维护脚本
└─ src/
   ├─ constants/          # 业务常量与枚举
   ├─ middleware/         # Express 中间件
   ├─ routes/             # HTTP 接口与参数边界
   ├─ services/           # 业务服务与 Prisma Client
   └─ utils/              # JSON、题目同步等通用逻辑

quiz-web/src/
├─ api/                   # 前端 API 类型与请求函数
├─ components/            # 项目级公共组件
├─ views/                 # 业务页面
├─ stores/                # Pinia 状态管理
├─ router/                # 路由配置
├─ utils/                 # 请求、格式化等工具
└─ types/                 # 公共 TypeScript 类型

文档/
├─ 1-开发规范.md           # 编码、数据库、API 和组件规范
├─ 3.1 技术实现方案详解.md # 题目渲染等技术实现
├─ 3.2 数据库构建.md       # 数据模型与迁移记录
└─ 3.4 试卷上传解析技术方案.md # 外部题目导入与校验
```

详细模块关系与业务架构参见 `文档/项目架构.md`。

## 命令

```bash
# 后端（api/）
cd api
npm run dev          # 在 :3001 启动开发服务器（tsx watch）
npm run build        # TypeScript 编译
.\node_modules\.bin\prisma.cmd migrate dev --name <desc> --schema prisma/schema.prisma
.\node_modules\.bin\prisma.cmd migrate status --schema prisma/schema.prisma
.\node_modules\.bin\prisma.cmd studio --schema prisma/schema.prisma

# 前端（quiz-web/）
cd quiz-web
npm run dev          # 在 :5173 启动 Vite 开发服务器
npm run build        # 类型检查 + 生产构建
npm run type-check   # 仅运行 vue-tsc 类型检查
npm run lint         # ESLint + Oxlint
npm run format       # Prettier
```

在 Windows 上，如果 PowerShell 阻止运行 `npm.ps1` 或 `npx.ps1`，请使用 `npm.cmd` 或 `npx.cmd`。

### Windows 开发注意事项

请遵循以下规则，避免反复遇到 Windows、Prisma 与工具链问题：

- 优先在 `api/` 中使用项目本地的 Prisma 命令：`.\node_modules\.bin\prisma.cmd ...`。这样可以避免 `npx` 尝试访问 npm registry 或写入用户级缓存目录。
- 如果 `prisma generate` 在重命名 `query_engine-windows.dll.node` 时因 `EPERM` 失败，说明正在运行的 Node/API 进程占用了 Prisma 引擎 DLL。请先停止后端进程，再重新运行 `.\node_modules\.bin\prisma.cmd generate --schema prisma/schema.prisma`。
- 不要让客户端持续处于 `PRISMA_GENERATE_NO_ENGINE=1` 模式。该模式只能作为临时诊断手段；完成工作前必须按正常方式重新生成。
- 如果环境不支持交互操作，导致 `prisma migrate dev` 拒绝运行，请使用非交互式 Prisma 迁移流程：通过 `prisma migrate diff` 创建迁移 SQL，将其放入 `api/prisma/migrations/<timestamp_name>/migration.sql`，然后使用 `prisma migrate deploy` 应用迁移。
- MySQL 迁移 SQL 文件必须使用不带 BOM 的 UTF-8 编码。`migration.sql` 开头的 BOM 可能导致 MySQL 在影子数据库中于 `-- CreateTable` 附近报语法错误。
- 遇到 MySQL 影子数据库错误时，本地开发环境可能需要向本地开发用户授予创建/删除影子数据库的权限。该要求仅适用于本地 MySQL；生产环境 RDS 应使用最小权限的部署凭据。
- 通过工具调用启动的长时间运行开发服务器可能会因命令超时而被终止。优先从普通用户终端启动：`scripts/start-mysql-local.cmd`、`scripts/start-api-dev.cmd`，以及 `cd quiz-web && npm.cmd run dev`。
- 通过端口和健康检查验证服务：`netstat -ano | findstr ":3001 :5173 :3307"` 和 `Invoke-WebRequest -UseBasicParsing http://localhost:3001/api/health`。
- 在 PowerShell 单行命令中，将 Prisma 的 `$disconnect()` 转义为 ``prisma.`$disconnect()``，或将脚本放入文件中。否则 `$disconnect` 会被当作 PowerShell 变量处理。

## 架构

### 题目渲染链路

修改题目展示前，应先查阅 `文档/3.1 技术实现方案详解.md` 中的题目渲染说明，不要在页面中重复实现 LaTeX、图片或题干渲染逻辑。

### API 响应格式

所有后端接口必须返回：

```ts
{
  success: boolean
  code: number | string
  errMsg: string
  data: T
}
```

成功时使用 `code: 0`，通用失败使用 `code: 1`，业务错误使用可读的字符串错误码，例如 `AUTH_WRONG`。前端 `request.ts` 会解包 `data`；服务端确认登录会话失效时，前端清除认证状态并返回首页。

### 前端 API 层

所有后端调用必须通过 `quiz-web/src/api/` 下的模块函数发起。不要在 Vue 页面或任意 `.ts` 文件中直接调用 `request.get/post`。

API 模块应先定义类型，再定义 API 函数。使用 `src/utils/request.ts` 中的 `callApi<T>(config)`，并始终指定：

- `method`
- `url`
- 需要时指定 `params` 或 `body`

`callApi<T>()` 始终返回统一响应包中已解包的 `data`。业务页面不得访问 Axios 的完整响应或 `error.response`；页面需要保留错误信息或按错误码分支时，使用 `request.ts` 提供的公共错误辅助函数。

### 分页

分页列表统一使用 `quiz-web/src/components/AppPagination.vue`，页面不得直接使用 `el-pagination` 或重复实现分页控件。分页参数、响应结构以及搜索与筛选状态规则遵循 `文档/1-开发规范.md`。

### 前端组件复用

前端优先复用 `quiz-web/src/components/` 中已有的项目组件，其次使用 Element Plus。两者不能满足需求时，优先封装可复用的项目组件；原生 HTML/CSS 实现仅用于简单语义结构或必要的定制场景。具体规则遵循 `文档/1-开发规范.md`。

## 数据模型

当前 Prisma 模型包括：

```text
Paper
Question
ParseTask
User
AuthSession
EmailVerificationChallenge
DiagnosticSession
ExamRecord
AnswerRecord
DiagnosticReportTask
DiagnosticReport
SyllabusNode
Syllabus
RevenueCost
MembershipPlan
UserMembership
EntitlementConfig
```

参见 `api/prisma/schema.prisma` 和 `文档/3.2 数据库构建.md`。以 Prisma schema 为当前模型的最终依据。

## 数据库规则

- `Question` 是业务查询、考试、报告和错题本唯一的官方题目数据源。
- `Paper.questions` 仅用于旧版兼容和数据回填输入。新业务不得从中读取题目，也不得向其中保存或更新题目内容；兼容和回填流程可以清空该字段。
- 创建或更新题目的 JSON/Markdown 导入流程和题目编辑流程必须通过 `syncPaperQuestions` 写入。
- 历史 `Paper.questions` 数据回填使用 `api` 中的脚本 `npm run backfill:questions`；应先使用 `-- --dry-run` 运行，仅在确认不再需要旧版 JSON 后才使用 `-- --clear-legacy`。
- 所有数据库访问必须通过 `api/src/services/prisma.ts` 中的 Prisma Client 完成；不要使用原始 SQL。
- 排序查询结果时优先使用数据库的 `orderBy`；前端排序仅作为兜底方案。
- Prisma `Json`/`Json?` 字段必须写入对应的结构化 JSON 值，不要预先 `JSON.stringify`。仅在读取旧数据时使用 `api/src/utils/jsonField.ts` 兼容字符串 JSON。
- 需要关联数据时优先使用 Prisma 的 `include` 或 `select`，避免 N+1 查询。
- 角色、状态、套餐和考试类型应复用 `api/src/constants/` 中的集中定义，不要新增散落的硬编码字符串。
- 不要在一个字段中混合多种语义：`role` 仅表示身份，`paymentStatus` 仅表示旧版学生付款状态，会员与权益通过会员表和权益 API 表示。

### Schema 变更

每次修改 Prisma schema 时：

1. 更新 `api/prisma/schema.prisma`。
2. 按“Windows 开发注意事项”中的交互式或非交互式流程生成并应用迁移；不要使用 `prisma db push`。
3. 运行 `.\node_modules\.bin\prisma.cmd migrate status --schema prisma/schema.prisma`。
4. 同步更新 `文档/3.2 数据库构建.md` 中的模型和字段。
5. 如果必须迁移历史数据，请先编写并验证迁移/回填脚本，再删除旧字段。

除非通过 Prisma 迁移命令生成，或正在执行经过明确审核的迁移历史修复，否则不要手动创建或删除 `api/prisma/migrations/` 下的文件。误用 `db push` 时，按照 `文档/1-开发规范.md` 修复迁移历史。


## 注释与文件头规则

- 路由注释放在路由定义上方，不要放在行尾。
- 路由注释仅使用简短的页面标签；不要使用装饰性分隔线，也不要写冗长的功能描述。
- 路由层级通过嵌套的 `children` 表达，不通过注释前缀表达。
- 文件中自行定义的具名 `function`、函数表达式、业务事件处理函数和 Vue `computed` 应在定义上方添加一行注释，说明业务职责、数据来源、派生规则或上下文原因。
- 页面初始化、业务来源切换、数据持久化和关键流程导航等调用，应在方法定义或关键调用上方说明其承接的业务流程。
- 注释应解释业务意图或“为什么”，不要复述函数名及代码表面行为；简单内联回调、框架钩子参数和语义完全清晰的通用工具函数可以不写注释。
- 不要留下无明确结束条件的 `TODO` 注释。如确有需要，请注明日期或清晰的触发条件。
- Vue 组件和工具文件应以一行文件头开头，说明其用途及使用位置。
- 详细适用范围和示例遵循 `文档/1-开发规范.md`。

## 部署

生产部署使用 `quiztestdemo-deploy` skill。正常生产部署使用 Prisma 迁移，不使用 `db push`，并且必须保留：

- `/opt/quiz/api/.env`
- RDS MySQL 中的生产数据库数据；新的生产部署不得依赖 `/opt/quiz/data/prod.db`

保留服务器 `.env` 不代表忽略配置演进。每次部署后端前必须先备份现有 `.env`，根据 `api/.env.example` 合并新增配置，并在目标服务器的仓库目录执行：

```bash
cd /opt/quiz/repo/api
API_ENV_FILE=/opt/quiz/api/.env npm run validate:runtime
```

该命令必须成功验证目标运行环境、数据库连接和 SMTP 登录后，才能执行 PM2 重载。测试和线上环境必须显式提供 `API_RUNTIME_ENV`、`JWT_SECRET`、`EMAIL_CODE_SECRET`、`SMTP_USER`、`SMTP_PASS` 和 `MAIL_FROM`；不得依赖本地默认值。部署完成后还需验证 `/api/health` 和至少一条依赖数据库的只读接口。

部署报告仅生成到被 Git 忽略的本地目录中。邮件发送账号、收件人和 SMTP 配置必须来自 `.env.deploy.local`，不得写入仓库；仅在用户明确要求发送时使用。
