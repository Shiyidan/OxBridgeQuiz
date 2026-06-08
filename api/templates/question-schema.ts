// ============================================================
// 试题输出模板：TypeScript 类型定义 + JSON Schema
// 设计原则：模型只出核心字段，Claude 做后置增强
// ============================================================

// ---- 学科枚举 ----
export type Subject = 'math' | 'physics' | 'chemistry' | 'biology' | 'logic'

// ---- 题型枚举 ----
export type QuestionType = 'single_choice' | 'multi_choice' | 'true_false'

// ---- 模型原始输出（视觉模型需要填写的核心字段） ----
export interface ModelRawOutput {
  number: number
  title: string
  options: { label: string; text: string }[]
  answer: string[]
  images: { type: 'svg' | 'placeholder'; alt: string; code?: string }[]
}

// ---- Claude 增强后的最终输出 ----
export interface QuestionOutput extends ModelRawOutput {
  subject: Subject
  type: QuestionType
  explanation?: string
  metadata: QuestionMetadata
}

export interface QuestionMetadata {
  confidence: number
  pageNumber: number
  warnings: string[]
}

// ---- 解析任务整体输出 ----
export interface ParseResult {
  examType: string
  model: string
  mode: 'fast' | 'precise'
  totalPages: number
  totalQuestions: number
  questions: QuestionOutput[]
  validation: ValidationReport
}

// ---- 验证报告 ----
export interface ValidationReport {
  level1: LevelResult   // 结构
  level2: LevelResult   // 格式
  level3?: LevelResult  // 语义（精准模式）
  level4?: LevelResult  // 答案（需 answer key）
  autoFixed: AutoFixRecord[]
  needsReview: ReviewItem[]
}

export interface LevelResult {
  passed: number
  warnings: number
  errors: number
  details: string[]
}

export interface AutoFixRecord {
  questionNumber: number
  issue: string
  fix: string
}

export interface ReviewItem {
  questionNumber: number
  severity: 'low' | 'medium' | 'high'
  description: string
}

// ============================================================
// JSON Schema（给 Gemini/GPT-4o/Claude structured output 使用）
// 只包含模型需要输出的核心字段
// ============================================================

export const MODEL_OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    questions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          number: {
            type: 'integer',
            description: '题号，按照原图标注的数字',
          },
          title: {
            type: 'string',
            description:
              '题干文本。数学公式用 $...$（行内）或 $$...$$（独占行）。反斜杠全部用 [[BS]] 替代。段落分隔用 [[PARA]]，强制换行用 [[NL]]，复杂图形用 [[FIG]] 占位。',
          },
          options: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                label: { type: 'string', description: '选项标签，如 A/B/C/D' },
                text: { type: 'string', description: '选项内容，公式规则同 title' },
              },
              required: ['label', 'text'],
              additionalProperties: false,
            },
            minItems: 2,
            maxItems: 8,
          },
          answer: {
            type: 'array',
            items: { type: 'string' },
            description: '正确答案的标签列表，如 ["A"] 或 ["A","C"]',
          },
          images: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                  enum: ['svg', 'placeholder'],
                  description: 'svg=简单图生成SVG, placeholder=复杂图占位',
                },
                alt: { type: 'string', description: '图片简短文字描述，中文≤30字' },
                code: { type: 'string', description: 'type=svg 时的 SVG 代码' },
              },
              required: ['type', 'alt'],
              additionalProperties: false,
            },
          },
        },
        required: ['number', 'title', 'options', 'answer', 'images'],
        additionalProperties: false,
      },
    },
  },
  required: ['questions'],
  additionalProperties: false,
} as const

// ============================================================
// 验证辅助：按 schema 检查单题
// ============================================================

export function validateQuestionStructure(q: any): string[] {
  const errors: string[] = []

  if (typeof q.number !== 'number' || !Number.isInteger(q.number)) {
    errors.push(`Q${q.number ?? '?'}: number 必须是整数`)
  }
  if (typeof q.title !== 'string' || q.title.trim().length === 0) {
    errors.push(`Q${q.number ?? '?'}: title 不能为空`)
  }
  if (!Array.isArray(q.options) || q.options.length < 2) {
    errors.push(`Q${q.number ?? '?'}: options 至少需要 2 个`)
  } else {
    const labels = q.options.map((o: any) => o?.label)
    if (new Set(labels).size !== labels.length) {
      errors.push(`Q${q.number ?? '?'}: options label 重复`)
    }
    q.options.forEach((o: any, i: number) => {
      if (typeof o?.label !== 'string' || o.label.length === 0) {
        errors.push(`Q${q.number ?? '?'}: options[${i}].label 缺失`)
      }
      if (typeof o?.text !== 'string' || o.text.trim().length === 0) {
        errors.push(`Q${q.number ?? '?'}: options[${i}].text 不能为空`)
      }
    })
  }
  if (!Array.isArray(q.answer) || q.answer.length === 0) {
    errors.push(`Q${q.number ?? '?'}: answer 至少需要一个值`)
  } else {
    const optionLabels = q.options?.map((o: any) => o.label) ?? []
    q.answer.forEach((a: string) => {
      if (!optionLabels.includes(a)) {
        errors.push(`Q${q.number ?? '?'}: answer "${a}" 不在 options 中`)
      }
    })
  }
  if (!Array.isArray(q.images)) {
    errors.push(`Q${q.number ?? '?'}: images 必须是数组`)
  }

  return errors
}
