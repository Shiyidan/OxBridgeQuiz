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
      "title": "题目文本，数学公式用LaTeX语法，行内公式用\$...\$包裹",
      "options": [
        {"label": "A", "text": "选项内容，公式用\$...\$"}
      ],
      "answer": ["A"],
      "images": [
        {
          "type": "svg",
          "alt": "图形描述",
          "code": "<svg viewBox=\\"...\\" ...>...</svg>"
        }
      ]
    }
  ]
}

重要规则：
1. 所有数学公式转为LaTeX（用\$...\$包裹行内公式）
2. 图形转为精确的SVG代码
3. 每道题至少有一个选项
4. 如果页面没有标注正确答案，answer留空数组[]`

export async function analyzePageWithQwen(
  imageBase64: string,
  pageNum: number
): Promise<ParsedQuestion[]> {
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
      })
    }
  )

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
