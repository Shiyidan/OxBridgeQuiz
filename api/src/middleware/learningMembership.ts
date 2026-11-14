// 学习平台的例题与自测按资源所属考试授权，做题单项年卡不能获得学习内容。
import type { RequestHandler } from 'express'
import { hasActiveExamMembershipAccess } from '../services/member.js'
import { prisma } from '../services/prisma.js'
import { learningPatternExamples } from '../constants/learningPatternExamples.js'
import { fail } from '../utils/response.js'
import { AUTH_ERROR, AUTH_SESSION_EXPIRED_MESSAGE } from '../constants/auth.js'
import { isFreeLearningResource } from '../constants/freeLearningAccess.js'

// 考试类型取自资源路径或审核过的来源映射，不接受客户端随意指定另一个考试。
export const requireLearningMembership: RequestHandler = async (req, res, next) => {
  try {
    const segments = req.path.split('/').filter(Boolean)
    // 来源目录只有题号与出版信息，讲解、例题正文和自测另行授权。
    if (segments[0] === 'pattern-sources') { next(); return }
    if (isFreeLearningResource(req.method, req.path)) { next(); return }
    if (!req.user) {
      res.status(401).json(fail(AUTH_SESSION_EXPIRED_MESSAGE, AUTH_ERROR.SESSION_EXPIRED))
      return
    }
    const examType = segments[0] === 'pattern'
      ? learningPatternExamples[segments[2]]?.examType
      : segments[0]?.toLowerCase() === 'tmua' ? 'TMUA' : 'ESAT'
    if (!examType) { res.status(404).json(fail('学习资源不存在')); return }
    if (!(await hasActiveExamMembershipAccess(req.user!.userId, examType, prisma, 'learning'))) {
      res.status(403).json(fail('当前考试的学习平台会员未开通或已到期，请开通学习平台年卡。', 'LEARNING_MEMBERSHIP_REQUIRED'))
      return
    }
    next()
  } catch (error) { next(error) }
}
