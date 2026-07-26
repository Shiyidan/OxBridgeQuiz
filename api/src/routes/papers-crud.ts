
// 处理试卷列表、详情、更新、发布、删除与 PDF 访问。
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
import { createAsyncRouter } from '../utils/asyncRouter.js'
import { buildOperationAuditChanges, setOperationAuditContext } from '../middleware/operationAudit.js'
import {
  EXAM_TYPE,
  ESAT_MODULES,
  PAPER_ACCESS_TIER,
  PAPER_DELIVERY_MODE,
  QUESTION_BANK_PAPER_TYPES,
  REAL_PAPER_TYPES,
  TMUA_PAPER,
  USER_ROLE,
  isExamType,
  isPaperAccessTier,
  isPaperType,
  isRealPaperType,
  normalizePaperType,
  paperTypeWhereValues,
} from '../constants/domain.js'

import { RawSyllabusNode, FlatSyllabusNode, levelOf, parseSyllabusJson, getSyllabusRoots, normalizeSyllabusNodes, safeParseJson, parsePositiveInt, formatQuestionForAttempt, hasStudentPaperEntitlement, applySyllabusToTree } from './papers-shared.js'
export const paperCrudRouter = createAsyncRouter()

type PublishablePaper = {
  id: string
  examType: string
  paperType: string
  deliveryMode: string
  breakDurationSeconds: number
  moduleConfig: unknown
  totalQuestions: number
}

// 同一考试类型最多发布一套免费真题诊断卷，避免前端免费入口出现多份内容。
async function getFreeDiagnosticPaperConflict(
  paper: {
    id: string
    examType: string
    paperType: string
    accessTier: string
    status: string
  },
): Promise<{ id: string; title: string } | null> {
  if (
    paper.status !== 'published'
    || paper.accessTier !== PAPER_ACCESS_TIER.FREE
    || !isRealPaperType(paper.paperType)
  ) {
    return null
  }
  return prisma.paper.findFirst({
    where: {
      id: { not: paper.id },
      examType: paper.examType,
      paperType: { in: [...REAL_PAPER_TYPES] },
      accessTier: PAPER_ACCESS_TIER.FREE,
      status: 'published',
    },
    select: { id: true, title: true },
  })
}

// ESAT 与 TMUA 诊断发布前复核数据库结构，避免绕过上传校验发布扁平卷或残缺分段卷。
async function getDiagnosticPublishIssue(paper: PublishablePaper): Promise<string | null> {
  if (
    !isRealPaperType(paper.paperType)
    || (paper.examType !== EXAM_TYPE.ESAT && paper.examType !== EXAM_TYPE.TMUA)
  ) return null
  if (paper.deliveryMode !== PAPER_DELIVERY_MODE.MODULE_SEQUENCE) {
    return `${paper.examType} 诊断卷必须使用分段顺序作答模式`
  }
  if (paper.examType === EXAM_TYPE.ESAT && paper.breakDurationSeconds !== 180) {
    return 'ESAT 诊断卷的科目间休息必须为 180 秒'
  }
  if (paper.examType === EXAM_TYPE.TMUA && paper.breakDurationSeconds !== 0) {
    return 'TMUA Paper 1 与 Paper 2 之间不配置休息倒计时'
  }

  const modules = parseJsonField<Array<{
    code?: string
    order?: number
    durationSeconds?: number
    questionCount?: number
  }>>(paper.moduleConfig, [])
  modules.sort((left, right) => Number(left.order) - Number(right.order))
  const moduleCodes = modules.map((module) => String(module.code || ''))
  const moduleOrders = modules.map((module) => Number(module.order))
  const commonConfigInvalid = (
    !modules.length
    || new Set(moduleCodes).size !== modules.length
    || moduleOrders.some((order) => !Number.isInteger(order) || order < 1)
    || new Set(moduleOrders).size !== modules.length
    || modules.some((module) => !Number.isInteger(module.durationSeconds) || Number(module.durationSeconds) <= 0)
  )
  const esatConfigInvalid = paper.examType === EXAM_TYPE.ESAT && (
    modules.length !== 3
    || new Set(moduleCodes).size !== 3
    || moduleCodes.some((code) => !ESAT_MODULES.some((moduleCode) => moduleCode === code))
    || !moduleCodes.includes('maths1')
  )
  const tmuaConfigInvalid = paper.examType === EXAM_TYPE.TMUA && (
    modules.length !== 2
    || moduleCodes[0] !== TMUA_PAPER.PAPER_1
    || moduleOrders[0] !== 1
    || moduleCodes[1] !== TMUA_PAPER.PAPER_2
    || moduleOrders[1] !== 2
    || modules.some((module) => module.durationSeconds !== 75 * 60)
    || modules.some((module) => module.questionCount !== 20)
    || paper.totalQuestions !== 40
  )
  if (commonConfigInvalid) {
    return `${paper.examType} 诊断卷的分段代码、顺序和时长配置不完整`
  }
  if (esatConfigInvalid) {
    return 'ESAT 诊断卷必须包含三个不重复科目，并且包含 Mathematics 1'
  }
  if (tmuaConfigInvalid) {
    return 'TMUA 诊断卷必须按顺序包含 paper1、paper2，每卷 20 题且独立计时 75 分钟'
  }

  const questions = await prisma.question.findMany({
    where: { paperId: paper.id },
    select: { moduleCode: true, moduleOrder: true },
  })
  const configuredModules = new Set(modules.map((module) => `${module.code}:${module.order}`))
  if (
    questions.length !== paper.totalQuestions
    || !questions.length
    || questions.some((question) => !configuredModules.has(`${question.moduleCode}:${question.moduleOrder}`))
    || modules.some((module) => !questions.some((question) => (
      question.moduleCode === module.code && question.moduleOrder === module.order
    )))
    || modules.some((module) => questions.filter((question) => (
      question.moduleCode === module.code && question.moduleOrder === module.order
    )).length !== module.questionCount)
  ) {
    return `${paper.examType} 诊断卷题目必须完整归属于全部已配置分段`
  }
  return null
}

paperCrudRouter.get('/', requireAuth, requireAdmin, async (req, res) => {
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
      duration: true, totalQuestions: true, paperType: true, accessTier: true, status: true,
      deliveryMode: true, breakDurationSeconds: true, moduleConfig: true,
      assemblyType: true, remarks: true, createdAt: true
    },
    orderBy: { createdAt: 'desc' },
    skip,
    take: pageSize,
  })

  res.json(success({
    list: papers.map(({ moduleConfig, ...paper }) => ({
      ...paper,
      modules: parseJsonField(moduleConfig, []),
    })),
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
paperCrudRouter.get('/:id', requireAuth, async (req, res) => {
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
      accessTier: paper.accessTier,
      deliveryMode: paper.deliveryMode,
      breakDurationSeconds: paper.breakDurationSeconds,
      modules: parseJsonField(paper.moduleConfig, []),
      assemblyType: paper.assemblyType,
      remarks: paper.remarks,
      status: paper.status,
      createdAt: paper.createdAt,
      updatedAt: paper.updatedAt,
      questions: paper.deliveryMode === 'module_sequence'
        ? []
        : questions.map(formatQuestionForAttempt),
    }))
    return
  }

  res.json(success({
    ...paper,
    modules: parseJsonField(paper.moduleConfig, []),
    questions: questions.map(formatQuestionRow),
  }))
})

// 更新试卷
paperCrudRouter.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  const {
    title,
    code,
    examType,
    year,
    duration,
    questions,
    status,
    paperType,
    accessTier,
  } = req.body

  if (examType && !isExamType(examType)) {
    res.status(422).json(fail('无效的考试类型'))
    return
  }
  if (paperType && !isPaperType(paperType)) {
    res.status(422).json(fail('无效的试卷来源类型'))
    return
  }
  if (accessTier && !isPaperAccessTier(accessTier)) {
    res.status(422).json(fail('试卷访问级别必须为 free 或 member'))
    return
  }

  const previousPaper = await prisma.paper.findUnique({ where: { id: req.params.id } })
  if (!previousPaper) {
    res.status(404).json(fail('试卷不存在'))
    return
  }
  const nextStatus = status || previousPaper.status
  if (nextStatus === 'published' && questions) {
    res.status(422).json(fail('请先以草稿状态保存题目结构，再单独发布试卷', 'PAPER_STRUCTURE_INVALID'))
    return
  }
  if (nextStatus === 'published') {
    const publishIssue = await getDiagnosticPublishIssue({
      ...previousPaper,
      examType: examType || previousPaper.examType,
      paperType: paperType ? normalizePaperType(paperType) : previousPaper.paperType,
    })
    if (publishIssue) {
      res.status(422).json(fail(publishIssue, 'PAPER_STRUCTURE_INVALID'))
      return
    }
    const freeConflict = await getFreeDiagnosticPaperConflict({
      ...previousPaper,
      examType: examType || previousPaper.examType,
      paperType: paperType ? normalizePaperType(paperType) : previousPaper.paperType,
      accessTier: accessTier || previousPaper.accessTier,
      status: nextStatus,
    })
    if (freeConflict) {
      res.status(409).json(fail(
        `${freeConflict.title} 已是 ${examType || previousPaper.examType} 免费诊断卷，请先将其调整为会员卷`,
        'FREE_DIAGNOSTIC_PAPER_EXISTS',
      ))
      return
    }
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
      ...(accessTier && { accessTier }),
    },
  })

  if (questions) {
    await syncPaperQuestions(paper.id, questions)
  }

  setOperationAuditContext(req, {
    summary: `修改试卷“${paper.title}”`,
    changes: buildOperationAuditChanges(
      {
        title: previousPaper.title,
        code: previousPaper.code,
        examType: previousPaper.examType,
        year: previousPaper.year,
        duration: previousPaper.duration,
        totalQuestions: previousPaper.totalQuestions,
        status: previousPaper.status,
        paperType: previousPaper.paperType,
        accessTier: previousPaper.accessTier,
      },
      {
        title: paper.title,
        code: paper.code,
        examType: paper.examType,
        year: paper.year,
        duration: paper.duration,
        totalQuestions: paper.totalQuestions,
        status: paper.status,
        paperType: paper.paperType,
        accessTier: paper.accessTier,
      },
    ),
  })
  res.json(success(paper))
})

// 删除试卷
paperCrudRouter.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  const previousPaper = await prisma.paper.findUnique({
    where: { id: req.params.id },
    include: {
      _count: {
        select: {
          questionsRel: true,
          parseTasks: true,
          examRecords: true,
        },
      },
    },
  })
  if (!previousPaper) {
    res.status(404).json(fail('试卷不存在'))
    return
  }
  if (previousPaper._count.examRecords > 0) {
    res.status(409).json(fail(
      '该试卷已有学生诊断记录，不能删除；请将试卷状态改为“已归档”',
      'PAPER_HAS_DIAGNOSTIC_HISTORY',
    ))
    return
  }

  try {
    // Paper 外键负责级联删除直属题目和解析任务，单条删除保证数据库操作原子性。
    await prisma.paper.delete({ where: { id: req.params.id } })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      res.status(409).json(fail(
        '该试卷已产生关联业务数据，不能删除；请刷新列表后改为“已归档”',
        'PAPER_DELETE_CONFLICT',
      ))
      return
    }
    throw error
  }
  setOperationAuditContext(req, {
    summary: `删除试卷“${previousPaper.title}”`,
    changes: buildOperationAuditChanges(
      {
        record: {
          title: previousPaper.title,
          code: previousPaper.code,
          examType: previousPaper.examType,
          year: previousPaper.year,
          paperType: previousPaper.paperType,
          status: previousPaper.status,
          questionCount: previousPaper._count.questionsRel,
          parseTaskCount: previousPaper._count.parseTasks,
        },
      },
      { record: null },
    ),
  })
  res.json(success({
    id: previousPaper.id,
    deletedQuestions: previousPaper._count.questionsRel,
    deletedParseTasks: previousPaper._count.parseTasks,
  }))
})


// 发布试卷
paperCrudRouter.put('/:id/publish', requireAuth, requireAdmin, async (req, res) => {
  const previousPaper = await prisma.paper.findUnique({ where: { id: req.params.id } })
  if (!previousPaper) {
    res.status(404).json(fail('试卷不存在'))
    return
  }
  const publishIssue = await getDiagnosticPublishIssue(previousPaper)
  if (publishIssue) {
    res.status(422).json(fail(publishIssue, 'PAPER_STRUCTURE_INVALID'))
    return
  }
  const freeConflict = await getFreeDiagnosticPaperConflict({
    ...previousPaper,
    status: 'published',
  })
  if (freeConflict) {
    res.status(409).json(fail(
      `${freeConflict.title} 已是 ${previousPaper.examType} 免费诊断卷，请先将其调整为会员卷`,
      'FREE_DIAGNOSTIC_PAPER_EXISTS',
    ))
    return
  }
  const paper = await prisma.paper.update({
    where: { id: req.params.id },
    data: { status: 'published' },
  })
  setOperationAuditContext(req, {
    summary: `发布试卷“${paper.title}”`,
    changes: buildOperationAuditChanges(
      { status: previousPaper.status },
      { status: paper.status },
    ),
  })
  res.json(success(paper))
})

// 下载原始PDF
paperCrudRouter.get('/:id/pdf', requireAuth, async (req, res) => {
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
