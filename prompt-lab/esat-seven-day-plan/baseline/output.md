# 基线输出

**版本**：baseline  
**生成日期**：2026-08-03  
**使用提示词**：baseline/prompt.md  
**使用输入**：baseline/input.md

---

【开始模拟生成】

```json
{
  "summary": {
    "planningWeeks": 1,
    "weeklyHours": 5,
    "totalHours": 5,
    "mode": "Starter",
    "planningScope": "starter",
    "analysisSource": "fallback"
  },
  "phases": [
    {
      "id": "foundation",
      "title": "7 天启动计划",
      "durationWeeks": 1,
      "weekLabel": "本周",
      "goal": "先练这一项：Geometry（几何），用一组短训练确认是否需要继续专项补弱。",
      "strategy": "先完成一项可验证的小任务；补充考试日期和每周时间后，再生成完整阶段路线。",
      "focusTags": [
        "Geometry（几何）",
        "Algebra（代数）",
        "Number（数）"
      ],
      "tasks": [
        {
          "period": "本周",
          "title": "Geometry（几何）· 中难度专项复习",
          "completionLabel": "完成本格错题复盘与 2–4 小时专项投入"
        },
        {
          "period": "本周",
          "title": "Algebra（代数）· 中难度专项复习",
          "completionLabel": "完成本格错题复盘与 2–4 小时专项投入"
        },
        {
          "period": "本周",
          "title": "Number（数）· 中难度专项复习",
          "completionLabel": "完成本格错题复盘与 2–4 小时专项投入"
        }
      ],
      "activities": [
        "完成 5 道同考点训练并至少答对 4 道；未达标时回到相关错题复盘。"
      ]
    }
  ]
}
```

【结束模拟生成】
