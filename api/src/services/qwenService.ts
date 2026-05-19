const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY || ''
const DASHSCOPE_BASE = 'https://dashscope.aliyuncs.com/api/v1'

export interface ParsedQuestion {
  number: number
  title: string
  options: { label: string; text: string }[]
  answer: string[]
  images: { type: string; alt: string; code?: string; src?: string }[]
}

const SYSTEM_PROMPT = `你是一个专业的试卷解析助手。请分析这份PDF试卷，只识别前10道题（如果不足10道则全部识别）。

对于每道题，提取以下信息并按JSON格式输出。**必须输出合法的JSON，不要输出任何其他内容。**

{
  "questions": [
    {
      "number": 1,
      "title": "题目文本，行内公式用 $...$、居中公式用 $$...$$、段落之间用 \\\\n\\\\n",
      "options": [
        {"label": "A", "text": "选项内容，公式用 $...$"}
      ],
      "answer": ["A"],
      "images": [
        {
          "type": "svg",
          "alt": "图形描述",
          "code": "<svg width=\\"...\\" height=\\"...\\" viewBox=\\"...\\" ...>...</svg>"
        }
      ]
    }
  ]
}

【段落与换行】（关键，必须严格遵守）
1. 严格保留原图的段落结构。原文里"空行分段"（两个文本块之间有明显空白）必须用 \\\\n\\\\n 在 JSON 字符串里表示
2. 段落内部的强制换行（同一段中作者刻意另起一行，但语义上还是一段）用 \\\\n
3. 不要把多个原本分段的句子合并成单行字符串
4. JSON 中的 \\\\n 必须是转义序列（反斜杠 + 字母 n 两个 ASCII 字符），绝不能输出真实换行符（按下回车那种）

【公式】
5. 行内公式（嵌在正文里）用 $...$ 包裹
6. 独立成行/居中显示的公式（display math）用 $$...$$ 包裹
7. 所有数学符号使用 LaTeX 标准命令（\\\\sqrt、\\\\frac、\\\\dfrac、\\\\pi、\\\\text{...} 等）

【SVG 图形】
8. 图形转为精确的 SVG 代码，必须显式包含 width 和 height 属性，不能只写 viewBox（否则前端 height 会坍塌为 0 不显示）
9. SVG 内部的引号在 JSON 字符串里用 \\\\" 转义

【其他】
10. 每道题至少有一个选项
11. 如果页面没有标注正确答案，answer 留空数组 []

【正确示例】
"title": "A spaceship of mass $10000\\\\,\\\\text{kg}$ is moving at $2.0\\\\,\\\\text{m s}^{-1}$ relative to a space station.\\\\n\\\\nThe spaceship is captured by a robotic arm and brought to rest by a force of $1000\\\\,\\\\text{N}$.\\\\n\\\\nHow far will the spaceship move?\\\\n\\\\n(Assume that the acceleration of the space station is negligible.)"
→ 4 段，3 处 \\\\n\\\\n，与原图段落数一致

【错误示例】（必须避免）
"title": "A spaceship of mass 10000 kg is moving... The spaceship is captured... How far will... (Assume...)"
→ 多段被合并为一行，原排版丢失

【自检】生成后对照原图核对：
- 数原图题干有几个段落（按视觉空行）
- 数 title 里 \\\\n\\\\n 的次数 + 1
- 两数应相等；不等说明合并段落了，必须修正后重新输出`

export async function analyzePageWithQwen(
  imageBase64: string,
  _pageNum: number
): Promise<ParsedQuestion[]> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 120_000)

  try {
    const response = await fetch(
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
                { image: `data:image/png;base64,${imageBase64}` },
                { text: SYSTEM_PROMPT }
              ]
            }]
          },
          parameters: { result_format: 'message' }
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
    console.error('Unexpected response:', JSON.stringify(data).substring(0, 500))
    return []
  }

  const text = content[0]?.text || ''
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/)
  const jsonStr = jsonMatch ? jsonMatch[1] : text

  try {
    const parsed = JSON.parse(jsonStr)
    return parsed.questions || []
  } catch (e) {
    console.error('Failed to parse JSON:', jsonStr?.substring(0, 300))
    return []
  }
}
