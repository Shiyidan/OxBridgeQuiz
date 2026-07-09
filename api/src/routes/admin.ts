import { Router, Request, Response } from 'express'
import { prisma } from '../services/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { requireAdmin } from '../middleware/admin.js'
import { success, fail } from '../utils/response.js'
import {
  MEMBERSHIP_PLAN,
  MEMBERSHIP_STATUS,
  USER_PAYMENT_STATUS,
  USER_ROLE,
  isExamType,
  isMembershipPlan,
  isUserRole,
} from '../constants/domain.js'
import { formatUserForClient } from '../utils/userPresenter.js'

export const adminRouter = Router()

adminRouter.use(requireAuth, requireAdmin)

interface RevenueCostPayload {
  rechargeItem: string
  amount: number
  operator: string
  occurredAt: Date
  reimbursementStatus: string
  remark: string | null
}

type RevenueCostPayloadResult =
  | { data: RevenueCostPayload }
  | { error: string }

function buildMembershipEndDate(plan: string, start: Date): Date {
  const end = new Date(start)
  if (plan === MEMBERSHIP_PLAN.YEARLY) {
    end.setFullYear(end.getFullYear() + 1)
  } else {
    end.setMonth(end.getMonth() + 1)
  }
  return end
}

function formatAdminUserForClient<T extends { role: string; paymentStatus?: string | null; memberships?: any[] }>(user: T) {
  const formatted = formatUserForClient(user)
  if (!user.memberships) return formatted
  return {
    ...formatted,
    memberships: user.memberships.map((membership) => ({
      ...membership,
      startsAt: membership.startsAt.getTime(),
      endsAt: membership.endsAt.getTime(),
    })),
  }
}

function parsePositiveInt(value: unknown, fallback: number, max?: number): number {
  const parsed = Number.parseInt(String(value ?? ''), 10)
  const safeValue = Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
  return max ? Math.min(safeValue, max) : safeValue
}

function parseRevenueCostPayload(body: Record<string, unknown>): RevenueCostPayloadResult {
  const {
    rechargeItem,
    amount,
    operator,
    occurredAt,
    reimbursementStatus = 'unreimbursed',
    remark,
  } = body
  const numericAmount = Number(amount)
  const costDate = new Date(String(occurredAt))
  const normalizedRechargeItem = typeof rechargeItem === 'string' ? rechargeItem.trim() : ''
  const normalizedOperator = typeof operator === 'string' ? operator.trim() : ''
  const normalizedReimbursementStatus = typeof reimbursementStatus === 'string' ? reimbursementStatus.trim() : ''
  const normalizedRemark = typeof remark === 'string' && remark.trim() ? remark.trim() : null

  if (!normalizedRechargeItem) {
    return { error: '无效的成本项' }
  }
  if (!Number.isFinite(numericAmount) || numericAmount < 0) {
    return { error: '无效的金额' }
  }
  if (!normalizedOperator) {
    return { error: '无效的操作人' }
  }
  if (Number.isNaN(costDate.getTime())) {
    return { error: '无效的时间' }
  }
  if (!normalizedReimbursementStatus) {
    return { error: '无效的报销情况' }
  }
  if (normalizedRemark && normalizedRemark.length > 500) {
    return { error: '备注不能超过 500 个字符' }
  }

  return {
    data: {
      rechargeItem: normalizedRechargeItem,
      amount: numericAmount,
      operator: normalizedOperator,
      occurredAt: costDate,
      reimbursementStatus: normalizedReimbursementStatus,
      remark: normalizedRemark,
    },
  }
}

// 用户列表
adminRouter.get('/users', async (req: Request, res: Response) => {
  try {
    const page = parsePositiveInt(req.query.page, 1)
    const pageSize = parsePositiveInt(req.query.pageSize, 20, 100)
    const total = await prisma.user.count()
    const totalPages = Math.ceil(total / pageSize)
    const safePage = totalPages > 0 ? Math.min(page, totalPages) : 1
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        paymentStatus: true,
        diagnosticUsed: true,
        createdAt: true,
        memberships: {
          select: {
            id: true,
            examType: true,
            plan: true,
            status: true,
            startsAt: true,
            endsAt: true,
          },
          orderBy: { endsAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (safePage - 1) * pageSize,
      take: pageSize,
    })
    res.json(success({
      list: users.map(formatAdminUserForClient),
      pagination: {
        page: safePage,
        pageSize,
        total,
        totalPages,
        hasPrev: safePage > 1,
        hasNext: totalPages > 0 && safePage < totalPages,
      },
    }))
  } catch (err) {
    console.error('[admin] users error:', err)
    res.status(500).json(fail('服务器错误'))
  }
})

// 更新用户角色
adminRouter.put('/users/:id/role', async (req: Request, res: Response) => {
  try {
    const { role } = req.body
    if (!isUserRole(role)) {
      res.status(422).json(fail('无效的角色'))
      return
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role },
      select: { id: true, username: true, email: true, role: true, paymentStatus: true },
    })
    res.json(success({ user: formatAdminUserForClient(user) }))
  } catch (err) {
    console.error('[admin] update role error:', err)
    res.status(500).json(fail('服务器错误'))
  }
})

// 更新用户权限
adminRouter.put('/users/:id/access', async (req: Request, res: Response) => {
  try {
    const { role, membership } = req.body
    const userId = req.params.id
    if (!isUserRole(role)) {
      res.status(422).json(fail('无效的角色'))
      return
    }

    const requestedExamTypes: unknown[] = Array.isArray(membership?.examTypes) ? membership.examTypes : []
    const plan = membership?.plan
    if (requestedExamTypes.length > 0 && !isMembershipPlan(plan)) {
      res.status(422).json(fail('无效的会员套餐'))
      return
    }
    if (requestedExamTypes.some((examType) => !isExamType(examType))) {
      res.status(422).json(fail('无效的考试类型'))
      return
    }
    const examTypes = requestedExamTypes as string[]

    const now = new Date()
    const endsAt = examTypes.length > 0 ? buildMembershipEndDate(plan, now) : null

    const user = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          role,
          ...(role === USER_ROLE.STUDENT && examTypes.length > 0
            ? { paymentStatus: USER_PAYMENT_STATUS.PAID }
            : {}),
        },
      })

      // 后台手动授权是追加语义：未选中的现有权益不在本次操作中取消。
      for (const examType of examTypes) {
        const active = await tx.userMembership.findFirst({
          where: {
            userId,
            examType,
            status: MEMBERSHIP_STATUS.ACTIVE,
            startsAt: { lte: now },
            endsAt: { gt: now },
          },
          orderBy: { endsAt: 'desc' },
        })
        if (active) {
          continue
        }
        await tx.userMembership.create({
          data: { userId, examType, plan, startsAt: now, endsAt: endsAt!, status: MEMBERSHIP_STATUS.ACTIVE },
        })
      }

      return tx.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          paymentStatus: true,
          diagnosticUsed: true,
          createdAt: true,
          memberships: {
            select: {
              id: true,
              examType: true,
              plan: true,
              status: true,
              startsAt: true,
              endsAt: true,
            },
            orderBy: { endsAt: 'desc' },
          },
        },
      })
    })

    res.json(success({ user: user ? formatAdminUserForClient(user) : null }))
  } catch (err: any) {
    if (err?.code === 'P2025') {
      res.status(404).json(fail('用户不存在'))
      return
    }
    console.error('[admin] update access error:', err)
    res.status(500).json(fail('服务器错误'))
  }
})

// 成本记录
adminRouter.get('/revenue-costs/getList', async (req: Request, res: Response) => {
  try {
    const page = parsePositiveInt(req.query.page, 1)
    const pageSize = parsePositiveInt(req.query.pageSize, 20, 100)
    const total = await prisma.revenueCost.count()
    const totalPages = Math.ceil(total / pageSize)
    const safePage = totalPages > 0 ? Math.min(page, totalPages) : 1
    const costs = await prisma.revenueCost.findMany({
      orderBy: { occurredAt: 'desc' },
      skip: (safePage - 1) * pageSize,
      take: pageSize,
    })
    res.json(success({
      list: costs,
      pagination: {
        page: safePage,
        pageSize,
        total,
        totalPages,
        hasPrev: safePage > 1,
        hasNext: totalPages > 0 && safePage < totalPages,
      },
    }))
  } catch (err) {
    console.error('[admin] revenue costs error:', err)
    res.status(500).json(fail('服务器错误'))
  }
})

// 成本导入
adminRouter.post('/revenue-costs', async (req: Request, res: Response) => {
  try {
    const parsed = parseRevenueCostPayload(req.body)
    if ('error' in parsed) {
      res.status(422).json(fail(parsed.error))
      return
    }

    const cost = await prisma.revenueCost.create({
      data: parsed.data,
    })
    res.json(success({ cost }))
  } catch (err) {
    console.error('[admin] create revenue cost error:', err)
    res.status(500).json(fail('服务器错误'))
  }
})

// 成本编辑
adminRouter.put('/revenue-costs/:id', async (req: Request, res: Response) => {
  try {
    const parsed = parseRevenueCostPayload(req.body)
    if ('error' in parsed) {
      res.status(422).json(fail(parsed.error))
      return
    }

    const cost = await prisma.revenueCost.update({
      where: { id: req.params.id },
      data: parsed.data,
    })
    res.json(success({ cost }))
  } catch (err: any) {
    if (err?.code === 'P2025') {
      res.status(404).json(fail('成本记录不存在'))
      return
    }
    console.error('[admin] update revenue cost error:', err)
    res.status(500).json(fail('服务器错误'))
  }
})
