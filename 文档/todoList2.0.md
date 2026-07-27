# API 项目待优化清单（todoList 2.0）

> 基于 2026-06-20 对 `api/` 项目的全面代码审计，并持续补充诊断测试链路审查结果，共发现问题 31 项，按优先级排列。

---

## 总览清单

P0 安全漏洞

- [x] P0-1 诊断测试答案密钥暴露给客户端
- [x] P0-2 诊断提交接口信任客户端提供的答案
- [ ] P0-3 /papers/:id/pdf 存在开放重定向漏洞
- [ ] P0-4 正式试卷详情接口向答题端下发正确答案

P1 业务逻辑 Bug

- [x] P1-1 诊断完整报告中 isCorrect 被硬编码为 true
- [ ] P1-2 解析任务只保留前 10 道题
- [ ] P1-3 解析任务内存在服务重启后丢失
- [ ] P1-4 答题结果中无匹配题目时静默降级
- [x] P1-5 “重新测试”曾绕过诊断额度
- [ ] P1-6 诊断真题错题本未直达逐题解析

P2 代码重复 & 规范不一致

- [x] P2-1 诊断 session 链接逻辑在 register 和 login 中重复
- [x] P2-2 大纲后代编码收集逻辑重复
- [x] P2-3 requireAdmin 中间件响应格式不统一
- [x] P2-4 多处 JSON.parse(paper.questions) 未做异常防护

P3 性能 & 可扩展性

- [ ] P3-1 试题库全量加载到内存再过滤
- [x] P3-2 错题本接口无分页
- [x] P3-3 用户管理列表无分页
- [ ] P3-4 逐页解析 fire-and-forget 前端无法感知单页失败
- [x] P3-5 routes 文件拆分：papers.ts（404 行 10 接口）和 exam.ts（399 行）太胖，按子模块拆分

P4 架构性债务

- [x] P4-1 Paper.questions 作为 JSON blob 存储
- [x] P4-2 AnswerRecord.questionId 格式不统一
- [x] P4-3 JWT 登出是空操作
- [x] P4-4 无全局错误处理中间件
- [x] P4-5 JWT 密钥有硬编码回退值
- [ ] P4-6 PracticeView 同时承载诊断测试与题库练习，页面职责过重

P5 代码整洁

- [x] P5-1 数据库迁移与 Schema 不一致 — 补齐 SyllabusNode 迁移
- [x] P5-2 项目架构.md 数据模型过时 — 更新为 8 表完整定义
- [x] P5-3 scoreAnswers() 函数未被使用
- [x] P5-4 config.ts 中 __dirname 计算后未使用
- [x] P5-5 index.ts 中 import 语句放在文件末尾
- [ ] P5-6 试卷上传代码优化：移除旧上传格式并精简未使用引用

---

## P0 — 安全漏洞（需立即修复）

### P0-1 诊断测试答案密钥暴露给客户端

- **位置**：[`api/src/routes/diagnostic.ts`](api/src/routes/diagnostic.ts) `/questions` 接口
- **问题**：获取题目的同时把正确答案 `answerKey` 返回给了客户端，用户在浏览器控制台可直接看到答案
- **方案**：答案密钥仅在服务端 session 中维护，提交时由服务端自行比对，不随题目数据下发
- **处理结果**：2026-07-12 已停止挂载并删除无前端引用的旧 `/api/diagnostic` 随机诊断路由，新诊断测试统一走 `ExamRecord + AnswerRecord` 服务端判分链路

### P0-2 诊断提交接口信任客户端提供的答案

- **位置**：[`api/src/routes/diagnostic.ts`](api/src/routes/diagnostic.ts) `/submit` 接口
- **问题**：提交时要求客户端回传 `questionAnswers`（即上一接口暴露的答案），服务端用客户端提供的数据判定对错。用户可篡改获得满分
- **方案**：服务端自行维护题号→答案映射，不依赖客户端传回的 `questionAnswers`
- **处理结果**：2026-07-12 已随旧 `/api/diagnostic` 路由下线；当前交卷接口只接收 `questionId + selectedAnswer`，正确答案从 `Question` 表读取

### P0-3 /papers/:id/pdf 存在开放重定向漏洞

- **位置**：[`api/src/routes/papers.ts`](api/src/routes/papers.ts) `GET /:id/pdf`
- **问题**：直接 `res.redirect(paper.pdfUrl)` 跳转到外部 URL，攻击者可通过修改 `pdfUrl` 实施钓鱼攻击
- **方案**：校验 `pdfUrl` 是否为可信域名白名单，或改为服务端代理下载而非 302 重定向

### P0-4 正式试卷详情接口向答题端下发正确答案

- **位置**：[`api/src/routes/papers.ts`](api/src/routes/papers.ts) `GET /:id`、[`api/src/utils/questionSync.ts`](api/src/utils/questionSync.ts) `formatQuestionRow()`、[`quiz-web/src/views/questionBank/PracticeView.vue`](quiz-web/src/views/questionBank/PracticeView.vue) 诊断试卷加载逻辑
- **问题**：诊断答题页通过通用试卷详情接口读取题目，该接口未区分管理预览与学生作答场景，并返回包含 `answer` 的完整题目。用户可在浏览器 Network 或控制台中直接查看正式试卷正确答案
- **方案**：管理端保留受管理员权限保护的完整试卷详情；学生答题改用 `POST /api/exams/start` 返回的脱敏题目，或新增按 `examRecordId` 校验归属的考试题目接口，响应中移除 `answer`、解析和其他可能泄题的字段

---

## P1 — 业务逻辑 Bug（重要）

### P1-1 诊断完整报告中 isCorrect 被硬编码为 true

- **位置**：[`api/src/services/diagnostic.ts`](api/src/services/diagnostic.ts) `buildFullReportFromSession()` 函数
- **问题**：每道题的 `isCorrect` 始终为 `true`，注释说"从 answers JSON 中取"但代码从未读取，导致报告永远显示全对
- **方案**：从 `session.answers` 解析每道题的实际批改结果，正确设置 `isCorrect`
- **处理结果**：2026-07-12 已删除旧 `DiagnosticSession` 报告生成服务；历史会话仅保留作额度与统计兼容，不再生成新报告

### P1-2 解析任务只保留前 10 道题

- **位置**：[`api/src/services/parseService.ts`](api/src/services/parseService.ts) `finalizeTask()`
- **问题**：`sorted.slice(0, 10)` 硬编码，如果试卷有 20/30 题，只保存前 10 道
- **方案**：移除 `/ 10` 硬限制，或改为可配置的上限

### P1-3 解析任务内存在服务重启后丢失

- **位置**：[`api/src/services/parseService.ts`](api/src/services/parseService.ts) `Map<string, TaskCoordinator>`
- **问题**：进行中的解析任务存在内存中，服务重启后变成孤儿，ParseTask 记录永远停在 `processing` 状态
- **方案**：启动时扫描所有 `status: 'processing'` 的 ParseTask，重置为 `failed` 并写入错误信息

### P1-4 答题结果中无匹配题目时静默降级

- **位置**：[`api/src/routes/exam.ts`](api/src/routes/exam.ts) `/result` 接口
- **问题**：当 `questionMap` 匹配不到题目时返回空壳对象（空标题、空选项），前端展示空白，用户完全不知道出了什么问题
- **方案**：匹配失败时记录 warning 日志，并在返回数据中标记 `_unmatched: true`，前端据此展示降级提示

### P1-5 “重新测试”曾绕过诊断额度

- **位置**：[`quiz-web/src/views/assessment/AssessmentHomeView.vue`](quiz-web/src/views/assessment/AssessmentHomeView.vue) `handleRetestPaper()`、[`api/src/routes/exam-session.ts`](api/src/routes/exam-session.ts) `/start` 与 `/:id/submit`
- **原问题**：正式重新测试曾允许客户端信息影响额度校验，存在普通用户重复创建和提交诊断测试的风险。
- **处理结果**：2026-07-21 已统一为正式重测流程。前端复用正常开始请求；后端在开始前校验权益，并在交卷事务内复核权益，同一用户同一考试类型的进行中诊断由 `activeDiagnosticKey` 唯一约束。当前运行代码不存在任何客户端重测豁免参数。

### P1-6 诊断真题错题本未直达逐题解析

- **位置**：[`quiz-web/src/views/mistakeNotebook/MistakeNotebookView.vue`](quiz-web/src/views/mistakeNotebook/MistakeNotebookView.vue) `analysisLink()`、[`quiz-web/src/views/assessment/ExamResultDetail.vue`](quiz-web/src/views/assessment/ExamResultDetail.vue) 诊断报告分流逻辑
- **问题**：错题本“查看解析”统一跳转 `/exam-result/:id?questionId=xxx`。若记录来自诊断真题，该路由会优先分流到 ESAT/TMUA 诊断报告，`questionId` 无法进入逐题解析页面并定位对应题目
- **方案**：错题本根据 `paperType` 区分来源；诊断真题改跳转 `/exam-result/:id/questions?questionId=xxx`（`exam-question-review`），普通题库练习保持原结果页路径。复用现有 `ExamQuestionAnalysis` 的 `initialQuestionId` 定位能力，不新增题目解析组件

---

## P2 — 代码重复 & 规范不一致（应尽快改善）

### P2-1 诊断 session 链接逻辑在 register 和 login 中重复

- **位置**：[`api/src/routes/auth.ts`](api/src/routes/auth.ts) register 和 login 路由
- **问题**：一样的 ~15 行代码写了两遍，且每次都执行动态 `import('../services/diagnostic.js')`
- **方案**：抽取为 `linkOrphanDiagnosticSession(userId)` 公共函数

### P2-2 大纲后代编码收集逻辑重复

- **位置**：[`api/src/routes/papers.ts`](api/src/routes/papers.ts) `/question-bank/summary` 和 `/question-bank`
- **问题**：递归子节点收集代码出现了两次
- **方案**：抽取为 `collectDescendantCodes(nodeMap, parentCode)` 工具函数
- **处理结果**：2026-07-16 已确认两个题库接口统一调用 `collectDescendantCodes()`，原有重复实现已消除

### P2-3 requireAdmin 中间件响应格式不统一

- **位置**：[`api/src/middleware/admin.ts`](api/src/middleware/admin.ts)
- **问题**：返回 `{ code: 'FORBIDDEN', message: '无权限' }` 而不是用 `fail()` 函数，破坏了全局 `{ success, code, errMsg, data }` 响应契约
- **方案**：改为 `res.status(403).json(fail('无权限'))`

### P2-4 多处 JSON.parse(paper.questions) 未做异常防护

- **位置**：[`api/src/routes/papers.ts`](api/src/routes/papers.ts) 多处
- **问题**：如果某次解析写入了损坏的 JSON，后续所有读取该试卷的接口都会抛异常导致 500
- **方案**：封装 `safeParseQuestions(paper)` 工具函数，统一加 try-catch

---

## P3 — 性能 & 可扩展性（逐步优化）

### P3-1 试题库全量加载到内存再过滤

- **位置**：[`api/src/routes/questionBank.ts`](../api/src/routes/questionBank.ts) `GET /question-bank`（`prisma.question.findMany()`）
- **问题**：接口会一次查询符合考试类型与已发布试卷条件的全部题目，再在 Node.js 内存中完成难度、考纲节点等过滤并组装完整响应，且当前无分页。已发布题目持续增长后，数据库传输量、Node.js 堆占用与响应体大小会同步增长，并发请求下存在明显的内存峰值与响应延迟风险
- **方案**：将可表达的难度、科目及考纲编码条件下推到 Prisma 查询；为题库列表增加数据库分页，只查询当前页需要的字段。难度数量等摘要统计使用独立轻量查询或聚合，不依赖加载完整题目集合

### P3-2 错题本接口无分页

- **位置**：[`api/src/routes/exam.ts`](api/src/routes/exam.ts) `/error-book` 接口
- **问题**：返回用户全部错题，无分页参数，用户错题积累多了之后响应会很大
- **方案**：加入 `page` / `limit` 分页参数
- **处理结果**：2026-07-16 已确认接口支持 `page` / `pageSize`、返回统一分页元数据，错题本页面已接入 `AppPagination`

### P3-3 用户管理列表无分页

- **位置**：[`api/src/routes/admin.ts`](api/src/routes/admin.ts) `/users` 接口
- **问题**：返回全部用户列表，用户量增长后同样面临性能问题
- **方案**：加入 `page` / `limit` 分页参数
- **处理结果**：2026-07-16 已确认接口通过 Prisma `skip` / `take` 执行数据库分页并返回统一分页元数据，用户管理页面已接入分页组件

### P3-4 逐页解析采用 fire-and-forget 模式，前端无法感知单页失败

- **位置**：[`api/src/routes/parse.ts`](api/src/routes/parse.ts) `POST /:id/pages`
- **问题**：`addPageToTask().catch(console.error)` 不等待结果，前端只能通过轮询进度判断，页解析失败时无法定位哪一页出错
- **方案**：在 ParseTask.result 中记录每页的处理状态，轮询接口返回逐页详情

### P3-5 routes 文件拆分

- **位置**：[`api/src/routes/papers.ts`](api/src/routes/papers.ts)（404 行 10 接口）+ [`api/src/routes/exam.ts`](api/src/routes/exam.ts)（399 行）
- **问题**：papers.ts 混杂了试卷 CRUD、试题库、考纲、导入，exam.ts 混杂了交卷、结果、错题本、练习记录。单文件过长，职责不清
- **方案**：按子模块拆分——`papers.ts`（CRUD）、`papers-import.ts`（导入）、`syllabus.ts`（考纲）、`questionBank.ts`（试题库查询）、`exam.ts`（交卷+结果）、`errorBook.ts`（错题本+练习记录）。等业务稳定后执行
- **处理结果**：2026-07-16 已将 `papers.ts` 和 `exam.ts` 改为稳定的路由聚合入口；业务分别拆至 `papers-crud.ts`、`papers-import.ts`、`syllabus.ts`、`questionBank.ts`、`exam-session.ts`、`exam-results.ts`、`errorBook.ts`，公共逻辑收敛至 `papers-shared.ts` 与 `exam-shared.ts`。拆分前后 27 条路由完全一致，后端编译、前端类型检查及本地代表接口回归通过

---

## P4 — 架构性债务（长期规划）

### P4-1 Paper.questions 作为 JSON blob 存储

- **位置**：[`api/prisma/schema.prisma`](api/prisma/schema.prisma) Paper 模型
- **问题**：题目数据以 JSON 字符串存在 `questions` 字段中，导致无法对单道题建索引、无法建立题目标与大纲的外键关联、更新一道题需要读写整张试卷
- **方案**：拆分为独立的 `Question` 表（`paperId` / `number` / `title` / `options` / `answer` / `knowledgePoints` 等字段），`AnswerRecord.questionId` 改为外键指向 `Question.id`

### P4-2 AnswerRecord.questionId 格式不统一

- **位置**：[`api/src/routes/exam.ts`](api/src/routes/exam.ts) `/result` 接口
- **问题**：`questionId` 使用了 5 种不同的 key 格式去匹配题目（`q.id` / `String(q.number)` / `q-${number}` / `${paperId}-${number}` 等）
- **方案**：P4-1 完成后统一使用 `Question.id` 作为外键，消除多格式兼容

### P4-3 JWT 登出是空操作

- **位置**：[`api/src/routes/auth.ts`](api/src/routes/auth.ts) `/logout` 接口
- **问题**：什么都不做直接返回成功。JWT 无状态无法撤销，但如果需要实现强制登出（如修改密码后踢出其他设备），目前做不到
- **方案**：若需要做强制登出，引入 Redis 维护 Token 黑名单（TTL 与 JWT 过期时间一致）
- **处理结果**：2026-07-17 已确认认证链路采用短期 Access Token + 服务端 `AuthSession` + 可轮换 Refresh Token；当前设备登出会撤销对应会话并清除 Refresh Cookie，认证中间件每次请求均校验会话未撤销，原 Access Token 随即失效；同时支持全部设备登出以及修改、重置密码后撤销全部会话

### P4-4 无全局错误处理中间件

- **位置**：[`api/src/index.ts`](api/src/index.ts)
- **问题**：路由中未捕获的异常会直接导致 Express 返回 HTML 错误页面，破坏 JSON 响应契约
- **方案**：添加 `app.use((err, req, res, next) => res.status(500).json(fail(err.message)))`
- **处理结果**：2026-07-17 已新增异步 Router 工厂、JSON 404 和全局错误处理中间件；全部业务 Router 会将同步异常与 rejected Promise 转入错误链，损坏 JSON、请求体或文件过大、Zod 校验、Prisma 常见错误及未知异常均按统一 API envelope 返回，未知异常不再向客户端暴露堆栈和内部路径

### P4-5 JWT 密钥有硬编码回退值

- **位置**：[`api/src/config.ts`](api/src/config.ts)
- **问题**：`process.env.JWT_SECRET \|\| 'dev-secret-change-in-production'`，如果部署时忘记设环境变量会使用弱密钥
- **方案**：启动时检查 `JWT_SECRET` 环境变量是否存在，不存在则打印错误并 `process.exit(1)`

### P4-6 PracticeView 同时承载诊断测试与题库练习，页面职责过重

- **位置**：[`quiz-web/src/views/questionBank/PracticeView.vue`](quiz-web/src/views/questionBank/PracticeView.vue)
- **问题**：当前页面同时负责诊断真题和题库练习的数据加载、考试创建与恢复、题目导航、答案状态、逐题耗时、增量保存、交卷以及诊断分析弹窗。两种模式虽然共享答题交互，但数据源、计时规则、额度规则、保存策略和交卷后去向不同，继续扩展会增加条件分支和修改影响范围
- **方案**：拆分为 `AssessmentPracticeView` 和 `QuestionBankPracticeView` 两个业务入口；抽取共用的 `QuestionAnswerPanel`、题号导航以及答题状态/增量保存 composable。诊断页面只负责真题倒计时、恢复考试和分析弹窗，题库页面只负责筛题练习与普通结果页
- **暂缓原因**：当前两种答题链路已经稳定共用同一页面，本期优先保证诊断提交与报告闭环；待题库练习或仿真考试继续扩展时再执行页面拆分

---

## P5 — 代码整洁（低优先级）

### P5-1 scoreAnswers() 函数未被使用

- **位置**：[`api/src/services/diagnostic.ts`](api/src/services/diagnostic.ts)
- **方案**：删除或在实际调用处使用

### P5-2 config.ts 中 __dirname 计算后未使用

- **位置**：[`api/src/config.ts`](api/src/config.ts)
- **方案**：删除无用代码

### P5-1 数据库迁移与 Schema 不一致

- **位置**：[`api/prisma/migrations/`](api/prisma/migrations/)
- **问题**：SyllabusNode 表存在但无对应 migration 文件
- **方案**：2026-06-20 已补齐 `20260620000000_add_syllabus_node` 迁移，标记为已应用

### P5-2 项目架构.md 数据模型过时

- **位置**：[`项目架构.md`](项目架构.md) 2.3 节
- **问题**：只记录了 6 张表，缺少 AnswerRecord / SyllabusNode / RevenueCost，部分字段枚举值不准
- **方案**：2026-06-20 已更新为 8 表完整定义

### P5-3 scoreAnswers() 函数未被使用

- **位置**：[`api/src/services/diagnostic.ts`](api/src/services/diagnostic.ts)
- **方案**：删除或在实际调用处使用
- **处理结果**：2026-07-12 已随无引用的旧诊断报告服务一并删除

### P5-4 config.ts 中 __dirname 计算后未使用

- **位置**：[`api/src/config.ts`](api/src/config.ts)
- **方案**：删除无用代码
- **处理结果**：2026-07-12 已删除未使用的 `fileURLToPath` 和 `__dirname`

### P5-5 index.ts 中 import 语句放在文件末尾

- **位置**：[`api/src/index.ts`](api/src/index.ts) `import { success } from './utils/response.js'` 放在第 36 行
- **方案**：移动到文件顶部与其他 import 一起
- **处理结果**：2026-07-12 已将 `success` 导入移动到顶部导入区

### P5-6 试卷上传代码优化：移除旧上传格式并精简未使用引用

- **位置**：[`quiz-web/src/views/admin/PaperUpload.vue`](quiz-web/src/views/admin/PaperUpload.vue)、[`api/src/services/markdownValidator.ts`](api/src/services/markdownValidator.ts)、[`api/src/routes/papers-shared.ts`](api/src/routes/papers-shared.ts) 及拆分后的试卷、题库和考纲路由
- **问题**：上传链路同时兼容新版 `metadata + sections`、旧版 `modules[].questions`、`modules[].items`、嵌套 `questions[].items` 和扁平 `questions`，导致前后端存在重复解析、重复校验和规则遗漏风险；部分拆分路由还从 `papers-shared.ts` 批量导入了未实际使用的函数
- **方案**：
  1. 将 ESAT/TMUA 外部上传格式统一为 `metadata + sections`，移除前后端对旧外部上传结构的解析和校验分支。
  2. 删除旧格式前先盘点历史文件和数据库依赖，必要时提供一次性转换脚本；本项不删除入库后仍在使用的标准化 `moduleConfig`、`module_*` 字段和历史数据读取能力。
  3. 按实际调用精简 `questionBank.ts`、`syllabus.ts`、`papers-crud.ts`、`papers-import.ts` 的 import；将仍需复用的分页解析、学生作答安全投影、试卷权益和考纲启用逻辑拆入职责单一的工具或服务文件。
  4. 补充新版 JSON 上传、学生安全题目返回、诊断分段和考纲启用的回归测试，确认旧格式移除不影响已入库试卷的展示与作答。

---

> **共计**：31 项，已完成 14 项（P0: 4 / P1: 6 / P2: 4 / P3: 5 / P4: 6 / P5: 6）
