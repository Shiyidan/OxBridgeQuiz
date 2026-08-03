# 输入架构设计

**任务**：esat-seven-day-plan  
**设计日期**：2026-08-03

## 设计结论

七日计划不应由大模型从一组知识点自由写作，而应采用“代码固定课程骨架 + 模型受约束个性化 + 代码逐字段验收”的三层结构。

```text
正式题目与作答记录
  → 代码提取可追溯诊断事实
  → 代码分配七天学习职能、知识点范围与分钟预算
  → DeepSeek 只改写每天的理由、步骤和产出表达
  → 代码校验事实引用、结构、预算和重复度
  → 无效字段逐日回退到专业规则方案
```

这一结构保证 DeepSeek 不可用时仍有完整路径，也避免模型改变学习顺序、知识点范围或时长预算。

## 任务分解

### 子任务 1：诊断事实压缩

从本次报告中构造最多三个首要缺口、最多两个保持项，以及一条首要行动。只保留生成七日计划真正需要的事实。

### 子任务 2：固定七日课程骨架

代码预先确定七天各自的学习职能：

| 天次 | 固定职能 | 默认焦点 | 必须留下的产出 |
| --- | --- | --- | --- |
| 第 1 天 | `evidence_audit` 证据核对 | 第一优先项及其错题 | 错误步骤/不确定点核对表 |
| 第 2 天 | `method_rebuild` 方法重建 | 第一优先项 | 一页方法清单或正确解题流程 |
| 第 3 天 | `retrieval_practice` 独立检索 | 第一优先项 | 无提示作答结果与失败步骤 |
| 第 4 天 | `secondary_transfer` 第二项迁移 | 第二优先项；缺失时深化第一项 | 第二项方法对照或迁移记录 |
| 第 5 天 | `third_or_deepen` 第三项/难度提升 | 第三优先项；缺失时提升难度 | 新题型/更高难度修正记录 |
| 第 6 天 | `interleaved_timed` 交错限时 | 所有优先项 + 保持项 | 方法选择与时间失误记录 |
| 第 7 天 | `weekly_retest` 周末复测 | 所有优先项 | 复测结果和下一周决策 |

骨架中的职能、知识点 ID、分钟数、证据引用和最低完成标准由代码固定；模型不得调整。

### 子任务 3：受约束内容生成

DeepSeek 为每天生成：

- 不超过 70 字的诊断理由；
- 2–4 个具体执行步骤；
- 一个可检查产出；
- 一个与当天职能不同的成功标准；
- 一个未达标后的明确分支。

模型只能引用当天 `allowedEvidenceRefs` 和 `allowedGapKeys`，不得引用其他知识点、题号、时长或错误原因。

### 子任务 4：代码验收与逐日回退

代码逐日检查：

- 是否刚好七天且职能顺序完全一致；
- 分钟数是否与代码骨架一致且总和等于周预算；
- 知识点和题号是否属于允许集合；
- 错误模式是否使用“核对是否存在”等假设表达；
- 每天是否有 2–4 步、产出、成功标准和未达标分支；
- 任意两天的正文相似度是否低于阈值；
- 是否出现禁用占位语，如“专项投入”“完成本格复盘”；
- 数字是否全部来自允许事实或代码给定目标。

某一天不合格时只回退该日，不让一个字段问题拖垮整周方案。最终 `analysisSource` 可为 `deepseek`、`mixed` 或 `fallback`。

## 信息资产清单

### 主数据

#### `reportContext`

| 字段 | 必需 | 说明 |
| --- | :---: | --- |
| `examType` | 是 | 固定为 ESAT |
| `planningScope` | 是 | 固定为 `starter` |
| `weeklyBudgetMinutes` | 是 | 用户每周时长 × 60；缺失时明确使用 300 分钟默认值 |
| `budgetSource` | 是 | `profile` 或 `default` |
| `actualModules` | 是 | 本次实际作答模块，不读取声明科目过滤结果 |

#### `priorityGaps[]`，最多 3 项

| 字段 | 必需 | 压缩规则 |
| --- | :---: | --- |
| `gapKey/rank` | 是 | 代码稳定标识与顺序 |
| `moduleId/moduleLabel` | 是 | 本次实际模块 |
| `topicCode/topicLabel` | 是 | 正式考纲映射 |
| `difficulty/difficultyLabel` | 是 | 固定难度枚举 |
| `correct/total/accuracyPercent` | 是 | 直接作答事实 |
| `confidence` | 是 | 按样本量固定计算 |
| `questionNumbers` | 否 | 只保留该格错题，最多 8 个 |
| `examFocus` | 否 | 去重后最多 2 条，每条不超过 120 字 |
| `reviewGuidance` | 否 | 去重后最多 3 条，每条不超过 120 字 |
| `possibleErrorPatterns` | 否 | 去重后最多 3 条，每条不超过 100 字；仅作核对假设 |

#### `maintenanceAnchors[]`，最多 2 项

从本次实际作答中选择样本可用且相对稳定的知识点，供第 6 天交错训练使用。只包含知识点、难度、正确率和样本量，不生成新的提升结论。没有可用保持项时，第 6 天只交错现有优先项。

#### `nextAction`

复用报告首屏行动卡的动作类型、首要知识点、证据可信度和完成标准，作为第 1～3 天的核心目标。低样本时动作必须为 `calibration_test`。

#### `timingEvidence`

最多保留两个存在有效计时数据的模块，只提供效率指数、记录题数和正确率。没有可靠计时数据时明确设为 `null`，第 6 天仍可进行短时交错训练，但不得声称学生速度有问题。

### 不进入输入的数据

- 完整题干、选项和标准答案；
- `correct_solution` 全文；
- 未在本次试卷出现的考纲知识点；
- 目标院校名称和任何录取门槛；
- 前端展示样式；
- 旧版 `suggestedHours` 文本区间；
- 其他学生或群体表现。

## 依赖矩阵

| 子任务 | 必需信息 | 信息类型 | 压缩策略 |
| --- | --- | --- | --- |
| 诊断事实压缩 | 能力矩阵、错题、学习分析 | 必需 | 最多 3 个缺口，每字段限长去重 |
| 固定七日骨架 | 周预算、缺口数量、首要行动 | 必需 | 代码内枚举，不进入模型自由生成 |
| 个性化文案 | 当日职能、允许证据、允许知识点 | 必需 | 每天单独提供最小上下文 |
| 交错训练 | 优先项、保持项、计时证据 | 条件必需 | 最多 5 个知识点、2 个模块计时事实 |
| 周末复测 | 本周所有焦点、代码阈值 | 必需 | 只传允许的通过/未通过决策条件 |

## 时间预算算法

代码先计算 `weeklyBudgetMinutes`，再按固定权重分配，使用最大余数法保证七天之和严格等于周预算：

| 天次 | 权重 | 300 分钟示例 |
| --- | ---: | ---: |
| 第 1 天 | 12% | 36 分钟 |
| 第 2 天 | 16% | 48 分钟 |
| 第 3 天 | 15% | 45 分钟 |
| 第 4 天 | 14% | 42 分钟 |
| 第 5 天 | 14% | 42 分钟 |
| 第 6 天 | 16% | 48 分钟 |
| 第 7 天 | 13% | 39 分钟 |

模型只看到已经分配好的每天分钟数。若用户设置的周时长过低，界面仍如实展示较短任务，并提示补充更现实的可投入时长，不擅自扩大预算。

## 输入模板

```json
{
  "reportContext": {
    "examType": "ESAT",
    "planningScope": "starter",
    "weeklyBudgetMinutes": 300,
    "budgetSource": "default",
    "actualModules": ["Mathematics 1"]
  },
  "priorityGaps": [
    {
      "gapKey": "maths1:geometry:medium",
      "rank": 1,
      "moduleLabel": "Mathematics 1",
      "topicCode": "geometry",
      "topicLabel": "Geometry（几何）",
      "difficulty": "medium",
      "difficultyLabel": "中难度",
      "correct": 1,
      "total": 4,
      "accuracyPercent": 25,
      "confidence": "medium",
      "questionNumbers": [4, 9, 12],
      "examFocus": [],
      "reviewGuidance": [],
      "possibleErrorPatterns": []
    }
  ],
  "maintenanceAnchors": [],
  "nextAction": {
    "actionType": "targeted_practice",
    "gapKey": "maths1:geometry:medium",
    "successCriteria": "完成 5 道同考点训练并至少答对 4 道"
  },
  "timingEvidence": null,
  "scheduleSkeleton": [
    {
      "day": 1,
      "role": "evidence_audit",
      "durationMinutes": 36,
      "allowedGapKeys": ["maths1:geometry:medium"],
      "allowedEvidenceRefs": ["gap:maths1:geometry:medium", "question:4", "question:9", "question:12"],
      "requiredDeliverableType": "error_audit"
    }
  ]
}
```

实际输入包含完整七天骨架；示例只展开第 1 天以避免文档重复。

## 输出结构

```ts
interface StarterPlan {
  version: 'starter-plan-v2'
  weeklyBudgetMinutes: number
  totalPlannedMinutes: number
  budgetSource: 'profile' | 'default'
  analysisSource: 'deepseek' | 'mixed' | 'fallback'
  evidenceBoundary: string
  days: StarterPlanDay[] // 必须恰好 7 项
}

interface StarterPlanDay {
  day: 1 | 2 | 3 | 4 | 5 | 6 | 7
  role:
    | 'evidence_audit'
    | 'method_rebuild'
    | 'retrieval_practice'
    | 'secondary_transfer'
    | 'third_or_deepen'
    | 'interleaved_timed'
    | 'weekly_retest'
  title: string
  focus: Array<{
    gapKey: string
    moduleLabel: string
    topicCode: string
    topicLabel: string
    difficultyLabel: string
  }>
  durationMinutes: number
  diagnosticRationale: string
  steps: Array<{
    action: string
    output: string
  }>
  deliverable: string
  successCriteria: string
  ifNotMet: string
  evidenceRefs: string[]
}
```

## 前端消费规则

- `planningScope === 'starter' && starterPlan` 时使用专用七日路径，不再渲染通用 `phase.tasks/activities`。
- 默认展开第 1 天，其余天显示日次、主题、焦点、时长和完成标准；学生可逐日展开步骤与依据。
- 第 1～5 天使用同一纵向路径，但不把每一天包装成同尺寸信息卡；日次和路径连接承担序列关系。
- 第 6 天明确标识“交错训练”，第 7 天突出“复测与决策”。
- 历史报告没有 `starterPlan` 时继续使用旧结构，但隐藏重复的泛化 `activities`。
- 页面显示计划来源和预算来源，不展示内部 prompt 或模型名称。

## 预计输入规模

- 报告上下文：约 100 字；
- 3 个优先缺口：约 900～1,500 字；
- 2 个保持项与计时信息：约 250 字；
- 七日固定骨架：约 600 字；
- 总输入控制在约 2,500 字以内。

该规模足以支持受约束个性化，同时明显小于把整份报告或完整题目解析传给模型的输入。
