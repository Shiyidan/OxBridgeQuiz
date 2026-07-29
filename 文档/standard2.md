# 试题库单题导入标准（standard2）

本文规定试题库题目的正式导入结构。该结构参考现有真题题目中的题干、选项、图片、考纲分类和中文解析字段，但不沿用试卷、分卷、题号或固定顺序。

> 文档状态：正式确定版  
> 文档版本：V1.1  
> 确定日期：2026年7月28日  
> 当前实现：导入校验、批次追溯、独立题目入库以及 TMUA Part 映射均已启用。

## 1. 设计目标

试题库中的每道题都是独立业务对象，可以被单独导入、编辑、审核、发布、归档和删除，也可以按照考试类型、难度和考纲分类自由组卷。

必须遵守以下原则：

- 题目不隶属于任何真题试卷、模拟卷或 AI 试卷。
- metadata 只描述本次批量导入，不表示试卷，也不形成题目顺序。
- questions 数组只是批量传输容器，不形成试卷或批次内顺序。
- 每道题通过全局唯一且不可变的 code 标识。
- 导入顺序不是题目属性；练习题序在每次组卷时生成。
- 新导入题目统一进入 draft 状态，上传文件不能直接发布题目。
- 第一版题库练习只支持单选，因此 questionType 固定为 single_choice。
- 一份文件中任何一道题校验失败时，整份文件不得部分入库。

## 2. 根结构

根层级只允许 metadata 和 questions，层级关系如下：

    root
    ├─ metadata
    │  ├─ title
    │  ├─ questionCount
    │  └─ remarks（可选）
    └─ questions[]
       ├─ examType
       ├─ part（仅 TMUA 条件必需）
       └─ 其余完整单题字段

字段要求：

| 字段 | 是否必需 | 标准要求 |
| --- | --- | --- |
| metadata | 是 | 本次批量导入的标题、声明题量和可选备注 |
| questions | 是 | 非空数组；每一项都是可独立入库的完整题目 |

metadata 只允许以下字段：

| 字段 | 是否必需 | 类型 | 标准要求 |
| --- | --- | --- | --- |
| title | 是 | string | 本次导入批次的名称，不是试卷名称 |
| questionCount | 是 | integer | 正整数，必须严格等于 questions.length |
| remarks | 否 | string | 记录生成范围、覆盖知识点或人工审核备注 |

metadata 的业务边界：

- metadata 只用于导入校验、导入历史和后台追溯。
- metadata 中的字段不得被复制为题目的内容属性。
- metadata 不决定题目的考试类型、难度、考纲分类、状态或组卷顺序。
- 每道题仍须完整保存自己的 examType、difficulty 和 classification。
- 一个批次中的题目导入后可以分别编辑、发布、归档和删除。
- 删除或修改批次备注不得影响已经入库的题目。
- 禁止在 metadata 中出现 paperType、accessTier、duration、totalQuestions、sections、modules 或固定题序。

禁止在根层级出现 sections、modules、paper、duration、totalQuestions 或其他试卷字段。

## 3. 完整标准示例

    {
      "metadata": {
        "title": "ESAT Physics 电学专项题目",
        "questionCount": 1,
        "remarks": "基于 ESAT Physics 考纲生成的电路单选题。"
      },
      "questions": [
        {
          "code": "QB-ESAT-PHYSICS-000001",
          "examType": "ESAT",
          "title": "A circuit is set up as shown. What is the current through the resistor?",
          "contentBlocks": [
            {
              "type": "paragraph",
              "text": "A circuit is set up as shown."
            },
            {
              "type": "image_ref",
              "image_id": "circuit_001",
              "alt": "A battery connected to a resistor."
            },
            {
              "type": "paragraph",
              "text": "What is the current through the resistor?"
            }
          ],
          "options": [
            {
              "label": "A",
              "text": "$0.5\\,\\mathrm{A}$"
            },
            {
              "label": "B",
              "text": "$1.0\\,\\mathrm{A}$"
            },
            {
              "label": "C",
              "text": "$2.0\\,\\mathrm{A}$"
            },
            {
              "label": "D",
              "text": "$4.0\\,\\mathrm{A}$"
            }
          ],
          "answer": ["C"],
          "images": [
            {
              "id": "circuit_001",
              "type": "svg",
              "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 360 190\">...</svg>",
              "alt": "A battery connected to a resistor."
            }
          ],
          "questionType": "single_choice",
          "difficulty": "medium",
          "qualityTier": "qualified",
          "classification": {
            "subject": "Physics (物理)",
            "subjectCode": "130000",
            "topic": "Electricity (电学)",
            "topicCode": "130100",
            "knowledgePoints": [
              {
                "code": "130102",
                "label": "Electric circuits (电路)",
                "role": "primary"
              }
            ]
          },
          "learningAnalysis": {
            "correctSolution": "根据欧姆定律 $I=\\frac{V}{R}$，代入题目数据即可得到正确答案。",
            "examFocus": "考查欧姆定律及电路电流计算。",
            "commonErrorCauses": [
              "混淆电流、电压和电阻之间的关系。",
              "代入数据时忽略单位换算。"
            ],
            "reviewGuidance": "复习欧姆定律，并练习电流、电压和电阻的相互换算。"
          },
          "origin": {
            "type": "adapted",
            "referenceExamType": "ENGAA",
            "referenceYear": 2023,
            "referenceQuestionCode": "ENGAA-2023-S1-Q004"
          }
        }
      ]
    }

## 4. 单题字段总表

| 字段 | 是否必需 | 类型 | 标准要求 |
| --- | --- | --- | --- |
| code | 是 | string | 题库全局唯一且不可变的业务代码 |
| examType | 是 | string | TMUA、ESAT 或 STEP |
| part | 条件必需 | string | TMUA 题目必须为 part1 或 part2；ESAT、STEP 不填写 |
| title | 是 | string | 与 contentBlocks 中第一段题干文字保持一致 |
| contentBlocks | 是 | array | 按真实阅读顺序保存题干段落和图片引用 |
| options | 是 | array | 当前必须提供至少两个单选选项 |
| answer | 是 | string[] | 当前必须且只能包含一个正确选项标签 |
| images | 是 | array | 无图片时使用空数组 |
| questionType | 是 | string | 当前正式标准固定为 single_choice |
| difficulty | 是 | string | easy、medium、hard 或 composite |
| qualityTier | 否 | string | 题目生成质量等级，仅允许 qualified 或 excellent |
| classification | 是 | object | 学科、主题和考纲知识点 |
| learningAnalysis | 是 | object | 面向学生展示的中文解析 |
| origin | 否 | object | 人工、AI 原创或真题变式来源 |

除上述字段外，单题对象不得添加未经本标准定义的字段。

## 5. 题目代码 code

code 是题目的稳定业务标识，不是数据库主键，也不是题号。

推荐格式：

    QB-<考试>-<学科或主题>-<六位序号>

示例：

    QB-ESAT-PHYSICS-000001
    QB-ESAT-MATHS1-000126
    QB-TMUA-ALGEBRA-000052

校验要求：

- 只能使用大写英文字母、数字和连字符。
- 在整个试题库中全局唯一，而不是只在单次导入文件中唯一。
- 导入成功后不得修改。
- 重复 code 必须使整批导入失败，不能自动覆盖已有题目。
- 数据库 id、创建时间和更新时间由系统生成，不写入上传文件。

## 6. 考试类型 examType

允许值：

| 值 | 含义 |
| --- | --- |
| ESAT | ESAT 题库 |
| TMUA | TMUA 题库 |
| STEP | STEP 题库 |

examType 是单题固有属性，不再从外层试卷 metadata 继承。

不得使用 ENGAA、NSAA 等来源考试作为 examType。历史来源只允许写入可选的 origin。

### 6.1 TMUA 所属 Part

TMUA 每道独立题目必须声明所属 Part：

    "examType": "TMUA",
    "part": "part1"

允许值：

| 值 | 后台展示 | 数据库存储 |
| --- | --- | --- |
| part1 | Part 1 | Question.moduleCode = paper1 |
| part2 | Part 2 | Question.moduleCode = paper2 |

约束规则：

- examType 为 TMUA 时 part 必填。
- examType 为 ESAT 或 STEP 时不得填写 part。
- part 是单题分类，不形成固定试卷、题序或 sections 结构。
- 后台文件列表使用同一列“科目 / 所属 Part”：ESAT 展示科目，TMUA 展示 Part 1 / Part 2。

## 7. 题干 title 与 contentBlocks

### 7.1 title

title 是列表、搜索和兼容展示字段，必须满足：

- title 必须是非空字符串。
- title 必须与 contentBlocks 中第一个 paragraph 的 text 一致。
- 不得将 title 写成人工摘要、中文翻译或管理备注。
- 题干中的数学表达式使用 Markdown + LaTeX。

### 7.2 contentBlocks

contentBlocks 保存题目原始阅读顺序。当前允许两类内容块。

普通段落：

    {
      "type": "paragraph",
      "text": "The switch is now closed."
    }

居中独立公式：

    {
      "type": "paragraph",
      "text": "$$5x^2+2xy=4$$",
      "align": "center"
    }

题干图片引用：

    {
      "type": "image_ref",
      "image_id": "diagram_001",
      "alt": "A triangle labelled A, B and C."
    }

校验要求：

- contentBlocks 必须为非空数组。
- 第一项必须为非空 paragraph。
- 每个自然段单独使用一个 paragraph，不得依赖一个长字符串中的连续空行承担排版。
- paragraph.align 仅允许 center；未填写时按普通正文展示。
- image_ref.image_id 必须匹配同题 images 中的唯一 id。
- 题干中的英文原文、变量、单位、上下标和公式不得改写或丢失。

## 8. 选项 options

普通文字或公式选项：

    {
      "label": "A",
      "text": "$R=5r$"
    }

图像选项：

    {
      "label": "A",
      "text": "",
      "image_id": "option_a"
    }

校验要求：

- options 必须为非空数组，当前至少包含两个选项。
- 每个选项必须包含非空且唯一的 label。
- 每个选项必须包含 text；图像选项也必须保留 text 为空字符串。
- 普通选项的 text 不得为空。
- 图像选项通过 image_id 引用 images，不能直接保存 SVG 或图片路径。
- label 建议使用 A、B、C、D 等大写字母。
- 当前正式标准不支持同一道题混用单选和多选交互。

## 9. 正确答案 answer

标准格式：

    "answer": ["C"]

校验要求：

- answer 必须始终为数组。
- 当前正式标准中必须且只能包含一个值。
- answer 中的值必须匹配某个 options[].label。
- 不得在 answer 中填写选项正文、序号或解释。
- 学生作答接口不得在交卷前返回 answer。

## 10. 图片资源 images

images 是单道题内所有题干图片和选项图片的唯一资源池。无图片时必须使用空数组。

SVG：

    {
      "id": "diagram_001",
      "type": "svg",
      "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 320 180\">...</svg>",
      "alt": "A coordinate graph showing a straight line."
    }

PNG 或 JPG：

    {
      "id": "diagram_001",
      "type": "image",
      "src": "images/diagram_001.png",
      "alt": "A coordinate graph showing a straight line."
    }

字段要求：

| 字段 | 是否必需 | 标准要求 |
| --- | --- | --- |
| id | 是 | 同一道题内唯一，被题干或选项引用 |
| type | 是 | svg 或 image |
| svg | 条件必需 | type 为 svg 时提供完整 SVG |
| src | 条件必需 | type 为 image 时提供稳定的站内相对路径或受控 HTTPS 地址 |
| alt | 是 | 简洁、准确的英文替代说明 |

其他规则：

- SVG 必须包含明确的 viewBox。
- src 不得使用本机绝对路径、临时 blob 地址或 HTML/data:SVG。
- 同一资源只在 images 中保存一次。
- 替换 SVG 或位图时保持 id 不变，题干和选项引用不需要修改。
- 最终入库结构不得包含 restore_method、visual_plan、confidence、quality 等调试字段。
- 当前稳定结构不保存 semantic 或 graph_schema；如未来需要图形语义检索，应另行升级 schema。

## 11. 题型 questionType

当前正式标准固定为：

    "questionType": "single_choice"

原因：

- 当前题库练习页每道题只保存一个选项标签。
- 当前 AnswerRecord.selectedAnswer 是单个字符串。
- multiple_choice、short_answer 和 numeric 需要新的作答、判分和进度保存协议，不能仅通过增加枚举提前开放。

未来支持新题型时必须先修订本文档版本，并同步修改前端交互、后端校验、判分和答题记录结构。

## 12. 难度 difficulty

允许值：

| 值 | 判断标准 |
| --- | --- |
| easy | 基础知识或直接公式应用 |
| medium | 多步推导或基础公式的灵活变形 |
| hard | 复杂场景转换、生僻考点或较高认知负荷 |
| composite | 多个知识点或多种能力连续结合 |

difficulty 必须是单个字符串，不得使用数字分数、对象、中文标签或 unknown。

### 12.1 生成质量等级 qualityTier

`qualityTier` 是题目生成或审核流程给出的可选质量标记，允许值：

| 值 | 含义 |
| --- | --- |
| qualified | 已达到当前题库的基础质量要求 |
| excellent | 已达到更高质量要求 |

导入时会校验并将该字段原样保存到题目 `meta` JSON 中。当前版本不使用它进行后台展示、学生端展示、筛选、排序、发布或组卷；缺少该字段的既有文件仍可正常导入。

## 13. 考纲分类 classification

标准结构：

    {
      "subject": "Physics (物理)",
      "subjectCode": "130000",
      "topic": "Electricity (电学)",
      "topicCode": "130100",
      "knowledgePoints": [
        {
          "code": "130102",
          "label": "Electric circuits (电路)",
          "role": "primary"
        }
      ]
    }

字段要求：

| 字段 | 是否必需 | 标准要求 |
| --- | --- | --- |
| subject | 是 | 对应当前考试考纲中的学科名称 |
| subjectCode | 是 | 对应学科节点 code |
| topic | 是 | 对应主题节点 label |
| topicCode | 是 | 对应主题节点 code |
| knowledgePoints | 是 | 非空叶子知识点数组 |

knowledgePoints 每一项必须包含：

| 字段 | 标准要求 |
| --- | --- |
| code | 必须存在于 examType 对应的有效考纲中 |
| label | 必须与该 code 的考纲 label 一致 |
| role | primary 或 secondary |

其他规则：

- 每道题至少包含一个 primary 知识点。
- 可以包含多个 secondary 知识点。
- 不得自由发明考纲中不存在的 code。
- label 中不得重复拼接 code。
- 不得在知识点中写入 confidence 或模型判断说明。

## 14. 中文解析 learningAnalysis

标准结构：

    {
      "correctSolution": "根据欧姆定律 $I=\\frac{V}{R}$ 计算可得正确答案。",
      "examFocus": "考查欧姆定律及电路电流计算。",
      "commonErrorCauses": [
        "混淆电流、电压和电阻之间的关系。",
        "代入数据时忽略单位换算。"
      ],
      "reviewGuidance": "复习欧姆定律，并练习单位换算。"
    }

字段要求：

| 字段 | 是否必需 | 标准要求 |
| --- | --- | --- |
| correctSolution | 是 | 完整、可直接展示的中文正确解析 |
| examFocus | 是 | 简洁说明本题考查内容 |
| commonErrorCauses | 是 | 中文字符串数组，至少一项 |
| reviewGuidance | 是 | 针对本题知识点给出复习建议 |

其他规则：

- 学生可见解析必须使用正常中文。
- 公式继续使用 Markdown + LaTeX。
- 解析必须与 answer 一致。
- 不得输出思维链、模型过程、置信度或内部提示词。
- 不得出现问号占位、乱码、控制字符或未替换模板。
- commonErrorCauses 描述常见错误原因，不填写某位用户的真实诊断结果。

## 15. 可选来源 origin

origin 用于记录题目的业务来源，不表示题目属于某份试卷。

### 15.1 人工原创

    {
      "type": "manual"
    }

### 15.2 AI 原创

    {
      "type": "ai_generated"
    }

### 15.3 真题变式

    {
      "type": "adapted",
      "referenceExamType": "ENGAA",
      "referenceYear": 2023,
      "referenceQuestionCode": "ENGAA-2023-S1-Q004"
    }

允许的 type：

| 值 | 含义 |
| --- | --- |
| manual | 人工原创 |
| ai_generated | 没有绑定特定原题的 AI 原创 |
| adapted | 基于明确原题制作的变式题 |

校验要求：

- origin 整体可省略。
- type 为 adapted 时，三个 reference 字段必须全部填写。
- type 为 manual 或 ai_generated 时，不得填写无依据的 reference 字段。
- referenceQuestionCode 只负责关联稳定原题代码，不产生试卷归属或固定题序。
- 不得保存模型名称、提示词、token 用量、生成时间或置信度。

## 16. 不属于导入文件的系统字段

以下字段由数据库、后台操作或组卷过程维护，不得写入上传文件：

- id
- uniqueCode
- status
- createdAt
- updatedAt
- publishedAt
- archivedAt
- paperId
- number
- position
- selectedAnswer
- answerState
- isCorrect
- answeredAt
- durationSeconds

新导入题目由服务端自动设置为 draft。题目的 published 或 archived 状态只能通过后台审核操作修改。

## 17. 明确禁止的试卷字段

题库题目不使用以下真题结构。根层 metadata 是导入批次信息，不属于下列试卷结构：

- sections
- modules
- paperName
- paperCode
- paperType
- accessTier
- assemblyType
- deliveryMode
- breakPolicy
- duration
- totalQuestions
- year
- sectionCode
- sectionType
- sectionLabel
- moduleCode
- moduleOrder
- moduleQuestionNumber
- questionNumber

题库内容也不得包含解析过程字段：

- extraction
- rendering
- sourcePdf
- answerSource
- knowledgeMapping
- confidence
- quality
- validationNotes
- skillVersion
- modelName
- promptVersion

## 18. 导入事务和重复处理规则

正式导入实现必须遵守：

1. 先完成整个文件的 JSON 解析和结构校验。
2. 校验 metadata.title 非空、metadata.questionCount 为正整数。
3. 校验 metadata.questionCount 严格等于 questions.length。
4. 校验所有 code 在文件内无重复。
5. 校验所有 code 在数据库中无重复。
6. 校验考试类型、题型、难度和考纲 code。
7. 校验题干、选项、答案和图片引用完整。
8. 校验中文解析不为空且无乱码。
9. 所有题目校验通过后，在单个数据库事务中创建导入批次、题目和知识点关联。
10. 任意一步失败时回滚整个导入，不保留部分成功数据。

重复 code 的默认处理是拒绝整批导入，不执行自动更新或覆盖。

已有答题记录的题目不得覆盖题干、选项、答案、图片、考试类型或考纲分类。如需修改影响判分和展示的内容，应创建新的 code。

## 19. JSON 与 JSON-in-Markdown

推荐直接上传严格 JSON 文件。文件必须使用 UTF-8，不得包含注释、尾逗号或非 JSON 值。

如需要使用 Markdown 作为人工审核容器，只读取第一个 fenced json 代码块。推荐格式：

    ---
    content_type: question_bank_questions
    ---

    ~~~json
    {
      "metadata": {
        "title": "ESAT Algebra 示例题目",
        "questionCount": 1,
        "remarks": "用于展示 JSON-in-Markdown 容器。"
      },
      "questions": [
        {
          "code": "QB-ESAT-MATHS1-000001",
          "examType": "ESAT",
          "title": "If $x+3=7$, what is the value of $x$?",
          "contentBlocks": [
            {
              "type": "paragraph",
              "text": "If $x+3=7$, what is the value of $x$?"
            }
          ],
          "options": [
            {
              "label": "A",
              "text": "$3$"
            },
            {
              "label": "B",
              "text": "$4$"
            }
          ],
          "answer": ["B"],
          "images": [],
          "questionType": "single_choice",
          "difficulty": "easy",
          "classification": {
            "subject": "Mathematics 1",
            "subjectCode": "110000",
            "topic": "Algebra (代数)",
            "topicCode": "112000",
            "knowledgePoints": [
              {
                "code": "112001",
                "label": "Linear equations (一元一次方程)",
                "role": "primary"
              }
            ]
          },
          "learningAnalysis": {
            "correctSolution": "等式两边同时减去 $3$，得到 $x=4$。",
            "examFocus": "考查一元一次方程求解。",
            "commonErrorCauses": [
              "移项时没有正确处理运算关系。"
            ],
            "reviewGuidance": "复习等式两边执行相同运算的原则。"
          }
        }
      ]
    }
    ~~~

frontmatter 和 JSON 代码块之外的正文不参与入库，不得从自然语言 Markdown 反推题目结构。

## 20. 与真题 standard.md 的区别

| 真题 standard.md | 试题库 standard2.md |
| --- | --- |
| 根层为试卷 metadata + sections | 根层为导入批次 metadata + questions |
| 题目属于固定试卷和分卷 | 每道题独立存在 |
| number 是试卷内固定题号 | 不导入 number |
| section 决定题目模块和顺序 | 不保存 section 或顺序 |
| 试卷统一发布或下架 | 单题独立发布或归档 |
| 题序由试卷结构决定 | 题序在每次练习组卷时生成 |
| source 保存试卷与分卷来源 | origin 只保存可选的稳定来源引用 |
| Paper 是内容容器 | Question 是题库内容主体 |

## 21. 最终检查清单

导入前必须逐项确认：

- 根层只有 metadata 和 questions。
- metadata 只包含 title、questionCount 和可选 remarks。
- metadata.title 是批次标题，不是试卷名称。
- metadata.questionCount 严格等于 questions.length。
- questions 是非空数组。
- 每道题 code 全局唯一。
- 每道题 examType 合法。
- 每道题不包含 number、paperId 或其他试卷字段。
- title 与第一个 paragraph 的 text 一致。
- contentBlocks 按阅读顺序拆分自然段和图片引用。
- options 的 label 唯一且 text 字段存在。
- answer 只有一个值，并能匹配选项 label。
- images 中的 id 唯一，所有引用都能找到资源。
- questionType 等于 single_choice。
- difficulty 为四个允许值之一。
- qualityTier 如存在，只能为 qualified 或 excellent。
- classification 中的 code 和 label 与有效考纲一致。
- knowledgePoints 至少包含一个 primary。
- learningAnalysis 四个字段完整且解析与答案一致。
- origin 如为 adapted，三个 reference 字段完整。
- 文件不包含试卷结构、系统状态或调试字段。
- 文件是严格 UTF-8 JSON。

## 22. 入库映射与检索约束

上传 JSON 的可读结构与数据库的高效检索结构必须分离。不得因为 classification 在上传文件中是嵌套对象，就把所有检索条件只保存为不可索引的 JSON。

### 22.1 导入批次

metadata 与上传上下文应独立保存为导入批次记录，建议包含：

    QuestionImportBatch
    ├─ id
    ├─ title
    ├─ fileName
    ├─ declaredQuestionCount
    ├─ actualQuestionCount
    ├─ remarks
    └─ createdAt

其中 `fileName` 来自管理员实际选择的上传文件名，不是 JSON `metadata` 的新增字段；JSON 内的 metadata 仍只允许 `title`、`questionCount` 和可选的 `remarks`。

导入批次用于后台按“上传包”归类、查看和追溯。后台试题库入口应先展示上传包列表，再进入上传包查看其中的独立题目；题目可以保留可选的 importBatchId。学生端检索、筛选和组卷不得依赖导入批次，也不得把批次当成 Paper。

### 22.2 题目检索字段

下列高频筛选字段必须保存为 Question 的普通数据库字段：

- code
- examType
- status
- questionType
- difficulty
- moduleCode（由 TMUA part 入库映射，上传文件不直接填写）
- subjectCode
- topicCode

题干、选项、答案、图片和中文解析可以继续使用适合其结构的字段保存，但不得为了读取筛选条件而先加载完整题目内容。

建议至少建立以下组合索引：

    Question(status, examType, difficulty)
    Question(status, examType, subjectCode)
    Question(status, examType, topicCode)

### 22.3 题目与知识点关联

classification.knowledgePoints 在导入时必须展开为独立的多对多关联记录：

    QuestionKnowledgePoint
    ├─ questionId
    ├─ syllabusNodeId
    └─ role

建议建立：

    QuestionKnowledgePoint(syllabusNodeId, questionId)
    QuestionKnowledgePoint(questionId, syllabusNodeId)

导入时根据 examType 和 knowledgePoints[].code 解析对应的 SyllabusNode，并保存 syllabusNodeId。这样可以避免不同考试使用相同 code 时发生歧义，并通过外键保证知识点真实存在。

knowledgePoints 的 JSON 可以作为展示快照保留，但题目筛选、数量统计和组卷必须以关联表为查询依据，避免在 Node.js 内存中逐题解析 JSON。

### 22.4 筛选和组卷

后端必须在数据库中完成以下操作：

- 按已发布状态过滤。
- 按 examType、difficulty、subjectCode 和 topicCode 过滤。
- 按考纲知识点及其子孙节点过滤。
- 统计符合条件的题目数量和难度分布。
- 按本次请求题量限量返回候选题。

不得先读取某考试类型下全部已发布题目，再在 Node.js 中循环筛选。题目顺序只在创建本次练习时生成，并写入 AnswerRecord.position。

## 23. 代码实现边界

依据本文进行的后续代码改造应至少包括：

- Question 支持不依赖 Paper 独立存在。
- 题库题目具有单题级 draft、published 和 archived 状态。
- number 不再作为题库题目的固有属性。
- 新增 standard2 专用校验器和导入接口。
- 新增导入批次记录，并校验 metadata.questionCount。
- 新增题目与考纲知识点关联表及对应索引。
- 后台试题库入口按导入上传包分页展示，上传包详情内再按单题分页管理。
- 学生端只查询已发布的独立题库题目。
- 开始练习时重新校验题目状态、考试类型和题目范围。
- 题目检索、统计和限量必须在数据库中完成。
- 组卷顺序只保存在本次练习的 AnswerRecord.position。
- 系统练习占位记录 question-bank 不出现在后台题库内容列表中。

上述边界已于 2026 年 7 月 28 日完成首版实现；后续若扩展题型、字段或导入行为，必须先修订本标准再修改代码。
