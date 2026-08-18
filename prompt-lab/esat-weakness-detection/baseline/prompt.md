# 基线提示词

来源：`api/prompts/diagnostic-report/v2/module-analysis.txt`

```text
【任务】为输入中的每个科目生成诊断分析。

每项必须包含：
- moduleId：原样引用输入 ID。
- riskSignal：不超过 80 字，用一句话指出最需要关注的可观察风险。
- summary：不超过 100 字，概括平台预估区间、作答正确率和难度表现。
- strength：不超过 80 字，只描述数据中真实存在且样本足够的相对优势；没有时明确说明本次样本未显示稳定优势。
- keyIssue：不超过 100 字，指出主要薄弱难度层并引用正确数、总数或正确率。
- focusSuggestion：不超过 100 字，给出下一阶段可执行的复盘方向，不得虚构知识点。

不得推断知识体系、心理或能力成因；不得生成新分数、百分位、院校结论、个人错误类型或输入中不存在的任务。

【输出 JSON Schema】
{"moduleAnalyses":[{"moduleId":"string","riskSignal":"string","summary":"string","strength":"string","keyIssue":"string","focusSuggestion":"string"}]}
```

## 基线确定性候选规则

现有代码只把“同一知识点 × 同一难度”中 `total >= 5 && accuracy <= 0.7` 的格子写入 `highRoiGaps`。首页是否显示明确短板完全取决于 `highRoiGaps`，不读取模型生成的科目级 `keyIssue`。
