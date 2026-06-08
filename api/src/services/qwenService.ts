import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

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

// 内联后备提示词（文件加载失败时使用）
const FALLBACK_SYSTEM_PROMPT = `你是一个专业的试卷解析助手。分析整份试卷页面，识别页上所有题目并输出完整 JSON。

==================================================
【文字解析规则】
==================================================

1. title 和 options.text 必须保留原文完整。
2. 段落分隔符 [[PARA]] 表示原图中两段空行。
3. 段内强制换行 [[NL]] 表示原图中的强制换行。
4. 所有反斜杠 \\ 必须写为 [[BS]]。
   - JSON 字符串中禁止出现任何单个反斜杠。
   - LaTeX 示例：\\sqrt 必须写为 [[BS]]sqrt；\\frac 必须写为 [[BS]]frac；\\, 必须写为 [[BS]],；\\mathrm 必须写为 [[BS]]mathrm。
5. 数学公式只允许：
   - 行内 $...$
   - 独占 $...$
6. 散文不得包在 \\text{} 内。
7. 单位带上下标必须使用 \\mathrm{}。

==================================================
【JSON结构规则】
==================================================

{
  "questions": [
    {
      "number": 题号,
      "title": "题干文本（公式 $...$ / $...$，反斜杠 [[BS]]，段落 [[PARA]]，换行 [[NL]])",
      "options": [
        {"label":"A","text":"选项内容"},
        {"label":"B","text":"选项内容"}
      ],
      "answer": ["正确答案标签，例如 A"],
      "images": [
        {
          "type":"svg",
          "diagram_type":"geometry / coordinate_graph / circuit / force_diagram / statistical_chart / table / other",
          "alt":"图形描述",
          "semantic":{},
          "graph_schema":{},
          "code":"<svg ...></svg>"
        }
      ]
    }
  ]
}

JSON 强制要求：
- 所有字符串必须是合法 JSON 字符串。
- 不得在任何字符串中输出真实换行；换行只能使用 [[NL]] 或 [[PARA]]。
- 不得输出未加引号的符号变量，例如 T₁、T_1、a、2a、T_intermediate。需要表达符号时必须写成字符串。
- graph_schema 中的坐标数组只能包含 JSON 数字或字符串；禁止 2/3、3/4 这类算式。若可计算，写小数，例如 0.6667。

==================================================
【图形解析增强规则】
==================================================

1. geometry 类型图形必须优先恢复几何约束，而非视觉估计。
   - 根据题目给出的长度、比例、坐标、平行、垂直、中点、切点、圆心恢复坐标。
   - 所有几何图必须生成 graph_schema.coordinate_system。
   - 允许误差 ≤ 2%。

2. semantic:
   - geometry: 保存顶点、形状、比例关系
   - coordinate_graph: 保存 x_axis, y_axis, graph_kind
   - circuit: 保存电路元件
   - force_diagram: 保存力学对象
   - statistical_chart: 保存统计数据描述

3. graph_schema:
   - geometry:
     {
       "coordinate_system": {点名:[x,y]},
       "constraints": ["AB:BC=1:2", ...],
       "derived_points": {计算出的点:[x,y]}
     }
   - coordinate_graph:
     {
       "x_label":"x轴描述",
       "y_label":"y轴描述",
       "points":[[x1,y1],[x2,y2],...],
       "curve":"line/curve/bar/other"
     }

4. SVG 规则:
   - 默认线宽 stroke-width='1'，除非原图明显加粗。
   - 顶点标签必须位于图形外侧，距离边界 4~8px，不得压线。
   - geometry viewBox='0 0 150 150'；coordinate_graph viewBox='0 0 180 140'。
   - 元素总数 ≤25，总长度 ≤1500 字符。
   - SVG code 必须是单行字符串，不得包含真实换行。
   - SVG 属性统一使用单引号，避免 JSON 字符串内双引号转义。
   - 禁止阴影、渐变、装饰。
   - 如果图中包含多个子图、表格、五个以上选项图、或 SVG 可能超过 1500 字符：不要生成 SVG，images 返回 []，并在 title 合适位置加入 [[FIG]]。

==================================================
【输出前自检】
==================================================

- 数学公式只用 $...$ 或 $...$。
- 散文未包 \\text{}。
- 单位使用 \\mathrm{}。
- title/options.text 使用 [[BS]]。
- JSON 字符串中不存在真实反斜杠和真实换行。
- graph_schema 坐标数组中不存在 2/3、a、T₁ 等非法 JSON 值。
- 占位符 [[PARA]], [[NL]], [[FIG]] 规范。
- geometry 类型必须生成 graph_schema.coordinate_system。
- 顶点标签在外侧，线宽正确。
- SVG 尺寸正确，元素不超标。
- complex 图使用 [[FIG]] 占位。
- semantic 与 graph_schema 完整。
- JSON 闭合。
- 输出只生成 JSON 对象，不输出任何解释文字或 Markdown。`

// 从文件加载当前提示词，文件缺失时回退到内联版本
// 通过环境变量 PROMPT_VERSION 控制使用哪个版本（如 v1-base、v1-zh、v1-en）
export function loadSystemPrompt(version?: string): string {
  const v = version || process.env.PROMPT_VERSION || 'v1-base'
  const promptPath = join(__dirname, '..', '..', 'prompts', 'versions', v, 'system.txt')
  try {
    const content = readFileSync(promptPath, 'utf-8').trim()
    if (content) {
      console.log(`[Prompt] Loaded from ${promptPath}`)
      return content
    }
  } catch {
    // 文件不存在或读取失败
  }
  console.warn(`[Prompt] ${promptPath} not found, using fallback inline prompt`)
  return FALLBACK_SYSTEM_PROMPT
}

// 运行时加载
const SYSTEM_PROMPT = loadSystemPrompt()

// ============================================================
// 占位符解码：把模型输出的 [[BS]]/[[NL]]/[[PARA]] 还原为真实字符
// ============================================================

export function decodePlaceholders(s: unknown): string {
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

export function normalizeImage(img: any): ParsedQuestion['images'][number] | null {
  if (typeof img === 'string') {
    return { type: 'svg', alt: '', code: img }
  }
  if (!img || typeof img !== 'object') return null
  const alt = typeof img.alt === 'string' ? img.alt : ''
  const code = typeof img.code === 'string' ? img.code : ''
  const src = typeof img.src === 'string' ? img.src : undefined
  if (!code && !src) return null
  const type = code ? 'svg' : 'image'
  return src ? { type, alt, code, src } : { type, alt, code }
}

export function normalizeQuestion(q: any): ParsedQuestion {
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

export function tryRepairTruncated(jsonStr: string): string | null {
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
  mimeType: string = 'image/png',
  customPrompt?: string,
): Promise<ParsedQuestion[]> {
  const prompt = customPrompt || SYSTEM_PROMPT
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
                { text: prompt }
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
    if (result) return result
  }

  console.warn(`[Qwen p${pageNum}] All parse attempts failed, returning 0 questions`)
  saveDebugFile(text, pageNum, 'failed')
  return []
}

// ============================================================
// JSON 解析
// ============================================================

function tryParse(rawText: string, pageNum: number): ParsedQuestion[] | null {
  let parsed: any

  for (const candidate of buildJsonCandidates(rawText)) {
    try {
      parsed = JSON.parse(candidate)
      if (candidate !== rawText) console.log(`[Qwen p${pageNum}] JSON repaired before parse`)
      break
    } catch {
      const repaired = tryRepairTruncated(candidate)
      if (repaired) {
        try {
          parsed = JSON.parse(repaired)
          console.log(`[Qwen p${pageNum}] JSON repaired (truncated)`)
          break
        } catch {
          // try next candidate
        }
      }
    }
  }

  if (!parsed) {
    console.error(`[Qwen p${pageNum}] JSON parse failed, head:`, rawText.substring(0, 200))
    return null
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
    console.log(`[Qwen p${pageNum}] 0 questions (keys: ${Object.keys(parsed).join(', ')})`)
  } else {
    console.log(`[Qwen p${pageNum}] ${qs.length} questions: [${qs.map((q) => `Q${q.number}`).join(', ')}]`)
  }
  return qs
}

function buildJsonCandidates(rawText: string): string[] {
  const trimmed = rawText.trim()
  const extracted = extractJsonObject(trimmed)
  const bases = extracted ? [trimmed, extracted] : [trimmed]
  const candidates = bases.flatMap((base) => {
    const repairedEscapes = repairInvalidJsonEscapes(base)
    const repairedNumbers = repairNumericExpressions(repairedEscapes)
    const repairedSymbols = quoteUnquotedSymbolValues(repairedNumbers)
    const strippedBrokenImages = stripBrokenTrailingImages(repairedSymbols)
    return [base, repairedEscapes, repairedNumbers, repairedSymbols, strippedBrokenImages].filter(
      (candidate): candidate is string => typeof candidate === 'string',
    )
  })
  return Array.from(new Set(candidates))
}

function extractJsonObject(text: string): string | null {
  const start = text.indexOf('{')
  if (start < 0) return null
  const end = text.lastIndexOf('}')
  return end > start ? text.slice(start, end + 1).trim() : text.slice(start).trim()
}

function repairInvalidJsonEscapes(json: string): string {
  // Qwen sometimes ignores [[BS]] and emits LaTeX like \sqrt or \, inside JSON strings.
  return json.replace(/(?<!\\)\\(?!["\\/bfnrtu])/g, '\\\\')
}

function repairNumericExpressions(json: string): string {
  return json.replace(
    /([\[:,]\s*)(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)(?=\s*[\],])/g,
    (match: string, prefix: string, a: string, b: string) => {
      const denominator = Number(b)
      if (!denominator) return match
      return `${prefix}${Number((Number(a) / denominator).toFixed(6))}`
    },
  )
}

function quoteUnquotedSymbolValues(json: string): string {
  let result = ''
  let inString = false
  let escaped = false

  for (let i = 0; i < json.length; i++) {
    const ch = json[i]
    result += ch

    if (inString) {
      if (escaped) {
        escaped = false
      } else if (ch === '\\') {
        escaped = true
      } else if (ch === '"') {
        inString = false
      }
      continue
    }

    if (ch === '"') {
      inString = true
      continue
    }

    if (ch !== '[' && ch !== ',') continue

    let cursor = i + 1
    while (/\s/.test(json[cursor] || '')) cursor++

    const tokenMatch = json
      .slice(cursor)
      .match(/^([A-Za-z_₀-₉][A-Za-z0-9_₀-₉]*|\d+[A-Za-z_₀-₉][A-Za-z0-9_₀-₉]*)/)
    if (!tokenMatch) continue

    const token = tokenMatch[1]
    let afterToken = cursor + token.length
    while (/\s/.test(json[afterToken] || '')) afterToken++
    if (![',', ']'].includes(json[afterToken])) continue
    if (['true', 'false', 'null'].includes(token)) continue

    result += json.slice(i + 1, cursor)
    result += `"${token}"`
    i = cursor + token.length - 1
  }

  return result
}

function stripBrokenTrailingImages(json: string): string | null {
  const marker = json.lastIndexOf('"images"')
  if (marker < 0) return null
  const suffix = json.slice(marker)
  if (!suffix.includes('"code"') && !suffix.includes('<svg')) return null
  return `${ensureFigPlaceholderInPrefix(json.slice(0, marker))}"images": []\n    }\n  ]\n}`
}

function ensureFigPlaceholderInPrefix(prefix: string): string {
  if (prefix.includes('[[FIG]]') || prefix.includes('图形占位')) return prefix
  return prefix.replace(
    /"title"\s*:\s*"((?:\\.|[^"\\])*)"/,
    (_match: string, title: string) => `"title": "${title}[[PARA]][[FIG]]"`,
  )
}

// ============================================================
// 调试辅助
// ============================================================

export function saveDebugFile(content: string, pageNum: number, tag: string): void {
  const debugDir = join(process.cwd(), 'debug-qwen-raw')
  if (!existsSync(debugDir)) mkdirSync(debugDir, { recursive: true })
  const debugPath = join(debugDir, `page-${String(pageNum).padStart(2, '0')}-${tag}.json`)
  writeFileSync(debugPath, content, 'utf-8')
  console.error(`[Qwen p${pageNum}] Debug saved: ${debugPath} (${content.length} chars)`)
}
