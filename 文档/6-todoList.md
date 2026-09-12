# 待实现方案

> 讨论中确定的技术方案，按模块分组。已完成项用 √ 标记。

---

## 总览清单

数据库

- [√] 数据库重构：JSON 列拆分为 Question / PaperQuestion 关联表

功能开发

- [ ] 错题本功能（ExamRecord + AnswerRecord 表 + 前端页面）
- [ ] 完善 ESAT / TMUA 预估分逻辑并恢复个人中心展示
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

### ESAT / TMUA 预估分逻辑

- **位置**：前端 [`quiz-web/src/views/profile/ProfileView.vue`](../quiz-web/src/views/profile/ProfileView.vue) + 后端 [`api/src/routes/exam-results.ts`](../api/src/routes/exam-results.ts)、[`api/src/routes/exam-shared.ts`](../api/src/routes/exam-shared.ts)、[`api/src/services/scoring.ts`](../api/src/services/scoring.ts)
- **问题**：当前 TMUA 仅根据整份答卷的总题数和正确题数构造虚拟分卷，不能反映 Paper 1、Paper 2 的真实答题分布；ESAT 没有统一官方总分，现有个人中心统一展示“预估分 / 9.0”也无法准确表达各模块成绩。多次诊断成绩取最新一次、平均值还是其他口径尚未确定。
- **临时处理**：个人中心暂时隐藏“当前学习：预估分 / 9.0 · 累计做题”信息，不改变现有后端统计接口。
- **后续方案**：确定预估分的数据来源和多次成绩聚合口径；TMUA 使用真实 Paper 1、Paper 2 作答结果分别换算后计算总分；ESAT 按实际考试模块分别展示预估分，不默认合成统一总分。确认试题库、练习册、模考和诊断测试中哪些记录参与计算，并统一前后端文案。
- **验收标准**：同一答卷可依据真实分卷或模块作答数据复算出一致结果；ESAT 与 TMUA 使用符合各自考试结构的展示方式；无有效已提交记录时显示明确空状态；口径确认且完成校验后再恢复个人中心预估分展示。

---
