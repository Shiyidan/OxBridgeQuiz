// 学习资料路由：提供成组资料列表与受控下载，并承接后台 PDF 上传、发布和删除。
import crypto from 'node:crypto'
import multer from 'multer'
import type { StudyResource } from '@prisma/client'
import { prisma } from '../services/prisma.js'
import { optionalAuth, requireAuth } from '../middleware/auth.js'
import { requireAdmin } from '../middleware/admin.js'
import { success, fail } from '../utils/response.js'
import { createAsyncRouter } from '../utils/asyncRouter.js'
import { setOperationAuditContext } from '../middleware/operationAudit.js'
import { isExamType } from '../constants/domain.js'
import {
  STUDY_RESOURCE_ACCESS_TIER,
  STUDY_RESOURCE_CATEGORY,
  STUDY_RESOURCE_DOWNLOAD_COUNT_BASE,
  STUDY_RESOURCE_FILE_ROLE,
  STUDY_RESOURCE_STATUS,
  isStudyResourceCategory,
  isStudyResourceStatus,
} from '../constants/studyResources.js'
import { config } from '../config.js'
import {
  deleteStudyResourceFile,
  deleteStudyResourceTemporaryFile,
  ensureStudyResourceFileAvailable,
  ensureStudyResourceTempDirectory,
  normalizeStudyResourceFileName,
  storeStudyResourcePdf,
  type StoredStudyResourceFile,
} from '../services/studyResourceStorage.js'
import { hasActiveExamMembershipAccess } from '../services/member.js'

export const studyResourceRouter = createAsyncRouter()

// 普通资料保持单文件上传，年度真题单次最多接收试题和答案两个文件。
function createUpload(maxFiles: number) {
  return multer({
    storage: multer.diskStorage({
      destination: (_req, _file, callback) => {
        void ensureStudyResourceTempDirectory()
          .then((directory) => callback(null, directory))
          .catch((error) => callback(error, ''))
      },
      filename: (_req, _file, callback) => callback(null, `${crypto.randomUUID()}.upload`),
    }),
    limits: {
      fileSize: config.studyResourceMaxFileSizeBytes,
      files: maxFiles,
      fields: 12,
    },
  })
}

const singleUpload = createUpload(1)
const pastPaperUpload = createUpload(2)

class InvalidStudyResourcePdfError extends Error {
  constructor(readonly fileLabel: string) {
    super('INVALID_STUDY_RESOURCE_PDF')
  }
}

// 分页参数只接受有限正整数，避免后台误操作一次读取全部资料。
function parsePositiveInt(value: unknown, fallback: number, max: number): number {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 1) return fallback
  return Math.min(parsed, max)
}

// 真题年份使用四位整数，允许维护历史资料和下一考试周期资料。
function parseResourceYear(value: unknown): number | null {
  const parsed = Number(value)
  const maxYear = new Date().getFullYear() + 2
  return Number.isInteger(parsed) && parsed >= 1980 && parsed <= maxYear ? parsed : null
}

// 上传文件必须同时具备 PDF 扩展名；文件内容签名由存储服务再次校验。
function hasPdfFileName(file: Express.Multer.File): boolean {
  return normalizeStudyResourceFileName(file.originalname).toLowerCase().endsWith('.pdf')
}

// 将存储层的签名校验错误转换为携带文件角色的业务错误，统一交由上传入口清理已落盘文件。
async function storeValidatedPdf(
  file: Express.Multer.File,
  fileLabel: string,
): Promise<StoredStudyResourceFile> {
  try {
    return await storeStudyResourcePdf(file.path, file.size)
  } catch (error) {
    if (error instanceof Error && error.message === 'INVALID_PDF_SIGNATURE') {
      throw new InvalidStudyResourcePdfError(fileLabel)
    }
    throw error
  }
}

// 同一资料组内的文件按试题、答案、普通附件排序，前后台展示保持一致。
function fileRoleOrder(role: string): number {
  if (role === STUDY_RESOURCE_FILE_ROLE.QUESTION) return 0
  if (role === STUDY_RESOURCE_FILE_ROLE.ANSWER) return 1
  return 2
}

// 数据库文件记录在 API 边界组装成资料组，服务器 storageKey 永不返回前端。
function serializeResourceBundle(records: StudyResource[], includeAdminFields: boolean) {
  const sortedFiles = [...records].sort((left, right) => fileRoleOrder(left.fileRole) - fileRoleOrder(right.fileRole))
  const representative = sortedFiles.find((item) => item.fileRole === STUDY_RESOURCE_FILE_ROLE.QUESTION)
    || sortedFiles.find((item) => item.fileRole === STUDY_RESOURCE_FILE_ROLE.MAIN)
    || sortedFiles[0]
  const publishedTimes = records.flatMap((item) => item.publishedAt ? [item.publishedAt.getTime()] : [])
  const createdTimes = records.map((item) => item.createdAt.getTime())
  const downloadCount = STUDY_RESOURCE_DOWNLOAD_COUNT_BASE
    + records.reduce((total, item) => total + item.downloadCount, 0)

  return {
    id: representative.bundleKey,
    title: representative.title,
    description: representative.description,
    examType: representative.examType,
    category: representative.category,
    resourceYear: representative.resourceYear,
    accessTier: representative.accessTier,
    ...(includeAdminFields ? { status: representative.status } : {}),
    publishedAt: publishedTimes.length ? new Date(Math.max(...publishedTimes)) : null,
    createdAt: new Date(Math.min(...createdTimes)),
    downloadCount,
    files: sortedFiles.map((file) => ({
      id: file.id,
      fileRole: file.fileRole,
      originalFileName: file.originalFileName,
      fileSizeBytes: file.fileSizeBytes,
    })),
  }
}

// 查询结果按 bundleKey 聚合后分页；资料库规模较小时可避免跨模型迁移和 N+1 查询。
async function listResourceBundles(options: {
  page: number
  pageSize: number
  examType: string
  category: string
  status: string
  includeAdminFields: boolean
}) {
  const records = await prisma.studyResource.findMany({
    where: {
      ...(options.examType ? { examType: options.examType } : {}),
      ...(options.category ? { category: options.category } : {}),
      ...(options.status ? { status: options.status } : {}),
    },
    orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
  })
  const grouped = new Map<string, StudyResource[]>()
  for (const record of records) {
    const group = grouped.get(record.bundleKey) || []
    group.push(record)
    grouped.set(record.bundleKey, group)
  }
  const bundles = [...grouped.values()].map((group) => serializeResourceBundle(group, options.includeAdminFields))
  if (options.category === STUDY_RESOURCE_CATEGORY.PAST_PAPER) {
    bundles.sort((left, right) => (right.resourceYear || 0) - (left.resourceYear || 0))
  }
  const start = (options.page - 1) * options.pageSize
  return {
    list: bundles.slice(start, start + options.pageSize),
    pagination: { page: options.page, pageSize: options.pageSize, total: bundles.length },
  }
}

// 前台只读取已发布资料组；草稿、校验摘要和服务器存储键均不会离开后台边界。
studyResourceRouter.get('/', async (req, res) => {
  const page = parsePositiveInt(req.query.page, 1, 100000)
  const pageSize = parsePositiveInt(req.query.pageSize, 12, 50)
  const examType = typeof req.query.examType === 'string' ? req.query.examType.toUpperCase() : ''
  const category = typeof req.query.category === 'string' ? req.query.category : ''

  if (examType && !isExamType(examType)) {
    res.status(400).json(fail('考试类型不正确', 'STUDY_RESOURCE_INVALID_EXAM_TYPE'))
    return
  }
  if (category && !isStudyResourceCategory(category)) {
    res.status(400).json(fail('资料分类不正确', 'STUDY_RESOURCE_INVALID_CATEGORY'))
    return
  }

  res.json(success(await listResourceBundles({
    page,
    pageSize,
    examType,
    category,
    status: STUDY_RESOURCE_STATUS.PUBLISHED,
    includeAdminFields: false,
  })))
})

// 下载入口按文件记录受控解析物理路径，会员资料在发送字节前校验对应考试权益。
studyResourceRouter.get('/:id/download', optionalAuth, async (req, res, next) => {
  const resource = await prisma.studyResource.findFirst({
    where: { id: req.params.id, status: STUDY_RESOURCE_STATUS.PUBLISHED },
  })
  if (!resource) {
    res.status(404).json(fail('资料不存在或尚未发布', 'STUDY_RESOURCE_NOT_FOUND'))
    return
  }

  if (resource.accessTier === STUDY_RESOURCE_ACCESS_TIER.MEMBER) {
    if (!req.user) {
      res.status(401).json(fail('请登录后下载会员资料', 'STUDY_RESOURCE_LOGIN_REQUIRED'))
      return
    }
    const allowed = await hasActiveExamMembershipAccess(req.user.userId, resource.examType)
    if (!allowed) {
      res.status(403).json(fail(`该资料仅限有效 ${resource.examType} 会员下载`, 'STUDY_RESOURCE_MEMBERSHIP_REQUIRED'))
      return
    }
  }

  let filePath: string
  try {
    filePath = await ensureStudyResourceFileAvailable(resource.storageKey)
  } catch {
    res.status(404).json(fail('资料文件暂不可用，请联系管理员', 'STUDY_RESOURCE_FILE_UNAVAILABLE'))
    return
  }

  res.setHeader('Cache-Control', 'private, no-store')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.download(filePath, resource.originalFileName, (error) => {
    if (error) {
      next(error)
      return
    }

    // 仅在 Express 确认文件传输完成后原子累加，失败请求和权限拦截不进入统计。
    void prisma.studyResource.update({
      where: { id: resource.id },
      data: { downloadCount: { increment: 1 } },
    }).catch((updateError) => {
      console.error(`[study-resource] download count update failed id=${resource.id}:`, updateError)
    })
  })
})

// 后台列表按资料组展示，年度真题的试题和答案只占一行。
studyResourceRouter.get('/admin', requireAuth, requireAdmin, async (req, res) => {
  const page = parsePositiveInt(req.query.page, 1, 100000)
  const pageSize = parsePositiveInt(req.query.pageSize, 20, 100)
  const examType = typeof req.query.examType === 'string' ? req.query.examType.toUpperCase() : ''
  const category = typeof req.query.category === 'string' ? req.query.category : ''
  const status = typeof req.query.status === 'string' ? req.query.status : ''

  if (examType && !isExamType(examType)) {
    res.status(400).json(fail('考试类型不正确', 'STUDY_RESOURCE_INVALID_EXAM_TYPE'))
    return
  }
  if (category && !isStudyResourceCategory(category)) {
    res.status(400).json(fail('资料分类不正确', 'STUDY_RESOURCE_INVALID_CATEGORY'))
    return
  }
  if (status && !isStudyResourceStatus(status)) {
    res.status(400).json(fail('资料状态不正确', 'STUDY_RESOURCE_INVALID_STATUS'))
    return
  }

  res.json(success(await listResourceBundles({
    page,
    pageSize,
    examType,
    category,
    status,
    includeAdminFields: true,
  })))
})

// 普通资料仍使用单文件入口，每个记录拥有独立资料组。
studyResourceRouter.post(
  '/admin/upload',
  requireAuth,
  requireAdmin,
  singleUpload.single('file'),
  async (req, res) => {
    const temporaryPath = req.file?.path
    let storedKey: string | undefined
    try {
      if (!req.file) {
        res.status(400).json(fail('请选择 PDF 文件', 'STUDY_RESOURCE_FILE_REQUIRED'))
        return
      }

      const title = String(req.body.title || '').trim()
      const description = String(req.body.description || '').trim()
      const examType = String(req.body.examType || '').trim().toUpperCase()
      const category = String(req.body.category || '').trim()
      const accessTier = STUDY_RESOURCE_ACCESS_TIER.FREE
      const status = STUDY_RESOURCE_STATUS.DRAFT
      const originalFileName = normalizeStudyResourceFileName(req.file.originalname)

      if (!title || title.length > 255) {
        res.status(400).json(fail('资料标题不能为空且不能超过 255 个字符', 'STUDY_RESOURCE_INVALID_TITLE'))
        return
      }
      if (description.length > 5000) {
        res.status(400).json(fail('资料说明不能超过 5000 个字符', 'STUDY_RESOURCE_INVALID_DESCRIPTION'))
        return
      }
      if (!isExamType(examType)) {
        res.status(400).json(fail('考试类型不正确', 'STUDY_RESOURCE_INVALID_EXAM_TYPE'))
        return
      }
      if (!isStudyResourceCategory(category)) {
        res.status(400).json(fail('资料分类不正确', 'STUDY_RESOURCE_INVALID_CATEGORY'))
        return
      }
      if (category === STUDY_RESOURCE_CATEGORY.PAST_PAPER) {
        res.status(400).json(fail('过往真题请使用年度成组上传入口', 'STUDY_RESOURCE_INVALID_CATEGORY'))
        return
      }
      if (!originalFileName.toLowerCase().endsWith('.pdf')) {
        res.status(400).json(fail('仅支持上传 PDF 文件', 'STUDY_RESOURCE_INVALID_FILE_TYPE'))
        return
      }

      const stored = await storeValidatedPdf(req.file, '文件')
      storedKey = stored.storageKey

      const bundleKey = crypto.randomUUID()
      const resource = await prisma.studyResource.create({
        data: {
          bundleKey,
          title,
          description: description || null,
          examType,
          category,
          resourceYear: null,
          fileRole: STUDY_RESOURCE_FILE_ROLE.MAIN,
          accessTier,
          status,
          originalFileName,
          storageKey: stored.storageKey,
          mimeType: 'application/pdf',
          fileSizeBytes: stored.fileSizeBytes,
          checksumSha256: stored.checksumSha256,
          uploadedById: req.user!.userId,
          publishedAt: null,
        },
      })

      setOperationAuditContext(req, {
        resourceType: 'StudyResource',
        resourceId: bundleKey,
        summary: `上传学习资料“${resource.title}”`,
      })
      res.status(201).json(success(serializeResourceBundle([resource], true)))
    } catch (error) {
      if (storedKey) await deleteStudyResourceFile(storedKey).catch(() => undefined)
      if (error instanceof InvalidStudyResourcePdfError) {
        res.status(400).json(fail(`${error.fileLabel}内容不是有效的 PDF`, 'STUDY_RESOURCE_INVALID_PDF'))
        return
      }
      throw error
    } finally {
      await deleteStudyResourceTemporaryFile(temporaryPath).catch(() => undefined)
    }
  },
)

// 同一考试和年份只维护一个真题资料组，可一次上传两份文件，也可为历史单文件补齐缺失项。
studyResourceRouter.post(
  '/admin/upload-past-paper',
  requireAuth,
  requireAdmin,
  pastPaperUpload.fields([
    { name: 'questionFile', maxCount: 1 },
    { name: 'answerFile', maxCount: 1 },
  ]),
  async (req, res) => {
    const uploadedFiles = req.files as Record<string, Express.Multer.File[]> | undefined
    const questionFile = uploadedFiles?.questionFile?.[0]
    const answerFile = uploadedFiles?.answerFile?.[0]
    const temporaryPaths = [questionFile?.path, answerFile?.path]
    const storedFiles: Array<{ role: string; file: Express.Multer.File; stored: StoredStudyResourceFile }> = []

    try {
      if (!questionFile && !answerFile) {
        res.status(400).json(fail('请至少选择试题或答案 PDF', 'STUDY_RESOURCE_FILE_REQUIRED'))
        return
      }

      const title = String(req.body.title || '').trim()
      const description = String(req.body.description || '').trim()
      const examType = String(req.body.examType || '').trim().toUpperCase()
      const resourceYear = parseResourceYear(req.body.resourceYear)
      const accessTier = STUDY_RESOURCE_ACCESS_TIER.FREE
      const status = STUDY_RESOURCE_STATUS.DRAFT

      if (!title || title.length > 255) {
        res.status(400).json(fail('资料标题不能为空且不能超过 255 个字符', 'STUDY_RESOURCE_INVALID_TITLE'))
        return
      }
      if (description.length > 5000) {
        res.status(400).json(fail('资料说明不能超过 5000 个字符', 'STUDY_RESOURCE_INVALID_DESCRIPTION'))
        return
      }
      if (!isExamType(examType)) {
        res.status(400).json(fail('考试类型不正确', 'STUDY_RESOURCE_INVALID_EXAM_TYPE'))
        return
      }
      if (!resourceYear) {
        res.status(400).json(fail('请输入有效的四位真题年份', 'STUDY_RESOURCE_INVALID_YEAR'))
        return
      }
      if ((questionFile && !hasPdfFileName(questionFile)) || (answerFile && !hasPdfFileName(answerFile))) {
        res.status(400).json(fail('仅支持上传 PDF 文件', 'STUDY_RESOURCE_INVALID_FILE_TYPE'))
        return
      }

      const existingRecords = await prisma.studyResource.findMany({
        where: { category: STUDY_RESOURCE_CATEGORY.PAST_PAPER, examType, resourceYear },
      })
      if (questionFile && existingRecords.some((item) => item.fileRole === STUDY_RESOURCE_FILE_ROLE.QUESTION)) {
        res.status(409).json(fail(`${resourceYear} 年试题已存在，请先删除原资料后再替换`, 'STUDY_RESOURCE_FILE_ROLE_EXISTS'))
        return
      }
      if (answerFile && existingRecords.some((item) => item.fileRole === STUDY_RESOURCE_FILE_ROLE.ANSWER)) {
        res.status(409).json(fail(`${resourceYear} 年答案已存在，请先删除原资料后再替换`, 'STUDY_RESOURCE_FILE_ROLE_EXISTS'))
        return
      }

      for (const [role, file] of [
        [STUDY_RESOURCE_FILE_ROLE.QUESTION, questionFile],
        [STUDY_RESOURCE_FILE_ROLE.ANSWER, answerFile],
      ] as const) {
        if (!file) continue
        const fileLabel = role === STUDY_RESOURCE_FILE_ROLE.QUESTION ? '试题文件' : '答案文件'
        const stored = await storeValidatedPdf(file, fileLabel)
        storedFiles.push({ role, file, stored })
      }

      const bundleKey = existingRecords[0]?.bundleKey || `past-paper:${examType}:${resourceYear}`
      const publishedAt = null
      await prisma.$transaction(async (tx) => {
        if (existingRecords.length) {
          await tx.studyResource.updateMany({
            where: { bundleKey },
            data: {
              title,
              description: description || null,
              accessTier,
              status,
              publishedAt,
            },
          })
        }
        for (const storedFile of storedFiles) {
          await tx.studyResource.create({
            data: {
              bundleKey,
              title,
              description: description || null,
              examType,
              category: STUDY_RESOURCE_CATEGORY.PAST_PAPER,
              resourceYear,
              fileRole: storedFile.role,
              accessTier,
              status,
              originalFileName: normalizeStudyResourceFileName(storedFile.file.originalname),
              storageKey: storedFile.stored.storageKey,
              mimeType: 'application/pdf',
              fileSizeBytes: storedFile.stored.fileSizeBytes,
              checksumSha256: storedFile.stored.checksumSha256,
              uploadedById: req.user!.userId,
              publishedAt,
            },
          })
        }
      })

      const resources = await prisma.studyResource.findMany({ where: { bundleKey } })
      setOperationAuditContext(req, {
        resourceType: 'StudyResource',
        resourceId: bundleKey,
        summary: `${existingRecords.length ? '补充' : '上传'} ${resourceYear} 年真题资料“${title}”`,
      })
      res.status(existingRecords.length ? 200 : 201).json(success(serializeResourceBundle(resources, true)))
    } catch (error) {
      await Promise.all(storedFiles.map((item) => deleteStudyResourceFile(item.stored.storageKey).catch(() => undefined)))
      if (error instanceof InvalidStudyResourcePdfError) {
        res.status(400).json(fail(`${error.fileLabel}不是有效的 PDF`, 'STUDY_RESOURCE_INVALID_PDF'))
        return
      }
      throw error
    } finally {
      await Promise.all(temporaryPaths.map((item) => deleteStudyResourceTemporaryFile(item).catch(() => undefined)))
    }
  },
)

// 发布和撤回以资料组为单位，保证同年试题与答案始终拥有一致可见性。
studyResourceRouter.put('/admin/bundles/:bundleKey/status', requireAuth, requireAdmin, async (req, res) => {
  const status = String(req.body?.status || '').trim()
  if (!isStudyResourceStatus(status)) {
    res.status(400).json(fail('资料状态不正确', 'STUDY_RESOURCE_INVALID_STATUS'))
    return
  }
  const records = await prisma.studyResource.findMany({ where: { bundleKey: req.params.bundleKey } })
  if (!records.length) {
    res.status(404).json(fail('资料不存在', 'STUDY_RESOURCE_NOT_FOUND'))
    return
  }

  const publishedAt = status === STUDY_RESOURCE_STATUS.PUBLISHED ? new Date() : null
  await prisma.studyResource.updateMany({
    where: { bundleKey: req.params.bundleKey },
    data: { status, publishedAt },
  })
  setOperationAuditContext(req, {
    resourceType: 'StudyResource',
    resourceId: req.params.bundleKey,
    summary: `${status === STUDY_RESOURCE_STATUS.PUBLISHED ? '发布' : '撤回'}学习资料“${records[0].title}”`,
  })
  res.json(success({ id: req.params.bundleKey, status, publishedAt }))
})

// 删除资料组时同步移除同年试题、答案记录及全部物理文件。
studyResourceRouter.delete('/admin/bundles/:bundleKey', requireAuth, requireAdmin, async (req, res) => {
  const records = await prisma.studyResource.findMany({ where: { bundleKey: req.params.bundleKey } })
  if (!records.length) {
    res.status(404).json(fail('资料不存在', 'STUDY_RESOURCE_NOT_FOUND'))
    return
  }

  await prisma.studyResource.deleteMany({ where: { bundleKey: req.params.bundleKey } })
  await Promise.all(records.map((item) => deleteStudyResourceFile(item.storageKey)))
  setOperationAuditContext(req, {
    resourceType: 'StudyResource',
    resourceId: req.params.bundleKey,
    summary: `删除学习资料“${records[0].title}”`,
  })
  res.json(success(null))
})
