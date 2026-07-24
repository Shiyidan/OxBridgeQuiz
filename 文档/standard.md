# 题目解析 JSON 批注与标准范例

本文规定当前正式上传 JSON。新版分段卷统一使用 `metadata + sections` 和 camelCase 题目字段；历史 `modules`、扁平 `questions` 与 snake_case 题目只作为兼容输入。若后文兼容示例与新版规则冲突，以第 2、2.1、2.2 节为准。

## 第一部分：当前 JSON 文档加批注

### 1. 当前文件状态

| 题号 | 示例用途        | 当前覆盖的问题                           |
| ---- | --------------- | ---------------------------------------- |
| Q001 | 纯文本选择题    | 题干段落拆分、题型命名、冗余试卷字段     |
| Q004 | 题干中含 SVG 图 | 题干图文混排、图片引用、图片元数据精简   |
| Q012 | 选项中含 SVG 图 | 图像选项格式、题干配图、题型和知识点字段 |

### 2. 根结构

新版分段卷根结构：

```json
{
  "metadata": {
    "code": "TMUA-2018",
    "title": "TMUA 2018 Diagnostic Paper",
    "examType": "TMUA",
    "year": 2018,
    "paperType": "realPaper",
    "assemblyType": "original",
    "deliveryMode": "section_sequence",
    "remarks": "Annual TMUA paper."
  },
  "sections": []
}
```

批注整理：

- 新版 ESAT/TMUA 分段诊断卷使用 `{ "metadata": {...}, "sections": [...] }`。
- ESAT 的 `sections` 表示三个科目，TMUA 的 `sections` 表示 Paper 1/2。
- `sections` 只保存 `code`、`sectionType`、`order` 和 `questions`。分段名称、时长、题量规则、休息和跳转策略由服务端派生，不写入上传文件。
- 历史 `{ "metadata": {...}, "modules": [...] }`、`questions[].items` 和扁平 `questions` 仍可兼容读取，但不再作为新文件生成目标。
- 不使用纯数组作为根结构。

`metadata` 字段规则：

| 字段           | 含义             | 标准要求                                                         |
| -------------- | ---------------- | ---------------------------------------------------------------- |
| `code`         | 套卷稳定代码     | 必须填写，例如 `TMUA-2018`；入库为 `Paper.code`                  |
| `title`        | 试卷名称         | 必须填写，例如 `TMUA 2018 Diagnostic Paper`                      |
| `year`         | 年份             | 必须为数字，例如 `2023`                                          |
| `examType`     | 考试类型         | 必须使用系统考试类型，例如 `TMUA`、`ESAT`                        |
| `paperType`    | 类型             | 必须为 `realPaper`、`mockPaper`、`aiPaper` 之一                  |
| `deliveryMode` | 上传文档交付方式 | 新版分段卷固定为 `section_sequence`                              |
| `assemblyType` | 组卷来源         | ENGAA/NSAA 真题组合为 `legacy_equivalent`，原始整卷为 `original` |
| `remarks`      | 诊断适用说明     | 可选；只保存业务说明，不保存解析过程信息                         |

`paperType` 枚举含义：

| 值          | 含义      |
| ----------- | --------- |
| `realPaper` | 真题卷    |
| `mockPaper` | 模考卷    |
| `aiPaper`   | AI 生成卷 |

上传 JSON 不包含 `duration`、`totalQuestions`、`breakPolicy`。服务端根据 `examType + sections[].code` 计算并在开始考试时冻结运行快照。单题通过 `source.examType/year/sectionCode/questionNumber` 保存来源。

### 2.1 ESAT 三模块等效诊断卷

`sections` 表示三个独立科目，不表示混合出题。每科固定 40 分钟；前两科结束后进入 180 秒可跳过休息。名称、时长和休息均由服务端规则生成。

```json
{
  "metadata": {
    "code": "ESAT-EQUIV-2023-M1-PHY-M2",
    "title": "ESAT 2023 Equivalent Diagnostic — Mathematics 1 / Physics / Mathematics 2",
    "examType": "ESAT",
    "year": 2023,
    "paperType": "realPaper",
    "assemblyType": "legacy_equivalent",
    "deliveryMode": "section_sequence",
    "remarks": "使用历年真题组成的等效诊断卷，并非某位考生的官方 ESAT 原卷。"
  },
  "sections": [
    {
      "code": "maths1",
      "sectionType": "subject",
      "order": 1,
      "questions": []
    },
    {
      "code": "physics",
      "sectionType": "subject",
      "order": 2,
      "questions": []
    },
    {
      "code": "maths2",
      "sectionType": "subject",
      "order": 3,
      "questions": []
    }
  ]
}
```

ESAT 模块卷必须满足：

- 恰好三个不同 `sections`，必须包含 `maths1`；`sectionType` 固定为 `subject`。
- `code` 只能为 `maths1`、`maths2`、`physics`、`chemistry`、`biology`；`order` 为不重复正整数。
- 每个 `questions` 非空；科目内 `number` 从 1 开始且不得重复。
- 每题通过 `source.examType` 保存 `ENGAA`、`NSAA` 或其他真实来源，通过 `source.sectionCode` 保存当前科目代码。
- 组合卷发布后如已有作答记录，不得覆盖题目或模块结构；需要调整时创建新版本，以保证历史报告可复现。

### 2.2 TMUA 两卷诊断卷

TMUA 的 `sections` 表示两份 Paper。Paper 1 与 Paper 2 均为 20 道单项选择题、75 分钟；卷间不设置休息，Paper 1 锁定后立即开始 Paper 2。

```json
{
  "metadata": {
    "code": "TMUA-2018",
    "title": "TMUA 2018 Diagnostic Paper",
    "examType": "TMUA",
    "year": 2018,
    "paperType": "realPaper",
    "assemblyType": "original",
    "deliveryMode": "section_sequence",
    "remarks": "Annual TMUA paper."
  },
  "sections": [
    {
      "code": "paper1",
      "sectionType": "paper",
      "order": 1,
      "questions": ["... 20 道完整题目 ..."]
    },
    {
      "code": "paper2",
      "sectionType": "paper",
      "order": 2,
      "questions": ["... 20 道完整题目 ..."]
    }
  ]
}
```

TMUA 分卷必须满足：

- `sections[].code` 依次且仅为 `paper1`、`paper2`，`sectionType` 固定为 `paper`，`order` 固定为 1、2。
- 每个 Paper 恰好 20 题；两卷题号均从 1 开始。
- 每题 `questionType = single_choice`，并保留来源稳定题号 `code`。
- 每题 `source.examType/year/sectionCode/questionNumber` 必须与所属试卷和分卷一致。
- 分卷名称、`TMUA-P1/TMUA-P2` 内部分组码、75 分钟时长和直接切换策略均由服务端生成；不得在 section 中填写 `name`、`duration`、`durationSeconds` 或 `transitionAfter`。
- Paper 1 结束后答案永久锁定，不能从 Paper 2 返回修改；刷新或重新进入必须恢复当前卷及其服务端截止时间。

### 2.3 新版题目字段

新版 `sections[].questions[]` 使用 camelCase：

| 上传字段                             | 入库/前端标准字段                       | 用途                               |
| ------------------------------------ | --------------------------------------- | ---------------------------------- |
| `contentBlocks`                      | `content_blocks`                        | 按原顺序渲染题干段落和 `image_ref` |
| `questionType`                       | `question_type`                         | 题型                               |
| `classification.subject/subjectCode` | `subject/subject_code`                  | 真实考纲学科，不是 Paper 分组码    |
| `classification.topic/topicCode`     | `topic/topic_code`                      | 主题                               |
| `classification.knowledgePoints`     | `knowledge_points`                      | 细分知识点                         |
| `source.examType/year`               | `source_examType/year`                  | 真题来源                           |
| `source.sectionCode/questionNumber`  | 分段归属和分段内题号                    | 必须与外层 section 和题号一致      |
| `learningAnalysis.correctSolution`   | `learning_analysis.correct_solution`    | 中文正确解析                       |
| `learningAnalysis.examFocus`         | `learning_analysis.exam_focus`          | 考查重点                           |
| `learningAnalysis.commonErrorCauses` | `learning_analysis.common_error_causes` | 常见错误                           |
| `learningAnalysis.reviewGuidance`    | `learning_analysis.review_guidance`     | 复习建议                           |

`contentBlocks` 支持 `paragraph { text, align? }` 和 `image_ref { image_id }`。`paragraph.align` 目前只允许 `"center"`；未填写时按普通题干流展示，填写 `"center"` 时该段作为独立行整体居中。该字段控制段落布局，不改变 LaTeX 的解析方式。

```json
{
  "type": "paragraph",
  "text": "\\[5x^2+2xy=4\\]",
  "align": "center"
}
```

图片引用必须匹配同题 `images[].id`；SVG 使用 `{ id, type: "svg", svg, alt }`。前端通过公共 `QuestionCard`、`LatexText` 渲染，不直接执行 SVG。

### 3. 标题字段 `title`

本节之后保留的 snake_case 示例描述归一化后的数据库/前端结构，也用于历史文件兼容。新版上传文件把 `content_blocks`、`question_type`、`learning_analysis` 分别写为 `contentBlocks`、`questionType`、`learningAnalysis`。

`title` 必须取自新版 `contentBlocks[0].text`（兼容格式为 `content_blocks[0].text`），不得单独生成摘要标题或人工标题。

字段规则：

| 字段                     | 标准要求                          |
| ------------------------ | --------------------------------- |
| `title`                  | 必须等于 `content_blocks[0].text` |
| `content_blocks[0]`      | 必须是第一段题干文本块            |
| `content_blocks[0].type` | 必须为 `paragraph`                |

标准写法：

```json
{
  "title": "A circuit is set up as shown. All three resistors are identical.",
  "content_blocks": [
    {
      "type": "paragraph",
      "text": "A circuit is set up as shown. All three resistors are identical."
    }
  ]
}
```

这样处理后，题目列表、搜索、预览和正式答题展示都使用同一份题干来源，避免 `title` 与正文第一段不一致。

### 4. 题干内容 `content_blocks`

当前问题：

```json
"content_blocks": [
  {
    "type": "text",
    "text": "第一段\n\n第二段\n\n第三段"
  }
]
```

你的批注要求：

> 每一段单独显示，而不是使用 `\n\n` 换行，保持原题顺序和换行节奏。

整理后的标准要求：

```json
"content_blocks": [
  {
    "type": "paragraph",
    "text": "第一段题干文本。"
  },
  {
    "type": "paragraph",
    "text": "第二段题干文本。"
  },
  {
    "type": "paragraph",
    "text": "第三段题干文本。"
  }
]
```

字段规则：

| 字段                | 标准含义                                        |
| ------------------- | ----------------------------------------------- |
| `type: "paragraph"` | 一个独立题干段落，含普通文本和 LaTeX            |
| `type: "image_ref"` | 题干中的内嵌图片引用                            |
| `text`              | 段落文本，保留 LaTeX，如 `$R$`、`$4\\pi R^2$`   |
| `image_id`          | 当 `type` 为 `image_ref` 时，匹配 `images[].id` |

注意：

- 标准 JSON 中题干文字统一使用 `paragraph`。
- 题干图片统一使用 `image_ref + image_id`，不得使用 `img/img_ref` 或直接内嵌资源。

标准题干配图写法：

```json
"content_blocks": [
  {
    "type": "paragraph",
    "text": "A circuit is set up as shown. All three resistors are identical."
  },
  {
    "type": "image_ref",
    "image_id": "circuit_switch_resistors",
    "alt": "Circuit with battery, ammeter, switch and three identical resistors."
  },
  {
    "type": "paragraph",
    "text": "The switch is now closed."
  }
]
```

### 5. 选项 `options`

当前普通选项结构是合理的：

```json
{
  "label": "A",
  "text": "$R = 5r$"
}
```

整理后的标准要求：

- 每个选项必须有 `label`。
- 每个选项必须有 `text`，即使图像选项也保留为空字符串。
- 普通文本或公式选项使用 `text`。
- 图像选项必须使用 `image_id` 引用 `images` 数组中的图片资源。
- 选项中不得直接保存 SVG 字符串或 PNG 路径。

普通选项：

```json
{
  "label": "A",
  "text": "$R = 5r$"
}
```

图像选项：

```json
{
  "label": "A",
  "text": "",
  "image_id": "q012_option_a"
}
```

注意：

- 当前系统校验会检查 `options[].text` 是否存在，所以图像选项也要保留 `text: ""`。
- 当前前端 `QuestionCard.vue` 会同时渲染 `opt.text` 和 `options[].image_id`，图像资源通过 `images[].id` 读取。

### 6. 答案 `answer`

当前结构：

```json
"answer": ["A"]
```

批注整理：

- 必须保持数组格式。
- 单选题也使用数组，便于统一单选和多选的数据结构。
- 多选题示例：`"answer": ["A", "C"]`。

### 7. 图片资源 `images`

`images` 是题目内所有图片资源的唯一资源池。题干图形和选项图形都必须通过引用方式使用 `images` 中的资源，引用侧不得直接写 SVG 或 PNG。

统一引用规则：

| 使用位置 | 引用方式                                                            | 说明                              |
| -------- | ------------------------------------------------------------------- | --------------------------------- |
| 题干图形 | `content_blocks[].type = "image_ref"` + `content_blocks[].image_id` | `image_id` 必须匹配 `images[].id` |
| 选项图形 | `options[].image_id`                                                | `image_id` 必须匹配 `images[].id` |

这样处理后，SVG 还原质量不好时，必须只替换 `images` 中对应资源，例如从 `type: "svg" + svg` 改为 `type: "image" + src`，题干和选项中的引用不需要改。

当前 Q004 的图片对象包含了较多恢复过程字段：

```json
{
  "id": "circuit_switch_resistors",
  "type": "svg",
  "svg": "<svg ...></svg>",
  "restore_method": "...",
  "visual_plan": {},
  "semantic": {},
  "graph_schema": {}
}
```

你的批注要求：

> 此处不得详细描述图形构成，只保留 `"svg": "<svg ..."` 这类展示内容。

整理后的标准要求：

```json
{
  "id": "circuit_switch_resistors",
  "type": "svg",
  "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 360 190\">...</svg>",
  "alt": "Circuit diagram with a battery, ammeter, switch and three identical resistors."
}
```

字段规则：

| 字段   | 是否必需     | 说明                                                        |
| ------ | ------------ | ----------------------------------------------------------- |
| `id`   | 是           | 被 `content_blocks[].image_id` 或 `options[].image_id` 引用 |
| `type` | 是           | `svg` 或 `image`                                            |
| `svg`  | SVG 必需     | 当 `type` 为 `svg` 时，直接保存完整 SVG 字符串              |
| `src`  | PNG/JPG 必需 | 当 `type` 为 `image` 时，保存图片地址或相对路径             |
| `alt`  | 必需         | 图片备用描述，便于无障碍和人工审阅                          |

SVG 资源：

```json
{
  "id": "q012_option_a",
  "type": "svg",
  "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 220 160\">...</svg>",
  "alt": "Option A temperature-distance graph."
}
```

PNG 替换资源：

```json
{
  "id": "q012_option_a",
  "type": "image",
  "src": "images/q012_option_a.png",
  "alt": "Option A temperature-distance graph."
}
```

必须删除，不能进入标准主结构的字段：

- `restore_method`
- `visual_plan`
- `semantic`
- `graph_schema`

这些字段只能作为解析过程调试信息，不得作为题库稳定标准字段。若以后确实需要图形语义检索，必须单独设计 `diagram_meta`，不得混入基础图片资源。

### 8. 试卷级与单题来源字段

当前单题中需要保留的来源字段：

```json
"examType": "ESAT",
"source_examType": "ENGAA",
"year": 2023
```

当前被注释掉的字段：

```json
"paperCode": "S1",
"paperLabel": "ENGAA 2023 Section 1",
"sectionCode": null,
"sectionLabel": null,
"partCode": null,
"partLabel": null,
"questionNumber": 1
```

你的批注要求：

> 这些字段没有明确含义，必须删除。

整理后的标准要求：

- `metadata` 中必须保留 `paperName`、`year`、`duration`、`examType`、`paperType`、`totalQuestions`。
- 每道题必须保留 `examType`、`source_examType`、`year`。
- 单题中的 `examType` 必须与 `metadata.examType` 一致。
- 单题中的 `year` 必须与 `metadata.year` 一致。
- 单题中的 `source_examType` 必须记录原始来源考试类型，例如 `ENGAA`。
- `number` 已经表示题号，不再额外使用 `questionNumber`。
- 必须删除 `paperCode`、`paperLabel`、`sectionCode`、`sectionLabel`、`partCode`、`partLabel`。
- `duration`、`paperType`、`totalQuestions`、试卷名称必须只放在根级 `metadata` 中，不得重复塞进每一道题。

### 9. 题型 `question_type`

当前 Q001 写法：

```json
"question_type": "multiple_choice"
```

你的批注要求：

> 必须改成单选 `single_choice`。题型只分为 `single_choice`、`multiple_choice`、`short_answer`。

整理后的标准要求：

`question_type` 表示作答交互类型。

必须使用以下枚举：

| 值                | 含义                              |
| ----------------- | --------------------------------- |
| `single_choice`   | 单选题，`answer` 通常只有一个选项 |
| `multiple_choice` | 多选题，`answer` 允许包含多个选项 |
| `short_answer`    | 简答题或填空题                    |

因此：

- Q001 必须为 `single_choice`。
- Q004 必须为 `single_choice`。
- Q012 虽然选项是图像，但仍是单选，必须为 `single_choice`。

### 10. 学习分析 `learning_analysis`

当前结构需要保留：

```json
"learning_analysis": {
  "solution_trace": {
    "trace_source": "rule_verified",
    "knowns": [],
    "method": "",
    "steps": [],
    "final_value": "",
    "correct_answer": [],
    "distractors": {}
  },
  "answer_feedback_mode": "precomputed",
  "exam_focus": "",
  "correct_solution": "",
  "common_error_causes": [],
  "review_guidance": ""
}
```

整理后的标准要求：

- `solution_trace` 用于结构化解题链路。
- `correct_solution` 用于前端直接展示完整中文解析。
- `exam_focus` 用于概括考点。
- `common_error_causes` 用于错因诊断。
- `review_guidance` 用于复习指导。
- `answer_feedback_mode` 当前固定为 `precomputed`。

### 11. 学科与考纲字段

当前结构：

```json
"subject_code": "130000",
"subject": "Physics (物理)",
"topic_code": "130100",
"topic": "Electricity (电学)",
"knowledge_points": [
  {
    "code": "130102",
    "label": "Electric circuits (电路)",
    "role": "primary"
  }
]
```

整理后的标准要求：

- 这些字段需要保留。
- 题库筛选依赖 `subject_code`、`topic_code`、`knowledge_points[].code`。
- `knowledge_points` 至少有一个 `primary`。
- 如有多个知识点，必须用 `secondary` 标记次要知识点。

## 第二部分：历史扁平卷兼容范例

下面只说明旧扁平 `questions + snake_case` 文件如何继续兼容导入，不是新文件生成标准。使用该兼容结构时必须满足：

- 不包含 `//` 注释。
- 不包含尾逗号。
- 使用 UTF-8。
- 根结构必须先写 `metadata`，再写 `questions`。
- `metadata` 必须包含试卷名称、年份、考试时长、考试类型、试卷类型和题目数量。
- `title` 必须等于 `content_blocks[0].text`。
- 段落用多个 `content_blocks` 表达，不用一个字符串里的 `\n\n` 承担排版。
- 题干图片使用 `content_blocks[].type = "image_ref"` 和 `content_blocks[].image_id` 引用 `images[].id`。
- 普通选项使用 `text`，图像选项使用 `text: ""` 和 `options[].image_id` 引用 `images[].id`。

```json
{
  "metadata": {
    "paperName": "ENGAA 2023 Section 1",
    "year": 2023,
    "duration": 75,
    "examType": "ESAT",
    "paperType": "realPaper",
    "totalQuestions": 1
  },
  "questions": [
    {
      "code": "ENGAA_2023_S1-Q004",
      "number": 4,
      "title": "A circuit is set up as shown. All three resistors are identical.",
      "content_blocks": [
        {
          "type": "paragraph",
          "text": "A circuit is set up as shown. All three resistors are identical."
        },
        {
          "type": "paragraph",
          "text": "When the switch is open, the reading on the ammeter is $1.0\\,\\mathrm{A}$ and the power transferred from the battery is $1.0\\,\\mathrm{W}$."
        },
        {
          "type": "image_ref",
          "image_id": "circuit_switch_resistors",
          "alt": "Circuit diagram with battery, ammeter, switch and three identical resistors."
        },
        {
          "type": "paragraph",
          "text": "The switch is now closed."
        },
        {
          "type": "paragraph",
          "text": "What is the new reading on the ammeter and what is the new power transferred from the battery?"
        }
      ],
      "options": [
        {
          "label": "A",
          "text": "$0.67\\,\\mathrm{A}$; $0.67\\,\\mathrm{W}$"
        },
        {
          "label": "B",
          "text": "$0.67\\,\\mathrm{A}$; $1.3\\,\\mathrm{W}$"
        },
        {
          "label": "C",
          "text": "$0.67\\,\\mathrm{A}$; $1.5\\,\\mathrm{W}$"
        },
        {
          "label": "D",
          "text": "$0.67\\,\\mathrm{A}$; $2.0\\,\\mathrm{W}$"
        },
        {
          "label": "E",
          "text": "$1.0\\,\\mathrm{A}$; $1.0\\,\\mathrm{W}$"
        },
        {
          "label": "F",
          "text": "$1.0\\,\\mathrm{A}$; $1.5\\,\\mathrm{W}$"
        },
        {
          "label": "G",
          "text": "$1.0\\,\\mathrm{A}$; $2.0\\,\\mathrm{W}$"
        },
        {
          "label": "H",
          "text": "$1.0\\,\\mathrm{A}$; $3.0\\,\\mathrm{W}$"
        }
      ],
      "answer": ["F"],
      "images": [
        {
          "id": "circuit_switch_resistors",
          "type": "svg",
          "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 360 190\">...</svg>",
          "alt": "Circuit diagram with battery, ammeter, switch and three identical resistors."
        }
      ],
      "examType": "ESAT",
      "source_examType": "ENGAA",
      "year": 2023,
      "question_type": "single_choice",
      "difficulty": "hard",
      "is_ai_generated": false,
      "subject_code": "130000",
      "subject": "Physics (物理)",
      "topic_code": "130100",
      "topic": "Electricity (电学)",
      "knowledge_points": [
        {
          "code": "130102",
          "label": "Electric circuits (电路)",
          "role": "primary"
        }
      ],
      "learning_analysis": {
        "solution_trace": {
          "trace_source": "rule_verified",
          "knowns": [
            "With the switch open, one resistor is connected and the ammeter reads $1.0\\,\\mathrm{A}$.",
            "The battery transfers $1.0\\,\\mathrm{W}$, so the battery voltage is $1.0\\,\\mathrm{V}$.",
            "Closing the switch adds a second branch containing two identical resistors in series."
          ],
          "method": "Use circuit resistance in each branch and total power at fixed battery voltage.",
          "steps": [
            "The top branch still contains one resistor, so its current and the ammeter reading remain $1.0\\,\\mathrm{A}$.",
            "The lower branch has resistance $2R$, so at the same voltage its current is half the top branch current.",
            "Total current becomes $1.5\\,\\mathrm{A}$, so battery power becomes $VI = 1.0\\times1.5 = 1.5\\,\\mathrm{W}$."
          ],
          "final_value": "$1.0\\,\\mathrm{A}$ and $1.5\\,\\mathrm{W}$",
          "correct_answer": ["F"],
          "distractors": {
            "E": "Ignores the added lower branch current.",
            "G": "Assumes the second branch current equals the top branch current.",
            "H": "Treats all three resistors as separate equal-current branches."
          }
        },
        "answer_feedback_mode": "precomputed",
        "exam_focus": "考查并联支路中等效电阻、电流分配和电功率的综合判断。",
        "correct_solution": "已知条件：\n- With the switch open, one resistor is connected and the ammeter reads $1.0\\,\\mathrm{A}$.\n- The battery transfers $1.0\\,\\mathrm{W}$, so the battery voltage is $1.0\\,\\mathrm{V}$.\n- Closing the switch adds a second branch containing two identical resistors in series.\n\n解题步骤：\n1. The top branch still contains one resistor, so its current and the ammeter reading remain $1.0\\,\\mathrm{A}$.\n2. The lower branch has resistance $2R$, so at the same voltage its current is half the top branch current.\n3. Total current becomes $1.5\\,\\mathrm{A}$, so battery power becomes $VI = 1.0\\times1.5 = 1.5\\,\\mathrm{W}$.\n\n结论：\n因此答案为 F。",
        "common_error_causes": [
          "没有区分电流表所在支路和电池总电流。",
          "误认为新支路会改变上支路电流。",
          "把两个串联电阻的支路当作一个单电阻支路。"
        ],
        "review_guidance": "复习并联电路时，先判断每条支路的电阻，再分别计算支路电流，最后求电池总功率。"
      }
    }
  ]
}
```

### 图像选项题标准片段

当选项本身是图像时，选项对象中只能保存引用，图片内容必须放入 `images`：

```json
{
  "options": [
    {
      "label": "A",
      "text": "",
      "image_id": "q012_option_a"
    }
  ],
  "images": [
    {
      "id": "q012_option_a",
      "type": "svg",
      "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 220 160\">...</svg>",
      "alt": "Option A temperature-distance graph."
    }
  ]
}
```

SVG 还原效果不好时，必须保持选项中的 `image_id` 不变，只替换 `images` 中对应资源：

```json
{
  "id": "q012_option_a",
  "type": "image",
  "src": "images/q012_option_a.png",
  "alt": "Option A temperature-distance graph."
}
```

完整题目中仍然使用：

```json
"question_type": "single_choice",
"answer": ["A"]
```

### 最终标准检查清单

导入前逐项检查：

- 新版分段卷根结构必须为 `{ "metadata": {...}, "sections": [...] }`；扁平 `questions` 和 `modules` 仅用于兼容历史数据。
- `metadata.code` 和 `metadata.title` 必须为非空字符串。
- `metadata.year` 必须是数字年份。
- `metadata.examType` 必须是系统考试类型。
- `metadata.paperType` 必须为 `realPaper`、`mockPaper`、`aiPaper` 之一。
- `metadata.deliveryMode` 必须为 `section_sequence`，且不得上传 `duration`、`totalQuestions`、`breakPolicy`。
- TMUA 必须依次包含 `paper1`、`paper2`，各 20 题，`sectionType = paper`。
- ESAT 必须包含三个不重复科目且包含 `maths1`，`sectionType = subject`。
- section 只允许业务内容字段；不得包含名称、时长或跳转规则。
- section `code` 必须稳定，`order` 和 section 内 `number` 必须为不重复的正整数。
- 每题有 `number`、`title`、`options`。
- 每题必须保留 `code`、`source`、`classification` 和 `learningAnalysis`。
- `source.year` 必须与 `metadata.year` 一致，`source.sectionCode` 必须与外层 section 一致。
- `title` 必须等于 `contentBlocks[0].text`。
- `contentBlocks[0]` 必须是第一段题干文本块。
- `options` 中每个选项都有 `label` 和 `text`。
- `answer` 始终是数组。
- `questionType` 只使用 `single_choice`、`multiple_choice`、`short_answer`；ESAT/TMUA 分段诊断卷固定为 `single_choice`。
- `contentBlocks` 中不得用一个长字符串塞多个自然段。
- 题干图片使用 `image_ref + image_id`，并能匹配 `images[].id`。
- 选项图片使用 `options[].image_id`，并能匹配 `images[].id`。
- `images` 中只保留必要展示字段，SVG 用 `svg`，PNG/JPG 用 `src`。
- 图像选项使用 `options[].image_id` 引用 `images[].id`，并保留 `text: ""`。
- 删除没有明确业务含义的试卷层冗余字段。
- 删除解析过程调试字段。
- 文件是严格 JSON，不含注释和尾逗号。
