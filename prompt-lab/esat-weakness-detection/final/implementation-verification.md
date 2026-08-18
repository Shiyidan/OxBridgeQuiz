# Phase 4 实现验证

## 2026-08-18 后段断层修订（v6）

- `weaknessProfile` 新增 `sequenceSignals`，按模块比较前 70% 与后 30% 题目的正确率。
- 信号门槛：模块至少 10 题；后段至少 4 题；后段正确率低于 50%；相对前段下降至少 30 个百分点；后段至少错 3 题。
- 当前 TMUA 答卷两卷均形成高置信度信号：前 14 题 14/14、后 6 题 0/6。
- 首页标题改为“两卷前 14 题全对、后 6 题全错，后段作答是当前首要问题”。
- 下一行动改为 25 分钟 6 道跨知识点限时训练，至少答对 4 道；不再以任意 0/1 知识点作为主攻结论。
- 提示词版本升级为 `tmua-diagnostic-v2-prompt-v6`；模块诊断由 DeepSeek 生成，单个未通过校验的模块定位由同口径确定性文案补齐。
- 15 个短板、题量、诊断模式与前后段分布场景通过；后端构建、前端类型检查、生产构建和 ESLint 通过。

## 2026-08-18 均衡提分修订

- `weaknessProfile` 新增 `diagnosisMode`：`weakness_attack`、`balanced_improvement`、`stable_progress`。
- 无明确短板但仍有错题时，不再输出“没有足量证据”，而是进入“均衡提分”。
- 程序预计算 `primaryReviewDifficulty`，DeepSeek 不再自行选择模块级薄弱层。
- 首页统一使用 `nextAction` 的知识点作为校准方向，避免与按钮跳转内容不一致。
- 模型输出若在无信号时擅自使用“主要薄弱层”“模块短板”或错配优先难度，会被确定性校验拒绝并安全降级。
- ESAT/TMUA 提示词版本更新为 v5。

### 指定 TMUA 报告

- ExamRecord：`d053cc20-aed1-4963-b442-b9cd77ade133`
- Paper 1：14/20，70%；Paper 2：14/20，70%。
- 诊断模式：`balanced_improvement`
- 提示词版本：`tmua-diagnostic-v2-prompt-v5`
- 生成方式：`full_ai`
- 首页标题：双卷表现均衡，下一阶段的提分关键是收口分散失分。
- 下一步：低置信度校准 Exponentials and logarithms (指数与对数)。

## 生产代码落地

- 新增统一 `weaknessProfile`，包含模块、难度、知识点和待校准信号。
- ESAT 使用 `ESAT_VARIABLE_MODULES` 动态题量策略。
- TMUA 两卷完整 20 题时使用 `TMUA_STANDARD_EQUAL`，两卷都低时保留两个模块短板。
- DeepSeek 模块分析输入包含预计算等级、置信度和考试策略；提示词禁止新增、删除或升级候选。
- V2 首页、主攻方向和失分结构优先读取同一 `weaknessProfile`。

## 自动验证

- 后端 TypeScript 编译通过。
- 前端 Vue TypeScript 检查通过。
- `git diff --check` 通过。
- 14 个 ESAT/TMUA 短板与诊断模式行为场景全部通过。
- TMUA 完整报告降级行为测试通过。
- ESAT 行动和模块文案行为测试通过。

## 指定报告重建结果

- ExamRecord：`0fd11788-0652-4bd3-9a38-eb2d3646b0b2`
- 用户：`a861ff49-9f80-46f8-9353-af16f1593701`
- 提示词版本：`esat-diagnostic-v2-prompt-v4`
- 生成方式：`full_ai`
- 主要模块短板：化学，9/18，50%，`clear/high`
- 主要难度短板：化学中难度，3/10，30%，`clear/high`
- 主要知识点短板：Atomic structure，1/3，33.3%，`clear/medium`
- ROI 文案来源：DeepSeek
