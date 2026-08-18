# Variant C 输出

【开始模拟生成】

```json
{
  "cases": [
    {
      "id": "A",
      "primaryModule": { "id": "chemistry", "level": "clear", "evidence": "9/18，50%" },
      "difficultySignals": [{ "id": "chemistry:medium", "level": "clear", "evidence": "3/10，30%" }],
      "topicSignals": [{ "id": "chemistry:140100", "level": "clear", "evidence": "0/2" }]
    },
    { "id": "B", "primaryModule": { "level": "relative", "reason": "三科中正确率最低" } },
    { "id": "C", "primaryModule": { "level": "clear", "evidence": "68%，比第二低低超过5个百分点" } },
    { "id": "D", "topicSignals": [{ "level": "clear", "evidence": "1/4，错3题" }] },
    { "id": "E", "topicSignals": [{ "level": "relative", "evidence": "0/1" }] },
    { "id": "F", "primaryModule": { "level": "clear|relative", "reason": "始终选择最低科目" } },
    { "id": "G", "examType": "TMUA", "primaryModule": { "id": "paper2", "level": "clear", "evidence": "17/20，85%，比Paper 1低5个百分点" } },
    { "id": "H", "examType": "TMUA", "primaryModule": { "id": "paper2", "level": "clear", "evidence": "12/20，60%" } },
    { "id": "I", "examType": "TMUA", "primaryModule": { "id": "paper1", "level": "clear", "evidence": "10/20，50%" }, "moduleSignals": [{ "id": "paper1" }], "note": "Paper 2为11/20但未保留" },
    { "id": "J", "examType": "TMUA", "primaryModule": { "level": "relative", "reason": "即使总分接近也选择最低模块" }, "topicSignals": [{ "level": "clear", "evidence": "1/4，错3题" }] },
    { "id": "K", "examType": "TMUA", "topicSignals": [{ "level": "relative", "evidence": "0/1" }] },
    { "id": "L", "examType": "TMUA", "policy": "未区分，始终采用最低模块规则", "confidence": "未按完整标准题量标记" }
  ]
}
```

【结束模拟生成】
