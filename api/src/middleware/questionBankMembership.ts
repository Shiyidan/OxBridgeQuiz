// 题库进行中答卷在恢复、保存和交卷时重新校验会员，防止旧会话绕过付费访问。
import type { RequestHandler } from 'express'
import { prisma } from '../services/prisma.js'
import { hasActiveExamMembershipAccess } from '../services/member.js'
import {
  EXAM_RECORD_STATUS,
  QUESTION_BANK_PAPER_TYPES,
  QUESTION_BANK_MEMBERSHIP_MESSAGE,
  normalizePaperType,
} from '../constants/domain.js'
import { fail } from '../utils/response.js'

// 历史已交卷答卷仍可查看；只有当前题库练习需要维持对应考试的有效会员。
export const requireQuestionBankAttemptMembership: RequestHandler = async (req, res, next) => {
  try {
    const record = await prisma.examRecord.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
      select: { examType: true, status: true, paperId: true, paper: { select: { paperType: true } } },
    })
    if (
      record?.status === EXAM_RECORD_STATUS.IN_PROGRESS
      && (record.paperId === 'question-bank'
        || QUESTION_BANK_PAPER_TYPES.some((type) => type === normalizePaperType(record.paper.paperType)))
      && !(await hasActiveExamMembershipAccess(req.user!.userId, record.examType))
    ) {
      res.status(403).json(fail(QUESTION_BANK_MEMBERSHIP_MESSAGE, 'QUESTION_BANK_ACCESS_DENIED'))
      return
    }
    next()
  } catch (error) {
    next(error)
  }
}
