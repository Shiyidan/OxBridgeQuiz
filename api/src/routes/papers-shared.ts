
// 汇总试卷子路由共用的参数解析、考纲同步与学生访问规则。
import { Router } from 'express'
import { Prisma } from '@prisma/client'
import { prisma } from '../services/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { requireAdmin } from '../middleware/admin.js'
import { success, fail } from '../utils/response.js'
import { syncPaperQuestions, getPaperQuestions, formatQuestionRow } from '../utils/questionSync.js'
import { parseJsonArray, parseJsonField } from '../utils/jsonField.js'
import { createNumericId } from '../utils/id.js'
import { processMarkdownImport, validateStandardPaperDocument } from '../services/markdownValidator.js'
import { checkMemberAccess } from '../services/member.js'
import {
  EXAM_TYPE,
  QUESTION_BANK_PAPER_TYPES,
  REAL_PAPER_TYPES,
  USER_ROLE,
  isExamType,
  isPaperType,
  isRealPaperType,
  normalizePaperType,
  paperTypeWhereValues,
} from '../constants/domain.js'


export type RawSyllabusNode = {
  code?: unknown
  label?: unknown
  name?: unknown
  title?: unknown
  children?: unknown
}

export type FlatSyllabusNode = {
  code: string
  label: string
  parentCode: string | null
  order: number
}

export function levelOf(d: string | null | undefined): string | null {
  return typeof d === 'string' && d ? d : null
}

// 试卷列表
export function parseSyllabusJson(input: unknown): unknown {
  if (typeof input !== 'string') return input
  try {
    return JSON.parse(input)
  } catch {
    throw new Error('考纲 JSON 格式不正确')
  }
}

export function getSyllabusRoots(input: unknown): RawSyllabusNode[] {
  if (Array.isArray(input)) return input as RawSyllabusNode[]
  if (!input || typeof input !== 'object') throw new Error('考纲内容必须是树形 JSON')
  const obj = input as Record<string, unknown>
  if (Array.isArray(obj.nodes)) return obj.nodes as RawSyllabusNode[]
  if (Array.isArray(obj.syllabus)) return obj.syllabus as RawSyllabusNode[]
  if (Array.isArray(obj.tree)) return obj.tree as RawSyllabusNode[]
  if (Array.isArray(obj.children)) return obj.children as RawSyllabusNode[]
  if ('code' in obj && ('label' in obj || 'name' in obj || 'title' in obj)) {
    return [obj as RawSyllabusNode]
  }
  throw new Error('考纲内容缺少节点数组')
}

export function normalizeSyllabusNodes(input: unknown): FlatSyllabusNode[] {
  const roots = getSyllabusRoots(input)
  const flat: FlatSyllabusNode[] = []
  const seen = new Set<string>()

  function visit(node: RawSyllabusNode, parentCode: string | null, order: number): void {
    const code = typeof node.code === 'string' ? node.code.trim() : ''
    const labelSource = node.label ?? node.name ?? node.title
    const label = typeof labelSource === 'string' ? labelSource.trim() : ''
    if (!code || !label) throw new Error('考纲节点必须包含 code 和 label')
    if (seen.has(code)) throw new Error(`考纲节点编码重复：${code}`)
    seen.add(code)
    flat.push({ code, label, parentCode, order })

    if (node.children === undefined) return
    if (!Array.isArray(node.children)) throw new Error(`节点 ${code} 的 children 必须是数组`)
    node.children.forEach((child, index) => visit(child as RawSyllabusNode, code, index))
  }

  roots.forEach((node, index) => visit(node, null, index))
  if (!flat.length) throw new Error('考纲至少需要一个节点')
  return flat
}

export function safeParseJson(value: unknown): unknown {
  return parseJsonField<unknown>(value, null)
}

export function parsePositiveInt(value: unknown, fallback: number, max?: number): number {
  const parsed = Number.parseInt(String(value ?? ''), 10)
  const safeValue = Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
  return max ? Math.min(safeValue, max) : safeValue

}

// 学生作答数据不得提前下发正确答案或题目解析，完整结构仅供管理员预览和交卷后报告使用。
export function formatQuestionForAttempt(row: any) {
  const question = formatQuestionRow(row)
  const contentBlocks: Array<Record<string, unknown>> = Array.isArray(question.content_blocks)
    ? question.content_blocks.flatMap((block: any): Array<Record<string, unknown>> => {
        if (block?.type === 'paragraph' && typeof block.text === 'string') {
          return [{ type: 'paragraph', text: block.text }]
        }
        if (block?.type === 'image_ref' && typeof block.image_id === 'string') {
          return [{
            type: 'image_ref',
            image_id: block.image_id,
            ...(typeof block.alt === 'string' ? { alt: block.alt } : {}),
          }]
        }
        return []
      })
    : []
  const options = Array.isArray(question.options)
    ? question.options.map((option: any) => ({
        label: typeof option?.label === 'string' ? option.label : '',
        text: typeof option?.text === 'string' ? option.text : '',
        ...(typeof option?.image_id === 'string' ? { image_id: option.image_id } : {}),
      }))
    : []
  const images: Array<Record<string, unknown>> = Array.isArray(question.images)
    ? question.images.flatMap((image: any): Array<Record<string, unknown>> => {
        if (image?.type === 'svg' && typeof image.svg === 'string') {
          return [{
            id: String(image.id || ''),
            type: 'svg',
            svg: image.svg,
            alt: typeof image.alt === 'string' ? image.alt : '',
          }]
        }
        if (image?.type === 'image' && typeof image.src === 'string') {
          return [{
            id: String(image.id || ''),
            type: 'image',
            src: image.src,
            alt: typeof image.alt === 'string' ? image.alt : '',
          }]
        }
        return []
      })
    : []
  const knowledgePoints = Array.isArray(question.knowledge_points)
    ? question.knowledge_points.map((point: any) => ({
        code: typeof point?.code === 'string' ? point.code : '',
        label: typeof point?.label === 'string' ? point.label : '',
        ...(typeof point?.role === 'string' ? { role: point.role } : {}),
      }))
    : []
  const syllabusPoints = Array.isArray(question.syllabus_points)
    ? question.syllabus_points.map((point: any) => ({
        code: typeof point?.code === 'string' ? point.code : '',
        label: typeof point?.label === 'string' ? point.label : '',
      }))
    : []

  // 作答态按白名单投影，嵌套对象中的解析、正确标记或生成器私有字段一律不下发。
  return {
    id: question.id,
    uniqueCode: question.uniqueCode,
    code: question.code,
    number: question.number,
    module_code: question.module_code,
    module_order: question.module_order,
    module_question_number: question.module_question_number,
    component_code: question.component_code,
    component_order: question.component_order,
    component_question_number: question.component_question_number,
    title: question.title,
    content_blocks: contentBlocks,
    options,
    images,
    examType: question.examType,
    source_examType: question.source_examType,
    year: question.year,
    question_type: question.question_type,
    difficulty: question.difficulty,
    subject: question.subject,
    subject_code: question.subject_code,
    topic: question.topic,
    topic_code: question.topic_code,
    knowledge_points: knowledgePoints,
    syllabus_points: syllabusPoints,
  }
}

// 学生试卷访问统一受试卷类型和会员权益约束，调用方另行隐藏未发布资源的存在性。
export async function hasStudentPaperEntitlement(
  userId: string,
  paper: { paperType: string; examType: string },
  questionCount: number,
): Promise<boolean> {
  const normalizedPaperType = normalizePaperType(paper.paperType)
  const action = isRealPaperType(normalizedPaperType)
    ? 'diagnostic'
    : QUESTION_BANK_PAPER_TYPES.includes(normalizedPaperType as any)
      ? 'question-bank'
      : null
  if (!action) return false

  const entitlement = await checkMemberAccess(
    userId,
    action,
    paper.examType,
    action === 'diagnostic' ? 1 : Math.max(1, questionCount),
  )
  return entitlement.allowed
}

export async function applySyllabusToTree(syllabus: { id: string; examType: string; sourceJson: unknown }) {
  const content = parseSyllabusJson(syllabus.sourceJson)
  const nodes = normalizeSyllabusNodes(content)

  await prisma.$transaction(async (tx) => {
    await tx.syllabus.updateMany({
      where: { examType: syllabus.examType },
      data: { isActive: false },
    })
    await tx.syllabus.update({
      where: { id: syllabus.id },
      data: { isActive: true },
    })
    await tx.syllabusNode.deleteMany({ where: { examType: syllabus.examType } })
    await tx.syllabusNode.createMany({
      data: nodes.map((node) => ({
        code: node.code,
        label: node.label,
        examType: syllabus.examType,
        parentCode: node.parentCode,
        order: node.order,
      })),
    })
  })
}
