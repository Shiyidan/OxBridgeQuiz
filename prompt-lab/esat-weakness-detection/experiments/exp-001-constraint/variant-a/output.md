# Variant A 输出

【开始模拟生成】

```json
{
  "cases": [
    {
      "id": "A",
      "primaryModule": { "id": "chemistry", "level": "clear", "confidence": "high", "evidence": "9/18，50%，比生物低22.2个百分点" },
      "difficultySignals": [{ "id": "chemistry:medium", "level": "clear", "confidence": "high", "evidence": "3/10，30%" }],
      "topicSignals": [],
      "calibrationSignals": [{ "id": "chemistry:140100:medium", "evidence": "0/2" }]
    },
    { "id": "B", "primaryModule": null, "difficultySignals": [], "topicSignals": [], "calibrationSignals": "仅保留真实错题" },
    { "id": "C", "primaryModule": { "level": "relative", "confidence": "high", "evidence": "68%，比第二低科目低至少15个百分点" } },
    { "id": "D", "topicSignals": [], "calibrationSignals": [{ "level": "calibration", "evidence": "1/4，错3题，但题量少于5" }] },
    { "id": "E", "topicSignals": [], "calibrationSignals": [{ "level": "calibration", "confidence": "low", "evidence": "0/1" }] },
    { "id": "F", "primaryModule": null, "note": "低题量科目若少于8题，只进入校准，不形成科目短板" },
    { "id": "G", "examType": "TMUA", "primaryModule": null, "reason": "90%与85%均高且差距不足15个百分点" },
    { "id": "H", "examType": "TMUA", "primaryModule": { "id": "paper2", "level": "relative", "confidence": "high", "evidence": "12/20，60%，比Paper 1低30个百分点" } },
    { "id": "I", "examType": "TMUA", "primaryModule": null, "moduleSignals": [], "note": "最低模块50%，但两模块差距不足15个百分点；保守规则未保留双绝对短板" },
    { "id": "J", "examType": "TMUA", "primaryModule": null, "topicSignals": [], "calibrationSignals": [{ "evidence": "1/4，错3题，但题量少于5" }] },
    { "id": "K", "examType": "TMUA", "topicSignals": [], "calibrationSignals": [{ "level": "calibration", "confidence": "low", "evidence": "0/1" }] },
    { "id": "L", "examType": "TMUA", "policy": "TMUA_STANDARD_EQUAL", "confidence": "high", "note": "使用20题完整模块和直接分差，但仍只输出一个primaryModule" }
  ]
}
```

【结束模拟生成】
