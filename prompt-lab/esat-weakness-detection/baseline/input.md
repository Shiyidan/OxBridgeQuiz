# 基线输入

来源：测试答卷 `0fd11788-0652-4bd3-9a38-eb2d3646b0b2` 的正式 V2 报告生成输入。

```json
{
  "examType": "ESAT",
  "modules": [
    {
      "moduleId": "maths1",
      "moduleLabel": "数学 1",
      "score": 7.8,
      "scoreRange": [6.6, 8.6],
      "correct": 16,
      "total": 18,
      "difficultyMastery": [
        { "label": "低难度", "correct": 3, "total": 3, "accuracy": 1.0 },
        { "label": "中难度", "correct": 7, "total": 8, "accuracy": 0.875 },
        { "label": "高难度", "correct": 6, "total": 7, "accuracy": 0.857 }
      ]
    },
    {
      "moduleId": "chemistry",
      "moduleLabel": "化学",
      "score": 4.8,
      "scoreRange": [3.7, 6.0],
      "correct": 9,
      "total": 18,
      "difficultyMastery": [
        { "label": "低难度", "correct": 4, "total": 5, "accuracy": 0.8 },
        { "label": "中难度", "correct": 3, "total": 10, "accuracy": 0.3 },
        { "label": "高难度", "correct": 2, "total": 3, "accuracy": 0.667 }
      ]
    },
    {
      "moduleId": "biology",
      "moduleLabel": "生物",
      "score": 6.1,
      "scoreRange": [4.8, 7.0],
      "correct": 13,
      "total": 18,
      "difficultyMastery": [
        { "label": "低难度", "correct": 0, "total": 0, "accuracy": null },
        { "label": "中难度", "correct": 8, "total": 11, "accuracy": 0.727 },
        { "label": "高难度", "correct": 5, "total": 7, "accuracy": 0.714 }
      ]
    }
  ],
  "currentCandidateRule": {
    "scope": "topic × difficulty",
    "minimumQuestions": 5,
    "maximumAccuracy": 0.7
  },
  "currentCandidateResult": []
}
```
