import { Request, Response, NextFunction } from 'express'
import { verifyToken, JwtPayload } from '../services/jwt.js'

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ code: 'UNAUTHORIZED', message: '请先登录' })
    return
  }

  try {
    const token = header.slice(7)
    req.user = verifyToken(token)
    next()
  } catch {
    res.status(401).json({ code: 'TOKEN_EXPIRED', message: '登录已过期，请重新登录' })
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (header && header.startsWith('Bearer ')) {
    try {
      const token = header.slice(7)
      req.user = verifyToken(token)
    } catch {
      // token 无效也放行，以游客身份处理
    }
  }
  next()
}
