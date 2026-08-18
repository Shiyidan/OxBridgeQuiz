# 基线输出

该输出来自当前生产链路已经生成的 DeepSeek `full_ai` 报告，并补充前端根据空 `highRoiGaps` 产生的实际首页结论。

【开始模拟生成】

```json
{
  "moduleAnalyses": [
    {
      "moduleId": "maths1",
      "riskSignal": "高难度题正确率与中难度持平，但需警惕高分段稳定性，建议加强限时训练。",
      "summary": "平台预估区间为6.6-8.6，作答正确率约89%，低难度全对，中高难度正确率均为90%，整体表现稳定。",
      "strength": "低难度题全部正确，中高难度正确率均达90%，显示对中等及以上难度题目有较好掌握。",
      "keyIssue": "高难度题共7题，正确6题，正确率约86%，虽不低，但仍有提升空间，需关注高难度题型的解题策略。",
      "focusSuggestion": "建议针对高难度题进行专项复盘，重点分析错题原因，并加强限时训练，提升解题速度和准确率。"
    },
    {
      "moduleId": "chemistry",
      "riskSignal": "中难度题正确率仅30%，是主要失分点，需优先突破。",
      "summary": "平台预估区间为3.7-6.0，作答正确率50%，低难度正确率80%，中难度仅30%，高难度约67%，整体表现偏弱。",
      "strength": "低难度题正确率80%，高难度题正确率67%，显示对基础概念和部分难题有一定掌握。",
      "keyIssue": "中难度题共10题，仅正确3题，正确率30%，严重拉低整体表现，是当前最薄弱环节。",
      "focusSuggestion": "建议重点复盘中等难度题，梳理相关知识点和常见题型，加强练习，提升中档题的稳定得分能力。"
    },
    {
      "moduleId": "biology",
      "riskSignal": "中高难度正确率均为70%，但低难度样本不足，需进一步校准。",
      "summary": "平台预估区间为4.8-7.0，作答正确率约72%，中高难度正确率均为70%，整体表现中等。",
      "strength": "中高难度题正确率均为70%，显示对中等及以上难度题目有较均衡的掌握。",
      "keyIssue": "低难度题样本不足（0题），无法评估基础掌握情况；中高难度正确率均为70%，仍有提升空间。",
      "focusSuggestion": "建议补充低难度题练习以校准基础水平，同时针对中高难度错题进行知识点梳理，强化薄弱环节。"
    }
  ],
  "highRoiGaps": [],
  "homeConclusion": {
    "strategyLabel": "稳定巩固",
    "headline": "本次没有足量证据支持明确短板，先复盘错题并保持节奏"
  },
  "nextAction": {
    "actionType": "calibration_test",
    "moduleId": "chemistry",
    "topicCode": "140100",
    "title": "先校准：Atomic structure (原子结构)",
    "evidence": { "correct": 0, "total": 2, "accuracy": 0, "confidence": "low" }
  }
}
```

【结束模拟生成】
