// 刷新凭证与服务端会话管理，供登录、自动续期和设备退出流程复用。
import crypto from 'node:crypto'
import type { Request, Response } from 'express'
import type { User } from '@prisma/client'
import { prisma } from './prisma.js'
import { config } from '../config.js'
import { signAccessToken } from './jwt.js'
import { AUTH_ERROR } from '../constants/auth.js'
import { AuthError } from '../utils/authError.js'

export const REFRESH_COOKIE_NAME = 'quiz_refresh'

// Refresh Token 只保存摘要，数据库泄露时不暴露可直接使用的凭证。
function hashRefreshSecret(secret: string): string {
  return crypto.createHash('sha256').update(secret).digest('hex')
}

// 浏览器凭证由会话标识和随机秘密组成，服务端仅持久化秘密摘要。
function buildRefreshToken(sessionId: string, secret: string): string {
  return `${sessionId}.${secret}`
}

// 非法或残缺 Cookie 统一视为无会话，避免进入数据库查询流程。
function parseRefreshToken(token: string | undefined): { sessionId: string; secret: string } | null {
  if (!token) return null
  const separator = token.indexOf('.')
  if (separator <= 0) return null
  const sessionId = token.slice(0, separator)
  const secret = token.slice(separator + 1)
  if (!sessionId || !secret) return null
  return { sessionId, secret }
}

// Refresh Cookie 仅发送到认证接口，并按环境控制 HTTPS 属性。
function refreshCookieBaseOptions() {
  return {
    httpOnly: true,
    secure: config.refreshCookieSecure,
    sameSite: config.refreshCookieSameSite,
    path: '/api/auth',
  }
}

// 每次登录或成功刷新都重置 Cookie 的七天空闲有效期。
export function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    ...refreshCookieBaseOptions(),
    maxAge: config.refreshTokenTtlSeconds * 1000,
  })
}

// 登出或刷新失败时使用同一组选项删除浏览器中的刷新凭证。
export function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieBaseOptions())
}

// 服务端只从受限 HttpOnly Cookie 读取刷新凭证。
export function getRefreshCookie(req: Request): string | undefined {
  return req.cookies?.[REFRESH_COOKIE_NAME]
}

// 会话记录保存有限长度的设备信息，用于个人中心安全排查。
function requestMetadata(req: Request): { ipAddress?: string; userAgent?: string } {
  return {
    ipAddress: req.ip?.slice(0, 64),
    userAgent: req.get('user-agent')?.slice(0, 512),
  }
}

// 登录成功后创建七天空闲会话，并签发首个短期访问令牌。
export async function createAuthSession(user: User, req: Request, res: Response) {
  const sessionId = crypto.randomUUID()
  const secret = crypto.randomBytes(32).toString('base64url')
  const expiresAt = new Date(Date.now() + config.refreshTokenTtlSeconds * 1000)
  await prisma.authSession.create({
    data: {
      id: sessionId,
      userId: user.id,
      refreshTokenHash: hashRefreshSecret(secret),
      expiresAt,
      ...requestMetadata(req),
    },
  })
  setRefreshCookie(res, buildRefreshToken(sessionId, secret))
  return {
    accessToken: signAccessToken(user, sessionId),
    sessionId,
    expiresAt,
  }
}

// 成功刷新视为用户活动，同时轮换秘密并把空闲过期时间顺延七天。
export async function rotateAuthSession(req: Request, res: Response) {
  const parsed = parseRefreshToken(getRefreshCookie(req))
  if (!parsed) throw new AuthError(AUTH_ERROR.SESSION_EXPIRED, '登录状态已过期，请重新登录', 401)

  const session = await prisma.authSession.findUnique({
    where: { id: parsed.sessionId },
    include: { user: true },
  })
  const now = new Date()
  const idleExpired = session
    ? session.lastUsedAt.getTime() + config.refreshTokenTtlSeconds * 1000 <= now.getTime()
    : false
  if (!session || session.revokedAt || session.expiresAt <= now || idleExpired) {
    clearRefreshCookie(res)
    throw new AuthError(AUTH_ERROR.SESSION_EXPIRED, '登录状态已过期，请重新登录', 401)
  }

  const suppliedHash = hashRefreshSecret(parsed.secret)
  if (!crypto.timingSafeEqual(Buffer.from(session.refreshTokenHash), Buffer.from(suppliedHash))) {
    await prisma.authSession.update({ where: { id: session.id }, data: { revokedAt: now } })
    clearRefreshCookie(res)
    throw new AuthError(AUTH_ERROR.SESSION_EXPIRED, '登录状态异常，请重新登录', 401)
  }

  const nextSecret = crypto.randomBytes(32).toString('base64url')
  const nextExpiresAt = new Date(now.getTime() + config.refreshTokenTtlSeconds * 1000)
  await prisma.authSession.update({
    where: { id: session.id },
    data: {
      refreshTokenHash: hashRefreshSecret(nextSecret),
      lastUsedAt: now,
      expiresAt: nextExpiresAt,
      ...requestMetadata(req),
    },
  })
  setRefreshCookie(res, buildRefreshToken(session.id, nextSecret))
  return {
    user: session.user,
    accessToken: signAccessToken(session.user, session.id),
    sessionId: session.id,
    expiresAt: nextExpiresAt,
  }
}

// 当前设备退出时只撤销 Cookie 指向的服务端会话，不影响其他设备。
export async function revokeRefreshSession(req: Request): Promise<void> {
  const parsed = parseRefreshToken(getRefreshCookie(req))
  if (!parsed) return
  await prisma.authSession.updateMany({
    where: { id: parsed.sessionId, revokedAt: null },
    data: { revokedAt: new Date() },
  })
}
