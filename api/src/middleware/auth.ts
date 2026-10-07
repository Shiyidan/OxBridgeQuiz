// API身份中间件：同时校验短期访问令牌、服务端会话和用户当前状态。
import type { Request, Response, NextFunction } from 'express'
import { verifyAccessToken } from '../services/jwt.js'
import { prisma } from '../services/prisma.js'
import { fail } from '../utils/response.js'
import { AUTH_ERROR, AUTH_SESSION_EXPIRED_MESSAGE } from '../constants/auth.js'
import { assertAccountActive } from '../services/accountStatus.js'
import { AuthError } from '../utils/authError.js'
import { checkAuthSessionIp } from '../services/authSessionPolicy.js'

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

// 已签名令牌仍需核对当前账号状态，避免撤销会话后丢失明确的封禁原因。
async function resolveAuthContext(req: Request): Promise<AuthContext | null> {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return null
  const payload = verifyAccessToken(header.slice(7))
  const session = await prisma.authSession.findFirst({
    where: {
      id: payload.sid,
      userId: payload.sub,
    },
    include: { user: true },
  })
  if (!session) return null
  assertAccountActive(session.user)
  if (session.revokedAt || session.expiresAt <= new Date()
    || !await checkAuthSessionIp(session.userId, session.id, req.ip)) {
    throw new AuthError(AUTH_ERROR.SESSION_EXPIRED, AUTH_SESSION_EXPIRED_MESSAGE, 401)
  }
  return {
    userId: session.user.id,
    sessionId: session.id,
    username: session.user.username,
    email: session.user.email,
    role: session.user.role,
    authenticatedAt: session.createdAt.getTime(),
  }
}

// 所有登录后业务共享同一封禁边界，不依赖页面按钮是否可见。
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const context = await resolveAuthContext(req)
    if (!context) {
      res.status(401).json(fail(AUTH_SESSION_EXPIRED_MESSAGE, AUTH_ERROR.SESSION_EXPIRED))
      return
    }
    req.user = context
    next()
  } catch (error) {
    if (error instanceof AuthError && error.code === AUTH_ERROR.ACCOUNT_BANNED) {
      res.status(403).json(fail(error.message, error.code))
      return
    }
    res.status(401).json(fail(AUTH_SESSION_EXPIRED_MESSAGE, AUTH_ERROR.SESSION_EXPIRED))
  }
}

// 已撤销或封禁的登录请求明确拒绝，避免可选认证接口让被退出的页面继续保留登录状态。
export async function optionalAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    req.user = (await resolveAuthContext(req)) || undefined
  } catch (error) {
    if (error instanceof AuthError && error.code === AUTH_ERROR.ACCOUNT_BANNED) {
      res.status(403).json(fail(error.message, error.code))
      return
    }
    if (error instanceof AuthError && error.code === AUTH_ERROR.SESSION_EXPIRED) {
      res.status(401).json(fail(error.message, error.code))
      return
    }
    req.user = undefined
  }
  next()
}
