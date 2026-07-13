import crypto from 'node:crypto'
import type { Request, Response } from 'express'
import type { User } from '@prisma/client'
import { prisma } from './prisma.js'
import { config } from '../config.js'
import { signAccessToken } from './jwt.js'
import { AUTH_ERROR } from '../constants/auth.js'
import { AuthError } from '../utils/authError.js'

export const REFRESH_COOKIE_NAME = 'quiz_refresh'

function hashRefreshSecret(secret: string): string {
  return crypto.createHash('sha256').update(secret).digest('hex')
}

function buildRefreshToken(sessionId: string, secret: string): string {
  return `${sessionId}.${secret}`
}

function parseRefreshToken(token: string | undefined): { sessionId: string; secret: string } | null {
  if (!token) return null
  const separator = token.indexOf('.')
  if (separator <= 0) return null
  const sessionId = token.slice(0, separator)
  const secret = token.slice(separator + 1)
  if (!sessionId || !secret) return null
  return { sessionId, secret }
}

function refreshCookieBaseOptions() {
  return {
    httpOnly: true,
    secure: config.refreshCookieSecure,
    sameSite: config.refreshCookieSameSite,
    path: '/api/auth',
  }
}

export function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    ...refreshCookieBaseOptions(),
    maxAge: config.refreshTokenTtlSeconds * 1000,
  })
}

export function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieBaseOptions())
}

export function getRefreshCookie(req: Request): string | undefined {
  return req.cookies?.[REFRESH_COOKIE_NAME]
}

function requestMetadata(req: Request): { ipAddress?: string; userAgent?: string } {
  return {
    ipAddress: req.ip?.slice(0, 64),
    userAgent: req.get('user-agent')?.slice(0, 512),
  }
}

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

export async function rotateAuthSession(req: Request, res: Response) {
  const parsed = parseRefreshToken(getRefreshCookie(req))
  if (!parsed) throw new AuthError(AUTH_ERROR.SESSION_EXPIRED, '登录状态已过期，请重新登录', 401)

  const session = await prisma.authSession.findUnique({
    where: { id: parsed.sessionId },
    include: { user: true },
  })
  const now = new Date()
  if (!session || session.revokedAt || session.expiresAt <= now) {
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
  await prisma.authSession.update({
    where: { id: session.id },
    data: {
      refreshTokenHash: hashRefreshSecret(nextSecret),
      lastUsedAt: now,
      ...requestMetadata(req),
    },
  })
  setRefreshCookie(res, buildRefreshToken(session.id, nextSecret))
  return {
    user: session.user,
    accessToken: signAccessToken(session.user, session.id),
    sessionId: session.id,
  }
}

export async function revokeRefreshSession(req: Request): Promise<void> {
  const parsed = parseRefreshToken(getRefreshCookie(req))
  if (!parsed) return
  await prisma.authSession.updateMany({
    where: { id: parsed.sessionId, revokedAt: null },
    data: { revokedAt: new Date() },
  })
}
