import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import rateLimit from 'express-rate-limit'
import { prisma } from '../services/prisma.js'
import { signToken } from '../services/jwt.js'
import { requireAuth } from '../middleware/auth.js'
import { success, fail } from '../utils/response.js'

export const authRouter = Router()

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { success: false, code: 1, errMsg: '请求过于频繁，请稍后再试', data: null },
})

authRouter.use(authLimiter)

// 注册
authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, confirmPassword, name, diagnosticSessionId } = req.body

    // 校验
    if (!email || !password || !name) {
      res.status(422).json(fail('邮箱、密码和姓名为必填项'))
      return
    }
    if (password !== confirmPassword) {
      res.status(422).json(fail('两次输入的密码不一致'))
      return
    }
    if (password.length < 8 || password.length > 32) {
      res.status(422).json(fail('密码长度需为 8-32 位'))
      return
    }
    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      res.status(422).json(fail('密码需同时包含字母和数字'))
      return
    }

    // 查邮箱是否已注册
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      res.status(409).json(fail('该邮箱已注册'))
      return
    }

    // 创建用户
    const hashed = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: { email, password: hashed, name },
    })

    const token = signToken({ id: user.id, email: user.email, role: user.role })

    // 如果传了 diagnosticSessionId，关联诊断报告
    let fullReport = null
    if (diagnosticSessionId) {
      const session = await prisma.diagnosticSession.findUnique({ where: { id: diagnosticSessionId } })
      if (session && !session.userId) {
        await prisma.diagnosticSession.update({
          where: { id: diagnosticSessionId },
          data: { userId: user.id, status: 'linked' },
        })
        await prisma.user.update({
          where: { id: user.id },
          data: { diagnosticUsed: true },
        })
        // 生成完整报告
        const { buildFullReportFromSession } = await import('../services/diagnostic.js')
        fullReport = buildFullReportFromSession(session)
      }
    }

    res.json(success({
      user: { id: user.id, name: user.name, email: user.email, role: user.role, paymentStatus: user.paymentStatus },
      token,
      ...(fullReport ? { fullReport } : {}),
    }))
  } catch (err) {
    console.error('[auth] register error:', err)
    res.status(500).json(fail('服务器错误'))
  }
})

// 登录
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password, diagnosticSessionId } = req.body

    if (!email || !password) {
      res.status(422).json(fail('邮箱和密码为必填项'))
      return
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      res.status(401).json(fail('邮箱或密码错误'))
      return
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      res.status(401).json(fail('邮箱或密码错误'))
      return
    }

    const token = signToken({ id: user.id, email: user.email, role: user.role })

    // 如果传了 diagnosticSessionId，关联诊断报告
    let fullReport = null
    if (diagnosticSessionId) {
      const session = await prisma.diagnosticSession.findUnique({ where: { id: diagnosticSessionId } })
      if (session && !session.userId) {
        await prisma.diagnosticSession.update({
          where: { id: diagnosticSessionId },
          data: { userId: user.id, status: 'linked' },
        })
        await prisma.user.update({
          where: { id: user.id },
          data: { diagnosticUsed: true },
        })
        const { buildFullReportFromSession } = await import('../services/diagnostic.js')
        fullReport = buildFullReportFromSession(session)
      }
    }

    res.json(success({
      user: { id: user.id, name: user.name, email: user.email, role: user.role, paymentStatus: user.paymentStatus },
      token,
      ...(fullReport ? { fullReport } : {}),
    }))
  } catch (err) {
    console.error('[auth] login error:', err)
    res.status(500).json(fail('服务器错误'))
  }
})

// 获取当前用户
authRouter.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, name: true, email: true, role: true, avatar: true, paymentStatus: true },
    })
    if (!user) {
      res.status(404).json(fail('用户不存在'))
      return
    }
    res.json(success(user))
  } catch (err) {
    console.error('[auth] me error:', err)
    res.status(500).json(fail('服务器错误'))
  }
})

// 登出
authRouter.post('/logout', requireAuth, (_req: Request, res: Response) => {
  res.json(success(null))
})
