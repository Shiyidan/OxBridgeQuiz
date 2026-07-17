
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
  QUESTION_BANK_PAPER_TYPES,
  REAL_PAPER_TYPES,
  USER_ROLE,
  isExamType,
  isPaperType,
  isRealPaperType,
  normalizePaperType,
  paperTypeWhereValues,
} from '../constants/domain.js'

import { RawSyllabusNode, FlatSyllabusNode, levelOf, parseSyllabusJson, getSyllabusRoots, normalizeSyllabusNodes, safeParseJson, parsePositiveInt, formatQuestionForAttempt, hasStudentPaperEntitlement, applySyllabusToTree } from './papers-shared.js'
export const paperCrudRouter = createAsyncRouter()

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
paperCrudRouter.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  const { title, code, examType, year, duration, questions, status, paperType } = req.body

  if (examType && !isExamType(examType)) {
    res.status(422).json(fail('无效的考试类型'))
    return
  }
  if (paperType && !isPaperType(paperType)) {
    res.status(422).json(fail('无效的试卷来源类型'))
    return
  }

  const previousPaper = await prisma.paper.findUnique({ where: { id: req.params.id } })
  if (!previousPaper) {
    res.status(404).json(fail('试卷不存在'))
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
      },
    ),
  })
  res.json(success(paper))
})

// 删除试卷
paperCrudRouter.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  const previousPaper = await prisma.paper.findUnique({ where: { id: req.params.id } })
  if (!previousPaper) {
    res.status(404).json(fail('试卷不存在'))
    return
  }
  await prisma.paper.delete({ where: { id: req.params.id } })
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
        },
      },
      { record: null },
    ),
  })
  res.json(success(null))
})


// 发布试卷
paperCrudRouter.put('/:id/publish', requireAuth, requireAdmin, async (req, res) => {
  const previousPaper = await prisma.paper.findUnique({ where: { id: req.params.id } })
  if (!previousPaper) {
    res.status(404).json(fail('试卷不存在'))
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
