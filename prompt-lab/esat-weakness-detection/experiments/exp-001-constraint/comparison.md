# Exp-001 Constraint 完整对比

唯一变量：短板候选约束强度。根据用户反馈，验收集由六个 ESAT 场景扩展为六个 ESAT 场景加六个 TMUA 场景；三种变体使用同一扩展输入重新评分。

## Variant A：保守型

```json
{
  "cases": [
    { "id": "A", "primaryModule": "chemistry / clear / high", "difficulty": "chemistry:medium / clear / high", "topic": "140100 / calibration" },
    { "id": "B", "primaryModule": null },
    { "id": "C", "primaryModule": "relative" },
    { "id": "D", "topic": "calibration，因题量4少于固定5题" },
    { "id": "E", "topic": "calibration / low" },
    { "id": "F", "primaryModule": "题量少于8时不判断" },
    { "id": "G", "exam": "TMUA", "primaryModule": null },
    { "id": "H", "exam": "TMUA", "primaryModule": "Paper 2 / relative（结论偏保守）" },
    { "id": "I", "exam": "TMUA", "moduleSignals": "空（漏判双模块绝对低分）" },
    { "id": "J", "exam": "TMUA", "topic": "calibration（漏判4题错3题）" },
    { "id": "K", "exam": "TMUA", "topic": "calibration / low" },
    { "id": "L", "exam": "TMUA", "policy": "标准等题量，但仅容纳一个主短板" }
  ]
}
```

完整正文见 [variant-a/output.md](variant-a/output.md)。

## Variant B：分层自适应

```json
{
  "cases": [
    { "id": "A", "primaryModule": "chemistry / clear / high", "difficulty": "chemistry:medium / clear / high", "topic": "140100 / calibration / low" },
    { "id": "B", "primaryModule": null, "level": "none" },
    { "id": "C", "primaryModule": "relative / high" },
    { "id": "D", "topic": "clear / medium，1/4、错3题" },
    { "id": "E", "topic": "calibration / low，0/1" },
    { "id": "F", "primaryModule": "按本次最大模块题量动态计算" },
    { "id": "G", "exam": "TMUA", "moduleSignals": [], "level": "none" },
    { "id": "H", "exam": "TMUA", "primaryModule": "Paper 2 / clear / high" },
    { "id": "I", "exam": "TMUA", "moduleSignals": ["Paper 1 / clear / high", "Paper 2 / clear / high"] },
    { "id": "J", "exam": "TMUA", "primaryModule": null, "topic": "clear / medium" },
    { "id": "K", "exam": "TMUA", "topic": "calibration / low" },
    { "id": "L", "exam": "TMUA", "policy": "TMUA_STANDARD_EQUAL / high；不完整时回退动态策略" }
  ]
}
```

完整正文见 [variant-b/output.md](variant-b/output.md)。

## Variant C：高召回激进型

```json
{
  "cases": [
    { "id": "A", "primaryModule": "chemistry / clear", "difficulty": "chemistry:medium / clear", "topic": "140100 / clear（误升级）" },
    { "id": "B", "primaryModule": "relative（误判）" },
    { "id": "C", "primaryModule": "clear（过度表述）" },
    { "id": "D", "topic": "clear" },
    { "id": "E", "topic": "relative（误判）" },
    { "id": "F", "primaryModule": "始终选择最低科目" },
    { "id": "G", "exam": "TMUA", "primaryModule": "Paper 2 / clear（误判）" },
    { "id": "H", "exam": "TMUA", "primaryModule": "Paper 2 / clear" },
    { "id": "I", "exam": "TMUA", "moduleSignals": "仅Paper 1（漏掉Paper 2）" },
    { "id": "J", "exam": "TMUA", "primaryModule": "relative（误判）", "topic": "clear" },
    { "id": "K", "exam": "TMUA", "topic": "relative（误判）" },
    { "id": "L", "exam": "TMUA", "policy": "未区分考试结构" }
  ]
}
```

完整正文见 [variant-c/output.md](variant-c/output.md)。
