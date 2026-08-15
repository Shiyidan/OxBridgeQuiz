// 邀请码路由：提供公开校验、学生邀请码、限时补填、奖励查询与周卡启用入口。
import rateLimit from 'express-rate-limit'
import { requireAuth } from '../middleware/auth.js'
import { setOperationAuditContext } from '../middleware/operationAudit.js'
import {
  InvitationError,
  activateInvitationReward,
  bindInvitationFromProfile,
  getInvitationOverview,
  getOrCreateInvitationCode,
  normalizeInvitationCode,
  validateInvitationCode,
} from '../services/invitation.js'
import { createAsyncRouter } from '../utils/asyncRouter.js'
import { fail, success } from '../utils/response.js'
import { logRuntimeError } from '../utils/runtimeLogger.js'
import { isExamType } from '../constants/domain.js'

export const invitationsRouter = createAsyncRouter()

const validationLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
})

// 统一将可恢复的邀请业务错误返回给页面，未知错误只记录服务端日志。
function handleInvitationError(res: any, error: unknown, event: string): void {
  if (error instanceof InvitationError) {
    res.status(error.httpStatus).json(fail(error.message, error.code))
    return
  }
  logRuntimeError(`invitation.${event}_failed`, error)
  res.status(500).json(fail('邀请功能暂时不可用，请稍后重试'))
}

// 注册页邀请码校验
invitationsRouter.get('/validate', validationLimiter, async (req, res) => {
  try {
    const code = normalizeInvitationCode(req.query.code)
    res.json(success({ valid: await validateInvitationCode(code) }))
  } catch (error) {
    handleInvitationError(res, error, 'validate')
  }
})

// 个人邀请与奖励总览
invitationsRouter.get('/me', requireAuth, async (req, res) => {
  try {
    res.json(success(await getInvitationOverview(req.user!.userId)))
  } catch (error) {
    handleInvitationError(res, error, 'overview')
  }
})

// 创建或读取本人邀请码
invitationsRouter.post('/code', requireAuth, async (req, res) => {
  try {
    const code = await getOrCreateInvitationCode(req.user!.userId)
    setOperationAuditContext(req, {
      resourceId: code.id,
      summary: '创建或读取本人邀请码',
    })
    res.json(success({ code: code.code }))
  } catch (error) {
    handleInvitationError(res, error, 'code_create')
  }
})

// 注册后限时补填邀请码
invitationsRouter.post('/bind', requireAuth, async (req, res) => {
  try {
    const code = normalizeInvitationCode(req.body?.code)
    const relation = await bindInvitationFromProfile(req.user!.userId, code)
    setOperationAuditContext(req, {
      resourceId: relation.id,
      summary: '注册后补填并绑定邀请码',
    })
    res.json(success(await getInvitationOverview(req.user!.userId)))
  } catch (error) {
    handleInvitationError(res, error, 'bind')
  }
})

// 双方手动启用周卡；受邀人沿用既定考试，邀请人提交本人选择。
invitationsRouter.post('/rewards/:id/activate', requireAuth, async (req, res) => {
  try {
    const examType = typeof req.body?.examType === 'string' ? req.body.examType.toUpperCase() : ''
    if (!isExamType(examType)) {
      res.status(422).json(fail('请选择有效的考试类型', 'INVITATION_EXAM_INVALID'))
      return
    }
    const membership = await activateInvitationReward(req.user!.userId, req.params.id, examType)
    const durationLabel = membership.plan === 'daily_gift' ? '一日管理员赠送会员卡' : '七天邀请会员卡'
    setOperationAuditContext(req, {
      resourceId: req.params.id,
      summary: `启用 ${membership.examType} ${durationLabel}`,
    })
    res.json(success({
      membership: {
        id: membership.id,
        examType: membership.examType,
        startsAt: membership.startsAt.toISOString(),
        endsAt: membership.endsAt.toISOString(),
      },
    }))
  } catch (error) {
    handleInvitationError(res, error, 'reward_activate')
  }
})
