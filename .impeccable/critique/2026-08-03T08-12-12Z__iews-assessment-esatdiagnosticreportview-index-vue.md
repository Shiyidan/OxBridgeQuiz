---
target: 当前 ESAT 诊断报告与 AI 学习路径
total_score: 23
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 5
timestamp: 2026-08-03T08-12-12Z
slug: iews-assessment-esatdiagnosticreportview-index-vue
---
Method: dual-agent (A: `/root/esat_report_assessment_a` · B: `/root/esat_report_assessment_b`)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|---|---:|---|
| 1 | Visibility of System Status | 2/4 | 有加载、失败重试和选中状态，但加载被写成“正在生成”，缺失模块静默省略，异步状态没有 `aria-live`。 |
| 2 | Match System / Real World | 3/4 | ESAT 结构准确，但“高 ROI、Wilson 80%、1.0×、Standard”等术语需要额外翻译。 |
| 3 | User Control and Freedom | 2/4 | 可切模块、展开知识点、查看题目解析，但不能调整、启动、完成或重排学习计划。 |
| 4 | Consistency and Standards | 3/4 | 视觉和数据格式一致；AI/规则来源标注不一致，模块选择的作用域不够清楚。 |
| 5 | Error Prevention | 3/4 | 样本量、区间和来源说明较严谨；“AI 定制”和“高 ROI”仍有过度承诺风险。 |
| 6 | Recognition Rather Than Recall | 2/4 | 缺口与学习任务距离很远，任务未携带原始证据，用户要记住前文。 |
| 7 | Flexibility and Efficiency | 1/4 | 没有页内导航、继续练习、加入练习本或一键开始下一步。 |
| 8 | Aesthetic and Minimalist Design | 2/4 | 界面克制但信息权重相近，核心行动没有形成视觉峰值。 |
| 9 | Error Recovery | 2/4 | 顶层错误可重试；空模块会留下空白页，子模块缺失没有恢复动作。 |
| 10 | Help and Documentation | 3/4 | 换算和来源解释充分；缺少“如何使用报告”和任务完成标准。 |
| **Total** |  | **23/40** | **Acceptable：可信的分析文档，尚未成为有效的学习控制台。** |

## Design Specificity Verdict

内容约 6/10 的产品特异性：模块独立评分、官方分布、知识点与难度矩阵都很 ESAT；交互却仍是通用的“长页面 + 白卡片 + 指标”。它能解释学生被怎样分析，却不能推动“真题诊断 → 专项训练 → 错题复习”。

Deterministic scan 对目录扫描得到 2 条 `side-tab` warning：`EsatEquivalentScore.vue:786` 与 `EsatLearningPath.vue:490`。前者较可能是低置信度误报；后者确实是常见的阶段左色条模式，但不属于当前主要业务风险。

浏览器自动化不可用；本地 5173 与 API health 可达，但目标路由需要登录和真实 ExamRecord 权限，因此没有可靠 live overlay。替代证据为 CLI detector、源码、实际落库报告和现有营销长图。

## Overall Impression

当前最有价值的是确定性计算、安全边界和数据透明度；最大机会是把报告从“读完一份分析”改成“立即开始一个可验证的训练动作”。用户觉得 AI 简单，根因不只是 prompt：PRD 明确取消了 Checkpoint、微测、任务状态和滚动更新；后端又把模型限制在短文案改写，学习机制本身没有进入 AI/推荐系统。

## What's Working

- 分数换算、80% 参考区间、样本不足、官方分布来源和规则降级都主动揭示不确定性。
- 缺口选择、时长和阶段骨架由规则决定，模型不能修改事实，这个安全架构应保留。
- 模块 → 难度 → 知识点 → 缺口 → 路径的诊断层级完整，知识点折叠尤其清楚。

## Priority Issues

### [P1] 报告在“发现弱项”后断开，没有训练闭环

高 ROI 卡片和三阶段任务都是静态文字，只有报告头的“题目解析”可点击。任务没有 ID、题库筛选条件、完成标准、状态或复测动作。修复方向：首屏增加“下一项最佳行动”，以 `moduleId/topicCode/difficulty` 一键创建专项练习或打开相关错题；训练后回写结果并计算下一步。

### [P1] 画像科目可过滤掉本次诊断的真实弱项

`buildLearningPath` 在个人资料存在科目时用它过滤本次高 ROI 缺口。最新落库报告的实际模块是数学1/化学/生物，画像却是数学1/数学2；Top 1 生物弱项被过滤，最终只规划数学1。修复方向：本次试卷实际模块是硬边界，画像只做排序偏好；不一致时显式提醒并让用户确认，不得静默丢弃弱项。

### [P1] 已有丰富题目分析数据没有进入报告

最新 59 道样本题全部已有 `meta.learning_analysis`，包含 `exam_focus`、`common_error_causes`、`review_guidance`；报告任务查询没有读取 `meta`，AI 只看到模块分、正确率和难度。修复方向：先把这些受控字段聚合成“可能失分模式”和“复习动作”，再由模型做跨题归纳；未与所选干扰项绑定的原因必须标记为“待核对”，不能当作确定成因。

### [P1] “AI 定制”和“高 ROI”超过真实机制

本地 6 份 ESAT 报告中 3 份 `rules_only`、3 份 `mixed_fallback`、0 份 `full_ai`；页面仍统一显示“AI 定制”。当前 ROI 只是正确率、难度和样本量启发式排序，并未计算预期提分/小时。修复方向：显示分析来源与置信度；在没有边际收益模型前改名“优先补弱项”，或基于模块换算曲线计算“多答对 1–2 题”的情景增益后再使用 ROI。

### [P1] 路径是固定三阶段文案，不是自适应路径

阶段周数固定约 25%/50%/25%，仅阶段一绑定结构化缺口；阶段二、三是两条泛化活动。没有历史表现、完成状态、校准微测、路径偏离或滚动重排。资料缺失时仍默认 8 周 × 12 小时并展示 96 小时，精度感过强。修复方向：报告保持不可变快照，另建可更新的 `LearningPlan` 与 `LearningPlanTask`；缺少日期/时长时只生成 7 天启动计划，不生成看似精确的长期计划。

## Persona Red Flags

- **Jordan（首次使用）**：能看到分数，却不能在 5 秒内确认下一步；ROI、n≥3、Wilson、压力指数等术语增加翻译成本。
- **Sam（键盘/屏幕阅读器）**：tabs 缺方向键与 roving tabindex；能力矩阵用 `div` 模拟表格；图表无等价数据表；多个 20–25px 控件过小。
- **Casey（手机用户）**：页面最小画布 1280px，手机只能横向拖动；路径很长且没有底部主要行动或恢复状态。
- **Lin（ESAT 冲刺学生）**：报告没有给今晚 20–45 分钟能做的任务、完成标准和复测后变化，页面结尾动能消失。

## Minor Observations

- “Top 76% / Top 92%”对低百分位非常容易误读，宜改为“约第 24 百分位 / 超过约 24% 的参考考生”。
- 营销长图同一生物模块同时出现 7.8 点估分、3.0 图表标记和 2.3–4.2 区间，且首页承诺“发现持续失分的原因”，而当前报告只能定位弱项，不能可靠判断成因。
- 规则降级时 `analysisSource`/`generationMode` 没有在 AI 提升规划与路径中显示。
- 能力矩阵内部滚动区、ROI 横向滚动区不可聚焦；空模块数组会留下空白主体。
- Detector 的两个 side-tab finding 是视觉去模板化问题，优先级低于闭环与数据正确性。

## Questions to Consider

- 学生只看首屏 15 秒时，应该记住一个分数，还是立即开始一个训练？
- “AI 定制”要卖文案生成，还是卖“每做完一组题，下一步真的会重排”？
- 每条建议能否回答：为什么是我、为什么是现在、练哪些题、做到什么算完成、完成后发生什么？
- 在还没有边际收益模型时，“高 ROI”是否应改名？
- 报告是历史证据快照，学习路径是否应该成为独立、持续更新的产品对象？
