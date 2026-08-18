# Case 4 输入 — TMUA 单卷后段下降

```json
{
  "examType": "TMUA",
  "examPolicy": "TMUA_STANDARD_EQUAL",
  "weaknessProfile": {
    "diagnosisMode": "weakness_attack",
    "primaryModule": null,
    "moduleSignals": [],
    "difficultySignals": [],
    "topicSignals": [],
    "calibrationSignals": [],
    "sequenceSignals": [
      {"kind":"late_section_drop","moduleId":"paper2","moduleLabel":"Paper 2 · 数学推理","level":"clear","confidence":"high","splitAfter":15,"earlyCorrect":15,"earlyTotal":15,"earlyAccuracy":1,"lateCorrect":0,"lateTotal":5,"lateAccuracy":0,"accuracyGap":1,"lateQuestionNumbers":[16,17,18,19,20]}
    ]
  },
  "modules": [
    {"moduleId":"paper1","moduleLabel":"Paper 1 · 数学知识应用","scoreRange":[6.6,8.1],"correct":16,"total":20,"primaryReviewDifficulty":{"level":"medium","label":"中难度","correct":12,"total":15},"weaknessSignal":null,"difficultySignals":[],"sequenceSignals":[]},
    {"moduleId":"paper2","moduleLabel":"Paper 2 · 数学推理","scoreRange":[6.4,7.9],"correct":15,"total":20,"primaryReviewDifficulty":{"level":"medium","label":"中难度","correct":11,"total":15},"weaknessSignal":null,"difficultySignals":[],"sequenceSignals":[{"earlyCorrect":15,"earlyTotal":15,"lateCorrect":0,"lateTotal":5}]}
  ],
  "positionDistribution": {
    "paper1WrongQuestions": [3,8,13,18],
    "paper2WrongQuestions": [16,17,18,19,20]
  }
}
```
