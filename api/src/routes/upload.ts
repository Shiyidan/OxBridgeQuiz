import { prisma } from '../services/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { requireAdmin } from '../middleware/admin.js'
import { success, fail } from '../utils/response.js'
import { PAPER_TYPE, isExamType, isPaperType, normalizePaperType } from '../constants/domain.js'
import { createNumericId } from '../utils/id.js'
import { createAsyncRouter } from '../utils/asyncRouter.js'
import { setOperationAuditContext } from '../middleware/operationAudit.js'
import { logRuntimeError } from '../utils/runtimeLogger.js'

export const uploadRouter = createAsyncRouter()

// 前端 pdf.js 流式上传：先创建试卷和任务，再由 parse-tasks/:id/pages 逐页提交
uploadRouter.post('/paper-pages/create', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { title, year, duration, totalPages, paperType, examType = 'TMUA' } = req.body

    if (!totalPages || totalPages <= 0) {
      res.status(400).json(fail('请提供总页数'))
      return
    }

    if (!isExamType(examType)) {
      res.status(422).json(fail('无效的考试类型'))
      return
    }
    if (paperType && !isPaperType(paperType)) {
      res.status(422).json(fail('无效的试卷来源类型'))
      return
    }

    const paper = await prisma.paper.create({
      data: {
        id: createNumericId(),
        title: title || '未命名试卷',
        year: parseInt(year) || new Date().getFullYear(),
        duration: parseInt(duration) || 60,
        examType,
        paperType: paperType ? normalizePaperType(paperType) : PAPER_TYPE.REAL_PAPER,
        pdfUrl: null,
        questions: [],
      },
    })

    const task = await prisma.parseTask.create({
      data: {
        paperId: paper.id,
        status: 'pending',
      },
    })

    setOperationAuditContext(req, {
      resourceId: paper.id,
      summary: `创建上传试卷“${paper.title}”`,
    })
    res.json(
      success({
        paperId: paper.id,
        taskId: task.id,
        status: 'pending',
      }),
    )
  } catch (e: any) {
    logRuntimeError('paper.upload_create_failed', e)
    res.status(500).json(fail(e.message || '创建失败'))
  }
})
