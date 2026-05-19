import { Router, Request, Response } from 'express'
import { prisma } from '../services/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { requireAdmin } from '../middleware/admin.js'

export const adminRouter = Router()

adminRouter.use(requireAuth, requireAdmin)

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
    res.json({ users })
  } catch (err) {
    console.error('[admin] users error:', err)
    res.status(500).json({ code: 'SERVER_ERROR', message: '服务器错误' })
  }
})

// 更新用户角色
adminRouter.put('/users/:id/role', async (req: Request, res: Response) => {
  try {
    const { role } = req.body
    if (!role || !['student', 'admin'].includes(role)) {
      res.status(422).json({ code: 'VALIDATION_ERROR', message: '无效的角色' })
      return
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role },
      select: { id: true, name: true, email: true, role: true, paymentStatus: true },
    })
    res.json({ user })
  } catch (err) {
    console.error('[admin] update role error:', err)
    res.status(500).json({ code: 'SERVER_ERROR', message: '服务器错误' })
  }
})
