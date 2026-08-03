# 变体 B 输出

**生成日期**：2026-08-03  
**输入**：baseline/input.md

---

【开始模拟生成】

```json
{
  "weeklyBudgetMinutes": 300,
  "totalPlannedMinutes": 300,
  "evidenceBoundary": "本计划只使用本次报告给出的 Geometry、Algebra、Number 三个中难度优先项和首要训练标准；输入未提供的具体错误原因、题号与能力结论均不作推断。",
  "days": [
    {
      "day": 1,
      "role": "evidence_audit",
      "title": "先找出 Geometry 卡在哪一步",
      "focus": ["Geometry（几何）· 中难度"],
      "durationMinutes": 36,
      "diagnosticRationale": "Geometry 被列为第一优先项；今天先核对已有错误发生在哪个解题环节，不直接假设原因。",
      "steps": [
        {
          "action": "逐题遮住解析，重新写出已知条件、目标量和准备采用的方法。",
          "output": "每道错题的一份三栏记录：已知、所求、方法。"
        },
        {
          "action": "对照正式解析，圈出自己最先偏离正确过程的位置。",
          "output": "一张待核对清单，标明读题、方法选择、运算或检查中最先失去把握的步骤。"
        }
      ],
      "deliverable": "Geometry 错题步骤核对表。",
      "successCriteria": "每道现有 Geometry 错题都能标出第一个不确定步骤，并能用一句话说明正确过程从哪里开始。",
      "ifNotMet": "未能定位的题先标记为“方法未知”，第 2 天优先用正式解析重建这部分方法，不继续盲目刷题。",
      "evidenceRefs": ["input:focusGaps[0]", "input:nextAction"]
    },
    {
      "day": 2,
      "role": "method_rebuild",
      "title": "把 Geometry 解题过程重建成可复用方法",
      "focus": ["Geometry（几何）· 中难度"],
      "durationMinutes": 48,
      "diagnosticRationale": "第 1 天已经产出不确定步骤；今天先形成正确方法，再进入独立训练。",
      "steps": [
        {
          "action": "按第 1 天核对表，选择最早出现不确定步骤的一题，逐步阅读正式解析。",
          "output": "一份只保留关键判断和运算顺序的正确流程。"
        },
        {
          "action": "合上解析，用自己的语言重新写出何时使用这套方法以及每一步检查什么。",
          "output": "Geometry 方法清单：适用信号、执行顺序、检查点。"
        },
        {
          "action": "用方法清单重新完成第 1 天的一道错题。",
          "output": "一份带自检标记的完整重做过程。"
        }
      ],
      "deliverable": "Geometry 方法清单和一份完整重做过程。",
      "successCriteria": "不照抄解析也能说清方法的适用信号、关键步骤和最后检查点。",
      "ifNotMet": "保留仍说不清的步骤，第 3 天训练前先用 10 分钟重新对照解析；不要扩大到其他 Geometry 题型。",
      "evidenceRefs": ["input:focusGaps[0]", "day:1:deliverable"]
    },
    {
      "day": 3,
      "role": "retrieval_practice",
      "title": "不看清单，验证 Geometry 方法能否独立调用",
      "focus": ["Geometry（几何）· 中难度"],
      "durationMinutes": 45,
      "diagnosticRationale": "第 2 天完成的是方法重建；今天通过输入指定的 5 道训练检验方法是否能脱离提示使用。",
      "steps": [
        {
          "action": "收起方法清单，独立完成 5 道同考点训练，并在每题开头写下准备使用的方法。",
          "output": "5 道无提示作答和每题的方法选择记录。"
        },
        {
          "action": "完成后再查看反馈，只修改第一个错误步骤，并写明修改原因。",
          "output": "错误步骤修正记录。"
        }
      ],
      "deliverable": "5 道无提示训练结果和错误步骤修正记录。",
      "successCriteria": "至少答对 4 道，并且每题都在作答前明确写出使用的方法。",
      "ifNotMet": "若少于 4 道正确，回到第 2 天的方法清单，只针对最常失败的步骤补做一次“看例题—遮答案—重做”。",
      "evidenceRefs": ["input:nextAction", "day:2:deliverable"]
    },
    {
      "day": 4,
      "role": "secondary_transfer",
      "title": "用同一套核对流程进入 Algebra",
      "focus": ["Algebra（代数）· 中难度"],
      "durationMinutes": 42,
      "diagnosticRationale": "Algebra 是输入中的第二优先项；沿用前 3 天形成的证据核对方法，但不假设它与 Geometry 存在相同错误。",
      "steps": [
        {
          "action": "选择现有 Algebra 错题，先写出题目要求、准备采用的代数步骤和检查方式。",
          "output": "Algebra 解题前置计划。"
        },
        {
          "action": "对照正式解析，标出第一个不同点，并重做该步骤。",
          "output": "一条经核对的 Algebra 方法修正。"
        },
        {
          "action": "合上解析，再完整重做一题并口头解释每一步目的。",
          "output": "一份独立重做过程。"
        }
      ],
      "deliverable": "Algebra 前置计划、方法修正和独立重做过程。",
      "successCriteria": "能够在不看解析时完整说明一题的代数步骤，并指出最后如何检查结果。",
      "ifNotMet": "只保留第一个说不清的步骤作为下一次入口；暂不增加题量，也不把问题归因于整体 Algebra 能力。",
      "evidenceRefs": ["input:focusGaps[1]", "day:1:deliverable"]
    },
    {
      "day": 5,
      "role": "third_or_deepen",
      "title": "重建 Number 的判断与运算检查",
      "focus": ["Number（数）· 中难度"],
      "durationMinutes": 42,
      "diagnosticRationale": "Number 是输入中的第三优先项；今天单独建立它的方法与检查记录，避免复制前一天的 Algebra 结论。",
      "steps": [
        {
          "action": "重看现有 Number 错题，先独立写出数量关系和运算顺序。",
          "output": "一份运算前计划。"
        },
        {
          "action": "对照正式解析，分别标记方法选择差异和计算执行差异。",
          "output": "方法与运算两栏修正记录。"
        },
        {
          "action": "重做后使用逆运算、估算或代回中的可用方式检查结果。",
          "output": "一份带检查过程的完整答案。"
        }
      ],
      "deliverable": "Number 方法—运算修正表和一份带检查的重做答案。",
      "successCriteria": "能够把方法选择、计算执行和结果检查分开说明，不以“粗心”代替具体步骤。",
      "ifNotMet": "若仍无法区分方法与运算问题，只保留一题逐行对照正式解析，并在第 6 天降低该项的混合题量。",
      "evidenceRefs": ["input:focusGaps[2]", "day:4:deliverable"]
    },
    {
      "day": 6,
      "role": "interleaved_timed",
      "title": "混合三类题，训练先识别方法再作答",
      "focus": [
        "Geometry（几何）· 中难度",
        "Algebra（代数）· 中难度",
        "Number（数）· 中难度"
      ],
      "durationMinutes": 48,
      "diagnosticRationale": "前三项已经分别整理方法；今天混合呈现，检验能否先识别知识点和方法。输入没有可靠计时证据，因此限时只是一种训练安排，不代表已诊断出速度问题。",
      "steps": [
        {
          "action": "混合选择三个知识点的练习，逐题先写知识点类别和预定方法，再开始计算。",
          "output": "每题的方法选择记录。"
        },
        {
          "action": "在 48 分钟预算内完成训练；到时即停止，不为完成数量延长。",
          "output": "实际完成题数和未完成位置。"
        },
        {
          "action": "对照本周三份方法记录，区分是方法识别错误还是执行错误。",
          "output": "一份交错训练错误分类。"
        }
      ],
      "deliverable": "方法选择记录、实际完成记录和错误分类。",
      "successCriteria": "每题作答前都完成知识点与方法判断，并能把未通过题归入具体失败步骤。",
      "ifNotMet": "若方法识别错误较多，第 7 天复测前先用三份方法清单做一次不计算的题型判断；若执行错误较多，只复习对应步骤。",
      "evidenceRefs": ["input:focusGaps[0]", "input:focusGaps[1]", "input:focusGaps[2]", "day:2:deliverable", "day:4:deliverable", "day:5:deliverable"]
    },
    {
      "day": 7,
      "role": "weekly_retest",
      "title": "复测并决定下一周只保留什么",
      "focus": [
        "Geometry（几何）· 中难度",
        "Algebra（代数）· 中难度",
        "Number（数）· 中难度"
      ],
      "durationMinutes": 39,
      "diagnosticRationale": "今天不再新增方法，而是使用本周产出确认哪些方法已经能够独立调用，哪些仍需继续补强。",
      "steps": [
        {
          "action": "先完成 Geometry 的 5 道同考点复测，再各选择一项 Algebra 与 Number 的本周任务重新独立完成。",
          "output": "三项复测结果。"
        },
        {
          "action": "逐项对照本周成功标准，标记为达标、部分达标或未达标。",
          "output": "一张三项结果表。"
        },
        {
          "action": "只把部分达标和未达标项写入下一周首要清单。",
          "output": "下一周最多三项的继续训练决定。"
        }
      ],
      "deliverable": "三项复测结果表和下一周继续训练决定。",
      "successCriteria": "Geometry 达到至少 4/5，且 Algebra、Number 能按各自任务标准独立完成；所有结论均有本周作答或记录支撑。",
      "ifNotMet": "全部达标则进入混合巩固；部分达标则只保留未稳定项；Geometry 少于 4/5 或多项未达标则继续短周期补弱，不生成乐观的长期提升结论。",
      "evidenceRefs": ["input:nextAction", "day:3:deliverable", "day:4:deliverable", "day:5:deliverable", "day:6:deliverable"]
    }
  ]
}
```

【结束模拟生成】
