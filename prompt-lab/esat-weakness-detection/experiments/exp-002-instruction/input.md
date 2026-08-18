# exp-002 统一测试输入

**答题记录**：`d053cc20-aed1-4963-b442-b9cd77ade133`  
**实验变量**：仅改变 instruction，数据、角色、约束和输出格式保持一致。

```json
{
  "examType": "TMUA",
  "examPolicy": "TMUA_STANDARD_EQUAL",
  "overview": {
    "correct": 28,
    "total": 40,
    "wrong": 12,
    "accuracyPercent": 70
  },
  "weaknessProfile": {
    "primaryModule": null,
    "moduleSignals": [],
    "difficultySignals": [],
    "topicSignals": [],
    "calibrationSignals": [
      {
        "moduleId": "paper1",
        "moduleLabel": "Paper 1 · 数学知识应用",
        "topicCode": "225000",
        "topicLabel": "Exponentials and logarithms (指数与对数)",
        "level": "calibration",
        "confidence": "low",
        "correct": 1,
        "total": 2,
        "wrongCount": 1,
        "primaryDifficultyLabel": "高难度"
      }
    ]
  },
  "modules": [
    {
      "moduleId": "paper1",
      "moduleLabel": "Paper 1 · 数学知识应用",
      "scoreRange": [5.9, 7.5],
      "correct": 14,
      "total": 20,
      "weaknessSignal": null,
      "difficultySignals": [],
      "difficultyMastery": [
        { "label": "中难度", "correct": 13, "total": 18 },
        { "label": "高难度", "correct": 1, "total": 2 }
      ]
    },
    {
      "moduleId": "paper2",
      "moduleLabel": "Paper 2 · 数学推理",
      "scoreRange": [6.1, 7.7],
      "correct": 14,
      "total": 20,
      "weaknessSignal": null,
      "difficultySignals": [],
      "difficultyMastery": [
        { "label": "中难度", "correct": 10, "total": 15 },
        { "label": "高难度", "correct": 4, "total": 5 }
      ]
    }
  ]
}
```
