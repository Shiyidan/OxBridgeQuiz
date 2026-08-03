# 最终输入模板

**版本**：esat-diagnostic-v4 / module-positioning  
**完成日期**：2026-08-03

```json
{
  "examType": "ESAT",
  "task": "生成各科目的整体评价",
  "modules": [
    {
      "moduleId": "string",
      "moduleLabel": "string",
      "score": 1.0,
      "scoreRange": [1.0, 2.0],
      "performanceLevel": "string",
      "percentileLabel": "string",
      "correct": 0,
      "total": 20,
      "accuracyPercent": 0,
      "scoringBasis": "standard | normalized",
      "equivalentRawScore": 0,
      "difficultyMastery": [
        {
          "level": "low | medium | high",
          "label": "低难度 | 中难度 | 高难度",
          "correct": 0,
          "total": 0,
          "accuracyPercent": null,
          "sampleNote": "无题，不作判断 | 样本较少，不足以证明稳定优势 | 可用于判断当前表现"
        }
      ]
    }
  ]
}
```

所有比例、分数、等级、百分位和样本提示均由后端确定性计算，模型只负责解释。
