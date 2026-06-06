import { Router, Request, Response } from 'express'
import { prisma } from '../services/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { requireAdmin } from '../middleware/admin.js'
import { success, fail } from '../utils/response.js'

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
    return { error: '无效的充值项' }
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
adminRouter.get('/users', async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        paymentStatus: true,
        diagnosticUsed: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json(success({ users }))
  } catch (err) {
    console.error('[admin] users error:', err)
    res.status(500).json(fail('服务器错误'))
  }
})

// 更新用户角色
adminRouter.put('/users/:id/role', async (req: Request, res: Response) => {
  try {
    const { role } = req.body
    if (!role || !['student', 'admin'].includes(role)) {
      res.status(422).json(fail('无效的角色'))
      return
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role },
      select: { id: true, name: true, email: true, role: true, paymentStatus: true },
    })
    res.json(success({ user }))
  } catch (err) {
    console.error('[admin] update role error:', err)
    res.status(500).json(fail('服务器错误'))
  }
})

// 成本记录
adminRouter.get('/revenue-costs/getList', async (_req: Request, res: Response) => {
  try {
    const costs = await prisma.revenueCost.findMany({
      orderBy: { occurredAt: 'desc' },
    })
    res.json(success({ costs }))
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
