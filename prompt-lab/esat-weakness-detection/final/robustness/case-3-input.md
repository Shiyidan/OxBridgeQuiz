# Case 3 输入 — TMUA 双卷后段共同断层

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
    "calibrationSignals": [{"moduleId":"paper2","topicCode":"212000","topicLabel":"Number（数）","level":"calibration","confidence":"low","correct":0,"total":1}],
    "sequenceSignals": [
      {"kind":"late_section_drop","moduleId":"paper1","moduleLabel":"Paper 1 · 数学知识应用","level":"clear","confidence":"high","splitAfter":14,"earlyCorrect":14,"earlyTotal":14,"earlyAccuracy":1,"lateCorrect":0,"lateTotal":6,"lateAccuracy":0,"accuracyGap":1,"lateQuestionNumbers":[15,16,17,18,19,20]},
      {"kind":"late_section_drop","moduleId":"paper2","moduleLabel":"Paper 2 · 数学推理","level":"clear","confidence":"high","splitAfter":14,"earlyCorrect":14,"earlyTotal":14,"earlyAccuracy":1,"lateCorrect":0,"lateTotal":6,"lateAccuracy":0,"accuracyGap":1,"lateQuestionNumbers":[15,16,17,18,19,20]}
    ]
  },
  "modules": [
    {"moduleId":"paper1","moduleLabel":"Paper 1 · 数学知识应用","scoreRange":[5.9,7.5],"correct":14,"total":20,"primaryReviewDifficulty":{"level":"medium","label":"中难度","correct":13,"total":18},"sequenceSignals":[{"earlyCorrect":14,"earlyTotal":14,"lateCorrect":0,"lateTotal":6}]},
    {"moduleId":"paper2","moduleLabel":"Paper 2 · 数学推理","scoreRange":[6.1,7.7],"correct":14,"total":20,"primaryReviewDifficulty":{"level":"medium","label":"中难度","correct":10,"total":15},"sequenceSignals":[{"earlyCorrect":14,"earlyTotal":14,"lateCorrect":0,"lateTotal":6}]}
  ]
}
```
