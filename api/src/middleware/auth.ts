// API身份中间件：同时校验短期访问令牌、服务端会话和用户当前状态。
import type { Request, Response, NextFunction } from 'express'
import { verifyAccessToken } from '../services/jwt.js'
import { prisma } from '../services/prisma.js'
import { fail } from '../utils/response.js'
import { AUTH_ERROR } from '../constants/auth.js'

export interface AuthContext {
  userId: string
  sessionId: string
  username: string
  email: string
  role: string
  authenticatedAt: number
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthContext
    }
  }
}

async function resolveAuthContext(req: Request): Promise<AuthContext | null> {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return null
  const payload = verifyAccessToken(header.slice(7))
  const session = await prisma.authSession.findFirst({
    where: {
      id: payload.sid,
      userId: payload.sub,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: { user: true },
  })
  if (!session) return null
  return {
    userId: session.user.id,
    sessionId: session.id,
    username: session.user.username,
    email: session.user.email,
    role: session.user.role,
    authenticatedAt: session.createdAt.getTime(),
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const context = await resolveAuthContext(req)
    if (!context) {
      res.status(401).json(fail('请先登录', AUTH_ERROR.SESSION_EXPIRED))
      return
    }
    req.user = context
    next()
  } catch {
    res.status(401).json(fail('登录状态已过期，请重新登录', AUTH_ERROR.SESSION_EXPIRED))
  }
}

export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    req.user = (await resolveAuthContext(req)) || undefined
  } catch {
    req.user = undefined
  }
  next()
}
