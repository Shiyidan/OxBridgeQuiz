# 基线输入

**版本**：baseline  
**创建日期**：2026-08-03  
**说明**：根据用户截图构造的等价测试数据；用于复现当前模板问题，不代表真实学生完整答卷。

---

```json
{
  "profile": {
    "examDate": null,
    "weeklyHours": null
  },
  "weeklyHoursFallback": 5,
  "nextAction": {
    "title": "先练这一项：Geometry（几何）",
    "topicLabel": "Geometry（几何）",
    "suggestedMinutes": 20,
    "suggestedQuestionCount": 5,
    "successCriteria": "完成 5 道同考点训练并至少答对 4 道；未达标时回到相关错题复盘。"
  },
  "focusGaps": [
    {
      "topicLabel": "Geometry（几何）",
      "difficultyLabel": "中难度",
      "suggestedHours": "2–4 小时"
    },
    {
      "topicLabel": "Algebra（代数）",
      "difficultyLabel": "中难度",
      "suggestedHours": "2–4 小时"
    },
    {
      "topicLabel": "Number（数）",
      "difficultyLabel": "中难度",
      "suggestedHours": "2–4 小时"
    }
  ]
}
```
