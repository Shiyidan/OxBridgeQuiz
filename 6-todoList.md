# 待实现方案

> 讨论中确定的技术方案，按模块分组。已完成项用 √ 标记。

---

## 总览清单

解析系统

- [ ] 移除 10 页 / 10 题硬限制
- [√] Qwen 提示词优化（提高 SVG 完整率 + 段落换行准确率）
- [√] 封面检测改用 Qwen 语义判断
- [ ] 增量解析与断点续传
- [√] Qwen API 并行解析（3-5 并发信号量控制）
- [√] PDF 渲染前端化（pdf.js 替代 Python）

基础设施

- [ ] PDF 原文件 OSS 存储（替代本地磁盘）
- [ ] 生产环境 API Key 安全管理（环境变量注入 + 日志脱敏）

数据库

- [√] 数据库重构：JSON 列拆分为 Question / PaperQuestion 关联表

功能开发

- [ ] 错题本功能（ExamRecord + AnswerRecord 表 + 前端页面）
- [ ] 自由组卷功能（多条件筛选 + 动态拼题 + 生成试卷）
- [√] SVG 缺失宽高自动补齐（parseService + PaperPreview CSS 兜底）



---

## 解析系统

### 移除 10 页 / 10 题硬限制

- **位置**：[`api/src/services/parseService.ts`](api/src/services/parseService.ts)
- **问题**：`Math.min(pages.length, 10)` 和 `.slice(0, 10)` 硬编码，40 页试卷只解析前 10 页，题目也只保留前 10 道
- **方案**：移除或改为可配置上限；配合已有的 5 并发信号量，完整解析 40 页约 2-3 分钟

### Qwen 提示词优化

- **位置**：[`api/src/services/qwenService.ts`](api/src/services/qwenService.ts) `SYSTEM_PROMPT`
- **问题**：Qwen-VL-Max 偶发忽略 SVG width/height 指令，多段题干有时被合并为单段丢失 `\n\n` 分隔
- **方案**：在 prompt 中加入反面示例（错误 vs 正确 SVG 对比）、Few-shot 完整 JSON 范例、降低 temperature 提高输出一致性

### 封面检测改用 Qwen 语义判断

- **位置**：[`quiz-web/src/utils/pdfRenderer.ts`](quiz-web/src/utils/pdfRenderer.ts)
- **问题**：硬编码 `coverTextThreshold`（文字 < 100 字符即跳过），封面有表格时误判为试题页，纯图表题被误判为封面
- **方案**：删除前端硬规则，所有页发给 Qwen，封面/目录页 Qwen 自然返回 0 题自动过滤，多余调用极少（一份试卷仅 1-2 封面页）

### 增量解析与断点续传

- **位置**：[`api/src/services/parseService.ts`](api/src/services/parseService.ts)
- **问题**：解析中途服务重启后，已完成的页全部白费，需从头重跑；且前端无法感知逐页进度
- **方案**：每页完成时立刻追加写入 `Paper.questions`，`ParseTask.result` 记录已完成页码；重试时跳过已完成页，40 页挂了 30 页只需补跑 10 页

---

## 基础设施

### PDF 原文件 OSS 存储

- **位置**：[`api/src/routes/upload.ts`](api/src/routes/upload.ts) + [`api/src/routes/papers.ts`](api/src/routes/papers.ts) `/pdf` 路由
- **问题**：PDF 存服务器本地磁盘，容器重启丢失、多实例不共享、磁盘容量有限
- **方案**：改用阿里云 OSS SDK 上传，`Paper.pdfUrl` 存储 OSS key；下载时生成临时签名 URL（5 分钟有效）返回前端

### 生产环境 API Key 安全管理

- **位置**：[`api/src/config.ts`](api/src/config.ts) + [`api/src/services/qwenService.ts`](api/src/services/qwenService.ts)
- **问题**：DashScope API Key 可能硬编码或通过不安全方式传递，日志中可能泄露
- **方案**：API Key 统一走环境变量注入，日志输出前做脱敏处理，定期轮换旧 Key

---

## 数据库

### JSON 列拆分为 Question / PaperQuestion 关联表

- **位置**：[`api/prisma/schema.prisma`](api/prisma/schema.prisma) `Paper.questions`
- **问题**：题目以 JSON blob 存储，无法对单题建索引、无法与大纲节点建外键、更新一题需读写整卷
- **方案**：新建 `Question` 表（paperId / number / title / options / answer / subject 等）和 `PaperQuestion` 关联表（paperId / questionId / order）；`AnswerRecord.questionId` 改为外键指向 `Question.id`

---

## 功能开发

### 错题本功能

- **位置**：前端 [`quiz-web/src/views/mistakeNotebook/`](quiz-web/src/views/mistakeNotebook/) + 后端 [`api/src/routes/exam.ts`](api/src/routes/exam.ts)
- **问题**：现有错题本仅展示错题列表和练习记录，缺少逐题重做、错题举一反三、知识点关联等功能
- **方案**：基于 `AnswerRecord.isCorrect === false` 查询，前端补全逐题解析视图、按知识点分组、错题重做入口

### 自由组卷功能

- **位置**：前端试卷组装页 + 后端组卷接口
- **问题**：当前只能使用预设真题套卷或随机诊断出题，无法根据知识点、难度、题型自由搭配
- **方案**：前端多条件筛选（知识点 / 难度 / 题型 / 数量）→ 后端按条件从试题库动态拼题 → 生成临时试卷 → 进入答题

---

## 已完成

### SVG 缺失宽高自动补齐

- **位置**：[`api/src/services/parseService.ts`](api/src/services/parseService.ts) + [`quiz-web/src/components/`](quiz-web/src/components/)
- **问题**：Qwen 输出的 SVG 偶发缺少 `width` / `height` 属性，导致渲染尺寸异常
- **方案**：parseService 中正则补齐缺失的宽高属性；PaperPreview 中 CSS 兜底 `max-width: 100%`（2026-05-14 完成）

### PDF 渲染前端化

- **位置**：[`quiz-web/src/utils/pdfRenderer.ts`](quiz-web/src/utils/pdfRenderer.ts)
- **问题**：后端依赖 Python（PyMuPDF + torch 重型依赖）渲染 PDF，部署复杂、服务器压力大
- **方案**：用 pdf.js 在浏览器端通过 Web Worker 逐页渲染 Canvas → JPEG Base64 上传；后端变为纯 Node.js，零 Python 依赖（2026-05-23 完成）

### Qwen API 并行解析

- **位置**：[`api/src/services/parseService.ts`](api/src/services/parseService.ts)
- **问题**：逐页串行调用 Qwen，40 页耗时 5-7 分钟
- **方案**：实现 Semaphore 信号量并发控制（5 并发），协调器串行汇合结果；40 页缩短至 2-3 分钟（2026-05-23 完成）
