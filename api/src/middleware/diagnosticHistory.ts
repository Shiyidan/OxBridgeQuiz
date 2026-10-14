// 仅显式标记失效的旧诊断卷拦截历史详情，普通归档与年度换版仍可查看。
import type { RequestHandler } from 'express'
import { prisma } from '../services/prisma.js'
import { isExpiredDiagnosticPaper } from '../utils/diagnosticHistorySnapshot.js'
import { fail } from '../utils/response.js'

export const DIAGNOSTIC_PAPER_EXPIRED_MESSAGE = '当前试卷已失效，请查看最新版试卷'

// 先按当前用户确认答卷归属，再检查试卷状态；模考和题库历史不受影响。
export const requireAvailableDiagnosticHistory: RequestHandler = async (req, res, next) => {
  const record = await prisma.examRecord.findFirst({
    where: { id: req.params.id, userId: req.user!.userId },
    select: { paper: { select: { paperType: true, assemblyType: true } } },
  })
  if (!record) {
    res.status(404).json(fail('Exam record not found'))
    return
  }
  if (isExpiredDiagnosticPaper(record.paper)) {
    res.status(410).json(fail(DIAGNOSTIC_PAPER_EXPIRED_MESSAGE, 'DIAGNOSTIC_PAPER_EXPIRED'))
    return
  }
  next()
}
