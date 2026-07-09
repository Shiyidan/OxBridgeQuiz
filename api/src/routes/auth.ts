import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import rateLimit from 'express-rate-limit'
import { prisma } from '../services/prisma.js'
import { signToken } from '../services/jwt.js'
import { requireAuth } from '../middleware/auth.js'
import { success, fail } from '../utils/response.js'
import { formatUserForClient } from '../utils/userPresenter.js'

export const authRouter = Router()

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { success: false, code: 1, errMsg: '请求过于频繁，请稍后再试', data: null },
})

// 注册
authRouter.post('/register', authLimiter, async (req: Request, res: Response) => {
  try {
    const { password, confirmPassword, examPreferences } = req.body
    const email = typeof req.body.email === 'string' ? req.body.email.trim() : ''
    const username = typeof req.body.username === 'string' ? req.body.username.trim() : ''

    if (!email || !password || !username) {
      res.status(422).json(fail('邮箱、密码和用户名为必填项'))
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
    if (username.length > 50) {
      res.status(422).json(fail('用户名不能超过 50 个字符'))
      return
    }

    const existingEmail = await prisma.user.findUnique({ where: { email } })
    if (existingEmail) {
      res.status(409).json(fail('该邮箱已注册'))
      return
    }
    const existingUsername = await prisma.user.findUnique({ where: { username } })
    if (existingUsername) {
      res.status(409).json(fail('该用户名已被使用'))
      return
    }

    const hashed = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        username,
        examPreferences: Array.isArray(examPreferences) ? examPreferences : [],
      },
    })

    const token = signToken({ id: user.id, email: user.email, role: user.role })

    res.json(success({
      user: formatUserForClient({ id: user.id, username: user.username, email: user.email, role: user.role, paymentStatus: user.paymentStatus }),
      token,
    }))
  } catch (err) {
    console.error('[auth] register error:', err)
    res.status(500).json(fail('服务器错误'))
  }
})

// 登录
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const username = typeof req.body.username === 'string' ? req.body.username.trim() : ''
    const password = typeof req.body.password === 'string' ? req.body.password : ''

    if (!username || !password) {
      res.status(422).json(fail('用户名和密码为必填项'))
      return
    }

    const user = await prisma.user.findUnique({ where: { username } })
    if (!user) {
      res.json(fail('用户名或密码错误', 'AUTH_WRONG'))
      return
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      res.json(fail('用户名或密码错误', 'AUTH_WRONG'))
      return
    }

    const token = signToken({ id: user.id, email: user.email, role: user.role })

    res.json(success({
      user: formatUserForClient({ id: user.id, username: user.username, email: user.email, role: user.role, paymentStatus: user.paymentStatus }),
      token,
    }))
  } catch (err) {
    console.error('[auth] login error:', err)
    res.status(500).json(fail('服务器错误'))
  }
})


// 更新资料
authRouter.put('/profile', requireAuth, async (req: Request, res: Response) => {
  try {
    const username = typeof req.body.username === 'string' ? req.body.username.trim() : ''
    const email = typeof req.body.email === 'string' ? req.body.email.trim() : ''

    if (!username || !email) {
      res.status(422).json(fail('用户名和邮箱为必填项'))
      return
    }
    if (username.length > 50) {
      res.status(422).json(fail('用户名不能超过 50 个字符'))
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(422).json(fail('请输入有效的邮箱地址'))
      return
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, username: true, email: true },
    })
    if (!currentUser) {
      res.status(404).json(fail('用户不存在'))
      return
    }

    if (email !== currentUser.email) {
      const existing = await prisma.user.findUnique({ where: { email } })
      if (existing && existing.id !== currentUser.id) {
        res.status(409).json(fail('该邮箱已被使用'))
        return
      }
    }
    if (username !== currentUser.username) {
      const existing = await prisma.user.findUnique({ where: { username } })
      if (existing && existing.id !== currentUser.id) {
        res.status(409).json(fail('该用户名已被使用'))
        return
      }
    }

    const user = await prisma.user.update({
      where: { id: currentUser.id },
      data: { username, email },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        avatar: true,
        paymentStatus: true,
      },
    })

    res.json(success({ user: formatUserForClient(user) }))
  } catch (err) {
    console.error('[auth] update profile error:', err)
    res.status(500).json(fail('服务器错误'))
  }
})

// 登出  未完善
authRouter.post('/logout', requireAuth, (_req: Request, res: Response) => {
  res.json(success(null))
})
