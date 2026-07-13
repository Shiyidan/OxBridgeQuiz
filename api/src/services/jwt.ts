// 短期访问令牌签发与校验，服务端会话状态由认证中间件进一步确认。
import jwt from 'jsonwebtoken'
import crypto from 'node:crypto'
import type { User } from '@prisma/client'
import { config } from '../config.js'

export interface AccessTokenPayload extends jwt.JwtPayload {
  sub: string
  sid: string
  type: 'access'
}

export function signAccessToken(user: User, sessionId: string): string {
  return jwt.sign(
    { sid: sessionId, type: 'access' },
    config.jwtSecret,
    {
      algorithm: 'HS256',
      subject: user.id,
      issuer: config.jwtIssuer,
      audience: config.jwtAudience,
      expiresIn: config.accessTokenTtlSeconds,
      jwtid: crypto.randomUUID(),
    },
  )
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const payload = jwt.verify(token, config.jwtSecret, {
    algorithms: ['HS256'],
    issuer: config.jwtIssuer,
    audience: config.jwtAudience,
  })
  if (
    typeof payload === 'string' ||
    payload.type !== 'access' ||
    typeof payload.sub !== 'string' ||
    typeof payload.sid !== 'string'
  ) {
    throw new Error('Invalid access token payload')
  }
  return payload as AccessTokenPayload
}
