// 模考试卷库路由：提供管理员套卷草稿列表、Excel 导入、详情校验和单题替换。
import multer from 'multer'
import { Prisma } from '@prisma/client'
import { requireAuth } from '../middleware/auth.js'
import { requireAdmin } from '../middleware/admin.js'
import { setOperationAuditContext } from '../middleware/operationAudit.js'
import {
  MOCK_PAPER_MODULE_STATUS,
  MOCK_PAPER_STATUS,
  MOCK_PAPER_VALIDATION_STATUS,
  PAPER_ACCESS_TIER,
  isPaperAccessTier,
} from '../constants/domain.js'
import { prisma } from '../services/prisma.js'
import {
  MOCK_PAPER_MODULE_POOL_CAPACITY,
  MockPaperWorkbookError,
  archiveMockPaperModule,
  archiveMockPaperSet,
  composeMockPaperSetFromModules,
  createMockPaperDraftsFromWorkbook,
  parseMockPaperWorkbook,
  publishMockPaperModule,
  publishMockPaperSet,
  revalidateMockPaperSet,
} from '../services/mockPaperLibrary.js'
import { createAsyncRouter } from '../utils/asyncRouter.js'
import { fail, success } from '../utils/response.js'
import { parseJsonArray } from '../utils/jsonField.js'
import { parsePositiveInt } from './papers-shared.js'
import { formatMockPaperModuleTitle } from '../utils/mockPaperTitle.js'
import {
  canClaimMockPaperSource,
  canDeleteMockPaperSet,
  canEditMockPaperComposition,
  deriveMockPaperReadiness,
} from '../utils/mockPaperState.js'
import { MOCK_PAPER_UPLOAD_STATUS } from '../constants/mockPaperUploads.js'
import {
  deleteMockPaperWorkbook,
  ensureMockPaperWorkbookAvailable,
  storeMockPaperWorkbook,
} from '../services/mockPaperWorkbookStorage.js'

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
  issueCount: number
  questionCount: number
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
  const readiness = deriveMockPaperReadiness(row.examType, row.modules)
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
    validationStatus: readiness.validationStatus,
    issueCount: row.issueCount,
    questionCount: row.questionCount,
    readyModuleCount: readiness.readyModuleCount,
    fullExamReady: readiness.fullExamReady,
    moduleCount: row._count.modules,
    modules: row.modules,
    deletable:
      canDeleteMockPaperSet({
        status: row.status,
        examRecordCount: row.paper?._count.examRecords || 0,
        deletedAt: null,
      }),
    updatedAt: row.updatedAt.toISOString(),
    publishedAt: row.publishedAt?.toISOString() || null,
    archivedAt: row.archivedAt?.toISOString() || null,
  }
}

// 管理首页卡片从模块校验状态实时派生完整套卷数，避免缓存状态漂移。
mockPaperSetRouter.get('/stats', async (_req, res) => {
  const [total, draftSets] = await Promise.all([
    prisma.mockPaperSet.count({ where: { deletedAt: null } }),
    prisma.mockPaperSet.findMany({
      where: { deletedAt: null, status: MOCK_PAPER_STATUS.DRAFT },
      select: {
        examType: true,
        modules: { select: { code: true, validationStatus: true } },
      },
    }),
  ])
  const validDrafts = draftSets.filter(
    (set) => deriveMockPaperReadiness(set.examType, set.modules).fullExamReady,
  ).length
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
    deletedAt: null,
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

// 单项视图只展示每个 Sheet 对应的原始单项；是否加入套卷不影响其独立展示。
mockPaperSetRouter.get('/modules', async (req, res) => {
  const page = parsePositiveInt(req.query.page, 1)
  const pageSize = parsePositiveInt(req.query.pageSize, 20, 100)
  const examType = String(req.query.examType || '').trim().toUpperCase()
  const status = String(req.query.status || '').trim()
  const keyword = String(req.query.keyword || '').trim()
  const visibilityWhere: Prisma.MockPaperModuleWhereInput = {
    sourceModuleId: null,
    ...(status ? { publicationStatus: status } : {}),
    mockPaperSet: {
      is: {
        ...(examType ? { examType } : {}),
      },
    },
  }
  const where: Prisma.MockPaperModuleWhereInput = {
    AND: [
      visibilityWhere,
      ...(keyword
        ? [{
            OR: [
              { code: { contains: keyword } },
              { label: { contains: keyword } },
              { title: { contains: keyword } },
              { mockPaperSet: { title: { contains: keyword } } },
              { mockPaperSet: { code: { contains: keyword } } },
            ],
          } satisfies Prisma.MockPaperModuleWhereInput]
        : []),
    ],
  }
  const total = await prisma.mockPaperModule.count({ where })
  const totalPages = Math.ceil(total / pageSize)
  const safePage = totalPages > 0 ? Math.min(page, totalPages) : 1
  const rows = await prisma.mockPaperModule.findMany({
    where,
    orderBy: [{ createdAt: 'desc' }, { moduleOrder: 'asc' }, { id: 'asc' }],
    skip: (safePage - 1) * pageSize,
    take: pageSize,
    include: {
      composedCopies: {
        where: { mockPaperSet: { deletedAt: null } },
        take: 1,
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
              modules: { select: { code: true, validationStatus: true } },
              deletedAt: true,
            },
          },
        },
      },
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
          modules: { select: { code: true, validationStatus: true } },
          deletedAt: true,
        },
      },
    },
  })
  res.json(
    success({
      list: rows.map((row) => {
        const assignedSet = row.composedCopies[0]?.mockPaperSet
        const effectiveSet = assignedSet || row.mockPaperSet
        const released = !assignedSet && Boolean(row.mockPaperSet.deletedAt)
        const readiness = deriveMockPaperReadiness(effectiveSet.examType, effectiveSet.modules)
        const { modules: _modules, ...mockPaperSet } = effectiveSet

        return {
          id: row.id,
          code: row.code,
          label: row.label,
          title: row.title,
          accessTier: row.accessTier,
          order: row.moduleOrder,
          durationSeconds: row.durationSeconds,
          expectedQuestionCount: row.expectedQuestionCount,
          questionCount: row.questionCount,
          validationStatus: row.validationStatus,
          publicationStatus: row.publicationStatus,
          issueCount: row.issueCount,
          updatedAt: row.updatedAt.toISOString(),
          released,
          mockPaperSet: { ...mockPaperSet, fullExamReady: readiness.fullExamReady },
        }
      }),
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

// 单项详情始终只返回当前 Module/Paper，不展开其所属套卷的其他模块。
mockPaperSetRouter.get('/modules/:moduleId', async (req, res) => {
  const module = await prisma.mockPaperModule.findUnique({
    where: { id: req.params.moduleId },
    include: {
      composedCopies: {
        where: { mockPaperSet: { deletedAt: null } },
        orderBy: { updatedAt: 'desc' },
        take: 1,
        include: { mockPaperSet: { select: { title: true } } },
      },
      mockPaperSet: { include: { _count: { select: { modules: true } } } },
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
  })
  if (!module || module.sourceModuleId) {
    res.status(404).json(fail('单项卷不存在', 'MOCK_PAPER_MODULE_NOT_AVAILABLE'))
    return
  }
  const ready = module.validationStatus === MOCK_PAPER_VALIDATION_STATUS.VALID
  const published = module.publicationStatus === MOCK_PAPER_MODULE_STATUS.PUBLISHED
  const parentSetTitle = module.composedCopies[0]?.mockPaperSet.title
    || (module.mockPaperSet.deletedAt ? null : module.mockPaperSet.title)
  const fixedModuleTitle = formatMockPaperModuleTitle({
    title: module.title,
    examType: module.mockPaperSet.examType,
    code: module.code,
    label: module.label,
    sequenceNo: module.mockPaperSet.sequenceNo,
  })
  res.json(success({
    id: module.mockPaperSet.id,
    code: module.mockPaperSet.code,
    sequenceNo: module.mockPaperSet.sequenceNo,
    examType: module.mockPaperSet.examType,
    title: fixedModuleTitle,
    accessTier: module.accessTier,
    status: module.mockPaperSet.deletedAt ? MOCK_PAPER_STATUS.DRAFT : module.mockPaperSet.status,
    version: module.mockPaperSet.version,
    sourceFileName: module.mockPaperSet.sourceFileName
      ? normalizeWorkbookFileName(module.mockPaperSet.sourceFileName)
      : null,
    paperId: module.mockPaperSet.paperId,
    validationStatus: module.validationStatus,
    issueCount: module.issueCount,
    questionCount: module.questionCount,
    readyModuleCount: ready ? 1 : 0,
    fullExamReady: false,
    publishableModuleCount: ready && !published ? 1 : 0,
    canPublish: ready && !published,
    canAddModules: false,
    singleModuleDetail: true,
    releasedModule: Boolean(module.mockPaperSet.deletedAt),
    parentSetTitle,
    issues: parseJsonArray<string>(module.issues),
    updatedAt: module.updatedAt.toISOString(),
    publishedAt: module.publishedAt?.toISOString() || null,
    archivedAt: module.archivedAt?.toISOString() || null,
    modules: [{
      id: module.id,
      code: module.code,
      label: module.label,
      title: fixedModuleTitle,
      order: module.moduleOrder,
      durationSeconds: module.durationSeconds,
      expectedQuestionCount: module.expectedQuestionCount,
      questionCount: module.questionCount,
      validationStatus: module.validationStatus,
      publicationStatus: module.publicationStatus,
      issueCount: module.issueCount,
      published,
      removable: false,
      issues: parseJsonArray<string>(module.issues),
      questions: module.questions.map((item) => ({
        id: item.id,
        position: item.position,
        sourceCode: item.sourceCode,
        validationStatus: item.validationStatus,
        issues: parseJsonArray<string>(item.issues),
        question: item.question,
      })),
    }],
  }))
})

// 单项名称与访问权限以来源模块为主记录，并同步已有套卷副本，确保后台和学生端口径一致。
mockPaperSetRouter.put('/modules/:moduleId', async (req, res) => {
  const title = String(req.body.title || '').trim()
  if (!title) {
    res.status(422).json(fail('单项名称不能为空', 'MOCK_PAPER_MODULE_TITLE_REQUIRED'))
    return
  }
  if (title.length > 255) {
    res.status(422).json(fail('单项名称不能超过 255 个字符', 'MOCK_PAPER_MODULE_TITLE_TOO_LONG'))
    return
  }

  const module = await prisma.mockPaperModule.findUnique({
    where: { id: req.params.moduleId },
    include: {
      mockPaperSet: true,
    },
  })
  if (!module || module.sourceModuleId) {
    res.status(404).json(fail('单项卷不存在', 'MOCK_PAPER_MODULE_NOT_AVAILABLE'))
    return
  }
  const accessTier = req.body.accessTier === undefined
    ? module.accessTier
    : String(req.body.accessTier).trim()
  if (!isPaperAccessTier(accessTier)) {
    res.status(422).json(fail('访问级别必须为免费卷或会员卷', 'MOCK_PAPER_ACCESS_INVALID'))
    return
  }
  if (module.publicationStatus === MOCK_PAPER_MODULE_STATUS.ARCHIVED) {
    res.status(409).json(fail('已下线单项不能修改', 'MOCK_PAPER_MODULE_ARCHIVED'))
    return
  }

  const canonicalModuleId = module.sourceModuleId || module.id
  const updated = await prisma.mockPaperModule.updateMany({
    where: {
      OR: [
        { id: canonicalModuleId },
        { sourceModuleId: canonicalModuleId },
      ],
    },
    data: { title, accessTier },
  })
  setOperationAuditContext(req, {
    resourceId: module.id,
    summary: `修改单项卷“${title}”的基本信息`,
    changes: {
      title: { before: module.title, after: title },
      accessTier: { before: module.accessTier, after: accessTier },
    },
  })
  res.json(success({ id: module.id, title, accessTier, updatedModuleCount: updated.count }))
})

// 单项校验从来源模块出发刷新其所属记录和已组套副本，不改变单项或完整套卷的发布与访问状态。
mockPaperSetRouter.post('/modules/:moduleId/validate', async (req, res) => {
  const module = await prisma.mockPaperModule.findUnique({
    where: { id: req.params.moduleId },
    include: { composedCopies: { select: { mockPaperSetId: true } } },
  })
  if (!module || module.sourceModuleId) {
    res.status(404).json(fail('单项卷不存在', 'MOCK_PAPER_MODULE_NOT_AVAILABLE'))
    return
  }

  const affectedSetIds = new Set([
    module.mockPaperSetId,
    ...module.composedCopies.map((copy) => copy.mockPaperSetId),
  ])
  for (const setId of affectedSetIds) await revalidateMockPaperSet(setId)

  const updated = await prisma.mockPaperModule.findUnique({
    where: { id: module.id },
    select: { id: true, validationStatus: true, issueCount: true },
  })
  setOperationAuditContext(req, {
    resourceId: module.id,
    summary: '重新校验单项模考试卷',
    changes: {
      validationStatus: { before: module.validationStatus, after: updated?.validationStatus || null },
    },
  })
  res.json(success(updated))
})

// 单项发布只开放当前 Module/Paper，不连带发布所属套卷的其他模块。
mockPaperSetRouter.post('/modules/:moduleId/publish', async (req, res) => {
  try {
    const published = await publishMockPaperModule(req.params.moduleId)
    setOperationAuditContext(req, {
      resourceId: published.id,
      summary: '发布单项模考试卷',
      changes: { moduleId: { before: req.params.moduleId, after: req.params.moduleId } },
    })
    res.json(success(published))
  } catch (error) {
    const code = error instanceof Error ? error.message : ''
    if (code === 'MOCK_PAPER_MODULE_NOT_FOUND') {
      res.status(404).json(fail('单项卷不存在', code))
      return
    }
    if (code === 'MOCK_PAPER_MODULE_UNAVAILABLE') {
      res.status(409).json(fail('该单项卷尚未校验通过或不是独立单项', code))
      return
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      res.status(409).json(fail('单项卷状态刚刚发生变化，请刷新后重试', 'MOCK_PAPER_MODULE_CONFLICT'))
      return
    }
    throw error
  }
})

// 单项下线只关闭新的单项模考入口，所属完整套卷与已有答卷继续有效。
mockPaperSetRouter.post('/modules/:moduleId/archive', async (req, res) => {
  try {
    const archived = await archiveMockPaperModule(req.params.moduleId)
    setOperationAuditContext(req, {
      resourceId: archived.moduleId,
      summary: '下线单项模考试卷',
      changes: {
        publicationStatus: {
          before: MOCK_PAPER_MODULE_STATUS.PUBLISHED,
          after: archived.status,
        },
      },
    })
    res.json(success(archived))
  } catch (error) {
    const code = error instanceof Error ? error.message : ''
    if (code === 'MOCK_PAPER_MODULE_NOT_FOUND') {
      res.status(404).json(fail('单项卷不存在', code))
      return
    }
    if (code === 'MOCK_PAPER_MODULE_UNAVAILABLE') {
      res.status(409).json(fail('该记录不是可独立管理的单项卷', code))
      return
    }
    if (code === 'MOCK_PAPER_MODULE_NOT_PUBLISHED') {
      res.status(409).json(fail('只有已发布的单项卷可以下线', code))
      return
    }
    throw error
  }
})

// 上传历史按时间倒序分页，仅返回后台展示所需信息，不暴露服务器 storageKey。
mockPaperSetRouter.get('/upload-history', async (req, res) => {
  const page = parsePositiveInt(req.query.page, 1)
  const pageSize = parsePositiveInt(req.query.pageSize, 10, 50)
  const [total, rows] = await prisma.$transaction([
    prisma.mockPaperWorkbookUpload.count(),
    prisma.mockPaperWorkbookUpload.findMany({
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        uploadedBy: { select: { username: true, email: true } },
      },
    }),
  ])

  res.json(success({
    list: rows.map((row) => ({
      id: row.id,
      originalFileName: row.originalFileName,
      contentType: row.contentType,
      fileSizeBytes: row.fileSizeBytes,
      status: row.status,
      setCount: row.setCount,
      moduleCount: row.moduleCount,
      errorMessage: row.errorMessage,
      uploadedBy: row.uploadedBy,
      createdAt: row.createdAt,
      completedAt: row.completedAt,
    })),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  }))
})

// 历史 Excel 通过管理员鉴权后的专用接口下载，物理存储路径不返回浏览器。
mockPaperSetRouter.get('/upload-history/:uploadId/download', async (req, res, next) => {
  const upload = await prisma.mockPaperWorkbookUpload.findUnique({
    where: { id: req.params.uploadId },
  })
  if (!upload) {
    res.status(404).json(fail('上传记录不存在', 'MOCK_PAPER_UPLOAD_NOT_FOUND'))
    return
  }

  let filePath: string
  try {
    filePath = await ensureMockPaperWorkbookAvailable(upload.storageKey)
  } catch {
    res.status(404).json(fail('原始 Excel 暂不可用，请联系管理员', 'MOCK_PAPER_UPLOAD_FILE_UNAVAILABLE'))
    return
  }

  res.setHeader('Cache-Control', 'private, no-store')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.download(filePath, upload.originalFileName, (error) => {
    if (error) next(error)
  })
})

// 新建套卷弹窗只读取删除套卷后已释放、且尚未再次被其他套卷占用的原始模块。
mockPaperSetRouter.get('/composition-candidates', async (req, res) => {
  const examType = String(req.query.examType || '').trim().toUpperCase()
  if (examType !== 'ESAT' && examType !== 'TMUA') {
    res.status(422).json(fail('请选择 ESAT 或 TMUA', 'MOCK_PAPER_EXAM_TYPE_INVALID'))
    return
  }
  const modules = await prisma.mockPaperModule.findMany({
    where: {
      sourceModuleId: null,
      validationStatus: MOCK_PAPER_VALIDATION_STATUS.VALID,
      composedCopies: { none: {} },
      mockPaperSet: {
        is: {
          examType,
          deletedAt: { not: null },
        },
      },
    },
    include: {
      mockPaperSet: {
        select: {
          id: true,
          code: true,
          sequenceNo: true,
          examType: true,
          title: true,
          status: true,
          deletedAt: true,
          accessTier: true,
          _count: { select: { modules: true } },
        },
      },
    },
    orderBy: [{ moduleOrder: 'asc' }, { mockPaperSet: { sequenceNo: 'asc' } }],
  })
  res.json(success({
    list: modules
      .filter((module) => canClaimMockPaperSource({
        sourceModuleId: module.sourceModuleId,
        composedCopyCount: 0,
        ownerModuleCount: module.mockPaperSet._count.modules,
        ownerStatus: module.mockPaperSet.status,
        ownerDeletedAt: module.mockPaperSet.deletedAt,
      }))
      .map((module) => ({
        id: module.id,
        code: module.code,
        label: module.label,
        title: formatMockPaperModuleTitle({
          title: module.title,
          examType: module.mockPaperSet.examType,
          code: module.code,
          label: module.label,
          sequenceNo: module.mockPaperSet.sequenceNo,
        }),
        durationSeconds: module.durationSeconds,
        questionCount: module.questionCount,
        sourceSet: {
          id: module.mockPaperSet.id,
          code: module.mockPaperSet.code,
          sequenceNo: module.mockPaperSet.sequenceNo,
          title: module.mockPaperSet.title,
          status: module.mockPaperSet.status,
          accessTier: module.accessTier,
        },
      })),
  }))
})

// 管理员选择互不重复的独立单项后创建新的草稿套卷。
mockPaperSetRouter.post('/compose', async (req, res) => {
  const moduleIds = Array.isArray(req.body.moduleIds)
    ? req.body.moduleIds.map((value: unknown) => String(value || '').trim()).filter(Boolean)
    : []
  const accessTier = String(req.body.accessTier || PAPER_ACCESS_TIER.MEMBER).trim()
  if (!isPaperAccessTier(accessTier)) {
    res.status(422).json(fail('访问级别必须为免费卷或会员卷', 'MOCK_PAPER_ACCESS_INVALID'))
    return
  }
  if (!moduleIds.length || new Set(moduleIds).size !== moduleIds.length) {
    res.status(422).json(fail('请选择互不重复的独立单项卷', 'MOCK_PAPER_COMPOSE_MODULES_INVALID'))
    return
  }
  try {
    const id = await composeMockPaperSetFromModules(moduleIds, accessTier)
    setOperationAuditContext(req, {
      resourceId: id,
      summary: `由 ${moduleIds.length} 个独立单项组成模考套卷`,
      changes: { moduleIds: { before: null, after: moduleIds } },
    })
    res.status(201).json(success({ id }))
  } catch (error) {
    const code = error instanceof Error ? error.message : ''
    if (code === 'MOCK_PAPER_COMPOSE_SOURCE_UNAVAILABLE') {
      res.status(409).json(fail('部分单项刚刚已被其他套卷采用，请重新选择', code))
      return
    }
    if (code === 'MOCK_PAPER_COMPOSE_STRUCTURE_INVALID') {
      res.status(422).json(fail('套卷科目组合不符合 ESAT 或 TMUA 规则', code))
      return
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      res.status(409).json(fail('单项已被占用或套卷编号发生冲突，请刷新后重试', 'MOCK_PAPER_COMPOSE_CONFLICT'))
      return
    }
    throw error
  }
})

// 套卷详情按模块和题序返回，并附带题库题目的只读预览摘要。
mockPaperSetRouter.get('/:id', async (req, res) => {
  const row = await prisma.mockPaperSet.findFirst({
    where: { id: req.params.id, deletedAt: null },
    include: {
      paper: { select: { status: true } },
      modules: {
        orderBy: { moduleOrder: 'asc' },
        include: {
          _count: { select: { composedCopies: true } },
          sourceModule: {
            select: {
              title: true,
              code: true,
              label: true,
              publicationStatus: true,
              publishedAt: true,
              archivedAt: true,
              mockPaperSet: { select: { examType: true, sequenceNo: true } },
            },
          },
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
  const readiness = deriveMockPaperReadiness(row.examType, row.modules)
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
      validationStatus: readiness.validationStatus,
      issueCount: row.issueCount,
      questionCount: row.questionCount,
      readyModuleCount: readiness.readyModuleCount,
      fullExamReady: readiness.fullExamReady,
      publishableModuleCount: 0,
      canPublish: row.status === MOCK_PAPER_STATUS.DRAFT && readiness.fullExamReady,
      canAddModules:
        canEditMockPaperComposition(row.status, row.deletedAt)
        && row.modules.length < getModulePoolCapacity(row.examType),
      issues: parseJsonArray<string>(row.issues),
      updatedAt: row.updatedAt.toISOString(),
      publishedAt: row.publishedAt?.toISOString() || null,
      archivedAt: row.archivedAt?.toISOString() || null,
      modules: row.modules.map((module) => ({
        id: module.id,
        code: module.code,
        label: module.label,
        title: formatMockPaperModuleTitle({
          title: module.sourceModule ? module.sourceModule.title : module.title,
          examType: module.sourceModule?.mockPaperSet.examType || row.examType,
          code: module.sourceModule?.code || module.code,
          label: module.sourceModule?.label || module.label,
          sequenceNo: module.sourceModule?.mockPaperSet.sequenceNo || row.sequenceNo,
        }),
        order: module.moduleOrder,
        durationSeconds: module.durationSeconds,
        expectedQuestionCount: module.expectedQuestionCount,
        questionCount: module.questionCount,
        validationStatus: module.validationStatus,
        publicationStatus: module.sourceModule?.publicationStatus || module.publicationStatus,
        issueCount: module.issueCount,
        published:
          (module.sourceModule?.publicationStatus || module.publicationStatus)
          === MOCK_PAPER_MODULE_STATUS.PUBLISHED,
        removable: row.status === MOCK_PAPER_STATUS.DRAFT && row.modules.length > 1,
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

// 候选列表只返回删除套卷后已释放、且未再次被占用的原始模块。
mockPaperSetRouter.get('/:id/module-candidates', async (req, res) => {
  const target = await prisma.mockPaperSet.findFirst({
    where: { id: req.params.id, deletedAt: null },
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
    !canEditMockPaperComposition(target.status, target.deletedAt)
    || target.modules.length >= getModulePoolCapacity(target.examType)
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
          deletedAt: { not: null },
        },
      },
    },
    include: {
      mockPaperSet: {
        select: {
          id: true,
          code: true,
          sequenceNo: true,
          examType: true,
          title: true,
          status: true,
          deletedAt: true,
          accessTier: true,
          _count: { select: { modules: true } },
        },
      },
    },
    orderBy: [{ moduleOrder: 'asc' }, { createdAt: 'desc' }],
  })

  res.json(success({
    list: candidates
      .filter((module) => canClaimMockPaperSource({
        sourceModuleId: module.sourceModuleId,
        composedCopyCount: 0,
        ownerModuleCount: module.mockPaperSet._count.modules,
        ownerStatus: module.mockPaperSet.status,
        ownerDeletedAt: module.mockPaperSet.deletedAt,
      }))
      .map((module) => ({
        id: module.id,
        code: module.code,
        label: module.label,
        title: formatMockPaperModuleTitle({
          title: module.title,
          examType: module.mockPaperSet.examType,
          code: module.code,
          label: module.label,
          sequenceNo: module.mockPaperSet.sequenceNo,
        }),
        durationSeconds: module.durationSeconds,
        questionCount: module.questionCount,
        sourceSet: {
          id: module.mockPaperSet.id,
          code: module.mockPaperSet.code,
          sequenceNo: module.mockPaperSet.sequenceNo,
          title: module.mockPaperSet.title,
          status: module.mockPaperSet.status,
          accessTier: module.accessTier,
        },
      })),
  }))
})

// 选择单项卷时复制其稳定题序到当前套卷，并以唯一来源关联阻止重复组卷。
mockPaperSetRouter.post('/:id/modules', async (req, res) => {
  const sourceModuleId = String(req.body.sourceModuleId || '').trim()
  if (!sourceModuleId) {
    res.status(422).json(fail('请选择要加入的单项卷', 'MOCK_PAPER_SOURCE_MODULE_REQUIRED'))
    return
  }
  const [target, source] = await Promise.all([
    prisma.mockPaperSet.findFirst({
      where: { id: req.params.id, deletedAt: null },
      include: {
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
        mockPaperSet: { include: { _count: { select: { modules: true } } } },
        questions: { orderBy: { position: 'asc' } },
      },
    }),
  ])
  if (!target) {
    res.status(404).json(fail('模考试卷不存在', 'MOCK_PAPER_SET_NOT_FOUND'))
    return
  }
  if (!canEditMockPaperComposition(target.status, target.deletedAt)) {
    res.status(409).json(fail('只有草稿套卷可以继续组套', 'MOCK_PAPER_SET_LOCKED'))
    return
  }
  if (
    target.modules.length >= getModulePoolCapacity(target.examType)
  ) {
    res.status(409).json(fail('当前套卷不能继续添加单项卷', 'MOCK_PAPER_COMPOSITION_LOCKED'))
    return
  }
  if (
    !source
    || source.mockPaperSetId === target.id
    || !canClaimMockPaperSource({
      sourceModuleId: source.sourceModuleId,
      composedCopyCount: source._count.composedCopies,
      ownerModuleCount: source.mockPaperSet._count.modules,
      ownerStatus: source.mockPaperSet.status,
      ownerDeletedAt: source.mockPaperSet.deletedAt,
    })
    || source.mockPaperSet.examType !== target.examType
    || source.validationStatus !== MOCK_PAPER_VALIDATION_STATUS.VALID
  ) {
    res.status(409).json(fail('该单项卷已被其他套卷采用或当前不可加入', 'MOCK_PAPER_MODULE_UNAVAILABLE'))
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
        title: formatMockPaperModuleTitle({
          title: source.title,
          examType: source.mockPaperSet.examType,
          code: source.code,
          label: source.label,
          sequenceNo: source.mockPaperSet.sequenceNo,
        }),
        accessTier: source.accessTier,
        moduleOrder: source.moduleOrder,
        durationSeconds: source.durationSeconds,
        expectedQuestionCount: source.expectedQuestionCount,
        questionCount: source.questionCount,
        publicationStatus: source.publicationStatus,
        publishedAt: source.publishedAt,
        archivedAt: source.archivedAt,
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
      res.status(409).json(fail('该单项卷刚刚已被其他套卷采用，请重新选择', 'MOCK_PAPER_MODULE_UNAVAILABLE'))
      return
    }
    throw error
  }
})

// 草稿套卷移除单项时只解除组卷关系，同时至少保留一个基础 Module。
mockPaperSetRouter.delete('/:id/modules/:moduleId', async (req, res) => {
  const module = await prisma.mockPaperModule.findFirst({
    where: {
      id: req.params.moduleId,
      mockPaperSetId: req.params.id,
    },
    include: { mockPaperSet: { include: { _count: { select: { modules: true } } } } },
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

  if (module.sourceModuleId) {
    await prisma.mockPaperModule.delete({ where: { id: module.id } })
  } else {
    const releasedAt = new Date()
    await prisma.$transaction(async (tx) => {
      const latestVersion = await tx.mockPaperSet.findFirst({
        where: {
          examType: module.mockPaperSet.examType,
          sequenceNo: module.mockPaperSet.sequenceNo,
        },
        orderBy: { version: 'desc' },
        select: { version: true },
      })
      const releasedOwner = await tx.mockPaperSet.create({
        data: {
          code: `${module.mockPaperSet.code}-RELEASED-${module.id.slice(0, 8)}`,
          sequenceNo: module.mockPaperSet.sequenceNo,
          examType: module.mockPaperSet.examType,
          title: module.mockPaperSet.title,
          accessTier: module.accessTier,
          status: MOCK_PAPER_STATUS.DRAFT,
          version: (latestVersion?.version || module.mockPaperSet.version) + 1,
          sourceFileName: module.mockPaperSet.sourceFileName,
          issueCount: module.issueCount,
          questionCount: module.questionCount,
          issues: module.issues as Prisma.InputJsonValue,
          deletedAt: releasedAt,
        },
        select: { id: true },
      })
      await tx.mockPaperModule.update({
        where: { id: module.id },
        data: { mockPaperSetId: releasedOwner.id },
      })
    })
  }
  await revalidateMockPaperSet(module.mockPaperSetId)
  if (!module.sourceModuleId && module.publicationStatus === MOCK_PAPER_MODULE_STATUS.PUBLISHED) {
    await publishMockPaperModule(module.id)
  }
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

// Excel 每个 Sheet 独立保存为无所属套卷的单项并复核，后续组套必须由管理员显式完成。
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

  const fileName = normalizeWorkbookFileName(file.originalname) || 'mock-paper-workbook.xlsx'
  let storedWorkbook
  try {
    storedWorkbook = await storeMockPaperWorkbook(file.buffer)
  } catch (error) {
    if (error instanceof Error && error.message === 'INVALID_XLSX_SIGNATURE') {
      res.status(422).json(fail('文件内容不是有效的 .xlsx 工作簿', 'MOCK_PAPER_FILE_INVALID'))
      return
    }
    throw error
  }

  let uploadId: string
  try {
    const upload = await prisma.mockPaperWorkbookUpload.create({
      data: {
        originalFileName: fileName,
        storageKey: storedWorkbook.storageKey,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        fileSizeBytes: storedWorkbook.fileSizeBytes,
        checksumSha256: storedWorkbook.checksumSha256,
        status: MOCK_PAPER_UPLOAD_STATUS.PROCESSING,
        uploadedById: req.user?.userId,
      },
      select: { id: true },
    })
    uploadId = upload.id
  } catch (error) {
    await deleteMockPaperWorkbook(storedWorkbook.storageKey)
    throw error
  }

  try {
    const parsedSets = await parseMockPaperWorkbook(file.buffer)
    const createdIds = await createMockPaperDraftsFromWorkbook(
      parsedSets,
      fileName,
      accessTier,
    )
    const moduleCount = parsedSets.reduce((total, set) => total + set.modules.length, 0)
    await prisma.mockPaperWorkbookUpload.update({
      where: { id: uploadId },
      data: {
        status: MOCK_PAPER_UPLOAD_STATUS.SUCCEEDED,
        setCount: 0,
        moduleCount,
        completedAt: new Date(),
      },
    })
    setOperationAuditContext(req, {
      resourceId: createdIds[0],
      summary: `上传模考组卷清单“${fileName}”，生成 ${moduleCount} 个独立单项`,
      changes: {
        uploadId: { before: null, after: uploadId },
        createdIds: { before: null, after: createdIds },
      },
    })
    res.status(201).json(success({ moduleCount }))
  } catch (error) {
    const errorMessage = error instanceof MockPaperWorkbookError
      ? error.issues.join('\n')
      : error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
        ? '单项编号发生冲突，请刷新列表后重新上传'
        : '上传处理失败，请联系管理员'
    await prisma.mockPaperWorkbookUpload.update({
      where: { id: uploadId },
      data: {
        status: MOCK_PAPER_UPLOAD_STATUS.FAILED,
        errorMessage,
        completedAt: new Date(),
      },
    }).catch((updateError) => {
      console.error(`[mock-paper-upload] failed to update history id=${uploadId}:`, updateError)
    })

    if (error instanceof MockPaperWorkbookError) {
      res.status(422).json(fail(errorMessage, 'MOCK_PAPER_WORKBOOK_INVALID'))
      return
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      res.status(409).json(fail(errorMessage, 'MOCK_PAPER_SEQUENCE_CONFLICT'))
      return
    }
    throw error
  }
})

// 草稿可调整名称和访问级别；已发布卷只允许切换访问级别并同步运行试卷。
mockPaperSetRouter.put('/:id', async (req, res) => {
  const current = await prisma.mockPaperSet.findFirst({
    where: { id: req.params.id, deletedAt: null },
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
    if (current.paper) {
      await tx.paper.update({
        where: { id: current.paper.id },
        data: { title, accessTier },
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

// 未发布单项替换题目时同步来源与套卷副本；已发布单项始终锁定。
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
    where: {
      id: req.params.itemId,
      module: { mockPaperSetId: req.params.id },
    },
    include: {
      module: {
        include: {
          sourceModule: { select: { publicationStatus: true } },
          mockPaperSet: true,
        },
      },
    },
  })
  if (!item) {
    res.status(404).json(fail('待替换题目不存在', 'MOCK_PAPER_QUESTION_NOT_FOUND'))
    return
  }
  const effectivePublicationStatus = item.module.sourceModule?.publicationStatus
    || item.module.publicationStatus
  const canonicalSingle = !item.module.sourceModuleId
  const editableDraftModule = effectivePublicationStatus === MOCK_PAPER_MODULE_STATUS.DRAFT
    && (
      canonicalSingle
      || canEditMockPaperComposition(
        item.module.mockPaperSet.status,
        item.module.mockPaperSet.deletedAt,
      )
    )
  if (!editableDraftModule) {
    res.status(409).json(fail(
      '已发布的 Module/Paper 已锁定；如需调整请创建新版本',
      'MOCK_PAPER_SET_LOCKED',
    ))
    return
  }
  const canonicalModuleId = item.module.sourceModuleId || item.module.id
  const affectedModules = await prisma.mockPaperModule.findMany({
    where: {
      OR: [
        { id: canonicalModuleId },
        { sourceModuleId: canonicalModuleId },
      ],
    },
    select: { id: true, mockPaperSetId: true },
  })
  await prisma.mockPaperQuestion.updateMany({
    where: {
      moduleId: { in: affectedModules.map((module) => module.id) },
      position: item.position,
    },
    data: {
      sourceCode,
      questionId: null,
      validationStatus: 'invalid',
      issues: ['正在重新校验'],
    },
  })
  for (const setId of new Set(affectedModules.map((module) => module.mockPaperSetId))) {
    await revalidateMockPaperSet(setId)
  }
  setOperationAuditContext(req, {
    resourceId: req.params.id,
    summary: `替换模考卷“${item.module.mockPaperSet.title}”中的题目`,
    changes: { questionCode: { before: item.sourceCode, after: sourceCode } },
  })
  res.json(success({ id: item.id, previousCode: item.sourceCode, questionCode: sourceCode }))
})

// 管理员可以主动重跑校验，以便题库题目发布或归档后刷新草稿状态。
mockPaperSetRouter.post('/:id/validate', async (req, res) => {
  const current = await prisma.mockPaperSet.findFirst({
    where: { id: req.params.id, deletedAt: null },
  })
  if (!current) {
    res.status(404).json(fail('模考试卷不存在', 'MOCK_PAPER_SET_NOT_FOUND'))
    return
  }
  await revalidateMockPaperSet(current.id)
  const updated = await prisma.mockPaperSet.findUnique({
    where: { id: current.id },
    select: {
      examType: true,
      issueCount: true,
      modules: { select: { code: true, validationStatus: true } },
    },
  })
  const readiness = deriveMockPaperReadiness(updated!.examType, updated!.modules)
  res.json(
    success({
      id: current.id,
      validationStatus: readiness.validationStatus,
      issueCount: updated!.issueCount,
      readyModuleCount: readiness.readyModuleCount,
      fullExamReady: readiness.fullExamReady,
    }),
  )
})

// 只有结构完整且全部单项校验通过的草稿才能发布为完整套卷。
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
      publishedAt: result.publishedAt?.toISOString() || null,
    }))
  } catch (error) {
    const code = error instanceof Error ? error.message : ''
    if (code === 'MOCK_PAPER_SET_NOT_FOUND') {
      res.status(404).json(fail('模考试卷不存在', code))
      return
    }
    if (code === 'MOCK_PAPER_SET_LOCKED') {
      res.status(409).json(fail('只有草稿套卷可以发布；已发布套卷请创建新版本', code))
      return
    }
    if (code === 'MOCK_PAPER_SET_NOT_READY') {
      res.status(422).json(fail('完整套卷必须满足组卷结构，且当前加入的全部单项都校验通过', code))
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

// 删除套卷只移除套卷载体：复制模块删除以释放来源，原始模块保留为可再次组卷的单项。
mockPaperSetRouter.delete('/:id', async (req, res) => {
  const current = await prisma.mockPaperSet.findFirst({
    where: { id: req.params.id, deletedAt: null },
    include: {
      modules: { select: { sourceModuleId: true, publicationStatus: true } },
    },
  })
  if (!current) {
    res.status(404).json(fail('模考试卷不存在', 'MOCK_PAPER_SET_NOT_FOUND'))
    return
  }
  if (!canEditMockPaperComposition(current.status, current.deletedAt)) {
    res.status(409).json(fail('已发布的完整套卷不能删除，请改为下线', 'MOCK_PAPER_SET_LOCKED'))
    return
  }
  const deletedAt = new Date()
  await prisma.$transaction(async (tx) => {
    const hasPublishedCanonicalModule = current.modules.some((module) => (
      !module.sourceModuleId
      && module.publicationStatus === MOCK_PAPER_MODULE_STATUS.PUBLISHED
    ))
    if (current.paperId && !hasPublishedCanonicalModule) {
      await tx.paper.update({ where: { id: current.paperId }, data: { status: 'archived' } })
    }
    await tx.mockPaperModule.deleteMany({
      where: { mockPaperSetId: current.id, sourceModuleId: { not: null } },
    })
    await tx.mockPaperSet.update({
      where: { id: current.id },
      data: { deletedAt, archivedAt: deletedAt },
    })
  })
  setOperationAuditContext(req, {
    resourceId: current.id,
    summary: `删除模考卷草稿“${current.title}”`,
  })
  res.json(success({ id: current.id }))
})
