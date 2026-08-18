# Case 1 输入 — ESAT 非标准题量明确短板

```json
{
  "examType": "ESAT",
  "examPolicy": "ESAT_VARIABLE_MODULES",
  "weaknessProfile": {
    "diagnosisMode": "weakness_attack",
    "primaryModule": {"moduleId":"chemistry","moduleLabel":"化学","level":"clear","confidence":"medium","correct":5,"total":10,"accuracy":0.5,"rank":1,"gapToNext":0.3},
    "moduleSignals": [{"moduleId":"chemistry","moduleLabel":"化学","level":"clear","confidence":"medium","correct":5,"total":10,"accuracy":0.5,"rank":1,"gapToNext":0.3}],
    "difficultySignals": [{"moduleId":"chemistry","moduleLabel":"化学","difficulty":"medium","difficultyLabel":"中难度","level":"clear","confidence":"high","correct":2,"total":7,"accuracy":0.286,"wrongCount":5}],
    "topicSignals": [{"moduleId":"chemistry","moduleLabel":"化学","topicCode":"140100","topicLabel":"Atomic structure（原子结构）","level":"clear","confidence":"medium","correct":1,"total":4,"accuracy":0.25,"wrongCount":3,"wrongShareInModule":0.6,"primaryDifficulty":"medium","primaryDifficultyLabel":"中难度"}],
    "calibrationSignals": [],
    "sequenceSignals": []
  },
  "modules": [
    {"moduleId":"maths1","moduleLabel":"数学 1","scoreRange":[7.0,8.4],"correct":16,"total":18,"primaryReviewDifficulty":{"level":"medium","label":"中难度","correct":12,"total":14},"weaknessSignal":null,"difficultySignals":[]},
    {"moduleId":"chemistry","moduleLabel":"化学","scoreRange":[3.8,5.7],"correct":5,"total":10,"primaryReviewDifficulty":{"level":"medium","label":"中难度","correct":2,"total":7},"weaknessSignal":{"level":"clear","confidence":"medium"},"difficultySignals":[{"difficulty":"medium","difficultyLabel":"中难度","correct":2,"total":7,"accuracy":0.286}]},
    {"moduleId":"biology","moduleLabel":"生物","scoreRange":[5.4,7.1],"correct":8,"total":10,"primaryReviewDifficulty":{"level":"medium","label":"中难度","correct":6,"total":8},"weaknessSignal":null,"difficultySignals":[]}
  ]
}
```
