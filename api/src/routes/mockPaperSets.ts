// 模考试卷库路由：提供管理员套卷草稿列表、Excel 导入、详情校验和单题替换。
import multer from 'multer'
import { Prisma } from '@prisma/client'
import { requireAuth } from '../middleware/auth.js'
import { requireAdmin } from '../middleware/admin.js'
import { setOperationAuditContext } from '../middleware/operationAudit.js'
import {
  MOCK_PAPER_STATUS,
  PAPER_ACCESS_TIER,
  isPaperAccessTier,
} from '../constants/domain.js'
import { prisma } from '../services/prisma.js'
import {
  MockPaperWorkbookError,
  archiveMockPaperSet,
  createMockPaperDraftsFromWorkbook,
  parseMockPaperWorkbook,
  publishMockPaperSet,
  revalidateMockPaperSet,
} from '../services/mockPaperLibrary.js'
import { createAsyncRouter } from '../utils/asyncRouter.js'
import { fail, success } from '../utils/response.js'
import { parseJsonArray } from '../utils/jsonField.js'
import { parsePositiveInt } from './papers-shared.js'

export const mockPaperSetRouter = createAsyncRouter()

const workbookUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1, fields: 4 },
})

mockPaperSetRouter.use(requireAuth, requireAdmin)

// 上传文件名只作为后台追溯信息，不允许路径或控制字符进入数据库。
function normalizeWorkbookFileName(value: string): string {
  return value
    .replace(/[\\/\u0000-\u001f\u007f]+/g, '_')
    .trim()
    .slice(0, 255)
}

// 列表响应只返回管理页首屏所需的汇总信息，模块和题目明细按需读取。
function formatMockPaperSetListItem(row: {
  id: string
  code: string
  sequenceNo: number
  examType: string
  title: string
  accessTier: string
  status: string
  version: number
  sourceFileName: string | null
  paperId: string | null
  validationStatus: string
  issueCount: number
  questionCount: number
  updatedAt: Date
  publishedAt: Date | null
  archivedAt: Date | null
  _count: { modules: number }
}) {
  return {
    id: row.id,
    code: row.code,
    sequenceNo: row.sequenceNo,
    examType: row.examType,
    title: row.title,
    accessTier: row.accessTier,
    status: row.status,
    version: row.version,
    sourceFileName: row.sourceFileName,
    paperId: row.paperId,
    validationStatus: row.validationStatus,
    issueCount: row.issueCount,
    questionCount: row.questionCount,
    moduleCount: row._count.modules,
    updatedAt: row.updatedAt.toISOString(),
    publishedAt: row.publishedAt?.toISOString() || null,
    archivedAt: row.archivedAt?.toISOString() || null,
  }
}

// 管理首页卡片只读取总套卷数，避免加载套卷和题目明细。
mockPaperSetRouter.get('/stats', async (_req, res) => {
  const [total, validDrafts] = await Promise.all([
    prisma.mockPaperSet.count(),
    prisma.mockPaperSet.count({ where: { status: 'draft', validationStatus: 'valid' } }),
  ])
  res.json(success({ total, validDrafts }))
})

// 模考试卷库列表支持考试、状态和名称编号检索。
mockPaperSetRouter.get('/', async (req, res) => {
  const page = parsePositiveInt(req.query.page, 1)
  const pageSize = parsePositiveInt(req.query.pageSize, 20, 100)
  const examType = String(req.query.examType || '').trim().toUpperCase()
  const status = String(req.query.status || '').trim()
  const keyword = String(req.query.keyword || '').trim()
  const where: Prisma.MockPaperSetWhereInput = {
    ...(examType ? { examType } : {}),
    ...(status ? { status } : {}),
    ...(keyword
      ? { OR: [{ title: { contains: keyword } }, { code: { contains: keyword } }] }
      : {}),
  }
  const total = await prisma.mockPaperSet.count({ where })
  const totalPages = Math.ceil(total / pageSize)
  const safePage = totalPages > 0 ? Math.min(page, totalPages) : 1
  const rows = await prisma.mockPaperSet.findMany({
    where,
    orderBy: [{ examType: 'asc' }, { sequenceNo: 'desc' }, { version: 'desc' }],
    skip: (safePage - 1) * pageSize,
    take: pageSize,
    include: { _count: { select: { modules: true } } },
  })
  res.json(
    success({
      list: rows.map(formatMockPaperSetListItem),
      pagination: {
        page: safePage,
        pageSize,
        total,
        totalPages,
        hasPrev: safePage > 1,
        hasNext: totalPages > 0 && safePage < totalPages,
      },
    }),
  )
})

// 套卷详情按模块和题序返回，并附带题库题目的只读预览摘要。
mockPaperSetRouter.get('/:id', async (req, res) => {
  const row = await prisma.mockPaperSet.findUnique({
    where: { id: req.params.id },
    include: {
      modules: {
        orderBy: { moduleOrder: 'asc' },
        include: {
          questions: {
            orderBy: { position: 'asc' },
            include: {
              question: {
                select: {
                  id: true,
                  uniqueCode: true,
                  title: true,
                  status: true,
                  examType: true,
                  subject: true,
                  subjectCode: true,
                  difficulty: true,
                  questionType: true,
                },
              },
            },
          },
        },
      },
    },
  })
  if (!row) {
    res.status(404).json(fail('模考试卷不存在', 'MOCK_PAPER_SET_NOT_FOUND'))
    return
  }
  res.json(
    success({
      id: row.id,
      code: row.code,
      sequenceNo: row.sequenceNo,
      examType: row.examType,
      title: row.title,
      accessTier: row.accessTier,
      status: row.status,
      version: row.version,
      sourceFileName: row.sourceFileName,
      paperId: row.paperId,
      validationStatus: row.validationStatus,
      issueCount: row.issueCount,
      questionCount: row.questionCount,
      issues: parseJsonArray<string>(row.issues),
      updatedAt: row.updatedAt.toISOString(),
      publishedAt: row.publishedAt?.toISOString() || null,
      archivedAt: row.archivedAt?.toISOString() || null,
      modules: row.modules.map((module) => ({
        id: module.id,
        code: module.code,
        label: module.label,
        order: module.moduleOrder,
        durationSeconds: module.durationSeconds,
        expectedQuestionCount: module.expectedQuestionCount,
        questionCount: module.questionCount,
        issueCount: module.issueCount,
        issues: parseJsonArray<string>(module.issues),
        questions: module.questions.map((item) => ({
          id: item.id,
          position: item.position,
          sourceCode: item.sourceCode,
          validationStatus: item.validationStatus,
          issues: parseJsonArray<string>(item.issues),
          question: item.question,
        })),
      })),
    }),
  )
})

// Excel 上传先保存为草稿并全量复核，题目缺失时仍保留可修正的定位结果。
mockPaperSetRouter.post('/import', workbookUpload.single('file'), async (req, res) => {
  const file = req.file
  if (!file) {
    res.status(400).json(fail('请选择模考组卷 Excel', 'MOCK_PAPER_FILE_REQUIRED'))
    return
  }
  if (!file.originalname.toLowerCase().endsWith('.xlsx')) {
    res.status(422).json(fail('模考组卷文件仅支持 .xlsx', 'MOCK_PAPER_FILE_INVALID'))
    return
  }
  const accessTier = String(req.body.accessTier || PAPER_ACCESS_TIER.MEMBER).trim()
  if (!isPaperAccessTier(accessTier)) {
    res.status(422).json(fail('访问级别必须为免费卷或会员卷', 'MOCK_PAPER_ACCESS_INVALID'))
    return
  }

  try {
    const parsedSets = await parseMockPaperWorkbook(file.buffer)
    const fileName = normalizeWorkbookFileName(file.originalname)
    const createdIds = await createMockPaperDraftsFromWorkbook(
      parsedSets,
      fileName,
      accessTier,
    )
    const rows = await prisma.mockPaperSet.findMany({
      where: { id: { in: createdIds } },
      include: { _count: { select: { modules: true } } },
      orderBy: [{ examType: 'asc' }, { sequenceNo: 'asc' }],
    })
    setOperationAuditContext(req, {
      resourceId: createdIds[0],
      summary: `上传模考组卷清单“${fileName}”，生成 ${createdIds.length} 套草稿`,
      changes: { createdIds: { before: null, after: createdIds } },
    })
    res.status(201).json(success({ list: rows.map(formatMockPaperSetListItem) }))
  } catch (error) {
    if (error instanceof MockPaperWorkbookError) {
      res
        .status(422)
        .json(fail(error.issues.join('\n'), 'MOCK_PAPER_WORKBOOK_INVALID'))
      return
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      res
        .status(409)
        .json(fail('套卷编号发生冲突，请刷新列表后重新上传', 'MOCK_PAPER_SEQUENCE_CONFLICT'))
      return
    }
    throw error
  }
})

// 草稿可调整名称和访问级别；已发布卷只允许切换访问级别并同步运行试卷。
mockPaperSetRouter.put('/:id', async (req, res) => {
  const current = await prisma.mockPaperSet.findUnique({
    where: { id: req.params.id },
    include: { paper: { select: { id: true } } },
  })
  if (!current) {
    res.status(404).json(fail('模考试卷不存在', 'MOCK_PAPER_SET_NOT_FOUND'))
    return
  }
  if (current.status === MOCK_PAPER_STATUS.ARCHIVED) {
    res.status(409).json(fail('已下线模考卷不能修改', 'MOCK_PAPER_SET_LOCKED'))
    return
  }
  const title = req.body.title === undefined ? current.title : String(req.body.title).trim()
  const accessTier =
    req.body.accessTier === undefined ? current.accessTier : String(req.body.accessTier).trim()
  if (!title) {
    res.status(422).json(fail('套卷名称不能为空', 'MOCK_PAPER_TITLE_REQUIRED'))
    return
  }
  if (title.length > 255) {
    res.status(422).json(fail('套卷名称不能超过 255 个字符', 'MOCK_PAPER_TITLE_TOO_LONG'))
    return
  }
  if (!isPaperAccessTier(accessTier)) {
    res.status(422).json(fail('访问级别必须为免费卷或会员卷', 'MOCK_PAPER_ACCESS_INVALID'))
    return
  }
  if (current.status === MOCK_PAPER_STATUS.PUBLISHED && title !== current.title) {
    res.status(409).json(fail('已发布模考卷请创建新版本后修改名称', 'MOCK_PAPER_SET_LOCKED'))
    return
  }
  if (current.status === MOCK_PAPER_STATUS.PUBLISHED && !current.paper) {
    res.status(409).json(fail('已发布模考卷缺少运行试卷，无法更新访问级别', 'MOCK_PAPER_RUNTIME_MISSING'))
    return
  }
  const updated = await prisma.$transaction(async (tx) => {
    const nextSet = await tx.mockPaperSet.update({
      where: { id: current.id },
      data: { title, accessTier },
    })
    if (current.status === MOCK_PAPER_STATUS.PUBLISHED && current.paper) {
      await tx.paper.update({
        where: { id: current.paper.id },
        data: { accessTier },
      })
    }
    return nextSet
  })
  setOperationAuditContext(req, {
    resourceId: current.id,
    summary: `修改模考卷“${updated.title}”`,
    changes: {
      title: { before: current.title, after: updated.title },
      accessTier: { before: current.accessTier, after: updated.accessTier },
    },
  })
  res.json(success({ id: updated.id, title: updated.title, accessTier: updated.accessTier }))
})

// 单题替换保留模块位置，写入新题号后立即全量复核当前套卷。
mockPaperSetRouter.put('/:id/questions/:itemId', async (req, res) => {
  const sourceCode = String(req.body.questionCode || '').trim()
  if (!sourceCode) {
    res.status(422).json(fail('替换题号不能为空', 'MOCK_PAPER_QUESTION_CODE_REQUIRED'))
    return
  }
  if (sourceCode.length > 191) {
    res
      .status(422)
      .json(fail('替换题号不能超过 191 个字符', 'MOCK_PAPER_QUESTION_CODE_TOO_LONG'))
    return
  }
  const item = await prisma.mockPaperQuestion.findFirst({
    where: { id: req.params.itemId, module: { mockPaperSetId: req.params.id } },
    include: { module: { include: { mockPaperSet: true } } },
  })
  if (!item) {
    res.status(404).json(fail('待替换题目不存在', 'MOCK_PAPER_QUESTION_NOT_FOUND'))
    return
  }
  if (item.module.mockPaperSet.status !== MOCK_PAPER_STATUS.DRAFT) {
    res.status(409).json(fail('已发布模考卷请创建新版本后替换题目', 'MOCK_PAPER_SET_LOCKED'))
    return
  }
  await prisma.mockPaperQuestion.update({
    where: { id: item.id },
    data: {
      sourceCode,
      questionId: null,
      validationStatus: 'invalid',
      issues: ['正在重新校验'],
    },
  })
  await revalidateMockPaperSet(req.params.id)
  setOperationAuditContext(req, {
    resourceId: req.params.id,
    summary: `替换模考卷“${item.module.mockPaperSet.title}”中的题目`,
    changes: { questionCode: { before: item.sourceCode, after: sourceCode } },
  })
  res.json(success({ id: item.id, previousCode: item.sourceCode, questionCode: sourceCode }))
})

// 管理员可以主动重跑校验，以便题库题目发布或归档后刷新草稿状态。
mockPaperSetRouter.post('/:id/validate', async (req, res) => {
  const current = await prisma.mockPaperSet.findUnique({ where: { id: req.params.id } })
  if (!current) {
    res.status(404).json(fail('模考试卷不存在', 'MOCK_PAPER_SET_NOT_FOUND'))
    return
  }
  await revalidateMockPaperSet(current.id)
  const updated = await prisma.mockPaperSet.findUnique({ where: { id: current.id } })
  res.json(
    success({
      id: current.id,
      validationStatus: updated!.validationStatus,
      issueCount: updated!.issueCount,
    }),
  )
})

// 校验通过的草稿发布为学生端可见套卷，并创建答卷与报告所需的运行载体。
mockPaperSetRouter.post('/:id/publish', async (req, res) => {
  try {
    const result = await publishMockPaperSet(req.params.id)
    setOperationAuditContext(req, {
      resourceId: result.id,
      summary: '发布模考试卷',
      changes: { status: { before: MOCK_PAPER_STATUS.DRAFT, after: result.status } },
    })
    res.json(success({
      ...result,
      publishedAt: result.publishedAt.toISOString(),
    }))
  } catch (error) {
    const code = error instanceof Error ? error.message : ''
    if (code === 'MOCK_PAPER_SET_NOT_FOUND') {
      res.status(404).json(fail('模考试卷不存在', code))
      return
    }
    if (code === 'MOCK_PAPER_SET_ARCHIVED') {
      res.status(409).json(fail('已下线模考卷不能重新发布，请创建新版本', code))
      return
    }
    if (code === 'MOCK_PAPER_SET_INVALID') {
      res.status(422).json(fail('整卷校验未通过，请处理全部问题后发布', code))
      return
    }
    throw error
  }
})

// 下线后学生目录不再提供新开始，既有答卷与报告继续有效。
mockPaperSetRouter.post('/:id/archive', async (req, res) => {
  try {
    const result = await archiveMockPaperSet(req.params.id)
    setOperationAuditContext(req, {
      resourceId: result.id,
      summary: '下线模考试卷',
      changes: { status: { before: MOCK_PAPER_STATUS.PUBLISHED, after: result.status } },
    })
    res.json(success({ ...result, archivedAt: result.archivedAt.toISOString() }))
  } catch (error) {
    const code = error instanceof Error ? error.message : ''
    if (code === 'MOCK_PAPER_SET_NOT_FOUND') {
      res.status(404).json(fail('模考试卷不存在', code))
      return
    }
    if (code === 'MOCK_PAPER_SET_NOT_PUBLISHED') {
      res.status(409).json(fail('只有已发布模考卷可以下线', code))
      return
    }
    throw error
  }
})

// 只有尚未发布的草稿可以删除，避免未来接入答卷后破坏历史。
mockPaperSetRouter.delete('/:id', async (req, res) => {
  const current = await prisma.mockPaperSet.findUnique({ where: { id: req.params.id } })
  if (!current) {
    res.status(404).json(fail('模考试卷不存在', 'MOCK_PAPER_SET_NOT_FOUND'))
    return
  }
  if (current.status !== MOCK_PAPER_STATUS.DRAFT) {
    res.status(409).json(fail('已发布模考卷不能删除，请改为下线', 'MOCK_PAPER_SET_LOCKED'))
    return
  }
  await prisma.mockPaperSet.delete({ where: { id: current.id } })
  setOperationAuditContext(req, {
    resourceId: current.id,
    summary: `删除模考卷草稿“${current.title}”`,
  })
  res.json(success({ id: current.id }))
})
