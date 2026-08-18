# Variant B 输出

【开始模拟生成】

```json
{
  "cases": [
    {
      "id": "A",
      "primaryModule": {
        "id": "chemistry",
        "level": "clear",
        "confidence": "high",
        "evidence": { "correct": 9, "total": 18, "accuracyPercent": 50, "wrongCount": 9, "gapToNextPercent": 22.2 }
      },
      "difficultySignals": [
        { "id": "chemistry:medium", "level": "clear", "confidence": "high", "evidence": { "correct": 3, "total": 10, "accuracyPercent": 30, "wrongCount": 7 } }
      ],
      "topicSignals": [],
      "calibrationSignals": [
        { "id": "chemistry:140100", "level": "calibration", "confidence": "low", "evidence": { "correct": 0, "total": 2, "wrongCount": 2 } }
      ]
    },
    { "id": "B", "primaryModule": null, "level": "none", "reason": "三科均高于80%，最低与第二低差距不足8个百分点" },
    { "id": "C", "primaryModule": { "level": "relative", "confidence": "high", "evidence": { "accuracyPercent": 68, "gapToNextPercent": 17 } } },
    { "id": "D", "topicSignals": [{ "level": "clear", "confidence": "medium", "evidence": { "correct": 1, "total": 4, "wrongCount": 3, "accuracyPercent": 25 } }] },
    { "id": "E", "topicSignals": [], "calibrationSignals": [{ "level": "calibration", "confidence": "low", "evidence": { "correct": 0, "total": 1, "wrongCount": 1 } }] },
    { "id": "F", "primaryModule": { "level": "clear|relative|none", "confidence": "按本科题量相对maxModuleTotal计算", "note": "正确率、差距、错题占比与动态题量线共同决定，不比较错题绝对数" } },
    { "id": "G", "examType": "TMUA", "examPolicy": "TMUA_STANDARD_EQUAL", "moduleSignals": [], "primaryModule": null, "reason": "18/20与17/20均高于80%，差距5个百分点" },
    { "id": "H", "examType": "TMUA", "examPolicy": "TMUA_STANDARD_EQUAL", "moduleSignals": [{ "id": "paper2", "level": "clear", "confidence": "high", "evidence": { "correct": 12, "total": 20, "accuracyPercent": 60, "gapToOtherPercent": 30 } }], "primaryModule": "paper2" },
    { "id": "I", "examType": "TMUA", "examPolicy": "TMUA_STANDARD_EQUAL", "moduleSignals": [{ "id": "paper1", "level": "clear", "confidence": "high", "evidence": { "correct": 10, "total": 20, "accuracyPercent": 50 } }, { "id": "paper2", "level": "clear", "confidence": "high", "evidence": { "correct": 11, "total": 20, "accuracyPercent": 55 } }], "primaryModule": "paper1" },
    { "id": "J", "examType": "TMUA", "primaryModule": null, "topicSignals": [{ "level": "clear", "confidence": "medium", "evidence": { "correct": 1, "total": 4, "wrongCount": 3, "accuracyPercent": 25 } }] },
    { "id": "K", "examType": "TMUA", "topicSignals": [], "calibrationSignals": [{ "level": "calibration", "confidence": "low", "evidence": { "correct": 0, "total": 1, "wrongCount": 1 } }] },
    { "id": "L", "examType": "TMUA", "examPolicy": "TMUA_STANDARD_EQUAL", "confidence": "high", "note": "两个模块均为20/20题覆盖，直接比较正确率和分差；记录不完整时回退GENERIC_DYNAMIC" }
  ]
}
```

【结束模拟生成】
