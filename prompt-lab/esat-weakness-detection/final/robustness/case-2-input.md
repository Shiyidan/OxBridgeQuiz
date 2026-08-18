# Case 2 输入 — TMUA 同分且错误均匀分布

```json
{
  "examType": "TMUA",
  "examPolicy": "TMUA_STANDARD_EQUAL",
  "weaknessProfile": {
    "diagnosisMode": "balanced_improvement",
    "primaryModule": null,
    "moduleSignals": [],
    "difficultySignals": [],
    "topicSignals": [],
    "calibrationSignals": [
      {"moduleId":"paper1","moduleLabel":"Paper 1 · 数学知识应用","topicCode":"P1-CAL","topicLabel":"Functions（函数）","level":"calibration","confidence":"low","correct":0,"total":1,"accuracy":0,"wrongCount":1,"wrongShareInModule":0.167,"primaryDifficulty":"medium","primaryDifficultyLabel":"中难度"},
      {"moduleId":"paper2","moduleLabel":"Paper 2 · 数学推理","topicCode":"P2-CAL","topicLabel":"Proof（证明）","level":"calibration","confidence":"low","correct":0,"total":1,"accuracy":0,"wrongCount":1,"wrongShareInModule":0.167,"primaryDifficulty":"medium","primaryDifficultyLabel":"中难度"}
    ],
    "sequenceSignals": []
  },
  "modules": [
    {"moduleId":"paper1","moduleLabel":"Paper 1 · 数学知识应用","scoreRange":[5.9,7.5],"correct":14,"total":20,"primaryReviewDifficulty":{"level":"medium","label":"中难度","correct":11,"total":16},"weaknessSignal":null,"difficultySignals":[]},
    {"moduleId":"paper2","moduleLabel":"Paper 2 · 数学推理","scoreRange":[6.1,7.7],"correct":14,"total":20,"primaryReviewDifficulty":{"level":"medium","label":"中难度","correct":10,"total":14},"weaknessSignal":null,"difficultySignals":[]}
  ],
  "positionDistribution": {
    "paper1WrongQuestions": [3,6,9,12,15,18],
    "paper2WrongQuestions": [2,5,8,11,14,17]
  }
}
```
