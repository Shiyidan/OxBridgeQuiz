/**
 * Markdown 导入校验器 — 提取 JSON 代码块、结构校验、安全清洗
 */
import { isExamType, isPaperType } from '../constants/domain.js'

export interface StandardPaperMetadata {
  paperName: string
  year: number
  duration: number
  examType: string
  paperType: string
  totalQuestions: number
}

export interface ValidationError {
  block: number // JSON 块序号（1-based）
  message: string
}

export interface ProcessResult {
  metadata: StandardPaperMetadata | null
  questions: any[]
  errors: ValidationError[]
  warnings: string[]
}

// 匹配 ```json ... ``` 代码块
const JSON_BLOCK_RE = /```json\s*\n([\s\S]*?)\n\s*```/g

// 危险模式：需要移除的标签和属性
const DANGEROUS_TAGS = /<\s*script[\s\S]*?<\/\s*script\s*>|<\s*iframe[\s\S]*?<\/\s*iframe\s*>|<\s*object[\s\S]*?<\/\s*object\s*>|<\s*embed[^>]*\/?\s*>/gi
const DANGEROUS_EVENTS = /\b(on\w+)\s*=\s*["'][^"']*["']/gi
const JAVASCRIPT_PROTOCOL = /\bjavascript\s*:/gi
const REMAINING_TAGS = /<[^>]*>/g

// SVG 标签块 —— 合法的 inline SVG 图形需要保留
const SVG_BLOCK_RE = /<svg\b[\s\S]*?<\/svg\s*>/gi

// 合法的 LaTeX 占位符，不可作为安全标记移除
const PLACEHOLDER_RE = /\[\[(BS|NL|PARA|FIG)\]\]/g
const DEPRECATED_QUESTION_FIELDS = ['correctAnswer', 'content', 'order']

export function extractJsonBlocks(md: string): { index: number; raw: string }[] {
  const blocks: { index: number; raw: string }[] = []
  let match: RegExpExecArray | null
  let idx = 0

  // 重置 lastIndex
  JSON_BLOCK_RE.lastIndex = 0
  while ((match = JSON_BLOCK_RE.exec(md)) !== null) {
    idx++
    blocks.push({ index: idx, raw: match[1].trim() })
  }

  return blocks
}

export function validateStandardPaperDocument(input: any): {
  metadata: StandardPaperMetadata | null
  questions: any[]
  errors: ValidationError[]
} {
  const errors: ValidationError[] = []
  const metadata = input?.metadata
  const questions = input?.questions

  if (!metadata || typeof metadata !== 'object') {
    errors.push({ block: 0, message: '缺少标准根字段 metadata' })
  } else {
    if (!metadata.paperName || typeof metadata.paperName !== 'string') {
      errors.push({ block: 0, message: 'metadata.paperName 必须为试卷名称' })
    }
    if (typeof metadata.year !== 'number' || !Number.isFinite(metadata.year)) {
      errors.push({ block: 0, message: 'metadata.year 必须为数字年份' })
    }
    if (typeof metadata.duration !== 'number' || !Number.isFinite(metadata.duration)) {
      errors.push({ block: 0, message: 'metadata.duration 必须为数字分钟数' })
    }
    if (!isExamType(metadata.examType)) {
      errors.push({ block: 0, message: 'metadata.examType 不是系统支持的考试类型' })
    }
    if (!isPaperType(metadata.paperType)) {
      errors.push({ block: 0, message: 'metadata.paperType 必须为 realPaper、mockPaper 或 aiPaper' })
    }
    if (typeof metadata.totalQuestions !== 'number' || !Number.isFinite(metadata.totalQuestions)) {
      errors.push({ block: 0, message: 'metadata.totalQuestions 必须为数字' })
    }
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    errors.push({ block: 0, message: 'questions 必须是非空数组' })
    return { metadata: metadata || null, questions: [], errors }
  }

  if (metadata?.totalQuestions !== undefined && metadata.totalQuestions !== questions.length) {
    errors.push({ block: 0, message: 'metadata.totalQuestions 必须等于 questions.length' })
  }

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i]
    const label = `题目 ${q.number ?? `索引${i + 1}`}`
    const imageIds = new Set((Array.isArray(q.images) ? q.images : []).map((img: any) => img?.id).filter(Boolean))

    for (const field of DEPRECATED_QUESTION_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(q, field)) {
        errors.push({ block: 0, message: `${label}：${field} 是已废弃字段，请使用标准题目结构` })
      }
    }

    if (q.number == null) {
      errors.push({ block: 0, message: `${label}：缺少题号 (number)` })
    } else if (typeof q.number !== 'number' || !Number.isFinite(q.number)) {
      errors.push({ block: 0, message: `${label}：题号必须为有效数字` })
    }

    if (!q.title || typeof q.title !== 'string' || !q.title.trim()) {
      errors.push({ block: 0, message: `${label}：缺少题干 (title)` })
    }

    if (!Array.isArray(q.content_blocks) || q.content_blocks.length === 0) {
      errors.push({ block: 0, message: `${label}：缺少题干内容块 (content_blocks)` })
    } else {
      const first = q.content_blocks[0]
      if (first?.type !== 'paragraph' || first.text !== q.title) {
        errors.push({ block: 0, message: `${label}：title 必须等于 content_blocks[0].text，且首块必须为 paragraph` })
      }
      for (let j = 0; j < q.content_blocks.length; j++) {
        const block = q.content_blocks[j]
        if (block?.type === 'paragraph') {
          if (typeof block.text !== 'string') {
            errors.push({ block: 0, message: `${label} 的 content_blocks[${j}]：paragraph 必须包含 text` })
          }
        } else if (block?.type === 'image_ref') {
          if (!block.image_id || !imageIds.has(block.image_id)) {
            errors.push({ block: 0, message: `${label} 的 content_blocks[${j}]：image_id 必须匹配 images[].id` })
          }
        } else {
          errors.push({ block: 0, message: `${label} 的 content_blocks[${j}]：type 只能为 paragraph 或 image_ref` })
        }
      }
    }

    if (!Array.isArray(q.options) || q.options.length === 0) {
      errors.push({ block: 0, message: `${label}：缺少选项 (options)` })
    } else {
      for (let j = 0; j < q.options.length; j++) {
        const opt = q.options[j]
        if (!opt.label) {
          errors.push({ block: 0, message: `${label} 的选项 ${j + 1}：缺少标签 (label)` })
        }
        if (opt.text === undefined || opt.text === null) {
          errors.push({ block: 0, message: `${label} 的选项 ${j + 1}：缺少文本 (text)` })
        }
        if (opt.image_id && !imageIds.has(opt.image_id)) {
          errors.push({ block: 0, message: `${label} 的选项 ${j + 1}：image_id 必须匹配 images[].id` })
        }
      }
    }

    if (!Array.isArray(q.answer)) {
      errors.push({ block: 0, message: `${label}：answer 必须为数组` })
    }
    if (q.difficulty !== undefined && typeof q.difficulty !== 'string') {
      errors.push({ block: 0, message: `${label}：difficulty 必须为字符串` })
    }
    if (q.examType !== metadata?.examType) {
      errors.push({ block: 0, message: `${label}：examType 必须与 metadata.examType 一致` })
    }
    if (!q.source_examType || typeof q.source_examType !== 'string') {
      errors.push({ block: 0, message: `${label}：缺少来源考试类型 (source_examType)` })
    }
    if (q.year !== metadata?.year) {
      errors.push({ block: 0, message: `${label}：year 必须与 metadata.year 一致` })
    }
    if (!['single_choice', 'multiple_choice', 'short_answer'].includes(q.question_type)) {
      errors.push({ block: 0, message: `${label}：question_type 必须为 single_choice、multiple_choice 或 short_answer` })
    }
    if (Array.isArray(q.images)) {
      for (const img of q.images) {
        if (Object.prototype.hasOwnProperty.call(img, 'code')) {
          errors.push({ block: 0, message: `${label}：images[].code 是已废弃字段，请使用 svg 或 src` })
        }
        if (!img.id || !img.alt || !['svg', 'image'].includes(img.type)) {
          errors.push({ block: 0, message: `${label}：images 每项必须包含 id、type、alt` })
        } else if (img.type === 'svg' && typeof img.svg !== 'string') {
          errors.push({ block: 0, message: `${label}：SVG 图片必须包含 svg 字符串` })
        } else if (img.type === 'image' && typeof img.src !== 'string') {
          errors.push({ block: 0, message: `${label}：位图图片必须包含 src` })
        }
      }
    }
  }

  return { metadata: metadata || null, questions, errors }
}

/**
 * 对题目内容做安全清洗（递归遍历所有字符串字段）
 * 返回 { cleaned, warnings }
 */
export function sanitizeQuestionContent(questions: any[]): { cleaned: any[]; warnings: string[] } {
  const warnings: string[] = []
  const cleaned = JSON.parse(JSON.stringify(questions)) // 深拷贝

  for (let i = 0; i < cleaned.length; i++) {
    const q = cleaned[i]
    const label = `题目 ${q.number ?? i + 1}`
    sanitizeRecursive(q, label, warnings)
  }

  return { cleaned, warnings }
}

/** 递归遍历对象，清洗所有字符串值 */
function sanitizeRecursive(obj: any, questionLabel: string, warnings: string[], path: string = ''): void {
  if (obj === null || obj === undefined) return

  if (typeof obj === 'string') {
    // 跳过 LaTeX-only 占位符（纯标记类字符串不需要清洗）
    if (PLACEHOLDER_RE.test(obj) && obj.replace(PLACEHOLDER_RE, '').trim() === '') return

    const result = sanitizeText(obj, questionLabel, path || '字段')
    if (result.warning) warnings.push(result.warning)
    // 原始字符串没有父级可回写，此分支只补充校验告警。
    return
  }

  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      const item = obj[i]
      if (typeof item === 'string') {
        const result = sanitizeText(item, questionLabel, path ? `${path}[${i}]` : `[${i}]`)
        obj[i] = result.text
        if (result.warning) warnings.push(result.warning)
      } else if (typeof item === 'object') {
        sanitizeRecursive(item, questionLabel, warnings, path ? `${path}[${i}]` : `[${i}]`)
      }
    }
    return
  }

  if (typeof obj === 'object') {
    for (const key of Object.keys(obj)) {
      const val = obj[key]
      const nextPath = path ? `${path}.${key}` : key

      if (typeof val === 'string') {
        const result = sanitizeText(val, questionLabel, nextPath)
        obj[key] = result.text
        if (result.warning) warnings.push(result.warning)
      } else if (typeof val === 'object') {
        sanitizeRecursive(val, questionLabel, warnings, nextPath)
      }
    }
  }
}

function sanitizeText(
  text: string,
  questionLabel: string,
  fieldLabel: string,
): { text: string; warning?: string } {
  const original = text

  // 0. 保存 SVG 标签块（合法图形），清洗后还原
  const svgBlocks: string[] = []
  let cleaned = original.replace(SVG_BLOCK_RE, (match) => {
    const idx = svgBlocks.length
    svgBlocks.push(match)
    return `[[SVG_${idx}]]`
  })

  // 1. 检查 SVG 内部是否嵌入了危险标签
  for (let i = 0; i < svgBlocks.length; i++) {
    const dangerInSvg = svgBlocks[i].match(DANGEROUS_TAGS)
    if (dangerInSvg) {
      // SVG 内含恶意标签，移除该 SVG 块回退为占位提示
      svgBlocks[i] = ''
    }
  }

  // 2. 移除 <script>, <iframe>, <object>, <embed> 整标签
  cleaned = cleaned.replace(DANGEROUS_TAGS, '')

  // 3. 移除内联事件处理器 (onerror=..., onclick=...)
  cleaned = cleaned.replace(DANGEROUS_EVENTS, '')

  // 4. 移除 javascript: 协议
  cleaned = cleaned.replace(JAVASCRIPT_PROTOCOL, '')

  // 5. 移除剩余的所有 HTML 标签（<div>, <span>, <a> 等），只保留纯文本
  cleaned = cleaned.replace(REMAINING_TAGS, '')

  // 6. 还原合法的 SVG 块
  cleaned = cleaned.replace(/\[\[SVG_(\d+)\]\]/g, (_m, idx) => {
    return svgBlocks[parseInt(idx, 10)] || ''
  })

  // 解码常见的 HTML 实体，防止被利用
  cleaned = cleaned
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#x27;/gi, "'")
    .replace(/&#x2f;/gi, '/')
    .replace(/&#(\d+);/g, (_m, d) => String.fromCharCode(parseInt(d, 10)))
    .replace(/&#[xX]([0-9a-fA-F]+);/g, (_m, h) => String.fromCharCode(parseInt(h, 16)))

  // 检查是否有内容被移除
  const trimmed = cleaned.trim()
  if (original !== cleaned) {
    const removed = original.length - cleaned.length
    if (removed > 5) {
      return {
        text: trimmed,
        warning: `${questionLabel} 的 ${fieldLabel}：移除了 ${removed} 个不安全字符`,
      }
    }
  }

  return { text: trimmed }
}

/**
 * 串联处理：提取 → 解析 → 校验 → 清洗
 */
export function processMarkdownImport(md: string): ProcessResult {
  const errors: ValidationError[] = []
  const warnings: string[] = []
  const allQuestions: any[] = []
  let metadata: StandardPaperMetadata | null = null

  if (!md || typeof md !== 'string' || !md.trim()) {
    errors.push({ block: 0, message: 'Markdown 内容不能为空' })
    return { metadata: null, questions: [], errors, warnings }
  }

  // 1. 提取 JSON 代码块
  const blocks = extractJsonBlocks(md)
  if (blocks.length === 0) {
    errors.push({ block: 0, message: '未找到 JSON 代码块（需要 ```json ... ``` 格式）' })
    return { metadata: null, questions: [], errors, warnings }
  }
  if (blocks.length > 1) {
    errors.push({ block: 0, message: '标准导入 Markdown 只能包含一个完整 JSON 代码块' })
    return { metadata: null, questions: [], errors, warnings }
  }

  // 2. 逐个解析和校验
  for (const block of blocks) {
    let parsed: any
    try {
      parsed = JSON.parse(block.raw)
    } catch (e: any) {
      errors.push({ block: block.index, message: `第 ${block.index} 个 JSON 块解析失败：${e.message}` })
      continue
    }

    const validated = validateStandardPaperDocument(parsed)
    metadata = validated.metadata
    const questions = validated.questions
    const structErrors = validated.errors
    for (const e of structErrors) {
      errors.push({ block: block.index, message: `第 ${block.index} 个 JSON 块，${e.message}` })
    }

    if (structErrors.length > 0) continue

    // 安全清洗
    const { cleaned, warnings: sanitizeWarnings } = sanitizeQuestionContent(questions)
    allQuestions.push(...cleaned)
    warnings.push(...sanitizeWarnings)
  }

  if (allQuestions.length === 0 && errors.length === 0) {
    errors.push({ block: 0, message: '未能从 Markdown 中提取到有效的题目数据' })
  }

  return { metadata, questions: allQuestions, errors, warnings }
}
