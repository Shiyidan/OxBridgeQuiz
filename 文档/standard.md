# 题目解析 JSON 批注与标准范例

本文基于 `standard.json` 整理，目标是把当前带批注的解析结果沉淀为一份便于阅读、校验和后续导入的题目 JSON 标准说明。标准同时覆盖旧版扁平试卷、ESAT 三模块等效诊断卷与 TMUA 两卷诊断卷。

## 第一部分：当前 JSON 文档加批注

### 1. 当前文件状态

| 题号 | 示例用途 | 当前覆盖的问题 |
| --- | --- | --- |
| Q001 | 纯文本选择题 | 题干段落拆分、题型命名、冗余试卷字段 |
| Q004 | 题干中含 SVG 图 | 题干图文混排、图片引用、图片元数据精简 |
| Q012 | 选项中含 SVG 图 | 图像选项格式、题干配图、题型和知识点字段 |

### 2. 根结构

当前结构：

```json
{
  "metadata": {
    "paperName": "ENGAA 2023 Section 1",
    "year": 2023,
    "duration": 75,
    "examType": "ESAT",
    "paperType": "realPaper",
    "totalQuestions": 20
  },
  "questions": []
}
```

批注整理：

- 扁平试卷使用 `{ "metadata": {...}, "questions": [...] }`。
- ESAT/TMUA 分段诊断卷使用 `{ "metadata": {...}, "modules": [...] }`；ESAT 的 `modules` 表示科目模块，TMUA 的 `modules` 表示 Paper 1/2。兼容读取历史 `questions[].items`，但新文件不得继续生成该兼容格式。
- `metadata` 必须写在 `questions` 或 `modules` 前面，用于保存试卷级信息。
- 不使用纯数组作为标准根结构，统一根结构便于后续扩展。
- `questions` 中每一项代表一道题。

`metadata` 字段规则：

| 字段 | 含义 | 标准要求 |
| --- | --- | --- |
| `paperName` | 试卷名称 | 必须填写，例如 `ENGAA 2023 Section 1` |
| `year` | 年份 | 必须为数字，例如 `2023` |
| `duration` | 考试时长（分钟） | 必须为数字，例如 `75` |
| `examType` | 考试类型 | 必须使用系统考试类型，例如 `TMUA`、`ESAT` |
| `paperType` | 类型 | 必须为 `realPaper`、`mockPaper`、`aiPaper` 之一 |
| `totalQuestions` | 题目数量 | 扁平卷等于 `questions.length`；模块卷等于全部 `modules[].questions.length` 之和 |
| `deliveryMode` | 上传文档交付方式 | 模块卷写 `module_sequence`；扁平卷可省略或写 `continuous` |
| `breakPolicy` | 分段切换规则 | ESAT 写 `{ "durationSeconds": 180, "skippable": true }`；TMUA 写 `{ "durationSeconds": 0, "skippable": false }`；休息不计入 `duration` |
| `assemblyType` | 组卷来源 | ENGAA/NSAA 真题组合为 `legacy_equivalent`，原始整卷为 `original` |
| `sourceExamTypes` | 原始考试来源 | 等效卷推荐写 `['ENGAA', 'NSAA']`，最终仍以各题 `source_examType` 为准 |
| `remarks` | 诊断适用说明 | 可说明短卷可信度、题量或使用限制 |

`paperType` 枚举含义：

| 值 | 含义 |
| --- | --- |
| `realPaper` | 真题卷 |
| `mockPaper` | 模考卷 |
| `aiPaper` | AI 生成卷 |

`metadata` 保存试卷级信息；单题对象仍必须保留 `examType`、`year`、`source_examType`，用于题库独立检索和来源追踪。

### 2.1 ESAT 三模块等效诊断卷

模块表示一次连续作答阶段，不表示把三个科目的题目混合。学生按 `order` 依次完成三个模块；每个模块使用自己的题量与时长，前两个模块结束后休息 180 秒，休息可跳过，最后一个模块结束后统一交卷。

新组合卷的标准根结构如下。下例为结构示意，`questions` 中的 27 道完整题目已省略，因此不能直接作为上传文件：

```json
{
  "schemaVersion": "diagnostic-paper-v2",
  "code": "ESAT-EQUIV-2023-M1-PHY-M2",
  "metadata": {
    "paperName": "ESAT 2023 Equivalent Diagnostic — Mathematics 1 / Physics / Mathematics 2",
    "year": 2023,
    "duration": 120,
    "examType": "ESAT",
    "paperType": "realPaper",
    "totalQuestions": 81,
    "deliveryMode": "module_sequence",
    "breakPolicy": {
      "durationSeconds": 180,
      "skippable": true
    },
    "assemblyType": "legacy_equivalent",
    "sourceExamTypes": ["ENGAA", "NSAA"],
    "remarks": "使用历年真题组成的等效诊断卷，并非某位考生的官方 ESAT 原卷。"
  },
  "modules": [
    {
      "code": "maths1",
      "order": 1,
      "subject": "Mathematics 1",
      "subject_code": "110000",
      "duration": 40,
      "totalQuestions": 27,
      "questions": ["... 27 道完整题目 ..."]
    },
    {
      "code": "physics",
      "order": 2,
      "subject": "Physics",
      "subject_code": "130000",
      "duration": 40,
      "totalQuestions": 27,
      "questions": ["... 27 道完整题目 ..."]
    },
    {
      "code": "maths2",
      "order": 3,
      "subject": "Mathematics 2",
      "subject_code": "120000",
      "duration": 40,
      "totalQuestions": 27,
      "questions": ["... 27 道完整题目 ..."]
    }
  ]
}
```

根级 `code` 是整套试卷的稳定编码（入库为 `Paper.code`），用于套卷识别、报告编号和来源追踪，不是学科代码。具体学科必须读取 `modules[].code` / `modules[].subject_code`，不得从根级 `code` 的文本中推断。

模块字段规则：

| 字段 | 标准要求 |
| --- | --- |
| `code` | 稳定模块标识，只能为 `maths1`、`maths2`、`physics`、`chemistry`、`biology` |
| `order` | 作答顺序，必须为互不重复的正整数 |
| `subject` | 展示名称，不参与业务判断 |
| `subject_code` | 对应考纲学科编码：`maths1=110000`、`maths2=120000`、`physics=130000`、`chemistry=140000`、`biology=150000`；可使用字符串或数字，入库时统一为字符串 |
| `duration` | 当前模块作答分钟数，必须大于 0 |
| `totalQuestions` | 推荐填写并等于当前 `questions.length` |
| `questions` | 当前模块题目；题号可从 1 重新开始 |

ESAT 模块卷必须满足：

- 恰好三个不同模块，并且必须包含 `maths1`。
- `metadata.duration` 等于三个模块 `duration` 之和；两次休息不计入该值。
- `metadata.totalQuestions` 等于三个模块实际题量之和。
- 模块内 `number` 从 1 开始且不得重复。导入器会生成全卷连续数据库题号，并另存 `module_question_number`，因此前端仍展示原科目内题号。
- 每题继续保留其真实来源 `source_examType`（例如 `ENGAA` 或 `NSAA`）和来源稳定标识 `code`；`code` 在本卷内不得重复，同一道历史真题可以在不同等效卷复用相同来源标识。数据库全局唯一键由系统另行生成，不得把来源伪装成官方 ESAT 真题。
- 组合卷发布后如已有作答记录，不得覆盖题目或模块结构；需要调整时创建新版本，以保证历史报告可复现。
- 历史扁平 ESAT `realPaper` 仍可兼容导入为草稿，但不能发布为诊断测试；发布前必须转换为上述三模块结构。

### 2.2 TMUA 两卷诊断卷

TMUA 使用同一 `module_sequence` 容器承载两份独立计时试卷，但 `modules` 在该考试类型下表示 Paper，而不是学科。Paper 1 与 Paper 2 均为 20 道单项选择题、75 分钟；`metadata.duration` 为 150 分钟，卷间不设置休息倒计时，Paper 1 锁定后立即开始 Paper 2。

```json
{
  "schemaVersion": "diagnostic-paper-v2",
  "code": "TMUA-2023",
  "metadata": {
    "paperName": "TMUA 2023 Diagnostic Paper",
    "year": 2023,
    "duration": 150,
    "examType": "TMUA",
    "paperType": "realPaper",
    "totalQuestions": 40,
    "deliveryMode": "module_sequence",
    "breakPolicy": {
      "durationSeconds": 0,
      "skippable": false
    },
    "assemblyType": "original",
    "sourceExamTypes": ["TMUA"]
  },
  "modules": [
    {
      "code": "paper1",
      "order": 1,
      "subject": "Paper 1: Applications of Mathematical Knowledge",
      "subject_code": "TMUA-P1",
      "duration": 75,
      "totalQuestions": 20,
      "questions": ["... 20 道完整题目 ..."]
    },
    {
      "code": "paper2",
      "order": 2,
      "subject": "Paper 2: Mathematical Reasoning",
      "subject_code": "TMUA-P2",
      "duration": 75,
      "totalQuestions": 20,
      "questions": ["... 20 道完整题目 ..."]
    }
  ]
}
```

TMUA 分卷必须满足：

- `modules[].code` 依次且仅为 `paper1`、`paper2`，对应 `subject_code` 为 `TMUA-P1`、`TMUA-P2`。
- TMUA 的 `modules[].subject_code` 是分卷分组代码，不是数学考纲节点；每道题可继续填写自身真实考纲 `subject_code/topic_code/knowledge_points`，题目级值优先入库。
- 每卷 `duration = 75`、`totalQuestions = 20`；整卷 `duration = 150`、`totalQuestions = 40`。
- `breakPolicy.durationSeconds = 0` 且 `skippable = false`。零秒策略表示服务端直接切换下一卷，前端不得短暂展示休息弹窗。
- 两卷题号均从 1 开始；系统以 `module_code/module_order/module_question_number` 保存分卷归属，并生成数据库全卷连续题号。
- 每题 `question_type = single_choice`，`examType = TMUA`，并保留真实来源 `source_examType` 与来源稳定题号 `code`。
- Paper 1 结束后答案永久锁定，不能从 Paper 2 返回修改；刷新或重新进入必须恢复当前卷及其服务端截止时间。

### 3. 标题字段 `title`

`title` 必须取自 `content_blocks[0].text`，不得单独生成摘要标题或人工标题。

字段规则：

| 字段 | 标准要求 |
| --- | --- |
| `title` | 必须等于 `content_blocks[0].text` |
| `content_blocks[0]` | 必须是第一段题干文本块 |
| `content_blocks[0].type` | 必须为 `paragraph` |

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

| 字段 | 标准含义 |
| --- | --- |
| `type: "paragraph"` | 一个独立题干段落，含普通文本和 LaTeX |
| `type: "image_ref"` | 题干中的内嵌图片引用 |
| `text` | 段落文本，保留 LaTeX，如 `$R$`、`$4\\pi R^2$` |
| `image_id` | 当 `type` 为 `image_ref` 时，匹配 `images[].id` |

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

| 使用位置 | 引用方式 | 说明 |
| --- | --- | --- |
| 题干图形 | `content_blocks[].type = "image_ref"` + `content_blocks[].image_id` | `image_id` 必须匹配 `images[].id` |
| 选项图形 | `options[].image_id` | `image_id` 必须匹配 `images[].id` |

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

| 字段 | 是否必需 | 说明 |
| --- | --- | --- |
| `id` | 是 | 被 `content_blocks[].image_id` 或 `options[].image_id` 引用 |
| `type` | 是 | `svg` 或 `image` |
| `svg` | SVG 必需 | 当 `type` 为 `svg` 时，直接保存完整 SVG 字符串 |
| `src` | PNG/JPG 必需 | 当 `type` 为 `image` 时，保存图片地址或相对路径 |
| `alt` | 必需 | 图片备用描述，便于无障碍和人工审阅 |

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

| 值 | 含义 |
| --- | --- |
| `single_choice` | 单选题，`answer` 通常只有一个选项 |
| `multiple_choice` | 多选题，`answer` 允许包含多个选项 |
| `short_answer` | 简答题或填空题 |

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

## 第二部分：需要形成的 JSON 标准范例

下面是扁平卷的严格 JSON 范例；模块卷使用前述 `modules[].questions` 容器，单题结构完全相同。实际导入时必须满足：

- 不包含 `//` 注释。
- 不包含尾逗号。
- 使用 UTF-8。
- 根结构必须先写 `metadata`，再写 `questions` 或 `modules`。
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
      "answer": [
        "F"
      ],
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
          "correct_answer": [
            "F"
          ],
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

- 根结构必须是扁平 `{ "metadata": {...}, "questions": [...] }` 或模块化 `{ "metadata": {...}, "modules": [...] }`。
- `metadata` 必须写在题目或模块数组前面。
- `metadata.paperName` 必须是试卷名称。
- `metadata.year` 必须是数字年份。
- `metadata.duration` 必须是考试时长分钟数。
- `metadata.examType` 必须是系统考试类型。
- `metadata.paperType` 必须为 `realPaper`、`mockPaper`、`aiPaper` 之一。
- `metadata.totalQuestions` 必须等于扁平题目数或全部模块题目数之和。
- 扁平卷 `questions` 至少有一道题；模块卷必须恰好有三个非空 `modules`，且包含 `maths1`。
- 模块卷 `metadata.duration` 必须等于模块时长之和，`breakPolicy.durationSeconds` 必须为 180 且 `skippable` 为 `true`。
- 模块 `code` 必须稳定且不重复，`order` 和模块内 `number` 必须为不重复的正整数。
- 每题有 `number`、`title`、`options`。
- 每题必须保留 `examType`、`source_examType`、`year`。
- 每题的 `examType` 必须与 `metadata.examType` 一致。
- 每题的 `year` 必须与 `metadata.year` 一致。
- `title` 必须等于 `content_blocks[0].text`。
- `content_blocks[0]` 必须是第一段题干文本块。
- `options` 中每个选项都有 `label` 和 `text`。
- `answer` 始终是数组。
- `question_type` 只使用 `single_choice`、`multiple_choice`、`short_answer`。
- `content_blocks` 中不得用一个长字符串塞多个自然段。
- 题干图片使用 `image_ref + image_id`，并能匹配 `images[].id`。
- 选项图片使用 `options[].image_id`，并能匹配 `images[].id`。
- `images` 中只保留必要展示字段，SVG 用 `svg`，PNG/JPG 用 `src`。
- 图像选项使用 `options[].image_id` 引用 `images[].id`，并保留 `text: ""`。
- 删除没有明确业务含义的试卷层冗余字段。
- 删除解析过程调试字段。
- 文件是严格 JSON，不含注释和尾逗号。
