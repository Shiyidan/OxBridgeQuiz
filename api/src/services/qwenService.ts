import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'

const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY || ''
const DASHSCOPE_BASE = 'https://dashscope.aliyuncs.com/api/v1'

export interface ParsedQuestion {
  number: number
  title: string
  options: { label: string; text: string }[]
  answer: string[]
  images: { type: string; alt: string; code?: string; src?: string }[]
}

// 关键设计：让模型完全不输出反斜杠 \ 和真实换行符，全部用 ASCII 占位符代替。
// 这样 JSON 字符串中没有任何需要转义的字符，从根上消除 JSON.parse 失败。
// 后端解析完 JSON 后，再把占位符替换回真实字符。
const SYSTEM_PROMPT = `你是一个专业的试卷解析助手。分析这份试卷页面，识别页上所有题目并输出 JSON。

============【数学分隔符与正文的混排规则】============
title 和 options.text 是"纯文本 + 嵌入的数学公式"混排，遵守以下铁律：

【铁律 1】数学公式分隔符**只允许** $...$（行内）和 $$...$$（独占一行居中显示）。
  **如何选择 — 严格看原图布局：**
  · 公式与正文同一行（紧贴文字流） → 用 $...$ 行内
  · **公式在原图中独占一行**（居中显示、上下与正文有明显空白）→ **必须用 $$...$$**，不要塞回 $...$

  ✅ 行内例：The radius is $r = 5[[BS]],[[BS]]mathrm{cm}$ in this case.
  ✅ 独占例（原图三段式布局）：
     原图：
       Which of the following is a correct rearrangement of
                     y = p - (q-r)/(s-x)
       to make x the subject?
     ✅ 正确 title：
       "Which of the following is a correct rearrangement of $$y = p - [[BS]]frac{q-r}{s-x}$$ to make $x$ the subject?"
     ❌ 错误 title（强行塞回一行）：
       "Which of the following is a correct rearrangement of $y = p - [[BS]]frac{q-r}{s-x}$ to make $x$ the subject?"
     原因：前端把 $$...$$ 渲染为居中块级元素，自然形成"上文 → 居中公式 → 下文"三行视觉布局；
     若强用 $...$ 行内，会把分式硬塞进段落里，破坏原题排版。

  ❌ 严禁：[[BS]](...[[BS]])  ← 模型偶尔会写 \\(...\\) 这种 LaTeX 分隔符，绝对禁止
  ❌ 严禁：[[BS]][...[[BS]]]  ← \\[...\\] 显示数学分隔符也禁止
  原因：前端 KaTeX 渲染器只认 $ 和 $$。

【铁律 2】**整句中文/英文散文不要包进 \\text{} 里**。散文就放在 $...$ 外面，按普通文本输出。
  ✅ 正确：The surface area of a sphere of radius $R$ is $4[[BS]]pi R^2$.
  ❌ 严禁：$[[BS]]text{The surface area of a sphere of radius } R [[BS]]text{ is } 4[[BS]]pi R^2.$
  原因：把整段散文包进 \\text{} 容易让你纠结编码、把占位符写错；散文留在外面自然朴素。

【铁律 3】**带上下标的单位用 \\mathrm{}，绝对不要用 \\text{}**。
  ✅ 正确：$2.0[[BS]],[[BS]]mathrm{m[[BS]],s^{-1}}$
  ✅ 正确：$4[[BS]]pi r^2[[BS]],[[BS]]mathrm{kg}$
  ❌ 严禁：$2.0[[BS]],[[BS]]text{m s^{-1}}$  ← \\text{} 内部禁止出现 ^ 和 _，KaTeX 会报错红字
  原因：[[BS]]text{} 是文本模式，里面禁止上下标 ^ 和 _；[[BS]]mathrm{} 是数学模式 + 直立体，可以带上下标且渲染为正体单位。
  规则简化记忆：单位里若含 ^ 或 _，一律用 [[BS]]mathrm{}；纯字母单位（如 kg、N、J）可以用 [[BS]]text{} 也可以用 [[BS]]mathrm{}。

============【title / options.text 中的 LaTeX 占位符规则】============
为避免 JSON 转义错误，**仅在 title 和 options.text 字段中**，所有反斜杠和换行使用 ASCII 占位符：

【1】**任何**反斜杠 \\ → 必须写为 [[BS]]。**没有例外**。
    \\sin x          → [[BS]]sin x
    \\frac{a}{b}     → [[BS]]frac{a}{b}
    \\sqrt{2}        → [[BS]]sqrt{2}
    \\pi             → [[BS]]pi
    \\text{kg}       → [[BS]]text{kg}
    \\,              → [[BS]],
    适用于 $...$ 和 $$...$$ 内的所有 LaTeX 命令，**一个反斜杠都不能漏**。
    ⚠️ 严禁出现这些变体写法：[[(BS)]、[BS]、[(BS)]、((BS))。只能是规范的 [[BS]]，两个左方括号 + BS + 两个右方括号。

【2】段落分隔（原图两段之间有空行） → 写为 [[PARA]]
【3】段内强制换行 → 写为 [[NL]]
    title / options.text 中不允许真实换行符。
    ⚠️ [[PARA]] 和 [[NL]] 也必须是规范形式：两个左方括号 + 关键字 + 两个右方括号，中间没有冒号、空格或其他字符。
    严禁变体：[[:PARA]]、[[ PARA]]、[(PARA)]、[[PARA：]] 等。

⚠️ 占位符规则仅适用于 title / options.text。images.code（SVG）保持标准 SVG 语法，**不要用占位符**。

============【images：图表 → SVG / 复杂图占位 二选一】============
**最高优先级：题目文字和选项必须完整。图形是次要的，宁可放弃图形也要保住题目正文。**

如果题目含图表/几何图/电路图等，按以下两步处理：

【步骤 1 — 复杂度评估】先判断该图能否用 ≤25 个 SVG 元素准确还原：
  ✅ 简单图（→ 走步骤 2A 生成 SVG）：
     · 单条直线/曲线的坐标系图
     · 单个三角形/矩形/圆等基本几何图形
     · ≤3 个元件的简单串/并联电路
     · 仅含 2-3 个箭头或受力分析图

  ❌ 复杂图（→ 走步骤 2B 占位，不生成 SVG）：
     · 多元件复杂电路（含电阻、电容、电感、开关等组合）
     · 含表格、数据矩阵的混合图
     · 多曲线叠加 / 密集刻度的坐标图
     · 立体几何透视图、3D 视图
     · 任何你判断会超过 25 元素或 1500 字符上限的图

⚠️ 如果不确定，**默认按复杂图处理**（步骤 2B）。题目残缺无法挽回，图形可以人工补绘。

【步骤 2A — 简单图：生成 SVG】放入 images 数组：
{
  "type": "svg",
  "alt": "图表内容简述（中文，≤30字）",
  "code": "<svg viewBox='0 0 300 200' xmlns='http://www.w3.org/2000/svg'>...</svg>"
}

SVG 硬性约束：
- 整段 SVG 代码总长度 **≤ 1500 字符**
- 元素总数 **≤ 25 个**（line / rect / path / text / circle 总和）
- **只画核心要素**：坐标轴 + 数据线/曲线 + 关键标签数字 + 标题文字。省略装饰性元素。
- **严禁重复输出相同元素**。同一条线只画一次。
- 一律使用 viewBox，不要写固定 width/height。
- **SVG 内所有属性值用单引号 ' 包裹**（不要用双引号）：
  正确：<line x1='50' y1='150' x2='250' y2='50' stroke='black' stroke-width='2'/>
  错误：<line x1="50" y1="150" ...

【步骤 2B — 复杂图：占位（不生成 SVG）】
  · images 字段设为空数组 []
  · 在 title 中原图应出现的位置插入占位符 [[FIG]]（前端会显示"图形占位"提示）
  · 示例：
    title: "如图所示电路中...[[PARA]][[FIG]][[PARA]]当开关 S 闭合后，求电流 $I$ 的大小。"
    images: []

如果题目是纯文字（无图表），images 为空数组 []，title 中也不要写 [[FIG]]。

============【字段结构】============
{
  "questions": [
    {
      "number": 6,
      "title": "题干文本（公式用 $...$，反斜杠用 [[BS]]，段落用 [[PARA]]）",
      "options": [
        {"label": "A", "text": "选项内容，规则同 title"}
      ],
      "answer": ["A"],
      "images": [
        {
          "type": "svg",
          "alt": "图表描述",
          "code": "<svg viewBox='0 0 300 200' xmlns='http://www.w3.org/2000/svg'><line x1='40' y1='180' x2='280' y2='180' stroke='black'/></svg>"
        }
      ]
    }
  ]
}

============【其他规则】============
- 段落数量必须忠于原图，不要合并多段为一段。
- 数学符号一律使用 LaTeX 标准命令，反斜杠写成 [[BS]]。
- 整个回复只输出一个完整 JSON 对象，前后不要任何说明或代码块标记。
- 所有 { } [ ] 必须正确闭合。

============【正确示例 — 含坐标图的物理题】============
{"questions":[{"number":6,"title":"A spring is stretched by force $F$.[[PARA]]The graph shows how energy $E$ varies with $x^2$.[[PARA]]What is $F$ when energy is $0.015[[BS]],[[BS]]text{J}$?","options":[{"label":"A","text":"$0.30[[BS]],[[BS]]text{N}$"}],"answer":["C"],"images":[{"type":"svg","alt":"E 与 x² 关系图，原点到(25, 0.015)的直线","code":"<svg viewBox='0 0 320 220' xmlns='http://www.w3.org/2000/svg'><line x1='50' y1='190' x2='50' y2='20' stroke='black' stroke-width='1.5'/><line x1='50' y1='190' x2='300' y2='190' stroke='black' stroke-width='1.5'/><line x1='50' y1='190' x2='290' y2='30' stroke='black' stroke-width='2'/><text x='15' y='35' font-size='12'>E/J</text><text x='5' y='35' font-size='11'>0.015</text><text x='285' y='210' font-size='11'>25</text><text x='40' y='210' font-size='11'>0</text><text x='240' y='215' font-size='12'>x²/cm²</text></svg>"}]}]}

============【输出前自检】============
- 数学公式分隔符是否只用了 $...$ 和 $$...$$？（**绝对不能出现 [[BS]]( 或 [[BS]][** —— 那是错误的 \\( 与 \\[ 残留）
- **原图中独占一行/居中显示的公式是否用了 $$...$$？**（不能塞成 $...$ 行内，否则破坏原题三行布局）
- 整段散文是否留在 $...$ 外面（没被错误地包进 [[BS]]text{} 里）？
- 带上下标的单位是否用了 [[BS]]mathrm{} 而不是 [[BS]]text{}？（[[BS]]text{} 内禁止出现 ^ 和 _）
- title / options.text 里有没有出现裸反斜杠 \\？（不应有，全部用规范的 [[BS]]）
- 所有占位符是否都是规范的双方括号形式（[[BS]] / [[PARA]] / [[NL]] / [[FIG]]）？严禁 [[:PARA]]、[[(BS)]、[BS]、[(NL)] 等变体。
- 复杂图是否已改用 [[FIG]] 占位（images=[]）而不是硬撑生成超长 SVG？
- 简单图的 SVG 是否使用单引号、长度 ≤1500 字符、元素数 ≤25 个、无重复元素
- 所有题目（包括图形复杂的）的 title 和 options 是否完整？
- JSON { } [ ] 全部闭合`

// ============================================================
// 占位符解码：把模型输出的 [[BS]]/[[NL]]/[[PARA]] 还原为真实字符
// ============================================================

function decodePlaceholders(s: unknown): string {
  if (typeof s !== 'string') return ''
  let r = s

  // 占位符容错：模型会把 [[BS]] 写成各种变体 ([[(BS)], [BS], [[:PARA]], [(NL)]] 等)。
  // 用超宽松正则：1-4 个左方括号 + 非字母非括号噪音 + 关键字 + 非字母非括号噪音 + 1-4 个右方括号。
  // 关键字大写避免误伤普通文本中的 bs/para/nl/fig 子串。
  r = r.replace(/\[{1,4}[^a-zA-Z\[\]]*BS[^a-zA-Z\[\]]*\]{1,4}/g, '\\')
  r = r.replace(/\[{1,4}[^a-zA-Z\[\]]*PARA[^a-zA-Z\[\]]*\]{1,4}/g, '\n\n')
  r = r.replace(/\[{1,4}[^a-zA-Z\[\]]*NL[^a-zA-Z\[\]]*\]{1,4}/g, '\n')
  r = r.replace(/\[{1,4}[^a-zA-Z\[\]]*FIG[^a-zA-Z\[\]]*\]{1,4}/g, '【图形占位 - 请参照原题】')

  // LatexText 只识别 $...$ / $$...$$。模型若写了 \(...\) 或 \[...\]，统一归一化。
  // 替换函数形式：JS 字符串中 '$$' 表字面 $，要写 '$$' 输出 '$$' 须用 lambda。
  r = r.replace(/\\\(/g, '$').replace(/\\\)/g, '$')
  r = r.replace(/\\\[/g, () => '$$').replace(/\\\]/g, () => '$$')

  // KaTeX 不允许 \text{} 内部出现 ^ 或 _（会导致渲染红字报错）。
  // 模型给单位带上下标时常写 \text{m s^{-1}}，自动改写为 \mathrm{}（保留上下标语义）。
  r = r.replace(/\\text\{([^{}]*[\^_][^{}]*)\}/g, '\\mathrm{$1}')

  return r
}

function normalizeImage(img: any): ParsedQuestion['images'][number] | null {
  if (typeof img === 'string') {
    return { type: 'svg', alt: '', code: img }
  }
  if (!img || typeof img !== 'object') return null
  const type = typeof img.type === 'string' && img.type ? img.type : 'svg'
  const alt = typeof img.alt === 'string' ? img.alt : ''
  const code = typeof img.code === 'string' ? img.code : ''
  const src = typeof img.src === 'string' ? img.src : undefined
  if (!code && !src) return null
  return src ? { type, alt, code, src } : { type, alt, code }
}

function normalizeQuestion(q: any): ParsedQuestion {
  const images = Array.isArray(q.images)
    ? (q.images.map(normalizeImage).filter(Boolean) as ParsedQuestion['images'])
    : []
  return {
    number: typeof q.number === 'number' ? q.number : 0,
    title: decodePlaceholders(q.title),
    options: Array.isArray(q.options)
      ? q.options.map((o: any) => ({
          label: typeof o.label === 'string' ? o.label : '',
          text: decodePlaceholders(o.text),
        }))
      : [],
    answer: Array.isArray(q.answer) ? q.answer.filter((a: any) => typeof a === 'string') : [],
    images,
  }
}

// ============================================================
// JSON 截断修复（保留作为兜底）
// ============================================================

function tryRepairTruncated(jsonStr: string): string | null {
  let repaired = jsonStr
  const lastNewline = repaired.lastIndexOf('\n')
  if (lastNewline > 0) {
    const lastLine = repaired.substring(lastNewline + 1)
    if (!/^[\s}\]\)]*$/.test(lastLine)) {
      repaired = repaired.substring(0, lastNewline)
    }
  }
  repaired = repaired.replace(/[,;\s]*$/, '')
  const openBraces = (repaired.match(/\{/g) || []).length
  const closeBraces = (repaired.match(/\}/g) || []).length
  const openBrackets = (repaired.match(/\[/g) || []).length
  const closeBrackets = (repaired.match(/\]/g) || []).length
  for (let i = closeBrackets; i < openBrackets; i++) repaired += ']'
  for (let i = closeBraces; i < openBraces; i++) repaired += '}'
  return repaired !== jsonStr ? repaired : null
}

// ============================================================
// Qwen API 调用
// ============================================================

export async function analyzePageWithQwen(
  imageBase64: string,
  pageNum: number,
  mimeType: string = 'image/png'
): Promise<ParsedQuestion[]> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 120_000)

  let response: Response
  try {
    response = await fetch(
      `${DASHSCOPE_BASE}/services/aigc/multimodal-generation/generation`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'qwen-vl-max',
          input: {
            messages: [{
              role: 'user',
              content: [
                { image: `data:${mimeType};base64,${imageBase64}` },
                { text: SYSTEM_PROMPT }
              ]
            }]
          },
          parameters: {
            result_format: 'message',
            max_tokens: 8192,
            temperature: 0.1,
            seed: 42,
            // repetition_penalty 是控制 SVG 死循环的关键：默认 1.0 时模型容易在
            // 连续输出相同 <line> 时陷入循环；1.1 足以打破循环又不影响正常生成。
            repetition_penalty: 1.1
          }
        }),
        signal: controller.signal
      }
    )
  } finally {
    clearTimeout(timeout)
  }

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Qwen API error (${response.status}): ${err}`)
  }

  const data = await response.json() as any
  const content = data?.output?.choices?.[0]?.message?.content
  if (!content) {
    console.error(`[Qwen p${pageNum}] Unexpected response:`, JSON.stringify(data).substring(0, 500))
    return []
  }

  const text = content[0]?.text || ''
  console.log(`[Qwen p${pageNum}] Raw text length: ${text.length}`)

  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  const candidates: string[] = []
  if (codeBlockMatch) {
    candidates.push(codeBlockMatch[1])
    console.log(`[Qwen p${pageNum}] Extracted from code block`)
  }
  candidates.push(text)

  for (const candidate of candidates) {
    const result = tryParse(candidate, pageNum)
    if (result.length > 0) return result
  }

  console.warn(`[Qwen p${pageNum}] All parse attempts failed, returning 0 questions`)
  saveDebugFile(text, pageNum, 'failed')
  return []
}

// ============================================================
// JSON 解析
// ============================================================

function tryParse(rawText: string, pageNum: number): ParsedQuestion[] {
  let parsed: any

  try {
    parsed = JSON.parse(rawText)
  } catch {
    const repaired = tryRepairTruncated(rawText)
    if (repaired) {
      try {
        parsed = JSON.parse(repaired)
        console.log(`[Qwen p${pageNum}] JSON repaired (truncated)`)
      } catch {
        console.error(`[Qwen p${pageNum}] JSON parse failed after repair, head:`, rawText.substring(0, 200))
        return []
      }
    } else {
      console.error(`[Qwen p${pageNum}] JSON parse failed, head:`, rawText.substring(0, 200))
      return []
    }
  }

  let rawQuestions: any[] = []
  if (Array.isArray(parsed.questions)) {
    rawQuestions = parsed.questions
  } else if (typeof parsed.number === 'number' && parsed.title) {
    rawQuestions = [parsed]
    console.log(`[Qwen p${pageNum}] Single question object, wrapped`)
  }

  const qs: ParsedQuestion[] = rawQuestions.map(normalizeQuestion)

  if (qs.length === 0) {
    console.warn(`[Qwen p${pageNum}] 0 questions (keys: ${Object.keys(parsed).join(', ')})`)
  } else {
    console.log(`[Qwen p${pageNum}] ${qs.length} questions: [${qs.map((q) => `Q${q.number}`).join(', ')}]`)
  }
  return qs
}

// ============================================================
// 调试辅助
// ============================================================

function saveDebugFile(content: string, pageNum: number, tag: string): void {
  const debugDir = join(process.cwd(), 'debug-qwen-raw')
  if (!existsSync(debugDir)) mkdirSync(debugDir, { recursive: true })
  const debugPath = join(debugDir, `page-${String(pageNum).padStart(2, '0')}-${tag}.json`)
  writeFileSync(debugPath, content, 'utf-8')
  console.error(`[Qwen p${pageNum}] Debug saved: ${debugPath} (${content.length} chars)`)
}
