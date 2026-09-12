// 处理管理员标准试卷 JSON 导入，并同步正式 Question 数据。
import { Prisma } from '@prisma/client'
import { prisma } from '../services/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { requireAdmin } from '../middleware/admin.js'
import { success, fail } from '../utils/response.js'
import { syncPaperQuestions, getPaperQuestions, formatQuestionRow } from '../utils/questionSync.js'
import { createNumericId } from '../utils/id.js'
import { validateStandardPaperDocument } from '../services/paperJsonValidator.js'
import { createAsyncRouter } from '../utils/asyncRouter.js'
import { setOperationAuditContext } from '../middleware/operationAudit.js'
import { logRuntimeError } from '../utils/runtimeLogger.js'

export const paperImportRouter = createAsyncRouter()

paperImportRouter.post('/import-json', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { code } = req.body
    const validated = validateStandardPaperDocument(req.body)
    if (validated.errors.length > 0 || !validated.metadata) {
      res.status(400).json(fail(`校验失败：${validated.errors.map((e) => e.message).join('；')}`))
      return
    }
    const { metadata, questions, modules } = validated

    const paper = await prisma.paper.create({
      data: {
        id: createNumericId(),
        title: metadata.paperName,
        year: metadata.year,
        duration: metadata.duration,
        code: code || metadata.code || undefined,
        examType: metadata.examType,
        paperType: metadata.paperType,
        accessTier: metadata.accessTier,
        deliveryMode: metadata.deliveryMode,
        breakDurationSeconds: metadata.breakDurationSeconds,
        moduleConfig: metadata.moduleConfig as unknown as Prisma.InputJsonValue,
        assemblyType: metadata.assemblyType,
        sourceExamTypes: metadata.sourceExamTypes as Prisma.InputJsonValue,
        remarks: metadata.remarks,
        totalQuestions: questions.length,
        status: 'draft',
      },
    })

    await syncPaperQuestions(paper.id, questions)
    const savedQuestions = await getPaperQuestions(paper.id)

    setOperationAuditContext(req, {
      resourceId: paper.id,
      summary: `导入 JSON 试卷“${paper.title}”`,
    })
    res.json(
      success({
        ...paper,
        questions: savedQuestions.map(formatQuestionRow),
        modules,
        warnings: validated.warnings,
      }),
    )
  } catch (e: any) {
    logRuntimeError('paper.import_json_failed', e)
    res.status(500).json(fail(e.message || '导入失败'))
  }
})

// 考纲树
