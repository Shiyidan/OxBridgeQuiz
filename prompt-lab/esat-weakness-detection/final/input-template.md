# Phase 4 最终输入模板（v6）

```json
{
  "examType": "ESAT | TMUA",
  "examPolicy": "ESAT_VARIABLE_MODULES | TMUA_STANDARD_EQUAL | GENERIC_DYNAMIC",
  "weaknessProfile": {
    "diagnosisMode": "weakness_attack | balanced_improvement | stable_progress",
    "primaryModule": {},
    "moduleSignals": [],
    "difficultySignals": [],
    "topicSignals": [],
    "calibrationSignals": [],
    "sequenceSignals": [
      {
        "kind": "late_section_drop",
        "moduleId": "string",
        "moduleLabel": "string",
        "confidence": "high | medium",
        "splitAfter": 0,
        "earlyCorrect": 0,
        "earlyTotal": 0,
        "lateCorrect": 0,
        "lateTotal": 0,
        "accuracyGap": 0,
        "lateQuestionNumbers": []
      }
    ]
  },
  "modules": [
    {
      "moduleId": "string",
      "moduleLabel": "string",
      "score": 0,
      "scoreRange": [0, 0],
      "correct": 0,
      "total": 0,
      "difficultyMastery": [],
      "primaryReviewDifficulty": {
        "level": "low | medium | high",
        "label": "string",
        "correct": 0,
        "total": 0
      },
      "weaknessSignal": null,
      "difficultySignals": []
    }
  ]
}
```

程序先计算诊断模式、短板信号与模块级复盘层，再将同一结果交给 DeepSeek、首页、详细分析、下一步行动和学习计划。模型不负责比较门槛或决定短板等级。
