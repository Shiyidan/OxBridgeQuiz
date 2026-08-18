# 诊断报告版本结构

诊断报告以持久化快照中的 `reportVersion` 为版本事实，以 `productVersion` 决定前端渲染器。版本之间共享评分标准、输入契约和任务持久化机制，但不共享会改变历史展示结果的页面实现。

## 公共入口

- `../diagnosticReport.ts`：公共类型、生成门面和非 ESAT/TMUA 的 V1 兼容生成逻辑。
- `../../constants/diagnosticReport.ts`：产品代际、报告版本、提示词版本和升级资格。
- `../diagnosticReportTask.ts`：读取原答卷、调度生成、保存快照和执行用户主动升级。
- `../scoring.ts`：全站唯一评分标准来源；诊断版本通过 `shared/scoring.ts` 引用，不复制换算表。

## V1

V1 是历史只读兼容版本。已经生成的 V1 报告继续按原快照展示，不自动重新计算。ESAT/TMUA 用户可以主动更新为 V2；更新成功后，同一答卷后续只读取 V2 快照。

V1 没有继续演进的 DeepSeek 提示词目录，也不应引用 V2 的确定性短板规则。具体边界见 `v1/README.md`。

## V2

- `v2/reportBuilder.ts`：ESAT/TMUA V2 的确定性证据、DeepSeek 分析、下一行动和学习路径生成器。
- `v2/prompts.ts`：只加载 `api/prompts/diagnostic-report/v2/` 下的可审计提示词。
- `shared/scoring.ts`：连接全站评分引擎的公共依赖边界。

新增 V2 内部修订时更新提示词版本和测试，不另复制一套评分曲线。只有产品结构发生不兼容变化时才新增 V3 目录和产品代际。
