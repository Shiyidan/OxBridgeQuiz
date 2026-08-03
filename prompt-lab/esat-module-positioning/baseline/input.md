# 基线输入

**版本**：baseline  
**创建日期**：2026-08-03  
**数据来源**：本地最新 `diagnostic-report-v3` 的确定性模块统计  
**基于模板**：当前生产 payload；尚未使用 Phase 1.5 增强输入

---

```json
{
  "examType": "ESAT",
  "modules": [
    {
      "moduleId": "maths1",
      "moduleLabel": "数学 1",
      "score": 1.7,
      "scoreRange": [1.3, 2.5],
      "correct": 2,
      "total": 19,
      "scoringBasis": "normalized",
      "difficultyMastery": [
        { "label": "低难度", "level": "low", "total": 0, "correct": 0, "accuracy": null },
        { "label": "中难度", "level": "medium", "total": 16, "correct": 1, "accuracy": 0.1 },
        { "label": "高难度", "level": "high", "total": 3, "correct": 1, "accuracy": 0.3 }
      ]
    },
    {
      "moduleId": "chemistry",
      "moduleLabel": "化学",
      "score": 1.7,
      "scoreRange": [1.3, 2.6],
      "correct": 2,
      "total": 20,
      "scoringBasis": "normalized",
      "difficultyMastery": [
        { "label": "低难度", "level": "low", "total": 0, "correct": 0, "accuracy": null },
        { "label": "中难度", "level": "medium", "total": 17, "correct": 2, "accuracy": 0.1 },
        { "label": "高难度", "level": "high", "total": 3, "correct": 0, "accuracy": 0 }
      ]
    },
    {
      "moduleId": "biology",
      "moduleLabel": "生物",
      "score": 1.0,
      "scoreRange": [1.0, 1.4],
      "correct": 0,
      "total": 20,
      "scoringBasis": "normalized",
      "difficultyMastery": [
        { "label": "低难度", "level": "low", "total": 1, "correct": 0, "accuracy": 0 },
        { "label": "中难度", "level": "medium", "total": 17, "correct": 0, "accuracy": 0 },
        { "label": "高难度", "level": "high", "total": 2, "correct": 0, "accuracy": 0 }
      ]
    }
  ]
}
```
