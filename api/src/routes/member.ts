import { Router } from 'express'
import { prisma } from '../services/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { success, fail } from '../utils/response.js'
import { checkMemberAccess, getMemberContext, type EntitlementAction } from '../services/member.js'
import { isExamType } from '../constants/domain.js'

export const memberRouter = Router()

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
    console.error('[member] me error:', err)
    res.status(500).json(fail('服务器错误'))
  }
})

// 权益预检
memberRouter.post('/check-access', requireAuth, async (req, res) => {
  try {
    const { action, examType = 'TMUA', questionCount = 1 } = req.body as {
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
    console.error('[member] check access error:', err)
    res.status(500).json(fail('服务器错误'))
  }
})

// 更新备考偏好
memberRouter.put('/exam-preferences', requireAuth, async (req, res) => {
  try {
    const { examPreferences } = req.body
    if (!Array.isArray(examPreferences)) {
      res.status(422).json(fail('备考偏好格式不正确'))
      return
    }

    await prisma.user.update({
      where: { id: req.user!.userId },
      data: { examPreferences },
    })

    res.json(success(null))
  } catch (err) {
    console.error('[member] exam preferences error:', err)
    res.status(500).json(fail('服务器错误'))
  }
})
