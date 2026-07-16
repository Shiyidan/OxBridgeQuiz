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

export const papersRouter = Router()

type RawSyllabusNode = {
  code?: unknown
  label?: unknown
  name?: unknown
  title?: unknown
  children?: unknown
}

type FlatSyllabusNode = {
  code: string
  label: string
  parentCode: string | null
  order: number
}

function levelOf(d: string | null | undefined): string | null {
  return typeof d === 'string' && d ? d : null
}

// 试卷列表
function parseSyllabusJson(input: unknown): unknown {
  if (typeof input !== 'string') return input
  try {
    return JSON.parse(input)
  } catch {
    throw new Error('考纲 JSON 格式不正确')
  }
}

function getSyllabusRoots(input: unknown): RawSyllabusNode[] {
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

function normalizeSyllabusNodes(input: unknown): FlatSyllabusNode[] {
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

function safeParseJson(value: unknown): unknown {
  return parseJsonField<unknown>(value, null)
}

function parsePositiveInt(value: unknown, fallback: number, max?: number): number {
  const parsed = Number.parseInt(String(value ?? ''), 10)
  const safeValue = Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
  return max ? Math.min(safeValue, max) : safeValue
}

// 学生作答数据不得提前下发正确答案或题目解析，完整结构仅供管理员预览和交卷后报告使用。
function formatQuestionForAttempt(row: any) {
  return {
    ...formatQuestionRow(row),
    answer: [],
    learning_analysis: undefined,
  }
}

// 学生试卷访问统一受试卷类型和会员权益约束，调用方另行隐藏未发布资源的存在性。
async function hasStudentPaperEntitlement(
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

async function applySyllabusToTree(syllabus: { id: string; examType: string; sourceJson: unknown }) {
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

papersRouter.get('/', requireAuth, requireAdmin, async (req, res) => {
  const page = parsePositiveInt(req.query.page, 1)
  const pageSize = parsePositiveInt(req.query.pageSize ?? req.query.limit, 20, 100)
  const paperType = typeof req.query.paperType === 'string' ? req.query.paperType : undefined
  const examType = typeof req.query.examType === 'string' ? req.query.examType : undefined
  const keyword = typeof req.query.keyword === 'string' ? req.query.keyword.trim() : ''
  const where: Record<string, unknown> = {}
  const paperTypeValues = paperType ? paperTypeWhereValues(paperType) : []
  if (paperTypeValues.length > 0) where.paperType = { in: paperTypeValues }
  if (examType && isExamType(examType)) where.examType = examType
  if (keyword) where.title = { contains: keyword }

  const total = await prisma.paper.count({ where })
  const totalPages = Math.ceil(total / pageSize)
  const safePage = totalPages > 0 ? Math.min(page, totalPages) : 1
  const skip = (safePage - 1) * pageSize

  const papers = await prisma.paper.findMany({
    where,
    select: {
      id: true, title: true, code: true, examType: true, year: true,
      duration: true, totalQuestions: true, paperType: true, status: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' },
    skip,
    take: pageSize,
  })

  res.json(success({
    list: papers,
    pagination: {
      page: safePage,
      pageSize,
      total,
      totalPages,
      hasPrev: safePage > 1,
      hasNext: totalPages > 0 && safePage < totalPages,
    },
  }))
})

// JSON 导入试卷
papersRouter.post('/import-json', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { code } = req.body
    const validated = validateStandardPaperDocument(req.body)
    if (validated.errors.length > 0 || !validated.metadata) {
      res.status(400).json(fail(`校验失败：${validated.errors.map(e => e.message).join('；')}`))
      return
    }
    const { metadata, questions } = validated

    const paper = await prisma.paper.create({
      data: {
        id: createNumericId(),
        title: metadata.paperName,
        year: metadata.year,
        duration: metadata.duration,
        code: code || undefined,
        examType: metadata.examType,
        paperType: metadata.paperType,
        totalQuestions: questions.length,
        status: 'draft',
        questions: [],
      },
    })

    await syncPaperQuestions(paper.id, questions)
    const savedQuestions = await getPaperQuestions(paper.id)

    res.json(success({
      ...paper,
      questions: savedQuestions.map(formatQuestionRow),
    }))
  } catch (e: any) {
    console.error('Import JSON error:', e)
    res.status(500).json(fail(e.message || '导入失败'))
  }
})

// Markdown 导入试卷
papersRouter.post('/import-markdown', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { markdown, code } = req.body

    if (!markdown || typeof markdown !== 'string') {
      res.status(400).json(fail('请提供 Markdown 内容'))
      return
    }

    const result = processMarkdownImport(markdown)

    if (result.errors.length > 0 || !result.metadata) {
      res.status(400).json(fail(`校验失败：${result.errors.map(e => e.message).join('；')}`))
      return
    }

    if (result.questions.length === 0) {
      res.status(400).json(fail('未能从 Markdown 中提取到有效的题目数据'))
      return
    }

    const paper = await prisma.paper.create({
      data: {
        id: createNumericId(),
        title: result.metadata.paperName,
        year: result.metadata.year,
        duration: result.metadata.duration,
        code: code || undefined,
        examType: result.metadata.examType,
        paperType: result.metadata.paperType,
        totalQuestions: result.questions.length,
        status: 'draft',
        questions: [],
      },
    })

    await syncPaperQuestions(paper.id, result.questions)
    const savedQuestions = await getPaperQuestions(paper.id)

    res.json(success({
      ...paper,
      questions: savedQuestions.map(formatQuestionRow),
      warnings: result.warnings,
    }))
  } catch (e: any) {
    console.error('Import markdown error:', e)
    res.status(500).json(fail(e.message || '导入失败'))
  }
})

// 考纲树
papersRouter.get('/syllabus-library', requireAuth, requireAdmin, async (_req, res) => {
  try {
    const items = await prisma.syllabus.findMany({
      select: {
        id: true,
        name: true,
        examType: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json(success(items))
  } catch (e: any) {
    res.status(500).json(fail(e.message || '获取考纲列表失败'))
  }
})

papersRouter.post('/syllabus-library', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, examType, content } = req.body
    if (!name || typeof name !== 'string') {
      res.status(400).json(fail('考纲名称不能为空'))
      return
    }
    if (!isExamType(examType)) {
      res.status(422).json(fail('无效的考试类型'))
      return
    }

    const parsed = parseSyllabusJson(content) as Prisma.InputJsonValue
    normalizeSyllabusNodes(parsed)

    const item = await prisma.syllabus.create({
      data: {
        name: name.trim(),
        examType,
        sourceJson: parsed,
      },
      select: {
        id: true,
        name: true,
        examType: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    res.json(success(item))
  } catch (e: any) {
    res.status(400).json(fail(e.message || '上传考纲失败'))
  }
})

papersRouter.get('/syllabus-library/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const item = await prisma.syllabus.findUnique({ where: { id: req.params.id } })
    if (!item) {
      res.status(404).json(fail('考纲不存在'))
      return
    }

    res.json(success({
      id: item.id,
      name: item.name,
      examType: item.examType,
      isActive: item.isActive,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      content: safeParseJson(item.sourceJson),
    }))
  } catch (e: any) {
    res.status(500).json(fail(e.message || '获取考纲详情失败'))
  }
})

papersRouter.put('/syllabus-library/:id/enable', requireAuth, requireAdmin, async (req, res) => {
  try {
    const item = await prisma.syllabus.findUnique({ where: { id: req.params.id } })
    if (!item) {
      res.status(404).json(fail('考纲不存在'))
      return
    }

    await applySyllabusToTree(item)
    res.json(success({ id: item.id, isActive: true }))
  } catch (e: any) {
    res.status(400).json(fail(e.message || '启用考纲失败'))
  }
})

papersRouter.put('/syllabus-library/:id/disable', requireAuth, requireAdmin, async (req, res) => {
  try {
    const item = await prisma.syllabus.findUnique({ where: { id: req.params.id } })
    if (!item) {
      res.status(404).json(fail('考纲不存在'))
      return
    }

    await prisma.$transaction(async (tx) => {
      await tx.syllabus.update({
        where: { id: item.id },
        data: { isActive: false },
      })
      if (item.isActive) {
        await tx.syllabusNode.deleteMany({ where: { examType: item.examType } })
      }
    })

    res.json(success({ id: item.id, isActive: false }))
  } catch (e: any) {
    res.status(400).json(fail(e.message || '停用考纲失败'))
  }
})

papersRouter.get('/syllabus', async (req, res) => {
  try {
    const examType = (req.query.examType as string) || EXAM_TYPE.TMUA
    if (!isExamType(examType)) {
      res.status(422).json(fail('无效的考试类型'))
      return
    }
    const nodes = await prisma.syllabusNode.findMany({
      where: { examType },
      orderBy: { order: 'asc' },
    })
    const nodeMap = new Map<string, any>()
    const roots: any[] = []
    for (const n of nodes) {
      nodeMap.set(n.code, { code: n.code, label: n.label, children: [] })
    }
    for (const n of nodes) {
      const treeNode = nodeMap.get(n.code)!
      if (n.parentCode && nodeMap.has(n.parentCode)) {
        nodeMap.get(n.parentCode)!.children.push(treeNode)
      } else {
        roots.push(treeNode)
      }
    }
    const cleanEmptyChildren = (list: any[]) => {
      for (const item of list) {
        if (item.children.length === 0) delete item.children
        else cleanEmptyChildren(item.children)
      }
    }
    cleanEmptyChildren(roots)

    res.json(success(roots))
  } catch (e: any) {
    res.status(500).json(fail(e.message || '获取考纲失败'))
  }
})

// 收集考纲节点及其所有子孙 code
async function collectDescendantCodes(code: string, examType: string): Promise<string[]> {
  const allNodes = await prisma.syllabusNode.findMany({ where: { examType } })
  const childCodes = new Set<string>([code])
  let prevSize = 0
  while (childCodes.size > prevSize) {
    prevSize = childCodes.size
    for (const n of allNodes) {
      if (n.parentCode && childCodes.has(n.parentCode)) childCodes.add(n.code)
    }
  }
  return [...childCodes]
}

async function hasSyllabusTree(examType: string): Promise<boolean> {
  const count = await prisma.syllabusNode.count({ where: { examType } })
  return count > 0
}

// 试题库轻量摘要
papersRouter.get('/question-bank/summary', async (req, res) => {
  try {
    const code = req.query.code as string | undefined
    const examType = (req.query.examType as string) || EXAM_TYPE.TMUA
    if (!isExamType(examType)) {
      res.status(422).json(fail('无效的考试类型'))
      return
    }
    if (!(await hasSyllabusTree(examType))) {
      res.json(success({
        total: 0,
        difficultyCount: { easy: 0, medium: 0, hard: 0, composite: 0 },
      }))
      return
    }
    const filterCodes = code ? await collectDescendantCodes(code, examType) : []

    const questions = await prisma.question.findMany({
      where: {
        examType,
        paper: { status: 'published', paperType: { in: [...QUESTION_BANK_PAPER_TYPES] } },
      },
      select: { difficulty: true, knowledgePoints: true, subjectCode: true, topicCode: true },
    })

    const diffCount: Record<string, number> = { easy: 0, medium: 0, hard: 0, composite: 0 }
    let total = 0

    for (const q of questions) {
      const level = levelOf(q.difficulty)
      if (!level || !['easy', 'medium', 'hard', 'composite'].includes(level)) continue

      if (filterCodes.length && !matchSyllabusFilter(q, filterCodes)) continue

      diffCount[level]++
      total++
    }

    res.json(success({ total, difficultyCount: diffCount }))
  } catch (e: any) {
    res.status(500).json(fail(e.message || '获取摘要失败'))
  }
})

/** 检查题目的 knowledge_points / subjectCode / topicCode 中是否有匹配的考纲 code */
function matchSyllabusFilter(
  q: { knowledgePoints?: unknown; subjectCode?: string | null; topicCode?: string | null },
  filterCodes: string[],
): boolean {
  // knowledgePoints
  const kps = parseJsonArray<{ code?: string }>(q.knowledgePoints)
  if (kps.some((kp: any) => kp.code && filterCodes.includes(kp.code))) return true
  // subjectCode / topicCode（subject / topic 层级 code）
  if (q.subjectCode && filterCodes.includes(q.subjectCode)) return true
  if (q.topicCode && filterCodes.includes(q.topicCode)) return true
  return false
}

// 试题库 — 获取已发布考卷的全部题目
papersRouter.get('/question-bank', requireAuth, async (req, res) => {
  try {
    const difficulty = req.query.difficulty as string | undefined
    const subject = req.query.subject as string | undefined
    const code = req.query.code as string | undefined
    const examType = (req.query.examType as string) || EXAM_TYPE.TMUA
    if (!isExamType(examType)) {
      res.status(422).json(fail('无效的考试类型'))
      return
    }
    if (!(await hasSyllabusTree(examType))) {
      res.json(success({
        questions: [],
        total: 0,
        difficultyCount: { easy: 0, medium: 0, hard: 0, composite: 0 },
        subjects: [],
      }))
      return
    }

    const where: any = {
      examType,
      paper: { status: 'published', paperType: { in: [...QUESTION_BANK_PAPER_TYPES] } },
    }
    if (subject) where.subject = subject

    const questions = await prisma.question.findMany({
      where,
      orderBy: [{ paperId: 'asc' }, { number: 'asc' }],
      include: { paper: { select: { id: true, title: true, year: true } } },
    })

    const filterCodes = code ? await collectDescendantCodes(code, examType) : []
    const isFiltered = !!(difficulty || subject || code)
    const diffCount: Record<string, number> = { easy: 0, medium: 0, hard: 0, composite: 0 }
    const subjects = new Set<string>()
    const allQuestions: any[] = []

    for (const q of questions) {
      const level = levelOf(q.difficulty)
      if (!level || !['easy', 'medium', 'hard', 'composite'].includes(level)) continue
      if (difficulty && level !== difficulty) continue

      if (filterCodes.length && !matchSyllabusFilter(q, filterCodes)) continue

      diffCount[level] = (diffCount[level] || 0) + 1
      if (!isFiltered && q.subject) subjects.add(q.subject)

      allQuestions.push({
        ...formatQuestionForAttempt(q),
        _paperId: q.paper.id,
        _paperTitle: q.paper.title,
        _paperYear: q.paper.year,
      })
    }

    if (allQuestions.length > 0) {
      const entitlement = await checkMemberAccess(
        req.user!.userId,
        'question-bank',
        examType,
        allQuestions.length,
      )
      if (!entitlement.allowed) {
        res.status(403).json(fail('当前题库额度不足，请开通会员后继续', 'QUESTION_BANK_ACCESS_DENIED'))
        return
      }
    }

    res.json(success({
      questions: allQuestions,
      total: allQuestions.length,
      difficultyCount: diffCount,
      ...(isFiltered ? {} : { subjects: [...subjects] }),
    }))
  } catch (e: any) {
    console.error('Question bank error:', e)
    res.status(500).json(fail(e.message || '获取试题库失败'))
  }
})

// 诊断测试列表按试卷聚合当前用户的最新测试与报告状态。
papersRouter.get('/assessment/papers', requireAuth, async (req, res) => {
  try {
    const [papers, records, currentReports] = await Promise.all([
      prisma.paper.findMany({
        where: { status: 'published', paperType: { in: [...REAL_PAPER_TYPES] } },
        select: {
          id: true,
          title: true,
          code: true,
          examType: true,
          year: true,
          duration: true,
          totalQuestions: true,
          paperType: true,
          createdAt: true,
        },
        orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
      }),
      prisma.examRecord.findMany({
        where: {
          userId: req.user!.userId,
          paper: { paperType: { in: [...REAL_PAPER_TYPES] }, status: 'published' },
        },
        select: {
          id: true,
          paperId: true,
          status: true,
          totalQuestions: true,
          correctCount: true,
          startedAt: true,
          expiresAt: true,
          submittedAt: true,
          durationSeconds: true,
          _count: {
            select: { answers: { where: { selectedAnswer: { not: null } } } },
          },
          diagnosticReportTask: {
            select: { status: true, stage: true, progress: true, errorMessage: true },
          },
        },
        orderBy: { startedAt: 'desc' },
      }),
      prisma.diagnosticReport.findMany({
        where: {
          userId: req.user!.userId,
          paper: { paperType: { in: [...REAL_PAPER_TYPES] }, status: 'published' },
        },
        select: { paperId: true, examRecordId: true, generationMode: true, completedAt: true },
      }),
    ])

    const latestRecordMap = new Map<string, (typeof records)[number]>()
    for (const record of records) {
      if (!latestRecordMap.has(record.paperId)) latestRecordMap.set(record.paperId, record)
    }
    const currentReportMap = new Map(currentReports.map((report) => [report.paperId, report]))

    res.json(success({
      list: papers.map((paper) => {
        const record = latestRecordMap.get(paper.id)
        const currentReport = currentReportMap.get(paper.id)
        const testStatus = record?.status === 'in_progress'
          ? 'in_progress'
          : record?.status === 'submitted'
            ? 'completed'
            : 'not_started'
        const reportStatus = record?.status === 'submitted'
          ? record.diagnosticReportTask?.status
            || (currentReport?.examRecordId === record.id ? 'completed' : 'not_generated')
          : null

        return {
          id: paper.id,
          paperId: paper.id,
          paperName: paper.title,
          title: paper.title,
          code: paper.code,
          examType: paper.examType,
          year: paper.year,
          duration: paper.duration,
          totalQuestions: paper.totalQuestions,
          paperType: paper.paperType,
          testStatus,
          examRecordId: record?.id || null,
          answeredCount: record?._count.answers || 0,
          correctCount: record?.status === 'submitted' ? record.correctCount : null,
          startedAt: record?.startedAt || null,
          expiresAt: record?.expiresAt || null,
          submittedAt: record?.submittedAt || null,
          durationSeconds: record?.status === 'submitted' ? record.durationSeconds : null,
          reportStatus,
          reportStage: record?.diagnosticReportTask?.stage || null,
          reportProgress: record?.diagnosticReportTask?.progress
            ?? (currentReport?.examRecordId === record?.id ? 100 : 0),
          reportErrorMessage: record?.diagnosticReportTask?.errorMessage || null,
          hasReport: Boolean(currentReport),
          reportExamRecordId: currentReport?.examRecordId || null,
          generationMode: currentReport?.generationMode || null,
          reportCompletedAt: currentReport?.completedAt || null,
        }
      }),
    }))
  } catch (e: any) {
    console.error('Assessment papers error:', e)
    res.status(500).json(fail(e.message || '获取诊断测试套卷失败'))
  }
})

// 试卷详情
papersRouter.get('/:id', requireAuth, async (req, res) => {
  const paper = await prisma.paper.findUnique({ where: { id: req.params.id } })
  if (!paper) {
    res.status(404).json(fail('试卷不存在'))
    return
  }
  const questions = await getPaperQuestions(paper.id)

  if (req.user!.role !== USER_ROLE.ADMIN) {
    if (paper.status !== 'published') {
      res.status(404).json(fail('试卷不存在'))
      return
    }

    if (!(await hasStudentPaperEntitlement(req.user!.userId, paper, questions.length))) {
      res.status(403).json(fail('当前无权访问该试卷', 'PAPER_ACCESS_DENIED'))
      return
    }

    res.json(success({
      id: paper.id,
      title: paper.title,
      code: paper.code,
      examType: paper.examType,
      year: paper.year,
      duration: paper.duration,
      totalQuestions: paper.totalQuestions,
      paperType: paper.paperType,
      status: paper.status,
      createdAt: paper.createdAt,
      updatedAt: paper.updatedAt,
      questions: questions.map(formatQuestionForAttempt),
    }))
    return
  }

  res.json(success({
    ...paper,
    questions: questions.map(formatQuestionRow),
  }))
})

// 更新试卷
papersRouter.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  const { title, code, examType, year, duration, questions, status, paperType } = req.body

  if (examType && !isExamType(examType)) {
    res.status(422).json(fail('无效的考试类型'))
    return
  }
  if (paperType && !isPaperType(paperType)) {
    res.status(422).json(fail('无效的试卷来源类型'))
    return
  }

  const paper = await prisma.paper.update({
    where: { id: req.params.id },
    data: {
      ...(title && { title }),
      ...(code !== undefined && { code }),
      ...(examType && { examType }),
      ...(year && { year }),
      ...(duration && { duration }),
      ...(questions && { totalQuestions: questions.length }),
      ...(status && { status }),
      ...(paperType && { paperType: normalizePaperType(paperType) }),
    },
  })

  if (questions) {
    await syncPaperQuestions(paper.id, questions)
  }

  res.json(success(paper))
})

// 删除试卷
papersRouter.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  await prisma.paper.delete({ where: { id: req.params.id } })
  res.json(success(null))
})

// 发布试卷
papersRouter.put('/:id/publish', requireAuth, requireAdmin, async (req, res) => {
  const paper = await prisma.paper.update({
    where: { id: req.params.id },
    data: { status: 'published' },
  })
  res.json(success(paper))
})

// 下载原始PDF
papersRouter.get('/:id/pdf', requireAuth, async (req, res) => {
  const paper = await prisma.paper.findUnique({ where: { id: req.params.id } })
  if (!paper?.pdfUrl) {
    res.status(404).json(fail('PDF暂不可用，OSS 尚未接入'))
    return
  }
  if (req.user!.role !== USER_ROLE.ADMIN) {
    if (paper.status !== 'published') {
      res.status(404).json(fail('PDF暂不可用'))
      return
    }
    if (!(await hasStudentPaperEntitlement(req.user!.userId, paper, paper.totalQuestions))) {
      res.status(403).json(fail('当前无权访问该试卷', 'PAPER_ACCESS_DENIED'))
      return
    }
  }
  if (paper.pdfUrl.startsWith('http')) {
    res.redirect(paper.pdfUrl)
  } else {
    res.status(404).json(fail('PDF暂不可用，OSS 尚未接入'))
  }
})
