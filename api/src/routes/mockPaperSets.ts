// 模考试卷库路由：提供管理员套卷草稿列表、Excel 导入、详情校验和单题替换。
import multer from 'multer'
import { Prisma } from '@prisma/client'
import { requireAuth } from '../middleware/auth.js'
import { requireAdmin } from '../middleware/admin.js'
import { setOperationAuditContext } from '../middleware/operationAudit.js'
import {
  MOCK_PAPER_STATUS,
  MOCK_PAPER_VALIDATION_STATUS,
  PAPER_ACCESS_TIER,
  isPaperAccessTier,
} from '../constants/domain.js'
import { prisma } from '../services/prisma.js'
import {
  MOCK_PAPER_MODULE_POOL_CAPACITY,
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

// Multer/Busboy 可能把 UTF-8 文件名按 Latin-1 解析；仅在字节可安全还原时修复中文名称。
function decodeWorkbookFileName(value: string): string {
  if ([...value].some((character) => (character.codePointAt(0) || 0) > 255)) return value
  const decoded = Buffer.from(value, 'latin1').toString('utf8')
  return decoded.includes('\uFFFD') ? value : decoded
}

// 上传文件名只作为后台追溯信息，不允许路径或控制字符进入数据库。
function normalizeWorkbookFileName(value: string): string {
  return decodeWorkbookFileName(value)
    .replace(/[\\/\u0000-\u001f\u007f]+/g, '_')
    .trim()
    .slice(0, 255)
}

// 后台 Module 池允许 ESAT 收纳全部五科；实际开考仍从中冻结符合要求的三科组合。
function getModulePoolCapacity(examType: string): number {
  return MOCK_PAPER_MODULE_POOL_CAPACITY[
    examType as keyof typeof MOCK_PAPER_MODULE_POOL_CAPACITY
  ] || 0
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
  readyModuleCount: number
  fullExamReady: boolean
  updatedAt: Date
  publishedAt: Date | null
  archivedAt: Date | null
  modules: Array<{
    code: string
    label: string
    validationStatus: string
  }>
  paper: { _count: { examRecords: number } } | null
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
    sourceFileName: row.sourceFileName ? normalizeWorkbookFileName(row.sourceFileName) : null,
    paperId: row.paperId,
    validationStatus: row.validationStatus,
    issueCount: row.issueCount,
    questionCount: row.questionCount,
    readyModuleCount: row.readyModuleCount,
    fullExamReady: row.fullExamReady,
    moduleCount: row._count.modules,
    modules: row.modules,
    deletable:
      (row.status === MOCK_PAPER_STATUS.DRAFT && !row.paperId)
      || (
        row.status === MOCK_PAPER_STATUS.PUBLISHED
        && !row.fullExamReady
        && (row.paper?._count.examRecords || 0) === 0
      ),
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
    include: {
      paper: { select: { _count: { select: { examRecords: true } } } },
      modules: {
        orderBy: { moduleOrder: 'asc' },
        select: { code: true, label: true, validationStatus: true },
      },
      _count: { select: { modules: true } },
    },
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

// 单项视图按 Module/Paper 分页，并携带所属 Mock 与完整套卷状态。
mockPaperSetRouter.get('/modules', async (req, res) => {
  const page = parsePositiveInt(req.query.page, 1)
  const pageSize = parsePositiveInt(req.query.pageSize, 20, 100)
  const examType = String(req.query.examType || '').trim().toUpperCase()
  const status = String(req.query.status || '').trim()
  const keyword = String(req.query.keyword || '').trim()
  const parentWhere: Prisma.MockPaperSetWhereInput = {
    ...(examType ? { examType } : {}),
    ...(status ? { status } : {}),
  }
  const where: Prisma.MockPaperModuleWhereInput = {
    mockPaperSet: parentWhere,
    ...(keyword
      ? {
          OR: [
            { code: { contains: keyword } },
            { label: { contains: keyword } },
            { mockPaperSet: { title: { contains: keyword } } },
            { mockPaperSet: { code: { contains: keyword } } },
          ],
        }
      : {}),
  }
  const total = await prisma.mockPaperModule.count({ where })
  const totalPages = Math.ceil(total / pageSize)
  const safePage = totalPages > 0 ? Math.min(page, totalPages) : 1
  const rows = await prisma.mockPaperModule.findMany({
    where,
    orderBy: [{ updatedAt: 'desc' }, { moduleOrder: 'asc' }],
    skip: (safePage - 1) * pageSize,
    take: pageSize,
    include: {
      mockPaperSet: {
        select: {
          id: true,
          code: true,
          title: true,
          sequenceNo: true,
          examType: true,
          accessTier: true,
          status: true,
          version: true,
          fullExamReady: true,
        },
      },
    },
  })
  res.json(
    success({
      list: rows.map((row) => ({
        id: row.id,
        code: row.code,
        label: row.label,
        order: row.moduleOrder,
        durationSeconds: row.durationSeconds,
        expectedQuestionCount: row.expectedQuestionCount,
        questionCount: row.questionCount,
        validationStatus: row.validationStatus,
        issueCount: row.issueCount,
        updatedAt: row.updatedAt.toISOString(),
        mockPaperSet: row.mockPaperSet,
      })),
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
      paper: { select: { status: true } },
      modules: {
        orderBy: { moduleOrder: 'asc' },
        include: {
          _count: { select: { composedCopies: true } },
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
      sourceFileName: row.sourceFileName ? normalizeWorkbookFileName(row.sourceFileName) : null,
      paperId: row.paperId,
      validationStatus: row.validationStatus,
      issueCount: row.issueCount,
      questionCount: row.questionCount,
      readyModuleCount: row.readyModuleCount,
      fullExamReady: row.fullExamReady,
      canAddModules:
        row.status !== MOCK_PAPER_STATUS.ARCHIVED
        && row.modules.length < getModulePoolCapacity(row.examType)
        && row.modules.every((module) => module._count.composedCopies === 0),
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
        validationStatus: module.validationStatus,
        issueCount: module.issueCount,
        published:
          row.status === MOCK_PAPER_STATUS.PUBLISHED
          && row.paper?.status === 'published'
          && module.validationStatus === MOCK_PAPER_VALIDATION_STATUS.VALID,
        removable:
          row.status === MOCK_PAPER_STATUS.DRAFT
          && row.modules.length > 1
          && module._count.composedCopies === 0,
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

// 候选列表只返回尚未组成其他套卷、校验通过且与当前考试和缺失模块兼容的单项卷。
mockPaperSetRouter.get('/:id/module-candidates', async (req, res) => {
  const target = await prisma.mockPaperSet.findUnique({
    where: { id: req.params.id },
    include: {
      modules: {
        select: {
          code: true,
          _count: { select: { composedCopies: true } },
        },
      },
    },
  })
  if (!target) {
    res.status(404).json(fail('模考试卷不存在', 'MOCK_PAPER_SET_NOT_FOUND'))
    return
  }
  if (
    target.status === MOCK_PAPER_STATUS.ARCHIVED
    || target.modules.length >= getModulePoolCapacity(target.examType)
    || target.modules.some((module) => module._count.composedCopies > 0)
  ) {
    res.json(success({ list: [] }))
    return
  }

  const existingCodes = target.modules.map((module) => module.code)
  const candidates = await prisma.mockPaperModule.findMany({
    where: {
      mockPaperSetId: { not: target.id },
      sourceModuleId: null,
      validationStatus: MOCK_PAPER_VALIDATION_STATUS.VALID,
      composedCopies: { none: {} },
      ...(existingCodes.length ? { code: { notIn: existingCodes } } : {}),
      mockPaperSet: {
        is: {
          examType: target.examType,
          status: { not: MOCK_PAPER_STATUS.ARCHIVED },
        },
      },
    },
    include: {
      mockPaperSet: {
        select: {
          id: true,
          code: true,
          sequenceNo: true,
          title: true,
          status: true,
          accessTier: true,
          _count: { select: { modules: true } },
        },
      },
    },
    orderBy: [{ moduleOrder: 'asc' }, { createdAt: 'desc' }],
  })

  res.json(success({
    list: candidates
      .filter((module) => module.mockPaperSet._count.modules === 1)
      .map((module) => ({
        id: module.id,
        code: module.code,
        label: module.label,
        durationSeconds: module.durationSeconds,
        questionCount: module.questionCount,
        sourceSet: {
          id: module.mockPaperSet.id,
          code: module.mockPaperSet.code,
          sequenceNo: module.mockPaperSet.sequenceNo,
          title: module.mockPaperSet.title,
          status: module.mockPaperSet.status,
          accessTier: module.mockPaperSet.accessTier,
        },
      })),
  }))
})

// 选择单项卷时复制其稳定题序到当前套卷，并保留来源关联以防同一单项被重复组套。
mockPaperSetRouter.post('/:id/modules', async (req, res) => {
  const sourceModuleId = String(req.body.sourceModuleId || '').trim()
  if (!sourceModuleId) {
    res.status(422).json(fail('请选择要加入的单项卷', 'MOCK_PAPER_SOURCE_MODULE_REQUIRED'))
    return
  }
  const [target, source] = await Promise.all([
    prisma.mockPaperSet.findUnique({
      where: { id: req.params.id },
      include: {
        paper: { select: { _count: { select: { examRecords: true } } } },
        modules: {
          select: {
            code: true,
            _count: { select: { composedCopies: true } },
          },
        },
      },
    }),
    prisma.mockPaperModule.findUnique({
      where: { id: sourceModuleId },
      include: {
        _count: { select: { composedCopies: true } },
        mockPaperSet: {
          include: { _count: { select: { modules: true } } },
        },
        questions: { orderBy: { position: 'asc' } },
      },
    }),
  ])
  if (!target) {
    res.status(404).json(fail('模考试卷不存在', 'MOCK_PAPER_SET_NOT_FOUND'))
    return
  }
  if (target.status === MOCK_PAPER_STATUS.ARCHIVED) {
    res.status(409).json(fail('已下线模考卷不能继续组套', 'MOCK_PAPER_SET_LOCKED'))
    return
  }
  if (
    target.modules.length >= getModulePoolCapacity(target.examType)
    || target.modules.some((module) => module._count.composedCopies > 0)
  ) {
    res.status(409).json(fail('当前套卷不能继续添加单项卷', 'MOCK_PAPER_COMPOSITION_LOCKED'))
    return
  }
  if (
    !source
    || source.mockPaperSetId === target.id
    || source.sourceModuleId
    || source._count.composedCopies > 0
    || source.mockPaperSet._count.modules !== 1
    || source.mockPaperSet.status === MOCK_PAPER_STATUS.ARCHIVED
    || source.mockPaperSet.examType !== target.examType
    || source.validationStatus !== MOCK_PAPER_VALIDATION_STATUS.VALID
  ) {
    res.status(409).json(fail('该单项卷已被使用或当前不可加入套卷', 'MOCK_PAPER_MODULE_UNAVAILABLE'))
    return
  }
  if (target.modules.some((module) => module.code === source.code)) {
    res.status(409).json(fail('当前套卷已包含同类型 Module/Paper', 'MOCK_PAPER_MODULE_DUPLICATED'))
    return
  }

  try {
    const created = await prisma.mockPaperModule.create({
      data: {
        mockPaperSetId: target.id,
        sourceModuleId: source.id,
        code: source.code,
        label: source.label,
        moduleOrder: source.moduleOrder,
        durationSeconds: source.durationSeconds,
        expectedQuestionCount: source.expectedQuestionCount,
        questionCount: source.questionCount,
        validationStatus: source.validationStatus,
        issueCount: source.issueCount,
        issues: source.issues as Prisma.InputJsonValue,
        questions: {
          create: source.questions.map((question) => ({
            questionId: question.questionId,
            sourceCode: question.sourceCode,
            position: question.position,
            validationStatus: question.validationStatus,
            issues: question.issues as Prisma.InputJsonValue,
          })),
        },
      },
    })
    await revalidateMockPaperSet(target.id)
    setOperationAuditContext(req, {
      resourceId: target.id,
      summary: `向模考试卷“${target.title}”加入单项卷“${source.mockPaperSet.title}”`,
      changes: { sourceModuleId: { before: null, after: source.id } },
    })
    res.status(201).json(success({ id: created.id, sourceModuleId: source.id }))
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      res.status(409).json(fail('该单项卷刚刚已被其他套卷使用，请重新选择', 'MOCK_PAPER_MODULE_UNAVAILABLE'))
      return
    }
    throw error
  }
})

// 草稿套卷允许移除未被其他套卷引用的 Module，同时至少保留一个基础 Module。
mockPaperSetRouter.delete('/:id/modules/:moduleId', async (req, res) => {
  const module = await prisma.mockPaperModule.findFirst({
    where: {
      id: req.params.moduleId,
      mockPaperSetId: req.params.id,
    },
    include: {
      _count: { select: { composedCopies: true } },
      mockPaperSet: { include: { _count: { select: { modules: true } } } },
    },
  })
  if (!module) {
    res.status(404).json(fail('套卷中的单项卷不存在', 'MOCK_PAPER_MODULE_NOT_FOUND'))
    return
  }
  if (module.mockPaperSet.status !== MOCK_PAPER_STATUS.DRAFT) {
    res.status(409).json(fail('只有草稿套卷可以移除单项卷', 'MOCK_PAPER_SET_LOCKED'))
    return
  }
  if (module.mockPaperSet._count.modules <= 1) {
    res.status(409).json(fail('草稿套卷至少需要保留一个单项卷', 'MOCK_PAPER_MODULE_REQUIRED'))
    return
  }
  if (module._count.composedCopies > 0) {
    res.status(409).json(fail('该单项卷正在被其他套卷使用，暂时不能移除', 'MOCK_PAPER_MODULE_IN_USE'))
    return
  }

  await prisma.mockPaperModule.delete({ where: { id: module.id } })
  await revalidateMockPaperSet(module.mockPaperSetId)
  setOperationAuditContext(req, {
    resourceId: module.mockPaperSetId,
    summary: `从模考试卷“${module.mockPaperSet.title}”移除单项卷“${module.label}”`,
    changes: {
      removedModuleId: { before: module.id, after: null },
      sourceModuleId: { before: module.sourceModuleId, after: null },
    },
  })
  res.json(success({ id: module.id, sourceModuleId: module.sourceModuleId }))
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
      include: {
        paper: { select: { _count: { select: { examRecords: true } } } },
        modules: {
          orderBy: { moduleOrder: 'asc' },
          select: { code: true, label: true, validationStatus: true },
        },
        _count: { select: { modules: true } },
      },
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

// 草稿可替换任意位置；已发布 Mock 只允许继续修复尚未通过的 Module/Paper。
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
  const canRepairPublishedModule = (
    item.module.mockPaperSet.status === MOCK_PAPER_STATUS.PUBLISHED
    && item.module.validationStatus !== MOCK_PAPER_VALIDATION_STATUS.VALID
  )
  if (
    item.module.mockPaperSet.status !== MOCK_PAPER_STATUS.DRAFT
    && !canRepairPublishedModule
  ) {
    res.status(409).json(fail(
      '已发布且可用的 Module/Paper 已锁定；如需调整请创建新版本',
      'MOCK_PAPER_SET_LOCKED',
    ))
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
      readyModuleCount: updated!.readyModuleCount,
      fullExamReady: updated!.fullExamReady,
    }),
  )
})

// 至少一个模块可用的草稿即可发布；完整模考是否可见继续使用独立派生结果。
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
    if (code === 'MOCK_PAPER_SET_NO_READY_MODULES') {
      res.status(422).json(fail('当前没有可用于单项模考的 Module/Paper，请先处理模块问题', code))
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

// 套卷草稿可删除；若单项曾开放，则必须没有历史答卷并同步下架其运行载体。
mockPaperSetRouter.delete('/:id', async (req, res) => {
  const current = await prisma.mockPaperSet.findUnique({
    where: { id: req.params.id },
    include: {
      paper: { select: { _count: { select: { examRecords: true } } } },
      modules: { select: { _count: { select: { composedCopies: true } } } },
    },
  })
  if (!current) {
    res.status(404).json(fail('模考试卷不存在', 'MOCK_PAPER_SET_NOT_FOUND'))
    return
  }
  const isSuiteDraft = current.status === MOCK_PAPER_STATUS.DRAFT
    || (current.status === MOCK_PAPER_STATUS.PUBLISHED && !current.fullExamReady)
  if (!isSuiteDraft) {
    res.status(409).json(fail('已发布的完整套卷不能删除，请改为下线', 'MOCK_PAPER_SET_LOCKED'))
    return
  }
  if ((current.paper?._count.examRecords || 0) > 0) {
    res.status(409).json(fail('该草稿已有单项考试记录，不能直接删除', 'MOCK_PAPER_SET_HAS_RECORDS'))
    return
  }
  if (current.modules.some((module) => module._count.composedCopies > 0)) {
    res.status(409).json(fail('该单项卷已用于完整套卷，不能删除', 'MOCK_PAPER_MODULE_IN_USE'))
    return
  }
  await prisma.$transaction(async (tx) => {
    if (current.paperId) {
      await tx.paper.update({ where: { id: current.paperId }, data: { status: 'archived' } })
    }
    await tx.mockPaperSet.delete({ where: { id: current.id } })
  })
  setOperationAuditContext(req, {
    resourceId: current.id,
    summary: `删除模考卷草稿“${current.title}”`,
  })
  res.json(success({ id: current.id }))
})
