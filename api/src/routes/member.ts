// 会员权益查询、额度预检与备考偏好更新接口。
import { prisma } from '../services/prisma.js'
import type { Prisma } from '@prisma/client'
import { requireAuth } from '../middleware/auth.js'
import { success, fail } from '../utils/response.js'
import {
  checkMemberAccess,
  expandStudyPreferences,
  getMemberContext,
  type EntitlementAction,
} from '../services/member.js'
import { isExamType } from '../constants/domain.js'
import { profileStudyPreferencesSchema } from '../utils/authSchemas.js'
import { createAsyncRouter } from '../utils/asyncRouter.js'
import { buildOperationAuditChanges, setOperationAuditContext } from '../middleware/operationAudit.js'
import { logRuntimeError } from '../utils/runtimeLogger.js'

export const memberRouter = createAsyncRouter()

// 当前会员权益
memberRouter.get('/', requireAuth, async (req, res) => {
  try {
    const context = await getMemberContext(req.user!.userId)
    if (!context) {
      res.status(404).json(fail('用户不存在'))
      return
    }

    res.json(success(context))
  } catch (err) {
    logRuntimeError('member.context.read_failed', err)
    res.status(500).json(fail('服务器错误'))
  }
})

// 权益预检
memberRouter.post('/check-access', requireAuth, async (req, res) => {
  try {
    const {
      action,
      examType = 'TMUA',
      questionCount = 1,
    } = req.body as {
      action?: EntitlementAction
      examType?: string
      questionCount?: number
    }

    if (action !== 'diagnostic' && action !== 'question-bank') {
      res.status(422).json(fail('无效的权益类型'))
      return
    }

    if (!isExamType(examType)) {
      res.status(422).json(fail('无效的考试类型'))
      return
    }

    const result = await checkMemberAccess(
      req.user!.userId,
      action,
      examType,
      Math.max(1, Number(questionCount) || 1),
    )

    res.json(success(result))
  } catch (err) {
    logRuntimeError('member.access_check_failed', err)
    res.status(500).json(fail('服务器错误'))
  }
})

// 更新账户级学习偏好
memberRouter.put('/study-preferences', requireAuth, async (req, res) => {
  try {
    const parsed = profileStudyPreferencesSchema.safeParse(req.body.studyPreferences)
    if (!parsed.success) {
      res.status(422).json(fail(parsed.error.issues[0]?.message || '备考偏好格式不正确'))
      return
    }
    const examPreferences = expandStudyPreferences(parsed.data)

    const previousUser = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { examPreferences: true },
    })
    if (!previousUser) {
      res.status(404).json(fail('用户不存在'))
      return
    }
    await prisma.user.update({
      where: { id: req.user!.userId },
      data: { examPreferences: examPreferences as unknown as Prisma.InputJsonValue },
    })

    setOperationAuditContext(req, {
      resourceId: req.user!.userId,
      changes: buildOperationAuditChanges(
        { examPreferences: previousUser.examPreferences },
        { examPreferences },
      ),
    })

    res.json(success(null))
  } catch (err) {
    logRuntimeError('member.study_preferences.update_failed', err)
    res.status(500).json(fail('服务器错误'))
  }
})
